create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) <= 160),
  completed boolean not null default false,
  created_at timestamp not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'title'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'text'
  ) then
    alter table public.todos rename column title to text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'is_complete'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'todos'
      and column_name = 'completed'
  ) then
    alter table public.todos rename column is_complete to completed;
  end if;
end $$;

alter table public.todos enable row level security;

create policy "Allow public read access"
  on public.todos
  for select
  using (true);

create policy "Allow public insert access"
  on public.todos
  for insert
  with check (true);

create policy "Allow public update access"
  on public.todos
  for update
  using (true)
  with check (true);

create policy "Allow public delete access"
  on public.todos
  for delete
  using (true);
