import Header from '@/components/Header';
import CompanyExplorer from '@/components/CompanyExplorer';
import { getHShares, getMeta } from '@/lib/data';
import { H_MARKETS } from '@/lib/types';

export const metadata = {
  title: 'H 股拟发行公司｜IPO 动态监控',
};

export default async function HShares() {
  const [companies, meta] = await Promise.all([getHShares(), getMeta()]);

  return (
    <>
      <Header updatedAt={meta.updatedAt} active="h" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">H 股拟发行公司</h1>
          <p className="mt-1 text-sm text-muted">
            港交所主板与 GEM 申请人/新上市信息。
          </p>
        </div>
        <CompanyExplorer companies={companies} markets={H_MARKETS} />
      </main>
    </>
  );
}
