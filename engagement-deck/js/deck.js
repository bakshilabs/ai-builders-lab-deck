/* ==========================================================================
   Deck engine
   - Fixed 1920 × 1080 stage, scaled to fit any window (letterboxed).
   - Slides with entrance choreography (data-a) and in-slide builds
     (data-build="n"): → advances the builds before moving on.
   - Keyboard, buttons, clickable progress, overview, trackpad and swipe.
   - URL hash per slide (#/7) and per build step (#/7/2).
   - The ribbon: one teal PATH that morphs from slide to slide.
   - Reduced motion: honours the OS setting, plus an in-deck toggle (M).
   Slide-specific behaviour lives in js/slides.js (DECK.controllers).
   ========================================================================== */
(function () {
  "use strict";

  var DECK = (window.DECK = window.DECK || {});
  var ui = DECK.ui;
  var W = 1920;
  var H = 1080;
  var root = document.documentElement;

  DECK.controllers = DECK.controllers || {};

  /* ---- tiny helpers ------------------------------------------------------ */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }
  DECK.$ = $;
  DECK.$$ = $$;

  var handlers = {};
  DECK.on = function (name, fn) {
    (handlers[name] = handlers[name] || []).push(fn);
  };
  DECK.emit = function (name, data) {
    (handlers[name] || []).forEach(function (fn) {
      try {
        fn(data);
      } catch (err) {
        console.error(err);
      }
    });
  };

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (err) {
      return null;
    }
    return null;
  }

  /* ---- state --------------------------------------------------------------- */
  var stage, deckEl, slides, total;
  var state = { i: -1, step: 0, overview: false, notes: false };
  var leaveTimers = new WeakMap();

  var BG = {
    navy: "#0b012b",
    "navy-2": "#130742",
    cream: "#f6f3ee",
    teal: "#49a7a9",
    lime: "#dbe751",
    white: "#ffffff",
  };

  var SECTIONS = [
    { id: "listen", label: "Listen" },
    { id: "co-design", label: "Co-design" },
    { id: "build", label: "Build" },
    { id: "train", label: "Train" },
    { id: "pilot", label: "Pilot" },
    { id: "learn", label: "Learn" },
    { id: "improve", label: "Improve" },
    { id: "scale", label: "Scale" },
  ];
  var CONTEXT = { intro: "The idea", partnership: "Partnership", close: "Next steps" };
  DECK.SECTIONS = SECTIONS;

  /* ---- reduced motion ---------------------------------------------------- */
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() {
    return root.classList.contains("reduce-motion");
  }
  DECK.reduced = reduced;
  function applyMotion(on, persist) {
    root.classList.toggle("reduce-motion", !!on);
    var b = $("#btn-motion");
    if (b) {
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.querySelector("span").textContent = on ? "Motion reduced" : "Reduce motion";
    }
    if (persist) store("cx-deck:motion", on ? "reduced" : "full");
    DECK.emit("motion", !!on);
  }

  /* ==========================================================================
     Hydration: icons, Bits, tickers, staggers
     ========================================================================== */
  function hydrate(ctx) {
    $$("[data-icon]", ctx).forEach(function (el) {
      if (el.__icon) return;
      el.__icon = true;
      var span = document.createElement("span");
      span.className = "ic " + (el.className || "");
      span.setAttribute("aria-hidden", "true");
      span.innerHTML = ui.icon(el.getAttribute("data-icon"));
      var svg = span.firstChild;
      if (el.className) svg.setAttribute("class", "i " + el.className);
      el.parentNode.replaceChild(svg, el);
    });
    $$("[data-bit]", ctx).forEach(function (el) {
      if (el.__bit) return;
      el.__bit = true;
      var p = el.getAttribute("data-bit").split(":");
      var mode = p[4] || "";
      el.classList.add("bit");
      if (mode === "slow") el.classList.add("bit--float-slow");
      else if (mode !== "still") el.classList.add("bit--float");
      el.style.setProperty("--size", (p[2] || 110) + "px");
      el.style.setProperty("--rot", (p[3] || -8) + "deg");
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = ui.bitSvg(p[0] || "pink", p[1] || "happy");
    });
    $$("[data-bit-svg]", ctx).forEach(function (el) {
      var p = el.getAttribute("data-bit-svg").split(":");
      var tmp = document.createElement("div");
      tmp.innerHTML = ui.bitSvg(p[0], p[1]);
      el.innerHTML = tmp.firstChild.innerHTML;
    });
    $$("[data-ticker]", ctx).forEach(function (el) {
      if (el.__ticker) return;
      el.__ticker = true;
      var items = el.getAttribute("data-ticker").split("|");
      var wrap = document.createElement("div");
      wrap.innerHTML = ui.ticker(items, { cls: el.getAttribute("data-ticker-cls") || "", speed: el.getAttribute("data-speed") || 40 });
      el.parentNode.replaceChild(wrap.firstChild, el);
    });
    $$("[data-depth]", ctx).forEach(function (el) {
      el.style.setProperty("--depth", el.getAttribute("data-depth"));
    });
    stagger(ctx);
  }

  function stagger(ctx) {
    $$("[data-stagger]", ctx).forEach(function (el) {
      var p = el.getAttribute("data-stagger").split(",");
      var base = parseInt(p[0], 10) || 0;
      var gap = parseInt(p[1], 10) || 80;
      var kids = $$(":scope > [data-a], :scope > [data-build]", el);
      kids.forEach(function (k, n) {
        if (!k.style.getPropertyValue("--d")) k.style.setProperty("--d", base + n * gap + "ms");
      });
    });
  }
  DECK.hydrate = hydrate;

  /* Measure self-drawing strokes once they are in the DOM */
  function measure(ctx) {
    $$(".draw", ctx).forEach(function (p) {
      try {
        var len = Math.ceil(p.getTotalLength());
        if (len > 0) p.style.setProperty("--len", len);
      } catch (err) {
        /* not a geometry element */
      }
    });
  }
  DECK.measure = measure;

  /* ==========================================================================
     Stage scaling
     ========================================================================== */
  function fit() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var s = Math.min(vw / W, vh / H);
    var x = Math.round((vw - W * s) / 2);
    var y = Math.round((vh - H * s) / 2);
    stage.style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")";
    DECK.scale = s;
    DECK.emit("resize", s);
  }

  /* ==========================================================================
     Slides
     ========================================================================== */
  function buildsOf(slide) {
    if (slide.__builds != null) return slide.__builds;
    var n = parseInt(slide.getAttribute("data-builds") || "0", 10) || 0;
    $$("[data-build]", slide).forEach(function (el) {
      n = Math.max(n, parseInt(el.getAttribute("data-build"), 10) || 0);
    });
    slide.__builds = n;
    return n;
  }
  DECK.buildsOf = buildsOf;

  function prepSlides() {
    slides.forEach(function (s, i) {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute("aria-label", i + 1 + " of " + total + ": " + s.getAttribute("data-title"));
      s.setAttribute("tabindex", "-1");
      s.setAttribute("aria-hidden", "true");
      s.inert = true;
      buildsOf(s);
    });
  }

  function controller(slide) {
    return DECK.controllers[slide.id] || {};
  }

  function indexOfId(id) {
    for (var i = 0; i < slides.length; i++) if (slides[i].id === id) return i;
    return -1;
  }
  DECK.indexOfId = indexOfId;

  /* Apply build state for a slide at a step */
  function applyBuilds(slide, step, animateCount) {
    $$("[data-build]", slide).forEach(function (el) {
      var n = parseInt(el.getAttribute("data-build"), 10) || 0;
      var was = el.classList.contains("is-built");
      var on = n <= step;
      el.classList.toggle("is-built", on);
      if (on && !was && animateCount) countIn(el);
      if (!on) resetCounts(el);
    });
    $$("[data-dim-at]", slide).forEach(function (el) {
      el.classList.toggle("is-dimmed", step >= parseInt(el.getAttribute("data-dim-at"), 10));
    });
    slide.setAttribute("data-step", step);
  }

  /* ---- counting numbers -------------------------------------------------- */
  function fmt(n) {
    try {
      return Math.round(n).toLocaleString("en-GB");
    } catch (err) {
      return String(Math.round(n));
    }
  }
  function countEl(el, delay) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (el.__countTimer) clearTimeout(el.__countTimer);
    if (el.__countRaf) cancelAnimationFrame(el.__countRaf);
    if (reduced()) {
      el.textContent = prefix + fmt(target) + suffix;
      return;
    }
    el.textContent = prefix + "0" + suffix;
    el.__countTimer = setTimeout(function () {
      var start = performance.now();
      var dur = parseInt(el.getAttribute("data-dur") || "1500", 10);
      function frame(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 4);
        el.textContent = prefix + fmt(target * e) + suffix;
        if (t < 1) el.__countRaf = requestAnimationFrame(frame);
      }
      el.__countRaf = requestAnimationFrame(frame);
    }, delay || 0);
  }
  function delayOf(el) {
    var d = 0;
    var node = el;
    while (node && node.nodeType === 1 && !node.classList.contains("slide")) {
      var v = node.style && node.style.getPropertyValue("--d");
      if (v) d = Math.max(d, parseInt(v, 10) || 0);
      node = node.parentNode;
    }
    return d;
  }
  function countIn(ctx) {
    var els = ctx.hasAttribute && ctx.hasAttribute("data-count") ? [ctx] : [];
    els = els.concat($$("[data-count]", ctx));
    els.forEach(function (el) {
      countEl(el, delayOf(el) + 250);
    });
  }
  function resetCounts(ctx) {
    $$("[data-count]", ctx).forEach(function (el) {
      if (el.__countTimer) clearTimeout(el.__countTimer);
      if (el.__countRaf) cancelAnimationFrame(el.__countRaf);
    });
  }
  DECK.countIn = countIn;

  /* ---- go to a slide -------------------------------------------------------- */
  function go(i, step, opts) {
    opts = opts || {};
    if (i < 0 || i >= total) return;
    var target = slides[i];
    var max = buildsOf(target);
    step = step == null ? 0 : step === "end" ? max : Math.max(0, Math.min(max, step));

    if (i === state.i) {
      setStep(step);
      return;
    }

    var prev = slides[state.i];
    var dir = state.i < 0 ? 1 : i > state.i ? 1 : -1;
    var focusWasInside = prev && prev.contains(document.activeElement);
    if (document.activeElement && document.activeElement.tagName === "IFRAME") {
      document.activeElement.blur();
      focusWasInside = true;
    }

    if (prev) {
      var pc = controller(prev);
      if (pc.leave) pc.leave(prev);
      prev.style.setProperty("--to", dir > 0 ? "-48px" : "48px");
      prev.classList.remove("is-active");
      prev.classList.add("is-leaving");
      prev.setAttribute("aria-hidden", "true");
      prev.inert = true;
      resetCounts(prev);
      (function (p) {
        clearTimeout(leaveTimers.get(p));
        leaveTimers.set(
          p,
          setTimeout(function () {
            p.classList.remove("is-leaving");
          }, 650)
        );
      })(prev);
    }

    state.i = i;
    state.step = step;

    target.classList.remove("is-leaving");
    clearTimeout(leaveTimers.get(target));
    target.style.setProperty("--from", dir > 0 ? "48px" : "-48px");
    applyBuilds(target, step, false);

    if (opts.instant) root.classList.add("no-anim");
    // force the browser to register the start state, then animate in
    void target.offsetWidth;
    target.classList.add("is-active");
    target.setAttribute("aria-hidden", "false");
    target.inert = false;
    if (opts.instant) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.remove("no-anim");
        });
      });
    }

    // Stage colour, letterbox and ribbon
    var bg = target.getAttribute("data-bg") || "navy";
    stage.setAttribute("data-bg", bg);
    root.style.setProperty("--letterbox", BG[bg] || BG.navy);
    setRibbon(target.getAttribute("data-ribbon") || "none", !!opts.instant);

    var c = controller(target);
    if (c.enter) c.enter(target, step, dir);
    if (c.step) c.step(target, step, -1, true);
    countIn(target);
    // numbers inside unbuilt builds should not count yet
    $$("[data-build]:not(.is-built)", target).forEach(resetCounts);

    updateChrome();
    writeHash();
    announce();
    if (prev && DECK.sound) DECK.sound.whoosh(dir);
    if (state.notes) renderNotes();
    if (focusWasInside || opts.focus) target.focus({ preventScroll: true });
    DECK.emit("slide", { i: i, slide: target, step: step });
  }

  function setStep(step) {
    var slide = slides[state.i];
    var max = buildsOf(slide);
    step = Math.max(0, Math.min(max, step));
    var prevStep = state.step;
    if (step === prevStep) return;
    state.step = step;
    applyBuilds(slide, step, true);
    if (DECK.sound) DECK.sound.pop(step > prevStep ? 1 : -1);
    var c = controller(slide);
    if (c.step) c.step(slide, step, prevStep, false);
    updateChrome();
    writeHash();
    DECK.emit("step", { i: state.i, slide: slide, step: step });
  }
  DECK.setStep = setStep;

  function next() {
    if (state.overview) return;
    var slide = slides[state.i];
    if (state.step < buildsOf(slide)) setStep(state.step + 1);
    else if (state.i < total - 1) go(state.i + 1, 0);
  }
  function prev() {
    if (state.overview) return;
    if (state.step > 0) setStep(state.step - 1);
    else if (state.i > 0) go(state.i - 1, "end");
  }
  DECK.next = next;
  DECK.prev = prev;
  DECK.go = function (idOrIndex, step) {
    var i = typeof idOrIndex === "number" ? idOrIndex : indexOfId(idOrIndex);
    if (i >= 0) go(i, step || 0);
  };
  DECK.state = state;

  /* ==========================================================================
     The ribbon: one PATH that flows from slide to slide.
     Every preset is 4 cubic segments, so any two presets can morph.
     ========================================================================== */
  var RIBBON = {
    hero: {
      d: [2060, -90, 1720, 30, 1470, 290, 1490, 560, 1510, 830, 1760, 1010, 2060, 1170, 2160, 1225, 2220, 1250, 2280, 1270, 2340, 1290, 2400, 1310, 2460, 1330],
      width: 96,
      dash: true,
    },
    proto: {
      d: [1250, 1180, 1360, 1010, 1610, 990, 1770, 870, 1930, 750, 1870, 470, 2010, 300, 2090, 200, 2170, 120, 2250, 60, 2330, 0, 2410, -40, 2490, -80],
      width: 84,
      dash: true,
    },
    listen: {
      d: [-120, 1180, 120, 1010, 380, 1060, 600, 960, 820, 860, 830, 650, 1010, 560, 1190, 470, 1420, 590, 1600, 520, 1780, 450, 1900, 330, 2040, 260],
      width: 64,
      colour: "var(--navy-700)",
      dash: false,
    },
    loop: {
      // a circle centred on (1292, 560), radius 360
      d: [1292, 200, 1490.8, 200, 1652, 361.2, 1652, 560, 1652, 758.8, 1490.8, 920, 1292, 920, 1093.2, 920, 932, 758.8, 932, 560, 932, 361.2, 1093.2, 200, 1292, 200],
      width: 74,
      dash: true,
      drawIn: true,
    },
    close: {
      d: [2060, 1170, 1760, 1060, 1500, 820, 1520, 560, 1540, 300, 1800, 90, 2060, -60, 2160, -110, 2220, -140, 2280, -160, 2340, -180, 2400, -200, 2460, -220],
      width: 96,
      dash: true,
    },
  };
  DECK.RIBBON = RIBBON;

  var ribbon = { el: null, main: null, dash: null, d: null, visible: false, raf: 0 };

  function pathString(a) {
    var s = "M" + a[0].toFixed(1) + " " + a[1].toFixed(1);
    for (var k = 2; k < a.length; k += 6) {
      s += " C" + a[k].toFixed(1) + " " + a[k + 1].toFixed(1) + " " + a[k + 2].toFixed(1) + " " + a[k + 3].toFixed(1) + " " + a[k + 4].toFixed(1) + " " + a[k + 5].toFixed(1);
    }
    return s;
  }
  function setD(a) {
    var s = pathString(a);
    ribbon.main.setAttribute("d", s);
    ribbon.dash.setAttribute("d", s);
    ribbon.d = a.slice();
  }
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function setRibbon(name, instant) {
    var p = RIBBON[name];
    cancelAnimationFrame(ribbon.raf);
    if (!p) {
      ribbon.el.style.setProperty("--ribbon-opacity", 0);
      ribbon.dash.style.opacity = "0";
      ribbon.visible = false;
      return;
    }
    ribbon.el.style.setProperty("--ribbon-colour", p.colour || "var(--teal-400)");
    ribbon.el.style.setProperty("--ribbon-width", (p.width || 70) + "px");
    ribbon.dash.style.opacity = p.dash ? "" : "0";
    var from = ribbon.d;
    if (!ribbon.visible || !from || instant || reduced()) {
      setD(p.d);
      ribbon.el.style.setProperty("--ribbon-opacity", 1);
      if (!ribbon.visible && p.drawIn && !instant && !reduced() && ribbon.main.animate) {
        var len = ribbon.main.getTotalLength();
        ribbon.main.style.strokeDasharray = len;
        var a = ribbon.main.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1600, easing: "cubic-bezier(.65,0,.35,1)" });
        a.onfinish = function () {
          ribbon.main.style.strokeDasharray = "";
        };
      }
      ribbon.visible = true;
      return;
    }
    ribbon.visible = true;
    ribbon.el.style.setProperty("--ribbon-opacity", 1);
    var to = p.d;
    var start = performance.now();
    var dur = 1250;
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var e = ease(t);
      var a = new Array(to.length);
      for (var k = 0; k < to.length; k++) a[k] = from[k] + (to[k] - from[k]) * e;
      setD(a);
      if (t < 1) ribbon.raf = requestAnimationFrame(frame);
    }
    ribbon.raf = requestAnimationFrame(frame);
  }

  /* ==========================================================================
     Chrome: section nav, counter, progress, build hint, notes, overview
     ========================================================================== */
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function buildChrome() {
    var nav = $("#sectionnav");
    var html = '<span class="sectionnav__label" id="sectionnav-label">The idea</span>';
    SECTIONS.forEach(function (s, k) {
      if (k) html += ui.icon("chev-right", "sectionnav__arrow");
      html += '<button type="button" data-section-go="' + s.id + '">' + s.label + "</button>";
    });
    nav.innerHTML = html;
    nav.addEventListener("click", function (e) {
      var b = e.target.closest("[data-section-go]");
      if (!b) return;
      var id = b.getAttribute("data-section-go");
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].getAttribute("data-section") === id) {
          go(i, 0);
          break;
        }
      }
    });

    var prog = $("#progress");
    prog.innerHTML = slides
      .map(function (s, i) {
        return '<button type="button" data-i="' + i + '" aria-label="Slide ' + (i + 1) + ": " + ui.esc(s.getAttribute("data-title")) + '"></button>';
      })
      .join("");
    var tip = $("#progress-tip");
    prog.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (b) go(parseInt(b.getAttribute("data-i"), 10), 0);
    });
    prog.addEventListener("mousemove", function (e) {
      var b = e.target.closest("[data-i]");
      if (!b) return;
      var i = parseInt(b.getAttribute("data-i"), 10);
      tip.innerHTML = "<b>" + pad(i + 1) + "</b>" + ui.esc(slides[i].getAttribute("data-title"));
      var r = b.getBoundingClientRect();
      var sr = stage.getBoundingClientRect();
      var x = (r.left + r.width / 2 - sr.left) / DECK.scale;
      x = Math.max(180, Math.min(W - 180, x));
      tip.style.left = x + "px";
      tip.classList.add("is-on");
    });
    prog.addEventListener("mouseleave", function () {
      tip.classList.remove("is-on");
    });

    // Overview tiles
    var grid = $("#overview-grid");
    grid.innerHTML = slides
      .map(function (s, i) {
        var sec = s.getAttribute("data-section");
        var label = CONTEXT[sec] || (SECTIONS.filter((x) => x.id === sec)[0] || {}).label || "";
        return (
          '<button type="button" class="ovtile" data-i="' + i + '"><span class="ovtile__top"><span class="ovtile__n">' + pad(i + 1) + '</span><span class="ovtile__sec">' + ui.esc(label) + '</span></span><span class="ovtile__t">' + ui.esc(s.getAttribute("data-title")) + "</span></button>"
        );
      })
      .join("");
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-i]");
      if (!b) return;
      closeOverview();
      go(parseInt(b.getAttribute("data-i"), 10), 0, { focus: true });
    });
    $("#overview-title span").textContent = total;
    $("#counter b").textContent = "/ " + pad(total);

    $("#btn-overview").addEventListener("click", function () {
      state.overview ? closeOverview() : openOverview();
    });
    $("#overview-close").addEventListener("click", closeOverview);
    $("#btn-prev").addEventListener("click", prev);
    $("#btn-next").addEventListener("click", next);
    $("#btn-motion").addEventListener("click", function () {
      applyMotion(!reduced(), true);
    });
    $("#btn-notes").addEventListener("click", toggleNotes);
    $("#btn-sound").addEventListener("click", toggleSound);
    updateSoundBtn();
    $("#btn-full").addEventListener("click", toggleFull);

    // data-goto anywhere (CTA buttons, brand pill)
    stage.addEventListener("click", function (e) {
      var g = e.target.closest("[data-goto]");
      if (!g) return;
      e.preventDefault();
      DECK.go(g.getAttribute("data-goto"));
    });

    // Mouse clicks should not leave focus on buttons (so Space keeps advancing)
    stage.addEventListener("click", function (e) {
      var b = e.target.closest("button, a");
      if (b && DECK.sound && !b.closest(".navbtns") && !b.closest("#progress")) DECK.sound.tick();
      if (b && e.detail > 0 && !b.closest(".overview")) {
        setTimeout(function () {
          if (document.activeElement === b) b.blur();
        }, 0);
      }
    });
  }

  function updateChrome() {
    var slide = slides[state.i];
    var sec = slide.getAttribute("data-section");
    var secIdx = -1;
    SECTIONS.forEach(function (s, k) {
      if (s.id === sec) secIdx = k;
    });
    $$("#sectionnav [data-section-go]").forEach(function (b, k) {
      if (k === secIdx) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
      b.classList.toggle("is-past", secIdx > -1 && k < secIdx);
    });
    $("#sectionnav-label").textContent = secIdx > -1 ? "Stage " + (secIdx + 1) + " of 8" : CONTEXT[sec] || "";

    $("#counter").firstChild.nodeValue = pad(state.i + 1) + " ";
    var max = buildsOf(slide);
    $$("#progress [data-i]").forEach(function (b, k) {
      var fill = k < state.i ? 1 : k > state.i ? 0 : (state.step + 1) / (max + 1);
      b.style.setProperty("--fill", fill);
      if (k === state.i) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    $("#btn-prev").disabled = state.i === 0 && state.step === 0;
    $("#btn-next").disabled = state.i === total - 1 && state.step >= max;

    var hint = $("#buildhint");
    if (max > 0) {
      var dots = "";
      for (var k = 0; k <= max; k++) dots += "<i" + (k <= state.step ? ' class="is-done"' : "") + "></i>";
      $("#buildhint-dots").innerHTML = dots;
      hint.classList.toggle("is-on", state.step < max);
    } else {
      hint.classList.remove("is-on");
    }

    $$(".ovtile").forEach(function (t, k) {
      t.setAttribute("aria-current", k === state.i ? "true" : "false");
    });
  }

  function announce() {
    var s = slides[state.i];
    $("#announcer").textContent = "Slide " + (state.i + 1) + " of " + total + ": " + s.getAttribute("data-title");
  }

  /* ---- overview ------------------------------------------------------------- */
  var lastFocus = null;
  function openOverview() {
    state.overview = true;
    lastFocus = document.activeElement;
    var ov = $("#overview");
    ov.classList.add("is-open");
    ov.setAttribute("aria-hidden", "false");
    $("#deck").inert = true;
    var cur = $('.ovtile[data-i="' + state.i + '"]');
    setTimeout(function () {
      (cur || $("#overview-close")).focus();
    }, 30);
  }
  function closeOverview() {
    if (!state.overview) return;
    state.overview = false;
    var ov = $("#overview");
    ov.classList.remove("is-open");
    ov.setAttribute("aria-hidden", "true");
    $("#deck").inert = false;
    if (lastFocus && document.contains(lastFocus) && !lastFocus.closest(".overview")) lastFocus.focus({ preventScroll: true });
  }
  DECK.openOverview = openOverview;
  DECK.closeOverview = closeOverview;

  /* ---- notes ----------------------------------------------------------------- */
  function renderNotes() {
    var s = slides[state.i];
    var t = $("template[data-notes]", s);
    $("#notes-title").textContent = "Notes · " + pad(state.i + 1) + " · " + s.getAttribute("data-title");
    $("#notes-body").innerHTML = t ? t.innerHTML : "<p>No notes for this slide.</p>";
  }
  function toggleNotes() {
    state.notes = !state.notes;
    var n = $("#notes");
    n.classList.toggle("is-open", state.notes);
    n.setAttribute("aria-hidden", state.notes ? "false" : "true");
    $("#btn-notes").setAttribute("aria-pressed", state.notes ? "true" : "false");
    if (state.notes) renderNotes();
  }

  function updateSoundBtn() {
    var b = $("#btn-sound");
    if (!b) return;
    var on = !(DECK.sound && DECK.sound.isMuted());
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-label", "Sound");
    $("[data-snd-ic]", b).innerHTML = ui.icon(on ? "volume" : "volume-off");
    $("[data-snd-label]", b).textContent = on ? "Sound on" : "Sound off";
  }
  function toggleSound() {
    if (!DECK.sound) return;
    DECK.sound.setMuted(!DECK.sound.isMuted());
    updateSoundBtn();
    if (!DECK.sound.isMuted()) {
      DECK.sound.tick(1400);
      if (slides[state.i] && slides[state.i].id === "hero") DECK.sound.pad(true);
    }
  }

  function toggleFull() {
    try {
      if (!document.fullscreenElement) root.requestFullscreen && root.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    } catch (err) {
      /* not allowed here */
    }
  }

  /* ==========================================================================
     Hash routing: #/7 or #/7/2 (1-based). Also #/slide-id.
     ========================================================================== */
  function parseHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return null;
    var parts = h.split("/");
    var i = parseInt(parts[0], 10);
    if (isNaN(i)) i = indexOfId(parts[0]) + 1;
    if (!i || i < 1 || i > total) return null;
    var step = parseInt(parts[1], 10);
    return { i: i - 1, step: isNaN(step) ? 0 : step };
  }
  var writingHash = false;
  function writeHash() {
    var h = "#/" + (state.i + 1) + (state.step ? "/" + state.step : "");
    if (location.hash !== h) {
      writingHash = true;
      try {
        history.replaceState(null, "", h);
      } catch (err) {
        location.hash = h;
      }
      writingHash = false;
    }
  }

  /* ==========================================================================
     Input
     ========================================================================== */
  function isTyping(t) {
    if (!t || !t.tagName) return false;
    var tag = t.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
  }

  function onKey(e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    var key = e.key;

    if (state.overview) {
      if (key === "Escape" || key === "o" || key === "O") {
        e.preventDefault();
        closeOverview();
      } else if (key === "ArrowRight" || key === "ArrowLeft" || key === "ArrowDown" || key === "ArrowUp") {
        var tiles = $$(".ovtile");
        var cur = tiles.indexOf(document.activeElement);
        if (cur < 0) cur = state.i;
        var d = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : key === "ArrowDown" ? 6 : -6;
        var n = Math.max(0, Math.min(tiles.length - 1, cur + d));
        tiles[n].focus();
        e.preventDefault();
      }
      return;
    }

    var own = t && t.closest && t.closest("[data-keys='own']");
    var typing = isTyping(t);
    var onControl = t && t.closest && t.closest(".slide") && t.closest("button, a, [role='tab']");

    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
        if (typing || own) return;
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        if (typing || own) return;
        e.preventDefault();
        prev();
        break;
      case "PageDown":
        e.preventDefault();
        next();
        break;
      case "PageUp":
        e.preventDefault();
        prev();
        break;
      case " ":
      case "Spacebar":
        if (typing || onControl) return;
        e.preventDefault();
        e.shiftKey ? prev() : next();
        break;
      case "Home":
        if (typing) return;
        e.preventDefault();
        go(0, 0);
        break;
      case "End":
        if (typing) return;
        e.preventDefault();
        go(total - 1, "end");
        break;
      case "o":
      case "O":
      case "g":
      case "G":
        if (typing) return;
        e.preventDefault();
        openOverview();
        break;
      case "Escape":
        if (state.notes) toggleNotes();
        break;
      case "m":
      case "M":
        if (typing) return;
        toggleSound();
        break;
      case "r":
      case "R":
        if (typing) return;
        applyMotion(!reduced(), true);
        break;
      case "n":
      case "N":
        if (typing) return;
        toggleNotes();
        break;
      case "f":
      case "F":
        if (typing) return;
        toggleFull();
        break;
      case "h":
      case "H":
        if (typing) return;
        stage.classList.toggle("chrome-hidden");
        break;
      default:
        break;
    }
  }

  /* Trackpad / mouse wheel: one gesture, one move */
  var wheel = { acc: 0, locked: false, timer: 0, since: 0 };
  function onWheel(e) {
    if (state.overview) return;
    if (e.target.closest && e.target.closest("[data-scroll]")) return;
    if (e.ctrlKey) return; // pinch zoom
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    clearTimeout(wheel.timer);
    wheel.timer = setTimeout(function () {
      wheel.locked = false;
      wheel.acc = 0;
    }, 240);
    var now = performance.now();
    if (wheel.locked && now - wheel.since < 1100) return;
    wheel.acc += d;
    if (Math.abs(wheel.acc) > 70) {
      if (wheel.acc > 0) next();
      else prev();
      wheel.locked = true;
      wheel.since = now;
      wheel.acc = 0;
    }
  }

  /* Touch: swipe left / right */
  var touch = null;
  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    var t = e.target;
    if (t.closest && t.closest("input, [data-keys='own'], iframe")) {
      touch = null;
      return;
    }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }
  function onTouchEnd(e) {
    if (!touch) return;
    var dx = e.changedTouches[0].clientX - touch.x;
    var dy = e.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - touch.t < 900) {
      if (dx < 0) next();
      else prev();
    }
    touch = null;
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  function boot() {
    stage = $("#stage");
    deckEl = $("#deck");
    slides = $$(".slide", deckEl);
    total = slides.length;
    ribbon.el = $("#ribbon");
    ribbon.main = $(".ribbon__main", ribbon.el);
    ribbon.dash = $(".ribbon__dash", ribbon.el);

    // Motion preference: saved choice, else the OS setting
    var saved = store("cx-deck:motion");
    applyMotion(saved ? saved === "reduced" : !!(mq && mq.matches), false);
    if (mq && mq.addEventListener) {
      mq.addEventListener("change", function (ev) {
        if (!store("cx-deck:motion")) applyMotion(ev.matches, false);
      });
    }

    hydrate(document);
    if (DECK.photos) DECK.photos.mount(document);
    prepSlides();

    // Slide controllers render their parts, then we hydrate what they added
    slides.forEach(function (s) {
      var c = controller(s);
      if (c.init) {
        try {
          c.init(s);
        } catch (err) {
          console.error("init " + s.id, err);
        }
      }
    });
    hydrate(document);
    if (DECK.photos) DECK.photos.mount(document);
    if (DECK.shots) DECK.shots.mount(document);
    slides.forEach(function (s) {
      s.__builds = null;
      buildsOf(s);
    });

    buildChrome();
    fit();
    window.addEventListener("resize", fit);
    measure(document);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measure(document);
        DECK.emit("fonts");
      });
    }

    document.addEventListener("keydown", onKey);
    stage.addEventListener("wheel", onWheel, { passive: false });
    DECK.pointer = { x: 0, y: 0 };
    var pRaf = 0;
    stage.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = stage.getBoundingClientRect();
      DECK.pointer.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      DECK.pointer.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (pRaf) return;
      pRaf = requestAnimationFrame(function () {
        pRaf = 0;
        stage.style.setProperty("--px", DECK.pointer.x.toFixed(3));
        stage.style.setProperty("--py", DECK.pointer.y.toFixed(3));
      });
    });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("hashchange", function () {
      if (writingHash) return;
      var h = parseHash();
      if (h && (h.i !== state.i || h.step !== state.step)) go(h.i, h.step);
    });

    var start = parseHash() || { i: 0, step: 0 };
    go(start.i, start.step, { instant: false });
    stage.classList.add("is-ready");
    DECK.ready = true;
    DECK.emit("ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
