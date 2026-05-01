// IPO 拟发行公司数据模型

export type AMarket = 'sh-main' | 'sh-star' | 'sz-main' | 'sz-chinext' | 'bse';
export type HMarket = 'hk-main' | 'hk-gem';
export type Market = AMarket | HMarket;

export type ReviewStatus =
  | 'accepted' // 已受理
  | 'inquired' // 已问询
  | 'committee' // 上市委审议
  | 'passed' // 上市委通过
  | 'submitted' // 提交注册
  | 'effective' // 注册生效
  | 'suspended' // 中止
  | 'terminated' // 终止
  | 'listed'; // 已上市

export interface CompanyDocument {
  type: string;
  url: string;
  date?: string;
}

export interface Company {
  id: string;
  name: string;
  nameEn?: string;
  market: Market;
  status: ReviewStatus;
  industry?: string;
  sponsor?: string;
  acceptDate?: string;
  updateDate?: string;
  documents?: CompanyDocument[];
  source: string;
  rawUrl?: string;
}

export interface MetaCounts {
  total: number;
  byStatus: Partial<Record<ReviewStatus, number>>;
}

export interface SourceError {
  source: string;
  message: string;
  at: string;
}

export interface Meta {
  updatedAt: string;
  counts: { aShares: MetaCounts; hShares: MetaCounts };
  sourceErrors?: SourceError[];
}

// 中文展示名
export const STATUS_LABEL: Record<ReviewStatus, string> = {
  accepted: '已受理',
  inquired: '已问询',
  committee: '上市委审议',
  passed: '上市委通过',
  submitted: '提交注册',
  effective: '注册生效',
  suspended: '中止',
  terminated: '终止',
  listed: '已上市',
};

export const MARKET_LABEL: Record<Market, string> = {
  'sh-main': '沪市主板',
  'sh-star': '科创板',
  'sz-main': '深市主板',
  'sz-chinext': '创业板',
  bse: '北交所',
  'hk-main': '港股主板',
  'hk-gem': '港股 GEM',
};

export const A_MARKETS: AMarket[] = ['sh-main', 'sh-star', 'sz-main', 'sz-chinext', 'bse'];
export const H_MARKETS: HMarket[] = ['hk-main', 'hk-gem'];

// 状态主题色（Tailwind 类）
export const STATUS_THEME: Record<ReviewStatus, { bg: string; text: string; ring: string }> = {
  accepted: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  inquired: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  committee: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
  passed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  submitted: { bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200' },
  effective: { bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-300' },
  suspended: { bg: 'bg-zinc-100', text: 'text-zinc-600', ring: 'ring-zinc-300' },
  terminated: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  listed: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-300' },
};
