// 通用 HTTP 封装：超时 + 一次重试 + Chrome-like UA
import { setTimeout as delay } from 'node:timers/promises';

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  /** 是否在抛错前打印响应文本（调试用） */
  verbose?: boolean;
}

export class HttpError extends Error {
  status?: number;
  url: string;
  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = 'HttpError';
    this.url = url;
    this.status = status;
  }
}

async function once(url: string, options: FetchOptions): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: 'application/json,text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...options.headers,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status}`, url, res.status);
    }
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function withRetry<T>(
  url: string,
  options: FetchOptions,
  fn: (res: Response) => Promise<T>
): Promise<T> {
  const retries = options.retries ?? 1;
  let lastErr: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const res = await once(url, options);
      return await fn(res);
    } catch (err) {
      lastErr = err;
      if (i < retries) {
        await delay(options.retryDelayMs ?? 2000 * (i + 1));
      }
    }
  }
  throw lastErr;
}

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  return withRetry(url, options, async (res) => (await res.json()) as T);
}

export async function fetchText(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  return withRetry(url, options, async (res) => res.text());
}

/** 解析 JSONP 包裹：parseJsonp("cb({...})") -> {...} */
export function parseJsonp<T = unknown>(text: string): T {
  const match = text.match(/^[^(]*\((.*)\)\s*;?\s*$/s);
  if (!match) throw new Error('Not a JSONP response');
  return JSON.parse(match[1]) as T;
}
