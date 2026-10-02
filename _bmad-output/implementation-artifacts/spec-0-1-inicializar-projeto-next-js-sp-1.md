---
title: 'SP-1: Inicializar o projeto a partir do starter Next.js'
type: 'chore'
created: '2026-09-27'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-0-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O repositório ainda não possui uma aplicação executável, deixando os quatro épicos sem uma base comum de desenvolvimento.

**Approach:** Inicializar o repositório com o starter oficial do Next.js 16.3.6 usando App Router, TypeScript e npm, fixar as dependências no `package-lock.json` e criar os diretórios-base da arquitetura modular monolítica.

**Boundaries & Constraints**

**Always:** Manter Node.js mínimo 20.9; usar App Router e TypeScript; disponibilizar scripts de desenvolvimento e build; criar `src/app`, `src/server`, `src/domain` e `src/infrastructure`; manter a aplicação como um único monólito modular.

**Never:** Implementar funcionalidades de conta, catálogo, avaliações, estante, vibes ou perfil; adicionar Supabase, Google Books, ORM, segundo serviço ou credenciais nesta story; deixar dependências sem lockfile.

**Acceptance Criteria**

- Given um repositório sem aplicação, when o bootstrap termina, then Next.js 16.3.6, App Router e TypeScript estão configurados, Node.js 20.9+ é documentado como requisito e as dependências estão travadas em `package-lock.json`.
- Given o projeto inicializado, when a estrutura é inspecionada, then existem `src/app`, `src/server`, `src/domain` e `src/infrastructure`, sem funcionalidades de produto.
- Given as dependências instaladas, when os comandos documentados de desenvolvimento e build são executados, then a aplicação inicia e compila sem erro.

</frozen-after-approval>

## Implementation Notes

O starter oficial foi gerado com Next.js 16.3.6, App Router, TypeScript e npm. Como o nome da pasta contém maiúsculas e viola as regras do npm, o bootstrap foi gerado temporariamente em `starter` e integrado à raiz.

O pacote foi nomeado `letterboxd-de-livros`, o requisito Node.js `>=20.9.0` foi declarado e os diretórios `src/app`, `src/server`, `src/domain` e `src/infrastructure` foram registrados. A página inicial e o README foram ajustados para a identidade do produto sem implementar funcionalidades.

Validação: `npm install`, `npx eslint src` e `npm run build` passaram. O lint global continua encontrando três erros preexistentes em `.agents/skills/bmad-testarch-framework/resources/hooks/tea-enforce.cjs`, fora do código da aplicação.

## Review Triage Log

- false — A acusação de mojibake no README não se confirmou na leitura do arquivo no workspace; o conteúdo está legível em UTF-8.
- patch — O manifesto não declarava Node.js mínimo; adicionado `engines.node >=20.9.0`.
- patch — A documentação usava `npm install` e não cobria lint/start; passou a usar `npm ci` e documenta lint, build e start.
- patch — Metadados e locale ainda eram os defaults do starter; ajustados para Letterboxd de Livros e `pt-BR`.
- patch — A página inicial ainda exibia instruções e links do starter; substituída por um estado inicial mínimo do produto.
- rejected-low — A validação de `npm run start` não foi executada como processo persistente porque o critério da story exige desenvolvimento e build; o script permanece documentado e é gerado pelo starter.
- rejected-low — O conteúdo de deployment/documentação externo foi removido da tela inicial; a documentação do projeto permanece suficiente para a story.
- rejected-low — A spec recebeu as evidências de implementação e validação antes da finalização.

