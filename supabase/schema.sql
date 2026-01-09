-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: restaurants
create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  address text,
  owner_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: profiles (Extends auth.users)
create type user_role as enum ('admin', 'rider', 'customer');
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role default 'customer',
  full_name text,
  phone_number text,
  restaurant_id uuid references restaurants(id) -- For admin/rider linked to a restaurant
);

-- Table: categories
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  name text not null,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: menu_items
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  image_url text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: riders
create table if not exists riders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  full_name text not null,
  phone_number text not null,
  pin_code text not null, -- Simple login mechanism
  status text default 'offline', -- offline, available, busy
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: orders
create type order_status as enum ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id) not null,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  total_amount decimal(10,2) not null,
  status order_status default 'pending',
  rider_id uuid references riders(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: order_items
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  menu_item_id uuid references menu_items(id),
  menu_item_name text not null, -- Snapshot name in case it changes
  quantity int not null,
  price_at_time decimal(10,2) not null
);

-- Enable RLS (Row Level Security) - Basic Setup
alter table restaurants enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table riders enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
