/* ==========================================================================
   Course content: AI Builders Lab (ages 10–11).
   One learning unit = six sessions of one hour. Every session teaches one
   prompting skill. Each child practises it in the build they chose
   (space, sport, music or the planet), and the build grows every session
   into a finished product they share in session 6.
   Pages render from this file; nothing here is hard-wired in markup.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;

  var CHECKS = ["Can say what the AI guessed", "Predicts before testing", "Explains the cause and effect", "Makes their own decision"];

  CX.data.course = {
    id: "ai-builders-lab",
    title: "AI Builders Lab",
    org: "ComputerXplorers",
    ages: "10–11",
    hours: 6,
    sessionsCount: 6,
    classSize: 15,

    promise: "Learn maths and science by building with AI, one prompt at a time.",
    philosophy:
      "This isn't a game-playing club. Children build something real by learning to work with AI: they make the decisions, learn to prompt and see cause and effect, and the maths and science come with it.",

    /* The learning loop every round of prompting follows */
    loop: [
      { id: "idea", label: "Idea", text: "Decide what you want to build or find out.", icon: "bulb" },
      { id: "prompt", label: "Prompt", text: "Tell the AI, one step at a time.", icon: "chat" },
      { id: "predict", label: "Predict", text: "Say what you think will happen.", icon: "eye" },
      { id: "test", label: "Test", text: "Run it and see the cause and effect.", icon: "flask" },
      { id: "decide", label: "Decide", text: "Keep it, or undo it and improve the prompt.", icon: "hand" },
      { id: "explain", label: "Explain", text: "Explain the maths, the science and your prompt.", icon: "chat" },
    ],

    /* The six prompt ingredients (see js/studio/prompt.js) */
    ingredients: [
      { id: "what", label: "What", text: "Say what you want." },
      { id: "details", label: "Details", text: "What kind? Which one? What is it like?" },
      { id: "numbers", label: "Numbers", text: "How much? How many? How fast?" },
      { id: "goal", label: "Goal", text: "Why do you want it? “…so that…”" },
      { id: "limits", label: "Limits", text: "What must or mustn't happen? “…but keep…”" },
      { id: "check", label: "Check", text: "Ask the AI to test, compare or explain." },
    ],

    progression: [
      { id: "passive", title: "Passive AI user", short: "Takes whatever AI gives them", icon: "eye" },
      { id: "assisted", title: "AI-assisted builder", short: "Builds with AI, one step at a time", icon: "wand" },
      { id: "aware", title: "AI-aware builder", short: "Predicts, tests and questions AI", icon: "search" },
      { id: "independent", title: "Independent creator", short: "Decides, explains and shares", icon: "star" },
    ],

    formats: [
      {
        id: "weekly",
        label: "6 × 1 hour",
        title: "Weekly club or school workshop",
        detail: "One session a week for six weeks. Every session is a complete 60-minute lesson, and the child's build carries over from week to week.",
        slots: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
      },
      {
        id: "halfterm",
        label: "6 hours in a half-term",
        title: "Half-term or holiday programme",
        detail: "The same six sessions over two mornings, or one long day with breaks. Session 6 ends with a showcase that parents can join.",
        slots: ["Day 1 · 09:30", "Day 1 · 10:45", "Day 1 · 13:00", "Day 2 · 09:30", "Day 2 · 10:45", "Day 2 · 13:00"],
      },
    ],

    outcomes: [
      "Explain what AI is (a tool that predicts from patterns) and why it fills gaps in a prompt with guesses.",
      "Write prompts with all six ingredients: what, details, numbers, goal, limits and check.",
      "Predict the effect of a change before testing it, then explain the cause and effect.",
      "Spot when the AI did what they said instead of what they meant, and fix it with a better prompt.",
      "Ask the AI to run a fair test, read the results table and decide from the evidence.",
      "Use maths and science to check the AI's work, for example that halving gravity doubles a jump.",
      "Finish, share and present a product, explaining every decision and where the AI was wrong.",
    ],

    transferable: [
      "Know what you want",
      "Say it clearly",
      "Use numbers to be precise",
      "Set goals and limits",
      "Predict, then test",
      "Read the evidence",
      "Decide for yourself",
      "Explain what you built",
    ],

    finalQuestions: [
      "What I built",
      "My first prompt and my best prompt",
      "What the AI guessed or got wrong",
      "The maths and science I used",
      "How I tested it",
      "The decision I'm proudest of",
      "What I'd build next",
    ],

    /* ---- The six sessions -------------------------------------------------- */
    sessions: [
      {
        n: 1,
        id: "say",
        skill: "Say what you want",
        short: "Say it",
        ing: "what",
        icon: "bulb",
        colour: "lime",
        bit: { colour: "lime", face: "wow" },
        photo: "m1",
        level: "passive",
        tip: "Say what you want in a few words, then read what the AI guessed",
        ability: "Gives the AI a first instruction and spots what it guessed.",
        strap: "Meet the AI builder. A short prompt works, but the AI has to guess the rest.",
        learn: [
          "What AI is: a tool that predicts from patterns in lots of examples",
          "What AI isn't: a person, a mind reader or always right",
          "When a prompt leaves something out, the AI guesses, usually the most common answer",
          "You decide whether to keep what the AI made",
        ],
        prompt: { space: "Make a planet", sport: "Kick the ball", music: "Make a beat", planet: "Power my town" },
        badge: "guess-spotter",
        observable: ["Names two things the AI guessed", "Describes AI as predicting, not thinking", "Makes a first version and decides to keep or undo it"],
        lesson: {
          duration: 60,
          objective: "Students understand that AI fills gaps in a prompt with guesses, and that their words control what it builds.",
          outcome: "Every student makes the first version of their build and names what the AI guessed.",
          need: ["Laptop or Chromebook (one each, or one per pair)", "Headphones (optional: the builds have sound)", "Board or projector", "Paper and pens for the warm-up"],
          runningOrder: [
            { at: 0, mins: 8, title: "Warm-up", do: "“Draw a house” game. Everyone draws from the same three-word instruction, then compares. Every drawing is different, because everyone guessed the details.", say: "We all heard the same words. Why are our houses different?" },
            { at: 8, mins: 7, title: "Meet the AI", do: "On the board, type “Make a planet” in Planet Builder. Read the AI's reply aloud and point at the pink “AI guessed” chips.", say: "Which parts did I ask for, and which parts did the AI make up?" },
            { at: 15, mins: 5, title: "Choose a build", do: "Children pick the build they care about: Space, Sport, Music or the Planet. All four teach the same skill today.", say: "Choose the world you want to build in. Everyone's learning the same skill." },
            { at: 20, mins: 15, title: "First prompt", do: "Children give their first short prompt, predict what will happen, then test it. They count the AI's guesses.", say: "How many things did the AI have to guess?" },
            { at: 35, mins: 10, title: "Keep or undo", do: "Children decide whether to keep version 1. Partners in different builds swap and compare guesses.", say: "Your partner built something different. Did their AI guess the same kind of things?" },
            { at: 45, mins: 10, title: "Is AI a person?", do: "Quick class discussion with the AI's honest answer on the board. Children ask the AI “Are you a person?”", say: "If AI isn't a person, how does it decide what to make?" },
            { at: 55, mins: 5, title: "Explain", do: "Exit ticket: one thing the AI guessed, and one word they'd add next time.", say: "What will you add to your prompt next session?" },
          ],
          prompts: ["Which parts did you ask for?", "Which parts did the AI guess?", "Why do you think it guessed that?", "Is the AI a person? How is it different?", "Will you keep it or undo it? Why?"],
          successCheck: CHECKS,
          misconceptions: [
            { wrong: "AI knows what I mean.", right: "AI only has your words. Anything you leave out, it guesses." },
            { wrong: "AI is a kind of person.", right: "It's a tool that predicts from lots of examples. It can sound sure and still be wrong." },
            { wrong: "If the AI made it, it's finished.", right: "Version 1 is a start. You decide what happens next." },
          ],
          differentiation: {
            support: "Use the suggested first prompt and point to one AI guess.",
            core: "Write your own first prompt, count the guesses and decide to keep or undo.",
            extension: "Write a prompt so short the AI has to guess five things, then explain each guess.",
          },
          notes: [
            "Celebrate counting guesses. Today's success is noticing, not avoiding guesses.",
            "Builds work offline. If the network is slow, nothing changes for the children.",
          ],
          reflection: ["One thing the AI guessed", "One word I'll add next time"],
        },
      },
      {
        n: 2,
        id: "details",
        skill: "Add details",
        short: "Details",
        ing: "details",
        icon: "search",
        colour: "pink",
        bit: { colour: "pink", face: "think" },
        photo: "m2",
        level: "assisted",
        tip: "Add details: what kind, what colour, what size, what is it like?",
        ability: "Describes what kind of thing they want, so the AI guesses less.",
        strap: "Describe it. Every detail is one less thing for the AI to guess.",
        learn: ["Describing words (details) remove guesses", "Comparing two versions of a prompt", "Using science words: rocky, gas giant, solar, wind, beat, rhythm", "Checking the AI used every detail"],
        prompt: { space: "Make a small red rocky planet like Mars", sport: "Kick it high over the wall to the target", music: "Make a beat with a kick on beats 1 and 3 and a clap on 2 and 4", planet: "Power my town with clean energy" },
        badge: "detail-detective",
        observable: ["Rewrites a prompt with at least two details", "Compares guess counts between versions", "Notices when a detail was still misunderstood"],
        lesson: {
          duration: 60,
          objective: "Students use descriptive details so the AI has less to guess, and compare versions of their prompt.",
          outcome: "Every student makes version 2 of their build with fewer AI guesses.",
          need: ["Laptop or Chromebook", "Headphones (optional)", "Mystery bag with one object for the warm-up"],
          runningOrder: [
            { at: 0, mins: 8, title: "Warm-up", do: "“Mystery bag”: one child describes an object without naming it. The class adds details until everyone can draw it.", say: "Which detail helped the most?" },
            { at: 8, mins: 7, title: "Model it", do: "On the board, turn “Make a planet” into “Make a small red rocky planet like Mars”. Show the guess count fall.", say: "Each detail is one less guess. Which details did the AI use?" },
            { at: 15, mins: 20, title: "Build version 2", do: "Children rewrite their session 1 prompt with details, predict, test and compare with version 1.", say: "What did your details change? What did the AI still guess?" },
            { at: 35, mins: 10, title: "Catch the AI", do: "Some details are still read wrongly. In Kick Lab, “high” means steep and the ball drops short. In Power Town, “clean” means solar only and the town goes dark at night. Children spot it in the test.", say: "Did the AI understand your detail the way you meant it?" },
            { at: 45, mins: 8, title: "Same skill, different worlds", do: "Pairs from different builds show each other their two prompt versions.", say: "Which detail in your partner's prompt made the biggest difference?" },
            { at: 53, mins: 7, title: "Explain", do: "Exit ticket: version 1 vs version 2, and one detail that helped.", say: "How many guesses did you remove?" },
          ],
          prompts: ["What kind of thing do you want?", "Which detail removed a guess?", "Did the AI read your detail the way you meant it?", "What did the test show?"],
          successCheck: CHECKS,
          misconceptions: [
            { wrong: "Longer prompts are always better.", right: "Useful details beat extra words. Every detail should remove a guess." },
            { wrong: "If I said it, the AI understood it.", right: "Words like “high” or “clean” can mean different things. Test to check." },
          ],
          differentiation: {
            support: "Add one detail from the word bank to your session 1 prompt.",
            core: "Add at least two details and compare the guess count with version 1.",
            extension: "Find a detail the AI misunderstood and rewrite it so it can't be misread.",
          },
          notes: ["The guess counter is on screen: let children race to lower it.", "The two misreadings (“high” and “clean”) are deliberate and repeatable, so you can plan the discussion."],
          reflection: ["My best detail", "A detail the AI misread"],
        },
      },
      {
        n: 3,
        id: "numbers",
        skill: "Add numbers",
        short: "Numbers",
        ing: "numbers",
        icon: "graph",
        colour: "teal",
        bit: { colour: "teal", face: "grin" },
        photo: "m3",
        level: "assisted",
        tip: "Use numbers: how much, how many, how fast? Then predict",
        ability: "Uses numbers to be precise, predicts the effect and tests it.",
        strap: "Numbers make prompts precise. Predict first, then test, and see cause and effect.",
        learn: ["Numbers remove the biggest guesses: how much and how many", "Predicting before testing", "Cause and effect: change one thing, measure what happens", "The maths in each build: halving and doubling, angles, beats per minute, percentages"],
        prompt: { space: "Make gravity half of Earth's so my astronaut jumps twice as high", sport: "Kick it at 45 degrees with 90% power", music: "Make it 100 beats per minute and add a hi-hat on every half beat", planet: "Use 50% solar and 50% wind" },
        badge: "number-cruncher",
        observable: ["Uses a number or fraction in a prompt", "Makes a prediction before testing", "Explains the cause and effect with the numbers"],
        lesson: {
          duration: 60,
          objective: "Students use numbers to make prompts precise, predict the effect of a change and test it.",
          outcome: "Every student makes version 3 using numbers and explains the cause and effect they measured.",
          need: ["Laptop or Chromebook", "Headphones (optional)", "Mini whiteboards for predictions"],
          runningOrder: [
            { at: 0, mins: 8, title: "Warm-up", do: "“Estimate it”: how high can you jump? Estimate, then measure one volunteer against a tape on the wall.", say: "Was your estimate close? How could we be more precise?" },
            { at: 8, mins: 7, title: "Model it", do: "In Planet Builder, ask for gravity half of Earth's. The class predicts on whiteboards: higher, the same or lower? Then test.", say: "Half the gravity. What happened to the jump?" },
            { at: 15, mins: 20, title: "Build version 3", do: "Children add numbers to their prompt, predict, test and record the cause and effect.", say: "What did you change? What happened? By how much?" },
            { at: 35, mins: 10, title: "Prediction check", do: "Children compare predictions with results. Wrong predictions are great: what did the test teach you?", say: "Who predicted wrong? What did you learn?" },
            { at: 45, mins: 8, title: "Same skill, different worlds", do: "Pairs from different builds explain their maths: halving, angles, beats per minute, percentages.", say: "Where did the maths show up in your build?" },
            { at: 53, mins: 7, title: "Explain", do: "Exit ticket: “When I changed ___ to ___, the ___ changed from ___ to ___.”", say: "Say your cause and effect with numbers." },
          ],
          prompts: ["How much? How many?", "What do you predict will happen?", "What changed, and by how much?", "Why do you think that happened?"],
          successCheck: CHECKS,
          misconceptions: [
            { wrong: "Bigger numbers always make things better.", right: "Test it. Twice the gravity halves the jump, and 70° goes less far than 45°." },
            { wrong: "Predicting wrong means I failed.", right: "A wrong prediction plus a test is how scientists learn." },
          ],
          differentiation: {
            support: "Use the number chips (half, double, 45°, 100 BPM, 50%) and predict from two choices.",
            core: "Write your own prompt with a number, predict, test and explain the effect.",
            extension: "Predict an exact value (for example the jump height) before testing, and check it with a calculation.",
          },
          notes: ["Predictions are recorded. They are not marked; we want honest guesses.", "Every result uses real formulas, so children can check them with a calculator."],
          reflection: ["My cause and effect, with numbers", "Was my prediction right?"],
        },
      },
      {
        n: 4,
        id: "limits",
        skill: "Set a goal and limits",
        short: "Goal & limits",
        ing: "limits",
        icon: "shield",
        colour: "orange",
        bit: { colour: "orange", face: "think" },
        photo: "m4",
        level: "aware",
        tip: "Say why (“so that…”) and what mustn't happen (“…but keep…”)",
        ability: "Sets a goal and limits, and catches the AI when it does what was said instead of what was meant.",
        strap: "The AI does what you say, not what you mean. Goals and limits close the gap.",
        learn: ["Goals: saying why you want something", "Limits: what must or mustn't happen", "AI can follow words literally and still get it wrong", "Fixing a prompt rather than blaming the tool"],
        prompt: {
          space: "Make the highest jump you can, but my astronaut must land within 10 seconds",
          sport: "Hit the 18 m target, keep the power at 90% and make sure the ball clears the wall",
          music: "Make the melody higher in pitch, not louder: double the frequency and keep the volume the same",
          planet: "Keep the lights on all day and night: use solar and wind, add a battery and keep gas under 20%",
        },
        badge: "limit-setter",
        observable: ["Spots that the AI did what was said, not what was meant", "Adds a goal and a limit to fix it", "Explains why the limit worked"],
        lesson: {
          duration: 60,
          objective: "Students add goals and limits to prompts and catch the AI when it follows the words but misses the meaning.",
          outcome: "Every student catches one literal AI mistake and fixes it with a goal and a limit.",
          need: ["Laptop or Chromebook", "Headphones (optional)", "Bread, a knife and a jam jar, or a picture of them, for the warm-up"],
          runningOrder: [
            { at: 0, mins: 8, title: "Warm-up", do: "“Literal robot”: the instructor follows “Make a jam sandwich as fast as possible” word for word and gets it hilariously wrong.", say: "I did exactly what you said. What should you have said?" },
            { at: 8, mins: 7, title: "Model it", do: "In Planet Builder, ask for “the highest jump possible”. The AI sets gravity to zero and the astronaut floats away for ever.", say: "Is that a jump? What limit was missing?" },
            { at: 15, mins: 20, title: "Catch and fix", do: "Children meet their build's literal mistake (floating away, the ball hitting the wall, louder instead of higher, blackouts) and fix it with a goal and a limit.", say: "Did the AI do what you said, or what you meant?" },
            { at: 35, mins: 10, title: "Test the fix", do: "Children test that the limit really works and record the numbers.", say: "How do you know your limit worked?" },
            { at: 45, mins: 8, title: "Same skill, different worlds", do: "Pairs from different builds compare their AI's mistake and their fix.", say: "Was your partner's AI mistake like yours?" },
            { at: 53, mins: 7, title: "Explain", do: "Exit ticket: “The AI did ___ because I said ___. I added the limit ___.”", say: "Explain the gap between what you said and what you meant." },
          ],
          prompts: ["Did the AI do what you said, or what you meant?", "Why do you want it? Say it with “so that”.", "What must not happen?", "How will you test the limit?"],
          successCheck: CHECKS,
          misconceptions: [
            { wrong: "The AI is broken when it gets it wrong.", right: "It followed your words. Goals and limits tell it what you meant." },
            { wrong: "Louder means higher.", right: "Volume and pitch are different. Higher pitch means faster vibrations, not bigger ones." },
            { wrong: "Clean energy means solar panels.", right: "The sun sets. Clean energy needs a mix, and something for the night." },
          ],
          differentiation: {
            support: "Pick a limit from the chips and test it.",
            core: "Catch the AI's literal mistake, add a goal and a limit, and test the fix.",
            extension: "Write a limit that stops two different mistakes at once and prove it with tests.",
          },
          notes: ["Each build's literal mistake is deliberate and repeatable.", "This is the session children talk about at home. Ask them to explain it to someone."],
          reflection: ["What the AI did, and what I meant", "The limit that fixed it"],
        },
      },
      {
        n: 5,
        id: "test",
        skill: "Test and explain",
        short: "Test & explain",
        ing: "check",
        icon: "flask",
        colour: "blue",
        bit: { colour: "blue", face: "think" },
        photo: "m5",
        level: "aware",
        tip: "Ask the AI to test, compare and explain: “show me a table”",
        ability: "Asks the AI to run fair tests, reads the results and decides from the evidence.",
        strap: "Make the AI show its working. Fair tests, tables and patterns turn answers into evidence.",
        learn: ["Fair tests: change one thing, keep the rest the same", "Reading a results table", "Finding the pattern, for example that 30° and 60° land in the same place", "Deciding from evidence, not from what the AI says"],
        prompt: {
          space: "Test the jump on Earth, Mars and the Moon, show me a table and explain the pattern",
          sport: "Test 30°, 45° and 60° at 90% power, show me a table and explain the pattern",
          music: "Play my melody at half, normal and double frequency, show me a table and explain what changes",
          planet: "Test a small, medium and large battery, show me a table and explain which is best",
        },
        badge: "fair-tester",
        observable: ["Asks for a fair test with one thing changing", "Reads the table and names the pattern", "Decides from the evidence and says why"],
        lesson: {
          duration: 60,
          objective: "Students ask AI to run fair tests, read the results and make a decision from the evidence.",
          outcome: "Every student runs a three-way fair test, finds the pattern and makes a decision.",
          need: ["Laptop or Chromebook", "Headphones (optional)", "Results-table worksheet (optional)"],
          runningOrder: [
            { at: 0, mins: 8, title: "Warm-up", do: "“Fair test or not?”: four quick scenarios on the board. Children vote with thumbs.", say: "What makes a test fair?" },
            { at: 8, mins: 7, title: "Model it", do: "In Kick Lab, ask for three kicks at 30°, 45° and 60°. Predict which goes furthest, then read the table.", say: "Two kicks landed in the same place. Why?" },
            { at: 15, mins: 20, title: "Run your tests", do: "Children ask for a three-way fair test in their build, predict, then read the table and the AI's explanation.", say: "Does the table agree with the AI's explanation?" },
            { at: 35, mins: 10, title: "Decide", do: "Children choose which version to keep, using the evidence. They must say why.", say: "Which would you keep? What's your evidence?" },
            { at: 45, mins: 8, title: "Same skill, different worlds", do: "Pairs from different builds share their pattern in one sentence.", say: "What pattern did your partner find?" },
            { at: 53, mins: 7, title: "Explain", do: "Exit ticket: the pattern in one sentence, and the decision it led to.", say: "Explain your pattern so a younger child would understand it." },
          ],
          prompts: ["What's the one thing that changes in your test?", "What stays the same?", "What pattern do you see?", "Does the AI's explanation match the table?", "What will you decide, and why?"],
          successCheck: CHECKS,
          misconceptions: [
            { wrong: "One test proves it.", right: "Compare several tests to see the pattern." },
            { wrong: "If the AI explains it, it must be right.", right: "Check the explanation against the numbers in the table." },
          ],
          differentiation: {
            support: "Run the suggested test and circle the biggest number in the table.",
            core: "Ask for your own fair test, find the pattern and decide.",
            extension: "Design a fourth test that would check the pattern, and predict its result.",
          },
          notes: ["Tables use the same formulas as the builds, so the numbers are always consistent.", "Ask children to read the table before reading the AI's explanation."],
          reflection: ["The pattern I found", "The decision it led to"],
        },
      },
      {
        n: 6,
        id: "share",
        skill: "Finish, share and present",
        short: "Share",
        ing: "all",
        icon: "star",
        colour: "lime",
        bit: { colour: "white", face: "star" },
        photo: "m6",
        level: "independent",
        tip: "Use all six ingredients, then share and present your build",
        ability: "Finishes a product with a six-ingredient prompt, shares it and explains every decision.",
        strap: "Finish it, make it yours and share it. Then present the journey from your first prompt to your best one.",
        learn: ["Combining all six ingredients in one prompt", "Making a product your own", "Presenting your prompt ladder from session 1 to 6", "Giving and receiving feedback"],
        prompt: {
          space: "Call my planet Zorb. Make it icy blue with two moons and pink rings, keep the gravity the same so the jump stays high, and write a fact card that explains it",
          sport: "Make my own challenge: put the target at 20 m and the wall at 11 m, keep the power at 90%, test it so my friends know it can be done, and write a hint card",
          music: "Call my track Moon Groove. Add a bassline an octave lower so it sounds fuller, keep it at 100 BPM, fade out over the last 4 beats and explain the pitch",
          planet: "Call my town Brightwater. Add a wind farm on the hill, keep the lights on all night with gas under 10%, and show the 24-hour graph so the town council can see it",
        },
        badge: "showcase-star",
        observable: ["Writes a prompt with five or six ingredients", "Shares a finished product", "Presents their prompt ladder and one AI mistake they fixed"],
        lesson: {
          duration: 60,
          objective: "Students finish and share a product, then present their journey from first prompt to best prompt.",
          outcome: "Every student shares a finished build with a share card, and presents their prompt ladder.",
          need: ["Laptop or Chromebook", "Projector for presentations", "Sticky notes for the gallery walk", "Optional: parents invited for the last 15 minutes"],
          runningOrder: [
            { at: 0, mins: 8, title: "Warm-up", do: "Put a session 1 prompt and a session 6 prompt side by side on the board. Count the ingredients in each.", say: "What changed between your first prompt and now?" },
            { at: 8, mins: 17, title: "Finish your build", do: "Children write one prompt using all six ingredients to make the build their own, test it and keep it.", say: "Can you use all six ingredients?" },
            { at: 25, mins: 10, title: "Share card", do: "Children make their share card. It shows their build, their best prompt, the maths and science, and their prompt ladder.", say: "What do you want people to notice first?" },
            { at: 35, mins: 15, title: "Gallery walk", do: "Children try each other's builds from the class showcase and leave two stars and a wish.", say: "Try a build from a different world. What did they learn that you didn't?" },
            { at: 50, mins: 10, title: "Present", do: "Volunteers present: first prompt, best prompt, one AI mistake they caught, and the maths or science.", say: "What's the decision you're proudest of?" },
          ],
          prompts: ["Which ingredient is missing from your prompt?", "What did the AI get wrong along the way?", "What maths or science does your build show?", "What would you build next?"],
          successCheck: CHECKS,
          misconceptions: [
            { wrong: "Admitting the AI was wrong makes my build look bad.", right: "Catching and fixing AI mistakes is the most impressive part." },
            { wrong: "The AI made it, so it's not really mine.", right: "You made every decision: what to ask, what to keep and what to fix. That's what makes it yours." },
          ],
          differentiation: {
            support: "Present three points with sentence starters: my first prompt, my best prompt, one fix.",
            core: "Present your prompt ladder, one AI mistake and the maths or science.",
            extension: "Run a live demo: write a new prompt in front of the class, predict, test and decide.",
          },
          notes: ["Share cards only use builder nicknames.", "Parents love the prompt ladder. It shows progress at a glance."],
          reflection: ["What I'm proud of", "My best prompt", "What I'd build next"],
        },
      },
    ],
  };

  /* What the AI does, what children must do themselves, and the off-screen warm-up */
  var EXTRA = {
    1: { aiRole: "Builds version 1 from a short prompt and shows every guess it made.", notOutsourced: "Spotting and counting the guesses, and deciding whether to keep version 1.", physical: "“Draw a house”: everyone draws from the same three words, then compares.", progression: ["passive"] },
    2: { aiRole: "Follows the details and shows which words it used. It still misreads one detail on purpose.", notOutsourced: "Choosing the details, and noticing when one was read the wrong way.", physical: "“Mystery bag”: describe an object without naming it until the class can draw it.", progression: ["assisted"] },
    3: { aiRole: "Applies the numbers exactly and runs the test. It never gives the answer before children predict.", notOutsourced: "The prediction. Children commit to what will happen before they press Test.", physical: "“Estimate it”: estimate a jump, then measure it against a tape on the wall.", progression: ["assisted"] },
    4: { aiRole: "Follows the words literally, so it makes a mistake on purpose: floating away, hitting the wall, louder not higher, gas all night.", notOutsourced: "Seeing the gap between what they said and what they meant, and writing the limit that closes it.", physical: "“Literal robot”: the instructor follows sandwich instructions word for word.", progression: ["aware"] },
    5: { aiRole: "Runs the fair tests and drafts an explanation. Children check it against the table.", notOutsourced: "Reading the table, finding the pattern and making the decision.", physical: "“Fair test or not?”: the class votes with thumbs on four quick scenarios.", progression: ["aware"] },
    6: { aiRole: "Builds the final version from a six-ingredient prompt. The presentation is entirely the child's.", notOutsourced: "The decisions, the explanation and presenting their prompt ladder.", physical: "Gallery walk: children try each other's builds and leave two stars and a wish.", progression: ["independent"] },
  };
  CX.data.course.sessions.forEach(function (s) {
    var x = EXTRA[s.n];
    s.title = s.skill;
    s.journey = s.skill;
    s.aiRole = x.aiRole;
    s.notOutsourced = x.notOutsourced;
    s.physical = x.physical;
    s.progression = x.progression;
    s.activity = { title: "In every world", text: "", gameId: null };
  });

  CX.data.sessionByN = function (n) {
    return CX.data.course.sessions[(parseInt(n, 10) || 1) - 1];
  };
  // Older screens called these "modules"
  CX.data.course.modules = CX.data.course.sessions;
  CX.data.moduleById = function (id) {
    return CX.data.course.sessions.filter(function (s) {
      return s.id === id || String(s.n) === String(id);
    })[0];
  };

  /* ---- Curriculum links (indicative, England KS2; to confirm with ComputerXplorers) ---- */
  CX.data.curriculumLinks = {
    space: ["Science Y5 · Forces: gravity pulls objects towards a planet", "Science Y5 · Earth and space", "Maths Y6 · Ratio and proportion: halving and doubling", "Working scientifically: predictions, fair tests, results tables"],
    sport: ["Maths Y5 · Angles measured in degrees; acute and obtuse angles", "Maths Y5/6 · Measurement in metres", "Science Y5 · Forces: gravity", "Working scientifically: fair tests and patterns"],
    music: ["Science Y4 · Sound: pitch and vibration; volume and the strength of vibrations", "Maths Y6 · Fractions; division (60 ÷ beats per minute)", "Music · Rhythm, tempo and pitch", "Working scientifically: comparing results"],
    planet: ["Maths Y6 · Percentages for comparison", "Maths Y6 · Line graphs: interpret and construct", "Geography KS2 · Natural resources, including energy", "Working scientifically: fair tests and conclusions"],
  };

  /* ---- Achievement badges ------------------------------------------------- */
  CX.data.badges = [
    { id: "guess-spotter", title: "Guess Spotter", text: "Spotted what the AI guessed", icon: "help", c: "var(--lime-400)" },
    { id: "detail-detective", title: "Detail Detective", text: "Cut the AI's guesses with details", icon: "search", c: "var(--pink-400)" },
    { id: "number-cruncher", title: "Number Cruncher", text: "Used numbers and predicted the effect", icon: "graph", c: "var(--teal-400)" },
    { id: "limit-setter", title: "Limit Setter", text: "Caught the AI and fixed it with a limit", icon: "shield", c: "var(--orange-400)" },
    { id: "fair-tester", title: "Fair Tester", text: "Ran a fair test and found the pattern", icon: "flask", c: "var(--blue-400)" },
    { id: "showcase-star", title: "Showcase Star", text: "Finished and shared a build", icon: "star", c: "var(--lime-400)" },
    { id: "prediction-pro", title: "Prediction Pro", text: "Made three correct predictions", icon: "eye", c: "var(--teal-400)" },
    { id: "why-asker", title: "Why Asker", text: "Asked the AI to explain a result", icon: "chat", c: "var(--pink-400)" },
  ];
})();
