---
title: 'Registrar falha na limpeza de cadastro'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Se a gravação do perfil falhar após a criação no Supabase Auth, uma falha ao remover a identidade órfã não é registrada. Além disso, helpers de teste estão exportados do módulo `'use server'`, que deve exportar somente funções async.

**Approach:** Registrar no log do servidor o erro retornado ou lançado por `deleteUser`, incluindo o ID do usuário, sem alterar a mensagem genérica retornada ao usuário. Mover os helpers de injeção do cliente para um módulo separado, fora do módulo Server Action.

</frozen-after-approval>

## Implementation Notes

- `src/app/actions/auth.ts`: registra com `console.error` o erro retornado ou lançado por `deleteUser`, incluindo `userId`; mantém a resposta genérica.
- `src/app/actions/auth.test-helpers.ts`: centraliza o factory injetável do cliente Supabase fora do módulo `'use server'`.
- `src/app/actions/auth.test.ts`: cobre erro retornado e exceção lançada no cleanup, verificando log, ID e mensagem genérica.
- Verificação: `npm test` passou (4/4); `npm run build` passou. Revisão identificou itens preexistentes fora do escopo, registrados em `deferred-work.md`.

## Review Triage Log

- `medium` / defer: `npm run lint` falha porque `next lint` trata `lint` como diretório no Next.js 16; não foi alterado por esta tarefa e está no ledger.
- `medium` / defer: uma rejeição inesperada da action pode deixar o formulário em estado de envio; comportamento de `src/app/cadastro/page.tsx` preexistente, registrado no ledger.
- `medium` / defer: o fluxo não orienta o próximo passo quando Supabase exige confirmação de e-mail; lacuna da Story 1.1, registrada no ledger.
- `medium` / defer: não foi encontrada migração/schema de `profiles`; dependência preexistente ao código da action, registrada no ledger.
- `medium` / defer: políticas RLS descritas no contexto do épico não foram encontradas; lacuna preexistente, registrada no ledger.
- `false`: o exemplo de ambiente não prova falta de separação entre ambientes; o setup de preview/produção já foi configurado e validado separadamente.
- `low` / defer: faltam testes do caminho de sucesso da action e da associação do perfil ao UUID do Auth; lacuna de cobertura preexistente, registrada no ledger.
- `low` / defer: faltam testes isolados para conflitos de e-mail e limites de validação; lacuna de cobertura preexistente, registrada no ledger.
- `low` / defer: o checklist da especificação anterior não reflete o estado da implementação; inconsistência documental preexistente, registrada no ledger.
- `low` / defer: a mensagem de sucesso não tem região `aria-live`; acessibilidade fora do escopo e preexistente, registrada no ledger.
