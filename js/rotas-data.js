/**
 * Banco de Dados Geoespacial e Mototurístico — Rotas Duas Rodas SC
 * Baseado nas 3 principais rotas de moto de Santa Catarina:
 *  1. Serra do Rio do Rastro (SC-390)
 *  2. Serra do Corvo Branco (SC-370)
 *  3. Serra Dona Francisca (SC-418)
 *
 * Inclui geometria de curvas para o motor 3D, coordenadas reais (GPS) para o mapa
 * de satélite/2D, pontos de parada para motociclistas e cenas do Tour Virtual 360°.
 */
window.ROTAS_DUAS_RODAS = {
  meta: {
    titulo: "Rotas Duas Rodas — Santa Catarina 3D & 360°",
    regiao: "Santa Catarina, Brasil",
    centroSC: [-27.65, -49.55]
  },

  categoriasParada: {
    mirante: { label: "Mirante", cor: "#10b981", icone: "⛰️" },
    parada: { label: "Café & Parada", cor: "#f59e0b", icone: "☕" },
    apoio: { label: "Posto & Apoio", cor: "#38bdf8", icone: "⛽" },
    tecnico: { label: "Trecho Técnico", cor: "#ef4444", icone: "🏍️" }
  },

  rotas: [
    {
      id: "rio-do-rastro",
      codigo: "SC-390",
      nome: "Serra do Rio do Rastro",
      trecho: "Lauro Müller ↔ Bom Jardim da Serra",
      avaliacao: "4.9 ★ (9.1K)",
      distanciaKm: 35,
      tempoMedio: "1h 15min (ritmo turístico)",
      altitudeMin: 220,
      altitudeMax: 1460,
      curvas: 284,
      dificuldade: "Alta — Curvas técnicas e rampas fortes",
      piso: "Concreto rígido na subida da serra + asfalto no planalto",
      motosIdeais: ["Big Trail", "Naked", "Sport Touring", "Custom", "Esportiva"],
      alertaClima: "Neblina frequente após 15h e vento forte no mirante. Saia cedo e leve segunda pele.",
      corRota: "#f59e0b",
      tema3D: {
        skyTop: 0x1a2634,
        skyBottom: 0xd98a54,
        fogColor: 0x3b4856,
        fogDensity: 0.0022,
        terrainLow: [0.16, 0.30, 0.20],
        terrainMid: [0.24, 0.33, 0.23],
        terrainHigh: [0.42, 0.39, 0.35],
        rockColor: [0.34, 0.32, 0.30],
        hasCanyonCut: false,
        hasWindTurbines: true
      },
      // Posição aproximada no mapa geral 3D de SC (coordenadas normalizadas)
      overviewAnchor: { x: -12, z: 38 },
      // Pontos 3D (x, y, z) para o terreno dedicado da rota (serpentina realista)
      path3D: [
        [-72, 2.2, 62],
        [-56, 3.0, 52],
        [-42, 4.4, 42],
        [-30, 6.2, 34],
        [-16, 8.2, 36],
        [-22, 10.6, 24],
        [-6, 13.0, 22],
        [-18, 15.6, 11],
        [4, 18.2, 10],
        [-10, 21.0, -2],
        [12, 23.6, -4],
        [-2, 26.2, -16],
        [18, 28.4, -19],
        [8, 30.2, -30],
        [24, 31.4, -36],
        [42, 31.2, -44],
        [62, 32.0, -56]
      ],
      // Coordenadas GPS reais aproximadas ao longo da SC-390
      gpsPath: [
        [-28.3941, -49.3965],
        [-28.3968, -49.4510],
        [-28.3992, -49.5120],
        [-28.3955, -49.5405],
        [-28.3924, -49.5468],
        [-28.3895, -49.5502],
        [-28.3886, -49.5522],
        [-28.3852, -49.5665],
        [-28.3620, -49.5980],
        [-28.3385, -49.6245]
      ],
      resumo: "A rota de moto mais emblemática de Santa Catarina. São 284 curvas fechadas subindo a escarpa da Serra Geral até 1.421 m, com mirantes espetaculares da Mata Atlântica ao Planalto Serrano.",
      paradas: [
        {
          id: "rdr-lauro-muller",
          t: 0.03,
          km: 0,
          altitude: 220,
          nome: "Base Lauro Müller · Posto & Check-up",
          categoria: "apoio",
          coords: [-28.3941, -49.3965],
          resumo: "Último grande ponto de abastecimento e calibragem de pneus antes de encarar a subida da serra.",
          oQueTem: "Posto 24h, calibrador digital, loja de conveniência, café espresso e borracharia próxima.",
          dicaPiloto: "Encha o tanque aqui e cheque a pressão dos pneus frios. A subida exige torque constante e freio motor na volta.",
          scene360Id: "sc390-mirante"
        },
        {
          id: "rdr-barrinha",
          t: 0.22,
          km: 7,
          altitude: 480,
          nome: "Cascata da Barrinha & Portal da Serra",
          categoria: "mirante",
          coords: [-28.3988, -49.5095],
          resumo: "Primeira parada fotográfica com queda d'água ao lado da rodovia e o pórtico oficial de início da serra.",
          oQueTem: "Recuo pavimentado para estacionar motos, painel informativo e acesso visual à cascata.",
          dicaPiloto: "Atenção ao piso úmido próximo à cascata e ao fluxo de motos entrando e saindo do acostamento.",
          scene360Id: "sc390-mirante"
        },
        {
          id: "rdr-curvas-concreto",
          t: 0.48,
          km: 16,
          altitude: 940,
          nome: "Serpentina de Concreto · Curvas em Grampo",
          categoria: "tecnico",
          coords: [-28.3924, -49.5468],
          resumo: "Trecho mais técnico da SC-390 com grampos de 180°, inclinação acentuada e guarda-corpos históricos.",
          oQueTem: "Pequenos recuos de emergência, vista vertical para as curvas abaixo e iluminação noturna na serra.",
          dicaPiloto: "Use 2ª marcha nas curvas fechadas e evite frear no ápice. Nunca pare no meio da curva cega para foto; aguarde os recuos.",
          scene360Id: "sc390-curvas"
        },
        {
          id: "rdr-mirante",
          t: 0.72,
          km: 24,
          altitude: 1421,
          nome: "Mirante da Serra do Rio do Rastro",
          categoria: "mirante",
          coords: [-28.3886, -49.5522],
          resumo: "O ponto mais fotografado do mototurismo brasileiro. Vista panorâmica de toda a serpentina da SC-390 até o litoral em dias claros.",
          oQueTem: "Estacionamento amplo para motos, café panorâmico, lojas de artesanato serrano, banheiros e quatis curiosos.",
          dicaPiloto: "Deixe a moto engatada em 1ª marcha no estacionamento inclinado e não alimente os quatis. Excelente ponto para Tour 360°.",
          scene360Id: "sc390-mirante"
        },
        {
          id: "rdr-cafe-bom-jardim",
          t: 0.85,
          km: 28,
          altitude: 1380,
          nome: "Parada Serrano · Café & Costela no Planalto",
          categoria: "parada",
          coords: [-28.3620, -49.5980],
          resumo: "Restaurante e café acolhedor com lareira, estacionamento calçado para grupos de motociclistas e culinária serrana.",
          oQueTem: "Café colonial, entrevero de pinhão, sopa quente no inverno, tomada para intercomunicador e área coberta para capacetes.",
          dicaPiloto: "Ótima parada para aquecer as mãos antes de seguir para Bom Jardim da Serra ou conectar com Urubici.",
          scene360Id: "sc390-canion"
        },
        {
          id: "rdr-canion-ronda",
          t: 0.97,
          km: 35,
          altitude: 1460,
          nome: "Cânion da Ronda & Parque Eólico",
          categoria: "mirante",
          coords: [-28.3385, -49.6245],
          resumo: "Extensão obrigatória no topo do planalto com gigantescas torres eólicas e borda de cânion vertiginosa.",
          oQueTem: "Mirante da borda do cânion, trilha curta acessível de bota de moto e visual 360° dos campos de altitude.",
          dicaPiloto: "Vento lateral pode ser forte perto das torres eólicas. Mantenha os joelhos firmes no tanque.",
          scene360Id: "sc390-canion"
        }
      ]
    },

    {
      id: "corvo-branco",
      codigo: "SC-370",
      nome: "Serra do Corvo Branco",
      trecho: "Grão-Pará ↔ Urubici",
      avaliacao: "4.8 ★ (18.1K)",
      distanciaKm: 28,
      tempoMedio: "1h 05min (com paradas)",
      altitudeMin: 110,
      altitudeMax: 1470,
      curvas: 96,
      dificuldade: "Média-Alta — Rampas curtas muito íngremes e fenda estreita",
      piso: "Asfalto novo na maior parte + trechos de concreto na garganta",
      motosIdeais: ["Big Trail", "Trail", "Naked", "Custom", "Touring"],
      alertaClima: "Verifique se há interdição temporária por obras ou chuva intensa antes de sair. Pista estreita no corte: buzine antes da entrada.",
      corRota: "#10b981",
      tema3D: {
        skyTop: 0x16292d,
        skyBottom: 0x7aa39d,
        fogColor: 0x2e4548,
        fogDensity: 0.0020,
        terrainLow: [0.14, 0.30, 0.22],
        terrainMid: [0.22, 0.32, 0.25],
        terrainHigh: [0.38, 0.36, 0.32],
        rockColor: [0.44, 0.39, 0.33],
        hasCanyonCut: true,
        hasWindTurbines: false
      },
      overviewAnchor: { x: -4, z: 22 },
      path3D: [
        [-68, 1.8, 56],
        [-52, 2.8, 44],
        [-36, 4.8, 34],
        [-22, 7.6, 28],
        [-30, 11.2, 17],
        [-14, 15.0, 14],
        [-20, 19.2, 4],
        [-4, 23.0, 1],
        [4, 26.2, -8],
        [10, 28.4, -18],
        [16, 30.8, -28],
        [28, 29.0, -38],
        [44, 24.5, -46],
        [62, 20.0, -54]
      ],
      gpsPath: [
        [-28.1852, -49.2148],
        [-28.1180, -49.2810],
        [-28.0790, -49.3380],
        [-28.0598, -49.3652],
        [-28.0558, -49.3688],
        [-28.0512, -49.3735],
        [-28.0340, -49.4420],
        [-28.0155, -49.5918]
      ],
      resumo: "Liga Urubici a Grão-Pará atravessando o maior corte em rocha do Brasil: dois paredões verticais de arenito com 90 metros de altura que formam um portal cinematográfico para motociclistas.",
      paradas: [
        {
          id: "cb-grao-para",
          t: 0.04,
          km: 0,
          altitude: 110,
          nome: "Grão-Pará · Posto & Informações da Serra",
          categoria: "apoio",
          coords: [-28.1852, -49.2148],
          resumo: "Ponto inicial no vale do Braço do Norte para abastecer, calibrar pneus e conferir a condição da SC-370.",
          oQueTem: "Posto de combustível, padaria local, água gelada e oficina mecânica no centro da cidade.",
          dicaPiloto: "A subida a partir de Grão-Pará é mais dramática visualmente porque você vê os paredões crescendo à sua frente.",
          scene360Id: "sc370-corte"
        },
        {
          id: "cb-ferradura",
          t: 0.36,
          km: 11,
          altitude: 790,
          nome: "Curva da Ferradura · Subida em Ziguezague",
          categoria: "tecnico",
          coords: [-28.0790, -49.3380],
          resumo: "Sequência de rampas curtas com inclinação que passa de 18%, exigindo controle fino de embreagem e acelerador.",
          oQueTem: "Visão aberta para o vale verdejante de Grão-Pará e paredões de basalto acima.",
          dicaPiloto: "Mantenha distância segura da moto da frente para não precisar parar no meio da rampa íngreme.",
          scene360Id: "sc370-corte"
        },
        {
          id: "cb-corte-rocha",
          t: 0.62,
          km: 17,
          altitude: 1320,
          nome: "Corte da Serra do Corvo Branco (Paredões 90m)",
          categoria: "mirante",
          coords: [-28.0558, -49.3688],
          resumo: "A icônica fenda aberta na rocha arenítica com 90 metros de altura — parada obrigatória para fotos com a moto.",
          oQueTem: "Recuo logo acima do corte, vista interna dos paredões monumentais e acesso ao mirante superior.",
          dicaPiloto: "A pista dentro do corte tem faixa estreita e umidade constante nas paredes. Reduza para 1ª marcha e respeite o sentido alternado.",
          scene360Id: "sc370-corte"
        },
        {
          id: "cb-altos-corvo",
          t: 0.76,
          km: 20,
          altitude: 1470,
          nome: "Altos do Corvo Branco · Mirante da Garganta",
          categoria: "mirante",
          coords: [-28.0512, -49.3735],
          resumo: "Complexo turístico no topo com passarelas panorâmicas, mirante de vidro e vista de 360° da Serra Catarinense.",
          oQueTem: "Estacionamento estruturado, café de montanha, decks panorâmicos, banheiros limpos e lojinha.",
          dicaPiloto: "Excelente parada para descansar os braços depois da subida e combinar o roteiro com o Morro da Igreja em Urubici.",
          scene360Id: "sc370-altos"
        },
        {
          id: "cb-urubici",
          t: 0.96,
          km: 28,
          altitude: 915,
          nome: "Urubici · Rua dos Cafés & Truta Serrana",
          categoria: "parada",
          coords: [-28.0155, -49.5918],
          resumo: "Capital catarinense do turismo de serra, repleta de pousadas bike-friendly, cafés artesanais e restaurantes de truta.",
          oQueTem: "Gastronomia serrana, pousadas com garagem coberta para motos, postos de gasolina e conexão com a SC-390.",
          dicaPiloto: "Perfeito para pernoitar e fazer o circuito completo: Corvo Branco no dia 1 + Serra do Rio do Rastro no dia 2.",
          scene360Id: "sc370-altos"
        }
      ]
    },

    {
      id: "dona-francisca",
      codigo: "SC-418",
      nome: "Serra Dona Francisca",
      trecho: "Joinville (Pirabeiraba) ↔ Campo Alegre",
      avaliacao: "4.7 ★ (5.5K)",
      distanciaKm: 44,
      tempoMedio: "1h 10min (ritmo fluido)",
      altitudeMin: 25,
      altitudeMax: 870,
      curvas: 112,
      dificuldade: "Moderada — Curvas fluidas de média velocidade",
      piso: "Asfalto bem conservado com faixas duplas em trechos de subida",
      motosIdeais: ["Esportiva", "Naked", "Custom", "Big Trail", "Scooter 250+"],
      alertaClima: "Rota muito procurada aos sábados e domingos de manhã. Atenção a caminhões pesados na subida e piso escorregadio em dias de garoa.",
      corRota: "#38bdf8",
      tema3D: {
        skyTop: 0x12263a,
        skyBottom: 0x6ea8c9,
        fogColor: 0x2a4557,
        fogDensity: 0.0018,
        terrainLow: [0.11, 0.34, 0.21],
        terrainMid: [0.15, 0.40, 0.24],
        terrainHigh: [0.24, 0.43, 0.27],
        rockColor: [0.30, 0.35, 0.32],
        hasCanyonCut: false,
        hasWindTurbines: false
      },
      overviewAnchor: { x: 24, z: -38 },
      path3D: [
        [-70, 1.5, 58],
        [-50, 2.6, 46],
        [-32, 4.8, 36],
        [-16, 7.8, 28],
        [-4, 11.4, 18],
        [-14, 14.8, 8],
        [6, 18.0, 2],
        [20, 20.6, -8],
        [10, 22.8, -18],
        [26, 24.4, -28],
        [44, 25.2, -38],
        [64, 25.8, -50]
      ],
      gpsPath: [
        [-26.2085, -48.9020],
        [-26.2020, -48.9650],
        [-26.2045, -49.0215],
        [-26.2072, -49.0518],
        [-26.2040, -49.1150],
        [-26.1955, -49.2650]
      ],
      resumo: "Clássico bate-volta de domingo no Norte de Santa Catarina. Sobe de Joinville ao Planalto Norte cercada por densa Mata Atlântica, com curvas rápidas, mirante panorâmico e cafés coloniais.",
      paradas: [
        {
          id: "df-pirabeiraba",
          t: 0.04,
          km: 0,
          altitude: 25,
          nome: "Pirabeiraba · Ponto de Encontro & Posto",
          categoria: "apoio",
          coords: [-26.2085, -48.9020],
          resumo: "Tradicional ponto de encontro dos motoclubes de Joinville antes da subida da SC-418.",
          oQueTem: "Posto com conveniência ampla, café da manhã cedo, calibragem de pneus e acesso fácil pela BR-101.",
          dicaPiloto: "Aos domingos entre 7h30 e 9h30 o clima é de confraternização motociclista. Ótimo lugar para ajustar o grupo.",
          scene360Id: "sc418-mirante"
        },
        {
          id: "df-curvas-mata",
          t: 0.34,
          km: 14,
          altitude: 420,
          nome: "Trecho das Curvas da Mata Atlântica",
          categoria: "tecnico",
          coords: [-26.2045, -49.0215],
          resumo: "Sequência fluida de curvas de média velocidade abraçadas por árvores nativas e bromélias.",
          oQueTem: "Terceira faixa em pontos estratégicos, asfalto aderente e temperatura caindo rapidamente conforme sobe.",
          dicaPiloto: "Respeite a faixa contínua e cuidado com folhas úmidas nas bordas da pista nos dias após chuva.",
          scene360Id: "sc418-mirante"
        },
        {
          id: "df-mirante",
          t: 0.56,
          km: 22,
          altitude: 740,
          nome: "Mirante da Serra Dona Francisca",
          categoria: "mirante",
          coords: [-26.2072, -49.0518],
          resumo: "Deck panorâmico debruçado sobre o vale de Joinville com vista impressionante das curvas da SC-418 lá embaixo.",
          oQueTem: "Estacionamento amplo para motos, mirante revitalizado, bancos de descanso e quiosques nos fins de semana.",
          dicaPiloto: "Parada clássica para foto em grupo. Em manhãs de inverno, é comum ver um 'mar de nuvens' cobrindo o vale.",
          scene360Id: "sc418-mirante"
        },
        {
          id: "df-cafe-colonial",
          t: 0.76,
          km: 31,
          altitude: 820,
          nome: "Café Colonial & Recanto da Serra",
          categoria: "parada",
          coords: [-26.2040, -49.1150],
          resumo: "Parada gastronômica típica de influência germânica com cucas, strudel de maçã e café passado na hora.",
          oQueTem: "Estacionamento plano, mesinhas ao ar livre, produtos coloniais e ótimo atendimento a motociclistas.",
          dicaPiloto: "Se quiser esticar o passeio, vale entrar na Estrada Bonita no retorno para fotos rurais em baixa velocidade.",
          scene360Id: "sc418-campo-alegre"
        },
        {
          id: "df-campo-alegre",
          t: 0.96,
          km: 44,
          altitude: 870,
          nome: "Campo Alegre · Calçadão & Cascata Paraíso",
          categoria: "mirante",
          coords: [-26.1955, -49.2650],
          resumo: "Cidade serrana charmosa de clima europeu, famosa pelas ovelhas, cascatas e cafés no centro.",
          oQueTem: "Praça central com estacionamento de motos, restaurantes típicos, posto de combustível e acesso à Cascata Paraíso.",
          dicaPiloto: "Excelente destino final para almoço antes de descer a serra com calma à tarde ou seguir rumo a São Bento do Sul.",
          scene360Id: "sc418-campo-alegre"
        }
      ]
    }
  ],

  // Cenas 360° seguindo a arquitetura do Virtual Tour 360 Logic (Geoturismo_Interativo)
  cenas360: {
    "sc390-mirante": {
      id: "sc390-mirante",
      rotaId: "rio-do-rastro",
      titulo: "Mirante da Serra do Rio do Rastro (SC-390)",
      subtitulo: "Altitude 1.421 m · Bom Jardim da Serra / Lauro Müller",
      temaPano: "rio_do_rastro",
      initialYaw: 15,
      initialPitch: -8,
      labels3D: [
        { yaw: 12, pitch: -14, texto: "SC-390 · 284 Curvas", subtexto: "Concreto rígido · 12% rampa" },
        { yaw: -48, pitch: 8, texto: "Escarpa da Serra Geral", subtexto: "Formação Basáltica" },
        { yaw: 74, pitch: -4, texto: "Vale de Lauro Müller", subtexto: "220 m de altitude" }
      ],
      hotspots: [
        {
          id: "hs-rdr-curvas",
          type: "info",
          yaw: 10,
          pitch: -20,
          titulo: "Estratégia nas 284 Curvas",
          subtitulo: "Pilotagem Técnica · SC-390",
          categoria: "Técnica de Moto",
          descricao: "A subida da Serra do Rio do Rastro alterna grampos fechados de 180° com rampas curtas e íngremes em concreto. O olhar deve buscar sempre a saída da curva, usando o freio motor na descida para evitar fadiga dos freios.",
          dica: "Mantenha a moto em 1ª ou 2ª marcha nos grampos mais fechados e evite ultrapassagens em curvas cegas — ônibus turísticos abrem bastante o raio.",
          corDiagrama: "#f59e0b"
        },
        {
          id: "hs-rdr-estacionamento",
          type: "pitstop",
          yaw: -32,
          pitch: -12,
          titulo: "Área de Parada & Café do Mirante",
          subtitulo: "Infraestrutura para Motociclistas",
          categoria: "Parada & Apoio",
          descricao: "O estacionamento principal conta com piso pavimentado, café quente, lojas de souvenirs e banheiros. Nos fins de semana de sol, dezenas de motos de todo o Sul do Brasil se reúnem aqui.",
          dica: "Estacione com a roda dianteira voltada para o lado mais alto da inclinação e engate a 1ª marcha antes de apoiar no pezinho lateral.",
          corDiagrama: "#10b981"
        },
        {
          id: "hs-rdr-go-canion",
          type: "scene",
          yaw: 125,
          pitch: -4,
          targetScene: "sc390-canion",
          titulo: "Seguir para o Cânion da Ronda →",
          subtitulo: "Tour 360° · +11 km no Planalto"
        }
      ]
    },

    "sc390-curvas": {
      id: "sc390-curvas",
      rotaId: "rio-do-rastro",
      titulo: "Serpentina de Concreto · Meio da Serra (SC-390)",
      subtitulo: "Altitude 940 m · Curvas em Grampo",
      temaPano: "rio_do_rastro_curvas",
      initialYaw: -10,
      initialPitch: -6,
      labels3D: [
        { yaw: -12, pitch: -16, texto: "Grampo 180° · 2ª Marcha", subtexto: "Piso de Concreto" },
        { yaw: 42, pitch: 14, texto: "Topo do Mirante (1.421 m)", subtexto: "Faltam 8 km" }
      ],
      hotspots: [
        {
          id: "hs-rdr-guardrail",
          type: "info",
          yaw: -15,
          pitch: -18,
          titulo: "Piso de Concreto & Neblina",
          subtitulo: "Segurança em Serra",
          categoria: "Segurança",
          descricao: "O pavimento de concreto oferece boa tração no seco, mas com neblina densa e garoa pode ficar escorregadio nas junções de placas. Farol baixo e pisca-alerta ligado apenas se parado fora da pista.",
          dica: "Use viseira limpa (ou Pinlock) — a diferença térmica entre Lauro Müller e o topo pode passar de 10 °C em apenas 20 minutos.",
          corDiagrama: "#ef4444"
        },
        {
          id: "hs-rdr-back-mirante",
          type: "scene",
          yaw: 44,
          pitch: 8,
          targetScene: "sc390-mirante",
          titulo: "Subir até o Mirante da Serra →",
          subtitulo: "Tour 360° · 1.421 m"
        }
      ]
    },

    "sc390-canion": {
      id: "sc390-canion",
      rotaId: "rio-do-rastro",
      titulo: "Cânion da Ronda & Parque Eólico",
      subtitulo: "Altitude 1.460 m · Bom Jardim da Serra",
      temaPano: "canion_ronda",
      initialYaw: 20,
      initialPitch: -2,
      labels3D: [
        { yaw: 24, pitch: -10, texto: "Borda do Cânion da Ronda", subtexto: "Paredões verticais" },
        { yaw: -65, pitch: 12, texto: "Parque Eólico", subtexto: "Ventos de Planalto" }
      ],
      hotspots: [
        {
          id: "hs-ronda-info",
          type: "info",
          yaw: 22,
          pitch: -12,
          titulo: "Extensão no Topo do Planalto",
          subtitulo: "Roteiro Integrado SC-390 + Urubici",
          categoria: "Roteiro",
          descricao: "A poucos quilômetros do Mirante principal, o Cânion da Ronda oferece campos abertos de altitude e acesso rápido à rodovia que liga Bom Jardim da Serra a São Joaquim e Urubici (para emendar com o Corvo Branco!).",
          dica: "Abasteça em Bom Jardim da Serra se for continuar até Urubici — são cerca de 65 km de estradas serranas panorâmicas.",
          corDiagrama: "#f59e0b"
        },
        {
          id: "hs-ronda-back",
          type: "scene",
          yaw: -140,
          pitch: -4,
          targetScene: "sc390-mirante",
          titulo: "Voltar ao Mirante da SC-390 ←",
          subtitulo: "Tour 360° · 1.421 m"
        }
      ]
    },

    "sc370-corte": {
      id: "sc370-corte",
      rotaId: "corvo-branco",
      titulo: "Corte da Serra do Corvo Branco (SC-370)",
      subtitulo: "Altitude 1.320 m · Paredões de 90 m de Rocha",
      temaPano: "corvo_branco",
      initialYaw: 0,
      initialPitch: 6,
      labels3D: [
        { yaw: -22, pitch: 22, texto: "Paredão Arenítico · 90 m", subtexto: "Maior corte em rocha do Brasil" },
        { yaw: 22, pitch: 22, texto: "Fenda da SC-370", subtexto: "Passagem em mão única" },
        { yaw: 0, pitch: -18, texto: "Trecho de Concreto", subtexto: "Atenção à umidade" }
      ],
      hotspots: [
        {
          id: "hs-cb-fenda",
          type: "info",
          yaw: 0,
          pitch: 4,
          titulo: "Atravessando os Paredões de 90 Metros",
          subtitulo: "Patrimônio Geológico & Mototurismo",
          categoria: "Ponto Icônico",
          descricao: "Escavada manualmente e com explosivos na década de 1980, a fenda do Corvo Branco divide a montanha ao meio. O eco do escapamento entre as paredes de pedra é uma das experiências mais marcantes de SC.",
          dica: "Antes de entrar no corte, pare no recuo, verifique se não há veículo vindo no sentido oposto e passe em velocidade reduzida.",
          corDiagrama: "#10b981"
        },
        {
          id: "hs-cb-go-altos",
          type: "scene",
          yaw: 175,
          pitch: 4,
          targetScene: "sc370-altos",
          titulo: "Ir para Altos do Corvo Branco →",
          subtitulo: "Tour 360° · Mirante 1.470 m"
        }
      ]
    },

    "sc370-altos": {
      id: "sc370-altos",
      rotaId: "corvo-branco",
      titulo: "Altos do Corvo Branco · Mirante da Garganta",
      subtitulo: "Altitude 1.470 m · Urubici - SC",
      temaPano: "corvo_branco_altos",
      initialYaw: -25,
      initialPitch: -6,
      labels3D: [
        { yaw: -28, pitch: -14, texto: "Vale de Grão-Pará", subtexto: "Desnível de 1.300 m" },
        { yaw: 65, pitch: 4, texto: "Rumo a Urubici", subtexto: "Café, Pousadas e Postos" }
      ],
      hotspots: [
        {
          id: "hs-cb-estrutura",
          type: "pitstop",
          yaw: -15,
          pitch: -12,
          titulo: "Parada Altos do Corvo Branco",
          subtitulo: "Mirante, Café & Descanso",
          categoria: "Parada & Café",
          descricao: "Ponto perfeito para estacionar a moto com segurança, tomar um café serrano quente e caminhar pelos decks panorâmicos debruçados sobre a garganta da serra.",
          dica: "Combine este passeio com a Cascata Véu de Noiva e o Morro da Igreja em Urubici (requer agendamento gratuito no ICMBio para o Morro da Igreja).",
          corDiagrama: "#10b981"
        },
        {
          id: "hs-cb-back-corte",
          type: "scene",
          yaw: -155,
          pitch: -6,
          targetScene: "sc370-corte",
          titulo: "Descer ao Corte de 90 m ←",
          subtitulo: "Tour 360° · SC-370"
        }
      ]
    },

    "sc418-mirante": {
      id: "sc418-mirante",
      rotaId: "dona-francisca",
      titulo: "Mirante da Serra Dona Francisca (SC-418)",
      subtitulo: "Altitude 740 m · Joinville / Campo Alegre",
      temaPano: "dona_francisca",
      initialYaw: 10,
      initialPitch: -8,
      labels3D: [
        { yaw: 8, pitch: -16, texto: "Curvas da SC-418", subtexto: "Asfalto fluido na Mata Atlântica" },
        { yaw: -52, pitch: -4, texto: "Planície de Joinville", subtexto: "Baía da Babitonga ao fundo" }
      ],
      hotspots: [
        {
          id: "hs-df-mirante",
          type: "pitstop",
          yaw: 12,
          pitch: -14,
          titulo: "Ponto de Encontro dos Motociclistas do Norte",
          subtitulo: "Mirante SC-418 · 740 m",
          categoria: "Mirante & Encontro",
          descricao: "Famoso pela facilidade de acesso saindo de Joinville ou Curitiba, o Mirante da Serra Dona Francisca oferece ampla visão das curvas em meio à Mata Atlântica preservada.",
          dica: "Vá cedo no domingo para pegar o mirante com luz dourada e depois siga mais 9 km até os cafés coloniais no topo da serra.",
          corDiagrama: "#38bdf8"
        },
        {
          id: "hs-df-go-campo",
          type: "scene",
          yaw: 145,
          pitch: 2,
          targetScene: "sc418-campo-alegre",
          titulo: "Seguir para Campo Alegre →",
          subtitulo: "Tour 360° · Planalto Norte"
        }
      ]
    },

    "sc418-campo-alegre": {
      id: "sc418-campo-alegre",
      rotaId: "dona-francisca",
      titulo: "Campo Alegre · Planalto Norte Serrano",
      subtitulo: "Altitude 870 m · Destino Gastronômico",
      temaPano: "campo_alegre",
      initialYaw: 0,
      initialPitch: -2,
      labels3D: [
        { yaw: -15, pitch: -8, texto: "Campos de Altitude", subtexto: "Clima serrano o ano todo" },
        { yaw: 45, pitch: -6, texto: "Rota dos Cafés Coloniais", subtexto: "Parada oficial de domingo" }
      ],
      hotspots: [
        {
          id: "hs-df-almoço",
          type: "pitstop",
          yaw: 35,
          pitch: -10,
          titulo: "Almoço, Café Colonial & Abastecimento",
          subtitulo: "Centro de Campo Alegre",
          categoria: "Parada & Gastronomia",
          descricao: "Ideal para fechar o bate-volta com tranquilidade: restaurantes com comida caseira e ovelha no rolete, cafés coloniais e postos de combustível no caminho de volta.",
          dica: "Na volta para Joinville, experimente desviar pela Estrada Bonita em Pirabeiraba para um trecho cênico plano e tranquilo.",
          corDiagrama: "#38bdf8"
        },
        {
          id: "hs-df-back-mirante",
          type: "scene",
          yaw: -150,
          pitch: -4,
          targetScene: "sc418-mirante",
          titulo: "Voltar ao Mirante da SC-418 ←",
          subtitulo: "Tour 360° · 740 m"
        }
      ]
    }
  }
};
