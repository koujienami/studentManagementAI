-- baseline-on-migrate で既存DBを引き継いだ環境向けに、
-- 申込経路の固定データが不足している場合のみ補完する。

INSERT INTO referral_sources (id, name, category)
SELECT 1, '公式サイト', 'WEB'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 1);

INSERT INTO referral_sources (id, name, category)
SELECT 2, 'Google 広告', 'AD'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 2);

INSERT INTO referral_sources (id, name, category)
SELECT 3, 'Meta 広告（Facebook/Instagram）', 'AD'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 3);

INSERT INTO referral_sources (id, name, category)
SELECT 4, 'YouTube 広告', 'AD'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 4);

INSERT INTO referral_sources (id, name, category)
SELECT 5, '検索エンジン（オーガニック）', 'SEARCH'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 5);

INSERT INTO referral_sources (id, name, category)
SELECT 6, 'AI（ChatGPT、Claude 等）', 'AI'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 6);

INSERT INTO referral_sources (id, name, category)
SELECT 7, 'YouTube', 'SNS'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 7);

INSERT INTO referral_sources (id, name, category)
SELECT 8, 'Meta（Facebook/Instagram）', 'SNS'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 8);

INSERT INTO referral_sources (id, name, category)
SELECT 9, 'X（旧Twitter）', 'SNS'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 9);

INSERT INTO referral_sources (id, name, category)
SELECT 10, '紹介', 'REFERRAL'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 10);

INSERT INTO referral_sources (id, name, category)
SELECT 11, 'イベント', 'OTHER'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 11);

INSERT INTO referral_sources (id, name, category)
SELECT 12, 'その他', 'OTHER'
WHERE NOT EXISTS (SELECT 1 FROM referral_sources WHERE id = 12);

SELECT setval('referral_sources_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM referral_sources), 1), true);
