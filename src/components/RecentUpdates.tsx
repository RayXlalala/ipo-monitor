import { Company, MARKET_LABEL } from '@/lib/types';
import { relativeDate } from '@/lib/utils';
import StatusBadge from './StatusBadge';

export default function RecentUpdates({
  items,
  title,
  emptyText = '近 7 天暂无新动态',
}: {
  items: Company[];
  title: string;
  emptyText?: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <span className="text-xs text-muted">最近 7 天</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-zinc-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {c.rawUrl ? (
                    <a
                      href={c.rawUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm font-medium text-foreground hover:text-accent"
                    >
                      {c.name}
                    </a>
                  ) : (
                    <span className="truncate text-sm font-medium">{c.name}</span>
                  )}
                </div>
                <div className="mt-1 truncate text-xs text-muted">
                  <span>{MARKET_LABEL[c.market]}</span>
                  {c.sponsor ? (
                    <>
                      <span className="mx-1.5">·</span>
                      <span>{c.sponsor}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={c.status} size="sm" />
                <span className="w-16 text-right text-xs tabular-nums text-muted">
                  {relativeDate(c.updateDate)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
