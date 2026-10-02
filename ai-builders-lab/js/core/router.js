/* ==========================================================================
   Hash router. Pages are objects: { title, mount(root, params, scope),
   update?(params) -> true when handled in place (e.g. switching stage) }.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;

  var routes = [
    { path: "/", page: "landing", nav: "home" },
    { path: "/student", page: "student", nav: "student" },
    { path: "/lab", page: "lab", nav: "lab" },
    { path: "/build/:id", page: "build", nav: "lab" },
    { path: "/build/:id/:s", page: "build", nav: "lab" },
    { path: "/share/:id", page: "share", nav: "" },
    { path: "/showcase", page: "showcase", nav: "showcase" },
    { path: "/teach", page: "teach", nav: "teach" },
    { path: "/teach/:lesson", page: "lesson", nav: "teach" },
    { path: "/curriculum", page: "curriculum", nav: "curriculum" },
    { path: "/org", page: "org", nav: "org" },
    { path: "/circle", page: "circle", nav: "circle" },
    { path: "/screens", page: "screens", nav: "screens" },
    { path: "/schools", page: "schools", nav: "org" },
  ];

  function compile(path) {
    var keys = [];
    var re = path.replace(/\//g, "\\/").replace(/:(\w+)/g, function (_, k) {
      keys.push(k);
      return "([^\\/]+)";
    });
    return { re: new RegExp("^" + re + "\\/?$"), keys: keys };
  }
  routes.forEach(function (r) {
    r.matcher = compile(r.path);
  });

  function parse(hash) {
    var raw = (hash || "").replace(/^#/, "") || "/";
    var parts = raw.split("?");
    var path = parts[0] || "/";
    var query = U.query(parts[1]);
    for (var i = 0; i < routes.length; i++) {
      var m = routes[i].matcher.re.exec(path);
      if (m) {
        var params = { query: query };
        routes[i].matcher.keys.forEach(function (k, idx) {
          params[k] = decodeURIComponent(m[idx + 1]);
        });
        return { route: routes[i], params: params, path: path };
      }
    }
    return { route: { page: "notfound", nav: "" }, params: { query: query }, path: path };
  }

  var current = null; // { page, scope, params, path }
  var root = null;

  function mount(match) {
    var pageName = match.route.page;
    var page = CX.pages[pageName] || CX.pages.notfound;

    // Same page, different params: let the page update in place if it can
    if (current && current.page === pageName && page.update) {
      var handled = page.update(match.params, current.params);
      if (handled) {
        current.params = match.params;
        current.path = match.path;
        CX.bus.emit("route:updated", { page: pageName, params: match.params, path: match.path });
        return;
      }
    }

    if (current) {
      current.scope.dispose();
      CX.bus.emit("route:leave", { page: current.page });
    }

    var scope = CX.scope();
    root.innerHTML = "";
    root.className = "";
    var container = document.createElement("div");
    container.className = "page page-enter page--" + pageName;
    root.appendChild(container);

    current = { page: pageName, scope: scope, params: match.params, path: match.path };

    try {
      page.mount(container, match.params, scope);
    } catch (err) {
      console.error("[CX router] failed to mount " + pageName, err);
      container.innerHTML =
        '<section class="section on-navy"><div class="container"><h1 class="d2">Something went wrong</h1><p class="lead">This screen hit an error. <a href="#/">Back to the start</a>.</p></div></section>';
    }

    var title = typeof page.title === "function" ? page.title(match.params) : page.title;
    document.title = (title ? title + " · " : "") + "AI Builders Lab · ComputerXplorers";

    CX.bus.emit("route:mounted", { page: pageName, nav: match.route.nav, params: match.params, path: match.path });

    // Scroll + focus management for keyboard and screen-reader users
    window.scrollTo(0, 0);
    var focusTarget = container.querySelector("h1");
    if (focusTarget) {
      focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    } else {
      root.focus({ preventScroll: true });
    }

    if (CX.motion) CX.motion.scan(container, scope);
  }

  CX.router = {
    start: function (rootEl) {
      root = rootEl;
      window.addEventListener("hashchange", function () {
        mount(parse(location.hash));
      });
      mount(parse(location.hash));
    },
    go: function (path) {
      var target = "#" + path;
      if (location.hash === target) mount(parse(target));
      else location.hash = path;
    },
    get current() {
      return current;
    },
    refresh: function () {
      var keep = current;
      current = null;
      if (keep) keep.scope.dispose();
      mount(parse(location.hash));
    },
  };
})();
