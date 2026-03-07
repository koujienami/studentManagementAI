# DB変更運用

## 方針
- DBスキーマ管理は `schema.sql` ベースの初期化から `Flyway` ベースへ移行する。
- 新規テーブル・列追加・制約変更は `backend/src/main/resources/db/migration` にバージョン付き SQL を追加する。
- `local` `dev` `prod` の全環境で `spring.flyway.enabled=true` を前提にする。
- 既存環境への導入を考慮し、各プロファイルで `baseline-on-migrate: true` を有効化する。

## 採用理由
- Phase3以降は `Student` `Enrollment` `Payment` `Hearing` と差分が継続的に増える。
- `schema.sql` の一括再投入では、既存データを持つ環境との差分追跡が難しい。
- `Payment -> Enrollment` のような依存順を明示的に管理できる。

## 運用ルール
1. 既存テーブルの定義変更は直接 `schema.sql` を編集せず、必ず新しい migration を追加する。
2. 参照データの固定値は migration で投入し、アプリケーションコードと ID を揃える。
3. 破壊的変更が必要な場合は、移行 SQL とアプリケーション変更を同じPRに含める。

## 初期マイグレーション
- `V1__init_schema.sql`
  - 現行の基本スキーマを作成する。
- `V2__seed_reference_data.sql`
  - 申込経路の固定データと、ローカル検証用ユーザーを投入する。
