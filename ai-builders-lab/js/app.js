/* ==========================================================================
   App shell: floating pill navigation, menu overlay, footer, settings, boot.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  var NAV = [
    { id: "student", label: "Student", href: "#/student" },
    { id: "lab", label: "Build Lab", href: "#/lab" },
    { id: "showcase", label: "Showcase", href: "#/showcase" },
    { id: "teach", label: "Teach", href: "#/teach" },
    { id: "curriculum", label: "Curriculum", href: "#/curriculum" },
    { id: "circle", label: "Circle hub", href: "#/circle" },
    { id: "org", label: "Network", href: "#/org" },
  ];

  var MENU = [
    {
      title: "Learn",
      items: [
        { label: "Student dashboard", sub: "Your six sessions and your builds", href: "#/student" },
        { label: "Build Lab", sub: "Space, sport, music and the planet", href: "#/lab" },
        { label: "Class showcase", sub: "Finished builds, shared", href: "#/showcase" },
      ],
    },
    {
      title: "Teach",
      items: [
        { label: "Instructor home", sub: "Today's session and your class", href: "#/teach" },
        { label: "Session plans", sub: "Six ready-to-run hours", href: "#/teach/4" },
        { label: "Curriculum", sub: "Six sessions, outcomes and progression", href: "#/curriculum" },
      ],
    },
    {
      title: "Scale",
      items: [
        { label: "Circle hub", sub: "The platform, built on Circle.so", href: "#/circle" },
        { label: "UI/UX screens", sub: "Every screen, with design notes", href: "#/screens" },
        { label: "Organisation", sub: "One platform, every club", href: "#/org" },
        { label: "For schools", sub: "IT, data and safeguarding", href: "#/schools" },
        { label: "The proposal", sub: "Start here", href: "#/" },
      ],
    },
  ];

  CX.layout = {
    footer: function () {
      return (
        '<footer class="site-footer on-teal">' +
        '<div class="container site-footer__main">' +
        '<div class="site-footer__face">' +
        ui.bitSvg("white", "happy") +
        "</div>" +
        "<div>" +
        '<p class="site-footer__word">AI Builders<br>Lab</p>' +
        '<ul class="site-footer__links">' +
        [
          ["For students", "#/student"],
          ["Build Lab", "#/lab"],
          ["For instructors", "#/teach"],
          ["Class showcase", "#/showcase"],
          ["For schools", "#/schools"],
          ["Curriculum", "#/curriculum"],
          ["For organisations", "#/org"],
          ["Circle hub", "#/circle"],
        ]
          .map(function (l) {
            return '<li><a href="' + l[1] + '">' + esc(l[0]) + "</a></li>";
          })
          .join("") +
        "</ul></div></div>" +
        '<div class="site-footer__base"><div class="container"><span>AI Builders Lab · a product proposal prototype for ComputerXplorers · October 2026</span><span>Figures about ComputerXplorers come from computerxplorers.co.uk and the 30 September 2026 meeting. All pricing is indicative and to be confirmed.</span></div></div>' +
        "</footer>"
      );
    },
    nav: NAV,
  };

  function renderTopbar() {
    var bar = document.getElementById("topbar");
    bar.innerHTML =
      '<a class="brand" href="#/" aria-label="AI Builders Lab by ComputerXplorers. Home">' +
      '<span class="brand__mark">' +
      ui.bitSvg("lime", "happy") +
      '</span><span class="brand__text"><span class="brand__org">ComputerXplorers</span><span class="brand__name">AI Builders Lab</span></span></a>' +
      '<nav class="navpill" aria-label="Main">' +
      NAV.map(function (n) {
        return '<a href="' + n.href + '" data-nav="' + n.id + '">' + esc(n.label) + "</a>";
      }).join("") +
      "</nav>" +
      '<div class="actions">' +
      '<span class="actions__status" title="The AI helper is running in offline example mode">' +
      '<span class="dot"></span>Works offline</span>' +
      ui.btn({ html: '<span class="btn__label-long">Demo </span>tour', variant: "lime", size: "sm", icon: "play", attrs: 'data-tour-start aria-label="Start the guided demo tour"' }) +
      '<button type="button" class="menu-btn" id="menu-open" aria-label="Open menu" aria-expanded="false" aria-controls="menu">' +
      icon("menu") +
      "</button></div>";
  }

  function renderMenu() {
    var menu = document.getElementById("menu");
    menu.innerHTML =
      '<button type="button" class="menu-overlay__close" id="menu-close" aria-label="Close menu">' +
      icon("close") +
      "</button>" +
      '<div class="menu-grid">' +
      MENU.map(function (g) {
        return (
          '<div class="menu-group"><h2>' +
          esc(g.title) +
          "</h2><ul>" +
          g.items
            .map(function (i) {
              return '<li><a href="' + i.href + '">' + esc(i.label) + '<span class="menu-sub">' + esc(i.sub) + "</span></a></li>";
            })
            .join("") +
          "</ul></div>"
        );
      }).join("") +
      '<div class="menu-group menu-settings"><h2>Demo &amp; settings</h2>' +
      ui.btn({ label: "Start the demo tour", variant: "lime", icon: "play", attrs: "data-tour-start" }) +
      '<label class="switch"><input type="checkbox" id="set-sound"><span class="switch__track"></span><span>Sound</span></label>' +
      '<label class="switch"><input type="checkbox" id="set-motion"><span class="switch__track"></span><span>Reduce motion</span></label>' +
      '<label class="switch"><input type="checkbox" id="set-quality"><span class="switch__track"></span><span>Simpler 3D (older laptops)</span></label>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="set-reset">' +
      icon("restart", "btn__icon") +
      "<span>Reset demo data</span></button>" +
      '<button type="button" class="btn btn--ghost btn--sm" id="set-about">' +
      icon("info", "btn__icon") +
      "<span>About this prototype</span></button>" +
      "</div></div>";

    var openBtn = document.getElementById("menu-open");
    function open() {
      menu.classList.add("is-open");
      menu.removeAttribute("aria-hidden");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      setTimeout(function () {
        document.getElementById("menu-close").focus();
      }, 50);
    }
    function close(silent) {
      if (!menu.classList.contains("is-open")) return;
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (!silent) openBtn.focus();
    }
    openBtn.addEventListener("click", open);
    document.getElementById("menu-close").addEventListener("click", function () {
      close();
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) close(true);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
    CX.bus.on("route:mounted", function () {
      close(true);
    });
    CX.layout.closeMenu = close;

    var motion = document.getElementById("set-motion");
    motion.checked = !!CX.store.state.settings.reduceMotion;
    motion.addEventListener("change", function () {
      CX.store.patch(function (s) {
        s.settings.reduceMotion = motion.checked;
      });
      CX.bus.emit("settings:apply");
      ui.toast(motion.checked ? "Motion reduced" : "Motion on", "sliders");
    });
    var sound = document.getElementById("set-sound");
    sound.checked = CX.store.state.settings.sound !== false;
    sound.addEventListener("change", function () {
      if (CX.sound) CX.sound.setEnabled(sound.checked);
      ui.toast(sound.checked ? "Sound on" : "Sound off", sound.checked ? "volume" : "volume-off");
    });
    var quality = document.getElementById("set-quality");
    quality.checked = CX.store.state.settings.quality === "low";
    quality.addEventListener("change", function () {
      CX.store.patch(function (s) {
        s.settings.quality = quality.checked ? "low" : "high";
      });
      ui.toast(quality.checked ? "Simpler 3D: no glow, lower resolution" : "Full 3D", "sliders");
      CX.router.refresh();
    });
    document.getElementById("set-reset").addEventListener("click", function () {
      CX.store.reset();
      close(true);
      ui.toast("Demo data reset to the starting state", "restart");
      CX.router.refresh();
    });
    document.getElementById("set-about").addEventListener("click", function () {
      close(true);
      aboutDialog();
    });
  }

  function aboutDialog() {
    ui.dialog({
      title: "About this prototype",
      body:
        '<div class="stack">' +
        "<p><b>AI Builders Lab</b> is a working product prototype for ComputerXplorers: a unit of six one-hour sessions where 10–11 year olds learn maths and science by building with AI, one prompt at a time.</p>" +
        '<ul class="ticks">' +
        "<li>The AI helper runs in <b>offline example mode</b>. Its responses are written in advance and matched to what the child types. Nothing is sent to any AI service.</li>" +
        "<li>Progress is stored only in this browser (localStorage), using a nickname. No personal data is collected.</li>" +
        "<li>Class lists, activity feeds and showcase projects are <b>sample data</b> so the instructor and organisation views can be shown.</li>" +
        "<li>Figures about ComputerXplorers come from computerxplorers.co.uk and the 30 September 2026 meeting. Pricing is indicative and to be confirmed.</li>" +
        "<li>3D and sound run in the browser (three.js and Web Audio, bundled locally). Nothing to install. Menu → Simpler 3D helps older laptops.</li>" +
        "<li>Photo frames show the photography each spot is meant to have, until real photos are added.</li>" +
        "</ul>" +
        '<p class="small muted">Use Menu → Reset demo data to return to the starting state before a stakeholder demo.</p></div>',
    });
  }
  CX.layout.about = aboutDialog;

  function highlightNav(nav) {
    U.qsa("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === nav) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function boot() {
    // Embed mode (?embed=1): no site chrome, for Circle lessons and other hosts
    CX.embed = /[?&]embed=1/.test(location.hash) || /[?&]embed=1/.test(location.search);
    document.documentElement.classList.toggle("is-embed", CX.embed);
    CX.bus.emit("settings:apply");
    renderTopbar();
    renderMenu();
    CX.bus.on("route:mounted", function (r) {
      highlightNav(r.nav);
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-tour-start]")) {
        e.preventDefault();
        if (CX.layout.closeMenu) CX.layout.closeMenu(true);
        if (CX.tour) CX.tour.start();
      }
    });
    CX.router.start(document.getElementById("main"));
    if (CX.tour) CX.tour.resume();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
