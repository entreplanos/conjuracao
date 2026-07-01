-- ============================================================
-- Conjuração — schema do Supabase
-- Rode isso inteiro no SQL Editor do Supabase (Database > SQL Editor > New query)
-- ============================================================

-- Tabela genérica chave/valor (mesmo padrão das outras ferramentas)
create table if not exists kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table kv enable row level security;

-- Leitura pública (o catálogo precisa ser visível sem login)
drop policy if exists "conjuracao_public_read" on kv;
create policy "conjuracao_public_read"
  on kv for select
  using (true);

-- Qualquer pessoa pode criar/atualizar as PRÓPRIAS listas (chaves cat:lista:*)
-- Isso é o que permite ao mestre montar a lista sem precisar de login
drop policy if exists "conjuracao_anon_write_listas" on kv;
create policy "conjuracao_anon_write_listas"
  on kv for insert
  with check (key like 'cat:lista:%');

drop policy if exists "conjuracao_anon_update_listas" on kv;
create policy "conjuracao_anon_update_listas"
  on kv for update
  using (key like 'cat:lista:%');

-- Só admin autenticado pode escrever QUALQUER chave (inclui cat:item:* do catálogo)
drop policy if exists "conjuracao_admin_write" on kv;
create policy "conjuracao_admin_write"
  on kv for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "conjuracao_admin_update" on kv;
create policy "conjuracao_admin_update"
  on kv for update
  using (auth.role() = 'authenticated');

drop policy if exists "conjuracao_admin_delete" on kv;
create policy "conjuracao_admin_delete"
  on kv for delete
  using (auth.role() = 'authenticated');

-- Grants explícitos (gotcha conhecido: o Supabase não libera automaticamente)
grant select, insert, update on kv to anon;
grant select, insert, update, delete on kv to authenticated;

-- ============================================================
-- Storage: bucket para as fotos dos itens do catálogo
-- ============================================================
-- Isso aqui você faz pela interface (Storage > New bucket), não por SQL:
--   1. Nome do bucket: conjuracao-catalogo
--   2. Marcar como "Public bucket"
-- Depois, rode as policies abaixo pra liberar upload só pro admin:

insert into storage.buckets (id, name, public)
values ('conjuracao-catalogo', 'conjuracao-catalogo', true)
on conflict (id) do nothing;

drop policy if exists "conjuracao_catalogo_public_read" on storage.objects;
create policy "conjuracao_catalogo_public_read"
  on storage.objects for select
  using (bucket_id = 'conjuracao-catalogo');

drop policy if exists "conjuracao_catalogo_admin_upload" on storage.objects;
create policy "conjuracao_catalogo_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'conjuracao-catalogo' and auth.role() = 'authenticated');

drop policy if exists "conjuracao_catalogo_admin_delete" on storage.objects;
create policy "conjuracao_catalogo_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'conjuracao-catalogo' and auth.role() = 'authenticated');
