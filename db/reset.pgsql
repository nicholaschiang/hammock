create or replace function reset()
returns void as
$$
  drop domain url cascade;
  drop domain phone cascade;
  drop domain email cascade;
  drop type category cascade;
  drop type subscription cascade;
  drop table users cascade;
  drop type highlight cascade;
  drop table messages cascade;
$$
language sql volatile;
