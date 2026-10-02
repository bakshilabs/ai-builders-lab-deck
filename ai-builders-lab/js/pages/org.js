/* ==========================================================================
   Organisation (#/org) and Schools (#/schools)
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  function money(n) {
    return "£" + U.fmt(Math.round(n));
  }

  /* ======================================================================= */
  CX.pages.org = {
    title: "Organisation",
    mount: function (root, params, scope) {
      var today = CX.data.orgToday;
      var meet = CX.data.orgMeeting;
      var tiers = [
        { n: 1, label: "One platform", sub: "AI Builders Lab + the Circle hub", dots: 1 },
        { n: 2, label: "Many instructors", sub: "Certified through the hub", dots: 8 },
        { n: 3, label: "Many clubs", sub: "After-school clubs & camps", dots: 18 },
        { n: 4, label: "Many schools", sub: "Workshops, PPA cover, curriculum support", dots: 32 },
        { n: 5, label: "Thousands of students", sub: "Learning to build with AI", dots: 120 },
      ];
      root.innerHTML =
        '<section class="page-hero ohero on-navy">' +
        ui.curve("M-60 360 C 280 200, 560 520, 880 360 S 1300 160, 1500 280", { cls: "ohero__curve", viewBox: "0 0 1440 640", draw: true }) +
        '<div class="container container--wide page-hero__inner"><p class="eyebrow">' +
        icon("globe") +
        ' For organisations</p><h1 class="hero-type">One platform.<br><span class="text-lime">Every club.</span></h1><p class="lead">Built so ComputerXplorers can deliver a consistent, high-quality AI course across its whole network without its own team being in every classroom.</p></div></section>' +
        // cascade
        '<section class="ocascade on-navy-2 section"><div class="container container--wide"><div class="ocascade__list">' +
        tiers
          .map(function (t, i) {
            var dots = "";
            for (var k = 0; k < t.dots; k++) dots += '<i style="--d:' + (k * 12 + i * 80) + 'ms"></i>';
            return (
              '<div class="otier otier--' +
              t.n +
              '" data-reveal style="--delay:' +
              i * 120 +
              'ms"><div class="otier__label"><span class="otier__n">' +
              String(t.n).padStart(2, "0") +
              '</span><div><h2 class="otier__t">' +
              esc(t.label) +
              "</h2><p>" +
              esc(t.sub) +
              '</p></div></div><div class="otier__dots">' +
              (t.n === 1 ? '<span class="otier__core">' + ui.bitSvg("lime", "happy") + "</span>" : dots) +
              "</div></div>" +
              (i < tiers.length - 1 ? '<div class="otier__arrow" aria-hidden="true">' + icon("arrow-down") + "</div>" : "")
            );
          })
          .join("") +
        "</div></div></section>" +
        // today
        '<section class="otoday on-lime section section--tight"><div class="container container--wide"><p class="eyebrow">ComputerXplorers today · the network this would build on</p><div class="otoday__grid">' +
        today
          .map(function (s) {
            return '<div class="otoday__stat"><span class="d1" data-count="' + s.value + '" data-prefix="' + (s.prefix || "") + '" data-suffix="' + (s.suffix || "") + '">0</span><span>' + esc(s.label) + "</span></div>";
          })
          .join("") +
        '<div class="otoday__stat"><span class="d1" data-count="' +
        meet.ukClubs +
        '" data-prefix="~">0</span><span>in-person after-school clubs in the UK (from our meeting)</span></div></div><p class="small">Sources: computerxplorers.co.uk and the 30 September 2026 meeting. These describe ComputerXplorers today. They are not results for the new platform.</p></div></section>' +
        // calculator
        '<section class="ocalc on-cream section"><div class="container container--wide ocalc__grid"><div><p class="eyebrow">' +
        icon("sliders") +
        ' Scale calculator</p><h2 class="d1">What one course<br>could reach</h2><p class="lead">Move the sliders to explore. These are illustrative calculations from your own assumptions, not forecasts.</p>' +
        '<div class="ocalc__controls">' +
        [
          ["clubs", "Clubs running the course", 10, 600, 10, meet.ukClubs, "~300 UK clubs (meeting, 30 Sep)"],
          ["kids", "Children per class", 8, 30, 1, meet.classSize, "about 15 (meeting)"],
          ["runs", "Courses per club per year", 1, 6, 1, 3, "assumption, e.g. one per term"],
        ]
          .map(function (c) {
            return '<div class="field ocalc__field"><label for="oc-' + c[0] + '">' + esc(c[1]) + ' <b id="oc-' + c[0] + '-v">' + c[5] + '</b></label><input type="range" class="range" id="oc-' + c[0] + '" title="' + esc(c[1]) + '" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" value="' + c[5] + '"><small class="muted">' + esc(c[6]) + "</small></div>";
          })
          .join("") +
        '</div></div><div class="ocalc__out card"><div class="ocalc__big"><span id="oc-children" class="bignum bignum--outline">0</span><span>children a year</span></div><dl class="ocalc__dl"><div><dt>Hours of learning</dt><dd id="oc-hours">0</dd></div><div><dt>Sessions taught</dt><dd id="oc-lessons">0</dd></div><div><dt>Instructors needed (1 per club)</dt><dd id="oc-instr">0</dd></div></dl>' +
        '<div class="ocalc__value"><p class="eyebrow">Value of one six-session unit for 15 children, at current class pricing <span class="tag-indicative">Indicative / to confirm</span></p><ul>' +
        (meet.pricing && meet.pricing.length
          ? meet.pricing
              .map(function (p) {
                return "<li><span>" + esc(p.context) + "<small>" + money(p.value) + " " + esc(p.unit) + "</small></span><b>" + money(p.value * 6 * 15) + "</b></li>";
              })
              .join("")
          : "<li><span>Class pricing<small>Shared privately with ComputerXplorers</small></span><b>—</b></li>") +
        '</ul><p class="tiny muted">Prices as recalled in the 30 Sep meeting, to be confirmed. The platform subscription would be a separate model.</p></div></div></div></section>' +
        // commercial model
        '<section class="omodel on-navy section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("key") +
        ' Commercial model</p><h2 class="d1">A fixed annual<br>subscription</h2></div><div><p class="lead">One subscription gives ComputerXplorers and its affiliate groups access to the platform, sessions and updates. Pricing would be agreed together. We haven\'t invented any numbers.</p></div></div><div class="omodel__grid">' +
        [
          { t: "Network licence", who: "ComputerXplorers HQ, covering every club and affiliate", items: ["All six sessions + future worlds", "Circle hub for the whole network", "Instructor certification", "Network-wide updates"], hl: true },
          { t: "Partner licence", who: "Per franchise or affiliate group", items: ["Access for the partner's instructors", "Regional space in the hub", "Offline pack for schools", "Class view and success checks"] },
          { t: "School add-on", who: "Optional, for schools running it themselves", items: ["Teacher access to session plans", "School IT pack", "Showcase for parents"] },
        ]
          .map(function (m, i) {
            return (
              '<div class="omodel__card' +
              (m.hl ? " is-hl" : "") +
              '" data-reveal style="--delay:' +
              i * 90 +
              'ms"><h3>' +
              esc(m.t) +
              '</h3><p class="omodel__who">' +
              esc(m.who) +
              '</p><ul class="ticks ' +
              (m.hl ? "" : "ticks--lime") +
              '">' +
              m.items
                .map(function (x) {
                  return "<li>" + esc(x) + "</li>";
                })
                .join("") +
              '</ul><p class="omodel__price">Price <span class="tag-indicative">Indicative / to confirm</span></p></div>'
            );
          })
          .join("") +
        "</div></div></section>" +
        // rollout
        '<section class="oroll on-white section"><div class="container container--wide"><div class="sec-head"><p class="eyebrow">' +
        icon("flag") +
        ' Rollout</p><h2 class="d1">Pilot, prove, scale</h2></div><ol class="oroll__list">' +
        [
          ["Pilot", "A few clubs in one region (for example around Guildford). Test in real school IT environments and collect feedback.", "1–3 clubs"],
          ["Region", "Train and certify the region's instructors through the hub. Refine sessions from pilot feedback.", "One region"],
          ["UK network", "Open to every franchise and affiliate group through partner licences.", "~300 clubs"],
          ["International", "Sister networks (USA, Australia) adapt content in their own regional spaces.", "Sister networks"],
        ]
          .map(function (r, i) {
            return '<li class="oroll__step" data-reveal style="--delay:' + i * 90 + 'ms"><span class="oroll__n">' + (i + 1) + "</span><h3>" + esc(r[0]) + "</h3><p>" + esc(r[1]) + '</p><span class="chip chip--teal">' + esc(r[2]) + "</span></li>";
          })
          .join("") +
        '</ol><div class="cluster" style="margin-top:2rem">' +
        ui.btn({ label: "See the Circle hub", href: "#/circle", variant: "navy" }) +
        ui.btn({ label: "School IT, data & safeguarding", href: "#/schools", variant: "lime" }) +
        "</div></div></section>" +
        CX.layout.footer();

      // calculator
      function calc() {
        var clubs = Number(root.querySelector("#oc-clubs").value);
        var kids = Number(root.querySelector("#oc-kids").value);
        var runs = Number(root.querySelector("#oc-runs").value);
        ["clubs", "kids", "runs"].forEach(function (k) {
          var el = root.querySelector("#oc-" + k);
          root.querySelector("#oc-" + k + "-v").textContent = U.fmt(Number(el.value));
          el.style.setProperty("--pct", ((el.value - el.min) / (el.max - el.min)) * 100 + "%");
        });
        var children = clubs * kids * runs;
        root.querySelector("#oc-children").textContent = U.fmt(children);
        root.querySelector("#oc-hours").textContent = U.fmt(children * 6);
        root.querySelector("#oc-lessons").textContent = U.fmt(clubs * runs * 6);
        root.querySelector("#oc-instr").textContent = U.fmt(clubs);
      }
      scope.add(U.on(root, "input", ".ocalc input", calc));
      calc();
    },
  };

  /* ======================================================================= */
  CX.pages.schools = {
    title: "For schools",
    mount: function (root, params, scope) {
      var st = CX.store.state;
      var retention = st.settings.retention || "course";
      root.innerHTML =
        '<section class="page-hero shead on-navy">' +
        ui.curve("M-60 300 C 260 180, 560 480, 880 320 S 1300 140, 1500 260", { cls: "shead__curve", viewBox: "0 0 1440 600", draw: true }) +
        '<div class="container container--wide page-hero__inner"><p class="eyebrow">' +
        icon("school") +
        ' For schools</p><h1 class="hero-type">School-ready<br><span class="text-lime">by design</span></h1><p class="lead">Built around real school IT and children\'s data from day one. We don\'t claim any certifications. We show the design choices, so ComputerXplorers and schools can check them.</p>' +
        '<div class="spillars">' +
        [
          ["wifi", "Works with school IT", "Offline mode, no third-party scripts, approved domains only."],
          ["database", "Minimal child data", "Builder nicknames. Progress stays on the device unless a school chooses otherwise."],
          ["shield-check", "Safeguarded AI", "No open chat. The AI only edits projects, and instructors see every change."],
        ]
          .map(function (p) {
            return '<div class="spillar">' + icon(p[0]) + "<div><b>" + esc(p[1]) + "</b><span>" + esc(p[2]) + "</span></div></div>";
          })
          .join("") +
        "</div></div></section>" +
        // IT
        '<section class="sit on-cream section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("wifi") +
        ' School IT & firewalls</p><h2 class="d1">If something\'s<br>blocked, the session<br>still works</h2></div><div><p class="lead">We never ask teachers to change network settings. Instead, there\'s a fallback for every step.</p></div></div>' +
        '<ol class="sfall">' +
        [
          ["Normal", "The Lab runs from an approved ComputerXplorers domain. Fonts, scripts and the 3D and sound engines are all self-hosted: no CDNs, no trackers.", "lime"],
          ["AI service blocked", "The AI helper switches to offline examples. Every session's AI moments still work, because they're built in.", "teal"],
          ["Website blocked", "Run the offline pack from a shared drive or USB stick. It's the same app with nothing to install.", "pink"],
          ["No devices", "Use board mode and the unplugged warm-ups. Every session starts with one.", "orange"],
        ]
          .map(function (f, i) {
            return '<li class="sfall__step sfall__step--' + f[2] + '"><span class="sfall__n">' + (i + 1) + "</span><b>" + esc(f[0]) + "</b><p>" + esc(f[1]) + "</p></li>";
          })
          .join("") +
        "</ol>" +
        '<div class="sit__grid"><div class="card"><h3 class="d4">Allowlist pack</h3><p class="muted">Example domains for school IT to approve. Final list to be confirmed with ComputerXplorers.</p><table class="stable"><thead><tr><th>Domain</th><th>Used for</th><th>Needed?</th></tr></thead><tbody>' +
        [
          ["lab.computerxplorers.co.uk", "The AI Builders Lab (children)", "Yes, or use the offline pack"],
          ["hub.computerxplorers.co.uk", "Circle hub (adults only)", "Staff devices only"],
          ["ai.computerxplorers.co.uk", "School-approved live AI (future)", "Optional"],
        ]
          .map(function (r) {
            return "<tr><td><code>" + esc(r[0]) + "</code></td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>";
          })
          .join("") +
        '</tbody></table><p class="tiny muted">Example domains only.</p></div>' +
        '<div class="card scheck"><h3 class="d4">Classroom readiness check</h3><p class="muted">Run this on a school device. It checks this browser right now.</p><ul class="scheck__list" id="scheck"></ul>' +
        ui.btn({ label: "Run the check", variant: "navy", size: "sm", icon: "play", attrs: "data-scheck" }) +
        "</div></div></div></section>" +
        // Data
        '<section class="sdata on-white section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("database") +
        ' Children\'s data</p><h2 class="d1">Collect less.<br>Keep it local.</h2></div><div><p class="lead">Designed to support UK GDPR and the Age Appropriate Design Code. A data protection impact assessment would be completed with ComputerXplorers before rollout.</p></div></div>' +
        '<div class="sdata__grid"><div class="card sdata__yes"><h3 class="d4">' +
        icon("check") +
        ' What the Lab stores</h3><ul class="ticks"><li>A builder nickname (e.g. "Rocket Fox")</li><li>Project versions and test results</li><li>Explain-card answers</li><li>Badges and progress</li></ul><p class="small muted">Stored in the browser on this device. Nothing is sent anywhere in offline mode.</p></div>' +
        '<div class="card sdata__no"><h3 class="d4">' +
        icon("close") +
        ' What it never asks for</h3><ul class="ticks ticks--pink"><li>Real names</li><li>Email addresses or logins for children</li><li>Photos, voice or location</li><li>Date of birth or school name</li></ul><p class="small muted">If a child types personal info into the AI box, it\'s blocked with a reminder.</p></div>' +
        '<div class="card sdata__flow"><h3 class="d4">' +
        icon("layers") +
        ' Where data goes</h3><ol class="sflow"><li><b>Child\'s device</b><span>Projects + progress (local)</span></li><li><b>School-controlled sync</b><span>Optional, configured by the school</span></li><li><b>Live AI (future)</b><span>Would get project settings only, never names. Needs approval</span></li></ol></div></div>' +
        '<div class="sretain card"><div><h3 class="d4">Retention, set by the school</h3><p class="muted">Choose how long project data is kept on shared devices.</p></div><div class="seg" role="group" aria-label="Retention">' +
        [
          ["course", "Until the course ends"],
          ["30d", "30 days"],
          ["1y", "1 year"],
        ]
          .map(function (r) {
            return '<button type="button" data-retain="' + r[0] + '" aria-pressed="' + (retention === r[0]) + '">' + esc(r[1]) + "</button>";
          })
          .join("") +
        '</div><button type="button" class="btn btn--pink btn--sm" data-wipe>' +
        icon("trash", "btn__icon") +
        "<span>Delete all data on this device</span></button></div></div></section>" +
        // Safeguarding
        '<section class="ssafe on-teal section"><div class="container container--wide"><h2 class="hero-type ssafe__title">Safeguarded<br>by design</h2><div class="grid grid-3" style="margin-top:2.5rem">' +
        [
          ["No open AI chat", "AI only appears inside projects, as small suggestions. There's no chat window and no free conversation."],
          ["Instructor oversight", "Instructors see every AI change children keep or undo, plus who needs help."],
          ["Personal info check", "The AI helper spots personal details and unkind words, and redirects children kindly."],
          ["Age-appropriate tone", "Child-friendly language, no jargon, and AI that explains itself."],
          ["Nicknames only", "Showcase and class views never use real names."],
          ["Instructor-led, always", "The course is designed for a supervised class of about 15, not unsupervised home use."],
        ]
          .map(function (s) {
            return '<div class="checkcard" style="--c:var(--navy-950)">' + icon("shield-check") + "<div><h4>" + esc(s[0]) + "</h4><p>" + esc(s[1]) + "</p></div></div>";
          })
          .join("") +
        '</div></div></section>' +
        // open questions
        '<section class="sopen on-cream section section--tight"><div class="container container--wide"><p class="eyebrow">' +
        icon("help") +
        ' To confirm with ComputerXplorers</p><h2 class="d2">Open questions</h2><ul class="sopen__list">' +
        [
          "Which firewall and network restrictions are most common across ComputerXplorers schools?",
          "Which domains, APIs and services could be allowlisted for the platform?",
          "What GDPR, safeguarding and data-processing requirements must any third-party AI service meet?",
          "Would schools want optional cloud sync of progress, and who controls it?",
          "Are there existing platform, safeguarding, device or school IT requirements to align with?",
        ]
          .map(function (q) {
            return "<li>" + icon("help") + "<span>" + esc(q) + "</span></li>";
          })
          .join("") +
        "</ul></div></section>" +
        CX.layout.footer();

      function runCheck() {
        var list = root.querySelector("#scheck");
        var res = [];
        res.push(["JavaScript", true, "Running"]);
        var canvas = document.createElement("canvas");
        var gl = CX.three && CX.three.ok();
        res.push(["3D graphics (WebGL 2)", gl, gl ? "Supported" : "Not available: builds show numbers and results without the 3D view"]);
        var audio = !!(window.AudioContext || window.webkitAudioContext);
        res.push(["Sound (Web Audio)", audio, audio ? "Supported. Headphones recommended in class" : "Not available: everything works silently"]);
        var storage = CX.store.storageAvailable();
        res.push(["Saving progress on this device", storage, storage ? "Allowed" : "Blocked by policy: the Lab still works, but progress resets"]);
        var fontsOk = document.fonts ? document.fonts.check("16px Lilita One") && document.fonts.check("16px Lexend") : true;
        res.push(["Lab fonts (self-hosted)", fontsOk, fontsOk ? "Loaded" : "Using fallback fonts"]);
        var external = [];
        try {
          (performance.getEntriesByType("resource") || []).forEach(function (r) {
            var u = new URL(r.name, location.href);
            if (u.origin !== location.origin && u.protocol.indexOf("http") === 0) external.push(u.host);
          });
        } catch (e) {}
        res.push(["Third-party requests", external.length === 0, external.length ? "Found: " + external.slice(0, 3).join(", ") : "None. Everything is self-hosted"]);
        var big = window.innerWidth >= 1024;
        res.push(["Screen size for the Prompt Studio", big, window.innerWidth + "×" + window.innerHeight + (big ? ". Side-by-side layout" : ". Stacked layout (fine for tablets)")]);
        list.innerHTML = res
          .map(function (r) {
            return '<li class="' + (r[1] ? "ok" : "warn") + '"><span>' + icon(r[1] ? "check" : "alert") + "</span><b>" + esc(r[0]) + "</b><small>" + esc(r[2]) + "</small></li>";
          })
          .join("");
        ui.toast("Readiness check complete", "check");
      }
      scope.add(U.on(root, "click", "[data-scheck]", runCheck));
      scope.add(
        U.on(root, "click", "[data-retain]", function (e, t) {
          CX.store.patch(function (s) {
            s.settings.retention = t.getAttribute("data-retain");
          });
          U.qsa("[data-retain]", root).forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === t));
          });
          ui.toast("Retention set: " + t.textContent, "clock");
        })
      );
      scope.add(
        U.on(root, "click", "[data-wipe]", function () {
          var d = ui.dialog({
            title: "Delete all data on this device?",
            body:
              '<div class="stack"><p>This removes every project, badge and explanation saved in this browser. It can\'t be undone.</p><div class="cluster">' +
              ui.btn({ label: "Delete everything", variant: "pink", icon: "trash", attrs: "data-confirm-wipe" }) +
              '<button type="button" class="btn btn--ghost" data-close><span>Cancel</span></button></div></div>',
          });
          d.el.addEventListener("click", function (e) {
            if (e.target.closest("[data-confirm-wipe]")) {
              CX.store.wipe();
              d.close();
              ui.toast("All local data deleted. The demo restarted fresh.", "trash");
            }
          });
        })
      );
    },
  };
})();
