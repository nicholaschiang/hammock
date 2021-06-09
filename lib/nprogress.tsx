import { useEffect, useState } from 'react';
import NProgress from 'nprogress';

import { Callback } from 'lib/model/callback';

interface Loading {
  loading: boolean;
  setLoading: Callback<boolean>;
  error: string;
  setError: Callback<string>;
}

export function useLoading(): Loading {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      NProgress.done();
    } else {
      NProgress.start();
      setError('');
    }
  }, [loading]);
  useEffect(() => {
    if (error) setLoading(false);
  }, [error]);

  return { loading, setLoading, error, setError };
}
