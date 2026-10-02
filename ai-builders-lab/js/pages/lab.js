/* ==========================================================================
   Build Lab (#/lab): choose a world. Four interest builds, one set of
   prompting skills. Every world runs the same six sessions.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  function poster(b) {
    return (
      '<div class="world__media"><img src="assets/builds/' +
      b.id +
      '.jpg" alt="" loading="lazy" onerror="this.remove()"><span class="world__glyph">' +
      icon(b.interest.icon) +
      "</span></div>"
    );
  }

  function dots(prog) {
    var out = "";
    for (var n = 1; n <= 6; n++) {
      var done = prog && prog.done.indexOf(n) !== -1;
      var now = prog && !done && prog.session === n;
      out += '<i class="' + (done ? "is-done" : now ? "is-now" : "") + '" title="Session ' + n + '"></i>';
    }
    return '<span class="world__dots" aria-hidden="true">' + out + "</span>";
  }

  function card(b, i) {
    var st = CX.store.state.builds || {};
    var prog = st[b.id];
    var started = prog && prog.versions && prog.versions.length;
    var next = prog ? Math.min(6, prog.session || 1) : 1;
    return (
      '<a class="world world--' +
      b.colour +
      '" href="#/build/' +
      b.id +
      "/" +
      next +
      '" data-reveal style="--delay:' +
      i * 90 +
      'ms">' +
      poster(b) +
      '<div class="world__body"><p class="world__k">' +
      icon(b.interest.icon) +
      esc(b.interest.label) +
      "</p><h2 class=\"world__t\">" +
      esc(b.title) +
      '</h2><p class="world__d">' +
      esc(b.tagline) +
      '</p><div class="world__subj">' +
      b.subjects
        .map(function (s) {
          return '<span class="chip chip--glass">' + icon(s.icon) + "<b>" + esc(s.k) + "</b> " + esc(s.t) + "</span>";
        })
        .join("") +
      '</div><div class="world__foot"><div><span class="world__prod">' +
      icon("star") +
      "Session 6: " +
      esc(b.productName) +
      "</span>" +
      dots(prog) +
      '</div><span class="world__go">' +
      (started ? "Continue session " + next : "Start session 1") +
      ui.arrow(true) +
      "</span></div></div></a>"
    );
  }

  CX.pages.lab = {
    title: "Build Lab",
    mount: function (root, params, scope) {
      var builds = CX.builds.list;
      var S = CX.data.course.sessions;
      root.innerHTML =
        '<section class="page-hero labhero on-navy">' +
        ui.curve("M-80 420 C 280 200, 560 520, 880 330 S 1300 120, 1560 300", { cls: "labhero__curve", viewBox: "0 0 1440 600", draw: true }) +
        '<div class="container container--wide page-hero__inner">' +
        '<p class="eyebrow">' +
        icon("layers") +
        " Build Lab · ages 10–11</p>" +
        '<h1 class="hero-type">Choose your<br><span class="text-lime">world.</span></h1>' +
        '<p class="lead labhero__lead">Every session teaches one prompting skill, and every child practises it in the world they care about. Space, sport, music or the planet: the maths and science come with it.</p>' +
        '<ul class="labhero__facts"><li>' +
        icon("clock") +
        "<span><b>6 sessions</b> · 1 hour each</span></li><li>" +
        icon("chat") +
        "<span><b>Prompt → Predict → Test → Decide</b> every round</span></li><li>" +
        icon("star") +
        "<span><b>A finished product</b> to share in session 6</span></li></ul>" +
        "</div></section>" +
        '<section class="worlds on-navy-2 section section--tight"><div class="container container--wide"><div class="worlds__grid">' +
        builds.map(card).join("") +
        "</div></div></section>" +
        // Same skill, different worlds
        '<section class="matrix on-cream section"><div class="container container--wide">' +
        '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("grid") +
        ' Same skill, different worlds</p><h2 class="d1">One unit.<br>Four ways in.</h2></div><div><p class="lead">The whole class learns the same skill each session, so the instructor teaches once. Each child applies it in their own world and their build grows into something to share.</p></div></div>' +
        '<div class="matrix__wrap" role="region" aria-label="Sessions by world" tabindex="0"><table class="matrix__t"><thead><tr><th scope="col">Session</th>' +
        builds
          .map(function (b) {
            return '<th scope="col" class="matrix__h matrix__h--' + b.colour + '">' + icon(b.interest.icon) + esc(b.title) + "</th>";
          })
          .join("") +
        "</tr></thead><tbody>" +
        S.map(function (s) {
          return (
            '<tr><th scope="row"><span class="matrix__n">' +
            s.n +
            "</span><b>" +
            esc(s.skill) +
            "</b><small>" +
            esc(s.ability) +
            "</small></th>" +
            builds
              .map(function (b) {
                return (
                  '<td><a href="#/build/' +
                  b.id +
                  "/" +
                  s.n +
                  '"><q>' +
                  esc(s.prompt[b.interest.id]) +
                  "</q></a></td>"
                );
              })
              .join("") +
            "</tr>"
          );
        }).join("") +
        "</tbody></table></div>" +
        '<p class="small muted matrix__note">' +
        icon("info") +
        " Each cell is an example prompt from that session. Children write their own, and the prompts get longer and more precise as the sessions go on.</p>" +
        "</div></section>" +
        // Next worlds
        '<section class="nextw on-white section"><div class="container container--wide">' +
        '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
        icon("compass") +
        ' Coming next</p><h2 class="d2">More worlds, designed with you</h2></div><div><p class="lead">The same six sessions work in any world with real maths or science inside it. These are ideas to co-design with ComputerXplorers. They aren\'t built yet.</p></div></div>' +
        '<div class="nextw__grid">' +
        [
          ["leaf", "Wild Island", "Animals", "Food chains and habitats; ratio and population graphs"],
          ["sparkle", "Pattern Studio", "Art", "Symmetry, rotation and angles that add up to 360°"],
          ["wind", "Sky Lab", "Weather", "Temperature, rainfall and reading data over time"],
        ]
          .map(function (w) {
            return '<div class="nextw__card"><span class="nextw__icon">' + icon(w[0]) + "</span><div><p class=\"nextw__k\">" + esc(w[2]) + "</p><h3>" + esc(w[1]) + "</h3><p>" + esc(w[3]) + '</p><span class="tag-indicative">To co-design</span></div></div>';
          })
          .join("") +
        "</div></div></section>" +
        CX.layout.footer();
    },
  };
})();
