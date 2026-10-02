/* ==========================================================================
   Motion: reveal-on-scroll, counting numbers, self-drawing curves, gentle
   parallax. Everything degrades to static when reduced motion is on.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dp = parseInt(el.getAttribute("data-dp") || "0", 10);
    if (isNaN(target)) return;
    if (U.reducedMotion()) {
      el.textContent = prefix + U.fmt(U.round(target, dp)) + suffix;
      return;
    }
    var start = performance.now();
    var dur = parseInt(el.getAttribute("data-dur") || "1600", 10);
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 4);
      el.textContent = prefix + U.fmt(U.round(target * eased, dp)) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function prepCurves(root) {
    U.qsa(".curve[data-draw] path", root).forEach(function (p) {
      try {
        var len = Math.ceil(p.getTotalLength());
        p.parentNode.style.setProperty("--len", len);
      } catch (err) {
        /* not rendered yet */
      }
    });
  }

  CX.motion = {
    scan: function (root, scope) {
      prepCurves(root);
      var targets = U.qsa("[data-reveal], [data-count], .curve[data-draw]", root);
      if (!("IntersectionObserver" in window) || U.reducedMotion()) {
        targets.forEach(function (el) {
          el.classList.add("is-in");
          if (el.hasAttribute("data-count")) countUp(el);
        });
      } else {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              var el = entry.target;
              el.classList.add("is-in");
              if (el.hasAttribute("data-count") && !el.__counted) {
                el.__counted = true;
                countUp(el);
              }
              io.unobserve(el);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
        );
        targets.forEach(function (el) {
          io.observe(el);
        });
        if (scope)
          scope.add(function () {
            io.disconnect();
          });
      }

      // Gentle parallax for decorative layers
      var layers = U.qsa("[data-parallax]", root);
      if (layers.length && !U.reducedMotion()) {
        var ticking = false;
        var update = function () {
          ticking = false;
          var vh = window.innerHeight;
          layers.forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.bottom < -200 || rect.top > vh + 200) return;
            var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
            var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
            el.style.translate = "0 " + offset.toFixed(1) + "px";
          });
        };
        var onScroll = function () {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        update();
        if (scope)
          scope.add(function () {
            window.removeEventListener("scroll", onScroll);
          });
      }
    },
    countUp: countUp,
  };
})();
