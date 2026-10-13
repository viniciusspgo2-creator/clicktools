# Deploy na Vercel + Neon PostgreSQL

## 1. Criar o banco (uma vez)

1. Crie um projeto em [neon.tech](https://neon.tech) (plano free serve).
2. Copie a **Connection string** (formato `postgresql://usuario:senha@ep-xxx.neon.tech/neondb?sslmode=require`).

## 2. Variáveis de ambiente na Vercel

Project → Settings → Environment Variables (marque Production, Preview e Development):

| Nome | Valor | Exemplo / formato |
|------|-------|-------------------|
| `DATABASE_URL` | String de conexão do Neon | `postgresql://usuario:senha@host/banco?sslmode=require` |
| `ADMIN_PASSWORD` | Senha do painel `/admin` | use uma senha forte (não use a de desenvolvimento) |
| `ADMIN_SECRET` | Segredo de assinatura do cookie admin | string aleatória longa (32+ caracteres) |

> Opcional: o GA4 (Google Analytics) pode ser configurado depois dentro do próprio painel `/admin` → aba **SEO & Config** (campo de ID do Google Analytics), sem redeploy.

## 3. Deploy

O script `build` do projeto já faz tudo sozinho em cada deploy:

```
prisma generate && prisma db push --skip-generate && next build
```

Ou seja: gera o client Prisma (compatível com o runtime da Vercel — `rhel-openssl-3.0.x`), **cria/sincroniza as tabelas no Neon automaticamente** e roda o build do Next. Nenhum comando manual de banco é necessário.

Basta conectar o repositório na Vercel e fazer o deploy.

> **Importante (Neon):** o `prisma db push` roda durante o build, então `DATABASE_URL` precisa estar definida **também no ambiente de Build** (marcar Production e Preview). Se o build falhar com erro de conexão/timeout, use no `DATABASE_URL` a string **direta** do Neon (host *sem* `-pooler`).
>
> O `db push` **não** usa mais `--accept-data-loss`: se uma mudança futura no schema for destrutiva (apagar coluna/tabela com dados), o build para com aviso em vez de apagar dados em produção silenciosamente.

> **Segurança:** em produção `ADMIN_PASSWORD` e `ADMIN_SECRET` são **obrigatórias**. Sem elas o login do `/admin` fica bloqueado (não existe mais senha/segredo padrão em produção).

## 4. Passos manuais após o primeiro deploy

Nenhum obrigatório. O banco nasce vazio e o site funciona 100% (o blog é conteúdo estático; SEO usa valores padrão). Opcionalmente, na primeira vez:

1. Acesse `https://SEU-DOMINIO/admin`, faça login com `ADMIN_PASSWORD`.
2. Gere os primeiros códigos de acesso para assinantes da Biblioteca de Artes (aba **Códigos**).
3. Ajuste título, descrição e palavras-chave do site (aba **SEO & Config**) — aplica em tempo real, sem redeploy.

## 5. Painel Admin

- URL: `/admin`
- Login: valor de `ADMIN_PASSWORD` definido na Vercel
- Funcões: gerenciar códigos premium (limite de ativações, validade, revogação), contador de visitas (gráfico de 30 dias + páginas mais visitadas), configuração de SEO em tempo real e troca de senha.

## 6. SEO / GEO incluído

- Canonical absoluto + metadataBase em todas as páginas
- Open Graph + Twitter Card com imagem 1200×630 (`/og/og-default.png`)
- JSON-LD: WebSite + Organization (com `sameAs`), Article (+Breadcrumb+FAQ) nos 16 artigos
- `sitemap.xml` dinâmico (18 URLs) e `robots.txt` liberando crawlers de IA (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot…)
- `/llms.txt` (visão geral da marca/ferramentas) e `/llms-full.txt` (conteúdo integral do blog para LLMs/RAG)
- Headers de segurança (nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy)

## 7. Verificações pós-deploy

- `https://SEU-DOMINIO/sitemap.xml` → lista as 18 URLs com o domínio correto
- `https://SEU-DOMINIO/robots.txt` → bots de IA listados
- `/admin` → login, gerar código, abrir `/?tool=mockup` e liberar o Studio
- [Google Search Console](https://search.google.com/search-console) → enviar `https://SEU-DOMINIO/sitemap.xml`
