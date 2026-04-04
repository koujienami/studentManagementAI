-- ヒアリングURL用トークン（未使用・使用済みを管理）
CREATE TABLE IF NOT EXISTS hearing_tokens (
    id         BIGSERIAL   PRIMARY KEY,
    student_id BIGINT      NOT NULL,
    token      VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP,
    used_at    TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hearing_tokens_student
        FOREIGN KEY (student_id) REFERENCES students (id)
);

CREATE INDEX IF NOT EXISTS idx_hearing_tokens_student ON hearing_tokens (student_id);

-- 同一受講生・同一項目の重複回答を防ぐ（UPSERT 用）
ALTER TABLE hearing_answers
    ADD CONSTRAINT uq_hearing_answers_student_item UNIQUE (student_id, hearing_item_id);

-- ヒアリング項目（TEXT のみ・初期データ）
INSERT INTO hearing_items (id, name, type, required, display_order)
SELECT 1, '現在のご職業・活動について教えてください', 'TEXT', TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM hearing_items WHERE id = 1);

INSERT INTO hearing_items (id, name, type, required, display_order)
SELECT 2, '本コースで学びたいこと・目標を教えてください', 'TEXT', TRUE, 2
WHERE NOT EXISTS (SELECT 1 FROM hearing_items WHERE id = 2);

INSERT INTO hearing_items (id, name, type, required, display_order)
SELECT 3, 'その他、伝えておきたいことがあればご記入ください', 'TEXT', FALSE, 3
WHERE NOT EXISTS (SELECT 1 FROM hearing_items WHERE id = 3);

SELECT setval('hearing_items_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM hearing_items), 1), true);
