---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - _bmad-output/specs/spec-letterboxd-de-livros/SPEC.md
  - _bmad-output/specs/spec-letterboxd-de-livros/product-surface.md
  - _bmad-output/specs/spec-letterboxd-de-livros/data-model.md
  - _bmad-output/planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md
---

# Projeto teste - Epic Breakdown

## Overview

Este documento decompõe os requisitos da SPEC e do spine de arquitetura em épicos e stories implementáveis. Ownership é atribuído por épico para uma equipe de quatro pessoas; stories dentro do mesmo épico não são consideradas paralelas.

## Requirements Inventory

### Functional Requirements

FR1: Descobrir livros pela página inicial, com livros populares ou avaliados recentemente, resenhas recentes, busca por título/autor via Google Books, preservação da ordem e paginação do provedor, atribuição e link proeminente; exibir erro amigável inline em falha/quota, sem crash nem retry automático, permitindo nova tentativa manual.

FR2: Inspecionar a ficha de um livro com metadados, médias e resenhas da aplicação, contagem de avaliações, vibes e ações de avaliação/estante; resolver por UUID local ou ID externo, recorrer ao snapshot local se Google Books falhar e exibir erro simples se não houver registro local.

FR3: Criar avaliação com nota de 1 a 5 em incrementos de meia estrela, texto não vazio e status explicitamente escolhido; permitir que o autor edite ou exclua sua avaliação, preservando a entrada/status da estante; derivar médias de livro e usuário das avaliações ativas da aplicação.

FR4: Organizar a estante por Quero ler, Lendo, Lido e Abandonei; adicionar sem avaliar inicia em Quero ler, repetição é idempotente, avaliação e estante compartilham o mesmo status e a entrada não pode ser removida no MVP.

FR5: Associar vibes extensíveis e canônicas a um livro, únicas por usuário/livro/valor, e exibir cada valor distinto uma vez na ficha.

FR6: Consultar perfil com nome, foto ou avatar, contagem de entradas Lido, média das próprias avaliações ativas, leituras concluídas recentes e resenhas públicas; a atividade de terceiros expõe somente a projeção restrita de livro e data para entradas Lido.

FR7: Criar conta com nome, e-mail e senha e autenticar por e-mail/senha via Supabase Auth; não oferecer login social nem duplicar credenciais no perfil.

### NonFunctional Requirements

NFR1: Usar uma aplicação monolítica modular Next.js App Router com camadas de apresentação, aplicação server-only, domínio/ports e adapters; não adicionar segundo serviço, microserviços, fila ou ORM.

NFR2: Aplicar segurança no servidor com clientes Supabase SSR por requisição, claims verificados, privilégios mínimos e RLS em toda tabela exposta; browser code não escreve tabelas diretamente e segredos nunca chegam ao cliente.

NFR3: Manter PostgreSQL como fonte canônica do estado; usar UUIDs, constraints e unicidades no banco, rating NUMERIC exato com validação de meia estrela, timestamps timestamptz, transação/RPC SECURITY INVOKER para primeira adoção e escritas relacionadas, e migrations SQL versionadas.

NFR4: Fazer busca Google Books no servidor, manter ordem/paginação do provedor, usar chave restrita à Books API e não criar índice local de título/autor nem importar ratings do provedor para médias próprias.

NFR5: Restringir estantes completas ao proprietário; expor atividade Lido somente por projeção RLS limitada; permitir leitura pública de livros, resenhas, vibes e nome/foto de perfil conforme políticas.

NFR6: Retornar erros estáveis e seguros ao usuário; registrar detalhes técnicos apenas no servidor sem credenciais. Falha/quota do catálogo não causa crash, retry automático ou troca de fonte.

NFR7: Restringir a implantação proposta a protótipo pessoal não comercial em Vercel Hobby/Supabase Free, com projetos separados para desenvolvimento/preview e produção; reavaliar termos antes de comercialização.

NFR8: Manter o fluxo encontrar-avaliar-estante com poucos passos e interface simples, com identidade visual própria e capas como elemento visual principal.

### Additional Requirements

- Stack selecionado: Next.js App Router 16.3.6, Node.js mínimo 20.9 e TypeScript; confirmar versões suportadas de PostgreSQL e SDKs ao inicializar projetos.
- Estrutura de código prevista: `src/app`, `src/server`, `src/domain`, `src/infrastructure`; Google Books e Supabase são adapters dos ports de domínio.
- O primeiro write de estante, avaliação ou vibe adota atomicamente o volume Google por `externalId` único e guarda snapshot; buscas/detalhes do provedor não persistem nem sobrescrevem metadados existentes.
- Status de leitura tem fonte única em `Shelf`; máximo de uma Shelf e uma Review ativa por usuário/livro; excluir Review preserva Shelf. Remoção de entrada da estante está fora do MVP.
- Médias de livro e usuário são consultas derivadas das Reviews da aplicação, sem cache ou job de atualização em segundo plano.
- RLS deve ser testado para operações permitidas e negadas; projeção pública de leituras retorna somente perfil, livro e `updatedAt` para status Lido.
- Migrações de banco devem ser versionadas; ambientes de desenvolvimento/preview e produção têm projetos Supabase separados.
- Não há starter template prescrito; usar o starter oficial Next.js recomendado e travar versões concretas no lockfile após verificação no bootstrap.
- Itens operacionais diferidos antes de usuários reais: configuração de e-mail/password recovery, quotas/rate limits, backup/restore, domínio e monitoramento. Rever termos de provedores antes de qualquer disponibilidade comercial.
- Organização da equipe: quatro responsáveis, com ownership por épico; não tratar stories do mesmo épico como trabalho paralelo. A paralelização deve ocorrer entre épicos independentes, respeitando contratos e dependências compartilhados.

### UX Design Requirements

Nenhum contrato UX formal (`DESIGN.md`/`EXPERIENCE.md`) foi encontrado. Os requisitos existentes de direção visual e interação estão capturados em FR1, FR2, FR6 e NFR8.

### FR Coverage Map

FR1: Epic 2 - descobrir livros pela home e busca Google Books, incluindo falhas e nova tentativa manual.
FR2: Epic 2 - consultar fichas por ID local/externo, com snapshot local em falha do provedor.
FR3: Epic 3 - criar, editar e excluir avaliação, preservando o status da estante e derivando médias.
FR4: Epic 3 - organizar leituras por status em uma entrada Shelf única.
FR5: Epic 3 - associar e exibir vibes canônicas.
FR6: Epic 4 - consultar perfil, médias, leituras concluídas e resenhas com visibilidade restrita.
FR7: Epic 1 - cadastrar, autenticar e provisionar perfil via Supabase Auth.

## Epic List

### Epic 1: Conta e acesso seguro

Uma pessoa consegue criar uma conta com nome, e-mail e senha, autenticar-se e obter o perfil associado, habilitando as funções pessoais do produto.
**FRs covered:** FR7
**Owner:** Pessoa 1
**Dependências:** Contrato de identidade Supabase Auth, UUID compartilhado com o perfil e política RLS de propriedade. Pode começar em paralelo com Epic 2 após alinhamento desses contratos.

### Epic 2: Descobrir e inspecionar livros

Uma pessoa consegue descobrir livros pela home e busca, abrir fichas de livros e entender avaliações da comunidade, inclusive quando o provedor está indisponível e há snapshot local.
**FRs covered:** FR1, FR2
**Owner:** Pessoa 2
**Dependências:** Contrato do adapter Google Books e formato de leitura da ficha. Busca e detalhes do provedor podem começar em paralelo com Epic 1; agregados e conteúdo comunitário integram com Epic 3.

### Epic 3: Registrar e organizar leituras

Uma pessoa autenticada consegue avaliar livros, escolher um único status compartilhado com sua estante e associar vibes, mantendo integridade e médias corretas.
**FRs covered:** FR3, FR4, FR5
**Owner:** Pessoa 3
**Dependências:** Contratos de identidade do Epic 1 e de Book/adoption do Epic 2. Review, Shelf e BookVibe compartilham schema, constraints, RLS, migrations e transação; manter um único owner reduz conflitos nesse núcleo.

### Epic 4: Consultar perfis e atividade de leitura

Uma pessoa consegue consultar perfis e resenhas públicas, médias e leituras concluídas, sem expor a estante privada nem estados diferentes de Lido.
**FRs covered:** FR6
**Owner:** Pessoa 4
**Dependências:** Contrato público de perfil e RLS alinhado com Epic 1; leituras Lido e Reviews/médias de Epic 3. Pode implementar UI com fixtures/contratos acordados, mas a integração final aguarda esses dados.

### Dependências e divisão do trabalho

- **Paralelo inicial:** Epic 1 e Epic 2, após acordar UUID de Auth/perfil, contrato do Book e limites dos adapters.
- **A seguir:** Epic 3 integra identidade e catálogo; em paralelo, Epic 4 pode avançar na UI de perfil usando interfaces/fixtures aprovadas, mas não fechar integração antes do contrato de dados públicos.
- **Pré-requisitos compartilhados antes da divisão:** schema e migrations de User, Book, Review, Shelf e BookVibe; `externalId` único e regra de snapshot; unicidades e validações de rating/status/vibe; semântica de remoção e exclusão de Review; RPC transacional e fronteira server-only; policies RLS e projeção pública Lido; tipos/ports e ownership das migrations.
- Ownership é por épico. Stories dentro de um mesmo épico são sequenciais ou coordenadas pelo owner, não unidades de paralelismo entre pessoas.

## Epic 1: Conta e acesso seguro

Uma pessoa consegue criar uma conta com nome, e-mail e senha, autenticar-se e obter o perfil associado, habilitando as funções pessoais do produto.

### Story 1.1: Criar conta e perfil

Como visitante,
quero criar uma conta com meu nome, e-mail e senha,
para acessar as funções pessoais do produto.

**Acceptance Criteria:**

**Given** nome, e-mail e senha válidos
**When** envio o cadastro
**Then** a identidade é criada pelo Supabase Auth e o perfil associado usa o mesmo UUID e guarda o nome.

**Given** dados inválidos ou e-mail já utilizado
**When** tento cadastrar
**Then** recebo uma mensagem segura e não é criado um perfil órfão.

**Given** um cadastro concluído
**When** os dados persistidos são consultados
**Then** e-mail e senha não estão duplicados na tabela de perfil nem expostos ao código do navegador.

### Story 1.2: Entrar com e-mail e senha

Como pessoa cadastrada,
quero entrar com meu e-mail e senha,
para acessar minhas funções pessoais.

**Acceptance Criteria:**

**Given** uma conta válida
**When** envio as credenciais corretas
**Then** o Supabase Auth estabelece uma sessão associada à identidade verificada.

**Given** credenciais inválidas
**When** tento entrar
**Then** recebo uma mensagem segura que não revela se o e-mail está cadastrado.

**Given** uma requisição sem identidade autenticada
**When** tenta ler ou alterar dados pessoais
**Then** o acesso é negado no servidor/banco, independentemente dos controles visuais.

## Epic 2: Descobrir e inspecionar livros

Uma pessoa consegue descobrir livros pela home e busca, abrir fichas de livros e entender avaliações da comunidade, inclusive quando o provedor está indisponível e há snapshot local.

### Story 2.1: Pesquisar livros no Google Books

Como leitor,
quero pesquisar livros por título ou autor,
para encontrar o livro que desejo consultar.

**Acceptance Criteria:**

**Given** um termo de busca por título ou autor
**When** envio a consulta
**Then** a aplicação chama Google Books no servidor e mostra até 20 resultados na ordem do provedor, sem persistir os resultados.

**Given** mais resultados disponíveis
**When** vejo a lista
**Then** posso avançar para a próxima página de 20, e o controle só aparece quando o provedor indicar resultados adicionais.

**Given** os resultados da busca
**When** são exibidos
**Then** mostram capa, título, autor, atribuição obrigatória ao Google e link proeminente para Google Books; média da aplicação aparece quando disponível.

**Given** indisponibilidade ou quota do provedor
**When** a busca falha
**Then** vejo mensagem amigável na página, sem crash, retry automático ou consulta a outro catálogo, e posso tentar novamente manualmente.

**Given** uma busca
**When** ela é processada
**Then** a chave da API permanece no servidor e é restrita à Books API.

### Story 2.2: Consultar a ficha de um livro

Como leitor,
quero abrir a ficha de um livro,
para consultar seus dados e avaliações da comunidade.

**Acceptance Criteria:**

**Given** um identificador de livro local
**When** abro `/livro/:id`
**Then** a aplicação carrega os dados persistidos pelo UUID local.

**Given** um ID externo do Google Books ainda não adotado localmente
**When** abro a ficha
**Then** os detalhes são consultados no provedor e apresentados sem persistir o livro apenas por ter sido visualizado.

**Given** metadados retornados pelo provedor
**When** a ficha é montada
**Then** título, autores na ordem recebida, primeira categoria, capa e descrição seguem o mapeamento definido no spine; campos opcionais ausentes ficam vazios e autor ausente aparece como "Autor desconhecido".

**Given** o provedor falha e existe snapshot local
**When** abro a ficha pelo ID externo
**Then** a ficha usa os dados persistidos sem crash.

**Given** o provedor falha e não existe snapshot local
**When** abro a ficha
**Then** vejo uma mensagem simples de erro sem crash.

**Given** há avaliações e vibes locais para o livro
**When** a ficha é exibida
**Then** apresenta a média e contagem da aplicação, resenhas e vibes; sem esses dados, os metadados continuam consultáveis.

### Story 2.3: Explorar a página inicial

Como leitor,
quero ver livros avaliados recentemente e resenhas recentes na página inicial,
para encontrar leituras e opiniões da comunidade.

**Acceptance Criteria:**

**Given** existem avaliações e resenhas
**When** abro `/`
**Then** vejo livros avaliados recentemente com capa, título, autor e média da aplicação quando disponível, além de resenhas recentes.

**Given** um livro ou resenha listado
**When** seleciono o item
**Then** chego à ficha correspondente.

**Given** ainda não existem dados da comunidade
**When** abro `/`
**Then** vejo um estado vazio simples e continuo podendo iniciar uma busca.

**Given** os itens da home
**When** são ordenados
**Then** apenas dados locais da aplicação determinam essa ordem; a busca do Google Books não é alterada.

## Epic 3: Registrar e organizar leituras

Uma pessoa autenticada consegue avaliar livros, escolher um único status compartilhado com sua estante e associar vibes, mantendo integridade e médias corretas.

### Story 3.1: Adicionar livros e organizar a estante

Como leitor autenticado,
quero adicionar livros à minha estante e organizá-los por status,
para acompanhar minhas leituras.

**Acceptance Criteria:**

**Given** um livro ainda não adotado localmente
**When** adiciono à estante
**Then** o livro é adotado pelo `externalId` único com snapshot de metadados e uma entrada `Shelf` é criada com status `Quero ler`, sem gravação parcial.

**Given** o livro já está na minha estante
**When** tento adicioná-lo novamente
**Then** a operação é idempotente e preserva o status atual.

**Given** uma entrada na estante
**When** altero seu status
**Then** o mesmo registro é atualizado para um dos quatro valores permitidos e seu `updatedAt` avança.

**Given** minha estante contém livros em diferentes estados
**When** abro `/estante`
**Then** vejo minhas entradas agrupadas por Quero ler, Lendo, Lido e Abandonei, com informações básicas do livro.

**Given** sou outro usuário ou não estou autenticado
**When** tento ler ou alterar uma estante privada
**Then** o banco nega o acesso conforme RLS; não existe ação para remover a entrada.

### Story 3.2: Avaliar e manter minha avaliação

Como leitor autenticado,
quero avaliar um livro e poder editar ou excluir minha avaliação,
para registrar minha opinião sem duplicar o status da estante.

**Acceptance Criteria:**

**Given** nota de 1 a 5 em incrementos de meia estrela, texto não vazio e status permitido
**When** salvo uma avaliação
**Then** `Review` e a entrada `Shelf` correspondente são criadas ou atualizadas juntos na mesma transação.

**Given** o livro ainda não existe localmente
**When** salvo avaliação
**Then** sua adoção por `externalId` e as alterações de avaliação/estante ocorrem atomicamente; uma falha não deixa gravações parciais.

**Given** já existe uma avaliação minha para o livro
**When** salvo outra avaliação
**Then** a mesma `Review` é atualizada, sem criar uma segunda avaliação ativa.

**Given** edito minha avaliação
**When** salvo as mudanças
**Then** `createdAt` permanece, `updatedAt` avança e o status escolhido atualiza a mesma entrada `Shelf`.

**Given** excluo minha avaliação
**When** confirmo a ação
**Then** só a `Review` é removida e a entrada/status da estante são preservados.

**Given** uma avaliação é criada, editada ou excluída
**When** livro ou perfil consultam médias
**Then** `AVG` considera as avaliações ativas da aplicação na leitura seguinte, sem cache separado.

**Given** outro usuário tenta alterar ou excluir minha avaliação
**When** a operação chega ao banco
**Then** RLS nega a operação.

### Story 3.3: Associar vibes a um livro

Como leitor autenticado,
quero associar vibes a um livro,
para expressar como o percebi e consultar essas tags na ficha.

**Acceptance Criteria:**

**Given** uma vibe não vazia para um livro
**When** a associo
**Then** o valor é normalizado para minúsculas e sem espaços externos e fica associado ao usuário e ao livro.

**Given** o livro ainda não foi adotado localmente
**When** associo uma vibe
**Then** adoção por `externalId` e gravação da vibe ocorrem atomicamente.

**Given** já associei a mesma vibe canônica ao mesmo livro
**When** tento associá-la novamente
**Then** não é criado um registro duplicado.

**Given** diferentes usuários associaram vibes ao livro
**When** a ficha pública é exibida
**Then** cada valor distinto aparece uma única vez.

**Given** outro usuário tenta gravar uma vibe em meu nome
**When** a operação chega ao banco
**Then** RLS nega a operação.

## Epic 4: Consultar perfis e atividade de leitura

Uma pessoa consegue consultar perfis e resenhas públicas, médias e leituras concluídas, sem expor a estante privada nem estados diferentes de Lido.

### Story 4.1: Consultar perfil e atividade pública

Como leitor,
quero consultar o perfil, as resenhas e as leituras concluídas de uma pessoa,
para conhecer sua atividade de leitura sem acessar sua estante privada.

**Acceptance Criteria:**

**Given** um perfil existente
**When** abro `/perfil/:id`
**Then** vejo nome e foto; sem foto, é exibido um avatar com as iniciais.

**Given** o perfil tem entradas `Shelf` em estado `Lido`
**When** consulto o perfil
**Then** vejo a contagem de livros concluídos e leituras recentes ordenadas pela última mudança de status.

**Given** consulto leituras recentes de outra pessoa
**When** os dados são retornados
**Then** a projeção contém somente perfil, livro e data; outros status e campos da estante permanecem inacessíveis.

**Given** o perfil tem avaliações ativas
**When** consulto a média
**Then** ela é derivada dessas avaliações e formatada com até duas casas decimais.

**Given** há resenhas públicas do usuário
**When** consulto o perfil
**Then** elas aparecem em ordem de criação mais recente.

**Given** uma consulta pública ao perfil
**When** ela é executada
**Then** RLS limita os dados ao conteúdo público definido e não expõe campos privados da estante.
