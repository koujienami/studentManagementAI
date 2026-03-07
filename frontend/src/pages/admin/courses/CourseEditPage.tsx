import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { createCourse, fetchCourse, updateCourse } from '@/lib/api/courses';
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/api/errors';
import { fetchInstructorOptions } from '@/lib/api/masterData';
import type { Course, CourseInput, UserOption } from '@/types';

const EMPTY_INSTRUCTOR = 'UNASSIGNED';

const initialFormState: CourseInput = {
  name: '',
  description: '',
  price: 0,
  instructorId: null,
};

export function CourseEditPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const canManageCourses = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const courseId = id ? Number(id) : null;
  const isNew = courseId === null;

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId as number),
    enabled: !isNew && Number.isFinite(courseId),
  });

  const instructorsQuery = useQuery({
    queryKey: ['instructor-options'],
    queryFn: fetchInstructorOptions,
    enabled: canManageCourses,
  });

  if (!canManageCourses) {
    return <Navigate to="/courses" replace />;
  }

  if (!isNew && !Number.isFinite(courseId)) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{isNew ? 'コース登録' : 'コース編集'}</h2>
          <p className="text-muted-foreground">コース情報を登録・更新します。</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={isNew ? '/courses' : `/courses/${courseId}`}>戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'コース登録' : 'コース編集'}</CardTitle>
        </CardHeader>
        <CardContent>
          {!isNew && courseQuery.isLoading ? (
            <p className="text-muted-foreground">読み込み中...</p>
          ) : !isNew && courseQuery.isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(courseQuery.error, 'コース情報の取得に失敗しました')}
            </p>
          ) : (
            <CourseEditForm
              key={isNew ? 'new-course' : `edit-course-${courseQuery.data?.id ?? courseId}`}
              isNew={isNew}
              courseId={courseId}
              initialForm={toInitialForm(courseQuery.data)}
              instructors={instructorsQuery.data ?? []}
              instructorsLoading={instructorsQuery.isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CourseEditFormProps {
  isNew: boolean;
  courseId: number | null;
  initialForm: CourseInput;
  instructors: UserOption[];
  instructorsLoading: boolean;
}

function CourseEditForm({
  isNew,
  courseId,
  initialForm,
  instructors,
  instructorsLoading,
}: CourseEditFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CourseInput>(initialForm);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: (input: CourseInput) => {
      if (isNew) {
        return createCourse(input);
      }
      return updateCourse(courseId as number, input);
    },
    onSuccess: async (course) => {
      setFormError('');
      setFieldErrors({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['course', course.id] }),
      ]);
      navigate(`/courses/${course.id}`);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'コースの保存に失敗しました'));
      setFieldErrors(getApiValidationErrors(error));
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    saveMutation.mutate(form);
  };

  const setValue = <K extends keyof CourseInput>(key: K, value: CourseInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">コース名</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(event) => setValue('name', event.target.value)}
            maxLength={200}
            required
          />
          {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(event) => setValue('description', event.target.value)}
            rows={5}
          />
          {fieldErrors.description && (
            <p className="text-sm text-destructive">{fieldErrors.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">料金</Label>
          <Input
            id="price"
            type="number"
            min={0}
            value={form.price}
            onChange={(event) => setValue('price', Number(event.target.value))}
            required
          />
          {fieldErrors.price && <p className="text-sm text-destructive">{fieldErrors.price}</p>}
        </div>

        <div className="space-y-2">
          <Label>担当講師</Label>
          <Select
            value={form.instructorId ? String(form.instructorId) : EMPTY_INSTRUCTOR}
            onValueChange={(value) =>
              setValue('instructorId', value === EMPTY_INSTRUCTOR ? null : Number(value))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="担当講師を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_INSTRUCTOR}>未設定</SelectItem>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={String(instructor.id)}>
                  {instructor.name} ({instructor.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.instructorId && (
            <p className="text-sm text-destructive">{fieldErrors.instructorId}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saveMutation.isPending || instructorsLoading}>
          {saveMutation.isPending ? '保存中...' : '保存'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to={isNew ? '/courses' : `/courses/${courseId}`}>キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}

function toInitialForm(course?: Course): CourseInput {
  if (!course) {
    return initialFormState;
  }

  return {
    name: course.name,
    description: course.description ?? '',
    price: course.price,
    instructorId: course.instructorId,
  };
}
