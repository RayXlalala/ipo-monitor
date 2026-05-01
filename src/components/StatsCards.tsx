import Link from 'next/link';

interface Stat {
  label: string;
  value: number;
  caption?: string;
  href?: string;
  accent?: boolean;
}

export default function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) => {
        const inner = (
          <div
            className={
              'h-full rounded-xl border bg-card p-5 transition-colors ' +
              (s.href
                ? 'border-border hover:border-zinc-300 hover:bg-white'
                : 'border-border')
            }
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              {s.label}
            </div>
            <div
              className={
                'mt-3 text-3xl font-semibold tracking-tight tabular-nums ' +
                (s.accent ? 'text-accent' : 'text-foreground')
              }
            >
              {s.value.toLocaleString()}
            </div>
            {s.caption ? (
              <div className="mt-2 text-xs text-muted">{s.caption}</div>
            ) : null}
          </div>
        );
        return s.href ? (
          <Link key={s.label} href={s.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={s.label}>{inner}</div>
        );
      })}
    </div>
  );
}
