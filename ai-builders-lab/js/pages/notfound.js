/* Not found */
(function () {
  "use strict";
  var CX = window.CX;
  CX.pages.notfound = {
    title: "Not found",
    mount: function (root) {
      root.innerHTML =
        '<section class="page-hero on-navy"><div class="container"><p class="eyebrow">404</p><h1 class="d1">Nothing to build here</h1><p class="lead">That page doesn\'t exist. Try the Build Lab or go back to the start.</p><div class="cluster" style="margin-top:2rem">' +
        CX.ui.btn({ label: "Build Lab", href: "#/lab" }) +
        CX.ui.btn({ label: "Home", href: "#/", variant: "white" }) +
        "</div></div></section>";
    },
  };
})();
