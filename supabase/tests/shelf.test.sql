begin;

select plan(24);

select vault.create_secret(
  'story-3-1-local-only-test-secret-32-bytes-minimum',
  'shelf_snapshot_secret',
  'Temporary signing key for the local Story 3.1 pgTAP transaction',
  null
);

create function public.test_shelf_snapshot_signature(p_payload text)
returns text
language sql
security definer
set search_path = ''
as $$
  select encode(
    extensions.hmac(
      convert_to(p_payload, 'UTF8'),
      convert_to(secret.decrypted_secret, 'UTF8'),
      'sha256'
    ),
    'hex'
  )
  from vault.decrypted_secrets as secret
  where secret.name = 'shelf_snapshot_secret'
  limit 1;
$$;

create function public.test_add_book_to_shelf(
  p_external_id text,
  p_title text,
  p_author text,
  p_cover_url text,
  p_genre text,
  p_description text
)
returns table (status text, title text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_payload text := json_build_object(
    'externalId', p_external_id,
    'title', p_title,
    'author', p_author,
    'coverUrl', p_cover_url,
    'genre', p_genre,
    'description', p_description
  )::text;
begin
  return query
    select adopted.status, adopted.title
    from public.add_book_to_shelf(
      p_external_id,
      p_title,
      p_author,
      v_payload,
      public.test_shelf_snapshot_signature(v_payload),
      p_cover_url,
      p_genre,
      p_description
    ) as adopted;
end;
$$;

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'shelf-owner-a@example.test', '',
    now(), now(), '{"provider":"email","providers":["email"]}', '{}'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'shelf-owner-b@example.test', '',
    now(), now(), '{"provider":"email","providers":["email"]}', '{}'
  );

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select throws_ok(
  $$select * from public.add_book_to_shelf(
    'google-forged', 'Forged title', 'Untrusted author',
    '{"externalId":"google-forged"}', repeat('0', 64), null, null, null
  )$$,
  '42501',
  null,
  'authenticated callers cannot invoke adoption with a forged snapshot signature'
);

select throws_ok(
  $$select * from public.add_book_to_shelf(
    'changed-external-id', 'Signed title', 'Signed author',
    '{"externalId":"signed-external-id","title":"Signed title","author":"Signed author","coverUrl":null,"genre":null,"description":null}',
    public.test_shelf_snapshot_signature('{"externalId":"signed-external-id","title":"Signed title","author":"Signed author","coverUrl":null,"genre":null,"description":null}'),
    null, null, null
  )$$,
  '42501',
  null,
  'a valid signature cannot be reused with altered RPC book parameters'
);

select is(
  (select status from public.test_add_book_to_shelf(
    'google-volume-1', 'Original title', 'Original author', null, 'Fiction', null
  )),
  'Quero ler',
  'first adoption creates a Quero ler shelf entry'
);

select throws_ok(
  $$insert into public.books (external_id, title, author)
    values ('google-direct', 'Direct insert', 'Untrusted client')$$,
  '42501',
  null,
  'authenticated clients cannot insert book snapshots outside the adoption RPC'
);

select throws_ok(
  $$insert into public.shelves (user_id, book_id, status)
    select auth.uid(), id, 'Lido'
    from public.books where external_id = 'google-volume-1'$$,
  '42501',
  null,
  'authenticated clients cannot bypass atomic adoption with a direct shelf insert'
);

select set_config('app.shelf_write', 'on', true);
select set_config('app.shelf_snapshot_payload', '{}', true);
select set_config('app.shelf_snapshot_signature', repeat('0', 64), true);

select throws_ok(
  $$insert into public.books (external_id, title, author)
    values ('google-forged', 'Forged title', 'Untrusted client')$$,
  '42501',
  null,
  'a forged transaction context cannot authorize a Book insert'
);

select throws_ok(
  $$insert into public.shelves (user_id, book_id, status)
    select auth.uid(), books.id, 'Quero ler'
    from public.books where books.external_id = 'google-volume-1'$$,
  '42501',
  null,
  'a forged transaction context cannot authorize a Shelf insert'
);

select set_config('app.shelf_write', '', true);
select set_config('app.shelf_snapshot_payload', '', true);
select set_config('app.shelf_snapshot_signature', '', true);

select is(
  (select count(*)::integer from public.shelves),
  1,
  'the owner can read the new shelf entry'
);

select is(
  (select title from public.test_add_book_to_shelf(
    'google-volume-1', 'Changed title', 'Changed author', null, null, null
  )),
  'Original title',
  'repeated adoption does not overwrite the book snapshot'
);

select is(
  (select status from public.test_add_book_to_shelf(
    'google-volume-1', 'Changed title', 'Changed author', null, null, null
  )),
  'Quero ler',
  'repeated adoption preserves the existing shelf status'
);

select is(
  (select count(*)::integer from public.shelves),
  1,
  'repeated adoption does not create a duplicate shelf row'
);

update public.shelves
set status = 'Lendo'
where user_id = '10000000-0000-4000-8000-000000000001';

select is(
  (select status from public.shelves),
  'Lendo',
  'the owner can change the status on the existing row'
);

select ok(
  (select updated_at > created_at from public.shelves),
  'a status transition advances updated_at'
);

select throws_ok(
  $$update public.shelves set status = 'Removed'$$,
  '23514',
  null,
  'invalid shelf status is rejected by the database'
);

select throws_ok(
  $$select * from public.test_add_book_to_shelf(
    'google-invalid', '', 'Author', null, null, null
  )$$,
  '23514',
  null,
  'invalid book snapshot aborts adoption'
);

select throws_ok(
  $$select * from public.test_add_book_to_shelf(
    'google-too-long-title', repeat('x', 501), 'Author', null, null, null
  )$$,
  '23514',
  null,
  'book title length is bounded by the database'
);

select is(
  (select count(*)::integer from public.books where external_id = 'google-invalid'),
  0,
  'failed adoption leaves no partial book row'
);

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true
);

select is(
  (select count(*)::integer from public.shelves),
  0,
  'another authenticated user cannot read the private shelf'
);

with changed as (
  update public.shelves
  set status = 'Lido'
  where user_id = '10000000-0000-4000-8000-000000000001'
  returning id
)
select is(
  (select count(*)::integer from changed),
  0,
  'another authenticated user cannot mutate the private shelf'
);

select is(
  (select status from public.test_add_book_to_shelf(
    'google-volume-1', 'Changed title', 'Changed author', null, null, null
  )),
  'Quero ler',
  'the same book can have a separate shelf entry for another user'
);

select set_config('app.shelf_write', 'on', true);
select set_config(
  'app.shelf_book_id',
  (select id::text from public.books where external_id = 'google-volume-1'),
  true
);
select set_config(
  'app.shelf_snapshot_payload',
  json_build_object(
    'externalId', 'google-volume-1',
    'title', 'Original title',
    'author', 'Original author',
    'coverUrl', null,
    'genre', 'Fiction',
    'description', null
  )::text,
  true
);
select set_config(
  'app.shelf_snapshot_signature',
  public.test_shelf_snapshot_signature(
    current_setting('app.shelf_snapshot_payload', true)
  ),
  true
);

select throws_ok(
  $$insert into public.shelves (user_id, book_id, status)
    select '10000000-0000-4000-8000-000000000001', books.id, 'Quero ler'
    from public.books where books.external_id = 'google-volume-1'$$,
  '42501',
  null,
  'an authenticated user cannot insert a shelf row for another owner even with a valid snapshot signature'
);

select set_config('app.shelf_write', '', true);
select set_config('app.shelf_book_id', '', true);
select set_config('app.shelf_snapshot_payload', '', true);
select set_config('app.shelf_snapshot_signature', '', true);

select set_config(
  'request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true
);
select is(
  (select status from public.shelves),
  'Lendo',
  'a denied cross-user mutation leaves the owner status unchanged'
);

select set_config('request.jwt.claim.sub', '', true);
set local role anon;

select throws_ok(
  $$select * from public.add_book_to_shelf(
    'google-anon', 'Title', 'Author', '{}', repeat('0', 64), null, null, null
  )$$,
  '42501',
  null,
  'anonymous callers cannot execute the adoption RPC'
);

reset role;

select ok(
  not has_table_privilege('authenticated', 'public.shelves', 'DELETE'),
  'authenticated users have no shelf delete privilege'
);

select * from finish();
rollback;