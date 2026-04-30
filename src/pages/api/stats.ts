import type { APIRoute } from 'astro';
import { getAnalyticsSnapshot } from '../../lib/analytics';

export const prerender = false;

export const GET: APIRoute = async () => {
  const snapshot = await getAnalyticsSnapshot();

  return Response.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
};
