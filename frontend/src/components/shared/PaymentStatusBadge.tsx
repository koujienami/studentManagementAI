import { Badge } from '@/components/ui/badge';
import { PAYMENT_STATUS_LABELS } from '@/constants';
import type { PaymentStatus } from '@/types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge variant={status === 'PAID' ? 'secondary' : 'outline'}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
