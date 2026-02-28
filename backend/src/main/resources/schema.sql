-- =============================================
-- 受講生管理システム DDL
-- =============================================

-- ユーザー（管理者/スタッフ/講師）
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'INSTRUCTOR')),
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 申込経路マスタ
CREATE TABLE IF NOT EXISTS referral_sources (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    category   VARCHAR(50)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 受講生
CREATE TABLE IF NOT EXISTS students (
    id                 BIGSERIAL    PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    email              VARCHAR(255) NOT NULL,
    phone              VARCHAR(20),
    address            VARCHAR(500),
    birthdate          DATE,
    gender             VARCHAR(10),
    status             VARCHAR(20)  NOT NULL CHECK (status IN (
                           'PROVISIONAL', 'PRE_HEARING', 'POST_HEARING',
                           'ENROLLED', 'COMPLETED', 'WITHDRAWN'
                       )),
    chat_username      VARCHAR(100),
    referral_source_id BIGINT       NOT NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_referral_source
        FOREIGN KEY (referral_source_id) REFERENCES referral_sources (id)
);

-- コース
CREATE TABLE IF NOT EXISTS courses (
    id            BIGSERIAL      PRIMARY KEY,
    name          VARCHAR(200)   NOT NULL,
    description   TEXT,
    price         INTEGER        NOT NULL,
    capacity      INTEGER,
    status        VARCHAR(20)    NOT NULL CHECK (status IN (
                      'RECRUITING', 'ONGOING', 'FULL', 'ENDED'
                  )),
    instructor_id BIGINT,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_instructor
        FOREIGN KEY (instructor_id) REFERENCES users (id)
);

-- 受講履歴
CREATE TABLE IF NOT EXISTS enrollments (
    id         BIGSERIAL   PRIMARY KEY,
    student_id BIGINT      NOT NULL,
    course_id  BIGINT      NOT NULL,
    start_date DATE        NOT NULL,
    end_date   DATE,
    status     VARCHAR(20) NOT NULL CHECK (status IN ('ENROLLED', 'COMPLETED', 'WITHDRAWN')),
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_enrollments_student
        FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_enrollments_course
        FOREIGN KEY (course_id) REFERENCES courses (id)
);

-- 決済
CREATE TABLE IF NOT EXISTS payments (
    id            BIGSERIAL   PRIMARY KEY,
    student_id    BIGINT      NOT NULL,
    enrollment_id BIGINT      NOT NULL,
    amount        INTEGER     NOT NULL,
    due_date      DATE        NOT NULL,
    paid_date     DATE,
    status        VARCHAR(20) NOT NULL CHECK (status IN ('UNPAID', 'PAID')),
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_student
        FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_payments_enrollment
        FOREIGN KEY (enrollment_id) REFERENCES enrollments (id)
);

-- ヒアリング項目マスタ
CREATE TABLE IF NOT EXISTS hearing_items (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    type          VARCHAR(30)  NOT NULL,
    required      BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INTEGER      NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ヒアリング回答
CREATE TABLE IF NOT EXISTS hearing_answers (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT    NOT NULL,
    hearing_item_id BIGINT    NOT NULL,
    answer          TEXT      NOT NULL,
    answered_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hearing_answers_student
        FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_hearing_answers_hearing_item
        FOREIGN KEY (hearing_item_id) REFERENCES hearing_items (id)
);

-- メールテンプレート
CREATE TABLE IF NOT EXISTS mail_templates (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    subject      VARCHAR(500) NOT NULL,
    body         TEXT         NOT NULL,
    trigger_type VARCHAR(50),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- メール送付履歴
CREATE TABLE IF NOT EXISTS mail_histories (
    id          BIGSERIAL    PRIMARY KEY,
    student_id  BIGINT       NOT NULL,
    user_id     BIGINT,
    template_id BIGINT,
    subject     VARCHAR(500) NOT NULL,
    body        TEXT         NOT NULL,
    sent_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mail_histories_student
        FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_mail_histories_user
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_mail_histories_template
        FOREIGN KEY (template_id) REFERENCES mail_templates (id)
);

-- =============================================
-- インデックス
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_username      ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email         ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users (role);
CREATE INDEX IF NOT EXISTS idx_students_email      ON students (email);
CREATE INDEX IF NOT EXISTS idx_students_status     ON students (status);
CREATE INDEX IF NOT EXISTS idx_students_referral   ON students (referral_source_id);
CREATE INDEX IF NOT EXISTS idx_courses_status      ON courses (status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor  ON courses (instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status  ON enrollments (status);
CREATE INDEX IF NOT EXISTS idx_payments_student    ON payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments (status);
CREATE INDEX IF NOT EXISTS idx_hearing_answers_student ON hearing_answers (student_id);
CREATE INDEX IF NOT EXISTS idx_mail_histories_student  ON mail_histories (student_id);
