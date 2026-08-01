# Painel administrativo AgroVisão

Área administrativa protegida para gerenciar os produtos da página de vendas.

- `/admin` — tela de login (recuperação e redefinição de senha incluídas).
- `/admin/change-password` — troca da senha inicial (obrigatória no primeiro login).
- `/admin/dashboard` — CRUD de produtos (exige sessão válida).

As páginas públicas (`/`, `/sobre`, `/servicos`, `/projetos`, `/vendas`, `/contato`)
permanecem acessíveis sem autenticação. A API pública (`GET /api/products` e
`GET /api/products/:slug`) é somente leitura.

## Segurança

- Senhas: somente hash **PBKDF2-SHA256** (100.000 iterações, salt aleatório) no D1.
- Sessões: token aleatório de 256 bits; no banco fica apenas o hash SHA-256 do token.
  Cookie `HttpOnly`, `SameSite=Strict`, `Secure` em produção, expiração de 12h,
  invalidado no logout e no reset/change de senha.
- Recuperação de senha: token temporário (1h, uso único) armazenado como hash;
  o link é enviado por e-mail (Resend) e o token **nunca** é retornado na resposta
  HTTP de produção. O endpoint responde sempre com mensagem genérica (não revela
  se o e-mail existe).
- Troca obrigatória da senha inicial: o usuário criado no bootstrap tem
  `must_change_password = 1`; enquanto não trocar a senha, as rotas de produtos
  respondem `403`.

## Tabelas

`admin_users`, `admin_sessions` e `password_reset_tokens` — ver
`migrations/0003_admin.sql` e `migrations/0004_must_change_password.sql`.

Em `products`, a imagem é apenas uma **referência** do Backblaze B2:
`b2_file_key`, `b2_file_id`, `mime_type`, `width` e `height`
(`migrations/0006_b2_and_categories.sql`). O binário nunca fica no D1, e o
bucket B2 permanece **privado** — nenhuma URL pública do bucket é gerada.

## Endpoints

Autenticação:

- `POST /api/admin/setup` — bootstrap do 1º admin (bloqueado com `409` depois).
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `POST /api/admin/change-password`
- `POST /api/admin/forgot-password`
- `POST /api/admin/reset-password`

Produtos (exigem sessão válida e senha trocada):

- `GET /api/admin/products`
- `POST /api/admin/products` — aceita `multipart/form-data` (campos de texto +
  campo `image` com o arquivo) ou JSON. Formatos JPG/JPEG/PNG/WEBP, máx. 5 MB.
- `PUT /api/admin/products/:id` — mesmo formato; se enviar uma imagem nova, a
  antiga é removida do B2 após a nova ser confirmada no D1.
- `DELETE /api/admin/products/:id` — exclui do D1 e remove a imagem do B2.

Público (somente leitura):

- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/products/:id/image` — proxy da imagem; busca o binário no bucket
  privado com autenticação no backend e entrega com cache de 24h.

## Upload de imagens (Backblaze B2)

O administrador seleciona um arquivo no formulário (nada de URL digitada). O
upload é `multipart/form-data`; o backend autentica na B2 API
(`b2_authorize_account` → `b2_get_upload_url` → `b2_upload_file`) e envia o
binário ao bucket privado. No D1 fica apenas a referência (`b2_file_key` e
`b2_file_id`). As credenciais B2 (`B2_APPLICATION_KEY_ID` e
`B2_APPLICATION_KEY`) **nunca** chegam ao frontend.

- Chave dos arquivos: `agrovisao/products/{slug}-{timestamp}.{ext}`.
- Validação no servidor: extensão, MIME declarado e magic bytes do arquivo.
- Produtos podem ser criados sem imagem (produto sem upload continua permitido).
- O bucket **não** pode ser tornado público: as imagens são servidas apenas pelo
  endpoint de proxy `GET /api/products/:id/image`, que autentica no B2 no
  backend e nunca expõe tokens ao navegador.

## Bootstrap do primeiro administrador

Credenciais iniciais de referência (uso único, nunca no repositório):

- E-mail: `admin@agrovisaopara.com.br`
- Senha inicial: informada via variável segura (abaixo); o padrão de bootstrap é `admin`.

A senha inicial deve ser fornecida por **variável temporária segura** — nunca no
código, no frontend, no `wrangler.toml` ou em logs. O comando a seguir **não**
imprime a senha; ela é lida dos secrets do Pages.

```bash
# 1) Definir as credenciais iniciais como secrets temporários
npx wrangler pages secret put ADMIN_INITIAL_EMAIL
npx wrangler pages secret put ADMIN_INITIAL_PASSWORD

# 2) Executar o bootstrap uma única vez
curl -X POST https://<SEU-SITE>.pages.dev/api/admin/setup

# 3) Remover a senha inicial (bootstrap concluído)
npx wrangler pages secret delete ADMIN_INITIAL_PASSWORD

# 4) Conferir (sem exibir senha/hash)
npx wrangler d1 execute agrovisao-db --remote --command "SELECT id, email, must_change_password FROM admin_users;"
```

O bootstrap não duplica nem sobrescreve o usuário (responde `409` se já existir
algum admin). Após o primeiro login, o painel exige a troca da senha inicial.

### Bootstrap local

```bash
npx wrangler d1 migrations apply agrovisao-db --local   # cria o schema
npx wrangler pages dev --port 8788 --ip 127.0.0.1      # carrega .dev.vars
curl -X POST http://127.0.0.1:8788/api/admin/setup
```

As credenciais locais ficam em `.dev.vars` (ignorado pelo Git).

## Secrets

O projeto **não** utiliza o Cloudflare Secret Store (não há binding
`secrets_store_secrets` na configuração). Os segredos são definidos como secrets
protegidos do Pages Worker:

```bash
npx wrangler pages secret put B2_APPLICATION_KEY_ID
npx wrangler pages secret put B2_APPLICATION_KEY
npx wrangler pages secret put B2_BUCKET_ID
npx wrangler pages secret put B2_BUCKET_NAME
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put MAIL_FROM
npx wrangler pages secret put PUBLIC_SITE_URL
```

Localmente usamos `.dev.vars` (em `.gitignore`). Os nomes estão em `.env.example`
(apenas nomes, sem valores).

> A senha do administrador **nunca** fica em Secret Store — somente o hash no D1.

## Deploy em produção

```bash
# 1) Definir o database_id real do D1 no wrangler.toml
#    (npx wrangler d1 info agrovisao-db)

# 2) Aplicar migrations remotas (cria schema + admin_users)
npx wrangler d1 migrations apply agrovisao-db --remote

# 3) Definir os secrets (seção "Secrets" acima)

# 4) Buildar e publicar
npm run build
npx wrangler pages deploy dist

# 5) Bootstrap do 1º admin (seção "Bootstrap")
```

## Política de senha

Senhas novas (troca inicial e redefinição) devem ter: mínimo 8 caracteres, máximo
128, ao menos uma letra e ao menos um número. A senha inicial de bootstrap é
aceita mesmo sendo curta, pois é obrigatoriamente trocada no primeiro login.
