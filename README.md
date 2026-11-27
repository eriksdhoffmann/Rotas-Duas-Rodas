# Rotas Duas Rodas — Santa Catarina 3D & Tour Virtual 360°

Aplicação web portátil (HTML5 + CSS3 + Three.js + WebGL 360°) voltada ao **mototurismo em Santa Catarina**, integrando a arquitetura do **Virtual Tour 360 Logic** (`Geoturismo_Interativo`) a um mapa 3D com motocicleta animada e chat copiloto interativo.

- Link - https://eriksdhoffmann.github.io/Rotas-Duas-Rodas/
  
## Rotas Incluídas

1. **Serra do Rio do Rastro (SC-390)** — Lauro Müller ↔ Bom Jardim da Serra (35 km · 284 curvas · até 1.460 m)
2. **Serra do Corvo Branco (SC-370)** — Grão-Pará ↔ Urubici (28 km · paredões de 90 m · até 1.470 m)
3. **Serra Dona Francisca (SC-418)** — Joinville (Pirabeiraba) ↔ Campo Alegre (44 km · 112 curvas · até 870 m)

## Funcionalidades

- **Motocicleta em 3D nas Serras**: Motinha 3D com piloto, rodas girando, farol e inclinação dinâmica (*lean angle*) percorrendo o relevo 3D esculpido de cada serra (incluindo os paredões de 90 m no Corvo Branco e o Parque Eólico na Serra do Rio do Rastro).
- **3 Modos de Câmera**: Perseguição (`Moto`), Primeira Pessoa (`Piloto`) e Inspeção Livre (`Livre` com `OrbitControls`), além do **Mapa Geral de SC** conectando as 3 rotas.
- **Onde Parar (Pontos de Parada)**: Filtro por Mirantes, Café & Parada, Posto & Apoio e Trechos Técnicos, com perfil altimétrico SVG, dicas de pilotagem e telemetria em tempo real.
- **Tour Virtual 360° Integrado (Virtual Tour 360 Logic)**:
  - Fragment Shader WebGL equiretangular `2:1` com arrasto suave e zoom de FOV (`38°–115°`).
  - Projeção `sphericalToScreen(pitch, yaw)` para hotspots clicáveis e rótulos 3D flutuantes (`Aa`).
  - Modal Split-View editorial com *"Dica do Piloto"*.
  - **Estúdio Criador 360°** (`screenToSpherical`) para subir suas próprias fotos 360° de drone/Insta360, clicar para marcar pontos de parada e exportar em JSON.
- **Chat Copiloto Duas Rodas**: Assistente interativo que responde sobre paradas, estilos de moto, segurança e roteiros de 2 dias, com botões de ação direta que controlam a moto 3D e abrem o Tour 360°.
- **Mapa Satélite 2D (Leaflet)**: Traçados GPS reais das rodovias SC-390, SC-370 e SC-418.

## Como Executar

Basta abrir `index.html` diretamente no navegador ou servir localmente:

```bash
python3 -m http.server 8080
```
