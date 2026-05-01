// HKEx 拟上市数据抓取
//
// 注意：HKEx 的 Application Proofs / PHIP 列表通过 SPA 异步加载，
// 公开 REST API 难以直接调用，且受 Akamai Bot Manager 保护。
// MVP 阶段暂用占位实现，保留 data/h-shares.json 内的现有数据；
// 真实的 HKEx 接入计划在 v2 通过 Playwright 抓取。
import { Company } from '../../src/lib/types';

export async function fetchHkex(): Promise<{
  companies: Company[] | null;
  errors: { source: string; message: string }[];
}> {
  // 返回 null 表示「不更新 h-shares.json」，由 index.ts 决定保留旧数据
  return {
    companies: null,
    errors: [
      {
        source: 'hkex',
        message:
          'HKEx 自动抓取尚未实现（v2 计划通过 Playwright 解析 Application Proofs / PHIP）',
      },
    ],
  };
}
