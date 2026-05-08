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

// User
export interface MyProfileResponse {
  id: number;
  email: string;
  nickname: string;
  profileImage: string;
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

export interface ReviewResponse {
  reviewId: number;
  rating: number;
  content: string;
  nickname: string;
  profileUrl: string;
  createdAt: string;
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

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
