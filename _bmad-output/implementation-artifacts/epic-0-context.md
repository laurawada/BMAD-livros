# Epic 0 Context: Pré-requisitos compartilhados

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Estabelecer a base executável e os ambientes isolados que permitem aos quatro épicos evoluírem sobre a mesma aplicação Next.js e projetos Supabase separados, sem introduzir funcionalidades de produto nesta etapa.

## Stories

- Story 0.1: Inicializar o projeto a partir do starter Next.js
- Story 0.2: Configurar ambientes Supabase separados

## Requirements & Constraints

- Usar um monólito modular Next.js com App Router, TypeScript e Node.js mínimo 20.9.
- A versão-alvo do Next.js é 16.3.6; versões concretas das dependências devem ser confirmadas no bootstrap e fixadas no lockfile.
- A estrutura compartilhada deve separar apresentação (`src/app`), aplicação server-only (`src/server`), domínio e ports (`src/domain`) e adapters (`src/infrastructure`).
- Esta etapa não implementa funcionalidades de conta, catálogo, avaliações, estante, vibes ou perfil.
- O starter deve ter comandos documentados para desenvolvimento e build, ambos executáveis sem erro.
- Configurações de preview/desenvolvimento e produção devem usar projetos Supabase distintos; segredos não entram no repositório nem no bundle do navegador.

## Technical Decisions

- Usar o starter oficial recomendado do Next.js com App Router.
- Manter uma única aplicação; não adicionar API service separado, microserviço, fila ou ORM.
- Reservar `supabase/migrations` para futuras migrations SQL versionadas, sem criar schema de produto nesta story.
- Preservar a fronteira server-only para operações futuras e não criar clientes ou credenciais Supabase antes da story SP-2.

## Cross-Story Dependencies

SP-1 e SP-2 são pré-requisitos compartilhados e podem ocorrer em paralelo. Ambos devem estar concluídos antes dos épicos 1 e 2; as stories de conta e catálogo dependem da estrutura criada por SP-1 e dos contratos de ambiente definidos por SP-2.
