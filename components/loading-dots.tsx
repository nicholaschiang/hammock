export interface LoadingDotsProps {
  size?: number;
}

export default function LoadingDots({
  size = 4,
}: LoadingDotsProps): JSX.Element {
  return (
    <span className='loading'>
      <span />
      <span />
      <span />
      <style jsx>{`
        .loading {
          display: inline-flex;
          align-items: center;
        }

        .loading span {
          animation-name: blink;
          animation-duration: 1.4s;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
          border-radius: 50%;
          background-color: var(--accents-6);
          display: inline-block;
          margin: 0 1px;
          height: ${size}px;
          width: ${size}px;
        }

        .loading span:nth-of-type(2) {
          animation-delay: 0.2s;
        }

        .loading span:nth-of-type(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0% {
            opacity: 0.2;
          }
          20% {
            opacity: 1;
          }
          to {
            opacity: 0.2;
          }
        }
      `}</style>
    </span>
  );
}
