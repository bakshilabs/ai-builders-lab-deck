/* ==========================================================================
   3D kit: a thin layer over three.js for the builds.
   - stage(): renderer + scene + camera + bloom, a frame loop that pauses when
     off-screen, tweens on the stage clock, HTML labels pinned to 3D points
   - burst(), confetti(), stars(), glow(): particles and light
   - bit(): the 3D "Bit" character with an LED face
   Everything runs on requestAnimationFrame and performance.now(), so the demo
   video recorder's virtual clock drives it frame by frame.
   ========================================================================== */
(function () {
  "use strict";

  var CX = window.CX;
  var U = CX.util;
  var T = window.THREE;

  var PAL = {
    navy: 0x0b012b,
    navy2: 0x1a0d52,
    navy3: 0x31247a,
    lime: 0xdbe751,
    teal: 0x49a7a9,
    pink: 0xefabcd,
    orange: 0xf07c3a,
    blue: 0x4a86f2,
    cream: 0xf6f3ee,
    white: 0xffffff,
    red: 0xe5484d,
  };

  var ease = {
    linear: function (t) {
      return t;
    },
    out: function (t) {
      return 1 - Math.pow(1 - t, 3);
    },
    in: function (t) {
      return t * t * t;
    },
    inOut: function (t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    outBack: function (t) {
      var c1 = 1.70158,
        c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: function (t) {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
  };

  var supported = null;
  function ok() {
    if (supported !== null) return supported;
    try {
      var c = document.createElement("canvas");
      supported = !!(T && window.WebGL2RenderingContext && c.getContext("webgl2"));
    } catch (err) {
      supported = false;
    }
    return supported;
  }

  function quality() {
    var s = CX.store && CX.store.state.settings;
    if (s && s.quality === "low") return "low";
    return "high";
  }

  /* ---- Shared textures --------------------------------------------------------- */
  var dotTex = null;
  function dot() {
    if (dotTex) return dotTex;
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.85)");
    grd.addColorStop(0.6, "rgba(255,255,255,0.18)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    dotTex = new T.CanvasTexture(c);
    dotTex.colorSpace = T.SRGBColorSpace;
    return dotTex;
  }

  var shadowTex = null;
  function blobShadow() {
    if (shadowTex) return shadowTex;
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.55)");
    grd.addColorStop(0.55, "rgba(0,0,0,0.22)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    shadowTex = new T.CanvasTexture(c);
    return shadowTex;
  }

  /* ---- Stage --------------------------------------------------------------------- */
  function stage(host, o) {
    o = o || {};
    var q = quality();
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: !!o.alpha, powerPreference: "high-performance" });
    var maxDpr = q === "low" ? 1 : o.maxDpr || 2;
    if (CX.stageDpr) maxDpr = CX.stageDpr; // the video recorder can cap this
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = o.exposure || 1;
    if (o.shadows && q !== "low") {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
    }
    var canvas = renderer.domElement;
    canvas.className = "stage3d__canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.classList.add("stage3d");
    host.appendChild(canvas);

    var pinLayer = document.createElement("div");
    pinLayer.className = "stage3d__pins";
    host.appendChild(pinLayer);

    var scene = new T.Scene();
    if (o.background != null) scene.background = new T.Color(o.background);
    if (o.fog) scene.fog = new T.Fog(o.fog.color, o.fog.near, o.fog.far);
    var camera = new T.PerspectiveCamera(o.fov || 40, 1, o.near || 0.1, o.far || 600);
    camera.position.set(0, 2, 10);

    if (o.env !== false) {
      var pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
      pm.dispose();
      if (o.envIntensity != null) scene.environmentIntensity = o.envIntensity;
    }

    var composer = null,
      bloom = null;
    if (o.bloom !== false && q !== "low") {
      var rt = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, samples: 4 });
      composer = new T.EffectComposer(renderer, rt);
      composer.addPass(new T.RenderPass(scene, camera));
      var b = o.bloom || {};
      bloom = new T.UnrealBloomPass(new T.Vector2(256, 256), b.strength != null ? b.strength : 0.75, b.radius != null ? b.radius : 0.5, b.threshold != null ? b.threshold : 0.85);
      composer.addPass(bloom);
      composer.addPass(new T.OutputPass());
    }

    var W = 1,
      H = 1;
    function resize() {
      var w = Math.max(1, host.clientWidth),
        h = Math.max(1, host.clientHeight);
      if (w === W && h === H) return;
      W = w;
      H = h;
      renderer.setSize(w, h, false);
      if (composer) composer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (api.onResize) api.onResize(w, h);
      draw();
    }

    var frameFns = [];
    var tweens = [];
    var pins = [];
    var clock = 0;
    var timeScale = 1;
    var visible = true;
    var paused = false;
    var disposed = false;
    var last = performance.now();
    var raf = 0;
    var shake = { t: 0, dur: 0, amp: 0 };
    var camBase = new T.Vector3();

    function stepTweens(dt) {
      for (var i = tweens.length - 1; i >= 0; i--) {
        var tw = tweens[i];
        tw.t += dt;
        var p = tw.dur <= 0 ? 1 : Math.min(1, tw.t / tw.dur);
        var e = tw.ease(p);
        for (var k in tw.to) tw.target[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
        if (tw.onUpdate) tw.onUpdate(e, p);
        if (p >= 1) {
          tweens.splice(i, 1);
          tw.resolve();
        }
      }
    }

    var v3 = new T.Vector3();
    function updatePins() {
      for (var i = 0; i < pins.length; i++) {
        var p = pins[i];
        if (typeof p.target === "function") v3.copy(p.target());
        else if (p.target.isObject3D) p.target.getWorldPosition(v3);
        else v3.copy(p.target);
        if (p.offset) v3.add(p.offset);
        v3.project(camera);
        var hidden = v3.z > 1 || v3.z < -1;
        var x = (v3.x * 0.5 + 0.5) * W;
        var y = (-v3.y * 0.5 + 0.5) * H;
        p.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        p.el.style.visibility = hidden || p.hidden ? "hidden" : "";
      }
    }

    function draw() {
      if (disposed) return;
      updatePins();
      if (composer) composer.render();
      else renderer.render(scene, camera);
    }

    function frame(now) {
      if (disposed) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!visible || paused || document.hidden) return;
      dt *= timeScale;
      clock += dt;
      stepTweens(dt);
      for (var i = frameFns.length - 1; i >= 0; i--) {
        var f = frameFns[i];
        if (f && f(dt, clock) === false) frameFns.splice(i, 1);
      }
      if (shake.t < shake.dur) {
        shake.t += dt;
        var k = 1 - shake.t / shake.dur;
        camera.position.x += Math.sin(clock * 61) * shake.amp * k;
        camera.position.y += Math.cos(clock * 53) * shake.amp * k;
      }
      draw();
    }

    var ro = new ResizeObserver(resize);
    ro.observe(host);
    var io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) last = performance.now();
      });
      io.observe(host);
    }

    var api = {
      renderer: renderer,
      scene: scene,
      camera: camera,
      composer: composer,
      bloom: bloom,
      host: host,
      ease: ease,
      get time() {
        return clock;
      },
      get size() {
        return { w: W, h: H };
      },
      onResize: null,
      onFrame: function (fn) {
        frameFns.push(fn);
        return function () {
          var i = frameFns.indexOf(fn);
          if (i !== -1) frameFns.splice(i, 1);
        };
      },
      tween: function (target, to, dur, opts) {
        opts = opts || {};
        if (U.reducedMotion() && !opts.essential) dur = Math.min(dur, 0.12);
        return new Promise(function (resolve) {
          var from = {};
          for (var k in to) from[k] = target[k];
          // Cancel other tweens on the same keys of the same target
          tweens = tweens.filter(function (tw) {
            if (tw.target !== target) return true;
            for (var k2 in to)
              if (k2 in tw.to) {
                tw.resolve();
                return false;
              }
            return true;
          });
          tweens.push({ target: target, from: from, to: to, dur: dur, t: 0, ease: opts.ease || ease.inOut, onUpdate: opts.onUpdate, resolve: resolve });
        });
      },
      wait: function (sec) {
        return api.tween({ v: 0 }, { v: 1 }, sec, { essential: true, ease: ease.linear });
      },
      pin: function (el, target, offset) {
        el.classList.add("pin3d");
        pinLayer.appendChild(el);
        var p = { el: el, target: target, offset: offset || null, hidden: false };
        pins.push(p);
        return {
          el: el,
          hide: function (h) {
            p.hidden = h !== false;
          },
          set: function (t, off) {
            p.target = t;
            if (off) p.offset = off;
          },
          remove: function () {
            var i = pins.indexOf(p);
            if (i !== -1) pins.splice(i, 1);
            if (el.parentNode) el.parentNode.removeChild(el);
          },
        };
      },
      shake: function (amp, dur) {
        if (U.reducedMotion()) return;
        shake = { t: 0, dur: dur || 0.4, amp: amp || 0.08 };
      },
      setTimeScale: function (s) {
        timeScale = s;
      },
      pause: function (p) {
        paused = p !== false;
      },
      render: draw,
      snapshot: function (type, quality) {
        draw();
        return canvas.toDataURL(type || "image/jpeg", quality || 0.9);
      },
      dispose: function () {
        disposed = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        if (io) io.disconnect();
        tweens.forEach(function (tw) {
          tw.resolve();
        });
        tweens = [];
        frameFns = [];
        scene.traverse(function (obj) {
          if (obj.geometry) obj.geometry.dispose();
          var m = obj.material;
          if (m) {
            (Array.isArray(m) ? m : [m]).forEach(function (mm) {
              ["map", "emissiveMap", "bumpMap", "normalMap", "roughnessMap", "alphaMap"].forEach(function (k) {
                if (mm[k] && mm[k] !== dotTex && mm[k] !== shadowTex) mm[k].dispose();
              });
              mm.dispose();
            });
          }
        });
        if (composer) composer.dispose && composer.dispose();
        renderer.dispose();
        try {
          renderer.forceContextLoss();
        } catch (err) {}
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (pinLayer.parentNode) pinLayer.parentNode.removeChild(pinLayer);
      },
    };

    resize();
    raf = requestAnimationFrame(frame);
    return api;
  }

  /* ---- Particles ------------------------------------------------------------------ */
  function burst(st, pos, o) {
    o = o || {};
    var n = o.count || 40;
    var life = o.life || 1.2;
    var pos3 = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var vel = [];
    var rand = U.rng(o.seed || Math.floor(st.time * 1000) + 3);
    var colours = (o.colours || [o.colour || PAL.lime]).map(function (c) {
      return new T.Color(c);
    });
    for (var i = 0; i < n; i++) {
      pos3[i * 3] = pos.x;
      pos3[i * 3 + 1] = pos.y;
      pos3[i * 3 + 2] = pos.z;
      var th = rand() * Math.PI * 2;
      var ph = Math.acos(2 * rand() - 1);
      var sp = (o.speed || 3) * (0.35 + rand() * 0.65);
      var dir = new T.Vector3(Math.sin(ph) * Math.cos(th), Math.abs(Math.cos(ph)) * (o.up == null ? 1 : o.up) + (o.lift || 0), Math.sin(ph) * Math.sin(th));
      if (o.flat) dir.y *= 0.25;
      vel.push(dir.multiplyScalar(sp));
      var c = colours[i % colours.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos3, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    var mat = new T.PointsMaterial({
      size: o.size || 0.18,
      map: dot(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      sizeAttenuation: true,
    });
    var pts = new T.Points(geo, mat);
    (o.parent || st.scene).add(pts);
    var age = 0;
    var g = o.gravity == null ? 4 : o.gravity;
    var drag = o.drag || 0.985;
    st.onFrame(function (dt) {
      age += dt;
      var a = geo.attributes.position.array;
      for (var i = 0; i < n; i++) {
        vel[i].y -= g * dt;
        vel[i].multiplyScalar(drag);
        a[i * 3] += vel[i].x * dt;
        a[i * 3 + 1] += vel[i].y * dt;
        a[i * 3 + 2] += vel[i].z * dt;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - Math.pow(age / life, 2));
      if (age >= life) {
        pts.parent && pts.parent.remove(pts);
        geo.dispose();
        mat.dispose();
        return false;
      }
    });
    return pts;
  }

  function confetti(st, pos, o) {
    o = o || {};
    return burst(st, pos, {
      count: o.count || 90,
      colours: [PAL.lime, PAL.pink, PAL.teal, PAL.orange, PAL.white],
      speed: o.speed || 5,
      gravity: 5,
      life: o.life || 1.8,
      size: o.size || 0.16,
      lift: 0.6,
      parent: o.parent,
    });
  }

  function stars(o) {
    o = o || {};
    var n = o.count || 2200;
    var r = o.radius || 120;
    var rand = U.rng(o.seed || 11);
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var tints = [new T.Color(0xffffff), new T.Color(0xdde6ff), new T.Color(PAL.lime), new T.Color(PAL.pink), new T.Color(0xbfefff)];
    for (var i = 0; i < n; i++) {
      var th = rand() * Math.PI * 2,
        ph = Math.acos(2 * rand() - 1),
        rr = r * (0.7 + rand() * 0.6);
      pos[i * 3] = rr * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rr * Math.cos(ph);
      pos[i * 3 + 2] = rr * Math.sin(ph) * Math.sin(th);
      var c = rand() < 0.86 ? tints[0] : tints[1 + Math.floor(rand() * 4)];
      var b = 0.45 + rand() * 0.55;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    var mat = new T.PointsMaterial({ size: o.size || 0.9, map: dot(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    return new T.Points(geo, mat);
  }

  function glow(colour, size, opacity) {
    var s = new T.Sprite(new T.SpriteMaterial({ map: dot(), color: colour, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: opacity == null ? 1 : opacity }));
    s.scale.set(size || 1, size || 1, 1);
    return s;
  }

  function shadow(size, opacity) {
    var m = new T.Mesh(
      new T.PlaneGeometry(size || 1.4, size || 1.4),
      new T.MeshBasicMaterial({ map: blobShadow(), transparent: true, depthWrite: false, opacity: opacity == null ? 0.8 : opacity })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  /* Text drawn to a texture (for labels that live inside the 3D scene) */
  function textSprite(text, o) {
    o = o || {};
    var font = o.font || "800 64px Lexend, system-ui, sans-serif";
    var c = document.createElement("canvas");
    var g = c.getContext("2d");
    g.font = font;
    var pad = o.pad == null ? 28 : o.pad;
    var w = Math.ceil(g.measureText(text).width) + pad * 2;
    var h = o.h || 104;
    c.width = w;
    c.height = h;
    g.font = font;
    if (o.bg) {
      g.fillStyle = o.bg;
      var r = h / 2;
      g.beginPath();
      g.moveTo(r, 0);
      g.arcTo(w, 0, w, h, r);
      g.arcTo(w, h, 0, h, r);
      g.arcTo(0, h, 0, 0, r);
      g.arcTo(0, 0, w, 0, r);
      g.fill();
    }
    g.fillStyle = o.colour || "#ffffff";
    g.textBaseline = "middle";
    g.textAlign = "center";
    g.fillText(text, w / 2, h / 2 + 3);
    var tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;
    var s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    var scale = o.scale || 0.006;
    s.scale.set(w * scale, h * scale, 1);
    return s;
  }

  /* ---- The 3D Bit ----------------------------------------------------------------- */
  var BODY = {
    pink: [0xefabcd, 0xe483b3],
    lime: [0xdbe751, 0xc0cd36],
    teal: [0x49a7a9, 0x33898c],
    orange: [0xf07c3a, 0xd9642a],
    blue: [0x4a86f2, 0x3568cc],
    white: [0xffffff, 0xddd6ca],
  };

  function bit(o) {
    o = o || {};
    var cols = BODY[o.colour] || BODY.pink;
    var g = new T.Group();
    var rig = new T.Group(); // squash and stretch happens on the rig
    g.add(rig);

    var bodyMat = new T.MeshPhysicalMaterial({ color: cols[0], roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.35, envMapIntensity: 0.75 });
    var darkMat = new T.MeshPhysicalMaterial({ color: cols[1], roughness: 0.55, clearcoat: 0.4, envMapIntensity: 0.7 });
    var body = new T.Mesh(new T.RoundedBoxGeometry(1, 0.96, 0.84, 6, 0.3), bodyMat);
    body.position.y = 0.66;
    body.castShadow = true;
    rig.add(body);

    var screen = new T.Mesh(new T.RoundedBoxGeometry(0.72, 0.66, 0.08, 4, 0.12), new T.MeshPhysicalMaterial({ color: 0x0b012b, roughness: 0.18, clearcoat: 1 }));
    screen.position.set(0, 0.64, 0.4);
    rig.add(screen);

    var cv = document.createElement("canvas");
    cv.width = cv.height = 160;
    var cg = cv.getContext("2d");
    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    var face = new T.Mesh(new T.PlaneGeometry(0.62, 0.62), new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
    face.position.set(0, 0.64, 0.446);
    rig.add(face);

    var led = o.led || (o.colour === "lime" ? "#ffffff" : "#dbe751");
    function setFace(name) {
      var rows = CX.ui && CX.ui.faces ? CX.ui.faces[name] || CX.ui.faces.happy : null;
      cg.clearRect(0, 0, 160, 160);
      if (!rows) return;
      for (var r = 0; r < 5; r++)
        for (var c = 0; c < 5; c++) {
          var lit = rows[r][c] === "#";
          cg.fillStyle = lit ? led : "rgba(255,255,255,0.08)";
          var x = 14 + c * 28,
            y = 14 + r * 28;
          cg.beginPath();
          if (cg.roundRect) cg.roundRect(x, y, 20, 20, 6);
          else cg.rect(x, y, 20, 20);
          cg.fill();
        }
      tex.needsUpdate = true;
      g.userData.face = name;
    }
    setFace(o.face || "happy");

    // Antenna with a glowing tip
    var stalk = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.24, 12), darkMat);
    stalk.position.y = 1.24;
    rig.add(stalk);
    var tip = new T.Mesh(new T.SphereGeometry(0.075, 20, 16), new T.MeshStandardMaterial({ color: o.colour === "lime" ? PAL.teal : PAL.lime, emissive: o.colour === "lime" ? PAL.teal : PAL.lime, emissiveIntensity: 1.6 }));
    tip.position.y = 1.39;
    rig.add(tip);

    // Side nubs (arms) and feet
    [-1, 1].forEach(function (s) {
      var arm = new T.Mesh(new T.RoundedBoxGeometry(0.12, 0.3, 0.24, 3, 0.05), darkMat);
      arm.position.set(s * 0.56, 0.64, 0);
      rig.add(arm);
      var foot = new T.Mesh(new T.RoundedBoxGeometry(0.28, 0.12, 0.34, 3, 0.05), darkMat);
      foot.position.set(s * 0.24, 0.06, 0.04);
      foot.castShadow = true;
      g.add(foot);
    });

    if (o.helmet) {
      var helmet = new T.Mesh(
        new T.SphereGeometry(0.86, 40, 28),
        new T.MeshPhysicalMaterial({ color: 0xdfe8ff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.12, clearcoat: 0.5, envMapIntensity: 0.3, side: T.FrontSide, depthWrite: false })
      );
      helmet.position.y = 0.72;
      rig.add(helmet);
      var ring = new T.Mesh(new T.TorusGeometry(0.62, 0.06, 12, 40), new T.MeshPhysicalMaterial({ color: 0xe9e6f2, roughness: 0.35, metalness: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.12;
      g.add(ring);
    }

    if (o.shadow !== false) {
      var sh = shadow(1.6, 0.7);
      sh.position.y = 0.005;
      g.add(sh);
      g.userData.shadow = sh;
    }

    g.userData.rig = rig;
    g.userData.tip = tip;
    g.userData.setFace = setFace;
    g.userData.bodyMat = bodyMat;
    return g;
  }

  CX.three = {
    ok: ok,
    quality: quality,
    PAL: PAL,
    ease: ease,
    stage: stage,
    burst: burst,
    confetti: confetti,
    stars: stars,
    glow: glow,
    shadow: shadow,
    textSprite: textSprite,
    dot: dot,
    bit: bit,
  };
})();
