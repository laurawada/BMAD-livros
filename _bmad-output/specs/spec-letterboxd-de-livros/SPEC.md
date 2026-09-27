---
id: SPEC-letterboxd-de-livros
companions:
  - ../../planning-artifacts/architecture/architecture-Projeto teste-2026-09-27/ARCHITECTURE-SPINE.md
  - product-surface.md
  - data-model.md
sources: []
---

> Contrato canônico do produto. Este SPEC e os arquivos em `companions:` definem o que construir, testar e validar.

# Letterboxd de Livros

## Why

Visão a realizar: oferecer a leitores um diário de leitura, uma estante pessoal e um espaço simples para avaliar livros e descobri-los pelas resenhas de outras pessoas.

## Capabilities

- **CAP-1**
  - **intent:** Descobrir e inspecionar livros por meio da página inicial, busca por título ou autor e ficha do livro.
  - **success:** A página inicial apresenta livros populares ou avaliados recentemente e resenhas recentes; a busca encontra por título ou autor, preserva os resultados do catálogo e permite abrir cada ficha. Médias exibidas refletem apenas avaliações desta aplicação. Indisponibilidade ou quota exibe erro amigável na busca, sem crash; a nova tentativa é manual.
- **CAP-2**
  - **intent:** Avaliar um livro por meio de uma nota e resenha, associando-o a um status de leitura.
  - **success:** Uma avaliação salva exige texto não vazio e nota de 1 a 5 em incrementos de meia estrela; o status explicitamente escolhido é refletido na única entrada da estante. O autor pode editar ou excluir sua avaliação, e a exclusão preserva o status da estante.
- **CAP-3**
  - **intent:** Organizar os livros pessoais por status de leitura.
  - **success:** Os livros aparecem agrupados em Quero ler, Lendo, Lidos e Abandonei; adicionar sem avaliar cria Quero ler, e a mesma entrada/status é usada pela avaliação (CAP-2). A entrada não pode ser removida no MVP; o usuário pode mudar seu status.
- **CAP-4**
  - **intent:** Associar vibes a livros e consultá-las na ficha do livro.
  - **success:** Vibes escolhidas são armazenadas como valores canônicos não vazios e cada valor distinto aparece uma vez como tag na ficha do livro.
- **CAP-5**
  - **intent:** Consultar o perfil e a atividade de leitura de um usuário.
  - **success:** O perfil apresenta nome, foto ou avatar padrão, contagem de entradas Lido, média derivada das avaliações ativas do usuário, leituras concluídas recentes e resenhas públicas. Leituras recentes de terceiros expõem somente livro e data de conclusão, não a estante completa.
- **CAP-6**
  - **intent:** Criar uma conta e autenticar-se por e-mail e senha para acessar as funções pessoais.
  - **success:** Uma pessoa consegue cadastrar-se com nome, e-mail e senha e entrar por e-mail e senha; a identidade é fornecida pelo provedor de autenticação e credenciais não são duplicadas no perfil.

## Decisions

Decisões de MVP tomadas para fechar as perguntas em aberto da versão anterior desta spec, priorizando o menor caminho até o fluxo central (encontrar → avaliar → guardar na estante):

- **Catálogo de livros:** Google Books API é a autoridade única de busca. Resultados de busca não são persistidos; a primeira interação adota o livro com snapshot de metadados. Falhas/quota mostram erro amigável inline; nova tentativa é manual, sem retry automático ou segundo provedor. Em `/livro/:id`, use snapshot local se o provedor falhar; sem registro local, mostre erro simples. Sem cadastro manual no MVP.
- **Autenticação:** e-mail e senha via Supabase Auth. O perfil usa o UUID de Auth e não duplica credenciais. Sem login social nesta versão.
- **Imagens:** apenas URLs externas — capas vêm da API de livros; foto de perfil é uma URL informada pelo usuário ou um avatar padrão. Sem upload de arquivo no MVP.
- **Avaliações:** exigem nota de meia estrela entre 1 e 5 e texto não vazio; o autor pode editar ou excluir a própria avaliação. Médias de livro e usuário são derivadas das avaliações ativas desta aplicação.
- **Status de leitura:** vive somente em `Shelf`; a avaliação escreve na mesma entrada, enquanto adicionar sem avaliar cria `Quero ler`. Remover uma entrada da estante está fora do MVP.
- **Privacidade:** estantes e status completos são privados; somente leituras `Lido` são expostas como atividade recente em projeção restrita. Livros, resenhas, vibes e nome/foto do perfil são públicos conforme as políticas de acesso.
- **Arquitetura e implantação:** decisões técnicas estão no companion `ARCHITECTURE-SPINE.md`; o stack selecionado é limitado a protótipo não comercial até reavaliação dos termos dos provedores.

## Constraints

- Tratar o produto como MVP: priorizar simplicidade e usabilidade e não ampliar o escopo além das funcionalidades descritas.
- Manter identidade visual própria; a inspiração em plataformas de avaliação de filmes não autoriza copiar diretamente o Letterboxd.
- Priorizar poucos passos no fluxo central de encontrar um livro, avaliá-lo e adicioná-lo à estante.
- Não implementar upload de arquivos nem login social nesta versão (ver Decisions).
- Não permitir remoção de uma entrada da estante; mudanças de status preservam a entrada.
- Não importar avaliações do Google Books para as médias da aplicação.

## Non-goals

- Chat ou mensagens privadas.
- Sistema de seguidores.
- Uma rede social complexa.
- Cadastro manual de livros pela equipe.
- Login social / OAuth.
- Upload de imagens (capas ou foto de perfil).
- Funcionalidades não listadas no briefing.

## Success signal

Em uma demonstração com uma conta autenticada e um livro disponível no catálogo, a pessoa consegue encontrá-lo, abrir sua ficha, registrar avaliação e status, e localizar o livro no grupo correspondente da estante sem divergência de estado. Rotas e modelo de dados estão em `product-surface.md` e `data-model.md`; decisões arquiteturais estão em `ARCHITECTURE-SPINE.md`.

## Open Questions

Nenhuma pergunta em aberto.

