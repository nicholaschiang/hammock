create or replace function setup()
returns void as
$$
  create domain url as text check (value ~ '^https?:\/\/\S+$');
  create domain phone as text check (value ~ '^(\+\d{1,3})\d{10}$');
  create domain email as text check (value ~ '^[A-Za-z0-9._~+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');
  create type category as enum('important', 'other');
  create type subscription as (
    "name" text,
    "email" email,
    "photo" url,
    "category" category,
    "favorite" boolean
  );
  create table users (
    "id" numeric unique not null primary key,
    "name" text not null check(length(name) > 1 AND name !~ '^\s+$'),
    "photo" url unique,
    "email" email unique,
    "phone" phone unique,
    "locale" text not null,
    "token" text not null,
    "scopes" text[] not null,
    "label" text not null,
    "filter" text not null,
    "subscriptions" subscription[] not null
  );
  create type highlight as (
    "id" text,
    "start" text,
    "startOffset" int,
    "end" text,
    "endOffset" int,
    "text" text,
    "deleted" boolean
  );
  create table messages (
    "user" numeric references users(id) on delete cascade on update cascade not null,
    "id" text unique not null primary key,
    "name" text not null check(length(name) > 1 AND name !~ '^\s+$'),
    "email" email not null,
    "photo" url not null,
    "category" category not null default 'other',
    "favorite" boolean not null default false,
    "date" timestamptz not null,
    "subject" text not null,
    "snippet" text not null,
    "raw" text not null,
    "html" text not null,
    "archived" boolean not null default false,
    "scroll" int not null default 0,
    "time" int not null default 0,
    "highlights" highlight[] not null
  );
$$
language sql volatile;
