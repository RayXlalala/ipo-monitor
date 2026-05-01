import { ReviewStatus, STATUS_LABEL, STATUS_THEME } from '@/lib/types';

export default function StatusBadge({
  status,
  size = 'md',
}: {
  status: ReviewStatus;
  size?: 'sm' | 'md';
}) {
  const t = STATUS_THEME[status];
  const sizeCls =
    size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset ${t.bg} ${t.text} ${t.ring} ${sizeCls}`}
    >
      <span className={`size-1.5 rounded-full ${t.text} bg-current`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
