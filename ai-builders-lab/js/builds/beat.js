/* ==========================================================================
   Build 3 · Beat Lab (interest: music)
   Science: sound, pitch and vibration (frequency), volume (amplitude).
   Maths: fractions of a beat, 60 ÷ BPM, doubling and halving frequency.
   Everything you see is also what you hear: the beat is synthesised live.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var P = CX.prompt;

  var MELODY = ["C4", "E4", "G4", "E4", "A4", "G4", "E4", "D4"];
  var ROWS = [
    { id: "kick", label: "Kick", colour: 0xefabcd, voice: "drum" },
    { id: "clap", label: "Clap", colour: 0xf6a26b, voice: "clap" },
    { id: "hat", label: "Hi-hat", colour: 0x7fd6d8, voice: "hat" },
    { id: "mel", label: "Melody", colour: 0xdbe751, voice: "note" },
  ];

  function steps(str) {
    return (str || "................").split("").map(function (c) {
      return c === "x";
    });
  }
  function pattern(onSteps) {
    var a = [];
    for (var i = 0; i < 16; i++) a.push(onSteps.indexOf(i) !== -1 ? "x" : ".");
    return a.join("");
  }
  function count(str) {
    return (str || "").split("").filter(function (c) {
      return c === "x";
    }).length;
  }
  function hz(n) {
    return CX.sound ? CX.sound.hz(n) : 262;
  }

  function measure(p) {
    if (!p || !p.bpm) return { beat: null, hits: null, hz: null, loud: null };
    return {
      beat: 60 / p.bpm,
      hits: count(p.kick) + count(p.clap) + count(p.hat),
      hz: p.melody ? hz(MELODY[0]) * p.pitch : null,
      loud: p.volume,
    };
  }

  /* ---- Offline AI ------------------------------------------------------------------ */
  function beatsIn(t, word) {
    var re = new RegExp("\\b" + word + "s?\\b(?:\\s+drums?)?\\s+on\\s+(?:beats?\\s+)?((?:\\d\\s*(?:,|and|&)?\\s*)+)");
    var m = re.exec(t);
    if (!m) return null;
    var nums = (m[1].match(/\d/g) || []).map(Number).filter(function (n) {
      return n >= 1 && n <= 4;
    });
    return nums.length ? nums : null;
  }

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

    // Fair tests on frequency
    if (/\b(test|compare|play)\b/.test(t) && /\b(frequenc|pitch|octave)/.test(t) && /\b(half|double|twice|normal)\b/.test(t)) {
      und = [
        { t: "play the melody at half, normal and double frequency", src: "you" },
        { t: "same notes, same speed, same volume (fair test)", src: "calc" },
      ];
      if (/\btable\b/.test(t)) und.push({ t: "a results table", src: "you" });
      if (/\b(explain|why)\b/.test(t)) und.push({ t: "explain what changes", src: "you" });
      return {
        kind: "tests",
        say: "I'll play your melody three times. Only the frequency changes: half, normal, then double.",
        understood: und,
        set: {},
        src: {},
        tests: [
          { label: "Half", set: { pitch: 0.5 } },
          { label: "Normal", set: { pitch: 1 } },
          { label: "Double", set: { pitch: 2 } },
        ],
      };
    }

    var creating = !p.bpm;
    var bpm = P.numBefore(t, /(?:bpm|beats per minute|beats a minute)/);
    var keepTempo = /\bkeep\b[^.]{0,20}\b(\d+\s*bpm|tempo|speed)\b/.test(t);
    if (bpm != null && !(keepTempo && bpm === p.bpm)) add("bpm", bpm, bpm + " beats per minute", "you");
    else if (keepTempo) und.push({ t: "keep it at " + p.bpm + " BPM", src: "you" });
    else if (/\b(slower|faster|quicker)\b/.test(t) && !/\b(melody|notes|tune)\b/.test(t)) {
      return {
        kind: "clarify",
        say: "How much " + (/slower/.test(t) ? "slower" : "faster") + "? Give me a number of beats per minute (BPM), or I'll have to guess.",
        options: /slower/.test(t) ? ["at 100 beats per minute", "at 90 beats per minute"] : ["at 130 beats per minute", "at 140 beats per minute"],
      };
    }

    var kb = beatsIn(t, "kick"),
      cb = beatsIn(t, "clap") || beatsIn(t, "snare");
    if (kb) add("kick", pattern(kb.map(function (n) {
      return (n - 1) * 4;
    })), "kick on beat" + (kb.length > 1 ? "s " : " ") + kb.join(" and "), "you");
    if (cb) add("clap", pattern(cb.map(function (n) {
      return (n - 1) * 4;
    })), "clap on beat" + (cb.length > 1 ? "s " : " ") + cb.join(" and "), "you");
    if (/\bhi-?hats?\b[^.]{0,25}\bevery half beat\b|\bhalf beats?\b/.test(t)) add("hat", "x.x.x.x.x.x.x.x.", "hi-hat on every half beat: 8 per bar", "you");
    else if (/\bhi-?hats?\b[^.]{0,25}\bevery beat\b/.test(t)) add("hat", "x...x...x...x...", "hi-hat on every beat: 4 per bar", "you");
    else if (/\bhi-?hats?\b[^.]{0,25}\bevery quarter beat\b/.test(t)) add("hat", "xxxxxxxxxxxxxxxx", "hi-hat on every quarter beat: 16 per bar", "you");

    // Melody: pitch (frequency) versus volume
    var aboutMelody = /\b(melody|notes|tune|song)\b/.test(t);
    var higher = /\bhigher\b/.test(t),
      lower = /\blower\b/.test(t) && !/\boctave lower\b/.test(t);
    var pitchWords = /\b(pitch|frequency|frequencies|octave)\b/.test(t);
    var keepVol = /\b(not louder|keep the volume|same volume|volume the same|without getting louder)\b/.test(t);
    if (aboutMelody && (higher || lower) && !/\bbassline\b/.test(t)) {
      if (pitchWords) {
        var f = P.factor(t) || (higher ? 2 : 0.5);
        if (/\boctave\b/.test(t) && !P.factor(t)) f = higher ? 2 : 0.5;
        var np = U.round(p.pitch * f, 3);
        add("pitch", np, (f === 2 ? "double" : f === 0.5 ? "half" : "×" + f) + " the frequency: " + Math.round(hz(MELODY[0]) * np) + " Hz", "you");
        if (keepVol) und.push({ t: "keep the volume the same", src: "you" });
      } else {
        // "Higher" without saying pitch: the AI reads it as louder
        und.push({ t: "the melody", src: "you" });
        und.push({ t: "“" + (higher ? "higher" : "lower") + "”", src: "you" });
        add("volume", higher ? 100 : 40, (higher ? "higher" : "lower") + " = " + (higher ? "louder" : "quieter") + ": volume " + (higher ? 100 : 40) + "%", "guess");
        return { kind: "change", say: "Turning it up! I made the melody " + (higher ? "louder" : "quieter") + ".", understood: und, set: set, src: src, mistake: "volume-for-pitch" };
      }
    }
    if (/\blouder\b/.test(t) && !keepVol) add("volume", Math.min(100, (p.volume || 70) + 20), "louder: volume " + Math.min(100, (p.volume || 70) + 20) + "%", "you");
    if (/\bquieter|softer\b/.test(t)) add("volume", Math.max(20, (p.volume || 70) - 20), "quieter: volume " + Math.max(20, (p.volume || 70) - 20) + "%", "you");

    if (/\bbassline|bass line|bass\b/.test(t)) add("bass", true, "a bassline" + (/\boctave lower\b/.test(t) ? " an octave lower" : ""), "you");
    var fade = /\bfade(?:s)?(?: it)? out over (?:the last )?(\d+|two|three|four) beats\b/.exec(t);
    if (fade) {
      var fb = { two: 2, three: 3, four: 4 }[fade[1]] || parseInt(fade[1], 10);
      add("fade", fb, "fade out over the last " + fb + " beats", "you");
    }
    var nm = /\b(?:call|name)\s+(?:my track|the track|my song|it)?\s*([a-z][a-z ]{1,18}?)(?=[.,]|\s+(?:and|with)\b|$)/.exec(t);
    if (nm) add("name", nm[1].replace(/\b\w/g, function (x) {
      return x.toUpperCase();
    }), "name: " + nm[1].replace(/\b\w/g, function (x) {
      return x.toUpperCase();
    }), "you");
    if (/\b(explain|why)\b/.test(t)) und.push({ t: "explain the pitch", src: "you" });

    if (creating) {
      und.unshift({ t: "a beat", src: "you" });
      if (!("bpm" in set)) add("bpm", 120, "120 beats per minute", "guess");
      if (!("kick" in set)) add("kick", "x...x...x...x...", "kick on every beat", "guess");
      if (!("hat" in set)) add("hat", "xxxxxxxxxxxxxxxx", "hi-hat on every quarter beat", "guess");
      if (!("clap" in set)) und.push({ t: "no clap, no melody", src: "guess" });
    }

    if (!und.length) return { kind: "clarify", say: "What should I change? You can tell me about the tempo (BPM), the drums or the melody.", options: ["at 100 beats per minute", "with a clap on beats 2 and 4", "with a hi-hat on every half beat"] };
    var guesses = und.filter(function (u) {
      return u.src === "guess";
    }).length;
    var say = creating && guesses >= 3 ? "Here's a beat! You didn't say how fast or which drums, so I guessed. Press the test button to hear it." : set.pitch ? "Pitch up, volume the same. Doubling the frequency makes every note one octave higher." : set.name ? "“" + set.name + "” is ready. I changed only what you asked for." : "Done. I changed only what you asked for.";
    return { kind: "change", say: say, understood: und, set: set, src: src };
  }

  function predict(r, c) {
    if (r.kind === "tests") {
      return {
        q: "Which version will sound the highest?",
        options: [
          { t: "Half frequency", ok: false },
          { t: "Normal", ok: false },
          { t: "Double frequency", ok: true },
          { t: "They'll all sound the same", ok: false },
        ],
        right: "Right: more vibrations per second sound higher.",
        wrong: "Listen again: double the frequency sounds highest.",
      };
    }
    var next = Object.assign({}, c.params, r.set);
    if (!c.params.bpm) return { q: "How many kicks will you hear in one bar?", options: [{ t: "4", ok: count(next.kick) === 4 }, { t: "8", ok: count(next.kick) === 8 }, { t: "16", ok: count(next.kick) === 16 }], right: "Right. Count them as they light up.", wrong: "Count the pink pads in the kick row." };
    if (r.set.bpm != null && r.set.bpm !== c.params.bpm) {
      var sec = U.round(60 / r.set.bpm, 2);
      return {
        q: "At " + r.set.bpm + " beats per minute, how long is one beat?",
        options: [
          { t: sec + " seconds", ok: true },
          { t: "1 second", ok: sec === 1 },
          { t: r.set.bpm + " seconds", ok: false },
        ],
        right: "Yes: 60 seconds ÷ " + r.set.bpm + " beats = " + sec + " seconds per beat.",
        wrong: "60 seconds ÷ " + r.set.bpm + " beats = " + sec + " seconds per beat.",
      };
    }
    if (r.set.clap && !c.params.clap.replace(/\./g, "")) {
      return { q: "Which beats will the clap land on?", options: [{ t: "Beats 2 and 4", ok: next.clap === "....x.......x..." }, { t: "Beats 1 and 3", ok: next.clap === "x.......x......." }, { t: "Every beat", ok: count(next.clap) === 4 }], right: "Right: that's called the backbeat.", wrong: "Watch the orange pads." };
    }
    if (r.mistake === "volume-for-pitch") {
      return { q: "Will the melody sound higher?", options: [{ t: "Yes, the notes will be higher", ok: false }, { t: "No, just louder", ok: true }], right: "Right. Louder isn't higher.", wrong: "Listen: it's louder, but the notes haven't moved." };
    }
    if (r.set.pitch != null) {
      return {
        q: "The frequency doubles. What happens to the waves?",
        options: [
          { t: "They get taller", ok: false },
          { t: "They get closer together", ok: true },
          { t: "Nothing changes", ok: false },
        ],
        right: "Yes: twice as many vibrations every second.",
        wrong: "Watch the wave: twice as many vibrations every second, so they're closer together.",
      };
    }
    if (c.session === 6) {
      return { q: "You added a bassline an octave lower. Its frequency will be…", options: [{ t: "Half the melody's", ok: true }, { t: "Double the melody's", ok: false }, { t: "The same", ok: false }], right: "Right: an octave lower is half the frequency.", wrong: "An octave lower means half the frequency." };
    }
    return null;
  }

  function effect(result, trial, resp, c) {
    var S = c.session;
    var concept = {
      1: "A bar of music has 4 beats. At 120 beats per minute, each beat lasts 60 ÷ 120 = 0.5 seconds. The AI guessed all of that.",
      2: "Beats 1 and 3 for the kick, 2 and 4 for the clap. That's the backbeat, and your details told the AI exactly where to put them.",
      3: "60 ÷ 100 = 0.6 seconds per beat. A half beat is 0.3 seconds, so 8 hi-hats fit in a 4-beat bar.",
      4: "Pitch is how high or low a note sounds. It depends on frequency: how many times the speaker vibrates each second. Volume is how big the vibrations are. “Louder” and “higher” are different.",
      5: "Each time you double the frequency, the note sounds one octave higher. Halve it and it drops an octave. The vibrations get closer together as the pitch goes up.",
      6: "Your bassline plays the same notes an octave lower, which is half the frequency, so the track sounds fuller without clashing.",
    }[S];
    if (resp.kind === "tests") return { headline: "Frequency ×2 <b>→</b> one octave higher", concept: concept, conceptTitle: "The science" };
    var a = result.prev,
      b = result.next;
    var rows = [];
    function row(label, k, unit, dp) {
      var av = a[k],
        bv = b[k];
      if (av === bv && !(S === 4 && k === "hz")) return;
      rows.push({
        label: label,
        from: av == null ? "—" : U.round(av, dp) + unit,
        to: bv == null ? "—" : U.round(bv, dp) + unit,
        factor: av && bv && Math.abs(bv / av - 1) > 0.04 ? (bv > av ? "×" + U.round(bv / av, 1) : "÷" + U.round(av / bv, 1)) : av === bv ? "same" : "",
      });
    }
    row("One beat lasts", "beat", " s", 2);
    row("Drum hits per bar", "hits", "", 0);
    row("Melody pitch", "hz", " Hz", 0);
    row("Volume", "loud", "%", 0);
    var head;
    if (resp.mistake === "volume-for-pitch") head = "Volume up <b>→</b> louder, not higher";
    else if (trial.pitch !== c.params.pitch) head = "Frequency " + (trial.pitch > c.params.pitch ? "×2" : "÷2") + " <b>→</b> one octave " + (trial.pitch > c.params.pitch ? "higher" : "lower");
    else if (trial.bpm !== c.params.bpm && c.params.bpm) head = trial.bpm + " BPM <b>→</b> " + U.round(60 / trial.bpm, 2) + " s per beat";
    else if (!c.params.bpm) head = trial.bpm + " BPM <b>→</b> " + U.round(60 / trial.bpm, 2) + " s per beat";
    else head = "Your details <b>→</b> exactly the beat you asked for";
    return { headline: head, rows: rows, concept: concept, conceptTitle: S === 3 ? "The maths" : "The science" };
  }

  function why(resp, result, c) {
    if (resp.kind === "tests") return "Half frequency: 131 vibrations a second. Normal: 262. Double: 523. Your ear hears more vibrations per second as a higher note. Doubling is so special in music that it has a name: an octave.";
    var p = Object.assign({}, c.params, resp.set);
    if (resp.mistake === "volume-for-pitch") return "You said “higher”, and I guessed you meant “turn it up”. Volume changes how big the vibrations are, not how fast they are. To change the pitch you need a higher frequency: more vibrations every second.";
    return "At " + p.bpm + " beats per minute, one beat lasts 60 ÷ " + p.bpm + " = " + U.round(60 / p.bpm, 2) + " s. Your melody's first note vibrates " + Math.round(hz(MELODY[0]) * p.pitch) + " times every second (" + Math.round(hz(MELODY[0]) * p.pitch) + " Hz).";
  }

  var sessions = [
    {
      goal: "Make your first beat. Keep the prompt short, then look at what the AI guessed.",
      concept: "Beats and tempo",
      intro: "The decks are ready, but there's no beat yet. Turn your sound on, then ask for one.",
      reset: {},
      suggestions: ["Make a beat"],
      check: function (r, p, resp) {
        return { pass: !!p.bpm, note: "Version 1 is playing. The AI guessed " + (resp.guesses || 0) + " things. Next session you'll add details." };
      },
    },
    {
      goal: "Put the kick and clap exactly where you want them. Add details: which drum, on which beat?",
      concept: "The backbeat",
      suggestions: ["Make a beat with a kick on beats 1 and 3 and a clap on 2 and 4"],
      demoStart: { bpm: 120, kick: "x...x...x...x...", hat: "xxxxxxxxxxxxxxxx", clap: "................" },
      check: function (r, p, resp) {
        if (p.kick === "x.......x......." && p.clap === "....x.......x..." && (resp.guesses || 0) === 0) return { pass: true, note: "Kick on 1 and 3, clap on 2 and 4, and no guesses. Your details did that." };
        return { pass: false, coach: "Say which drum goes on which beat: “a kick on beats 1 and 3 and a clap on 2 and 4”." };
      },
    },
    {
      goal: "Slow it down to 100 beats per minute and put a hi-hat on every half beat. Use numbers.",
      concept: "60 ÷ BPM",
      suggestions: ["Make it slower", "Make it 100 beats per minute and add a hi-hat on every half beat"],
      demoStart: { bpm: 120, kick: "x.......x.......", clap: "....x.......x...", hat: "xxxxxxxxxxxxxxxx" },
      check: function (r, p) {
        if (p.bpm === 100 && p.hat === "x.x.x.x.x.x.x.x.") return { pass: true, note: "100 BPM: each beat lasts 0.6 seconds, and 8 hi-hats fit in a bar." };
        return { pass: false, coach: "Use numbers: how many beats per minute, and how often the hi-hat plays." };
      },
    },
    {
      goal: "New today: your beat has a melody. Make the melody higher, but keep the volume the same.",
      concept: "Pitch and volume",
      start: { melody: true },
      intro: "Your instructor added an 8-note melody to everyone's beat. It starts on middle C: 262 Hz.",
      suggestions: ["Make the melody higher", "Make the melody higher in pitch, not louder: double the frequency and keep the volume the same"],
      after: ["Make the melody higher in pitch, not louder: double the frequency and keep the volume the same"],
      demoStart: { bpm: 100, kick: "x.......x.......", clap: "....x.......x...", hat: "x.x.x.x.x.x.x.x." },
      check: function (r, p, resp) {
        if (resp.mistake === "volume-for-pitch") return { pass: false, note: "It's louder, but the notes are just as high: still 262 Hz. The AI did what you said, not what you meant.", coach: "Say which kind of higher, add a number and a limit: “higher in pitch, not louder: double the frequency and keep the volume the same”." };
        if (p.pitch >= 2 && p.volume <= 70) return { pass: true, note: "523 Hz now: every note is one octave higher, and the volume didn't change." };
        return { pass: false, coach: "Make it higher in pitch, and keep the volume the same." };
      },
    },
    {
      goal: "Ask the AI to play your melody at three frequencies, show a table and explain what changes.",
      concept: "Octaves",
      start: { melody: true },
      suggestions: ["Play my melody at half, normal and double frequency, show me a table and explain what changes"],
      demoStart: { bpm: 100, kick: "x.......x.......", clap: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", melody: true, pitch: 2 },
      check: function (r, p, resp) {
        if (resp.kind === "tests") return { pass: true, note: "131, 262 and 523 Hz: each doubling sounds one octave higher." };
        return { pass: false, coach: "Ask for a fair test at half, normal and double frequency." };
      },
    },
    {
      goal: "Finish your track and name it. Use all six ingredients, then share it.",
      concept: "Your track, explained",
      start: { melody: true },
      suggestions: ["Call my track Moon Groove. Add a bassline an octave lower so it sounds fuller, keep it at 100 BPM, fade out over the last 4 beats and explain the pitch"],
      demoStart: { bpm: 100, kick: "x.......x.......", clap: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", melody: true, pitch: 2 },
      check: function (r, p, resp) {
        if (p.name && p.bass && resp.analysis.count >= 5) return { pass: true, note: "A " + resp.analysis.count + "-ingredient prompt. Compare it with your first one: “Make a beat”." };
        return { pass: false, coach: "Name your track, add a bassline, keep the tempo, and use at least five ingredients." };
      },
    },
  ];

  /* ---- 3D --------------------------------------------------------------------------- */
  function scene(host, kit) {
    var T = THREE,
      X = CX.three;
    var st = X.stage(host, { background: 0x07021a, fov: 38, bloom: { strength: 1.05, radius: 0.65, threshold: 0.9 }, exposure: 0.95, envIntensity: 0.4, fog: { color: 0x07021a, near: 22, far: 60 } });
    var sc = st.scene,
      cam = st.camera;
    sc.add(new T.HemisphereLight(0x8c7cff, 0x120830, 0.6));
    var key = new T.DirectionalLight(0xffffff, 1.0);
    key.position.set(-4, 10, 8);
    sc.add(key);
    var pinkL = new T.PointLight(0xef6fb0, 30, 30, 1.6);
    pinkL.position.set(-8, 5, -2);
    sc.add(pinkL);
    var tealL = new T.PointLight(0x49d6d8, 30, 30, 1.6);
    tealL.position.set(8, 5, -2);
    sc.add(tealL);

    // Glossy floor with a neon grid
    var floor = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ color: 0x0c0626, roughness: 0.35, metalness: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    sc.add(floor);
    var grid = new T.GridHelper(80, 80, 0x4a2fb0, 0x24165c);
    grid.position.y = 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.5;
    sc.add(grid);
    var stars = X.stars({ count: 700, radius: 70, size: 0.6 });
    stars.position.y = 10;
    sc.add(stars);

    // Back wall of light columns (equaliser)
    var eq = [];
    var eqMat = [];
    for (var e = 0; e < 24; e++) {
      var m = new T.MeshStandardMaterial({ color: 0x1a0d52, emissive: e % 2 ? 0xef6fb0 : 0x49d6d8, emissiveIntensity: 0.6 });
      eqMat.push(m);
      var col = new T.Mesh(new T.BoxGeometry(0.55, 1, 0.3), m);
      col.position.set(-13.8 + e * 1.2, 0.5, -9);
      sc.add(col);
      eq.push(col);
    }

    // Sequencer: 4 rows × 16 steps
    var seq = new T.Group();
    seq.position.set(0, 0, 0);
    sc.add(seq);
    var padGeo = new T.RoundedBoxGeometry(0.62, 0.22, 0.62, 3, 0.08);
    var pads = [];
    ROWS.forEach(function (r, ri) {
      var row = [];
      for (var s = 0; s < 16; s++) {
        var mat = new T.MeshStandardMaterial({ color: 0x241a5a, emissive: r.colour, emissiveIntensity: 0, roughness: 0.4, metalness: 0.2 });
        var pad = new T.Mesh(padGeo, mat);
        pad.position.set(-6.9 + s * 0.92 + Math.floor(s / 4) * 0.28, 0.11, -1.9 + ri * 1.05);
        seq.add(pad);
        row.push(pad);
      }
      pads.push(row);
      var lab = document.createElement("span");
      lab.className = "bl-row";
      lab.style.setProperty("--c", "#" + r.colour.toString(16).padStart(6, "0"));
      lab.textContent = r.label;
      var a = new T.Object3D();
      a.position.set(-8.1, 0.2, -1.9 + ri * 1.05);
      seq.add(a);
      st.pin(lab, a);
    });
    // Beat numbers
    for (var b = 0; b < 4; b++) {
      var bl = document.createElement("span");
      bl.className = "bl-beat";
      bl.textContent = "Beat " + (b + 1);
      var ba = new T.Object3D();
      ba.position.set(-6.9 + b * 4 * 0.92 + b * 0.28 + 1.38, 0.2, -2.75);
      seq.add(ba);
      st.pin(bl, ba);
    }
    // Playhead
    var head = new T.Mesh(new T.BoxGeometry(0.76, 0.06, 4.6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, toneMapped: false }));
    head.position.set(0, 0.32, -0.33);
    seq.add(head);

    // Speaker
    var spk = new T.Group();
    spk.position.set(9.6, 0, -3.4);
    sc.add(spk);
    var cab = new T.Mesh(new T.RoundedBoxGeometry(3, 4.4, 2, 4, 0.25), new T.MeshStandardMaterial({ color: 0x150b3c, roughness: 0.5, metalness: 0.3 }));
    cab.position.y = 2.2;
    spk.add(cab);
    var coneGeo = new T.LatheGeometry(
      [new T.Vector2(0.05, 0), new T.Vector2(0.4, 0.05), new T.Vector2(1.05, 0.38), new T.Vector2(1.15, 0.42)],
      48
    );
    var cone = new T.Mesh(coneGeo, new T.MeshStandardMaterial({ color: 0x2a1f66, roughness: 0.6, side: T.DoubleSide }));
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(0, 2.6, 1.42);
    spk.add(cone);
    var capM = new T.MeshStandardMaterial({ color: 0x111111, emissive: 0xdbe751, emissiveIntensity: 0.4 });
    var cap = new T.Mesh(new T.SphereGeometry(0.32, 24, 16), capM);
    cap.position.set(0, 2.6, 1.0);
    spk.add(cap);
    var ringGlow = new T.Mesh(new T.TorusGeometry(1.18, 0.05, 12, 64), new T.MeshBasicMaterial({ color: 0xef6fb0, toneMapped: false }));
    ringGlow.position.set(0, 2.6, 1.02);
    spk.add(ringGlow);
    var tweet = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 0.1, 32), new T.MeshStandardMaterial({ color: 0x1a1240, emissive: 0x49d6d8, emissiveIntensity: 0.3 }));
    tweet.rotation.x = Math.PI / 2;
    tweet.position.set(0, 0.95, 1.02);
    spk.add(tweet);

    // DJ Bit behind the decks
    var deck = new T.Mesh(new T.RoundedBoxGeometry(4.2, 1.1, 1.6, 4, 0.2), new T.MeshStandardMaterial({ color: 0x1d1150, roughness: 0.4, metalness: 0.4 }));
    deck.position.set(0, 0.55, -4.6);
    sc.add(deck);
    [-1.2, 1.2].forEach(function (x) {
      var tt = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.08, 40), new T.MeshStandardMaterial({ color: 0x0b0620, emissive: 0x7f5cff, emissiveIntensity: 0.4 }));
      tt.position.set(x, 1.14, -4.6);
      sc.add(tt);
    });
    var dj = X.bit({ colour: "lime", face: "happy" });
    dj.scale.setScalar(1.25);
    dj.position.set(0, 1.1, -5.6);
    sc.add(dj);

    // Waveform (what the melody's vibration looks like)
    var WN = 260;
    var wPos = new Float32Array(WN * 3);
    var wGeo = new T.BufferGeometry();
    wGeo.setAttribute("position", new T.BufferAttribute(wPos, 3));
    var wave = new T.Line(wGeo, new T.LineBasicMaterial({ color: 0xdbe751, toneMapped: false }));
    wave.position.set(0, 3.9, -2.6);
    sc.add(wave);
    var wFrame = new T.Mesh(new T.PlaneGeometry(9.6, 2.6), new T.MeshBasicMaterial({ color: 0x0b0426, transparent: true, opacity: 0.55 }));
    wFrame.position.set(0, 3.9, -2.7);
    sc.add(wFrame);
    var wLab = document.createElement("span");
    wLab.className = "bl-wave";
    var wA = new T.Object3D();
    wA.position.set(-4.6, 5.05, -2.6);
    sc.add(wA);
    st.pin(wLab, wA);
    var waveState = { amp: 0.0, freq: 1, targetAmp: 0, targetFreq: 1 };
    function drawWave(time) {
      waveState.amp += (waveState.targetAmp - waveState.amp) * 0.12;
      waveState.freq += (waveState.targetFreq - waveState.freq) * 0.12;
      for (var i = 0; i < WN; i++) {
        var x = (i / (WN - 1)) * 9 - 4.5;
        var y = Math.sin((i / (WN - 1)) * Math.PI * 2 * 6 * waveState.freq - time * 6) * waveState.amp;
        wPos[i * 3] = x;
        wPos[i * 3 + 1] = y;
        wPos[i * 3 + 2] = 0;
      }
      wGeo.attributes.position.needsUpdate = true;
    }

    var cur = null;
    var camState = { x: 1, y: 8.8, z: 15.2, lx: 1, ly: 1.3, lz: -1.8 };
    st.onFrame(function (dt, time) {
      cam.position.set(camState.x + Math.sin(time * 0.2) * 0.5, camState.y, camState.z);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      drawWave(time);
      stars.rotation.y += dt * 0.01;
      // decay pads + speaker
      pads.forEach(function (row) {
        row.forEach(function (pad) {
          if (pad.userData.flash > 0) {
            pad.userData.flash = Math.max(0, pad.userData.flash - dt * 4);
            pad.scale.y = 1 + pad.userData.flash * 1.6;
            pad.material.emissiveIntensity = pad.userData.base + pad.userData.flash * 2.5;
          }
        });
      });
      cone.position.z += (1.42 - cone.position.z) * 0.25;
      cap.position.z += (1.0 - cap.position.z) * 0.25;
      capM.emissiveIntensity += (0.4 - capM.emissiveIntensity) * 0.1;
      eq.forEach(function (col, i) {
        var target = col.userData.target || 0.4;
        col.userData.level = (col.userData.level || 0.4) + (target - (col.userData.level || 0.4)) * 0.2;
        col.scale.y = col.userData.level;
        col.position.y = col.userData.level / 2;
        col.userData.target = Math.max(0.4, (col.userData.target || 0.4) - dt * 3);
      });
      if (!playing) {
        dj.userData.rig.position.y = Math.sin(time * 2) * 0.03;
      }
    });

    function paint(p) {
      var rows = [steps(p.kick), steps(p.clap), steps(p.hat), p.melody ? steps("x.x.x.x.x.x.x.x.") : steps("")];
      rows.forEach(function (r, ri) {
        r.forEach(function (on, si) {
          var pad = pads[ri][si];
          pad.userData.base = on ? (ri === 3 ? 0.9 : 1.1) : 0;
          pad.material.emissiveIntensity = pad.userData.base;
          pad.material.color.set(on ? 0x302470 : 0x1c1448);
          if (ri === 3) {
            var noteIndex = si / 2;
            var h = on ? 0.3 + (MELODY_HEIGHT[MELODY[noteIndex]] || 1) * p.pitch * 0.45 : 0.22;
            pad.userData.h = h;
            pad.scale.y = on ? h / 0.22 : 1;
            pad.position.y = on ? h / 2 : 0.11;
          }
        });
      });
      waveState.targetAmp = p.melody ? 0.25 + (p.volume / 100) * 0.85 : 0.05;
      waveState.targetFreq = p.melody ? p.pitch : 0.5;
      wLab.innerHTML = p.melody ? "<b>" + Math.round(hz(MELODY[0]) * p.pitch) + " Hz</b> · volume " + p.volume + "%" : "<b>No melody yet</b>";
      ringGlow.material.color.set(p.bass ? 0xdbe751 : 0xef6fb0);
    }
    var MELODY_HEIGHT = { C4: 1, D4: 1.25, E4: 1.5, G4: 2, A4: 2.3 };

    function set(p) {
      cur = JSON.parse(JSON.stringify(p));
      paint(p);
    }

    var playing = false;
    var STEP_COL = [];
    function stepX(s) {
      return -6.9 + s * 0.92 + Math.floor(s / 4) * 0.28;
    }

    // Play `bars` bars of p, scheduling sound and lights together
    function play(p, bars) {
      playing = true;
      var spb = 60 / p.bpm;
      var stepDur = spb / 4;
      var total = bars * 16;
      var rows = [steps(p.kick), steps(p.clap), steps(p.hat)];
      var vol = (p.volume || 70) / 100;
      var fadeFrom = p.fade ? total - p.fade * 4 : total + 1;
      // schedule the sound up front (the audio clock keeps it tight)
      for (var i = 0; i < total; i++) {
        var s = i % 16;
        var when = i * stepDur + 0.08;
        var g = i >= fadeFrom ? Math.max(0.05, 1 - (i - fadeFrom) / (p.fade * 4)) : 1;
        if (!CX.sound) break;
        if (rows[0][s]) CX.sound.at(when, "drum", { vol: 0.9 * g });
        if (rows[1][s]) CX.sound.at(when, "clap", { vol: 0.9 * g });
        if (rows[2][s]) CX.sound.at(when, "hat", { vol: 0.8 * g });
        if (p.melody && s % 2 === 0) {
          var n = MELODY[s / 2];
          CX.sound.at(when, "note", { freq: hz(n) * p.pitch, dur: stepDur * 1.8, amp: vol, vol: g });
          if (p.bass && s % 4 === 0) CX.sound.at(when, "note", { freq: (hz(n) * p.pitch) / 2, dur: stepDur * 3.6, amp: vol * 0.8, vol: g });
        }
      }
      var t = 0;
      var lastStep = -1;
      head.material.opacity = 0.85;
      return new Promise(function (resolve) {
        st.onFrame(function (dt) {
          t += dt;
          var i = Math.floor((t - 0.08) / stepDur);
          if (i >= total) {
            head.material.opacity = 0;
            playing = false;
            resolve();
            return false;
          }
          if (i >= 0 && i !== lastStep) {
            lastStep = i;
            var s2 = i % 16;
            head.position.x = stepX(s2);
            var g2 = i >= fadeFrom ? Math.max(0.05, 1 - (i - fadeFrom) / (p.fade * 4)) : 1;
            [rows[0], rows[1], rows[2]].forEach(function (r, ri) {
              if (r[s2]) {
                pads[ri][s2].userData.flash = 1 * g2;
                if (ri === 0) {
                  cone.position.z = 1.42 + 0.35 * g2;
                  cap.position.z = 1.0 + 0.35 * g2;
                  capM.emissiveIntensity = 3 * g2;
                  dj.userData.rig.position.y = 0.12;
                  eq.forEach(function (col, k) {
                    col.userData.target = 1 + Math.abs(Math.sin(k * 1.7 + i)) * 4 * g2;
                  });
                }
                if (ri === 1) CX.three.burst(st, new T.Vector3(stepX(s2), 0.5, -0.85), { count: 14, colour: 0xf6a26b, speed: 2.4, gravity: 3, life: 0.6, size: 0.14 });
              }
            });
            if (p.melody && s2 % 2 === 0) {
              pads[3][s2].userData.flash = 0.6 * g2;
              waveState.targetFreq = p.pitch * (MELODY_HEIGHT[MELODY[s2 / 2]] || 1) * 0.8;
              tweet.material.emissiveIntensity = 1.5 * g2;
            } else tweet.material.emissiveIntensity = 0.3;
            dj.userData.rig.rotation.z = s2 % 4 < 2 ? 0.08 : -0.08;
          }
          dj.userData.rig.position.y *= 0.85;
        });
      }).then(function () {
        if (p.melody) waveState.targetFreq = p.pitch;
      });
    }

    function run(p) {
      if (!p.bpm) return Promise.resolve({});
      paint(p);
      dj.userData.setFace("grin");
      return st.wait(0.3).then(function () {
        return play(p, 2);
      }).then(function () {
        dj.userData.setFace("happy");
        return { metrics: measure(p) };
      });
    }

    function runTests(list) {
      var labels = [];
      var seqP = Promise.resolve();
      list.forEach(function (item, i) {
        seqP = seqP.then(function () {
          paint(item.params);
          var lab = document.createElement("span");
          lab.className = "bl-test";
          lab.innerHTML = "<b>" + U.esc(item.label) + "</b> " + Math.round(hz(MELODY[0]) * item.params.pitch) + " Hz";
          var a = new T.Object3D();
          a.position.set(-3 + i * 3, 6.2, -2.6);
          sc.add(a);
          labels.push(st.pin(lab, a));
          return play(item.params, 1);
        });
      });
      return seqP.then(function () {
        st.wait(5).then(function () {
          labels.forEach(function (l) {
            l.remove();
          });
        });
        return { tests: list.length };
      });
    }

    function anchor(key) {
      var a = new T.Object3D();
      var spots = { bpm: [0, 1.6, -4.6], kick: [stepX(8), 0.4, -1.9], clap: [stepX(4), 0.4, -0.85], hat: [stepX(10), 0.4, 0.2], pitch: [2.6, 5.0, -2.6], volume: [-2.4, 5.0, -2.6], bass: [9.6, 4.6, -2.4], fade: [5.6, 0.4, 1.3], name: [0, 2.9, -5.2] };
      var s = spots[key];
      if (!s) return null;
      a.position.set(s[0], s[1], s[2]);
      sc.add(a);
      return a;
    }

    function celebrate() {
      CX.three.confetti(st, new T.Vector3(0, 3, -3), { count: 160 });
      dj.userData.setFace("love");
    }

    function snapshot() {
      var keep = Object.assign({}, camState);
      Object.assign(camState, { x: -3.5, y: 5.6, z: 9.5, lx: 0.8, ly: 1.8, lz: -2.2 });
      cam.position.set(camState.x, camState.y, camState.z);
      cam.lookAt(camState.lx, camState.ly, camState.lz);
      var url = st.snapshot("image/jpeg", 0.92);
      Object.assign(camState, keep);
      return url;
    }

    return { stage: st, set: set, run: run, runTests: runTests, anchor: anchor, celebrate: celebrate, snapshot: snapshot, dispose: st.dispose };
  }

  function product(p) {
    var m = measure(p);
    return {
      kind: "My Track",
      title: p.name || "My track",
      facts: [
        { k: "Tempo", v: p.bpm + " BPM" },
        { k: "One beat lasts", v: U.round(60 / p.bpm, 2) + " s" },
        { k: "Melody starts on", v: m.hz ? Math.round(m.hz) + " Hz" : "—" },
        { k: "Bassline", v: p.bass ? Math.round(m.hz / 2) + " Hz (an octave lower)" : "none" },
        { k: "Drum hits per bar", v: String(m.hits) },
        { k: "Ending", v: p.fade ? "fades over " + p.fade + " beats" : "stops" },
      ],
      science: "Seconds per beat = 60 ÷ BPM. Double the frequency and a note sounds one octave higher; volume changes how big the vibrations are, not the pitch.",
    };
  }

  var def = {
    id: "beat",
    n: 3,
    title: "Beat Lab",
    short: "Beat",
    colour: "teal",
    interest: { id: "music", label: "Music", icon: "wave" },
    tagline: "Build a track beat by beat, and learn why some notes sound higher than others.",
    subjects: [
      { k: "Science", t: "Sound: pitch, frequency and volume", icon: "flask" },
      { k: "Maths", t: "Fractions of a beat, 60 ÷ BPM, doubling", icon: "graph" },
    ],
    product: product,
    productName: "My Track",
    lexicon: { details: /\b(kick|clap|snare|hi-?hat|drums?|melody|bassline|bass|fade|tune|notes?|beats?)\b/ },
    start: { bpm: null, kick: "................", clap: "................", hat: "................", melody: false, pitch: 1, volume: 70, bass: false, fade: 0, name: "" },
    params: {
      bpm: { label: "Tempo", fmt: function (v) {
        return v ? v + " BPM" : "—";
      } },
      kick: { label: "Kick", fmt: function (v) {
        return count(v) + " per bar";
      } },
      clap: { label: "Clap", fmt: function (v) {
        return count(v) + " per bar";
      } },
      hat: { label: "Hi-hat", fmt: function (v) {
        return count(v) + " per bar";
      } },
      melody: { label: "Melody", fmt: function (v) {
        return v ? "8 notes" : "none";
      } },
      pitch: { label: "Frequency", fmt: function (v) {
        return "×" + v + " (" + Math.round(hz(MELODY[0]) * v) + " Hz)";
      } },
      volume: { label: "Volume", fmt: function (v) {
        return v + "%";
      } },
      bass: { label: "Bassline", fmt: function (v) {
        return v ? "yes" : "none";
      } },
      fade: { label: "Fade out", fmt: function (v) {
        return v ? v + " beats" : "none";
      } },
      name: { label: "Name", fmt: function (v) {
        return v || "not named";
      } },
    },
    causes: ["bpm", "pitch", "volume"],
    metrics: [
      { key: "beat", label: "One beat lasts", icon: "clock" },
      { key: "hits", label: "Drum hits per bar", icon: "grid" },
      { key: "hz", label: "Melody pitch", icon: "wave" },
      { key: "loud", label: "Volume", icon: "volume" },
    ],
    metricSpec: {
      beat: { unit: "s", dp: 2 },
      hits: { dp: 0 },
      hz: { unit: "Hz", dp: 0 },
      loud: { unit: "%", dp: 0 },
    },
    tableMetrics: ["hz", "beat", "loud"],
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
