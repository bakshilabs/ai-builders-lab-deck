/* ==========================================================================
   Prompt Studio: the shared engine behind every build.
   One session = one prompting skill. Each prompt is one round of
     PROMPT → PREDICT → TEST → DECIDE
   and every round becomes a new version of the child's prompt (the prompt
   ladder), so step-by-step prompt development is visible on screen.
   Builds plug in a 3D scene, an offline "AI" that reads prompts, metrics,
   predictions and session checks (see js/builds/*.js).
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;
  var P = CX.prompt;

  function snd(name, o) {
    if (CX.sound) CX.sound.play(name, o);
  }

  /* ---- Registry ------------------------------------------------------------- */
  var list = [];
  var byId = {};
  CX.builds = {
    register: function (def) {
      if (byId[def.id]) return;
      byId[def.id] = def;
      list.push(def);
      list.sort(function (a, b) {
        return a.n - b.n;
      });
    },
    get: function (id) {
      return byId[id];
    },
    get list() {
      return list.slice();
    },
  };

  function sessions() {
    return CX.data.course.sessions;
  }

  /* ---- Formatting ------------------------------------------------------------- */
  function fmtVal(def, key, v) {
    var spec = (def.params && def.params[key]) || (def.metricSpec && def.metricSpec[key]) || {};
    if (spec.fmt) return spec.fmt(v);
    if (v == null) return "—";
    if (typeof v === "boolean") return v ? "on" : "off";
    if (typeof v === "number") {
      if (!isFinite(v)) return "∞";
      return U.round(v, spec.dp == null ? 1 : spec.dp) + (spec.unit ? " " + spec.unit : "");
    }
    return String(v);
  }

  function metricHtml(def, m, val, state) {
    var shown = val == null ? "?" : fmtVal(def, m.key, val);
    return (
      '<div class="st-metric' +
      (state ? " is-" + state : "") +
      '" data-metric="' +
      m.key +
      '"><span class="st-metric__k">' +
      (m.icon ? icon(m.icon) : "") +
      esc(m.label) +
      '</span><span class="st-metric__v">' +
      esc(shown) +
      "</span></div>"
    );
  }

  /* ---- Store helpers ---------------------------------------------------------- */
  function progress(def) {
    var st = CX.store.state;
    st.builds = st.builds || {};
    if (!st.builds[def.id]) st.builds[def.id] = { session: 1, done: [], params: null, versions: [], predictions: { right: 0, total: 0 } };
    var b = st.builds[def.id];
    if (!b.params) b.params = JSON.parse(JSON.stringify(def.start));
    if (!b.versions) b.versions = [];
    if (!b.done) b.done = [];
    if (!b.predictions) b.predictions = { right: 0, total: 0 };
    return b;
  }

  /* ---- Mount -------------------------------------------------------------------- */
  function mount(root, def, opts) {
    opts = opts || {};
    var prog = progress(def);
    var S = sessions();
    var sessionN = U.clamp(parseInt(opts.session || prog.session || 1, 10) || 1, 1, 6);
    var session = def.sessions[sessionN - 1];
    var skill = S[sessionN - 1];

    var params = JSON.parse(JSON.stringify(sessionStart(sessionN)));
    var trial = null;
    var resp = null;
    var result = null;
    var predicted = null;
    var phase = "prompt";
    var busy = false;
    var lastPrompt = "";
    var phaseWaiters = [];
    var disposed = false;
    var scene = null;
    var tags = [];

    function sessionStart(n) {
      // Each session starts from what the child kept at the end of the previous one
      var s = def.sessions[n - 1];
      var base;
      if (s.reset) base = Object.assign({}, JSON.parse(JSON.stringify(def.start)), s.reset);
      else if (n > 1 && prog.done.indexOf(n - 1) === -1 && s.demoStart) base = Object.assign({}, JSON.parse(JSON.stringify(def.start)), s.demoStart); // jumping ahead in a demo
      else base = JSON.parse(JSON.stringify(prog.params || def.start));
      if (s.start) Object.assign(base, s.start); // what's new this session (a melody, a moved target…)
      return base;
    }

    var done = function (n) {
      return prog.done.indexOf(n) !== -1;
    };

    root.innerHTML =
      '<div class="st st--' +
      def.colour +
      (CX.embed ? " st--embed" : "") +
      '" data-build="' +
      def.id +
      '">' +
      '<header class="st-head">' +
      '<a class="st-back" href="#/lab" aria-label="Back to the Build Lab">' +
      icon("arrow-left") +
      '<span>Build Lab</span></a>' +
      '<div class="st-id"><span class="st-id__icon" aria-hidden="true">' +
      icon(def.interest.icon) +
      '</span><div><p class="st-id__k">' +
      esc(def.interest.label) +
      " · " +
      esc(def.subjects.map(function (s) {
        return s.k;
      }).join(" + ")) +
      '</p><h1 class="st-id__t">' +
      esc(def.title) +
      "</h1></div></div>" +
      '<ol class="st-sessions" aria-label="Six one-hour sessions">' +
      S.map(function (s) {
        return (
          '<li><a class="st-sess' +
          (s.n === sessionN ? " is-now" : "") +
          (done(s.n) ? " is-done" : "") +
          '" href="#/build/' +
          def.id +
          "/" +
          s.n +
          '" data-sess="' +
          s.n +
          '"' +
          (s.n === sessionN ? ' aria-current="step"' : "") +
          '><span class="st-sess__n">' +
          (done(s.n) && s.n !== sessionN ? icon("check") : s.n) +
          '</span><span class="st-sess__t">' +
          esc(s.short) +
          "</span></a></li>"
        );
      }).join("") +
      "</ol>" +
      '<div class="st-tools">' +
      '<button type="button" class="st-tool" data-st="sound" aria-pressed="true" aria-label="Sound">' +
      icon("volume") +
      "</button>" +
      '<button type="button" class="st-tool" data-st="ladder" aria-label="Show my prompt ladder">' +
      icon("layers") +
      "<span>My prompts</span></button>" +
      "</div>" +
      "</header>" +
      '<div class="st-main">' +
      '<section class="st-stage" aria-label="3D view of your build">' +
      '<div class="st-canvas" id="st-canvas"></div>' +
      '<div class="st-hud" id="st-hud" aria-live="polite"></div>' +
      '<ol class="st-loop" id="st-loop" aria-label="Where you are in the loop">' +
      ["prompt", "predict", "test", "decide"]
        .map(function (p, i) {
          return '<li data-loop="' + p + '"><span>' + (i + 1) + "</span>" + p.charAt(0).toUpperCase() + p.slice(1) + "</li>";
        })
        .join("") +
      "</ol>" +
      '<div class="st-ladder" id="st-ladder" aria-label="Your prompt ladder"></div>' +
      '<div class="st-banner" id="st-banner" hidden></div>' +
      '<div class="st-stagebar" id="st-stagebar"></div>' +
      "</section>" +
      '<aside class="st-panel" aria-label="Prompt studio">' +
      '<div class="st-session" id="st-session"></div>' +
      '<div class="st-flow" id="st-flow" aria-live="polite"></div>' +
      '<form class="st-compose" id="st-compose" autocomplete="off">' +
      '<div class="st-ings" id="st-ings">' +
      P.INGREDIENTS.map(function (g) {
        return '<span class="st-ing st-ing--' + g.id + '" data-ing="' + g.id + '" title="' + esc(g.hint) + '">' + icon(g.icon) + "<b>" + esc(g.label) + "</b></span>";
      }).join("") +
      "</div>" +
      '<div class="st-input"><div class="st-input__mirror" id="st-mirror" aria-hidden="true"></div>' +
      '<textarea class="st-input__ta" id="st-ta" rows="3" spellcheck="false" placeholder="Tell the AI what to build…" aria-label="Your prompt for the AI"></textarea></div>' +
      '<div class="st-compose__foot"><div class="st-power" id="st-power" aria-label="Prompt power"><span class="st-power__k">Prompt power</span><span class="st-power__bars">' +
      "<i></i><i></i><i></i><i></i><i></i><i></i>" +
      '</span></div><button type="submit" class="btn btn--lime st-ask" id="st-ask" data-st="ask">' +
      icon("wand", "btn__icon") +
      "<span>Ask AI</span></button></div>" +
      '<div class="st-suggest" id="st-suggest"></div>' +
      "</form>" +
      "</aside></div></div>";

    var el = {
      st: root.querySelector(".st"),
      canvas: root.querySelector("#st-canvas"),
      hud: root.querySelector("#st-hud"),
      loop: root.querySelector("#st-loop"),
      ladder: root.querySelector("#st-ladder"),
      banner: root.querySelector("#st-banner"),
      stagebar: root.querySelector("#st-stagebar"),
      session: root.querySelector("#st-session"),
      flow: root.querySelector("#st-flow"),
      compose: root.querySelector("#st-compose"),
      ta: root.querySelector("#st-ta"),
      mirror: root.querySelector("#st-mirror"),
      ings: root.querySelector("#st-ings"),
      power: root.querySelector("#st-power"),
      ask: root.querySelector("#st-ask"),
      suggest: root.querySelector("#st-suggest"),
    };

    /* ---- Scene ---- */
    var kit = {
      def: def,
      pinTag: function (anchor, html, cls) {
        if (!scene || !scene.stage) return null;
        var d = document.createElement("div");
        d.className = "st-tag " + (cls || "");
        d.innerHTML = html;
        var p = scene.stage.pin(d, anchor);
        tags.push(p);
        return p;
      },
      clearTags: clearTags,
      sound: snd,
    };
    function clearTags() {
      tags.forEach(function (t) {
        t.el.classList.add("is-out");
        setTimeout(t.remove, 260);
      });
      tags = [];
    }

    if (CX.three && CX.three.ok()) {
      try {
        scene = def.scene(el.canvas, kit);
      } catch (err) {
        console.error("[studio] 3D scene failed", err);
        scene = null;
      }
    }
    if (!scene) {
      el.canvas.innerHTML =
        '<div class="st-nogl">' + icon("info") + "<p><b>3D view unavailable on this device.</b> Everything else works: prompts, predictions, tests and results.</p></div>";
      scene = {
        set: function () {},
        run: function () {
          return Promise.resolve({});
        },
        runTests: function () {
          return Promise.resolve([]);
        },
        dispose: function () {},
      };
    }
    scene.set(params, { instant: true });

    /* ---- Session card ---- */
    function renderSession() {
      var s = session;
      el.session.innerHTML =
        '<div class="st-session__top"><span class="st-session__n">Session ' +
        sessionN +
        " of 6 · 1 hour</span>" +
        (done(sessionN) ? '<span class="st-session__done">' + icon("check") + "Complete</span>" : "") +
        "</div>" +
        '<h2 class="st-session__t">' +
        esc(skill.skill) +
        "</h2>" +
        '<p class="st-session__goal">' +
        esc(s.goal) +
        "</p>" +
        '<div class="st-session__tags"><span class="st-chip st-chip--ing st-chip--' +
        skill.ing +
        '">' +
        icon(skill.icon) +
        esc(s.skillTip || skill.tip) +
        "</span>" +
        (s.concept ? '<span class="st-chip">' + icon(def.subjects[0].icon || "flask") + esc(s.concept) + "</span>" : "") +
        "</div>";
      el.st.setAttribute("data-skill", skill.ing);
    }

    /* ---- Composer ---- */
    var lastCount = 0;
    function syncCompose(silent) {
      var text = el.ta.value;
      var a = P.analyse(text, def);
      el.mirror.innerHTML = P.highlight(text, a);
      el.mirror.scrollTop = el.ta.scrollTop;
      U.qsa("[data-ing]", el.ings).forEach(function (chip) {
        var id = chip.getAttribute("data-ing");
        var on = !!a.has[id];
        if (on && !chip.classList.contains("is-on") && !silent) {
          chip.classList.remove("pop");
          void chip.offsetWidth;
          chip.classList.add("pop");
        }
        chip.classList.toggle("is-on", on);
        chip.classList.toggle("is-target", id === skill.ing || (skill.ing === "limits" && id === "goal") || (skill.ing === "all" && !on));
      });
      U.qsa("i", el.power).forEach(function (bar, i) {
        bar.classList.toggle("is-on", i < a.count);
      });
      el.power.setAttribute("data-n", a.count);
      if (!silent && a.count > lastCount) snd("ping", { pitch: 0.75 + a.count * 0.12, vol: 0.8 });
      lastCount = a.count;
      el.ask.disabled = busy || !text.trim();
      return a;
    }
    el.ta.addEventListener("input", function () {
      if (CX.sound) CX.sound.soft("type", 35, { seed: el.ta.value.length });
      syncCompose();
    });
    el.ta.addEventListener("scroll", function () {
      el.mirror.scrollTop = el.ta.scrollTop;
    });
    el.ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    });
    el.compose.addEventListener("submit", function (e) {
      e.preventDefault();
      submit();
    });

    function renderSuggest(listIn, label) {
      var items = listIn || session.suggestions || [];
      el.suggest.innerHTML = items.length
        ? '<span class="st-suggest__k">' +
          esc(label || "Try") +
          "</span>" +
          items
            .map(function (s) {
              var t = typeof s === "string" ? s : s.t;
              return '<button type="button" class="st-sug" data-sug="' + esc(t) + '">' + esc(t) + "</button>";
            })
            .join("")
        : "";
    }

    U.on(el.suggest, "click", "[data-sug]", function (e, b) {
      if (busy) return;
      setPrompt(b.getAttribute("data-sug"));
      snd("tap");
      el.ta.focus();
    });

    function setPrompt(text) {
      el.ta.value = text;
      syncCompose();
    }

    /* ---- HUD ---- */
    var shownMetrics = null;
    function renderHud(values, state, changedKeys) {
      var ms = def.metrics;
      el.hud.innerHTML =
        '<div class="st-hud__group"><p class="st-hud__k">' +
        icon("sliders") +
        "Your build</p>" +
        def.causes
          .map(function (k) {
            var spec = def.params[k];
            var changed = changedKeys && changedKeys.indexOf(k) !== -1;
            return (
              '<div class="st-metric st-metric--cause' +
              (changed ? " is-changed" : "") +
              '"><span class="st-metric__k">' +
              esc(spec.label) +
              '</span><span class="st-metric__v">' +
              esc(fmtVal(def, k, (trial || params)[k])) +
              "</span></div>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="st-hud__group st-hud__group--fx"><p class="st-hud__k">' +
        icon("flask") +
        "What happens</p>" +
        ms
          .filter(function (m) {
            return !m.hidden;
          })
          .map(function (m) {
            return metricHtml(def, m, values ? values[m.key] : null, state);
          })
          .join("") +
        "</div>";
      shownMetrics = values;
    }

    /* ---- Ladder (versions of the prompt) ---- */
    function renderLadder(pendingText) {
      var vs = prog.versions;
      var rows = vs
        .slice(-4)
        .map(function (v) {
          return (
            '<li class="st-rung' +
            (v.kept ? " is-kept" : "") +
            '"><span class="st-rung__s">S' +
            v.s +
            '</span><span class="st-rung__p">' +
            esc(v.prompt) +
            '</span><span class="st-rung__m"><span class="st-rung__pow" data-n="' +
            v.count +
            '">' +
            v.count +
            "/6</span>" +
            (v.guesses != null ? '<span class="st-rung__g">' + v.guesses + (v.guesses === 1 ? " guess" : " guesses") + "</span>" : "") +
            "</span></li>"
          );
        })
        .join("");
      if (pendingText)
        rows +=
          '<li class="st-rung is-pending"><span class="st-rung__s">S' +
          sessionN +
          '</span><span class="st-rung__p">' +
          esc(pendingText) +
          '</span><span class="st-rung__m"><span class="st-rung__pow">…</span></span></li>';
      el.ladder.innerHTML = rows ? '<p class="st-ladder__k">' + icon("layers") + "Prompt ladder</p><ol>" + rows + "</ol>" : "";
    }

    /* ---- Loop indicator ---- */
    function setPhase(p) {
      phase = p;
      el.st.setAttribute("data-phase", p);
      U.qsa("[data-loop]", el.loop).forEach(function (li) {
        var order = ["prompt", "predict", "test", "decide"];
        var i = order.indexOf(li.getAttribute("data-loop"));
        var cur = order.indexOf(p);
        li.classList.toggle("is-now", i === cur);
        li.classList.toggle("is-past", cur > i);
      });
      phaseWaiters = phaseWaiters.filter(function (w) {
        if (w.p === p) {
          w.resolve();
          return false;
        }
        return true;
      });
    }

    /* ---- Banner (cause → effect) ---- */
    function banner(html, kind) {
      el.banner.className = "st-banner st-banner--" + (kind || "fx");
      el.banner.innerHTML = html;
      el.banner.hidden = false;
      el.banner.classList.remove("is-in");
      void el.banner.offsetWidth;
      el.banner.classList.add("is-in");
    }
    function hideBanner() {
      el.banner.hidden = true;
    }

    /* ---- Cards ---- */
    function youCard(text, a, vNum, prevText) {
      return (
        '<div class="st-card st-card--you">' +
        '<div class="st-card__head"><span class="st-who st-who--you">' +
        icon("user") +
        "You</span><span class=\"st-ver\">Prompt v" +
        vNum +
        '</span><span class="st-pow" data-n="' +
        a.count +
        '">' +
        a.count +
        "/6 ingredients</span></div>" +
        '<p class="st-you__text">' +
        P.highlight(text, a) +
        "</p>" +
        (prevText ? '<p class="st-you__diff"><span>' + icon("edit") + "Changed from your last prompt:</span> " + P.diffWords(prevText, text) + "</p>" : "") +
        "</div>"
      );
    }
    function thinkingCard() {
      return (
        '<div class="st-card st-card--ai st-card--thinking"><div class="st-card__head"><span class="st-who st-who--ai">' +
        icon("wand") +
        'AI helper</span><span class="st-mode">offline example mode</span></div><div class="st-think"><i></i><i></i><i></i><span>Reading your prompt…</span></div></div>'
      );
    }
    function aiCard(r) {
      var h =
        '<div class="st-card st-card--ai">' +
        '<div class="st-card__head"><span class="st-who st-who--ai">' +
        icon("wand") +
        'AI helper</span><span class="st-mode">offline example mode</span></div>' +
        '<p class="st-ai__say">' +
        esc(r.say) +
        "</p>";
      if (r.understood && r.understood.length) {
        var guesses = r.understood.filter(function (u) {
          return u.src === "guess";
        }).length;
        h +=
          '<p class="st-sub">' +
          icon("eye") +
          "What I understood" +
          (guesses ? ' <span class="st-guesscount">' + guesses + (guesses === 1 ? " guess" : " guesses") + "</span>" : ' <span class="st-guesscount st-guesscount--0">no guesses</span>') +
          "</p>" +
          '<div class="st-under">' +
          r.understood
            .map(function (u, i) {
              return (
                '<span class="st-u st-u--' +
                u.src +
                '" style="--i:' +
                i +
                '">' +
                icon(u.src === "you" ? "user" : "help") +
                esc(u.t) +
                "<small>" +
                (u.src === "you" ? "your words" : u.src === "calc" ? "AI worked out" : u.src === "test" ? "test" : "AI guessed") +
                "</small></span>"
              );
            })
            .join("") +
          "</div>";
      }
      if (r.changes && r.changes.length) {
        h +=
          '<p class="st-sub">' +
          icon("sliders") +
          "What I changed</p>" +
          '<ul class="st-deltas">' +
          r.changes
            .map(function (c, i) {
              return (
                '<li class="st-delta st-delta--' +
                c.src +
                '" style="--i:' +
                i +
                '"><span class="st-delta__k">' +
                esc(c.label) +
                '</span><span class="st-delta__from">' +
                esc(c.fromText) +
                "</span>" +
                icon("arrow-right") +
                '<span class="st-delta__to">' +
                esc(c.toText) +
                '</span><span class="st-delta__src">' +
                (c.src === "you" ? "you" : c.src === "calc" ? "worked out" : "guess") +
                "</span></li>"
              );
            })
            .join("") +
          "</ul>";
      }
      if (r.tests) {
        h +=
          '<p class="st-sub">' +
          icon("flask") +
          "Tests I'll run</p>" +
          '<div class="st-under">' +
          r.tests
            .map(function (t, i) {
              return '<span class="st-u st-u--test" style="--i:' + i + '">' + icon("flask") + esc(t.label) + "</span>";
            })
            .join("") +
          "</div>";
      }
      if (r.kind === "clarify" && r.options) {
        h +=
          '<div class="st-clarify">' +
          r.options
            .map(function (o) {
              return '<button type="button" class="st-sug st-sug--add" data-add="' + esc(o) + '">' + icon("plus") + esc(o) + "</button>";
            })
            .join("") +
          "</div>";
      }
      return h + "</div>";
    }
    function predictCard(pr) {
      return (
        '<div class="st-card st-card--predict" id="st-predict">' +
        '<div class="st-card__head"><span class="st-who st-who--predict">' +
        icon("bulb") +
        "Predict</span><span class=\"st-mode\">before you test</span></div>" +
        '<p class="st-predict__q">' +
        esc(pr.q) +
        "</p>" +
        '<div class="st-predict__opts">' +
        pr.options
          .map(function (o, i) {
            return '<button type="button" class="st-opt" data-predict="' + i + '">' + esc(o.t) + "</button>";
          })
          .join("") +
        "</div></div>"
      );
    }
    function runCard(label) {
      return (
        '<div class="st-runrow" id="st-runrow"><button type="button" class="btn btn--lime st-run" data-st="run">' +
        icon("play", "btn__icon") +
        "<span>" +
        esc(label || "Run the test") +
        "</span></button></div>"
      );
    }

    /* ---- Main actions ---- */
    function submit() {
      var text = el.ta.value.trim();
      if (!text || busy) return;
      ask(text);
    }

    function changeList(from, to, src) {
      var out = [];
      Object.keys(to).forEach(function (k) {
        if (!def.params[k]) return;
        if (JSON.stringify(from[k]) === JSON.stringify(to[k])) return;
        out.push({
          key: k,
          label: def.params[k].label,
          from: from[k],
          to: to[k],
          fromText: fmtVal(def, k, from[k]),
          toText: fmtVal(def, k, to[k]),
          src: (src && src[k]) || "guess",
        });
      });
      return out;
    }

    function ctx() {
      return { params: params, trial: trial, session: sessionN, skill: skill, prog: prog, def: def, last: lastPrompt, versions: prog.versions };
    }

    function ask(text) {
      busy = true;
      el.ask.disabled = true;
      clearTags();
      hideBanner();
      var a = P.analyse(text, def);
      var vNum = prog.versions.length + 1;
      var prev = lastPrompt;
      setPhase("prompt");
      el.flow.innerHTML = youCard(text, a, vNum, prev) + thinkingCard();
      el.flow.scrollTop = 0;
      renderLadder(text);
      snd("whoosh");
      snd("think", { dur: 1.1, delay: 0.15 });
      flyParticles();
      CX.store.stat("prompts");
      return wait(1250).then(function () {
        if (disposed) return;
        var r = P.general(text) || def.interpret(text, ctx());
        r.analysis = a;
        r.prompt = text;
        resp = r;
        lastPrompt = text;
        if (r.kind === "change" || r.kind === "tests") {
          trial = Object.assign({}, params, r.set || {});
          r.changes = changeList(params, trial, r.src);
          r.guesses = (r.understood || []).filter(function (u) {
            return u.src === "guess";
          }).length;
        }
        var card = el.flow.querySelector(".st-card--thinking");
        if (card) card.outerHTML = aiCard(r);
        snd("pop");
        if (r.guesses) snd("guess", { delay: 0.45 });
        if (r.kind === "change") {
          renderHud(null, "unknown", r.changes.map(function (c) {
            return c.key;
          }));
          scene.set(trial, { animate: true, changes: r.changes, resp: r });
          if (r.changes.length) snd("apply", { delay: 0.2 });
          r.changes.forEach(function (c, i) {
            var anchor = scene.anchor && scene.anchor(c.key);
            if (anchor)
              setTimeout(function () {
                if (disposed || resp !== r) return;
                kit.pinTag(anchor, (c.src === "you" ? icon("user") : c.src === "calc" ? icon("graph") : icon("help")) + "<b>" + esc(c.label) + "</b> " + esc(c.toText) + "<small>" + (c.src === "you" ? "you said" : c.src === "calc" ? "AI worked out" : "AI guessed") + "</small>", "st-tag--" + c.src);
              }, 450 + i * 160);
          });
          afterAI(r);
        } else if (r.kind === "tests") {
          scene.set(trial, { animate: true, changes: r.changes, resp: r });
          afterAI(r);
        } else {
          // clarify / safety / info: back to the prompt
          if (r.kind === "clarify") setPrompt(text);
          busy = false;
          syncCompose(true);
          setPhase("prompt");
        }
        el.flow.scrollTop = el.flow.scrollHeight;
      });
    }

    function afterAI(r) {
      var pr = def.predict ? def.predict(r, ctx()) : null;
      r.predictQ = pr;
      predicted = null;
      if (pr) {
        el.flow.insertAdjacentHTML("beforeend", predictCard(pr));
        setPhase("predict");
      } else {
        el.flow.insertAdjacentHTML("beforeend", runCard(r.kind === "tests" ? "Run the tests" : "Run the test"));
        setPhase("test");
      }
      el.ta.value = "";
      syncCompose(true);
      busy = false;
      scrollFlow();
    }

    function scrollFlow() {
      setTimeout(function () {
        el.flow.scrollTo({ top: el.flow.scrollHeight, behavior: U.reducedMotion() ? "auto" : "smooth" });
      }, 60);
    }

    U.on(el.flow, "click", "[data-predict]", function (e, b) {
      if (!resp || !resp.predictQ || predicted != null) return;
      predicted = parseInt(b.getAttribute("data-predict"), 10);
      U.qsa("[data-predict]", el.flow).forEach(function (x) {
        x.classList.toggle("is-picked", x === b);
        x.disabled = true;
      });
      snd("select");
      el.flow.insertAdjacentHTML("beforeend", runCard(resp.kind === "tests" ? "Run the tests" : "Test my prediction"));
      setPhase("test");
      scrollFlow();
    });

    U.on(el.flow, "click", "[data-add]", function (e, b) {
      var add = b.getAttribute("data-add");
      var t = el.ta.value.trim().replace(/[.!]$/, "");
      setPrompt(t + (t ? " " : "") + add);
      snd("tap");
      el.ta.focus();
    });

    U.on(el.flow, "click", '[data-st="run"]', function () {
      run();
    });

    function run() {
      if (busy || !resp || (resp.kind !== "change" && resp.kind !== "tests")) return Promise.resolve();
      busy = true;
      var row = el.flow.querySelector("#st-runrow");
      if (row) row.innerHTML = '<div class="st-running"><i></i>' + (resp.kind === "tests" ? "Running the tests…" : "Testing…") + "</div>";
      setPhase("test");
      CX.store.stat("tests");
      var prevMetrics = def.measure(params);
      var p = resp.kind === "tests" ? scene.runTests(resp.tests.map(function (t) {
        return { label: t.label, params: Object.assign({}, trial, t.set) };
      }), resp) : scene.run(trial, resp, { prev: params });
      return Promise.resolve(p).then(function (out) {
        if (disposed) return;
        var nextMetrics = def.measure(trial);
        result = { prev: prevMetrics, next: nextMetrics, out: out };
        if (resp.kind === "tests") {
          result.rows = resp.tests.map(function (t) {
            var mp = Object.assign({}, trial, t.set);
            return { label: t.label, params: mp, metrics: def.measure(mp) };
          });
        }
        var check = session.check ? session.check(result, trial, resp, ctx()) : { pass: true };
        result.check = check;
        var good = predicted != null && resp.predictQ && resp.predictQ.options[predicted] && resp.predictQ.options[predicted].ok;
        if (predicted != null && resp.predictQ) {
          prog.predictions.total++;
          if (good) prog.predictions.right++;
          CX.store.save();
        }
        renderHud(nextMetrics, "known", resp.changes ? resp.changes.map(function (c) {
          return c.key;
        }) : []);
        var fx = def.effect ? def.effect(result, trial, resp, ctx()) : null;
        result.fx = fx;
        if (fx && fx.headline) banner('<span class="st-banner__k">Cause and effect</span><span class="st-banner__t">' + fx.headline + "</span>", check.pass ? "good" : "fx");
        if (row) row.remove();
        el.flow.insertAdjacentHTML("beforeend", resultCard(result, good));
        snd(check.pass ? "success" : "error", { delay: 0.1 });
        setPhase("decide");
        busy = false;
        scrollFlow();
        return result;
      });
    }

    function resultCard(r, good) {
      var fx = r.fx || {};
      var h = '<div class="st-card st-card--result' + (r.check.pass ? " is-pass" : " is-miss") + '">';
      h += '<div class="st-card__head"><span class="st-who st-who--result">' + icon("flask") + "Test result</span>" + '<span class="st-verdict">' + icon(r.check.pass ? "check" : "alert") + esc(r.check.pass ? "Goal met" : "Not yet") + "</span></div>";
      if (r.rows) {
        var ms = def.tableMetrics || def.metrics.map(function (m) {
          return m.key;
        });
        h +=
          '<div class="st-table-wrap"><table class="st-table"><thead><tr><th>Test</th>' +
          ms
            .map(function (k) {
              var m = def.metrics.filter(function (x) {
                return x.key === k;
              })[0];
              return "<th>" + esc(m ? m.label : k) + "</th>";
            })
            .join("") +
          "</tr></thead><tbody>" +
          r.rows
            .map(function (row, i) {
              return (
                '<tr style="--i:' +
                i +
                '"><th>' +
                esc(row.label) +
                "</th>" +
                ms
                  .map(function (k) {
                    return "<td>" + esc(fmtVal(def, k, row.metrics[k])) + "</td>";
                  })
                  .join("") +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>";
      } else if (fx.rows && fx.rows.length) {
        h +=
          '<ul class="st-fx">' +
          fx.rows
            .map(function (row, i) {
              return (
                '<li class="st-fx__row" style="--i:' +
                i +
                '"><span class="st-fx__k">' +
                esc(row.label) +
                '</span><span class="st-fx__from">' +
                esc(row.from) +
                "</span>" +
                icon("arrow-right") +
                '<span class="st-fx__to">' +
                esc(row.to) +
                "</span>" +
                (row.factor ? '<span class="st-fx__x">' + esc(row.factor) + "</span>" : "") +
                "</li>"
              );
            })
            .join("") +
          "</ul>";
      }
      if (resp.predictQ && predicted != null) {
        var pick = resp.predictQ.options[predicted];
        h +=
          '<p class="st-pred ' +
          (good ? "is-right" : "is-wrong") +
          '">' +
          icon(good ? "check" : "info") +
          "<span>You predicted <b>" +
          esc(pick.t) +
          "</b>. " +
          esc(good ? resp.predictQ.right || "Your prediction was right." : resp.predictQ.wrong || "The test shows something different. That's how scientists learn.") +
          "</span></p>";
      }
      if (r.check.note) h += '<p class="st-note">' + esc(r.check.note) + "</p>";
      if (fx.concept) h += '<div class="st-concept">' + icon(def.subjects[0].icon || "bulb") + "<div><b>" + esc(fx.conceptTitle || "The maths and science") + "</b><p>" + esc(fx.concept) + "</p></div></div>";
      h += '<div class="st-why" id="st-why"></div>';
      h +=
        '<div class="st-decide"><p class="st-decide__k">' +
        icon("hand") +
        "You decide</p>" +
        '<button type="button" class="act act--keep" data-st="keep">' +
        icon("check") +
        "Keep it</button>" +
        '<button type="button" class="act act--undo" data-st="undo">' +
        icon("undo") +
        "Undo &amp; improve my prompt</button>" +
        '<button type="button" class="act act--why" data-st="why">' +
        icon("help") +
        "Why did that happen?</button></div>";
      return h + "</div>";
    }

    U.on(el.flow, "click", '[data-st="keep"]', function () {
      keep();
    });
    U.on(el.flow, "click", '[data-st="undo"]', function () {
      undo();
    });
    U.on(el.flow, "click", '[data-st="why"]', function (e, b) {
      why(b);
    });
    U.on(el.flow, "click", '[data-st="next"]', function () {
      nextSession();
    });
    U.on(el.flow, "click", '[data-st="share"]', function () {
      if (CX.share) CX.share.open(def, prog, scene);
    });

    function why(b) {
      if (!resp || !result) return;
      var box = el.flow.querySelector("#st-why");
      if (!box || box.innerHTML) return;
      if (b) b.disabled = true;
      snd("think", { dur: 0.6 });
      box.innerHTML = '<div class="st-think st-think--sm"><i></i><i></i><i></i><span>Thinking…</span></div>';
      setTimeout(function () {
        if (disposed) return;
        var txt = def.why ? def.why(resp, result, ctx()) : "";
        box.innerHTML = '<div class="st-whybox">' + icon("wand") + "<p>" + esc(txt) + "</p></div>";
        snd("pop");
        CX.store.stat("whys");
        scrollFlow();
      }, 900);
    }

    function keep() {
      if (!resp || !result || phase !== "decide") return;
      var a = resp.analysis;
      params = Object.assign({}, trial);
      prog.params = JSON.parse(JSON.stringify(params));
      prog.versions.push({
        v: prog.versions.length + 1,
        s: sessionN,
        prompt: resp.prompt,
        count: a.count,
        has: a.has,
        guesses: resp.guesses || 0,
        metrics: result.next,
        pass: !!result.check.pass,
        kept: true,
        at: Date.now(),
      });
      CX.store.stat("keeps");
      snd("keep");
      clearTags();
      var passed = result.check.pass;
      var wasDone = done(sessionN);
      if (passed && !wasDone) {
        prog.done.push(sessionN);
        prog.session = Math.min(6, Math.max(prog.session || 1, sessionN + 1));
        if (session.badge && CX.store.addBadge) CX.store.addBadge(session.badge);
      }
      CX.store.save();
      CX.bus.emit("store:change", CX.store.state);
      renderLadder();
      lockDecide();
      if (passed) {
        el.flow.insertAdjacentHTML("beforeend", completeCard());
        if (scene.celebrate) scene.celebrate();
        snd("fanfare", { delay: 0.2 });
        renderHeadSessions();
      } else {
        el.flow.insertAdjacentHTML(
          "beforeend",
          '<div class="st-card st-card--note">' + icon("info") + "<p>Kept. " + esc(result.check.coach || "The session goal isn't met yet. Improve your prompt and try again.") + "</p></div>"
        );
        renderSuggest(session.after || session.suggestions, "Next try");
      }
      resp = null;
      result = null;
      trial = null;
      setPhase("prompt");
      scrollFlow();
    }

    function undo() {
      if (!resp) return;
      var text = resp.prompt;
      trial = null;
      scene.set(params, { animate: true, undo: true });
      snd("undo");
      clearTags();
      hideBanner();
      renderHud(def.measure(params), "known");
      lockDecide();
      CX.store.stat("undos");
      var coach = (result && result.check && result.check.coach) || (resp.coach) || session.coach || "Change your prompt and ask again.";
      el.flow.insertAdjacentHTML("beforeend", '<div class="st-card st-card--coach">' + icon("bulb") + "<p><b>Coach:</b> " + esc(coach) + "</p></div>");
      setPrompt(text);
      el.ta.focus({ preventScroll: true });
      el.ta.setSelectionRange(text.length, text.length);
      renderSuggest(session.after || session.suggestions, "Ideas");
      resp = null;
      result = null;
      renderLadder();
      setPhase("prompt");
      scrollFlow();
    }

    function lockDecide() {
      U.qsa(".st-decide button", el.flow).forEach(function (b) {
        b.disabled = true;
      });
    }

    function completeCard() {
      var last = sessionN === 6;
      var sk = S[sessionN - 1];
      return (
        '<div class="st-card st-card--complete">' +
        '<div class="st-complete__badge">' +
        icon(sk.icon) +
        "</div>" +
        '<p class="st-complete__k">Session ' +
        sessionN +
        " complete</p>" +
        '<h3 class="st-complete__t">' +
        esc(sk.ability) +
        "</h3>" +
        (last
          ? '<button type="button" class="btn btn--lime" data-st="share">' + icon("share", "btn__icon") + "<span>Make my share card</span></button>"
          : '<button type="button" class="btn btn--lime" data-st="next">' + icon("arrow-right", "btn__icon") + "<span>Session " + (sessionN + 1) + ": " + esc(S[sessionN].skill) + "</span></button>") +
        "</div>"
      );
    }

    function nextSession() {
      if (sessionN >= 6) return;
      snd("whoosh");
      CX.router.go("/build/" + def.id + "/" + (sessionN + 1) + (CX.embed ? "?embed=1" : ""));
    }

    function renderHeadSessions() {
      U.qsa("[data-sess]", root).forEach(function (a) {
        var n = parseInt(a.getAttribute("data-sess"), 10);
        a.classList.toggle("is-done", done(n));
        var num = a.querySelector(".st-sess__n");
        if (num) num.innerHTML = done(n) && n !== sessionN ? icon("check") : n;
      });
    }

    /* Particles from the Ask button to the stage (the prompt "travels" to the build) */
    function flyParticles() {
      if (U.reducedMotion()) return;
      var from = el.ask.getBoundingClientRect();
      var to = el.canvas.getBoundingClientRect();
      var layer = document.createElement("div");
      layer.className = "st-fly";
      document.body.appendChild(layer);
      for (var i = 0; i < 14; i++) {
        var d = document.createElement("i");
        var x0 = from.left + from.width / 2,
          y0 = from.top + from.height / 2;
        var x1 = to.left + to.width * (0.4 + Math.random() * 0.2),
          y1 = to.top + to.height * (0.35 + Math.random() * 0.2);
        d.style.left = x0 + "px";
        d.style.top = y0 + "px";
        layer.appendChild(d);
        var mx = (x0 + x1) / 2,
          my = Math.min(y0, y1) - 120 - Math.random() * 120;
        if (d.animate)
          d.animate(
            [
              { transform: "translate(0,0) scale(.4)", opacity: 0 },
              { transform: "translate(" + (mx - x0) + "px," + (my - y0) + "px) scale(1)", opacity: 1, offset: 0.45 },
              { transform: "translate(" + (x1 - x0) + "px," + (y1 - y0) + "px) scale(.3)", opacity: 0 },
            ],
            { duration: 900 + i * 25, delay: i * 30, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards" }
          );
      }
      setTimeout(function () {
        if (layer.parentNode) layer.parentNode.removeChild(layer);
      }, 1600);
    }

    function wait(ms) {
      return new Promise(function (r) {
        setTimeout(r, ms);
      });
    }

    /* ---- Tools ---- */
    var soundBtn = root.querySelector('[data-st="sound"]');
    function syncSoundBtn() {
      var on = !CX.sound || CX.sound.enabled;
      soundBtn.setAttribute("aria-pressed", String(on));
      soundBtn.innerHTML = icon(on ? "volume" : "volume-off");
      soundBtn.setAttribute("aria-label", on ? "Sound on. Turn sound off" : "Sound off. Turn sound on");
    }
    soundBtn.addEventListener("click", function () {
      if (!CX.sound) return;
      CX.sound.setEnabled(!CX.sound.enabled);
      syncSoundBtn();
    });
    syncSoundBtn();
    root.querySelector('[data-st="ladder"]').addEventListener("click", function () {
      snd("open");
      if (CX.share) CX.share.ladder(def, prog);
    });

    /* ---- Start ---- */
    renderSession();
    renderHud(def.measure(params), "known");
    renderLadder();
    renderSuggest();
    syncCompose(true);
    setPhase("prompt");
    if (session.intro) el.flow.innerHTML = '<div class="st-card st-card--intro">' + icon("bulb") + "<p>" + esc(session.intro) + "</p></div>";
    if (scene.stage) {
      scene.stage.onResize = function () {};
    }

    var api = {
      def: def,
      get phase() {
        return phase;
      },
      get session() {
        return sessionN;
      },
      get busy() {
        return busy;
      },
      get result() {
        return result;
      },
      scene: scene,
      el: el,
      setPrompt: setPrompt,
      ask: function (text) {
        if (text != null) setPrompt(text);
        return ask(el.ta.value.trim());
      },
      run: run,
      keep: keep,
      undo: undo,
      why: function () {
        why(el.flow.querySelector('[data-st="why"]'));
      },
      predict: function (i) {
        var b = el.flow.querySelector('[data-predict="' + i + '"]');
        if (b) b.click();
      },
      waitPhase: function (p) {
        if (phase === p && !busy) return Promise.resolve();
        return new Promise(function (resolve) {
          phaseWaiters.push({ p: p, resolve: resolve });
        });
      },
      dispose: function () {
        disposed = true;
        clearTags();
        try {
          scene.dispose();
        } catch (err) {}
        if (CX.studio.current === api) CX.studio.current = null;
      },
    };
    CX.studio.current = api;
    return api;
  }

  CX.studio = { mount: mount, progress: progress, fmtVal: fmtVal, current: null };
})();
