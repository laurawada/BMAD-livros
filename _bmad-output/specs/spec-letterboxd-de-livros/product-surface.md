# Superfície do Produto

## Rotas e conteúdo

| Rota | Conteúdo e ações |
|---|---|
| `/` | Livros populares ou avaliados recentemente, com capa, título, autor e nota média; busca; resenhas recentes. |
| `/buscar` | Pesquisa por título ou autor; resultados com capa, título, autor e nota média. Livros vêm de uma API externa de catálogo (ex.: Google Books). |
| `/livro/:id` | Capa, título, autor, gênero, sinopse, nota média, quantidade de avaliações, resenhas, ação para avaliar, ação para adicionar à estante e tags de vibes. |
| `/estante` | Livros do usuário organizados em Quero ler, Lendo, Lidos e Abandonei; cada item mostra capa e informações básicas. O status exibido é o mesmo status registrado na avaliação do livro (ver seção abaixo). |
| `/perfil/:id` | Nome, foto de perfil (URL ou avatar padrão), quantidade de livros lidos, média das avaliações do usuário, livros recentemente lidos e resenhas publicadas. |
| `/login` | Entrada na conta por e-mail e senha. |
| `/cadastro` | Criação de conta por e-mail e senha. |

## Avaliação e status

Para um livro, o usuário pode atribuir nota de 1 a 5 estrelas, escrever uma resenha textual e definir um status: **Quero ler**, **Lendo**, **Lido** ou **Abandonei**.

O status é um único valor por par usuário-livro: registrá-lo na avaliação é o mesmo que registrá-lo na estante — não há dois estados independentes. Alterar o status em um lugar reflete no outro.

O autor de uma resenha pode **editar** ou **excluir** o próprio texto e a própria nota após publicá-los. A nota média do livro é recalculada em tempo real sempre que uma avaliação é criada, editada ou removida.

## Vibes

Vibes são tags simples que o usuário escolhe para caracterizar um livro e que aparecem na ficha do livro. Exemplos do briefing: **Emocionante**, **Divertido**, **Triste**, **Confortável**, **Tenso**, **Viciante**, **Lento** e **Confuso**. A lista não foi declarada exaustiva.

## Autenticação

E-mail e senha, com senha armazenada como hash (ex.: bcrypt). Sem login social nesta versão.

## Imagens

Sem upload de arquivos no MVP. Capas de livros vêm prontas da API externa de catálogo. Foto de perfil é uma URL informada pelo usuário ou, na ausência dela, um avatar padrão (ex.: iniciais do nome).

## Direção visual

Interface moderna, minimalista e fácil de usar, com identidade própria. Usar capas como elemento visual principal, cards de livros, bordas arredondadas, espaçamento confortável, tipografia moderna, interface limpa e navegação simples. A referência são plataformas de avaliação de filmes, sem cópia direta do Letterboxd.

## Limites do MVP

Fora do escopo: chat, mensagens privadas, seguidores, uma rede social complexa, cadastro manual de livros, login social, upload de arquivos e qualquer funcionalidade não listada no briefing. Simplicidade e usabilidade têm prioridade sobre funcionalidades extras.