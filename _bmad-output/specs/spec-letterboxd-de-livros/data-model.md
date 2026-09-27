# Modelo de Dados Proposto

Modelo alinhado às decisões de `ARCHITECTURE-SPINE.md`; este companion detalha a forma dos dados, enquanto o spine define as invariantes de transação, autorização e acesso.

| Entidade | Campos propostos | Notas |
|---|---|---|
| `User` | `id`, `name`, `profileImageUrl` | `id` é o UUID de `auth.users.id`; `name` é obrigatório e `profileImageUrl` opcional. Credenciais vivem exclusivamente no Supabase Auth. |
| `Book` | `id`, `externalId`, `title`, `author`, `coverUrl`, `genre`, `description` | UUID local; `externalId` é texto obrigatório e único com o ID do volume Google Books. `title` e `author` são obrigatórios; se o provedor não informar autor, usar `Autor desconhecido`. Campos restantes podem ser nulos. Metadados são um snapshot na primeira adoção; buscas não persistem nem sobrescrevem dados existentes. |
| `Review` | `id`, `userId`, `bookId`, `rating`, `text`, `createdAt`, `updatedAt` | UUID; `rating` é `NUMERIC NOT NULL` exato, entre 1.0 e 5.0 em incrementos de 0.5; `text` é não vazio. Não contém status. `createdAt` e `updatedAt` são `timestamptz`; edição preserva `createdAt` e avança `updatedAt`. |
| `Shelf` | `id`, `userId`, `bookId`, `status`, `updatedAt` | UUID; fonte única do status (`Quero ler`, `Lendo`, `Lido`, `Abandonei`). Único por usuário/livro. Adição sem avaliação cria `Quero ler`; avaliação exige status explícito e atualiza esta entrada. `updatedAt` é `timestamptz` e avança em cada transição. Não há remoção no MVP. |
| `BookVibe` | `id`, `userId`, `bookId`, `vibe` | UUID; texto canônico não vazio em minúsculas e sem espaços externos. Único por usuário/livro/vibe; cada valor distinto é renderizado uma vez por livro. |

## Relações principais

- `User.id` corresponde ao `id` do usuário autenticado no Supabase Auth — não existe cadastro de credenciais paralelo.
- Um `User` tem muitas `Review`, muitos `Shelf` e muitas `BookVibe`.
- Um `Book` tem muitas `Review`, aparece em muitos `Shelf` e recebe muitas `BookVibe`.
- Para um par `(userId, bookId)`, há no máximo um registro `Shelf` e uma `Review` ativa; `(userId, bookId, vibe)` também é único.
- Médias de livro e usuário são derivadas de `AVG(Review.rating)` das avaliações ativas; não são armazenadas. A média de usuário usa suas próprias avaliações.
- Uma avaliação nova/escrita de vibe/adicionada à estante adota o livro atomicamente por `externalId` único; depois da adoção, operações internas usam o UUID local. A exclusão de avaliação mantém `Shelf`.

## Acesso e visibilidade

- Conteúdo de descoberta (livros, resenhas públicas, notas médias) é público.
- `Shelf` (estante e status) é privado: o dono lê todas as próprias entradas; terceiros não leem entradas diretamente. Uma projeção pública separada expõe apenas perfil, livro e `updatedAt` para status `Lido`, ordenada por `updatedAt DESC, id DESC`; `updatedAt` marca a última transição de status.
- Livros, resenhas, vibes e nome/foto do perfil são públicos conforme RLS. Operações de escrita exigem autenticação e propriedade.

## Resolvido nesta versão

- `rating` exige precisão de meia estrela, entre 1 e 5, sem arredondamento silencioso; texto da avaliação é obrigatório e não vazio.
- `Shelf.status` é compartilhado entre avaliação e estante; adição sem avaliação inicia em `Quero ler`, é idempotente e não permite remover a entrada no MVP.
- `Book` tem `externalId` único; detalhe de provedor não persiste por si só. A primeira interação adota um snapshot e buscas posteriores não o sobrescrevem.
- Médias são derivadas das avaliações desta aplicação; nenhum rating do Google Books participa dos agregados.