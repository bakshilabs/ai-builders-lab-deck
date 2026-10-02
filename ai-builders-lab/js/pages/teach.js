/* ==========================================================================
   Instructor experience
   #/teach          Instructor home: today's lesson, class at a glance
   #/teach/:lesson  Session plan: running order with a live clock, prompts,
                    success checks, differentiation, misconceptions, board mode
   The instructor stays in charge. AI supports them; it doesn't replace them.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  var STAGE_LABEL = { prompt: "Prompting", predict: "Predicting", test: "Testing", decide: "Deciding", done: "Session done", help: "Needs help" };
  function world(id) {
    return CX.builds.get(id) || { title: id, interest: { icon: "sparkle", label: "" }, colour: "lime" };
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* Big-type "Show on board" view for projectors */
  function board(items, startIndex, title) {
    var i = startIndex || 0;
    var d = ui.dialog({
      title: title || "On the board",
      cls: "modal--board",
      body: '<div class="board"><div class="board__text" id="board-text"></div><div class="board__nav"><button type="button" class="btn btn--white btn--sm" data-b="-1">' + icon("arrow-left", "btn__icon") + '<span>Back</span></button><span class="board__count" id="board-count"></span><button type="button" class="btn btn--lime btn--sm" data-b="1"><span>Next</span>' + icon("arrow-right", "btn__icon") + "</button></div></div>",
    });
    function show() {
      var it = items[i];
      d.el.querySelector("#board-text").innerHTML = (it.kicker ? '<p class="board__kicker">' + esc(it.kicker) + "</p>" : "") + '<p class="board__big">' + esc(it.text) + "</p>" + (it.sub ? '<p class="board__sub">' + esc(it.sub) + "</p>" : "");
      d.el.querySelector("#board-count").textContent = i + 1 + " / " + items.length;
    }
    d.el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-b]");
      if (!b) return;
      i = (i + Number(b.getAttribute("data-b")) + items.length) % items.length;
      show();
    });
    d.el.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        i = (i + 1) % items.length;
        show();
      }
      if (e.key === "ArrowLeft") {
        i = (i - 1 + items.length) % items.length;
        show();
      }
    });
    show();
    return d;
  }
  CX.board = board;

  function aiModeControl() {
    var mode = CX.store.state.settings.aiMode || "offline";
    return (
      '<div class="aimode"><p class="aimode__label">' +
      icon("wand") +
      ' AI helper in this class</p><div class="seg" role="group" aria-label="AI helper mode">' +
      [
        ["off", "Off"],
        ["offline", "Offline examples"],
        ["live", "School-approved live AI"],
      ]
        .map(function (m) {
          return '<button type="button" data-aimode="' + m[0] + '" aria-pressed="' + (mode === m[0]) + '">' + esc(m[1]) + "</button>";
        })
        .join("") +
      '</div><p class="aimode__note" id="aimode-note">' +
      aiNote(mode) +
      "</p></div>"
    );
  }
  function aiNote(mode) {
    return mode === "off"
      ? "The AI helper is hidden. Children build by changing the code themselves. Good for a no-AI lesson or a power cut."
      : mode === "live"
      ? "In this prototype, live AI is a placeholder. It would need school IT approval and a data agreement before it could be used."
      : "Pre-written AI examples. They work offline, nothing leaves the device, and every AI mistake happens the same way each time.";
  }
  function bindAiMode(root, scope) {
    scope.add(
      U.on(root, "click", "[data-aimode]", function (e, t) {
        var m = t.getAttribute("data-aimode");
        CX.store.patch(function (s) {
          s.settings.aiMode = m;
        });
        U.qsa("[data-aimode]", root).forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === t));
        });
        root.querySelector("#aimode-note").textContent = aiNote(m);
        ui.toast(m === "live" ? "Live AI is a placeholder in this prototype" : "AI helper: " + t.textContent, "wand");
      })
    );
  }

  /* ======================================================================= */
  CX.pages.teach = {
    title: "Instructor",
    mount: function (root, params, scope) {
      var mods = CX.data.course.modules;
      var today = mods[3];
      var roster = CX.data.classRoster;
      root.innerHTML =
        '<section class="page-hero thero on-navy">' +
        ui.curve("M-60 300 C 260 160, 520 460, 820 300 S 1260 120, 1500 240", { cls: "thero__curve", viewBox: "0 0 1440 600", draw: true }) +
        '<div class="container container--wide page-hero__inner thero__grid">' +
        '<div><p class="eyebrow">' +
        icon("board") +
        ' Instructor view</p><h1 class="hero-type">Today\'s<br><span class="text-lime">session</span></h1><p class="lead">Pick up a session, read it in five minutes and teach it with confidence. One skill for the whole class, practised in four different worlds: the running order, what to say and how to check learning are all here.</p>' +
        aiModeControl() +
        "</div>" +
        '<article class="tlesson card" data-reveal="right"><div class="tlesson__top"><span class="tlesson__n">' +
        pad(today.n) +
        '</span><div><p class="eyebrow">Session ' +
        pad(today.n) +
        ' of 6 · 60 minutes</p><h2 class="d3">' +
        esc(today.title) +
        '</h2></div><span class="tlesson__bit">' +
        ui.bitSvg(today.bit.colour, today.bit.face) +
        "</span></div>" +
        '<dl class="tlesson__facts"><div><dt>Objective</dt><dd>' +
        esc(today.lesson.objective) +
        "</dd></div><div><dt>Outcome</dt><dd>" +
        esc(today.lesson.outcome) +
        '</dd></div></dl><div class="tlesson__order">' +
        today.lesson.runningOrder
          .map(function (r) {
            return '<span><b>00:' + pad(r.at) + "</b>" + esc(r.title) + "</span>";
          })
          .join("") +
        '</div><div class="cluster">' +
        ui.btn({ label: "Open session plan", href: "#/teach/" + today.n, variant: "navy" }) +
        ui.btn({ label: "Start session", href: "#/teach/" + today.n + "?start=1", variant: "lime", icon: "play" }) +
        '<button type="button" class="btn btn--white" data-board-today>' +
        icon("board", "btn__icon") +
        "<span>Show on board</span></button></div></article></div></section>" +
        '<section class="tsupport on-lime"><div class="container container--wide tsupport__row">' +
        [
          ["users", "You're the teacher", "The AI helper only changes the build. It never teaches the session."],
          ["eye", "You see every prompt", "The class view shows each child's world, their prompt and where they are in the loop."],
          ["sliders", "You control the AI", "Switch it off, use offline examples, or (in future) a school-approved live AI."],
        ]
          .map(function (c) {
            return '<div class="tsupport__item">' + icon(c[0]) + "<div><b>" + esc(c[1]) + "</b><span>" + esc(c[2]) + "</span></div></div>";
          })
          .join("") +
        "</div></section>" +
        '<section class="tlessons on-cream section"><div class="container container--wide">' +
        '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("book") +
        ' Six ready-to-run sessions</p><h2 class="d1">One unit, six hours</h2></div><div><div class="seg" role="group" aria-label="Delivery format" id="fmt">' +
        CX.data.course.formats
          .map(function (f) {
            return '<button type="button" data-fmt="' + f.id + '" aria-pressed="' + (CX.store.state.lesson.format === f.id) + '">' + esc(f.label) + "</button>";
          })
          .join("") +
        '</div><p class="small muted" id="fmt-note" style="margin-top:10px"></p></div></div>' +
        '<div class="tgrid">' +
        mods
          .map(function (m, i) {
            return (
              '<a class="tcard' +
              (i === 3 ? " is-today" : "") +
              '" href="#/teach/' +
              m.n +
              '" data-reveal style="--delay:' +
              (i % 3) * 80 +
              'ms"><span class="tcard__slot" data-slot="' +
              i +
              '"></span><span class="tcard__n">' +
              pad(m.n) +
              '</span><h3>' +
              esc(m.title) +
              "</h3><p>" +
              esc(m.lesson.objective) +
              '</p><span class="tcard__meta">' +
              icon("clock") +
              "60 min · all four worlds</span>" +
              (i === 3 ? '<span class="chip chip--pink tcard__today">Today</span>' : "") +
              ui.arrow(true) +
              "</a>"
            );
          })
          .join("") +
        "</div></div></section>" +
        '<section class="tclass on-navy section"><div class="container container--wide">' +
        '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("users") +
        ' Class at a glance</p><h2 class="d1">Four worlds.<br><span class="text-lime">One skill.</span></h2></div><div><p class="lead">Fifteen builders, each in the world they chose, all practising today\'s skill. See each child\'s prompt, where they are in the loop and who needs help.</p><span class="tag-sample">Sample class · simulated</span></div></div>' +
        '<div class="tclass__grid">' +
        roster
          .map(function (r, i) {
            var s = r.status;
            var w = world(r.build);
            return (
              '<button type="button" class="tkid tkid--' +
              s +
              '" data-kid="' +
              i +
              '"><span class="tkid__bit">' +
              ui.bitSvg(r.colour, s === "help" ? "sad" : r.face) +
              '</span><b>' +
              esc(r.name) +
              (r.you ? " (demo)" : "") +
              '</b><span class="tkid__world">' +
              icon(w.interest.icon) +
              esc(w.title) +
              '</span><span class="tkid__stage">' +
              (s === "help" ? icon("hand") : "") +
              esc(STAGE_LABEL[s]) +
              '</span><span class="tkid__pow"><span class="st-power__bars">' +
              [0, 1, 2, 3, 4, 5]
                .map(function (k) {
                  return k < r.count ? '<i class="is-on"></i>' : "<i></i>";
                })
                .join("") +
              "</span></span></button>"
            );
          })
          .join("") +
        "</div></div></section>" +
        CX.layout.footer();

      bindAiMode(root, scope);
      function fmtNote() {
        var f = CX.data.course.formats.filter(function (x) {
          return x.id === CX.store.state.lesson.format;
        })[0];
        root.querySelector("#fmt-note").textContent = f.detail;
        U.qsa("[data-slot]", root).forEach(function (el) {
          el.textContent = f.slots[Number(el.getAttribute("data-slot"))];
        });
      }
      fmtNote();
      scope.add(
        U.on(root, "click", "[data-fmt]", function (e, t) {
          CX.store.patch(function (s) {
            s.lesson.format = t.getAttribute("data-fmt");
          });
          U.qsa("[data-fmt]", root).forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === t));
          });
          fmtNote();
        })
      );
      scope.add(
        U.on(root, "click", "[data-board-today]", function () {
          board(
            today.lesson.runningOrder.map(function (r) {
              return { kicker: "00:" + pad(r.at) + " · " + r.title, text: r.say, sub: r.do };
            }),
            0,
            "Session " + pad(today.n) + " · " + today.title
          );
        })
      );
      scope.add(
        U.on(root, "click", "[data-kid]", function (e, t) {
          var i = Number(t.getAttribute("data-kid"));
          var r = roster[i];
          var s = r.status;
          var w = world(r.build);
          var a = CX.prompt.analyse(r.prompt, w);
          ui.dialog({
            title: r.name,
            body:
              '<div class="stack"><p><span class="chip chip--' +
              (s === "help" ? "pink" : "lime") +
              '">' +
              esc(STAGE_LABEL[s]) +
              '</span> <span class="chip">' +
              esc(w.title) +
              ' · session 4</span> <span class="tag-sample">Sample</span></p>' +
              '<p class="kidprompt">' +
              CX.prompt.highlight(r.prompt, a) +
              "</p><ul class=\"ticks\"><li>" +
              a.count +
              " of 6 prompt ingredients</li><li>The AI guessed " +
              r.guesses +
              (r.guesses === 1 ? " thing" : " things") +
              "</li></ul>" +
              (s === "help"
                ? '<div class="note">' + icon("bulb") + "<span><b>Suggested question:</b> “Did the AI do what you said, or what you meant? What limit could you add?”</span></div>"
                : "") +
              ui.btn({ label: "Open " + w.title + " · session 4", href: "#/build/" + w.id + "/4", size: "sm" }) +
              "</div>",
          });
        })
      );
    },
  };

  /* ======================================================================= */
  CX.pages.lesson = {
    title: function (params) {
      var m = CX.data.moduleById(params.lesson);
      return m ? "Session " + pad(m.n) + " · " + m.title : "Session";
    },
    mount: function (root, params, scope) {
      var m = CX.data.moduleById(params.lesson) || CX.data.course.modules[3];
      var L = m.lesson;
      var mods = CX.data.course.modules;
      var roster = CX.data.classRoster;
      var checks = (CX.store.state.lesson.checks[m.n] = CX.store.state.lesson.checks[m.n] || {});
      var worlds = CX.builds.list;

      function checkGrid() {
        var counts = L.successCheck.map(function (_, ci) {
          return roster.filter(function (r, ri) {
            return checks[ri + ":" + ci];
          }).length;
        });
        return (
          '<div class="lcheck" role="table" aria-label="Success check by student"><div class="lcheck__row lcheck__row--head" role="row"><span role="columnheader">Builder</span>' +
          L.successCheck
            .map(function (c, ci) {
              return '<span role="columnheader">' + esc(c) + "<small>" + counts[ci] + "/15</small></span>";
            })
            .join("") +
          "</div>" +
          roster
            .map(function (r, ri) {
              return (
                '<div class="lcheck__row" role="row"><span role="rowheader"><i class="lcheck__dot" style="background:var(--' +
                (r.colour === "blue" ? "blue" : r.colour) +
                '-400)"></i>' +
                esc(r.name) +
                "</span>" +
                L.successCheck
                  .map(function (c, ci) {
                    var on = !!checks[ri + ":" + ci];
                    return '<span role="cell"><button type="button" class="lcheck__cell' + (on ? " is-on" : "") + '" data-check="' + ri + ":" + ci + '" aria-pressed="' + on + '" aria-label="' + esc(r.name + ": " + c) + '">' + icon("check") + "</button></span>";
                  })
                  .join("") +
                "</div>"
              );
            })
            .join("") +
          "</div>"
        );
      }

      root.innerHTML =
        '<section class="page-hero lhead on-navy">' +
        '<div class="container container--wide page-hero__inner">' +
        '<a class="backlink" href="#/teach">' +
        icon("arrow-left") +
        "Instructor home</a>" +
        '<div class="lhead__grid"><div><p class="eyebrow">Session ' +
        pad(m.n) +
        " of 6 · " +
        L.duration +
        ' minutes</p><h1 class="d1">' +
        esc(m.title) +
        '</h1><div class="cluster lhead__chips"><span class="chip chip--glass">' +
        icon("users") +
        'Ages 10–11 · 15 children</span><span class="chip chip--glass">' +
        icon("layers") +
        "Same skill in all four worlds" +
        '</span><span class="chip chip--glass">' +
        icon("offline") +
        "Works offline</span></div></div>" +
        '<div class="cluster lhead__actions no-print">' +
        ui.btn({ label: "Open Planet Builder · session " + m.n, href: "#/build/planet/" + m.n, variant: "lime" }) +
        '<button type="button" class="btn btn--white" data-board="prompts">' +
        icon("board", "btn__icon") +
        '<span>Show on board</span></button><button type="button" class="btn btn--ghost" data-print>' +
        icon("print", "btn__icon") +
        "<span>Print</span></button></div></div></div></section>" +
        '<section class="lbody on-cream section section--tight"><div class="container container--wide">' +
        '<div class="lfacts">' +
        '<div class="card lfact"><p class="eyebrow">' +
        icon("target") +
        " Objective</p><p class=\"lfact__big\">" +
        esc(L.objective) +
        "</p></div>" +
        '<div class="card lfact"><p class="eyebrow">' +
        icon("trophy") +
        " Outcome</p><p class=\"lfact__big\">" +
        esc(L.outcome) +
        "</p></div>" +
        '<div class="card lfact"><p class="eyebrow">' +
        icon("list") +
        ' You will need</p><ul class="ticks">' +
        L.need
          .map(function (n) {
            return "<li>" + esc(n) + "</li>";
          })
          .join("") +
        "</ul></div></div>" +
        // The same session in each world
        '<div class="lworlds"><p class="eyebrow">' +
        icon("layers") +
        ' In each world</p><h2 class="d3">Same skill, four worlds</h2><div class="lworlds__grid">' +
        worlds
          .map(function (b) {
            var ss = b.sessions[m.n - 1];
            return (
              '<a class="lworld lworld--' +
              b.colour +
              '" href="#/build/' +
              b.id +
              "/" +
              m.n +
              '"><span class="lworld__k">' +
              icon(b.interest.icon) +
              esc(b.interest.label) +
              "</span><b>" +
              esc(b.title) +
              "</b><p>" +
              esc(ss.goal) +
              '</p><p class="lworld__p">“' +
              esc(m.prompt[b.interest.id]) +
              '”</p><span class="lworld__go">Open session ' +
              m.n +
              icon("arrow-right") +
              "</span></a>"
            );
          })
          .join("") +
        "</div></div>" +
        // Running order with live clock
        '<div class="lorder card"><div class="lorder__head"><div><p class="eyebrow">' +
        icon("clock") +
        ' Running order</p><h2 class="d3">60 minutes, minute by minute</h2></div><div class="lclock no-print"><span class="lclock__time" id="clock">00:00</span><button type="button" class="btn btn--lime btn--sm" id="clock-go">' +
        icon("play", "btn__icon") +
        '<span>Start lesson</span></button><button type="button" class="iconbtn" id="clock-reset" aria-label="Reset clock">' +
        icon("restart") +
        '</button><label class="switch switch--sm" title="Run the clock 30× faster for a demo"><input type="checkbox" id="clock-fast"><span class="switch__track"></span><span>Demo speed</span></label></div></div>' +
        '<div class="lclock__bar no-print"><span id="clock-bar"></span></div>' +
        '<ol class="lorder__list">' +
        L.runningOrder
          .map(function (r, i) {
            return (
              '<li class="lseg" data-seg="' +
              i +
              '"><span class="lseg__time">00:' +
              pad(r.at) +
              '</span><div class="lseg__body"><h3 class="lseg__t">' +
              esc(r.title) +
              '<small>' +
              r.mins +
              " min</small></h3><p>" +
              esc(r.do) +
              '</p><p class="lseg__say">' +
              icon("quote") +
              "<span>" +
              esc(r.say) +
              '</span></p></div><button type="button" class="iconbtn lseg__board no-print" data-board-seg="' +
              i +
              '" aria-label="Show this step on the board">' +
              icon("board") +
              "</button></li>"
            );
          })
          .join("") +
        "</ol></div>" +
        // Prompts + Success check
        '<div class="lduo"><div class="card lprompts"><p class="eyebrow">' +
        icon("chat") +
        ' Instructor prompts</p><h2 class="d3">Words you can use</h2><div class="lprompts__list">' +
        L.prompts
          .map(function (p, i) {
            return '<button type="button" class="say lprompt" data-board-prompt="' + i + '">' + esc(p) + "</button>";
          })
          .join("") +
        '</div><p class="tiny muted">Click a prompt to show it on the board.</p></div>' +
        '<div class="card lsuccess"><p class="eyebrow">' +
        icon("check") +
        ' Success check</p><h2 class="d3">Each builder can…</h2><ul class="ticks ticks--lime">' +
        L.successCheck
          .map(function (c) {
            return "<li>" + esc(c) + "</li>";
          })
          .join("") +
        "</ul></div></div>" +
        // Class checklist
        '<div class="card lclass"><div class="lclass__head"><div><p class="eyebrow">' +
        icon("users") +
        ' Class success check</p><h2 class="d3">Tick as you go</h2></div><span class="tag-sample">Sample class</span></div>' +
        '<div id="check-grid">' +
        checkGrid() +
        "</div></div>" +
        // Differentiation
        '<div class="ldiff"><h2 class="d2">One class, three levels</h2><div class="ldiff__grid">' +
        [
          ["support", "Need more help?", "hand", "var(--teal-400)"],
          ["core", "On track?", "check", "var(--lime-400)"],
          ["extension", "Want more?", "rocket", "var(--pink-400)"],
        ]
          .map(function (d) {
            return '<div class="ldiff__card" style="--c:' + d[3] + '"><span class="ldiff__icon">' + icon(d[2]) + "</span><h3>" + esc(d[1]) + "</h3><p>" + esc(L.differentiation[d[0]]) + "</p></div>";
          })
          .join("") +
        "</div></div>" +
        // Misconceptions
        '<div class="lmisc"><p class="eyebrow">' +
        icon("alert") +
        ' Common misconceptions</p><div class="lmisc__grid">' +
        L.misconceptions
          .map(function (mc) {
            return '<div class="lmisc__card"><p class="lmisc__wrong"><b>They might think:</b> “' + esc(mc.wrong) + '”</p><p class="lmisc__right"><b>Help them see:</b> ' + esc(mc.right) + "</p></div>";
          })
          .join("") +
        "</div></div>" +
        // Notes + safeguarding + feed
        '<div class="ltrio"><div class="card"><p class="eyebrow">' +
        icon("bulb") +
        ' Teaching notes</p><ul class="ticks">' +
        L.notes
          .map(function (n) {
            return "<li>" + esc(n) + "</li>";
          })
          .join("") +
        "</ul><p class=\"small\"><b>Hands-on:</b> " +
        esc(m.physical) +
        '</p></div><div class="card lsafe"><p class="eyebrow">' +
        icon("shield-check") +
        ' Safeguarding</p><ul class="ticks"><li>The AI helper only edits the project. There is no open chat.</li><li>Personal information typed into the AI box is blocked with a reminder.</li><li>Children use builder nicknames, never real names.</li><li>You can see every AI change in the class view.</li></ul></div>' +
        '<div class="card card--dark lfeed"><p class="eyebrow">' +
        icon("bolt") +
        ' Live class activity</p><span class="tag-sample">Simulated</span><ol class="lfeed__list" id="feed"></ol></div></div>' +
        // Prev/next
        '<nav class="lnav no-print" aria-label="Other sessions">' +
        (m.n > 1 ? '<a class="lnav__link" href="#/teach/' + (m.n - 1) + '">' + icon("arrow-left") + "<span><small>Previous</small>" + esc(mods[m.n - 2].title) + "</span></a>" : "<span></span>") +
        (m.n < 6 ? '<a class="lnav__link lnav__link--next" href="#/teach/' + (m.n + 1) + '"><span><small>Next</small>' + esc(mods[m.n].title) + "</span>" + icon("arrow-right") + "</a>" : "<span></span>") +
        "</nav></div></section>" +
        CX.layout.footer();

      // Clock
      var t = 0,
        running = false,
        last = 0,
        raf = 0;
      var clockEl = root.querySelector("#clock");
      var barEl = root.querySelector("#clock-bar");
      var segs = U.qsa(".lseg", root);
      function paint() {
        var mins = t / 60;
        clockEl.textContent = pad(Math.floor(t / 60)) + ":" + pad(Math.floor(t % 60));
        barEl.style.width = Math.min(100, (mins / L.duration) * 100) + "%";
        var cur = -1;
        L.runningOrder.forEach(function (r, i) {
          if (mins >= r.at) cur = i;
        });
        segs.forEach(function (s, i) {
          s.classList.toggle("is-now", i === cur && (running || t > 0));
          s.classList.toggle("is-done", i < cur);
        });
      }
      function frame(now) {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        var dt = (now - last) / 1000;
        last = now;
        t += dt * (root.querySelector("#clock-fast").checked ? 30 : 1);
        if (t >= L.duration * 60) {
          t = L.duration * 60;
          running = false;
          ui.toast("Session time is up. Great work!", "check");
          setBtn();
        }
        paint();
      }
      var goBtn = root.querySelector("#clock-go");
      function setBtn() {
        goBtn.innerHTML = icon(running ? "pause" : "play", "btn__icon") + "<span>" + (running ? "Pause" : t > 0 ? "Resume" : "Start lesson") + "</span>";
      }
      goBtn.addEventListener("click", function () {
        running = !running;
        if (running) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
        setBtn();
      });
      root.querySelector("#clock-reset").addEventListener("click", function () {
        running = false;
        t = 0;
        setBtn();
        paint();
      });
      scope.add(function () {
        running = false;
        cancelAnimationFrame(raf);
      });
      if (params.query && params.query.start) {
        root.querySelector("#clock-fast").checked = true;
        goBtn.click();
      }
      paint();

      // Checklist
      scope.add(
        U.on(root, "click", "[data-check]", function (e, b) {
          var k = b.getAttribute("data-check");
          CX.store.patch(function () {
            if (checks[k]) delete checks[k];
            else checks[k] = true;
          });
          root.querySelector("#check-grid").innerHTML = checkGrid();
          var again = root.querySelector('[data-check="' + k + '"]');
          if (again) again.focus();
        })
      );

      // Board
      scope.add(
        U.on(root, "click", "[data-board], [data-board-prompt], [data-board-seg]", function (e, b) {
          if (b.hasAttribute("data-board-seg")) {
            var i = Number(b.getAttribute("data-board-seg"));
            board(
              L.runningOrder.map(function (r) {
                return { kicker: "00:" + pad(r.at) + " · " + r.title, text: r.say, sub: r.do };
              }),
              i,
              "Session " + pad(m.n) + " · " + m.title
            );
          } else {
            var start = b.hasAttribute("data-board-prompt") ? Number(b.getAttribute("data-board-prompt")) : 0;
            board(
              L.prompts.map(function (p) {
                return { kicker: "Think about it", text: p };
              }),
              start,
              "Instructor prompts"
            );
          }
        })
      );
      root.querySelector("[data-print]").addEventListener("click", function () {
        window.print();
      });

      // Simulated class feed
      var feed = root.querySelector("#feed");
      var evs = CX.data.classEvents;
      var k = 0;
      function push() {
        var ev = evs[k % evs.length];
        k++;
        var li = document.createElement("li");
        li.className = "lfeed__item lfeed__item--" + ev.kind;
        li.innerHTML = '<span class="lfeed__icon">' + icon({ keep: "check", undo: "undo", help: "hand", test: "flask", ask: "wand", partial: "search", explain: "chat", vague: "help" }[ev.kind] || "sparkle") + "</span><span><b>" + esc(ev.who) + "</b> " + esc(ev.text) + "</span>";
        feed.insertBefore(li, feed.firstChild);
        while (feed.children.length > 6) feed.removeChild(feed.lastChild);
      }
      push();
      push();
      push();
      var iv = setInterval(push, 3500);
      scope.add(function () {
        clearInterval(iv);
      });
    },
  };
})();
