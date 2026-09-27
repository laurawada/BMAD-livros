---
id: SPEC-letterboxd-de-livros
companions:
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
  - **success:** A página inicial apresenta livros populares ou avaliados recentemente e resenhas recentes; a busca encontra por título ou autor; cada resultado permite abrir a ficha correspondente.
- **CAP-2**
  - **intent:** Registrar para um livro uma nota, uma resenha textual e um status de leitura.
  - **success:** O usuário consegue salvar uma nota de 1 a 5 estrelas, texto de resenha e um dos status definidos no companion de produto; consegue editar ou excluir a própria resenha depois de publicada.
- **CAP-3**
  - **intent:** Organizar os livros pessoais por status de leitura.
  - **success:** Os livros adicionados à estante aparecem agrupados pelo status escolhido e com capa e informações básicas; o status é o mesmo valor registrado na avaliação (CAP-2), sem duplicação de estado.
- **CAP-4**
  - **intent:** Associar vibes a livros e consultá-las na ficha do livro.
  - **success:** Vibes selecionadas pelo usuário são apresentadas como tags na ficha correspondente.
- **CAP-5**
  - **intent:** Consultar o perfil e a atividade de leitura de um usuário.
  - **success:** O perfil apresenta nome, foto, quantidade de livros lidos, média das avaliações do usuário, leituras recentes e resenhas publicadas.
- **CAP-6**
  - **intent:** Criar uma conta e autenticar-se por e-mail e senha para acessar as funções pessoais.
  - **success:** Uma pessoa consegue cadastrar-se e entrar pelas páginas de cadastro e login usando e-mail e senha.

## Decisions

Decisões de MVP tomadas para fechar as perguntas em aberto da versão anterior desta spec, priorizando o menor caminho até o fluxo central (encontrar → avaliar → guardar na estante):

- **Catálogo de livros:** alimentado por API externa (Google Books API). Sem cadastro manual de livros no MVP.
- **Autenticação:** e-mail e senha, com hash de senha (ex.: bcrypt). Sem login social nesta versão.
- **Imagens:** apenas URLs externas — capas vêm da API de livros; foto de perfil é uma URL informada pelo usuário ou um avatar padrão. Sem upload de arquivo no MVP.
- **Resenhas:** o autor pode editar e excluir a própria resenha após publicá-la.
- **Nota média:** recalculada em tempo real a cada avaliação nova, editada ou removida.
- **Status de leitura:** unificado — o status informado na avaliação (CAP-2) é o mesmo status exibido na estante (CAP-3); não existem dois estados paralelos para a mesma relação usuário-livro.
- **Stack/hospedagem:** a definir na fase de arquitetura; não é uma restrição de produto.

## Constraints

- Tratar o produto como MVP: priorizar simplicidade e usabilidade e não ampliar o escopo além das funcionalidades descritas.
- Manter identidade visual própria; a inspiração em plataformas de avaliação de filmes não autoriza copiar diretamente o Letterboxd.
- Priorizar poucos passos no fluxo central de encontrar um livro, avaliá-lo e adicioná-lo à estante.
- Não implementar upload de arquivos nem login social nesta versão (ver Decisions).

## Non-goals

- Chat ou mensagens privadas.
- Sistema de seguidores.
- Uma rede social complexa.
- Cadastro manual de livros pela equipe.
- Login social / OAuth.
- Upload de imagens (capas ou foto de perfil).
- Funcionalidades não listadas no briefing.

## Success signal

Em uma demonstração com uma conta autenticada e um livro disponível no catálogo, a pessoa consegue encontrá-lo, abrir sua ficha, registrar nota, resenha e status, e localizar o livro no grupo correspondente da estante — refletindo o mesmo status registrado na avaliação. As rotas e os conteúdos esperados estão detalhados em `product-surface.md`.

## Open Questions

Nenhuma pergunta em aberto no momento. Decisões registradas em `Decisions` acima. A definição de stack/hospedagem fica para a fase de arquitetura.