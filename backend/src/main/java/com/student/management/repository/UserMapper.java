package com.student.management.repository;

import com.student.management.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface UserMapper {

    Optional<User> findByUsername(@Param("username") String username);

    Optional<User> findById(@Param("id") Long id);

    boolean existsByUsername(@Param("username") String username);

    boolean existsByEmail(@Param("email") String email);

    boolean existsByUsernameExceptId(@Param("username") String username, @Param("id") Long id);

    boolean existsByEmailExceptId(@Param("email") String email, @Param("id") Long id);

    List<User> findByRole(@Param("role") String role);

    List<User> findAll(@Param("keyword") String keyword, @Param("role") String role);

    long countActiveAdmins();

    void insert(User user);

    int update(User user);

    int updatePassword(@Param("id") Long id, @Param("passwordHash") String passwordHash);

    int softDelete(@Param("id") Long id);
}
