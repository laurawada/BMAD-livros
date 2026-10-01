# Avaliação de Livros

Aplicação Next.js com App Router e TypeScript. Requer Node.js 20.9 ou superior.

## Desenvolvimento

Instale as dependências travadas e inicie o servidor local:

```bash
npm ci
npm run dev
```

Abra http://localhost:3000 no navegador.

## Build

Para validar a compilação de produção:

```bash
npm run lint
npm run build
npm run start
```

## Estrutura

- `src/app`: apresentação e rotas do App Router.
- `src/server`: orquestração server-only.
- `src/domain`: regras e ports do domínio.
- `src/infrastructure`: adapters externos.

O projeto usa o starter oficial do Next.js 16.3.6. As dependências são fixadas em `package-lock.json`.

## Supabase

Os ambientes usam dois projetos Supabase independentes. Em desenvolvimento local, copie `.env.example` para `.env.local` e substitua os placeholders pelos valores do projeto de desenvolvimento. Obtenha a Project URL e a chave pública/anon em **Project Settings → API Keys** no painel do projeto. Nunca use uma service-role key no cliente ou em variáveis `NEXT_PUBLIC_`.

Configure as mesmas duas variáveis conforme o destino do deploy:

| Destino | Projeto Supabase |
| --- | --- |
| Local, Vercel Development e Preview | Projeto de desenvolvimento/preview |
| Vercel Production | Projeto de produção |

Em cada ambiente Vercel, cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` usando somente os valores do projeto correspondente. Faça novo deploy após alterar variáveis, pois valores `NEXT_PUBLIC_` são incorporados ao bundle durante o build. Confirme no painel que a URL de produção e a de desenvolvimento são distintas.

Configure também `SHELF_SNAPSHOT_SECRET` com um segredo aleatório de pelo menos 32 bytes em cada ambiente. Ele assina snapshots de livros no servidor antes de enviá-los ao componente da estante; nunca use um valor `NEXT_PUBLIC_`. Gere um valor com:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Armazene o mesmo valor no Vault do projeto Supabase correspondente, com o nome `shelf_snapshot_secret` (a migration usa esse segredo para validar a assinatura dentro da RPC). Desenvolvimento/Preview e Production devem usar valores independentes e cada valor deve coincidir entre o ambiente server-side e o Vault daquele mesmo projeto. Nunca inclua o valor no repositório, em `NEXT_PUBLIC_` ou em logs. A migration não provisiona esse segredo.

Para verificar, sem modificar dados, que Auth e Data API respondem para o projeto configurado localmente:

```bash
npm run verify:supabase
npm run test:supabase-env
```

O verificador imprime apenas o resultado ou a categoria/status HTTP do erro; não imprime URL, chave nem corpo da resposta. `.env.local` e outros arquivos `.env*` são ignorados pelo Git; `.env.example` contém apenas placeholders e pode ser versionado.
