import { Company, ReviewStatus, MetaCounts } from './types';

/** 把 ISO 时间字符串格式化为 "YYYY-MM-DD" */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD HH:mm" 当地时区 */
export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 距离现在的相对描述："今日"/"3 天前"/"YYYY-MM-DD" */
export function relativeDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return '今日';
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
  return formatDate(iso);
}

/** 计算列表的统计 */
export function countByStatus(list: Company[]): MetaCounts {
  const byStatus: Partial<Record<ReviewStatus, number>> = {};
  for (const c of list) {
    byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
  }
  return { total: list.length, byStatus };
}

/** 取最近 N 天有更新的公司，按 updateDate 倒序 */
export function recentlyUpdated(list: Company[], days = 7, limit = 8): Company[] {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return [...list]
    .filter((c) => c.updateDate && new Date(c.updateDate).getTime() >= since)
    .sort((a, b) => (b.updateDate ?? '').localeCompare(a.updateDate ?? ''))
    .slice(0, limit);
}

/** 本周新增受理 */
export function newlyAcceptedThisWeek(list: Company[]): number {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return list.filter(
    (c) => c.acceptDate && new Date(c.acceptDate).getTime() >= since
  ).length;
}

/** 本周通过/生效 */
export function passedOrEffectiveThisWeek(list: Company[]): number {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return list.filter(
    (c) =>
      (c.status === 'passed' || c.status === 'effective') &&
      c.updateDate &&
      new Date(c.updateDate).getTime() >= since
  ).length;
}
