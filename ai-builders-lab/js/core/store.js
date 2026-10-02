/* ==========================================================================
   Store: the learner's progress, kept on this device only (localStorage).
   Minimal data by design — a generated builder nickname, never a real name.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var KEY = "cx-ai-builders-lab:v2";
  var DAY = 86400000;

  function seed() {
    var now = Date.now();
    function v(n, s, prompt, count, guesses, metrics, at) {
      return { v: n, s: s, prompt: prompt, count: count, guesses: guesses, metrics: metrics, pass: true, kept: true, at: now - at * DAY };
    }
    return {
      v: 2,
      builder: { name: "Rocket Fox", colour: "pink", face: "happy", since: now - 21 * DAY },
      interests: ["space", "music"],
      unit: { build: "planet" },
      builds: {
        planet: {
          session: 4,
          done: [1, 2, 3],
          params: { look: "rocky", colour: "red", size: "small", gravity: 4.9, rings: false, ringColour: "pink", moons: 0, name: "" },
          versions: [
            v(1, 1, "Make a planet", 1, 4, { jump: 0.49, hang: 0.63, feels: 40 }, 21),
            v(2, 2, "Make a small red rocky planet like Mars", 2, 0, { jump: 1.3, hang: 1.68, feels: 15.1 }, 14),
            v(3, 3, "Make gravity half of Earth's so my astronaut jumps twice as high", 4, 0, { jump: 0.98, hang: 1.27, feels: 20 }, 7),
          ],
          predictions: { right: 2, total: 3 },
        },
        beat: {
          session: 2,
          done: [1],
          params: { bpm: 120, kick: "x...x...x...x...", clap: "................", hat: "xxxxxxxxxxxxxxxx", melody: false, pitch: 1, volume: 70, bass: false, fade: 0, name: "" },
          versions: [v(1, 1, "Make a beat", 1, 4, { beat: 0.5, hits: 20, hz: null, loud: 70 }, 20)],
          predictions: { right: 1, total: 1 },
        },
      },
      badges: ["guess-spotter", "detail-detective", "number-cruncher", "prediction-pro"],
      feedback: [
        {
          id: "fb-1",
          from: "Sam",
          role: "Instructor",
          at: now - 14 * DAY,
          text: "Great detail in session 2: “like Mars” told the AI the gravity, so it didn't have to guess anything. That's exactly what good prompts do.",
        },
        {
          id: "fb-2",
          from: "Sam",
          role: "Instructor",
          at: now - 7 * DAY,
          text: "You predicted “twice as high” before testing, and you were right. Next session: when the AI does what you said but not what you meant, add a limit.",
        },
      ],
      reflections: {},
      showcase: [],
      log: [],
      settings: { reduceMotion: false, sound: true, aiMode: "offline", quality: "high" },
      lesson: { checks: {}, format: "weekly" },
      stats: { prompts: 9, keeps: 4, undos: 2, tests: 6, whys: 2 },
    };
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return seed();
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== 2) return seed();
      // Fill any keys added since the state was saved
      var base = seed();
      Object.keys(base).forEach(function (k) {
        if (parsed[k] === undefined) parsed[k] = base[k];
      });
      return parsed;
    } catch (err) {
      return seed();
    }
  }

  var state = load();
  var saveTimer = null;

  function persist() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* Storage can be blocked by school policy — the lab still works in memory. */
    }
  }

  var store = (CX.store = {
    get state() {
      return state;
    },
    save: function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 150);
    },
    saveNow: function () {
      clearTimeout(saveTimer);
      persist();
    },
    patch: function (fn) {
      fn(state);
      store.save();
      CX.bus.emit("store:change", state);
      return state;
    },
    reset: function () {
      state = seed();
      store.saveNow();
      CX.bus.emit("store:change", state);
    },
    wipe: function () {
      try {
        window.localStorage.removeItem(KEY);
      } catch (err) {}
      state = seed();
      CX.bus.emit("store:change", state);
    },
    storageAvailable: function () {
      try {
        var k = KEY + ":probe";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
        return true;
      } catch (err) {
        return false;
      }
    },

    stat: function (name, by) {
      state.stats[name] = (state.stats[name] || 0) + (by == null ? 1 : by);
      store.save();
    },
    addBadge: function (id) {
      if (state.badges.indexOf(id) !== -1) return false;
      state.badges.push(id);
      store.save();
      var def = (CX.data.badges || []).filter(function (b) {
        return b.id === id;
      })[0];
      if (def && CX.ui && CX.ui.toast) CX.ui.toast("Badge unlocked: " + def.title, def.icon || "trophy");
      CX.bus.emit("store:change", state);
      return true;
    },
    addLog: function (entry) {
      entry.at = Date.now();
      state.log.unshift(entry);
      state.log = state.log.slice(0, 40);
      store.save();
    },
    /* Creator level follows the six sessions: PASSIVE AI USER (session 1) →
       AI-ASSISTED (2–3) → AI-AWARE (4–5) → INDEPENDENT CREATOR (6). */
    sessionsDone: function () {
      var best = 0;
      Object.keys(state.builds || {}).forEach(function (id) {
        (state.builds[id].done || []).forEach(function (n) {
          if (n > best) best = n;
        });
      });
      return best;
    },
    creatorLevel: function () {
      var done = store.sessionsDone();
      var idx = done >= 6 ? 3 : done >= 4 ? 2 : done >= 2 ? 1 : 0;
      var levels = CX.data.course ? CX.data.course.progression : [];
      var bands = [
        [0, 2],
        [2, 4],
        [4, 6],
        [6, 6],
      ];
      var band = bands[idx];
      var pct = band[1] === band[0] ? 100 : Math.round(((done - band[0]) / (band[1] - band[0])) * 100);
      return { index: idx, level: levels[idx], done: done, pct: pct };
    },
  });

  CX.bus.on("settings:apply", function () {
    document.documentElement.classList.toggle("reduce-motion", !!state.settings.reduceMotion);
  });
})();
