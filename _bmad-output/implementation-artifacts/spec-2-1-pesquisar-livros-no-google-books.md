---
title: 'Story 2.1 — Pesquisar livros no Google Books'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: '1ff72225cde306fa05e8a5a47e59a7d8c6306257'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Search mode decision:** A busca terá um único campo e um seletor explícito “Título/Autor”; o modo selecionado gera `intitle:` ou `inauthor:`.

**Problem:** Leitores ainda não conseguem pesquisar no catálogo de livros da aplicação, pois o repositório contém somente a estrutura inicial.

**Approach:** Criar a rota `/buscar` para pesquisar por título ou autor no Google Books e apresentar resultados paginados que preservam a ordem do provedor. A busca acontece no servidor e não grava os resultados no banco de dados.

## Boundaries & Constraints

**Always:** Chamar a Google Books API v1 no servidor; usar uma chave `GOOGLE_BOOKS_API_KEY` restrita à Books API e mantida fora do código do navegador; enviar `maxResults=20` e `startIndex=page*20`; manter a ordem retornada; mostrar capa, título, autor, atribuição ao Google e link para Google Books; exibir a média da aplicação somente quando houver valor local disponível; tratar erro/quota sem crash, retry automático ou troca de catálogo; permitir nova tentativa manual.

**Never:** Persistir resultado ou metadado só por pesquisar; usar a avaliação do Google como média da aplicação; criar índice local de títulos/autores; reordenar ou misturar os resultados do provedor; incluir a busca na reformulação da home, ficha de livro ou adoção/estante, que ficam fora desta story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Busca válida | Termo, campo título/autor e página zero-based | Até 20 volumes mapeados na ordem do provedor; indica próxima página somente se `totalItems > startIndex + returnedItems` | Nenhum |
| Sem resultados | Consulta válida com zero volumes | Estado vazio claro e opção de alterar/reenviar consulta | Não tratar como falha do provedor |
| Chave ausente ou API indisponível/quota | Configuração ausente ou resposta não bem-sucedida/inválida | Mensagem amigável no resultado da busca; nenhum segredo ou detalhe interno no cliente; ação manual de tentar novamente | Sem crash, retry automático ou fallback de catálogo |

</frozen-after-approval>

## Code Map

- `src/app/page.tsx` e `src/app/page.module.css` -- starter atual da home; Story 2.1 não deve alterar a home da Story 2.3.
- `src/app/buscar/page.tsx` e `src/app/buscar/page.module.css` -- criar página de busca; ainda não existem.
- `src/app/api/books/search/route.ts` -- criar Route Handler server-side para validar parâmetros e responder ao navegador; ainda não existe.
- `src/server/search-books.ts` -- criar orquestração da consulta; `src/server` existe, mas ainda não há código.
- `src/domain/books.ts` -- criar tipos/port de busca e retorno local opcional; `src/domain` existe, mas ainda não há código.
- `src/infrastructure/google-books/google-books-adapter.ts` -- criar adapter HTTP e mapeamento do provedor; `src/infrastructure` existe, mas ainda não há código.
- `.env.example` e `README.md` -- documentar `GOOGLE_BOOKS_API_KEY` como placeholder e sua configuração server-only; nunca inserir valor real.
- `AGENTS.md` -- exige ler a documentação local do Next.js em `node_modules/next/dist/docs/` antes de escrever código; `node_modules` não existe ainda, então instalar dependências após aprovação e ler as guias relevantes.
- `_bmad-output/planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md` -- AD-5 define Route Handler, adapter Google, paginação e preservação da ordem; não introduzir banco/gravação de resultados nesta story.

## Tasks & Acceptance

**Execution:**
- [x] `src/domain/books.ts` -- definir entrada título/autor, paginação, resultado normalizado e valor local opcional -- separar contrato de API do formato Google.
- [x] `src/infrastructure/google-books/google-books-adapter.ts` -- chamar volumes list, mapear `id`, título, autores, categoria, capa e links -- encapsular HTTP e segredo fora do cliente.
- [x] `src/server/search-books.ts` e `src/app/api/books/search/route.ts` -- validar consulta, chamar o port, calcular `hasMore` sem mutar ordem e traduzir falhas em erro estável.
- [x] `src/app/buscar/page.tsx` e `page.module.css` -- implementar consulta e navegação de páginas, resultados, atribuição, estado vazio/erro e retry manual.
- [x] `.env.example` e `README.md` -- explicar a variável server-side sem credencial real.

**Acceptance Criteria:**
- Given um termo válido, when o leitor pesquisa por título ou autor, then a aplicação consulta Google Books no servidor e mostra até 20 resultados na ordem recebida sem persistir volumes.
- Given `totalItems` indica resultados posteriores, when a página atual é exibida, then a navegação oferece a próxima página de 20; caso contrário, não oferece esse controle.
- Given resultados do provedor, when a lista é renderizada, then cada item apresenta capa quando disponível, título, autor, atribuição obrigatória e link para Google Books; média local aparece somente se fornecida.
- Given chave ausente, quota ou falha do provedor, when a busca é processada, then a UI mostra erro amigável e permite retry manual, sem crash, retry automático, fallback de catálogo ou exposição de chave/detalhes técnicos.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict and evidence | Route / outcome |
|---|---|---|
| Retry after an initial failed search did not reuse the typed query. | medium — verified in the original handler; retry used empty `activeQuery` until a successful response. | patch — retry now uses the current query and selected field. |
| Missing `items` could be interpreted as a valid empty result despite a positive `totalItems`. | medium — verified in the adapter's previous `payload.items ?? []` check. | patch — inconsistent provider responses now become a handled server error. |
| Invalid, negative, fractional, or missing `totalItems` could be converted to zero. | medium — verified in the prior fallback mapping; edge-case report repeated the missing-total case. | patch — require a nonnegative safe integer; grouped with provider-response validation above. |
| Results did not identify whether the search was by title or author. | low — verified in the result heading. | patch — heading now includes the selected search mode. |
| A stalled provider request had no timeout. | medium — verified; the previous fetch had no abort signal and left the UI loading. | patch — provider fetch now times out after 10 seconds and shows the friendly error state. |
| Request or JSON parsing exception text could be shown to the reader. | medium — verified in the client catch block. | patch — all unexpected client-side errors now use the friendly message. |
| Page 500 could advertise page 501 even though the handler rejects pages above 500. | low — verified from the page validation and `hasMore` calculation; only reachable after many pages. | patch — page 500 no longer reports a next page. |
| Automated coverage for the pagination matrix was absent. | medium — reviewer found no search or `hasMore` tests in the repository. | patch — added seven focused tests covering title/author search, order, empty results, key/quota/provider failures, invalid responses, and pagination; all passed. |
| Reviewer claim that raw network/parser details are necessarily exposed. | false — backend failures return a generic JSON message; unexpected client-side errors are now also replaced with a generic message. | rejected — the cited outcome is prevented by the response handler. |

## Verification

**Commands:**
- `npm run test:book-search` -- 7 testes passaram.
- `npm run test:supabase-env` -- 11 testes passaram.
- `npm run lint` -- esperado: sem erros de lint nos arquivos alterados.
- `npm run build` -- esperado: build de produção conclui.
