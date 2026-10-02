/* ==========================================================================
   Curriculum (#/curriculum): answers ComputerXplorers' questions from the
   30 Sep meeting. Learning objectives, outcomes, structure, both delivery
   formats, the role of AI at each stage, hands-on moments and assessment.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  CX.pages.curriculum = {
    title: "Curriculum",
    mount: function (root, params, scope) {
      var c = CX.data.course;
      var mods = c.modules;
      var open = params.query && params.query.m ? Number(params.query.m) : 2;
      var fmt = CX.store.state.lesson.format || "weekly";

      function formatStrip() {
        var f = c.formats.filter(function (x) {
          return x.id === fmt;
        })[0];
        return (
          '<p class="cfmt__detail">' +
          esc(f.detail) +
          '</p><ol class="cfmt__slots">' +
          mods
            .map(function (m, i) {
              var brk = fmt === "halfterm" && (i === 2 || i === 4) ? '<li class="cfmt__break" aria-label="Break">' + icon("sun") + "<span>" + (i === 2 ? "Lunch &amp; outdoor play" : "Break") + "</span></li>" : "";
              return brk + '<li class="cfmt__slot cfmt__slot--' + m.colour + '"><span class="cfmt__when">' + esc(f.slots[i]) + '</span><span class="cfmt__n">' + pad(m.n) + "</span><b>" + esc(m.title) + "</b><small>60 min · " + esc(m.activity.title) + "</small></li>";
            })
            .join("") +
          "</ol>"
        );
      }

      root.innerHTML =
        '<section class="page-hero chero on-navy">' +
        ui.curve("M-40 460 C 280 300, 560 600, 860 420 S 1300 200, 1500 320", { cls: "chero__curve", viewBox: "0 0 1440 640", draw: true }) +
        ui.bit({ colour: "lime", face: "wow", size: 100, rot: 10, cls: "chero__bit" }) +
        '<div class="container container--wide page-hero__inner"><p class="eyebrow">' +
        icon("book") +
        ' Curriculum · ages 10–11</p><div class="chero__nums">' +
        '<div><span class="bignum">6</span><span class="chero__word">sessions</span></div>' +
        '<div><span class="bignum bignum--pink">1</span><span class="chero__word">hour each</span></div>' +
        '<div><span class="bignum bignum--teal">1</span><span class="chero__word">product to share</span></div>' +
        '</div><h1 class="sr-only">AI Builders Lab curriculum</h1><p class="lead">One unit of six one-hour sessions. Children learn maths and science by building with AI: every session adds one prompting skill, in the world they chose, and their build grows into a product they share in session 6. Designed so a non-specialist instructor can deliver every hour.</p></div></section>' +
        // formats
        '<section class="cfmt on-white section section--tight"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("calendar") +
        ' Same content, two formats</p><h2 class="d2">How the six hours run</h2></div><div><div class="seg" role="group" aria-label="Delivery format">' +
        c.formats
          .map(function (f) {
            return '<button type="button" data-cfmt="' + f.id + '" aria-pressed="' + (fmt === f.id) + '">' + esc(f.label) + "</button>";
          })
          .join("") +
        '</div></div></div><div id="cfmt">' +
        formatStrip() +
        "</div></div></section>" +
        // outcomes
        '<section class="cout on-cream section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("target") +
        ' Learning outcomes</p><h2 class="d1">By the end,<br>every builder can…</h2></div><div><p class="lead">These answer the question from the 30 September meeting: what should students understand or be able to do by the end of the course?</p></div></div><ol class="cout__list">' +
        c.outcomes
          .map(function (o, i) {
            return '<li class="cout__item" data-reveal style="--delay:' + (i % 3) * 70 + 'ms"><span class="cout__n">' + pad(i + 1) + "</span><p>" + esc(o) + "</p></li>";
          })
          .join("") +
        "</ol></div></section>" +
        // progression
        '<section class="cprog on-navy section"><div class="container container--wide"><div class="sec-head"><p class="eyebrow">' +
        icon("trend") +
        ' Progression</p><h2 class="d1">User → creator</h2></div><div class="cprog__band">' +
        c.progression
          .map(function (p, i) {
            var inMods = mods.filter(function (m) {
              return m.progression.indexOf(p.id) !== -1;
            });
            return (
              '<div class="cprog__stage" data-reveal style="--delay:' +
              i * 90 +
              'ms"><span class="cprog__icon">' +
              icon(p.icon) +
              '</span><h3>' +
              esc(p.title) +
              "</h3><p>" +
              esc(p.short) +
              '</p><div class="cprog__mods">' +
              inMods
                .map(function (m) {
                  return '<a href="#/curriculum?m=' + m.n + '" class="cprog__mod">' + pad(m.n) + "</a>";
                })
                .join("") +
              "</div></div>"
            );
          })
          .join("") +
        "</div></div></section>" +
        // modules
        '<section class="cmods on-cream section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("layers") +
        ' The six sessions</p><h2 class="d1">Session by session</h2></div><div><p class="lead">Each module says what children learn, what they build, the AI\'s role, and the part AI can\'t do for them.</p></div></div>' +
        mods
          .map(function (m) {
            var isOpen = m.n === open;
            return (
              '<article class="cmod cmod--' +
              m.colour +
              (isOpen ? " is-open" : "") +
              '" id="module-' +
              m.n +
              '"><button type="button" class="cmod__head" data-cmodule="' +
              m.n +
              '" aria-expanded="' +
              isOpen +
              '"><span class="cmod__n">' +
              pad(m.n) +
              '</span><span class="cmod__title"><b>' +
              esc(m.title) +
              "</b><small>" +
              esc(m.strap) +
              '</small></span><span class="cmod__bit">' +
              ui.bitSvg(m.bit.colour, m.bit.face) +
              '</span><span class="cmod__chev">' +
              icon("chev-down") +
              "</span></button>" +
              '<div class="cmod__body"' +
              (isOpen ? "" : " hidden") +
              '><div class="cmod__grid">' +
              '<div class="cmod__col"><h4>Children learn</h4><ul class="ticks">' +
              m.learn
                .map(function (x) {
                  return "<li>" + esc(x) + "</li>";
                })
                .join("") +
              '</ul></div><div class="cmod__col"><h4>In every world</h4><ul class="cmod__worlds">' +
              CX.builds.list
                .map(function (b) {
                  return '<li><a href="#/build/' + b.id + "/" + m.n + '">' + icon(b.interest.icon) + "<span><b>" + esc(b.title) + "</b> “" + esc(m.prompt[b.interest.id]) + "”</span></a></li>";
                })
                .join("") +
              '</ul><h4>AI\'s role</h4><p>' +
              esc(m.aiRole) +
              '</p></div><div class="cmod__col"><div class="cmod__key"><h4>' +
              icon("shield") +
              " What AI can't do for them</h4><p>" +
              esc(m.notOutsourced) +
              '</p></div><div class="cmod__key cmod__key--teal"><h4>' +
              icon("hand") +
              " Hands-on</h4><p>" +
              esc(m.physical) +
              "</p></div></div></div>" +
              '<div class="cmod__foot"><div><h4>Observable outcomes</h4><ul class="ticks ticks--lime">' +
              m.observable
                .map(function (x) {
                  return "<li>" + esc(x) + "</li>";
                })
                .join("") +
              '</ul></div><div class="cluster">' +
              ui.btn({ label: "Session plan", href: "#/teach/" + m.n, variant: "navy", size: "sm" }) +
              ui.btn({ label: "Try it in Planet Builder", href: "#/build/planet/" + m.n, size: "sm" }) +
              "</div></div></div></article>"
            );
          })
          .join("") +
        "</div></section>" +
        // curriculum links (indicative)
        '<section class="clinks on-cream section"><div class="container container--wide"><div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("book") +
        ' Maths and science</p><h2 class="d2">Where it fits the curriculum</h2></div><div><p class="lead">Each world gamifies real KS2 maths and science. These links are <b>indicative</b>, to confirm with the ComputerXplorers curriculum team.</p></div></div><div class="clinks__grid">' +
        CX.builds.list
          .map(function (b) {
            return '<div class="clinks__card clinks__card--' + b.colour + '"><p class="clinks__k">' + icon(b.interest.icon) + esc(b.interest.label) + "</p><h3>" + esc(b.title) + '</h3><ul class="ticks">' + (CX.data.curriculumLinks[b.interest.id] || []).map(function (l) {
              return "<li>" + esc(l) + "</li>";
            }).join("") + "</ul></div>";
          })
          .join("") +
        "</div></div></section>" +
        // loop + skills
        '<section class="cloop on-teal section"><div class="container container--wide"><h2 class="hero-type cloop__title">The learning loop</h2><p class="lead cloop__lead">Every round of prompting, in every world. Prompt, predict, test and decide repeat, and each repeat is a new version of the child\'s prompt. Children never just type "make it for me": they stay in charge.</p><ol class="cloop__list">' +
        c.loop
          .map(function (l, i) {
            return '<li class="cloop__step" data-reveal style="--delay:' + i * 60 + 'ms"><span class="cloop__n">' + pad(i + 1) + "</span><b>" + esc(l.label) + "</b><p>" + esc(l.text) + "</p></li>";
          })
          .join("") +
        '</ol><div class="cloop__skills"><p class="eyebrow">Transferable skills that outlast any one AI tool</p><div class="cluster">' +
        c.transferable
          .map(function (s) {
            return '<span class="chip chip--lg chip--navy">' + esc(s) + "</span>";
          })
          .join("") +
        "</div></div></div></section>" +
        // assessment + final project
        '<section class="cassess on-white section"><div class="container container--wide cassess__grid"><div><p class="eyebrow">' +
        icon("trophy") +
        ' Final project</p><h2 class="d2">Seven things every builder explains</h2><ol class="cassess__qs">' +
        c.finalQuestions
          .map(function (q, i) {
            return "<li><span>" + (i + 1) + "</span>" + esc(q) + "</li>";
          })
          .join("") +
        '</ol></div><div><p class="eyebrow">' +
        icon("search") +
        ' Assessment</p><h2 class="d2">How we know they learned it</h2><div class="cassess__ev">' +
        [
          ["layers", "Prompt ladder", "Every kept prompt is saved with its ingredients and the AI's guesses, so growth from session 1 to 6 is visible."],
          ["eye", "Predictions", "Children predict before every test. Right or wrong, the prediction is recorded and discussed."],
          ["flask", "Cause and effect", "Every test shows what changed and by how much, in real numbers children can check."],
          ["check", "Success checks", "The instructor ticks four observable checks for each child, each session."],
          ["star", "Share card", "Session 6: a finished build with the first prompt, the best prompt, the maths and science, and the growth chart."],
        ]
          .map(function (e) {
            return '<div class="cassess__item">' + icon(e[0]) + "<div><b>" + esc(e[1]) + "</b><p>" + esc(e[2]) + "</p></div></div>";
          })
          .join("") +
        '</div><p class="note">' +
        icon("info") +
        '<span>The test for every activity, from the meeting: <b>"What is the student learning or creating that they could not simply outsource to AI?"</b> Each session answers it under "What AI can\'t do for them".</span></p></div></div></section>' +
        CX.layout.footer();

      scope.add(
        U.on(root, "click", "[data-cfmt]", function (e, t) {
          fmt = t.getAttribute("data-cfmt");
          CX.store.patch(function (s) {
            s.lesson.format = fmt;
          });
          U.qsa("[data-cfmt]", root).forEach(function (b) {
            b.setAttribute("aria-pressed", String(b === t));
          });
          root.querySelector("#cfmt").innerHTML = formatStrip();
        })
      );
      scope.add(
        U.on(root, "click", "[data-cmodule]", function (e, t) {
          var art = t.closest(".cmod");
          var body = art.querySelector(".cmod__body");
          var isOpen = !art.classList.contains("is-open");
          art.classList.toggle("is-open", isOpen);
          body.hidden = !isOpen;
          t.setAttribute("aria-expanded", String(isOpen));
        })
      );
      if (params.query && params.query.m) {
        setTimeout(function () {
          var el = root.querySelector("#module-" + params.query.m);
          if (el) el.scrollIntoView({ behavior: U.reducedMotion() ? "auto" : "smooth", block: "start" });
        }, 300);
      }
    },
  };
})();
