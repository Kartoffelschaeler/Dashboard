create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) <= 160),
  completed boolean not null default false,
  created_at timestamp not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  all_day boolean not null default false,
  created_at timestamp with time zone not null default now()
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

alter table public.calendar_events enable row level security;

drop policy if exists "Allow public read access" on public.todos;
drop policy if exists "Allow public insert access" on public.todos;
drop policy if exists "Allow public update access" on public.todos;
drop policy if exists "Allow public delete access" on public.todos;
drop policy if exists "Allow public calendar read access" on public.calendar_events;
drop policy if exists "Allow public calendar insert access" on public.calendar_events;
drop policy if exists "Allow public calendar delete access" on public.calendar_events;

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

create policy "Allow public calendar read access"
  on public.calendar_events
  for select
  using (true);

create policy "Allow public calendar insert access"
  on public.calendar_events
  for insert
  with check (true);

create policy "Allow public calendar delete access"
  on public.calendar_events
  for delete
  using (true);
