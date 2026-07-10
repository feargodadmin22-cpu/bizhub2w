-- Business Hub — Row Level Security using Postgres session variables.
-- app.shop_id / app.role are set by scopedPrisma() (src/lib/prisma.ts)
-- at the start of every request. No value set = no rows match = fails
-- closed by default.

alter table shops enable row level security;
alter table branches enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table units enable row level security;
alter table products enable row level security;
alter table stock_movements enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;
alter table sale_returns enable row level security;
alter table sale_return_items enable row level security;
alter table expenses enable row level security;
alter table activity_logs enable row level security;

create policy shop_isolation on shops
  for all using (id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on branches
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on users
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on categories
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on units
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on products
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on stock_movements
  for all using (
    exists (
      select 1 from products p
      where p.id = stock_movements.product_id
      and p.shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    )
  );

create policy shop_isolation on customers
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on sales
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on sale_items
  for all using (
    exists (
      select 1 from sales s
      where s.id = sale_items.sale_id
      and s.shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    )
  );

create policy shop_isolation on payments
  for all using (
    exists (
      select 1 from sales s
      where s.id = payments.sale_id
      and s.shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    )
  );

create policy shop_isolation on sale_returns
  for all using (
    exists (
      select 1 from sales s
      where s.id = sale_returns.original_sale_id
      and s.shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    )
  );

create policy shop_isolation on sale_return_items
  for all using (
    exists (
      select 1 from sale_returns sr
      join sales s on s.id = sr.original_sale_id
      where sr.id = sale_return_items.sale_return_id
      and s.shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    )
  );

create policy shop_isolation on expenses
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

create policy shop_isolation on activity_logs
  for all using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);

-- Owner-only writes (Section 2.5), same idea as before but checking
-- app.role instead of a JWT claim.
drop policy shop_isolation on expenses;
create policy expenses_select on expenses
  for select using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);
create policy expenses_insert on expenses
  for insert with check (
    shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    and current_setting('app.role', true) = 'owner'
  );

drop policy shop_isolation on users;
create policy users_select on users
  for select using (shop_id = nullif(current_setting('app.shop_id', true), '')::uuid);
create policy users_write on users
  for insert with check (
    shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    and current_setting('app.role', true) = 'owner'
  );
create policy users_update on users
  for update using (
    shop_id = nullif(current_setting('app.shop_id', true), '')::uuid
    and current_setting('app.role', true) = 'owner'
  );