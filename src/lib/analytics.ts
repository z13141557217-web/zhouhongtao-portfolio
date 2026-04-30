import { Redis } from '@upstash/redis';

export const ANALYTICS_EVENTS = {
  page_view: '页面访问',
  resume_download: '简历下载',
  project_open: '项目复盘点击',
  eatit_demo_open: 'Eatit 原型点击',
  contact_email: '邮箱点击',
  contact_phone: '电话点击',
  contact_wechat_copy: '微信复制',
  start_conversation: '开始对话',
} as const;

export type AnalyticsEvent = keyof typeof ANALYTICS_EVENTS;

export type TrackPayload = {
  event: AnalyticsEvent;
  path: string;
  label?: string;
  visitorId?: string;
};

export type AnalyticsSnapshot = {
  configured: boolean;
  generatedAt: string;
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    resumeDownloads: number;
    projectOpens: number;
    eatitDemoOpens: number;
    contactClicks: number;
  };
  events: Array<{ event: AnalyticsEvent; label: string; count: number }>;
  pages: Array<{ path: string; count: number }>;
  actions: Array<{ key: string; event: AnalyticsEvent; label: string; count: number }>;
  daily: Array<{
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    resumeDownloads: number;
    projectOpens: number;
    eatitDemoOpens: number;
    contactClicks: number;
  }>;
};

const PREFIX = 'portfolio:analytics';
const MAX_FIELD_LENGTH = 120;

let redis: Redis | null | undefined;

function readEnv(name: string) {
  return process.env[name] || import.meta.env[name];
}

export function getRedis() {
  if (redis !== undefined) return redis;

  const url = readEnv('UPSTASH_REDIS_REST_URL') || readEnv('KV_REST_API_URL');
  const token = readEnv('UPSTASH_REDIS_REST_TOKEN') || readEnv('KV_REST_API_TOKEN');
  redis = url && token ? new Redis({ url, token }) : null;

  return redis;
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === 'string' && value in ANALYTICS_EVENTS;
}

export function isAnalyticsConfigured() {
  return Boolean(getRedis());
}

export function todayInShanghai(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

function daysBack(count: number) {
  const days: string[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    days.push(todayInShanghai(date));
  }

  return days;
}

function sanitizeField(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const clean = value.replace(/[\n\r\t]/g, ' ').trim();
  if (!clean) return fallback;
  return clean.slice(0, MAX_FIELD_LENGTH);
}

function toCount(value: unknown) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function scorePairs(raw: unknown): Array<{ value: string; score: number }> {
  if (!Array.isArray(raw)) return [];

  const pairs: Array<{ value: string; score: number }> = [];
  for (let i = 0; i < raw.length; i += 2) {
    const value = raw[i];
    const score = raw[i + 1];
    if (typeof value === 'string') {
      pairs.push({ value, score: toCount(score) });
    }
  }

  return pairs;
}

export async function trackEvent(payload: TrackPayload) {
  const store = getRedis();
  if (!store) return { stored: false };

  const event = payload.event;
  const path = sanitizeField(payload.path, '/');
  const label = sanitizeField(payload.label, path);
  const visitorId = sanitizeField(payload.visitorId, '');
  const day = todayInShanghai();
  const actionKey = `${event}::${label}`;

  const pipeline = store.pipeline();
  pipeline.hincrby(`${PREFIX}:events`, event, 1);
  pipeline.hincrby(`${PREFIX}:daily:${day}`, event, 1);
  pipeline.zincrby(`${PREFIX}:pages`, 1, path);

  if (event !== 'page_view') {
    pipeline.zincrby(`${PREFIX}:actions`, 1, actionKey);
  }

  if (visitorId) {
    pipeline.sadd(`${PREFIX}:visitors`, visitorId);
    pipeline.sadd(`${PREFIX}:visitors:${day}`, visitorId);
  }

  await pipeline.exec();
  return { stored: true };
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const store = getRedis();
  const generatedAt = new Date().toISOString();

  if (!store) {
    return {
      configured: false,
      generatedAt,
      totals: {
        pageViews: 0,
        uniqueVisitors: 0,
        resumeDownloads: 0,
        projectOpens: 0,
        eatitDemoOpens: 0,
        contactClicks: 0,
      },
      events: [],
      pages: [],
      actions: [],
      daily: daysBack(14).map((date) => ({
        date,
        pageViews: 0,
        uniqueVisitors: 0,
        resumeDownloads: 0,
        projectOpens: 0,
        eatitDemoOpens: 0,
        contactClicks: 0,
      })),
    };
  }

  const days = daysBack(14);
  const [eventMap, visitorCount, pagesRaw, actionsRaw, ...dailyResults] = await Promise.all([
    store.hgetall<Record<string, number | string>>(`${PREFIX}:events`),
    store.scard(`${PREFIX}:visitors`),
    store.zrange(`${PREFIX}:pages`, 0, 7, { rev: true, withScores: true }),
    store.zrange(`${PREFIX}:actions`, 0, 11, { rev: true, withScores: true }),
    ...days.flatMap((day) => [
      store.hgetall<Record<string, number | string>>(`${PREFIX}:daily:${day}`),
      store.scard(`${PREFIX}:visitors:${day}`),
    ]),
  ]);

  const counts = eventMap ?? {};
  const contactClicks =
    toCount(counts.contact_email) + toCount(counts.contact_phone) + toCount(counts.contact_wechat_copy);

  const daily = days.map((date, index) => {
    const dailyMap = (dailyResults[index * 2] ?? {}) as Record<string, number | string>;
    const dailyVisitors = toCount(dailyResults[index * 2 + 1]);
    return {
      date,
      pageViews: toCount(dailyMap.page_view),
      uniqueVisitors: dailyVisitors,
      resumeDownloads: toCount(dailyMap.resume_download),
      projectOpens: toCount(dailyMap.project_open),
      eatitDemoOpens: toCount(dailyMap.eatit_demo_open),
      contactClicks:
        toCount(dailyMap.contact_email) +
        toCount(dailyMap.contact_phone) +
        toCount(dailyMap.contact_wechat_copy),
    };
  });

  const events = Object.entries(ANALYTICS_EVENTS).map(([event, label]) => ({
    event: event as AnalyticsEvent,
    label,
    count: toCount(counts[event]),
  }));

  const pages = scorePairs(pagesRaw).map((item) => ({ path: item.value, count: item.score }));
  const actions = scorePairs(actionsRaw).map((item) => {
    const [event, label] = item.value.split('::');
    return {
      key: item.value,
      event: isAnalyticsEvent(event) ? event : 'page_view',
      label: label || item.value,
      count: item.score,
    };
  });

  return {
    configured: true,
    generatedAt,
    totals: {
      pageViews: toCount(counts.page_view),
      uniqueVisitors: visitorCount,
      resumeDownloads: toCount(counts.resume_download),
      projectOpens: toCount(counts.project_open),
      eatitDemoOpens: toCount(counts.eatit_demo_open),
      contactClicks,
    },
    events,
    pages,
    actions,
    daily,
  };
}
