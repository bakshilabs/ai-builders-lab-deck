/* ==========================================================================
   Build 2 · Kick Lab (interest: sport)
   Maths: angles in degrees, measuring, tables. Science: forces and gravity.
   Real projectile maths (no air resistance), so children can check every
   number: distance = v² × sin(2 × angle) ÷ g, where v = power% × 17 m/s.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var P = CX.prompt;

  var VMAX = 17; // m/s at 100% power
  var G = 9.8;
  var TARGET_R = 1.5;
  var WALL_H = 1.9;
  var DEG = Math.PI / 180;
  var GOAL_X = 32;

  function flight(p) {
    if (p.angle == null || p.power == null) return null;
    var v = (p.power / 100) * VMAX;
    var th = p.angle * DEG;
    var vx = v * Math.cos(th),
      vy = v * Math.sin(th);
    var T = (2 * vy) / G;
    var range = vx * T;
    var H = (vy * vy) / (2 * G);
    var yAt = function (x) {
      var t = x / vx;
      return vy * t - 0.5 * G * t * t;
    };
    var yWall = vx > 0 ? yAt(p.wall) : 0;
    var blocked = range <= p.wall || yWall < WALL_H;
    return { v: v, vx: vx, vy: vy, T: T, range: range, H: H, yWall: yWall, blocked: blocked };
  }

  function measure(p) {
    var f = flight(p);
    if (!f) return { distance: null, height: null, result: null };
    var res;
    if (f.blocked) res = "wall";
    else if (Math.abs(f.range - p.target) <= TARGET_R) res = "target";
    else res = f.range < p.target ? "short" : "long";
    return { distance: f.blocked ? Math.min(f.range, p.wall) : f.range, height: f.H, result: res, yWall: f.yWall };
  }

  var RESULT = { wall: "Hit the wall", target: "On target!", short: "Too short", long: "Too far" };

  // Lowest angle (to the nearest degree) that reaches `dist` at `power`, optionally clearing the wall
  function solve(dist, power, wall, mustClear) {
    var best = null;
    for (var a = 5; a <= 85; a++) {
      var f = flight({ angle: a, power: power, target: dist, wall: wall });
      var err = Math.abs(f.range - dist);
      if (err <= 0.9 && (!mustClear || !f.blocked)) {
        if (!best || err < best.err) best = { a: a, f: f, err: err };
      } else if (best) break; // stay on the low-angle solution
    }
    return best;
  }

  /* ---- Offline AI ----------------------------------------------------------------- */
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
    var angles = P.allNums(t, /(?:degrees?|°|-degree)/);
    var power = P.percent(t);
    if (power == null && /\bfull power\b/.test(t)) power = 100;
    if (power == null && /\bhalf power\b/.test(t)) power = 50;

    // Fair tests
    if (/\b(test|compare|try)\b/.test(t) && angles.length >= 2) {
      var pw = power != null ? power : p.power || 90;
      und = [
        { t: "test " + angles.join("°, ").replace(/, ([^,]*)$/, " and $1") + "°", src: "you" },
        { t: "power " + pw + "%", src: power != null ? "you" : "guess" },
      ];
      if (/\btable\b/.test(t)) und.push({ t: "a results table", src: "you" });
      if (/\b(explain|pattern|why)\b/.test(t)) und.push({ t: "explain the pattern", src: "you" });
      und.push({ t: "same ball, same spot, same power (fair test)", src: "calc" });
      return {
        kind: "tests",
        say: "I'll kick the same ball from the same spot at " + pw + "% power, changing only the angle: " + angles.join("°, ").replace(/, ([^,]*)$/, " and $1") + "°.",
        understood: und,
        set: power != null ? { power: power } : {},
        src: power != null ? { power: "you" } : {},
        tests: angles.slice(0, 4).map(function (a) {
          return { label: a + "°", set: { angle: a, power: pw } };
        }),
      };
    }

    var tg = P.numAfter(t, /target\s*(?:at|to|is|of)?\s*/) || P.numBefore(t, /m(?:etres?|eters?)?\s+target/);
    var wl = P.numAfter(t, /wall\s*(?:at|to|is)?\s*/);
    if (tg != null && tg !== p.target) add("target", tg, "target at " + tg + " m", "you");
    if (wl != null && wl !== p.wall) add("wall", wl, "wall at " + wl + " m", "you");
    var keepPower = /\bkeep(?:ing)?\s+(?:the\s+)?power\b/.test(t);
    if (power != null) add("power", power, "power " + power + "%", "you");
    if (angles.length) add("angle", angles[0], "angle " + angles[0] + "°", "you");

    var dist = set.target != null ? set.target : p.target;
    var wallAt = set.wall != null ? set.wall : p.wall;
    var mustClear = /\b(clear|clears|over the wall|above the wall|not hit the wall|doesn't hit the wall|miss the wall)\b/.test(t) || /\btest it\b/.test(t);
    var hitTarget = /\b(hit|reach|land on|land in|get to)\b[^.]{0,20}\btarget\b/.test(t) || /\btest it\b/.test(t);

    if (!angles.length) {
      if (hitTarget && (tg != null || /\btarget\b/.test(t)) && !/\bhigh\b/.test(t)) {
        // The AI does the distance maths. Without a limit it ignores the wall.
        var pw2 = set.power != null ? set.power : keepPower ? p.power || 90 : 100;
        if (set.power == null && !keepPower) add("power", pw2, "power " + pw2 + "% (strongest kick)", "guess");
        var sol = solve(dist, pw2, wallAt, mustClear);
        if (sol) add("angle", sol.a, "angle " + sol.a + "° (worked out from the distance)", "calc");
        if (mustClear) und.push({ t: "must clear the wall", src: "you" });
        if (keepPower) und.push({ t: "keep the power at " + pw2 + "%", src: "you" });
        if (/\b(hint|hint card)\b/.test(t)) und.push({ t: "write a hint card", src: "you" });
        return {
          kind: "change",
          say: mustClear
            ? "I tried every angle at " + pw2 + "% power and picked the lowest one that reaches " + dist + " m and still clears the wall."
            : "I worked out the angle that sends the ball " + dist + " m at " + pw2 + "% power. Let's test it.",
          understood: und,
          set: set,
          src: src,
          mistake: mustClear ? null : "ignored-wall",
        };
      }
      var dw = /\b(high|lob|low|along the ground)\b/.exec(t);
      if (dw) und.push({ t: "“" + dw[1] + "”", src: "you" });
      if (/\bover the wall\b/.test(t)) und.push({ t: "over the wall", src: "you" });
      if (/\bto the target\b/.test(t)) und.push({ t: "to the target", src: "you" });
      if (/\b(high|lob|up in the air|over the wall|above)\b/.test(t)) add("angle", 70, "high = a steep angle: 70°", "guess");
      else if (/\b(low|along the ground|skim)\b/.test(t)) add("angle", 8, "low = 8°", "guess");
      else if (p.angle == null) add("angle", 10, "angle 10°", "guess");
      if (set.power == null && !keepPower) {
        if (/\b(hard|strong|powerful|far|to the target|into the goal)\b/.test(t)) add("power", 90, "far = a hard kick: 90%", "guess");
        else if (p.power == null) add("power", 60, "power 60%", "guess");
      }
    }
    if (p.angle == null) {
      und.unshift({ t: "kick the ball", src: "you" });
      if (!/\b(straight|towards|at the target|to the target)\b/.test(t)) und.push({ t: "straight ahead", src: "guess" });
    }
    if (/\b(hint|hint card)\b/.test(t)) und.push({ t: "write a hint card", src: "you" });
    if (/\b(night|floodlights?|evening)\b/.test(t)) add("night", true, "a night match", "you");
    var nm = /\b(?:call|name)\s+(?:my challenge|it|the challenge)?\s*([a-z][a-z0-9 -]{1,20}?)(?:[.,]|$)/.exec(t);
    if (nm) add("name", nm[1].replace(/\b\w/g, function (x) {
      return x.toUpperCase();
    }), "name: " + nm[1], "you");

    if (!und.length) return { kind: "clarify", say: "Tell me how to kick it. I need an angle and a power, or I'll guess both.", options: ["at 45 degrees", "with 90% power", "high over the wall"] };
    var guesses = und.filter(function (u) {
      return u.src === "guess";
    }).length;
    var say = guesses >= 2 ? "Kicking! You didn't say how, so I guessed the angle and the power." : set.angle === 70 && src.angle === "guess" ? "You said high, so I chose a steep angle: 70°. And a hard kick so it reaches the target." : "Set. Let's test the kick.";
    return { kind: "change", say: say, understood: und, set: set, src: src };
  }

  function predict(r, c) {
    if (r.kind === "tests") {
      var best = r.tests.reduce(function (a, b) {
        return Math.abs(a.set.angle - 45) <= Math.abs(b.set.angle - 45) ? a : b;
      });
      return {
        q: "Which angle will send the ball furthest?",
        options: r.tests
          .map(function (x) {
            return { t: x.label, ok: x === best };
          })
          .concat([{ t: "They'll all go the same distance", ok: false }]),
        right: "Right: 45° goes furthest. Now look at the other two.",
        wrong: "Look at the table: 45° goes furthest.",
      };
    }
    var next = Object.assign({}, c.params, r.set);
    var mN = measure(next);
    if (mN.result == null) return null;
    if (c.params.angle == null) {
      return { q: "Will the ball reach the target at " + next.target + " m?", options: [{ t: "Yes", ok: mN.result === "target" }, { t: "No", ok: mN.result !== "target" }], right: "Your prediction was right.", wrong: "The test shows what really happens." };
    }
    if (c.session === 2 || (r.src && r.src.angle === "guess" && r.set.angle >= 60)) {
      return {
        q: "A steeper kick goes higher. Will it also go further?",
        options: [
          { t: "Yes, higher means further", ok: mN.distance > measure(c.params).distance },
          { t: "No, it will drop short", ok: mN.distance <= measure(c.params).distance || mN.result === "short" },
        ],
        right: "Right. Steep kicks go high, not far.",
        wrong: "Watch the landing spot: steep kicks go high, not far.",
      };
    }
    if (c.session === 4) {
      return {
        q: "The AI picked " + next.angle + "° at " + next.power + "% power. Will it land on the " + next.target + " m target?",
        options: [
          { t: "Yes, it'll land on the target", ok: mN.result === "target" },
          { t: "No, it'll hit the wall", ok: mN.result === "wall" },
          { t: "No, it'll go too far", ok: mN.result === "long" },
        ],
        right: "Your prediction was right.",
        wrong: "The test shows what really happens. Check the height at the wall.",
      };
    }
    var prev = measure(c.params);
    return {
      q: "Compared with your last kick, the ball will land…",
      options: [
        { t: "Further away", ok: mN.distance > prev.distance + 0.5 },
        { t: "About the same", ok: Math.abs(mN.distance - prev.distance) <= 0.5 },
        { t: "Closer", ok: mN.distance < prev.distance - 0.5 },
      ],
      right: "Your prediction was right.",
      wrong: "The test shows what really happens.",
    };
  }

  function effect(result, trial, resp, c) {
    var S = c.session;
    var concept = {
      1: "A kick has two numbers that matter: the angle and the power. You didn't say either, so the AI guessed both.",
      2: "“High” is a detail, but the AI read it as steep. Steep kicks go up, not along, so the ball drops short.",
      3: "Angles are measured in degrees. 45° is half of a right angle. At the same power, 45° sends the ball furthest.",
      4: "The AI did the distance maths but forgot the wall. A limit (“it must clear the wall”) made it check the height too.",
      5: "Angles that add up to 90° land in the same place: 30° and 60° go the same distance. 45° is in the middle and goes furthest.",
      6: "Your challenge works because you tested it. The angle and power you found are the solution your friends need to find.",
    }[S];
    if (resp.kind === "tests") return { headline: "30° and 60° <b>→</b> same distance", concept: concept, conceptTitle: "The maths" };
    var a = result.prev,
      b = result.next;
    var rows = [];
    if (c.params.angle != null && c.params.angle !== trial.angle) rows.push({ label: "Angle", from: c.params.angle + "°", to: trial.angle + "°" });
    if (c.params.power != null && c.params.power !== trial.power) rows.push({ label: "Power", from: c.params.power + "%", to: trial.power + "%" });
    rows.push({ label: "Distance", from: a.distance == null ? "no kick yet" : U.round(a.distance, 1) + " m", to: U.round(b.distance, 1) + " m" });
    rows.push({ label: "Highest point", from: a.height == null ? "—" : U.round(a.height, 1) + " m", to: U.round(b.height, 1) + " m" });
    var head = "Angle " + trial.angle + "° <b>→</b> " + (b.result === "wall" ? "hits the wall" : b.result === "target" ? "on target!" : U.round(b.distance, 1) + " m, " + RESULT[b.result].toLowerCase());
    return { headline: head, rows: rows, concept: concept, conceptTitle: S === 3 || S === 5 ? "The maths" : "The science" };
  }

  function why(resp, result, c) {
    if (resp.kind === "tests") {
      return "Distance = speed × speed × sin(2 × angle) ÷ 9.8. For 30°, 2 × 30 = 60°. For 60°, 2 × 60 = 120°. sin 60° and sin 120° are the same (0.87), so both kicks go the same distance. For 45°, 2 × 45 = 90° and sin 90° = 1, the biggest it can be.";
    }
    var p = Object.assign({}, c.params, resp.set);
    var f = flight(p);
    if (!f) return "";
    return (
      "At " +
      p.power +
      "% power the ball leaves your foot at " +
      U.round(f.v, 1) +
      " m/s. At " +
      p.angle +
      "°, " +
      U.round(f.vy, 1) +
      " m/s of that goes up and " +
      U.round(f.vx, 1) +
      " m/s goes forward. Gravity pulls it down after " +
      U.round(f.T, 1) +
      " s, so it travels " +
      U.round(f.vx, 1) +
      " × " +
      U.round(f.T, 1) +
      " ≈ " +
      U.round(f.range, 1) +
      " m. At the wall it is " +
      U.round(Math.max(0, f.yWall), 1) +
      " m high, and the wall is 1.9 m tall."
    );
  }

  var sessions = [
    {
      goal: "Take your first kick. Keep the prompt short, then look at what the AI guessed.",
      concept: "Angle and power",
      intro: "The ball is on the spot. There's a wall of defenders at 9 m and a target at 24 m.",
      reset: {},
      suggestions: ["Kick the ball"],
      check: function (r, p, resp) {
        return { pass: true, note: "Version 1: " + RESULT[r.next.result].toLowerCase() + ". The AI guessed " + (resp.guesses || 0) + " things. Next session you'll add details." };
      },
    },
    {
      goal: "Get the ball over the wall. Add details: how should the ball fly?",
      concept: "High isn't the same as far",
      suggestions: ["Kick it high over the wall to the target"],
      demoStart: { angle: 10, power: 60 },
      check: function (r) {
        if (r.next.result !== "wall") return { pass: true, note: "Over the wall! But it landed " + U.round(r.next.distance, 1) + " m away: the AI read “high” as steep. Next session you'll use numbers instead." };
        return { pass: false, note: "Still hitting the wall.", coach: "Add a detail about how the ball should fly: high? over the wall?" };
      },
    },
    {
      goal: "Land the ball on the 24 m target. Use numbers: an angle in degrees and a power in %.",
      concept: "Angles in degrees",
      suggestions: ["Kick it further", "Kick it at 45 degrees with 90% power"],
      demoStart: { angle: 70, power: 90 },
      check: function (r) {
        if (r.next.result === "target") return { pass: true, note: U.round(r.next.distance, 1) + " m: right on the target. Two numbers, no guesses." };
        return { pass: false, note: RESULT[r.next.result] + ": " + U.round(r.next.distance, 1) + " m.", coach: "Try 45 degrees. It's the angle that goes furthest." };
      },
    },
    {
      goal: "The target has moved to 18 m. Hit it, keep the power at 90%, and the ball must clear the wall.",
      concept: "Limits make the AI check",
      start: { target: 18 },
      suggestions: ["Hit the 18 m target", "Hit the 18 m target, keep the power at 90% and make sure the ball clears the wall"],
      after: ["Hit the 18 m target, keep the power at 90% and make sure the ball clears the wall"],
      demoStart: { angle: 45, power: 90 },
      check: function (r, p) {
        if (r.next.result === "target" && p.power === 90) return { pass: true, note: p.angle + "° at 90% power: it clears the wall by " + U.round(r.next.yWall - WALL_H, 1) + " m and lands on the target." };
        if (r.next.result === "wall") return { pass: false, note: "The AI's maths was right for the distance, but the ball hit the wall. It did what you said, not what you meant.", coach: "Add the limits: keep the power at 90%, and the ball must clear the wall." };
        return { pass: false, note: RESULT[r.next.result] + ".", coach: "Say the power you want to keep, and that it must clear the wall." };
      },
    },
    {
      goal: "Ask the AI to test three angles at the same power, show a table and explain the pattern.",
      concept: "Patterns in data",
      start: { target: 21 },
      suggestions: ["Test 30°, 45° and 60° at 90% power, show me a table and explain the pattern"],
      demoStart: { angle: 25, power: 90 },
      check: function (r, p, resp) {
        if (resp.kind === "tests" && r.rows && r.rows.length >= 3) return { pass: true, note: "Look at 30° and 60° in the table: same distance, both on the 21 m target, but very different heights." };
        return { pass: false, coach: "Ask for a test of three angles at the same power." };
      },
    },
    {
      goal: "Make your own free-kick challenge for your friends. Use all six ingredients, then share it.",
      concept: "Your challenge, explained",
      suggestions: ["Make my own challenge: put the target at 20 m and the wall at 11 m, keep the power at 90%, test it so my friends know it can be done, and write a hint card"],
      demoStart: { angle: 25, power: 90, target: 18 },
      check: function (r, p, resp) {
        if (r.next.result === "target" && resp.analysis.count >= 5) return { pass: true, note: "A " + resp.analysis.count + "-ingredient prompt, and the challenge is tested. Compare it with “Kick the ball”." };
        return { pass: false, coach: "Set your own target and wall, keep a limit, ask the AI to test it, and use at least five ingredients." };
      },
    },
  ];

  /* ---- 3D --------------------------------------------------------------------------- */
  function pitchTexture() {
    var cv = document.createElement("canvas");
    cv.width = 2048;
    cv.height = 1024;
    var g = cv.getContext("2d");
    for (var i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? "#1d6a2e" : "#237a36";
      g.fillRect((i * 2048) / 16, 0, 2048 / 16 + 1, 1024);
    }
    // grain
    var rand = U.rng(5);
    for (var k = 0; k < 9000; k++) {
      g.fillStyle = "rgba(0,0,0," + (rand() * 0.06).toFixed(3) + ")";
      g.fillRect(rand() * 2048, rand() * 1024, 3, 3);
    }
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 6;
    // pitch spans x: -6..44 m (2048px), z: -25..25 m (1024px)
    function X(m) {
      return ((m + 6) / 50) * 2048;
    }
    function Z(m) {
      return ((m + 25) / 50) * 1024;
    }
    g.strokeRect(X(GOAL_X - 16.5), Z(-20.16), X(GOAL_X) - X(GOAL_X - 16.5), Z(20.16) - Z(-20.16)); // penalty area
    g.strokeRect(X(GOAL_X - 5.5), Z(-9.16), X(GOAL_X) - X(GOAL_X - 5.5), Z(9.16) - Z(-9.16)); // six-yard box
    g.beginPath();
    g.moveTo(X(GOAL_X), 0);
    g.lineTo(X(GOAL_X), 1024);
    g.stroke();
    g.beginPath();
    g.arc(X(GOAL_X - 11), Z(0), 8, 0, Math.PI * 2);
    g.fillStyle = "#fff";
    g.fill();
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function ballTexture() {
    var cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 128;
    var g = cv.getContext("2d");
    g.fillStyle = "#f4f4f6";
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#1a1530";
    [[30, 30], [100, 70], [170, 25], [225, 85], [60, 100], [140, 110]].forEach(function (c) {
      g.beginPath();
      for (var i = 0; i < 5; i++) {
        var a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.lineTo(c[0] + Math.cos(a) * 15, c[1] + Math.sin(a) * 15);
      }
      g.fill();
    });
    var tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function scene(host, kit) {
    var T = THREE,
      X = CX.three;
    var st = X.stage(host, { background: 0x0a0624, fov: 40, bloom: { strength: 0.9, radius: 0.6, threshold: 1.0 }, exposure: 0.92, envIntensity: 0.45, fog: { color: 0x0a0624, near: 70, far: 160 } });
    var sc = st.scene,
      cam = st.camera;

    // Sky gradient dome
    var sky = new T.Mesh(
      new T.SphereGeometry(160, 32, 16),
      new T.ShaderMaterial({
        side: T.BackSide,
        depthWrite: false,
        uniforms: { top: { value: new T.Color(0x05021a) }, mid: { value: new T.Color(0x2a1660) }, bot: { value: new T.Color(0x6b2f6e) } },
        vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying float h; void main(){ vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.5, h)) : mix(mid, bot, smoothstep(0.0, -0.2, h)); gl_FragColor = vec4(c, 1.0); }",
      })
    );
    sc.add(sky);
    var stars = X.stars({ count: 900, radius: 150, size: 0.7 });
    stars.position.y = 20;
    sc.add(stars);

    sc.add(new T.HemisphereLight(0x8fa8ff, 0x1a3a20, 0.55));
    var key = new T.DirectionalLight(0xfff4e0, 1.25);
    key.position.set(10, 30, 18);
    key.castShadow = false;
    sc.add(key);

    var world = new T.Group();
    sc.add(world);

    // Pitch
    var pitch = new T.Mesh(new T.PlaneGeometry(50, 50), new T.MeshStandardMaterial({ map: pitchTexture(), roughness: 0.95 }));
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(19, 0, 0);
    world.add(pitch);
    var outer = new T.Mesh(new T.PlaneGeometry(260, 260), new T.MeshStandardMaterial({ color: 0x14361d, roughness: 1 }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(19, -0.02, 0);
    world.add(outer);

    // Stands with crowd lights
    var crowdN = 2600;
    var cpos = new Float32Array(crowdN * 3),
      ccol = new Float32Array(crowdN * 3);
    var cr = U.rng(21);
    var palette = [0xdbe751, 0xefabcd, 0x49a7a9, 0xffffff, 0xf07c3a, 0x8db4ff].map(function (h) {
      return new T.Color(h);
    });
    for (var i = 0; i < crowdN; i++) {
      var side = i % 3;
      var x, z, y;
      var row = cr() * 10;
      if (side === 0) {
        x = -4 + cr() * 48;
        z = -27 - row * 1.2;
        y = 1 + row * 0.9;
      } else if (side === 1) {
        x = 46 + row * 1.2;
        z = -24 + cr() * 48;
        y = 1 + row * 0.9;
      } else {
        x = -4 + cr() * 48;
        z = 27 + row * 1.2;
        y = 1 + row * 0.9;
      }
      cpos[i * 3] = x;
      cpos[i * 3 + 1] = y;
      cpos[i * 3 + 2] = z;
      var c = palette[Math.floor(cr() * palette.length)];
      var k2 = 0.35 + cr() * 0.5;
      ccol[i * 3] = c.r * k2;
      ccol[i * 3 + 1] = c.g * k2;
      ccol[i * 3 + 2] = c.b * k2;
    }
    var cg = new T.BufferGeometry();
    cg.setAttribute("position", new T.BufferAttribute(cpos, 3));
    cg.setAttribute("color", new T.BufferAttribute(ccol, 3));
    var crowd = new T.Points(cg, new T.PointsMaterial({ size: 0.45, map: X.dot(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    world.add(crowd);
    [
      [19, -33, 52, 0],
      [52, 0, 52, Math.PI / 2],
      [19, 33, 52, 0],
    ].forEach(function (s) {
      var stand = new T.Mesh(new T.BoxGeometry(s[2], 12, 8), new T.MeshStandardMaterial({ color: 0x150c38, roughness: 0.9 }));
      stand.position.set(s[0], 4, s[1] + (s[1] < 0 ? -2 : s[1] > 0 ? 2 : 0));
      stand.rotation.y = s[3];
      if (s[3]) stand.position.x = 52 + 2;
      world.add(stand);
    });

    // Floodlights
    [
      [-6, -30],
      [44, -30],
      [-6, 30],
      [44, 30],
    ].forEach(function (f) {
      var pole = new T.Mesh(new T.CylinderGeometry(0.25, 0.35, 26, 8), new T.MeshStandardMaterial({ color: 0x3a3360, roughness: 0.6 }));
      pole.position.set(f[0], 13, f[1]);
      world.add(pole);
      var lamp = new T.Mesh(new T.BoxGeometry(4, 2, 0.6), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: 4 }));
      lamp.position.set(f[0], 26, f[1]);
      lamp.lookAt(19, 0, 0);
      world.add(lamp);
      var gl = X.glow(0xfff1cf, 14, 0.55);
      gl.position.set(f[0], 26, f[1]);
      world.add(gl);
    });
    var fill = new T.DirectionalLight(0xc9d6ff, 0.45);
    fill.position.set(-10, 12, 30);
    world.add(fill);

    // Distance ruler along the pitch (metres)
    var rulerMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    var rulerLine = new T.Mesh(new T.BoxGeometry(35, 0.03, 0.06), rulerMat);
    rulerLine.position.set(17.5, 0.03, 3.2);
    world.add(rulerLine);
    for (var rm = 0; rm <= 35; rm += 5) {
      var tick = new T.Mesh(new T.BoxGeometry(0.06, 0.03, 0.6), rulerMat);
      tick.position.set(rm, 0.03, 3.2);
      world.add(tick);
      var rl = document.createElement("span");
      rl.className = "kl-ruler";
      rl.textContent = rm + " m";
      st.pin(rl, tick, new T.Vector3(0, 0, 0.9));
    }

    // Goal at 40 m
    var postMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, emissive: 0x333333 });
    var goal = new T.Group();
    [-3.66, 3.66].forEach(function (z) {
      var post = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.44, 12), postMat);
      post.position.set(0, 1.22, z);
      goal.add(post);
    });
    var bar = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 7.32, 12), postMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 2.44, 0);
    goal.add(bar);
    var net = new T.Mesh(new T.PlaneGeometry(7.32, 2.44, 24, 8), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.35 }));
    net.rotation.y = Math.PI / 2;
    net.position.set(1.8, 1.22, 0);
    goal.add(net);
    goal.position.set(GOAL_X, 0, 0);
    world.add(goal);

    // Target ring (moves)
    var target = new T.Group();
    var ringMat = new T.MeshBasicMaterial({ color: 0xdbe751, toneMapped: false, transparent: true });
    var tRing = new T.Mesh(new T.RingGeometry(TARGET_R - 0.18, TARGET_R, 64), ringMat);
    tRing.rotation.x = -Math.PI / 2;
    target.add(tRing);
    var tDisc = new T.Mesh(new T.CircleGeometry(TARGET_R - 0.18, 64), new T.MeshBasicMaterial({ color: 0xdbe751, transparent: true, opacity: 0.16, toneMapped: false }));
    tDisc.rotation.x = -Math.PI / 2;
    tDisc.position.y = 0.01;
    target.add(tDisc);
    var tInner = new T.Mesh(new T.RingGeometry(0.42, 0.55, 48), ringMat);
    tInner.rotation.x = -Math.PI / 2;
    tInner.position.y = 0.012;
    target.add(tInner);
    target.position.y = 0.03;
    world.add(target);
    var tLabel = document.createElement("span");
    tLabel.className = "kl-tag kl-tag--target";
    var tPin = st.pin(tLabel, target, new T.Vector3(0, 0.6, 0));

    // Wall of defenders
    var wall = new T.Group();
    for (var w = 0; w < 4; w++) {
      var d = X.bit({ colour: "teal", face: "think", shadow: true });
      d.scale.setScalar(1.25);
      d.position.set(0, 0, -1.2 + w * 0.8);
      d.rotation.y = -Math.PI / 2;
      wall.add(d);
    }
    world.add(wall);
    var wLabel = document.createElement("span");
    wLabel.className = "kl-tag";
    var wPin = st.pin(wLabel, wall, new T.Vector3(0, 2.6, 1.8));

    // Kicker and ball
    var kicker = X.bit({ colour: "pink", face: "grin" });
    kicker.scale.setScalar(1.1);
    kicker.position.set(-1.4, 0, 0.9);
    kicker.rotation.y = Math.PI / 2 - 0.5;
    world.add(kicker);
    var ballMat = new T.MeshStandardMaterial({ map: ballTexture(), roughness: 0.45 });
    function makeBall() {
      var b = new T.Mesh(new T.SphereGeometry(0.22, 32, 24), ballMat);
      b.position.set(0, 0.22, 0);
      return b;
    }
    var ball = makeBall();
    world.add(ball);
    var ballShadow = X.shadow(0.8, 0.6);
    ballShadow.position.set(0, 0.01, 0);
    world.add(ballShadow);

    // Protractor at the kick spot
    var prot = new T.Group();
    prot.position.set(0, 0.25, 0);
    world.add(prot);
    var protPin = null;
    function setProtractor(angle) {
      while (prot.children.length) prot.remove(prot.children[0]);
      if (protPin) {
        protPin.remove();
        protPin = null;
      }
      if (angle == null) return;
      var base = new T.Mesh(new T.RingGeometry(1.6, 1.68, 64, 1, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: T.DoubleSide }));
      prot.add(base);
      var fill = new T.Mesh(new T.CircleGeometry(1.6, 64, 0, angle * DEG), new T.MeshBasicMaterial({ color: 0xdbe751, transparent: true, opacity: 0.32, side: T.DoubleSide, toneMapped: false }));
      prot.add(fill);
      var ray = new T.Mesh(new T.BoxGeometry(2.4, 0.05, 0.05), new T.MeshBasicMaterial({ color: 0xdbe751, toneMapped: false }));
      ray.position.set(Math.cos(angle * DEG) * 1.2, Math.sin(angle * DEG) * 1.2, 0);
      ray.rotation.z = angle * DEG;
      prot.add(ray);
      var ground = new T.Mesh(new T.BoxGeometry(2.4, 0.03, 0.03), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
      ground.position.set(1.2, 0, 0);
      prot.add(ground);
      var lab = document.createElement("span");
      lab.className = "kl-angle";
      lab.textContent = angle + "°";
      var a = new T.Object3D();
      a.position.set(Math.cos((angle * DEG) / 2) * 2.15, Math.sin((angle * DEG) / 2) * 2.15 + 0.1, 0);
      prot.add(a);
      protPin = st.pin(lab, a);
    }

    // Trails and landing markers
    var arcs = new T.Group();
    world.add(arcs);
    var arcPins = [];
    function clearArcs(keepGhosts) {
      var keep = [];
      arcs.children.slice().forEach(function (m) {
        if (keepGhosts && m.userData.ghostable) {
          m.material.opacity = 0.22;
          m.material.color.set(0xefabcd);
          m.userData.ghostable = false;
          keep.push(m);
        } else {
          arcs.remove(m);
          if (m.geometry) m.geometry.dispose();
          if (m.material) m.material.dispose();
        }
      });
      arcPins.forEach(function (p) {
        if (keepGhosts && p.ghost) {
          p.el.classList.add("is-ghost");
          p.ghost = false;
        } else p.remove();
      });
      arcPins = arcPins.filter(function (p) {
        return p.el.parentNode;
      });
    }
    function arcLine(p, colour) {
      var f = flight(p);
      var pts = [];
      var steps = 60;
      var endT = f.blocked && f.range > p.wall ? p.wall / f.vx : f.T;
      for (var i = 0; i <= steps; i++) {
        var t = (endT * i) / steps;
        pts.push(new T.Vector3(f.vx * t, 0.22 + f.vy * t - 0.5 * G * t * t, 0));
      }
      var geo = new T.BufferGeometry().setFromPoints(pts);
      var line = new T.Line(geo, new T.LineDashedMaterial({ color: colour, dashSize: 0.5, gapSize: 0.35, transparent: true, opacity: 0.9, toneMapped: false }));
      line.computeLineDistances();
      line.userData.ghostable = true;
      return line;
    }

    var cur = null;
    var camState = { x: 15, y: 9.5, z: 37, lx: 15, ly: 4.6, lz: 0 };
    function moveCam(to, dur) {
      return st.tween(camState, to, dur == null ? 1.2 : dur, { ease: X.ease.inOut });
    }
    function frameAll(p) {
      return { x: 15, y: 9.5, z: 37, lx: 15, ly: 4.6, lz: 0 };
    }

    st.onFrame(function (dt, time) {
      cam.position.set(camState.x + Math.sin(time * 0.15) * 0.6, camState.y, camState.z);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      tRing.material.opacity = 0.75 + Math.sin(time * 4) * 0.25;
      tDisc.material.opacity = 0.12 + Math.sin(time * 4) * 0.06;
      stars.rotation.y += dt * 0.004;
      if (!kicking) {
        kicker.userData.rig.position.y = Math.abs(Math.sin(time * 3)) * 0.05;
        wall.children.forEach(function (d, i) {
          d.userData.rig.rotation.z = Math.sin(time * 2 + i) * 0.04;
        });
      }
    });

    function set(p, o) {
      o = o || {};
      cur = JSON.parse(JSON.stringify(p));
      wall.position.x = p.wall;
      var tx = { x: target.position.x };
      if (o.instant || target.position.x === 0) target.position.x = p.target;
      else
        st.tween(tx, { x: p.target }, 0.8, {
          ease: X.ease.outBack,
          onUpdate: function () {
            target.position.x = tx.x;
          },
        });
      tLabel.innerHTML = "<b>Target</b> " + p.target + " m";
      wLabel.innerHTML = "<b>Wall</b> " + p.wall + " m · 1.9 m tall";
      setProtractor(p.angle);
      ball.position.set(0, 0.22, 0);
      ballShadow.position.set(0, 0.01, 0);
      sky.material.uniforms.bot.value.set(p.night ? 0x241048 : 0x6b2f6e);
      if (!o.keepArcs) clearArcs(true);
      moveCam(frameAll(p), o.instant ? 0 : 1);
    }

    var kicking = false;
    var landSlots = {};
    function kickOne(p, b, colour, labelPrefix) {
      var f = flight(p);
      var m = measure(p);
      var t = 0;
      var landed = false;
      var trailPts = [];
      return new Promise(function (resolve) {
        var line = arcLine(p, colour);
        line.visible = false;
        arcs.add(line);
        st.onFrame(function (dt) {
          t += dt;
          var x, y;
          if (f.blocked && f.range > p.wall && f.vx * t >= p.wall) {
            // Bounce off the wall
            var tw = p.wall / f.vx;
            var dtw = t - tw;
            x = p.wall - 2.5 * dtw;
            y = Math.max(0.22, 0.22 + f.yWall - 4.9 * dtw * dtw * 2);
            if (!landed) {
              landed = true;
              kit.sound("bonk");
              wall.children.forEach(function (d) {
                d.userData.setFace("wow");
              });
              st.shake(0.12, 0.3);
            }
            if (dtw > 0.9) {
              b.position.set(x, y, 0);
              resolve(m);
              return false;
            }
          } else {
            x = f.vx * t;
            y = 0.22 + f.vy * t - 0.5 * G * t * t;
            if (t >= f.T) {
              x = f.range;
              y = 0.22;
              if (!landed) {
                landed = true;
                kit.sound("thud");
                CX.three.burst(st, new T.Vector3(x, 0.1, 0), { count: 30, colour: 0x7fd27f, speed: 2, gravity: 4, life: 0.8, size: 0.14, flat: true });
                var lab = document.createElement("span");
                lab.className = "kl-tag kl-tag--land" + (m.result === "target" ? " is-good" : "");
                lab.innerHTML = (labelPrefix ? "<b>" + labelPrefix + "</b> " : "") + U.round(f.range, 1) + " m";
                var a = new T.Object3D();
                var slot = Math.round(f.range);
                landSlots[slot] = (landSlots[slot] || 0) + 1;
                a.position.set(f.range, 0.1 + (landSlots[slot] - 1) * 1.15, 0);
                arcs.add(a);
                var pin = st.pin(lab, a, new T.Vector3(0, 0.7, 0));
                pin.ghost = true;
                arcPins.push(pin);
              }
              // roll on: into the wall if it landed short of it
              var rollTo = f.blocked ? p.wall - 0.4 : f.range + 1.4;
              var k = Math.min(1, (t - f.T) / (f.blocked ? 1.1 : 0.7));
              var e = 1 - Math.pow(1 - k, 2);
              b.position.set(f.range + (rollTo - f.range) * e, 0.22, 0);
              b.rotation.z -= dt * 6 * (1 - k);
              if (b === ball) ballShadow.position.set(b.position.x, 0.01, 0);
              if (f.blocked && k >= 1 && !b.userData.bonked) {
                b.userData.bonked = true;
                kit.sound("bonk", { vol: 0.7 });
                wall.children.forEach(function (d) {
                  d.userData.setFace("wow");
                });
              }
              if (k >= 1) {
                b.userData.bonked = false;
                resolve(m);
                return false;
              }
              return;
            }
          }
          b.position.set(x, y, 0);
          b.rotation.z -= dt * 12;
          if (b === ball) ballShadow.position.set(x, 0.01, 0);
          if (Math.floor(t * 30) !== Math.floor((t - dt) * 30)) trailPts.push(new T.Vector3(x, y, 0));
          line.visible = true;
        });
      });
    }

    function run(p, resp) {
      kicking = true;
      landSlots = {};
      clearArcs(true);
      set(p, { keepArcs: true });
      kicker.userData.setFace("grin");
      return st.wait(0.9).then(function () {
        // run-up and kick
        var o = { x: -1.4 };
        return st.tween(o, { x: -0.45 }, 0.35, {
          ease: X.ease.in,
          onUpdate: function () {
            kicker.position.x = o.x;
          },
        });
      }).then(function () {
        kit.sound("kick", { power: p.power / 100 });
        kicker.userData.rig.rotation.z = -0.3;
        st.wait(0.25).then(function () {
          kicker.userData.rig.rotation.z = 0;
          st.tween(kicker.position, { x: -1.4 }, 0.6);
        });
        var f0 = flight(p);
        if (f0 && !(f0.blocked && f0.range <= p.wall)) {
          st.wait(f0.vy / G).then(function () {
            var ap = new T.Object3D();
            ap.position.set(f0.vx * (f0.vy / G), 0.22 + f0.H, 0);
            arcs.add(ap);
            var lab = document.createElement("span");
            lab.className = "kl-tag kl-tag--apex";
            lab.innerHTML = "<b>Highest</b> " + U.round(f0.H, 1) + " m";
            var pin = st.pin(lab, ap, new T.Vector3(0, 0.6, 0));
            pin.ghost = true;
            arcPins.push(pin);
            kit.sound("ping", { pitch: 1.1, vol: 0.6 });
          });
        }
        return kickOne(p, ball, 0xdbe751, null);
      }).then(function (m) {
        kicking = false;
        if (m.result === "target") {
          kit.sound("crowd", { mood: "cheer" });
          kit.sound("net", { delay: 0.1 });
          CX.three.confetti(st, new T.Vector3(p.target, 1, 0), { count: 120 });
          kicker.userData.setFace("love");
          tRing.scale.setScalar(1.3);
          st.tween(tRing.scale, { x: 1, y: 1, z: 1 }, 0.6, { ease: X.ease.outElastic });
        } else {
          kit.sound("crowd", { mood: "groan" });
          kicker.userData.setFace(m.result === "wall" ? "sad" : "think");
        }
        wall.children.forEach(function (d) {
          d.userData.setFace("think");
        });
        return { metrics: m };
      });
    }

    function runTests(list) {
      kicking = true;
      landSlots = {};
      clearArcs(false);
      set(list[0].params, { keepArcs: true });
      setProtractor(null);
      ball.visible = false;
      var cols = [0xdbe751, 0xefabcd, 0x7fd6d8, 0xf6a26b];
      var balls = list.map(function () {
        var b = makeBall();
        world.add(b);
        return b;
      });
      moveCam({ x: 15, y: 9.5, z: 37, lx: 15, ly: 4.8, lz: 0 }, 1);
      return st.wait(1.1).then(function () {
        kit.sound("kick", { power: 0.9 });
        return Promise.all(
          list.map(function (item, i) {
            return st.wait(i * 0.45).then(function () {
              if (i) kit.sound("kick", { power: 0.8, vol: 0.7 });
              return kickOne(item.params, balls[i], cols[i % cols.length], item.label);
            });
          })
        );
      }).then(function (ms) {
        kicking = false;
        kit.sound("crowd", { mood: "cheer", vol: 0.6 });
        st.wait(4).then(function () {
          balls.forEach(function (b) {
            world.remove(b);
          });
          ball.visible = true;
        });
        return { tests: ms };
      });
    }

    function anchor(key) {
      if (key === "angle") return prot.children[3] || kicker;
      if (key === "power") return kicker;
      if (key === "target") return target;
      if (key === "wall") return wall;
      return null;
    }

    function celebrate() {
      CX.three.confetti(st, new T.Vector3(cur ? cur.target : 20, 1.5, 0), { count: 150 });
      kit.sound("whistle");
      kicker.userData.setFace("love");
    }

    function snapshot() {
      var keep = Object.assign({}, camState);
      Object.assign(camState, { x: -7, y: 2.6, z: 3.2, lx: 20, ly: 1.4, lz: -0.6 });
      cam.position.set(camState.x, camState.y, camState.z);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      var url = st.snapshot("image/jpeg", 0.92);
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
        tPin.remove();
        wPin.remove();
        st.dispose();
      },
    };
  }

  function product(p) {
    var m = measure(p);
    return {
      kind: "Free-Kick Challenge",
      title: p.name || "Can you hit " + p.target + " m?",
      facts: [
        { k: "Target", v: p.target + " m" },
        { k: "Wall", v: p.wall + " m away, 1.9 m tall" },
        { k: "Power", v: p.power + "%" },
        { k: "My angle", v: p.angle + "° (hint below)" },
        { k: "Distance", v: m.distance != null ? U.round(m.distance, 1) + " m" : "—" },
        { k: "Highest point", v: m.height != null ? U.round(m.height, 1) + " m" : "—" },
      ],
      science: "Hint: angles that add up to 90° land in the same place, and 45° goes furthest. Find an angle that clears the wall and lands on the target.",
    };
  }

  var def = {
    id: "kick",
    n: 2,
    title: "Kick Lab",
    short: "Kick",
    colour: "pink",
    interest: { id: "sport", label: "Sport", icon: "target" },
    tagline: "Design the perfect free kick. Angles, power and a wall in the way.",
    subjects: [
      { k: "Maths", t: "Angles in degrees, measuring, tables", icon: "graph" },
      { k: "Science", t: "Forces and gravity", icon: "flask" },
    ],
    product: product,
    productName: "Free-Kick Challenge",
    lexicon: { details: /\b(high|low|steep|over the wall|wall|target|goal|lob|curl|night|floodlights|challenge|hint)\b/ },
    start: { angle: null, power: null, target: 24, wall: 9, night: false, name: "" },
    params: {
      angle: { label: "Angle", unit: "°", dp: 0, fmt: function (v) {
        return v == null ? "—" : v + "°";
      } },
      power: { label: "Power", fmt: function (v) {
        return v == null ? "—" : v + "%";
      } },
      target: { label: "Target", unit: "m", dp: 0 },
      wall: { label: "Wall", unit: "m", dp: 0 },
      night: { label: "Night match", fmt: function (v) {
        return v ? "yes" : "no";
      } },
      name: { label: "Name", fmt: function (v) {
        return v || "not named";
      } },
    },
    causes: ["angle", "power", "target"],
    metrics: [
      { key: "distance", label: "Distance", icon: "arrow-right" },
      { key: "height", label: "Highest point", icon: "arrow-up" },
      { key: "result", label: "Result", icon: "target" },
    ],
    metricSpec: {
      distance: { unit: "m", dp: 1 },
      height: { unit: "m", dp: 1 },
      result: { fmt: function (v) {
        return v ? RESULT[v] : "—";
      } },
    },
    tableMetrics: ["distance", "height", "result"],
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
