import { Badge } from '@/components/ui/badge';
import { STUDENT_STATUS_LABELS } from '@/constants';
import type { StudentStatus } from '@/types';

const STATUS_VARIANTS: Record<StudentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PROVISIONAL: 'outline',
  PRE_HEARING: 'secondary',
  POST_HEARING: 'default',
  ENROLLED: 'default',
  COMPLETED: 'secondary',
  WITHDRAWN: 'destructive',
};

interface StudentStatusBadgeProps {
  status: StudentStatus;
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STUDENT_STATUS_LABELS[status]}</Badge>;
}
