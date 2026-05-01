import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

interface HeaderProps {
  updatedAt?: string;
  active?: 'home' | 'a' | 'h';
}

const NAV = [
  { href: '/', label: '概览', key: 'home' as const },
  { href: '/a-shares', label: 'A 股', key: 'a' as const },
  { href: '/h-shares', label: 'H 股', key: 'h' as const },
];

export default function Header({ updatedAt, active = 'home' }: HeaderProps) {
  return (
    <header className="border-b border-border/80 bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            IPO 动态监控
          </Link>
          <span className="hidden text-sm text-muted sm:inline">
            A 股 · H 股 拟发行公司
          </span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    'rounded-full px-3 py-1.5 transition-colors ' +
                    (isActive
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:bg-zinc-100 hover:text-foreground')
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {updatedAt ? (
            <span className="hidden text-xs text-muted md:inline">
              更新于 {formatDateTime(updatedAt)}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
