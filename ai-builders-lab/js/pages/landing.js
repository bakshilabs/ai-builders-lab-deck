/* ==========================================================================
   Landing / proposal page (#/)
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  var TICKER = ["Prompt", "Predict", "Test", "Decide", "Explain", "Maths", "Science", "6 sessions", "Ages 10–11", "Works offline", "3D + sound"];

  /* The Planet Builder story, session by session (numbers match the build) */
  var GROW = [
    { result: "An Earth-like planet. Jump 0.5 m.", note: "The AI guessed the size, the look, the gravity and no rings." },
    { result: "A small red planet like Mars. Jump 1.3 m.", note: "Every detail removed a guess." },
    { result: "Gravity ÷2 → jump ×2: 1.0 m.", note: "The child predicted “twice as high” before testing." },
    { result: "A 7.8 m jump that lands in 10 s.", note: "Without the limit, the AI set gravity to 0 and the astronaut floated away." },
    { result: "Earth 0.5 m · Mars 1.3 m · Moon 3.0 m.", note: "Gravity × jump height ≈ 4.8 every time." },
    { result: "Zorb: a finished Planet Passport to share.", note: "Name, look, moons and rings, with the gravity kept the same." },
  ];

  function hero() {
    var ex = "Make gravity half of Earth's so my astronaut jumps twice as high";
    var a = CX.prompt.analyse(ex, CX.builds.get("planet"));
    return (
      '<section class="lhero lhero--v2 on-navy">' +
      '<div class="lhero3d" id="hero3d" aria-hidden="true"></div>' +
      '<div class="container container--wide lhero__grid">' +
      '<div class="lhero__copy">' +
      '<p class="eyebrow lhero__eyebrow" data-reveal>' +
      ui.sparkle("sparkle--sm") +
      "New from ComputerXplorers · ages 10–11 · 6 sessions</p>" +
      '<h1 class="hero-type lhero__title" data-reveal style="--delay:80ms">Build<br>with <span class="text-lime">AI.</span></h1>' +
      '<p class="lead lhero__lead" data-reveal style="--delay:160ms">Children learn maths and science by building with AI: a planet, a free kick, a track, a town\'s power. Every session they get better at prompting. They predict what will happen, test it and see the cause and effect.</p>' +
      '<div class="cluster lhero__ctas" data-reveal style="--delay:240ms">' +
      ui.btn({ label: "Choose a world", href: "#/lab", size: "lg" }) +
      ui.btn({ label: "See the six sessions", href: "#/curriculum", variant: "ghost", size: "lg", arrowIcon: "arrow-right" }) +
      "</div>" +
      '<ul class="lhero__trust" data-reveal style="--delay:320ms">' +
      "<li>" +
      icon("clock") +
      "<span>6 sessions<br>of 1 hour</span></li>" +
      "<li>" +
      icon("users") +
      "<span>Instructor-led<br>classes of 15</span></li>" +
      "<li>" +
      icon("offline") +
      "<span>Works offline<br>behind school firewalls</span></li>" +
      "</ul></div>" +
      '<div class="lhero__float">' +
      '<div class="lhcard lhcard--prompt" data-reveal="right" style="--delay:300ms"><p class="lhcard__k">' +
      icon("chat") +
      'A session 3 prompt <span class="st-pow" data-n="' +
      a.count +
      '">' +
      a.count +
      '/6</span></p><p class="lhcard__p">“' +
      CX.prompt.highlight(ex, a) +
      '”</p></div>' +
      '<div class="lhcard lhcard--fx" data-reveal="right" style="--delay:450ms"><p class="lhcard__k">Cause and effect</p><p class="lhcard__fx">Gravity ÷2 <b>→</b> jump ×2</p></div>' +

      "</div></div>" +
      '<div class="lhero__ticker">' +
      ui.ticker(TICKER, { cls: "ticker--bar" }) +
      "</div></section>"
    );
  }

  function philosophy() {
    var c = CX.data.course;
    return (
      '<section class="lphil on-lime section"><div class="container container--wide">' +
      '<h2 class="hero-type lphil__t" data-reveal>This isn\'t a<br>game-playing club.</h2>' +
      '<p class="lead lphil__lead" data-reveal style="--delay:100ms">Children build something real by learning to work with AI. They make the decisions, learn to prompt and see cause and effect, and the maths and science come with it.</p>' +
      '<div class="lphil__grid">' +
      [
        ["chat", "Learn to prompt", "Six ingredients: what, details, numbers, goal, limits and check. Prompts grow from three words to a full brief."],
        ["hand", "Make decisions", "After every test, the child decides: keep it, or undo it and improve the prompt. The AI never decides for them."],
        ["flask", "See cause and effect", "Predict, then test. Every change shows what happened and by how much, in numbers children can check."],
      ]
        .map(function (p, i) {
          return '<div class="lphil__card" data-reveal style="--delay:' + (150 + i * 90) + 'ms"><span class="lphil__icon">' + icon(p[0]) + "</span><h3>" + esc(p[1]) + "</h3><p>" + esc(p[2]) + "</p></div>";
        })
        .join("") +
      "</div></div></section>"
    );
  }

  function grow() {
    var S = CX.data.course.sessions;
    var def = CX.builds.get("planet");
    var rows = S.map(function (s, i) {
      var p = s.prompt.space;
      var a = CX.prompt.analyse(p, def);
      return { s: s, p: p, a: a, g: [4, 0, 0, 0, 0, 0][i], r: GROW[i] };
    });
    return (
      '<section class="lgrow on-navy section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("trend") +
      ' Watch a prompt grow</p><h2 class="d1">Session 1 to 6,<br><span class="text-lime">one child, one planet</span></h2></div><div><p class="lead">The same child in Planet Builder. Each session adds one ingredient to their prompting, and the build grows with it. Click a session.</p></div></div>' +
      '<div class="lgrow__grid" id="lgrow">' +
      '<ol class="lgrow__rungs">' +
      rows
        .map(function (r, i) {
          return (
            '<li><button type="button" class="lgrow__rung" data-rung="' +
            i +
            '" aria-pressed="' +
            (i === 0) +
            '"><span class="lgrow__n">S' +
            r.s.n +
            '</span><span class="lgrow__skill">' +
            esc(r.s.skill) +
            '</span><span class="lgrow__bar"><i style="--w:' +
            Math.round((r.a.count / 6) * 100) +
            '%"></i></span><span class="lgrow__c">' +
            r.a.count +
            "/6</span></button></li>"
          );
        })
        .join("") +
      "</ol>" +
      '<div class="lgrow__stage card card--dark" aria-live="polite">' +
      rows
        .map(function (r, i) {
          return (
            '<div class="lgrow__panel" data-panel="' +
            i +
            '"' +
            (i ? " hidden" : "") +
            '><p class="lgrow__k">Session ' +
            r.s.n +
            " · " +
            esc(r.s.skill) +
            '</p><p class="lgrow__p">“' +
            CX.prompt.highlight(r.p, r.a) +
            '”</p><div class="lgrow__ings">' +
            CX.prompt.INGREDIENTS.map(function (g) {
              return '<span class="st-ing st-ing--' + g.id + (r.a.has[g.id] ? " is-on" : "") + '">' + icon(g.icon) + "<b>" + esc(g.label) + "</b></span>";
            }).join("") +
            '</div><div class="lgrow__res"><div><small>What happened</small><b>' +
            esc(r.r.result) +
            "</b></div><div><small>AI guesses</small><b class=\"" +
            (r.g ? "is-guess" : "is-zero") +
            '">' +
            r.g +
            "</b></div></div><p class=\"lgrow__note\">" +
            icon("info") +
            esc(r.r.note) +
            "</p></div>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="cluster lgrow__cta">' +
      ui.btn({ label: "Try session 1 yourself", href: "#/build/planet/1" }) +
      "</div></div></section>"
    );
  }

  function worlds() {
    return (
      '<section class="lworlds2 on-navy-2 section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("layers") +
      ' Four worlds</p><h2 class="d1">Same skills.<br>Different worlds.</h2></div><div><p class="lead">Every child learns the same skill in each session, in the world they care about. The instructor teaches it once, and the class compares across worlds.</p>' +
      ui.btn({ label: "Open the Build Lab", href: "#/lab" }) +
      "</div></div>" +
      '<div class="lw__grid">' +
      CX.builds.list
        .map(function (b, i) {
          return (
            '<a class="lw lw--' +
            b.colour +
            '" href="#/build/' +
            b.id +
            '/1" data-reveal style="--delay:' +
            i * 80 +
            'ms"><div class="lw__media"><img src="assets/builds/' +
            b.id +
            '.jpg" alt="" loading="lazy" onerror="this.remove()"><span class="lw__glyph">' +
            icon(b.interest.icon) +
            '</span></div><div class="lw__body"><p class="lw__k">' +
            esc(b.interest.label) +
            "</p><h3>" +
            esc(b.title) +
            "</h3><p>" +
            esc(b.subjects
              .map(function (s) {
                return s.k + ": " + s.t.toLowerCase();
              })
              .join(" · ")) +
            '</p><span class="lw__prod">' +
            icon("star") +
            esc(b.productName) +
            "</span></div></a>"
          );
        })
        .join("") +
      "</div></div></section>"
    );
  }

  function loop() {
    var L = CX.data.course.loop;
    return (
      '<section class="lloop on-cream section"><div class="container container--wide lloop__grid">' +
      '<div><p class="eyebrow">' +
      icon("repeat") +
      ' The learning loop</p><h2 class="d1">Idea. Prompt.<br>Predict. Test.<br>Decide. Explain.</h2><p class="lead">Prompt, predict, test and decide repeat. Each repeat is a new version of the child\'s prompt, and the prompt ladder records every one.</p></div>' +
      '<ol class="lloop__ring" data-reveal>' +
      L.map(function (l, i) {
        var ang = -90 + i * 60;
        return (
          '<li class="lloop__node' +
          (i >= 1 && i <= 4 ? " is-repeat" : "") +
          '" style="--a:' +
          ang +
          'deg;--i:' +
          i +
          '"><span class="lloop__icon">' +
          icon(l.icon) +
          "</span><b>" +
          esc(l.label) +
          "</b><small>" +
          esc(l.text) +
          "</small></li>"
        );
      }).join("") +
      '<li class="lloop__hub" aria-hidden="true">' +
      icon("repeat") +
      "<span>Prompt → Decide<br>repeats</span></li>" +
      "</ol></div></section>"
    );
  }

  function sessions() {
    var S = CX.data.course.sessions;
    var levels = CX.data.course.progression;
    return (
      '<section class="lsess on-white section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("calendar") +
      ' One unit · six sessions · one hour each</p><h2 class="d1">From first prompt<br>to finished product</h2></div><div><p class="lead">Each session adds one skill, and the build carries over from session to session. By session 6, children have a finished product with their name on it, and a prompt ladder that shows how much they\'ve grown.</p>' +
      ui.btn({ label: "Session plans", href: "#/teach", variant: "navy" }) +
      "</div></div>" +
      '<ol class="lsess__track">' +
      S.map(function (s, i) {
        var lv = levels.filter(function (l) {
          return l.id === s.level;
        })[0];
        return (
          '<li class="lsess__step lsess__step--' +
          s.colour +
          '" data-reveal style="--delay:' +
          i * 70 +
          'ms"><span class="lsess__n">' +
          s.n +
          '</span><h3>' +
          esc(s.skill) +
          '</h3><p class="lsess__can"><b>After this session:</b> ' +
          esc(s.ability) +
          '</p><p class="lsess__lv">' +
          icon(lv ? lv.icon : "star") +
          esc(lv ? lv.title : "") +
          "</p></li>"
        );
      }).join("") +
      "</ol></div></section>"
    );
  }

  function products() {
    var items = CX.data.showcase;
    return (
      '<section class="lprod on-navy section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("star") +
      ' Session 6</p><h2 class="d1">Something to share<br><span class="text-lime">and be proud of</span></h2></div><div><p class="lead">Session 6 ends with a share card: the finished build, the child\'s first and best prompts, the maths and science, and a chart of how their prompts grew. A share link opens it for family and friends, using a nickname only.</p>' +
      ui.btn({ label: "Open the class showcase", href: "#/showcase" }) +
      '</div></div><div class="lprod__grid">' +
      items
        .map(function (it, i) {
          var b = CX.builds.get(it.id);
          var prod = b.product(it.p, it);
          return (
            '<a class="ptile ptile--' +
            b.colour +
            '" href="#/share/' +
            b.id +
            "?d=" +
            CX.share.encode(it) +
            '" data-reveal style="--delay:' +
            i * 80 +
            'ms"><div class="ptile__media"><img src="assets/builds/' +
            b.id +
            '.jpg" alt="" loading="lazy" onerror="this.remove()"><span class="ptile__kind">' +
            icon(b.interest.icon) +
            esc(prod.kind) +
            '</span></div><div class="ptile__body"><h3>' +
            esc(prod.title) +
            "</h3><p class=\"ptile__by\">by " +
            esc(it.by) +
            '</p><div class="ptile__grow"><span><small>Session 1</small><b>' +
            it.first.c +
            "/6</b></span>" +
            icon("arrow-right") +
            "<span><small>Session 6</small><b>" +
            it.best.c +
            "/6</b></span><span><small>AI guesses</small><b>" +
            it.first.g +
            " → " +
            it.best.g +
            '</b></span></div></div><span class="tag-sample">Sample</span></a>'
          );
        })
        .join("") +
      "</div></div></section>"
    );
  }

  function progression() {
    var lv = CX.data.course.progression;
    var when = ["Session 1", "Sessions 2–3", "Sessions 4–5", "Session 6"];
    var descr = [
      "Takes whatever the AI makes, guesses and all.",
      "Builds with AI one step at a time, adding details and numbers.",
      "Predicts, tests and catches the AI doing what it was told, not what was meant.",
      "Writes six-ingredient prompts, decides from evidence and explains every choice.",
    ];
    return (
      '<section class="lprog on-navy-2 section">' +
      '<div class="container">' +
      '<div class="sec-head sec-head--center"><p class="eyebrow">' +
      icon("trend") +
      ' The journey</p><h2 class="d1">From AI user<br>to creator</h2><p class="lead">The same move from passive user to confident creator that ComputerXplorers already makes with technology, now with AI, measured session by session.</p></div>' +
      '<div class="lprog__path">' +
      ui.curve("M40 260 C 260 260, 300 60, 520 80 S 820 300, 1000 220 S 1260 40, 1400 60", { cls: "lprog__curve curve--thin", viewBox: "0 0 1440 320", draw: true, style: "--curve-w:8" }) +
      '<ol class="lprog__stops">' +
      lv
        .map(function (l, i) {
          return (
            '<li class="lprog__stop" data-reveal style="--delay:' +
            i * 140 +
            'ms"><span class="lprog__n">' +
            esc(when[i]) +
            '</span><span class="lprog__icon">' +
            icon(l.icon) +
            '</span><h3 class="lprog__t">' +
            esc(l.title) +
            '</h3><p class="lprog__d">' +
            esc(descr[i]) +
            "</p></li>"
          );
        })
        .join("") +
      "</ol></div></div></section>"
    );
  }

  function classrooms() {
    return (
      '<section class="lclass on-teal section">' +
      '<div class="container container--wide">' +
      '<h2 class="hero-type lclass__title" data-reveal>Ready for<br>real classrooms</h2>' +
      '<p class="lead lclass__lead">Designed around what ComputerXplorers told us: sessions a non-specialist can pick up and run, school IT that blocks things, and serious care with children\'s data.</p>' +
      '<div class="lclass__cards">' +
      '<div class="card lclass__card" data-reveal>' +
      ui.photo("instructors", { ratio: "16 / 9" }) +
      '<h3 class="d4">Instructors get</h3><ul class="ticks"><li>Six ready-to-run 60-minute session plans</li><li>One skill per session for the whole class, whatever world each child chose</li><li>The words to say, success checks and three levels of challenge</li><li>A class view of every child\'s prompt and where they are in the loop</li></ul>' +
      ui.btn({ label: "Open a session plan", href: "#/teach/4", variant: "navy", size: "sm" }) +
      "</div>" +
      '<div class="card lclass__card" data-reveal style="--delay:120ms">' +
      ui.photo("schools", { ratio: "16 / 9" }) +
      '<h3 class="d4">Schools get</h3><ul class="ticks"><li>Works when AI sites are blocked: the AI helper runs offline</li><li>Runs in the browser: 3D and sound need nothing installed</li><li>Nicknames only, with no unnecessary personal data</li><li>No open-ended AI chat. The AI only changes the build</li></ul>' +
      ui.btn({ label: "IT, data & safeguarding", href: "#/schools", variant: "navy", size: "sm" }) +
      "</div></div>" +
      '<div class="lclass__checks grid grid-4">' +
      [
        ["AI supports the instructor", "Session plans, prompts and the class view keep the instructor in charge.", "var(--blue-400)"],
        ["Minimal child data", "Builder nicknames, progress kept on the device, retention set by the school.", "var(--orange-400)"],
        ["Works behind firewalls", "No CDN calls and a full offline mode. Approved domains only when online.", "var(--pink-500)"],
        ["Age-appropriate by design", "The AI only changes the build, blocks personal info and keeps things kind.", "#8d63c9"],
      ]
        .map(function (c) {
          return '<div class="checkcard" style="--c:' + c[2] + '">' + icon("check") + "<div><h4>" + esc(c[0]) + "</h4><p>" + esc(c[1]) + "</p></div></div>";
        })
        .join("") +
      "</div></div></section>"
    );
  }

  function today() {
    var d = CX.data.orgToday;
    return (
      '<section class="ltoday on-navy section">' +
      ui.bit({ colour: "pink", face: "wink", size: 110, rot: -12, cls: "ltoday__bit1" }) +
      ui.bit({ colour: "orange", face: "wow", size: 84, rot: 14, cls: "ltoday__bit2", slow: true }) +
      '<div class="container center">' +
      '<p class="ltoday__pre">Over 25 years, ComputerXplorers has helped over</p>' +
      '<p class="bignum ltoday__num" data-count="200000" data-dur="1800">0</p>' +
      '<p class="ltoday__post">children build lifelong digital skills.</p>' +
      '<div class="ltoday__stats">' +
      d
        .filter(function (s) {
          return s.value !== 200000;
        })
        .map(function (s) {
          return '<div class="ltoday__stat"><span class="d2" data-count="' + s.value + '" data-prefix="' + (s.prefix || "") + '" data-suffix="' + (s.suffix || "") + '">0</span><span>' + esc(s.label) + "</span></div>";
        })
        .join("") +
      "</div>" +
      '<p class="note ltoday__note">' +
      icon("info") +
      "<span>These figures describe <b>ComputerXplorers today</b>, as published on computerxplorers.co.uk. They are <b>not</b> results for AI Builders Lab. The new platform would build on this existing network.</span></p>" +
      '<div class="cluster" style="justify-content:center;margin-top:2rem">' +
      ui.btn({ label: "See how it scales", href: "#/org" }) +
      "</div></div></section>"
    );
  }

  function finale() {
    return (
      '<section class="lfinal on-lime section">' +
      '<div class="arch lfinal__arch1"></div><div class="arch lfinal__arch2"></div>' +
      '<div class="container center lfinal__inner">' +
      '<h2 class="hero-type">Ready to build?</h2>' +
      '<p class="lead" style="margin:1.5rem auto 0">Take the guided tour of the student, instructor and organisation views, or jump straight into a world.</p>' +
      '<div class="cluster" style="justify-content:center;margin-top:2rem">' +
      ui.btn({ label: "Take the tour", variant: "navy", size: "lg", icon: "play", attrs: "data-tour-start" }) +
      ui.btn({ label: "Choose a world", href: "#/lab", variant: "white", size: "lg" }) +
      "</div></div></section>"
    );
  }

  /* ---- 3D hero: four interest worlds orbiting a glowing AI core ---------------- */
  function heroScene(host, scope) {
    if (!CX.three || !CX.three.ok()) return;
    var T = THREE,
      X = CX.three;
    var st = X.stage(host, { background: 0x0b012b, fov: 36, bloom: { strength: 0.8, radius: 0.6, threshold: 1.0 }, exposure: 0.95, envIntensity: 0.5 });
    scope.add(st.dispose);
    var sc = st.scene,
      cam = st.camera;
    cam.position.set(0, 2.4, 15);
    sc.add(new T.HemisphereLight(0xb9b2ff, 0x1a0d52, 0.8));
    var key = new T.DirectionalLight(0xffffff, 2);
    key.position.set(-6, 8, 8);
    sc.add(key);
    sc.add(X.stars({ count: 1600, radius: 90, size: 0.7 }));

    var rig = new T.Group();
    rig.position.set(5.6, 0.4, 0);
    sc.add(rig);
    var tilt = new T.Group();
    tilt.rotation.x = 0.32;
    tilt.rotation.z = -0.12;
    rig.add(tilt);

    // AI core
    var core = new T.Mesh(new T.IcosahedronGeometry(0.95, 1), new T.MeshStandardMaterial({ color: 0x1a0d52, emissive: 0xdbe751, emissiveIntensity: 0.55, flatShading: true, roughness: 0.3, metalness: 0.4 }));
    tilt.add(core);
    var shell = new T.Mesh(new T.IcosahedronGeometry(1.3, 1), new T.MeshBasicMaterial({ color: 0x49a7a9, wireframe: true, transparent: true, opacity: 0.35 }));
    tilt.add(shell);
    tilt.add(X.glow(0xdbe751, 4.2, 0.3));
    var orbit = new T.Mesh(new T.TorusGeometry(3.5, 0.012, 8, 160), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
    orbit.rotation.x = Math.PI / 2;
    tilt.add(orbit);

    function ballTex() {
      var c = document.createElement("canvas");
      c.width = 128;
      c.height = 64;
      var g = c.getContext("2d");
      g.fillStyle = "#f4f4f6";
      g.fillRect(0, 0, 128, 64);
      g.fillStyle = "#1a1530";
      [[16, 16], [52, 36], [88, 14], [112, 44], [30, 50]].forEach(function (p) {
        g.beginPath();
        for (var i = 0; i < 5; i++) {
          var a = (i / 5) * Math.PI * 2;
          g.lineTo(p[0] + Math.cos(a) * 8, p[1] + Math.sin(a) * 8);
        }
        g.fill();
      });
      var t = new T.CanvasTexture(c);
      t.colorSpace = T.SRGBColorSpace;
      return t;
    }

    function world(kind) {
      var g = new T.Group();
      if (kind === "space") {
        var p = new T.Mesh(new T.SphereGeometry(0.62, 48, 32), new T.MeshStandardMaterial({ color: 0xd0623a, roughness: 0.8 }));
        g.add(p);
        var r = new T.Mesh(new T.RingGeometry(0.85, 1.2, 64), new T.MeshBasicMaterial({ color: 0xefabcd, side: T.DoubleSide, transparent: true, opacity: 0.85 }));
        r.rotation.x = -Math.PI / 2 + 0.4;
        g.add(r);
        var bit = X.bit({ colour: "pink", shadow: false });
        bit.scale.setScalar(0.22);
        bit.position.y = 0.6;
        g.add(bit);
      } else if (kind === "sport") {
        var ball = new T.Mesh(new T.SphereGeometry(0.42, 40, 28), new T.MeshStandardMaterial({ map: ballTex(), roughness: 0.4 }));
        ball.position.y = 0.1;
        g.add(ball);
        var pitch = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.08, 40), new T.MeshStandardMaterial({ color: 0x2b8a3e, roughness: 0.9 }));
        pitch.position.y = -0.38;
        g.add(pitch);
        var goal = new T.Mesh(new T.TorusGeometry(0.35, 0.025, 8, 40, Math.PI), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x666666 }));
        goal.position.set(0.55, -0.34, 0);
        goal.rotation.y = Math.PI / 2;
        g.add(goal);
        g.userData.spin = ball;
      } else if (kind === "music") {
        for (var i = 0; i < 9; i++) {
          var pad = new T.Mesh(new T.BoxGeometry(0.3, 0.12, 0.3), new T.MeshStandardMaterial({ color: 0x241a5a, emissive: [0xefabcd, 0x7fd6d8, 0xdbe751][i % 3], emissiveIntensity: i % 2 ? 1.6 : 0.2 }));
          pad.position.set(((i % 3) - 1) * 0.38, -0.2, (Math.floor(i / 3) - 1) * 0.38);
          g.add(pad);
        }
        var wave = new T.Mesh(new T.TorusKnotGeometry(0.32, 0.05, 80, 8, 2, 5), new T.MeshStandardMaterial({ color: 0x0b012b, emissive: 0x49d6d8, emissiveIntensity: 1.4 }));
        wave.position.y = 0.35;
        g.add(wave);
        g.userData.pads = g.children.slice(0, 9);
        g.userData.spin = wave;
      } else {
        var isl = new T.Mesh(new T.CylinderGeometry(0.85, 0.6, 0.35, 32), new T.MeshStandardMaterial({ color: 0x4f9a52, roughness: 0.9 }));
        isl.position.y = -0.3;
        g.add(isl);
        for (var h = 0; h < 4; h++) {
          var house = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial({ color: 0xf6f3ee, emissive: 0xffc56b, emissiveIntensity: 0.25 }));
          house.position.set(-0.4 + h * 0.18, -0.02, 0.25 - (h % 2) * 0.2);
          g.add(house);
        }
        var tower = new T.Mesh(new T.CylinderGeometry(0.02, 0.03, 0.8, 8), new T.MeshStandardMaterial({ color: 0xffffff }));
        tower.position.set(0.4, 0.27, -0.1);
        g.add(tower);
        var rotor = new T.Group();
        rotor.position.set(0.4, 0.67, -0.05);
        for (var bl = 0; bl < 3; bl++) {
          var arm = new T.Group();
          arm.rotation.z = (bl * Math.PI * 2) / 3;
          var blade = new T.Mesh(new T.BoxGeometry(0.04, 0.38, 0.01), new T.MeshStandardMaterial({ color: 0xffffff }));
          blade.position.y = 0.19;
          arm.add(blade);
          rotor.add(arm);
        }
        g.add(rotor);
        g.userData.rotor = rotor;
      }
      return g;
    }

    var kinds = [
      { id: "space", build: "planet", label: "Space", title: "Planet Builder" },
      { id: "sport", build: "kick", label: "Sport", title: "Kick Lab" },
      { id: "music", build: "beat", label: "Music", title: "Beat Lab" },
      { id: "planet", build: "power", label: "The planet", title: "Power Town" },
    ];
    var worlds = kinds.map(function (k, i) {
      var w = world(k.id);
      var holder = new T.Group();
      holder.add(w);
      tilt.add(holder);
      var a = document.createElement("a");
      a.className = "h3d-label";
      a.href = "#/build/" + k.build + "/1";
      a.innerHTML = "<small>" + U.esc(k.label) + "</small>" + U.esc(k.title);
      a.setAttribute("tabindex", "-1");
      st.pin(a, holder, new T.Vector3(0, -1.15, 0));
      return { holder: holder, w: w, base: (i / kinds.length) * Math.PI * 2 };
    });

    // Prompt particles flowing out from the core
    var N = 260;
    var pos = new Float32Array(N * 3);
    var seeds = [];
    for (var j = 0; j < N; j++) seeds.push({ w: j % 4, t: Math.random(), s: 0.25 + Math.random() * 0.35 });
    var pg = new T.BufferGeometry();
    pg.setAttribute("position", new T.BufferAttribute(pos, 3));
    var cols = new Float32Array(N * 3);
    var pal = [new T.Color(0xdbe751), new T.Color(0xefabcd), new T.Color(0x7fd6d8), new T.Color(0xf6a26b)];
    for (var k2 = 0; k2 < N; k2++) {
      var cc = pal[seeds[k2].w];
      cols[k2 * 3] = cc.r;
      cols[k2 * 3 + 1] = cc.g;
      cols[k2 * 3 + 2] = cc.b;
    }
    pg.setAttribute("color", new T.BufferAttribute(cols, 3));
    var parts = new T.Points(pg, new T.PointsMaterial({ size: 0.09, map: X.dot(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    tilt.add(parts);

    var mx = 0,
      my = 0;
    function onMove(e) {
      var r = host.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    scope.add(function () {
      window.removeEventListener("pointermove", onMove);
    });

    var v = new T.Vector3();
    st.onFrame(function (dt, time) {
      core.rotation.y += dt * 0.4;
      core.rotation.x += dt * 0.15;
      shell.rotation.y -= dt * 0.25;
      core.material.emissiveIntensity = 0.5 + Math.sin(time * 2) * 0.15;
      worlds.forEach(function (w, i) {
        var a = w.base + time * 0.16;
        w.holder.position.set(Math.cos(a) * 3.5, Math.sin(time * 0.9 + i) * 0.18, Math.sin(a) * 3.5);
        w.holder.rotation.y = -a + Math.PI / 2;
        w.w.rotation.y += dt * 0.5;
        if (w.w.userData.spin) w.w.userData.spin.rotation.x += dt * 1.2;
        if (w.w.userData.rotor) w.w.userData.rotor.rotation.z -= dt * 3;
        if (w.w.userData.pads)
          w.w.userData.pads.forEach(function (p, k) {
            p.material.emissiveIntensity = Math.max(0.15, Math.sin(time * 6 - k) * 1.6);
          });
      });
      var arr = pg.attributes.position.array;
      for (var n = 0; n < N; n++) {
        var sd = seeds[n];
        sd.t += dt * sd.s;
        if (sd.t > 1) sd.t -= 1;
        var target = worlds[sd.w].holder.position;
        var t = sd.t;
        var lift = Math.sin(t * Math.PI) * 0.8;
        arr[n * 3] = target.x * t + Math.sin(n * 12.9 + time) * 0.06;
        arr[n * 3 + 1] = target.y * t + lift + Math.cos(n * 7.3) * 0.08;
        arr[n * 3 + 2] = target.z * t + Math.cos(n * 3.1 + time) * 0.06;
      }
      pg.attributes.position.needsUpdate = true;
      rig.rotation.y += (mx * 0.25 - rig.rotation.y) * 0.04;
      rig.rotation.x += (my * 0.12 - rig.rotation.x) * 0.04;
      cam.lookAt(2.4, 0.2, 0);
    });
  }

  /* ---- Prompt growth stepper ------------------------------------------------- */
  function mountGrow(root, scope) {
    var box = root.querySelector("#lgrow");
    if (!box) return;
    var i = 0,
      timer = null,
      touched = false;
    function show(n, user) {
      i = n;
      U.qsa("[data-rung]", box).forEach(function (b) {
        b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-rung")) === n));
      });
      U.qsa("[data-panel]", box).forEach(function (p) {
        p.hidden = Number(p.getAttribute("data-panel")) !== n;
      });
      if (user && CX.sound) CX.sound.play("tap");
    }
    scope.add(
      U.on(box, "click", "[data-rung]", function (e, b) {
        touched = true;
        clearInterval(timer);
        show(Number(b.getAttribute("data-rung")), true);
      })
    );
    if (!U.reducedMotion() && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !touched && !timer) {
          timer = setInterval(function () {
            show((i + 1) % 6);
          }, 2600);
        } else if (!en[0].isIntersecting && timer) {
          clearInterval(timer);
          timer = null;
        }
      });
      io.observe(box);
      scope.add(function () {
        io.disconnect();
        clearInterval(timer);
      });
    }
  }

  CX.pages.landing = {
    title: "",
    mount: function (root, params, scope) {
      root.innerHTML = hero() + philosophy() + grow() + worlds() + loop() + sessions() + products() + progression() + classrooms() + today() + finale() + CX.layout.footer();
      heroScene(root.querySelector("#hero3d"), scope);
      mountGrow(root, scope);
    },
  };
})();
