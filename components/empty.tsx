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
          font-size: 14px;
          font-weight: 450;
          position: relative;
          line-height: 24px;
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
