---
title: 'Criar conta e perfil'
type: 'feature'
created: '2026-09-30'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

## Intent

**Problem:** O produto ainda não oferece o cadastro inicial de conta e o perfil do usuário, e o fluxo precisa respeitar o contrato do Supabase Auth: identidade em Auth, perfil separado, sem duplicar credenciais e sem perfis órfãos.

**Approach:** Implementar a criação de conta com nome, e-mail e senha em uma página de cadastro, validar as entradas e persistir o perfil do usuário usando o UUID do Auth como identidade de referência, sem expor credenciais no navegador nem criar registros órfãos.

## Code Map

- `src/lib/auth.ts` -- validação do payload de cadastro e mensagens de erro seguras.
- `src/lib/auth.test.ts` -- testes unitários para entradas válidas e inválidas do cadastro.
- `src/app/cadastro/page.tsx` -- formulário de criação de conta e perfil do usuário.
- `src/app/actions/auth.ts` -- ação server-side responsável por criar o usuário e registrar o perfil.
- `src/app/page.tsx` -- página inicial de exemplo para roteamento simples da aplicação.

## Open Questions

- Nenhuma pergunta pendente: o fluxo de cadastro e perfil é definido pelo épico e pela arquitetura e cabe ao código implementá-lo sem escolha de produto adicional.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/auth.ts` -- criar validadores para nome, e-mail e senha com mensagens seguras -- garante que dados inválidos sejam rejeitados antes da chamada externa.
- [ ] `src/app/actions/auth.ts` -- criar ação server-side para registrar no Supabase Auth e persistir o perfil associado -- mantém a identidade como UUID único e evita perfil órfão.
- [ ] `src/app/cadastro/page.tsx` -- criar formulário de cadastro e tratamento de feedback do usuário -- entrega interface com mensagens seguras de erro e sucesso.
- [ ] `src/lib/auth.test.ts` -- validar casos de sucesso e falha do cadastro -- protege a regra central de validação do fluxo.

**Acceptance Criteria:**
- Given nome, e-mail e senha válidos, when envio o cadastro, then a identidade é criada pelo Supabase Auth e o perfil associado usa o mesmo UUID e guarda o nome.
- Given dados inválidos ou e-mail já utilizado, when tento cadastrar, then recebo uma mensagem segura e não é criado um perfil órfão.
- Given um cadastro concluído, when os dados persistidos são consultados, then e-mail e senha não estão duplicados na tabela de perfil nem expostos ao código do navegador.

## Implementation Notes

