// 东方财富注册制 IPO 数据：分别抓 5 个板块
import { fetchJson } from './http';
import { Company, ReviewStatus, AMarket } from '../../src/lib/types';

interface EmRow {
  // schema A: 科创板 / 深主板
  ORG_NAME?: string | null;
  LATEST_CHECK_STATUS?: string | null;
  SPONSORORG_NAME?: string | null;
  // schema B: 创业板 / 北交所 / 沪主板
  ISSUER_NAME?: string | null;
  CHECK_STATUS?: string | null;
  RECOMMEND_ORG?: string | null;
  CSRC_INDUSTRY?: string | null;
  // 公共
  ORG_CODE?: string | null;
  SECURITY_CODE?: string | null;
  SECUCODE?: string | null;
  SECURITY_NAME?: string | null;
  SECURITY_NAME_ABBR?: string | null;
  ACCEPT_DATE?: string | null;
  UPDATE_DATE?: string | null;
}

interface EmResponse {
  success: boolean;
  message?: string;
  result?: {
    pages: number;
    data: EmRow[];
  } | null;
}

const ENDPOINTS: { reportName: string; market: AMarket; rawUrl: string }[] = [
  {
    reportName: 'RPT_KCB_IPO',
    market: 'sh-star',
    rawUrl: 'https://kcb.sse.com.cn/renewal/',
  },
  {
    reportName: 'RPT_SSZB_REGIPO_BASICINFO',
    market: 'sh-main',
    rawUrl: 'https://www.sse.com.cn/listing/announcement/notification/',
  },
  {
    reportName: 'RPT_GEM_REGIPO_BASICINFO',
    market: 'sz-chinext',
    rawUrl: 'https://listing.szse.cn/disclosure/ipo/index.html',
  },
  {
    reportName: 'RPT_HSZB_IPO',
    market: 'sz-main',
    rawUrl: 'https://listing.szse.cn/disclosure/ipo/index.html',
  },
  {
    reportName: 'RPT_BJT_REGIPO_BASICINFO',
    market: 'bse',
    rawUrl: 'https://www.bse.cn/audit/project_news.html',
  },
];

const STATUS_MAP: Record<string, ReviewStatus> = {
  已受理: 'accepted',
  已问询: 'inquired',
  '上市委会议': 'committee',
  '上市委会议通过': 'passed',
  '上会通过': 'passed',
  '上市委审议通过': 'passed',
  '提交注册': 'submitted',
  '注册生效': 'effective',
  '注册有效': 'effective',
  '注册结果': 'effective',
  '中止': 'suspended',
  '中止审核': 'suspended',
  '中止注册': 'suspended',
  '终止': 'terminated',
  '终止审核': 'terminated',
  '终止注册': 'terminated',
  '已上市': 'listed',
  '上市': 'listed',
};

function normalizeStatus(raw?: string | null): ReviewStatus {
  if (!raw) return 'accepted';
  const v = raw.trim();
  if (STATUS_MAP[v]) return STATUS_MAP[v];
  // 关键字模糊匹配
  if (v.includes('注册生效') || v.includes('注册有效')) return 'effective';
  if (v.includes('提交注册')) return 'submitted';
  if (v.includes('上市委') && v.includes('通过')) return 'passed';
  if (v.includes('上市委')) return 'committee';
  if (v.includes('终止')) return 'terminated';
  if (v.includes('中止')) return 'suspended';
  if (v.includes('问询')) return 'inquired';
  if (v.includes('受理')) return 'accepted';
  if (v.includes('上市')) return 'listed';
  return 'accepted';
}

function toIsoDate(s?: string | null): string | undefined {
  if (!s) return undefined;
  // 输入形如 "2026-04-28 00:00:00"
  const d = new Date(s.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function buildId(row: EmRow, market: AMarket): string {
  const code = row.ORG_CODE || row.SECURITY_CODE || row.SECUCODE;
  return `em:${market}:${code ?? row.ORG_NAME ?? row.ISSUER_NAME ?? Math.random()}`;
}

function rowToCompany(row: EmRow, market: AMarket, rawUrl: string): Company | null {
  const name =
    row.ORG_NAME ?? row.ISSUER_NAME ?? row.SECURITY_NAME ?? row.SECURITY_NAME_ABBR;
  if (!name) return null;
  const status = normalizeStatus(row.LATEST_CHECK_STATUS ?? row.CHECK_STATUS);
  return {
    id: buildId(row, market),
    name: name.trim(),
    market,
    status,
    industry: row.CSRC_INDUSTRY ?? undefined,
    sponsor: (row.SPONSORORG_NAME ?? row.RECOMMEND_ORG ?? undefined) ?? undefined,
    acceptDate: toIsoDate(row.ACCEPT_DATE),
    updateDate: toIsoDate(row.UPDATE_DATE),
    source: 'eastmoney',
    rawUrl,
  };
}

async function fetchEndpoint(
  reportName: string,
  market: AMarket,
  rawUrl: string
): Promise<Company[]> {
  // 一次最多拉 2000 条；实际数据各板块在百到千级
  const url =
    'https://datacenter-web.eastmoney.com/api/data/v1/get?' +
    new URLSearchParams({
      reportName,
      columns: 'ALL',
      pageNumber: '1',
      pageSize: '2000',
      sortColumns: 'UPDATE_DATE',
      sortTypes: '-1',
      source: 'WEB',
      client: 'WEB',
    }).toString();

  const data = await fetchJson<EmResponse>(url, {
    headers: { Referer: 'https://emdata.eastmoney.com/' },
    timeoutMs: 30000,
  });
  if (!data.success || !data.result) {
    throw new Error(`Eastmoney ${reportName} failed: ${data.message ?? 'no result'}`);
  }

  const out: Company[] = [];
  for (const row of data.result.data) {
    const c = rowToCompany(row, market, rawUrl);
    if (c) out.push(c);
  }
  return out;
}

export async function fetchEastmoneyAll(): Promise<{
  companies: Company[];
  errors: { source: string; message: string }[];
}> {
  const all: Company[] = [];
  const errors: { source: string; message: string }[] = [];
  await Promise.all(
    ENDPOINTS.map(async ({ reportName, market, rawUrl }) => {
      try {
        const list = await fetchEndpoint(reportName, market, rawUrl);
        all.push(...list);
      } catch (err) {
        errors.push({
          source: `eastmoney:${reportName}`,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })
  );
  return { companies: all, errors };
}
