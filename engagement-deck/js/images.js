/* ==========================================================================
   Photography and prototype screens.

   PHOTOS: <figure class="photo" data-photo="id"> shows a designed placeholder
   that describes the intended shot. When assets/img/<id>.jpg exists (run
   tools/generate-images.mjs, or drop in a real photo with the same name) the
   deck swaps it in automatically. Works from file://.

   SCREENS: <div class="shot" data-shot="build-planet.jpg" data-label="…">
   loads assets/screens/<file>. Until the capture exists it shows a styled
   frame naming the file to drop in.
   ========================================================================== */
(function () {
  "use strict";

  var DECK = (window.DECK = window.DECK || {});
  var ui = DECK.ui;

  var S = 'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
  var LIME = "#dbe751";
  var PINK = "#efabcd";
  var TEAL = "#49a7a9";

  function svg(inner) {
    return '<svg viewBox="0 0 200 140" ' + S + ">" + inner + "</svg>";
  }
  function person(cx, cy, r, w, h) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/><path d="M' + (cx - w) + " " + (cy + r + h) + "c2-" + h * 0.75 + " " + w * 0.45 + "-" + h + " " + w + "-" + h + "s" + w * 0.9 + " " + h * 0.25 + " " + w + " " + h + '"/>';
  }
  function sticky(x, y, c, rot) {
    return '<rect x="' + x + '" y="' + y + '" width="17" height="17" rx="2.5" fill="' + c + '" stroke="none" transform="rotate(' + (rot || 0) + " " + (x + 8) + " " + (y + 8) + ')"/>';
  }
  function laptop(x, y, w) {
    var h = w * 0.58;
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="rgba(255,255,255,.06)"/><path d="M' + (x - 10) + " " + (y + h + 5) + "h" + (w + 20) + '"/>';
  }

  var ART = {
    planet: svg(
      person(52, 40, 14, 25, 34) +
        person(150, 46, 12, 21, 30) +
        laptop(66, 66, 76) +
        '<circle cx="104" cy="88" r="13" fill="rgba(239,171,205,.35)" stroke="' + PINK + '"/><ellipse cx="104" cy="88" rx="22" ry="6" stroke="' + LIME + '"/>' +
        '<path d="M138 74l-10 8" />' +
        '<circle cx="30" cy="20" r="3" fill="' + LIME + '" stroke="none"/><circle cx="176" cy="18" r="3.5" fill="' + PINK + '" stroke="none"/>'
    ),
    graph: svg(
      person(48, 38, 13, 23, 32) +
        person(150, 38, 13, 23, 32) +
        laptop(62, 62, 80) +
        '<path d="M70 100l14-12 12 6 14-16 14 4 12-14" stroke="' + LIME + '"/><path d="M70 104h72" stroke-width="2"/>' +
        '<path d="M126 70l-6 14" stroke="' + PINK + '"/>'
    ),
    ladder: svg(
      '<rect x="20" y="10" width="92" height="64" rx="7" fill="rgba(73,167,169,.16)"/>' +
        '<rect x="30" y="58" width="22" height="9" rx="3" fill="' + LIME + '" stroke="none"/><rect x="42" y="47" width="22" height="9" rx="3" fill="' + TEAL + '" stroke="none"/><rect x="54" y="36" width="22" height="9" rx="3" fill="' + PINK + '" stroke="none"/><rect x="66" y="25" width="22" height="9" rx="3" fill="' + LIME + '" stroke="none"/><rect x="78" y="14" width="22" height="9" rx="3" fill="#ffffff" stroke="none"/>' +
        person(136, 30, 12, 18, 52) +
        '<path d="M124 52l-14-8"/>' +
        person(40, 100, 8, 13, 16) +
        person(84, 100, 8, 13, 16) +
        person(128, 104, 8, 13, 14) +
        person(170, 104, 8, 13, 14) +
        '<path d="M170 88v-12" stroke="' + PINK + '"/>'
    ),
    present: svg(
      '<rect x="78" y="10" width="108" height="66" rx="7" fill="rgba(239,171,205,.14)"/>' +
        '<circle cx="110" cy="44" r="14" fill="rgba(239,171,205,.35)" stroke="' + PINK + '"/><ellipse cx="110" cy="44" rx="24" ry="6" stroke="' + LIME + '"/>' +
        '<rect x="146" y="58" width="26" height="6" rx="3" fill="' + LIME + '" stroke="none"/><rect x="146" y="48" width="22" height="6" rx="3" fill="' + TEAL + '" stroke="none"/><rect x="146" y="38" width="18" height="6" rx="3" fill="' + PINK + '" stroke="none"/>' +
        person(46, 40, 13, 22, 58) +
        '<path d="M62 70l18-12"/>' +
        person(88, 108, 8, 13, 14) +
        person(124, 108, 8, 13, 14) +
        person(160, 108, 8, 13, 14)
    ),
    interview: svg(
      person(80, 42, 16, 32, 44) +
        '<rect x="94" y="30" width="11" height="21" rx="3" fill="rgba(219,231,81,.3)"/><path d="M106 102c8-18 6-34-4-48"/>' +
        '<path d="M128 18h44a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8h-24l-12 10V52h-8a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z" fill="rgba(73,167,169,.2)"/>' +
        '<circle cx="141" cy="35" r="3.2" fill="' + LIME + '" stroke="none"/><circle cx="151" cy="35" r="3.2" fill="' + LIME + '" stroke="none"/><circle cx="161" cy="35" r="3.2" fill="' + LIME + '" stroke="none"/>' +
        '<path d="M118 118h60"/><rect x="134" y="104" width="32" height="14" rx="2" fill="rgba(255,255,255,.08)"/><path d="M140 111h18" stroke="' + PINK + '"/>' +
        '<circle cx="34" cy="34" r="13"/><path d="M34 26v8l6 3" stroke="' + LIME + '"/>'
    ),
    workshop: svg(
      sticky(70, 12, LIME, -6) +
        sticky(94, 16, PINK, 5) +
        sticky(118, 10, TEAL, -3) +
        sticky(142, 18, LIME, 7) +
        sticky(166, 12, PINK, -5) +
        sticky(82, 38, TEAL, 4) +
        sticky(108, 40, LIME, -7) +
        sticky(132, 42, PINK, 3) +
        sticky(158, 40, TEAL, -4) +
        '<path d="M60 6h126v58H60Z" stroke-dasharray="2 9"/>' +
        person(36, 46, 12, 21, 32) +
        '<path d="M48 70l22-24"/><path d="M16 116h172"/>' +
        person(104, 88, 10, 18, 18) +
        person(150, 88, 10, 18, 18) +
        '<rect x="112" y="102" width="34" height="14" rx="3" fill="rgba(219,231,81,.16)"/>'
    ),
    training: svg(
      person(44, 54, 11, 20, 22) +
        person(92, 54, 11, 20, 22) +
        person(140, 54, 11, 20, 22) +
        '<rect x="28" y="88" width="32" height="20" rx="3" fill="rgba(219,231,81,.14)"/><rect x="76" y="88" width="32" height="20" rx="3" fill="rgba(239,171,205,.18)"/><rect x="124" y="88" width="32" height="20" rx="3" fill="rgba(73,167,169,.24)"/>' +
        '<path d="M14 112h160"/>' +
        person(180, 26, 11, 16, 58) +
        '<path d="M168 52l-18 18"/>' +
        '<circle cx="92" cy="98" r="5" stroke="' + PINK + '"/><path d="M40 100l6-6 4 3 6-6" stroke="' + LIME + '"/>'
    ),
    schoolit: svg(
      '<rect x="22" y="70" width="70" height="44" rx="5"/><path d="M34 74v36M46 74v36M58 74v36M70 74v36M82 74v36" stroke-width="2.4"/>' +
        '<circle cx="32" cy="124" r="5"/><circle cx="82" cy="124" r="5"/>' +
        person(118, 34, 11, 18, 40) +
        person(166, 38, 11, 18, 36) +
        laptop(118, 76, 46) +
        '<path d="M150 22l8 6 12-14" stroke="' + LIME + '"/>' +
        '<circle cx="44" cy="40" r="12" stroke="' + TEAL + '"/><path d="M38 40l4 4 8-8" stroke="' + TEAL + '"/>'
    ),
    together: svg(
      person(62, 34, 14, 26, 30) +
        person(138, 34, 14, 26, 30) +
        '<path d="M18 100h164"/>' +
        '<rect x="54" y="106" width="34" height="24" rx="3" fill="rgba(255,255,255,.06)" transform="rotate(-6 71 118)"/>' +
        '<rect x="98" y="104" width="40" height="26" rx="3" fill="rgba(219,231,81,.14)"/>' +
        '<path d="M105 124l8-9 6 5 11-11" stroke="' + LIME + '"/>' +
        '<path d="M86 76l16 26M116 76l-4 26"/>' +
        sticky(150, 108, PINK, 8) +
        sticky(28, 110, TEAL, -10)
    ),
  };

  /* id → what the photo should show (alt) and the brief on the placeholder */
  var PHOTOS = {
    planet: {
      alt: "A child types a prompt on a laptop and watches a 3D planet change while a friend and an instructor look on",
      brief: "A child types a prompt and watches a 3D planet change on the laptop. A friend leans in; the instructor smiles behind.",
    },
    graph: {
      alt: "Two children compare a line graph on a laptop screen",
      brief: "Two children comparing a graph on screen, one tracing a line with a finger, mid-discussion.",
    },
    ladder: {
      alt: "An instructor guides a class through prompt steps shown on the classroom display",
      brief: "Pilot lesson: the instructor guides the class through the prompt steps on the big screen. Children in pairs, hands up.",
    },
    present: {
      alt: "A child presents their build and prompt steps to classmates sitting on the carpet",
      brief: "Showcase: a child presents their build and prompt ladder on the big screen. Classmates listen, one hand up.",
    },
    interview: {
      alt: "A curriculum lead listens on a phone call and makes notes",
      brief: "A 20-minute phone conversation: a curriculum lead listening, notebook open, by a window.",
    },
    workshop: {
      alt: "Educators and designers around a table covered in sketches, sticky notes and laptops",
      brief: "Co-design workshop: sticky-note wall, printed screens, two laptops, people laughing and changing things.",
    },
    training: {
      alt: "Instructors in navy polo shirts try the builds as learners while a trainer explains",
      brief: "Instructor training: instructors try the builds as learners, a trainer leaning in to explain.",
    },
    schoolit: {
      alt: "A school IT technician and an instructor check a classroom laptop beside a laptop trolley",
      brief: "School IT: a technician and an instructor checking a laptop together beside the charging trolley.",
    },
    together: {
      alt: "An experienced educator and a product designer sketch an activity together at a laptop",
      brief: "A ComputerXplorers educator and a product designer sketching an activity together. Paper sketches, laptop, sticky notes.",
    },
  };

  function placeholder(id) {
    var p = PHOTOS[id] || { brief: "" };
    return (
      '<div class="phslot" aria-hidden="true"><div class="phslot__art">' +
      (ART[id] || ART.planet) +
      '</div><div class="phslot__cap">' +
      ui.icon("camera") +
      "<span><b>Photo to come</b>" +
      ui.esc(p.brief) +
      "</span></div></div>"
    );
  }

  function mount(root) {
    var els = (root || document).querySelectorAll("[data-photo]");
    Array.prototype.forEach.call(els, function (el) {
      if (el.__photo) return;
      el.__photo = true;
      var id = el.getAttribute("data-photo");
      var p = PHOTOS[id] || { alt: "" };
      el.innerHTML = placeholder(id);
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Photo to come: " + p.alt);
      var img = new Image();
      img.decoding = "async";
      img.alt = p.alt;
      img.onload = function () {
        el.appendChild(img);
        el.classList.add("has-img");
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
        requestAnimationFrame(function () {
          img.classList.add("is-loaded");
        });
      };
      img.src = "assets/img/" + id + ".jpg";
    });
  }

  DECK.photos = { mount: mount, list: PHOTOS, art: ART };

  /* ---- Prototype screens with a graceful fallback ------------------------ */
  var SCREEN_ICON = {
    "build-lab.jpg": "grid",
    "build-planet.jpg": "globe",
    "build-kick.jpg": "target",
    "build-beat.jpg": "volume",
    "build-power.jpg": "sun",
    "prompt-ladder.jpg": "layers",
    "student.jpg": "user",
    "teach.jpg": "board",
    "curriculum.jpg": "book",
    "circle.jpg": "users",
    "landing.jpg": "laptop",
  };

  function shotFallback(file, label, small) {
    return (
      '<div class="shot__ph' + (small ? " shot__ph--sm" : "") + '" aria-hidden="true"><span class="shot__ic">' +
      ui.icon(SCREEN_ICON[file] || "laptop") +
      "</span>" +
      (small ? "" : '<span class="shot__label">' + ui.esc(label || "") + '</span><span class="shot__file">Screen to come · assets/screens/' + ui.esc(file) + "</span>") +
      "</div>"
    );
  }

  /* Set (or change) the screen shown in a [data-shot] element */
  function setShot(el, file, label, alt) {
    var small = el.hasAttribute("data-thumb");
    el.setAttribute("data-shot", file);
    if (label != null) el.setAttribute("data-label", label);
    label = el.getAttribute("data-label") || "";
    var token = (el.__token = (el.__token || 0) + 1);
    var img = new Image();
    img.decoding = "async";
    img.alt = small ? "" : alt || "The AI Builders Lab prototype: " + label;
    img.onload = function () {
      if (token !== el.__token) return;
      el.innerHTML = "";
      el.appendChild(img);
      el.classList.remove("is-missing");
      if (!small) el.removeAttribute("aria-label");
    };
    img.onerror = function () {
      if (token !== el.__token) return;
      el.innerHTML = shotFallback(file, label, small);
      el.classList.add("is-missing");
      if (!small) {
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", "Screen to come: " + label);
      }
    };
    img.src = "assets/screens/" + file;
  }

  function mountShots(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-shot]"), function (el) {
      if (el.__shot) return;
      el.__shot = true;
      setShot(el, el.getAttribute("data-shot"), null);
    });
  }

  DECK.shots = { mount: mountShots, set: setShot };
})();
