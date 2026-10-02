/* ==========================================================================
   Supporting content: photo shot list, sample class, class showcase,
   organisation figures. Everything sample is labelled as sample in the UI.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;

  /* ---- Photography: art-directed slots. Drop a file in assets/photos/ and
         set `file` to use a real photo; until then a designed placeholder
         shows exactly what the shot should be. ------------------------------ */
  CX.data.photos = {
    hero: { file: null, art: "instructor", alt: "An instructor crouches beside two children watching a 3D planet change on their laptop", brief: "Instructor kneeling beside two 10–11 year olds as their prompt changes a 3D planet on screen. Classroom, natural light." },
    students: { file: null, art: "laptop-kids", alt: "Two children comparing a graph on a laptop", brief: "Two children at a laptop, one pointing at a 24-hour energy graph, mid-conversation." },
    instructors: { file: null, art: "instructor", alt: "An instructor asking a child what the AI guessed", brief: "Instructor asking a child to read out what the AI guessed. Child talking, instructor listening." },
    schools: { file: null, art: "class", alt: "A classroom of children building with AI, each in a different world", brief: "Wide shot: 15 children in a computing room, screens showing planets, stadiums, beat grids and towns." },
    organisations: { file: null, art: "network", alt: "Several clubs running the same session", brief: "Montage: the same session running in three different clubs." },
    showcase: { file: null, art: "present", alt: "A child presenting their prompt ladder to the class", brief: "Child presenting their share card on the board, pointing at their first and best prompts." },
    m1: { file: null, art: "laptop-kids", alt: "A child reading what the AI guessed", brief: "Child pointing at the pink “AI guessed” chips on screen, partner counting on fingers." },
    m2: { file: null, art: "laptop-kids", alt: "Children adding details to a prompt", brief: "Pair rewriting a prompt together, one typing, one suggesting a word." },
    m3: { file: null, art: "class", alt: "Children predicting on mini whiteboards", brief: "Children holding up mini whiteboards with their predictions before pressing Test." },
    m4: { file: null, art: "instructor", alt: "An instructor acting as a literal robot", brief: "Instructor acting out the “literal robot” warm-up while the class laughs." },
    m5: { file: null, art: "laptop-kids", alt: "Two children reading a results table", brief: "Two children leaning in to a results table on screen, one tracing a column with a finger." },
    m6: { file: null, art: "present", alt: "A gallery walk of finished builds", brief: "Gallery walk: children trying each other's builds and leaving sticky notes." },
  };

  /* ---- Sample class (15 builders). Nicknames only, by design.
         Same session, same skill, different worlds. ------------------------ */
  CX.data.classRoster = [
    { name: "Rocket Fox", colour: "pink", face: "happy", you: true, build: "planet", status: "test", prompt: "Make the highest jump you can, but my astronaut must land within 10 seconds", count: 4, guesses: 0 },
    { name: "Pixel Owl", colour: "lime", face: "grin", build: "beat", status: "decide", prompt: "Make the melody higher in pitch, not louder: double the frequency and keep the volume the same", count: 5, guesses: 0 },
    { name: "Comet Cat", colour: "teal", face: "wink", build: "kick", status: "prompt", prompt: "Hit the 18 m target", count: 2, guesses: 1 },
    { name: "Nova Bear", colour: "orange", face: "happy", build: "power", status: "decide", prompt: "Keep the lights on all night", count: 2, guesses: 1 },
    { name: "Turbo Newt", colour: "blue", face: "wow", build: "planet", status: "help", prompt: "Make my astronaut jump as high as possible", count: 2, guesses: 1 },
    { name: "Laser Lynx", colour: "pink", face: "think", build: "kick", status: "test", prompt: "Hit the 18 m target, keep the power at 90% and make sure the ball clears the wall", count: 5, guesses: 0 },
    { name: "Echo Hare", colour: "lime", face: "happy", build: "power", status: "prompt", prompt: "Keep the lights on but use less gas", count: 3, guesses: 2 },
    { name: "Quasar Pup", colour: "teal", face: "grin", build: "beat", status: "predict", prompt: "Make the melody higher", count: 2, guesses: 1 },
    { name: "Glitch Gecko", colour: "orange", face: "wink", build: "planet", status: "done", prompt: "Make the highest jump you can, but my astronaut must land within 10 seconds", count: 4, guesses: 0 },
    { name: "Orbit Otter", colour: "blue", face: "happy", build: "kick", status: "decide", prompt: "Hit the 18 m target and keep the power at 90%", count: 4, guesses: 0 },
    { name: "Byte Badger", colour: "pink", face: "grin", build: "power", status: "done", prompt: "Keep the lights on all day and night: use solar and wind, add a battery and keep gas under 20%", count: 5, guesses: 1 },
    { name: "Spark Wren", colour: "lime", face: "think", build: "beat", status: "prompt", prompt: "Make the notes higher but not louder", count: 3, guesses: 1 },
    { name: "Nebula Yak", colour: "teal", face: "happy", build: "planet", status: "predict", prompt: "Make the highest jump, but land in under 10 seconds", count: 4, guesses: 0 },
    { name: "Volt Moth", colour: "orange", face: "wow", build: "power", status: "test", prompt: "Use solar and wind with a big battery and keep gas under 20%", count: 5, guesses: 0 },
    { name: "Zigzag Koi", colour: "blue", face: "grin", build: "kick", status: "help", prompt: "Kick it really high and far", count: 2, guesses: 2 },
  ];

  /* Simulated classroom feed (instructor view, session 4 in progress) */
  CX.data.classEvents = [
    { who: "Turbo Newt", kind: "help", text: "is stuck: the astronaut floated away and never came back" },
    { who: "Pixel Owl", kind: "keep", text: "kept “higher in pitch, not louder”: 262 Hz → 523 Hz" },
    { who: "Nova Bear", kind: "undo", text: "undid “gas every night”: 46% gas was too much" },
    { who: "Laser Lynx", kind: "test", text: "tested 24° at 90%: clears the wall by 0.1 m, on target" },
    { who: "Quasar Pup", kind: "ask", text: "predicted the melody would sound higher (it only got louder)" },
    { who: "Byte Badger", kind: "keep", text: "kept a plan with no blackouts and 7% gas" },
    { who: "Comet Cat", kind: "vague", text: "asked “hit the target”. The AI ignored the wall" },
    { who: "Glitch Gecko", kind: "explain", text: "finished session 4: “the limit made the AI find the best answer”" },
    { who: "Zigzag Koi", kind: "help", text: "raised a hand: “it says I need numbers”" },
    { who: "Orbit Otter", kind: "test", text: "predicted right: the ball will hit the wall" },
    { who: "Volt Moth", kind: "ask", text: "added a limit: “keep gas under 20%”" },
    { who: "Echo Hare", kind: "vague", text: "wrote “use less gas”. The AI asked how much" },
  ];

  /* ---- Class showcase: finished session 6 products (sample) -------------- */
  CX.data.showcase = [
    {
      id: "planet",
      by: "Glitch Gecko",
      p: { look: "gas", colour: "purple", size: "giant", gravity: 1.6, rings: true, ringColour: "gold", moons: 3, name: "Glimmer" },
      first: { s: 1, t: "Make a planet", c: 1, g: 4 },
      best: { s: 6, t: "Call my planet Glimmer. Make it a giant purple gas planet with three moons and gold rings, set gravity like the Moon so I can jump 3 m, and explain why", c: 6, g: 0 },
      gr: [[1, 4], [2, 0], [4, 0], [4, 0], [5, 0], [6, 0]],
    },
    {
      id: "kick",
      by: "Laser Lynx",
      p: { angle: 30, power: 90, target: 21, wall: 9, night: true, name: "Lynx Lob" },
      first: { s: 1, t: "Kick the ball", c: 1, g: 3 },
      best: { s: 6, t: "Make my challenge a night match: target at 21 m, wall at 9 m, keep the power at 90%, test it so my friends know it works, and write a hint card", c: 6, g: 0 },
      gr: [[1, 3], [2, 2], [3, 0], [5, 0], [5, 0], [6, 0]],
    },
    {
      id: "beat",
      by: "Pixel Owl",
      p: { bpm: 100, kick: "x.......x.......", clap: "....x.......x...", hat: "x.x.x.x.x.x.x.x.", melody: true, pitch: 2, volume: 70, bass: true, fade: 4, name: "Owl Hop" },
      first: { s: 1, t: "Make a beat", c: 1, g: 4 },
      best: { s: 6, t: "Call my track Owl Hop. Add a bassline an octave lower so it sounds fuller, keep it at 100 BPM, fade out over the last 4 beats and explain the pitch", c: 6, g: 0 },
      gr: [[1, 4], [3, 0], [3, 0], [5, 0], [4, 0], [6, 0]],
    },
    {
      id: "power",
      by: "Byte Badger",
      p: { solar: 30, wind: 70, battery: "large", gas: "backup", gasMax: 10, farm: true, name: "Sunnyport" },
      first: { s: 1, t: "Power my town", c: 1, g: 4 },
      best: { s: 6, t: "Call my town Sunnyport. Add a wind farm on the hill, use a large battery, keep gas under 10% and show the 24-hour graph so the council can see it", c: 6, g: 0 },
      gr: [[1, 4], [2, 2], [3, 0], [5, 1], [5, 0], [6, 0]],
    },
  ];

  /* ---- ComputerXplorers today (from computerxplorers.co.uk + meeting notes).
         These describe the EXISTING organisation, not the new platform. ------- */
  CX.data.orgToday = [
    { value: 25, suffix: "+", label: "years teaching STEM", src: "computerxplorers.co.uk" },
    { value: 1000, suffix: "+", label: "schools worked with globally", src: "computerxplorers.co.uk (homepage)" },
    { value: 200000, suffix: "+", label: "children taught", src: "computerxplorers.co.uk (homepage)" },
    { value: 35000, prefix: "~", label: "children taught each week, globally", src: "computerxplorers.co.uk" },
  ];
  CX.data.orgMeeting = {
    ukClubs: 300,
    classSize: 15,
    pricing: [], // shared privately with ComputerXplorers
  };
})();
