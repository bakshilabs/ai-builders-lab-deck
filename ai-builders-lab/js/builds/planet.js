/* ==========================================================================
   Build 1 · Planet Builder (interest: space)
   Science: gravity and forces. Maths: halving and doubling, measuring,
   inverse proportion. The astronaut's push-off is fixed (3.1 m/s), so
   jump height = 3.1² ÷ (2 × gravity) and every number can be checked.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var P = CX.prompt;

  var V0 = 3.1; // push-off speed in m/s: 0.49 m on Earth
  var EARTH = 9.8;
  var M = 0.62; // scene units per metre
  var BASE_R = 2.3;

  var BODIES = {
    earth: { label: "Earth", g: 9.8, size: "medium", look: "earth", colour: "blue" },
    mars: { label: "Mars", g: 3.7, size: "small", look: "rocky", colour: "red" },
    moon: { label: "the Moon", short: "Moon", g: 1.6, size: "tiny", look: "moon", colour: "grey" },
    jupiter: { label: "Jupiter", g: 24.8, size: "giant", look: "gas", colour: "orange" },
    saturn: { label: "Saturn", g: 10.4, size: "giant", look: "gas", colour: "gold", rings: true },
    venus: { label: "Venus", g: 8.9, size: "medium", look: "cloudy", colour: "yellow" },
    mercury: { label: "Mercury", g: 3.7, size: "tiny", look: "moon", colour: "grey" },
    neptune: { label: "Neptune", g: 11.2, size: "large", look: "gas", colour: "blue" },
    pluto: { label: "Pluto", g: 0.6, size: "tiny", look: "icy", colour: "white" },
  };
  var COLOURS = {
    red: { label: "red", hex: 0xc4532f },
    orange: { label: "orange", hex: 0xe0823a },
    yellow: { label: "yellow", hex: 0xe8c55a },
    gold: { label: "gold", hex: 0xd8b26a },
    green: { label: "green", hex: 0x4f9a52 },
    blue: { label: "blue", hex: 0x3f7fd6 },
    icy: { label: "icy blue", hex: 0x9fd4f0 },
    teal: { label: "teal", hex: 0x2fa3a5 },
    purple: { label: "purple", hex: 0x7a52c7 },
    pink: { label: "pink", hex: 0xe58fbd },
    white: { label: "white", hex: 0xe9eef5 },
    grey: { label: "grey", hex: 0x9a98a2 },
  };
  var LOOKS = {
    none: "none yet",
    earth: "oceans and land",
    rocky: "rocky",
    moon: "craters",
    gas: "gas giant",
    icy: "icy",
    cloudy: "cloudy",
  };
  var SIZES = {
    tiny: { label: "tiny", r: 0.66 },
    small: { label: "small", r: 0.82 },
    medium: { label: "medium", r: 1 },
    large: { label: "large", r: 1.22 },
    giant: { label: "giant", r: 1.45 },
  };

  function measure(p) {
    if (!p || p.look === "none") return { jump: null, hang: null, feels: null };
    var g = p.gravity;
    return {
      jump: g > 0 ? (V0 * V0) / (2 * g) : Infinity,
      hang: g > 0 ? (2 * V0) / g : Infinity,
      feels: (40 * g) / EARTH,
    };
  }

  function bodiesIn(t) {
    var found = [];
    var re = /\b(earth|mars|moon|jupiter|saturn|venus|mercury|neptune|pluto)\b/g,
      m;
    while ((m = re.exec(t))) if (found.indexOf(m[1]) === -1) found.push(m[1]);
    return found;
  }
  function colourIn(t) {
    if (/\bicy blue\b/.test(t)) return "icy";
    var m = /\b(red|orange|yellow|gold|green|blue|teal|purple|pink|white|grey|gray)\b/.exec(t);
    return m ? (m[1] === "gray" ? "grey" : m[1]) : null;
  }
  function sizeIn(t) {
    if (/\b(tiny|very small)\b/.test(t)) return "tiny";
    if (/\bsmall\b/.test(t)) return "small";
    if (/\b(medium|middle-sized|normal-sized)\b/.test(t)) return "medium";
    if (/\b(giant|huge|enormous|massive)\b/.test(t)) return "giant";
    if (/\b(big|large)\b/.test(t)) return "large";
    return null;
  }
  function lookIn(t) {
    if (/\b(icy|ice|frozen)\b/.test(t)) return "icy";
    if (/\bgas giant|\bgassy|\bgas\b/.test(t)) return "gas";
    if (/\b(rocky|rock|desert|dusty)\b/.test(t)) return "rocky";
    if (/\bcraters?\b/.test(t)) return "moon";
    if (/\b(cloudy|clouds)\b/.test(t)) return "cloudy";
    if (/\b(ocean|oceans|sea|earth-like|like earth)\b/.test(t)) return "earth";
    return null;
  }
  var NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5 };

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---- Offline AI: reads the prompt ------------------------------------------------ */
  function interpret(text, c) {
    var t = P.norm(text);
    var p = c.params;
    var set = {},
      src = {},
      und = [];
    function add(k, v, label, s) {
      set[k] = v;
      src[k] = s;
      und.push({ t: label, src: s });
    }

    // Fair tests across planets
    var bodies = bodiesIn(t);
    if (/\b(test|compare|try)\b/.test(t) && (bodies.length >= 2 || /\b(three|3|different) planets\b/.test(t))) {
      if (bodies.length < 2) bodies = ["earth", "mars", "moon"];
      var names = bodies.map(function (b) {
        return BODIES[b].short || BODIES[b].label;
      });
      und = [
        { t: "test the jump", src: "you" },
        { t: names.join(", "), src: "you" },
      ];
      if (/\btable\b/.test(t)) und.push({ t: "a results table", src: "you" });
      if (/\b(explain|pattern|why)\b/.test(t)) und.push({ t: "explain the pattern", src: "you" });
      und.push({ t: "same astronaut, same push (fair test)", src: "calc" });
      return {
        kind: "tests",
        say: "I'll run a fair test: the same astronaut with the same push on " + names.join(", ").replace(/, ([^,]*)$/, " and $1") + ". Only the gravity changes.",
        understood: und,
        set: {},
        src: {},
        tests: bodies.map(function (b) {
          var B = BODIES[b];
          return { label: cap(B.short || B.label), body: b, set: { gravity: B.g, look: B.look, colour: B.colour, size: B.size } };
        }),
      };
    }

    var creating = p.look === "none";
    var body = bodies[0];

    // Name
    var nm = /\b(?:call|name)\s+(?:my planet|the planet|it|my world|the world)?\s*([a-z][a-z0-9-]{1,16})/.exec(t);
    if (nm && !/^(it|my|the|a)$/.test(nm[1])) add("name", cap(nm[1]), "name: " + cap(nm[1]), "you");

    // Looks, colour, size from the words
    var col = colourIn(t),
      size = sizeIn(t),
      look = lookIn(t);
    var ringCol = /\b(red|orange|yellow|gold|green|blue|purple|pink|white|grey)\s+rings?\b/.exec(t);
    if (ringCol && col === ringCol[1]) {
      // "pink rings": the colour belongs to the rings, not the planet
      var rest = t.replace(ringCol[0], "");
      col = colourIn(rest);
    }
    if (body && /\blike\b/.test(t)) {
      var B = BODIES[body];
      if (!look) add("look", B.look, "like " + (B.short || B.label) + ": " + LOOKS[B.look], "you");
      add("gravity", B.g, "like " + (B.short || B.label) + ": gravity " + B.g + " m/s²", "you");
    }
    if (look) add("look", look, LOOKS[look], "you");
    if (col) add("colour", col, COLOURS[col].label, "you");
    if (size) add("size", size, size + " size", "you");

    // Rings and moons
    if (/\brings?\b/.test(t) && !/\bno rings?\b/.test(t)) {
      add("rings", true, (ringCol ? ringCol[1] + " " : "") + "rings", "you");
      if (ringCol) set.ringColour = ringCol[1];
    }
    var mm = /\b(\d|one|two|three|four|five)\s+moons?\b/.exec(t) || (/\ba moon\b/.test(t) ? [0, "one"] : null);
    if (mm) {
      var n = NUMW[mm[1]] || parseInt(mm[1], 10) || 1;
      add("moons", Math.min(4, n), n + (n === 1 ? " moon" : " moons"), "you");
    }

    // Gravity
    var keep = /\b(keep|same|don't change|do not change)\b[^.]{0,24}\bgravity\b|\bgravity\b[^.]{0,12}\b(the same|unchanged)\b/.test(t);
    var gNum = P.numAfter(t, /gravity\s*(?:of|to|at|is|=|be)?\s*/);
    if (gNum == null) gNum = P.numBefore(t, /m\/s/);
    var frac = /\b(half|a third|third|a quarter|quarter|twice|double|three times|2 times|3 times)\b(?:\s+(?:of|as strong as|the))?\s+(?:the\s+)?earth'?s?\b/.exec(t) || /\bgravity\b[^.]{0,20}\b(half|a third|third|a quarter|quarter|twice|double)\b/.exec(t);
    var high = /\b(highest|as high as possible|as high as (it|they|he|she) can|as high as you can|maximum jump|biggest jump|highest jump)\b/.test(t);
    var landBy = /\b(land|back down|come back|comes back|return|lands)\b[^.]{0,40}?\b(within|in|under|less than|before)\s+(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds)\b/.exec(t);
    var times = /\bjump\w*\s+(twice|double|three times|3 times|2 times|half)\s+as high\b/.exec(t) || /\b(twice|double)\s+the jump\b/.exec(t);

    if (keep) {
      und.push({ t: "keep the gravity the same", src: "you" });
    } else if (gNum != null) {
      add("gravity", gNum, "gravity " + gNum + " m/s²", "you");
    } else if (frac) {
      var f = { half: 0.5, "a third": 1 / 3, third: 1 / 3, "a quarter": 0.25, quarter: 0.25, twice: 2, double: 2, "three times": 3, "2 times": 2, "3 times": 3 }[frac[1]];
      var g = U.round(EARTH * f, 2);
      add("gravity", g, frac[1] + " of Earth's gravity: " + U.round(g, 1) + " m/s²", "you");
    } else if (high && landBy) {
      var T = parseFloat(landBy[3]);
      var gl = U.round((2 * V0) / T, 2);
      und.push({ t: "the highest jump", src: "you" });
      und.push({ t: "must land within " + T + " s", src: "you" });
      add("gravity", gl, "gravity " + gl + " m/s² (worked out from your limit)", "calc");
    } else if (high) {
      und.push({ t: "the highest jump possible", src: "you" });
      add("gravity", 0, "no limit given, so gravity 0", "guess");
      return {
        kind: "change",
        say: "The highest jump possible happens with no gravity at all, so I set gravity to 0. Nothing will be in the way of your astronaut!",
        understood: und,
        set: set,
        src: src,
        mistake: "zero-gravity",
      };
    } else if (times) {
      var k = { twice: 2, double: 2, "three times": 3, "3 times": 3, "2 times": 2, half: 0.5 }[times[1]];
      var gt = U.round(p.gravity / k, 2);
      und.push({ t: "jump " + times[1] + " as high", src: "you" });
      add("gravity", gt, "gravity ÷ " + k + " = " + U.round(gt, 1) + " m/s² (worked out)", "calc");
    } else if (/\bjump\w*\s+(higher|bigger|further)|\b(higher|bigger)\s+jump\b/.test(t)) {
      return {
        kind: "clarify",
        say: "How much higher? I need a number, or I'll have to guess. Pick one, or write your own.",
        options: ["twice as high", "as high as on the Moon", "three times as high"],
      };
    }

    if (/\bjump\w*\s+twice as high\b/.test(t) && src.gravity === "you") und.push({ t: "goal: jump twice as high", src: "you" });
    if (/\b(fact card|fact file|facts)\b/.test(t)) und.push({ t: "write a fact card", src: "you" });

    // Creating a planet from nothing: fill the gaps with guesses
    if (creating) {
      und.unshift({ t: "a planet", src: "you" });
      if (!("look" in set) && !("colour" in set) && !body) {
        add("look", "earth", "looks like Earth: blue oceans, green land", "guess");
        set.colour = "blue";
        src.colour = "guess";
      }
      if (!("look" in set)) add("look", body ? BODIES[body].look : "rocky", body ? LOOKS[BODIES[body].look] : "rocky", body ? "you" : "guess");
      if (!("colour" in set)) add("colour", body ? BODIES[body].colour : "grey", body ? COLOURS[BODIES[body].colour].label : "grey", body ? "you" : "guess");
      if (!("size" in set)) add("size", body ? BODIES[body].size : "medium", (body ? BODIES[body].size : "medium") + " size", body ? "you" : "guess");
      if (!("gravity" in set)) add("gravity", body ? BODIES[body].g : EARTH, "gravity " + (body ? BODIES[body].g : EARTH) + " m/s²" + (body ? "" : ", like Earth"), body ? "you" : "guess");
      if (!("rings" in set) && !("moons" in set)) und.push({ t: "no rings or moons", src: "guess" });
    } else if (set.colour && !set.look && p.look === "earth") {
      // "Make a red planet": red planets are usually rocky, so the AI guesses
      add("look", "rocky", "rocky (red planets usually are)", "guess");
    }

    if (!und.length) {
      return {
        kind: "clarify",
        say: "I'm not sure what to change. You could tell me about the planet's size, colour, gravity, rings or moons.",
        options: ["make it small and red", "with rings", "gravity like the Moon"],
      };
    }

    var guesses = und.filter(function (u) {
      return u.src === "guess";
    }).length;
    var say;
    if (creating && guesses >= 3) say = "Here's your planet! You didn't say what kind, so I made one like Earth, because it's the planet I've seen most often. I had to guess the rest.";
    else if (src.gravity === "calc") say = "I worked out the gravity from your words, then set it. Test it to check my maths.";
    else if (frac && src.gravity === "you") say = "Earth's gravity is 9.8 m/s², so " + frac[1] + " of it is " + U.round(set.gravity, 1) + " m/s². I've set that. Now let's test your goal.";
    else if (set.name) say = "Here's " + set.name + "! I changed only what you asked for.";
    else if (body && /\blike\b/.test(t)) say = "Done. " + BODIES[body].label.replace(/^the /, "The ") + "'s gravity is " + BODIES[body].g + " m/s², so I used that.";
    else say = "Done. I changed only what you asked for.";
    return { kind: "change", say: say, understood: und, set: set, src: src };
  }

  /* ---- Predictions ----------------------------------------------------------------- */
  function predict(r, c) {
    if (r.kind === "tests") {
      return {
        q: "Which planet will give the highest jump?",
        options: r.tests.map(function (x) {
          var best = r.tests.reduce(function (a, b) {
            return a.set.gravity < b.set.gravity ? a : b;
          });
          return { t: x.label, ok: x === best };
        }),
        right: "Right: the weakest gravity gives the highest jump.",
        wrong: "The table will show which one. Look for the weakest gravity.",
      };
    }
    var before = measure(c.params),
      after = measure(Object.assign({}, c.params, r.set));
    if (after.jump == null) return null;
    if (!isFinite(after.jump)) {
      return {
        q: "Gravity is now 0. What will happen when your astronaut jumps?",
        options: [
          { t: "A really high jump, then land", ok: false },
          { t: "Float away and never land", ok: true },
          { t: "Can't jump at all", ok: false },
        ],
        right: "Yes: with no gravity, nothing pulls the astronaut back down.",
        wrong: "Without gravity, nothing pulls the astronaut back down.",
      };
    }
    if (c.session === 4 && r.src && r.src.gravity === "calc") {
      return {
        q: "Gravity is " + U.round(r.set.gravity, 2) + " m/s². Will the astronaut land within 10 seconds?",
        options: [
          { t: "Yes, just in time", ok: after.hang <= 10.05 },
          { t: "No, it takes longer", ok: after.hang > 10.05 },
        ],
        right: "Right. The AI's maths kept to your limit.",
        wrong: "Check the time in the air: it kept to your limit.",
      };
    }
    if (c.session === 6 && !("gravity" in r.set)) {
      return {
        q: "You kept the gravity the same. Will the jump change?",
        options: [
          { t: "No, it stays the same", ok: true },
          { t: "Yes, rings make it higher", ok: false },
          { t: "Yes, moons pull it higher", ok: false },
        ],
        right: "Right. Rings and moons don't change how hard the planet pulls on you.",
        wrong: "Rings and moons don't change the planet's pull on your astronaut.",
      };
    }
    var ref = c.session === 3 ? measure({ look: "earth", gravity: EARTH }) : before.jump == null ? measure({ look: "earth", gravity: EARTH }) : before;
    var refName = c.session === 3 || before.jump == null ? "on Earth" : "before";
    var ratio = after.jump / ref.jump;
    var opts;
    if (c.session === 3) {
      opts = [
        { t: "Twice as high as on Earth", ok: Math.abs(ratio - 2) < 0.25 },
        { t: "Half as high as on Earth", ok: Math.abs(ratio - 0.5) < 0.1 },
        { t: "The same as on Earth", ok: Math.abs(ratio - 1) < 0.1 },
      ];
      if (!opts.some(function (o) {
        return o.ok;
      }))
        opts.push({ t: ratio > 1 ? "Higher, but not exactly twice" : "Lower than on Earth", ok: true });
      var gN = "gravity" in r.set ? r.set.gravity : c.params.gravity;
      return { q: "Gravity is now " + U.round(gN, 1) + " m/s². Your jump will be…", options: opts, right: "Spot on. Half the gravity, double the jump.", wrong: "Look at the numbers: half the gravity gives double the jump." };
    }
    opts = [
      { t: "Higher than " + refName, ok: ratio > 1.15 },
      { t: "About the same as " + refName, ok: ratio >= 0.87 && ratio <= 1.15 },
      { t: "Lower than " + refName, ok: ratio < 0.87 },
    ];
    var truth = ratio > 1.15 ? "higher, because the gravity is weaker" : ratio < 0.87 ? "lower, because the gravity is stronger" : "about the same, because the gravity is the same";
    return {
      q: before.jump == null ? "Your astronaut will jump on your new planet. Compared with Earth, the jump will be…" : "Your astronaut will jump again. The jump will be…",
      options: opts,
      right: "Your prediction was right: it's " + truth + ".",
      wrong: "The test shows it's " + truth + ".",
    };
  }

  /* ---- Cause and effect ---------------------------------------------------------- */
  function factor(a, b) {
    if (!isFinite(a) || !isFinite(b) || !a || !b) return "";
    var r = b / a;
    if (Math.abs(r - 1) < 0.04) return "same";
    if (r > 1) return "×" + U.round(r, r >= 10 ? 0 : 1);
    return "÷" + U.round(1 / r, 1 / r >= 10 ? 0 : 1);
  }
  function effect(result, trial, resp, c) {
    var a = result.prev,
      b = result.next;
    var S = c.session;
    var concept = {
      1: "Every planet pulls things towards its centre. That pull is gravity. On Earth it's 9.8 m/s², which is why you land quickly after a jump.",
      2: "Different planets have different gravity. Mars pulls less than Earth (3.7 m/s² instead of 9.8), so the same push sends you higher.",
      3: "Halve the gravity and the jump doubles. When one number halves and the other doubles, they are inversely proportional.",
      4: "Gravity is what brings you back down. With no gravity, nothing pulls you back, so a jump never ends. A limit on time gives you the highest jump that still lands.",
      5: "Gravity × jump height is about 4.8 on every planet. When one goes up, the other goes down by the same factor.",
      6: "Rings, moons and colours change how a planet looks, not how hard it pulls on you. Your jump depends only on gravity.",
    }[S];
    if (resp.kind === "tests") return { headline: "Weaker gravity <b>→</b> higher jump", concept: concept };
    var rows = [];
    var gPrev = c.params.gravity,
      gNext = trial.gravity;
    if (S === 3 && c.params.look !== "none") {
      var e = measure({ look: "earth", gravity: EARTH });
      return {
        headline: "Gravity " + factor(EARTH, gNext) + " <b>→</b> jump " + factor(e.jump, b.jump) + " <small>compared with Earth</small>",
        rows: [
          { label: "Gravity (Earth → yours)", from: "9.8 m/s²", to: U.round(gNext, 2) + " m/s²", factor: factor(EARTH, gNext) },
          { label: "Jump height", from: CX.studio.fmtVal(def, "jump", e.jump), to: CX.studio.fmtVal(def, "jump", b.jump), factor: factor(e.jump, b.jump) },
          { label: "Time in the air", from: CX.studio.fmtVal(def, "hang", e.hang), to: CX.studio.fmtVal(def, "hang", b.hang) },
        ],
        concept: concept,
        conceptTitle: "The maths",
      };
    }
    if (c.params.look !== "none" && gPrev !== gNext) rows.push({ label: "Gravity", from: U.round(gPrev, 2) + " m/s²", to: U.round(gNext, 2) + " m/s²", factor: factor(gPrev, gNext) });
    if (a.jump != null) {
      rows.push({ label: "Jump height", from: CX.studio.fmtVal(def, "jump", a.jump), to: CX.studio.fmtVal(def, "jump", b.jump), factor: factor(a.jump, b.jump) });
      rows.push({ label: "Time in the air", from: CX.studio.fmtVal(def, "hang", a.hang), to: CX.studio.fmtVal(def, "hang", b.hang) });
    } else {
      rows.push({ label: "Jump height", from: "no planet", to: CX.studio.fmtVal(def, "jump", b.jump) });
    }
    var headline;
    if (!isFinite(b.jump)) headline = "Gravity 0 <b>→</b> the astronaut never comes back";
    else if (a.jump == null) headline = "Gravity " + U.round(gNext, 1) + " m/s² <b>→</b> a " + U.round(b.jump, 1) + " m jump";
    else if (gPrev === gNext) headline = "Same gravity <b>→</b> same jump";
    else headline = "Gravity " + factor(gPrev, gNext) + " <b>→</b> jump " + factor(a.jump, b.jump);
    return { headline: headline, rows: rows, concept: concept, conceptTitle: S === 3 ? "The maths" : "The science" };
  }

  function why(resp, result, c) {
    if (resp.kind === "tests") {
      return result.rows
        .map(function (r) {
          return r.label + ": " + U.round(r.params.gravity, 1) + " × " + U.round(r.metrics.jump, 2) + " ≈ " + U.round(r.params.gravity * r.metrics.jump, 1);
        })
        .join(". ") + ". Gravity × jump height stays the same (3.1 × 3.1 ÷ 2 = 4.8), so less gravity always means a higher jump.";
    }
    var g = result.next && isFinite(result.next.jump) ? (resp.set.gravity != null ? resp.set.gravity : c.params.gravity) : 0;
    if (!g) return "Your astronaut pushes off at 3.1 m/s. Gravity is what slows them down and brings them back. With gravity at 0, nothing slows them down, so they keep going for ever.";
    return (
      "Your astronaut always pushes off at 3.1 metres per second. Jump height = 3.1 × 3.1 ÷ (2 × gravity) = 9.61 ÷ " +
      U.round(2 * g, 2) +
      " ≈ " +
      U.round(result.next.jump, 2) +
      " m. Less gravity means less pull back down, so the jump goes higher."
    );
  }

  /* ---- Sessions -------------------------------------------------------------------- */
  var sessions = [
    {
      goal: "Make your first planet. Keep the prompt short, then look at what the AI had to guess.",
      concept: "Gravity: a planet's pull",
      intro: "Your planet doesn't exist yet. Ask the AI to make one, in just a few words.",
      reset: {},
      suggestions: ["Make a planet"],
      check: function (r, p, resp) {
        if (p.look === "none") return { pass: false, coach: "Ask the AI to make a planet." };
        return { pass: true, note: "Version 1 is built. The AI guessed " + (resp.guesses || 0) + " things for you. Next session you'll add details so it guesses less." };
      },
    },
    {
      goal: "Make a planet that's NOT like Earth. Add details so the AI doesn't have to guess: what size, what colour, like which planet?",
      concept: "Planets have different gravity",
      suggestions: ["Make a red planet", "Make a small red rocky planet like Mars"],
      demoStart: { look: "earth", colour: "blue", size: "medium", gravity: 9.8 },
      check: function (r, p, resp) {
        var yours = (resp.understood || []).filter(function (u) {
          return u.src === "you";
        }).length;
        if (yours >= 3 && (resp.guesses || 0) <= 1 && p.look !== "earth") return { pass: true, note: (resp.guesses ? "Only " + resp.guesses + (resp.guesses === 1 ? " guess" : " guesses") : "No guesses") + " this time, down from 4 in session 1. Your details did that." };
        return { pass: false, note: "The AI still had to guess. Your planet isn't different enough from Earth yet.", coach: "Add more details: what size? Like which planet? The AI used “like Mars” to choose the gravity." };
      },
    },
    {
      goal: "Make your astronaut jump exactly twice as high as on Earth (about 1 m). Use numbers.",
      concept: "Halving and doubling",
      suggestions: ["Make the jump bigger", "Make gravity half of Earth's so my astronaut jumps twice as high"],
      demoStart: { look: "rocky", colour: "red", size: "small", gravity: 3.7 },
      check: function (r) {
        var j = r.next.jump;
        if (j >= 0.9 && j <= 1.1) return { pass: true, note: "0.5 m on Earth, " + U.round(j, 1) + " m now: exactly twice as high." };
        return { pass: false, note: "The jump is " + CX.studio.fmtVal(def, "jump", j) + ". Twice Earth's jump is about 1 m.", coach: "Use a number for the gravity. What's half of Earth's 9.8?" };
      },
    },
    {
      goal: "Make the highest jump you can, but your astronaut must land again within 10 seconds.",
      concept: "What gravity does",
      suggestions: ["Make my astronaut jump as high as possible", "Make the highest jump you can, but my astronaut must land within 10 seconds"],
      after: ["Make the highest jump you can, but my astronaut must land within 10 seconds"],
      demoStart: { look: "rocky", colour: "red", size: "small", gravity: 4.9 },
      check: function (r) {
        var m = r.next;
        if (!isFinite(m.hang)) return { pass: false, note: "Your astronaut floated away and never landed. The AI did what you said, not what you meant.", coach: "Add a limit so the astronaut comes back: “…but my astronaut must land within 10 seconds”." };
        if (m.hang <= 10.05 && m.jump >= 5) return { pass: true, note: "A " + U.round(m.jump, 1) + " m jump that lands in " + U.round(m.hang, 1) + " s. Your limit made the AI find the best answer." };
        return { pass: false, note: "It lands, but it's not the highest jump that still lands within 10 seconds.", coach: "Ask for the highest jump, and say the time limit." };
      },
    },
    {
      goal: "Ask the AI to test your astronaut's jump on three planets, show you a table and explain the pattern.",
      concept: "Patterns in data",
      suggestions: ["Test the jump on Earth, Mars and the Moon, show me a table and explain the pattern"],
      demoStart: { look: "rocky", colour: "red", size: "small", gravity: 0.62 },
      check: function (r, p, resp) {
        if (resp.kind === "tests" && r.rows && r.rows.length >= 3) return { pass: true, note: "Three fair tests. Check the AI's explanation against the table." };
        return { pass: false, coach: "Ask for a test on three planets and a table." };
      },
    },
    {
      goal: "Finish your planet and make it yours. Use all six ingredients, then make your share card.",
      concept: "Your planet, explained",
      suggestions: ["Call my planet Zorb. Make it icy blue with two moons and pink rings, keep the gravity the same so the jump stays high, and write a fact card that explains it"],
      demoStart: { look: "rocky", colour: "red", size: "small", gravity: 0.62 },
      check: function (r, p, resp) {
        if (p.name && resp.analysis.count >= 5) return { pass: true, note: "A " + resp.analysis.count + "-ingredient prompt. Compare it with your first one: “Make a planet”." };
        return { pass: false, coach: "Give your planet a name and use at least five ingredients: details, numbers, a goal (“so…”), a limit (“keep…”) and a check (“explain…”)." };
      },
    },
  ];

  /* ---- 3D --------------------------------------------------------------------------- */
  var texCache = {};

  function hash3(x, y, z, s) {
    var h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s + 1, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y, z, s) {
    var xi = Math.floor(x),
      yi = Math.floor(y),
      zi = Math.floor(z);
    var xf = x - xi,
      yf = y - yi,
      zf = z - zi;
    var u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf),
      w = zf * zf * (3 - 2 * zf);
    var a = hash3(xi, yi, zi, s),
      b = hash3(xi + 1, yi, zi, s),
      c = hash3(xi, yi + 1, zi, s),
      d = hash3(xi + 1, yi + 1, zi, s);
    var e = hash3(xi, yi, zi + 1, s),
      f = hash3(xi + 1, yi, zi + 1, s),
      g = hash3(xi, yi + 1, zi + 1, s),
      h = hash3(xi + 1, yi + 1, zi + 1, s);
    var x1 = a + (b - a) * u,
      x2 = c + (d - c) * u,
      x3 = e + (f - e) * u,
      x4 = g + (h - g) * u;
    var y1 = x1 + (x2 - x1) * v,
      y2 = x3 + (x4 - x3) * v;
    return y1 + (y2 - y1) * w;
  }
  function fbm(x, y, z, s, oct) {
    var sum = 0,
      amp = 0.5,
      f = 1,
      norm = 0;
    for (var i = 0; i < oct; i++) {
      sum += amp * vnoise(x * f, y * f, z * f, s + i * 17);
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / norm;
  }
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function rgb(hex) {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  }
  function sstep(a, b, x) {
    var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function paint(look, colour) {
    var key = look + ":" + colour;
    if (texCache[key]) return texCache[key];
    var W = CX.three.quality() === "low" ? 512 : 1024,
      H = W / 2;
    var cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    var g = cv.getContext("2d");
    var img = g.createImageData(W, H);
    var bump = document.createElement("canvas");
    bump.width = W;
    bump.height = H;
    var bg = bump.getContext("2d");
    var bimg = bg.createImageData(W, H);
    var base = rgb((COLOURS[colour] || COLOURS.blue).hex);
    var dark = base.map(function (v) {
      return v * 0.45;
    });
    var light = base.map(function (v) {
      return Math.min(255, v * 1.25 + 30);
    });
    var seed = look.length * 31 + colour.length * 7;
    for (var y = 0; y < H; y++) {
      var lat = (0.5 - y / H) * Math.PI;
      var cl = Math.cos(lat),
        sl = Math.sin(lat);
      for (var x = 0; x < W; x++) {
        var lon = (x / W) * Math.PI * 2;
        var px = cl * Math.cos(lon),
          py = sl,
          pz = cl * Math.sin(lon);
        var c, h;
        if (look === "earth") {
          var n = fbm(px * 1.7 + 3, py * 1.7, pz * 1.7, seed, 5);
          var land = sstep(0.5, 0.53, n);
          var ocean = mix([16, 52, 120], [40, 120, 196], sstep(0.3, 0.5, n));
          var e = sstep(0.53, 0.72, n);
          var ground = mix([62, 138, 72], [150, 120, 70], e);
          c = mix(ocean, ground, land);
          var ice = sstep(1.12, 1.28, Math.abs(lat) + (n - 0.5) * 0.4);
          c = mix(c, [236, 242, 250], ice);
          h = land * (0.4 + e * 0.6);
        } else if (look === "gas") {
          var turb = fbm(px * 2.2, py * 6, pz * 2.2, seed, 4);
          var band = Math.sin(lat * 13 + turb * 5.5) * 0.5 + 0.5;
          var pal = colour === "blue" ? [[30, 70, 160], [120, 170, 230]] : colour === "gold" ? [[180, 140, 80], [240, 220, 170]] : [[150, 80, 40], [240, 210, 170]];
          c = mix(pal[0], pal[1], band);
          c = mix(c, base, 0.25);
          if (colour !== "blue") {
            var dx = lon - 4.2,
              dy = lat + 0.35;
            var spot = Math.exp(-(dx * dx * 9 + dy * dy * 60));
            c = mix(c, [190, 80, 50], spot * 0.85);
          }
          h = band * 0.3;
        } else if (look === "icy") {
          var ni = fbm(px * 2.4, py * 2.4, pz * 2.4, seed, 5);
          c = mix([70, 118, 170], [176, 210, 232], ni);
          c = mix(c, base.map(function (v) {
            return v * 0.8;
          }), 0.3);
          var crack = Math.abs(fbm(px * 5, py * 5, pz * 5, seed + 9, 3) - 0.5);
          c = mix(c, [40, 90, 160], (1 - sstep(0.0, 0.025, crack)) * 0.75);
          h = ni;
        } else if (look === "cloudy") {
          var nc = fbm(px * 2 + fbm(px * 3, py * 3, pz * 3, seed, 3) * 1.5, py * 3, pz * 2, seed, 5);
          c = mix(dark, light, nc);
          h = nc * 0.3;
        } else {
          // rocky / moon: base colour, patches and craters
          var nr = fbm(px * 2.2, py * 2.2, pz * 2.2, seed, 6);
          var patches = sstep(0.42, 0.62, fbm(px * 1.3 + 5, py * 1.3, pz * 1.3, seed + 3, 4));
          c = mix(dark, light, nr);
          c = mix(c, dark, patches * 0.45);
          if (look === "moon") c = mix(c, [150, 148, 156], 0.65);
          var cap = sstep(1.25, 1.36, Math.abs(lat) + (nr - 0.5) * 0.3);
          if (look === "rocky") c = mix(c, [240, 236, 232], cap);
          h = nr;
        }
        var i = (y * W + x) * 4;
        img.data[i] = c[0];
        img.data[i + 1] = c[1];
        img.data[i + 2] = c[2];
        img.data[i + 3] = 255;
        var hv = Math.max(0, Math.min(255, h * 255));
        bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = hv;
        bimg.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    bg.putImageData(bimg, 0, 0);
    // Craters drawn on top for rocky worlds
    if (look === "rocky" || look === "moon") {
      var rand = U.rng(seed + 5);
      var count = look === "moon" ? 90 : 45;
      for (var k = 0; k < count; k++) {
        var cx = rand() * W,
          cy = H * 0.15 + rand() * H * 0.7,
          r = (look === "moon" ? 4 : 3) + Math.pow(rand(), 2.4) * W * 0.035;
        [g, bg].forEach(function (ctx, j) {
          var grd = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
          grd.addColorStop(0, j ? "rgba(40,40,40,0.9)" : "rgba(0,0,0,0.28)");
          grd.addColorStop(0.75, j ? "rgba(60,60,60,0.5)" : "rgba(0,0,0,0.12)");
          grd.addColorStop(0.9, j ? "rgba(235,235,235,0.9)" : "rgba(255,255,255,0.22)");
          grd.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 1.25, r, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    var T = THREE;
    var map = new T.CanvasTexture(cv);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 8;
    var bmap = new T.CanvasTexture(bump);
    texCache[key] = { map: map, bump: bmap };
    return texCache[key];
  }

  var cloudTex = null;
  function clouds() {
    if (cloudTex) return cloudTex;
    var W = 1024,
      H = 512;
    var cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    var g = cv.getContext("2d");
    var img = g.createImageData(W, H);
    for (var y = 0; y < H; y++) {
      var lat = (0.5 - y / H) * Math.PI,
        cl = Math.cos(lat),
        sl = Math.sin(lat);
      for (var x = 0; x < W; x++) {
        var lon = (x / W) * Math.PI * 2;
        var n = fbm(cl * Math.cos(lon) * 2.6, sl * 4, cl * Math.sin(lon) * 2.6, 77, 5);
        var a = sstep(0.52, 0.72, n) * 235;
        var i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = a;
      }
    }
    g.putImageData(img, 0, 0);
    cloudTex = new THREE.CanvasTexture(cv);
    cloudTex.colorSpace = THREE.SRGBColorSpace;
    return cloudTex;
  }

  function ringTex(colour) {
    var cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 8;
    var g = cv.getContext("2d");
    var c = rgb((COLOURS[colour] || COLOURS.pink).hex);
    var rand = U.rng(12);
    for (var x = 0; x < 512; x++) {
      var t = x / 511;
      var a = (0.35 + 0.65 * rand()) * Math.sin(t * Math.PI) * (x % 37 < 3 ? 0.25 : 1);
      g.fillStyle = "rgba(" + Math.round(c[0] * (0.7 + rand() * 0.3)) + "," + Math.round(c[1] * (0.7 + rand() * 0.3)) + "," + Math.round(c[2] * (0.7 + rand() * 0.3)) + "," + a.toFixed(3) + ")";
      g.fillRect(x, 0, 1, 8);
    }
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function glowShell(colour, radius, power, strength) {
    var T = THREE;
    return new T.Mesh(
      new T.SphereGeometry(radius, 64, 48),
      new T.ShaderMaterial({
        uniforms: { c: { value: new T.Color(colour) }, p: { value: power }, k: { value: strength } },
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform vec3 c; uniform float p; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - max(0.0, dot(vN, vV)); float i = pow(f, p) * k; gl_FragColor = vec4(c * i, i); }",
        side: T.FrontSide,
        blending: T.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      })
    );
  }

  function scene(host, kit) {
    var T = THREE,
      X = CX.three;
    var st = X.stage(host, { background: 0x05010f, fov: 36, bloom: { strength: 0.9, radius: 0.55, threshold: 1.05 }, exposure: 1.0, envIntensity: 0.6 });
    var sc = st.scene,
      cam = st.camera;

    var sun = new T.DirectionalLight(0xfff0dc, 2.3);
    sun.position.set(-9, 7, 7);
    sc.add(sun);
    var rim = new T.DirectionalLight(0x9db8ff, 1.1);
    rim.position.set(8, 3, -6);
    sc.add(rim);
    sc.add(new T.AmbientLight(0x5f55a8, 0.45));
    sc.add(X.stars({ count: 2600, radius: 140, size: 0.9 }));
    [
      [0x7a3cff, -70, 25, -110, 110, 0.16],
      [0x2fd1c5, 80, -35, -120, 90, 0.11],
      [0xff7ac0, 35, 60, -130, 70, 0.1],
    ].forEach(function (n) {
      var s = X.glow(n[0], n[4], n[5]);
      s.position.set(n[1], n[2], n[3]);
      sc.add(s);
    });
    var sunGlow = X.glow(0xffe0a0, 26, 0.9);
    sunGlow.position.set(-70, 48, -95);
    sc.add(sunGlow);

    var world = new T.Group();
    sc.add(world);
    var planet = new T.Group();
    world.add(planet);
    var spin = new T.Group();
    planet.add(spin);
    var surfMat = new T.MeshStandardMaterial({ roughness: 0.92, metalness: 0 });
    var surf = new T.Mesh(new T.SphereGeometry(1, 160, 120), surfMat);
    spin.add(surf);
    var cloudMat = new T.MeshStandardMaterial({ map: null, transparent: true, depthWrite: false, opacity: 0.9, roughness: 1 });
    var cloudMesh = new T.Mesh(new T.SphereGeometry(1.022, 96, 72), cloudMat);
    spin.add(cloudMesh);
    var halo = glowShell(0x6fb4ff, 1.07, 2.6, 1.1);
    planet.add(halo);
    var ring = null;
    var moons = [];

    // The "seed": what's there before the first prompt
    var seed = new T.Group();
    var wire = new T.Mesh(new T.IcosahedronGeometry(1, 2), new T.MeshBasicMaterial({ color: 0xdbe751, wireframe: true, transparent: true, opacity: 0.55 }));
    seed.add(wire);
    var seedGlow = X.glow(0xdbe751, 2.2, 0.55);
    seed.add(seedGlow);
    world.add(seed);

    var bit = X.bit({ colour: "pink", face: "happy" });
    bit.scale.setScalar(0.5);
    world.add(bit);
    var rig = bit.userData.rig;

    // Ruler and peak markers
    var ruler = new T.Group();
    world.add(ruler);
    var rulerPins = [];
    var markers = new T.Group();
    world.add(markers);
    var markerPins = [];

    var cur = null;
    var R = BASE_R;
    var look = new T.Vector3(0, 0.6, 0);
    var view = { d: 13, h: 2.2, yaw: 0.0 };
    var idleSpin = true;
    var t0 = 0;

    function radius(p) {
      return BASE_R * (SIZES[p.size] || SIZES.medium).r;
    }

    function applyLook(p) {
      var tx = paint(p.look === "none" ? "earth" : p.look, p.colour);
      surfMat.map = tx.map;
      surfMat.needsUpdate = true;
      cloudMat.map = clouds();
      cloudMesh.visible = p.look === "earth" || p.look === "cloudy";
      cloudMat.opacity = p.look === "cloudy" ? 0.55 : 0.85;
      var haloCol = { earth: 0x6fb4ff, rocky: 0xffa070, moon: 0x888899, gas: 0xffd9a0, icy: 0xaee6ff, cloudy: 0xffe6a0 }[p.look] || 0x6fb4ff;
      if (p.look === "gas" && p.colour === "blue") haloCol = 0x7fb0ff;
      halo.material.uniforms.c.value.set(haloCol);
      halo.material.uniforms.k.value = p.look === "moon" ? 0.25 : p.look === "rocky" ? 0.65 : 1.1;
    }

    function applyRings(p) {
      if (ring) {
        planet.remove(ring);
        ring.geometry.dispose();
        ring.material.map.dispose();
        ring.material.dispose();
        ring = null;
      }
      if (!p.rings) return;
      var geo = new T.RingGeometry(1.45, 2.35, 160, 1);
      var pos = geo.attributes.position,
        uv = geo.attributes.uv;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i),
          y = pos.getY(i);
        uv.setXY(i, (Math.sqrt(x * x + y * y) - 1.45) / 0.9, 0.5);
      }
      ring = new T.Mesh(geo, new T.MeshBasicMaterial({ map: ringTex(p.ringColour || "pink"), transparent: true, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2 + 0.38;
      ring.rotation.y = 0.22;
      var ra = new T.Object3D();
      ra.position.set(-2.05, -0.6, 0);
      ring.add(ra);
      ring.userData.anchor = ra;
      planet.add(ring);
    }

    function applyMoons(p) {
      moons.forEach(function (m) {
        world.remove(m.pivot);
      });
      moons = [];
      var tx = paint("moon", "grey");
      for (var i = 0; i < (p.moons || 0); i++) {
        var pivot = new T.Group();
        pivot.rotation.z = 0.25 - i * 0.18;
        pivot.rotation.y = i * 2.1;
        var mesh = new T.Mesh(new T.SphereGeometry(0.26 + i * 0.05, 48, 32), new T.MeshStandardMaterial({ map: tx.map, roughness: 0.95 }));
        mesh.position.x = 2.2 + i * 0.75;
        pivot.add(mesh);
        world.add(pivot);
        moons.push({ pivot: pivot, mesh: mesh, speed: 0.35 - i * 0.08 });
      }
    }

    function place(p, animate) {
      var r = radius(p);
      var from = R;
      R = r;
      if (animate) {
        var o = { r: from };
        st.tween(o, { r: r }, 0.9, {
          ease: X.ease.outBack,
          onUpdate: function () {
            planet.scale.setScalar(o.r);
            bit.position.y = o.r;
            ruler.position.y = o.r;
            markers.position.y = o.r;
            moons.forEach(function (m) {
              m.pivot.scale.setScalar(o.r / BASE_R);
            });
          },
        });
      } else {
        planet.scale.setScalar(r);
        bit.position.y = r;
        ruler.position.y = r;
        markers.position.y = r;
        moons.forEach(function (m) {
          m.pivot.scale.setScalar(r / BASE_R);
        });
      }
    }

    function frameOverview(dur) {
      var ringy = cur && cur.rings ? 1.35 : 1;
      var target = { lx: 0, ly: R * 0.45, lz: 0, d: R * 3.9 * ringy + 3.2, h: R * 0.55 + 0.8 };
      return moveCam(target, dur);
    }
    function frameJump(hUnits, dur) {
      var top = R + Math.max(1.3, hUnits);
      var d = Math.max(5.4, (top - R) * 2.1 + 3.6);
      return moveCam({ lx: 0, ly: R + Math.min(hUnits, 8) * 0.52 + 0.3, lz: 0, d: d, h: R + Math.min(hUnits, 8) * 0.35 + 0.9 }, dur);
    }
    var camState = { lx: 0, ly: 0.6, lz: 0, d: 13, h: 2.2 };
    function moveCam(target, dur) {
      return st.tween(camState, target, dur == null ? 1.2 : dur, { ease: X.ease.inOut });
    }

    // Ruler next to the astronaut
    function buildRuler(maxM) {
      while (ruler.children.length) ruler.remove(ruler.children[0]);
      rulerPins.forEach(function (p) {
        p.remove();
      });
      rulerPins = [];
      var top = Math.max(1.5, Math.ceil(maxM + 0.5));
      var mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
      var pole = new T.Mesh(new T.BoxGeometry(0.03, top * M, 0.03), mat);
      pole.position.set(0.85, (top * M) / 2, 0.15);
      ruler.add(pole);
      for (var mtr = 0.5; mtr <= top + 0.001; mtr += 0.5) {
        var whole = Math.abs(mtr - Math.round(mtr)) < 0.01;
        var tick = new T.Mesh(new T.BoxGeometry(whole ? 0.22 : 0.12, 0.022, 0.022), mat);
        tick.position.set(0.85 + (whole ? 0.08 : 0.03), mtr * M, 0.15);
        ruler.add(tick);
        if (whole && (top <= 4 || mtr % 2 === 0)) {
          var lab = document.createElement("span");
          lab.className = "pl-tick";
          lab.textContent = mtr + " m";
          rulerPins.push(st.pin(lab, tick, new T.Vector3(0.26, 0, 0)));
        }
      }
    }

    function marker(hM, label, kind) {
      var col = kind === "ghost" ? 0xefabcd : 0xdbe751;
      var g = new T.Group();
      for (var i = 0; i < (kind === "ghost" ? 7 : 1); i++) {
        var seg = new T.Mesh(new T.BoxGeometry(kind === "ghost" ? 0.14 : 1.5, 0.035, 0.035), new T.MeshBasicMaterial({ color: col, toneMapped: false }));
        seg.position.x = kind === "ghost" ? -0.7 + i * 0.23 : 0;
        g.add(seg);
      }
      g.position.set(0.1, Math.min(hM, 40) * M + 0.66 * 0.5, 0.15);
      markers.add(g);
      var lab = document.createElement("span");
      lab.className = "pl-peak pl-peak--" + (kind || "now");
      lab.innerHTML = label;
      markerPins.push(st.pin(lab, g, new T.Vector3(-0.95, 0, 0)));
      return g;
    }
    function clearMarkers() {
      while (markers.children.length) markers.remove(markers.children[0]);
      markerPins.forEach(function (p) {
        p.remove();
      });
      markerPins = [];
    }

    // Trail behind the astronaut
    var trailN = 90;
    var trailPos = new Float32Array(trailN * 3);
    var trailGeo = new T.BufferGeometry();
    trailGeo.setAttribute("position", new T.BufferAttribute(trailPos, 3));
    var trail = new T.Points(trailGeo, new T.PointsMaterial({ size: 0.16, map: X.dot(), color: 0xefabcd, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 }));
    world.add(trail);
    var trailI = 0;
    function resetTrail() {
      for (var i = 0; i < trailPos.length; i++) trailPos[i] = 0;
      trailPos.fill(-999);
      trailGeo.attributes.position.needsUpdate = true;
      trailI = 0;
    }
    resetTrail();
    function pushTrail(v) {
      trailPos[trailI * 3] = v.x;
      trailPos[trailI * 3 + 1] = v.y;
      trailPos[trailI * 3 + 2] = v.z;
      trailI = (trailI + 1) % trailN;
      trailGeo.attributes.position.needsUpdate = true;
    }

    // Test bench: three small worlds side by side
    var bench = null;
    function clearBench() {
      if (!bench) return;
      sc.remove(bench.group);
      bench.pins.forEach(function (p) {
        p.remove();
      });
      bench = null;
      world.visible = true;
    }

    // Frame loop
    var jumping = false;
    st.onFrame(function (dt, time) {
      if (idleSpin) spin.rotation.y += dt * 0.09;
      cloudMesh.rotation.y += dt * 0.02;
      wire.rotation.y += dt * 0.4;
      wire.rotation.x += dt * 0.17;
      seedGlow.material.opacity = 0.4 + Math.sin(time * 2.2) * 0.15;
      moons.forEach(function (m) {
        m.pivot.rotation.y += dt * m.speed;
        m.mesh.rotation.y += dt * 0.3;
      });
      if (!jumping) {
        rig.position.y = Math.sin(time * 2.4) * 0.03;
        rig.rotation.z = Math.sin(time * 1.3) * 0.04;
      }
      var yaw = Math.sin(time * 0.12) * 0.22;
      cam.position.set(camState.lx + Math.sin(yaw) * camState.d, camState.h, camState.lz + Math.cos(yaw) * camState.d);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      if (bench) bench.tick(dt, time);
    });

    function set(p, o) {
      o = o || {};
      clearBench();
      var prev = cur;
      cur = JSON.parse(JSON.stringify(p));
      var creating = (!prev || prev.look === "none") && p.look !== "none";
      if (p.look === "none") {
        planet.visible = false;
        seed.visible = true;
        bit.visible = false;
        ruler.visible = false;
        R = 1.4;
        frameOverview(o.instant ? 0 : 1);
        return;
      }
      seed.visible = false;
      planet.visible = true;
      bit.visible = true;
      ruler.visible = true;
      var looks = !prev || prev.look !== p.look || prev.colour !== p.colour;
      if (creating && !o.instant) {
        applyLook(p);
        applyRings(p);
        applyMoons(p);
        planet.scale.setScalar(0.01);
        R = radius(p);
        var o2 = { s: 0.01 };
        st.tween(o2, { s: R }, 1.3, {
          ease: X.ease.outBack,
          onUpdate: function () {
            planet.scale.setScalar(o2.s);
            bit.position.y = o2.s;
            ruler.position.y = o2.s;
            markers.position.y = o2.s;
          },
        });
        X.burst(st, new T.Vector3(0, 0, 0), { count: 120, colours: [0xdbe751, 0xefabcd, 0x49a7a9, 0xffffff], speed: 6, gravity: 0, life: 1.4, size: 0.2 });
        kit.sound("morph");
      } else {
        if (looks && !o.instant) {
          // squash, swap the surface, spring back
          var o3 = { k: 1 };
          st.tween(o3, { k: 0.88 }, 0.25, {
            onUpdate: function () {
              spin.scale.setScalar(o3.k);
            },
          }).then(function () {
            applyLook(p);
            X.burst(st, new T.Vector3(0, 0, 0), { count: 70, colour: (COLOURS[p.colour] || COLOURS.blue).hex, speed: 5, gravity: 0, life: 1, size: 0.18 });
            st.tween(o3, { k: 1 }, 0.6, {
              ease: X.ease.outElastic,
              onUpdate: function () {
                spin.scale.setScalar(o3.k);
              },
            });
          });
          kit.sound("morph");
        } else if (looks) applyLook(p);
        if (!prev || prev.rings !== p.rings || prev.ringColour !== p.ringColour) applyRings(p);
        if (!prev || prev.moons !== p.moons) {
          applyMoons(p);
          if (prev && p.moons > (prev.moons || 0) && !o.instant) kit.sound("orbit");
        }
        place(p, !o.instant && prev && prev.size !== p.size);
        if (prev && prev.gravity !== p.gravity && !o.instant) {
          // a pulse of "gravity" rings
          for (var i = 0; i < 3; i++) {
            (function (k) {
              var shell = glowShell(p.gravity < prev.gravity ? 0x49a7a9 : 0xf07c3a, 1.04, 2.2, 1.6);
              planet.add(shell);
              var o4 = { s: 1, a: 1.6 };
              st.wait(k * 0.18).then(function () {
                st.tween(o4, { s: 1.9, a: 0 }, 1.1, {
                  onUpdate: function () {
                    shell.scale.setScalar(o4.s);
                    shell.material.uniforms.k.value = o4.a;
                  },
                }).then(function () {
                  planet.remove(shell);
                  shell.geometry.dispose();
                  shell.material.dispose();
                });
              });
            })(i);
          }
        }
      }
      if (o.instant) {
        applyLook(p);
        applyRings(p);
        applyMoons(p);
        place(p, false);
      }
      if (!o.keepMarkers) clearMarkers();
      buildRuler(Math.min(10, Math.max(1.5, (measure(p).jump || 1) + 0.3)));
      bit.userData.setFace(o.undo ? "think" : "happy");
      frameOverview(o.instant ? 0 : 1.1);
    }

    // One jump on the main planet
    function jump(p, prev) {
      var g = p.gravity;
      var m = measure(p);
      var before = prev ? measure(prev).jump : null;
      jumping = true;
      idleSpin = false;
      resetTrail();
      clearMarkers();
      if (before != null && isFinite(before) && Math.abs(before - m.jump) > 0.05) marker(before, "before " + U.round(before, 1) + " m", "ghost");
      buildRuler(isFinite(m.jump) ? Math.min(12, m.jump) : 4);
      var hU = isFinite(m.jump) ? m.jump * M : 6;
      return frameJump(Math.min(hU, 7.5), 0.9).then(function () {
        bit.userData.setFace("grin");
        // crouch
        var c = { y: 1 };
        return st.tween(c, { y: 0.78 }, 0.22, {
          onUpdate: function () {
            rig.scale.set(1 + (1 - c.y) * 0.5, c.y, 1 + (1 - c.y) * 0.5);
          },
        }).then(function () {
          rig.scale.set(0.92, 1.12, 0.92);
          kit.sound("jump", { height: isFinite(m.jump) ? m.jump : 8 });
          CX.three.burst(st, new T.Vector3(0, R + 0.05, 0), { count: 40, colour: (COLOURS[p.colour] || COLOURS.grey).hex, speed: 2.2, gravity: 2, life: 0.9, size: 0.1, flat: true });
          var base = R;
          var t = 0;
          var hang = isFinite(m.hang) ? m.hang : 4.2;
          return new Promise(function (resolve) {
            var peakShown = false;
            st.onFrame(function (dt) {
              t += dt;
              var y;
              if (g > 0) y = M * (V0 * t - 0.5 * g * t * t);
              else y = M * V0 * t * (1 + t * 0.25);
              if (g > 0 && t >= hang) y = 0;
              bit.position.y = base + Math.max(0, y);
              var s = 1 + Math.max(0, 0.12 - t * 0.4);
              rig.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
              rig.rotation.z = Math.sin(t * 3) * 0.06;
              if (Math.floor(t * 40) % 2 === 0) pushTrail(new T.Vector3(0, bit.position.y + 0.32, 0));
              if (g > 0 && !peakShown && t >= V0 / g) {
                peakShown = true;
                marker(m.jump, "<b>" + U.round(m.jump, 1) + " m</b>", "now");
                kit.sound("ping", { pitch: 1.2 });
              }
              if (g <= 0) {
                camState.ly = Math.min(base + y * 0.6, base + 6);
                if (t > 1.2 && !peakShown) {
                  peakShown = true;
                  bit.userData.setFace("wow");
                  kit.sound("drift");
                }
                if (t >= 3.6) {
                  resolve({ floated: true });
                  return false;
                }
              } else if (t >= hang) {
                // land
                kit.sound("land");
                st.shake(0.05, 0.25);
                CX.three.burst(st, new T.Vector3(0, R + 0.05, 0), { count: 50, colour: (COLOURS[p.colour] || COLOURS.grey).hex, speed: 2.6, gravity: 3, life: 1, size: 0.11, flat: true });
                var q = { y: 0.75 };
                rig.scale.set(1.18, 0.75, 1.18);
                st.tween(q, { y: 1 }, 0.5, {
                  ease: X.ease.outElastic,
                  onUpdate: function () {
                    rig.scale.set(1 + (1 - q.y) * 0.7, q.y, 1 + (1 - q.y) * 0.7);
                  },
                });
                bit.userData.setFace("happy");
                resolve({ landed: true });
                return false;
              }
            });
          });
        });
      }).then(function (res) {
        jumping = false;
        if (res.floated) {
          // bring the astronaut back for the next try
          st.wait(1.2).then(function () {
            bit.position.y = R;
            bit.userData.setFace("sad");
            resetTrail();
          });
        }
        return { metrics: m, floated: !!res.floated };
      });
    }

    function run(p, resp, o) {
      if (p.look === "none") return Promise.resolve({});
      if (bench) set(p, { instant: true });
      return jump(p, o && o.prev);
    }

    function runTests(list) {
      clearBench();
      world.visible = false;
      var group = new T.Group();
      sc.add(group);
      var pins = [];
      var items = list.map(function (item, i) {
        var p = item.params;
        var tx = paint(p.look, p.colour);
        var g = new T.Group();
        g.position.x = (i - (list.length - 1) / 2) * 5.2;
        var r = 1.35;
        var ball = new T.Mesh(new T.SphereGeometry(r, 96, 64), new T.MeshStandardMaterial({ map: tx.map, roughness: 0.92 }));
        g.add(ball);
        var hl = glowShell(p.look === "earth" ? 0x6fb4ff : p.look === "moon" ? 0x9999aa : 0xffa070, r * 1.07, 2.6, p.look === "moon" ? 0.3 : 1);
        g.add(hl);
        var b = CX.three.bit({ colour: ["pink", "teal", "lime"][i % 3], face: "happy", shadow: false });
        b.scale.setScalar(0.4);
        b.position.y = r;
        g.add(b);
        var lab = document.createElement("span");
        lab.className = "pl-bench";
        lab.innerHTML = "<b>" + U.esc(item.label) + "</b>" + U.round(p.gravity, 1) + " m/s²";
        pins.push(st.pin(lab, g, new T.Vector3(0, -r - 0.55, 0)));
        group.add(g);
        return { g: g, b: b, r: r, p: p, m: measure(p), t: 0, done: false, peak: false };
      });
      bench = {
        group: group,
        pins: pins,
        tick: function (dt, time) {
          items.forEach(function (it, i) {
            it.g.children[0].rotation.y += dt * 0.15;
          });
        },
      };
      moveCam({ lx: 0, ly: 2.3, lz: 0, d: 17, h: 3.6 }, 1.1);
      return st.wait(1.3).then(function () {
        kit.sound("jump", { height: 3 });
        return new Promise(function (resolve) {
          var BM = 0.42; // smaller worlds, smaller scale
          st.onFrame(function (dt) {
            var all = true;
            items.forEach(function (it) {
              if (it.done) return;
              all = false;
              it.t += dt;
              var g = it.p.gravity;
              var y = BM * (V0 * it.t - 0.5 * g * it.t * it.t);
              if (!it.peak && it.t >= V0 / g) {
                it.peak = true;
                var lab = document.createElement("span");
                lab.className = "pl-peak pl-peak--now";
                lab.innerHTML = "<b>" + U.round(it.m.jump, 1) + " m</b>";
                var anchor = new T.Object3D();
                anchor.position.set(0, it.r + it.m.jump * BM + 0.75, 0);
                it.g.add(anchor);
                pins.push(st.pin(lab, anchor, new T.Vector3(0, 0.2, 0)));
                kit.sound("ping", { pitch: 0.9 + it.m.jump * 0.1 });
              }
              if (it.t >= it.m.hang) {
                it.done = true;
                y = 0;
                kit.sound("land", { vol: 0.6 });
                CX.three.burst(st, it.g.position.clone().add(new T.Vector3(0, it.r, 0)), { count: 30, colour: 0xdddddd, speed: 2, gravity: 3, life: 0.8, size: 0.1, flat: true });
              }
              it.b.position.y = it.r + Math.max(0, y);
            });
            if (all) {
              resolve({ tests: items.length });
              return false;
            }
          });
        });
      });
    }

    var anchors = {};
    function anchor(key) {
      if (key === "gravity") return bit;
      if (key === "rings" || key === "ringColour") return ring ? ring.userData.anchor : planet;
      if (key === "moons") return moons[0] ? moons[0].mesh : planet;
      if (key === "name") return bit;
      if (!anchors[key]) {
        var a = new T.Object3D();
        var spots = { size: [1.02, -0.1, 0.2], colour: [-0.55, 0.15, 0.85], look: [0.35, -0.45, 0.85], ringColour: [1.6, 0, 0.6] };
        var s = spots[key] || [0.3, 0.3, 0.9];
        a.position.set(s[0], s[1], s[2]);
        planet.add(a);
        anchors[key] = a;
      }
      return anchors[key];
    }

    function celebrate() {
      if (bench) {
        clearBench();
        frameOverview(1);
      }
      CX.three.confetti(st, new T.Vector3(0, R + 1, 0), { count: 140 });
      bit.userData.setFace("love");
      st.wait(1.4).then(function () {
        clearMarkers();
        frameOverview(1.6);
      });
      var o = { r: 0 };
      st.tween(o, { r: Math.PI * 2 }, 1, {
        ease: X.ease.out,
        onUpdate: function () {
          rig.rotation.y = o.r;
        },
      });
    }

    function snapshot() {
      // A beauty shot of the planet for the share card: overview, no rulers
      var keep = { lx: camState.lx, ly: camState.ly, lz: camState.lz, d: camState.d, h: camState.h };
      var rv = ruler.visible,
        mv = markers.visible;
      ruler.visible = markers.visible = false;
      markerPins.concat(rulerPins).forEach(function (p) {
        p.hide(true);
      });
      var ringy = cur && cur.rings ? 1.35 : 1;
      camState.lx = 0;
      camState.ly = R * 0.25;
      camState.lz = 0;
      camState.d = R * 3.3 * ringy + 2.4;
      camState.h = R * 0.7 + 0.6;
      cam.position.set(camState.d * 0.25, camState.h, camState.d * 0.97);
      cam.lookAt(0, camState.ly, 0);
      var url = st.snapshot("image/jpeg", 0.92);
      ruler.visible = rv;
      markers.visible = mv;
      markerPins.concat(rulerPins).forEach(function (p) {
        p.hide(false);
      });
      Object.assign(camState, keep);
      return url;
    }

    return {
      stage: st,
      set: set,
      run: run,
      runTests: runTests,
      anchor: anchor,
      celebrate: celebrate,
      snapshot: snapshot,
      dispose: function () {
        clearBench();
        st.dispose();
      },
    };
  }

  /* ---- Share card content ------------------------------------------------------------ */
  function product(p, prog) {
    var m = measure(p);
    return {
      kind: "Planet Passport",
      title: p.name || "My planet",
      facts: [
        { k: "Gravity", v: U.round(p.gravity, 2) + " m/s²" },
        { k: "Jump height", v: isFinite(m.jump) ? U.round(m.jump, 1) + " m" : "∞" },
        { k: "Time in the air", v: isFinite(m.hang) ? U.round(m.hang, 1) + " s" : "∞" },
        { k: "A 40 kg pupil feels like", v: U.round(m.feels, 1) + " kg" },
        { k: "Moons", v: String(p.moons || 0) },
        { k: "Rings", v: p.rings ? "yes" : "no" },
      ],
      science: "Jump height = 3.1 × 3.1 ÷ (2 × gravity). Less gravity, higher jump: gravity × jump height ≈ 4.8 on every planet.",
    };
  }

  var def = {
    id: "planet",
    n: 1,
    title: "Planet Builder",
    short: "Planet",
    colour: "blue",
    interest: { id: "space", label: "Space", icon: "rocket" },
    tagline: "Build a planet, set its gravity and test how high your astronaut can jump.",
    subjects: [
      { k: "Science", t: "Gravity and forces", icon: "flask" },
      { k: "Maths", t: "Halving, doubling, measuring", icon: "graph" },
    ],
    product: product,
    productName: "Planet Passport",
    lexicon: { details: /\b(rocky|icy|gas|giant|rings?|moons?|craters?|oceans?|mars|earth|moon|jupiter|saturn|venus|neptune|pluto|mercury)\b/ },
    start: { look: "none", colour: "blue", size: "medium", gravity: null, rings: false, ringColour: "pink", moons: 0, name: "" },
    params: {
      look: { label: "Surface", fmt: function (v) {
        return LOOKS[v] || v;
      } },
      colour: { label: "Colour", fmt: function (v) {
        return (COLOURS[v] || { label: v }).label;
      } },
      size: { label: "Size", fmt: function (v) {
        return (SIZES[v] || { label: v }).label;
      } },
      gravity: { label: "Gravity", unit: "m/s²", dp: 2 },
      rings: { label: "Rings", fmt: function (v) {
        return v ? "yes" : "none";
      } },
      ringColour: { label: "Ring colour", fmt: function (v) {
        return (COLOURS[v] || { label: v }).label;
      } },
      moons: { label: "Moons", fmt: function (v) {
        return v ? String(v) : "none";
      } },
      name: { label: "Name", fmt: function (v) {
        return v || "not named";
      } },
    },
    causes: ["gravity", "size", "moons"],
    metrics: [
      { key: "jump", label: "Jump height", icon: "jump" },
      { key: "hang", label: "Time in the air", icon: "clock" },
      { key: "feels", label: "A 40 kg pupil feels like", icon: "user" },
    ],
    metricSpec: {
      jump: { unit: "m", dp: 1 },
      hang: { unit: "s", dp: 1 },
      feels: { unit: "kg", dp: 1 },
    },
    tableMetrics: ["jump", "hang", "feels"],
    measure: measure,
    interpret: interpret,
    predict: predict,
    effect: effect,
    why: why,
    sessions: sessions,
    scene: scene,
  };

  CX.builds.register(def);
})();
