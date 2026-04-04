package com.student.management.domain;

/**
 * 受講生ステータス（DB の students.status と同一の文字列）。
 */
public final class StudentStatusCodes {

    public static final String PROVISIONAL = "PROVISIONAL";
    public static final String PRE_HEARING = "PRE_HEARING";
    public static final String POST_HEARING = "POST_HEARING";
    public static final String ENROLLED = "ENROLLED";
    public static final String COMPLETED = "COMPLETED";
    public static final String WITHDRAWN = "WITHDRAWN";

    private StudentStatusCodes() {
    }
}
