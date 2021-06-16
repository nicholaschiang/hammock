import rfdc from 'rfdc';

const deepClone = rfdc();

// TODO: Refactor this to get rid of all of the scary TypeScript ESLint errors.
export default function clone<T>(obj: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const copy = deepClone(obj) as any;
  if (typeof obj !== 'object') return copy as T;
  Object.entries(obj).forEach(([key, val]) => {
    if (val instanceof Array) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      copy[key] = val.map((v) => v?.clone || v);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      copy[key] = val?.clone || copy[key];
    }
  });
  return copy as T;
}
