// Auth
export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
  profileImage?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SignupResponse {
  userId: number;
  email: string;
  nickname: string;
}

export interface AutoLoginRequest {
  refreshToken: string;
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

// User
export interface MyProfileResponse {
  id: number;
  email: string;
  nickname: string;
  profileImage: string;
  /** 서버가 문자열·다른 표기로 줄 수 있음 — `normalizeUserRole`로 해석 */
  userRole?: UserRole | string;
  /** 일부 API는 `role` 키만 사용 */
  role?: string;
}

export interface ProfileResponse {
  id: number;
  nickname: string;
  profileImage: string;
}

export interface PatchMyProfileRequest {
  nickname?: string;
  profileImage?: string;
}

// Certificate
export interface CertificateRequest {
  name: string;
  description: string;
}

export interface CertificateResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

export interface CertificateInfo {
  id: number;
  name: string;
}

// Lecture
export interface LectureRequest {
  certificateId: number;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
}

export interface LectureListDto {
  id: number;
  title: string;
  category: string;
  thumbnailUrl: string;
  rating: number;
  certificate: CertificateInfo;
  enrollmentCount: number;
  likeCount: number;
  instructorNickname: string;
}

export interface InstructorDto {
  id: number;
  nickname: string;
  profileImage: string;
}

export interface InstructorProfileResponse {
  id: number;
  nickname: string;
  profileImage: string;
  lectureCount: number;
  totalStudents: number;
  lectures: LectureListDto[];
}

export interface ChapterDto {
  id: number;
  title: string;
  order: number;
}

export interface LectureDetailResponse {
  id: number;
  title: string;
  category: string;
  thumbnailUrl: string;
  description: string;
  rating: number;
  isLiked: boolean;
  likeCount: number;
  studentCount: number;
  chapterCount: number;
  instructor: InstructorDto;
  chapters: ChapterDto[];
  certificate: CertificateInfo;
}

export interface LectureCreateResponse {
  id: number;
  title: string;
  category: string;
  thumbnailUrl: string;
  description: string;
  instructorNickname: string;
  instructorProfileImage: string;
  certificate: CertificateInfo;
}

export interface PageLectureListDto {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: LectureListDto[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

// LectureChapter
export interface LectureChapterRequest {
  lectureId: number;
  title: string;
  videoUrl: string;
  chapterOrder: number;
}

export interface LectureChapterResponse {
  id: number;
  lectureId: number;
  title: string;
  videoUrl: string;
  chapterOrder: number;
}

export interface ChapterWatchResponse {
  id: number;
  title: string;
  videoUrl: string;
  chapterOrder: number;
  completed: boolean;
  watchedSeconds: number;
}

export interface MyChapterProgress {
  chapterId: number;
  completed: boolean;
  watchedSeconds: number;
}

export interface LectureProgressResponse {
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  chapters: MyChapterProgress[];
}

// Enrollment
export interface EnrollmentResponse {
  enrollmentId: number;
  lectureId: number;
  lectureTitle: string;
  createdAt: string;
}

// Review
export interface ReviewRequest {
  lectureId: number;
  rating: number;
  content: string;
}

export interface ReviewReplyRequest {
  reply: string;
}

export interface ReviewResponse {
  reviewId: number;
  rating: number;
  content: string;
  nickname: string;
  profileUrl: string;
  createdAt: string;
  reply?: string;
  replyAt?: string;
  instructorNickname?: string;
  instructorProfileUrl?: string;
}

export interface LectureUpdateRequest {
  certificateId: number;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
}

export interface ReviewSummaryResponse {
  averageRating: number;
  reviewCount: number;
}

// Like
export interface LikeResponse {
  isLiked: boolean;
}

// Notification
export interface NotificationResponse {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  content: T[];
  number: number;
  numberOfElements: number;
  empty: boolean;
}

// File
export interface FileResponse {
  fileId: number;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

// Problem
export interface ProblemListItem {
  id: number;
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

export interface ProblemDetail {
  id: number;
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer?: number;
  explanation?: string;
}

export interface ProblemSolveRequest {
  selectedAnswer: number;
}

export interface ProblemSolveResponse {
  correct: boolean;
  explanation: string;
}

export interface ProblemCreateRequest {
  certificateId: number;
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  explanation: string;
}

export interface ProblemUpdateRequest {
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  explanation: string;
}

export interface IdOnlyResponse {
  id: number;
}

export interface MockExamCreateRequest {
  certificateId: number;
  title: string;
}

export interface MockExamAddQuestionRequest {
  problemId: number;
}

// MockExam
export interface MockExamListItem {
  id: number;
  title: string;
  completed: boolean;
  score: number | null;
}

export interface MockExamQuestion {
  problemId: number;
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

export interface MockExamDetailResponse {
  mockExamId: number;
  title: string;
  questions: MockExamQuestion[];
}

export interface MockExamAnswerItem {
  problemId: number;
  selectedAnswer: number;
}

export interface MockExamSubmitRequest {
  answers: MockExamAnswerItem[];
}

export interface MockExamResultItem {
  problemId: number;
  correct: boolean;
}

export interface MockExamSubmitResponse {
  score: number;
  results: MockExamResultItem[];
}

// WrongNote
export interface WrongNoteResponse {
  wrongNoteId: number;
  problemId: number;
  content: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  selectedAnswer: number;
  correctAnswer: number;
  explanation: string;
  memo: string | null;
}

// Q&A
export interface LectureQuestionRequest {
  content: string;
}

export interface LectureAnswerRequest {
  answer: string;
}

export interface LectureQuestionResponse {
  id: number;
  lectureId: number;
  userId: number;
  nickname: string;
  profileImage?: string;
  content: string;
  answer?: string;
  answeredAt?: string;
  answererNickname?: string;
  createdAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
