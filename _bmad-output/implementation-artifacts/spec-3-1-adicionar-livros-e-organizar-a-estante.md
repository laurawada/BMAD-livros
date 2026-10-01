---
title: '3.1: Adicionar livros e organizar a estante'
type: 'feature'
created: '2026-10-01'
status: 'draft'
route: 'dispatch'
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
- `src/domain/`, `src/server/` e `src/infrastructure/` -- contêm apenas `.gitkeep`; criar regras/ports, orquestração server-only e adapter Supabase conforme o spine.
- `supabase/migrations/` -- não existe; criar migration versionada para Book/Shelf, constraints, RLS e RPC transacional.
- `package.json` -- Next.js 16.3.6 e React; sem SDK Supabase ou comandos de teste de produto.
- `_bmad-output/planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md` -- define Auth por requisição, RLS, transação `SECURITY INVOKER`, rotas e limites de camadas.
- `_bmad-output/planning-artifacts/epics.md` e `_bmad-output/specs/spec-letterboxd-de-livros/data-model.md` -- critérios da story e contrato canônico de status, snapshot e unicidades.
- `AGENTS.md` -- exige consultar a documentação instalada do Next.js em `node_modules/next/dist/docs/` antes de editar código.

## Tasks & Acceptance

**Execution:**
- [ ] `supabase/migrations/` -- criar schema e constraints para `Book`/`Shelf`, FK `Shelf.userId` para `auth.users.id`, unicidades, status válidos, policies RLS e RPC `SECURITY INVOKER` -- tornar persistência e privacidade autoritativas; somente versionar, sem aplicar remotamente.
- [ ] `src/domain/` e `src/server/` -- definir contrato e operações server-only para adicionar/adotar, alterar status e consultar estante -- manter regras fora da UI.
- [ ] `src/infrastructure/` -- implementar adapter Supabase SSR por requisição e chamada transacional -- usar identidade verificada e evitar escrita no browser.
- [ ] `src/app/components/shelf-action.tsx` e `src/app/actions/shelf.ts` -- criar componente de adição/status e Server Action reutilizáveis pela futura ficha do Epic 2 -- não criar a rota de ficha nesta story.
- [ ] `src/app/estante/page.tsx` -- carregar e agrupar a estante do proprietário; redirecionar sessão ausente para `/login` -- completar a visualização privada sem implementar Auth.
- [ ] Testes de domínio, operações e banco -- cobrir idempotência, transições, atomicidade e RLS permitida/negada, incluindo a RPC sob usuário autenticado -- proteger invariantes e matriz de casos.

**Acceptance Criteria:**
- Given `Shelf.userId` referencia `auth.users.id` e uma pessoa autenticada fornece os dados do livro do contrato Google Books, when ela o adiciona pela primeira vez, then há adoção local por `externalId` e uma única entrada `Quero ler` na mesma RPC `SECURITY INVOKER`, sem gravação parcial.
- Given uma entrada existente, when o proprietário adiciona o mesmo livro ou muda seu estado, then repetição preserva o status e mudança atualiza a mesma linha com `updatedAt` avançado.
- Given uma estante com diferentes estados, when o proprietário abre `/estante`, then vê os quatro grupos e os dados básicos dos livros, sem ação para remover entradas.
- Given nenhuma sessão, when a pessoa abre `/estante`, then é redirecionada para `/login` sem receber dados privados.
- Given outro usuário, when tenta ler ou alterar uma estante privada, then RLS nega o acesso independentemente da interface.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

A adoção deve ser uma única RPC `SECURITY INVOKER`, com `Shelf.userId` referenciando `auth.users.id` e unicidade de `Book.externalId` e `Shelf(userId, bookId)`, para que chamadas repetidas ou concorrentes não criem duplicatas nem substituam um status existente. O componente apresentacional chama Server Actions que validam a sessão e delegam ao use case; o adapter usa cliente SSR por requisição. Apenas `Shelf.updatedAt` representa a última transição de estado; não há remoção no MVP.

## Verification

**Commands:**
- `npm run lint` -- sem erros de lint.
- `npm run build` -- aplicação compila.
- Testes focados de domínio e persistência -- cobrem idempotência, transições, atomicidade e policies RLS, incluindo negações.