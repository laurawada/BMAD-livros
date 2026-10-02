---
title: 'Estilizar a aplicação com CSS global'
type: 'feature'
created: '2026-10-01'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** As páginas atuais não têm stylesheet global e dependem de estilos inline básicos, resultando em uma interface sem hierarquia visual ou adaptação consistente a telas estreitas.

**Approach:** Criar um CSS global responsivo com identidade editorial para leitura, aplicá-lo pelo root layout e estilizar navegação, formulários, campos, estados de erro/sucesso e perfil sem alterar a lógica funcional das telas.

</frozen-after-approval>

## Implementation Notes

- Criado e importado `src/app/globals.css`; aplicado às páginas home, cadastro, entrada e perfil por classes reutilizáveis.
- Verificação visual: home e cadastro sem overflow em 1440 px e 390 px; campos e botão cabem na viewport mobile.
- `npm test` passou (14/14), `npm run build` passou e os arquivos TSX não têm diagnósticos.
- Revisão: foco visível dos inputs ajustado para contraste dourado; `prefers-reduced-motion` já estava coberto.

## Review Triage Log

- `false`: animação sem suporte a `prefers-reduced-motion`; a regra correspondente já existe no final do stylesheet.
- `low` / patch: foco do teclado nos inputs era substituído por outline translúcido; alterado para outline dourado de alto contraste.
- `low` / defer: autocomplete dos campos de cadastro não estava definido; registrado no ledger por ser melhoria de formulário fora do pedido de CSS.
- `low` / defer: faltava link de retorno ao login na página de cadastro; registrado no ledger como melhoria de navegação preexistente.
- `low` / defer: status de sucesso do cadastro não era anunciado por leitores de tela; registrado no ledger como melhoria de acessibilidade preexistente.
