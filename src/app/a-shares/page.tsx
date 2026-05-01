import Header from '@/components/Header';
import CompanyExplorer from '@/components/CompanyExplorer';
import { getAShares, getMeta } from '@/lib/data';
import { A_MARKETS } from '@/lib/types';

export const metadata = {
  title: 'A 股拟发行公司｜IPO 动态监控',
};

export default async function AShares() {
  const [companies, meta] = await Promise.all([getAShares(), getMeta()]);

  return (
    <>
      <Header updatedAt={meta.updatedAt} active="a" />
      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">A 股拟发行公司</h1>
          <p className="mt-1 text-sm text-muted">
            沪市主板、科创板、深市主板、创业板、北交所审核进度。
          </p>
        </div>
        <CompanyExplorer companies={companies} markets={A_MARKETS} />
      </main>
    </>
  );
}
