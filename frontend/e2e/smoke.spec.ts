import { test, expect } from '@playwright/test';

test.describe('公開画面スモーク', () => {
  test('ログイン画面が表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('受講生管理システム')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('申込画面の見出しが表示される', async ({ page }) => {
    await page.goto('/apply');
    await expect(page.getByRole('heading', { name: '受講お申し込み' })).toBeVisible();
  });

  test('ヒアリング画面が読み込まれる（バックエンドなしではエラー表示になりうる）', async ({
    page,
  }) => {
    await page.goto('/hearing/0000000000000000000000000000000000000000000000000000000000000000');
    await expect(page.getByRole('heading', { name: 'ヒアリングフォーム' })).toBeVisible();
    await expect(
      page.getByText(/読み込み中|無効|ヒアリング情報の取得に失敗|Network Error|ERR_/).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('ヒアリング完了画面が表示される', async ({ page }) => {
    await page.goto('/hearing/complete');
    await expect(page.getByText('ヒアリングを受け付けました')).toBeVisible();
  });
});
