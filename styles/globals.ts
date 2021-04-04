import css from 'styled-jsx/css';

export default css.global`
  ::selection {
    background-color: var(--selection);
    color: var(--on-background);
  }

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  html {
    height: 100%;
    box-sizing: border-box;
    touch-action: manipulation;
    font-feature-settings: 'rlig' 1, 'calt' 0;
  }

  body {
    position: relative;
    min-height: 100%;
    margin: 0;
  }

  html,
  body {
    font-family: var(--font-sans);
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background);
    color: var(--on-background);
  }

  button.reset {
    border: unset;
    background: unset;
    padding: unset;
    margin: unset;
    font: unset;
    text-align: unset;
    appearance: unset;
    cursor: pointer;
  }

  .loading {
    background-image: linear-gradient(
      270deg,
      var(--accents-1),
      var(--accents-2),
      var(--accents-2),
      var(--accents-1)
    );
    background-size: 400% 100%;
    -webkit-animation: loadingAnimation 8s ease-in-out infinite;
    animation: loadingAnimation 8s ease-in-out infinite;
  }

  @keyframes loadingAnimation {
    0% {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
`;
