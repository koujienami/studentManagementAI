-- =============================================
-- 参照用の初期データ
-- - 申込経路は DB から取得する運用とし、固定IDで登録する
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
