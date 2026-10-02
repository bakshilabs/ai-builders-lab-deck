/* ==========================================================================
   3D scenes (three.js, vendored locally in js/vendor/three.js).

   - hero:   the AI Builders Lab (a 3D "Bit") with four interest worlds in
             orbit, inside the glowing eight-stage partnership ring.
   - worlds: the four builds as small 3D worlds that change with each prompt
             (Planet Builder, Kick Lab, Beat Lab, Power Town).
   - flow:   particles that carry feedback into the product (slide 13).

   Rules: only the active slide renders; device pixel ratio is capped at 2
   (and scaled to the stage); reduced motion renders one still frame; no
   WebGL means the designed fallback stays visible.
   ========================================================================== */
(function () {
  "use strict";

  var DECK = window.DECK;
  var T = window.THREE;
  var SC = (DECK.scenes = {});

  function hasWebGL() {
    if (!T) return false;
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (err) {
      return false;
    }
  }
  SC.ok = hasWebGL();
  if (!SC.ok) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  /* ---- shared loop -------------------------------------------------------- */
  var views = [];
  var running = false;
  var last = 0;
  function loop(now) {
    var any = false;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    for (var i = 0; i < views.length; i++) {
      var v = views[i];
      if (v.on) {
        any = true;
        if (!document.hidden) v.frame(now / 1000, dt);
      }
    }
    if (any) requestAnimationFrame(loop);
    else running = false;
  }
  function kick() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  function View(host, opts) {
    opts = opts || {};
    this.host = host;
    this.w = host.offsetWidth || opts.w || 800;
    this.h = host.offsetHeight || opts.h || 600;
    this.maxRatio = opts.maxRatio || 2;
    var r = new T.WebGLRenderer({ antialias: opts.antialias !== false, alpha: true, powerPreference: "high-performance" });
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = T.SRGBColorSpace;
    r.domElement.className = "three-canvas";
    host.appendChild(r.domElement);
    host.classList.add("has-3d");
    this.r = r;
    this.scene = new T.Scene();
    this.on = false;
    this.staticT = 2.4;
    this.resize();
    views.push(this);
  }
  View.prototype.resize = function () {
    var ratio = Math.min(window.devicePixelRatio || 1, 2) * (DECK.scale || 1);
    ratio = Math.max(0.5, Math.min(this.maxRatio, ratio));
    this.r.setPixelRatio(ratio);
    this.r.setSize(this.w, this.h, false);
    this.r.domElement.style.width = this.w + "px";
    this.r.domElement.style.height = this.h + "px";
    if (this.cam && this.cam.isPerspectiveCamera) {
      this.cam.aspect = this.w / this.h;
      this.cam.updateProjectionMatrix();
    }
  };
  View.prototype.frame = function (t, dt) {
    if (this.update) this.update(t, dt);
    this.r.render(this.scene, this.cam);
  };
  View.prototype.start = function () {
    this.resize();
    if (DECK.reduced()) {
      this.on = false;
      this.frame(this.staticT, 0.016);
      return;
    }
    this.on = true;
    kick();
  };
  View.prototype.stop = function () {
    this.on = false;
  };
  DECK.on("resize", function () {
    views.forEach(function (v) {
      v.resize();
      if (!v.on && v.drawn) v.frame(v.staticT, 0.016);
    });
  });

  /* ---- textures and sprites ---------------------------------------------- */
  function rgba(hex, a) {
    var n = parseInt(hex.replace("#", ""), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  var glowCache = {};
  function glowTex(hex) {
    if (glowCache[hex]) return glowCache[hex];
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, rgba(hex, 1));
    grd.addColorStop(0.22, rgba(hex, 0.55));
    grd.addColorStop(0.55, rgba(hex, 0.14));
    grd.addColorStop(1, rgba(hex, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    var t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return (glowCache[hex] = t);
  }
  function glow(hex, size, opacity) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(hex), transparent: true, opacity: opacity == null ? 1 : opacity, blending: T.AdditiveBlending, depthWrite: false }));
    sp.scale.set(size, size, 1);
    return sp;
  }

  /* Text labels drawn on a fixed-size canvas (no resizing after upload) */
  var labels = [];
  function label(text, o) {
    o = o || {};
    var W = 512;
    var H = 112;
    var c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    var tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;
    function draw() {
      var g = c.getContext("2d");
      g.clearRect(0, 0, W, H);
      var fs = 62;
      g.font = fs + 'px "Lilita One", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
      var tw = Math.min(W - 40, g.measureText(text).width);
      var pw = tw + 64;
      var x0 = (W - pw) / 2;
      g.beginPath();
      var r = 44;
      g.moveTo(x0 + r, 10);
      g.arcTo(x0 + pw, 10, x0 + pw, H - 10, r);
      g.arcTo(x0 + pw, H - 10, x0, H - 10, r);
      g.arcTo(x0, H - 10, x0, 10, r);
      g.arcTo(x0, 10, x0 + pw, 10, r);
      g.closePath();
      g.fillStyle = o.bg || "rgba(11,1,43,0.82)";
      g.fill();
      if (o.ring) {
        g.lineWidth = 5;
        g.strokeStyle = o.ring;
        g.stroke();
      }
      g.fillStyle = o.color || "#ffffff";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(text, W / 2, H / 2 + 4, W - 60);
      tex.needsUpdate = true;
    }
    draw();
    labels.push(draw);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest !== false }));
    var h = o.h || 0.36;
    sp.scale.set((h * W) / H, h, 1);
    return sp;
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      labels.forEach(function (d) {
        d();
      });
    });
  }

  function canvasTex(w, h, paint) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    paint(c.getContext("2d"), w, h);
    var t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function rand(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function blobs(g, w, h, n, colours, seed, rmin, rmax) {
    var r = rand(seed);
    for (var i = 0; i < n; i++) {
      g.fillStyle = colours[i % colours.length];
      g.beginPath();
      var x = r() * w;
      var y = h * 0.15 + r() * h * 0.7;
      var rad = rmin + r() * (rmax - rmin);
      for (var k = 0; k < 9; k++) {
        var a = (k / 9) * Math.PI * 2;
        var rr = rad * (0.7 + r() * 0.5);
        var px = x + Math.cos(a) * rr * 1.5;
        var py = y + Math.sin(a) * rr;
        if (k === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fill();
    }
  }

  function starfield(n, rMin, rMax, seed) {
    var r = rand(seed || 3);
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var palette = [new T.Color("#ffffff"), new T.Color("#dbe751"), new T.Color("#49a7a9"), new T.Color("#efabcd")];
    for (var i = 0; i < n; i++) {
      var u = r() * 2 - 1;
      var th = r() * Math.PI * 2;
      var rad = rMin + r() * (rMax - rMin);
      var s = Math.sqrt(1 - u * u);
      pos[i * 3] = rad * s * Math.cos(th);
      pos[i * 3 + 1] = rad * u * 0.7;
      pos[i * 3 + 2] = rad * s * Math.sin(th) - rMin * 0.4;
      var c = palette[i % 7 === 0 ? 1 : i % 11 === 0 ? 2 : i % 13 === 0 ? 3 : 0];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    return new T.Points(geo, new T.PointsMaterial({ size: 0.07, map: glowTex("#ffffff"), vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }));
  }

  function roundedRect(w, h, r) {
    var s = new T.Shape();
    var x = -w / 2;
    var y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function std(hex, o) {
    o = o || {};
    return new T.MeshStandardMaterial({ color: hex, roughness: o.rough == null ? 0.5 : o.rough, metalness: o.metal || 0, emissive: o.emissive || 0x000000, emissiveIntensity: o.ei || 1, transparent: !!o.opacity, opacity: o.opacity || 1 });
  }

  /* The Bit: the Lab's LED-face character, in 3D */
  var FACE = [".....", ".#.#.", ".....", "#...#", ".###."];
  function makeBit(colour) {
    var g = new T.Group();
    var bodyMat = std(colour || 0xdbe751, { rough: 0.42 });
    var body = new T.Mesh(new T.ExtrudeGeometry(roundedRect(1.9, 1.8, 0.56), { depth: 0.8, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.18, bevelSegments: 8, curveSegments: 20 }), bodyMat);
    body.geometry.center();
    g.add(body);
    var screen = new T.Mesh(new T.ExtrudeGeometry(roundedRect(1.36, 1.26, 0.3), { depth: 0.04, bevelEnabled: false, curveSegments: 14 }), std(0x0b012b, { rough: 0.25 }));
    screen.position.z = 0.6;
    g.add(screen);
    var led = new T.BoxGeometry(0.17, 0.17, 0.04);
    var on = std(0xffffff, { emissive: 0xdbe751, ei: 1.8 });
    var off = std(0x221561, { rough: 0.6 });
    var eyes = [];
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        var lit = FACE[r][c] === "#";
        var m = new T.Mesh(led, lit ? on.clone() : off);
        m.position.set((c - 2) * 0.235, (2 - r) * 0.22 - 0.02, 0.66);
        g.add(m);
        if (lit && r === 1) eyes.push(m);
      }
    }
    var dark = std(0xa9b621, { rough: 0.5 });
    var stick = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.42, 12), dark);
    stick.position.y = 1.2;
    g.add(stick);
    var bulb = new T.Mesh(new T.SphereGeometry(0.15, 24, 16), std(0x49a7a9, { emissive: 0x49a7a9, ei: 0.8 }));
    bulb.position.y = 1.48;
    g.add(bulb);
    [-1, 1].forEach(function (side) {
      var ear = new T.Mesh(new T.CapsuleGeometry(0.1, 0.32, 6, 12), dark);
      ear.position.set(side * 1.16, 0, 0);
      g.add(ear);
    });
    g.userData.eyes = eyes;
    return g;
  }

  /* ==========================================================================
     HERO
     ========================================================================== */
  var STAGES = ["Listen", "Co-design", "Build", "Train", "Pilot", "Learn", "Improve", "Scale"];
  var STAGE_COL = ["#dbe751", "#efabcd", "#49a7a9", "#f07c3a", "#dbe751", "#efabcd", "#49a7a9", "#f07c3a"];

  SC.hero = function (host) {
    var v = new View(host);
    var scene = v.scene;
    var cam = (v.cam = new T.PerspectiveCamera(34, v.w / v.h, 0.1, 200));
    cam.position.set(0, 1.5, 17);
    scene.add(new T.HemisphereLight(0xc8f2f2, 0x2a1670, 1.4));
    var key = new T.DirectionalLight(0xffffff, 2.6);
    key.position.set(5, 7, 9);
    scene.add(key);
    var rim = new T.DirectionalLight(0xefabcd, 2.2);
    rim.position.set(-7, 1, -6);
    scene.add(rim);
    var fill = new T.PointLight(0xdbe751, 14, 10, 2);
    fill.position.set(0, -1, 3.5);
    scene.add(fill);

    var stars = starfield(520, 9, 22, 11);
    scene.add(stars);

    var root = new T.Group();
    scene.add(root);

    var bit = makeBit(0xdbe751);
    bit.scale.setScalar(0.92);
    root.add(bit);
    var halo = glow("#dbe751", 6.5, 0.42);
    halo.position.z = -0.6;
    root.add(halo);

    // The eight-stage partnership ring
    var ring = new T.Group();
    ring.rotation.x = -1.16;
    ring.rotation.y = 0.18;
    root.add(ring);
    var R = 3.1;
    ring.add(new T.Mesh(new T.TorusGeometry(R, 0.03, 10, 240), new T.MeshBasicMaterial({ color: 0x49a7a9 })));
    var haloRing = new T.Mesh(new T.TorusGeometry(R, 0.14, 10, 240), new T.MeshBasicMaterial({ color: 0x49a7a9, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false }));
    ring.add(haloRing);
    var nodes = [];
    STAGES.forEach(function (name, i) {
      var a = (i / STAGES.length) * Math.PI * 2 + Math.PI / 2;
      var node = new T.Group();
      node.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      var sphere = new T.Mesh(new T.SphereGeometry(0.14, 20, 14), std(0xffffff, { emissive: new T.Color(STAGE_COL[i]).getHex(), ei: 0.9 }));
      var gl = glow(STAGE_COL[i], 0.9, 0.7);
      node.add(sphere, gl);
      var lab = label(name.toUpperCase(), { h: 0.34, ring: STAGE_COL[i] });
      lab.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0);
      node.add(lab);
      ring.add(node);
      nodes.push({ sphere: sphere, glow: gl, a: a });
    });
    var pulse = glow("#dbe751", 1.5, 1);
    ring.add(pulse);

    // Interest worlds in orbit
    function world(make, radius, tilt, speed, phase, name, col) {
      var pivot = new T.Group();
      pivot.rotation.z = tilt;
      var holder = new T.Group();
      holder.position.x = radius;
      var obj = make();
      holder.add(obj);
      var lab = label(name, { h: 0.3, ring: col });
      lab.position.y = -0.72;
      holder.add(lab);
      pivot.add(holder);
      root.add(pivot);
      return { pivot: pivot, obj: obj, speed: speed, phase: phase };
    }
    var texSpace = canvasTex(256, 128, function (g, w, h) {
      var grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#f5c7dd");
      grd.addColorStop(0.5, "#c85b93");
      grd.addColorStop(1, "#f5c7dd");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.globalAlpha = 0.35;
      for (var i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? "#ffffff" : "#8a3d6d";
        g.fillRect(0, (h / 7) * (i + 0.6), w, 5 + (i % 3) * 3);
      }
    });
    var texBall = canvasTex(256, 128, function (g, w, h) {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#0b012b";
      var r = rand(5);
      for (var i = 0; i < 12; i++) {
        var x = r() * w;
        var y = 14 + r() * (h - 28);
        g.beginPath();
        for (var k = 0; k < 5; k++) {
          var a = (k / 5) * Math.PI * 2;
          g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 12);
        }
        g.fill();
      }
    });
    var texEarthSmall = canvasTex(256, 128, function (g, w, h) {
      g.fillStyle = "#33898c";
      g.fillRect(0, 0, w, h);
      blobs(g, w, h, 9, ["#9fd36a", "#7fbf4d", "#dbe751"], 21, 10, 22);
    });
    var worlds = [
      world(
        function () {
          var g = new T.Group();
          g.add(new T.Mesh(new T.SphereGeometry(0.42, 40, 28), new T.MeshStandardMaterial({ map: texSpace, roughness: 0.7 })));
          var ringM = new T.Mesh(new T.RingGeometry(0.58, 0.82, 64), new T.MeshBasicMaterial({ color: 0xdbe751, side: T.DoubleSide, transparent: true, opacity: 0.85 }));
          ringM.rotation.x = 1.2;
          g.add(ringM);
          return g;
        },
        2.25, 0.28, 0.32, 0.4, "SPACE", "#efabcd"
      ),
      world(
        function () {
          return new T.Mesh(new T.SphereGeometry(0.34, 40, 28), new T.MeshStandardMaterial({ map: texBall, roughness: 0.45 }));
        },
        2.4, -0.22, 0.26, 2.0, "SPORT", "#dbe751"
      ),
      world(
        function () {
          var g = new T.Group();
          for (var i = 0; i < 5; i++) {
            var bar = new T.Mesh(new T.BoxGeometry(0.11, 0.6, 0.11), std(i % 2 ? 0x49a7a9 : 0xdbe751, { emissive: i % 2 ? 0x49a7a9 : 0xdbe751, ei: 0.45 }));
            bar.position.x = (i - 2) * 0.16;
            g.add(bar);
          }
          var disc = new T.Mesh(new T.TorusGeometry(0.5, 0.025, 8, 60), new T.MeshBasicMaterial({ color: 0x49a7a9 }));
          g.add(disc);
          return g;
        },
        2.15, 0.12, 0.3, 3.6, "MUSIC", "#49a7a9"
      ),
      world(
        function () {
          var g = new T.Group();
          g.add(new T.Mesh(new T.SphereGeometry(0.4, 40, 28), new T.MeshStandardMaterial({ map: texEarthSmall, roughness: 0.75 })));
          var pole = new T.Mesh(new T.CylinderGeometry(0.018, 0.022, 0.42, 8), std(0xffffff));
          pole.position.y = 0.58;
          g.add(pole);
          var hub = new T.Group();
          hub.position.y = 0.8;
          for (var k = 0; k < 3; k++) {
            var blade = new T.Mesh(new T.BoxGeometry(0.035, 0.32, 0.012), std(0xffffff));
            blade.position.y = 0.16;
            var arm = new T.Group();
            arm.rotation.z = (k / 3) * Math.PI * 2;
            arm.add(blade);
            hub.add(arm);
          }
          g.add(hub);
          g.userData.hub = hub;
          return g;
        },
        2.3, -0.34, 0.24, 5.1, "PLANET", "#f07c3a"
      ),
    ];

    var eyeT = 0;
    v.update = function (t, dt) {
      var px = DECK.pointer ? DECK.pointer.x : 0;
      var py = DECK.pointer ? DECK.pointer.y : 0;
      cam.position.x += (px * 1.4 - cam.position.x) * 0.04;
      cam.position.y += (1.5 - py * 0.9 - cam.position.y) * 0.04;
      cam.lookAt(0, 0.35, 0);
      bit.rotation.y = Math.sin(t * 0.55) * 0.38;
      bit.rotation.x = Math.sin(t * 0.4) * 0.06;
      bit.position.y = Math.sin(t * 1.1) * 0.12;
      halo.material.opacity = 0.36 + Math.sin(t * 1.6) * 0.06;
      ring.rotation.z = t * 0.06;
      var pa = t * 0.7 + Math.PI / 2;
      pulse.position.set(Math.cos(pa) * R, Math.sin(pa) * R, 0);
      nodes.forEach(function (n) {
        var d = Math.atan2(Math.sin(pa - n.a), Math.cos(pa - n.a));
        var k = Math.max(0, 1 - Math.abs(d) / 0.6);
        n.sphere.scale.setScalar(1 + k * 0.7);
        n.glow.material.opacity = 0.55 + k * 0.45;
      });
      worlds.forEach(function (w, i) {
        w.pivot.rotation.y = w.phase + t * w.speed;
        w.obj.rotation.y = t * (0.6 + i * 0.1);
        if (i === 2)
          w.obj.children.forEach(function (bar, k) {
            if (bar.geometry.type === "BoxGeometry") bar.scale.y = 0.45 + Math.abs(Math.sin(t * 3.2 + k * 0.9)) * 0.9;
          });
        if (i === 3) w.obj.userData.hub.rotation.z = -t * 3;
      });
      stars.rotation.y = t * 0.012;
      eyeT += dt;
      var blink = eyeT % 5.2 > 5.0;
      bit.userData.eyes.forEach(function (e) {
        e.visible = !blink;
      });
      v.drawn = true;
    };
    return v;
  };

  /* ==========================================================================
     WORLDS: Planet Builder · Kick Lab · Beat Lab · Power Town
     ========================================================================== */
  SC.worlds = function (host, hooks) {
    hooks = hooks || {};
    var v = new View(host);
    var scene = v.scene;
    var cam = (v.cam = new T.PerspectiveCamera(36, v.w / v.h, 0.1, 100));
    scene.add(new T.HemisphereLight(0xd8f4f4, 0x2a1670, 1.5));
    var key = new T.DirectionalLight(0xffffff, 2.6);
    key.position.set(4, 6, 6);
    scene.add(key);
    var rim = new T.DirectionalLight(0xefabcd, 1.6);
    rim.position.set(-5, 2, -4);
    scene.add(rim);

    var W = {};

    /* ---- Planet Builder ---- */
    (function () {
      var g = new T.Group();
      var earth = canvasTex(512, 256, function (c, w, h) {
        c.fillStyle = "#2f6fb0";
        c.fillRect(0, 0, w, h);
        blobs(c, w, h, 14, ["#5fae5a", "#7fbf4d", "#4f9b55"], 7, 18, 40);
        c.fillStyle = "rgba(255,255,255,.9)";
        c.fillRect(0, 0, w, 14);
        c.fillRect(0, h - 14, w, 14);
        c.globalAlpha = 0.45;
        blobs(c, w, h, 10, ["#ffffff"], 19, 10, 26);
      });
      var mars = canvasTex(512, 256, function (c, w, h) {
        c.fillStyle = "#c4532c";
        c.fillRect(0, 0, w, h);
        blobs(c, w, h, 16, ["#9e3b1d", "#e07a43", "#b4461f"], 13, 14, 38);
        c.fillStyle = "rgba(255,255,255,.85)";
        c.fillRect(0, 0, w, 10);
      });
      var mat = new T.MeshStandardMaterial({ map: earth, roughness: 0.85 });
      var planet = new T.Mesh(new T.SphereGeometry(1.5, 72, 48), mat);
      planet.position.y = -0.9;
      g.add(planet);
      var atmo = glow("#7fc4c6", 5.2, 0.5);
      atmo.position.set(0, -0.9, -0.8);
      g.add(atmo);
      var astro = new T.Group();
      var suit = new T.Mesh(new T.CapsuleGeometry(0.11, 0.17, 6, 14), std(0xffffff, { rough: 0.45 }));
      var visor = new T.Mesh(new T.SphereGeometry(0.075, 18, 12), std(0x0b012b, { rough: 0.15, metal: 0.4 }));
      visor.position.set(0, 0.12, 0.07);
      var pack = new T.Mesh(new T.BoxGeometry(0.13, 0.16, 0.08), std(0xdbe751));
      pack.position.set(0, 0.01, -0.1);
      astro.add(suit, visor, pack);
      g.add(astro);
      var pole = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.0, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
      g.add(pole);
      var mark05 = new T.Mesh(new T.BoxGeometry(0.16, 0.018, 0.018), new T.MeshBasicMaterial({ color: 0xffffff }));
      var mark10 = new T.Mesh(new T.BoxGeometry(0.16, 0.018, 0.018), new T.MeshBasicMaterial({ color: 0xdbe751 }));
      var l05 = label("0.5 m", { h: 0.2 });
      var l10 = label("1.0 m", { h: 0.2, ring: "#dbe751" });
      g.add(mark05, mark10, l05, l10);
      var stars = starfield(260, 5, 12, 4);
      g.add(stars);
      var st = { v: 0, scale: 1, target: 1, h: 0.5, period: 1.3 };
      W.planet = {
        group: g,
        cam: [0, 0.75, 5.6],
        look: [0, 0.35, 0],
        set: function (ver) {
          st.v = ver;
          mat.map = ver >= 1 ? mars : earth;
          mat.needsUpdate = true;
          atmo.material.map = glowTex(ver >= 1 ? "#f07c3a" : "#7fc4c6");
          st.target = ver >= 1 ? 0.78 : 1;
          st.h = ver >= 2 ? 1.0 : 0.5;
          st.period = ver >= 2 ? 2.4 : 1.2;
          mark10.visible = l10.visible = ver >= 2;
        },
        update: function (t, dt) {
          st.scale += (st.target - st.scale) * Math.min(1, dt * 3.5);
          planet.scale.setScalar(st.scale);
          planet.rotation.y += dt * 0.12;
          var top = -0.9 + 1.5 * st.scale;
          var cyc = st.period + 0.7;
          var ph = (t % cyc) / st.period;
          var hh = ph < 1 ? 4 * ph * (1 - ph) * st.h : 0;
          var unit = 0.9;
          astro.position.set(0, top + 0.2 + hh * unit, 0.15);
          pole.position.set(0.42, top + 0.5 * unit + 0.1, 0.15);
          pole.scale.y = unit * 1.05;
          mark05.position.set(0.42, top + 0.2 + 0.5 * unit, 0.15);
          mark10.position.set(0.42, top + 0.2 + 1.0 * unit, 0.15);
          l05.position.set(0.86, top + 0.2 + 0.5 * unit, 0.15);
          l10.position.set(0.86, top + 0.2 + 1.0 * unit, 0.15);
          stars.rotation.y = t * 0.02;
        },
      };
      scene.add(g);
    })();

    /* ---- Kick Lab ---- */
    (function () {
      var g = new T.Group();
      var grass = canvasTex(512, 256, function (c, w, h) {
        for (var i = 0; i < 8; i++) {
          c.fillStyle = i % 2 ? "#3f9a6b" : "#47a874";
          c.fillRect((w / 8) * i, 0, w / 8 + 1, h);
        }
        c.strokeStyle = "rgba(255,255,255,.75)";
        c.lineWidth = 4;
        c.strokeRect(8, 8, w - 16, h - 16);
      });
      var pitch = new T.Mesh(new T.PlaneGeometry(9, 4.5), new T.MeshStandardMaterial({ map: grass, roughness: 1 }));
      pitch.rotation.x = -Math.PI / 2;
      g.add(pitch);
      var WALL_X = 0.6;
      var WALL_H = 0.62;
      var wall = new T.Mesh(new T.BoxGeometry(0.16, WALL_H, 1.5), std(0xefabcd, { rough: 0.6 }));
      wall.position.set(WALL_X, WALL_H / 2, 0);
      g.add(wall);
      var GOAL_X = 2.3;
      var post = std(0xffffff, { rough: 0.35 });
      [-0.75, 0.75].forEach(function (z) {
        var p = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.82, 10), post);
        p.position.set(GOAL_X, 0.41, z);
        g.add(p);
      });
      var bar = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.55, 10), post);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(GOAL_X, 0.82, 0);
      g.add(bar);
      var net = new T.Mesh(new T.BoxGeometry(0.6, 0.82, 1.5), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.22 }));
      net.position.set(GOAL_X + 0.3, 0.41, 0);
      g.add(net);
      var ball = new T.Mesh(new T.SphereGeometry(0.11, 24, 16), std(0xffffff, { rough: 0.4 }));
      g.add(ball);
      var X0 = -2.2;
      var Y0 = 0.11;
      var K = 4.7;
      var GRAV = 9.8;
      function arc(deg) {
        var th = (deg * Math.PI) / 180;
        var sp = Math.sqrt(K * GRAV);
        var vx = sp * Math.cos(th);
        var vy = sp * Math.sin(th);
        var pts = [];
        var hitWall = false;
        var tf = (vy + Math.sqrt(vy * vy + 2 * GRAV * Y0)) / GRAV;
        for (var i = 0; i <= 60; i++) {
          var tt = (tf * i) / 60;
          var x = X0 + vx * tt;
          var y = Y0 + vy * tt - 0.5 * GRAV * tt * tt;
          if (!hitWall && x >= WALL_X - 0.09 && y < WALL_H + 0.1) {
            hitWall = true;
            pts.push(new T.Vector3(WALL_X - 0.12, Math.max(Y0, y), 0));
            pts.push(new T.Vector3(WALL_X - 0.4, Y0, 0));
            break;
          }
          pts.push(new T.Vector3(x, Math.max(Y0, y), 0));
        }
        return { pts: pts, curve: new T.CatmullRomCurve3(pts), hitWall: hitWall };
      }
      var ARCS = { 70: "#efabcd", 30: "#49a7a9", 40: "#dbe751", 50: "#f07c3a" };
      var tubes = {};
      Object.keys(ARCS).forEach(function (deg) {
        var a = arc(+deg);
        var tube = new T.Mesh(new T.TubeGeometry(a.curve, 80, 0.022, 8, false), new T.MeshBasicMaterial({ color: new T.Color(ARCS[deg]), transparent: true, opacity: 0.9 }));
        var lab = label(deg + "°", { h: 0.26, ring: ARCS[deg] });
        var top = a.pts.reduce(function (m, p) {
          return p.y > m.y ? p : m;
        }, a.pts[0]);
        lab.position.set(top.x, top.y + 0.25, 0);
        var grp = new T.Group();
        grp.add(tube, lab);
        g.add(grp);
        tubes[deg] = { grp: grp, curve: a.curve, tube: tube };
      });
      var st = { v: 0, list: ["70"] };
      W.kick = {
        group: g,
        cam: [0.1, 1.9, 5.2],
        look: [0.2, 0.55, 0],
        set: function (ver) {
          st.v = ver;
          st.list = ver === 0 ? ["70"] : ver === 1 ? ["30", "40", "50"] : ["40", "50"];
          Object.keys(tubes).forEach(function (d) {
            var on = st.list.indexOf(d) !== -1 || (ver === 2 && d === "30");
            tubes[d].grp.visible = on;
            tubes[d].tube.material.opacity = ver === 2 && d === "30" ? 0.25 : 0.9;
          });
        },
        update: function (t) {
          var dur = 1.5;
          var gap = 0.5;
          var per = dur + gap;
          var k = Math.floor(t / per) % st.list.length;
          var f = Math.min(1, (t % per) / dur);
          var c = tubes[st.list[k]].curve;
          var p = c.getPointAt(f);
          ball.position.copy(p);
          ball.rotation.z = -t * 8;
        },
      };
      scene.add(g);
    })();

    /* ---- Beat Lab ---- */
    (function () {
      var g = new T.Group();
      var rows = [];
      var COLS = 4;
      function pad(col, row, hex) {
        var m = new T.Mesh(new T.BoxGeometry(0.62, 0.22, 0.62), std(hex, { rough: 0.35, emissive: hex, ei: 0.0 }));
        m.position.set((col - 1.5) * 0.82, 0, (row - 1) * 0.82);
        g.add(m);
        return m;
      }
      var kick = [];
      var clap = [];
      for (var c = 0; c < COLS; c++) {
        kick.push(pad(c, 0, 0xdbe751));
        clap.push(pad(c, 1, 0xefabcd));
      }
      rows.push(kick, clap);
      var mel = [];
      var NOTES = [261.63, 293.66, 329.63, 392.0];
      for (c = 0; c < COLS; c++) {
        var hgt = 0.35 + c * 0.28;
        var b = new T.Mesh(new T.BoxGeometry(0.5, hgt, 0.5), std(0x49a7a9, { rough: 0.3, emissive: 0x49a7a9, ei: 0.2 }));
        b.position.set((c - 1.5) * 0.82, hgt / 2, 1.0);
        b.userData.h = hgt;
        g.add(b);
        var wave = new T.Group();
        var pts = [];
        for (var i = 0; i <= 40; i++) pts.push(new T.Vector3(-0.25 + i * 0.0125, 0, 0));
        var line = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
        wave.add(line);
        wave.position.set((c - 1.5) * 0.82, hgt + 0.22, 1.0);
        g.add(wave);
        mel.push({ bar: b, wave: wave, line: line, freq: 1.4 + c * 0.55 });
      }
      var head = new T.Mesh(new T.BoxGeometry(0.08, 0.06, 2.9), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
      head.position.y = 0.16;
      g.add(head);
      var headGlow = glow("#ffffff", 1.2, 0.5);
      g.add(headGlow);
      var guessPattern = { kick: [1, 1, 1, 1], clap: [0, 1, 1, 0] };
      var setPattern = { kick: [1, 0, 1, 0], clap: [0, 1, 0, 1] };
      var st = { v: 0, bpm: 128, last: -1, pat: guessPattern };
      W.beat = {
        group: g,
        cam: [0, 3.4, 4.6],
        look: [0, 0.2, 0.25],
        set: function (ver) {
          st.v = ver;
          st.bpm = ver === 0 ? 128 : 100;
          st.pat = ver === 0 ? guessPattern : setPattern;
          st.last = -1;
          kick.forEach(function (p, i) {
            p.material.color.set(st.pat.kick[i] ? 0xdbe751 : 0x31247a);
          });
          clap.forEach(function (p, i) {
            p.material.color.set(st.pat.clap[i] ? 0xefabcd : 0x31247a);
          });
          mel.forEach(function (m) {
            m.bar.visible = m.wave.visible = ver === 2;
          });
        },
        update: function (t) {
          var beatLen = 60 / st.bpm;
          var pos = (t / beatLen) % COLS;
          var idx = Math.floor(pos);
          head.position.x = (pos - 1.5 - 0.5) * 0.82 + 0.41;
          headGlow.position.set(head.position.x, 0.3, 0);
          var abs = Math.floor(t / beatLen);
          if (abs !== st.last) {
            st.last = abs;
            var hit = { kick: !!st.pat.kick[idx], clap: !!st.pat.clap[idx], note: st.v === 2 ? NOTES[idx] : 0 };
            if (hooks.onBeat) hooks.onBeat(hit);
          }
          var frac = pos - idx;
          var bump = Math.max(0, 1 - frac * 3);
          [kick, clap].forEach(function (row, r) {
            row.forEach(function (p, i) {
              var on = (r === 0 ? st.pat.kick : st.pat.clap)[i];
              var k = i === idx && on ? bump : 0;
              p.scale.y = 1 + k * 1.6;
              p.position.y = (k * 1.6 * 0.22) / 2;
              p.material.emissiveIntensity = k * 1.2;
            });
          });
          if (st.v === 2)
            mel.forEach(function (m, i) {
              var amp = i === idx ? 0.09 * (0.5 + bump) : 0.04;
              var pa = m.line.geometry.attributes.position;
              for (var j = 0; j < pa.count; j++) pa.setY(j, Math.sin(j * 0.16 * m.freq * 3 + t * m.freq * 9) * amp);
              pa.needsUpdate = true;
              m.bar.material.emissiveIntensity = i === idx ? 0.2 + bump : 0.2;
            });
        },
      };
      scene.add(g);
    })();

    /* ---- Power Town ---- */
    (function () {
      var g = new T.Group();
      var ground = new T.Mesh(new T.CylinderGeometry(2.6, 2.7, 0.18, 64), std(0x47a874, { rough: 0.95 }));
      ground.position.y = -0.09;
      g.add(ground);
      var windows = [];
      var winOn = new T.MeshStandardMaterial({ color: 0xfff3a0, emissive: 0xffd84d, emissiveIntensity: 1.6 });
      var winOff = new T.MeshStandardMaterial({ color: 0x221561, roughness: 0.6 });
      [
        [-1.2, -0.5],
        [-0.5, -0.9],
        [0.3, -0.8],
        [1.1, -0.4],
        [-0.9, 0.5],
      ].forEach(function (p, i) {
        var h = 0.42 + (i % 2) * 0.16;
        var house = new T.Mesh(new T.BoxGeometry(0.5, h, 0.5), std(0xf6f3ee, { rough: 0.7 }));
        house.position.set(p[0], h / 2, p[1]);
        g.add(house);
        var roof = new T.Mesh(new T.ConeGeometry(0.42, 0.3, 4), std(i % 2 ? 0x31247a : 0xc85b93, { rough: 0.6 }));
        roof.rotation.y = Math.PI / 4;
        roof.position.set(p[0], h + 0.15, p[1]);
        g.add(roof);
        var w = new T.Mesh(new T.BoxGeometry(0.16, 0.14, 0.02), winOn);
        w.position.set(p[0], h * 0.55, p[1] + 0.26);
        g.add(w);
        windows.push(w);
      });
      var panelMat = std(0x1f3c8a, { rough: 0.3, metal: 0.3 });
      for (var i = 0; i < 4; i++) {
        var pnl = new T.Mesh(new T.BoxGeometry(0.42, 0.03, 0.3), panelMat);
        pnl.rotation.x = -0.5;
        pnl.position.set(0.5 + (i % 2) * 0.48, 0.16, 0.45 + Math.floor(i / 2) * 0.38);
        g.add(pnl);
      }
      var extras = new T.Group();
      g.add(extras);
      var hubs = [];
      [
        [-1.8, 0.9],
        [1.8, 0.7],
      ].forEach(function (p) {
        var pole = new T.Mesh(new T.CylinderGeometry(0.025, 0.035, 1.2, 8), std(0xffffff));
        pole.position.set(p[0], 0.6, p[1]);
        extras.add(pole);
        var hub = new T.Group();
        hub.position.set(p[0], 1.22, p[1] + 0.04);
        for (var k = 0; k < 3; k++) {
          var arm = new T.Group();
          arm.rotation.z = (k / 3) * Math.PI * 2;
          var blade = new T.Mesh(new T.BoxGeometry(0.05, 0.5, 0.015), std(0xffffff));
          blade.position.y = 0.25;
          arm.add(blade);
          hub.add(arm);
        }
        extras.add(hub);
        hubs.push(hub);
      });
      var battery = new T.Mesh(new T.BoxGeometry(0.34, 0.5, 0.26), std(0x0b012b, { rough: 0.4 }));
      battery.position.set(1.55, 0.25, -0.15);
      extras.add(battery);
      var level = new T.Mesh(new T.BoxGeometry(0.26, 0.4, 0.02), new T.MeshStandardMaterial({ color: 0xdbe751, emissive: 0xdbe751, emissiveIntensity: 0.8 }));
      level.position.set(1.55, 0.25, -0.015);
      extras.add(level);
      var gas = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.7, 12), std(0x8a82b8, { rough: 0.7 }));
      gas.position.set(-1.7, 0.35, -0.6);
      extras.add(gas);
      var sun = new T.Mesh(new T.SphereGeometry(0.22, 24, 16), new T.MeshBasicMaterial({ color: 0xffd84d }));
      var sunGlow = glow("#ffd84d", 2.2, 0.8);
      g.add(sun, sunGlow);
      var moon = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), new T.MeshBasicMaterial({ color: 0xe8e4f7 }));
      g.add(moon);
      var day = new T.Color("#9fd8da");
      var night = new T.Color("#0b012b");
      var sky = new T.Color();
      var st = { v: 0, night: null };
      W.power = {
        group: g,
        cam: [0, 2.6, 5.2],
        look: [0, 0.45, 0],
        sky: true,
        set: function (ver) {
          st.v = ver;
          st.night = null;
          extras.visible = ver >= 1;
        },
        update: function (t, dt) {
          var cyc = 10;
          var ph = (t % cyc) / cyc;
          var a = ph * Math.PI * 2;
          sun.position.set(Math.cos(a + Math.PI) * 2.6, Math.sin(a) * 2.2 + 0.2, -1.6);
          sunGlow.position.copy(sun.position);
          moon.position.set(Math.cos(a) * 2.6, -Math.sin(a) * 2.2 + 0.2, -1.6);
          var isNight = Math.sin(a) < 0;
          var lightK = Math.max(0, Math.min(1, Math.sin(a) * 2.5 + 0.5));
          sky.copy(night).lerp(day, lightK);
          scene.background = sky;
          key.intensity = 0.6 + lightK * 2.2;
          var lit = !isNight || st.v >= 1;
          windows.forEach(function (w) {
            w.material = isNight ? (lit ? winOn : winOff) : winOff;
          });
          hubs.forEach(function (h, i) {
            h.rotation.z = -t * (2.4 + i * 0.4);
          });
          var lvl = isNight ? 1 - (ph - 0.5) * 1.6 : 0.2 + Math.min(0.8, ph * 1.6);
          level.scale.y = Math.max(0.12, Math.min(1, lvl));
          level.position.y = 0.05 + 0.2 * level.scale.y;
          if (st.night !== isNight) {
            st.night = isNight;
            if (hooks.onNight) hooks.onNight(isNight);
          }
        },
      };
      scene.add(g);
    })();

    var cur = null;
    var target = new T.Vector3();
    var look = new T.Vector3();
    var curLook = new T.Vector3();
    var pop = 1;
    function apply(id) {
      Object.keys(W).forEach(function (k) {
        W[k].group.visible = k === id;
      });
      if (!W[id].sky) scene.background = null;
    }
    v.update = function (t, dt) {
      if (!cur) return;
      var w = W[cur];
      var px = DECK.pointer ? DECK.pointer.x : 0;
      var py = DECK.pointer ? DECK.pointer.y : 0;
      target.set(w.cam[0] + px * 0.5, w.cam[1] - py * 0.3, w.cam[2]);
      cam.position.lerp(target, Math.min(1, dt * 3));
      look.set(w.look[0], w.look[1], w.look[2]);
      curLook.lerp(look, Math.min(1, dt * 4));
      cam.lookAt(curLook);
      pop += (1 - pop) * Math.min(1, dt * 5);
      w.group.scale.setScalar(pop);
      w.update(t, dt);
      v.drawn = true;
    };
    v.set = function (id, ver) {
      var changed = id !== cur;
      cur = id;
      apply(id);
      W[id].set(ver);
      if (changed) {
        var w = W[id];
        cam.position.set(w.cam[0], w.cam[1], w.cam[2] + 0.6);
        curLook.set(w.look[0], w.look[1], w.look[2]);
        pop = reducedNow() ? 1 : 0.86;
      }
      if (!v.on) v.frame(v.staticT, 0.016);
    };
    function reducedNow() {
      return DECK.reduced();
    }
    v.staticT = 1.0;
    return v;
  };

  /* ==========================================================================
     FLOW: feedback becomes product (particles on a full-slide layer)
     ========================================================================== */
  SC.flow = function (host) {
    var v = new View(host, { w: 1920, h: 1080, maxRatio: 1.25, antialias: false });
    var cam = (v.cam = new T.PerspectiveCamera(30, 1920 / 1080, 10, 8000));
    var dist = 540 / Math.tan((15 * Math.PI) / 180);
    cam.position.set(960, -540, dist);
    cam.lookAt(960, -540, 0);
    var N = 1600;
    var pos = new Float32Array(N * 3);
    var col = new Float32Array(N * 3);
    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    var pts = new T.Points(geo, new T.PointsMaterial({ size: 30, map: glowTex("#ffffff"), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
    pts.frustumCulled = false;
    v.scene.add(pts);
    var parts = [];
    var free = [];
    for (var i = 0; i < N; i++) {
      free.push(i);
      pos[i * 3 + 2] = -99999;
    }
    var PINK = new T.Color("#efabcd");
    var LIME = new T.Color("#dbe751");
    var TEAL = new T.Color("#49a7a9");
    var tmp = new T.Color();
    var clock = 0;
    function spawn(p) {
      if (!free.length) return;
      p.i = free.pop();
      parts.push(p);
    }
    v.update = function (t, dt) {
      clock += dt;
      for (var k = parts.length - 1; k >= 0; k--) {
        var p = parts[k];
        var f = (clock - p.t0) / p.dur;
        var i = p.i;
        if (f < 0) {
          col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
          continue;
        }
        if (f >= 1) {
          col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
          pos[i * 3 + 2] = -99999;
          free.push(i);
          parts.splice(k, 1);
          continue;
        }
        var x;
        var y;
        var z;
        var bright;
        if (p.kind === "stream") {
          var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
          var u = 1 - e;
          x = u * u * p.ax + 2 * u * e * p.cx + e * e * p.bx;
          y = u * u * p.ay + 2 * u * e * p.cy + e * e * p.by;
          var r = Math.sin(Math.PI * e) * p.rad;
          x += Math.cos(e * 9 + p.ph) * r;
          z = Math.sin(e * 9 + p.ph) * r * 3;
          tmp.copy(PINK).lerp(LIME, e);
          bright = Math.sin(Math.PI * Math.min(1, f * 1.1)) * 0.95;
        } else {
          var ee = 1 - Math.pow(1 - f, 3);
          x = p.ax + Math.cos(p.ang) * p.sp * ee;
          y = p.ay + Math.sin(p.ang) * p.sp * ee * 0.7;
          z = p.z * ee;
          tmp.copy(p.c);
          bright = (1 - f) * 0.95;
        }
        pos[i * 3] = x;
        pos[i * 3 + 1] = -y;
        pos[i * 3 + 2] = z;
        col[i * 3] = tmp.r * bright;
        col[i * 3 + 1] = tmp.g * bright;
        col[i * 3 + 2] = tmp.b * bright;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      if (!parts.length) {
        v.on = false;
        v.r.render(v.scene, cam);
      }
    };
    function go() {
      if (DECK.reduced()) return false;
      v.resize();
      if (!v.on) {
        v.on = true;
        kick();
      }
      return true;
    }
    return {
      stream: function (a, b) {
        if (!go()) return;
        var cx = (a.x + b.x) / 2;
        var cy = Math.min(a.y, b.y) - 160;
        for (var k = 0; k < 150; k++) {
          spawn({
            kind: "stream",
            t0: clock + k * 0.005,
            dur: 0.8 + Math.random() * 0.35,
            ax: a.x + (Math.random() - 0.5) * 220,
            ay: a.y + (Math.random() - 0.5) * 50,
            bx: b.x + (Math.random() - 0.5) * 70,
            by: b.y + (Math.random() - 0.5) * 30,
            cx: cx + (Math.random() - 0.5) * 160,
            cy: cy + (Math.random() - 0.5) * 120,
            rad: 18 + Math.random() * 40,
            ph: Math.random() * 6.28,
          });
        }
      },
      burst: function (r) {
        if (!go()) return;
        var cols = [LIME, PINK, TEAL];
        for (var k = 0; k < 260; k++) {
          var ang = Math.random() * Math.PI * 2;
          spawn({
            kind: "burst",
            t0: clock + Math.random() * 0.12,
            dur: 0.9 + Math.random() * 0.6,
            ax: r.x + Math.cos(ang) * r.w * 0.35,
            ay: r.y + Math.sin(ang) * r.h * 0.35,
            ang: ang,
            sp: 120 + Math.random() * 300,
            z: (Math.random() - 0.5) * 900,
            c: cols[k % 3],
          });
        }
      },
    };
  };
})();
