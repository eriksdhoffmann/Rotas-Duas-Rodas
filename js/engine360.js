/**
 * Motor WebGL 360° Equiretangular — Virtual Tour 360 Logic (Rotas Duas Rodas SC)
 * Implementa os 4 Pilares Matemáticos do projeto Geohereditas / Geoturismo Interativo:
 *   Pilar A: Fragment Shader WebGL equiretangular 2:1 (Yaw [-180°,180°], Pitch [-90°,90°])
 *   Pilar B: Projeção direta 3D -> 2D `sphericalToScreen(pitch, yaw)` a 60 FPS
 *   Pilar C: Rótulos geográficos 3D flutuantes sobre a paisagem (toggle `Aa`)
 *   Pilar D: Raycasting inverso `screenToSpherical(mouseX, mouseY)` + Estúdio Criador 360°
 */
window.Engine360 = (function () {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  let overlayEl, canvas, gl, program, texture;
  let hotspotsEl, labelsEl, sceneTitleEl, sceneSubEl, pillsEl;
  let active = false;
  let rafId = null;

  let currentScene = null;
  let yaw = 0;
  let pitch = -5;
  let targetYaw = 0;
  let targetPitch = -5;
  let fov = 76;
  let targetFov = 76;
  let autoRotate = false;
  let showLabels = true;
  let creatorMode = false;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragMoved = false;
  let lastX = 0;
  let lastY = 0;

  let customTextures = new Map();
  let customHotspots = {};

  const VERT_SRC = `
    attribute vec2 a_pos;
    varying vec2 v_ndc;
    void main() {
      v_ndc = a_pos;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  // Pilar A: Projeção equiretangular 2:1 na esfera WebGL
  const FRAG_SRC = `
    precision highp float;
    varying vec2 v_ndc;
    uniform sampler2D u_tex;
    uniform float u_yaw;
    uniform float u_pitch;
    uniform float u_fov;
    uniform float u_aspect;

    const float PI = 3.14159265359;

    void main() {
      float halfTan = tan(u_fov * 0.5);
      vec3 dir = normalize(vec3(
        v_ndc.x * halfTan * u_aspect,
        v_ndc.y * halfTan,
        1.0
      ));

      // Rotação Pitch (eixo X)
      float cp = cos(u_pitch);
      float sp = sin(u_pitch);
      vec3 pDir = vec3(
        dir.x,
        dir.y * cp + dir.z * sp,
        -dir.y * sp + dir.z * cp
      );

      // Rotação Yaw (eixo Y)
      float cy = cos(u_yaw);
      float sy = sin(u_yaw);
      vec3 wDir = vec3(
        pDir.x * cy + pDir.z * sy,
        pDir.y,
        -pDir.x * sy + pDir.z * cy
      );

      float lon = atan(wDir.x, wDir.z);
      float lat = asin(clamp(wDir.y, -1.0, 1.0));
      float u = 0.5 + lon / (2.0 * PI);
      float v = 0.5 - lat / PI;

      gl_FragColor = texture2D(u_tex, vec2(u, v));
    }
  `;

  function compileShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error("WebGL360 shader error:", gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  function initWebGL() {
    gl = canvas.getContext("webgl", { antialias: true, preserveDrawingBuffer: false });
    if (!gl) return false;

    const vs = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return true;
  }

  function uploadTextureSource(source) {
    if (!gl) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  // Pilar B: Projeção Direta 3D -> 2D
  function sphericalToScreen(pDeg, yDeg) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pr = pDeg * DEG;
    const yr = yDeg * DEG;

    const wx = Math.cos(pr) * Math.sin(yr);
    const wy = Math.sin(pr);
    const wz = Math.cos(pr) * Math.cos(yr);

    // Rotação inversa por -yaw
    const cy = Math.cos(-yaw * DEG);
    const sy = Math.sin(-yaw * DEG);
    const x1 = wx * cy + wz * sy;
    const y1 = wy;
    const z1 = -wx * sy + wz * cy;

    // Rotação inversa por -pitch
    const cp = Math.cos(-pitch * DEG);
    const sp = Math.sin(-pitch * DEG);
    const cx = x1;
    const cyCam = y1 * cp + z1 * sp;
    const cz = -y1 * sp + z1 * cp;

    if (cz <= 0.05) return { visible: false, x: -9999, y: -9999 };

    const focal = (h * 0.5) / Math.tan((fov * 0.5) * DEG);
    return {
      visible: true,
      x: w * 0.5 + (cx / cz) * focal,
      y: h * 0.5 - (cyCam / cz) * focal
    };
  }

  // Pilar D: Raycasting Inverso (Tela 2D -> Pitch e Yaw)
  function screenToSpherical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / rect.height) * 2;
    const aspect = rect.width / rect.height;
    const halfTan = Math.tan((fov * 0.5) * DEG);

    let dx = nx * halfTan * aspect;
    let dy = ny * halfTan;
    let dz = 1.0;
    const len = Math.hypot(dx, dy, dz);
    dx /= len; dy /= len; dz /= len;

    const cp = Math.cos(pitch * DEG);
    const sp = Math.sin(pitch * DEG);
    const px = dx;
    const py = dy * cp + dz * sp;
    const pz = -dy * sp + dz * cp;

    const cy = Math.cos(yaw * DEG);
    const sy = Math.sin(yaw * DEG);
    const wx = px * cy + pz * sy;
    const wy = py;
    const wz = -px * sy + pz * cy;

    return {
      yaw: Number((Math.atan2(wx, wz) * RAD).toFixed(1)),
      pitch: Number((Math.asin(Math.max(-1, Math.min(1, wy))) * RAD).toFixed(1))
    };
  }

  function getSceneHotspots(scene) {
    const extra = customHotspots[scene.id] || [];
    return [...(scene.hotspots || []), ...extra];
  }

  function renderDOMOverlays() {
    if (!currentScene) return;
    // Hotspots
    const hsNodes = hotspotsEl.children;
    const list = getSceneHotspots(currentScene);
    for (let i = 0; i < list.length && i < hsNodes.length; i++) {
      const hs = list[i];
      const node = hsNodes[i];
      const pos = sphericalToScreen(hs.pitch, hs.yaw);
      if (pos.visible) {
        node.style.opacity = "1";
        node.style.pointerEvents = "auto";
        node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      } else {
        node.style.opacity = "0";
        node.style.pointerEvents = "none";
      }
    }

    // Pilar C: Rótulos 3D Flutuantes
    const lblNodes = labelsEl.children;
    const labels = currentScene.labels3D || [];
    for (let i = 0; i < labels.length && i < lblNodes.length; i++) {
      const lbl = labels[i];
      const node = lblNodes[i];
      if (!showLabels) {
        node.style.opacity = "0";
        continue;
      }
      const pos = sphericalToScreen(lbl.pitch, lbl.yaw);
      if (pos.visible) {
        node.style.opacity = "1";
        node.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) perspective(500px) rotateX(16deg)`;
      } else {
        node.style.opacity = "0";
      }
    }
  }

  function rebuildOverlayElements() {
    hotspotsEl.innerHTML = "";
    labelsEl.innerHTML = "";
    if (!currentScene) return;

    const list = getSceneHotspots(currentScene);
    list.forEach((hs) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `hs360-btn hs360-${hs.type || "info"}`;
      const icon = hs.type === "scene" ? "➜" : hs.type === "pitstop" ? "☕" : "i";
      btn.innerHTML = `<span class="hs360-dot">${icon}</span><span class="hs360-tag">${hs.titulo}</span>`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (hs.type === "scene" && hs.targetScene) {
          flyToScene(hs.pitch, hs.yaw, hs.targetScene);
        } else {
          openSplitModal(hs);
        }
      });
      hotspotsEl.appendChild(btn);
    });

    (currentScene.labels3D || []).forEach((lbl) => {
      const el = document.createElement("div");
      el.className = "label360-float";
      el.innerHTML = `<strong>${lbl.texto}</strong><span>${lbl.subtexto || ""}</span>`;
      labelsEl.appendChild(el);
    });
  }

  function flyToScene(p, y, nextSceneId) {
    targetYaw = y;
    targetPitch = p;
    targetFov = 44;
    setTimeout(() => {
      loadScene(nextSceneId);
      targetFov = 76;
    }, 340);
  }

  function openSplitModal(hs) {
    const modal = document.getElementById("splitModal360");
    const visual = document.getElementById("splitModalVisual");
    const badge = document.getElementById("splitModalBadge");
    const title = document.getElementById("splitModalTitle");
    const sub = document.getElementById("splitModalSubtitle");
    const desc = document.getElementById("splitModalDesc");
    const tip = document.getElementById("splitModalTip");

    badge.textContent = hs.categoria || "Ponto Motociclista";
    title.textContent = hs.titulo;
    sub.textContent = hs.subtitulo || currentScene.titulo;
    desc.textContent = hs.descricao || "";
    tip.textContent = hs.dica || "Mantenha a manutenção da moto em dia e aproveite a serra com segurança.";

    // Visual ilustrativo editorial vetorial à esquerda (sem placeholders quebrados)
    const accent = hs.corDiagrama || "#10b981";
    visual.innerHTML = `
      <svg viewBox="0 0 600 440" class="split-editorial-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="svSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#132230"/>
            <stop offset="100%" stop-color="#2c4857"/>
          </linearGradient>
        </defs>
        <rect width="600" height="440" fill="url(#svSky)"/>
        <path d="M0 300 L110 185 L230 245 L370 135 L500 225 L600 175 L600 440 L0 440 Z" fill="#1c342b"/>
        <path d="M0 340 L160 250 L290 295 L445 205 L600 280 L600 440 L0 440 Z" fill="#13261f"/>
        <path d="M75 435 C175 370, 420 385, 390 330 C360 285, 210 315, 225 270 C240 230, 390 245, 420 198"
              fill="none" stroke="#dce3e8" stroke-width="14" stroke-linecap="round"/>
        <path d="M75 435 C175 370, 420 385, 390 330 C360 285, 210 315, 225 270 C240 230, 390 245, 420 198"
              fill="none" stroke="#2c333a" stroke-width="10" stroke-linecap="round"/>
        <path d="M75 435 C175 370, 420 385, 390 330 C360 285, 210 315, 225 270 C240 230, 390 245, 420 198"
              fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="7 7" stroke-linecap="round"/>
        <circle cx="420" cy="198" r="14" fill="${accent}" opacity="0.28"/>
        <circle cx="420" cy="198" r="6" fill="${accent}"/>
        <line x1="420" y1="198" x2="355" y2="115" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 4"/>
        <rect x="210" y="78" width="215" height="44" rx="8" fill="rgba(15,23,28,0.86)" stroke="${accent}" stroke-width="1"/>
        <text x="317" y="98" text-anchor="middle" fill="#ffffff" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="700">${currentScene.titulo.slice(0, 28)}</text>
        <text x="317" y="114" text-anchor="middle" fill="#cbd5e1" font-family="JetBrains Mono, monospace" font-size="10">YAW ${hs.yaw}° · PITCH ${hs.pitch}°</text>
      </svg>
    `;

    modal.classList.add("is-open");
  }

  function closeSplitModal() {
    const modal = document.getElementById("splitModal360");
    if (modal) modal.classList.remove("is-open");
  }

  function resize() {
    if (!canvas || !gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function renderLoop() {
    if (!active) return;
    rafId = requestAnimationFrame(renderLoop);

    if (autoRotate && !isDragging) {
      targetYaw += 0.08;
    }
    yaw += (targetYaw - yaw) * 0.14;
    pitch += (targetPitch - pitch) * 0.14;
    fov += (targetFov - fov) * 0.14;

    resize();
    if (gl && program) {
      gl.useProgram(program);
      gl.uniform1f(gl.getUniformLocation(program, "u_yaw"), yaw * DEG);
      gl.uniform1f(gl.getUniformLocation(program, "u_pitch"), pitch * DEG);
      gl.uniform1f(gl.getUniformLocation(program, "u_fov"), fov * DEG);
      gl.uniform1f(
        gl.getUniformLocation(program, "u_aspect"),
        canvas.width / Math.max(1, canvas.height)
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    renderDOMOverlays();
  }

  function buildScenePills() {
    if (!pillsEl) return;
    pillsEl.innerHTML = "";
    const cenas = window.ROTAS_DUAS_RODAS.cenas360;
    Object.values(cenas).forEach((sc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pano-pill" + (currentScene && currentScene.id === sc.id ? " is-active" : "");
      btn.textContent = sc.titulo.split(" (")[0].replace("Mirante da ", "").replace("Corte da ", "Corte ");
      btn.addEventListener("click", () => loadScene(sc.id));
      pillsEl.appendChild(btn);
    });
  }

  function loadScene(sceneId) {
    const cenas = window.ROTAS_DUAS_RODAS.cenas360;
    const sc = cenas[sceneId] || Object.values(cenas)[0];
    currentScene = sc;

    yaw = sc.initialYaw || 0;
    pitch = sc.initialPitch || -5;
    targetYaw = yaw;
    targetPitch = pitch;
    targetFov = 76;

    sceneTitleEl.textContent = sc.titulo;
    sceneSubEl.textContent = sc.subtitulo;

    if (customTextures.has(sc.id)) {
      uploadTextureSource(customTextures.get(sc.id));
    } else {
      const panoCanvas = window.PanoramaGenerator.generate(sc.temaPano);
      uploadTextureSource(panoCanvas);
    }

    rebuildOverlayElements();
    buildScenePills();
  }

  function open(sceneId) {
    active = true;
    overlayEl.classList.add("is-open");
    overlayEl.setAttribute("aria-hidden", "false");
    loadScene(sceneId);
    cancelAnimationFrame(rafId);
    renderLoop();
  }

  function close() {
    active = false;
    closeSplitModal();
    overlayEl.classList.remove("is-open");
    overlayEl.setAttribute("aria-hidden", "true");
    cancelAnimationFrame(rafId);
  }

  function init() {
    overlayEl = document.getElementById("tour360Overlay");
    canvas = document.getElementById("pano360Canvas");
    hotspotsEl = document.getElementById("pano360Hotspots");
    labelsEl = document.getElementById("pano360Labels");
    sceneTitleEl = document.getElementById("pano360Title");
    sceneSubEl = document.getElementById("pano360Sub");
    pillsEl = document.getElementById("pano360Pills");

    initWebGL();

    // Arrasto esférico com inércia + clique do Modo Criador (Pilar D)
    canvas.addEventListener("pointerdown", (e) => {
      isDragging = true;
      dragMoved = false;
      dragStartX = lastX = e.clientX;
      dragStartY = lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 5) {
        dragMoved = true;
      }
      const sens = fov * 0.0022;
      targetYaw -= dx * sens;
      targetPitch = Math.max(-75, Math.min(75, targetPitch + dy * sens));
      lastX = e.clientX;
      lastY = e.clientY;
    });

    canvas.addEventListener("pointerup", (e) => {
      isDragging = false;
      if (!dragMoved && creatorMode) {
        const ang = screenToSpherical(e.clientX, e.clientY);
        document.getElementById("creatorYaw").value = ang.yaw;
        document.getElementById("creatorPitch").value = ang.pitch;
        document.getElementById("creatorCoordsHint").textContent =
          `Capturado via Raycasting Inverso: Yaw ${ang.yaw}° · Pitch ${ang.pitch}°`;
      }
    });

    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        targetFov = Math.max(38, Math.min(115, targetFov + e.deltaY * 0.045));
      },
      { passive: false }
    );

    // Controles do Tour 360°
    document.getElementById("btnClose360").addEventListener("click", close);
    document.getElementById("btnCloseSplitModal").addEventListener("click", closeSplitModal);
    document.getElementById("splitModal360").addEventListener("click", (e) => {
      if (e.target.id === "splitModal360") closeSplitModal();
    });

    const btnAuto = document.getElementById("btn360AutoRotate");
    btnAuto.addEventListener("click", () => {
      autoRotate = !autoRotate;
      btnAuto.classList.toggle("is-active", autoRotate);
    });

    const btnLbl = document.getElementById("btn360Labels");
    btnLbl.classList.add("is-active");
    btnLbl.addEventListener("click", () => {
      showLabels = !showLabels;
      btnLbl.classList.toggle("is-active", showLabels);
    });

    const btnCreator = document.getElementById("btn360Creator");
    const creatorPanel = document.getElementById("creatorPanel360");
    btnCreator.addEventListener("click", () => {
      creatorMode = !creatorMode;
      btnCreator.classList.toggle("is-active", creatorMode);
      creatorPanel.hidden = !creatorMode;
    });

    // Upload de Foto 360° própria (Drone / Insta360)
    document.getElementById("creatorPhotoInput").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !currentScene) return;
      const img = new Image();
      img.onload = () => {
        customTextures.set(currentScene.id, img);
        uploadTextureSource(img);
        document.getElementById("creatorCoordsHint").textContent =
          `Foto 360° "${file.name}" aplicada na cena atual!`;
      };
      img.src = URL.createObjectURL(file);
    });

    // Adicionar novo hotspot motociclista via Modo Criador
    document.getElementById("btnCreatorAddHotspot").addEventListener("click", () => {
      if (!currentScene) return;
      const titulo = document.getElementById("creatorTitle").value.trim();
      const descricao = document.getElementById("creatorDesc").value.trim();
      const y = parseFloat(document.getElementById("creatorYaw").value);
      const p = parseFloat(document.getElementById("creatorPitch").value);
      if (!titulo || Number.isNaN(y) || Number.isNaN(p)) {
        document.getElementById("creatorCoordsHint").textContent =
          "Clique na imagem 360° para capturar Pitch/Yaw e informe um título.";
        return;
      }
      if (!customHotspots[currentScene.id]) customHotspots[currentScene.id] = [];
      customHotspots[currentScene.id].push({
        id: "custom-" + Date.now(),
        type: "pitstop",
        yaw: y,
        pitch: p,
        titulo,
        subtitulo: "Ponto adicionado no Estúdio 360°",
        categoria: "Parada Personalizada",
        descricao: descricao || "Ponto de parada marcado pelo motociclista no Tour 360°.",
        dica: "Exportável em JSON para salvar permanentemente no projeto."
      });
      document.getElementById("creatorTitle").value = "";
      document.getElementById("creatorDesc").value = "";
      rebuildOverlayElements();
      document.getElementById("creatorCoordsHint").textContent = `Ponto "${titulo}" ancorado em (${p}°, ${y}°)!`;
    });

    document.getElementById("btnCreatorExport").addEventListener("click", () => {
      const data = JSON.stringify(customHotspots, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rotas-duas-rodas-hotspots-360.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return { init, open, close, loadScene };
})();
