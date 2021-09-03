create or replace function reset()
returns void as
$$
  drop domain url cascade;
  drop domain phone cascade;
  drop domain email cascade;
  drop type category cascade;
  drop type subscription cascade;
  drop table users cascade;
  drop table messages cascade;
  drop table highlights cascade;
  drop type emoji cascade;
  drop table feedback cascade; 
$$
language sql volatile;
