package com.student.management.service;

import com.student.management.dto.course.CourseListItemResponse;
import com.student.management.dto.course.CourseRequest;
import com.student.management.dto.course.CourseResponse;
import com.student.management.entity.Course;
import com.student.management.entity.CourseWithInstructor;
import com.student.management.entity.User;
import com.student.management.exception.ApiException;
import com.student.management.repository.CourseMapper;
import com.student.management.repository.UserMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CourseService {

    private static final String ROLE_INSTRUCTOR = "INSTRUCTOR";

    private final CourseMapper courseMapper;
    private final UserMapper userMapper;

    public CourseService(CourseMapper courseMapper, UserMapper userMapper) {
        this.courseMapper = courseMapper;
        this.userMapper = userMapper;
    }

    public List<CourseListItemResponse> getCourses(String keyword) {
        return courseMapper.findAll(normalize(keyword)).stream()
                .map(CourseListItemResponse::from)
                .toList();
    }

    public CourseResponse getCourse(Long id) {
        CourseWithInstructor course = courseMapper.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "コースが見つかりません"));
        return CourseResponse.from(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        validateInstructor(request.instructorId());

        Course course = toEntity(request);
        courseMapper.insert(course);

        return getCourse(course.getId());
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        ensureCourseExists(id);
        validateInstructor(request.instructorId());

        Course course = toEntity(request);
        course.setId(id);
        courseMapper.update(course);

        return getCourse(id);
    }

    @Transactional
    public void deleteCourse(Long id) {
        ensureCourseExists(id);

        if (courseMapper.hasEnrollments(id)) {
            throw new ApiException(HttpStatus.CONFLICT, "受講履歴が存在するコースは削除できません");
        }

        courseMapper.deleteById(id);
    }

    private void ensureCourseExists(Long id) {
        if (!courseMapper.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "コースが見つかりません");
        }
    }

    private void validateInstructor(Long instructorId) {
        if (instructorId == null) {
            return;
        }

        User instructor = userMapper.findById(instructorId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "担当講師が存在しません"));

        if (!ROLE_INSTRUCTOR.equals(instructor.getRole())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "担当講師には講師ロールのユーザーを指定してください");
        }
    }

    private Course toEntity(CourseRequest request) {
        Course course = new Course();
        course.setName(request.name().trim());
        course.setDescription(normalize(request.description()));
        course.setPrice(request.price());
        course.setInstructorId(request.instructorId());
        return course;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
