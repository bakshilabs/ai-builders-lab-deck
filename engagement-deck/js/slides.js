/* ==========================================================================
   Slide controllers: rendering from js/content.js, interactions and the
   choreographed moments. Each controller can define:
     init(slide)                       once, at boot
     enter(slide, step, dir)           when the slide becomes active
     step(slide, step, prevStep, now)  on every build step (now = on enter)
     leave(slide)                      when moving away
   ========================================================================== */
(function () {
  "use strict";

  var DECK = window.DECK;
  var ui = DECK.ui;
  var C = DECK.content;
  var $ = DECK.$;
  var $$ = DECK.$$;
  var esc = ui.esc;
  var icon = ui.icon;
  var ctl = DECK.controllers;

  /* ---- helpers --------------------------------------------------------- */
  function rectIn(el, ancestor) {
    var x = 0;
    var y = 0;
    var node = el;
    while (node && node !== ancestor) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function reduced() {
    return DECK.reduced();
  }
  function active(slide) {
    return slide.classList.contains("is-active");
  }
  function colourVar(c) {
    return { lime: "var(--lime-400)", teal: "var(--teal-400)", pink: "var(--pink-400)", orange: "var(--orange-400)", blue: "var(--blue-400)", white: "#ffffff", navy: "var(--navy-950)" }[c] || c;
  }
  function crossfadeImg(img, src, alt) {
    if (img.getAttribute("src") === src) return;
    if (reduced() || !img.animate) {
      img.src = src;
      img.alt = alt || "";
      return;
    }
    var out = img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-in" });
    out.onfinish = function () {
      img.src = src;
      img.alt = alt || "";
      img.animate([{ opacity: 0, transform: "scale(1.015)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" });
    };
  }
  function swapContent(el, html) {
    if (reduced() || !el.animate) {
      el.innerHTML = html;
      DECK.hydrate(el);
      return;
    }
    el.innerHTML = html;
    DECK.hydrate(el);
    el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) {
      el.setAttribute(k, attrs[k]);
    });
    return el;
  }

  /* ==========================================================================
     2 · Prototype: look around the screens (captures fall back gracefully)
     ========================================================================== */
  ctl.prototype = {
    init: function (s) {
      var shot = $("[data-proto-shot]", s);
      var url = $("[data-proto-url]", s);
      var thumbs = $$(".s-proto__thumb", s);
      thumbs.forEach(function (b) {
        b.addEventListener("click", function () {
          thumbs.forEach(function (x) {
            x.setAttribute("aria-pressed", x === b ? "true" : "false");
          });
          DECK.shots.set(shot, b.getAttribute("data-file"), b.getAttribute("data-label"));
          url.textContent = b.getAttribute("data-url");
          if (shot.animate && !reduced()) shot.animate([{ opacity: 0.25, transform: "scale(1.012)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
        });
      });
    },
  };

  /* ==========================================================================
     3 · With you: two sets of strengths converge
     ========================================================================== */
  ctl["with-you"] = {
    drawn: false,
    init: function (s) {
      var self = this;
      DECK.on("fonts", function () {
        self.draw(s);
      });
      self.draw(s);
    },
    draw: function (s) {
      var svg = $("[data-render='streams']", s);
      var core = $(".s-with__core", s);
      var c = rectIn(core, s);
      var cy = c.y + c.h / 2;
      var html = "";
      $$(".s-with__col--cx .chip", s).forEach(function (chip, k, all) {
        var r = rectIn(chip, s);
        var sx = r.x + r.w + 14;
        var sy = r.y + r.h / 2;
        var ex = c.x + 34;
        var ey = cy + (k - (all.length - 1) / 2) * 16;
        html += '<path class="draw s-with__stream s-with__stream--cx" style="--d:' + (900 + k * 60) + 'ms" d="M' + sx + " " + sy + " C" + (sx + 150) + " " + sy + " " + (ex - 170) + " " + ey + " " + ex + " " + ey + '"/>';
      });
      $$(".s-with__col--us .chip", s).forEach(function (chip, k, all) {
        var r = rectIn(chip, s);
        var sx = r.x - 14;
        var sy = r.y + r.h / 2;
        var ex = c.x + c.w - 34;
        var ey = cy + (k - (all.length - 1) / 2) * 16;
        html += '<path class="draw s-with__stream s-with__stream--us" style="--d:' + (900 + k * 60) + 'ms" d="M' + sx + " " + sy + " C" + (sx - 150) + " " + sy + " " + (ex + 170) + " " + ey + " " + ex + " " + ey + '"/>';
      });
      svg.innerHTML = html;
      DECK.measure(svg);
    },
  };

  /* ==========================================================================
     5 · Start by listening: stakeholder groups as interview bubbles
     ========================================================================== */
  var GROUP_POS = [
    { x: 214, y: 78 },
    { x: 810, y: 78 },
    { x: 868, y: 330 },
    { x: 512, y: 560 },
    { x: 156, y: 330 },
  ];
  var HUB = { x: 512, y: 300 };

  ctl.listen = {
    sel: null,
    init: function (s) {
      var self = this;
      var wrap = $("[data-render='groups']", s);
      var links = $("[data-render='listen-links']", s);
      var lhtml = "";
      wrap.innerHTML = C.groups
        .map(function (g, k) {
          var p = GROUP_POS[k % GROUP_POS.length];
          var mx = (HUB.x + p.x) / 2 + (p.y < HUB.y ? -30 : 30);
          var my = (HUB.y + p.y) / 2;
          lhtml += '<path class="draw link link--listen" style="--d:' + (450 + k * 140) + 'ms" d="M' + HUB.x + " " + HUB.y + " Q" + mx + " " + my + " " + p.x + " " + p.y + '"/>';
          return (
            '<button type="button" class="gbub gbub--' + g.colour + '" data-g="' + g.id + '" aria-pressed="false" data-a="pop" style="left:' + p.x + "px;top:" + p.y + "px;--d:" + (600 + k * 150) + 'ms">' +
            '<span class="gbub__ic">' + icon(g.icon) + '</span><span class="gbub__name">' + esc(g.name) + "</span>" +
            '<span class="gbub__dots" aria-hidden="true"><i></i><i></i><i></i></span></button>'
          );
        })
        .join("");
      links.innerHTML = lhtml;
      wrap.addEventListener("click", function (e) {
        var b = e.target.closest("[data-g]");
        if (b) self.select(s, b.getAttribute("data-g"), true);
      });
      self.select(s, C.groups[0].id, false);
    },
    select: function (s, id, animate) {
      this.sel = id;
      $$("[data-g]", s).forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-g") === id ? "true" : "false");
      });
      var g = C.groups.filter(function (x) {
        return x.id === id;
      })[0];
      var people = (C.participants || []).filter(function (p) {
        return p.group === id;
      });
      var html =
        '<div class="gdet__head"><span class="gdet__ic" style="--c:' + colourVar(g.colour) + '">' + icon(g.icon) + '</span><div><p class="gdet__k">What we would explore with</p><p class="gdet__name">' + esc(g.name) + "</p></div></div>" +
        '<ul class="gdet__chips">' +
        g.explore
          .map(function (t) {
            return "<li>" + esc(t) + "</li>";
          })
          .join("") +
        "</ul>" +
        '<p class="gdet__foot">' + icon("users") +
        (people.length
          ? "Speaking with: " + people.map(function (p) { return esc(p.name) + (p.role ? " (" + esc(p.role) + ")" : ""); }).join(", ")
          : "Who we speak to: to agree with ComputerXplorers") +
        "</p>";
      var card = $("[data-render='group-detail']", s);
      if (animate) swapContent(card, html);
      else card.innerHTML = html;
    },
  };

  /* ==========================================================================
     6 · The 20-minute interview clock (scrub, click, play)
     ========================================================================== */
  ctl.questions = {
    t: 0,
    seg: -1,
    playing: false,
    raf: 0,
    init: function (s) {
      var self = this;
      var segs = C.interview;
      var svg = $("[data-render='ring']", s);
      var cx = 320;
      var cy = 320;
      var R = 230;
      function pt(min, r) {
        var a = (min / 20) * Math.PI * 2 - Math.PI / 2;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      }
      function arc(m0, m1, r) {
        var p0 = pt(m0, r);
        var p1 = pt(m1, r);
        var large = m1 - m0 > 10 ? 1 : 0;
        return "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + " A" + r + " " + r + " 0 " + large + " 1 " + p1[0].toFixed(2) + " " + p1[1].toFixed(2);
      }
      var html = '<circle cx="320" cy="320" r="' + R + '" class="ring__bg"/>';
      segs.forEach(function (g, k) {
        html +=
          '<path class="ring__seg" data-seg="' + k + '" tabindex="0" role="button" aria-label="' + g.from + " to " + g.to + " minutes: " + esc(g.title) + '" d="' + arc(g.from + 0.12, g.to - 0.12, R) + '" style="--c:' + colourVar(g.colour) + '"/>';
      });
      // minute marks
      segs.concat([{ from: 20 }]).forEach(function (g) {
        if (g.from === 20) return;
        var p = pt(g.from, R + 64);
        html += '<text class="ring__tick" x="' + p[0].toFixed(1) + '" y="' + (p[1] + 7).toFixed(1) + '" text-anchor="middle">' + g.from + "</text>";
      });
      html += '<g class="ring__hand" data-hand><line x1="320" y1="320" x2="320" y2="128"/><circle cx="320" cy="128" r="17"/><circle cx="320" cy="320" r="12"/></g>';
      svg.innerHTML = html;

      // segment bar under the scrubber
      $("[data-render='clock-bar']", s).innerHTML = segs
        .map(function (g, k) {
          return '<button type="button" class="cbar__seg" data-jump="' + k + '" style="flex:' + (g.to - g.from) + ";--c:" + colourVar(g.colour) + '"><span>' + esc(g.title.replace(/\?$/, "")) + "</span><small>" + g.from + "–" + g.to + "</small></button>";
        })
        .join("");

      svg.addEventListener("click", function (e) {
        var p = e.target.closest("[data-seg]");
        if (p) self.jump(s, parseInt(p.getAttribute("data-seg"), 10));
      });
      svg.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-seg]")) {
          e.preventDefault();
          self.jump(s, parseInt(e.target.getAttribute("data-seg"), 10));
        }
      });
      $("[data-render='clock-bar']", s).addEventListener("click", function (e) {
        var b = e.target.closest("[data-jump]");
        if (b) self.jump(s, parseInt(b.getAttribute("data-jump"), 10));
      });
      var range = $("[data-clock-range]", s);
      range.addEventListener("input", function () {
        self.stop(s);
        self.set(s, parseFloat(range.value), true);
      });
      $("[data-clock-play]", s).addEventListener("click", function () {
        if (self.playing) self.stop(s);
        else self.play(s);
      });
      self.set(s, 0, false);
    },
    jump: function (s, k) {
      this.stop(s);
      this.set(s, C.interview[k].from + 0.01, true);
    },
    set: function (s, t, animate) {
      this.t = Math.max(0, Math.min(20, t));
      var range = $("[data-clock-range]", s);
      if (Math.abs(parseFloat(range.value) - this.t) > 0.01) range.value = this.t;
      range.style.setProperty("--pct", (this.t / 20) * 100 + "%");
      var mins = Math.floor(this.t);
      var secs = Math.round((this.t - mins) * 60);
      if (secs === 60) {
        mins += 1;
        secs = 0;
      }
      $("[data-clock-time]", s).textContent = (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
      $("[data-hand]", s).setAttribute("transform", "rotate(" + ((this.t / 20) * 360).toFixed(2) + " 320 320)");
      range.setAttribute("aria-valuetext", mins + " minutes");
      var k = 0;
      C.interview.forEach(function (g, n) {
        if (this.t >= g.from) k = n;
      }, this);
      var t = this.t;
      $$(".ring__seg", s).forEach(function (p, n) {
        var g = C.interview[n];
        p.classList.toggle("is-past", t >= g.to);
        p.classList.toggle("is-now", n === k);
      });
      $$(".cbar__seg", s).forEach(function (b, n) {
        b.classList.toggle("is-now", n === k);
        b.setAttribute("aria-pressed", n === k ? "true" : "false");
      });
      if (k !== this.seg) {
        this.seg = k;
        this.panel(s, k, animate);
      }
    },
    panel: function (s, k, animate) {
      var g = C.interview[k];
      var html = '<p class="cpanel__when" style="--c:' + colourVar(g.colour) + '"><span>' + g.from + " to " + g.to + " minutes</span></p>" + '<h3 class="cpanel__title">' + esc(g.title) + "</h3>";
      if (g.say) {
        html += '<p class="cpanel__k">What we say first</p><blockquote class="cpanel__say">' + esc(g.say) + "</blockquote>";
      } else if (g.questions.length === 1) {
        html += '<p class="cpanel__k">The question we close with</p><blockquote class="cpanel__say cpanel__say--big">' + esc(g.questions[0]) + "</blockquote>";
      } else {
        html += '<ul class="cpanel__qs">' + g.questions.map(function (q) {
          return "<li>" + icon("question") + "<span>" + esc(q) + "</span></li>";
        }).join("") + "</ul>";
      }
      html += '<p class="cpanel__foot">' + icon("pencil") + "We capture their exact words where it helps.</p>";
      var el = $("[data-render='clock-panel']", s);
      if (animate) swapContent(el, html);
      else el.innerHTML = html;
    },
    play: function (s) {
      var self = this;
      if (self.t >= 19.99) self.set(s, 0, true);
      self.playing = true;
      var btn = $("[data-clock-play]", s);
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "Pause");
      btn.innerHTML = icon("pause");
      var last = performance.now();
      function frame(now) {
        if (!self.playing) return;
        var dt = (now - last) / 1000;
        last = now;
        self.set(s, self.t + dt / 1.5, true); // 1 minute every 1.5 seconds
        if (self.t >= 20) {
          self.stop(s);
          return;
        }
        self.raf = requestAnimationFrame(frame);
      }
      self.raf = requestAnimationFrame(frame);
    },
    stop: function (s) {
      this.playing = false;
      cancelAnimationFrame(this.raf);
      var btn = $("[data-clock-play]", s);
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "Play the interview");
      btn.innerHTML = icon("play");
    },
    leave: function (s) {
      this.stop(s);
    },
  };

  /* ==========================================================================
     7 · Synthesis: perspectives converge into four honest piles
     ========================================================================== */
  var PILES = [
    { key: "consensus", title: "Consensus", text: "What several people agree on.", colour: "lime", icon: "check" },
    { key: "openQuestions", title: "Open questions", text: "What needs more exploration.", colour: "teal", icon: "help" },
    { key: "differences", title: "Differences", text: "Where views genuinely differ. We show them, not smooth them over.", colour: "pink", icon: "split" },
    { key: "implications", title: "Design implications", text: "What it all means for the platform.", colour: "orange", icon: "tool" },
  ];

  ctl.synthesis = {
    init: function (s) {
      var F = C.findings || {};
      var done = F.interviewsDone || 0;
      // legend
      $("[data-render='legend']", s).innerHTML = C.groups
        .map(function (g) {
          return '<li><span class="leg__sw" style="--c:' + colourVar(g.colour) + '">' + icon(g.icon) + "</span>" + esc(g.short) + "</li>";
        })
        .join("");
      // perspective bubbles
      var r = rng(7);
      var cloud = $("[data-render='perspectives']", s);
      var html = "";
      for (var k = 0; k < 34; k++) {
        var g = C.groups[k % C.groups.length];
        var x = 8 + r() * 84;
        var y = 8 + r() * 78;
        var size = 34 + Math.round(r() * 26);
        html += '<span class="pdot" data-pile="' + (k % 4) + '" style="left:' + x.toFixed(1) + "%;top:" + y.toFixed(1) + "%;--s:" + size + "px;--c:" + colourVar(g.colour) + ";--fd:" + (r() * 4).toFixed(2) + 's"><i></i></span>';
      }
      cloud.innerHTML = html;
      // cards
      $("[data-render='synthesis']", s).innerHTML =
        '<div class="synth__status"><span class="tag tag--todo">' + icon("pencil") + (done ? "From " + done + " interviews" : "Placeholders · filled in after the interviews") + "</span></div>" +
        PILES.map(function (p, n) {
          var items = F[p.key] || [];
          var body = items.length
            ? items.slice(0, 3).map(function (it) {
                return '<li class="slot slot--filled">' + esc(it.text || it) + (it.heardFrom ? '<small class="slot__from">' + esc(it.heardFrom) + "</small>" : "") + "</li>";
              }).join("")
            : '<li class="slot">' + icon("pencil") + "To fill in after the interviews</li><li class=\"slot\">" + icon("pencil") + "To fill in after the interviews</li>";
          return (
            '<article class="pile" data-a="up" style="--d:' + (300 + n * 120) + "ms;--c:" + colourVar(p.colour) + '" data-pile-card="' + n + '">' +
            '<p class="pile__head"><span class="pile__ic">' + icon(p.icon) + "</span>" + esc(p.title) + "</p>" +
            '<p class="pile__text">' + esc(p.text) + "</p><ul class=\"pile__slots\">" + body + "</ul></article>"
          );
        }).join("");
      // principles
      var pr = F.principles || [];
      var slots = pr.length
        ? pr.slice(0, 4).map(function (t) {
            return '<li class="slot slot--filled">' + esc(t) + "</li>";
          }).join("")
        : [1, 2, 3].map(function () {
            return '<li class="slot">' + icon("pencil") + "A principle we write together</li>";
          }).join("");
      $("[data-render='principles']", s).innerHTML = '<p class="princ__label">' + icon("star") + "Shared principles</p><ul class=\"princ__slots\">" + slots + "</ul>";
    },
    step: function (s, step, prev, now) {
      var dots = $$(".pdot", s);
      var cards = $$("[data-pile-card]", s);
      if (step >= 1) {
        if (now || reduced() || !s.animate) {
          dots.forEach(function (d) {
            d.getAnimations && d.getAnimations().forEach(function (a) {
              if (a.id === "fly") a.cancel();
            });
            d.classList.add("is-sorted");
          });
          cards.forEach(function (c) {
            c.classList.add("is-fed");
          });
          return;
        }
        if (prev >= 1) return;
        dots.forEach(function (d, k) {
          var card = cards[parseInt(d.getAttribute("data-pile"), 10)];
          var a = rectIn(d, s);
          var b = rectIn(card, s);
          var dx = b.x + b.w / 2 - (a.x + a.w / 2) + (Math.random() - 0.5) * 120;
          var dy = b.y + 70 - (a.y + a.h / 2);
          var anim = d.animate(
            [
              { transform: "translate(0,0) scale(1)", opacity: 1 },
              { transform: "translate(" + dx * 0.5 + "px," + (dy * 0.5 - 60) + "px) scale(.9)", opacity: 1, offset: 0.55 },
              { transform: "translate(" + dx + "px," + dy + "px) scale(.3)", opacity: 0 },
            ],
            { duration: 1000 + Math.random() * 500, delay: k * 28, easing: "cubic-bezier(.55,0,.35,1)", fill: "forwards" }
          );
          anim.id = "fly";
        });
        cards.forEach(function (c, n) {
          setTimeout(function () {
            if (DECK.state.step >= 1 && active(s)) c.classList.add("is-fed");
          }, 1100 + n * 120);
        });
        setTimeout(function () {
          if (DECK.state.step >= 1 && active(s) && DECK.sound) DECK.sound.chime(false);
        }, 1500);
      } else {
        dots.forEach(function (d) {
          d.classList.remove("is-sorted");
          d.getAnimations && d.getAnimations().forEach(function (a) {
            if (a.id === "fly") a.cancel();
          });
        });
        cards.forEach(function (c) {
          c.classList.remove("is-fed");
        });
      }
    },
  };

  /* ==========================================================================
     8 · Workshop running order (accordion)
     ========================================================================== */
  ctl.workshop = {
    open: 3,
    init: function (s) {
      var self = this;
      var W = C.workshop;
      var el = $("[data-render='workshop']", s);
      var colours = ["lime", "pink", "teal", "orange", "blue"];
      var bar = W.parts
        .map(function (p, k) {
          return '<span class="wbar__seg" style="flex:' + p.weight + ";--c:" + colourVar(colours[k]) + '"><b>' + p.n + "</b></span>";
        })
        .join("");
      el.innerHTML =
        '<div class="wplan__head"><p class="wplan__title">Running order</p><p class="wplan__total">' + icon("clock") + "90 to 120 minutes" + (W.date ? " · " + esc(W.date) : "") + "</p></div>" +
        '<div class="wbar" aria-hidden="true">' + bar + "</div>" +
        '<ol class="wparts">' +
        W.parts
          .map(function (p, k) {
            return (
              '<li class="wpart" data-part="' + p.n + '" style="--c:' + colourVar(colours[k]) + '">' +
              '<button type="button" class="wpart__btn" aria-expanded="false" aria-controls="wpart-' + p.n + '"><span class="wpart__n">' + p.n + '</span><span class="wpart__t">' + esc(p.title) + '</span><span class="wpart__m">' + esc(p.mins) + " min</span>" + icon("chev-down", "wpart__chev") + "</button>" +
              '<div class="wpart__body" id="wpart-' + p.n + '">' + self.body(p) + "</div></li>"
            );
          })
          .join("") +
        "</ol>";
      el.addEventListener("click", function (e) {
        var b = e.target.closest(".wpart__btn");
        if (b) self.toggle(s, parseInt(b.parentNode.getAttribute("data-part"), 10));
        var g = e.target.closest("[data-goto]");
        if (g) e.stopPropagation;
      });
      self.toggle(s, self.open, true);
    },
    body: function (p) {
      var h = '<p class="wpart__text">' + esc(p.text) + "</p>";
      if (p.starters) {
        var heard = C.workshop.heard || [];
        h += heard.length
          ? '<ul class="wpart__heard">' + heard.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>"
          : '<ul class="wpart__starters">' + p.starters.map(function (t) { return "<li>“" + esc(t) + "”</li>"; }).join("") + '</ul><span class="tag tag--todo">' + icon("pencil") + "Filled in after the interviews</span>";
      }
      if (p.journey) {
        h += '<ol class="wpart__journey">' + p.journey.map(function (t, k) {
          return '<li class="' + (t === "Struggle" ? "is-key" : "") + '">' + esc(t) + "</li>";
        }).join("") + "</ol>";
      }
      if (p.examples) {
        h += '<ul class="wpart__ex">' + p.examples.map(function (x) {
          return '<li><b>' + esc(x.name) + "</b><span>" + x.flow.map(esc).join(' <i class="wpart__arr">→</i> ') + "</span></li>";
        }).join("") + "</ul>";
      }
      if (p.changes) {
        h += '<ul class="wpart__chips">' + p.changes.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
      }
      if (p.n === 5) {
        h += '<button type="button" class="btn btn--sm" data-goto="pilot"><span>See the scorecard</span><span class="btn__arrow">' + icon("arrow-up-right") + "</span></button>";
      }
      return h;
    },
    toggle: function (s, n, instant) {
      this.open = n;
      $$(".wpart", s).forEach(function (li) {
        var on = parseInt(li.getAttribute("data-part"), 10) === n;
        li.classList.toggle("is-open", on);
        $(".wpart__btn", li).setAttribute("aria-expanded", on ? "true" : "false");
      });
    },
  };

  /* ==========================================================================
     9 · The live prototype (embedded, with interest chips and a fallback)
     ========================================================================== */
  var LAB_BASE = "../ai-builders-lab/index.html";
  ctl["build-it-live"] = {
    iframe: null,
    live: false,
    cur: 0,
    timer: 0,
    init: function (s) {
      var self = this;
      self.vp = $("[data-live-viewport]", s);
      self.http = /^https?:$/.test(location.protocol);
      var chips = $("[data-render='live-chips']", s);
      chips.innerHTML = C.builds
        .map(function (b, k) {
          return '<button type="button" aria-pressed="' + (k === 0 ? "true" : "false") + '" data-live-build="' + k + '">' + icon(b.icon) + esc(b.interest) + "</button>";
        })
        .join("");
      chips.addEventListener("click", function (e) {
        var b = e.target.closest("[data-live-build]");
        if (b) self.pick(s, parseInt(b.getAttribute("data-live-build"), 10));
      });
      if (!self.http) self.note(s, "Opened from a file, so the live Lab can't be checked. Run <code>npm run dev</code> for the live version, or try it anyway.", true);
      $("[data-live-load]", s).addEventListener("click", function () {
        self.load(s, true);
      });
      $("[data-live-reset]", s).addEventListener("click", function () {
        self.reset(s);
      });
    },
    src: function () {
      return LAB_BASE + C.builds[this.cur].route + "?embed=1";
    },
    note: function (s, html, show) {
      if (html) $("[data-live-why]", s).innerHTML = html;
      $("[data-live-note]", s).hidden = !show;
    },
    pick: function (s, k) {
      var b = C.builds[k];
      this.cur = k;
      $$("[data-live-build]", s).forEach(function (x, n) {
        x.setAttribute("aria-pressed", n === k ? "true" : "false");
      });
      $("[data-live-url]", s).textContent = "AI Builders Lab · " + b.name;
      $("[data-live-open]", s).setAttribute("href", LAB_BASE + b.route);
      DECK.shots.set($("[data-live-shot]", s), b.screen, b.name);
      if (this.iframe) {
        try {
          this.iframe.contentWindow.location.hash = b.route + "?embed=1";
          this.check(s, 700, false);
          this.guardFocus(s, this.iframe);
        } catch (err) {
          this.load(s, true);
        }
      } else if (this.http) {
        this.load(s, false);
      }
    },
    enter: function (s) {
      if (this.http && !this.iframe) this.load(s, false);
    },
    load: function (s, force) {
      var self = this;
      if (self.iframe) self.iframe.remove();
      clearTimeout(self.timer);
      var f = document.createElement("iframe");
      f.className = "s-live__iframe";
      f.title = "Live AI Builders Lab prototype: " + C.builds[self.cur].name;
      f.src = self.src();
      self.iframe = f;
      self.live = false;
      s.classList.remove("is-live");
      self.setBadge(s, "Connecting", true);
      self.timer = setTimeout(function () {
        if (!self.live) self.fail(s, "The live Lab didn't load here, so this is a screenshot.");
      }, 8000);
      f.addEventListener("load", function () {
        self.check(s, 200, force);
        self.guardFocus(s, f);
        try {
          // A presenter's clicker (PageUp / PageDown) keeps working inside the Lab
          f.contentWindow.document.addEventListener("keydown", function (e) {
            if (e.key === "PageDown") {
              e.preventDefault();
              DECK.next();
            } else if (e.key === "PageUp") {
              e.preventDefault();
              DECK.prev();
            }
          });
        } catch (err) {
          /* file:// or cross-origin: not available */
        }
      });
      f.addEventListener("pointerenter", function () {
        self.touched = true;
      });
      self.vp.appendChild(f);
    },
    /* The Lab focuses its own heading when a page mounts. Unless the presenter
       is using the Lab, give keyboard focus back to the deck. */
    guardFocus: function (s, f) {
      var self = this;
      [60, 400, 1200].forEach(function (ms) {
        setTimeout(function () {
          if (document.activeElement === f && (!active(s) || !self.touched)) {
            f.blur();
            window.focus();
            (active(s) ? s : document.getElementById("deck")).focus({ preventScroll: true });
          }
        }, ms);
      });
    },
    check: function (s, delay, force) {
      var self = this;
      setTimeout(function () {
        var f = self.iframe;
        if (!f) return;
        var ok = false;
        var missing = false;
        try {
          var w = f.contentWindow;
          ok = !!(w && w.CX && w.CX.router);
          var cur = ok && w.CX.router.current;
          missing = !!(cur && cur.page === "notfound");
        } catch (err) {
          ok = !self.http && !!force; // file:// can't be checked: trust a user-initiated load
        }
        if (ok && !missing) {
          clearTimeout(self.timer);
          self.live = true;
          s.classList.add("is-live");
          self.note(s, null, false);
          self.setBadge(s, "Live prototype", false);
        } else if (missing) {
          clearTimeout(self.timer);
          self.live = false;
          s.classList.remove("is-live");
          self.note(s, "This build isn't in this copy of the Lab yet, so this is a screenshot.", true);
          self.setBadge(s, "Screenshot", true);
        }
      }, delay || 0);
    },
    fail: function (s, msg) {
      s.classList.remove("is-live");
      if (this.iframe) this.iframe.remove();
      this.iframe = null;
      this.note(s, esc(msg) + " Run <code>npm run dev</code> from the engagement-deck folder to use the live Lab.", true);
      this.setBadge(s, "Screenshot", true);
    },
    reset: function (s) {
      try {
        var w = this.iframe && this.iframe.contentWindow;
        if (w && w.CX && w.CX.store && w.CX.store.reset) w.CX.store.reset();
      } catch (err) {
        /* file://: just reload */
      }
      if (this.iframe || this.http) this.load(s, true);
    },
    setBadge: function (s, text, off) {
      var b = $("[data-live-badge]", s);
      b.classList.toggle("is-off", !!off);
      $("[data-live-text]", s).textContent = text;
    },
  };

  /* ==========================================================================
     10 · The learning model: Idea → Prompt → Predict → Test → Decide → Explain
          (Prompt to Decide repeats; each round is a new version of the prompt)
     ========================================================================== */
  var MODEL = [
    { label: "Idea", icon: "bulb", shot: "build-lab.jpg", shotLabel: "Choose a build by interest", url: "AI Builders Lab · Choose a build", role: "child", child: "Starts with something they care about: space, sport, music or the planet.", ai: null },
    { label: "Prompt", icon: "chat", shot: "prompt-ladder.jpg", shotLabel: "The prompt ladder", url: "Planet Builder · Prompt", role: "ai", child: "Writes a prompt, one rung of the ladder at a time.", ai: "Builds what it understood, and highlights everything it guessed." },
    { label: "Predict", icon: "eye", shot: "build-planet.jpg", shotLabel: "Planet Builder", url: "Planet Builder · Predict", role: "child", child: "Predicts what will happen before running it.", ai: null },
    { label: "Test", icon: "flask", shot: "build-planet.jpg", shotLabel: "Planet Builder", url: "Planet Builder · Test", role: "both", child: "Runs it and compares the result with the prediction. Cause and effect, in numbers.", ai: "Runs a fair test when asked, and shows the evidence." },
    { label: "Decide", icon: "check", shot: "prompt-ladder.jpg", shotLabel: "The prompt ladder", url: "Planet Builder · Next version", role: "child", child: "Keeps it, changes it or undoes it, then writes the next version of the prompt.", ai: null },
    { label: "Explain", icon: "users", shot: "build-planet.jpg", shotLabel: "Planet Builder", url: "Planet Builder · Explain", role: "child", child: "Explains what they asked, what the AI guessed and how they know it works.", ai: null },
  ];
  var ROLE = { child: ["user", "Child decides"], ai: ["wand", "AI responds"], both: ["users", "Child, with AI"] };
  ctl["learning-model"] = {
    init: function (s) {
      var el = $("[data-render='model-steps']", s);
      var loop = "M1296 150 C1296 205 1250 216 1190 216 H538 C478 216 432 205 432 150";
      el.innerHTML =
        '<svg class="mloop" viewBox="0 0 1728 240" aria-hidden="true"><path class="mstep__track" d="M144 44 H1584"/><path class="mstep__fill" data-model-fill d="M144 44 H1584"/>' +
        '<path class="mloop__track" d="' + loop + '"/><path class="mloop__flow" d="' + loop + '"/><path class="mloop__head" d="M418 168 L432 146 L446 168"/></svg>' +
        '<span class="mloop__label">' + icon("repeat") + "Repeat. Each round is a new version of the prompt.</span>" +
        '<ol class="msteps">' +
        MODEL.map(function (m, k) {
          var r = ROLE[m.role];
          return (
            '<li><button type="button" class="mstep' + (m.role !== "child" ? " mstep--ai" : "") + '" data-mstep="' + k + '" aria-pressed="false"><span class="mstep__n">' + (k + 1) + "</span>" + icon(m.icon, "mstep__ic") + '<span class="mstep__t">' + esc(m.label) + "</span></button>" +
            '<span class="mrole' + (m.role !== "child" ? " mrole--ai" : "") + '">' + icon(r[0]) + r[1] + "</span></li>"
          );
        }).join("") +
        "</ol>";
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-mstep]");
        if (b) DECK.setStep(parseInt(b.getAttribute("data-mstep"), 10));
      });
      var vs = C.builds[0].versions;
      $("[data-render='model-versions']", s).innerHTML =
        '<li class="vitem vitem--idea" data-vi="0"><span class="vitem__v">' + icon("bulb") + '</span><span class="vitem__p">Idea: a planet of my own</span></li>' +
        vs.map(function (v, k) {
          return (
            '<li class="vitem" data-vi="' + (k + 1) + '"><span class="vitem__v">v' + (k + 1) + '</span><span class="vitem__p">“' + esc(v.prompt) + "”</span>" +
            (v.guess ? '<span class="vitem__g">' + icon("help") + "AI guessed: " + esc(v.guess) + "</span>" : "") +
            (k === 2 ? '<span class="vitem__r">' + icon("flask") + "Jump: 0.5 m → 1.0 m</span>" : "") +
            "</li>"
          );
        }).join("") +
        '<li class="vitem vitem--done" data-vi="4"><span class="vitem__v">' + icon("chat") + '</span><span class="vitem__p">Explained: half the gravity, twice the jump</span></li>';
    },
    step: function (s, step, prev, now) {
      var m = MODEL[step] || MODEL[0];
      $$("[data-mstep]", s).forEach(function (b, k) {
        b.setAttribute("aria-pressed", k === step ? "true" : "false");
        b.classList.toggle("is-done", k < step);
      });
      $("[data-model-fill]", s).style.setProperty("--p", step / (MODEL.length - 1));
      s.classList.toggle("is-looping", step === 4);
      var shown = [1, 2, 2, 2, 4, 5][step];
      $$("[data-vi]", s).forEach(function (li) {
        var n = parseInt(li.getAttribute("data-vi"), 10);
        li.classList.toggle("is-on", n < shown);
        li.classList.toggle("is-now", n === shown - 1);
      });
      DECK.shots.set($("[data-model-shot]", s), m.shot, m.shotLabel);
      $("[data-model-url]", s).textContent = m.url;
      var html =
        '<p class="mdet__k">Step ' + (step + 1) + " of 6</p>" +
        '<h3 class="mdet__t">' + icon(m.icon) + esc(m.label) + "</h3>" +
        '<div class="mdet__row"><span class="mdet__who mdet__who--child">' + icon("user") + "The child</span><p>" + esc(m.child) + "</p></div>" +
        '<div class="mdet__row"><span class="mdet__who mdet__who--ai">' + icon("wand") + "The AI</span><p" + (m.ai ? "" : ' class="mdet__none"') + ">" + esc(m.ai || "Nothing. This part belongs to the child.") + "</p></div>";
      var det = $("[data-render='model-detail']", s);
      if (now) det.innerHTML = html;
      else swapContent(det, html);
    },
  };

  /* ==========================================================================
     11 · Same skills, different worlds (3D)
     ========================================================================== */
  function rungOf(skill) {
    var n = 0;
    C.ladder.forEach(function (r) {
      if (r.t === skill) n = r.n;
    });
    return n;
  }
  function hudItem(k, v, mod, attr) {
    return '<div class="hud__i' + (mod ? " hud__i--" + mod : "") + '"' + (attr ? " " + attr : "") + '><span class="hud__k">' + esc(k) + '</span><span class="hud__v">' + esc(v) + "</span>" + (mod === "guess" ? '<span class="hud__tag">AI guessed</span>' : "") + "</div>";
  }
  function yesNo(ok) {
    return '<span class="yn ' + (ok ? "yn--y" : "yn--n") + '">' + icon(ok ? "check" : "close") + (ok ? "Yes" : "No") + "</span>";
  }
  ctl.worlds = {
    cur: 0,
    v: 0,
    beatsLeft: 0,
    init: function (s) {
      var self = this;
      $("[data-render='ladder']", s).innerHTML = C.ladder
        .slice()
        .reverse()
        .map(function (r) {
          return '<li class="rung" data-rung="' + r.n + '"><span class="rung__n">' + r.n + '</span><span class="rung__body"><span class="rung__t">' + esc(r.t) + '</span><span class="rung__s">' + esc(r.s) + "</span></span></li>";
        })
        .join("");
      var tabs = $("[data-render='world-tabs']", s);
      tabs.innerHTML = C.builds
        .map(function (b, k) {
          return '<button type="button" role="tab" id="wtab-' + b.id + '" aria-selected="' + (k === 0 ? "true" : "false") + '" tabindex="' + (k === 0 ? "0" : "-1") + '" data-world="' + k + '">' + icon(b.icon) + esc(b.interest) + "</button>";
        })
        .join("");
      tabs.addEventListener("click", function (e) {
        var b = e.target.closest("[data-world]");
        if (b) self.pick(s, parseInt(b.getAttribute("data-world"), 10));
      });
      tabs.addEventListener("keydown", function (e) {
        var n = C.builds.length;
        var k = self.cur;
        if (e.key === "ArrowRight") k = (k + 1) % n;
        else if (e.key === "ArrowLeft") k = (k - 1 + n) % n;
        else return;
        e.preventDefault();
        self.pick(s, k);
        $('[data-world="' + k + '"]', s).focus();
      });
      $("[data-render='world-panel']", s).addEventListener("click", function (e) {
        var b = e.target.closest("[data-ver]");
        if (b) DECK.setStep(parseInt(b.getAttribute("data-ver"), 10));
      });
      self.fx =
        DECK.scenes && DECK.scenes.worlds
          ? DECK.scenes.worlds($("[data-three='worlds']", s), {
              onBeat: function (hit) {
                self.beat(hit);
              },
              onNight: function (night) {
                self.night(s, night);
              },
            })
          : null;
      self.render(s, 0, true);
    },
    pick: function (s, k) {
      this.cur = k;
      $$("[data-world]", s).forEach(function (b, n) {
        b.setAttribute("aria-selected", n === k ? "true" : "false");
        b.setAttribute("tabindex", n === k ? "0" : "-1");
      });
      $("[data-render='world-tabs']", s).setAttribute("aria-label", "Choose a world. Showing " + C.builds[k].name);
      if (active(s) && DECK.state.step !== 0) DECK.setStep(0);
      else this.render(s, 0, false);
    },
    step: function (s, step, prev, now) {
      this.render(s, step, now);
    },
    render: function (s, v, quiet) {
      var b = C.builds[this.cur];
      var ver = b.versions[v] || b.versions[0];
      this.v = v;
      var rung = rungOf(ver.skill);
      $$("[data-rung]", s).forEach(function (li) {
        li.classList.toggle("is-now", parseInt(li.getAttribute("data-rung"), 10) === rung);
      });
      s.style.setProperty("--wc", colourVar(b.colour));
      var panel =
        '<div class="wp__head"><span class="wp__ic">' + icon(b.icon) + '</span><div><p class="wp__k">Interest: ' + esc(b.interest) + '</p><h3 class="wp__name">' + esc(b.name) + "</h3></div></div>" +
        '<div class="wp__subjects"><span class="wp__sub"><b>Science</b>' + esc(b.science) + '</span><span class="wp__sub"><b>Maths</b>' + esc(b.maths) + "</span></div>" +
        '<ol class="wp__vers">' +
        b.versions
          .map(function (x, k) {
            var st = k === v ? " is-now" : k < v ? " is-done" : "";
            return '<li><button type="button" class="wver' + st + '" data-ver="' + k + '" aria-pressed="' + (k === v ? "true" : "false") + '"><span class="wver__v">' + (k + 1) + '</span><span class="wver__body"><span class="wver__skill">' + esc(x.skill) + '</span><span class="wver__p">' + (x.decide || /^The child/.test(x.prompt) ? esc(x.prompt) : "“" + esc(x.prompt) + "”") + "</span></span></button></li>";
          })
          .join("") +
        "</ol>" +
        '<div class="wp__result">' +
        (ver.guess ? '<p class="wp__guess">' + icon("help") + "AI guessed: " + esc(ver.guess) + "</p>" : "") +
        (ver.predict ? '<p class="wp__predict">' + icon("eye") + esc(ver.predict) + "</p>" : "") +
        '<p class="wp__rt">' + esc(ver.result) + "</p></div>" +
        '<div class="wp__product">' + icon("trophy") + '<span><b>Final product: ' + esc(b.product) + "</b><small>" + esc(b.productNote) + "</small></span></div>";
      var el = $("[data-render='world-panel']", s);
      if (quiet) el.innerHTML = panel;
      else swapContent(el, panel);
      $("[data-render='world-hud']", s).innerHTML = this.hud(b.id, v);
      var fb = $("[data-render='world-fallback']", s);
      if (fb) fb.innerHTML = '<span class="wv__fbic">' + icon(b.icon) + '</span><span class="wv__fbt">' + esc(b.name) + "</span>";
      s.classList.remove("is-night");
      this.thudded = false;
      if (this.fx) this.fx.set(b.id, v);
      if (!quiet) this.sfx(b.id, v);
    },
    hud: function (id, v) {
      if (id === "planet") return hudItem("Gravity", v === 0 ? "1 × Earth" : v === 1 ? "Like Mars" : "½ × Earth", v === 0 ? "guess" : "") + hudItem("Planet", v === 0 ? "Earth-like" : "Small and red", v === 0 ? "guess" : "") + hudItem("Jump", v === 0 ? "0.5 m" : v === 1 ? "1.3 m" : "1.0 m", v === 2 ? "win" : "");
      if (id === "kick") {
        if (v === 0) return hudItem("Angle", "70°", "guess") + hudItem("Result", "Drops short", "bad");
        return (
          '<div class="hud__table"><div class="hud__tr hud__th"><span>Angle</span><span>Over the wall</span><span>On the 21 m target</span></div>' +
          [["30°", true, true], ["45°", true, false], ["60°", true, true]]
            .map(function (r) {
              return '<div class="hud__tr' + (v === 2 && r[2] ? " is-pick" : "") + '"><span>' + r[0] + "</span>" + yesNo(r[1]) + yesNo(r[2]) + "</div>";
            })
            .join("") +
          "</div>"
        );
      }
      if (id === "beat") {
        if (v === 0) return hudItem("Tempo", "AI's choice", "guess") + hudItem("Drums", "AI's choice", "guess");
        if (v === 1) return hudItem("Tempo", "100 BPM", "win") + hudItem("Kick", "Beats 1 and 3") + hudItem("Clap", "Beats 2 and 4");
        return hudItem("Melody", "C D E G", "win") + hudItem("Pitch", "Higher note, faster vibration");
      }
      if (v === 0) return hudItem("Energy", "Solar only", "guess") + hudItem("Lights", "On in the day", "", "data-night");
      return hudItem("Energy", "Solar, wind, battery", "win") + hudItem("Gas backup", "Under 20%") + hudItem("Lights", "On all day and night", "", "data-night");
    },
    sfx: function (id, v) {
      var snd = DECK.sound;
      clearTimeout(this.sfxTimer);
      this.beatsLeft = id === "beat" ? (v === 0 ? 8 : 16) : 0;
      if (!snd) return;
      if (id === "planet" && v === 2)
        this.sfxTimer = setTimeout(function () {
          snd.chime(false);
        }, 1200);
      if (id === "kick" && v === 0)
        this.sfxTimer = setTimeout(function () {
          snd.thud();
        }, 1300);
      if (id === "kick" && v === 2) snd.chime(false);
      if (id === "power" && v === 1)
        this.sfxTimer = setTimeout(function () {
          snd.chime(false);
        }, 700);
    },
    beat: function (hit) {
      if (!this.beatsLeft || !DECK.sound) return;
      this.beatsLeft--;
      if (hit.kick) DECK.sound.kick();
      if (hit.clap) DECK.sound.clap();
      if (hit.note) DECK.sound.note(hit.note);
    },
    night: function (s, night) {
      var b = C.builds[this.cur];
      if (b.id !== "power") return;
      s.classList.toggle("is-night", night);
      var el = $("[data-night] .hud__v", s);
      if (el) el.textContent = this.v === 0 ? (night ? "Blackout" : "On in the day") : night ? "On: battery and wind" : "On all day and night";
      var box = $("[data-night]", s);
      if (box) {
        box.classList.toggle("hud__i--bad", night && this.v === 0);
        box.classList.toggle("hud__i--win", this.v > 0);
      }
      if (night && this.v === 0 && !this.thudded && DECK.sound) {
        this.thudded = true;
        DECK.sound.thud();
      }
    },
    enter: function () {
      if (this.fx) this.fx.start();
    },
    leave: function () {
      if (this.fx) this.fx.stop();
      this.beatsLeft = 0;
      clearTimeout(this.sfxTimer);
    },
    motion: function (s) {
      if (this.fx && active(s)) {
        this.fx.stop();
        this.fx.start();
      }
    },
  };

  /* ==========================================================================
     12 · Six sessions, one build that grows
     ========================================================================== */
  ctl.sessions = {
    cur: 0,
    init: function (s) {
      var self = this;
      var U = C.unit;
      var tabs = $("[data-render='unit-tabs']", s);
      tabs.innerHTML = C.builds
        .map(function (b, k) {
          return '<button type="button" aria-pressed="' + (k === 0 ? "true" : "false") + '" data-ub="' + k + '">' + icon(b.icon) + esc(b.interest) + "</button>";
        })
        .join("");
      tabs.addEventListener("click", function (e) {
        var b = e.target.closest("[data-ub]");
        if (!b) return;
        self.cur = parseInt(b.getAttribute("data-ub"), 10);
        $$("[data-ub]", s).forEach(function (x, n) {
          x.setAttribute("aria-pressed", n === self.cur ? "true" : "false");
        });
        self.render(s, active(s) ? DECK.state.step : 0, false);
      });
      var list = $("[data-render='unit-sessions']", s);
      list.innerHTML = U.sessions
        .map(function (x, k) {
          return '<li><button type="button" class="usess" data-us="' + k + '" aria-pressed="false"><span class="usess__n">S' + x.n + '</span><span class="usess__t">' + esc(x.title) + "</span>" + (x.n === 6 ? '<span class="usess__star">' + icon("star") + "</span>" : "") + "</button></li>";
        })
        .join("");
      list.addEventListener("click", function (e) {
        var b = e.target.closest("[data-us]");
        if (b) DECK.setStep(parseInt(b.getAttribute("data-us"), 10));
      });
      var t = '<div class="tower"><div class="tower__iso">';
      var k;
      for (k = 0; k < 6; k++) t += '<div class="slab" data-slab="' + k + '" style="--i:' + k + '"><span class="slab__top"></span><span class="slab__l"></span><span class="slab__r"></span></div>';
      t += '</div><div class="tower__labels">';
      for (k = 0; k < 6; k++) t += '<span class="tower__lab" data-slabl="' + k + '" style="--i:' + k + '">S' + (k + 1) + "</span>";
      t += '</div><div class="tower__prize" data-prize></div></div>';
      $("[data-render='tower']", s).innerHTML = t;
      var m = '<div class="meter-b"><p class="meter-b__k">Ingredients in a prompt</p><div class="ing">';
      for (k = 0; k < 6; k++) m += '<i data-ing="' + k + '"></i>';
      m += '</div><p class="meter-b__v" data-ing-v></p></div><div class="meter-b"><p class="meter-b__k">AI guesses to spot</p><div class="guesses">';
      for (k = 0; k < 4; k++) m += '<span class="gss" data-gs="' + k + '">' + icon("help") + "</span>";
      m += '</div><p class="meter-b__v" data-gs-v></p></div><div class="meter-b"><p class="meter-b__k">Creator level</p><ol class="lvl">';
      m += U.levels
        .map(function (l, n) {
          return '<li data-lvl="' + n + '"><span class="lvl__dot"></span>' + esc(l) + "</li>";
        })
        .join("");
      m += "</ol></div>";
      $("[data-render='unit-meters']", s).innerHTML = m;
      self.render(s, 0, true);
    },
    step: function (s, step, prev, now) {
      this.render(s, step, now);
      if (!now && step === 5 && prev < 5 && DECK.sound)
        setTimeout(function () {
          DECK.sound.chime(true);
        }, 350);
    },
    render: function (s, step, quiet) {
      var U = C.unit;
      var x = U.sessions[step] || U.sessions[0];
      var b = C.builds[this.cur];
      s.style.setProperty("--uc", colourVar(b.colour));
      $$("[data-us]", s).forEach(function (el, k) {
        el.setAttribute("aria-pressed", k === step ? "true" : "false");
        el.classList.toggle("is-done", k < step);
      });
      $$("[data-slab]", s).forEach(function (el, k) {
        el.classList.toggle("is-on", k <= step);
        el.classList.toggle("is-top", k === step);
      });
      $$("[data-slabl]", s).forEach(function (el, k) {
        el.classList.toggle("is-on", k <= step);
      });
      var prize = $("[data-prize]", s);
      prize.classList.toggle("is-on", step === 5);
      prize.innerHTML = icon("trophy") + "<b>" + esc(b.product) + "</b>";
      $$("[data-ing]", s).forEach(function (el, k) {
        el.classList.toggle("is-on", k < x.ingredients);
      });
      $("[data-ing-v]", s).textContent = x.ingredients + (x.ingredients === 1 ? " ingredient" : " ingredients");
      $$("[data-gs]", s).forEach(function (el, k) {
        el.classList.toggle("is-gone", k >= x.guesses);
      });
      $("[data-gs-v]", s).textContent = x.guesses ? x.guesses + (x.guesses === 1 ? " guess" : " guesses") : "None left to spot";
      $$("[data-lvl]", s).forEach(function (el, k) {
        el.classList.toggle("is-on", k <= x.level);
        el.classList.toggle("is-now", k === x.level);
      });
      var html;
      if (step < 5) {
        var rung = C.ladder[step];
        var ex = null;
        b.versions.forEach(function (v) {
          if (!ex && v.skill === rung.t && !/^The child/.test(v.prompt)) ex = v;
        });
        html =
          '<p class="unow__k">Session ' + x.n + " of 6 · one hour</p>" +
          '<h3 class="unow__t">' + esc(x.title) + "</h3>" +
          '<p class="unow__d">' + esc(x.does) + "</p>" +
          '<p class="unow__ek">In ' + esc(b.name) + "</p>" +
          (ex ? '<p class="unow__ex">“' + esc(ex.prompt) + "”</p>" : '<p class="unow__ex unow__ex--gen">Rung ' + rung.n + ": " + esc(rung.t) + ". " + esc(rung.s) + ".</p>");
      } else {
        html =
          '<p class="unow__k">Session 6 of 6 · the showcase</p><h3 class="unow__t">' + esc(x.title) + "</h3>" +
          '<p class="unow__d">Every child shares a finished product and explains how they built it.</p>' +
          '<ul class="unow__prods">' +
          C.builds
            .map(function (bb) {
              return '<li class="' + (bb.id === b.id ? "is-mine" : "") + '" style="--c:' + colourVar(bb.colour) + '">' + icon(bb.icon) + "<span><b>" + esc(bb.product) + "</b><small>" + esc(bb.productNote) + "</small></span></li>";
            })
            .join("") +
          "</ul>";
      }
      var el = $("[data-render='unit-now']", s);
      if (quiet) el.innerHTML = html;
      else swapContent(el, html);
    },
  };

  /* ==========================================================================
     11 · Then we build: feedback becomes product (signature moment)
     ========================================================================== */
  var PRIORITIES = ["Pedagogy", "Student learning experience", "Instructor experience", "AI behaviour", "Games and exercises", "School deployment", "Visual polish"];
  var SHUFFLED = [6, 3, 0, 5, 1, 4, 2];
  ctl["then-we-build"] = {
    sorted: false,
    timers: [],
    init: function (s) {
      this.fx = DECK.scenes && DECK.scenes.flow ? DECK.scenes.flow($("[data-three='flow']", s)) : null;
      var list = $("[data-render='priorities']", s);
      list.innerHTML = SHUFFLED.map(function (k) {
        return '<li class="pcard" data-prio="' + k + '"><span class="pcard__n">' + (k + 1) + '</span><span class="pcard__t">' + esc(PRIORITIES[k]) + "</span></li>";
      }).join("");
    },
    clear: function () {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      $$(".bubble-ghost").forEach(function (g) {
        g.remove();
      });
    },
    later: function (fn, ms) {
      this.timers.push(setTimeout(fn, ms));
    },
    step: function (s, step, prev, now) {
      var self = this;
      self.clear();
      var instant = now || reduced();
      // journey nodes
      var lit = step >= 3 ? 4 : step >= 2 ? 3 : step >= 1 ? 2 : 0;
      $$("[data-j]", s).forEach(function (li) {
        var j = parseInt(li.getAttribute("data-j"), 10);
        li.classList.toggle("is-on", j <= lit);
        li.classList.toggle("is-now", j === lit);
      });

      // bubbles → product changes
      var bubbles = $$("[data-bubble]", s);
      if (step >= 2) {
        if (instant || prev >= 2) {
          bubbles.forEach(function (b) {
            b.classList.add("is-done");
          });
          $$("[data-change]", s).forEach(function (t) {
            t.classList.add("is-changed");
          });
          $$("[data-result]", s).forEach(function (r) {
            r.classList.add("is-on");
          });
        } else {
          bubbles.forEach(function (b, k) {
            var n = b.getAttribute("data-bubble");
            var target = $('[data-change="' + n + '"]', s);
            self.later(function () {
              self.fly(s, b, target, function () {
                if (DECK.sound) DECK.sound.tick(1500 + k * 120);
                target.classList.add("is-changed");
                b.classList.add("is-done");
                var r = $('[data-result="' + n + '"]', s);
                if (r) r.classList.add("is-on");
              });
            }, k * 520);
          });
        }
      } else {
        bubbles.forEach(function (b) {
          b.classList.remove("is-done");
        });
        $$("[data-change]", s).forEach(function (t) {
          t.classList.remove("is-changed");
        });
        $$("[data-result]", s).forEach(function (r) {
          r.classList.remove("is-on");
        });
      }

      // prototype → updated AI Lab
      var app = $(".s-sprint__app", s);
      var updated = step >= 3;
      app.classList.toggle("is-updated", updated);
      $("[data-app-name]", s).textContent = updated ? "Updated AI Lab" : "Prototype";
      $("[data-app-ver]", s).textContent = updated ? "v0.2" : "v0.1";
      if (updated && !instant && prev < 3) {
        app.classList.remove("is-pop");
        void app.offsetWidth;
        app.classList.add("is-pop");
        var ar = rectIn(app, s);
        if (self.fx) self.fx.burst({ x: ar.x + ar.w / 2, y: ar.y + ar.h / 2, w: ar.w, h: ar.h });
        if (DECK.sound) DECK.sound.chime(true);
      }

      // priorities sort themselves (FLIP)
      self.sort(s, step >= 4, instant);
    },
    fly: function (s, bubble, target, done) {
      if (!bubble || !target) return done();
      var a = rectIn(bubble, s);
      var b = rectIn(target, s);
      var ghost = bubble.cloneNode(true);
      ghost.classList.add("bubble-ghost");
      ghost.removeAttribute("data-bubble");
      ghost.removeAttribute("data-build");
      ghost.style.left = a.x + "px";
      ghost.style.top = a.y + "px";
      ghost.style.width = a.w + "px";
      s.appendChild(ghost);
      var dx = b.x + b.w / 2 - (a.x + a.w / 2);
      var dy = b.y + b.h / 2 - (a.y + a.h / 2);
      if (this.fx) this.fx.stream({ x: a.x + a.w / 2, y: a.y + a.h / 2 }, { x: b.x + b.w / 2, y: b.y + b.h / 2 });
      var anim = ghost.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: "translate(" + dx * 0.55 + "px," + (dy * 0.55 - 70) + "px) scale(.75)", opacity: 1, offset: 0.6 },
          { transform: "translate(" + dx + "px," + dy + "px) scale(.25)", opacity: 0 },
        ],
        { duration: 900, easing: "cubic-bezier(.55,0,.3,1)", fill: "forwards" }
      );
      anim.onfinish = function () {
        ghost.remove();
        done();
      };
    },
    sort: function (s, on, instant) {
      if (on === this.sorted) return;
      this.sorted = on;
      var list = $("[data-render='priorities']", s);
      var items = $$(".pcard", list);
      var first = {};
      items.forEach(function (it) {
        first[it.getAttribute("data-prio")] = it.offsetLeft;
      });
      var order = on ? [0, 1, 2, 3, 4, 5, 6] : SHUFFLED;
      order.forEach(function (k) {
        list.appendChild($('[data-prio="' + k + '"]', list));
      });
      s.classList.toggle("is-sorted", on);
      if (instant || !list.animate) return;
      items.forEach(function (it, n) {
        var dx = first[it.getAttribute("data-prio")] - it.offsetLeft;
        if (!dx) return;
        it.animate(
          [
            { transform: "translate(" + dx + "px,0)" },
            { transform: "translate(" + dx * 0.5 + "px," + (n % 2 ? -46 : 46) + "px) rotate(" + (n % 2 ? -4 : 4) + "deg)", offset: 0.5 },
            { transform: "none" },
          ],
          { duration: 900, delay: n * 40, easing: "cubic-bezier(.6,0,.3,1)" }
        );
      });
    },
    leave: function () {
      this.clear();
    },
  };

  /* ==========================================================================
     13 · Success scorecard (tabs)
     ========================================================================== */
  ctl.pilot = {
    cur: 0,
    init: function (s) {
      var self = this;
      var groups = C.scorecard.groups;
      var tabs = $("[data-render='score-tabs']", s);
      tabs.innerHTML = groups
        .map(function (g, k) {
          return '<button type="button" role="tab" id="sc-tab-' + g.id + '" aria-controls="sc-panel" aria-selected="false" tabindex="-1" data-tab="' + k + '">' + icon(g.icon) + esc(g.name) + "</button>";
        })
        .join("");
      $("[data-render='score-panel']", s).id = "sc-panel";
      tabs.addEventListener("click", function (e) {
        var b = e.target.closest("[data-tab]");
        if (b) self.show(s, parseInt(b.getAttribute("data-tab"), 10), true);
      });
      tabs.addEventListener("keydown", function (e) {
        var n = groups.length;
        var k = self.cur;
        if (e.key === "ArrowRight") k = (k + 1) % n;
        else if (e.key === "ArrowLeft") k = (k - 1 + n) % n;
        else if (e.key === "Home") k = 0;
        else if (e.key === "End") k = n - 1;
        else return;
        e.preventDefault();
        self.show(s, k, true);
        $('[data-tab="' + k + '"]', s).focus();
      });
      self.show(s, 0, false);
    },
    show: function (s, k, animate) {
      this.cur = k;
      var g = C.scorecard.groups[k];
      var targets = C.scorecard.targets || {};
      $$("[data-tab]", s).forEach(function (b, n) {
        b.setAttribute("aria-selected", n === k ? "true" : "false");
        b.setAttribute("tabindex", n === k ? "0" : "-1");
      });
      var panel = $("[data-render='score-panel']", s);
      panel.setAttribute("aria-labelledby", "sc-tab-" + g.id);
      var html =
        '<p class="sc__q" style="--c:' + colourVar(g.colour) + '">' + esc(g.question) + "</p>" +
        '<div class="sc__table"><div class="sc__row sc__row--head"><span>Measure</span><span>How we would see it</span><span>Target</span></div>' +
        g.measures
          .map(function (m) {
            var t = targets[m.name];
            return '<div class="sc__row"><span class="sc__m">' + esc(m.name) + '</span><span class="sc__how">' + esc(m.how) + "</span>" + (t ? '<span class="sc__t sc__t--set">' + esc(t) + "</span>" : '<span class="sc__t">To agree</span>') + "</div>";
          })
          .join("") +
        "</div>";
      if (animate) swapContent(panel, html);
      else panel.innerHTML = html;
    },
  };

  /* ==========================================================================
     14 · Test the real world: the Lab and everything it depends on
     ========================================================================== */
  var CORE = { x: 512, y: 320 };
  var SATS = [
    { id: "instructor", label: "Instructor", icon: "board", x: 168, y: 196, groups: [{ h: "Classroom", items: ["Instructor workflow", "Lesson timing"] }, { h: "Accounts", items: ["Instructor access", "Class management"] }] },
    { id: "school", label: "School", icon: "school", x: 512, y: 70, groups: [{ h: "Data", items: ["Minimum required data", "Retention", "School requirements"] }] },
    { id: "students", label: "Students", icon: "users", x: 856, y: 196, groups: [{ h: "Accounts", items: ["Student access", "Authentication"] }, { h: "Classroom", items: ["Student workflow"] }] },
    { id: "devices", label: "Laptops & Chromebooks", icon: "laptop", x: 856, y: 444, groups: [{ h: "Devices", items: ["Graphics performance for 3D", "Sound and headphones", "Browsers and screen sizes"] }] },
    { id: "display", label: "Classroom display", icon: "display", x: 512, y: 570, groups: [{ h: "Classroom", items: ["Projector or display", "Sound in the room"] }] },
    { id: "network", label: "School network", icon: "wifi", x: 168, y: 444, groups: [{ h: "Network", items: ["Firewall", "Allowlisting", "External APIs", "Latency", "Blocked resources"] }] },
  ];
  var CORE_CHECK = { label: "AI Builders Lab", icon: "layers", groups: [{ h: "Reliability", items: ["Failures", "Recovery", "Fallback modes", "Support needs"] }, { h: "Offline", items: ["Example AI built in", "Runs if a service is blocked"] }] };

  ctl["real-world"] = {
    sel: null,
    raf: 0,
    init: function (s) {
      var self = this;
      var svg = $("[data-render='real-links']", s);
      var html = "";
      SATS.forEach(function (p, k) {
        var mx = (CORE.x + p.x) / 2 + (p.y < CORE.y ? 0 : 0);
        var my = (CORE.y + p.y) / 2 + (p.x === CORE.x ? 0 : p.y < CORE.y ? -26 : 26);
        html += '<path class="draw real__link" data-build="1" id="real-link-' + p.id + '" style="--d:' + k * 120 + 'ms" d="M' + CORE.x + " " + CORE.y + " Q" + mx + " " + my + " " + p.x + " " + p.y + '"/>';
      });
      html += '<g class="real__pulses" data-pulses></g>';
      svg.innerHTML = html;
      $("[data-render='real-sats']", s).innerHTML = SATS.map(function (p, k) {
        return '<button type="button" class="sat" data-sat="' + p.id + '" data-build="1" aria-pressed="false" style="left:' + p.x + "px;top:" + p.y + "px;--d:" + (250 + k * 120) + 'ms"><span class="sat__ic">' + icon(p.icon) + '</span><span class="sat__t">' + esc(p.label) + '</span><span class="sat__ok" aria-hidden="true">' + icon("check") + "</span></button>";
      }).join("");
      s.addEventListener("click", function (e) {
        var b = e.target.closest("[data-sat]");
        if (!b) return;
        var id = b.getAttribute("data-sat");
        self.select(s, self.sel === id ? null : id, true);
      });
      self.select(s, null, false);
    },
    select: function (s, id, animate) {
      this.sel = id;
      $$("[data-sat]", s).forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-sat") === id ? "true" : "false");
      });
      var html;
      if (!id) {
        html =
          '<p class="rcheck__k">' + icon("tool") + "What we check after the first deployments</p>" +
          '<ul class="rcheck__chips">' + ["Devices", "Network", "Firewall", "Accounts", "Classroom", "Support"].map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
          '<p class="rcheck__hint">' + icon("pointer") + "Choose any part of the diagram for the detail.</p>";
      } else {
        var p = id === "core" ? CORE_CHECK : SATS.filter(function (x) { return x.id === id; })[0];
        html =
          '<p class="rcheck__k">' + icon(p.icon) + esc(p.label) + "</p>" +
          '<div class="rcheck__groups">' + p.groups.map(function (g) {
            return '<div class="rcheck__g"><p class="rcheck__h">' + esc(g.h) + '</p><ul class="rcheck__list">' + g.items.map(function (t) { return "<li>" + icon("check") + esc(t) + "</li>"; }).join("") + "</ul></div>";
          }).join("") + "</div>";
      }
      var el = $("[data-render='real-check']", s);
      if (animate) swapContent(el, html);
      else el.innerHTML = html;
    },
    step: function (s, step) {
      this.stopPulse();
      s.classList.toggle("is-flowing", step >= 2);
      if (step >= 2 && active(s)) this.pulse(s);
      if (step < 2) $$("[data-flow]", s).forEach(function (li) { li.classList.remove("is-on"); });
    },
    pulse: function (s) {
      var self = this;
      var g = $("[data-pulses]", s);
      g.innerHTML = "";
      var paths = $$(".real__link", s);
      var dots = paths.map(function () {
        var c = svgEl("circle", { r: 11, class: "real__pulse" });
        g.appendChild(c);
        return c;
      });
      var flow = $$("[data-flow]", s);
      if (reduced()) {
        flow.forEach(function (li) { li.classList.add("is-on"); });
        dots.forEach(function (d) { d.setAttribute("opacity", 0); });
        return;
      }
      var lens = paths.map(function (p) { return p.getTotalLength(); });
      var T = 4800;
      var t0 = performance.now();
      function frame(now) {
        var t = (now - t0) % T;
        var phase = Math.min(3, Math.floor(t / 1200));
        flow.forEach(function (li, k) {
          li.classList.toggle("is-on", k === phase);
        });
        paths.forEach(function (p, k) {
          var f;
          if (t < 3600) f = t / 3600;
          else f = 1 - (t - 3600) / 1200;
          var pt = p.getPointAtLength(lens[k] * Math.max(0, Math.min(1, f)));
          dots[k].setAttribute("cx", pt.x);
          dots[k].setAttribute("cy", pt.y);
          dots[k].setAttribute("class", "real__pulse" + (t >= 3600 ? " real__pulse--back" : ""));
        });
        $$("[data-sat]", s).forEach(function (b) {
          b.classList.toggle("is-ok", t > 3300 && t < 3900);
        });
        self.raf = requestAnimationFrame(frame);
      }
      self.raf = requestAnimationFrame(frame);
    },
    stopPulse: function () {
      cancelAnimationFrame(this.raf);
    },
    leave: function () {
      this.stopPulse();
    },
    motion: function (s) {
      if (active(s) && DECK.state.step >= 2) {
        this.stopPulse();
        this.pulse(s);
      }
    },
  };

  /* ==========================================================================
     15 · Learn from every class: feedback tokens flow through the month
     ========================================================================== */
  var TOKENS = [
    { t: "Child's explanation", ic: "chat", c: "lime" },
    { t: "Lesson timing", ic: "clock", c: "teal" },
    { t: "IT ticket", ic: "wifi", c: "orange" },
    { t: "Stuck moment", ic: "help", c: "lime" },
    { t: "Parent question", ic: "school", c: "pink" },
    { t: "Error report", ic: "bug", c: "orange" },
    { t: "Activity idea", ic: "bulb", c: "teal" },
    { t: "Prompt tweak", ic: "board", c: "pink" },
  ];
  ctl.learn = {
    timers: [],
    init: function (s) {
      var list = C.releases || [];
      var r = list[list.length - 1];
      if (!r) return;
      $(".sharecard__t", s).textContent = r.month ? "What changed in " + r.month : "What changed and why";
      $(".sharecard__s", s).textContent = (r.changed || "") + (r.why ? " Why: " + r.why : "");
    },
    step: function (s, step, prev, now) {
      // cycle indicator
      var map = [1, 2, 3, 5, 6];
      var lit = map[step] || 1;
      $$("[data-c]", s).forEach(function (li) {
        var c = parseInt(li.getAttribute("data-c"), 10);
        li.classList.toggle("is-on", c < lit);
        li.classList.toggle("is-now", c === lit - 1);
      });
      if (now || reduced() || step <= prev) return;
      var from = [".s-learn__col--src", ".s-learn__col--review", ".s-learn__col--backlog", ".s-learn__col--backlog"][step - 1];
      var to = [".s-learn__col--review", ".s-learn__col--backlog", ".release", ".sharecard"][step - 1];
      if (from && to) this.flow(s, $(from, s), $(to, s), step === 4 ? 3 : 6);
    },
    flow: function (s, fromEl, toEl, n) {
      var layer = $("[data-render='learn-tokens']", s);
      var flowEl = $(".s-learn__flow", s);
      var a = rectIn(fromEl, flowEl);
      var b = rectIn(toEl, flowEl);
      for (var k = 0; k < n; k++) {
        (function (k) {
          var tk = TOKENS[(k + Math.floor(Math.random() * 8)) % TOKENS.length];
          var el = document.createElement("span");
          el.className = "token token--" + tk.c;
          el.innerHTML = icon(tk.ic) + esc(tk.t);
          var sx = a.x + a.w * 0.5 - 90;
          var sy = a.y + 60 + (k / n) * Math.max(60, a.h - 160);
          var ex = b.x + b.w * 0.5 - 90;
          var ey = b.y + 70 + Math.random() * Math.max(40, b.h - 170);
          el.style.left = sx + "px";
          el.style.top = sy + "px";
          layer.appendChild(el);
          var anim = el.animate(
            [
              { transform: "translate(0,0) scale(.6)", opacity: 0 },
              { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0.15 },
              { transform: "translate(" + (ex - sx) * 0.5 + "px," + ((ey - sy) * 0.5 - 50) + "px) scale(1)", opacity: 1, offset: 0.6 },
              { transform: "translate(" + (ex - sx) + "px," + (ey - sy) + "px) scale(.7)", opacity: 0 },
            ],
            { duration: 1500, delay: k * 140, easing: "cubic-bezier(.5,0,.3,1)", fill: "both" }
          );
          anim.onfinish = function () {
            el.remove();
          };
        })(k);
      }
    },
    leave: function (s) {
      $("[data-render='learn-tokens']", s).innerHTML = "";
    },
  };

  /* ==========================================================================
     18 · Then do it again: an orbit that never stops
     ========================================================================== */
  var STATIONS = [
    { t: "Listen", c: "lime", at: 0.0 },
    { t: "Build", c: "teal", at: 0.2 },
    { t: "Deploy", c: "pink", at: 0.4 },
    { t: "Learn", c: "orange", at: 0.6 },
    { t: "Improve", c: "white", at: 0.8 },
  ];
  ctl.again = {
    raf: 0,
    init: function (s) {
      var svg = $("[data-render='track']", s);
      var cx = 590;
      var cy = 420;
      var rx = 470;
      var ry = 270;
      var d = "M" + (cx - rx) + " " + cy + " A" + rx + " " + ry + " 0 1 1 " + (cx + rx) + " " + cy + " A" + rx + " " + ry + " 0 1 1 " + (cx - rx) + " " + cy + " Z";
      var trail = "";
      for (var k = 0; k < 14; k++) trail += '<circle r="' + (13 - k * 0.7).toFixed(1) + '" opacity="' + (0.5 - k * 0.034).toFixed(2) + '"/>';
      svg.innerHTML =
        '<defs><radialGradient id="orbGlow"><stop offset="0" stop-color="#dbe751" stop-opacity=".95"/><stop offset=".4" stop-color="#dbe751" stop-opacity=".35"/><stop offset="1" stop-color="#dbe751" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="orbCore"><stop offset="0" stop-color="#49a7a9" stop-opacity=".45"/><stop offset="1" stop-color="#49a7a9" stop-opacity="0"/></radialGradient></defs>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="330" ry="250" fill="url(#orbCore)"/>' +
        '<path class="orb__band" d="' + d + '"/><path class="orb__line" d="' + d + '"/><path class="orb__dash" d="' + d + '"/>' +
        '<path class="orb__ghost" data-track d="' + d + '"/>' +
        '<g class="orb__trail" data-trail>' + trail + "</g>" +
        '<g data-car><circle r="58" fill="url(#orbGlow)"/><circle class="orb__comet" r="17"/></g>';
      var path = $("[data-track]", s);
      var len = path.getTotalLength();
      $("[data-render='stations']", s).innerHTML = STATIONS.map(function (x, n) {
        var p = path.getPointAtLength(len * x.at);
        return '<span class="station station--' + x.c + '" data-station="' + n + '" style="left:' + p.x.toFixed(1) + "px;top:" + p.y.toFixed(1) + 'px"><span class="station__n">' + (n + 1) + "</span>" + esc(x.t) + "</span>";
      }).join("");
      this.path = path;
      this.len = len;
    },
    enter: function (s) {
      this.run(s);
    },
    run: function (s) {
      var self = this;
      cancelAnimationFrame(self.raf);
      var car = $("[data-car]", s);
      var dots = $$("[data-trail] circle", s);
      var count = $("[data-cycle]", s);
      var stations = $$("[data-station]", s);
      var lap = 9000;
      var t0 = performance.now() - 300;
      var cycle = 1;
      count.textContent = "01";
      function at(f) {
        return self.path.getPointAtLength(self.len * (((f % 1) + 1) % 1));
      }
      function place(f) {
        var p = at(f);
        car.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
        dots.forEach(function (d, k) {
          var q = at(f - (k + 1) * 0.006);
          d.setAttribute("cx", q.x.toFixed(1));
          d.setAttribute("cy", q.y.toFixed(1));
        });
      }
      if (reduced()) {
        place(0.03);
        stations.forEach(function (el) {
          el.classList.add("is-hit");
        });
        return;
      }
      var lastLap = 0;
      function frame(now) {
        var el = now - t0;
        var f = (el % lap) / lap;
        var lapN = Math.floor(el / lap);
        if (lapN !== lastLap) {
          lastLap = lapN;
          cycle = (cycle % 99) + 1;
          count.textContent = (cycle < 10 ? "0" : "") + cycle;
          if (count.animate) count.animate([{ transform: "scale(1.25)" }, { transform: "none" }], { duration: 500, easing: "cubic-bezier(.34,1.56,.64,1)" });
        }
        place(f);
        stations.forEach(function (st, k) {
          var dd = f - STATIONS[k].at;
          if (dd < 0) dd += 1;
          st.classList.toggle("is-hit", dd < 0.08);
        });
        self.raf = requestAnimationFrame(frame);
      }
      self.raf = requestAnimationFrame(frame);
    },
    leave: function () {
      cancelAnimationFrame(this.raf);
    },
    motion: function (s) {
      if (active(s)) this.run(s);
    },
  };

  /* ==========================================================================
     17 · From one class to a network
     ========================================================================== */
  var GROW = [
    { t: "Instructor", s: "One trained instructor", n: 1 },
    { t: "Classes", s: "The same lesson, many classes", n: 3 },
    { t: "Schools", s: "Working with school IT", n: 5 },
    { t: "Clubs", s: "Across the club network", n: 7 },
    { t: "Regions", s: "Regional training and support", n: 5 },
    { t: "Wider network", s: "UK and international partners", n: 1 },
  ];
  ctl.network = {
    init: function (s) {
      // ComputerXplorers today
      $("[data-render='today']", s).innerHTML = (C.today || [])
        .map(function (f) {
          return '<li><span class="num s-net__num" data-count="' + f.value + '" data-prefix="' + esc(f.prefix || "") + '" data-suffix="' + esc(f.suffix || "") + '">' + esc((f.prefix || "") + Number(f.value).toLocaleString("en-GB") + (f.suffix || "")) + '</span><span class="s-net__fl">' + esc(f.label) + '</span><span class="s-net__src">' + esc(f.source) + "</span></li>";
        })
        .join("");

      // growth diagram
      var Wd = 1144;
      var Hd = 640;
      var cols = GROW.length;
      var colX = function (k) {
        return 70 + k * ((Wd - 140) / (cols - 1));
      };
      var nodes = GROW.map(function (g, k) {
        var out = [];
        for (var n = 0; n < g.n; n++) {
          var y = g.n === 1 ? Hd / 2 : 70 + n * ((Hd - 140) / (g.n - 1));
          out.push({ x: colX(k), y: y });
        }
        return out;
      });
      var links = "";
      for (var k = 1; k < cols; k++) {
        nodes[k].forEach(function (b, j) {
          // connect each node to the nearest one or two nodes on the left
          var prevNodes = nodes[k - 1].slice().sort(function (p, q) {
            return Math.abs(p.y - b.y) - Math.abs(q.y - b.y);
          });
          prevNodes.slice(0, Math.min(2, prevNodes.length)).forEach(function (a, m) {
            var mx = (a.x + b.x) / 2;
            links += '<path class="draw grow__link" data-build="' + k + '" style="--d:' + (m * 80 + j * 40) + 'ms" d="M' + a.x + " " + a.y + " C" + mx + " " + a.y + " " + mx + " " + b.y + " " + b.x + " " + b.y + '"/>';
          });
        });
      }
      var html = '<svg class="grow__svg" viewBox="0 0 ' + Wd + " " + Hd + '" aria-hidden="true">' + links + "</svg>";
      nodes.forEach(function (col, k) {
        col.forEach(function (p, n) {
          var big = k === 0 || k === cols - 1;
          html += '<span class="gnode gnode--' + k + (big ? " gnode--big" : "") + '"' + (k ? ' data-build="' + k + '"' : ' data-a="pop"') + ' style="left:' + p.x + "px;top:" + p.y + "px;--d:" + (k ? 200 + n * 70 : 400) + 'ms">' + (k === 0 ? icon("board") : k === cols - 1 ? icon("globe") : k === 4 ? icon("map") : "") + "</span>";
        });
        html += '<p class="glabel"' + (k ? ' data-build="' + k + '"' : ' data-a="up"') + ' style="left:' + colX(k) + 'px;--d:' + (k ? 150 : 500) + 'ms"><b>' + esc(GROW[k].t) + "</b><span>" + esc(GROW[k].s) + "</span></p>";
      });
      $("[data-render='grow']", s).innerHTML = html;
    },
  };

  /* ==========================================================================
     19 · What we need, and what we commit to
     ========================================================================== */
  var NEEDS = [
    { ask: "People", askd: "Access to curriculum and delivery leaders", give: "We listen first", gived: "and keep every call to 20 minutes", icon: "users" },
    { ask: "Time", askd: "20-minute interviews and the workshop", give: "We come prepared", gived: "with the prototype ready to change in the room", icon: "clock" },
    { ask: "Expertise", askd: "Honest feedback on pedagogy", give: "Pedagogy comes first", gived: "ahead of features and polish", icon: "book" },
    { ask: "Pilot access", askd: "The right instructors, classes and schools", give: "We support every pilot", gived: "and keep children's data to a minimum", icon: "school" },
    { ask: "Deployment feedback", askd: "Technical and operational, good and bad", give: "We fix what fails first", gived: "and document what schools need", icon: "tool" },
    { ask: "Decision-making", askd: "Clear feedback on priorities", give: "We stop at every gate", gived: "and decide together with you", icon: "gate" },
  ];
  ctl["we-need"] = {
    init: function (s) {
      $("[data-render='needs']", s).innerHTML = NEEDS.map(function (n, k) {
        var d = 300 + k * 130;
        return (
          '<li class="need">' +
          '<div class="need__ask" data-a="left" style="--d:' + d + 'ms"><span class="need__ic">' + icon(n.icon) + '</span><div><b>' + esc(n.ask) + "</b><span>" + esc(n.askd) + "</span></div></div>" +
          '<svg class="need__link" viewBox="0 0 240 80" aria-hidden="true"><path class="draw need__l1" style="--d:' + (d + 350) + 'ms" d="M0 40 H86"/><path class="draw need__l2" style="--d:' + (d + 350) + 'ms" d="M240 40 H154"/>' +
          '<g class="need__knot" style="--d:' + (d + 700) + 'ms"><circle cx="104" cy="40" r="24"/><circle cx="136" cy="40" r="24"/></g></svg>' +
          '<div class="need__give" data-a="right" style="--d:' + (d + 150) + 'ms"><div><b>' + esc(n.give) + "</b><span>" + esc(n.gived) + '</span></div><span class="need__ok">' + icon("check") + "</span></div>" +
          "</li>"
        );
      }).join("");
    },
  };

  /* ==========================================================================
     20 · Five gates, decided together
     ========================================================================== */
  var GATE_STAGES = ["Listen", "Co-design", "Build", "Pilot", "Deploy", "Scale"];
  ctl.gates = {
    init: function (s) {
      var gates = C.gates;
      var stage = (C.progress && C.progress.stage) || "listen";
      var nextGate = { listen: 1, "co-design": 2, build: 3, train: 3, pilot: 4, learn: 5, improve: 5, scale: 5 }[stage] || 1;
      var x0 = 120;
      var x1 = 1608;
      var html = '<svg class="gline__svg" viewBox="0 0 1728 120" aria-hidden="true"><path class="draw gline__track" d="M' + x0 + " 60 H" + x1 + '"/></svg>';
      for (var k = 0; k < 11; k++) {
        var x = x0 + (k * (x1 - x0)) / 10;
        if (k % 2 === 0) {
          var st = GATE_STAGES[k / 2];
          html += '<span class="gstage" data-a="pop" style="left:' + x + "px;--d:" + (250 + k * 60) + 'ms">' + esc(st) + "</span>";
        } else {
          var g = gates[(k - 1) / 2];
          var status = g.status === "passed" ? "Passed" + (g.decision ? ": " + g.decision : "") : g.n === nextGate ? "Next" : "Upcoming";
          html +=
            '<div class="gate" data-gate="' + g.n + '" style="left:' + x + "px;--d:" + (300 + k * 60) + 'ms" data-a="up">' +
            '<div class="gate__arch"><svg viewBox="0 0 120 120" aria-hidden="true"><path class="gate__frame" d="M18 112V60a42 42 0 0 1 84 0v52"/><path class="gate__door gate__door--l" d="M34 112V62a26 26 0 0 1 26-26v76Z"/><path class="gate__door gate__door--r" d="M86 112V62a26 26 0 0 0-26-26v76Z"/></svg><span class="gate__ok">' + icon("check") + "</span></div>" +
            '<div class="gate__card"><p class="gate__n">Gate ' + g.n + '<span class="gate__status gate__status--' + (g.status === "passed" ? "passed" : g.n === nextGate ? "next" : "up") + '">' + esc(status) + "</span></p>" +
            '<p class="gate__after">' + esc(g.after) + "</p>" +
            '<p class="gate__q">' + esc(g.question) + "</p></div></div>";
        }
      }
      $("[data-render='gates']", s).innerHTML = html;
    },
    step: function (s, step, prev, now) {
      if (!now && step > prev && DECK.sound) DECK.sound.chime(false);
      $$("[data-gate]", s).forEach(function (g) {
        var n = parseInt(g.getAttribute("data-gate"), 10);
        g.classList.toggle("is-open", n <= step);
        g.classList.toggle("is-now", n === step);
      });
    },
  };

  /* ==========================================================================
     21 · The partnership loop
     ========================================================================== */
  var LOOP = [
    { id: "listen", t: "Listen", say: "Listen to the people who teach.", c: "lime" },
    { id: "co-design", t: "Co-design", say: "Turn their thinking into activities.", c: "pink" },
    { id: "build", t: "Build", say: "Build those activities into a platform.", c: "teal" },
    { id: "train", t: "Train", say: "Train the people who deliver them.", c: "orange" },
    { id: "pilot", t: "Pilot", say: "Test the experience with real children.", c: "lime" },
    { id: "learn", t: "Learn", say: "Learn from every deployment.", c: "pink" },
    { id: "improve", t: "Improve", say: "Fix what does not work. Keep improving the platform.", c: "teal" },
    { id: "scale", t: "Scale", say: "Then scale it. And listen again.", c: "orange" },
  ];
  // gate n sits after stage index k
  var LOOP_GATES = [
    { n: 1, after: 0 },
    { n: 2, after: 1 },
    { n: 3, after: 2 },
    { n: 4, after: 4 },
    { n: 5, after: 6 },
  ];
  var LC = { x: 1292 - 760, y: 560 - 120, r: 360 }; // centre inside the ring box (box at 760,120)

  ctl.partnership = {
    cur: 0,
    raf: 0,
    hold: 0,
    init: function (s) {
      var self = this;
      var box = $("[data-render='loop']", s);
      var html = "";
      LOOP.forEach(function (st, k) {
        var a = (k / LOOP.length) * Math.PI * 2 - Math.PI / 2;
        var x = LC.x + LC.r * Math.cos(a);
        var y = LC.y + LC.r * Math.sin(a);
        html += '<button type="button" class="lnode lnode--' + st.c + '" data-lnode="' + k + '" aria-pressed="false" data-a="pop" style="left:' + x.toFixed(1) + "px;top:" + y.toFixed(1) + "px;--d:" + (900 + k * 110) + 'ms"><span class="lnode__n">' + (k + 1) + "</span>" + esc(st.t) + "</button>";
      });
      LOOP_GATES.forEach(function (g) {
        var a = ((g.after + 0.5) / LOOP.length) * Math.PI * 2 - Math.PI / 2;
        var x = LC.x + LC.r * Math.cos(a);
        var y = LC.y + LC.r * Math.sin(a);
        html += '<span class="lgate" data-a="pop" style="left:' + x.toFixed(1) + "px;top:" + y.toFixed(1) + "px;--d:" + (1700 + g.n * 90) + 'ms" title="Gate ' + g.n + '">' + icon("gate") + "<b>" + g.n + "</b></span>";
      });
      html += '<span class="lpulse" data-lpulse aria-hidden="true"></span>';
      html +=
        '<div class="lcentre" data-a="scale" style="--d:600ms"><span class="lcentre__bit" data-bit="lime:love:110:0:still"></span><p class="lcentre__t">A living product partnership</p><p class="lcentre__s">Listen <span>→</span> Co-design <span>→</span> Build <span>→</span> Train <span>→</span> Pilot <span>→</span> Learn <span>→</span> Improve <span>→</span> Scale <span>→</span> Listen</p></div>';
      box.innerHTML = html;
      box.addEventListener("click", function (e) {
        var b = e.target.closest("[data-lnode]");
        if (!b) return;
        self.hold = performance.now() + 9000;
        self.select(s, parseInt(b.getAttribute("data-lnode"), 10), true);
      });
      // "We are here"
      var here = (C.progress && C.progress.stage) || "listen";
      var idx = 0;
      LOOP.forEach(function (st, k) {
        if (st.id === here) idx = k;
      });
      this.here = idx;
      $('[data-lnode="' + idx + '"]', s).classList.add("is-here");
      $("[data-render='loop-here']", s).innerHTML = '<span class="here__pin">' + icon("pin") + "We are here</span>" + esc(LOOP[idx].t) + ". " + esc((C.progress && C.progress.status) || "");
      this.select(s, 0, false);
    },
    select: function (s, k, animate) {
      this.cur = k;
      $$("[data-lnode]", s).forEach(function (b, n) {
        b.setAttribute("aria-pressed", n === k ? "true" : "false");
      });
      var st = LOOP[k];
      var gate = LOOP_GATES.filter(function (g) {
        return g.after === k;
      })[0];
      var gq = gate ? C.gates[gate.n - 1] : null;
      var html = '<p class="lsay__k"><span class="lsay__n" style="--c:' + colourVar(st.c) + '">' + (k + 1) + "</span>" + esc(st.t) + '</p><p class="lsay__t">' + esc(st.say) + "</p>" + (gq ? '<p class="lsay__gate">' + icon("gate") + "Then Gate " + gq.n + ": " + esc(gq.question) + "</p>" : "");
      var el = $("[data-render='loop-say']", s);
      if (animate) swapContent(el, html);
      else el.innerHTML = html;
    },
    enter: function (s) {
      this.run(s);
    },
    run: function (s) {
      var self = this;
      cancelAnimationFrame(self.raf);
      var pulse = $("[data-lpulse]", s);
      if (reduced()) {
        pulse.style.opacity = "0";
        return;
      }
      pulse.style.opacity = "";
      var lapMs = 16000;
      var t0 = performance.now() - 1400;
      var last = -1;
      function frame(now) {
        var f = ((now - t0) % lapMs) / lapMs;
        var a = f * Math.PI * 2 - Math.PI / 2;
        pulse.style.left = (LC.x + LC.r * Math.cos(a)).toFixed(1) + "px";
        pulse.style.top = (LC.y + LC.r * Math.sin(a)).toFixed(1) + "px";
        var k = Math.floor(f * LOOP.length + 0.08) % LOOP.length;
        if (k !== last) {
          last = k;
          $$("[data-lnode]", s).forEach(function (b, n) {
            b.classList.toggle("is-lit", n === k);
          });
          if (now > self.hold) self.select(s, k, true);
        }
        self.raf = requestAnimationFrame(frame);
      }
      self.raf = requestAnimationFrame(frame);
    },
    leave: function () {
      cancelAnimationFrame(this.raf);
    },
    motion: function (s) {
      if (active(s)) this.run(s);
    },
  };

  /* ==========================================================================
     1 · Hero: the 3D Lab with interest worlds and the eight-stage orbit
     ========================================================================== */
  ctl.hero = {
    init: function (s) {
      this.fx = DECK.scenes && DECK.scenes.hero ? DECK.scenes.hero($("[data-three='hero']", s)) : null;
      DECK.on("sound:unlocked", function () {
        if (active(s) && DECK.sound) DECK.sound.pad(true);
      });
    },
    enter: function () {
      if (this.fx) this.fx.start();
      if (DECK.sound) DECK.sound.pad(true);
    },
    leave: function () {
      if (this.fx) this.fx.stop();
      if (DECK.sound) DECK.sound.pad(false);
    },
    motion: function (s) {
      if (this.fx && active(s)) {
        this.fx.stop();
        this.fx.start();
      }
    },
  };

  ctl.network.step = function (s, step, prev, now) {
    if (!now && step === 5 && prev < 5 && DECK.sound) DECK.sound.chime(true);
  };

  /* Restart or stop continuous motion when the motion setting changes */
  DECK.on("motion", function () {
    if (!DECK.ready) return;
    Object.keys(ctl).forEach(function (id) {
      var c = ctl[id];
      var s = document.getElementById(id);
      if (c.motion && s) c.motion(s);
    });
  });
})();
