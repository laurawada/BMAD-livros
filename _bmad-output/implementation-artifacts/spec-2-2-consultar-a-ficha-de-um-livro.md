---
title: 'Story 2.2 — Consultar a ficha de um livro'
type: 'feature'
created: '2026-09-30'
status: 'review'
baseline_commit: '4814482a3c6ad58c82ec5f1cf58de54d0b6508bb'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Leitores conseguem encontrar livros, mas ainda não têm uma ficha para consultar metadados e informações da comunidade.

**Approach:** Criar `/livro/:id` para resolver UUID local ou ID externo do Google Books. Consultar Book persistido por UUID; buscar volumes externos sem persistir por visualização; se houver snapshot local, usá-lo quando Google Books falhar. Mostrar média/contagem, resenhas e vibes da aplicação quando existirem.

**Data contract:** Usar o modelo proposto em `_bmad-output/specs/spec-letterboxd-de-livros/data-model.md`; esta branch adiciona migration para Book/Review/BookVibe, leitura pública protegida por RLS e view de médias. Aplicar a migration no Supabase de desenvolvimento antes de consultar dados reais.

## Boundaries & Constraints

**Always:** Google Books é acessado somente no servidor; visualizar um resultado externo não o persiste; preservar autores na ordem do provedor; usar a primeira categoria, thumbnail (com fallback small thumbnail) e descrição; opcionais ausentes ficam vazios, exceto autor ausente, que aparece como “Autor desconhecido”; médias usam apenas Review local; consultas públicas Supabase usam anon key e RLS.

**Never:** persistir automaticamente um livro só por abrir a ficha; misturar avaliações do Google Books com a média local; usar service-role key no cliente; criar serviço separado ou ORM.

## I/O Matrix

| Interface | Input | Output | Failure / Side effect |
|---|---|---|---|
| `GET /api/books/:id` (server) | UUID local ou ID externo em `id` | DTO da ficha e dados comunitários locais se existirem | snapshot fallback; leitura externa sem gravação |
| Port do catálogo Google Books | ID externo | detalhes normalizados do volume | timeout/quota/resposta inválida convertidos em falha interna segura |
| Adapter Supabase | UUID local do Book | snapshot, resenhas, média e vibes | RLS governa leitura; falha não derruba metadados externos |
| Rota `/livro/:id` | UUID local ou ID externo | ficha bibliográfica e conteúdo comunitário | erro simples quando não há provedor nem snapshot |

## Code Map

- `src/domain/books.ts` — DTO/port de detalhes, reviews e dados do feed.
- `src/infrastructure/google-books/google-books-adapter.ts` — busca e consulta server-side de detalhes.
- `src/infrastructure/supabase/book-discovery-adapter.ts` — leituras PostgREST protegidas por RLS.
- `src/server/get-book-details.ts` — resolve UUID/ID externo, snapshot fallback e dados comunitários.
- `src/server/search-books.ts` e `src/app/api/books/search/route.ts` — padrão existente de orquestração server-side e tratamento de falhas.
- `src/app/api/books/[id]/route.ts` e `src/app/livro/[id]/` — endpoint e interface da ficha.
- `src/app/buscar/page.tsx` — resultados navegam para a ficha.
- `supabase/migrations/20261001000000_book_discovery_community.sql` — tabelas com RLS e view agregada.

## Tasks & Acceptance

**Tasks:**
- [x] Definir DTO/port de detalhe externo e leitura comunitária.
- [x] Implementar adapter Google Books e leitura Supabase server-side.
- [x] Implementar endpoint que resolve UUID local ou ID externo; detalhes externos não são persistidos.
- [x] Usar snapshot local se Google Books falhar.
- [x] Criar ficha com metadados, média/contagem, resenhas, vibes e estados de erro.
- [x] Atualizar navegação dos resultados de busca para a ficha.
- [x] Criar migration alinhada ao modelo de dados existente.
- [ ] Aplicar migration no Supabase de desenvolvimento e revisar com dados reais.

**Acceptance Criteria:**
- Given um ID local, when a ficha abre, then carrega Book por UUID.
- Given ID Google ainda não adotado localmente, when a ficha abre, then consulta e mostra detalhes sem persistir a leitura.
- Given snapshot local e falha Google, when a ficha abre, then exibe snapshot sem crash.
- Given falha Google e ausência de snapshot, when a ficha abre, then informa indisponibilidade sem crash.
- Given Reviews e BookVibes locais, when a ficha abre, then mostra média, contagem, resenhas e vibes próprias; sem esses dados, metadados seguem acessíveis.
- Given metadados do provedor, when mapeados, then título, autores em ordem, primeira categoria, capa e descrição seguem o contrato; campos opcionais ficam vazios e autor ausente vira “Autor desconhecido”.
- Given ID inválido ou volume inexistente, when a ficha abre, then mostra mensagem simples de não encontrado sem crash.

## Implementation Notes

A leitura externa permanece server-only e não grava Book. O adapter usa anon key pública e depende de RLS; nenhuma service-role key é usada. A view agrega somente ratings locais e não importa ratings do Google Books. A migration precisa ser aplicada antes de ler avaliações reais.

## Spec Change Log

- 2026-09-30: Especificação inicial; descoberta dependência de schema compartilhado e contratos comunitários ausentes.
- 2026-10-01: Escopo ampliado a pedido do usuário: resolução local/externa, snapshot fallback, leitura comunitária e migration conforme modelo existente.

## Review Triage Log

| Finding | Verdict and evidence | Route / outcome |
|---|---|---|
| A migration usa contrato compartilhado com Epic 3. | válido — segue `_bmad-output/specs/spec-letterboxd-de-livros/data-model.md`, mas requer confirmação antes de aplicar em banco compartilhado. | migration fica local até aplicar/revisar com o grupo. |

## Verification

**Implementação realizada:** adapter de detalhes Google Books, consultas Supabase, snapshot fallback, médias, reviews/vibes, endpoint e ficha. `npm run lint`, `npm run test:book-search` (8 testes), `npm run test:book-details` (6 testes), `npm run test:supabase-env` (11 testes) e build de produção em diretório isolado passaram. A pasta `.next` padrão teve falha de acesso por bloqueio do OneDrive, e a migration ainda não foi aplicada ao projeto Supabase.
