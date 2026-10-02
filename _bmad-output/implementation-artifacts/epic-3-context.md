# Epic 3 Context: Registrar e organizar leituras

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permitir que uma pessoa autenticada mantenha sua estante, registre e administre uma avaliação e associe vibes a livros, sem duplicar o status de leitura nem deixar dados inconsistentes. Esse núcleo torna o fluxo de encontrar, avaliar e guardar uma leitura confiável e fornece os dados usados por fichas e perfis.

## Stories

- Story 3.1: Adicionar livros e organizar a estante
- Story 3.2: Avaliar e manter minha avaliação
- Story 3.3: Associar vibes a um livro

## Requirements & Constraints

- Uma entrada `Shelf` por usuário/livro é a única fonte do status: `Quero ler`, `Lendo`, `Lido` ou `Abandonei`. Adicionar sem avaliar inicia em `Quero ler`; repetição preserva o status, mudanças atualizam a mesma entrada e não há remoção no MVP.
- Avaliações exigem texto não vazio, nota entre 1 e 5 em incrementos de meia estrela e escolha explícita de status. Só existe uma avaliação ativa por usuário/livro. Editar preserva `createdAt` e avança `updatedAt`; excluir remove apenas a avaliação, nunca a entrada ou status da estante.
- Vibes são não vazias, normalizadas para minúsculas e sem espaços externos, únicas por usuário/livro/valor canônico. Na ficha, cada valor distinto aparece uma vez.
- Médias de livro e usuário vêm de `AVG` das avaliações ativas da aplicação e refletem a próxima leitura após gravação, edição ou exclusão. Não importar notas do Google Books nem manter médias em cache ou em atualização assíncrona.
- Escritas precisam preservar integridade e privacidade: RLS autoriza apenas o proprietário; consultas de terceiros não devem expor estantes completas ou status privados. Erros apresentados ao usuário são estáveis e seguros; detalhes técnicos ficam no servidor, sem credenciais.

## Technical Decisions

- Manter a aplicação como monólito modular Next.js: interface em `src/app`, orquestração server-only em `src/server`, regras e ports em `src/domain`, adapters em `src/infrastructure`. A interface não grava tabelas diretamente; use cases no servidor chamam adapters Supabase.
- PostgreSQL/Supabase é a fonte canônica. Usar UUIDs para IDs locais, UUID do Supabase Auth como `userId`, `timestamptz` para datas e migrations SQL versionadas. Aplicar constraints de banco para unicidade, status permitido, texto não vazio e invariantes de rating/vibe; rating deve ser armazenado como `NUMERIC` exato, sem arredondamento silencioso.
- Operações de avaliação, estante e vibe adotam o livro por `externalId` único quando necessário e gravam as mudanças relacionadas atomicamente. A RPC/transação compartilhada deve ser `SECURITY INVOKER`, operar com identidade verificada e respeitar RLS. Após adoção, usar o UUID local; guardar snapshot inicial dos metadados e não sobrescrevê-lo em buscas posteriores.
- Usar cliente Supabase SSR por requisição e testar permissões de leitura/escrita permitidas e negadas. Reviews e vibes exigem autenticação e propriedade; nenhum segredo de serviço chega ao navegador.
- Derivar agregados durante a leitura no banco. Para edição da Review manter `createdAt`; avançar `updatedAt` da Review e da Shelf nas respectivas mudanças. Não adicionar ORM, serviço separado, fila ou job de atualização de médias.

## UX & Interaction Patterns

- Na ficha `/livro/:id`, reunir as ações de avaliar, escolher status, adicionar à estante e associar vibes, mantendo o fluxo central com poucos passos. A rota `/estante` agrupa entradas pelos quatro status e mostra capa e informações básicas do livro.
- Capas são o elemento visual principal; manter interface simples, identidade visual própria e não copiar diretamente plataformas de avaliação de filmes. Não há contrato UX formal com critérios verificáveis; estas são as diretrizes gerais disponíveis.

## Cross-Story Dependencies

- As três stories compartilham schema, constraints, RLS, migrations e o contrato de transação para adoção do livro e escritas. Coordenar pelo owner do épico; stories deste épico não são trabalho paralelo independente.
- Epic 3 depende do UUID/identidade verificada e contrato de Auth do Epic 1, e do contrato `Book`/adoption por `externalId` e snapshot do Epic 2. Alinhar esses contratos antes da integração.
- Epic 4 consome entradas `Lido` e avaliações ativas para atividade e médias de perfil; a projeção pública continua limitada a leituras concluídas, sem expor a estante completa.