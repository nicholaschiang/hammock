import { useEffect, useRef } from 'react';
import { SegmentAnalytics } from '@segment/analytics.js-core';
import { dequal } from 'dequal/lite';

import { useUser } from 'lib/context/user';

declare global {
  interface Window {
    analytics: SegmentAnalytics.AnalyticsJS;
  }
}

export default function Segment(): null {
  const { user } = useUser();

  const prevIdentity = useRef<Record<string, unknown>>();
  useEffect(() => {
    const identity = {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      avatar: user?.photo,
    };
    if (dequal(prevIdentity.current, identity)) return;
    if (user?.id) window.analytics?.alias(user.id.toString());
    window.analytics?.identify(user?.id.toString(), identity);
    prevIdentity.current = identity;
  }, [user]);

  return null;
}
