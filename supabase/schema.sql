create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 160),
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

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
