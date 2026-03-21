package com.student.management.service;

import com.student.management.dto.dashboard.DashboardStatsResponse;
import com.student.management.repository.CourseMapper;
import com.student.management.repository.EnrollmentMapper;
import com.student.management.repository.PaymentMapper;
import com.student.management.repository.StudentMapper;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final StudentMapper studentMapper;
    private final EnrollmentMapper enrollmentMapper;
    private final PaymentMapper paymentMapper;
    private final CourseMapper courseMapper;

    public DashboardService(StudentMapper studentMapper,
                            EnrollmentMapper enrollmentMapper,
                            PaymentMapper paymentMapper,
                            CourseMapper courseMapper) {
        this.studentMapper = studentMapper;
        this.enrollmentMapper = enrollmentMapper;
        this.paymentMapper = paymentMapper;
        this.courseMapper = courseMapper;
    }

    public DashboardStatsResponse getStats() {
        long students = studentMapper.countAll(null, null, null, null, null, null);
        long activeEnrollments = enrollmentMapper.countList(null, null, "ENROLLED", null);
        long unpaidPayments = paymentMapper.countList(null, null, "UNPAID", null);
        long courses = courseMapper.countAll();

        return new DashboardStatsResponse(students, activeEnrollments, unpaidPayments, courses);
    }
}
