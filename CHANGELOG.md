# CHANGELOG — Click&Gruda Mockup Studio

## 25/10/2026 — Vídeo com canal alfa

- Opção **ALFA — fundo transparente** em Exportar → Vídeo, com saída WebM VP9.
- Cor e máscara de transparência codificadas separadamente e combinadas no WebM, incluindo transparência parcial das bordas e sombras.
- Resoluções e movimentos existentes disponíveis; Revelação continua exigindo caneca mágica.
- Marca d'água aplicada no vídeo ALFA; restauração da cena em sucesso ou falha.
- Pós-processamento de tela inteira ignorado em exportações transparentes para preservar o alfa; o loop de pós-processamento não interfere no render de exportação.
- Mensagem de incompatibilidade sem fallback opaco; informação do formato real no aviso de conclusão.
- Teste de regressão com navegador e FFmpeg em `docs/mockup-studio/alpha-video-regressions.mjs`.

## 23/10/2026 — Editor e renderização

### Experiência de edição
- Nova identidade Click&Gruda em laranja e carvão, temas claro/escuro, bibliotecas à esquerda, propriedades da seleção à direita e canvas central.
- Barra superior com nome do projeto, histórico, zoom, salvar e exportar; painéis recolhíveis e gavetas móveis.
- Até oito objetos independentes, com arte por peça, seleção múltipla, posição e rotação XYZ, escala, trava, visibilidade, exclusão e duplicação com separação inicial.
- Gizmos de transformação, snap, alinhamento/distribuição, painel de camadas, sete composições e atalhos descritos no guia.
- Entrada animada própria de 1,25 segundo, respeitando movimento reduzido; enquadramento adaptado ao redimensionar o canvas.

### Produto, arte e luz
- Nove formas procedurais: clássica, quadrada, cônica, chopp, latte, chá, long drink, térmica e squeeze. Variantes branca, colorida e mágica preservadas.
- Borda espessa arredondada e interior aberto; alça com geometria própria; suporte calculado para rotações livres.
- Cerâmica física com clearcoat, rugosidade, reflexo, microtextura e oclusão. Corpo, base, interior e alça com cores separadas.
- Saída sRGB e tone mapping neutro; modo de cor preservada separa a contribuição difusa dos reflexos. A iluminação ainda altera a aparência física da superfície.
- Impressão completa passa a ser padrão. Modos e medidas de prensa existentes permanecem disponíveis; área personalizada e sangria adicionadas.
- Brilho, contraste, saturação, vibração, temperatura, nitidez, opacidade, comparação e reset por arte.
- Decalque adicional, imagem inferior e máscara metálica opcionais.
- Upload Radiance HDRI com carregamento sob demanda e ambiente procedural de fallback. Intensidade individual de luz principal, preenchimento, recorte e ambiente.

### Fundos e saída
- 30 fotografias originais geradas individualmente, integradas por categoria; oito fundos procedurais anteriores preservados.
- Correções de enquadramento, orientação e gerenciamento de cor do fundo; novos contraste e vinheta, além de controles anteriores.
- Lote da mesma composição em fundos escolhidos, em ZIP PNG 1080×1080.
- PNG, JPG e WebP preservados, preset 4K, transparência PNG/WebP; exportação de todas as peças com textura de maior resolução.
- MP4, GIF, lote por ângulo/variante e folha 300/600 DPI mantidos.
- Arquivo portátil `.cgstudio`, imagens de todas as peças, decalques, base, fundo e HDRI incorporados; ordem de camadas persistida. Projetos antigos continuam aceitos.
- Compartilhamento de arquivo pelo sistema quando disponível; download com orientação para anexar ao WhatsApp como alternativa.
- Política de marca d’água Free/Pro/Premium no cliente, recebendo plano do host. Autenticação e cobrança existentes preservadas.

### Entrega e limites
- Inventário original e comparação: `DIAGNOSTICO_MOCKUP_STUDIO.md`.
- Análise do vídeo: `docs/mockup-studio/ESPECIFICACAO_FUNCIONAL_RAPIDMOCKUP.md`.
- Prompts: `FUNDOS_PROMPTS.md`; resultados e comandos: `VALIDACAO_MOCKUP_STUDIO.md`.
- Limites e evolução: `PROXIMA_VERSAO.md`. Não se declara equivalência integral aos concorrentes.
- Nenhum deploy, migração, alteração de ambiente, dependências, lockfile, configuração de build ou API administrativa/banco.
