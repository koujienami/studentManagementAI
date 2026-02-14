import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

/**
 * 管理画面の共通レイアウト
 * - 左側: サイドバー（ナビゲーション）
 * - 右側上部: ヘッダー（ユーザーメニュー）
 * - 右側メイン: 各ページの内容
 */
export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
