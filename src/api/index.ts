import { api } from './client';
import type {
  ApiResponse,
  SignupRequest, SignupResponse,
  LoginRequest, TokenResponse, AutoLoginRequest,
  MyProfileResponse, ProfileResponse, PatchMyProfileRequest,
  CertificateRequest, CertificateResponse,
  LectureRequest, LectureUpdateRequest, LectureCreateResponse, LectureDetailResponse, PageLectureListDto,
  LectureChapterRequest, LectureChapterResponse, ChapterWatchResponse, LectureProgressResponse,
  InstructorProfileResponse,
  EnrollmentResponse,
  ReviewRequest, ReviewReplyRequest, ReviewResponse, ReviewSummaryResponse,
  LikeResponse,
  NotificationResponse, UnreadCountResponse, PageResponse,
  FileResponse,
  ProblemListItem, ProblemDetail, ProblemSolveRequest, ProblemSolveResponse,
  ProblemCreateRequest, ProblemUpdateRequest, IdOnlyResponse,
  MockExamListItem, MockExamDetailResponse, MockExamSubmitRequest, MockExamSubmitResponse,
  MockExamCreateRequest, MockExamAddQuestionRequest,
  WrongNoteResponse,
  LectureQuestionRequest, LectureAnswerRequest, LectureQuestionResponse,
} from '../types';

// Auth
export const authApi = {
  signup: (data: SignupRequest) =>
    api.post<ApiResponse<SignupResponse>>('/api/auth/signup', data),
  login: (data: LoginRequest) =>
    api.post<ApiResponse<TokenResponse>>('/api/auth/login', data),
  logout: () => api.post<ApiResponse<void>>('/api/auth/log-out'),
  autoLogin: (data: AutoLoginRequest) =>
    api.post<ApiResponse<TokenResponse>>('/api/auth/auto-login', data),
};

// User
export const userApi = {
  getMyProfile: () => api.get<ApiResponse<MyProfileResponse>>('/api/user/profile/me'),
  patchMyProfile: (data: PatchMyProfileRequest) =>
    api.patch<ApiResponse<MyProfileResponse>>('/api/user/profile/me', data),
  getProfile: (userId: number) =>
    api.get<ApiResponse<ProfileResponse>>(`/api/user/profile/${userId}`),
};

// Certificate
export const certificateApi = {
  getAll: () => api.get<ApiResponse<CertificateResponse[]>>('/api/certificates'),
  search: (keyword: string) =>
    api.get<ApiResponse<CertificateResponse[]>>(`/api/certificates/search?keyword=${encodeURIComponent(keyword)}`),
  create: (data: CertificateRequest) =>
    api.post<ApiResponse<CertificateResponse>>('/api/certificates', data),
  update: (id: number, data: CertificateRequest) =>
    api.put<ApiResponse<CertificateResponse>>(`/api/certificates/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/certificates/${id}`),
};

// Lecture
export const lectureApi = {
  getList: (params: { page?: number; size?: number; category?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.size !== undefined) q.set('size', String(params.size));
    if (params.category) q.set('category', params.category);
    if (params.sort) q.set('sort', params.sort);
    return api.get<ApiResponse<PageLectureListDto>>(`/api/lecture?${q}`);
  },
  getDetail: (lectureId: number) =>
    api.get<ApiResponse<LectureDetailResponse>>(`/api/lecture/${lectureId}`),
  create: (data: LectureRequest) =>
    api.post<ApiResponse<LectureCreateResponse>>('/api/lecture', data),
  update: (lectureId: number, data: LectureUpdateRequest) =>
    api.put<ApiResponse<void>>(`/api/lecture/${lectureId}`, data),
  delete: (lectureId: number) =>
    api.delete<ApiResponse<void>>(`/api/lecture/${lectureId}`),
  getInstructorProfile: (instructorId: number) =>
    api.get<ApiResponse<InstructorProfileResponse>>(`/api/lecture/instructor/${instructorId}`),
};

// LectureChapter
export const chapterApi = {
  getChapters: (lectureId: number) =>
    api.get<ApiResponse<LectureChapterResponse[]>>(`/api/lecture/chapters?lectureId=${lectureId}`),
  create: (data: LectureChapterRequest) =>
    api.post<ApiResponse<LectureChapterResponse>>('/api/lecture/chapters', data),
  update: (chapterId: number, data: LectureChapterRequest) =>
    api.put<ApiResponse<LectureChapterResponse>>(`/api/lecture/chapters/${chapterId}`, data),
  delete: (chapterId: number) =>
    api.delete<ApiResponse<void>>(`/api/lecture/chapters/${chapterId}`),
  watch: (chapterId: number) =>
    api.get<ApiResponse<ChapterWatchResponse>>(`/api/lecture/chapters/${chapterId}/watch`),
  saveProgress: (chapterId: number, watchedSeconds: number) =>
    api.patch<ApiResponse<void>>(`/api/lecture/chapters/${chapterId}/progress`, { watchedSeconds }),
  complete: (chapterId: number) =>
    api.post<ApiResponse<void>>(`/api/lecture/chapters/${chapterId}/complete`),
  getMyProgress: (lectureId: number) =>
    api.get<ApiResponse<LectureProgressResponse>>(`/api/lecture/chapters/progress?lectureId=${lectureId}`),
};

// Enrollment
export const enrollmentApi = {
  enroll: (lectureId: number) =>
    api.post<ApiResponse<EnrollmentResponse>>(`/api/enrollment/${lectureId}`),
  cancel: (lectureId: number) =>
    api.delete<ApiResponse<void>>(`/api/enrollment/${lectureId}`),
  getMyEnrollments: () =>
    api.get<ApiResponse<EnrollmentResponse[]>>('/api/enrollment/me'),
};

// Review
export const reviewApi = {
  create: (data: ReviewRequest) =>
    api.post<ApiResponse<void>>('/api/reviews', data),
  update: (reviewId: number, data: ReviewRequest) =>
    api.put<ApiResponse<void>>(`/api/reviews/${reviewId}`, data),
  reply: (reviewId: number, data: ReviewReplyRequest) =>
    api.post<ApiResponse<void>>(`/api/reviews/${reviewId}/reply`, data),
  getSummary: (lectureId: number) =>
    api.get<ApiResponse<ReviewSummaryResponse>>(`/api/reviews/summary?lectureId=${lectureId}`),
  getList: (lectureId: number) =>
    api.get<ApiResponse<ReviewResponse[]>>(`/api/reviews?lectureId=${lectureId}`),
};

// Like
export const likeApi = {
  toggle: (lectureId: number) =>
    api.post<ApiResponse<LikeResponse>>(`/api/lectures/${lectureId}/like`),
};

// File
export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<ApiResponse<FileResponse>>('/api/files', formData);
  },
  getInfo: (fileId: number) =>
    api.get<ApiResponse<FileResponse>>(`/api/files/${fileId}`),
  delete: (fileId: number) =>
    api.delete<ApiResponse<void>>(`/api/files/${fileId}`),
};

// Problem
export const problemApi = {
  getList: (certificateId: number) =>
    api.get<ApiResponse<ProblemListItem[]>>(`/api/problems?certificateId=${certificateId}`),
  getDetail: (problemId: number) =>
    api.get<ApiResponse<ProblemDetail>>(`/api/problems/${problemId}`),
  solve: (problemId: number, data: ProblemSolveRequest) =>
    api.post<ApiResponse<ProblemSolveResponse>>(`/api/problems/${problemId}/solve`, data),
  create: (data: ProblemCreateRequest) =>
    api.post<ApiResponse<IdOnlyResponse>>('/api/problems', data),
  update: (problemId: number, data: ProblemUpdateRequest) =>
    api.put<ApiResponse<void>>(`/api/problems/${problemId}`, data),
  delete: (problemId: number) =>
    api.delete<ApiResponse<void>>(`/api/problems/${problemId}`),
};

// MockExam
export const mockExamApi = {
  getList: (certificateId: number) =>
    api.get<ApiResponse<MockExamListItem[]>>(`/api/mock-exams?certificateId=${certificateId}`),
  getDetail: (mockExamId: number) =>
    api.get<ApiResponse<MockExamDetailResponse>>(`/api/mock-exams/${mockExamId}`),
  submit: (mockExamId: number, data: MockExamSubmitRequest) =>
    api.post<ApiResponse<MockExamSubmitResponse>>(`/api/mock-exams/${mockExamId}/submit`, data),
  getResults: (mockExamId: number) =>
    api.get<ApiResponse<MockExamSubmitResponse>>(`/api/mock-exams/${mockExamId}/results`),
  create: (data: MockExamCreateRequest) =>
    api.post<ApiResponse<IdOnlyResponse>>('/api/mock-exams', data),
  addQuestion: (mockExamId: number, data: MockExamAddQuestionRequest) =>
    api.post<ApiResponse<void>>(`/api/mock-exams/${mockExamId}/questions`, data),
  remove: (mockExamId: number) =>
    api.delete<ApiResponse<void>>(`/api/mock-exams/${mockExamId}`),
};

// WrongNote
export const wrongNoteApi = {
  getMyNotes: () => api.get<ApiResponse<WrongNoteResponse[]>>('/api/wrong-notes'),
  deleteNote: (wrongNoteId: number) => api.delete<ApiResponse<void>>(`/api/wrong-notes/${wrongNoteId}`),
};

// Q&A
export const questionApi = {
  getList: (lectureId: number) =>
    api.get<ApiResponse<LectureQuestionResponse[]>>(`/api/lectures/${lectureId}/questions`),
  ask: (lectureId: number, data: LectureQuestionRequest) =>
    api.post<ApiResponse<LectureQuestionResponse>>(`/api/lectures/${lectureId}/questions`, data),
  answer: (lectureId: number, questionId: number, data: LectureAnswerRequest) =>
    api.post<ApiResponse<LectureQuestionResponse>>(`/api/lectures/${lectureId}/questions/${questionId}/answer`, data),
};

// Notification
export const notificationApi = {
  getList: (page = 0, size = 10) =>
    api.get<ApiResponse<PageResponse<NotificationResponse>>>(`/api/notifications?page=${page}&size=${size}`),
  markAsRead: (notificationId: number) =>
    api.patch<ApiResponse<void>>(`/api/notifications/${notificationId}/read`),
  getUnreadCount: () =>
    api.get<ApiResponse<UnreadCountResponse>>('/api/notifications/unread-count'),
};
