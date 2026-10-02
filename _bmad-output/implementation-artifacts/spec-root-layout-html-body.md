---
title: 'Corrigir root layout do Next.js'
type: 'bugfix'
created: '2026-10-01'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O servidor de desenvolvimento do Next.js informa que faltam as tags `<html>` e `<body>` no root layout. A árvore `src/app` não contém `layout.tsx`, que é o layout raiz obrigatório do App Router.

**Approach:** Adicionar `src/app/layout.tsx` com a estrutura raiz mínima do App Router, incluindo idioma `pt-BR`, `<html>`, `<body>` e `{children}`; preservar `next-env.d.ts` e demais alterações existentes.

</frozen-after-approval>

## Implementation Notes

- Adicionado `src/app/layout.tsx` com `<html lang="pt-BR">`, `<body>` e renderização de `children`.
- `next-env.d.ts` estava modificado antes desta correção e foi preservado sem alterações.
- Verificação: `Invoke-WebRequest http://localhost:3000` retornou HTTP 200; o HTML foi verificado para `<html>`, `<body>`, `Letterboxd de Livros` e `<title>` no dev server já ativo; `npm run build` passou.

## Review Triage Log

- `low` / patch: o root layout não definia título ou descrição do produto; incluídos metadados para a página renderizada.
- `low` / patch: a evidência de verificação não registrava URL e expectativas; Implementation Notes agora identifica `http://localhost:3000`, HTTP 200 e as verificações do HTML.
