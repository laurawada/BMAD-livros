---
title: 'Entrar com e-mail e senha'
type: 'feature'
created: '2026-09-30'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '8b1623622d9cf0be2b774651c6c2dc8606ed4137'
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/specs/spec-letterboxd-de-livros/data-model.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A aplicação permite criar conta, mas não oferece entrada com e-mail e senha nem estabelece uma sessão persistente para as requisições seguintes. Também não existe um caminho protegido de dados pessoais que demonstre a negação de acesso sem identidade autenticada.

**Approach:** Implementar login por Server Action usando sessão Supabase SSR em cookies, verificar a identidade no servidor para operações pessoais e manter mensagens seguras que não revelem se uma conta existe. Por decisão do usuário, migrations e RLS serão entregues em trabalho posterior e são pré-requisito antes de abrir o sistema para usuários reais.

## Boundaries & Constraints

**Always:** Usar `auth.getUser()` para validar identidade no servidor; preservar service-role fora do browser e nunca usá-la para operações pessoais autenticadas; credenciais inválidas devem produzir a mesma mensagem segura; manter o destino pós-login na rota inicial existente `/`.

**Decision:** Esta story implementa a negação server-side. Migration e enforcement/testes de RLS ficam adiados para uma tarefa que estabeleça o schema versionado; esta entrega não declara o banco protegido.

**Never:** Adicionar login social, expor tokens/chaves ao cliente ou ampliar para funções pessoais fora da proteção de perfil exigida pela story. Não criar migration ou políticas RLS nesta entrega.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login válido | E-mail e senha corretos | Sessão associada ao usuário verificado persiste em cookies e navegação segue para `/` | Não retornar tokens ao componente |
| Credenciais inválidas | E-mail inexistente, senha incorreta ou sessão indisponível | Mensagem genérica idêntica, sem confirmar existência da conta | Erro técnico fica no servidor |
| Acesso sem identidade | Requisição direta à rota de perfil protegida | Servidor nega acesso antes de consultar dados, sem depender da UI | Redirecionar para entrada; enforcement RLS fica adiado |

</frozen-after-approval>

## Code Map

- `src/app/actions/auth.ts` -- padrão de Server Action e cadastro; não reutilizar o cliente service-role para login nem consultas de usuário.
- `src/app/cadastro/page.tsx` -- padrão atual de formulário, estado de envio e mensagens seguras para replicar na tela de entrada.
- `src/lib/auth.ts` -- valida e-mail, mas exige nome/senha forte para cadastro; não aplicar `validateSignUpData` diretamente ao login.
- `src/app/actions/auth.test-helpers.ts` e `src/app/actions/auth.test.ts` -- injeção de cliente e padrão de testes unitários existentes.
- `package.json` / `package-lock.json` -- têm `@supabase/supabase-js`, mas ainda não `@supabase/ssr`.
- `src/app/page.tsx` -- rota inicial existente, candidata ao destino após login.
- Não existem migrations SQL, cliente SSR, middleware, rota privada ou operação atual de leitura/alteração de perfil. Por decisão do usuário, migrations e RLS ficam fora desta story.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/supabase/server.ts`, `src/app/actions/session.ts`, `src/app/entrar/page.tsx`, `package.json` e `package-lock.json` -- implementar cliente SSR por request, login por e-mail/senha com cookies e interface de entrada; commit `feat(auth): add email/password sign-in`.
- [x] `src/app/minha-conta/page.tsx` e `src/server/auth/require-user.ts` -- criar caminho privado e guard server-side que rejeita identidade ausente antes de consultar dados; commit `feat(auth): protect personal routes server-side`. RLS fica explicitamente adiado.
- [x] `src/app/actions/session.test.ts` e testes de autorização pertinentes -- cobrir sessão válida, credenciais inválidas, cookies e negação direta sem identidade; commit `test(auth): cover sign-in and access guard`.

**Acceptance Criteria:**
- Given conta válida, when envio credenciais corretas, then Supabase estabelece sessão persistente associada à identidade verificada e a aplicação navega para `/`.
- Given credenciais incorretas ou conta não autenticável, when tento entrar, then recebo mensagem segura idêntica que não revela se o e-mail existe.
- Given requisição sem identidade autenticada, when tenta acessar a rota privada de perfil diretamente, then o servidor nega antes de ler dados, independentemente dos controles visuais; enforcement no banco permanece pendente.

## Implementation Notes

- Na revisão, a limpeza de uma sessão rejeitada foi limitada ao escopo local para não invalidar sessões em outros dispositivos; erros retornados por `signOut` agora são registrados no servidor.
- Foi adicionado teste para confirmar a renderização do perfil para uma identidade validada.
- Verificação após os ajustes: `npm test` passou (14/14) e `npm run build` passou.
- Commits de implementação: `3f174c0` (login/SSR), `d0487ec` (guard/rotas) e `25ac6ac` (testes).

## Verification

**Commands:**
- `npm test` -- testes de autenticação, cookies e acesso negado passam.
- `npm run build` -- aplicação e rotas de entrada/protegida compilam.

**Manual checks:**
- Testar que chamada direta à rota privada sem sessão é redirecionada/negada por `require-user.ts` antes de qualquer leitura ou alteração de dados.
- Antes de abrir o sistema para usuários reais, concluir o item de migrations e RLS em `deferred-work.md`; esta story não valida nem entrega enforcement no banco.

## Review Triage Log

| Finding | Verdict and evidence | Route |
|---|---|---|
| A tela de entrada não oferece navegação para cadastro. | low — `/entrar` não tinha link, embora a rota `/cadastro` já exista; foi adicionado um link direto. | patch |
| A página inicial não oferece navegação para o perfil privado após o login. | medium — `/minha-conta` existia, mas a rota inicial pós-login não a expunha; foi adicionado um link para a rota protegida. | patch |
| Não existe ação para encerrar a sessão persistente. | medium — carried: logout segue registrado como trabalho posterior e permanece fora do fluxo de entrada desta story. | defer |
| Uma rejeição inesperada da Server Action deixava o formulário em estado de envio. | medium — o handler não restaurava `isSubmitting`; `catch`/`finally` agora mostram erro genérico e reabilitam o formulário. | patch |
| A escrita de cookies ignorava qualquer exceção, inclusive falha real durante o login. | medium — falhas de persistência podiam ser ocultadas; somente a restrição conhecida de cookie em Server Component é ignorada, e demais erros propagam. | patch |
| O teste de sucesso não confirmava o destino do redirect nem ausência de credenciais retornadas. | false — `digest?.includes(';/;')` confirma o segmento de destino `/`, e a ação termina por redirect em vez de retornar credenciais. | reject |
| O status do spec estava `in-review`, mas o sprint tracker ainda estava `in-progress`. | low — os artefatos estavam divergentes; o tracker agora marca a story como `review`, correspondente ao estado de revisão definido pelo projeto. | patch |
| A falha inesperada da Server Action pode manter o formulário permanentemente desabilitado. | medium — confirmado pela ausência de `finally`; corrigido junto ao finding equivalente do blind-hunter. | patch |
| O adapter suprimia erros de gravação de cookies em qualquer contexto. | medium — confirmado; corrigido junto ao finding equivalente do blind-hunter, preservando apenas a tolerância ao erro read-only esperado. | patch |
| A identidade retornada por `auth.getUser()` não tinha teste para divergência da identidade de login. | medium — o guard de UUID já existia, mas não havia regressão para essa condição; foi adicionado teste de identidade divergente. | patch |
| Os testes não verificavam que a factory SSR de produção conectava o adapter de cookies. | medium — os testes anteriores isolavam o adapter e injetavam o cliente; foi adicionado teste da factory e da persistência via opções SSR. | patch |
| Não há teste de componente para a mensagem genérica visível na tela de entrada. | low — carried: a suíte verifica a resposta da action, mas não há infraestrutura de testes React/UI; mantido como follow-up. | defer |
| O diff mostra texto português corrompido por encoding. | false — os arquivos fonte e o diff temporário exibem os caracteres acentuados corretamente; a busca por sequências de mojibake não encontrou ocorrências. | reject |
| A proteção server-side da rota pessoal não impede acesso direto ao banco sem RLS. | medium — a limitação é real, mas migrations e RLS foram explicitamente adiadas no Intent; pendência registrada no ledger. | defer |
| A página inicial não distingue a sessão autenticada e pode dar a impressão de que o login não funcionou. | false — a rota inicial inclui link para `/minha-conta`, que valida a sessão no servidor e exibe o e-mail verificado; a story exige o redirect para `/`, não alteração da home. | reject |
| A resposta de erro retornada por `signOut` era ignorada durante a limpeza de uma identidade divergente. | medium — corrigido: o erro agora é registrado no servidor e a action mantém a mensagem genérica; teste cobre o retorno com erro. | patch |
| Não há teste de renderização do perfil com identidade autenticada. | medium — corrigido: teste invoca a página privada com usuário verificado e confirma o e-mail renderizado. | patch |
| A chamada de cleanup podia revogar sessões além da sessão local. | medium — corrigido: `signOut` agora usa `scope: 'local'`, como verificado no teste de identidade divergente. | patch |
| O teste da página privada não cobria a rota autenticada e podia deixar passar um redirect indevido. | medium — corrigido: adicionado teste da renderização autenticada do perfil. | patch |
| A mensagem genérica de erro visível na tela de login não tem teste de componente. | low — carried: mesma lacuna já registrada acima; permanece follow-up porque não há infraestrutura de teste de UI no projeto. | defer |