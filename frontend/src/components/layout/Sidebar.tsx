import { NavLink } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

/** サイドバーのナビゲーション項目 */
interface NavItem {
  label: string;
  to: string;
  /** 表示を許可するロール（省略時は全ロール） */
  roles?: Role[];
}

const navItems: NavItem[] = [
  { label: 'ダッシュボード', to: '/dashboard' },
  { label: '受講生管理', to: '/students' },
  { label: 'コース管理', to: '/courses' },
  { label: 'メールテンプレート', to: '/mail-templates', roles: ['ADMIN'] },
  { label: '運営メンバー', to: '/members', roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold">受講生管理</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
