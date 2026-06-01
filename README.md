![PassClass](./public/PassClass목업.png)

# PassClass — 프론트엔드

자격증 시험을 준비하는 학습자를 위한 온라인 인강 플랫폼입니다.  
강의 수강, 문제 풀이, 모의고사, 오답노트까지 하나의 서비스에서 제공합니다.

백엔드 서버(`api/`)와 연동하여 동작합니다.

---

## 개발 히스토리

이 프론트엔드는 세 단계에 걸쳐 발전합니다.

| 단계 | 내용 |
|------|------|
| **P1** | 인증 없이 수강생 관점의 기본 기능 구현. 백엔드 + 프론트엔드 분리, DBMS 연동 |
| **P2** | JWT 인증 도입, 역할 기반 접근 제어(수강생 / 강사 / 관리자) 구현. AWS EC2 + Vercel 배포 |
| **P3** | 이메일·디스코드 구독 알림, 스케줄러, Webhook, 모니터링, 보안(SQL 인젝션·XSS), 결제 모듈, 성능 최적화 예정 |

---

## 기술 스택

| 기술 | 용도 |
|------|------|
| React 18 + TypeScript | UI 프레임워크 |
| Vite | 빌드 도구 |
| React Router DOM v6 | 클라이언트 사이드 라우팅 |
| Fetch API (커스텀 래퍼) | HTTP 클라이언트 |

---

## 주요 기능

- **회원 관리** — 회원가입, 이메일 인증, 로그인/로그아웃, 자동 로그인, 프로필 수정
- **강의** — 강의 목록·상세 조회, 카테고리·정렬 필터, 강의 찜(좋아요), 리뷰 및 평점
- **수강 관리** — 수강 신청·취소, 챕터별 영상 시청, 진도율 저장, 수강 완료 처리
- **문제 풀이** — 자격증별 문제 목록·상세 조회, 풀이 제출, 정답·해설 확인
- **모의고사** — 모의고사 목록·응시·제출, 점수 및 결과 조회
- **오답노트** — 틀린 문제 자동 저장, 목록 조회, 개별 삭제
- **Q&A** — 강의별 질문 등록, 강사 답변
- **알림** — 알림 목록 조회, 읽음 처리, 안 읽은 알림 수 표시
- **강사 대시보드** — 강의·챕터·문제·모의고사 등록 및 관리
- **관리자 대시보드** — 자격증·사용자 관리, 전체 콘텐츠 관리
- **파일 업로드** — 강의 썸네일, 챕터 영상 URL, 프로필 이미지 등

---

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- 백엔드 서버가 실행 중이어야 합니다 → 백엔드 시작 가이드 참고

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev
```

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 아래 값을 설정하세요.

```env
VITE_API_BASE_URL=http://localhost:8080
```

배포 환경(Vercel)에서는 Vercel 대시보드의 Environment Variables에 동일한 키를 등록합니다.

### 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## 프로젝트 구조

```
src/
├── api/
│   ├── client.ts           # fetch 기반 HTTP 클라이언트 (토큰 자동 첨부)
│   └── index.ts            # 기능별 API 함수 모음
├── context/
│   └── AuthContext.tsx     # 전역 인증 상태 (user, login, logout)
├── components/
│   ├── Navbar.tsx          # 상단 내비게이션 (역할별 메뉴 분기)
│   ├── Footer.tsx
│   ├── LectureCard.tsx     # 강의 카드 컴포넌트
│   ├── Icons.tsx           # SVG 아이콘
│   └── Toast.tsx           # 전역 토스트 알림
├── pages/
│   ├── Home.tsx            # 메인 페이지
│   ├── Login.tsx           # 로그인
│   ├── Signup.tsx          # 회원가입
│   ├── Lectures.tsx        # 강의 목록
│   ├── LectureDetail.tsx   # 강의 상세 (수강, 챕터, 리뷰, Q&A)
│   ├── InstructorProfile.tsx
│   ├── Certificates.tsx    # 자격증 목록
│   ├── Problems.tsx        # 문제 풀이
│   ├── MockExams.tsx       # 모의고사 목록
│   ├── MockExamSession.tsx # 모의고사 응시
│   ├── MyLectures.tsx      # 내 수강 목록
│   ├── WrongNotes.tsx      # 오답노트
│   ├── Profile.tsx         # 내 프로필
│   ├── TeacherDashboard.tsx
│   ├── TeacherMyLectures.tsx
│   ├── AdminDashboard.tsx
│   └── StaffProblemsMockSection.tsx
├── types/
│   └── index.ts            # 전체 타입 정의
├── utils/
│   └── roles.ts            # 역할 기반 접근 제어 유틸
└── App.tsx                 # 라우팅 및 전역 프로바이더
```

---

## API 연동

`src/api/client.ts`가 모든 HTTP 요청을 처리합니다. `VITE_API_BASE_URL`을 baseURL로 사용하며, 요청마다 `Authorization: Bearer <token>` 헤더를 자동으로 첨부합니다.

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 회원가입 | POST | `/api/auth/signup` |
| 로그인 | POST | `/api/auth/login` |
| 로그아웃 | POST | `/api/auth/log-out` |
| 자동 로그인 | POST | `/api/auth/auto-login` |
| 내 프로필 조회 | GET | `/api/user/profile/me` |
| 프로필 수정 | PATCH | `/api/user/profile/me` |
| 자격증 목록 | GET | `/api/certificates` |
| 강의 목록 | GET | `/api/lecture` |
| 강의 상세 | GET | `/api/lecture/{lectureId}` |
| 강의 등록 | POST | `/api/lecture` |
| 챕터 목록 | GET | `/api/lecture/chapters` |
| 챕터 시청 | GET | `/api/lecture/chapters/{chapterId}/watch` |
| 진도율 저장 | PATCH | `/api/lecture/chapters/{chapterId}/progress` |
| 수강 신청 | POST | `/api/enrollment/{lectureId}` |
| 리뷰 작성 | POST | `/api/reviews` |
| 강의 좋아요 | POST | `/api/lectures/{lectureId}/like` |
| 문제 목록 | GET | `/api/problems` |
| 문제 풀이 제출 | POST | `/api/problems/{problemId}/solve` |
| 모의고사 목록 | GET | `/api/mock-exams` |
| 모의고사 제출 | POST | `/api/mock-exams/{mockExamId}/submit` |
| 오답노트 목록 | GET | `/api/wrong-notes` |
| Q&A 질문 | POST | `/api/lectures/{lectureId}/questions` |
| 알림 목록 | GET | `/api/notifications` |
| 파일 업로드 | POST | `/api/files` |

JWT 액세스 토큰은 `localStorage`의 `"accessToken"` 키에 저장됩니다.

---

## 역할 및 라우팅

| 역할 | 접근 가능 경로 |
|------|---------------|
| 비로그인 | `/`, `/login`, `/signup`, `/lectures`, `/lectures/:id`, `/certificates`, `/problems`, `/mock-exams` |
| STUDENT | 위 + `/my-lectures`, `/profile`, `/wrong-notes` |
| TEACHER | 위 + `/teacher`, `/teacher/my-lectures` |
| ADMIN | 위 + `/admin` |

로그인이 필요한 경로는 `ProtectedRoute`로, 역할 제한이 있는 경로는 `RoleRoute`로 보호됩니다. 권한 없는 접근 시 `/`로 리다이렉트됩니다.

---

## 배포

| 환경 | 플랫폼 | 비고 |
|------|--------|------|
| 프론트엔드 | Vercel | GitHub 연동 자동 배포 |
| 백엔드 | AWS EC2 (Linux) | Spring Boot JAR 실행 |
| 데이터베이스 | AWS EC2 (Linux) | MySQL |

Vercel 배포 시 `VITE_API_BASE_URL`을 EC2 백엔드 주소로 설정해야 합니다.
