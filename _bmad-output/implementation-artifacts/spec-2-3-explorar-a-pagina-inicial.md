---
title: 'Story 2.3 — Explorar a página inicial'
type: 'feature'
created: '2026-10-01'
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

**Problem:** A rota inicial ainda é apenas uma tela de placeholder e não orienta o leitor para descobrir livros.

**Approach:** Transformar `/` em uma página de descoberta, com navegação para busca, livros recentemente avaliados e resenhas recentes locais. Quando não existirem dados, mostrar estado vazio honesto e manter a busca acessível.

**Data contract:** Ler conteúdo público de `book_discovery_feed` e `reviews` via endpoint server-side com chave anon; ordering vem somente de datas e ratings locais. A view e RLS são criadas pela migration `supabase/migrations/20261001000000_book_discovery_community.sql`.

## Boundaries & Constraints

**Always:** Home não depende do Google Books; oferecer navegação clara para `/buscar`; distinguir estado vazio e falha de leitura; layout responsivo e sem dados fictícios; livros e resenhas apontam para ficha local por UUID.

**Never:** inventar livros avaliados ou resenhas; ordenar usando o catálogo Google; usar service-role key no cliente; esconder a busca quando não houver atividade.

## I/O Matrix

| Interface | Input | Output | Failure / side effect |
|---|---|---|---|
| `GET /` | nenhuma entrada | hero e conteúdo comunitário recente | feed é carregado no cliente; sem gravação |
| Links de navegação | clique em início/busca | navega para `/` ou `/buscar` | rotas locais do App Router |
| `GET /api/books/community` | nenhuma entrada | até 8 livros avaliados e 6 resenhas recentes | Supabase indisponível retorna erro seguro; sem persistência |

## Code Map

- `src/app/page.tsx` — placeholder da home, substituído pelo conteúdo de descoberta.
- `src/app/page.module.css` — estilos locais responsivos da página.
- `src/app/home-community.tsx` — estados de carregamento, erro, vazio e feed real.
- `src/app/api/books/community/route.ts` — endpoint server-side do feed.
- `src/infrastructure/supabase/book-discovery-adapter.ts` — consultas agregadas PostgREST.
- `supabase/migrations/20261001000000_book_discovery_community.sql` — tabelas, RLS e view.
- `src/app/buscar/page.tsx` — destino de descoberta já implementado.
- `src/app/livro/[id]/page.tsx` — destino de ficha externa usado quando listas reais forem conectadas.
- `_bmad-output/implementation-artifacts/epic-2-context.md` — orienta estado vazio e dependência comunitária.

## Tasks & Acceptance

**Tasks:**
- [x] Substituir o placeholder por apresentação da proposta de descoberta.
- [x] Manter links visíveis para busca na navegação e no conteúdo.
- [x] Criar seções de leituras recentes e resenhas recentes com estados vazios honestos.
- [x] Aplicar layout responsivo e sem dados inventados.
- [x] Integrar livros recentemente avaliados com média, capa, título e autor, ordenados por atividade local.
- [x] Integrar resenhas recentes e link para a ficha correspondente.
- [x] Tratar carregamento, estados vazios, falha e retry manual.
- [ ] Aplicar a migration no Supabase de desenvolvimento e revisar o feed com dados reais.

**Acceptance Criteria:**
- Given reviews locais, when a home abre, then mostra livros recentemente avaliados com capa, título, autor, média própria e resenhas recentes.
- Given um livro ou resenha listado, when selecionado, then navega para a ficha pelo UUID local.
- Given ausência de dados comunitários, when a home abre, then mostra estados vazios e permite iniciar busca.
- Given falha do endpoint comunitário, when a home abre, then informa indisponibilidade e oferece retry manual.
- Given itens na home, when ordenados, then usa dados locais sem alterar resultados da busca Google Books.
- Given viewport estreito, when a home abre, then navegação e listas permanecem utilizáveis.

## Implementation Notes

A página usa Server Component para hero e navegação e delega o feed a componente cliente pequeno para loading, retry manual e empty states. O endpoint lê conteúdo local, sem consultar Google Books. Itens linkam para UUID local. Aplicar migration para conectar a base real.

## Spec Change Log

- 2026-10-01: Especificação inicial; dependência de Review/Book compartilhados confirmada no contexto do Epic 2.
- 2026-10-01: Escopo ampliado a pedido do usuário; feed local ligado ao modelo Book/Review documentado.

## Review Triage Log

| Finding | Verdict and evidence | Route / outcome |
|---|---|---|
| O feed só terá conteúdo se a migration estiver aplicada e houver Reviews. | válido — o endpoint consulta dados locais e a UI diferencia vazio de indisponibilidade. | migration/documentação criadas; aplicação no projeto continua pendente. |

## Verification

**Implementação realizada:** home responsiva, endpoint/adaptador do feed, links para fichas e estados de carregamento/vazio/erro. `npm run lint`, `npm run test:book-search` (8 testes), `npm run test:book-details` (6 testes), `npm run test:supabase-env` (11 testes) e build de produção em diretório isolado passaram. A pasta `.next` padrão teve falha de acesso por bloqueio do OneDrive, e a aplicação do feed com dados reais ainda depende da migration no Supabase.
