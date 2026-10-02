/* ==========================================================================
   UI kit for the engagement deck. The icon set and the "Bit" LED-face
   characters are reused from the AI Builders Lab (ai-builders-lab/js/core/ui.js)
   so the deck and the product feel like one family. Returns HTML strings.
   ========================================================================== */
(function () {
  "use strict";

  var DECK = (window.DECK = window.DECK || {});

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---- Icon set (24px grid, 2.25 stroke) from the AI Builders Lab ------- */
  var I = {
    "arrow-up-right": "M7 17 17 7M8.5 7H17v8.5",
    "arrow-right": "M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5",
    "arrow-left": "M19.5 12h-15M11 5.5 4.5 12l6.5 6.5",
    "arrow-down": "M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5",
    "arrow-up": "M12 19.5v-15M5.5 11 12 4.5l6.5 6.5",
    "chev-right": "M9 5.5 15.5 12 9 18.5",
    "chev-down": "M5.5 9 12 15.5 18.5 9",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6 6 18",
    play: { d: "M7.5 4.8v14.4c0 .8.9 1.3 1.6.9l11.3-7.2a1 1 0 0 0 0-1.8L9.1 3.9c-.7-.4-1.6.1-1.6.9Z", fill: true },
    pause: "M8 5v14M16 5v14",
    restart: "M3.5 12a8.5 8.5 0 1 0 2.9-6.4M3.5 4.5v5h5",
    check: "M5 12.5l4.5 4.5L19 7",
    undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
    redo: "M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13",
    edit: "M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4",
    sparkle: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4",
    star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z",
    heart: "M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z",
    shield: "M12 3l7.5 3v6c0 4.6-3.1 7.7-7.5 9-4.4-1.3-7.5-4.4-7.5-9V6Z",
    "shield-check": "M12 3l7.5 3v6c0 4.6-3.1 7.7-7.5 9-4.4-1.3-7.5-4.4-7.5-9V6ZM8.8 12.2l2.2 2.2 4.4-4.6",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9M12 3C9.4 5.6 8.2 8.6 8.2 12s1.2 6.4 3.8 9",
    laptop: "M5 5.5h14v9.5H5zM2.5 18.5h19",
    microbit:
      "M4.5 7h15A2.5 2.5 0 0 1 22 9.5v5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 14.5v-5A2.5 2.5 0 0 1 4.5 7ZM6.5 10.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM17.5 10.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM10.2 10h.01M12 10h.01M13.8 10h.01M10.2 12h.01M12 12h.01M13.8 12h.01M10.2 14h.01M12 14h.01M13.8 14h.01",
    code: "M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15",
    flask: "M9 3h6M10 3v6l-5.2 9.2A1.9 1.9 0 0 0 6.5 21h11a1.9 1.9 0 0 0 1.7-2.8L14 9V3M7.4 14.5h9.2",
    users: "M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.3 6.3 0 0 1 3.5 5.8",
    school: "M2.5 21h19M5 21V10.5L12 5l7 5.5V21M10 21v-5h4v5M12 5V2.5h3",
    building: "M4 21V5l8-2v18M12 8.5h8V21M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2M2 21h20",
    pin: "M12 21s-7-6.1-7-11.4a7 7 0 0 1 14 0C19 14.9 12 21 12 21ZM12 7.3a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5V12l3.2 2",
    list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
    book: "M4 19.5V5a2 2 0 0 1 2-2h13.5v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13.5",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z",
    chat: "M4 5h16v11H9.5L4 20Z",
    help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2 1-1.2 1.7v.6M12 17.3h.01",
    info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v6M12 7.6h.01",
    alert: "M12 3.8 21.5 20h-19ZM12 10v4.2M12 17.2h.01",
    save: "M5 3.5h11l3.5 3.5v13.5H5ZM8 3.5v5h7.5M8 20.5v-7h8.5v7",
    share: "M18 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM18 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4",
    print: "M7 9V3.5h10V9M7 18H4V10.5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5V18h-3M7 14h10v7H7Z",
    sliders: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4",
    target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 11.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z",
    bolt: "M13 2.5 4.5 14H11l-1 7.5L19.5 10H13Z",
    rocket: "M12 15.5 8.5 12c1.3-4.8 4.8-8.2 11-9-.8 6.2-4.2 9.7-9 11M8.5 12 4.5 13l2.5-4.5 4.4-1M12 15.5l-1 4 4.5-2.5 1-4.4M14.8 8.2h.01M5.5 18.5c.5-1.5 1.5-2.5 3-3",
    maze: "M3.5 3.5h17v17h-17ZM8 3.5v9M8 16.5v4M12 7.5v13M16 3.5v12.5M12 7.5h4M3.5 12.5H8M16 16h4.5",
    gamepad: "M6.5 8.5h11a4.5 4.5 0 0 1 4.5 4.5v.8a3 3 0 0 1-5.4 1.8L15 13.5H9l-1.6 2.1A3 3 0 0 1 2 13.8V13a4.5 4.5 0 0 1 4.5-4.5ZM7.5 10.7v3.6M5.7 12.5h3.6M16 11.5h.01M18.2 13.5h.01",
    cpu: "M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM9.5 2.5V6M14.5 2.5V6M9.5 18v3.5M14.5 18v3.5M2.5 9.5H6M2.5 14.5H6M18 9.5h3.5M18 14.5h3.5M10 10h4v4h-4Z",
    search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM16 16l4.5 4.5",
    wand: "M5 19.5 15.5 9M13.5 3.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9ZM19 10.5l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6ZM18.5 3l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4Z",
    bug: "M8 9.5a4 4 0 0 1 8 0V15a4 4 0 0 1-8 0ZM12 10v9M3.5 10.5H8M16 10.5h4.5M3.5 15.5H8M16 15.5h4.5M9.5 5.5 7.5 3M14.5 5.5l2-2.5",
    sun: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    wind: "M3 9h11.5a3 3 0 1 0-3-3M3 15h15.5a3 3 0 1 1-3 3M3 12h8",
    leaf: "M5 19.5C5 11 10.5 4.8 20 4c-.8 9.5-7 15.5-15 15.5ZM5 19.5l7.5-7.5",
    key: "M8 11a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM11.2 12.3 20 3.5M16.5 7l2.5 2.5M14.3 9.2l2 2",
    camera: "M4 8h3.2L9 5h6l1.8 3H20v11.5H4ZM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
    hand: "M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5c0 4.2-2.6 7-6.2 7-2.4 0-4-1.1-5.6-3.5L3.9 13.6a1.5 1.5 0 0 1 2.5-1.6L8 14",
    jump: "M12 2.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 8.5V15M12 15l-4.5 6.5M12 15l4.5 6.5M4 6.5l8 3 8-3",
    graph: "M4 20V4M4 20h16M7 15.5l4-5 3 3 5.5-7",
    layers: "M12 3l9 5-9 5-9-5ZM3 13l9 5 9-5",
    grid: "M4 4h6.5v6.5H4ZM13.5 4H20v6.5h-6.5ZM4 13.5h6.5V20H4ZM13.5 13.5H20V20h-6.5Z",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    offline: "M3 3l18 18M8.4 6.6A6 6 0 0 1 18 10.5a4 4 0 0 1 2.6 6.8M16.5 18H7a4.5 4.5 0 0 1-1.6-8.7",
    wifi: "M2.5 8.8a14.5 14.5 0 0 1 19 0M5.5 12.2a10 10 0 0 1 13 0M8.6 15.6a5.2 5.2 0 0 1 6.8 0M12 19.2h.01",
    database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3ZM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    trash: "M4 7h16M9.5 7V4h5v3M6 7l1 13.5h10L18 7",
    user: "M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21a8 8 0 0 1 16 0",
    compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM15.6 8.4l-2 5.2-5.2 2 2-5.2Z",
    repeat: "M17 2.5l3 3-3 3M4 11V9.5a4 4 0 0 1 4-4h12M7 21.5l-3-3 3-3M20 13v1.5a4 4 0 0 1-4 4H4",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    lock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM8 11V7.5a4 4 0 0 1 8 0V11",
    unlock: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM8 11V7.5a4 4 0 0 1 7.7-1.5",
    trophy: "M8 21h8M12 16.5V21M7 3.5h10V9a5 5 0 0 1-10 0ZM7 5.5H4a3 3 0 0 0 3.2 4.3M17 5.5h3a3 3 0 0 1-3.2 4.3",
    flag: "M5 21V3.5M5 4h12l-2.5 4.5L17 13H5",
    map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2ZM9 4v14M15 6v14",
    calendar: "M4.5 5.5h15A1.5 1.5 0 0 1 21 7v12.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5V7a1.5 1.5 0 0 1 1.5-1.5ZM3 10.5h18M8 3v4.5M16 3v4.5",
    board: "M3 4h18M4.5 4v11h15V4M12 15v3M8 21l4-3 4 3",
    "thumb-up": "M7 10.5V21H3.5V10.5ZM7 10.5 11 3a2 2 0 0 1 3 2.2l-1 5.3h6.2a2 2 0 0 1 2 2.4l-1.4 6.6A2 2 0 0 1 17.8 21H7",
    trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
    move: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3",
    wave: "M2 12h3.5l2.5-6.5 4 13 3-9.5 2 3h5",
    button: "M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    tool: "M14.5 3.5a5 5 0 0 0-4.6 6.9L3.5 16.8 7.2 20.5l6.4-6.4a5 5 0 0 0 6.9-4.6l-3 3-3.5-3.5 3-3a5 5 0 0 0-2.5-3Z",
    quote: "M10 7H6.5A2.5 2.5 0 0 0 4 9.5V13h5v5H4M20 7h-3.5A2.5 2.5 0 0 0 14 9.5V13h5v5h-5",
    "volume": "M4 9h4l5-4.5v15L8 15H4ZM16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13",
    "volume-off": "M4 9h4l5-4.5v15L8 15H4ZM17 9.5l5 5M22 9.5l-5 5",
    car: "M5 16.5V12l2-5.5h10l2 5.5v4.5M3.5 12h17M7.5 16.5a1.8 1.8 0 1 0 0 .1M16.5 16.5a1.8 1.8 0 1 0 0 .1",
    keyboard: "M3.5 6.5h17A1.5 1.5 0 0 1 22 8v8a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 16V8a1.5 1.5 0 0 1 1.5-1.5ZM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7.5 14h9",
    pointer: "M5 3.5l13 6.2-5.6 1.7-2.4 5.6Z",
    split: "M4 4h16v16H4ZM11 4v16",
    film: "M4 4h16v16H4ZM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4",
    pencil: "M15.5 4.5l4 4L8 20H4v-4ZM13.5 6.5l4 4",
  };

  /* Extra icons for the deck (same grid and stroke) */
  var EXTRA = {
    phone: "M6.5 3.5h3l1.6 4.2-2.1 1.4a10.5 10.5 0 0 0 5.9 5.9l1.4-2.1 4.2 1.6v3a1.6 1.6 0 0 1-1.7 1.6C11.3 18.6 5.4 12.7 4.9 5.2A1.6 1.6 0 0 1 6.5 3.5Z",
    gate: "M4 21V10.5a8 8 0 0 1 16 0V21M2.5 21h19M9 21v-6.5a3 3 0 0 1 6 0V21",
    sticky: "M5 4h14v10.5L13.5 20H5ZM13.5 20v-5.5H19",
    package: "M12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1-1",
    fullscreen: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
    route: "M6 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 16.5v-6a4 4 0 0 1 4-4h6M18 7.5v6a4 4 0 0 1-4 4H8",
    ear: "M7 9.5a5.5 5.5 0 0 1 11 0c0 3.2-3.2 4.2-3.2 7.2a3.3 3.3 0 0 1-6.3 1.3M10.2 9.8a2.3 2.3 0 0 1 4.4-.6",
    crash: "M12 3.5 14 9l5.5-1.5L16 12l4 4-5.5-.5L13 21l-2-5-5 2 2.5-5L4 9.5 9.5 9Z",
    display: "M3.5 4.5h17v11h-17ZM9 20h6M12 15.5V20",
    network: "M12 3.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM5 16.1a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM19 16.1a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM12 7.9V12M12 12l-5.6 4.6M12 12l5.6 4.6",
    firewall: "M3.5 5.5h17v13h-17ZM3.5 10h17M3.5 14.5h17M9 5.5V10M15 10v4.5M9 14.5v4",
    account: "M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4.5 20.5a7.5 7.5 0 0 1 15 0",
    support: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM5.6 5.6l4 4M14.4 14.4l4 4M18.4 5.6l-4 4M9.6 14.4l-4 4",
    question: "M9.2 9a3 3 0 1 1 4.2 2.8c-.9.4-1.4 1.2-1.4 2.1v.6M12 18.2h.01",
    pulse: "M3 12h4l2.5-6 4 12 2.5-6H21",
    loop: "M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5",
    hourglass: "M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5s-4.5 4-4.5 8.5M16.5 3.5c0 4.5-4.5 5.5-4.5 8.5s4.5 4 4.5 8.5",
    heartbeat: "M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20ZM6.5 12h3l1.5-2.5 2 5 1.5-2.5h3",
    pound: "M16.5 6.5A3.8 3.8 0 0 0 9.2 8v4.2c0 3.3-1 5.8-3.2 7.3h12M6.5 12.5h8",
    mail: "M3.5 5.5h17v13h-17ZM3.5 6.5l8.5 6.5 8.5-6.5",
    bolt2: "M13 2.5 4.5 14H11l-1 7.5L19.5 10H13Z",
  };
  Object.keys(EXTRA).forEach(function (k) {
    I[k] = EXTRA[k];
  });

  function icon(name, cls, title) {
    var def = I[name] || I.sparkle;
    var d = typeof def === "string" ? def : def.d;
    var fill = typeof def === "object" && def.fill;
    return (
      '<svg class="i ' +
      (cls || "") +
      '" viewBox="0 0 24 24" ' +
      (title ? 'role="img" aria-label="' + esc(title) + '"' : 'aria-hidden="true" focusable="false"') +
      ' fill="' +
      (fill ? "currentColor" : "none") +
      '" stroke="' +
      (fill ? "none" : "currentColor") +
      '" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="' +
      d +
      '"/></svg>'
    );
  }

  /* ---- LED faces (5×5, micro:bit style) ---------------------------------- */
  var FACES = {
    happy: [".....", ".#.#.", ".....", "#...#", ".###."],
    grin: [".#.#.", ".....", "#####", "#...#", ".###."],
    wow: [".#.#.", ".....", ".###.", ".#.#.", ".###."],
    wink: [".....", "##.#.", ".....", "#...#", ".###."],
    think: [".....", ".#.#.", ".....", ".###.", "....."],
    sad: [".....", ".#.#.", ".....", ".###.", "#...#"],
    love: [".#.#.", "#####", "#####", ".###.", "..#.."],
    tick: [".....", "....#", "...#.", "#.#..", ".#..."],
    cross: ["#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
    star: ["..#..", "#####", ".###.", ".#.#.", "#...#"],
    jump: ["..#..", "#.#.#", ".###.", "..#..", ".#.#."],
    ask: [".###.", "#...#", "..##.", ".....", "..#.."],
  };
  var EYE_ROWS = { happy: [1], grin: [0], wow: [0], wink: [1], think: [1], sad: [1] };
  var BODY = {
    pink: ["#efabcd", "#e483b3"],
    lime: ["#dbe751", "#c0cd36"],
    teal: ["#49a7a9", "#33898c"],
    orange: ["#f07c3a", "#d9642a"],
    blue: ["#4a86f2", "#3568cc"],
    white: ["#ffffff", "#ddd6ca"],
  };

  function ledGrid(face, x0, y0, step, size, opts) {
    opts = opts || {};
    var rows = Array.isArray(face) ? face : FACES[face] || FACES.happy;
    var eyes = EYE_ROWS[face] || [];
    var on = opts.on || "#dbe751";
    var offFill = opts.off || "rgba(255,255,255,0.09)";
    var out = "";
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        var lit = rows[r] && rows[r][c] === "#";
        out +=
          '<rect x="' + (x0 + c * step) + '" y="' + (y0 + r * step) + '" width="' + size + '" height="' + size + '" rx="' + size * 0.3 + '" fill="' + (lit ? on : offFill) + '"' +
          (lit ? ' class="led-on' + (eyes.indexOf(r) !== -1 ? " led-eye" : "") + '"' : "") +
          "/>";
      }
    }
    return out;
  }

  /* A "Bit": the rounded character with a micro:bit-style LED face */
  function bitSvg(colour, face, opts) {
    opts = opts || {};
    var c = BODY[colour] || BODY.pink;
    var led = opts.led || (colour === "lime" ? "#ffffff" : "#dbe751");
    return (
      '<svg viewBox="0 0 120 124" aria-hidden="true">' +
      '<path d="M60 20V9" stroke="' + c[1] + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="60" cy="8" r="7" fill="' + (colour === "lime" ? "#49a7a9" : "#dbe751") + '"/>' +
      '<rect x="1" y="58" width="12" height="26" rx="6" fill="' + c[1] + '"/>' +
      '<rect x="107" y="58" width="12" height="26" rx="6" fill="' + c[1] + '"/>' +
      '<rect x="8" y="18" width="104" height="104" rx="32" fill="' + c[1] + '"/>' +
      '<rect x="8" y="16" width="104" height="100" rx="32" fill="' + c[0] + '"/>' +
      '<ellipse cx="34" cy="31" rx="13" ry="6" fill="#fff" opacity=".38" transform="rotate(-24 34 31)"/>' +
      '<rect x="23" y="33" width="74" height="70" rx="18" fill="#0b012b"/>' +
      ledGrid(face || "happy", 33, 43, 11.6, 8.6, { on: led }) +
      "</svg>"
    );
  }

  function bit(o) {
    o = o || {};
    var style = "--size:" + (o.size || 110) + "px;--rot:" + (o.rot == null ? -8 : o.rot) + "deg;" + (o.style || "");
    var cls = "bit " + (o.float === false ? "" : o.slow ? "bit--float-slow " : "bit--float ") + (o.cls || "");
    return '<span class="' + cls + '" style="' + style + '"' + (o.attrs || "") + ">" + bitSvg(o.colour || "pink", o.face || "happy") + "</span>";
  }

  function sparkle(cls, style) {
    return (
      '<svg class="sparkle ' + (cls || "") + '" style="' + (style || "") + '" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3c1.6 9.6 5.4 13.4 15 15-9.6 1.6-13.4 5.4-15 15-1.6-9.6-5.4-13.4-15-15 9.6-1.6 13.4-5.4 15-15Z" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/></svg>'
    );
  }

  function ticker(items, o) {
    o = o || {};
    var run = items
      .map(function (t) {
        return '<span class="ticker__item">' + esc(t) + icon("sparkle") + "</span>";
      })
      .join("");
    return (
      '<div class="ticker ' + (o.cls || "") + '" style="--speed:' + (o.speed || 40) + "s;" + (o.style || "") + '" role="marquee" aria-label="' + esc(items.join(", ")) + '">' +
      '<div class="ticker__track" aria-hidden="true">' + run + run + run + run + "</div></div>"
    );
  }

  DECK.ui = {
    esc: esc,
    icon: icon,
    icons: I,
    bit: bit,
    bitSvg: bitSvg,
    faces: FACES,
    sparkle: sparkle,
    ticker: ticker,
  };
})();
