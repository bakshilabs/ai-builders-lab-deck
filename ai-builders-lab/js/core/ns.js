/* ==========================================================================
   CX namespace, utilities and event bus.
   Plain scripts (no modules, no build step) so the prototype runs from a
   static host, a USB stick or file:// — useful behind school firewalls.
   ========================================================================== */
(function () {
  "use strict";

  var CX = (window.CX = window.CX || {});
  CX.version = "1.0.0";
  CX.pages = CX.pages || {};
  CX.data = CX.data || {};
  CX.gameDefs = CX.gameDefs || {};

  var U = (CX.util = {});

  U.esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  U.qs = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  U.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  U.clamp = function (n, min, max) {
    return Math.max(min, Math.min(max, n));
  };
  U.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };
  U.round = function (n, dp) {
    var f = Math.pow(10, dp || 0);
    return Math.round(n * f) / f;
  };
  U.fmt = function (n) {
    return Number(n).toLocaleString("en-GB");
  };

  var uidCount = 0;
  U.uid = function (prefix) {
    uidCount += 1;
    return (prefix || "cx") + "-" + uidCount + "-" + Math.random().toString(36).slice(2, 7);
  };

  U.debounce = function (fn, ms) {
    var t;
    return function () {
      var args = arguments,
        self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, ms);
    };
  };

  /* Seeded random (mulberry32): builds use it so every run is repeatable. */
  U.rng = function (seed) {
    var a = seed >>> 0 || 1;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.pick = function (arr, rand) {
    return arr[Math.floor((rand || Math.random)() * arr.length)];
  };
  U.shuffle = function (arr, rand) {
    var a = arr.slice(),
      r = rand || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  };

  U.reducedMotion = function () {
    if (document.documentElement.classList.contains("reduce-motion")) return true;
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };

  U.wait = function (ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, U.reducedMotion() ? Math.min(ms, 60) : ms);
    });
  };

  /* Screen-reader announcements */
  U.announce = function (message) {
    var el = document.getElementById("announcer");
    if (!el) return;
    el.textContent = "";
    setTimeout(function () {
      el.textContent = message;
    }, 40);
  };

  /* Delegated events: U.on(root, 'click', '[data-action]', fn) */
  U.on = function (root, type, selector, handler) {
    function listener(event) {
      var target = event.target.closest ? event.target.closest(selector) : null;
      if (target && root.contains(target)) handler(event, target);
    }
    root.addEventListener(type, listener);
    return function () {
      root.removeEventListener(type, listener);
    };
  };

  /* Parse "a=1&b=2" style query strings in the hash */
  U.query = function (str) {
    var out = {};
    (str || "").split("&").forEach(function (pair) {
      if (!pair) return;
      var bits = pair.split("=");
      out[decodeURIComponent(bits[0])] = decodeURIComponent(bits[1] || "");
    });
    return out;
  };

  U.timeAgo = function (ts) {
    var s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return "just now";
    var m = Math.round(s / 60);
    if (m < 60) return m + " min ago";
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.round(h / 24);
    return d + (d === 1 ? " day ago" : " days ago");
  };

  U.mmss = function (seconds) {
    var s = Math.max(0, Math.floor(seconds));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  };

  /* ---- Event bus --------------------------------------------------------- */
  var handlers = {};
  CX.bus = {
    on: function (name, fn) {
      (handlers[name] = handlers[name] || []).push(fn);
      return function () {
        CX.bus.off(name, fn);
      };
    },
    off: function (name, fn) {
      if (!handlers[name]) return;
      handlers[name] = handlers[name].filter(function (h) {
        return h !== fn;
      });
    },
    emit: function (name, data) {
      (handlers[name] || []).slice().forEach(function (fn) {
        try {
          fn(data);
        } catch (err) {
          console.error("[CX bus] handler for " + name + " failed", err);
        }
      });
    },
  };

  /* Page-scoped cleanup bag: pages register disposers here */
  CX.scope = function () {
    var fns = [];
    return {
      add: function (fn) {
        if (typeof fn === "function") fns.push(fn);
        return fn;
      },
      dispose: function () {
        while (fns.length) {
          try {
            fns.pop()();
          } catch (err) {
            console.error("[CX] cleanup failed", err);
          }
        }
      },
    };
  };
})();
