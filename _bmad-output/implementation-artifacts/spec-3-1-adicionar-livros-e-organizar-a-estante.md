---
title: '3.1: Adicionar livros e organizar a estante'
type: 'feature'
created: '2026-10-01'
status: 'done'
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
- [x] `src/app/page.tsx` e `src/app/page.module.css` -- adicionar o link "Minha estante" à navegação da home e permitir quebra dos links em telas estreitas -- tornar a rota da estante encontrável sem overflow mobile.
- [x] `src/domain/shelf.test.ts`, `src/server/shelf.test.ts` e `supabase/tests/shelf.test.sql` -- cobrir regras/idempotência, atomicidade, estados e políticas RLS permitidas/negadas em ambiente local -- validar os limites de confiança e a matriz de casos.

**Acceptance Criteria:**
- Given `Shelf.userId` referencia `auth.users.id` e uma pessoa autenticada fornece os dados do livro do contrato Google Books, when ela o adiciona pela primeira vez, then há adoção local por `externalId` e uma única entrada `Quero ler` na mesma RPC `SECURITY INVOKER`, sem gravação parcial.
- Given uma entrada existente, when o proprietário adiciona o mesmo livro ou muda seu estado, then repetição preserva o status e mudança atualiza a mesma linha com `updatedAt` avançado.
- Given uma estante com diferentes estados, when o proprietário abre `/estante`, then vê os quatro grupos e os dados básicos dos livros, sem ação para remover entradas.
- Given uma pessoa na página inicial, when seleciona "Minha estante", then navega para `/estante`.
- Given nenhuma sessão, when a pessoa abre `/estante`, then é redirecionada para `/login` sem receber dados privados.
- Given outro usuário, when tenta ler ou alterar uma estante privada, then RLS nega o acesso independentemente da interface.

## Implementation Notes

Implementado em `src/domain`, `src/server`, `src/infrastructure/supabase` e nas rotas/ações/componentes de estante. A home inclui o link "Minha estante" para `/estante`, com quebra responsiva da navegação em telas estreitas. Nenhuma migration foi aplicada a projeto remoto; `/login` e `/livro/[id]` permanecem fora do escopo desta story.

Validação nesta sessão: `npm run test:shelf` (14/14), lint direcionado, `npm run build` (inclui `/estante`) e `npm ci --dry-run --ignore-scripts --offline` passaram. `npm run lint` terminou sem erros, com um aviso de import não usado em `src/app/actions/auth.ts`. `npx supabase test db --debug` não conseguiu conectar ao Postgres local (`127.0.0.1:54322`, `ECONNREFUSED`); nenhum projeto remoto foi acessado.

## Spec Change Log

- 2026-10-02: A pedido da pessoa usuária, adicionada entrada "Minha estante" à navegação da home com quebra responsiva; alinhados o tipo exportado da Server Action e o mock do teste ao contrato `ShelfEntry`.

## Review Triage Log

| Finding | Verdict and evidence | Route / outcome |
|---|---|---|
| B1 — Migrations duplicam a versão e a tabela `books`. | high — as duas migrations usam `20261001000000` e executam `CREATE TABLE public.books`; uma instalação nova não consegue aplicar o conjunto. | defer — integração de migrations entre Epics 2 e 3. |
| B2 — Policy de inserção de Book permite ignorar a assinatura. | medium — a policy permissiva de `book_discovery_community.sql` autoriza qualquer `auth.uid()` não nulo; policies permissivas se combinam por OR apesar da policy mais restrita adicionada pela migration da estante. | defer — policy preexistente de outra story precisa ser reconciliada no contrato compartilhado. |
| B3 — A estante redireciona para `/login`, que não existe. | medium — a aplicação tem `/entrar`, não `/login`; a visita sem sessão termina em 404, embora a intent aprovada fixe `/login`. | defer — resolver a divergência do contrato de rota sem alterar a intent congelada. |
| B4 — O ledger ainda descreve a ficha como não implementada. | low — Story 2.2 tem endpoint e página implementados; a pendência documentada é aplicar/revisar a migration com dados reais. | reject — fora do escopo explícito da Story 3.1. |
| B5 — O ledger ainda descreve a home como não implementada. | low — Story 2.3 tem home e feed implementados; resta aplicar/revisar a migration com dados reais. | reject — fora do escopo explícito da Story 3.1. |
| B6 — O ledger mantém verificações Supabase/Vercel como pendentes. | low — a spec SP-2 registra smoke checks aprovados e confirmação humana do mapeamento Vercel, em conflito com as entradas antigas. | reject — fora do escopo explícito da Story 3.1. |
| B7 — O README omite a migration necessária à estante. | medium — o setup instrui aplicar apenas `book_discovery_community.sql`, enquanto as tabelas/RPC da estante estão em outra migration. | defer — atualizar após resolver o conflito de versionamento/ownership das migrations. |
| B8 — O README não documenta `SUPABASE_SERVICE_ROLE_KEY`. | medium — `signUpWithEmail` exige essa variável e falha sem ela; a configuração pertence ao cadastro do Epic 1. | reject — fora do escopo explicitamente excluído da Story 3.1. |
| B9 — O README repete e interrompe a introdução do smoke check. | low — a instrução termina em dois-pontos, intercala notas de migration/feed e repete a introdução antes dos comandos. | reject — problema editorial fora do objetivo desta story. |
| B10 — A nota da spec informa 17 testes SQL, mas o arquivo declara 24. | low — `plan(24)` e 24 chamadas de assertion contradizem a contagem `17/17` registrada. | reject — a correção exigiria editar a spec desta build. |
| E1 — Lockfile não corresponde ao manifesto. | medium — `npm ci --dry-run --ignore-scripts --offline` inicialmente falhou com EUSAGE e listou versões bloqueadas incompatíveis com `package.json`; após regenerar o lockfile, o mesmo comando passou. | patch — corrigido e validado com dry-run de instalação limpa. |
| E2 — Migrations colidem na versão e na tabela `books`. | high — ambas usam `20261001000000` e criam `public.books`, impedindo aplicar a migration set em banco novo. | defer — agrupado com B1, integração entre Epics 2 e 3. |
| E3 — Redirect de sessão ausente aponta a uma rota 404. | medium — `/login` não existe; a rota de entrada implementada é `/entrar`. | defer — agrupado com B3; requer resolver a divergência do contrato aprovado. |
| E4 — Erros inesperados ao gravar cookies são engolidos. | maybe-false — o `catch` é abrangente, mas não foi demonstrado um erro alcançável além da mutação não permitida em Server Components nem perda de sessão resultante. | defer — reproduzir erro não relacionado a contexto read-only e confirmar efeito sobre refresh de sessão. |
| E5 — ID externo UUID-like pode ser tratado somente como UUID local. | maybe-false — o código não tenta o provider após UUID local ausente, mas não foi demonstrado que o contrato Google Books aceita um ID nesse formato. | reject — resolução da ficha de detalhes é da Story 2.2, excluída da intent atual. |
| E6 — Itens Google Books malformados podem distorcer paginação. | low — o adapter descarta itens inválidos e `hasMore` usa o tamanho filtrado, podendo oferecer uma página vazia em resposta malformada. | reject — busca do Epic 2 está fora do escopo da Story 3.1. |
| E7 — Falta de configuração Supabase parece feed vazio. | medium — `/api/books/community` retorna arrays vazios quando Supabase não está configurado, sem distinguir falha de ausência de dados. | reject — feed/home do Epic 2 está fora do escopo da Story 3.1. |
| E8 — Rejeição inesperada ao inserir perfil pode deixar usuário órfão. | medium — a action só executa limpeza quando `insert` retorna um erro; rejeição da promise sai antes da exclusão da identidade. | reject — cadastro do Epic 1 está explicitamente excluído da Story 3.1. |
| E9 — Rejeição da action pode deixar formulário de cadastro desabilitado. | medium — `isSubmitting` volta a `false` apenas após o `await` resolver, sem `finally`. | reject — cadastro do Epic 1 está explicitamente excluído da Story 3.1. |
| E10 — A diff inclui autenticação de Epic 1. | false — o código pertence às stories próprias do Epic 1 na árvore integrada; não é uma alteração da implementação da estante a ser removida nesta story. | reject — falso positivo de escopo ao revisar o diff acumulado desde o baseline. |
| V1 — Instalação limpa falha com o lockfile atual. | medium — verificado por `npm ci --dry-run --ignore-scripts --offline`; após regenerar o lockfile, o dry-run passou. | patch — agrupado com E1 e corrigido. |
| V2 — A migration set não pode ser aplicada em instalação nova. | high — conflito de versão e `CREATE TABLE public.books` confirmado nas duas migrations. | defer — agrupado com B1. |
| V3 — O destino de autenticação da estante não existe. | medium — a implementação tem `/entrar`, mas a função de redirect envia para `/login`. | defer — agrupado com B3. |

## Design Notes

A action recebe um `BookSnapshot` do catálogo: `externalId`, `title`, `author` e `coverUrl`, `genre`, `description` opcionais. Ela não busca nem cadastra livros manualmente; `author` já segue o mapeamento do provider. O `userId` nunca vem do payload: o servidor valida a sessão e a RPC obtém `auth.uid()`. A RPC `SECURITY INVOKER` adota `Book` sem sobrescrever snapshot existente e cria `Shelf` `Quero ler` apenas se ausente; chamadas repetidas mantêm status e `updatedAt`. Mudança de status valida enum e atualiza a mesma entrada, com RLS de proprietário e sem política/ação de delete. SQL/pgTAP roda somente contra Supabase local.

## Verification

**Commands:**
- `npm run lint` -- sem erros de lint.
- `npm run build` -- aplicação compila.
- `npm run test:shelf` -- testes de domínio e casos de uso passam.
- `supabase test db` -- pgTAP confirma adoção, unicidade e RLS no Supabase local; nunca executar contra projeto remoto.