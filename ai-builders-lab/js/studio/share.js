/* ==========================================================================
   Share: the session 6 product. A share card (poster), the child's prompt
   ladder from session 1 to 6, and a share link that opens a read-only view
   of the build. The link carries the build in the URL, so it needs no server.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var ui = CX.ui;
  var icon = ui.icon;
  var esc = U.esc;

  /* ---- Progress summary: best prompt per session -------------------------------- */
  function growth(prog) {
    var out = [];
    for (var s = 1; s <= 6; s++) {
      var vs = (prog.versions || []).filter(function (v) {
        return v.s === s && v.kept;
      });
      if (!vs.length) {
        out.push({ s: s, count: null, guesses: null, prompt: null });
        continue;
      }
      var best = vs.reduce(function (a, b) {
        return b.count > a.count || (b.count === a.count && b.guesses <= a.guesses) ? b : a;
      });
      out.push({ s: s, count: best.count, guesses: best.guesses, prompt: best.prompt });
    }
    return out;
  }

  function growthSvg(g, o) {
    o = o || {};
    var W = o.w || 520,
      H = o.h || 190,
      padL = 30,
      padB = 34,
      padT = 18;
    var bw = (W - padL - 20) / 6;
    var h = H - padB - padT;
    var bars = g
      .map(function (x, i) {
        var cx = padL + i * bw + bw / 2;
        var hh = x.count == null ? 0 : (x.count / 6) * h;
        var y = padT + h - hh;
        return (
          (x.count == null
            ? '<rect x="' + (cx - bw * 0.32) + '" y="' + (padT + h - 4) + '" width="' + bw * 0.64 + '" height="4" rx="2" class="gr-empty"/>'
            : '<rect x="' + (cx - bw * 0.32) + '" y="' + y + '" width="' + bw * 0.64 + '" height="' + hh + '" rx="8" class="gr-bar" style="--i:' + i + '"/>' +
              '<text x="' + cx + '" y="' + (y - 7) + '" class="gr-val">' + x.count + "</text>") +
          '<text x="' + cx + '" y="' + (H - 12) + '" class="gr-lab">S' + x.s + "</text>"
        );
      })
      .join("");
    var pts = g
      .map(function (x, i) {
        if (x.guesses == null) return null;
        return [padL + i * bw + bw / 2, padT + h - (Math.min(x.guesses, 6) / 6) * h];
      })
      .filter(Boolean);
    var line = pts.length > 1 ? '<polyline points="' + pts.map(function (p) {
      return p[0] + "," + p[1];
    }).join(" ") + '" class="gr-line"/>' : "";
    var dots = pts
      .map(function (p, i) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" class="gr-dot"/>';
      })
      .join("");
    var grid = [0, 2, 4, 6]
      .map(function (v) {
        var y = padT + h - (v / 6) * h;
        return '<line x1="' + padL + '" x2="' + (W - 12) + '" y1="' + y + '" y2="' + y + '" class="gr-grid"/><text x="' + (padL - 8) + '" y="' + (y + 4) + '" class="gr-axis">' + v + "</text>";
      })
      .join("");
    return (
      '<svg class="growth" viewBox="0 0 ' +
      W +
      " " +
      H +
      '" role="img" aria-label="Prompt ingredients per session, rising from session 1 to session 6, while the AI\'s guesses fall">' +
      grid +
      bars +
      line +
      dots +
      "</svg>" +
      '<p class="growth__key"><span class="k k--bar"></span>Ingredients in my best prompt <span class="k k--dot"></span>AI guesses</p>'
    );
  }

  function ladderList(prog) {
    var vs = (prog.versions || []).filter(function (v) {
      return v.kept;
    });
    if (!vs.length) return '<p class="muted">No prompts kept yet. Every prompt you keep appears here.</p>';
    var prev = null;
    return (
      '<ol class="ladderlist">' +
      vs
        .map(function (v) {
          var a = CX.prompt.analyse(v.prompt, null);
          var row =
            '<li class="ladderlist__row"><span class="ladderlist__s">S' +
            v.s +
            '</span><div><p class="ladderlist__p">' +
            (prev ? CX.prompt.diffWords(prev, v.prompt) : esc(v.prompt)) +
            '</p><p class="ladderlist__m"><span class="st-pow" data-n="' +
            v.count +
            '">' +
            v.count +
            "/6 ingredients</span>" +
            '<span class="ladderlist__g">' +
            v.guesses +
            (v.guesses === 1 ? " AI guess" : " AI guesses") +
            "</span></p></div></li>";
          prev = v.prompt;
          return row;
        })
        .join("") +
      "</ol>"
    );
  }

  function ladder(def, prog) {
    var g = growth(prog);
    ui.dialog({
      title: "My prompt ladder · " + def.title,
      cls: "modal--wide modal--ladder",
      body:
        '<div class="ladderdlg"><div class="ladderdlg__chart"><p class="eyebrow">' +
        icon("trend") +
        " How my prompts grew</p>" +
        growthSvg(g) +
        '</div><div class="ladderdlg__list"><p class="eyebrow">' +
        icon("layers") +
        " Every prompt I kept</p>" +
        ladderList(prog) +
        "</div></div>",
    });
  }

  /* ---- Encoding for share links -------------------------------------------------- */
  function encode(obj) {
    var s = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decode(str) {
    try {
      var s = str.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      return JSON.parse(decodeURIComponent(escape(atob(s))));
    } catch (err) {
      return null;
    }
  }

  function payload(def, prog) {
    var g = growth(prog);
    var first = g.filter(function (x) {
      return x.prompt;
    })[0];
    var last = g
      .filter(function (x) {
        return x.prompt;
      })
      .slice(-1)[0];
    return {
      id: def.id,
      p: prog.params,
      by: (CX.store.state.builder && CX.store.state.builder.name) || "A builder",
      first: first ? { s: first.s, t: first.prompt, c: first.count, g: first.guesses } : null,
      best: last ? { s: last.s, t: last.prompt, c: last.count, g: last.guesses } : null,
      gr: g.map(function (x) {
        return [x.count, x.guesses];
      }),
    };
  }

  /* ---- The card ----------------------------------------------------------------- */
  function card(def, data, o) {
    o = o || {};
    var prod = def.product(data.p, data);
    var g = (data.gr || []).map(function (x, i) {
      return { s: i + 1, count: x[0], guesses: x[1] };
    });
    var media = o.media || (o.shot ? '<img src="' + o.shot + '" alt="' + esc(prod.title) + ', built in ' + esc(def.title) + '">' : '<div class="sharecard__ph">' + icon(def.interest.icon) + "</div>");
    return (
      '<article class="sharecard sharecard--' +
      def.colour +
      '">' +
      '<div class="sharecard__media">' +
      media +
      '<span class="sharecard__kind">' +
      icon(def.interest.icon) +
      esc(prod.kind) +
      "</span></div>" +
      '<div class="sharecard__body">' +
      '<p class="sharecard__by">Built by <b>' +
      esc(data.by) +
      "</b> · " +
      esc(def.title) +
      " · 6 sessions</p>" +
      '<h2 class="sharecard__t">' +
      esc(prod.title) +
      "</h2>" +
      '<dl class="sharecard__facts">' +
      prod.facts
        .map(function (f) {
          return "<div><dt>" + esc(f.k) + "</dt><dd>" + esc(f.v) + "</dd></div>";
        })
        .join("") +
      "</dl>" +
      '<p class="sharecard__sci">' +
      icon("bulb") +
      "<span>" +
      esc(prod.science) +
      "</span></p>" +
      (data.first && data.best
        ? '<div class="sharecard__prompts"><div class="sharecard__prompt"><span>My first prompt · S' +
          data.first.s +
          "</span><q>" +
          esc(data.first.t) +
          "</q><small>" +
          data.first.c +
          "/6 ingredients · " +
          data.first.g +
          " AI guesses</small></div>" +
          '<div class="sharecard__prompt sharecard__prompt--best"><span>My best prompt · S' +
          data.best.s +
          "</span><q>" +
          esc(data.best.t) +
          "</q><small>" +
          data.best.c +
          "/6 ingredients · " +
          data.best.g +
          " AI guesses</small></div></div>"
        : "") +
      (g.length ? '<div class="sharecard__growth">' + growthSvg(g, { w: 460, h: 150 }) + "</div>" : "") +
      "</div></article>"
    );
  }

  function link(def, prog) {
    return location.href.split("#")[0] + "#/share/" + def.id + "?d=" + encode(payload(def, prog));
  }

  function open(def, prog, scene) {
    var data = payload(def, prog);
    var shot = null;
    try {
      shot = scene && scene.snapshot ? scene.snapshot() : null;
    } catch (err) {}
    var url = link(def, prog);
    if (CX.sound) CX.sound.play("fanfare");
    var d = ui.dialog({
      title: "Your share card",
      cls: "modal--wide modal--share",
      body:
        card(def, data, { shot: shot }) +
        '<div class="sharebar">' +
        '<button type="button" class="btn btn--lime" data-sh="copy">' +
        icon("share", "btn__icon") +
        "<span>Copy share link</span></button>" +
        '<button type="button" class="btn btn--ghost" data-sh="showcase">' +
        icon("star", "btn__icon") +
        "<span>Add to class showcase</span></button>" +
        '<a class="btn btn--ghost" href="' +
        esc("#/share/" + def.id + "?d=" + encode(data)) +
        '" data-sh="open">' +
        icon("eye", "btn__icon") +
        "<span>Open my share page</span></a>" +
        "</div>" +
        '<p class="tiny muted sharebar__note">The link carries your build itself, so it works without an account. It shows your builder nickname only.</p>',
    });
    d.el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sh]");
      if (!b) return;
      var act = b.getAttribute("data-sh");
      if (act === "copy") {
        var done = function () {
          ui.toast("Share link copied", "share");
          if (CX.sound) CX.sound.play("keep");
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
        else done();
      } else if (act === "showcase") {
        CX.store.patch(function (s) {
          s.showcase = s.showcase || [];
          s.showcase = s.showcase.filter(function (x) {
            return x.id !== def.id || x.by !== data.by;
          });
          s.showcase.unshift({ id: def.id, by: data.by, d: encode(data), shot: shot, at: Date.now() });
        });
        ui.toast("Added to the class showcase", "star");
        if (CX.sound) CX.sound.play("success");
        b.disabled = true;
      } else if (act === "open") {
        d.close();
      }
    });
    return d;
  }

  CX.share = { open: open, ladder: ladder, card: card, growth: growth, growthSvg: growthSvg, ladderList: ladderList, encode: encode, decode: decode, payload: payload, link: link };
})();
