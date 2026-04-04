package com.student.management.domain;

import java.util.regex.Pattern;

/**
 * 公開ヒアリング API のパス・トークン形式（コントローラ・レート制限で共通利用）。
 */
public final class HearingPublicApiPatterns {

    /** URL パス上のトークン（64 文字 hex） */
    public static final String TOKEN_HEX_64 = "^[0-9a-f]{64}$";

    public static final Pattern SESSION_GET = Pattern.compile("^/api/hearing/[0-9a-f]{64}$");

    public static final Pattern ANSWERS_POST = Pattern.compile("^/api/hearing/[0-9a-f]{64}/answers$");

    private HearingPublicApiPatterns() {
    }
}
