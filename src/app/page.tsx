import Link from 'next/link';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import RecentUpdates from '@/components/RecentUpdates';
import { getAShares, getHShares, getMeta } from '@/lib/data';
import {
  newlyAcceptedThisWeek,
  passedOrEffectiveThisWeek,
  recentlyUpdated,
} from '@/lib/utils';

export default async function HomePage() {
  const [aShares, hShares, meta] = await Promise.all([
    getAShares(),
    getHShares(),
    getMeta(),
  ]);

  const all = [...aShares, ...hShares];
  const stats = [
    {
      label: 'A 股拟发行',
      value: aShares.length,
      caption: '沪深北全市场',
      href: '/a-shares',
      accent: true,
    },
    {
      label: 'H 股拟发行',
      value: hShares.length,
      caption: '港交所主板 / GEM',
      href: '/h-shares',
      accent: true,
    },
    {
      label: '本周新增受理',
      value: newlyAcceptedThisWeek(all),
      caption: '近 7 天受理',
    },
    {
      label: '本周通过 / 生效',
      value: passedOrEffectiveThisWeek(all),
      caption: '近 7 天审核结果',
    },
  ];

  const recentA = recentlyUpdated(aShares, 7, 6);
  const recentH = recentlyUpdated(hShares, 7, 6);
  const hasErrors = (meta.sourceErrors?.length ?? 0) > 0;

  return (
    <>
      <Header updatedAt={meta.updatedAt} active="home" />
      <main className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">概览</h1>
              <p className="mt-1 text-sm text-muted">
                A 股 / H 股 拟发行公司审核进度，每日自动同步官方披露数据。
              </p>
            </div>
          </div>
          {hasErrors ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              部分数据源不可用：
              {meta.sourceErrors?.map((e) => e.source).join('、')}
              。当前展示的是上一次成功抓取的结果。
            </div>
          ) : null}
          <StatsCards stats={stats} />
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <RecentUpdates items={recentA} title="A 股最新动态" />
          <RecentUpdates items={recentH} title="H 股最新动态" />
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/a-shares"
            className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-zinc-300 hover:bg-white"
          >
            <div>
              <div className="text-sm font-medium">查看 A 股全部</div>
              <div className="mt-0.5 text-xs text-muted">
                按板块、状态、保荐机构筛选
              </div>
            </div>
            <Arrow />
          </Link>
          <Link
            href="/h-shares"
            className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-zinc-300 hover:bg-white"
          >
            <div>
              <div className="text-sm font-medium">查看 H 股全部</div>
              <div className="mt-0.5 text-xs text-muted">
                按板块、状态、保荐机构筛选
              </div>
            </div>
            <Arrow />
          </Link>
        </section>

        <Footer />
      </main>
    </>
  );
}

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
    >
      <path
        fill="currentColor"
        d="M7.293 4.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L11.586 10L7.293 5.707a1 1 0 0 1 0-1.414Z"
      />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border pt-6 text-xs text-muted">
      数据源：上交所、深交所、北交所、东方财富、港交所披露易。本站仅展示公开披露信息，不构成任何投资建议。
    </footer>
  );
}
