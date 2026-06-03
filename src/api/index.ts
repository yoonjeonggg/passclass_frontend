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
    api.post<ApiResponse<SignupResponse>>('/auth/signup', data),
  login: (data: LoginRequest) =>
    api.post<ApiResponse<TokenResponse>>('/auth/login', data),
  logout: () => api.post<ApiResponse<void>>('/auth/log-out'),
  autoLogin: (data: AutoLoginRequest) =>
    api.post<ApiResponse<TokenResponse>>('/auth/auto-login', data),
};

// User
export const userApi = {
  getMyProfile: () => api.get<ApiResponse<MyProfileResponse>>('/user/profile/me'),
  patchMyProfile: (data: PatchMyProfileRequest) =>
    api.patch<ApiResponse<MyProfileResponse>>('/user/profile/me', data),
  getProfile: (userId: number) =>
    api.get<ApiResponse<ProfileResponse>>(`/user/profile/${userId}`),
};

// Certificate
export const certificateApi = {
  getAll: () => api.get<ApiResponse<CertificateResponse[]>>('/certificates'),
  search: (keyword: string) =>
    api.get<ApiResponse<CertificateResponse[]>>(`/certificates/search?keyword=${encodeURIComponent(keyword)}`),
  create: (data: CertificateRequest) =>
    api.post<ApiResponse<CertificateResponse>>('/certificates', data),
  update: (id: number, data: CertificateRequest) =>
    api.put<ApiResponse<CertificateResponse>>(`/certificates/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/certificates/${id}`),
};

// Lecture
export const lectureApi = {
  getList: (params: { page?: number; size?: number; category?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.size !== undefined) q.set('size', String(params.size));
    if (params.category) q.set('category', params.category);
    if (params.sort) q.set('sort', params.sort);
    return api.get<ApiResponse<PageLectureListDto>>(`/lecture?${q}`);
  },
  getDetail: (lectureId: number) =>
    api.get<ApiResponse<LectureDetailResponse>>(`/lecture/${lectureId}`),
  create: (data: LectureRequest) =>
    api.post<ApiResponse<LectureCreateResponse>>('/lecture', data),
  update: (lectureId: number, data: LectureUpdateRequest) =>
    api.put<ApiResponse<void>>(`/lecture/${lectureId}`, data),
  delete: (lectureId: number) =>
    api.delete<ApiResponse<void>>(`/lecture/${lectureId}`),
  getInstructorProfile: (instructorId: number) =>
    api.get<ApiResponse<InstructorProfileResponse>>(`/lecture/instructor/${instructorId}`),
};

// LectureChapter
export const chapterApi = {
  getChapters: (lectureId: number) =>
    api.get<ApiResponse<LectureChapterResponse[]>>(`/lecture/chapters?lectureId=${lectureId}`),
  create: (data: LectureChapterRequest) =>
    api.post<ApiResponse<LectureChapterResponse>>('/lecture/chapters', data),
  update: (chapterId: number, data: LectureChapterRequest) =>
    api.put<ApiResponse<LectureChapterResponse>>(`/lecture/chapters/${chapterId}`, data),
  delete: (chapterId: number) =>
    api.delete<ApiResponse<void>>(`/lecture/chapters/${chapterId}`),
  watch: (chapterId: number) =>
    api.get<ApiResponse<ChapterWatchResponse>>(`/lecture/chapters/${chapterId}/watch`),
  saveProgress: (chapterId: number, watchedSeconds: number) =>
    api.patch<ApiResponse<void>>(`/lecture/chapters/${chapterId}/progress`, { watchedSeconds }),
  complete: (chapterId: number) =>
    api.post<ApiResponse<void>>(`/lecture/chapters/${chapterId}/complete`),
  getMyProgress: (lectureId: number) =>
    api.get<ApiResponse<LectureProgressResponse>>(`/lecture/chapters/progress?lectureId=${lectureId}`),
};

// Enrollment
export const enrollmentApi = {
  enroll: (lectureId: number) =>
    api.post<ApiResponse<EnrollmentResponse>>(`/enrollment/${lectureId}`),
  cancel: (lectureId: number) =>
    api.delete<ApiResponse<void>>(`/enrollment/${lectureId}`),
  getMyEnrollments: () =>
    api.get<ApiResponse<EnrollmentResponse[]>>('/enrollment/me'),
};

// Review
export const reviewApi = {
  create: (data: ReviewRequest) =>
    api.post<ApiResponse<void>>('/reviews', data),
  update: (reviewId: number, data: ReviewRequest) =>
    api.put<ApiResponse<void>>(`/reviews/${reviewId}`, data),
  reply: (reviewId: number, data: ReviewReplyRequest) =>
    api.post<ApiResponse<void>>(`/reviews/${reviewId}/reply`, data),
  getSummary: (lectureId: number) =>
    api.get<ApiResponse<ReviewSummaryResponse>>(`/reviews/summary?lectureId=${lectureId}`),
  getList: (lectureId: number) =>
    api.get<ApiResponse<ReviewResponse[]>>(`/reviews?lectureId=${lectureId}`),
};

// Like
export const likeApi = {
  toggle: (lectureId: number) =>
    api.post<ApiResponse<LikeResponse>>(`/lectures/${lectureId}/like`),
};

// File
export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<ApiResponse<FileResponse>>('/files', formData);
  },
  getInfo: (fileId: number) =>
    api.get<ApiResponse<FileResponse>>(`/files/${fileId}`),
  delete: (fileId: number) =>
    api.delete<ApiResponse<void>>(`/files/${fileId}`),
};

// Problem
export const problemApi = {
  getList: (certificateId: number) =>
    api.get<ApiResponse<ProblemListItem[]>>(`/problems?certificateId=${certificateId}`),
  getDetail: (problemId: number) =>
    api.get<ApiResponse<ProblemDetail>>(`/problems/${problemId}`),
  solve: (problemId: number, data: ProblemSolveRequest) =>
    api.post<ApiResponse<ProblemSolveResponse>>(`/problems/${problemId}/solve`, data),
  create: (data: ProblemCreateRequest) =>
    api.post<ApiResponse<IdOnlyResponse>>('/problems', data),
  update: (problemId: number, data: ProblemUpdateRequest) =>
    api.put<ApiResponse<void>>(`/problems/${problemId}`, data),
  delete: (problemId: number) =>
    api.delete<ApiResponse<void>>(`/problems/${problemId}`),
};

// MockExam
export const mockExamApi = {
  getList: (certificateId: number) =>
    api.get<ApiResponse<MockExamListItem[]>>(`/mock-exams?certificateId=${certificateId}`),
  getDetail: (mockExamId: number) =>
    api.get<ApiResponse<MockExamDetailResponse>>(`/mock-exams/${mockExamId}`),
  submit: (mockExamId: number, data: MockExamSubmitRequest) =>
    api.post<ApiResponse<MockExamSubmitResponse>>(`/mock-exams/${mockExamId}/submit`, data),
  getResults: (mockExamId: number) =>
    api.get<ApiResponse<MockExamSubmitResponse>>(`/mock-exams/${mockExamId}/results`),
  create: (data: MockExamCreateRequest) =>
    api.post<ApiResponse<IdOnlyResponse>>('/mock-exams', data),
  addQuestion: (mockExamId: number, data: MockExamAddQuestionRequest) =>
    api.post<ApiResponse<void>>(`/mock-exams/${mockExamId}/questions`, data),
  remove: (mockExamId: number) =>
    api.delete<ApiResponse<void>>(`/mock-exams/${mockExamId}`),
};

// WrongNote
export const wrongNoteApi = {
  getMyNotes: () => api.get<ApiResponse<WrongNoteResponse[]>>('/wrong-notes'),
  deleteNote: (wrongNoteId: number) => api.delete<ApiResponse<void>>(`/wrong-notes/${wrongNoteId}`),
};

// Q&A
export const questionApi = {
  getList: (lectureId: number) =>
    api.get<ApiResponse<LectureQuestionResponse[]>>(`/lectures/${lectureId}/questions`),
  ask: (lectureId: number, data: LectureQuestionRequest) =>
    api.post<ApiResponse<LectureQuestionResponse>>(`/lectures/${lectureId}/questions`, data),
  answer: (lectureId: number, questionId: number, data: LectureAnswerRequest) =>
    api.post<ApiResponse<LectureQuestionResponse>>(`/lectures/${lectureId}/questions/${questionId}/answer`, data),
};

// Notification
export const notificationApi = {
  getList: (page = 0, size = 10) =>
    api.get<ApiResponse<PageResponse<NotificationResponse>>>(`/notifications?page=${page}&size=${size}`),
  markAsRead: (notificationId: number) =>
    api.patch<ApiResponse<void>>(`/notifications/${notificationId}/read`),
  getUnreadCount: () =>
    api.get<ApiResponse<UnreadCountResponse>>('/notifications/unread-count'),
};
