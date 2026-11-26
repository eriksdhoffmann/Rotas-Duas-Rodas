/**
 * Controlador Principal — Rotas Duas Rodas SC (Mapa 3D + Moto 3D + Tour 360° + Chat Copiloto)
 */
(function () {
  const DATA = window.ROTAS_DUAS_RODAS;
  let activeRouteId = "rio-do-rastro";
  let activeFilter = "all";
  let activeStopId = null;
  let leafletMap = null;
  let leafletLayerGroup = null;

  function getRoute(id) {
    return DATA.rotas.find((r) => r.id === id) || DATA.rotas[0];
  }

  function renderElevationSVG(route) {
    const pts = route.paradas;
    const w = 290;
    const h = 58;
    const padX = 8;
    const padY = 8;
    const minA = route.altitudeMin;
    const maxA = Math.max(route.altitudeMax, minA + 100);

    const coords = pts.map((p) => {
      const x = padX + p.t * (w - padX * 2);
      const y = h - padY - ((p.altitude - minA) / (maxA - minA)) * (h - padY * 2);
      return [x, y, p];
    });

    const lineD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const areaD = `${lineD} L${coords[coords.length - 1][0].toFixed(1)},${h - padY} L${coords[0][0].toFixed(1)},${h - padY} Z`;

    const dots = coords
      .map(
        ([x, y, p]) =>
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${route.corRota}" stroke="#13171a" stroke-width="1.5"><title>${p.nome} (${p.altitude} m)</title></circle>`
      )
      .join("");

    return `
      <svg viewBox="0 0 ${w} ${h}" class="elev-svg" aria-label="Perfil altimétrico da rota">
        <defs>
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${route.corRota}" stop-opacity="0.38"/>
            <stop offset="100%" stop-color="${route.corRota}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#elevFill)"/>
        <path d="${lineD}" fill="none" stroke="${route.corRota}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>
    `;
  }

  function renderRoutePanel(route) {
    document.getElementById("routeCodeBadge").textContent = route.codigo;
    document.getElementById("routeCodeBadge").style.backgroundColor = route.corRota;
    document.getElementById("routeTitle").textContent = route.nome;
    document.getElementById("routeSubtitle").textContent = `${route.trecho} · ${route.avaliacao}`;
    document.getElementById("routeSummary").textContent = route.resumo;

    document.getElementById("statDist").textContent = `${route.distanciaKm} km`;
    document.getElementById("statAlt").textContent = `${route.altitudeMax} m`;
    document.getElementById("statCurves").textContent = `${route.curvas}`;
    document.getElementById("routePiso").textContent = route.piso;
    document.getElementById("routeAlert").textContent = route.alertaClima;
    document.getElementById("elevationChart").innerHTML = renderElevationSVG(route);

    renderStopsList(route);
  }

  function renderStopsList(route) {
    const listEl = document.getElementById("stopsList");
    listEl.innerHTML = "";

    const filtered = route.paradas.filter(
      (p) => activeFilter === "all" || p.categoria === activeFilter
    );

    filtered.forEach((parada) => {
      const cat = DATA.categoriasParada[parada.categoria] || DATA.categoriasParada.mirante;
      const item = document.createElement("button");
      item.type = "button";
      item.className = "stop-item" + (parada.id === activeStopId ? " is-active" : "");
      item.dataset.stopId = parada.id;
      item.innerHTML = `
        <span class="stop-item-icon" style="color:${cat.cor}">${cat.icone}</span>
        <span class="stop-item-text">
          <strong>${parada.nome}</strong>
          <small>Km ${parada.km} · ${parada.altitude} m · ${cat.label}</small>
        </span>
      `;
      item.addEventListener("click", () => {
        focusStop(route.id, parada.id, true);
      });
      listEl.appendChild(item);
    });
  }

  function openStopCard(parada, route) {
    activeStopId = parada.id;
    const cat = DATA.categoriasParada[parada.categoria] || DATA.categoriasParada.mirante;
    const card = document.getElementById("stopDetailCard");

    document.getElementById("stopCardCat").textContent = `${cat.icone} ${cat.label} · Km ${parada.km} · ${parada.altitude} m`;
    document.getElementById("stopCardCat").style.color = cat.cor;
    document.getElementById("stopCardTitle").textContent = parada.nome;
    document.getElementById("stopCardSummary").textContent = parada.resumo;
    document.getElementById("stopCardInfra").textContent = parada.oQueTem;
    document.getElementById("stopCardTip").textContent = parada.dicaPiloto;

    const btn360 = document.getElementById("btnStopOpen360");
    btn360.onclick = () => window.Engine360.open(parada.scene360Id);

    const btnResume = document.getElementById("btnStopResumeRide");
    btnResume.onclick = () => {
      card.hidden = true;
      window.TerrainMoto3D.setPlaying(true);
      updatePlayBtn(true);
    };

    card.hidden = false;
    window.TerrainMoto3D.highlightStopPin(parada.id);

    // Atualiza destaque na lista lateral
    document.querySelectorAll(".stop-item").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.stopId === parada.id);
    });
    void route;
  }

  function focusStop(routeId, stopId, pauseMoto = true) {
    if (routeId !== activeRouteId) {
      selectRoute(routeId, false);
    }
    const route = getRoute(routeId);
    const parada = route.paradas.find((p) => p.id === stopId) || route.paradas[0];
    window.TerrainMoto3D.jumpToProgress(parada.t, !pauseMoto);
    updatePlayBtn(!pauseMoto);
    openStopCard(parada, route);
  }

  function selectRoute(routeId, autoPlay = true) {
    activeRouteId = routeId;
    activeStopId = null;
    const route = getRoute(routeId);

    document.querySelectorAll(".route-nav-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.routeId === routeId);
    });
    document.getElementById("btnOverviewSC").classList.remove("is-active");
    document.getElementById("stopDetailCard").hidden = true;
    document.getElementById("hudBar").classList.remove("is-hidden");

    window.TerrainMoto3D.loadRoute(routeId, 0.04);
    window.TerrainMoto3D.setPlaying(autoPlay);
    updatePlayBtn(autoPlay);
    renderRoutePanel(route);
  }

  function enterOverviewSC() {
    document.querySelectorAll(".route-nav-btn").forEach((btn) => btn.classList.remove("is-active"));
    document.getElementById("btnOverviewSC").classList.add("is-active");
    document.getElementById("stopDetailCard").hidden = true;
    document.getElementById("hudBar").classList.add("is-hidden");
    window.TerrainMoto3D.showOverviewSC();
  }

  function updatePlayBtn(isPlaying) {
    const btn = document.getElementById("btnPlayPause");
    btn.textContent = isPlaying ? "⏸ Pausar" : "▶ Pilotar";
    btn.classList.toggle("is-playing", isPlaying);
  }

  function setCameraUI(mode) {
    window.TerrainMoto3D.setCameraMode(mode);
    document.querySelectorAll(".cam-btn").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.cam === mode);
    });
  }

  function showApproachToast(parada) {
    const toast = document.getElementById("approachToast");
    const cat = DATA.categoriasParada[parada.categoria] || DATA.categoriasParada.mirante;
    toast.innerHTML = `<span>${cat.icone} Passando por <strong>${parada.nome.split(" · ")[0]}</strong> (${parada.altitude} m)</span>`;
    toast.classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
  }

  // Mapa 2D / Satélite real (Leaflet) com GPS das 3 serras
  function openSatelliteMap() {
    const modal = document.getElementById("map2DModal");
    modal.classList.add("is-open");

    if (!window.L) return;
    if (!leafletMap) {
      leafletMap = L.map("leafletMapContainer", { zoomControl: true }).setView(DATA.meta.centroSC, 8);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Satélite Esri · Rotas Duas Rodas SC",
        maxZoom: 18
      }).addTo(leafletMap);
      L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 18,
        opacity: 0.85
      }).addTo(leafletMap);
      leafletLayerGroup = L.layerGroup().addTo(leafletMap);
    }

    leafletLayerGroup.clearLayers();
    const activeRoute = getRoute(activeRouteId);

    DATA.rotas.forEach((rota) => {
      const isCurrent = rota.id === activeRouteId;
      L.polyline(rota.gpsPath, {
        color: rota.corRota,
        weight: isCurrent ? 5 : 3.5,
        opacity: isCurrent ? 0.95 : 0.7
      }).addTo(leafletLayerGroup);

      rota.paradas.forEach((p) => {
        const cat = DATA.categoriasParada[p.categoria] || DATA.categoriasParada.mirante;
        const marker = L.circleMarker(p.coords, {
          radius: isCurrent ? 7 : 5,
          fillColor: cat.cor,
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0.95
        }).addTo(leafletLayerGroup);

        marker.bindPopup(`
          <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:190px;">
            <div style="font-size:11px;font-weight:700;color:${cat.cor};text-transform:uppercase;">${rota.codigo} · ${cat.label}</div>
            <div style="font-size:14px;font-weight:800;margin:3px 0 4px;">${p.nome}</div>
            <div style="font-size:12px;color:#475569;margin-bottom:8px;">Km ${p.km} · ${p.altitude} m</div>
            <button type="button" onclick="window.__jumpFromMap2D('${rota.id}','${p.id}')"
              style="width:100%;padding:6px 10px;border:0;border-radius:6px;background:#0f172a;color:#fff;font-weight:700;cursor:pointer;">
              🏍️ Levar Moto 3D até aqui
            </button>
          </div>
        `);
      });
    });

    setTimeout(() => {
      leafletMap.invalidateSize();
      leafletMap.fitBounds(L.latLngBounds(activeRoute.gpsPath), { padding: [36, 36] });
    }, 120);
  }

  window.__jumpFromMap2D = function (routeId, stopId) {
    document.getElementById("map2DModal").classList.remove("is-open");
    focusStop(routeId, stopId, true);
  };

  function handleChatAction(act) {
    if (act.type === "route") {
      selectRoute(act.routeId, true);
    } else if (act.type === "stop") {
      focusStop(act.routeId, act.stopId, true);
    } else if (act.type === "tour360") {
      window.Engine360.open(act.sceneId);
    } else if (act.type === "overview") {
      enterOverviewSC();
    } else if (act.type === "camera") {
      setCameraUI(act.mode);
    }
  }

  function init() {
    // Monta botões das 3 rotas na barra superior
    const navBar = document.getElementById("routeNavBar");
    DATA.rotas.forEach((rota) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "route-nav-btn";
      btn.dataset.routeId = rota.id;
      btn.innerHTML = `
        <span class="highway-shield" style="--shield-color:${rota.corRota}">${rota.codigo}</span>
        <span class="route-nav-name">${rota.nome}</span>
      `;
      btn.addEventListener("click", () => selectRoute(rota.id, true));
      navBar.appendChild(btn);
    });

    document.getElementById("btnOverviewSC").addEventListener("click", enterOverviewSC);

    // Filtros de parada
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        activeFilter = chip.dataset.filter;
        document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        renderStopsList(getRoute(activeRouteId));
      });
    });

    // Controles do HUD inferior
    document.getElementById("btnPlayPause").addEventListener("click", () => {
      const next = !window.TerrainMoto3D.isPlaying();
      window.TerrainMoto3D.setPlaying(next);
      updatePlayBtn(next);
    });

    document.querySelectorAll(".speed-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        window.TerrainMoto3D.setSpeed(parseFloat(btn.dataset.speed));
      });
    });

    const scrubber = document.getElementById("routeScrubber");
    scrubber.addEventListener("input", () => {
      const t = parseFloat(scrubber.value) / 1000;
      window.TerrainMoto3D.jumpToProgress(t, window.TerrainMoto3D.isPlaying());
    });

    document.querySelectorAll(".cam-btn").forEach((btn) => {
      btn.addEventListener("click", () => setCameraUI(btn.dataset.cam));
    });

    document.getElementById("btnOpenNearest360").addEventListener("click", () => {
      const nearest = window.TerrainMoto3D.getNearestStop();
      const route = getRoute(activeRouteId);
      const sceneId = (nearest && nearest.scene360Id) || route.paradas[0].scene360Id;
      window.Engine360.open(sceneId);
    });

    document.getElementById("btnOpenMap2D").addEventListener("click", openSatelliteMap);
    document.getElementById("btnCloseMap2D").addEventListener("click", () => {
      document.getElementById("map2DModal").classList.remove("is-open");
    });

    document.getElementById("btnCloseStopCard").addEventListener("click", () => {
      document.getElementById("stopDetailCard").hidden = true;
    });

    // Toggle painéis laterais (Guia da Rota e Chat Copiloto)
    const leftDrawer = document.getElementById("routeDrawer");
    document.getElementById("btnToggleRouteDrawer").addEventListener("click", () => {
      leftDrawer.classList.toggle("is-collapsed");
    });

    const chatDrawer = document.getElementById("chatDrawer");
    document.getElementById("btnToggleChat").addEventListener("click", () => {
      chatDrawer.classList.toggle("is-open");
    });
    document.getElementById("btnCloseChat").addEventListener("click", () => {
      chatDrawer.classList.remove("is-open");
    });

    // Inicializa Motor 360°, Chat e Motor 3D
    window.Engine360.init();
    window.ChatCopiloto.init(handleChatAction);

    window.TerrainMoto3D.init({
      containerId: "viewport3D",
      markersLayerId: "pins3DLayer",
      onTelemetry: ({ progress, altitudeM, speedKmh, kmAtual, leanDeg }) => {
        scrubber.value = Math.round(progress * 1000);
        document.getElementById("telAlt").textContent = `${altitudeM} m`;
        document.getElementById("telSpeed").textContent = `${speedKmh} km/h`;
        document.getElementById("telKm").textContent = `${kmAtual} km`;
        document.getElementById("telLean").textContent = `${leanDeg}°`;
      },
      onStopClick: (parada, route) => {
        updatePlayBtn(false);
        openStopCard(parada, route);
      },
      onRouteSelectFromOverview: (routeId) => {
        selectRoute(routeId, true);
      },
      onStopApproach: (parada) => {
        showApproachToast(parada);
        window.TerrainMoto3D.highlightStopPin(parada.id);
      }
    });

    // Ativa rota inicial
    selectRoute("rio-do-rastro", true);
    setCameraUI("chase");
  }

  window.addEventListener("DOMContentLoaded", init);
})();
