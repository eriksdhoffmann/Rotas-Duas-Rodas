/**
 * Motor 3D de Terreno Serrano + Motocicleta 3D Animada — Rotas Duas Rodas SC
 * Usa Three.js (r147 local) + OrbitControls.
 *
 * Recursos:
 *  - Terreno topográfico 3D esculpido dinamicamente em torno da curva de cada serra
 *  - Paredões de 90 m no Corte do Corvo Branco e Parque Eólico na Serra do Rio do Rastro
 *  - Motocicleta 3D detalhada com piloto, rodas girando, farol e inclinação (lean) nas curvas
 *  - 3 modos de câmera: Perseguição (Chase), Piloto (1ª Pessoa) e Mapa Livre (Orbit)
 *  - Modo Mapa Geral de Santa Catarina com as 3 rotas conectadas
 */
window.TerrainMoto3D = (function () {
  let container, renderer, scene, camera, controls;
  let markersLayer;
  let routeGroup = null;
  let overviewGroup = null;
  let motoGroup = null;
  let frontWheel = null;
  let rearWheel = null;
  let windTurbineRotors = [];

  let currentRoute = null;
  let currentCurve = null;
  let isOverview = false;

  // Estado da pilotagem
  let progress = 0.04; // 0..1 ao longo da curva
  let playing = true;
  let speedMultiplier = 1.0;
  let cameraMode = "chase"; // "chase" | "rider" | "orbit"
  let currentLean = 0;
  let currentSpeedKmh = 52;
  let lastNotifiedStopId = null;

  // Callbacks para UI
  let onTelemetry = () => {};
  let onStopClick = () => {};
  let onRouteSelectFromOverview = () => {};
  let onStopApproach = () => {};

  const clock = new THREE.Clock();
  const tempVecA = new THREE.Vector3();
  const tempVecB = new THREE.Vector3();
  const tempVecC = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0);

  // Ruído determinístico leve para relevo natural
  function hash2D(x, z) {
    const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothNoise(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);

    const a = hash2D(ix, iz);
    const b = hash2D(ix + 1, iz);
    const c = hash2D(ix, iz + 1);
    const d = hash2D(ix + 1, iz + 1);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  }

  function fbm(x, z) {
    let v = 0;
    let amp = 0.55;
    let freq = 1;
    for (let i = 0; i < 4; i++) {
      v += amp * smoothNoise(x * freq, z * freq);
      freq *= 2.05;
      amp *= 0.48;
    }
    return v;
  }

  function buildMotorcycle(accentHex) {
    const root = new THREE.Group();
    const tiltGroup = new THREE.Group();
    root.add(tiltGroup);
    root.userData.tiltGroup = tiltGroup;

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x181b1f, roughness: 0.85, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xbac4ce, roughness: 0.3, metalness: 0.8 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a3138, roughness: 0.5, metalness: 0.6 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdce4ec, roughness: 0.2, metalness: 0.9 });
    const paintMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex || "#f59e0b"),
      roughness: 0.32,
      metalness: 0.45
    });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.9 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x222930, roughness: 0.8 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25, metalness: 0.3 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });

    function makeWheel() {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.14, 12, 24), tireMat);
      tire.rotation.y = Math.PI / 2;
      wg.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 14), rimMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(rim);
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.56, 0.06), frameMat);
      wg.add(spoke);
      const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.56), frameMat);
      wg.add(spoke2);
      return wg;
    }

    // Rodas (moto orientada para +Z)
    rearWheel = makeWheel();
    rearWheel.position.set(0, 0.58, -0.95);
    tiltGroup.add(rearWheel);

    frontWheel = makeWheel();
    frontWheel.position.set(0, 0.58, 1.05);
    tiltGroup.add(frontWheel);

    // Chassi & motor
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.92), frameMat);
    engine.position.set(0, 0.82, -0.05);
    tiltGroup.add(engine);

    // Balança traseira
    const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.95), frameMat);
    swingarm.position.set(0, 0.62, -0.55);
    tiltGroup.add(swingarm);

    // Escapamento duplo cromado
    [-0.31, 0.31].forEach((sx) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.15, 10), chromeMat);
      pipe.rotation.x = Math.PI / 2 - 0.12;
      pipe.position.set(sx, 0.66, -0.68);
      tiltGroup.add(pipe);
    });

    // Tanque de combustível esculpido (estilo Big Trail / Touring)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.94), paintMat);
    tank.position.set(0, 1.24, 0.25);
    tank.rotation.x = -0.1;
    tiltGroup.add(tank);

    // Carenagem frontal / bico Adventure
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.56), paintMat);
    fairing.position.set(0, 1.38, 0.85);
    fairing.rotation.x = 0.2;
    tiltGroup.add(fairing);

    // Para-brisa transparente
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.46, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xcbe5f5, transparent: true, opacity: 0.45, roughness: 0.1 })
    );
    screen.position.set(0, 1.72, 0.94);
    screen.rotation.x = -0.35;
    tiltGroup.add(screen);

    // Garfos dianteiros invertidos
    [-0.17, 0.17].forEach((fx) => {
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.12, 8), chromeMat);
      fork.position.set(fx, 1.02, 0.92);
      fork.rotation.x = -0.28;
      tiltGroup.add(fork);
    });

    // Guidão
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.08, 8), frameMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 1.56, 0.68);
    tiltGroup.add(handlebar);

    // Banco e baú traseiro touring
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.18, 0.88), seatMat);
    seat.position.set(0, 1.12, -0.45);
    tiltGroup.add(seat);

    const topBox = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.36, 0.46), frameMat);
    topBox.position.set(0, 1.38, -1.04);
    tiltGroup.add(topBox);

    // Farol LED frontal + lanterna traseira
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff7d6 })
    );
    headlight.position.set(0, 1.38, 1.14);
    tiltGroup.add(headlight);

    const headBeam = new THREE.PointLight(0xffeed0, 1.4, 16);
    headBeam.position.set(0, 1.5, 2.2);
    tiltGroup.add(headBeam);

    const tailLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.09, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff2e2e })
    );
    tailLight.position.set(0, 1.16, -1.24);
    tiltGroup.add(tailLight);

    // Piloto estilizado
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.34), jacketMat);
    torso.position.set(0, 1.58, -0.22);
    torso.rotation.x = 0.24;
    tiltGroup.add(torso);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 14), helmetMat);
    helmet.position.set(0, 2.08, -0.08);
    tiltGroup.add(helmet);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.18), visorMat);
    visor.position.set(0, 2.09, 0.09);
    tiltGroup.add(visor);

    [-0.28, 0.28].forEach((ax) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.76, 8), jacketMat);
      arm.position.set(ax * 1.15, 1.66, 0.22);
      arm.rotation.x = Math.PI / 2 - 0.16;
      arm.rotation.z = ax > 0 ? 0.22 : -0.22;
      tiltGroup.add(arm);
    });

    // Escala visível e harmoniosa com a estrada
    root.scale.setScalar(1.38);
    return root;
  }

  function buildRoadRibbon(curve, accentHex) {
    const group = new THREE.Group();
    const samples = 240;
    const roadHalfWidth = 2.65;
    const shoulderWidth = 3.05;

    const roadPositions = [];
    const roadIndices = [];
    const centerLinePts = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const side = new THREE.Vector3().crossVectors(tan, upVec).normalize();

      const left = p.clone().addScaledVector(side, -roadHalfWidth);
      const right = p.clone().addScaledVector(side, roadHalfWidth);
      roadPositions.push(left.x, left.y + 0.16, left.z, right.x, right.y + 0.16, right.z);

      centerLinePts.push(new THREE.Vector3(p.x, p.y + 0.24, p.z));

      if (i < samples) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        roadIndices.push(a, c, b, b, c, d);
      }

      // Balizadores laterais nas curvas
      if (i % 8 === 0) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.75, 0.18),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
        );
        const edge = p.clone().addScaledVector(side, shoulderWidth);
        post.position.set(edge.x, edge.y + 0.45, edge.z);
        group.add(post);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x262c32,
      roughness: 0.88,
      metalness: 0.08,
      side: THREE.DoubleSide
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    group.add(roadMesh);

    // Faixa central luminosa na cor da rota
    const lineGeo = new THREE.BufferGeometry().setFromPoints(centerLinePts);
    const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(accentHex || "#f59e0b") });
    const centerLine = new THREE.Line(lineGeo, lineMat);
    group.add(centerLine);

    return group;
  }

  function buildTerrainForRoute(route, curve) {
    const tema = route.tema3D;
    const size = 210;
    const segs = 128;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    // Amostra a curva em 160 pontos para esculpir o leito da rodovia no relevo
    const curvePts = curve.getPoints(160);
    const pos = geo.attributes.position;
    const colors = [];

    const cutPt = tema.hasCanyonCut ? curve.getPointAt(0.62) : null;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Encontra ponto mais próximo da estrada em XZ
      let minDistSq = Infinity;
      let nearestY = 0;
      let nearestIdx = 0;
      for (let k = 0; k < curvePts.length; k++) {
        const dx = vx - curvePts[k].x;
        const dz = vz - curvePts[k].z;
        const d2 = dx * dx + dz * dz;
        if (d2 < minDistSq) {
          minDistSq = d2;
          nearestY = curvePts[k].y;
          nearestIdx = k;
        }
      }
      const dist = Math.sqrt(minDistSq);

      // Inclinação geral de serra (vale no sul/leste -> planalto no norte/oeste)
      const baseSlope = Math.max(0, (vz * -0.18 + vx * 0.14 + 14));
      const ridgeNoise = (fbm((vx + 120) * 0.025, (vz + 120) * 0.025) - 0.42) * 26;
      const microNoise = (fbm((vx + 50) * 0.08, (vz + 50) * 0.08) - 0.5) * 4.5;
      let naturalH = Math.max(0.5, baseSlope + ridgeNoise + microNoise);

      // Mistura suave com a cota exata da estrada
      const roadFlatRadius = 3.8;
      const blendRadius = 18.0;
      let h;
      if (dist <= roadFlatRadius) {
        h = nearestY - 0.08;
      } else if (dist < blendRadius) {
        const w = (dist - roadFlatRadius) / (blendRadius - roadFlatRadius);
        const s = w * w * (3 - 2 * w);
        h = (nearestY - 0.08) * (1 - s) + naturalH * s;
      } else {
        h = naturalH;
      }

      // Paredões verticais de 90 m no Corte da Serra do Corvo Branco
      if (cutPt) {
        const dc = Math.hypot(vx - cutPt.x, vz - cutPt.z);
        if (dc < 24 && dist > 3.2 && dist < 17) {
          const wallFactor = Math.exp(-Math.pow((dc) / 14, 2)) * Math.sin(Math.min(1, (dist - 3.2) / 11) * Math.PI);
          h += wallFactor * 22;
        }
      }

      pos.setY(i, h);

      // Coloração por altitude & rocha exposta
      const tAlt = Math.max(0, Math.min(1, h / 36));
      let r, g, b;
      if (cutPt && Math.hypot(vx - cutPt.x, vz - cutPt.z) < 22 && dist > 3.1 && dist < 16) {
        [r, g, b] = tema.rockColor;
      } else if (tAlt < 0.45) {
        const f = tAlt / 0.45;
        r = tema.terrainLow[0] + (tema.terrainMid[0] - tema.terrainLow[0]) * f;
        g = tema.terrainLow[1] + (tema.terrainMid[1] - tema.terrainLow[1]) * f;
        b = tema.terrainLow[2] + (tema.terrainMid[2] - tema.terrainLow[2]) * f;
      } else {
        const f = (tAlt - 0.45) / 0.55;
        r = tema.terrainMid[0] + (tema.terrainHigh[0] - tema.terrainMid[0]) * f;
        g = tema.terrainMid[1] + (tema.terrainHigh[1] - tema.terrainMid[1]) * f;
        b = tema.terrainMid[2] + (tema.terrainHigh[2] - tema.terrainMid[2]) * f;
      }
      // Sombra sutil junto à estrada
      if (dist < 4.4) {
        r *= 0.72; g *= 0.72; b *= 0.72;
      }
      void nearestIdx;
      colors.push(r, g, b);
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;

    // Árvores estilizadas da Mata Atlântica / Araucárias
    const treesGroup = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f2e22, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x18422b, roughness: 0.85 });
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.6, 5);
    const crownGeo = new THREE.ConeGeometry(1.15, 2.8, 6);

    for (let i = 0; i < 110; i++) {
      const rx = (hash2D(i * 3.1, 9.7) - 0.5) * 165;
      const rz = (hash2D(i * 7.3, 2.1) - 0.5) * 165;
      let tooClose = false;
      for (let k = 0; k < curvePts.length; k += 3) {
        if (Math.hypot(rx - curvePts[k].x, rz - curvePts[k].z) < 7.5) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Estima altura aproximada via vértice mais próximo
      const gx = Math.round(((rx + size / 2) / size) * segs);
      const gz = Math.round(((rz + size / 2) / size) * segs);
      if (gx < 1 || gx >= segs || gz < 1 || gz >= segs) continue;
      const vIdx = gz * (segs + 1) + gx;
      const hy = pos.getY(vIdx);
      if (hy > 34) continue;

      const tree = new THREE.Group();
      const tMesh = new THREE.Mesh(trunkGeo, trunkMat);
      tMesh.position.y = 0.8;
      const cMesh = new THREE.Mesh(crownGeo, leafMat);
      cMesh.position.y = 2.6;
      tree.add(tMesh, cMesh);
      const sc = 0.8 + hash2D(i, 4.4) * 0.9;
      tree.scale.setScalar(sc);
      tree.position.set(rx, hy - 0.2, rz);
      treesGroup.add(tree);
    }

    const wrapper = new THREE.Group();
    wrapper.add(mesh, treesGroup);

    // Torres eólicas no topo da Serra do Rio do Rastro
    windTurbineRotors = [];
    if (tema.hasWindTurbines) {
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xeef3f7, roughness: 0.4 });
      const spots = [
        [44, 31.2, -32],
        [54, 31.6, -40],
        [36, 31.0, -52],
        [52, 32.0, -58]
      ];
      spots.forEach(([tx, ty, tz]) => {
        const tg = new THREE.Group();
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.36, 11, 10), towerMat);
        mast.position.y = 5.5;
        tg.add(mast);

        const rotor = new THREE.Group();
        rotor.position.set(0, 11, 0.3);
        for (let b = 0; b < 3; b++) {
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.2, 0.08), towerMat);
          blade.position.y = 2.1;
          const pivot = new THREE.Group();
          pivot.rotation.z = (b * Math.PI * 2) / 3;
          pivot.add(blade);
          rotor.add(pivot);
        }
        tg.add(rotor);
        tg.position.set(tx, ty, tz);
        tg.rotation.y = -0.6;
        wrapper.add(tg);
        windTurbineRotors.push(rotor);
      });
    }

    return wrapper;
  }

  function buildRoute3DMarkers(route, curve) {
    markersLayer.innerHTML = "";
    const cats = window.ROTAS_DUAS_RODAS.categoriasParada;

    route.paradas.forEach((parada) => {
      const pos3D = curve.getPointAt(parada.t);
      const cat = cats[parada.categoria] || cats.mirante;

      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "pin3d";
      pin.dataset.stopId = parada.id;
      pin.style.setProperty("--pin-color", cat.cor);
      pin.innerHTML = `
        <span class="pin3d-icon">${cat.icone}</span>
        <span class="pin3d-label">${parada.nome.split(" · ")[0]}</span>
      `;
      pin.addEventListener("click", (e) => {
        e.stopPropagation();
        jumpToProgress(parada.t, false);
        onStopClick(parada, route);
      });
      pin._pos3D = new THREE.Vector3(pos3D.x, pos3D.y + 3.8, pos3D.z);
      markersLayer.appendChild(pin);
    });
  }

  function buildOverviewSC() {
    const group = new THREE.Group();

    // Silhueta estilizada do relevo de Santa Catarina
    const shape = new THREE.Shape();
    shape.moveTo(-62, -40);
    shape.lineTo(30, -48);
    shape.lineTo(44, -22);
    shape.lineTo(36, 12);
    shape.lineTo(14, 52);
    shape.lineTo(-22, 48);
    shape.lineTo(-48, 22);
    shape.lineTo(-66, -12);
    shape.closePath();

    const extrude = new THREE.ExtrudeGeometry(shape, {
      depth: 5.5,
      bevelEnabled: true,
      bevelThickness: 1.2,
      bevelSize: 1.4,
      bevelSegments: 3
    });
    extrude.rotateX(Math.PI / 2);

    const scMesh = new THREE.Mesh(
      extrude,
      new THREE.MeshStandardMaterial({ color: 0x1e382b, roughness: 0.85, metalness: 0.08 })
    );
    scMesh.position.y = 2;
    group.add(scMesh);

    // Oceano Atlântico ao fundo
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(340, 340),
      new THREE.MeshStandardMaterial({ color: 0x112536, roughness: 0.6, metalness: 0.2 })
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -3.8;
    group.add(sea);

    // Corredor conectando as 3 rotas icônicas
    const anchors = window.ROTAS_DUAS_RODAS.rotas.map(
      (r) => new THREE.Vector3(r.overviewAnchor.x, 3.6, r.overviewAnchor.z)
    );
    const linkCurve = new THREE.CatmullRomCurve3([
      anchors[0],
      anchors[1],
      new THREE.Vector3(12, 3.6, -4),
      anchors[2]
    ]);
    const linkLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linkCurve.getPoints(80)),
      new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 2.2, gapSize: 1.4 })
    );
    linkLine.computeLineDistances();
    group.add(linkLine);

    // Pins interativos das 3 rotas no mapa geral
    markersLayer.innerHTML = "";
    window.ROTAS_DUAS_RODAS.rotas.forEach((rota) => {
      const a = rota.overviewAnchor;
      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 2.2, 5.5, 16),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(rota.corRota),
          emissive: new THREE.Color(rota.corRota),
          emissiveIntensity: 0.35
        })
      );
      beacon.position.set(a.x, 5.4, a.z);
      group.add(beacon);

      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "pin3d pin3d-overview";
      pin.style.setProperty("--pin-color", rota.corRota);
      pin.innerHTML = `
        <span class="pin3d-code">${rota.codigo}</span>
        <span class="pin3d-label">${rota.nome}</span>
      `;
      pin.addEventListener("click", () => onRouteSelectFromOverview(rota.id));
      pin._pos3D = new THREE.Vector3(a.x, 10.2, a.z);
      markersLayer.appendChild(pin);
    });

    return group;
  }

  function clearSceneContent() {
    if (routeGroup) {
      scene.remove(routeGroup);
      routeGroup = null;
    }
    if (overviewGroup) {
      scene.remove(overviewGroup);
      overviewGroup = null;
    }
    motoGroup = null;
    windTurbineRotors = [];
  }

  function loadRoute(routeId, startT = 0.04) {
    const rota =
      window.ROTAS_DUAS_RODAS.rotas.find((r) => r.id === routeId) ||
      window.ROTAS_DUAS_RODAS.rotas[0];
    currentRoute = rota;
    isOverview = false;
    progress = startT;
    lastNotifiedStopId = null;

    clearSceneContent();

    scene.fog = new THREE.FogExp2(rota.tema3D.fogColor, rota.tema3D.fogDensity);
    scene.background = new THREE.Color(rota.tema3D.skyTop);

    const pts = rota.path3D.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    currentCurve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.45);

    routeGroup = new THREE.Group();
    const terrain = buildTerrainForRoute(rota, currentCurve);
    const road = buildRoadRibbon(currentCurve, rota.corRota);
    motoGroup = buildMotorcycle(rota.corRota);

    routeGroup.add(terrain, road, motoGroup);
    scene.add(routeGroup);

    buildRoute3DMarkers(rota, currentCurve);
    updateMotorcycleTransform(0);

    // Posiciona câmera inicial
    const p = currentCurve.getPointAt(progress);
    controls.target.copy(p);
    camera.position.set(p.x - 16, p.y + 12, p.z + 18);
    controls.update();
  }

  function showOverviewSC() {
    isOverview = true;
    clearSceneContent();
    scene.background = new THREE.Color(0x0f1c26);
    scene.fog = new THREE.FogExp2(0x0f1c26, 0.0014);

    overviewGroup = buildOverviewSC();
    scene.add(overviewGroup);

    controls.target.set(0, 2, 0);
    camera.position.set(0, 92, 96);
    controls.update();
  }

  function updateMotorcycleTransform(dt) {
    if (!motoGroup || !currentCurve || !currentRoute) return;

    const p = currentCurve.getPointAt(progress);
    const tan = currentCurve.getTangentAt(progress).normalize();

    // Curvatura para inclinação realista da moto (lean angle)
    const tAhead = Math.min(1, progress + 0.014);
    const tanAhead = currentCurve.getTangentAt(tAhead).normalize();
    const crossY = tan.x * tanAhead.z - tan.z * tanAhead.x;
    const targetLean = Math.max(-0.52, Math.min(0.52, crossY * 6.5));
    currentLean += (targetLean - currentLean) * Math.min(1, dt * 8 + 0.15);

    motoGroup.position.set(p.x, p.y + 0.18, p.z);
    tempVecA.copy(p).add(tan);
    motoGroup.lookAt(tempVecA.x, tempVecA.y + 0.18, tempVecA.z);

    if (motoGroup.userData.tiltGroup) {
      motoGroup.userData.tiltGroup.rotation.z = currentLean;
    }

    // Rodas girando conforme a velocidade
    if (playing && dt > 0) {
      const spin = dt * 12 * speedMultiplier;
      if (frontWheel) frontWheel.rotation.x += spin;
      if (rearWheel) rearWheel.rotation.x += spin;
    }

    // Velocidade estimada conforme curvatura (mais lenta em grampos fechados)
    const curveTightness = Math.min(1, Math.abs(currentLean) * 2.1);
    const baseKmh = (68 - curveTightness * 34) * (0.75 + speedMultiplier * 0.25);
    currentSpeedKmh = playing ? Math.round(baseKmh) : 0;

    // Atualiza câmeras dinâmicas
    if (cameraMode === "chase") {
      tempVecB.copy(p).addScaledVector(tan, -11.5);
      tempVecB.y += 5.4;
      camera.position.lerp(tempVecB, Math.min(1, dt * 4.5 + 0.05));
      tempVecC.copy(p).addScaledVector(tan, 7.5);
      tempVecC.y += 1.8;
      controls.target.lerp(tempVecC, Math.min(1, dt * 6 + 0.08));
      controls.update();
    } else if (cameraMode === "rider") {
      tempVecB.copy(p).addScaledVector(tan, 0.35);
      tempVecB.y += 2.75;
      camera.position.lerp(tempVecB, Math.min(1, dt * 12 + 0.2));
      tempVecC.copy(p).addScaledVector(tan, 18.0);
      tempVecC.y += 1.6;
      camera.lookAt(tempVecC);
    } else {
      controls.update();
    }

    // Telemetria para HUD
    const altRange = currentRoute.altitudeMax - currentRoute.altitudeMin;
    const altRatio = Math.max(0, Math.min(1, (p.y - 1.5) / 31));
    const altitudeM = Math.round(currentRoute.altitudeMin + altRatio * altRange);
    const kmAtual = (progress * currentRoute.distanciaKm).toFixed(1);
    const leanDeg = Math.round(Math.abs(currentLean) * (180 / Math.PI));

    onTelemetry({
      progress,
      altitudeM,
      speedKmh: currentSpeedKmh,
      kmAtual,
      leanDeg
    });

    // Detecta aproximação de um ponto de parada
    let nearestStop = null;
    let bestD = 0.035;
    currentRoute.paradas.forEach((st) => {
      const d = Math.abs(st.t - progress);
      if (d < bestD) {
        bestD = d;
        nearestStop = st;
      }
    });
    if (nearestStop && nearestStop.id !== lastNotifiedStopId) {
      lastNotifiedStopId = nearestStop.id;
      onStopApproach(nearestStop, currentRoute);
    }
  }

  function updateProjectedPins() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const pins = markersLayer.children;
    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      if (!pin._pos3D) continue;
      tempVecA.copy(pin._pos3D).project(camera);
      if (tempVecA.z > 1) {
        pin.style.opacity = "0";
        pin.style.pointerEvents = "none";
      } else {
        const sx = (tempVecA.x * 0.5 + 0.5) * w;
        const sy = (-tempVecA.y * 0.5 + 0.5) * h;
        pin.style.opacity = "1";
        pin.style.pointerEvents = "auto";
        pin.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
      }
    }
  }

  let renderPaused = false;

  function animate() {
    requestAnimationFrame(animate);
    if (renderPaused) return;
    const dt = Math.min(0.05, clock.getDelta());

    if (!isOverview && currentCurve) {
      if (playing) {
        progress += dt * 0.022 * speedMultiplier;
        if (progress >= 1) progress = 0.005;
      }
      updateMotorcycleTransform(dt);

      // Roda hélices do Parque Eólico
      windTurbineRotors.forEach((r) => {
        r.rotation.z -= dt * 1.4;
      });
    } else {
      controls.update();
    }

    renderer.render(scene, camera);
    updateProjectedPins();
  }

  function setRenderPaused(paused) {
    renderPaused = !!paused;
    if (!renderPaused) clock.getDelta();
  }

  function jumpToProgress(t, keepPlaying = false) {
    progress = Math.max(0.002, Math.min(0.998, t));
    playing = keepPlaying;
    updateMotorcycleTransform(0.016);
  }

  function setPlaying(val) {
    playing = !!val;
  }

  function isPlaying() {
    return playing;
  }

  function setSpeed(mult) {
    speedMultiplier = mult;
  }

  function setCameraMode(mode) {
    cameraMode = mode;
    controls.enabled = mode === "orbit" || isOverview;
  }

  function highlightStopPin(stopId) {
    Array.from(markersLayer.children).forEach((el) => {
      el.classList.toggle("is-active", el.dataset.stopId === stopId);
    });
  }

  function getNearestStop() {
    if (!currentRoute) return null;
    let best = currentRoute.paradas[0];
    let bestDist = Infinity;
    currentRoute.paradas.forEach((st) => {
      const d = Math.abs(st.t - progress);
      if (d < bestDist) {
        bestDist = d;
        best = st;
      }
    });
    return best;
  }

  function init(opts) {
    container = document.getElementById(opts.containerId);
    markersLayer = document.getElementById(opts.markersLayerId);
    onTelemetry = opts.onTelemetry || onTelemetry;
    onStopClick = opts.onStopClick || onStopClick;
    onRouteSelectFromOverview = opts.onRouteSelectFromOverview || onRouteSelectFromOverview;
    onStopApproach = opts.onStopApproach || onStopApproach;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.4,
      650
    );

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // Iluminação quente de serra catarinense
    const hemi = new THREE.HemisphereLight(0xdceeff, 0x263428, 0.85);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffe7c4, 1.25);
    sun.position.set(75, 95, 45);
    scene.add(sun);

    const rim = new THREE.DirectionalLight(0x7db3d9, 0.45);
    rim.position.set(-60, 40, -60);
    scene.add(rim);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = 8;
    controls.maxDistance = 175;
    controls.enabled = false;

    window.addEventListener("resize", () => {
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    loadRoute("rio-do-rastro", 0.04);
    animate();
  }

  return {
    init,
    loadRoute,
    showOverviewSC,
    jumpToProgress,
    setPlaying,
    isPlaying,
    setSpeed,
    setCameraMode,
    highlightStopPin,
    getNearestStop,
    setRenderPaused
  };
})();
