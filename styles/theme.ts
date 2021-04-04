import css from 'styled-jsx/css';

export default css.global`
  :root {
    --primary: #0070f3;
    --on-primary: #fff;

    --background: #fff;
    --on-background: #000;

    --error: #b00020;
    --on-error: #fff;

    --accents-1: #fafafa;
    --accents-2: #eaeaea;
    --accents-3: #999;
    --accents-4: #888;
    --accents-5: #666;
    --accents-6: #444;

    --shadow-small: 0 5px 10px rgba(0, 0, 0, 0.12);
    --shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.12);
    --shadow-large: 0 30px 60px rgba(0, 0, 0, 0.12);

    --selection: #79ffe1;
    --header-background: rgba(255, 255, 255, 0.8);
    --triangle-stroke: var(--background);

    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
      'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
    --font-mono: Menlo, Monaco, Lucida Console, Liberation Mono,
      DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
  }

  .dark {
    --primary: #5aa6ff;
    --on-primary: #000;

    --background: #000;
    --on-background: #fff;

    --error: #cf6679;
    --on-error: #000;

    --accents-1: #111;
    --accents-2: #333;
    --accents-3: #444;
    --accents-4: #666;
    --accents-5: #888;
    --accents-6: #999;

    --shadow-small: 0 0 0 1px var(--accents-2);
    --shadow-medium: 0 0 0 1px var(--accents-2);
    --shadow-large: 0 0 0 1px var(--accents-2);

    --selection: #f81ce5;

    --header-background: rgba(0, 0, 0, 0.8);
    --triangle-stroke: var(--accents-2);
  }
`;
