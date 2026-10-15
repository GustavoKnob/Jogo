# Showreel “I MAKE THINGS MOVE.” — Decisões

**Entrega:** `showreel_claude_reels.mp4`: 1080×1920 (9:16), 60 fps, 900 frames, 15,000 s, H.264 High (yuv420p, BT.709) + AAC‑LC 48 kHz estéreo a 256 kb/s, −14,1 LUFS integrado, `+faststart`.
**Fonte:** `src/` (`synth.py` = trilha, `render.js` = imagem, `build.sh` = pipeline completo).
**Ferramentas:** só código. Python/numpy/scipy para o áudio, Node + Skia (`@napi-rs/canvas`) para a imagem e ffmpeg para encode/mux. Nenhum modelo de geração de imagem, vídeo ou áudio e nenhum sample: todo som nasce de osciladores e ruído.

## Ideia central
É um showreel que *demonstra* em vez de *listar*. Cada compasso da música é uma habilidade de motion design, e a própria cena é a prova dela:

| Compasso | Tempo | Cena | O que mostra |
|---|---|---|---|
| 1 | 0,00–1,88 s | **HOOK**: “I MAKE / THINGS / MOVE.” | 3 cortes em 1,4 s, uma palavra e uma cor por batida, slam com shockwave; “MOVE.” literalmente dança e depois explode |
| 2 | 1,88–3,75 s | **SHAPE** | morph círculo→quadrado→triângulo→estrela, um por batida, com overshoot, ecos e órbitas |
| 3 | 3,75–5,63 s | **TYPE** | “fonte variável” falsa: 9 pesos da Inter Display em onda letra a letra, linhas que levam empurrões no beat |
| 4 | 5,63–7,50 s | **RHYTHM** | visualizador com o espectro *real* da trilha (FFT por frame) e letras pulando em semicolcheias |
| 5 | 7,50–9,38 s | **DEPTH** | 420 partículas 3D (projeção em perspectiva) virando esfera→cubo→toro→hélice; texto com extrusão girando |
| 6 | 9,38–11,25 s | **TRANSITIONS** | CUT / WIPE / MASK / SLICE: cada palavra entra com a transição que nomeia |
| 7 | 11,25–13,13 s | **TIMING** | bola com squash & stretch, onion skin e um *graph editor* com a curva, os keyframes e o playhead |
| 8 | 13,13–15,00 s | **CLAUDE / MOTION DESIGNER / 100% CODE** | assinatura, build com anéis acelerando e íris vermelha que fecha a tela |

## Decisões principais
- **128 BPM, porque 8 compassos de 4/4 dão exatamente 15,000 s.** Toda a coreografia é calculada a partir de `BEAT = 60/128`, por isso o sincronismo vem da própria construção, sem ajuste manual. O erro máximo de um evento em relação ao frame é de 1/8 de frame (2 ms).
- **Loop:** o último compasso é um *build* (caixa em rolo, riser, vácuo de ~60 ms) que “resolve” no drop do frame 0. Na imagem, a íris vermelha fecha a tela por completo nos últimos ~5 frames, e o frame 0 é esse mesmo vermelho com “I MAKE” batendo. A repetição soa e parece o drop da música, não um recomeço. No áudio, renderizo **dois ciclos** da música e uso o segundo: as caudas de reverb/delay do fim do loop já estão no começo, e a costura não tem clique.
- **Hook:** o frame 0 já tem texto gigante legível (funciona como thumbnail) e muda de cor/palavra a cada 0,47 s. O primeiro frame tem shockwave, detritos, RGB split e tremor de câmera.
- **Sem som também funciona:** cada cena tem uma palavra enorme que a nomeia. O HUD mostra um metrônomo de 4 quadrados que acende no beat, e o pulso de zoom no kick está na imagem. O ritmo fica visível mesmo no mudo.
- **Áreas seguras** (topo 250 px, base 400 px, direita 120 px): todo texto e todo elemento-chave ficam no retângulo x 100–960 / y 250–1520, e o centro óptico da composição é (530, 885), não o centro da tela. O que vaza é só fundo ou decoração em movimento (shockwave, detritos, anéis). As linhas de “TYPE” passam por uma janela recortada dentro da área segura, com fade nas bordas.
- **Legibilidade no celular:** palavras-título em Inter Display Black com 150–260 px de altura de maiúscula e 5 cores chapadas de alto contraste (tinta, papel, vermelho, azul elétrico, lima), sem gradientes sutis nem traços finos. O HUD mono (34 px) é secundário, e o vídeo não depende dele.
- **Motion blur de verdade:** cada frame é a média de **8 subframes** num obturador de 180°. Os subframes nunca atravessam um corte de batida, então os cortes secos continuam secos.
- **Sound design amarrado à imagem:** stabs de supersaw em cada palavra do hook, “ping” afinado em cada morph, zap nos morphs 3D, swish em cada transição, “boing” em cada quique da bola, whoosh antes de cada troca de cena, sub‑boom + crash no drop. Progressão Am–F–C–G, baixo rolando em semicolcheias com sidechain do kick, arpejo com delay ping‑pong 3/16 e reverb por convolução com IR sintética.
- **Mix para Reels:** −14 LUFS (alvo de normalização do Instagram), limiter com lookahead e pico abaixo de −1 dBFS.

## O que descartei
- **Renderizar no Chromium/Playwright (canvas do navegador):** funcionaria, mas transferir 900×8 frames por screenshot seria lento. O Skia nativo no Node escreve RGBA cru direto no ffmpeg.
- **PIL puro:** não tem antialiasing de formas, e a borda ficaria serrilhada nos morphs.
- **Linhas de “TYPE” sangrando a tela toda:** era mais bonito, mas o texto passava sob os ícones da direita. Troquei por uma janela recortada na área segura.
- **BPM 120/140:** 15 s não fecha em compassos inteiros, e o loop ficaria torto.
- **Grão de filme e vinheta:** gastam bitrate e viram “lama” na recompressão do Instagram.
- **Barra de progresso no HUD:** daria um salto visível na volta do loop. Ficou só o metrônomo e o timecode.
- **Barras do visualizador animadas por fórmula:** troquei pelo espectro real da trilha, para o sincronismo ser verdadeiro.

## Iterações
1. **Trilha v1:** espectrograma e forma de onda revelaram que o build final estava *mais baixo* que o resto, então não “puxava” o drop. Subi o riser (+7 dB), a caixa em rolo em crescendo e o reverse swell.
2. **Render v0:** crash nativo do Skia (`unwrap on None`). Instrumentei todos os métodos do contexto e achei `arc(NaN)`: era um `reduce` sobre `Array(4)` usando o valor em vez do índice. Corrigido, e o raio do polígono ganhou proteção contra `Infinity`.
3. **Folha de contato v1 com guias de área segura:** frame 0 poluído (shockwave e detritos em cima do texto), HUD colidindo com a 1ª linha de TYPE e com o título TIMING, flash do DEPTH virando um véu cinza, cortes duros nas bordas da janela de TYPE. Corrigi tudo: anel começa fora da palavra, linhas menores, layout do TIMING descido, flash curto, fade de 150 px.
4. **Vídeo v1:** com 5 subframes, o shockwave mostrava “degraus” no blur, e o RGB split do frame 0 sujava a thumbnail. Passei para 8 subframes e reduzi o split só no frame 0.
5. **Vídeo v2 (final):** conferi a costura do loop (frames 894→899→0: vermelho chapado → vermelho + “I MAKE”), os specs no ffprobe e a loudness no ebur128.

`contato_v1.png` (1ª versão) e `contato_final.png` mostram 1 frame a cada 25.

## Tempo total
Das 13h24 às ~13h50 (UTC): **cerca de 26 minutos** do zero ao MP4 final, incluindo ~10 min de render (2 renders completos de 2,5–3 min cada, em 4 processos paralelos) e a escrita deste documento.

## Como reproduzir
```bash
cd showreel/src && npm install && pip install numpy scipy
NODE_PATH=$PWD/node_modules ./build.sh /tmp/reel ../showreel_claude_reels.mp4
```
