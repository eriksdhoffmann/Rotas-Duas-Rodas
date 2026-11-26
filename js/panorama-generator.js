/**
 * Gerador Procedural de Panoramas Equiretangulares 2:1 (2048x1024)
 * Compatível com o Motor WebGL 360° (Virtual Tour 360 Logic — Geohereditas).
 * Garante funcionamento 100% imediato offline/file:// enquanto permite
 * substituir qualquer cena por fotos 360° reais de drone ou câmera Insta360.
 */
window.PanoramaGenerator = (function () {
  const cache = new Map();

  function seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function drawSky(ctx, w, h, palette) {
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.56);
    grad.addColorStop(0, palette.skyTop);
    grad.addColorStop(0.55, palette.skyMid);
    grad.addColorStop(1, palette.skyHorizon);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h * 0.58);

    // Sol suave
    const sunX = w * palette.sunX;
    const sunY = h * palette.sunY;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 190);
    sunGrad.addColorStop(0, "rgba(255, 248, 224, 0.95)");
    sunGrad.addColorStop(0.25, "rgba(255, 206, 130, 0.45)");
    sunGrad.addColorStop(1, "rgba(255, 180, 100, 0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 190, 0, Math.PI * 2);
    ctx.fill();

    // Nuvens equiretangulares suaves (embrulhando 360°)
    const rng = seededRandom(palette.seed + 17);
    ctx.save();
    for (let i = 0; i < 36; i++) {
      const cx = rng() * w;
      const cy = h * (0.14 + rng() * 0.25);
      const rx = 55 + rng() * 145;
      const ry = 12 + rng() * 24;
      ctx.fillStyle = palette.cloudColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      if (cx + rx > w) {
        ctx.beginPath();
        ctx.ellipse(cx - w, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawMountainLayer(ctx, w, h, baseY, amp, freq1, freq2, phase, color, mistColor) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    const steps = 256;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const angle = u * Math.PI * 2;
      const ridge =
        Math.sin(angle * freq1 + phase) * amp +
        Math.cos(angle * freq2 - phase * 1.4) * (amp * 0.45) +
        Math.sin(angle * (freq1 + freq2) + 0.7) * (amp * 0.18);
      ctx.lineTo(u * w, baseY - ridge);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, baseY - amp * 1.3, 0, h * 0.85);
    grad.addColorStop(0, color);
    grad.addColorStop(1, mistColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 0, 0);
    ctx.fill();
  }

  function drawSerpentineRoad(ctx, w, h, centerU, accentColor) {
    // Desenha serpentina descendo a escarpa no vale (abaixo do horizonte)
    const cx = w * centerU;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const pts = [
      [cx - 35, h * 0.56],
      [cx + 68, h * 0.60],
      [cx - 72, h * 0.65],
      [cx + 88, h * 0.70],
      [cx - 95, h * 0.76],
      [cx + 55, h * 0.83],
      [cx - 20, h * 0.92]
    ];

    // Borda de concreto / guarda-corpo
    ctx.strokeStyle = "rgba(232, 236, 240, 0.75)";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const mx = (prev[0] + curr[0]) * 0.5;
      ctx.quadraticCurveTo(prev[0], curr[1], curr[0], curr[1]);
      void mx;
    }
    ctx.stroke();

    // Asfalto / concreto
    ctx.strokeStyle = "#343b42";
    ctx.lineWidth = 15;
    ctx.stroke();

    // Faixa central amarela
    ctx.strokeStyle = accentColor || "#f59e0b";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([12, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawCorvoBrancoWalls(ctx, w, h) {
    // Paredões monumentais de arenito de 90m nos dois lados do yaw=0 (centro u=0.5)
    const leftGrad = ctx.createLinearGradient(w * 0.25, h * 0.12, w * 0.45, h * 0.82);
    leftGrad.addColorStop(0, "#4b4237");
    leftGrad.addColorStop(0.5, "#6b5a49");
    leftGrad.addColorStop(1, "#2a2520");

    // Paredão esquerdo
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.20, h);
    ctx.lineTo(w * 0.24, h * 0.30);
    ctx.lineTo(w * 0.36, h * 0.14);
    ctx.lineTo(w * 0.445, h * 0.22);
    ctx.lineTo(w * 0.46, h * 0.54);
    ctx.lineTo(w * 0.42, h);
    ctx.closePath();
    ctx.fill();

    // Paredão direito
    const rightGrad = ctx.createLinearGradient(w * 0.55, h * 0.14, w * 0.78, h * 0.85);
    rightGrad.addColorStop(0, "#5b4c3d");
    rightGrad.addColorStop(0.5, "#3f362d");
    rightGrad.addColorStop(1, "#221e1a");

    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.58, h);
    ctx.lineTo(w * 0.54, h * 0.54);
    ctx.lineTo(w * 0.555, h * 0.20);
    ctx.lineTo(w * 0.65, h * 0.13);
    ctx.lineTo(w * 0.78, h * 0.32);
    ctx.lineTo(w * 0.82, h);
    ctx.closePath();
    ctx.fill();

    // Estrias verticais na rocha
    ctx.strokeStyle = "rgba(20, 17, 14, 0.26)";
    ctx.lineWidth = 3;
    for (let x = w * 0.26; x < w * 0.45; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.22);
      ctx.lineTo(x - 6, h * 0.85);
      ctx.stroke();
    }
    for (let x = w * 0.56; x < w * 0.75; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.22);
      ctx.lineTo(x + 6, h * 0.85);
      ctx.stroke();
    }

    // Estrada de concreto atravessando a fenda no centro
    ctx.fillStyle = "#41484f";
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.56);
    ctx.lineTo(w * 0.54, h * 0.56);
    ctx.lineTo(w * 0.59, h);
    ctx.lineTo(w * 0.41, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.moveTo(w * 0.50, h * 0.57);
    ctx.lineTo(w * 0.50, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawWindTurbines(ctx, w, h) {
    const positions = [0.27, 0.31, 0.36, 0.41];
    ctx.save();
    positions.forEach((u, idx) => {
      const x = w * u;
      const baseY = h * (0.49 + (idx % 2) * 0.015);
      const towerH = 95 - idx * 8;
      ctx.strokeStyle = "#e8eef2";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, baseY - towerH);
      ctx.stroke();

      const hubY = baseY - towerH;
      ctx.lineWidth = 2.6;
      for (let b = 0; b < 3; b++) {
        const ang = (b * Math.PI * 2) / 3 + idx * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, hubY);
        ctx.lineTo(x + Math.cos(ang) * 32, hubY + Math.sin(ang) * 32);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function drawGroundDeck(ctx, w, h, groundTop, groundBottom) {
    const g = ctx.createLinearGradient(0, h * 0.78, 0, h);
    g.addColorStop(0, groundTop);
    g.addColorStop(1, groundBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.80, w, h * 0.20);
  }

  function generate(tema) {
    if (cache.has(tema)) return cache.get(tema);

    const w = 2048;
    const h = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const palettes = {
      rio_do_rastro: {
        seed: 101,
        skyTop: "#132234",
        skyMid: "#39526b",
        skyHorizon: "#e49d64",
        sunX: 0.72,
        sunY: 0.36,
        cloudColor: "rgba(255, 224, 196, 0.22)",
        layers: [
          [0.53, 82, 3, 7, 0.3, "#3b4d5e", "#2b3946"],
          [0.57, 68, 4, 9, 1.4, "#284038", "#1c2d27"],
          [0.64, 52, 5, 11, 2.5, "#1f3728", "#15251c"]
        ],
        roadU: 0.53,
        groundTop: "rgba(38, 43, 47, 0.92)",
        groundBottom: "#1b2024"
      },
      rio_do_rastro_curvas: {
        seed: 109,
        skyTop: "#1b2c3a",
        skyMid: "#4d6777",
        skyHorizon: "#c7d4da",
        sunX: 0.30,
        sunY: 0.28,
        cloudColor: "rgba(240, 247, 250, 0.26)",
        layers: [
          [0.48, 105, 2, 6, 0.8, "#3e525c", "#2d3d45"],
          [0.56, 76, 4, 8, 2.0, "#243d32", "#182b23"],
          [0.66, 46, 6, 12, 0.5, "#233529", "#17231c"]
        ],
        roadU: 0.47,
        groundTop: "rgba(56, 60, 64, 0.94)",
        groundBottom: "#23272b"
      },
      canion_ronda: {
        seed: 118,
        skyTop: "#14273b",
        skyMid: "#3a6588",
        skyHorizon: "#d6b893",
        sunX: 0.62,
        sunY: 0.32,
        cloudColor: "rgba(255, 244, 226, 0.24)",
        layers: [
          [0.52, 62, 3, 6, 1.1, "#455966", "#2f3f4a"],
          [0.58, 54, 4, 8, 2.3, "#324938", "#223326"],
          [0.66, 36, 5, 10, 0.4, "#293e2b", "#1b291c"]
        ],
        windTurbines: true,
        groundTop: "rgba(44, 58, 40, 0.92)",
        groundBottom: "#1d261a"
      },
      corvo_branco: {
        seed: 205,
        skyTop: "#14282e",
        skyMid: "#3b6770",
        skyHorizon: "#9bc1be",
        sunX: 0.50,
        sunY: 0.26,
        cloudColor: "rgba(232, 246, 244, 0.24)",
        layers: [
          [0.53, 70, 3, 7, 0.5, "#36524e", "#243835"],
          [0.60, 52, 4, 9, 1.7, "#244034", "#172a22"]
        ],
        canyonCut: true,
        groundTop: "rgba(48, 52, 54, 0.90)",
        groundBottom: "#1d2022"
      },
      corvo_branco_altos: {
        seed: 214,
        skyTop: "#132935",
        skyMid: "#386b7a",
        skyHorizon: "#b9d4cf",
        sunX: 0.24,
        sunY: 0.30,
        cloudColor: "rgba(240, 250, 248, 0.26)",
        layers: [
          [0.54, 78, 3, 7, 1.0, "#3d5c5c", "#294040"],
          [0.60, 62, 4, 9, 2.2, "#254535", "#172d22"],
          [0.68, 42, 6, 11, 0.3, "#1d3828", "#12241a"]
        ],
        roadU: 0.42,
        groundTop: "rgba(62, 50, 38, 0.92)",
        groundBottom: "#2a221a"
      },
      dona_francisca: {
        seed: 303,
        skyTop: "#10283d",
        skyMid: "#2e6485",
        skyHorizon: "#9bc6d9",
        sunX: 0.78,
        sunY: 0.31,
        cloudColor: "rgba(242, 250, 255, 0.25)",
        layers: [
          [0.53, 66, 3, 6, 0.7, "#2f5761", "#1e3a42"],
          [0.58, 58, 4, 9, 1.9, "#1c4a33", "#113021"],
          [0.65, 48, 5, 11, 2.8, "#153d26", "#0d2618"]
        ],
        roadU: 0.52,
        groundTop: "rgba(42, 48, 52, 0.92)",
        groundBottom: "#1c2023"
      },
      campo_alegre: {
        seed: 318,
        skyTop: "#15324a",
        skyMid: "#437ca3",
        skyHorizon: "#c6dfec",
        sunX: 0.34,
        sunY: 0.29,
        cloudColor: "rgba(255, 255, 255, 0.28)",
        layers: [
          [0.52, 48, 2, 5, 0.4, "#3b6659", "#28473e"],
          [0.57, 36, 4, 8, 1.8, "#295938", "#1a3b24"],
          [0.64, 24, 5, 10, 2.6, "#2c5e31", "#1d4021"]
        ],
        groundTop: "rgba(46, 68, 40, 0.92)",
        groundBottom: "#22331d"
      }
    };

    const p = palettes[tema] || palettes.rio_do_rastro;
    drawSky(ctx, w, h, p);

    p.layers.forEach(([by, amp, f1, f2, ph, c1, c2]) => {
      drawMountainLayer(ctx, w, h, h * by, amp, f1, f2, ph, c1, c2);
    });

    if (p.windTurbines) {
      drawWindTurbines(ctx, w, h);
    }
    if (p.roadU) {
      drawSerpentineRoad(ctx, w, h, p.roadU, "#f59e0b");
    }
    if (p.canyonCut) {
      drawCorvoBrancoWalls(ctx, w, h);
    } else {
      drawGroundDeck(ctx, w, h, p.groundTop, p.groundBottom);
    }

    // Horizonte de névoa leve nas serras
    const mist = ctx.createLinearGradient(0, h * 0.44, 0, h * 0.62);
    mist.addColorStop(0, "rgba(255,255,255,0)");
    mist.addColorStop(0.5, "rgba(230,240,245,0.14)");
    mist.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.44, w, h * 0.18);

    cache.set(tema, canvas);
    return canvas;
  }

  return { generate };
})();
