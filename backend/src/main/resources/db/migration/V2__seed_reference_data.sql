-- =============================================
-- 参照用の初期データ
-- - 申込経路は当面コード管理で扱うが、FK整合性のため固定IDで登録
-- - 運営ユーザーはローカル検証用の初期データ
--   password: password
-- =============================================

INSERT INTO referral_sources (id, name, category)
SELECT 1, '公式サイト', 'WEB'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 1);

INSERT INTO referral_sources (id, name, category)
SELECT 2, '広告', 'AD'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 2);

INSERT INTO referral_sources (id, name, category)
SELECT 3, 'SNS', 'SNS'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 3);

INSERT INTO referral_sources (id, name, category)
SELECT 4, '紹介', 'REFERRAL'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 4);

INSERT INTO referral_sources (id, name, category)
SELECT 5, 'その他', 'OTHER'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 5);

SELECT setval('referral_sources_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM referral_sources), 1), true);

INSERT INTO users (id, username, email, password_hash, name, role)
SELECT
    1,
    'admin',
    'admin@example.com',
    '$2a$06$Wqcb24LHUlY35L9sGHi8MeeVbF.tqXVmFkvqLTCa8bgMJLEbcp1RS',
    '管理者',
    'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1 OR username = 'admin');

INSERT INTO users (id, username, email, password_hash, name, role)
SELECT
    2,
    'staff',
    'staff@example.com',
    '$2a$06$Wqcb24LHUlY35L9sGHi8MeeVbF.tqXVmFkvqLTCa8bgMJLEbcp1RS',
    'スタッフ',
    'STAFF'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2 OR username = 'staff');

INSERT INTO users (id, username, email, password_hash, name, role)
SELECT
    3,
    'instructor',
    'instructor@example.com',
    '$2a$06$Wqcb24LHUlY35L9sGHi8MeeVbF.tqXVmFkvqLTCa8bgMJLEbcp1RS',
    '講師サンプル',
    'INSTRUCTOR'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 3 OR username = 'instructor');

SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1), true);
