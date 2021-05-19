import { ReactNode } from 'react';
import cn from 'classnames';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({
  className,
  children,
}: ContainerProps): JSX.Element {
  return (
    <div className={cn(className, 'w-container')}>
      {children}
      <style jsx>{`
        .w-container {
          margin-left: auto;
          margin-right: auto;
          max-width: 940px;
          margin-bottom: 0px;
          padding-bottom: 0px;
          padding-left: 0px;
          text-align: center;
        }

        .w-container:before,
        .w-container:after {
          content: ' ';
          display: table;
          grid-column-start: 1;
          grid-row-start: 1;
          grid-column-end: 2;
          grid-row-end: 2;
        }

        .w-container:after {
          clear: both;
        }

        @media (max-width: 991px) {
          .w-container {
            max-width: 728px;
          }
        }

        @media (max-width: 479px) {
          .w-container {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
