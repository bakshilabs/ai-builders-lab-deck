/* ==========================================================================
   Demo tour: a narrated walkthrough for stakeholders (about 3 minutes).
   It drives the real product: navigates, highlights, and runs real prompts
   in the builds, so every number on screen is live.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  function studio() {
    return CX.studio && CX.studio.current;
  }
  function ask(text) {
    var s = studio();
    if (s) s.ask(text);
  }
  function predictAndRun(i) {
    var s = studio();
    if (!s) return;
    s.waitPhase(s.phase === "predict" ? "predict" : s.phase).then(function () {
      if (s.phase === "predict") s.predict(i || 0);
      setTimeout(function () {
        s.run();
      }, 500);
    });
  }

  var STEPS = [
    { route: "/", target: ".lhero__title", title: "AI Builders Lab", text: "A ComputerXplorers unit of six one-hour sessions. Children aged 10–11 learn maths and science by building with AI: a planet, a free kick, a track or a town's power supply." },
    { route: "/", target: ".lphil__t", title: "Not a game-playing club", text: "Children build something real by learning to work with AI. They make the decisions, learn to prompt and see cause and effect." },
    { route: "/", target: "#lgrow", title: "Watch a prompt grow", text: "One child, six sessions. From “Make a planet” (four AI guesses) to a six-ingredient brief with no guesses at all." },
    { route: "/lab", target: ".worlds__grid", title: "Four worlds, one set of skills", text: "Space, sport, music and the planet. Every child learns the same skill each session, in the world they care about." },
    { route: "/build/planet/3", target: ".st-panel", title: "Session 3: add numbers", text: "The child asks for gravity half of Earth's. The AI shows what it understood: green chips are the child's words, and nothing was guessed.", action: function () {
        ask("Make gravity half of Earth's so my astronaut jumps twice as high");
      }, wait: 1800 },
    { route: "/build/planet/3", target: ".st-stage", title: "Predict, then test", text: "Before testing, the child predicts: twice as high. Then the test runs: 0.5 m on Earth, 1.0 m now. Gravity ÷2, jump ×2.", action: function () {
        predictAndRun(0);
      }, wait: 3400 },
    { route: "/build/kick/4", target: ".st-panel", title: "Session 4: the AI does what you said", text: "“Hit the 18 m target.” The AI does the distance maths but ignores the wall. The test shows it: the ball hits the wall.", action: function () {
        ask("Hit the 18 m target");
      }, wait: 1800 },
    { route: "/build/kick/4", target: ".st-stage", title: "Cause and effect", text: "The child sees why, then adds the limits: keep the power at 90% and make sure it clears the wall.", action: function () {
        predictAndRun(1);
      }, wait: 3200 },
    { route: "/build/beat/4", target: ".st-panel", title: "Louder isn't higher", text: "In Beat Lab, “make the melody higher” is read as louder. The waveform gets taller, not tighter: pitch and volume, from the KS2 science curriculum.", action: function () {
        ask("Make the melody higher");
      }, wait: 1800 },
    { route: "/build/power/2", target: ".st-stage", title: "Clean isn't enough", text: "In Power Town, “clean energy” becomes solar only, and the town goes dark at night. Children read the 24-hour graph to find out why.", action: function () {
        ask("Power my town with clean energy");
        setTimeout(function () {
          predictAndRun(1);
        }, 1900);
      }, wait: 2600 },
    { route: "/student", target: ".sdgrowth__chart", title: "Progress you can see", text: "The student dashboard shows how prompts grew, session by session: more ingredients, fewer AI guesses, and the creator level rising." },
    { route: "/showcase", target: ".scgrid", title: "Something to share", text: "Session 6 ends with a share card: the finished build, first and best prompts, the maths and science, and a share link families can open." },
    { route: "/teach", target: ".tclass__grid", title: "Same skill, different worlds", text: "The instructor teaches one skill to the whole class, and sees every child's world, prompt and place in the loop." },
    { route: "/teach/4", target: ".lworlds", title: "Ready-to-run sessions", text: "Every session minute by minute, with the words to say, success checks, misconceptions, and the mission in each world." },
    { route: "/circle", target: ".cir", title: "Delivered on Circle.so", text: "The adult platform: courses, instructor training, community, events and the annual subscription, with the Lab embedded in every session. Children never need Circle accounts." },
    { route: "/org", target: ".ocascade__list", title: "Built to scale", text: "One platform, many instructors, clubs and schools. Works offline and with school IT. Pricing to be agreed together." },
  ];

  var idx = -1;
  var panel = null;
  var pending = null;
  var spotEl = null;

  function save() {
    try {
      sessionStorage.setItem("cx-tour", String(idx));
    } catch (e) {}
  }
  function clearSave() {
    try {
      sessionStorage.removeItem("cx-tour");
    } catch (e) {}
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("aside");
    panel.className = "tour";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Demo tour");
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tour]");
      if (!b) return;
      var a = b.getAttribute("data-tour");
      if (a === "next") go(idx + 1);
      if (a === "back") go(idx - 1);
      if (a === "exit") stop();
      if (a === "restart") go(0);
      if (a === "min") panel.classList.toggle("is-min");
    });
    return panel;
  }

  function render() {
    var s = STEPS[idx];
    var p = ensurePanel();
    p.classList.toggle("tour--right", !!document.querySelector(".page--activity"));
    if (!s) {
      p.innerHTML =
        '<div class="tour__head"><span class="tour__count">Done</span><button type="button" class="tour__x" data-tour="exit" aria-label="Close tour">' +
        icon("close") +
        '</button></div><h2 class="tour__title">That\'s the tour</h2><p class="tour__text">Explore freely: every world is buildable, every button works, and Menu → Reset demo data restores the starting state.</p><div class="tour__btns"><button type="button" class="btn btn--white btn--sm" data-tour="restart">' +
        icon("restart", "btn__icon") +
        '<span>Restart</span></button><button type="button" class="btn btn--lime btn--sm" data-tour="exit"><span>Explore</span></button></div>';
      return;
    }
    p.innerHTML =
      '<div class="tour__head"><span class="tour__count">' +
      icon("play") +
      "Demo tour · " +
      (idx + 1) +
      " / " +
      STEPS.length +
      '</span><button type="button" class="tour__x" data-tour="min" aria-label="Minimise tour">' +
      icon("chev-down") +
      '</button><button type="button" class="tour__x" data-tour="exit" aria-label="Exit tour">' +
      icon("close") +
      '</button></div><h2 class="tour__title">' +
      esc(s.title) +
      '</h2><p class="tour__text">' +
      esc(s.text) +
      '</p><div class="tour__dots" aria-hidden="true">' +
      STEPS.map(function (_, i) {
        return '<i class="' + (i === idx ? "is-now" : i < idx ? "is-done" : "") + '"></i>';
      }).join("") +
      '</div><div class="tour__btns">' +
      (idx > 0 ? '<button type="button" class="btn btn--white btn--sm" data-tour="back">' + icon("arrow-left", "btn__icon") + "<span>Back</span></button>" : "<span></span>") +
      '<button type="button" class="btn btn--lime btn--sm" data-tour="next"><span>' +
      (idx === STEPS.length - 1 ? "Finish" : "Next") +
      "</span>" +
      icon("arrow-right", "btn__icon") +
      "</button></div>";
    var next = p.querySelector('[data-tour="next"]');
    if (next) next.focus({ preventScroll: true });
  }

  function spotlight(sel, tries) {
    if (spotEl) spotEl.classList.remove("tour-spot");
    spotEl = null;
    var el = sel ? document.querySelector(sel) : null;
    if (!el) {
      if ((tries || 0) < 12)
        setTimeout(function () {
          if (idx >= 0) spotlight(sel, (tries || 0) + 1);
        }, 250);
      return;
    }
    spotEl = el;
    el.classList.add("tour-spot");
    var r = el.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight - 40) {
      el.scrollIntoView({ behavior: U.reducedMotion() ? "auto" : "smooth", block: r.height > window.innerHeight * 0.7 ? "start" : "center" });
    }
  }

  function runStep() {
    var s = STEPS[idx];
    render();
    if (!s) return;
    if (s.action) {
      try {
        s.action();
      } catch (e) {
        console.error("[tour]", e);
      }
    }
    setTimeout(function () {
      if (STEPS[idx] === s) spotlight(s.target);
    }, s.wait || 350);
  }

  function go(i) {
    if (i < 0) i = 0;
    idx = i;
    save();
    if (spotEl) spotEl.classList.remove("tour-spot");
    if (idx >= STEPS.length) {
      render();
      return;
    }
    var s = STEPS[idx];
    var cur = CX.router.current;
    var hash = (location.hash || "#/").replace(/^#/, "").split("?")[0] || "/";
    if (hash !== s.route) {
      pending = idx;
      render();
      CX.router.go(s.route);
    } else {
      runStep();
    }
  }

  function dock() {
    if (panel) panel.classList.toggle("tour--right", false);
  }
  CX.bus.on("route:mounted", dock);

  function onRoute() {
    if (pending == null || pending !== idx) return;
    pending = null;
    setTimeout(runStep, 450);
  }
  CX.bus.on("route:mounted", onRoute);
  CX.bus.on("route:updated", onRoute);

  function stop() {
    idx = -1;
    pending = null;
    clearSave();
    if (spotEl) spotEl.classList.remove("tour-spot");
    spotEl = null;
    if (panel) {
      panel.remove();
      panel = null;
    }
  }

  document.addEventListener("keydown", function (e) {
    if (idx < 0 || !panel) return;
    if (e.key === "Escape" && !document.querySelector("dialog[open]")) stop();
  });

  CX.tour = {
    start: function () {
      go(0);
    },
    stop: stop,
    resume: function () {
      var v = null;
      try {
        v = sessionStorage.getItem("cx-tour");
      } catch (e) {}
      if (v != null && !CX.embed) {
        idx = Number(v);
        if (idx >= 0) setTimeout(function () {
          go(idx);
        }, 300);
      }
    },
    get active() {
      return idx >= 0;
    },
    steps: STEPS,
  };
})();
