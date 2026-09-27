# Superfície do Produto

## Rotas e conteúdo

| Rota | Conteúdo e ações |
|---|---|
| `/` | Livros populares ou avaliados recentemente, com capa, título, autor e média das avaliações desta aplicação; busca; resenhas recentes. |
| `/buscar` | Pesquisa por título ou autor no Google Books; resultados preservam a ordem do provedor e mostram capa, título, autor e média da aplicação quando houver. Exibe atribuição e link proeminente para Google Books; pagina em grupos de 20. Falha ou quota exibe mensagem amigável inline; nova tentativa é manual. |
| `/livro/:id` | Capa, título, autor, gênero, sinopse, média e quantidade de avaliações desta aplicação, resenhas, ações de avaliação e estante e tags de vibes. Resolve UUID local ou ID externo do Google Books; se a consulta ao provedor falhar, usa dados locais já persistidos quando disponíveis. |
| `/estante` | Entradas do usuário organizadas em Quero ler, Lendo, Lidos e Abandonei; cada item mostra capa e informações básicas. Adicionar sem avaliar cria Quero ler; a entrada pode mudar de status, mas não ser removida no MVP. |
| `/perfil/:id` | Nome, foto de perfil (URL ou avatar padrão), contagem de livros com status Lido, média das avaliações ativas do usuário, leituras Lido recentes e resenhas públicas. Leituras recentes de terceiros mostram somente livro e data de conclusão. |
| `/login` | Entrada na conta por e-mail e senha. |
| `/cadastro` | Criação de conta com nome, e-mail e senha via Supabase Auth e perfil associado. |

## Avaliação e status

Uma avaliação exige nota de 1 a 5 em incrementos de meia estrela, resenha textual não vazia e escolha explícita de status: **Quero ler**, **Lendo**, **Lido** ou **Abandonei**.

O status é um único valor por par usuário-livro e vive na entrada `Shelf`: registrá-lo na avaliação é o mesmo que registrá-lo na estante. Adicionar à estante sem avaliar cria **Quero ler**; repetir a ação não altera o status existente. Alterar o status em qualquer fluxo atualiza a mesma entrada. Remover a entrada está fora do MVP.

O autor pode **editar** ou **excluir** a própria avaliação. Excluir uma avaliação preserva a entrada e o status da estante. A média de livro e a média do perfil são derivadas das avaliações ativas da aplicação e refletem a próxima leitura após criação, edição ou exclusão.

## Vibes

Vibes são tags simples que o usuário escolhe para caracterizar um livro e que aparecem na ficha do livro. Exemplos do briefing: **Emocionante**, **Divertido**, **Triste**, **Confortável**, **Tenso**, **Viciante**, **Lento** e **Confuso**. A lista é extensível; cada valor é normalizado para minúsculas e espaços externos removidos, e aparece uma vez por livro.

## Autenticação

Cadastro e login por e-mail e senha via Supabase Auth, sem login social. O cadastro cria perfil com nome obrigatório; o perfil usa o UUID de Auth, e credenciais não são duplicadas na tabela `User`.

## Imagens

Sem upload de arquivos no MVP. Capas vêm do Google Books. Foto de perfil é uma URL informada pelo usuário ou, na ausência dela, um avatar padrão (ex.: iniciais do nome).

## Catálogo e visibilidade

Google Books é a única autoridade de busca; a consulta ocorre no servidor, preserva ordem e paginação do provedor, e resultados de busca não são persistidos. A primeira gravação de estante, avaliação ou vibe adota o livro por ID externo único com snapshot dos metadados; buscas posteriores não sobrescrevem esse snapshot. Apenas abrir detalhes lidos diretamente do provedor não força persistência. Nenhuma média do Google Books é importada para as médias da aplicação.

Estantes e status completos são privados. Outras pessoas podem ver somente leituras com status **Lido**, em projeção limitada a livro e data da última mudança de status. Páginas de livros, resenhas, vibes e nome/foto do perfil são públicos conforme as políticas de acesso.

Falhas ou quota na busca mostram mensagem simples e amigável nesta página, sem tela de erro genérica nem crash. Não há retry automático: o usuário decide quando submeter outra busca. Google Books permanece a única fonte; não há fallback para outro catálogo no MVP.

Na página `/livro/:id`, se o provedor não retornar detalhes, usar o snapshot local quando o livro já tiver sido adotado (por entrada de estante, avaliação ou vibe). Se não houver registro local e o provedor estiver indisponível, mostrar erro simples sem crash.

## Direção visual

Interface moderna, minimalista e fácil de usar, com identidade própria. Usar capas como elemento visual principal, cards de livros, bordas arredondadas, espaçamento confortável, tipografia moderna, interface limpa e navegação simples. A referência são plataformas de avaliação de filmes, sem cópia direta do Letterboxd.

## Limites do MVP

Fora do escopo: chat, mensagens privadas, seguidores, uma rede social complexa, cadastro manual de livros, login social, upload de arquivos e qualquer funcionalidade não listada no briefing. Simplicidade e usabilidade têm prioridade sobre funcionalidades extras.