package com.student.management;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("local")
@Disabled("PostgreSQL が起動している環境でのみ有効化（ローカルは docker-compose 参照）")
class StudentManagementApplicationTests {

    @Test
    void contextLoads() {
        // Spring Boot アプリケーションコンテキストが正常に読み込まれることを確認
    }
}
