import { useEffect, useState } from 'react';

export default function useNow(): Date {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, 60 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);
  return now;
}
