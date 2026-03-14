import apiClient from '@/lib/api/client';
import type { Course, CourseInput, CourseListItem } from '@/types';

interface CourseListParams {
  keyword?: string;
}

export async function fetchCourses(params: CourseListParams = {}) {
  const response = await apiClient.get<CourseListItem[]>('/courses', {
    params: {
      keyword: params.keyword || undefined,
    },
  });
  return response.data;
}

export async function fetchCourse(id: number) {
  const response = await apiClient.get<Course>(`/courses/${id}`);
  return response.data;
}

export async function createCourse(input: CourseInput) {
  const response = await apiClient.post<Course>('/courses', input);
  return response.data;
}

export async function updateCourse(id: number, input: CourseInput) {
  const response = await apiClient.put<Course>(`/courses/${id}`, input);
  return response.data;
}

export async function deleteCourse(id: number) {
  await apiClient.delete(`/courses/${id}`);
}
