---
title: '3.1: Adicionar livros e organizar a estante'
type: 'feature'
created: '2026-10-01'
status: 'in-review'
route: 'dispatch'
baseline_commit: '26e0790aad084d27a7d2be4a07ef75eee52511a3'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Leitores precisam guardar livros e acompanhar seu estado de leitura em uma estante privada, mas o projeto ainda não tem persistência de livros/estantes nem interface para esse fluxo.

**Approach:** Implementar a adoção atômica do snapshot de um livro e sua entrada `Shelf`, oferecer adição e atualização de status por um componente reutilizável com Server Action e exibir `/estante` agrupada pelos quatro estados permitidos.

**Scope decision:** Permanecer estritamente na Story 3.1. Não implementar cadastro/login do Epic 1 nem a rota de ficha `/livro/[id]` da Story 2.2. A action reutilizável será preparada para importação futura pela ficha do Epic 2. A página `/estante` redireciona sessões ausentes para `/login`, rota definida no contrato arquitetural. Migrations SQL serão versionadas localmente; nenhuma será aplicada a Supabase remoto.

## Boundaries & Constraints

**Always:** `Shelf` é a única fonte de status; `Shelf.userId` referencia `auth.users.id`; a combinação usuário/livro é única; a primeira adição cria `Quero ler`, repetição preserva o estado, mudança atualiza a mesma entrada e `updatedAt`. A adoção por `externalId` e criação da estante são atômicas por RPC `SECURITY INVOKER`, respeitando identidade verificada, RLS e constraints PostgreSQL. O snapshot adotado não é sobrescrito por consultas posteriores. Só o proprietário lê sua estante completa. Entregar migration SQL versionada, um componente e Server Action reutilizáveis e interface simples e responsiva.

**Never:** Expor credencial privilegiada ao cliente, confiar apenas em controles visuais para autorização, permitir remover entradas, duplicar o status em `Review`, criar livros manualmente, ou incluir avaliações, vibes, perfil público, login social, serviços separados, ORM ou gravação direta do browser nas tabelas. Não aplicar migration nem alterar dados/projetos Supabase remotos nesta story.

## I/O & Edge-Case Matrix

| Cenário | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Primeira adição | Usuário autenticado; livro do contrato Google ainda não adotado | Snapshot é adotado pelo `externalId` e uma `Shelf` `Quero ler` é criada na mesma operação | Falha não deixa Book ou Shelf parcial; erro seguro |
| Repetir adição | O mesmo livro já consta na estante | Nenhuma duplicata; status atual permanece inalterado | Conflitos concorrentes resolvidos pela unicidade/transação |
| Mudar estado | Proprietário escolhe um dos quatro status válidos | A mesma linha é atualizada e `updatedAt` avança | Valor inválido é rejeitado sem alteração |
| Ler estante | Proprietário abre `/estante` | Entradas aparecem agrupadas nos quatro estados, com dados básicos do livro | Estante vazia tem estado vazio; erro não expõe detalhes técnicos |
| Sem sessão | Pessoa sem sessão abre `/estante` | Redirecionamento para `/login`, sem dados privados | Nenhum |
| Acesso alheio | Outro usuário tenta consultar ou mutar Shelf | Nenhum dado privado é retornado nem alterado | RLS nega a operação |
</frozen-after-approval>

## Code Map

- `src/app/page.tsx` e `src/app/page.module.css` -- página inicial ainda é placeholder; não contém catálogo ou ação de estante.
- `src/app/layout.tsx` e `src/app/globals.css` -- layout e estilos globais atuais do starter, relevantes à identidade visual e responsividade.
- `src/domain/shelf.ts` e `src/domain/ports/shelf-repository.ts` -- status, snapshot, agrupamento e port usados pelos casos de uso e adapter.
- `src/server/shelf.ts` -- autentica cada operação, valida snapshot/status e deriva `userId` da identidade verificada.
- `src/infrastructure/supabase/server.ts`, `shelf-service.ts` e `shelf-repository.ts` -- cliente SSR request-scoped, integração Auth, RPC e queries de estante.
- `src/app/actions/shelf.ts` e `src/app/components/shelf-action.tsx` -- Server Actions e controles reutilizáveis sem depender da rota da ficha.
- `src/app/estante/page.tsx` e `page.module.css` -- agrupamento de entradas, capa/metadados básicos, estado vazio e redirect para `/login`.
- `supabase/migrations/20261001000000_create_books_shelf.sql` e `supabase/tests/shelf.test.sql` -- schema/RLS/RPC versionados e testes pgTAP locais.
- `package.json` -- scripts `test:shelf` e dependências `@supabase/ssr`, `@supabase/supabase-js`, `server-only` e `tsx`.
- `_bmad-output/planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md` -- define Auth por requisição, RLS, transação `SECURITY INVOKER`, rotas e limites de camadas.
- `_bmad-output/planning-artifacts/epics.md` e `_bmad-output/specs/spec-letterboxd-de-livros/data-model.md` -- critérios da story e contrato canônico de status, snapshot e unicidades.
- `AGENTS.md` -- exige consultar a documentação instalada do Next.js em `node_modules/next/dist/docs/` antes de editar código.
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, `01-app/02-guides/forms.md`, `01-app/02-guides/authentication.md`, `01-app/03-api-reference/04-functions/cookies.md` e `01-app/03-api-reference/04-functions/redirect.md` -- guias instalados exigidos por `AGENTS.md`; ler antes de implementar ações, sessão e redirect.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- adicionar `@supabase/ssr`, `@supabase/supabase-js` e `tsx` com script `test:shelf` -- fornecer cliente SSR e execução dos testes TypeScript sem acrescentar Auth UI.
- [x] `supabase/migrations/20261001000000_create_books_shelf.sql` -- criar `books` e `shelves`, FK `shelves.user_id` para `auth.users.id`, unicidade de `external_id` e `(user_id, book_id)`, status check, timestamps, grants/policies RLS e RPC de adoção `SECURITY INVOKER` -- tornar persistência e privacidade autoritativas; somente versionar, sem aplicar remotamente.
- [x] `src/domain/shelf.ts` e `src/domain/ports/shelf-repository.ts` -- definir `ShelfStatus`, `BookSnapshot` e port para adotar, mudar status e consultar estante -- fixar o contrato reutilizável sem depender do catálogo ou UI.
- [x] `src/server/shelf.ts` -- implementar casos de uso de adição, mudança de status e consulta -- derivar identidade da sessão verificada e não aceitar `userId` do cliente.
- [x] `src/infrastructure/supabase/server.ts` e `src/infrastructure/supabase/shelf-repository.ts` -- criar cliente SSR por requisição e adapter para RPC/queries -- nunca usar service-role key nem escrita do browser.
- [x] `src/app/actions/shelf.ts` e `src/app/components/shelf-action.tsx` -- criar Server Actions e controle reutilizável para adicionar livro ou escolher status -- receber `BookSnapshot` do chamador futuro e não criar a rota `/livro/[id]`.
- [x] `src/app/estante/page.tsx` e `src/app/estante/page.module.css` -- carregar a estante do proprietário, agrupar nos quatro status e exibir capas/dados básicos; redirecionar ausência de sessão para `/login` -- entregar a visualização responsiva sem implementar login.
- [x] `src/domain/shelf.test.ts`, `src/server/shelf.test.ts` e `supabase/tests/shelf.test.sql` -- cobrir regras/idempotência, atomicidade, estados e políticas RLS permitidas/negadas em ambiente local -- validar os limites de confiança e a matriz de casos.

**Acceptance Criteria:**
- Given `Shelf.userId` referencia `auth.users.id` e uma pessoa autenticada fornece os dados do livro do contrato Google Books, when ela o adiciona pela primeira vez, then há adoção local por `externalId` e uma única entrada `Quero ler` na mesma RPC `SECURITY INVOKER`, sem gravação parcial.
- Given uma entrada existente, when o proprietário adiciona o mesmo livro ou muda seu estado, then repetição preserva o status e mudança atualiza a mesma linha com `updatedAt` avançado.
- Given uma estante com diferentes estados, when o proprietário abre `/estante`, then vê os quatro grupos e os dados básicos dos livros, sem ação para remover entradas.
- Given nenhuma sessão, when a pessoa abre `/estante`, then é redirecionada para `/login` sem receber dados privados.
- Given outro usuário, when tenta ler ou alterar uma estante privada, then RLS nega o acesso independentemente da interface.

## Implementation Notes

Implementado em `src/domain`, `src/server`, `src/infrastructure/supabase` e nas rotas/ações/componentes de estante. A migration foi aplicada somente ao Supabase local em Docker para validar a suíte; nenhum projeto remoto foi vinculado ou alterado. O destino `/login` redireciona como definido, mas a rota de login não foi criada; `/livro/[id]` também permanece ausente.

Validação final: `npm run test:shelf` (8/8), `npm run lint`, `npm run build` (inclui `/estante`) e `npx supabase test db --debug` no Postgres local (17/17). No navegador, `/estante` sem sessão redirecionou para `/login`; o destino respondeu 404 por estar fora desta story.

## Spec Change Log

## Review Triage Log

## Design Notes

A action recebe um `BookSnapshot` do catálogo: `externalId`, `title`, `author` e `coverUrl`, `genre`, `description` opcionais. Ela não busca nem cadastra livros manualmente; `author` já segue o mapeamento do provider. O `userId` nunca vem do payload: o servidor valida a sessão e a RPC obtém `auth.uid()`. A RPC `SECURITY INVOKER` adota `Book` sem sobrescrever snapshot existente e cria `Shelf` `Quero ler` apenas se ausente; chamadas repetidas mantêm status e `updatedAt`. Mudança de status valida enum e atualiza a mesma entrada, com RLS de proprietário e sem política/ação de delete. SQL/pgTAP roda somente contra Supabase local.

## Verification

**Commands:**
- `npm run lint` -- sem erros de lint.
- `npm run build` -- aplicação compila.
- `npm run test:shelf` -- testes de domínio e casos de uso passam.
- `supabase test db` -- pgTAP confirma adoção, unicidade e RLS no Supabase local; nunca executar contra projeto remoto.