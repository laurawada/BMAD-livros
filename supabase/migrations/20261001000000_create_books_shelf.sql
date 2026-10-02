create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table public.books (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  title text not null,
  author text not null,
  cover_url text,
  genre text,
  description text,
  created_at timestamptz not null default now(),
  constraint books_external_id_unique unique (external_id),
  constraint books_external_id_not_blank check (length(btrim(external_id)) > 0),
  constraint books_external_id_length check (char_length(external_id) <= 255),
  constraint books_title_not_blank check (length(btrim(title)) > 0),
  constraint books_title_length check (char_length(title) <= 500),
  constraint books_author_not_blank check (length(btrim(author)) > 0),
  constraint books_author_length check (char_length(author) <= 1000),
  constraint books_cover_url_length check (cover_url is null or char_length(cover_url) <= 2048),
  constraint books_genre_length check (genre is null or char_length(genre) <= 255),
  constraint books_description_length check (
    description is null or char_length(description) <= 10000
  )
);

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  status text not null default 'Quero ler',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shelves_user_book_unique unique (user_id, book_id),
  constraint shelves_status_valid check (
    status in ('Quero ler', 'Lendo', 'Lido', 'Abandonei')
  )
);

create index shelves_user_updated_at_idx
  on public.shelves (user_id, updated_at desc);

alter table public.books enable row level security;
alter table public.books force row level security;
alter table public.shelves enable row level security;
alter table public.shelves force row level security;

grant usage on schema public to anon, authenticated;
create schema if not exists private;
grant usage on schema private to authenticated;
revoke all privileges on table public.books, public.shelves
  from public, anon, authenticated;
grant select on public.books to anon, authenticated;
grant insert (external_id, title, author, cover_url, genre, description)
  on public.books to authenticated;
grant select on public.shelves to authenticated;
grant insert (user_id, book_id, status) on public.shelves to authenticated;
grant update (status) on public.shelves to authenticated;

create function private.verify_shelf_snapshot_signature(
  p_payload text,
  p_signature text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select encode(
      extensions.hmac(
        convert_to(p_payload, 'UTF8'),
        convert_to(secret.decrypted_secret, 'UTF8'),
        'sha256'
      ),
      'hex'
    ) = p_signature
    from vault.decrypted_secrets as secret
    where secret.name = 'shelf_snapshot_secret'
    limit 1
  ), false);
$$;

revoke all on function private.verify_shelf_snapshot_signature(text, text)
  from public, anon;
grant execute on function private.verify_shelf_snapshot_signature(text, text)
  to authenticated;

create policy books_read_public
  on public.books for select
  to anon, authenticated
  using (true);

create policy books_insert_authenticated
  on public.books for insert
  to authenticated
  with check (
    auth.uid() is not null
    and current_setting('app.shelf_write', true) = 'on'
    and private.verify_shelf_snapshot_signature(
      current_setting('app.shelf_snapshot_payload', true),
      current_setting('app.shelf_snapshot_signature', true)
    )
    and nullif(current_setting('app.shelf_snapshot_payload', true), '')::jsonb =
      jsonb_build_object(
        'externalId', external_id,
        'title', title,
        'author', author,
        'coverUrl', cover_url,
        'genre', genre,
        'description', description
      )
  );

create policy shelves_read_owner
  on public.shelves for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy shelves_insert_owner
  on public.shelves for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and current_setting('app.shelf_write', true) = 'on'
    and status = 'Quero ler'
    and private.verify_shelf_snapshot_signature(
      current_setting('app.shelf_snapshot_payload', true),
      current_setting('app.shelf_snapshot_signature', true)
    )
    and book_id::text = nullif(current_setting('app.shelf_book_id', true), '')
    and exists (
      select 1
      from public.books
      where public.books.id = book_id
        and public.books.external_id = (
          nullif(current_setting('app.shelf_snapshot_payload', true), '')::jsonb
          ->> 'externalId'
        )
    )
  );

create policy shelves_update_owner
  on public.shelves for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function public.update_shelf_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;

create trigger shelves_set_updated_at
  before update on public.shelves
  for each row execute function public.update_shelf_timestamp();

create function public.add_book_to_shelf(
  p_external_id text,
  p_title text,
  p_author text,
  p_snapshot_payload text,
  p_snapshot_signature text,
  p_cover_url text default null,
  p_genre text default null,
  p_description text default null
)
returns table (
  id uuid,
  book_id uuid,
  status text,
  updated_at timestamptz,
  external_id text,
  title text,
  author text,
  cover_url text,
  genre text,
  description text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_book_id uuid;
  v_shelf_id uuid;
  v_previous_write_context text := coalesce(
    current_setting('app.shelf_write', true),
    ''
  );
  v_previous_snapshot_payload text := coalesce(
    current_setting('app.shelf_snapshot_payload', true),
    ''
  );
  v_previous_snapshot_signature text := coalesce(
    current_setting('app.shelf_snapshot_signature', true),
    ''
  );
  v_previous_shelf_book_id text := coalesce(
    current_setting('app.shelf_book_id', true),
    ''
  );
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_snapshot_payload::jsonb is distinct from jsonb_build_object(
    'externalId', p_external_id,
    'title', p_title,
    'author', p_author,
    'coverUrl', p_cover_url,
    'genre', p_genre,
    'description', p_description
  ) or not private.verify_shelf_snapshot_signature(
    p_snapshot_payload,
    p_snapshot_signature
  ) then
    raise exception using errcode = '42501', message = 'Invalid book snapshot signature';
  end if;

  perform set_config('app.shelf_write', 'on', true);
  perform set_config('app.shelf_snapshot_payload', p_snapshot_payload, true);
  perform set_config('app.shelf_snapshot_signature', p_snapshot_signature, true);

  insert into public.books (external_id, title, author, cover_url, genre, description)
  values (p_external_id, p_title, p_author, p_cover_url, p_genre, p_description)
  on conflict on constraint books_external_id_unique do nothing
  returning books.id into v_book_id;

  if v_book_id is null then
    select books.id
      into v_book_id
      from public.books
      where books.external_id = p_external_id;
  end if;

  perform set_config('app.shelf_book_id', v_book_id::text, true);

  insert into public.shelves (user_id, book_id, status)
  values (v_user_id, v_book_id, 'Quero ler')
  on conflict on constraint shelves_user_book_unique do nothing
  returning shelves.id into v_shelf_id;

  if v_shelf_id is null then
    select shelves.id
      into v_shelf_id
      from public.shelves
      where shelves.user_id = v_user_id
        and shelves.book_id = v_book_id;
  end if;

  return query
    select shelves.id, shelves.book_id, shelves.status, shelves.updated_at,
      books.external_id, books.title, books.author, books.cover_url,
      books.genre, books.description
    from public.shelves
    join public.books on books.id = shelves.book_id
    where shelves.id = v_shelf_id;

  perform set_config('app.shelf_write', v_previous_write_context, true);
  perform set_config('app.shelf_snapshot_payload', v_previous_snapshot_payload, true);
  perform set_config('app.shelf_snapshot_signature', v_previous_snapshot_signature, true);
  perform set_config('app.shelf_book_id', v_previous_shelf_book_id, true);
end;
$$;

revoke all on function public.add_book_to_shelf(
  text, text, text, text, text, text, text, text
)
  from public, anon, authenticated;
grant execute on function public.add_book_to_shelf(
  text, text, text, text, text, text, text, text
)
  to authenticated;