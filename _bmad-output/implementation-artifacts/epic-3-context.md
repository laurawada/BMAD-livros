# Epic 3 Context: Registrar e organizar leituras

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permitir que leitores autenticados avaliem livros, mantenham um status único de leitura e associem vibes. O épico completa o fluxo de encontrar e guardar leituras com estado íntegro e privado, e fornece dados consistentes para fichas e perfis.

## Stories

- Story 3.1: Adicionar livros e organizar a estante
- Story 3.2: Avaliar e manter minha avaliação
- Story 3.3: Associar vibes a um livro

## Requirements & Constraints

- Shelf é a fonte única do status: `Quero ler`, `Lendo`, `Lido` ou `Abandonei`. Há no máximo uma entrada por usuário/livro; adicionar sem avaliar inicia em `Quero ler`, repetir preserva o estado e a entrada não pode ser removida no MVP.
- Há no máximo uma avaliação ativa por usuário/livro. A avaliação exige texto não vazio e nota entre 1 e 5 em incrementos de meia estrela; criar ou editar exige status explícito e altera a mesma Shelf. Editar preserva `createdAt`; excluir Review não remove nem altera Shelf.
- Vibes não vazias são canônicas (minúsculas, sem espaços externos) e únicas por usuário/livro/valor. A ficha apresenta cada valor distinto uma vez.
- Médias próprias de livro e usuário são derivadas das avaliações ativas da aplicação. Não importar notas do Google Books, armazenar médias em cache ou depender de atualização assíncrona.
- Dados privados permanecem limitados ao proprietário por autorização no servidor e RLS. Atividade pública expõe somente leituras `Lido` por uma projeção restrita, nunca a estante completa. Erros ao usuário são estáveis e seguros; detalhes técnicos ficam no servidor.

## Technical Decisions

- Manter um monólito modular Next.js: apresentação em `src/app`, operações server-only em `src/server`, regras e contratos em `src/domain`, e adapters em `src/infrastructure`. A interface não grava tabelas diretamente; não introduzir serviço separado, fila ou ORM.
- PostgreSQL/Supabase é a fonte canônica. Usar UUIDs locais, identidade Supabase Auth verificada, `timestamptz`, migrations SQL versionadas e constraints para unicidade e invariantes. Armazenar notas como `NUMERIC` exato, sem arredondamento silencioso.
- Na primeira escrita, adotar atomicamente o livro por `externalId` único e guardar o snapshot de metadados; escritas relacionadas de Book, Shelf, Review e vibe compartilham a transação/RPC `SECURITY INVOKER`, sob RLS e identidade verificada. Buscas posteriores não sobrescrevem o snapshot.
- Usar cliente Supabase SSR por requisição, privilégios mínimos e testes de autorização permitida e negada. Nenhuma credencial privilegiada pode chegar ao navegador.
- Calcular agregados durante a leitura. Alterações em Review e Shelf atualizam seus próprios timestamps conforme a semântica do evento; não manter médias em jobs ou cache.

## UX & Interaction Patterns

- A ficha `/livro/:id` concentra avaliação, status, inclusão na estante e vibes em poucos passos. `/estante` agrupa os quatro status e mostra capa e dados básicos do livro.
- Capas são o principal sinal visual; preservar identidade própria, interface simples e navegação clara, sem copiar plataformas de avaliação de filmes. A orientação disponível é geral e não define critérios UX verificáveis adicionais.

## Cross-Story Dependencies

- As três stories compartilham schema, constraints, RLS, migrations e adoção transacional; coordená-las pelo owner do épico, sem tratá-las como trabalho independente em paralelo.
- O épico depende da identidade/Auth do Epic 1 e do contrato Book, adoção por `externalId` e snapshot do Epic 2.
- O Epic 4 consome Reviews ativas e leituras `Lido`; sua consulta pública deve continuar limitada à projeção de conclusão, sem revelar outros status ou a estante completa.