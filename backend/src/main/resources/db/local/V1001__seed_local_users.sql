-- =============================================
-- ローカル/開発環境専用の初期ユーザー
-- password: password
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (id, username, email, password_hash, name, role)
SELECT
    1,
    'admin',
    'admin@example.com',
    crypt('password', gen_salt('bf', 10)),
    '管理者',
    'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1 OR username = 'admin');

INSERT INTO users (id, username, email, password_hash, name, role)
SELECT
    2,
    'staff',
    'staff@example.com',
    crypt('password', gen_salt('bf', 10)),
    'スタッフ',
    'STAFF'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2 OR username = 'staff');

INSERT INTO users (id, username, email, password_hash, name, role)
SELECT
    3,
    'instructor',
    'instructor@example.com',
    crypt('password', gen_salt('bf', 10)),
    '講師サンプル',
    'INSTRUCTOR'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 3 OR username = 'instructor');

SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1), true);
