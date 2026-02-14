# 受講生管理システム - プロジェクトルール

このドキュメントは、Claude Code および Cursor を使用した開発時のルールを定義します。

## 1. ブランチ運用ルール

### 1.1 ブランチ作成の原則

- **開発作業は必ず新規ブランチで実施する**
- **メインブランチ（main）での直接作業は禁止**
- **ブランチ作成時は必ずIssueとセットで作成する**

### 1.2 ブランチ命名規則

```
{タイプ}/{Issue番号}-{説明}
```

| タイプ | 用途 | 例 |
|--------|------|-----|
| `feature` | 新機能追加 | `feature/123-add-student-list` |
| `fix` | バグ修正 | `fix/456-fix-login-error` |
| `docs` | ドキュメント更新 | `docs/789-update-requirements` |
| `chore` | 設定・保守作業 | `chore/101-update-dependencies` |
| `hotfix` | 緊急修正 | `hotfix/202-critical-security-fix` |

### 1.3 ブランチ作成手順

1. Issueを作成する
2. Issue番号を取得する
3. ブランチを作成する

```bash
# Issue作成
gh issue create --title "機能: 受講生一覧画面の実装" --body "..."

# Issue番号を確認（例: #123）
gh issue list

# ブランチ作成
git checkout -b feature/123-student-list
```

## 2. Issue連携ルール

### 2.1 PRとIssueの紐付け

- **PRタイトルにIssue番号を含める**: `(#123)` 形式

```
docs: 要件定義ドキュメントを更新 (#123)
feat: 受講生一覧画面を実装 (#456)
fix: ログインエラーを修正 (#789)
```

### 2.2 自動クローズ

- **PRがマージされると、ブランチ名から関連Issueが自動的にクローズされる**
- ブランチ名パターン: `feature/123-...` → Issue #123 がクローズ

## 3. コミットメッセージ規則

### 3.1 Conventional Commits形式

```
{タイプ}: {説明} (#{Issue番号})
```

| タイプ | 用途 |
|--------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（コードの動作に影響しない変更） |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | ビルド・設定変更 |

### 3.2 例

```bash
git commit -m "feat: 受講生一覧APIを実装 (#123)"
git commit -m "docs: システム概要を更新 (#456)"
git commit -m "fix: 認証トークンの有効期限チェックを修正 (#789)"
```

## 4. プロジェクト構成

```
studentManagementAI/
├── docs/                          # ドキュメント
│   └── 01_要件定義/              # 要件定義
│       ├── システム概要.md
│       ├── 機能要件.md
│       ├── 非機能要件.md
│       ├── ユースケース.md
│       ├── 画面一覧.md
│       ├── 要望一覧.md
│       └── 概念データモデル.md
├── backend/                       # バックエンド（Java/Spring Boot）※将来
├── frontend/                      # フロントエンド（React + Vite）
├── .github/
│   └── workflows/
│       ├── claude-review.yml     # Claude自動レビュー
│       └── close-issue-on-merge.yml  # Issue自動クローズ
├── CLAUDE.md                      # このファイル
├── .cursorrules                   # Cursorルール
└── README.md
```

## 5. 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React + Vite + TypeScript |
| バックエンド | Java (Spring Boot) |
| データベース | PostgreSQL |
| ホスティング | Railway |
| CI/CD | GitHub Actions |
| 認証 | JWT |

## 6. 開発フロー

```mermaid
graph LR
    A[Issue作成] --> B[ブランチ作成]
    B --> C[開発・コミット]
    C --> D[PR作成]
    D --> E[Claude自動レビュー]
    E --> F[レビュー対応]
    F --> G[マージ]
    G --> H[ブランチ自動削除]
    H --> I[Issue自動クローズ]
```

## 7. 参照ドキュメント

### 要件定義

- [システム概要](docs/01_要件定義/システム概要.md)
- [機能要件](docs/01_要件定義/機能要件.md)
- [非機能要件](docs/01_要件定義/非機能要件.md)
- [ユースケース](docs/01_要件定義/ユースケース.md)
- [画面一覧](docs/01_要件定義/画面一覧.md)
- [要望一覧](docs/01_要件定義/要望一覧.md)
- [概念データモデル](docs/01_要件定義/概念データモデル.md)

## 8. 注意事項

- **秘密情報（APIキー、パスワード等）はコミットしない**
- **環境変数で管理する（.envファイルは.gitignoreに含まれている）**
- **PRを作成する前にローカルでテストを実行する**
- **レビューコメントには必ず対応する**
