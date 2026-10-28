# Página inicial, Studio e blog — validação

Implementação de 28/10/2026 no checkout existente, sem alterar dependências ou lockfiles.

## Alterações

- Página inicial centrada no Studio, com cinco painéis expansíveis por mouse, teclado e toque. Oferta única da Biblioteca por R$ 47,90, acesso vitalício, milhares de artes, categorias, datas sazonais e atualizações; WhatsApp para conhecer antes. Composições ilustrativas da vitrine identificadas como ilustrações.
- Verniz cerâmico separado da estampa, reflexos no branco, controles de reflexão/exposição conectados ao material e softboxes atualizadas pelos controles de iluminação.
- Arrasto manual de peças e grupos, um desfazer por gesto, cancelamento e restauração da câmera. Gizmos de edição excluídos da captura.
- Arquivo original de arte preservado, encaixe por proporção/transparência, sugestões tonais reversíveis, DPI efetivo e metadados de impressão. A resolução da saída continua dependendo do formato escolhido, da fonte e do dispositivo.
- Guia acessível com ações reais e controles por teclado, valores editáveis e reset.
- Quinze artigos inéditos de sublimação, preservando os dezesseis anteriores: 31 no blog. Busca, sumário, relacionados, FAQs, canonicals, BlogPosting, breadcrumbs e sitemap.
- Pesquisa de cinco projetos e suas licenças em [github-studio-references.md](github-studio-references.md). Nenhuma nova biblioteca ou demonstração externa incorporada.

## Verificações concluídas

Os comandos abaixo passaram, somando 48 testes:

```sh
node tests/art-quality.mjs                     # 7
node tests/mockup-movement.mjs                 # 8
node tests/blog-content.mjs                    # 3
node tests/pdf-and-spreadsheet.mjs             # 3
node docs/mockup-studio/regressions.mjs         # 27
```

ESLint passou com cinco avisos anteriores no componente legado `home.tsx`.

A compilação de produção dos componentes reais passou em um harness separado do checkout, com Next/Webpack e verificação TypeScript. Esse harness não substitui o build integrado da aplicação.

Verificações no Chromium: página inicial em 1440 e 390 pixels, imagens, ausência de overflow, painéis por hover/foco/toque; guia e controles isolados sem WebGL; renderer real em modo de quadros sob demanda com arrasto no corpo, desfazer, Escape, movimento de grupo e restauração da câmera. O modo sob demanda permitiu executar os mesmos shaders e geometrias com o renderizador de software disponível. Uma captura real da caneca branca mostrou o verniz; a captura posterior com arte excedeu o tempo do SwiftShader e não foi aprovada como comparação visual completa.

O teste de cancelamento por troca de ferramenta durante arrasto do gizmo ficou inconclusivo no navegador: o ponto calculado não iniciou o arrasto nativo. A correção usa o mesmo cancelamento completo dos demais caminhos e passou pela compilação e análise estática.

Os testes do blog usam as funções reais de rota e uma configuração SEO controlada, sem acesso ao banco.

## Limitações pendentes do ambiente

A política de rede em execução ainda não inclui `binaries.prisma.sh`, `fonts.googleapis.com` e `fonts.gstatic.com`, embora os domínios tenham sido salvos no rascunho do ambiente. Isso impede gerar o Prisma e concluir o build integrado e os testes de autenticação. TLS e verificações de checksum permanecem ativados.

O TypeScript do repositório apresenta os mesmos dois erros associados ao cliente Prisma ainda não gerado, em `src/app/api/admin/codes/route.ts` e `src/app/api/admin/visits/route.ts`; nenhum erro novo das alterações foi observado. Após aplicar a política, gerar o cliente e executar `npm run build`, repetir a verificação de tipos e `tests/studio-access.mjs` com o PostgreSQL local isolado.
