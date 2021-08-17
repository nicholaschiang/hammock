create or replace function reset()
returns void as
$$
  drop domain url cascade;
  drop domain phone cascade;
  drop domain email cascade;
  drop type category cascade;
  drop table users cascade;
  drop table newsletters cascade;
  drop table subscriptions cascade;
  drop table messages cascade;
  drop table highlights cascade;
$$
language sql volatile;
