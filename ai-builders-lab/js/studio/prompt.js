/* ==========================================================================
   Prompt analysis: the six prompt ingredients children learn to use, with
   live highlighting, plus small parsing helpers the builds use to "read" a
   prompt in offline example mode.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var esc = U.esc;

  var NUMBER_WORDS = "half|halve|double|twice|triple|third|quarter|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|percent";

  /* Each ingredient has a colour (CSS var), a short hint and a pattern.
     "details" words can be extended per build (def.lexicon.details). */
  var INGREDIENTS = [
    { id: "what", label: "What", hint: "Say what you want", icon: "bulb" },
    { id: "details", label: "Details", hint: "What kind? Which one?", icon: "search" },
    { id: "numbers", label: "Numbers", hint: "How much? How many?", icon: "graph" },
    { id: "goal", label: "Goal", hint: "Why? “so that…”", icon: "target" },
    { id: "limits", label: "Limits", hint: "“but”, “under”, “keep”…", icon: "shield" },
    { id: "check", label: "Check", hint: "“test”, “show me”, “explain”", icon: "flask" },
  ];

  var RE = {
    numbers: new RegExp("\\b(\\d+(?:\\.\\d+)?\\s?(?:%|percent|m\\/s²|m\\/s|m|metres?|meters?|seconds?|secs?|s|degrees?|°|bpm|hz|x|times)?|" + NUMBER_WORDS + ")\\b|\\d+(?:\\.\\d+)?(?:%|°)", "gi"),
    goal: /\b(so that|so my|so it|so the|so i|so we|so they|in order to|because|to make sure|so you can)\b/gi,
    limits: /\b(but|under|below|less than|more than|at most|at least|no more than|no less than|only|between|keep|keeping|without|don't|do not|never|must|maximum|minimum|within|not)\b/gi,
    check: /\b(test\w*|compar\w*|table|show me|explain\w*|why|check\w*|measur\w*|graph|prove|tell me)\b/gi,
    detailsBase: /\b(like|with|small|smaller|big|bigger|tiny|huge|giant|large|medium|red|blue|green|purple|orange|yellow|pink|white|grey|gray|gold|black|high|higher|low|lower|fast|faster|slow|slower|loud|louder|quiet|quieter|clean|bright|dark|rocky|icy|stormy|steep|flat|happy|sad)\b/gi,
  };

  function spans(text, re, id, out) {
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(text))) {
      if (!m[0]) {
        re.lastIndex++;
        continue;
      }
      out.push({ s: m.index, e: m.index + m[0].length, id: id });
    }
  }

  function analyse(text, def) {
    text = text || "";
    var found = [];
    var detailRe = def && def.lexicon && def.lexicon.details;
    spans(text, RE.goal, "goal", found);
    spans(text, RE.check, "check", found);
    spans(text, RE.numbers, "numbers", found);
    spans(text, RE.limits, "limits", found);
    spans(text, RE.detailsBase, "details", found);
    if (detailRe) spans(text, new RegExp(detailRe.source, "gi"), "details", found);
    // Earlier ingredients win overlaps; keep spans in order
    found.sort(function (a, b) {
      return a.s - b.s || b.e - b.s - (a.e - a.s);
    });
    var clean = [];
    var end = -1;
    found.forEach(function (f) {
      if (f.s >= end) {
        clean.push(f);
        end = f.e;
      }
    });
    var has = { what: text.trim().split(/\s+/).filter(Boolean).length >= 2 };
    clean.forEach(function (f) {
      has[f.id] = true;
    });
    var count = INGREDIENTS.filter(function (i) {
      return has[i.id];
    }).length;
    return { has: has, spans: clean, count: count, words: text.trim() ? text.trim().split(/\s+/).length : 0 };
  }

  function highlight(text, a) {
    var out = "",
      at = 0;
    a.spans.forEach(function (s) {
      out += esc(text.slice(at, s.s)) + '<mark class="ing ing--' + s.id + '">' + esc(text.slice(s.s, s.e)) + "</mark>";
      at = s.e;
    });
    out += esc(text.slice(at));
    return out + "​";
  }

  /* Words in the new prompt that weren't in the old one (for the prompt ladder) */
  function diffWords(prev, next) {
    var before = {};
    (prev || "")
      .toLowerCase()
      .split(/\s+/)
      .forEach(function (w) {
        before[w.replace(/[^\w%°.]/g, "")] = (before[w.replace(/[^\w%°.]/g, "")] || 0) + 1;
      });
    return (next || "")
      .split(/(\s+)/)
      .map(function (w) {
        if (/^\s+$/.test(w)) return w;
        var k = w.toLowerCase().replace(/[^\w%°.]/g, "");
        if (before[k]) {
          before[k]--;
          return esc(w);
        }
        return '<ins class="pdiff">' + esc(w) + "</ins>";
      })
      .join("");
  }

  /* ---- Parsing helpers for offline example mode -------------------------- */
  var WORD_NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };

  function norm(text) {
    return " " + String(text || "").toLowerCase().replace(/[“”"]/g, "").replace(/\s+/g, " ") + " ";
  }
  function has(text, words) {
    var t = norm(text);
    return words.some(function (w) {
      return new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(t);
    });
  }
  // Number right after/before a keyword, e.g. num(t, /gravity (?:to |of |at |= )?/) or units
  function numAfter(text, re) {
    var t = norm(text);
    var m = new RegExp(re.source + "\\s*(-?\\d+(?:\\.\\d+)?)").exec(t);
    return m ? parseFloat(m[1]) : null;
  }
  function numBefore(text, unitRe) {
    var t = norm(text);
    var m = new RegExp("(-?\\d+(?:\\.\\d+)?)\\s*" + unitRe.source).exec(t);
    if (m) return parseFloat(m[1]);
    var w = new RegExp("\\b(" + Object.keys(WORD_NUM).join("|") + ")\\s*" + unitRe.source).exec(t);
    return w ? WORD_NUM[w[1]] : null;
  }
  function allNums(text, unitRe) {
    var t = norm(text);
    var re = new RegExp("(-?\\d+(?:\\.\\d+)?)\\s*" + (unitRe ? unitRe.source : ""), "g");
    var out = [],
      m;
    while ((m = re.exec(t))) out.push(parseFloat(m[1]));
    return out;
  }
  function factor(text) {
    var t = norm(text);
    if (/\b(half|halve|halved)\b/.test(t)) return 0.5;
    if (/\b(third)\b/.test(t)) return 1 / 3;
    if (/\b(quarter)\b/.test(t)) return 0.25;
    if (/\b(double|twice|two times|2 times|2x|x2)\b/.test(t)) return 2;
    if (/\b(triple|three times|3 times|3x)\b/.test(t)) return 3;
    var m = /\b(\d+(?:\.\d+)?)\s*(?:x|times)\b/.exec(t);
    if (m) return parseFloat(m[1]);
    return null;
  }
  function percent(text) {
    return numBefore(text, /(?:%|percent)/);
  }

  CX.prompt = {
    INGREDIENTS: INGREDIENTS,
    analyse: analyse,
    highlight: highlight,
    diffWords: diffWords,
    norm: norm,
    has: has,
    numAfter: numAfter,
    numBefore: numBefore,
    allNums: allNums,
    factor: factor,
    percent: percent,
    /* Shared, build-independent replies (safety, personal info, "do it all") */
    general: function (text) {
      var t = norm(text);
      if (/\b(stupid|idiot|hate you|shut up|dumb|kill)\b/.test(t))
        return { kind: "safety", say: "Let's keep things kind. I'm here to help you build. Try telling me one thing you'd like to change, and how much." };
      if (/\b(my (full )?name is|i live at|my address|my phone|my email|password|my school is)\b/.test(t))
        return { kind: "safety", say: "Please don't share personal information with me, not even with an AI helper. Your build doesn't need it. Tell me about the build instead." };
      if (/\b(are you (a )?(human|person|real|alive)|do you have feelings)\b/.test(t))
        return { kind: "info", say: "No, I'm not a person. I'm an AI: a tool that predicts helpful answers from patterns in lots of examples. I can be wrong, which is why you test what I do." };
      if (/\b(do (it|everything|all of it) for me|finish (it|the mission) for me|do my work)\b/.test(t))
        return { kind: "info", say: "You're the builder, so I'll do one step at a time and you decide each step. What's the first thing you want to change?" };
      return null;
    },
  };
})();
