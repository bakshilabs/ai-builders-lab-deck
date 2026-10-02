/* ==========================================================================
   Build 4 · Power Town (interest: the planet)
   Science / geography: energy sources, day and night, storage.
   Maths: percentages, reading and drawing a 24-hour line graph.
   A simple hour-by-hour model: demand, sunshine and wind are fixed for the
   day, so every plan can be compared fairly. Figures are illustrative.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var P = CX.prompt;

  var DEMAND = [32, 30, 29, 29, 30, 34, 42, 52, 56, 50, 46, 45, 46, 45, 44, 47, 55, 64, 70, 68, 60, 50, 42, 36]; // MW, each hour
  var WIND = [0.66, 0.7, 0.72, 0.7, 0.68, 0.66, 0.62, 0.56, 0.5, 0.46, 0.44, 0.46, 0.5, 0.52, 0.5, 0.46, 0.4, 0.3, 0.14, 0.1, 0.14, 0.5, 0.62, 0.64];
  var TOTAL = DEMAND.reduce(function (a, b) {
    return a + b;
  }, 0);
  var AVG = TOTAL / 24;
  var OVER = 1.5; // renewables are built bigger than average demand, as real grids are
  var BATTERY = { none: 0, small: 30, medium: 80, large: 160 }; // MWh
  var CO2_PER_MWH = 0.4; // tonnes

  function sun(h) {
    return h >= 6 && h <= 19 ? Math.max(0, Math.sin((Math.PI * (h - 6)) / 13)) : 0;
  }
  var SUN_AVG =
    DEMAND.map(function (_, h) {
      return sun(h);
    }).reduce(function (a, b) {
      return a + b;
    }, 0) / 24;
  var WIND_AVG =
    WIND.reduce(function (a, b) {
      return a + b;
    }, 0) / 24;

  function simulate(p) {
    if (!p || p.gas === "unset") return null;
    var sCap = ((p.solar || 0) / 100) * OVER * AVG / SUN_AVG;
    var wCap = (((p.wind || 0) + (p.farm ? 30 : 0)) / 100) * OVER * AVG / WIND_AVG;
    var B = BATTERY[p.battery || "none"];
    var charge = B * 0.5;
    var rate = 50;
    var budget = p.gas === "backup" ? ((p.gasMax == null ? 100 : p.gasMax) / 100) * TOTAL : p.gas === "all" ? 1e9 : 0;
    var hours = [],
      gas = 0,
      unmet = 0,
      black = [];
    for (var h = 0; h < 24; h++) {
      var d = DEMAND[h];
      var row = { h: h, d: d, s: 0, w: 0, b: 0, g: 0, u: 0, charge: charge };
      if (p.gas === "all" || (p.gas === "night" && (h >= 18 || h < 6))) {
        row.g = d;
        gas += d;
      } else {
        row.s = sCap * sun(h);
        row.w = wCap * WIND[h];
        var sup = row.s + row.w;
        if (sup >= d) {
          var c = Math.min(rate, (sup - d) * 0.95, B - charge);
          charge += c;
          row.b = -c;
          // only count what the town uses
          var scale = d / sup;
          row.s *= scale;
          row.w *= scale;
        } else {
          var def = d - sup;
          var out = Math.min(rate, charge, def);
          charge -= out;
          row.b = out;
          def -= out;
          var g = Math.min(def, budget);
          budget -= g;
          gas += g;
          row.g = g;
          def -= g;
          if (def > 0.5) {
            row.u = def;
            unmet += def;
            black.push(h);
          }
        }
      }
      row.charge = charge;
      hours.push(row);
    }
    return {
      hours: hours,
      blackouts: black.length,
      blackHours: black,
      gasPct: (gas / TOTAL) * 100,
      co2: gas * CO2_PER_MWH,
      clean: ((TOTAL - gas - unmet) / TOTAL) * 100,
      caps: { solar: sCap, wind: wCap, battery: B },
    };
  }

  function measure(p) {
    var r = simulate(p);
    if (!r) return { blackouts: null, co2: null, clean: null, gasPct: null };
    return { blackouts: r.blackouts, co2: r.co2, clean: r.clean, gasPct: r.gasPct };
  }

  function hhmm(h) {
    return (h < 10 ? "0" : "") + h + ":00";
  }
  function spans(hours) {
    // [18,19,20,21] → "18:00–22:00"
    if (!hours.length) return "none";
    var out = [],
      start = hours[0],
      prev = hours[0];
    for (var i = 1; i <= hours.length; i++) {
      if (hours[i] === prev + 1) {
        prev = hours[i];
        continue;
      }
      out.push(hhmm(start) + "–" + hhmm((prev + 1) % 24));
      start = prev = hours[i];
    }
    return out.join(", ");
  }

  // The AI's "best mix" for a set of limits: least gas with no blackouts
  function plan(base, gasMax, battery) {
    var best = null;
    for (var s = 30; s <= 70; s += 5) {
      var p = Object.assign({}, base, { solar: s, wind: 100 - s, battery: battery, gas: "backup", gasMax: gasMax });
      var r = simulate(p);
      if (r.blackouts === 0 && (!best || r.gasPct < best.r.gasPct - 0.05)) best = { p: p, r: r };
    }
    return best;
  }

  /* ---- Offline AI ------------------------------------------------------------------ */
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

    var sizes = [];
    ["small", "medium", "large"].forEach(function (s) {
      if (new RegExp("\\b" + s + "\\b").test(t)) sizes.push(s);
    });
    if (/\b(test|compare)\b/.test(t) && sizes.length >= 2 && /\bbatter/.test(t)) {
      und = [
        { t: "test a " + sizes.join(", ").replace(/, ([^,]*)$/, " and $1") + " battery", src: "you" },
        { t: "same town, same weather, same solar and wind (fair test)", src: "calc" },
      ];
      if (/\btable\b/.test(t)) und.push({ t: "a results table", src: "you" });
      if (/\b(explain|best|why)\b/.test(t)) und.push({ t: "explain which is best", src: "you" });
      return {
        kind: "tests",
        say: "I'll run the same day three times. Only the battery changes: " + sizes.join(", ").replace(/, ([^,]*)$/, " and then ") + ".",
        understood: und,
        set: {},
        src: {},
        tests: sizes.map(function (s) {
          return { label: s.charAt(0).toUpperCase() + s.slice(1), set: { battery: s } };
        }),
      };
    }

    var creating = p.gas === "unset";
    var solarPct = P.numBefore(t, /%\s*(?:of\s+(?:the\s+)?(?:power\s+)?(?:from\s+)?)?solar/) || P.numAfter(t, /solar\s*(?:power\s*)?(?:at\s*|=\s*)?/);
    var windPct = P.numBefore(t, /%\s*(?:of\s+(?:the\s+)?(?:power\s+)?(?:from\s+)?)?wind/) || P.numAfter(t, /\bwind\s*(?:power\s*)?(?:at\s*|=\s*)?/);
    var gasCap = P.numAfter(t, /gas\s*(?:power\s*)?(?:under|below|less than|at most|to|no more than|max(?:imum)?)\s*/) || P.numBefore(t, /%\s*gas/);
    var noGas = /\bno gas\b|\bwithout gas\b/.test(t);
    var lightsOn = /\b(keep|stay)\b[^.]{0,25}\blights? on\b|\blights? on all\b|\bno blackouts?\b/.test(t);
    var useBoth = /\bsolar\b/.test(t) && /\bwind\b/.test(t);
    var battWord = /\bbatter(y|ies)\b/.test(t);

    if (/\b(?:call|name)\s+(?:my town|the town|it)\s*([a-z][a-z-]{1,18})/.test(t)) {
      var nm = /\b(?:call|name)\s+(?:my town|the town|it)\s*([a-z][a-z-]{1,18})/.exec(t)[1];
      add("name", nm.charAt(0).toUpperCase() + nm.slice(1), "name: " + nm.charAt(0).toUpperCase() + nm.slice(1), "you");
    }
    if (/\bwind farm\b/.test(t)) add("farm", true, "a wind farm" + (/\bhill\b/.test(t) ? " on the hill" : ""), "you");

    if (solarPct != null || windPct != null) {
      var sp = solarPct != null ? solarPct : windPct != null ? 100 - windPct : 0;
      var wp = windPct != null ? windPct : 100 - sp;
      add("solar", sp, sp + "% solar", "you");
      add("wind", wp, wp + "% wind", "you");
      if (p.gas !== "none" && !gasCap) add("gas", "none", "no gas", solarPct + wp === 100 ? "calc" : "guess");
    }

    if (gasCap != null) {
      if (useBoth && solarPct == null && windPct == null) {
        // The child set the goal and limits; the AI works out the best mix
        var battery = sizes[0] || (battWord ? "medium" : p.battery !== "none" ? p.battery : "none");
        var best = plan(Object.assign({}, p, set), gasCap, battery);
        und.push({ t: "solar and wind", src: "you" });
        if (lightsOn) und.push({ t: "keep the lights on day and night", src: "you" });
        add("gasMax", gasCap, "gas only as backup, under " + gasCap + "%", "you");
        set.gas = "backup";
        src.gas = "you";
        if (battWord) add("battery", battery, battery + " battery" + (sizes[0] ? "" : " (you didn't say the size)"), sizes[0] ? "you" : "guess");
        if (best) {
          add("solar", best.p.solar, best.p.solar + "% solar (least gas I could find)", "calc");
          add("wind", best.p.wind, best.p.wind + "% wind", "calc");
        }
        return { kind: "change", say: "I tried every mix of solar and wind and picked the one that keeps the lights on with the least gas.", understood: und, set: set, src: src };
      }
      add("gasMax", gasCap, "gas under " + gasCap + "%", "you");
      set.gas = "backup";
      src.gas = "you";
      if (lightsOn) und.push({ t: "keep the lights on all night", src: "you" });
    } else if (noGas) {
      add("gas", "none", "no gas", "you");
    }

    if (battWord && !("battery" in set)) {
      if (sizes[0]) add("battery", sizes[0], sizes[0] + " battery", "you");
      else add("battery", "medium", "a battery: medium size", "guess");
    }

    if (/\b(more|less)\s+(wind|solar)\b/.test(t) && solarPct == null && windPct == null) {
      return { kind: "clarify", say: "How much more? Give me a percentage for solar and one for wind, or I'll have to guess.", options: ["with 50% solar and 50% wind", "with 40% solar and 60% wind"] };
    }
    if (/\bclean\b/.test(t) && solarPct == null && windPct == null && !useBoth) {
      und.unshift({ t: "“clean energy”", src: "you" });
      add("solar", 100, "clean = solar panels: 100% solar", "guess");
      add("wind", 0, "no wind", "guess");
      add("gas", "none", "no gas", "you");
      return { kind: "change", say: "Clean energy coming up! Solar panels make power without smoke, so I've powered the whole town with them.", understood: und, set: set, src: src, mistake: "clean-means-solar" };
    }

    if (lightsOn && gasCap == null && solarPct == null && windPct == null && !battWord) {
      und.push({ t: "keep the lights on all night", src: "you" });
      add("gas", "night", "run the gas plant every night", "guess");
      return { kind: "change", say: "Easy: the gas power station can run all night, every night. The lights will never go out.", understood: und, set: set, src: src, mistake: "gas-at-night" };
    }

    if (/\b(graph|24-hour|chart)\b/.test(t)) und.push({ t: "show the 24-hour graph", src: "you" });

    if (creating && !("solar" in set) && !("gas" in set)) {
      und.unshift({ t: "power the town", src: "you" });
      add("gas", "all", "a gas power station", "guess");
      und.push({ t: "enough power for every hour", src: "guess" });
      und.push({ t: "no battery", src: "guess" });
      und.push({ t: "no limit on pollution", src: "guess" });
      return { kind: "change", say: "Your town has power! You didn't say how, so I used a gas power station: it's the most common way I've seen.", understood: und, set: set, src: src };
    }

    if (!und.length) return { kind: "clarify", say: "How should I power the town? Tell me about solar, wind, a battery or gas, and how much of each.", options: ["with 50% solar and 50% wind", "with a battery", "with clean energy"] };
    var guesses = und.filter(function (u) {
      return u.src === "guess";
    }).length;
    return { kind: "change", say: set.name ? set.name + " is ready. I changed only what you asked for." : guesses ? "Done. I had to guess " + guesses + (guesses === 1 ? " thing." : " things.") : "Done, exactly as you said.", understood: und, set: set, src: src };
  }

  function predict(r, c) {
    if (r.kind === "tests") {
      return {
        q: "Which battery will need the least gas?",
        options: r.tests.map(function (x) {
          return { t: x.label, ok: x.set.battery === "large" };
        }),
        right: "Right: a bigger battery saves more of the midday sun for the evening.",
        wrong: "Look at the table: the biggest battery needs the least gas.",
      };
    }
    var next = Object.assign({}, c.params, r.set);
    var m = measure(next);
    if (m.blackouts == null) return null;
    if (c.params.gas === "unset") return { q: "Will the lights stay on all night?", options: [{ t: "Yes", ok: m.blackouts === 0 }, { t: "No", ok: m.blackouts > 0 }], right: "Your prediction was right.", wrong: "Watch the clock run through the night." };
    if (r.mistake === "clean-means-solar") return { q: "The town runs only on solar panels. What happens at night?", options: [{ t: "The lights stay on", ok: false }, { t: "The town goes dark", ok: true }], right: "Right: no sun, no solar power.", wrong: "No sun, no solar power: the town goes dark." };
    if (r.mistake === "gas-at-night") return { q: "Gas every night. What happens to the CO₂?", options: [{ t: "It goes down", ok: false }, { t: "It goes up a lot", ok: true }, { t: "It stays the same", ok: false }], right: "Right: burning gas makes CO₂.", wrong: "Burning gas every night makes a lot of CO₂." };
    if (c.session === 3) return { q: "Half solar, half wind. Will there be any blackouts?", options: [{ t: "No, none at all", ok: m.blackouts === 0 }, { t: "Yes, a few hours", ok: m.blackouts > 0 && m.blackouts <= 6 }, { t: "Yes, all night", ok: m.blackouts > 6 }], right: "Your prediction was right.", wrong: "Watch the evening, when the wind drops." };
    return { q: "Will there be any blackouts?", options: [{ t: "No, the lights stay on", ok: m.blackouts === 0 }, { t: "Yes, some", ok: m.blackouts > 0 }], right: "Your prediction was right.", wrong: "The test shows what really happens." };
  }

  function effect(result, trial, resp, c) {
    var S = c.session;
    var concept = {
      1: "A gas power station can run all day and night, but burning gas makes carbon dioxide (CO₂), which warms the planet. You didn't set a limit on pollution, so the AI didn't either.",
      2: "Solar panels make power without smoke, but only when the sun is up. “Clean” was a good detail. The AI just read it as “solar only”.",
      3: "Percentages of the town's power have to add up to 100%. Wind helps at night, but on this day the wind drops in the evening, just when people get home.",
      4: "A battery stores spare midday sunshine for the evening. With gas only as a small backup, the lights stay on and the CO₂ stays low.",
      5: "A bigger battery stores more of the midday sun, so less gas is needed in the evening. Bigger also means more to build: that's a trade-off you decide.",
      6: "Your plan keeps every light on with very little gas. The graph shows where each hour's power comes from.",
    }[S];
    if (resp.kind === "tests") return { headline: "Bigger battery <b>→</b> less gas, less CO₂", concept: concept, conceptTitle: "The science" };
    var a = result.prev,
      b = result.next;
    var rows = [];
    rows.push({ label: "Blackout hours", from: a.blackouts == null ? "no power yet" : String(a.blackouts), to: String(b.blackouts) });
    rows.push({ label: "CO₂ per day", from: a.co2 == null ? "—" : Math.round(a.co2) + " t", to: Math.round(b.co2) + " t" });
    rows.push({ label: "Clean energy", from: a.clean == null ? "—" : Math.round(a.clean) + "%", to: Math.round(b.clean) + "%" });
    var r = simulate(trial);
    var head;
    if (b.blackouts > 0) head = "Blackout " + spans(r.blackHours);
    else if (trial.gas === "all") head = "Gas power <b>→</b> " + Math.round(b.co2) + " t of CO₂ a day";
    else if (trial.gas === "night") head = "Gas every night <b>→</b> CO₂ " + (a.co2 != null && a.co2 > 0 ? "×" + U.round(b.co2 / Math.max(1, a.co2), 0) : "up to " + Math.round(b.co2) + " t");
    else head = "Lights on all day <b>→</b> " + Math.round(b.clean) + "% clean";
    return { headline: head, rows: rows, concept: concept, conceptTitle: S === 3 ? "The maths" : "The science" };
  }

  function why(resp, result, c) {
    if (resp.kind === "tests") {
      return result.rows
        .map(function (r) {
          return r.label + " battery: " + U.round(r.metrics.gasPct, 1) + "% gas, " + Math.round(r.metrics.co2) + " t CO₂";
        })
        .join(". ") + ". The battery charges at midday when the sun makes more than the town needs, then powers the evening peak. The bigger it is, the less the gas plant has to run.";
    }
    var p = Object.assign({}, c.params, resp.set);
    var r = simulate(p);
    if (!r) return "";
    if (r.blackouts) return "The town needs 70 MW at 18:00, when people get home. The sun sets at 19:00 and the wind is weakest from 18:00 to 21:00, so the power couldn't keep up for " + r.blackouts + " hours.";
    return "Over the whole day the town uses " + TOTAL + " MWh. Gas made " + U.round(r.gasPct, 1) + "% of that, and every MWh of gas makes 0.4 t of CO₂, so that's " + Math.round(r.co2) + " t.";
  }

  var sessions = [
    {
      goal: "Power your town for a whole day. Keep the prompt short, then look at what the AI guessed.",
      concept: "Where power comes from",
      intro: "Your town has no power yet. Ask the AI to power it.",
      reset: {},
      suggestions: ["Power my town"],
      check: function (r, p, resp) {
        return { pass: p.gas !== "unset", note: "The lights are on, but " + Math.round(r.next.co2) + " t of CO₂ a day. The AI guessed " + (resp.guesses || 0) + " things, including no limit on pollution." };
      },
    },
    {
      goal: "Power your town without pollution. Add a detail: what kind of energy?",
      concept: "Clean energy",
      suggestions: ["Power my town with clean energy"],
      demoStart: { gas: "all" },
      check: function (r, p) {
        if (p.gas === "none") return { pass: true, note: "No CO₂ at all! But the town was dark for " + r.next.blackouts + " hours: the AI read “clean” as “solar only”. Next session you'll use numbers." };
        return { pass: false, coach: "Add a detail about the kind of energy you want." };
      },
    },
    {
      goal: "Mix solar and wind. Use numbers: what percentage of each?",
      concept: "Percentages that add up to 100",
      suggestions: ["Use more wind", "Use 50% solar and 50% wind"],
      demoStart: { solar: 100, wind: 0, gas: "none" },
      check: function (r, p) {
        if (p.solar + p.wind === 100 && r.next.blackouts < 14) return { pass: true, note: r.next.blackouts + " blackout hours, down from 14. The calm evening (" + spans(simulate(p).blackHours) + ") is what's left to solve." };
        return { pass: false, coach: "Give a percentage for solar and one for wind. They should add up to 100%." };
      },
    },
    {
      goal: "Keep the lights on all day and night, but keep gas under 20% of the town's power.",
      concept: "Goals and limits",
      suggestions: ["Keep the lights on all night", "Keep the lights on all day and night: use solar and wind, add a battery and keep gas under 20%"],
      after: ["Keep the lights on all day and night: use solar and wind, add a battery and keep gas under 20%"],
      demoStart: { solar: 50, wind: 50, gas: "none" },
      check: function (r, p, resp) {
        if (resp.mistake === "gas-at-night") return { pass: false, note: "The lights stayed on, but " + U.round(r.next.gasPct, 0) + "% of the power came from gas. The AI did what you said, not what you meant.", coach: "Add limits: use solar and wind, add a battery, and keep gas under 20%." };
        if (r.next.blackouts === 0 && r.next.gasPct <= 20) return { pass: true, note: "No blackouts and only " + U.round(r.next.gasPct, 1) + "% gas. That's " + Math.round(r.next.co2) + " t of CO₂, down from 441 t with gas alone." };
        return { pass: false, coach: "Say both: keep the lights on, and keep gas under 20%." };
      },
    },
    {
      goal: "Ask the AI to test three battery sizes, show you a table and explain which is best.",
      concept: "Trade-offs",
      suggestions: ["Test a small, medium and large battery, show me a table and explain which is best"],
      demoStart: { solar: 45, wind: 55, battery: "medium", gas: "backup", gasMax: 20 },
      check: function (r, p, resp) {
        if (resp.kind === "tests") return { pass: true, note: "All three keep the lights on. The difference is how much gas they need. Which would you build, and why?" };
        return { pass: false, coach: "Ask for a fair test of three battery sizes." };
      },
    },
    {
      goal: "Finish your town's energy plan for the town council. Use all six ingredients, then share it.",
      concept: "Your plan, explained",
      suggestions: ["Call my town Brightwater. Add a wind farm on the hill, keep the lights on all night with gas under 10%, and show the 24-hour graph so the town council can see it"],
      demoStart: { solar: 45, wind: 55, battery: "medium", gas: "backup", gasMax: 20 },
      check: function (r, p, resp) {
        if (p.name && r.next.blackouts === 0 && resp.analysis.count >= 5) return { pass: true, note: "A " + resp.analysis.count + "-ingredient prompt. Compare it with “Power my town”." };
        return { pass: false, coach: "Name your town, keep the lights on with a gas limit, ask for the graph, and use at least five ingredients." };
      },
    },
  ];

  /* ---- 3D --------------------------------------------------------------------------- */
  function scene(host, kit) {
    var T = THREE,
      X = CX.three;
    var st = X.stage(host, { background: 0x0b0b3a, fov: 36, bloom: { strength: 0.85, radius: 0.55, threshold: 0.95 }, exposure: 0.95, envIntensity: 0.5 });
    var sc = st.scene,
      cam = st.camera;

    var sky = new T.Mesh(
      new T.SphereGeometry(140, 32, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms: { top: { value: new T.Color(0x3d7fd8) }, bot: { value: new T.Color(0xffc9a0) } },
        vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 top; uniform vec3 bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(-0.05, 0.55, h)), 1.0); }",
      })
    );
    sc.add(sky);
    var stars = X.stars({ count: 1400, radius: 120, size: 0.8 });
    sc.add(stars);
    var hemi = new T.HemisphereLight(0xbfd8ff, 0x2a3a20, 0.7);
    sc.add(hemi);
    var sunL = new T.DirectionalLight(0xfff1d6, 2.2);
    sc.add(sunL);
    var sunGlow = X.glow(0xffe0a0, 12, 0.9);
    sc.add(sunGlow);
    var moon = new T.Mesh(new T.SphereGeometry(1.4, 24, 16), new T.MeshBasicMaterial({ color: 0xf2f0ff }));
    sc.add(moon);

    // Sea and island
    var sea = new T.Mesh(new T.CircleGeometry(120, 64), new T.MeshStandardMaterial({ color: 0x1b4f8a, roughness: 0.25, metalness: 0.35 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.6;
    sc.add(sea);
    var island = new T.Group();
    sc.add(island);
    var rock = new T.Mesh(new T.CylinderGeometry(10.5, 8.5, 2.4, 48), new T.MeshStandardMaterial({ color: 0x6a5a48, roughness: 0.95 }));
    rock.position.y = -0.9;
    island.add(rock);
    var beach = new T.Mesh(new T.CylinderGeometry(10.8, 10.6, 0.3, 48), new T.MeshStandardMaterial({ color: 0xe7d39c, roughness: 1 }));
    beach.position.y = 0.2;
    island.add(beach);
    var grass = new T.Mesh(new T.CylinderGeometry(10, 10.2, 0.4, 48), new T.MeshStandardMaterial({ color: 0x4f9a52, roughness: 0.95 }));
    grass.position.y = 0.4;
    island.add(grass);
    var hill = new T.Mesh(new T.SphereGeometry(4.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x3f8746, roughness: 0.95 }));
    hill.scale.y = 0.55;
    hill.position.set(4.6, 0.55, -4.6);
    island.add(hill);
    var G0 = 0.6; // ground height

    // Town: houses with windows that light up
    var town = new T.Group();
    island.add(town);
    var windowMat = new T.MeshStandardMaterial({ color: 0x221a10, emissive: 0xffc56b, emissiveIntensity: 0 });
    var houseCols = [0xf6f3ee, 0xefabcd, 0x7fd6d8, 0xf6f3ee, 0xdbe751, 0xf6a26b];
    var rr = U.rng(9);
    var spots = [];
    for (var i = 0; i < 16; i++) {
      var ang = i * 2.399,
        rad = 1.2 + Math.sqrt(i) * 1.15;
      spots.push([-3.6 + Math.cos(ang) * rad, 1.6 + Math.sin(ang) * rad * 0.8]);
    }
    spots.forEach(function (sp, i) {
      var h = new T.Group();
      var w = 0.9 + rr() * 0.5,
        hh = 0.8 + rr() * 0.9;
      var body = new T.Mesh(new T.BoxGeometry(w, hh, w * 0.9), new T.MeshStandardMaterial({ color: houseCols[i % houseCols.length], roughness: 0.8 }));
      body.position.y = hh / 2;
      h.add(body);
      var roof = new T.Mesh(new T.ConeGeometry(w * 0.82, 0.6, 4), new T.MeshStandardMaterial({ color: 0x31247a, roughness: 0.7 }));
      roof.position.y = hh + 0.3;
      roof.rotation.y = Math.PI / 4;
      h.add(roof);
      for (var k = 0; k < 2; k++) {
        var win = new T.Mesh(new T.PlaneGeometry(0.22, 0.26), windowMat);
        win.position.set(-w * 0.22 + k * w * 0.44, hh * 0.55, (w * 0.9) / 2 + 0.01);
        h.add(win);
      }
      h.position.set(sp[0], G0, sp[1]);
      h.rotation.y = rr() * 0.6 - 0.3;
      town.add(h);
    });
    var townGlow = X.glow(0xffc56b, 9, 0);
    townGlow.position.set(-3.6, 1.6, 1.6);
    island.add(townGlow);
    var alarmRing = new T.Mesh(new T.RingGeometry(4.6, 5, 64), new T.MeshBasicMaterial({ color: 0xe5484d, transparent: true, opacity: 0, toneMapped: false, side: T.DoubleSide }));
    alarmRing.rotation.x = -Math.PI / 2;
    alarmRing.position.set(-3.6, G0 + 0.05, 1.6);
    island.add(alarmRing);

    // Solar farm
    var solar = new T.Group();
    island.add(solar);
    var panelMat = new T.MeshStandardMaterial({ color: 0x1b2f6b, roughness: 0.22, metalness: 0.7, emissive: 0x0a1640, emissiveIntensity: 0.2 });
    var panels = [];
    for (var pi = 0; pi < 24; pi++) {
      var pan = new T.Group();
      var plate = new T.Mesh(new T.BoxGeometry(0.9, 0.05, 0.6), panelMat);
      plate.rotation.x = -0.55;
      plate.position.y = 0.45;
      pan.add(plate);
      var leg = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.45, 6), new T.MeshStandardMaterial({ color: 0x888899 }));
      leg.position.y = 0.22;
      pan.add(leg);
      pan.position.set(2.2 + (pi % 6) * 1.05, G0, 2.2 + Math.floor(pi / 6) * 0.95);
      pan.visible = false;
      solar.add(pan);
      panels.push(pan);
    }

    // Wind turbines
    var turbines = [];
    var tSpots = [
      [7.6, 0.6],
      [8.2, -2.2],
      [6.6, 3.4],
      [-7.9, -2.5],
      [-6.8, -5.1],
      [-8.6, 0.6],
      [3.4, -4.2],
      [5.6, -5.6],
      [4.6, -3.0],
    ];
    tSpots.forEach(function (sp, i) {
      var tb = new T.Group();
      var tower = new T.Mesh(new T.CylinderGeometry(0.08, 0.14, 4.2, 10), new T.MeshStandardMaterial({ color: 0xf2f2f6, roughness: 0.5 }));
      tower.position.y = 2.1;
      tb.add(tower);
      var hub = new T.Group();
      hub.position.set(0, 4.2, 0.18);
      tb.add(hub);
      var nac = new T.Mesh(new T.BoxGeometry(0.26, 0.26, 0.6), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      nac.position.z = -0.2;
      hub.add(nac);
      var rotor = new T.Group();
      hub.add(rotor);
      for (var bb = 0; bb < 3; bb++) {
        var blade = new T.Mesh(new T.BoxGeometry(0.1, 1.9, 0.03), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
        blade.position.y = 0.95;
        var arm = new T.Group();
        arm.rotation.z = (bb * Math.PI * 2) / 3;
        arm.add(blade);
        rotor.add(arm);
      }
      var onHill = i >= 6;
      tb.position.set(sp[0], onHill ? 1.6 : G0, sp[1]);
      tb.rotation.y = 0.3;
      tb.visible = false;
      tb.userData.rotor = rotor;
      tb.userData.hill = onHill;
      island.add(tb);
      turbines.push(tb);
    });

    // Battery building with a charge bar
    var battery = new T.Group();
    battery.position.set(-0.6, G0, -3.2);
    island.add(battery);
    var bBox = new T.Mesh(new T.RoundedBoxGeometry(1.6, 1.4, 1.1, 3, 0.1), new T.MeshStandardMaterial({ color: 0x2a2f45, roughness: 0.5, metalness: 0.4 }));
    bBox.position.y = 0.7;
    battery.add(bBox);
    var bBarBg = new T.Mesh(new T.BoxGeometry(0.34, 1.1, 0.05), new T.MeshBasicMaterial({ color: 0x111122 }));
    bBarBg.position.set(0, 0.7, 0.57);
    battery.add(bBarBg);
    var bBar = new T.Mesh(new T.BoxGeometry(0.28, 1, 0.06), new T.MeshBasicMaterial({ color: 0xdbe751, toneMapped: false }));
    bBar.position.set(0, 0.2, 0.58);
    battery.add(bBar);
    battery.visible = false;

    // Gas plant with smoke
    var gasPlant = new T.Group();
    gasPlant.position.set(-6.4, G0, -1.4);
    island.add(gasPlant);
    var gBox = new T.Mesh(new T.BoxGeometry(2.2, 1.3, 1.6), new T.MeshStandardMaterial({ color: 0x8a7f7a, roughness: 0.8 }));
    gBox.position.y = 0.65;
    gasPlant.add(gBox);
    [-0.5, 0.5].forEach(function (x) {
      var ch = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 2.6, 12), new T.MeshStandardMaterial({ color: 0x9a8f8a, roughness: 0.8 }));
      ch.position.set(x, 1.6, -0.3);
      gasPlant.add(ch);
    });
    var smokeN = 180;
    var smokePos = new Float32Array(smokeN * 3);
    var smokeLife = new Float32Array(smokeN);
    for (var sI = 0; sI < smokeN; sI++) smokePos[sI * 3 + 1] = -999;
    var smokeGeo = new T.BufferGeometry();
    smokeGeo.setAttribute("position", new T.BufferAttribute(smokePos, 3));
    var smoke = new T.Points(smokeGeo, new T.PointsMaterial({ size: 1.4, map: X.dot(), color: 0x8a8890, transparent: true, opacity: 0.55, depthWrite: false }));
    island.add(smoke);
    var co2Cloud = X.glow(0x6d6870, 14, 0);
    co2Cloud.material.blending = T.NormalBlending;
    co2Cloud.position.set(-3, 9, -2);
    island.add(co2Cloud);

    // Labels
    function tag(text, obj, off, cls) {
      var el = document.createElement("span");
      el.className = "pt-tag " + (cls || "");
      el.innerHTML = text;
      return st.pin(el, obj, off || new T.Vector3(0, 2.6, 0));
    }
    var townTag = tag("<b>Town</b> 16 homes", town, new T.Vector3(-3.6, 3.4, 1.6));
    var solarTag = tag("<b>Solar</b>", solar, new T.Vector3(4.8, 1.8, 3.6));
    var windTag = tag("<b>Wind</b>", turbines[0], new T.Vector3(0, 5.6, 0));
    var batTag = tag("<b>Battery</b>", battery, new T.Vector3(0, 2.0, 0));
    var gasTag = tag("<b>Gas</b>", gasPlant, new T.Vector3(0, 3.4, 0));
    var nameTag = tag("", island, new T.Vector3(0, 7.4, 0), "pt-tag--name");
    nameTag.hide(true);

    // Clock and graph overlay (HTML, inside the stage)
    var overlay = document.createElement("div");
    overlay.className = "pt-overlay";
    overlay.innerHTML = '<div class="pt-clock"><span class="pt-clock__t">17:00</span><span class="pt-clock__s"></span></div><div class="pt-graph"><p class="pt-graph__k">24-hour graph · MW</p><svg viewBox="0 0 360 150" class="pt-svg"></svg><p class="pt-graph__legend"><i class="c-d"></i>Demand <i class="c-s"></i>Solar <i class="c-w"></i>Wind <i class="c-b"></i>Battery <i class="c-g"></i>Gas</p></div>';
    host.appendChild(overlay);
    var clockT = overlay.querySelector(".pt-clock__t"),
      clockS = overlay.querySelector(".pt-clock__s"),
      svg = overlay.querySelector(".pt-svg");

    function graph(r, upto, extra) {
      var W = 360,
        H = 150,
        pl = 26,
        pb = 18,
        pt = 6;
      var maxY = 80;
      var x = function (h) {
        return pl + (h / 24) * (W - pl - 6);
      };
      var y = function (v) {
        return pt + (1 - v / maxY) * (H - pb - pt);
      };
      var out = "";
      [0, 20, 40, 60, 80].forEach(function (v) {
        out += '<line x1="' + pl + '" x2="' + (W - 6) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="g-grid"/><text x="' + (pl - 5) + '" y="' + (y(v) + 3) + '" class="g-ax">' + v + "</text>";
      });
      [0, 6, 12, 18, 24].forEach(function (h) {
        out += '<text x="' + x(h) + '" y="' + (H - 4) + '" class="g-ax g-ax--x">' + hhmm(h % 24) + "</text>";
      });
      if (r) {
        var n = Math.min(24, upto == null ? 24 : upto);
        // stacked bars per hour
        for (var h = 0; h < n; h++) {
          var row = r.hours[h];
          var bw = (W - pl - 6) / 24 - 1.2;
          var base = 0;
          [
            ["s", row.s],
            ["w", row.w],
            ["b", Math.max(0, row.b)],
            ["g", row.g],
          ].forEach(function (seg) {
            if (seg[1] <= 0.01) return;
            out += '<rect x="' + (x(h) + 0.6) + '" y="' + y(base + seg[1]) + '" width="' + bw + '" height="' + (y(base) - y(base + seg[1])) + '" class="g-' + seg[0] + '"/>';
            base += seg[1];
          });
          if (row.u > 0.5) out += '<rect x="' + (x(h) + 0.6) + '" y="' + y(row.d) + '" width="' + bw + '" height="' + (y(base) - y(row.d)) + '" class="g-u"/>';
        }
        var pts = [];
        for (var h2 = 0; h2 < n; h2++) pts.push(x(h2 + 0.5) + "," + y(DEMAND[h2]));
        if (pts.length > 1) out += '<polyline points="' + pts.join(" ") + '" class="g-d"/>';
        if (n < 24) out += '<line x1="' + x(n) + '" x2="' + x(n) + '" y1="' + pt + '" y2="' + (H - pb) + '" class="g-now"/>';
      }
      svg.innerHTML = out + (extra || "");
    }

    var cur = null;
    var hourNow = 17;
    var camState = { x: 0, y: 13, z: 24, lx: 0, ly: 1, lz: 0 };

    function setHour(h, row, sim) {
      hourNow = h;
      var a = ((h - 6) / 12) * Math.PI; // 6:00 sunrise → 18:00 sunset
      var day = Math.max(0, Math.sin(a));
      var sunX = Math.cos(a) * 40,
        sunY = Math.sin(a) * 30;
      sunL.position.set(sunX, Math.max(2, sunY), 12);
      sunL.intensity = 0.2 + day * 2.1;
      sunGlow.position.set(sunX * 1.6, sunY * 1.4 + 4, -60);
      sunGlow.visible = sunY > -2;
      moon.position.set(-sunX * 1.4, Math.max(-20, -sunY * 1.2 + 6), -70);
      moon.visible = sunY < 4;
      hemi.intensity = 0.25 + day * 0.55;
      var dusk = Math.max(0, 1 - Math.abs(sunY) / 9);
      var night = sunY < 0 ? Math.min(1, -sunY / 10) : 0;
      sky.material.uniforms.top.value.set(0x3d7fd8).lerp(new T.Color(0x0a0a33), night);
      sky.material.uniforms.bot.value.set(0x9fd0ff).lerp(new T.Color(0xff9a66), dusk).lerp(new T.Color(0x1b1050), night);
      stars.material.opacity = night;
      stars.visible = night > 0.05;
      var lit = !row || row.u <= 0.5;
      var powered = cur && cur.gas !== "unset";
      windowMat.emissiveIntensity = powered && lit ? 0.4 + night * 2.2 : 0;
      townGlow.material.opacity = powered && lit ? night * 0.5 : 0;
      clockT.textContent = hhmm(h);
      clockS.innerHTML = row ? "Demand <b>" + Math.round(row.d) + " MW</b>" + (row.u > 0.5 ? ' · <em class="bad">Blackout</em>' : "") : "";
      if (row && sim) {
        var B = sim.caps.battery;
        bBar.scale.y = B ? Math.max(0.02, row.charge / B) : 0.02;
        bBar.position.y = 0.2 + bBar.scale.y * 0.5;
      }
    }

    st.onFrame(function (dt, time) {
      cam.position.set(camState.x + Math.sin(time * 0.1) * 2.2, camState.y, camState.z + Math.cos(time * 0.1) * 0.8);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      var wf = WIND[hourNow] || 0.4;
      turbines.forEach(function (tb, i) {
        if (tb.visible) tb.userData.rotor.rotation.z -= dt * (0.6 + wf * 5) * (1 + (i % 3) * 0.08);
      });
      // smoke
      var running = smokeOn;
      var a = smokeGeo.attributes.position.array;
      for (var k = 0; k < smokeN; k++) {
        if (smokeLife[k] <= 0) {
          if (running && Math.random() < dt * 6 * smokeRate) {
            smokeLife[k] = 3;
            a[k * 3] = gasPlant.position.x + (Math.random() < 0.5 ? -0.5 : 0.5);
            a[k * 3 + 1] = gasPlant.position.y + 2.9;
            a[k * 3 + 2] = gasPlant.position.z - 0.3;
          }
          continue;
        }
        smokeLife[k] -= dt;
        a[k * 3] += dt * (0.5 + Math.random() * 0.3);
        a[k * 3 + 1] += dt * 1.2;
        if (smokeLife[k] <= 0) a[k * 3 + 1] = -999;
      }
      smokeGeo.attributes.position.needsUpdate = true;
      alarmRing.material.opacity = alarmOn ? 0.35 + Math.sin(time * 9) * 0.35 : Math.max(0, alarmRing.material.opacity - dt * 2);
      if (!running) smokeRate = Math.max(0, smokeRate - dt);
    });
    var smokeOn = false,
      smokeRate = 0,
      alarmOn = false;

    function layout(p) {
      var nPanels = Math.round(((p.solar || 0) / 100) * 24);
      panels.forEach(function (pan, i) {
        pan.visible = i < nPanels;
      });
      var nTurb = Math.round(((p.wind || 0) / 100) * 6);
      turbines.forEach(function (tb, i) {
        tb.visible = tb.userData.hill ? !!p.farm : i < nTurb;
      });
      battery.visible = p.battery && p.battery !== "none";
      var bs = { small: 0.7, medium: 1, large: 1.4 }[p.battery] || 1;
      battery.scale.set(bs, bs, bs);
      gasPlant.visible = p.gas !== "none" && p.gas !== "unset";
      solarTag.hide(!nPanels);
      windTag.hide(!nTurb);
      batTag.hide(!battery.visible);
      gasTag.hide(!gasPlant.visible);
      if (p.name) {
        nameTag.el.innerHTML = p.name;
        nameTag.hide(false);
      } else nameTag.hide(true);
      batTag.el.innerHTML = "<b>Battery</b>" + (battery.visible ? " " + p.battery : "");
      gasTag.el.innerHTML = "<b>Gas</b> " + (p.gas === "all" ? "all the time" : p.gas === "night" ? "every night" : p.gas === "backup" ? "backup ≤ " + p.gasMax + "%" : "");
      solarTag.el.innerHTML = "<b>Solar</b> " + (p.solar || 0) + "%";
      windTag.el.innerHTML = "<b>Wind</b> " + (p.wind || 0) + "%" + (p.farm ? " + farm" : "");
    }

    function set(p, o) {
      var prev = cur;
      cur = JSON.parse(JSON.stringify(p));
      layout(p);
      var sim = simulate(p);
      setHour(17, sim ? sim.hours[17] : null, sim);
      graph(sim, sim ? 24 : 0);
      smokeOn = p.gas === "all";
      smokeRate = smokeOn ? 1 : 0;
      co2Cloud.material.opacity = sim ? Math.min(0.75, (sim.co2 / 441) * 0.75) : 0;
      if (!o || !o.instant) {
        if (prev && prev.gas === "unset" && p.gas !== "unset") kit.sound("powerup");
        CX.three.burst(st, new T.Vector3(1, 2, 0), { count: 60, colours: [0xdbe751, 0x7fd6d8], speed: 4, gravity: 0, life: 1, size: 0.25 });
      }
    }

    // Animate a whole day
    function day(p, secPerHour, label) {
      var sim = simulate(p);
      layout(p);
      var t = 0,
        lastH = -1;
      var inBlack = false;
      kit.sound("wind", { dur: 24 * secPerHour * 0.9, vol: 0.5 });
      return new Promise(function (resolve) {
        st.onFrame(function (dt) {
          t += dt;
          var h = Math.floor(t / secPerHour);
          if (h > 23) {
            alarmOn = false;
            smokeOn = false;
            graph(sim, 24);
            resolve(sim);
            return false;
          }
          if (h !== lastH) {
            lastH = h;
            var row = sim.hours[h];
            setHour(h, row, sim);
            graph(sim, h + 1, label ? '<text x="40" y="16" class="g-lab">' + U.esc(label) + "</text>" : "");
            smokeOn = row.g > 0.5;
            smokeRate = Math.min(1.5, row.g / 40);
            var black = row.u > 0.5;
            if (black && !inBlack) {
              kit.sound("powerdown");
              kit.sound("alarm", { delay: 0.3 });
              st.shake(0.06, 0.3);
            }
            if (!black && inBlack) kit.sound("chime", { note: "E6" });
            inBlack = black;
            alarmOn = black;
            if (h % 6 === 0) kit.sound("tick", { pitch: 1.2 });
            var target = Math.min(0.75, (sim.co2 * ((h + 1) / 24) / 441) * 0.75);
            co2Cloud.material.opacity = target;
          }
        });
      });
    }

    function run(p) {
      if (p.gas === "unset") return Promise.resolve({});
      cur = JSON.parse(JSON.stringify(p));
      camState = Object.assign({}, camState);
      return st.wait(0.4).then(function () {
        return day(p, CX.powerHourSec || 0.42);
      }).then(function (sim) {
        setHour(17, sim.hours[17], sim);
        return { metrics: measure(p) };
      });
    }

    function runTests(list) {
      var p = Promise.resolve();
      list.forEach(function (item) {
        p = p.then(function () {
          cur = JSON.parse(JSON.stringify(item.params));
          return day(item.params, CX.powerHourSec ? CX.powerHourSec * 0.6 : 0.2, item.label + " battery");
        });
      });
      return p.then(function () {
        // all three on one graph: gas per hour
        var sims = list.map(function (item) {
          return simulate(item.params);
        });
        var extra = "";
        var cols = ["#efabcd", "#f6a26b", "#dbe751"];
        sims.forEach(function (s, i) {
          extra += '<text x="' + (40 + i * 100) + '" y="16" class="g-lab" style="fill:' + cols[i] + '">' + U.esc(list[i].label) + ": " + U.round(s.gasPct, 1) + "% gas</text>";
        });
        graph(sims[1], 24, extra);
        return { tests: list.length };
      });
    }

    function anchor(key) {
      if (key === "solar") return solar.children[0] && solar.children[0].visible ? solar.children[0] : solar;
      if (key === "wind") return turbines[0];
      if (key === "battery") return battery;
      if (key === "gas" || key === "gasMax") return gasPlant;
      if (key === "farm") return turbines[7];
      if (key === "name") return island;
      return null;
    }

    function celebrate() {
      CX.three.confetti(st, new T.Vector3(-3.6, 4, 1.6), { count: 150 });
      kit.sound("chime", { note: "C6" });
    }

    function snapshot() {
      var keep = Object.assign({}, camState);
      setHour(19, cur ? (simulate(cur) || { hours: [] }).hours[19] : null, cur ? simulate(cur) : null);
      Object.assign(camState, { x: -6, y: 9, z: 18, lx: -1, ly: 1.5, lz: 0 });
      cam.position.set(camState.x, camState.y, camState.z);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      var url = st.snapshot("image/jpeg", 0.92);
      Object.assign(camState, keep);
      setHour(17, cur ? (simulate(cur) || { hours: [] }).hours[17] : null, cur ? simulate(cur) : null);
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
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        st.dispose();
      },
    };
  }

  function product(p) {
    var r = simulate(p) || { blackouts: 0, gasPct: 0, co2: 0, clean: 0 };
    return {
      kind: "Town Energy Plan",
      title: p.name || "My town",
      facts: [
        { k: "Solar", v: p.solar + "%" },
        { k: "Wind", v: p.wind + "%" + (p.farm ? " + wind farm" : "") },
        { k: "Battery", v: p.battery === "none" ? "none" : p.battery + " (" + BATTERY[p.battery] + " MWh)" },
        { k: "Blackout hours", v: String(r.blackouts) },
        { k: "Gas", v: U.round(r.gasPct, 1) + "% (limit " + p.gasMax + "%)" },
        { k: "CO₂ per day", v: Math.round(r.co2) + " t (gas only: 441 t)" },
      ],
      science: "The sun sets just as people get home, and the wind is calm in the evening. A battery stores spare midday sunshine for the evening peak, so gas is only a small backup.",
    };
  }

  var def = {
    id: "power",
    n: 4,
    title: "Power Town",
    short: "Power",
    colour: "orange",
    interest: { id: "planet", label: "The planet", icon: "leaf" },
    tagline: "Power a whole town for a day. Keep the lights on and the air clean.",
    subjects: [
      { k: "Science", t: "Energy, day and night, storage", icon: "flask" },
      { k: "Maths", t: "Percentages and line graphs", icon: "graph" },
    ],
    product: product,
    productName: "Town Energy Plan",
    lexicon: { details: /\b(clean|solar|wind|gas|battery|batteries|wind farm|hill|panels?|turbines?|graph)\b/ },
    start: { solar: 0, wind: 0, battery: "none", gas: "unset", gasMax: 100, farm: false, name: "" },
    params: {
      solar: { label: "Solar", fmt: function (v) {
        return v + "%";
      } },
      wind: { label: "Wind", fmt: function (v) {
        return v + "%";
      } },
      battery: { label: "Battery", fmt: function (v) {
        return v === "none" ? "none" : v;
      } },
      gas: { label: "Gas", fmt: function (v) {
        return { unset: "—", all: "all the power", none: "none", night: "every night", backup: "backup only" }[v] || v;
      } },
      gasMax: { label: "Gas limit", fmt: function (v) {
        return v + "%";
      } },
      farm: { label: "Wind farm", fmt: function (v) {
        return v ? "yes" : "no";
      } },
      name: { label: "Name", fmt: function (v) {
        return v || "not named";
      } },
    },
    causes: ["solar", "wind", "battery", "gas"],
    metrics: [
      { key: "blackouts", label: "Blackout hours", icon: "alert" },
      { key: "co2", label: "CO₂ per day", icon: "leaf" },
      { key: "clean", label: "Clean energy", icon: "sun" },
    ],
    metricSpec: {
      blackouts: { dp: 0 },
      co2: { unit: "t", dp: 0 },
      clean: { unit: "%", dp: 0 },
      gasPct: { unit: "%", dp: 1 },
    },
    tableMetrics: ["blackouts", "gasPct", "co2"],
    measure: measure,
    simulate: simulate,
    interpret: interpret,
    predict: predict,
    effect: effect,
    why: why,
    sessions: sessions,
    scene: scene,
  };
  // gas share appears in the test table
  def.metrics.push({ key: "gasPct", label: "Gas share", icon: "bolt", hidden: true });

  CX.builds.register(def);
})();
