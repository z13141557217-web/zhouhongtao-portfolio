const VISITOR_KEY = 'zht_portfolio_visitor_id';

type TrackEvent =
  | 'page_view'
  | 'resume_download'
  | 'project_open'
  | 'eatit_demo_open'
  | 'contact_email'
  | 'contact_phone'
  | 'contact_wechat_copy'
  | 'start_conversation';

function createId() {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const next = createId();
    window.localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return '';
  }
}

function postEvent(event: TrackEvent, label?: string) {
  const payload = JSON.stringify({
    event,
    label,
    path: `${window.location.pathname}${window.location.hash}`,
    visitorId: getVisitorId(),
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/track', blob);
    return;
  }

  void fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  });
}

function classifyLink(link: HTMLAnchorElement): { event: TrackEvent; label?: string } | null {
  const explicitEvent = link.dataset.trackEvent as TrackEvent | undefined;
  if (explicitEvent) return { event: explicitEvent, label: link.dataset.trackLabel };

  const href = link.getAttribute('href') ?? '';
  const pathname = new URL(href, window.location.href).pathname;

  if (link.hasAttribute('download') || pathname.endsWith('.pdf')) {
    return { event: 'resume_download', label: link.getAttribute('download') ?? pathname };
  }

  if (href.startsWith('mailto:')) return { event: 'contact_email', label: href.replace('mailto:', '') };
  if (href.startsWith('tel:')) return { event: 'contact_phone', label: href.replace('tel:', '') };
  if (pathname.startsWith('/eatit-demo/')) return { event: 'eatit_demo_open', label: 'Eatit interactive prototype' };
  if (pathname.startsWith('/projects/')) return { event: 'project_open', label: pathname };
  if (href.includes('#contact') && link.classList.contains('btn-primary')) {
    return { event: 'start_conversation', label: link.textContent?.trim() || '开始对话' };
  }

  return null;
}

export function initPortfolioAnalytics() {
  if (window.location.pathname.startsWith('/stats')) return;

  postEvent('page_view', document.title);

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement | null;
      const copyButton = target?.closest<HTMLButtonElement>('#copy-wx');
      if (copyButton) {
        postEvent('contact_wechat_copy', copyButton.dataset.copy ?? 'wechat');
        return;
      }

      const link = target?.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;

      const tracked = classifyLink(link);
      if (tracked) postEvent(tracked.event, tracked.label);
    },
    { capture: true },
  );
}
