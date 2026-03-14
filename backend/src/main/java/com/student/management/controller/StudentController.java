package com.student.management.controller;

import com.student.management.dto.PaginatedResponse;
import com.student.management.dto.student.StudentDetailResponse;
import com.student.management.dto.student.StudentListItemResponse;
import com.student.management.dto.student.StudentRequest;
import com.student.management.dto.student.StudentStatusUpdateRequest;
import com.student.management.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'INSTRUCTOR')")
    public ResponseEntity<PaginatedResponse<StudentListItemResponse>> list(@RequestParam(required = false) String keyword,
                                                                           @RequestParam(required = false) String status,
                                                                           @RequestParam(required = false) Long referralSourceId,
                                                                           @RequestParam(required = false) Boolean hasUnpaid,
                                                                           @RequestParam(required = false) Long courseId,
                                                                           @RequestParam(required = false) Integer page,
                                                                           @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(studentService.getStudents(
                keyword,
                status,
                referralSourceId,
                hasUnpaid,
                courseId,
                page,
                size
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'INSTRUCTOR')")
    public ResponseEntity<StudentDetailResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudent(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentDetailResponse> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.createStudent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentDetailResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(studentService.updateStudent(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<StudentDetailResponse> updateStatus(@PathVariable Long id,
                                                              @Valid @RequestBody StudentStatusUpdateRequest request) {
        return ResponseEntity.ok(studentService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
