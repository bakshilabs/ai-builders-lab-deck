/* ==========================================================================
   Class showcase (#/showcase): finished session 6 builds, shared as cards.
   Classmates' cards are sample data; the child's own cards come from the
   "Add to class showcase" button on their share card.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  CX.pages.showcase = {
    title: "Class showcase",
    mount: function (root, params, scope) {
      var mine = (CX.store.state.showcase || [])
        .map(function (x) {
          var data = CX.share.decode(x.d);
          return data ? { data: data, shot: x.shot, mine: true } : null;
        })
        .filter(Boolean);
      var sample = CX.data.showcase.map(function (d) {
        return { data: d, shot: null, mine: false };
      });
      var all = mine.concat(sample);
      root.innerHTML =
        '<section class="page-hero schero on-navy">' +
        '<div class="container container--wide page-hero__inner">' +
        '<p class="eyebrow">' +
        icon("star") +
        " Class showcase · session 6</p>" +
        '<h1 class="hero-type">Finished.<br><span class="text-lime">Shared.</span></h1>' +
        '<p class="lead">Every child finishes the unit with a product of their own. Each card shows the build, the child\'s first and best prompts, the maths and science, and how their prompts grew from session 1 to 6.</p>' +
        "</div></section>" +
        '<section class="scgrid on-navy-2 section section--tight"><div class="container container--wide">' +
        all
          .map(function (it, i) {
            var b = CX.builds.get(it.data.id);
            if (!b) return "";
            var media = it.shot ? '<img src="' + it.shot + '" alt="">' : '<img src="assets/builds/' + b.id + '.jpg" alt="" loading="lazy" onerror="this.remove()">';
            return (
              '<div class="scitem" data-reveal style="--delay:' +
              (i % 2) * 90 +
              'ms">' +
              CX.share.card(b, it.data, { media: media }) +
              '<div class="scitem__bar">' +
              (it.mine ? '<span class="chip chip--lime">' + icon("user") + "Yours</span>" : '<span class="tag-sample">Sample</span>') +
              '<a class="btn btn--white btn--sm" href="#/share/' +
              b.id +
              "?d=" +
              CX.share.encode(it.data) +
              '">' +
              icon("eye", "btn__icon") +
              "<span>Open it live</span></a>" +
              '<a class="btn btn--ghost btn--sm" href="#/build/' +
              b.id +
              '/1">' +
              icon("wand", "btn__icon") +
              "<span>Build your own</span></a></div></div>"
            );
          })
          .join("") +
        '<p class="note scgrid__note">' +
        icon("shield-check") +
        "<span>Cards only ever show builder nicknames. A share link carries the build itself, so families can open it without an account.</span></p>" +
        "</div></section>" +
        CX.layout.footer();
    },
  };
})();
