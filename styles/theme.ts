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
    --selection: #79ffe1;
  }

  .dark {
    --primary: #5aa6ff;
    --on-primary: #000;
    --background: #121212;
    --on-background: #fff;
    --error: #cf6679;
    --on-error: #000;
    --accents-1: #111;
    --accents-2: #333;
    --accents-3: #444;
    --accents-4: #666;
    --accents-5: #888;
    --accents-6: #999;
    --selection: #f81ce5;
  }
`;
