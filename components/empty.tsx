export interface EmptyProps {
  children: string;
}

export default function Empty({ children }: EmptyProps): JSX.Element {
  return (
    <div className='empty'>
      {children}
      <style jsx>{`
        .empty {
          border: 2px dashed var(--accents-2);
          border-radius: 4px;
          color: var(--accents-3);
          font-size: 16px;
          font-weight: 400;
          position: relative;
          line-height: 16px;
          text-transform: uppercase;
          height: 100%;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
