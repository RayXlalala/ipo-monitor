'use client';

import { useMemo, useState } from 'react';
import {
  Company,
  Market,
  MARKET_LABEL,
  ReviewStatus,
  STATUS_LABEL,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import StatusBadge from './StatusBadge';

interface Props {
  companies: Company[];
  markets: Market[]; // 允许的板块（页面级过滤）
}

const ALL_STATUSES: ReviewStatus[] = [
  'accepted',
  'inquired',
  'committee',
  'passed',
  'submitted',
  'effective',
  'suspended',
  'terminated',
];

export default function CompanyExplorer({ companies, markets }: Props) {
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ReviewStatus[]>([]);
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies
      .filter((c) => markets.includes(c.market))
      .filter((c) =>
        selectedMarkets.length === 0 ? true : selectedMarkets.includes(c.market)
      )
      .filter((c) =>
        selectedStatuses.length === 0 ? true : selectedStatuses.includes(c.status)
      )
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.nameEn ?? '').toLowerCase().includes(q) ||
          (c.sponsor ?? '').toLowerCase().includes(q) ||
          (c.industry ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.updateDate ?? '').localeCompare(a.updateDate ?? ''));
  }, [companies, markets, selectedMarkets, selectedStatuses, query]);

  const toggle = <T,>(value: T, list: T[], setter: (v: T[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const reset = () => {
    setSelectedMarkets([]);
    setSelectedStatuses([]);
    setQuery('');
  };

  const isFiltered =
    selectedMarkets.length > 0 || selectedStatuses.length > 0 || query.length > 0;

  return (
    <div className="space-y-4">
      {/* 筛选条 */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <FilterGroup label="板块">
            {markets.map((m) => (
              <Chip
                key={m}
                active={selectedMarkets.includes(m)}
                onClick={() => toggle(m, selectedMarkets, setSelectedMarkets)}
              >
                {MARKET_LABEL[m]}
              </Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="状态">
            {ALL_STATUSES.map((s) => (
              <Chip
                key={s}
                active={selectedStatuses.includes(s)}
                onClick={() => toggle(s, selectedStatuses, setSelectedStatuses)}
              >
                {STATUS_LABEL[s]}
              </Chip>
            ))}
          </FilterGroup>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <input
                type="search"
                placeholder="搜索公司 / 保荐人 / 行业"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-64 rounded-full border border-border bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              >
                <path
                  fill="currentColor"
                  d="M9 3a6 6 0 1 0 3.873 10.6l3.014 3.014a1 1 0 0 0 1.414-1.414l-3.014-3.014A6 6 0 0 0 9 3Zm-4 6a4 4 0 1 1 8 0a4 4 0 0 1-8 0Z"
                />
              </svg>
            </div>
            {isFiltered ? (
              <button
                onClick={reset}
                className="rounded-full px-3 py-1.5 text-xs text-muted hover:bg-zinc-100 hover:text-foreground"
              >
                清除
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 计数提示 */}
      <div className="px-1 text-xs text-muted">
        共 <span className="tabular-nums text-foreground">{data.length}</span> 家
        {isFiltered ? '（已筛选）' : ''}
      </div>

      {/* 表格（桌面） */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-zinc-50/80 text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">公司</th>
              <th className="px-4 py-3 text-left font-medium">板块</th>
              <th className="px-4 py-3 text-left font-medium">行业</th>
              <th className="px-4 py-3 text-left font-medium">保荐机构</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium tabular-nums">受理日期</th>
              <th className="px-4 py-3 text-right font-medium tabular-nums">最近更新</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-16 text-center text-sm text-muted"
                >
                  没有匹配的公司
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50/70">
                  <td className="max-w-xs px-4 py-3 align-top">
                    {c.rawUrl ? (
                      <a
                        href={c.rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {c.name}
                      </a>
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                    {c.nameEn ? (
                      <div className="mt-0.5 truncate text-xs text-muted">
                        {c.nameEn}
                      </div>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-700 align-top">
                    {MARKET_LABEL[c.market]}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {c.industry ?? '—'}
                  </td>
                  <td className="px-4 py-3 align-top text-zinc-700">
                    {c.sponsor ?? '—'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-600 align-top">
                    {formatDate(c.acceptDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-600 align-top">
                    {formatDate(c.updateDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 卡片（移动） */}
      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted">
            没有匹配的公司
          </p>
        ) : (
          data.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {c.rawUrl ? (
                    <a
                      href={c.rawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-accent"
                    >
                      {c.name}
                    </a>
                  ) : (
                    <span className="text-sm font-medium">{c.name}</span>
                  )}
                  <div className="mt-1 text-xs text-muted">
                    {MARKET_LABEL[c.market]}
                    {c.industry ? <> · {c.industry}</> : null}
                  </div>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
                <dt className="text-muted">保荐机构</dt>
                <dd className="text-right text-zinc-700">{c.sponsor ?? '—'}</dd>
                <dt className="text-muted">受理日期</dt>
                <dd className="text-right tabular-nums text-zinc-700">
                  {formatDate(c.acceptDate)}
                </dd>
                <dt className="text-muted">最近更新</dt>
                <dd className="text-right tabular-nums text-zinc-700">
                  {formatDate(c.updateDate)}
                </dd>
              </dl>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full px-2.5 py-1 text-xs transition-colors ' +
        (active
          ? 'bg-foreground text-background'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200')
      }
    >
      {children}
    </button>
  );
}
