/**
 * Copiloto Duas Rodas — Chat Interativo conectado ao Mapa 3D, Motinha e Tour 360°
 * Responde dúvidas de mototurismo em Santa Catarina e executa ações diretas no mapa 3D.
 */
window.ChatCopiloto = (function () {
  let messagesEl, inputEl, formEl;
  let actionsHandler = () => {};

  function normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function appendMessage(role, htmlText, actions = []) {
    const bubble = document.createElement("div");
    bubble.className = `chat-msg chat-msg-${role}`;
    bubble.innerHTML = `<div class="chat-msg-body">${htmlText}</div>`;

    if (actions.length > 0) {
      const bar = document.createElement("div");
      bar.className = "chat-actions";
      actions.forEach((act) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-action-btn";
        btn.textContent = act.label;
        btn.addEventListener("click", () => actionsHandler(act));
        bar.appendChild(btn);
      });
      bubble.appendChild(bar);
    }

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function answerQuery(rawText) {
    const q = normalize(rawText);
    const rotas = window.ROTAS_DUAS_RODAS.rotas;
    const rdr = rotas[0];
    const cb = rotas[1];
    const df = rotas[2];

    // 1. Roteiro combinando as serras (2 dias / fim de semana)
    if (q.includes("roteiro") || q.includes("2 dias") || q.includes("fim de semana") || q.includes("combinar") || q.includes("ligar")) {
      return {
        text: `<strong>Roteiro Clássico Serra Catarinense (2 dias de moto):</strong><br>
        • <strong>Dia 1:</strong> Suba a <strong>Serra do Corvo Branco (SC-370)</strong> saindo de Grão-Pará, pare no Corte de 90 m e nos Altos do Corvo Branco, e pernoite em <strong>Urubici</strong> (truta + pousadas com garagem coberta).<br>
        • <strong>Dia 2:</strong> Siga pelo planalto até Bom Jardim da Serra, visite o Cânion da Ronda e desça as <strong>284 curvas da Serra do Rio do Rastro (SC-390)</strong> até Lauro Müller.<br>
        Se estiver no Norte de SC, a <strong>Serra Dona Francisca (SC-418)</strong> é o bate-volta perfeito de domingo saindo de Joinville.`,
        actions: [
          { type: "overview", label: "🗺️ Ver Mapa Geral de SC" },
          { type: "route", routeId: "corvo-branco", label: "🏍️ Iniciar no Corvo Branco" },
          { type: "route", routeId: "rio-do-rastro", label: "⛰️ Ir para Rio do Rastro" }
        ]
      };
    }

    // 2. Serra do Rio do Rastro
    if (q.includes("rastro") || q.includes("390") || q.includes("lauro") || q.includes("bom jardim")) {
      if (q.includes("parar") || q.includes("cafe") || q.includes("comer") || q.includes("posto") || q.includes("gasolina")) {
        return {
          text: `<strong>Onde parar na Serra do Rio do Rastro (SC-390):</strong><br>
          • <strong>Km 0 (Lauro Müller):</strong> Posto 24h & calibragem antes da subida.<br>
          • <strong>Km 7 (Cascata da Barrinha):</strong> Recuo pavimentado para primeira foto.<br>
          • <strong>Km 24 (Mirante 1.421 m):</strong> Estacionamento amplo de motos, café panorâmico e vista das 284 curvas.<br>
          • <strong>Km 28 (Parada Serrano):</strong> Café colonial, lareira e costela no planalto.<br>
          • <strong>Km 35 (Cânion da Ronda):</strong> Parque eólico e borda de cânion.`,
          actions: [
            { type: "stop", routeId: "rio-do-rastro", stopId: "rdr-mirante", label: "📍 Levar moto ao Mirante" },
            { type: "stop", routeId: "rio-do-rastro", stopId: "rdr-cafe-bom-jardim", label: "☕ Ir para Café no Planalto" },
            { type: "tour360", sceneId: "sc390-mirante", label: "🌐 Abrir Tour 360° do Mirante" }
          ]
        };
      }
      return {
        text: `<strong>Serra do Rio do Rastro (${rdr.codigo}):</strong> ${rdr.resumo}<br>
        • <strong>Extensão:</strong> ${rdr.distanciaKm} km · <strong>Altitude máx.:</strong> ${rdr.altitudeMax} m · <strong>Curvas:</strong> ${rdr.curvas}.<br>
        • <strong>Dica:</strong> ${rdr.alertaClima}`,
        actions: [
          { type: "route", routeId: "rio-do-rastro", label: "🏍️ Pilotar na SC-390 em 3D" },
          { type: "tour360", sceneId: "sc390-mirante", label: "🌐 Abrir Tour 360°" },
          { type: "camera", mode: "rider", label: "🪖 Câmera do Piloto (1ª Pessoa)" }
        ]
      };
    }

    // 3. Serra do Corvo Branco
    if (q.includes("corvo") || q.includes("370") || q.includes("urubici") || q.includes("grao") || q.includes("paredao")) {
      return {
        text: `<strong>Serra do Corvo Branco (${cb.codigo}):</strong> ${cb.resumo}<br>
        • <strong>Melhores paradas:</strong> Posto em Grão-Pará (km 0), Corte dos Paredões de 90 m (km 17), Altos do Corvo Branco com decks panorâmicos (km 20) e cafés/trutas em Urubici (km 28).<br>
        • <strong>Atenção:</strong> ${cb.alertaClima}`,
        actions: [
          { type: "route", routeId: "corvo-branco", label: "🏍️ Pilotar na SC-370 em 3D" },
          { type: "stop", routeId: "corvo-branco", stopId: "cb-corte-rocha", label: "📍 Parar no Corte de 90 m" },
          { type: "tour360", sceneId: "sc370-corte", label: "🌐 Abrir Tour 360° dos Paredões" }
        ]
      };
    }

    // 4. Serra Dona Francisca
    if (q.includes("francisca") || q.includes("418") || q.includes("joinville") || q.includes("campo alegre") || q.includes("pirabeiraba")) {
      return {
        text: `<strong>Serra Dona Francisca (${df.codigo}):</strong> ${df.resumo}<br>
        • <strong>Melhores paradas:</strong> Encontro em Pirabeiraba (km 0), Mirante SC-418 a 740 m (km 22), Café Colonial no topo (km 31) e almoço em Campo Alegre (km 44).<br>
        • <strong>Perfil:</strong> Curvas fluidas de média velocidade em asfalto conservado — excelente para qualquer cilindrada.`,
        actions: [
          { type: "route", routeId: "dona-francisca", label: "🏍️ Pilotar na SC-418 em 3D" },
          { type: "stop", routeId: "dona-francisca", stopId: "df-mirante", label: "📍 Parar no Mirante SC-418" },
          { type: "tour360", sceneId: "sc418-mirante", label: "🌐 Abrir Tour 360° do Mirante" }
        ]
      };
    }

    // 5. Onde parar / café / gasolina / abastecimento geral
    if (q.includes("parar") || q.includes("parada") || q.includes("cafe") || q.includes("posto") || q.includes("abastec") || q.includes("combustivel")) {
      return {
        text: `<strong>Pontos de parada estratégicos para motociclistas nas 3 serras:</strong><br>
        • <strong>Abastecimento antes de subir:</strong> Lauro Müller (SC-390), Grão-Pará (SC-370) e Pirabeiraba (SC-418).<br>
        • <strong>Cafés & Gastronomia:</strong> Parada Serrano em Bom Jardim da Serra, Rua dos Cafés em Urubici e Cafés Coloniais em Campo Alegre.<br>
        • <strong>Mirantes com estacionamento amplo:</strong> Mirante do Rio do Rastro (1.421 m), Altos do Corvo Branco (1.470 m) e Mirante Dona Francisca (740 m).`,
        actions: [
          { type: "stop", routeId: "rio-do-rastro", stopId: "rdr-mirante", label: "⛰️ Mirante Rio do Rastro" },
          { type: "stop", routeId: "corvo-branco", stopId: "cb-altos-corvo", label: "☕ Altos do Corvo Branco" },
          { type: "stop", routeId: "dona-francisca", stopId: "df-cafe-colonial", label: "🍰 Café Serra Dona Francisca" }
        ]
      };
    }

    // 6. Tipo de moto (Big Trail, Custom, Esportiva, Naked, Scooter)
    if (q.includes("big trail") || q.includes("custom") || q.includes("esportiva") || q.includes("naked") || q.includes("scooter") || q.includes("qual moto")) {
      return {
        text: `<strong>Recomendação por estilo de moto em SC:</strong><br>
        • <strong>Big Trail / Trail:</strong> Brilham em todas as 3 rotas e permitem explorar estradas secundárias de Urubici e Cânion da Ronda.<br>
        • <strong>Esportiva / Naked:</strong> A <strong>Serra Dona Francisca (SC-418)</strong> tem as curvas mais fluidas; na SC-390, atenção aos grampos fechados de 1ª/2ª marcha.<br>
        • <strong>Custom / Cruiser:</strong> Curtem muito o visual do <strong>Rio do Rastro</strong> e <strong>Dona Francisca</strong>; no Corvo Branco, cuidado com o ângulo das rampas íngremes e o vão livre do escapamento.`,
        actions: [
          { type: "route", routeId: "dona-francisca", label: "🏍️ Testar SC-418 (Fluida)" },
          { type: "route", routeId: "rio-do-rastro", label: "⛰️ Testar SC-390 (Técnica)" }
        ]
      };
    }

    // 7. Tour 360° ou Câmera
    if (q.includes("360") || q.includes("tour") || q.includes("drone") || q.includes("foto")) {
      return {
        text: `O <strong>Tour Virtual 360°</strong> segue a lógica WebGL equiretangular do projeto <em>Virtual Tour 360 Logic</em>: você pode girar 360° nos mirantes, clicar nos hotspots ancorados por <code>(pitch, yaw)</code>, ativar rótulos 3D <code>Aa</code> e até subir sua própria foto 360° de drone ou Insta360 no <strong>Estúdio Criador</strong>.`,
        actions: [
          { type: "tour360", sceneId: "sc390-mirante", label: "🌐 360° Rio do Rastro" },
          { type: "tour360", sceneId: "sc370-corte", label: "🌐 360° Corvo Branco" },
          { type: "tour360", sceneId: "sc418-mirante", label: "🌐 360° Dona Francisca" }
        ]
      };
    }

    // 8. Neblina, clima, segurança
    if (q.includes("neblina") || q.includes("chuva") || q.includes("clima") || q.includes("frio") || q.includes("dica") || q.includes("seguranca")) {
      return {
        text: `<strong>Checklist de Segurança nas Serras de SC:</strong><br>
        • <strong>Horário de ouro:</strong> Suba entre 7h30 e 11h para evitar a neblina que costuma fechar a serra à tarde.<br>
        • <strong>Temperatura:</strong> A queda térmica entre o pé da serra e o mirante chega a 10–12 °C. Leve segunda pele e luva fechada.<br>
        • <strong>Pilotagem:</strong> Use freio motor na descida, evite parar em curvas cegas e mantenha distância segura de ônibus e caminhões.`,
        actions: [
          { type: "stop", routeId: "rio-do-rastro", stopId: "rdr-curvas-concreto", label: "🏍️ Ver Trecho Técnico SC-390" },
          { type: "camera", mode: "rider", label: "🪖 Simular Visão do Piloto" }
        ]
      };
    }

    // Resposta padrão prestativa
    return {
      text: `Posso te ajudar a planejar sua viagem de moto pelas <strong>3 principais serras de Santa Catarina</strong>:<br>
      1. <strong>Serra do Rio do Rastro (SC-390)</strong> — 284 curvas técnicas.<br>
      2. <strong>Serra do Corvo Branco (SC-370)</strong> — paredões de 90 m.<br>
      3. <strong>Serra Dona Francisca (SC-418)</strong> — curvas fluidas e cafés coloniais.<br>
      Pergunte onde parar para café/gasolina, peça um roteiro de 2 dias ou escolha uma ação abaixo:`,
      actions: [
        { type: "route", routeId: "rio-do-rastro", label: "🏍️ Ir para Rio do Rastro" },
        { type: "route", routeId: "corvo-branco", label: "⛰️ Ir para Corvo Branco" },
        { type: "route", routeId: "dona-francisca", label: "🌲 Ir para Dona Francisca" },
        { type: "overview", label: "🗺️ Ver Mapa Geral SC" }
      ]
    };
  }

  function sendUserQuery(text) {
    const clean = text.trim();
    if (!clean) return;
    appendMessage("user", clean);
    const reply = answerQuery(clean);
    setTimeout(() => {
      appendMessage("bot", reply.text, reply.actions);
    }, 180);
  }

  function init(onAction) {
    actionsHandler = onAction || actionsHandler;
    messagesEl = document.getElementById("chatMessages");
    inputEl = document.getElementById("chatInput");
    formEl = document.getElementById("chatForm");

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = inputEl.value;
      inputEl.value = "";
      sendUserQuery(val);
    });

    document.querySelectorAll(".chat-quick-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        sendUserQuery(chip.dataset.prompt || chip.textContent);
      });
    });

    // Mensagem inicial de boas-vindas
    appendMessage(
      "bot",
      `Fala, motociclista! Sou seu <strong>Copiloto Duas Rodas</strong> em Santa Catarina. A motinha 3D já está rodando na <strong>Serra do Rio do Rastro (SC-390)</strong> — me pergunte onde parar, qual rota combina com sua moto ou peça para abrir o <strong>Tour 360°</strong>.`,
      [
        { type: "stop", routeId: "rio-do-rastro", stopId: "rdr-mirante", label: "📍 Parar no Mirante SC-390" },
        { type: "route", routeId: "corvo-branco", label: "⛰️ Ir ao Corvo Branco" },
        { type: "tour360", sceneId: "sc390-mirante", label: "🌐 Abrir Tour 360°" }
      ]
    );
  }

  return { init, sendUserQuery, appendMessage };
})();
