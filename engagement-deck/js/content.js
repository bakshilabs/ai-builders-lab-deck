/* ==========================================================================
   EDITABLE CONTENT
   --------------------------------------------------------------------------
   Everything that changes as the engagement moves round the loop lives here,
   so the deck can be updated after each stage without touching the layout.

   Rules (from the brief):
   - Never add quotes, findings, results or targets before they exist.
   - Empty lists show clearly labelled placeholders on the slides.
   - When you add a real finding, say where it came from (heardFrom).
   - Keep slide copy in UK English, short and warm. No em dashes.
   ========================================================================== */
(function () {
  "use strict";

  var DECK = (window.DECK = window.DECK || {});

  DECK.content = {
    /* ---- Where we are today --------------------------------------------
       stage: listen | co-design | build | train | pilot | learn | improve | scale
       Shown as "We are here" on the partnership loop (slide 23). */
    progress: {
      stage: "listen",
      status: "Proposed. Interviews not yet booked.",
    },

    /* ---- Slide 5: who we listen to -------------------------------------
       The groups are suggestions. The final list of people is agreed with
       ComputerXplorers. Add them to `participants` once agreed. */
    groups: [
      {
        id: "curriculum",
        name: "Curriculum leadership",
        short: "Curriculum",
        icon: "book",
        colour: "lime",
        explore: ["Objectives", "Pedagogy", "Progression", "Age appropriateness", "Assessment", "Curriculum fit"],
      },
      {
        id: "delivery",
        name: "Delivery and instructor leadership",
        short: "Delivery",
        icon: "board",
        colour: "teal",
        explore: ["Lesson usability", "Classroom management", "Instructor confidence", "Timing", "Differentiation", "Troubleshooting"],
      },
      {
        id: "schools",
        name: "School and partnership leadership",
        short: "Schools",
        icon: "school",
        colour: "pink",
        explore: ["School expectations", "IT requirements", "Safeguarding", "GDPR", "Parent expectations", "Procurement", "Deployment"],
      },
      {
        id: "franchise",
        name: "Franchise and affiliate leadership",
        short: "Franchise",
        icon: "map",
        colour: "orange",
        explore: ["Consistency", "Localisation", "Scalability", "Training", "Support", "Regional differences"],
      },
      {
        id: "senior",
        name: "Senior leadership",
        short: "Senior",
        icon: "compass",
        colour: "blue",
        explore: ["Strategic fit", "Commercial model", "Differentiation", "Long-term opportunity", "Organisational risk", "Definition of success"],
      },
    ],

    /* Agreed interviewees, e.g. { name: "…", role: "…", group: "curriculum", date: "2026-10-14" } */
    participants: [],

    /* ---- Slide 6: the 20-minute interview ------------------------------ */
    interview: [
      {
        from: 0,
        to: 2,
        title: "Context",
        colour: "white",
        say: "We have built an early interactive AI Lab prototype. We are not asking you to approve it. We want to understand how ComputerXplorers thinks about AI learning so we can shape the experience around your pedagogy.",
        questions: [],
      },
      {
        from: 2,
        to: 7,
        title: "What should children learn?",
        colour: "lime",
        questions: [
          "What should a 10 to 11 year old understand about AI after six hours?",
          "What should they be able to do?",
          "What should they be able to explain?",
          "What would make you say the experience was genuinely worthwhile?",
        ],
      },
      {
        from: 7,
        to: 12,
        title: "How should children learn it?",
        colour: "teal",
        questions: [
          "What does a great ComputerXplorers lesson look like?",
          "How much explanation versus making?",
          "Where should physical activity appear?",
          "How much freedom should students have?",
          "What role should instructors play?",
          "What should happen when a child gets stuck?",
        ],
      },
      {
        from: 12,
        to: 16,
        title: "What concerns you?",
        colour: "pink",
        questions: [
          "What worries you about AI in children's education?",
          "What would make this feel like AI is doing the thinking?",
          "What would you never want the platform to encourage?",
          "What might schools or parents challenge?",
        ],
      },
      {
        from: 16,
        to: 18,
        title: "What makes it ComputerXplorers?",
        colour: "orange",
        questions: [
          "Which existing activities are the best references?",
          "What visual or interaction patterns feel authentically ComputerXplorers?",
          "What should we preserve?",
          "What should we avoid?",
        ],
      },
      {
        from: 18,
        to: 20,
        title: "The ideal outcome",
        colour: "blue",
        questions: ["If we got this exactly right, what would you want to see a child doing, building or explaining at the end?"],
      },
    ],

    /* ---- Slide 7: interview synthesis -----------------------------------
       Leave every list empty until the interviews have happened. Then add
       items like { text: "Short finding in plain words", heardFrom: "Curriculum, Delivery" }.
       Do not flatten genuine disagreement into false consensus. */
    findings: {
      interviewsDone: 0,
      consensus: [],
      openQuestions: [],
      differences: [],
      implications: [],
      principles: [], // e.g. "The child decides. AI suggests."
    },

    /* ---- Slide 8: the workshop ----------------------------------------- */
    workshop: {
      date: null, // e.g. "Thursday 12 November 2026, Guildford"
      heard: [], // "What we heard" themes, added after the interviews
      parts: [
        {
          n: 1,
          title: "What we heard",
          mins: "10 to 15",
          weight: 12.5,
          text: "Themes from the interviews, shown as what we heard, never as fact.",
          starters: ["We heard…", "Several people highlighted…", "There were differing views on…"],
        },
        {
          n: 2,
          title: "The child journey",
          mins: "15",
          weight: 15,
          text: "Map the journey together and mark where ComputerXplorers pedagogy belongs.",
          journey: ["Arrive", "Discover", "Build", "Struggle", "Ask", "Test", "Change", "Explain", "Show"],
        },
        {
          n: 3,
          title: "Prototype the lessons",
          mins: "30 to 40",
          weight: 35,
          text: "Use the AI Lab live. What feels right, what feels wrong, where is AI doing too much?",
          examples: [
            { name: "Planet Builder", flow: ["Make a planet", "Spot the guesses", "Half of Earth's gravity", "Predict, then test"] },
            { name: "Kick Lab", flow: ["AI guesses 70°", "Ball drops short", "Test 30°, 45°, 60°", "Decide"] },
            { name: "Beat Lab", flow: ["Make a beat", "Beats 1 to 4 at 100 BPM", "A melody that goes up"] },
            { name: "Power Town", flow: ["Solar only", "Blackout at night", "Solar, wind and a battery"] },
          ],
        },
        {
          n: 4,
          title: "Design exercises together",
          mins: "20 to 30",
          weight: 25,
          text: "Take two or three exercises and change them live, so the changes are visible.",
          changes: ["Activity structure", "Instructions", "AI behaviour", "Challenge", "Reflection", "Instructor prompts", "Success criteria"],
        },
        {
          n: 5,
          title: "Define success",
          mins: "10 to 15",
          weight: 12.5,
          text: "Agree what evidence would show the course is working. Targets are set together.",
        },
      ],
    },

    /* ---- Slide 15: the success scorecard ---------------------------------
       No numbers until they are agreed with ComputerXplorers. Add agreed
       targets to `targets`, keyed by measure, e.g. targets: { "Engagement": "…" }. */
    scorecard: {
      targets: {},
      groups: [
        {
          id: "student",
          name: "Student",
          icon: "user",
          colour: "lime",
          question: "Do children want to build, test and keep going? Can they explain what the AI did?",
          measures: [
            { name: "Engagement", how: "Observed in class" },
            { name: "Understanding", how: "Quick checks" },
            { name: "Explaining AI behaviour", how: "The Explain step" },
            { name: "Testing", how: "Tests they run" },
            { name: "Debugging", how: "Problems they find" },
            { name: "Independent decisions", how: "Keep, change or undo" },
            { name: "Quality of final project", how: "Showcase" },
          ],
        },
        {
          id: "instructor",
          name: "Instructor",
          icon: "board",
          colour: "teal",
          question: "Can instructors deliver the lessons confidently and within the time?",
          measures: [
            { name: "Confidence", how: "Before and after" },
            { name: "Lesson clarity", how: "Instructor feedback" },
            { name: "Classroom flow", how: "Observed timing" },
            { name: "Supporting mixed abilities", how: "Support and extension use" },
          ],
        },
        {
          id: "school",
          name: "School",
          icon: "school",
          colour: "pink",
          question: "Does it work on real school devices and networks, and meet school expectations?",
          measures: [
            { name: "Technical reliability", how: "Session log" },
            { name: "Safeguarding confidence", how: "School feedback" },
            { name: "Appropriate content", how: "School review" },
            { name: "Acceptable network requirements", how: "IT checklist" },
          ],
        },
        {
          id: "organisation",
          name: "Organisation",
          icon: "globe",
          colour: "orange",
          question: "Can ComputerXplorers support the experience again and again?",
          measures: [
            { name: "Repeatability", how: "Across pilot sites" },
            { name: "Scalability", how: "Support load" },
            { name: "Training effort", how: "Hours to confident" },
            { name: "Platform reliability", how: "Incidents" },
            { name: "Curriculum consistency", how: "Across instructors" },
          ],
        },
      ],
    },

    /* ---- Slide 17: monthly releases (shown on the "Shared with ComputerXplorers" card) ---------------------------------------
       After real deployments, add one entry per release, e.g.
       { month: "January 2027", changed: "…", why: "…", heardFrom: "Instructors" } */
    releases: [],

    /* ---- Slide 22: decision gates -----------------------------------------
       status: "upcoming" | "now" | "passed". Add the decision once made. */
    gates: [
      { n: 1, after: "After the interviews", question: "Do we understand the educational direction?", status: "upcoming", decision: null },
      { n: 2, after: "After the workshop", question: "Do we agree on the learning model and the priority changes?", status: "upcoming", decision: null },
      { n: 3, after: "After the build sprint", question: "Is the product ready for a controlled pilot?", status: "upcoming", decision: null },
      { n: 4, after: "After the pilot", question: "What must change before broader deployment?", status: "upcoming", decision: null },
      { n: 5, after: "After initial deployment", question: "Is the operating model ready to scale?", status: "upcoming", decision: null },
    ],

    /* ---- The prompt ladder: use these exact words so the deck and the
       prototype match. Rungs 1 to 5 are sessions 1 to 5; session 6 is the
       showcase. -------------------------------------------------------------- */
    ladder: [
      { n: 1, t: "Say what you want", s: "Spot the AI's guesses" },
      { n: 2, t: "Add details", s: "Make it yours" },
      { n: 3, t: "Add numbers", s: "Predict, test, cause and effect" },
      { n: 4, t: "Set a goal and limits", s: "Catch the AI's mistakes" },
      { n: 5, t: "Ask it to test and explain", s: "Decide from the evidence" },
    ],

    /* ---- A unit: six one-hour sessions. Each child works in their chosen
       build, and the build grows every session. These are the DESIGNED
       progression, to be tested in the pilot, not results. ------------------ */
    unit: {
      sessions: [
        { n: 1, title: "Say what you want", does: "First prompt. Spot the AI's guesses.", ingredients: 1, guesses: 4, level: 0 },
        { n: 2, title: "Add details", does: "Make it theirs with details the AI can't guess.", ingredients: 2, guesses: 3, level: 1 },
        { n: 3, title: "Add numbers", does: "Predict, test, and see cause and effect.", ingredients: 3, guesses: 2, level: 1 },
        { n: 4, title: "Set a goal and limits", does: "Catch the AI's mistakes.", ingredients: 4, guesses: 1, level: 2 },
        { n: 5, title: "Test and explain", does: "Ask the AI to test, then explain the evidence.", ingredients: 5, guesses: 0, level: 2 },
        { n: 6, title: "Finish, share and present", does: "Present a finished product to share.", ingredients: 6, guesses: 0, level: 3 },
      ],
      levels: ["Passive AI user", "AI-assisted creator", "AI-aware creator", "Independent creator"],
    },

    /* ---- The four interest builds. Same prompting skills, different worlds.
       Children pick a build by interest; the class learns the same skill
       together. `screen` is the capture in assets/screens/, `route` the live
       Lab route. --------------------------------------------------------------- */
    builds: [
      {
        id: "planet",
        name: "Planet Builder",
        interest: "Space",
        icon: "globe",
        colour: "pink",
        science: "Gravity and forces",
        maths: "Halving and doubling",
        product: "Planet Passport",
        productNote: "for the planet they built",
        screen: "build-planet.jpg",
        route: "#/build/planet/1",
        versions: [
          { skill: "Say what you want", prompt: "Make a planet", guess: "Earth-like gravity", result: "An Earth-like planet. Everything the AI guessed is highlighted." },
          { skill: "Add details", prompt: "Make a small red planet like Mars", result: "Small and red now. The gravity is still the AI's guess." },
          { skill: "Add numbers", prompt: "Make gravity half of Earth's so my astronaut can jump twice as high", predict: "Predict first: half the gravity, twice the jump?", result: "Tested: the jump goes from 0.5 m to 1.0 m." },
        ],
      },
      {
        id: "kick",
        name: "Kick Lab",
        interest: "Sport",
        icon: "target",
        colour: "lime",
        science: "Forces",
        maths: "Angles",
        product: "Free-Kick Challenge",
        productNote: "that friends can try",
        screen: "build-kick.jpg",
        route: "#/build/kick/1",
        versions: [
          { skill: "Say what you want", prompt: "Kick it over the wall into the goal", guess: "a 70° kick", result: "The ball drops short. Steeper is not always further." },
          { skill: "Ask it to test and explain", prompt: "Test 30°, 45° and 60° at 90% power and show me a table", result: "30° and 60° land in the same place; 45° goes furthest." },
          { skill: "Decide", prompt: "The child decides from the evidence", result: "They choose the angle, and explain why it works." },
        ],
      },
      {
        id: "beat",
        name: "Beat Lab",
        interest: "Music",
        icon: "volume",
        colour: "teal",
        science: "Sound and pitch",
        maths: "Fractions and beats per minute",
        product: "A named track",
        productNote: "with their own beat and melody",
        screen: "build-beat.jpg",
        route: "#/build/beat/1",
        versions: [
          { skill: "Say what you want", prompt: "Make a beat", guess: "the speed and the drums", result: "A beat, but the AI chose the speed and the drums." },
          { skill: "Add numbers", prompt: "Kick on beats 1 and 3, clap on 2 and 4, at 100 BPM", result: "Exactly that beat: 100 beats per minute." },
          { skill: "Add details", prompt: "Add a melody that goes up: C D E G", result: "Higher notes mean faster vibrations." },
        ],
      },
      {
        id: "power",
        name: "Power Town",
        interest: "Planet",
        icon: "sun",
        colour: "orange",
        science: "Energy",
        maths: "Percentages and line graphs",
        product: "Town Energy Plan",
        productNote: "that keeps the lights on",
        screen: "build-power.jpg",
        route: "#/build/power/1",
        versions: [
          { skill: "Say what you want", prompt: "Power my town with clean energy", guess: "solar panels only", result: "Blackout at night. No sun, no power." },
          { skill: "Set a goal and limits", prompt: "Use solar and wind, add a battery, and keep gas under 20% as a backup", result: "The lights stay on and CO2 stays low." },
          { skill: "Explain", prompt: "The child explains the cause and effect", result: "Solar alone failed at night. Wind and the battery cover it." },
        ],
      },
    ],

    /* ---- Slide 19: ComputerXplorers today --------------------------------
       Figures describe the existing organisation, with their source. They
       are context, not rollout targets. */
    today: [
      { value: 300, prefix: "~", suffix: "", label: "after-school clubs across the UK", source: "Meeting, 30 September 2026" },
      { value: 35000, prefix: "", suffix: "", label: "children taught each week", source: "computerxplorers.co.uk" },
      { value: 35, prefix: "", suffix: "+", label: "UK franchises", source: "computerxplorers.co.uk" },
    ],
  };
})();
