/* ==========================================================================
   Student dashboard (#/student): the six-session journey, how my prompts
   have grown, my worlds, badges, instructor feedback and my share cards.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  function mainBuild(st) {
    var id = (st.unit && st.unit.build) || "planet";
    return CX.builds.get(id) || CX.builds.list[0];
  }

  function hero(st, def, prog, lvl) {
    var S = CX.data.course.sessions;
    var n = Math.min(6, prog.session || 1);
    var s = S[n - 1];
    var levels = CX.data.course.progression;
    return (
      '<section class="page-hero sdhero on-navy">' +
      '<div class="container container--wide page-hero__inner sdhero__grid">' +
      '<div class="sdhero__me">' +
      '<span class="sdhero__bit">' +
      ui.bitSvg(st.builder.colour, st.builder.face) +
      "</span>" +
      '<div><p class="eyebrow">' +
      icon("user") +
      ' Builder dashboard · nickname only</p><h1 class="d1">Welcome back,<br><span class="text-lime">' +
      esc(st.builder.name) +
      "</span></h1>" +
      '<p class="lead">Session ' +
      n +
      " of 6 today: <b>" +
      esc(s.skill) +
      "</b>. " +
      esc(s.tip) +
      ".</p>" +
      '<div class="cluster">' +
      ui.btn({ label: "Continue " + def.title + " · session " + n, href: "#/build/" + def.id + "/" + n, size: "lg" }) +
      ui.btn({ label: "My prompt ladder", variant: "ghost", icon: "layers", attrs: "data-ladder" }) +
      "</div></div></div>" +
      '<aside class="sdlevel card card--dark" data-reveal="right"><p class="eyebrow">' +
      icon("trend") +
      ' Creator level</p><p class="sdlevel__t">' +
      esc(lvl.level ? lvl.level.title : "") +
      '</p><p class="small">' +
      esc(lvl.level ? lvl.level.short : "") +
      '</p><ol class="sdlevel__track">' +
      levels
        .map(function (l, i) {
          return '<li class="' + (i < lvl.index ? "is-done" : i === lvl.index ? "is-now" : "") + '"><span>' + icon(l.icon) + "</span>" + esc(l.title) + "</li>";
        })
        .join("") +
      '</ol><p class="tiny muted">Sessions done: ' +
      lvl.done +
      " of 6. Your level rises as you finish sessions, not by asking the AI more.</p></aside>" +
      "</div></section>"
    );
  }

  function journey(st, def, prog) {
    var S = CX.data.course.sessions;
    var badges = CX.data.badges;
    return (
      '<section class="sdjourney on-cream section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("map") +
      ' My six sessions</p><h2 class="d1">From first prompt<br>to finished build</h2></div><div><p class="lead">Each session adds one prompting skill. Your best prompt from each session is saved, so you can see how far you\'ve come.</p></div></div>' +
      '<ol class="sdj">' +
      S.map(function (s) {
        var done = prog.done.indexOf(s.n) !== -1;
        var now = !done && (prog.session || 1) === s.n;
        var vs = (prog.versions || []).filter(function (v) {
          return v.s === s.n && v.kept;
        });
        var best = vs.length
          ? vs.reduce(function (a, b) {
              return b.count >= a.count ? b : a;
            })
          : null;
        var badge = badges.filter(function (b) {
          return b.id === s.badge;
        })[0];
        return (
          '<li class="sdj__step' +
          (done ? " is-done" : now ? " is-now" : "") +
          '" data-reveal style="--delay:' +
          (s.n - 1) * 70 +
          'ms"><div class="sdj__top"><span class="sdj__n">' +
          (done ? icon("check") : s.n) +
          '</span><span class="sdj__state">' +
          (done ? "Done" : now ? "Today" : "Coming up") +
          "</span></div><h3>" +
          esc(s.skill) +
          "</h3><p class=\"sdj__can\">" +
          esc(s.ability) +
          "</p>" +
          (best
            ? '<p class="sdj__prompt">“' + CX.prompt.highlight(best.prompt, CX.prompt.analyse(best.prompt, def)) + '”</p><p class="sdj__meta"><span class="st-pow" data-n="' + best.count + '">' + best.count + "/6</span>" + best.guesses + (best.guesses === 1 ? " guess" : " guesses") + "</p>"
            : now
              ? '<p class="sdj__prompt sdj__prompt--next">' + esc(def.sessions[s.n - 1].goal) + "</p>" + ui.btn({ label: "Start session " + s.n, href: "#/build/" + def.id + "/" + s.n, size: "sm" })
              : '<p class="sdj__prompt sdj__prompt--next">' + esc(s.strap) + "</p>") +
          (badge ? '<span class="sdj__badge' + (done ? " is-earned" : "") + '" style="--c:' + badge.c + '">' + icon(badge.icon) + esc(badge.title) + "</span>" : "") +
          "</li>"
        );
      }).join("") +
      "</ol></div></section>"
    );
  }

  function growth(st, def, prog) {
    var g = CX.share.growth(prog);
    var first = g.filter(function (x) {
      return x.prompt;
    })[0];
    var last = g
      .filter(function (x) {
        return x.prompt;
      })
      .slice(-1)[0];
    var pr = prog.predictions || { right: 0, total: 0 };
    return (
      '<section class="sdgrowth on-navy-2 section"><div class="container container--wide sdgrowth__grid">' +
      '<div><p class="eyebrow">' +
      icon("trend") +
      ' How my prompts have grown</p><h2 class="d2">More ingredients.<br><span class="text-lime">Fewer guesses.</span></h2>' +
      '<div class="sdgrowth__chart card card--dark">' +
      CX.share.growthSvg(g, { w: 560, h: 200 }) +
      "</div></div>" +
      '<div class="sdgrowth__side">' +
      (first
        ? '<div class="sdcompare"><div class="sdcompare__p"><span>Session ' +
          first.s +
          '</span><q>' +
          esc(first.prompt) +
          "</q><small>" +
          first.count +
          "/6 ingredients · " +
          first.guesses +
          " AI guesses</small></div>" +
          (last && last !== first
            ? '<div class="sdcompare__arrow">' + icon("arrow-down") + '</div><div class="sdcompare__p sdcompare__p--best"><span>Session ' + last.s + "</span><q>" + esc(last.prompt) + "</q><small>" + last.count + "/6 ingredients · " + last.guesses + " AI guesses</small></div>"
            : "") +
          "</div>"
        : "") +
      '<div class="sdstats">' +
      [
        [pr.right + "/" + pr.total, "predictions right"],
        [String((prog.versions || []).length), "prompts kept"],
        [String(CX.store.sessionsDone()), "sessions done"],
      ]
        .map(function (x) {
          return '<div><span class="d3">' + esc(x[0]) + "</span><small>" + esc(x[1]) + "</small></div>";
        })
        .join("") +
      "</div></div></div></section>"
    );
  }

  function worlds(st) {
    var mine = st.interests || [];
    return (
      '<section class="sdworlds on-white section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("layers") +
      ' My worlds</p><h2 class="d2">Same skills, any world</h2></div><div><p class="lead">You can practise a session in any world. Your main build is the one you\'ll share in session 6.</p></div></div>' +
      '<div class="sdworlds__grid">' +
      CX.builds.list
        .map(function (b) {
          var p = (st.builds || {})[b.id];
          var n = p ? Math.min(6, p.session || 1) : 1;
          var main = st.unit && st.unit.build === b.id;
          return (
            '<a class="sdw sdw--' +
            b.colour +
            '" href="#/build/' +
            b.id +
            "/" +
            n +
            '"><span class="sdw__icon">' +
            icon(b.interest.icon) +
            '</span><div><p class="sdw__k">' +
            esc(b.interest.label) +
            (mine.indexOf(b.interest.id) !== -1 ? " · my interest" : "") +
            (main ? " · main build" : "") +
            "</p><h3>" +
            esc(b.title) +
            "</h3><p>" +
            (p ? (p.done.length ? p.done.length + " of 6 sessions done" : "Started") : "Not started yet") +
            '</p></div><span class="sdw__go">' +
            (p ? "Continue" : "Try it") +
            ui.arrow(true) +
            "</span></a>"
          );
        })
        .join("") +
      "</div></div></section>"
    );
  }

  function badgesAndFeedback(st) {
    return (
      '<section class="sdbadges on-cream section"><div class="container container--wide sdbadges__grid">' +
      '<div><p class="eyebrow">' +
      icon("trophy") +
      ' Badges</p><h2 class="d3">Earned by thinking, not by asking the AI more</h2><div class="bdgs">' +
      CX.data.badges
        .map(function (b) {
          var got = st.badges.indexOf(b.id) !== -1;
          return '<div class="bdg' + (got ? " is-earned" : "") + '" style="--c:' + b.c + '"><span class="bdg__icon">' + icon(b.icon) + "</span><b>" + esc(b.title) + "</b><small>" + esc(b.text) + "</small></div>";
        })
        .join("") +
      "</div></div>" +
      '<div><p class="eyebrow">' +
      icon("chat") +
      ' From your instructor</p><div class="stack">' +
      (st.feedback || [])
        .slice()
        .reverse()
        .map(function (f) {
          return '<article class="card fbcard"><header><span class="fbcard__who">' + esc(f.from) + "</span><small>" + esc(f.role) + " · " + esc(U.timeAgo(f.at)) + "</small></header><p>" + esc(f.text) + "</p></article>";
        })
        .join("") +
      '</div><span class="tag-sample">Sample feedback</span></div></div></section>'
    );
  }

  function products(st) {
    var mine = CX.builds.list.filter(function (b) {
      var p = (st.builds || {})[b.id];
      return p && p.done.indexOf(6) !== -1;
    });
    var cards = mine.map(function (b) {
      return CX.share.card(b, CX.share.payload(b, st.builds[b.id]), { media: '<img src="assets/builds/' + b.id + '.jpg" alt="" onerror="this.remove()">' });
    });
    var def = mainBuild(st);
    return (
      '<section class="sdprod on-navy section"><div class="container container--wide">' +
      '<div class="sec-head sec-head--split"><div><p class="eyebrow">' +
      icon("star") +
      ' My share cards</p><h2 class="d2">Something to share<br>and be proud of</h2></div><div><p class="lead">Session 6 turns your build into a share card: your best prompt, the maths and science, and how your prompts grew. Anyone with the link can open it.</p></div></div>' +
      (cards.length
        ? '<div class="sdprod__grid">' + cards.join("") + "</div>"
        : '<div class="sdprod__locked card card--dark"><span class="sdprod__lock">' +
          icon("lock") +
          "</span><div><h3 class=\"d4\">Your " +
          esc(def.productName) +
          " unlocks in session 6</h3><p>Finish sessions 4 and 5 in " +
          esc(def.title) +
          ", then use all six ingredients to make it yours.</p>" +
          ui.btn({ label: "See finished builds in the class showcase", href: "#/showcase", variant: "white", size: "sm" }) +
          "</div></div>") +
      "</div></section>"
    );
  }

  CX.pages.student = {
    title: "Student",
    mount: function (root, params, scope) {
      var st = CX.store.state;
      var def = mainBuild(st);
      var prog = CX.studio.progress(def);
      var lvl = CX.store.creatorLevel();
      root.innerHTML = hero(st, def, prog, lvl) + journey(st, def, prog) + growth(st, def, prog) + worlds(st) + badgesAndFeedback(st) + products(st) + CX.layout.footer();
      scope.add(
        U.on(root, "click", "[data-ladder]", function () {
          CX.share.ladder(def, prog);
        })
      );
    },
  };
})();
