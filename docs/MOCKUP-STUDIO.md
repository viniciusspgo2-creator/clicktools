# Mockup Studio 3D — Guia completo

Estúdio de mockups de canecas para sublimação, 100% no navegador (nada é enviado
para servidores). Ferramenta **PREMIUM** do Click & Gruda Tools — acesso
exclusivo para assinantes da Biblioteca de Artes mediante código de acesso.

## Como acessar

1. Na home, seção **MOCKUP 3D STUDIO** (badge PREMIUM) → botão **Abrir Studio**.
2. Insira o código de acesso recebido ao assinar a Biblioteca de Artes.
3. O administrador gera e gerencia códigos no painel `/admin`
   (ver `docs/ADMIN.md`).

## Recursos

### Cena e realismo
- Caneca de porcelana 11 oz modelada proceduralmente (LatheGeometry com perfil
  real: borda arredondada, parede cônica, interior, fundo rebaixado) e alça em C
  com seção elíptica varrida em Catmull-Rom.
- Arte mapeada por projeção cilíndrica exata (área de impressão de ~21 × 8,7 cm,
  com gap da alça de 4,6 cm).
- Materiais PBR com verniz (clearcoat), micro-ruído no esmalte, sombras suaves e
  6 presets de iluminação com temperatura Kelvin.
- Fundos: estúdio branco, escuro premium, gradiente, cor sólida e transparente
  (alfa verdadeiro com sombra).
- Câmera com lente 24–100 mm, 12 presets com transição animada, turntable,
  foco por duplo clique/tecla F.

### Arte
- Upload por clique, arrastar-e-soltar ou **Ctrl+V**.
- Ajustes: preencher/conter/esticar, escala, posição com wrap 360°, rotação,
  espelhar e repetir até 4× na volta.
- Medidor de **DPI efetivo** com alertas (≥300 excelente, ≥150 boa, <150 arriscada).
- Arte de exemplo procedural para testes.

### Canecas
- **Branca**, **colorida** (alça e interior personalizáveis) e **mágica** com
  revelação térmica configurável (calor, direção e dissolução da borda).
- **Multicaneca**: cenas com até 4 canecas — arranjos Duo, Trio, Quarteto e
  Vitrine, mais controles individuais por caneca acompanhante (variante, cor,
  posição, rotação, tamanho, mostrar arte, calor).

### Pós-processamento
- LUTs prontas: **Nenhum, Vivo, Quente, Frio, Cinema, P&B**.
- Controles finos: exposição, contraste, saturação, temperatura, bloom (HDR),
  vinheta e granulado.
- Vale para o preview, imagens, vídeos, GIFs e lote.

### Exportação (5 modos)
| Modo | O que faz |
|------|-----------|
| **Imagem** | PNG/JPG/WebP até 8K, 6 proporções + custom, fundo alfa verdadeiro |
| **Vídeo** | MP4 H.264 (WebCodecs) em Giro 360°, Órbita, Zoom e Revelação; 720p–1080p; fallback MediaRecorder em navegadores antigos |
| **GIF** | Loop infinito com paleta adaptativa, 360/480/640 px, 10–20 fps |
| **Lote** | Vários ângulos × variantes (mágica fria/quente) num único ZIP |
| **Folha** | Arte planificada para sublimação: 20,7 × 8,7 cm em 300/600 DPI, guias de corte e margem de segurança opcionais, opção volta completa |

- **Marca d'água** opcional em todos os modos (texto, posição, tamanho, opacidade).

### Projetos
- Salvar/abrir/renomear/duplicar/excluir projetos com miniatura renderizada —
  tudo em IndexedDB no dispositivo (inclui a arte original).
- **Autosave** da sessão a cada 25 s e ao sair da página; a última sessão é
  restaurada automaticamente.

### Atalhos
| Tecla | Ação |
|-------|------|
| Ctrl+Z / Ctrl+Shift+Z | Desfazer / Refazer |
| R | Gira a caneca +45° |
| F / duplo clique | Focar |
| Espaço | Turntable |
| Ctrl+V | Colar arte |

## Arquitetura técnica

```
src/components/tools/mockup/
├── mockup-studio.tsx        # shell (topbar, painéis, mobile, autosave, gate)
├── state/store.ts           # Zustand + undo/redo (art, mug, light, bg, camera,
│                            #   companions, fx, watermark, video, gif)
├── lib/
│   ├── config.ts            # dimensões da caneca, presets de luz/câmera, LUTs… 
│   ├── art-canvas.ts        # motor de arte em canvas + revelação térmica
│   ├── art-registry.ts      # registro de imagens + blob round-trip
│   └── projects-db.ts       # IndexedDB (projetos)
├── scene/
│   ├── mug-geometry.ts      # geometria procedural (corpo + alça)
│   ├── mug.tsx              # caneca hero + acompanhantes (geometria/texturas compartilhadas)
│   ├── studio.tsx           # luzes (Lightformers + RectArea), fundos, sombras
│   ├── camera-rig.tsx       # OrbitControls, presets, foco
│   ├── postfx.tsx           # EffectComposer: RenderPass → Bloom → Grade → Output
│   ├── studio-scene.tsx     # Canvas + contextlost + exposição
│   └── studio-refs.ts       # refs para os exportadores
├── exporters/
│   ├── frame-capture.ts     # motor offscreen compartilhado (estado, ss, FX, alfa,
│   │                        #   marca d'água, restauração)
│   ├── image-exporter.ts    # imagem estática + canvas p/ miniatura
│   ├── video-exporter.ts    # MP4 (mp4-muxer/WebCodecs; MediaRecorder fallback) + GIF (gifenc)
│   ├── batch-exporter.ts    # lote ZIP (fflate)
│   └── template-exporter.ts # folha planificada com guias
└── ui/
    ├── panels.tsx           # Arte/Caneca/Cena/Luz/Câmera + ExportDialog (5 abas)
    ├── panels-extra.tsx     # Multicaneca + Pós-processamento
    ├── projects-dialog.tsx  # projetos + autosave/restore
    └── controls.tsx         # sliders, cores, segmentados, toggles
```

### Decisões importantes
- **Enquadramento inteligente**: todos os exports usam a bounding sphere de
  todas as canecas (hero + acompanhantes) para nunca cortar a cena.
- **Supersampling 2×** nas exportações de imagem (desativado quando o
  pós-processamento está ativo para poupar memória do composer).
- **Marca d'água** é desenhada no canvas 2D após a captura (não afeta a cena).
- **Loop de vídeo**: giro 360° fecha exatamente em 360°; GIF usa `t = i/total`
  para loop perfeito; MP4 inclui o frame final (frente → frente).
- **Caneca mágica no lote**: `setMugOverride` re-renderiza a folha 4096 px com
  calor 0/1 sem tocar no estado do usuário.
- Todos os recursos GPU/geometria são descartados (`dispose`) no unmount.

## Limitações conhecidas
- Vídeo não suporta fundo transparente (codecs H.264 não têm alfa) — com o fundo
  "Alfa" o vídeo sai preto; o aviso aparece no diálogo.
- GIF sempre com fundo renderizado (sem alfa).
- Exportações 8K exigem navegadores 64-bit e memória disponível.
