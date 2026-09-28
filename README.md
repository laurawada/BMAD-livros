# Letterboxd de Livros

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
