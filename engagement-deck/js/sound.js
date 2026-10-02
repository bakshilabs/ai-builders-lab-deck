/* ==========================================================================
   Sound design, synthesised with the Web Audio API (no audio files).
   - Starts only after the first click, tap or key press (autoplay rules).
   - Mute with the speaker button or the M key. The choice is remembered.
   - Every call is safe: if audio is unavailable, nothing happens and no
     content ever waits for sound.
   ========================================================================== */
(function () {
  "use strict";

  var DECK = (window.DECK = window.DECK || {});
  var ctx = null;
  var out = null; // master gain
  var verb = null; // reverb send
  var noise = null;
  var unlocked = false;
  var muted = false;
  var pad = null;

  try {
    muted = window.localStorage.getItem("cx-deck:sound") === "off";
  } catch (err) {
    muted = false;
  }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (err) {
      ctx = null;
      return null;
    }
    out = ctx.createGain();
    out.gain.value = muted ? 0 : 0.85;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3.5;
    out.connect(comp);
    comp.connect(ctx.destination);

    // A small generated room, so chimes have air around them
    verb = ctx.createConvolver();
    var len = Math.floor(ctx.sampleRate * 1.8);
    var ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = ir.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = ir;
    var vg = ctx.createGain();
    vg.gain.value = 0.28;
    verb.connect(vg);
    vg.connect(out);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var nd = noise.getChannelData(0);
    for (var n = 0; n < nd.length; n++) nd[n] = Math.random() * 2 - 1;
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    var c = ensure();
    if (!c) return;
    unlocked = true;
    if (c.state === "suspended") c.resume();
    if (DECK.emit) DECK.emit("sound:unlocked");
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  });

  function ready() {
    return !!(ctx && unlocked && !muted && ctx.state === "running");
  }

  /* Tone helper: one oscillator with an envelope, optional reverb send */
  function tone(freq, opts) {
    opts = opts || {};
    var t = ctx.currentTime + (opts.delay || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = opts.type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.glide || 0.08));
    var peak = opts.gain || 0.08;
    var atk = opts.attack || 0.006;
    var dec = opts.decay || 0.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
    o.connect(g);
    g.connect(out);
    if (opts.verb) g.connect(verb);
    o.start(t);
    o.stop(t + atk + dec + 0.05);
  }

  var api = {
    /* Slide change: a soft filtered-air whoosh that pans with direction */
    whoosh: function (dir) {
      if (!ready()) return;
      try {
        var t = ctx.currentTime;
        var src = ctx.createBufferSource();
        src.buffer = noise;
        var bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 0.9;
        var f0 = dir < 0 ? 2600 : 380;
        var f1 = dir < 0 ? 420 : 2400;
        bp.frequency.setValueAtTime(f0, t);
        bp.frequency.exponentialRampToValueAtTime(f1, t + 0.42);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.11, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        var node = g;
        if (ctx.createStereoPanner) {
          var p = ctx.createStereoPanner();
          p.pan.setValueAtTime(dir < 0 ? 0.5 : -0.5, t);
          p.pan.linearRampToValueAtTime(dir < 0 ? -0.5 : 0.5, t + 0.5);
          g.connect(p);
          node = p;
        }
        src.connect(bp);
        bp.connect(g);
        node.connect(out);
        src.start(t);
        src.stop(t + 0.6);
      } catch (err) {
        /* never block */
      }
    },
    /* UI tick: tiny and woody */
    tick: function (pitch) {
      if (!ready()) return;
      try {
        tone(pitch || 1250, { type: "triangle", to: (pitch || 1250) * 0.62, glide: 0.04, gain: 0.05, decay: 0.07 });
      } catch (err) {
        /* never block */
      }
    },
    /* Build step: a soft rising pop */
    pop: function (dir) {
      if (!ready()) return;
      try {
        if (dir < 0) tone(820, { to: 520, glide: 0.08, gain: 0.05, decay: 0.12 });
        else tone(560, { to: 980, glide: 0.08, gain: 0.06, decay: 0.14, verb: true });
      } catch (err) {
        /* never block */
      }
    },
    /* Success: a bright little arpeggio */
    chime: function (big) {
      if (!ready()) return;
      try {
        var notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [1046.5, 1318.5, 1568];
        notes.forEach(function (f, i) {
          tone(f, { type: "sine", gain: big ? 0.07 : 0.05, decay: big ? 1.1 : 0.7, delay: i * (big ? 0.075 : 0.06), verb: true });
          tone(f * 2, { type: "triangle", gain: 0.012, decay: 0.4, delay: i * (big ? 0.075 : 0.06) });
        });
      } catch (err) {
        /* never block */
      }
    },
    /* A low "whomp" for something going wrong (a blackout, a short kick) */
    thud: function () {
      if (!ready()) return;
      try {
        tone(150, { type: "sine", to: 60, glide: 0.25, gain: 0.12, decay: 0.35 });
      } catch (err) {
        /* never block */
      }
    },
    /* Beat Lab voices: a kick drum, a clap and a soft melody note */
    kick: function () {
      if (!ready()) return;
      try {
        tone(150, { type: "sine", to: 42, glide: 0.16, gain: 0.24, attack: 0.003, decay: 0.3 });
      } catch (err) {
        /* never block */
      }
    },
    clap: function () {
      if (!ready()) return;
      try {
        var t = ctx.currentTime;
        var src = ctx.createBufferSource();
        src.buffer = noise;
        var bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1600;
        bp.Q.value = 1.4;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
        src.connect(bp);
        bp.connect(g);
        g.connect(out);
        g.connect(verb);
        src.start(t);
        src.stop(t + 0.18);
      } catch (err) {
        /* never block */
      }
    },
    note: function (freq) {
      if (!ready()) return;
      try {
        tone(freq, { type: "triangle", gain: 0.07, decay: 0.42, verb: true });
        tone(freq * 2, { type: "sine", gain: 0.015, decay: 0.25 });
      } catch (err) {
        /* never block */
      }
    },
    /* Ambient pad for the opening slide: quiet, slow, warm */
    pad: function (on) {
      if (!ctx || !unlocked) return;
      try {
        var t = ctx.currentTime;
        if (on && !pad && !muted) {
          var g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.03, t + 2.6);
          var lp = ctx.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.value = 680;
          lp.Q.value = 0.6;
          var lfo = ctx.createOscillator();
          var lfoG = ctx.createGain();
          lfo.frequency.value = 0.07;
          lfoG.gain.value = 260;
          lfo.connect(lfoG);
          lfoG.connect(lp.frequency);
          var oscs = [];
          [130.81, 196.0, 261.63, 329.63].forEach(function (f, i) {
            [-5, 5].forEach(function (cents) {
              var o = ctx.createOscillator();
              o.type = i % 2 ? "triangle" : "sine";
              o.frequency.value = f;
              o.detune.value = cents;
              o.connect(lp);
              o.start(t);
              oscs.push(o);
            });
          });
          lp.connect(g);
          g.connect(out);
          g.connect(verb);
          lfo.start(t);
          oscs.push(lfo);
          pad = { g: g, oscs: oscs };
        } else if (!on && pad) {
          var p = pad;
          pad = null;
          p.g.gain.cancelScheduledValues(t);
          p.g.gain.setValueAtTime(Math.max(0.0001, p.g.gain.value), t);
          p.g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
          p.oscs.forEach(function (o) {
            o.stop(t + 1.3);
          });
        }
      } catch (err) {
        /* never block */
      }
    },
    setMuted: function (m) {
      muted = !!m;
      try {
        window.localStorage.setItem("cx-deck:sound", muted ? "off" : "on");
      } catch (err) {
        /* private mode */
      }
      if (ctx && out) {
        var t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setTargetAtTime(muted ? 0 : 0.85, t, 0.05);
      }
      if (muted) api.pad(false);
      if (DECK.emit) DECK.emit("sound:mute", muted);
    },
    isMuted: function () {
      return muted;
    },
    isReady: ready,
  };

  DECK.sound = api;
})();
