# Epic 2 Context: Descobrir e inspecionar livros

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Permitir que leitores descubram livros pela página inicial e pela busca, abram fichas por identificador local ou do Google Books e consultem avaliações da comunidade. O fluxo deve continuar útil quando o catálogo externo falhar: usar snapshot local quando houver e apresentar erro simples quando não houver dados locais.

## Stories

- Story 2.1: Pesquisar livros no Google Books
- Story 2.2: Consultar a ficha de um livro
- Story 2.3: Explorar a página inicial

## Requirements & Constraints

- A busca por título ou autor ocorre no servidor via Google Books API v1; preservar a ordem do provedor e paginar em blocos de até 20 resultados. Exibir próxima página somente quando houver mais resultados.
- Resultados de busca e detalhes consultados no provedor não persistem apenas por serem visualizados. A primeira adoção para uma escrita em outro fluxo guarda snapshot local por `externalId` único; leituras posteriores de busca/detalhe não sobrescrevem o snapshot.
- Exibir capa, título, autor, atribuição ao Google e link proeminente para Google Books nos resultados. A média própria da aplicação aparece quando disponível; não importar nem misturar avaliações do Google.
- Na ficha, aceitar UUID local ou ID externo. Mapear metadados do provedor de forma consistente: ID→`externalId`, autores na ordem recebida unidos por vírgula, primeira categoria, thumbnail (fallback small thumbnail) e descrição. Campos opcionais ausentes ficam vazios; autor ausente aparece como “Autor desconhecido”.
- A ficha apresenta metadados e, quando existirem, média/contagem de avaliações, resenhas e vibes locais. A indisponibilidade do provedor usa snapshot existente; sem snapshot, exibir erro simples sem crash.
- A home mostra livros avaliados recentemente (capa, título, autor, média própria quando disponível) e resenhas recentes, com links para a ficha. Ordenar apenas dados locais da aplicação. Sem dados comunitários, apresentar estado vazio e manter disponível o início de busca.
- Falhas e quotas do catálogo geram erro amigável na página, sem crash, retry automático ou troca para outro catálogo; permitir nova tentativa manual. Erros apresentados ao usuário devem ser estáveis e seguros, com detalhes técnicos registrados somente no servidor.
- Manter chave Google restrita à Books API e somente no servidor. Não criar índice local de título/autor nem reordenar, alterar ou misturar resultados do Google Books.

## Technical Decisions

- Arquitetura: monólito modular Next.js App Router; UI/rotas em `src/app`, orquestração server-only em `src/server`, regras e ports em `src/domain`, adapters em `src/infrastructure`. Google Books e Supabase implementam ports; dependências apontam para contratos internos. Não adicionar serviço separado, fila ou ORM.
- Google Books é a única autoridade de busca. Usar Route Handler server-side com consultas `intitle:`/`inauthor:`, `maxResults=20` e `startIndex = page * 20`; determinar página seguinte comparando `totalItems` a `startIndex + returnedItems`.
- PostgreSQL/Supabase é fonte canônica para dados da aplicação. Médias são derivadas das avaliações ativas locais no momento da leitura; arredondar apenas na apresentação, com formatador compartilhado.
- Clientes Supabase SSR são por requisição; verificar identidade/claims no servidor e aplicar RLS às tabelas expostas. O navegador não escreve tabelas diretamente e segredos não são enviados ao cliente.
- IDs locais são UUID; ID do volume Google é texto opaco único `externalId`. Persistir timestamps como `timestamptz` e versionar alterações de schema em migrations SQL.

## UX & Interaction Patterns

- Identidade visual própria, interface simples, capas como elemento visual principal, cartões de livros, bordas arredondadas, espaçamento confortável e navegação clara.
- Busca deve deixar evidente atribuição ao Google e link para o catálogo. Estados de erro e vazio permanecem compreensíveis e oferecem caminho para nova busca/tentativa manual.

## Cross-Story Dependencies

- Busca e consulta de metadados podem avançar em paralelo com Epic 1 após acordo sobre UUID de Auth/perfil, contrato do Book e limites dos adapters.
- Médias, resenhas e conteúdo comunitário da ficha e da home dependem dos contratos e dados de Review do Epic 3; alinhar o formato de leitura com seu responsável antes de integrar.
- Epic 3 depende do contrato de Book/adoption deste épico para fazer adoção transacional por `externalId`; definir conjuntamente schema, tipos/ports e ownership de migrations para evitar conflitos.
