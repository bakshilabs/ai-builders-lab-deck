/* ==========================================================================
   Build pages
   #/build/:id            the Prompt Studio for a build, at the child's session
   #/build/:id/:s         a specific session (1–6)
   #/share/:id?d=…        a shared, read-only view of a finished build
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  CX.pages.build = {
    title: function (params) {
      var d = CX.builds.get(params.id);
      return d ? d.title + (params.s ? " · Session " + params.s : "") : "Build";
    },
    mount: function (root, params, scope) {
      var def = CX.builds.get(params.id);
      if (!def) return CX.pages.notfound.mount(root, params, scope);
      var api = CX.studio.mount(root, def, { session: params.s || CX.studio.progress(def).session || 1 });
      scope.add(function () {
        api.dispose();
      });
    },
  };

  CX.pages.share = {
    title: "Shared build",
    mount: function (root, params, scope) {
      var def = CX.builds.get(params.id);
      var data = params.query && params.query.d ? CX.share.decode(params.query.d) : null;
      if (!def || !data || !data.p) {
        root.innerHTML =
          '<section class="section on-navy page-hero"><div class="container"><h1 class="d2">This share link doesn\'t work</h1><p class="lead">It may have been copied only partly. Ask the builder to copy it again.</p>' +
          ui.btn({ label: "Open the Build Lab", href: "#/lab" }) +
          "</div></section>";
        return;
      }
      root.innerHTML =
        '<section class="sharepage on-navy"><div class="container container--wide">' +
        '<p class="eyebrow">' +
        icon("share") +
        " Shared from AI Builders Lab</p>" +
        '<div class="sharepage__grid">' +
        CX.share.card(def, data, { media: '<div class="sharecard__live" id="share-live"></div>' }) +
        '<aside class="sharepage__aside card">' +
        "<h2 class=\"d4\">How this was built</h2>" +
        "<p>" +
        esc(data.by) +
        " built this over six one-hour sessions. Each session added one prompting skill. The chart shows their prompts growing while the AI's guesses fell.</p>" +
        '<ul class="ticks small"><li>Session 1: say what you want</li><li>Session 2: add details</li><li>Session 3: add numbers</li><li>Session 4: set a goal and limits</li><li>Session 5: test and explain</li><li>Session 6: finish and share</li></ul>' +
        ui.btn({ label: "Build your own in " + def.title, href: "#/build/" + def.id + "/1" }) +
        "</aside></div></div></section>";
      var host = root.querySelector("#share-live");
      if (host && CX.three && CX.three.ok()) {
        try {
          var sc = def.scene(host, { def: def, pinTag: function () {}, clearTags: function () {}, sound: function () {} });
          sc.set(data.p, { instant: true });
          scope.add(function () {
            sc.dispose();
          });
        } catch (err) {
          console.error(err);
        }
      }
    },
  };
})();
