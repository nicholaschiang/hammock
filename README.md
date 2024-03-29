<h1>Hammock</h1>
<p>
  <a aria-label='Website status' href='https://readhammock.com'>
    <img src='https://img.shields.io/website?label=Website&down_color=lightgrey&down_message=down&up_color=brightgreen&up_message=up&url=https%3A%2F%2Freadhammock.com&style=flat&labelColor=394149'>
  </a>
  <a aria-label='App status' href='https://app.readhammock.com'>
    <img src='https://img.shields.io/website?label=App&down_color=lightgrey&down_message=down&up_color=brightgreen&up_message=up&url=https%3A%2F%2Fapp.readhammock.com&style=flat&labelColor=394149'>
  </a>
  <a aria-label='Test status' href='https://github.com/readhammock/hammock/actions/workflows/test.yml'>
    <img src='https://github.com/readhammock/hammock/actions/workflows/test.yml/badge.svg'>
  </a>
  <a aria-label='Build status' href='https://github.com/readhammock/hammock/actions/workflows/build.yml'>
    <img src='https://github.com/readhammock/hammock/actions/workflows/build.yml/badge.svg'>
  </a>
</p>

Hammock moves your favorite newsletters outside of your understandably cluttered
inbox, letting you focus on and learn from the content you love in a
distraction-free reading space.

## Terminology and Data Model

### `User`

A user is a person; someone who uses the app.

### `Subscription`

A subscription is a recurring newsletter from a specific email address.

### `Message`

A message is an email from a recurring newsletter (extends `Subscription`).

## Implementation

Included below are some high-level descriptions of how Hammock is implemented.
The purpose of this writing is not so much to act as documentation but rather to
encourage better README-driven development.

#### Gmail Sync

Our Gmail sync is composed of various methods to ensure that our
Supabase-managed PostgreSQL database is always up-to-date with our users' Gmail
inboxes:

1. When the user first signs up, they call our `/api/sync` endpoint which starts
   [a full sync](https://developers.google.com/gmail/api/guides/sync#full_synchronization)
   using Gmail's `messages.list` API endpoint. This endpoint syncs 10 messages
   and then redirects (using the `nextPageToken`) to `/api/sync` recursively to
   sync the next 10 messages and so on and so forth. We save the current sync
   cursor (the `nextPageToken` returned by the last `messages.list` call) in our
   database so subsequent calls to `/api/sync` start right where we left off.
2. When the user signs up, we also setup [a Google Pub/Sub subscription](https://cloud.google.com/pubsub/docs/push)
   using Gmail's [`users.watch`](https://googleapis.dev/nodejs/googleapis/latest/gmail/classes/Resource$Users.html#watch)
   API endpoint. This [push subscription](https://cloud.google.com/pubsub/docs/subscriber#push-subscription)
   then calls our `/api/push` endpoint which uses Gmail's [`history.list`](https://googleapis.dev/nodejs/googleapis/latest/gmail/classes/Resource$Users$History.html#list)
   API to sync newly received messages as they come in.

## Development

Hammock aims to use the most cutting-edge, performant, and production-ready
solutions available. Included below is our current selection and the reasoning
behind it, but we're always open to improvements!

#### Languages

- [Typescript](https://www.typescriptlang.org) - As our language of choice
  (mostly for static typing, stronger linting capabilities, etc). Typescript is
  also [well supported by Next.js](https://nextjs.org/docs/basic-features/typescript)
  and [React](https://reactjs.org/docs/static-type-checking.html#typescript).
- [CSS-in-JS](https://github.com/vercel/styled-jsx) - Instead of packaging
  styles separately from our React components, all styles are included alongside
  them _in the same files_. This allows for better code-splitting, etc.

#### Frameworks

- [React](https://reactjs.org) - As our front-end framework.
- [Next.js](https://nextjs.org) - To easily support
  [SSR](https://nextjs.org/docs/basic-features/pages#server-side-rendering) and
  other performance [PWA](https://web.dev/progressive-web-apps/) features.
- [SWR](https://swr.vercel.app) - Used to manage global state. SWR fetches data
  from our back-end, stores it in a global cache, and allows local mutations of
  that cache (with or without automatic revalidation).
- [`next-auth`](https://next-auth.js.org) - Manages authentication with JWT
  session cookies.

#### Tooling

- [Yarn](https://yarnpkg.com) - To manage dependencies much faster than NPM (and
  for better community support, advanced features, etc). This project uses Yarn
  Berry (v2) and takes advantage of its new plug-n-play functionality.
- [ESLint](https://github.com/eslint/eslint) - For code linting to avoid
  common mistakes and to enforce styling. Follow [these
  instructions](https://eslint.org/docs/user-guide/integrations) to install it
  in the text editor of your choice (so you won't have to wait until our
  pre-commit hooks fail to update your code).
- [Cypress](https://docs.cypress.io) for integration, UI, and some unit tests.
  Cypress is like Selenium; but built from the ground-up with the developer in
  mind. Cypress runs alongside your code in the browser, enabling DOM snapshots,
  time travel, and overall faster test runs.

#### Database

- [Supabase](https://supabase.com) - For their managed [PostgreSQL
  relational database](https://supabase.com/database).

## Commit Message Format

I have very precise rules over how Git commit messages in this repository must
be formatted. This format leads to **easier to read commit history**.

Please refer to the following documentation for more info:

- [Conventional Commit Messages](https://www.conventionalcommits.org/en/v1.0.0/)
- [Angular's Commit Message Format](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-format)
- [Udacity's Commit Message Style Guide](http://udacity.github.io/git-styleguide/)

### Commit Message Header

Commit messages that do not adhere to the following commit style will not be
merged into `develop`:

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: The page, API route, or component modified.
  │
  └─⫸ Commit Type: ci|docs|feat|fix|perf|refactor|test|deps|chore
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is
optional.

#### Type

Must be one of the following:

- **ci**: Changes to our CI configuration files and scripts.
- **docs**: Documentation only changes.
- **feat**: A new feature.
- **fix**: A bug fix.
- **perf**: A code change that improves performance.
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **test**: Adding missing tests or correcting existing tests.
- **deps**: A change in dependencies.
- **chore**: A code change in utility scripts, build configurations, etc.

## Git Flow

This repository follows [the standard git-flow
workflow](https://nvie.com/posts/a-successful-git-branching-model/) with a
couple of important exceptions:

- `develop` should always be stable and ready for release.
- `develop` just has not yet been released (e.g. for marketing purposes, we
  release changes in large batches).
- `master` represents the current production state of the app.

![Git Flow Diagram](https://nvie.com/img/git-model@2x.png)
