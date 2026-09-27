# Modelo de Dados Proposto

Modelo alinhado às decisões registradas em `ARCHITECTURE-SPINE.md`. Substitui a versão anterior, que ainda continha `email`/`passwordHash` em `User` — conflito já resolvido abaixo.

| Entidade | Campos propostos | Notas |
|---|---|---|
| `User` | `id`, `name`, `profileImageUrl` | `id` é o mesmo UUID do usuário no Supabase Auth (chave estrangeira/espelho de `auth.users.id`). Credenciais (e-mail, senha) vivem exclusivamente no Supabase Auth — não são duplicadas nesta tabela. `profileImageUrl` é opcional; sem valor, a UI usa um avatar padrão. |
| `Book` | `id`, `externalId`, `title`, `author`, `coverUrl`, `genre`, `description` | `externalId` referencia o identificador do livro no Google Books. Metadados só são persistidos aqui no momento em que o usuário adiciona o livro à estante, avalia ou marca uma vibe — não há cache antecipado de resultados de busca. Sem índice textual local no MVP; a busca em si é sempre delegada ao Google Books. |
| `Review` | `id`, `userId`, `bookId`, `rating`, `text`, `createdAt`, `updatedAt` | `rating` aceita incrementos de meia estrela, de 1 a 5 (ex.: 1, 1.5, 2 ... 5), com validação no banco. Não carrega status de leitura — o status vive em `Shelf`. `updatedAt` suporta edição da resenha pelo autor. |
| `Shelf` | `id`, `userId`, `bookId`, `status`, `updatedAt` | Fonte única do status de leitura (Quero ler / Lendo / Lido / Abandonei). Ao adicionar um livro sem avaliar, o status inicial é `Quero ler`. O status definido durante uma avaliação escreve neste mesmo registro. |
| `BookVibe` | `id`, `userId`, `bookId`, `vibe` | Lista de vibes não é fechada; tratar como valor livre ou enum extensível na implementação. |

## Relações principais

- `User.id` corresponde ao `id` do usuário autenticado no Supabase Auth — não existe cadastro de credenciais paralelo.
- Um `User` tem muitas `Review`, muitos `Shelf` e muitas `BookVibe`.
- Um `Book` tem muitas `Review`, aparece em muitos `Shelf` e recebe muitas `BookVibe`.
- Para um par `(userId, bookId)`, no máximo um registro em `Shelf` (status atual) e no máximo uma `Review` ativa.
- Nota média de livro e nota média de usuário (exibida no perfil) são **derivadas** das avaliações existentes — não são campos armazenados e recalculados manualmente, e sim calculadas a partir de `Review`.

## Acesso e visibilidade

- Conteúdo de descoberta (livros, resenhas públicas, notas médias) é público.
- `Shelf` (estante e status) é privado por padrão — **exceto** entradas com status `Lido`, que ficam visíveis como atividade recente do usuário (com projeção restrita: não expõe todos os campos de `Shelf`, só o necessário para o card de atividade — ex.: livro e data, sem expor histórico completo de mudanças de status).

## Resolvido nesta versão

- Conflito entre `data-model.md` e `ARCHITECTURE-SPINE.md` quanto a `email`/`passwordHash`: removido de `User`; autenticação delegada ao Supabase Auth.
- Precisão do `rating`: meia estrela, 1 a 5.
- Comportamento padrão de `Shelf.status` ao adicionar sem avaliar: `Quero ler`.
- Momento de persistência de `Book`: só ao interagir (adicionar/avaliar/vibe), não ao buscar.