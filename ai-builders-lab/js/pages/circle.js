/* ==========================================================================
   Circle.so hub (#/circle)
   The adult-facing platform we would configure for ComputerXplorers on
   Circle: courses, community, events, members and paid access. The
   child-facing AI Builders Lab is embedded in each lesson. Children never
   get Circle accounts: Circle's terms require members to be 18+ (or 13+
   with verified parental consent).
   Layout is an illustrative, simplified mock-up of a branded Circle space.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  var VIEWS = [
    { id: "lesson", label: "Course lesson", icon: "book" },
    { id: "feed", label: "Community", icon: "chat" },
    { id: "events", label: "Events", icon: "calendar" },
    { id: "members", label: "Members & regions", icon: "users" },
    { id: "access", label: "Access & billing", icon: "key" },
  ];

  var SPACES = [
    { group: "Start here", items: [["welcome", "Welcome", "sparkle"], ["news", "Announcements", "bolt", 2]] },
    {
      group: "Teach the Lab",
      items: [
        ["lesson", "AI Builders Lab · Lessons", "book"],
        ["cert", "Instructor certification", "shield-check"],
        ["resources", "Resources & printables", "save"],
      ],
    },
    {
      group: "Community",
      items: [
        ["feed", "Instructor lounge", "chat", 5],
        ["showcase", "Class showcase", "star"],
        ["help", "Help desk", "help"],
      ],
    },
    {
      group: "Network",
      items: [
        ["events", "Events & live rooms", "calendar"],
        ["members", "Regions & members", "map"],
        ["access", "Access & billing", "key"],
      ],
    },
  ];
  var SPACE_VIEW = { lesson: "lesson", cert: "lesson", resources: "lesson", feed: "feed", news: "feed", welcome: "feed", showcase: "feed", help: "feed", events: "events", members: "members", access: "access" };

  var state = { view: "lesson", space: "lesson", lessonModule: 4, lessonPart: "activity", world: "planet", complete: {}, rsvp: {}, poll: null };

  /* ---- Views ---------------------------------------------------------------- */
  function sidebar(active) {
    return (
      '<aside class="cir-side">' +
      '<div class="cir-brand"><span class="cir-brand__mark">' +
      ui.bitSvg("lime", "happy") +
      '</span><span><b>ComputerXplorers</b><small>AI Builders Hub</small></span></div>' +
      '<div class="cir-search">' +
      icon("search") +
      "<span>Search</span><kbd>⌘K</kbd></div>" +
      '<nav class="cir-nav" aria-label="Circle spaces">' +
      '<a class="cir-link' + (state.space === "home" ? " is-active" : "") + '" data-cview="feed" data-cspace="home">' +
      icon("layers") +
      "<span>Feed</span></a>" +
      SPACES.map(function (g) {
        return (
          '<p class="cir-group">' +
          esc(g.group) +
          "</p>" +
          g.items
            .map(function (it) {
              var isActive = it[0] === state.space;
              return '<a class="cir-link' + (isActive ? " is-active" : "") + '" data-cview="' + SPACE_VIEW[it[0]] + '" data-cspace="' + it[0] + '">' + icon(it[2]) + "<span>" + esc(it[1]) + "</span>" + (it[3] ? '<em class="cir-badge">' + it[3] + "</em>" : "") + "</a>";
            })
            .join("")
        );
      }).join("") +
      "</nav>" +
      '<div class="cir-live"><span class="cir-live__dot"></span><span><b>Live now</b><small>Instructor clinic · Session 4</small></span></div>' +
      "</aside>"
    );
  }

  function topbar(title, sub) {
    return (
      '<div class="cir-top"><div><p class="cir-top__crumb">' +
      esc(sub) +
      '</p><h3 class="cir-top__title">' +
      esc(title) +
      '</h3></div><div class="cir-top__actions"><span class="cir-icon">' +
      icon("chat") +
      '</span><span class="cir-icon cir-icon--dot">' +
      icon("bolt") +
      '</span><span class="cir-avatar" title="Signed in as an instructor">SM</span></div></div>'
    );
  }

  function lessonView() {
    var mods = CX.data.course.modules;
    var mod = mods[state.lessonModule - 1];
    var parts = [
      ["plan", "Lesson plan"],
      ["activity", "Live build: same skill, four worlds"],
      ["debrief", "Debrief & reflection"],
    ];
    var outline = mods
      .map(function (m) {
        var open = m.n === state.lessonModule;
        return (
          '<div class="cir-sec' +
          (open ? " is-open" : "") +
          '"><button type="button" class="cir-sec__head" data-cmod="' +
          m.n +
          '"><span class="cir-sec__n">' +
          String(m.n).padStart(2, "0") +
          "</span>" +
          esc(m.title) +
          icon(open ? "chev-down" : "chev-right") +
          "</button>" +
          (open
            ? '<ul class="cir-sec__list">' +
              parts
                .map(function (p) {
                  var key = m.n + ":" + p[0];
                  return (
                    '<li><button type="button" class="cir-lesson' +
                    (state.lessonPart === p[0] ? " is-active" : "") +
                    '" data-cpart="' +
                    p[0] +
                    '"><span class="cir-check' +
                    (state.complete[key] ? " is-done" : "") +
                    '">' +
                    icon("check") +
                    "</span>" +
                    esc(p[1]) +
                    "</button></li>"
                  );
                })
                .join("") +
              "</ul>"
            : "") +
          "</div>"
        );
      })
      .join("");
    var key = mod.n + ":" + state.lessonPart;
    var body = "";
    if (state.lessonPart === "activity") {
      var wb = CX.builds.get(state.world) || CX.builds.list[0];
      body =
        '<div class="cir-media"><div class="cir-media__label">' +
        icon("layers") +
        "Embedded · AI Builders Lab (child-safe app, no login)</div>" +
        '<div class="cir-worlds" role="group" aria-label="Choose a world">' +
        CX.builds.list
          .map(function (b) {
            return '<button type="button" class="cir-world' + (b.id === wb.id ? " is-on" : "") + '" data-cworld="' + b.id + '" aria-pressed="' + (b.id === wb.id) + '">' + icon(b.interest.icon) + esc(b.title) + "</button>";
          })
          .join("") +
        "</div>" +
        '<div class="cir-embed" id="cir-embed" data-src="index.html#/build/' +
        wb.id +
        "/" +
        mod.n +
        '?embed=1"><iframe title="AI Builders Lab: ' +
        esc(wb.title) +
        ", session " +
        mod.n +
        '" loading="lazy"></iframe></div></div>' +
        '<div class="cir-body"><h4>How to run this session</h4><p>' +
        esc(mod.strap) +
        " Every child practises the same skill in the world they chose: " +
        CX.builds.list
          .map(function (b) {
            return esc(b.title);
          })
          .join(", ") +
        '.</p><ol class="cir-steps">' +
        mod.lesson.runningOrder
          .map(function (r) {
            return "<li><b>00:" + String(r.at).padStart(2, "0") + " " + esc(r.title) + "</b> " + esc(r.do) + "</li>";
          })
          .join("") +
        "</ol>" +
        '<div class="cir-callout">' +
        icon("shield") +
        "<span><b>Children don't need Circle accounts.</b> Put the build on the board, or give children the class code for the Lab. Progress is saved with builder nicknames only.</span></div></div>";
    } else if (state.lessonPart === "plan") {
      var L = mod.lesson;
      body =
        '<div class="cir-body"><div class="cir-hero"><span class="cir-hero__n">' +
        String(mod.n).padStart(2, "0") +
        '</span><div><h4>' +
        esc(mod.title) +
        " · " +
        L.duration +
        " minutes</h4><p>" +
        esc(L.objective) +
        "</p></div></div>" +
        '<div class="cir-cols"><div><h5>Outcome</h5><p>' +
        esc(L.outcome) +
        "</p><h5>You will need</h5><ul class=\"ticks\">" +
        L.need
          .map(function (n) {
            return "<li>" + esc(n) + "</li>";
          })
          .join("") +
        "</ul></div><div><h5>Say this</h5>" +
        L.prompts
          .slice(0, 3)
          .map(function (p) {
            return '<p class="cir-say">“' + esc(p) + "”</p>";
          })
          .join("") +
        "</div></div>" +
        '<div class="cir-files"><a class="cir-file" href="#/teach/' +
        mod.n +
        '" target="_blank" rel="noopener">' +
        icon("print") +
        '<span>Printable lesson plan<small>Opens the full plan</small></span></a><a class="cir-file" href="#/schools" target="_blank" rel="noopener">' +
        icon("wifi") +
        '<span>School IT pack<small>Allowlist and offline mode</small></span></a><button type="button" class="cir-file" data-cletter>' +
        icon("book") +
        "<span>Parent letter<small>Template to send home</small></span></button></div></div>";
    } else {
      body =
        '<div class="cir-body"><h4>Debrief: what did children learn?</h4><p>Close the lesson by asking children to explain one decision. These are the reflection prompts children see in the Lab:</p><ul class="ticks">' +
        mod.lesson.reflection
          .map(function (r) {
            return "<li>" + esc(r) + "</li>";
          })
          .join("") +
        '</ul><h5>Success check</h5><ul class="ticks ticks--lime">' +
        mod.lesson.successCheck
          .map(function (r) {
            return "<li>" + esc(r) + "</li>";
          })
          .join("") +
        "</ul></div>";
    }
    var comments =
      '<div class="cir-comments"><p class="cir-comments__title">' +
      icon("chat") +
      ' 3 comments <span class="tag-sample">Sample</span></p>' +
      [
        ["PK", "Priya K.", "Instructor · Woking", "The floating-astronaut moment landed brilliantly. Half the class said “it did what I said, not what I meant” without any prompting from me."],
        ["DB", "Dan B.", "Franchise partner · Surrey", "Running this as a half-term day next week. Is the offline mode OK for a church hall with no Wi-Fi?"],
        ["HQ", "ComputerXplorers HQ", "Curriculum team", "Yes. Download the offline pack from Resources, and every build works without internet."],
      ]
        .map(function (c, i) {
          return '<div class="cir-comment' + (i === 2 ? " is-reply" : "") + '"><span class="cir-avatar cir-avatar--' + (i % 3) + '">' + c[0] + "</span><div><p><b>" + esc(c[1]) + "</b> <small>" + esc(c[2]) + "</small></p><p>" + esc(c[3]) + "</p></div></div>";
        })
        .join("") +
      "</div>";
    return (
      topbar(parts.filter(function (p) { return p[0] === state.lessonPart; })[0][1], "AI Builders Lab · Sessions › Session " + String(mod.n).padStart(2, "0")) +
      '<div class="cir-course"><div class="cir-outline"><div class="cir-progress"><b>Course progress</b>' +
      ui.meter((Object.keys(state.complete).length / 18) * 100) +
      "<small>" +
      Object.keys(state.complete).length +
      " of 18 parts complete</small></div>" +
      outline +
      '</div><div class="cir-lessonpane">' +
      body +
      '<div class="cir-complete"><button type="button" class="btn btn--sm ' +
      (state.complete[key] ? "btn--white" : "btn--lime") +
      '" data-ccomplete="' +
      key +
      '">' +
      icon(state.complete[key] ? "check" : "check", "btn__icon") +
      "<span>" +
      (state.complete[key] ? "Completed" : "Mark as complete") +
      "</span></button><span class=\"tiny muted\">Instructors track their own prep. Children's progress lives in the Lab.</span></div>" +
      comments +
      "</div></div>"
    );
  }

  function feedView() {
    var poll = [
      ["Planet Builder (space)", 41],
      ["Power Town (the planet)", 35],
      ["Beat Lab (music)", 24],
    ];
    return (
      topbar("Instructor lounge", "Community") +
      '<div class="cir-feed"><div class="cir-compose"><span class="cir-avatar">SM</span><span>Share a win from your club…</span><span class="btn btn--lime btn--sm"><span>Post</span></span></div>' +
      '<article class="cir-post cir-post--hq"><header><span class="cir-avatar cir-avatar--hq">' +
      ui.bitSvg("lime", "happy") +
      '</span><div><b>ComputerXplorers HQ</b><small>Announcement · pinned</small></div><span class="tag-sample">Sample</span></header><h4>The half-term launch pack is live</h4><p>Everything you need to run AI Builders Lab as six one-hour sessions: session plans, the offline pack, parent letters and the headphones checklist. Join Thursday\'s live clinic if it\'s your first time.</p><div class="cir-post__tags"><span class="chip">#launch</span><span class="chip">#half-term</span></div></article>' +
      '<article class="cir-post"><header><span class="cir-avatar cir-avatar--1">PK</span><div><b>Priya K.</b><small>Instructor · Woking · Certified</small></div></header><p>Our Year 6 club did session 4 today. One child said: <i>“The AI did what I said, not what I meant, so I added a limit.”</i> That\'s the whole unit in one sentence!</p><div class="cir-post__media"><img src="assets/builds/planet.jpg" alt="A planet build from session 4" onerror="this.remove()"></div><footer>' +
      icon("heart") +
      " 24 · " +
      icon("chat") +
      " 6 comments</footer></article>" +
      '<article class="cir-post"><header><span class="cir-avatar cir-avatar--2">DB</span><div><b>Dan B.</b><small>Franchise partner · Surrey</small></div></header><h4>Poll: which module should we pilot first?</h4><div class="cir-poll">' +
      poll
        .map(function (p, i) {
          var voted = state.poll != null;
          var pct = voted ? (i === state.poll ? p[1] + 2 : p[1]) : 0;
          return '<button type="button" class="cir-poll__opt' + (state.poll === i ? " is-mine" : "") + '" data-cpoll="' + i + '"><span class="cir-poll__bar" style="width:' + pct + '%"></span><span>' + esc(p[0]) + "</span>" + (voted ? "<b>" + pct + "%</b>" : "") + "</button>";
        })
        .join("") +
      "</div><footer>" +
      (state.poll == null ? "Tap to vote" : "Thanks for voting! Results are sample data.") +
      "</footer></article></div>"
    );
  }

  function eventsView() {
    var ev = [
      { id: "e1", day: "THU", d: "15", t: "Instructor onboarding: AI Builders Lab", meta: "Live room · 60 min · 16:00", kind: "Live room", c: "lime" },
      { id: "e2", day: "TUE", d: "20", t: "Session 4 clinic: goals and limits", meta: "Live room · 45 min · 17:30", kind: "Live room", c: "teal" },
      { id: "e3", day: "WED", d: "21", t: "Franchise partner briefing: annual subscription", meta: "Live stream · 30 min · 12:30", kind: "Live stream", c: "pink" },
      { id: "e4", day: "FRI", d: "30", t: "Showcase Friday: share your class projects", meta: "Live room · 40 min · 15:30", kind: "Live room", c: "orange" },
    ];
    return (
      topbar("Events & live rooms", "Network") +
      '<div class="cir-events"><p class="cir-note">' +
      icon("info") +
      '<span>Dates are examples. Circle events support RSVPs, reminders, live rooms and recordings.</span></p>' +
      ev
        .map(function (e) {
          var going = !!state.rsvp[e.id];
          return (
            '<div class="cir-event"><div class="cir-date cir-date--' +
            e.c +
            '"><small>' +
            e.day +
            "</small><b>" +
            e.d +
            '</b><small>OCT</small></div><div class="cir-event__body"><span class="chip">' +
            esc(e.kind) +
            "</span><h4>" +
            esc(e.t) +
            "</h4><p>" +
            esc(e.meta) +
            '</p></div><button type="button" class="btn btn--sm ' +
            (going ? "btn--white" : "btn--lime") +
            '" data-crsvp="' +
            e.id +
            '">' +
            icon(going ? "check" : "calendar", "btn__icon") +
            "<span>" +
            (going ? "Going" : "RSVP") +
            "</span></button></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function membersView() {
    var regions = [
      { r: "South East", note: "Including Guildford, where the pilot could start", people: [["PK", "Priya K.", "Instructor · Certified"], ["DB", "Dan B.", "Franchise partner"], ["LS", "Lena S.", "Instructor · In training"]] },
      { r: "London", note: "", people: [["AO", "Ade O.", "Franchise partner"], ["MJ", "Mia J.", "Instructor · Certified"]] },
      { r: "North West", note: "", people: [["TR", "Tom R.", "Instructor · Certified"], ["SB", "Sana B.", "School partner (ICT lead)"]] },
      { r: "International", note: "Sister networks in the USA and Australia", people: [["JW", "Jess W.", "Partner · USA"], ["KN", "Kai N.", "Partner · Australia"]] },
    ];
    return (
      topbar("Regions & members", "Network") +
      '<div class="cir-members"><p class="cir-note">' +
      icon("info") +
      '<span>All names are examples. Each region is its own Circle space, so partners can talk locally while HQ shares content across the network.</span></p><div class="cir-regions">' +
      regions
        .map(function (g, i) {
          return (
            '<div class="cir-region"><h4>' +
            icon("pin") +
            esc(g.r) +
            "</h4>" +
            (g.note ? '<p class="tiny muted">' + esc(g.note) + "</p>" : "") +
            '<ul>' +
            g.people
              .map(function (p, k) {
                return '<li><span class="cir-avatar cir-avatar--' + ((i + k) % 3) + '">' + p[0] + "</span><span><b>" + esc(p[1]) + "</b><small>" + esc(p[2]) + "</small></span>" + (/Certified/.test(p[2]) ? '<span class="cir-cert">' + icon("shield-check") + "</span>" : "") + "</li>";
              })
              .join("") +
            "</ul></div>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function accessView() {
    var cols = ["Lessons", "Training", "Files", "Lounge", "Regions", "Admin"];
    var groups = [
      { g: "ComputerXplorers HQ", who: "Curriculum & admin team", a: [1, 1, 1, 1, 1, 1], price: "Included" },
      { g: "Franchise partners", who: "Each UK franchise & affiliate group", a: [1, 1, 1, 1, 1, 0], price: "Annual network subscription", ind: true },
      { g: "Instructors", who: "Invited by their franchise partner", a: [1, 1, 1, 1, 1, 0], price: "Covered by partner subscription" },
      { g: "School partners", who: "ICT leads & teachers", a: [1, 0, 1, 0, 0, 0], price: "Free with a booked course" },
      { g: "Parents (optional)", who: "Course updates & showcase", a: [0, 0, 0, 0, 0, 0], price: "Free · read-only space" },
    ];
    return (
      topbar("Access & billing", "Admin") +
      '<div class="cir-access"><div class="cir-table" role="table" aria-label="Who can access what"><div class="cir-tr cir-tr--head" role="row"><span role="columnheader">Access group</span>' +
      cols
        .map(function (c) {
          return '<span role="columnheader">' + esc(c) + "</span>";
        })
        .join("") +
      '<span role="columnheader">Paywall</span></div>' +
      groups
        .map(function (g) {
          return (
            '<div class="cir-tr" role="row"><span role="cell"><b>' +
            esc(g.g) +
            "</b><small>" +
            esc(g.who) +
            "</small></span>" +
            g.a
              .map(function (x) {
                return '<span role="cell" class="cir-yes">' + (x ? icon("check") : '<i class="cir-no">–</i>') + "</span>";
              })
              .join("") +
            '<span role="cell">' +
            esc(g.price) +
            (g.ind ? ' <span class="tag-indicative">Indicative / to confirm</span>' : "") +
            "</span></div>"
          );
        })
        .join("") +
      '</div><div class="cir-kids"><span class="cir-kids__icon">' +
      icon("shield") +
      '</span><div><h4>Children never get Circle accounts</h4><p>Circle\'s terms require members to be 18+, or 13+ with verified parental consent, and its privacy policy says the service isn\'t intended for under-16s. So children (aged 10–11) use the <b>AI Builders Lab</b> with a class code and a builder nickname. The Lab is embedded in Circle lessons for instructors, and works on its own in class.</p></div></div></div>'
    );
  }

  function render(root) {
    var el = root.querySelector("#cir-app");
    var v = state.view;
    var main = v === "lesson" ? lessonView() : v === "feed" ? feedView() : v === "events" ? eventsView() : v === "members" ? membersView() : accessView();
    el.innerHTML = sidebar(v) + '<div class="cir-main">' + main + "</div>";
    U.qsa("[data-cview-tab]", root).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-cview-tab") === v));
    });
    root.querySelector("#cir-url").textContent = "hub.computerxplorers.co.uk/" + (v === "lesson" ? "c/ai-builders-lab/session-" + state.lessonModule : v === "feed" ? "c/instructor-lounge" : v === "events" ? "events" : v === "members" ? "members" : "settings/access");
    mountEmbeds(root);
  }

  var embedScope = null;
  function mountEmbeds(root) {
    if (embedScope) embedScope.dispose();
    embedScope = CX.scope();
    var box = root.querySelector("#cir-embed");
    if (box) {
      var frame = box.querySelector("iframe");
      frame.src = box.getAttribute("data-src");
      var fit = function () {
        var w = box.clientWidth;
        var s = w / 1280;
        frame.style.transform = "scale(" + s + ")";
        box.style.height = Math.round(800 * s) + "px";
      };
      fit();
      var ro = new ResizeObserver(fit);
      ro.observe(box);
      embedScope.add(function () {
        ro.disconnect();
      });
    }
  }

  CX.pages.circle = {
    title: "Circle hub",
    mount: function (root, params, scope) {
      if (params.query && params.query.view) state.view = params.query.view;
      root.innerHTML =
        '<section class="page-hero cirhero on-navy">' +
        ui.curve("M-40 420 C 300 300, 600 560, 900 380 S 1300 160, 1500 300", { cls: "cirhero__curve", viewBox: "0 0 1440 600", draw: true }) +
        '<div class="container container--wide page-hero__inner cirhero__grid"><div>' +
        '<p class="eyebrow">' +
        icon("layers") +
        ' The platform · built on Circle.so</p><h1 class="d1">The AI Builders<br><span class="text-lime">Hub</span></h1>' +
        '<p class="lead">What we\'d build for ComputerXplorers on Circle: one branded home for courses, instructor training, community, live events and the annual subscription, with the child-safe Lab embedded in every lesson.</p></div>' +
        '<div class="cirarch" aria-label="How the two parts fit together">' +
        '<div class="cirarch__box cirarch__box--circle"><p class="cirarch__t">' +
        icon("users") +
        ' Circle hub</p><p class="cirarch__who">For adults: HQ, franchise partners, instructors, school partners</p><ul><li>Courses & lesson plans</li><li>Instructor certification</li><li>Community & regions</li><li>Events & live rooms</li><li>Paywall: annual subscription</li></ul></div>' +
        '<div class="cirarch__link"><span>' +
        icon("arrow-right") +
        '</span><small>embeds</small></div>' +
        '<div class="cirarch__box cirarch__box--lab"><p class="cirarch__t">' +
        icon("layers") +
        ' AI Builders Lab</p><p class="cirarch__who">For children aged 10–11: class code, nickname only</p><ul><li>Four 3D worlds: space, sport, music, the planet</li><li>Prompt Studio + offline AI helper</li><li>Six sessions, one build that grows</li><li>Works offline</li><li>No child accounts on Circle</li></ul></div>' +
        "</div></div></section>" +
        '<section class="cirstage on-navy-2 section section--tight"><div class="container container--wide">' +
        '<div class="cirtabs"><div class="seg" role="group" aria-label="Choose a Circle view">' +
        VIEWS.map(function (v) {
          return '<button type="button" data-cview-tab="' + v.id + '" aria-pressed="false">' + icon(v.icon) + " " + esc(v.label) + "</button>";
        }).join("") +
        '</div><span class="tag-sample">Illustrative mock-up · sample content</span></div>' +
        '<div class="cir" role="region" aria-label="Circle hub mock-up"><div class="cir-chrome"><span class="cir-dots"><i></i><i></i><i></i></span><span class="cir-url">' +
        icon("lock") +
        '<span id="cir-url"></span></span><span class="cir-chrome__note">Example address</span></div><div class="cir-app" id="cir-app"></div></div>' +
        "</div></section>" +
        '<section class="section on-cream"><div class="container container--wide">' +
        '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("check") +
        ' Why Circle</p><h2 class="d1">One home for<br>the whole network</h2></div><div><p class="lead">Circle gives ComputerXplorers courses, community, events and payments in one branded place, so we only custom-build what makes the learning special: the Lab.</p></div></div>' +
        '<div class="grid grid-4">' +
        [
          ["book", "Courses + lesson plans", "Six sessions as a Circle course: plans, running orders and the embedded Lab, with drip release and completion tracking for instructors."],
          ["key", "Access groups + paywalls", "Each franchise partner subscribes annually. Their instructors join through access groups, and HQ controls who sees what."],
          ["calendar", "Events + live rooms", "Onboarding, monthly clinics and showcase sessions, with RSVPs, reminders and recordings."],
          ["globe", "Your brand, your domain", "Brand colours, logo and a custom domain. A branded mobile app is available on higher Circle plans."],
        ]
          .map(function (c, i) {
            return '<div class="card cirwhy" data-reveal style="--delay:' + i * 80 + 'ms"><span class="cirwhy__icon">' + icon(c[0]) + "</span><h3>" + esc(c[1]) + "</h3><p>" + esc(c[2]) + "</p></div>";
          })
          .join("") +
        "</div>" +
        '<div class="cirplan"><h3 class="d3">How we\'d build it</h3><span class="tag-indicative">Indicative plan</span><ol class="cirplan__steps">' +
        [
          ["Set up", "Circle community, branding, custom domain, spaces, access groups and the annual subscription paywall."],
          ["Load the course", "Six sessions with plans, prompts, printables, and the Lab embedded in every session."],
          ["Train instructors", "Certification course and live onboarding. Instructors earn a Certified badge."],
          ["Pilot", "Two or three clubs (for example in the South East), with feedback captured in the community."],
          ["Roll out", "Regional spaces for the whole UK network, then the international sister networks."],
        ]
          .map(function (s, i) {
            return '<li data-reveal style="--delay:' + i * 80 + 'ms"><span class="cirplan__n">' + (i + 1) + "</span><b>" + esc(s[0]) + "</b><p>" + esc(s[1]) + "</p></li>";
          })
          .join("") +
        "</ol></div></div></section>" +
        CX.layout.footer();

      render(root);
      scope.add(function () {
        if (embedScope) embedScope.dispose();
      });
      scope.add(
        U.on(root, "click", "[data-cview-tab], [data-cview]", function (e, t) {
          e.preventDefault();
          state.view = t.getAttribute("data-cview-tab") || t.getAttribute("data-cview");
          var defaults = { lesson: "lesson", feed: "feed", events: "events", members: "members", access: "access" };
          state.space = t.getAttribute("data-cspace") || defaults[state.view];
          render(root);
        })
      );
      scope.add(
        U.on(root, "click", "[data-cworld]", function (e, t) {
          state.world = t.getAttribute("data-cworld");
          render(root);
        })
      );
      scope.add(
        U.on(root, "click", "[data-cmod]", function (e, t) {
          state.lessonModule = Number(t.getAttribute("data-cmod"));
          state.lessonPart = "activity";
          render(root);
        })
      );
      scope.add(
        U.on(root, "click", "[data-cpart]", function (e, t) {
          state.lessonPart = t.getAttribute("data-cpart");
          render(root);
        })
      );
      scope.add(
        U.on(root, "click", "[data-ccomplete]", function (e, t) {
          var k = t.getAttribute("data-ccomplete");
          if (state.complete[k]) delete state.complete[k];
          else state.complete[k] = true;
          render(root);
        })
      );
      scope.add(
        U.on(root, "click", "[data-crsvp]", function (e, t) {
          var k = t.getAttribute("data-crsvp");
          state.rsvp[k] = !state.rsvp[k];
          render(root);
          if (state.rsvp[k]) ui.toast("You're going. Circle would send a reminder.", "calendar");
        })
      );
      scope.add(
        U.on(root, "click", "[data-cpoll]", function (e, t) {
          state.poll = Number(t.getAttribute("data-cpoll"));
          render(root);
        })
      );
      scope.add(
        U.on(root, "click", "[data-cletter]", function () {
          ui.dialog({
            title: "Parent letter (template)",
            body:
              '<div class="stack"><p>Dear parent or carer,</p><p>This half-term your child will join <b>AI Builders Lab</b>, six one-hour ComputerXplorers sessions where children learn maths and science by building with AI: a planet, a free kick, a piece of music or a town\'s power supply.</p><p>Children never chat freely with an AI. They learn to write clear instructions (prompts), predict what will happen, test it and decide whether to keep each change. Instructors can see every prompt.</p><p>Your child uses a <b>builder nickname</b>, not their name, and no personal information is needed. In the last session they make a share card of their finished build, which you\'ll be able to open with a link.</p><p>Thank you,<br>The ComputerXplorers team</p><p class="small muted">Template for adaptation. Data-processing details to be confirmed with ComputerXplorers.</p></div>',
          });
        })
      );
    },
  };
})();
