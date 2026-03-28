package com.student.management.dto.apply;

import java.time.LocalDate;

/**
 * 公開申込 API のレスポンス。内部 ID は返さない（列挙攻撃のリスク回避）。
 */
public record ApplyResponse(
        String courseName,
        Integer amount,
        LocalDate paymentDueDate
) {
}
