-- Public reading model required by Epic 2. Write access is limited by RLS.
create table public.books (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  title text not null,
  author text not null default 'Autor desconhecido',
  cover_url text,
  genre text,
  description text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  rating numeric not null check (rating >= 1 and rating <= 5 and mod(rating, 0.5) = 0),
  text text not null check (length(btrim(text)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_user_book_unique unique (user_id, book_id)
);

create table public.book_vibes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  vibe text not null check (length(vibe) > 0 and vibe = lower(vibe) and vibe = btrim(vibe)),
  created_at timestamptz not null default now(),
  constraint book_vibes_user_book_vibe_unique unique (user_id, book_id, vibe)
);

create index reviews_book_created_idx on public.reviews (book_id, created_at desc);
create index book_vibes_book_vibe_idx on public.book_vibes (book_id, vibe);

alter table public.books enable row level security;
alter table public.reviews enable row level security;
alter table public.book_vibes enable row level security;

create policy "books are readable by everyone"
  on public.books for select to anon, authenticated using (true);
create policy "authenticated users can adopt books"
  on public.books for insert to authenticated with check (auth.uid() is not null);

create policy "reviews are public"
  on public.reviews for select to anon, authenticated using (true);
create policy "users create their own reviews"
  on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "users update their own reviews"
  on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete their own reviews"
  on public.reviews for delete to authenticated using (auth.uid() = user_id);

create policy "book vibes are public"
  on public.book_vibes for select to anon, authenticated using (true);
create policy "users create their own book vibes"
  on public.book_vibes for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete their own book vibes"
  on public.book_vibes for delete to authenticated using (auth.uid() = user_id);

grant select on public.books, public.reviews, public.book_vibes to anon, authenticated;
grant insert on public.books to authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant insert, delete on public.book_vibes to authenticated;

create or replace function public.set_review_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_review_updated_at();

create view public.book_discovery_feed
with (security_invoker = true)
as
select
  b.id as book_id,
  b.external_id,
  b.title,
  b.author,
  b.cover_url,
  b.genre,
  b.description,
  avg(r.rating) as average_rating,
  count(r.id)::integer as review_count,
  max(r.updated_at) as last_review_at
from public.books b
left join public.reviews r on r.book_id = b.id
group by b.id;

grant select on public.book_discovery_feed to anon, authenticated;
