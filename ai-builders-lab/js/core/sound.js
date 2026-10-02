/* ==========================================================================
   Sound: every sound is synthesised with the Web Audio API, so there are no
   audio files to download and nothing for a school network to block.
   The same voices play live in the browser and can be rendered offline
   (OfflineAudioContext). The demo video uses offline rendering to get a
   soundtrack that lines up exactly with the picture.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var AC = window.AudioContext || window.webkitAudioContext;

  /* ---- Graph --------------------------------------------------------------- */
  function impulse(ctx, seconds, decay) {
    var rate = ctx.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    var rand = CX.util.rng(424242);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function noiseBuffer(ctx) {
    if (ctx.__cxNoise) return ctx.__cxNoise;
    var len = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var rand = CX.util.rng(99);
    for (var i = 0; i < len; i++) d[i] = rand() * 2 - 1;
    ctx.__cxNoise = buf;
    return buf;
  }

  function graph(ctx) {
    var master = ctx.createGain();
    master.gain.value = 0.9;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    master.connect(comp);
    comp.connect(ctx.destination);

    var verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.2, 2.8);
    var verbOut = ctx.createGain();
    verbOut.gain.value = 0.28;
    verb.connect(verbOut);
    verbOut.connect(master);

    var sfx = ctx.createGain();
    sfx.gain.value = 0.85;
    sfx.connect(master);
    var sfxSend = ctx.createGain();
    sfxSend.gain.value = 0.32;
    sfx.connect(sfxSend);
    sfxSend.connect(verb);

    var music = ctx.createGain();
    music.gain.value = 0.6;
    music.connect(master);
    var musicSend = ctx.createGain();
    musicSend.gain.value = 0.45;
    music.connect(musicSend);
    musicSend.connect(verb);

    // A tempo-free echo for plucks and sparkles
    var delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.27;
    var fb = ctx.createGain();
    fb.gain.value = 0.32;
    var dlp = ctx.createBiquadFilter();
    dlp.type = "lowpass";
    dlp.frequency.value = 3200;
    delay.connect(dlp);
    dlp.connect(fb);
    fb.connect(delay);
    var echoOut = ctx.createGain();
    echoOut.gain.value = 0.5;
    dlp.connect(echoOut);
    echoOut.connect(master);

    return { ctx: ctx, master: master, sfx: sfx, music: music, verb: verb, echo: delay };
  }

  /* ---- Building blocks ------------------------------------------------------ */
  function vol(o, base) {
    return (base == null ? 1 : base) * (o && o.vol != null ? o.vol : 1);
  }

  function gainTo(c, dest, value) {
    var g = c.createGain();
    g.gain.value = value == null ? 0 : value;
    g.connect(dest);
    return g;
  }

  // Attack/decay envelope on an AudioParam (exponential tail)
  function env(p, t, a, d, peak) {
    p.cancelScheduledValues(t);
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(Math.max(0.0002, peak), t + a);
    p.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  // Attack/hold/release envelope (for notes and pads)
  function ahr(p, t, a, h, r, peak) {
    p.cancelScheduledValues(t);
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.setValueAtTime(peak, t + a + h);
    p.exponentialRampToValueAtTime(0.0001, t + a + h + r);
  }

  function tone(c, dest, type, freq, t, dur, peak, o) {
    o = o || {};
    var s = c.createOscillator();
    s.type = type;
    s.frequency.setValueAtTime(freq, t);
    if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    if (o.detune) s.detune.value = o.detune;
    var g = gainTo(c, dest);
    s.connect(g);
    env(g.gain, t, o.a || 0.005, dur, peak);
    s.start(t);
    s.stop(t + (o.a || 0.005) + dur + 0.05);
    return s;
  }

  function noise(c, dest, t, dur, peak, o) {
    o = o || {};
    var src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    var last = src;
    if (o.type) {
      var f = c.createBiquadFilter();
      f.type = o.type;
      f.frequency.setValueAtTime(o.freq || 1000, t);
      if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
      f.Q.value = o.q || 1;
      last.connect(f);
      last = f;
    }
    var g = gainTo(c, dest);
    last.connect(g);
    if (o.hold) ahr(g.gain, t, o.a || 0.01, o.hold, dur, peak);
    else env(g.gain, t, o.a || 0.002, dur, peak);
    src.start(t, (o.offset || 0) % 1.9);
    src.stop(t + (o.a || 0.002) + (o.hold || 0) + dur + 0.05);
    return g;
  }

  function bell(c, dest, freq, t, dur, peak) {
    tone(c, dest, "sine", freq, t, dur, peak);
    tone(c, dest, "sine", freq * 2.01, t, dur * 0.6, peak * 0.35);
    tone(c, dest, "sine", freq * 3.98, t, dur * 0.3, peak * 0.12);
  }

  function hz(note) {
    // "C4", "F#3", "Bb5" → frequency
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
    if (!m) return 440;
    var n = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    var midi = (parseInt(m[3], 10) + 1) * 12 + n;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* ---- Voices: (context, bus, startTime, options) ----------------------------- */
  var V = {};

  V.tap = function (c, b, t, o) {
    var p = (o && o.pitch) || 1;
    tone(c, b.sfx, "sine", 1600 * p, t, 0.06, vol(o, 0.16), { to: 820 * p, glide: 0.05 });
    noise(c, b.sfx, t, 0.02, vol(o, 0.05), { type: "highpass", freq: 5000 });
  };
  V.hover = function (c, b, t, o) {
    tone(c, b.sfx, "sine", 2400, t, 0.03, vol(o, 0.035));
  };
  V.select = function (c, b, t, o) {
    tone(c, b.sfx, "triangle", hz("E6"), t, 0.08, vol(o, 0.12));
    tone(c, b.sfx, "triangle", hz("B6"), t + 0.055, 0.12, vol(o, 0.1));
  };
  V.toggle = function (c, b, t, o) {
    var on = !o || o.on !== false;
    tone(c, b.sfx, "sine", on ? 660 : 880, t, 0.05, vol(o, 0.12));
    tone(c, b.sfx, "sine", on ? 990 : 590, t + 0.05, 0.08, vol(o, 0.12));
  };
  V.whoosh = function (c, b, t, o) {
    var up = !o || o.dir !== "down";
    noise(c, b.sfx, t, 0.42, vol(o, 0.22), { type: "bandpass", freq: up ? 380 : 3200, to: up ? 3600 : 360, glide: 0.38, q: 1.6, a: 0.12 });
  };
  V.swoosh = function (c, b, t, o) {
    noise(c, b.sfx, t, 0.22, vol(o, 0.14), { type: "bandpass", freq: 1200, to: 5200, glide: 0.2, q: 2, a: 0.04 });
  };
  V.pop = function (c, b, t, o) {
    var p = (o && o.pitch) || 1;
    tone(c, b.sfx, "sine", 520 * p, t, 0.11, vol(o, 0.2), { to: 1240 * p, glide: 0.05 });
  };
  V.ping = function (c, b, t, o) {
    var p = (o && o.pitch) || 1;
    bell(c, b.sfx, 1318.5 * p, t, 0.5, vol(o, 0.09));
  };
  V.tick = function (c, b, t, o) {
    var p = (o && o.pitch) || 1;
    tone(c, b.sfx, "square", 2200 * p, t, 0.012, vol(o, 0.03));
  };
  V.type = function (c, b, t, o) {
    var p = 0.85 + (((o && o.seed) || 0) % 5) * 0.06;
    noise(c, b.sfx, t, 0.018, vol(o, 0.05), { type: "bandpass", freq: 3200 * p, q: 3 });
    tone(c, b.sfx, "sine", 180 * p, t, 0.02, vol(o, 0.03));
  };
  V.success = function (c, b, t, o) {
    ["C5", "E5", "G5", "C6"].forEach(function (n, i) {
      tone(c, b.sfx, "triangle", hz(n), t + i * 0.075, 0.38, vol(o, 0.11));
      tone(c, b.sfx, "sine", hz(n) * 2, t + i * 0.075, 0.22, vol(o, 0.04));
    });
    bell(c, b.sfx, hz("G6"), t + 0.3, 0.9, vol(o, 0.05));
  };
  V.fanfare = function (c, b, t, o) {
    var chord = ["C4", "G4", "C5", "E5", "G5"];
    chord.forEach(function (n, i) {
      var s1 = c.createOscillator(),
        s2 = c.createOscillator();
      s1.type = s2.type = "sawtooth";
      s1.frequency.value = hz(n);
      s2.frequency.value = hz(n);
      s2.detune.value = 9;
      var f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(600, t);
      f.frequency.exponentialRampToValueAtTime(3800, t + 0.25);
      f.frequency.exponentialRampToValueAtTime(900, t + 1.4);
      var g = gainTo(c, b.sfx);
      s1.connect(f);
      s2.connect(f);
      f.connect(g);
      ahr(g.gain, t + i * 0.03, 0.04, 0.35, 1.1, vol(o, 0.045));
      s1.start(t);
      s2.start(t);
      s1.stop(t + 1.8);
      s2.stop(t + 1.8);
    });
    V.sparkle(c, b, t + 0.15, { vol: vol(o, 1.1), n: 10 });
  };
  V.error = function (c, b, t, o) {
    tone(c, b.sfx, "triangle", 330, t, 0.16, vol(o, 0.14), { to: 300 });
    tone(c, b.sfx, "triangle", 247, t + 0.14, 0.26, vol(o, 0.14), { to: 220 });
  };
  V.guess = function (c, b, t, o) {
    // A curious "hmm?": the AI filled something in by itself
    tone(c, b.sfx, "sine", 560, t, 0.14, vol(o, 0.12), { to: 700, glide: 0.12 });
    tone(c, b.sfx, "sine", 640, t + 0.16, 0.2, vol(o, 0.12), { to: 900, glide: 0.18 });
  };
  V.sparkle = function (c, b, t, o) {
    var rand = CX.util.rng(Math.floor(t * 1000) + 7);
    var n = (o && o.n) || 7;
    for (var i = 0; i < n; i++) {
      var f = 1800 + rand() * 3200;
      tone(c, b.sfx, "sine", f, t + i * 0.045 + rand() * 0.02, 0.18, vol(o, 0.035));
    }
    try {
      var g = gainTo(c, b.echo, vol(o, 0.25));
      tone(c, g, "sine", 2637, t, 0.2, 0.2);
    } catch (e) {}
  };
  V.think = function (c, b, t, o) {
    // AI working: soft rising shimmer, about a second long
    var d = (o && o.dur) || 1;
    var s = c.createOscillator();
    s.type = "sine";
    s.frequency.setValueAtTime(420, t);
    s.frequency.exponentialRampToValueAtTime(880, t + d);
    var lfo = c.createOscillator();
    lfo.frequency.value = 9;
    var lg = c.createGain();
    lg.gain.value = 28;
    lfo.connect(lg);
    lg.connect(s.frequency);
    var g = gainTo(c, b.sfx);
    s.connect(g);
    ahr(g.gain, t, 0.15, d * 0.6, 0.3, vol(o, 0.05));
    s.start(t);
    lfo.start(t);
    s.stop(t + d + 0.5);
    lfo.stop(t + d + 0.5);
    V.sparkle(c, b, t + 0.1, { vol: vol(o, 0.8), n: Math.round(6 * d) });
  };
  V.apply = function (c, b, t, o) {
    // AI applies a change: whirr up into a chime
    noise(c, b.sfx, t, 0.35, vol(o, 0.12), { type: "bandpass", freq: 600, to: 4200, glide: 0.32, q: 3, a: 0.05 });
    tone(c, b.sfx, "triangle", 330, t, 0.3, vol(o, 0.07), { to: 990, glide: 0.3 });
    bell(c, b.sfx, hz("E6"), t + 0.3, 0.6, vol(o, 0.07));
  };
  V.undo = function (c, b, t, o) {
    noise(c, b.sfx, t, 0.3, vol(o, 0.12), { type: "bandpass", freq: 3200, to: 400, glide: 0.28, q: 2, a: 0.03 });
    tone(c, b.sfx, "triangle", 880, t, 0.25, vol(o, 0.07), { to: 330, glide: 0.24 });
  };
  V.keep = function (c, b, t, o) {
    tone(c, b.sfx, "triangle", hz("G5"), t, 0.12, vol(o, 0.12));
    tone(c, b.sfx, "triangle", hz("C6"), t + 0.07, 0.3, vol(o, 0.12));
    noise(c, b.sfx, t, 0.03, vol(o, 0.06), { type: "highpass", freq: 3000 });
  };
  V.count = function (c, b, t, o) {
    var p = (o && o.pitch) || 1;
    tone(c, b.sfx, "sine", 880 * p, t, 0.05, vol(o, 0.06));
  };
  V.levelup = function (c, b, t, o) {
    ["G4", "C5", "E5", "G5", "C6", "E6"].forEach(function (n, i) {
      tone(c, b.sfx, "square", hz(n), t + i * 0.06, 0.12, vol(o, 0.035));
      tone(c, b.sfx, "triangle", hz(n), t + i * 0.06, 0.3, vol(o, 0.08));
    });
  };
  V.open = function (c, b, t, o) {
    tone(c, b.sfx, "sine", 400, t, 0.12, vol(o, 0.1), { to: 800, glide: 0.1 });
    noise(c, b.sfx, t, 0.16, vol(o, 0.05), { type: "bandpass", freq: 900, to: 2600, glide: 0.14 });
  };
  V.close = function (c, b, t, o) {
    tone(c, b.sfx, "sine", 800, t, 0.12, vol(o, 0.08), { to: 400, glide: 0.1 });
  };

  /* ---- Space ---- */
  V.jump = function (c, b, t, o) {
    var h = (o && o.height) || 1; // bigger jumps sound longer and higher
    var d = Math.min(1.4, 0.25 + h * 0.18);
    tone(c, b.sfx, "sine", 180, t, d, vol(o, 0.18), { to: 520 + Math.min(500, h * 80), glide: d * 0.8 });
    tone(c, b.sfx, "triangle", 360, t, d * 0.6, vol(o, 0.05), { to: 1000, glide: d * 0.6 });
    noise(c, b.sfx, t, 0.08, vol(o, 0.08), { type: "lowpass", freq: 900 });
  };
  V.land = function (c, b, t, o) {
    tone(c, b.sfx, "sine", 140, t, 0.22, vol(o, 0.3), { to: 48, glide: 0.18 });
    noise(c, b.sfx, t, 0.25, vol(o, 0.16), { type: "lowpass", freq: 1400, to: 200, glide: 0.2 });
  };
  V.drift = function (c, b, t, o) {
    // Floating away: a theremin glide downwards
    var s = c.createOscillator();
    s.type = "sine";
    s.frequency.setValueAtTime(880, t);
    s.frequency.exponentialRampToValueAtTime(220, t + 2.6);
    var lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    var lg = c.createGain();
    lg.gain.value = 14;
    lfo.connect(lg);
    lg.connect(s.frequency);
    var g = gainTo(c, b.sfx);
    s.connect(g);
    ahr(g.gain, t, 0.2, 1.8, 0.8, vol(o, 0.09));
    s.start(t);
    lfo.start(t);
    s.stop(t + 3);
    lfo.stop(t + 3);
  };
  V.morph = function (c, b, t, o) {
    // A planet reshaping itself
    noise(c, b.sfx, t, 0.9, vol(o, 0.12), { type: "bandpass", freq: 200, to: 1600, glide: 0.8, q: 4, a: 0.1 });
    tone(c, b.sfx, "sine", 110, t, 0.9, vol(o, 0.12), { to: 220, glide: 0.8 });
    V.sparkle(c, b, t + 0.5, { vol: vol(o, 0.7), n: 6 });
  };
  V.orbit = function (c, b, t, o) {
    tone(c, b.sfx, "sine", 220, t, 1.2, vol(o, 0.05), { a: 0.4 });
    tone(c, b.sfx, "sine", 330, t + 0.1, 1.1, vol(o, 0.04), { a: 0.4 });
  };

  /* ---- Sport ---- */
  V.kick = function (c, b, t, o) {
    var p = (o && o.power) || 0.8;
    tone(c, b.sfx, "sine", 160, t, 0.14, vol(o, 0.42 * (0.6 + p * 0.5)), { to: 60, glide: 0.1 });
    noise(c, b.sfx, t, 0.07, vol(o, 0.3), { type: "bandpass", freq: 1800, q: 1.2 });
  };
  V.thud = function (c, b, t, o) {
    tone(c, b.sfx, "sine", 110, t, 0.16, vol(o, 0.28), { to: 55, glide: 0.12 });
    noise(c, b.sfx, t, 0.12, vol(o, 0.12), { type: "lowpass", freq: 700 });
  };
  V.bonk = function (c, b, t, o) {
    // Ball hits the wall of defenders
    tone(c, b.sfx, "triangle", 300, t, 0.14, vol(o, 0.18), { to: 160, glide: 0.1 });
    noise(c, b.sfx, t, 0.1, vol(o, 0.12), { type: "bandpass", freq: 900 });
  };
  V.net = function (c, b, t, o) {
    noise(c, b.sfx, t, 0.45, vol(o, 0.14), { type: "highpass", freq: 2400, to: 900, glide: 0.4, a: 0.02 });
  };
  V.crowd = function (c, b, t, o) {
    // Cheer (o.mood = "cheer") or a disappointed "ohhh" (o.mood = "groan")
    var cheer = !o || o.mood !== "groan";
    var d = cheer ? 2.4 : 1.4;
    for (var i = 0; i < 4; i++) {
      noise(c, b.sfx, t + i * 0.03, d, vol(o, cheer ? 0.07 : 0.06), {
        type: "bandpass",
        freq: cheer ? 700 + i * 380 : 600 - i * 60,
        to: cheer ? 900 + i * 420 : 260,
        glide: d * 0.9,
        q: 0.9,
        a: cheer ? 0.25 : 0.12,
        hold: cheer ? 0.6 : 0.1,
        offset: i * 0.37,
      });
    }
    if (cheer) {
      var rand = CX.util.rng(31);
      for (var k = 0; k < 6; k++) tone(c, b.sfx, "sine", 2000 + rand() * 1400, t + 0.2 + rand() * 1, 0.08, vol(o, 0.02), { to: 2600 + rand() * 900 });
    }
  };
  V.whistle = function (c, b, t, o) {
    var s = c.createOscillator();
    s.type = "sine";
    s.frequency.value = 2900;
    var lfo = c.createOscillator();
    lfo.frequency.value = 38;
    var lg = c.createGain();
    lg.gain.value = 140;
    lfo.connect(lg);
    lg.connect(s.frequency);
    var g = gainTo(c, b.sfx);
    s.connect(g);
    ahr(g.gain, t, 0.02, 0.3, 0.12, vol(o, 0.06));
    s.start(t);
    lfo.start(t);
    s.stop(t + 0.6);
    lfo.stop(t + 0.6);
  };

  /* ---- Music (Beat Lab) ---- */
  V.drum = function (c, b, t, o) {
    var bus = (o && o.bus === "sfx") || !b.beat ? b.sfx : b.beat;
    tone(c, bus, "sine", 150, t, 0.42, vol(o, 0.75), { to: 42, glide: 0.12, a: 0.002 });
    tone(c, bus, "triangle", 900, t, 0.012, vol(o, 0.18), { a: 0.001 });
  };
  V.clap = function (c, b, t, o) {
    var bus = b.beat || b.sfx;
    [0, 0.011, 0.022].forEach(function (dt) {
      noise(c, bus, t + dt, 0.025, vol(o, 0.28), { type: "bandpass", freq: 1400, q: 1.4 });
    });
    noise(c, bus, t + 0.03, 0.16, vol(o, 0.18), { type: "bandpass", freq: 1200, q: 1 });
  };
  V.hat = function (c, b, t, o) {
    var bus = b.beat || b.sfx;
    noise(c, bus, t, (o && o.open) ? 0.18 : 0.045, vol(o, 0.12), { type: "highpass", freq: 7500 });
  };
  V.note = function (c, b, t, o) {
    // A melody note. o.freq in Hz (or o.note like "E4"), o.dur seconds, o.amp 0..1 (volume)
    o = o || {};
    var bus = b.beat || b.sfx;
    var f = o.freq || hz(o.note || "C4");
    var dur = o.dur || 0.25;
    var amp = (o.amp == null ? 0.5 : o.amp) * vol(o, 0.34);
    var s1 = c.createOscillator(),
      s2 = c.createOscillator();
    s1.type = "triangle";
    s2.type = "sawtooth";
    s1.frequency.value = f;
    s2.frequency.value = f;
    s2.detune.value = 7;
    var flt = c.createBiquadFilter();
    flt.type = "lowpass";
    flt.frequency.setValueAtTime(Math.min(12000, f * 7), t);
    flt.frequency.exponentialRampToValueAtTime(Math.min(8000, f * 2.2), t + dur);
    var g2 = c.createGain();
    g2.gain.value = 0.22;
    s1.connect(flt);
    s2.connect(g2);
    g2.connect(flt);
    var g = gainTo(c, bus);
    flt.connect(g);
    ahr(g.gain, t, 0.008, Math.max(0.01, dur * 0.55), dur * 0.7, amp);
    s1.start(t);
    s2.start(t);
    s1.stop(t + dur * 1.4 + 0.1);
    s2.stop(t + dur * 1.4 + 0.1);
  };

  /* ---- Energy (Power Town) ---- */
  V.powerup = function (c, b, t, o) {
    var s = c.createOscillator();
    s.type = "sawtooth";
    s.frequency.setValueAtTime(55, t);
    s.frequency.exponentialRampToValueAtTime(220, t + 0.9);
    var f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
    var g = gainTo(c, b.sfx);
    s.connect(f);
    f.connect(g);
    ahr(g.gain, t, 0.1, 0.7, 0.4, vol(o, 0.07));
    s.start(t);
    s.stop(t + 1.4);
    bell(c, b.sfx, hz("A5"), t + 0.85, 0.7, vol(o, 0.06));
  };
  V.powerdown = function (c, b, t, o) {
    var s = c.createOscillator();
    s.type = "sawtooth";
    s.frequency.setValueAtTime(240, t);
    s.frequency.exponentialRampToValueAtTime(38, t + 1.1);
    var f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 1.1);
    var g = gainTo(c, b.sfx);
    s.connect(f);
    f.connect(g);
    ahr(g.gain, t, 0.02, 0.6, 0.6, vol(o, 0.1));
    s.start(t);
    s.stop(t + 1.5);
    noise(c, b.sfx, t, 0.08, vol(o, 0.12), { type: "highpass", freq: 3000 });
  };
  V.hum = function (c, b, t, o) {
    var d = (o && o.dur) || 1.5;
    tone(c, b.sfx, "sawtooth", 50, t, d, vol(o, 0.025), { a: 0.2 });
    tone(c, b.sfx, "sine", 100, t, d, vol(o, 0.04), { a: 0.2 });
  };
  V.wind = function (c, b, t, o) {
    var d = (o && o.dur) || 2.5;
    noise(c, b.sfx, t, d * 0.5, vol(o, 0.09), { type: "bandpass", freq: 300, to: 900, glide: d * 0.6, q: 0.8, a: d * 0.35, hold: d * 0.3 });
  };
  V.chime = function (c, b, t, o) {
    bell(c, b.sfx, hz((o && o.note) || "A5"), t, 0.8, vol(o, 0.08));
  };
  V.alarm = function (c, b, t, o) {
    for (var i = 0; i < 2; i++) {
      tone(c, b.sfx, "square", 740, t + i * 0.36, 0.14, vol(o, 0.035));
      tone(c, b.sfx, "square", 554, t + i * 0.36 + 0.17, 0.14, vol(o, 0.035));
    }
  };

  /* ---- Live engine ------------------------------------------------------------ */
  var live = null;
  var muted = false;
  var listeners = [];

  function enabled() {
    var s = CX.store && CX.store.state && CX.store.state.settings;
    return !muted && !(s && s.sound === false);
  }

  function ensure() {
    if (!AC) return null;
    if (!live) {
      try {
        var ctx = new AC({ latencyHint: "interactive" });
        live = graph(ctx);
        live.beat = gainTo(ctx, live.master, 0.9);
      } catch (err) {
        live = null;
        return null;
      }
    }
    if (live.ctx.state === "suspended") live.ctx.resume();
    return live;
  }

  function unlock() {
    if (enabled()) ensure();
  }
  ["pointerdown", "keydown", "touchstart"].forEach(function (type) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  });

  /* Recording (demo video): sounds are logged against the page clock and
     rendered offline afterwards, so they line up with the frames exactly. */
  var rec = null;

  function play(name, o, offset) {
    o = o || {};
    if (!V[name]) return;
    if (rec) {
      rec.events.push({ t: (performance.now() - rec.t0) / 1000 + (offset || 0) + (o.delay || 0), name: name, o: o });
      return;
    }
    if (!enabled()) return;
    var L = ensure();
    if (!L || L.ctx.state !== "running") return;
    try {
      V[name](L.ctx, L, L.ctx.currentTime + 0.005 + (offset || 0) + (o.delay || 0), o);
    } catch (err) {
      /* a missing node type on an old browser should never break the lesson */
    }
  }

  var throttle = {};

  CX.sound = {
    voices: V,
    hz: hz,
    play: function (name, o) {
      play(name, o, 0);
    },
    /* Schedule a sound a little in the future (seconds). Used by the Beat Lab
       sequencer, which looks ahead so beats stay tight. */
    at: function (offsetSec, name, o) {
      play(name, o, Math.max(0, offsetSec));
    },
    /* Play at most once per `ms` (typing, hover) */
    soft: function (name, ms, o) {
      var now = performance.now();
      if (throttle[name] && now - throttle[name] < ms) return;
      throttle[name] = now;
      play(name, o, 0);
    },
    get context() {
      return live ? live.ctx : null;
    },
    get enabled() {
      return enabled();
    },
    setEnabled: function (on) {
      if (CX.store) {
        CX.store.patch(function (s) {
          s.settings.sound = !!on;
        });
      }
      if (on) {
        ensure();
        play("toggle", { on: true }, 0);
      }
      listeners.forEach(function (fn) {
        fn(!!on);
      });
    },
    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (f) {
          return f !== fn;
        });
      };
    },
    mute: function (on) {
      muted = !!on;
    },

    /* ---- Offline rendering (used by tools/video) ------------------------------ */
    recordStart: function () {
      rec = { t0: performance.now(), events: [] };
    },
    recordStop: function () {
      var r = rec;
      rec = null;
      return r ? r.events : [];
    },
    get recording() {
      return !!rec;
    },
    render: function (events, seconds, opts) {
      opts = opts || {};
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      var rate = opts.rate || 48000;
      var ctx = new OAC(2, Math.ceil(rate * seconds), rate);
      var B = graph(ctx);
      B.beat = gainTo(ctx, B.master, 0.9);
      if (opts.bed && CX.sound.bed) CX.sound.bed(ctx, B, opts.bed);
      events.forEach(function (e) {
        if (e.t < 0 || e.t > seconds) return;
        try {
          V[e.name](ctx, B, e.t + 0.01, e.o || {});
        } catch (err) {}
      });
      return ctx.startRendering();
    },
    wav: function (buffer) {
      var ch = buffer.numberOfChannels,
        len = buffer.length,
        rate = buffer.sampleRate;
      var out = new DataView(new ArrayBuffer(44 + len * ch * 2));
      function str(o, s) {
        for (var i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i));
      }
      str(0, "RIFF");
      out.setUint32(4, 36 + len * ch * 2, true);
      str(8, "WAVE");
      str(12, "fmt ");
      out.setUint32(16, 16, true);
      out.setUint16(20, 1, true);
      out.setUint16(22, ch, true);
      out.setUint32(24, rate, true);
      out.setUint32(28, rate * ch * 2, true);
      out.setUint16(32, ch * 2, true);
      out.setUint16(34, 16, true);
      str(36, "data");
      out.setUint32(40, len * ch * 2, true);
      var data = [];
      for (var c = 0; c < ch; c++) data.push(buffer.getChannelData(c));
      var o = 44;
      for (var i = 0; i < len; i++) {
        for (var k = 0; k < ch; k++) {
          var v = Math.max(-1, Math.min(1, data[k][i]));
          out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
          o += 2;
        }
      }
      return out.buffer;
    },
    helpers: { tone: tone, noise: noise, bell: bell, env: env, ahr: ahr, gainTo: gainTo, noiseBuffer: noiseBuffer },
  };
})();
