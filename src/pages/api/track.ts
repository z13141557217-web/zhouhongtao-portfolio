import type { APIRoute } from 'astro';
import { isAnalyticsEvent, trackEvent } from '../../lib/analytics';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!isAnalyticsEvent(body.event)) {
    return Response.json({ ok: false, error: 'invalid_event' }, { status: 400 });
  }

  const result = await trackEvent({
    event: body.event,
    path: typeof body.path === 'string' ? body.path : '/',
    label: typeof body.label === 'string' ? body.label : undefined,
    visitorId: typeof body.visitorId === 'string' ? body.visitorId : undefined,
  });

  return Response.json({ ok: true, ...result });
};
