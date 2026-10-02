/* ==========================================================================
   UI/UX screens (#/screens)
   Screens captured from the working prototype (tools/capture-screens.js),
   with the design reasoning behind them, plus a live design system.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  var FLOW = [
    { id: "loop-prompt", stage: "Prompt", title: "Write the prompt", notes: ["The six ingredients light up as the child types: details, numbers, goal, limits, check", "A prompt-power meter shows the prompt getting stronger", "Suggestions support beginners without writing the prompt for them"] },
    { id: "loop-ai", stage: "AI reads it", title: "See what the AI understood", notes: ["Green chips are the child's own words. Pink chips are what the AI guessed", "Every change shows from → to, and whether it came from the child, a guess or the AI's maths", "Tags pinned to the 3D build point at what changed"] },
    { id: "loop-predict", stage: "Predict", title: "Predict before testing", notes: ["A prediction is required before the test button appears", "Options are concrete: twice as high, half as high, the same", "Wrong predictions are welcomed: the test shows the truth"] },
    { id: "loop-test", stage: "Test", title: "See the cause and effect", notes: ["The 3D build runs the test with real formulas", "A cause → effect banner says it in one line: gravity ÷2 → jump ×2", "Before and after markers stay on screen to compare"] },
    { id: "loop-decide", stage: "Decide", title: "Keep it, or improve the prompt", notes: ["Keep, Undo & improve, or ask the AI why it happened", "Undo puts the prompt back in the box to edit", "Every kept prompt joins the prompt ladder"] },
    { id: "loop-share", stage: "Share", title: "Finish and share", notes: ["Session 6 makes a share card: build, facts, first and best prompts", "The growth chart shows ingredients rising and AI guesses falling", "A share link opens it for family, with a nickname only"] },
  ];
  var ANATOMY = [
    ["You", "The child's prompt, with every ingredient highlighted and what changed since their last prompt."],
    ["What I understood", "Each idea the AI took from the prompt: the child's words in green, the AI's guesses in pink, its own maths in teal."],
    ["What I changed", "Every value change, from → to, labelled with where it came from."],
    ["Predict", "A question the child must answer before testing."],
    ["Test result", "The measured effect, the prediction check, and the maths or science in one paragraph."],
    ["You decide", "Keep it, undo and improve the prompt, or ask why it happened. The child always makes the final decision."],
  ];
  var PLATFORM = [
    { id: "landing", title: "Proposal landing", text: "A 3D hero with four worlds orbiting the AI core, the philosophy, and a prompt that grows from session 1 to 6." },
    { id: "student", title: "Student dashboard", text: "The six-session journey, how prompts have grown, creator level, badges and share cards." },
    { id: "teach", title: "Instructor session plan", text: "A minute-by-minute running order with a live clock, words to say, success checks, and the mission in each world." },
    { id: "circle", title: "Circle hub session", text: "A Circle course session with the child-safe Lab embedded and a world switcher, for instructors and partners." },
    { id: "showcase", title: "Class showcase", text: "Finished session 6 builds as share cards, each with a live share link." },
    { id: "curriculum", title: "Curriculum", text: "Six sessions with outcomes, the mission in every world, KS2 links and the progression from user to creator." },
  ];

  function shot(id, alt, cls) {
    return '<img class="shot ' + (cls || "") + '" src="assets/screens/' + id + '.jpg" alt="' + esc(alt) + '" loading="lazy" decoding="async" onerror="this.closest(\'.frame\').classList.add(\'is-missing\')">';
  }
  function laptop(id, alt) {
    return '<figure class="frame frame--laptop"><div class="frame__screen">' + shot(id, alt) + '<span class="frame__missing">Run tools/capture-screens.js to generate this screen</span></div><div class="frame__base"></div></figure>';
  }

  CX.pages.screens = {
    title: "UI/UX screens",
    mount: function (root, params, scope) {
      var builds = CX.builds.list;
      root.innerHTML =
        '<section class="page-hero xhero on-navy">' +
        ui.curve("M-40 360 C 280 220, 580 520, 880 360 S 1300 160, 1500 280", { cls: "xhero__curve", viewBox: "0 0 1440 600", draw: true }) +
        '<div class="container container--wide page-hero__inner"><p class="eyebrow">' +
        icon("layers") +
        ' UI/UX</p><h1 class="hero-type">Every screen,<br><span class="text-lime">designed to decide</span></h1><p class="lead">Screens captured from the working prototype, with the design reasoning behind each one. Everything shown here is live and clickable in the app.</p><div class="cluster" style="margin-top:2rem">' +
        ui.btn({ label: "Try the real thing", href: "#/build/planet/3" }) +
        ui.btn({ label: "Jump to the design system", href: "#/screens?s=ds", variant: "ghost", arrowIcon: "arrow-down" }) +
        "</div></div></section>" +
        // flow
        '<section class="xflow on-cream section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("repeat") +
        ' The learning loop · Planet Builder</p><h2 class="d1">One rhythm,<br>every prompt</h2></div><div><p class="lead">Every world uses the same Prompt Studio, so children (and instructors) learn the rhythm once: prompt, predict, test, decide. Session 6 ends with a share card.</p></div></div>' +
        FLOW.map(function (f, i) {
          return (
            '<article class="xstep' +
            (i % 2 ? " xstep--alt" : "") +
            '" data-reveal><div class="xstep__shot">' +
            laptop(f.id, f.title) +
            '</div><div class="xstep__copy"><span class="xstep__n">' +
            String(i + 1).padStart(2, "0") +
            '</span><span class="chip chip--navy">' +
            esc(f.stage) +
            '</span><h3 class="d3">' +
            esc(f.title) +
            '</h3><ol class="xnotes">' +
            f.notes
              .map(function (n) {
                return "<li>" + esc(n) + "</li>";
              })
              .join("") +
            "</ol></div></article>"
          );
        }).join("") +
        "</div></section>" +
        // anatomy
        '<section class="xanat on-navy section"><div class="container container--wide xanat__grid"><div class="xanat__shot"><figure class="frame frame--card">' +
        shot("card", "The AI card in the Prompt Studio") +
        '<span class="frame__missing">Run tools/capture-screens.js</span></figure></div><div><p class="eyebrow">' +
        icon("search") +
        ' Anatomy of one round</p><h2 class="d2">Transparency,<br>by design</h2><ol class="xanat__list">' +
        ANATOMY.map(function (a, i) {
          return '<li><span>' + (i + 1) + "</span><div><b>" + esc(a[0]) + "</b><p>" + esc(a[1]) + "</p></div></li>";
        }).join("") +
        "</ol></div></div></section>" +
        // builds
        '<section class="xgames on-navy-2 section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("layers") +
        ' Four worlds · one system</p><h2 class="d1">The builds</h2></div><div><p class="lead">The same Prompt Studio around four different 3D worlds: dark glass panels, lime for the child\'s words, pink for the AI\'s guesses, and the LED-face Bits as characters. Each is captured mid-session.</p></div></div><div class="xgames__grid xgames__grid--4">' +
        builds
          .map(function (g) {
            return '<a class="xgame" href="#/build/' + g.id + '/1"><figure class="frame frame--game">' + shot("build-" + g.id, g.title + " screen") + '<span class="frame__missing">' + esc(g.title) + '</span></figure><span class="xgame__n">' + String(g.n).padStart(2, "0") + "</span><b>" + esc(g.title) + "</b><small>" + esc(g.subjects.map(function (x) {
              return x.t;
            }).join(" · ")) + "</small></a>";
          })
          .join("") +
        "</div></div></section>" +
        // platform
        '<section class="xplat on-white section"><div class="container container--wide"><div class="sec-head"><p class="eyebrow">' +
        icon("grid") +
        ' Across the product</p><h2 class="d1">Platform screens</h2></div><div class="xplat__grid">' +
        PLATFORM.map(function (p) {
          return '<article class="xplat__item" data-reveal>' + laptop(p.id, p.title) + "<h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></article>";
        }).join("") +
        "</div></div></section>" +
        // devices
        '<section class="xdev on-teal section"><div class="container container--wide xdev__grid"><div><h2 class="hero-type xdev__title">Laptop.<br>Tablet.<br>Board.</h2><p class="lead">Built for the classroom: laptops and Chromebooks first, tablets with touch controls, and big-type board mode for projectors.</p></div><div class="xdev__frames"><figure class="frame frame--tablet">' +
        shot("device-tablet", "Tablet layout") +
        '<span class="frame__missing">Tablet</span></figure><figure class="frame frame--phone">' +
        shot("device-phone", "Phone layout") +
        '<span class="frame__missing">Phone</span></figure></div></div></section>' +
        // design system
        '<section class="xds on-cream section" id="ds"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("sliders") +
        ' Design system</p><h2 class="d1">Built from the<br>CX visual language</h2></div><div><p class="lead">The colours are sampled from computerxplorers.co.uk. Original components, characters and curves translate that energy into a product UI. Every value here is a CSS variable in <code>css/tokens.css</code>.</p></div></div>' +
        '<div class="xds__swatches">' +
        [
          ["Navy", "#0b012b", "--navy-950", "Backgrounds, text"],
          ["Lime", "#dbe751", "--lime-400", "Primary actions, your words"],
          ["Teal", "#49a7a9", "--teal-400", "Curves, tests, secondary"],
          ["Pink", "#efabcd", "--pink-400", "AI changes, AI guesses"],
          ["Orange", "#f07c3a", "--orange-400", "Warnings, hardware"],
          ["Cream", "#f6f3ee", "--cream-100", "Light sections"],
        ]
          .map(function (c) {
            return '<div class="xsw"><span class="xsw__chip" style="background:' + c[1] + '"></span><b>' + c[0] + "</b><code>" + c[1] + "</code><small>" + c[3] + "</small></div>";
          })
          .join("") +
        "</div>" +
        '<div class="xds__type card"><div><p class="xds__label">Display · Lilita One</p><p class="xds__display">Build with AI</p></div><div><p class="xds__label">Body · Lexend (designed for reading fluency)</p><p class="xds__body">Children ask for one change, see exactly what the AI did, then test it, fix it and explain it.</p></div><div><p class="xds__label">Code · JetBrains Mono</p><p class="xds__code">let speed = <span class="tok">4</span></p></div></div>' +
        '<div class="xds__comps card"><p class="xds__label">Components</p><div class="cluster">' +
        ui.btn({ label: "Primary", href: "#/screens?s=ds" }) +
        ui.btn({ label: "Navy", variant: "navy", href: "#/screens?s=ds" }) +
        ui.btn({ label: "Teal", variant: "teal", href: "#/screens?s=ds" }) +
        '<span class="act act--try">' +
        icon("play") +
        'Try it</span><span class="act act--keep">' +
        icon("check") +
        'Keep it</span><span class="act act--undo">' +
        icon("undo") +
        'Undo it</span><span class="act act--change">' +
        icon("edit") +
        'Change it</span></div><div class="cluster" style="margin-top:14px"><span class="uchip uchip--you">' +
        icon("user") +
        'jump<small>your words</small></span><span class="uchip uchip--guess">' +
        icon("help") +
        'every 2 seconds<small>AI guessed</small></span><span class="chip chip--lime">Lime chip</span><span class="chip chip--teal">Teal chip</span><span class="tag-indicative">Indicative / to confirm</span><span class="tag-sample">Sample data</span>' +
        ui.arrow() +
        '</div><p class="xds__label" style="margin-top:18px">Bits: original LED-face characters</p><div class="xds__bits">' +
        [
          ["pink", "happy"],
          ["lime", "grin"],
          ["teal", "wow"],
          ["orange", "jump"],
          ["blue", "think"],
          ["white", "star"],
        ]
          .map(function (b) {
            return '<span class="xds__bit">' + ui.bitSvg(b[0], b[1]) + "</span>";
          })
          .join("") +
        "</div></div>" +
        '<div class="xds__motion card"><p class="xds__label">Motion: purposeful, and off with reduced motion</p>' +
        ui.ticker(["Ticker", "Build", "Test", "Explain"], { speed: 18 }) +
        '<ul class="ticks"><li>Curves draw themselves as you scroll (stroke-dashoffset)</li><li>Big numbers count up when they come into view</li><li>Cards float in, and buttons press down physically</li><li>Every animation respects <code>prefers-reduced-motion</code> and the in-app toggle</li></ul></div>' +
        "</div></section>" +
        CX.layout.footer();
      if (params.query && params.query.s === "ds") {
        setTimeout(function () {
          var el = root.querySelector("#ds");
          if (el) el.scrollIntoView({ behavior: U.reducedMotion() ? "auto" : "smooth" });
        }, 300);
      }
    },
  };
})();
