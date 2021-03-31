import React from 'react';

export default function Content({ children }: { children: React.ReactNode }) {
  return <div className='md:container md:mx-auto mt-16'>{children}</div>;
}
