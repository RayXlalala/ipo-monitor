// 爬虫入口：编排各源 -> 写入 data/*.json
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Company, Meta, MetaCounts, ReviewStatus } from '../../src/lib/types';
import { fetchEastmoneyAll } from './eastmoney';
import { fetchHkex } from './hkex';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, name), 'utf8');
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, value: unknown): Promise<void> {
  const target = path.join(DATA_DIR, name);
  await fs.writeFile(target, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function dedup(list: Company[]): Company[] {
  const seen = new Set<string>();
  const out: Company[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

const ACTIVE_STATUS = new Set<ReviewStatus>([
  'accepted',
  'inquired',
  'committee',
  'passed',
  'submitted',
]);

/** 聚焦"拟发行"：保留全部活跃状态 + 近 12 个月生效/中止 + 近 6 个月终止 */
function focusOnPending(list: Company[]): Company[] {
  const now = Date.now();
  const within = (iso: string | undefined, days: number): boolean => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    return now - t <= days * 24 * 60 * 60 * 1000;
  };
  return list.filter((c) => {
    if (ACTIVE_STATUS.has(c.status)) return true;
    if (c.status === 'effective') return within(c.updateDate, 365);
    if (c.status === 'suspended') return within(c.updateDate, 365);
    if (c.status === 'terminated') return within(c.updateDate, 180);
    return false;
  });
}

function sortByUpdate(list: Company[]): Company[] {
  return [...list].sort((a, b) =>
    (b.updateDate ?? '').localeCompare(a.updateDate ?? '')
  );
}

function countByStatus(list: Company[]): MetaCounts {
  const byStatus: Partial<Record<ReviewStatus, number>> = {};
  for (const c of list) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }
  return { total: list.length, byStatus };
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const errors: { source: string; message: string; at: string }[] = [];
  const now = new Date().toISOString();

  // A 股
  console.log('▸ 拉取东方财富 A 股注册制 IPO 数据 ...');
  const em = await fetchEastmoneyAll();
  for (const e of em.errors) errors.push({ ...e, at: now });
  const aShares = sortByUpdate(focusOnPending(dedup(em.companies)));
  console.log(`  ✔ A 股 ${aShares.length} 家`);

  // H 股
  console.log('▸ 拉取港交所 H 股拟上市数据 ...');
  const hk = await fetchHkex();
  for (const e of hk.errors) errors.push({ ...e, at: now });
  let hShares: Company[];
  if (hk.companies === null) {
    // 保留现有数据
    hShares = await readJson<Company[]>('h-shares.json', []);
    console.log(`  ⚠ H 股保留现有 ${hShares.length} 家（未实现自动抓取）`);
  } else {
    hShares = sortByUpdate(focusOnPending(dedup(hk.companies)));
    console.log(`  ✔ H 股 ${hShares.length} 家`);
  }

  const meta: Meta = {
    updatedAt: now,
    counts: {
      aShares: countByStatus(aShares),
      hShares: countByStatus(hShares),
    },
    sourceErrors: errors,
  };

  // 仅当 A 股至少有一家公司时才覆盖（避免 A 股全失败导致清空数据）
  if (aShares.length > 0) {
    await writeJson('a-shares.json', aShares);
  } else {
    console.warn('  ⚠ A 股结果为空，保留现有 a-shares.json');
  }

  // H 股若为占位实现则不动文件
  if (hk.companies !== null && hShares.length > 0) {
    await writeJson('h-shares.json', hShares);
  }

  await writeJson('_meta.json', meta);

  console.log(`✓ 数据写入完成 (${now})`);
  if (errors.length > 0) {
    console.log(`  注意：${errors.length} 个数据源出错：`);
    for (const e of errors) console.log(`   - ${e.source}: ${e.message}`);
  }
}

main().catch((err) => {
  console.error('crawl failed:', err);
  process.exit(1);
});
