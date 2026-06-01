import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { lectureApi, enrollmentApi, chapterApi, likeApi, reviewApi, questionApi } from "../api";
import { IconStar, IconUsers, IconVideo, IconHeart, IconCheck, IconAward, IconChevronLeft } from "../components/Icons";
import type {
  LectureDetailResponse,
  ChapterWatchResponse,
  LectureProgressResponse,
  ReviewResponse,
  ReviewSummaryResponse,
  LectureQuestionResponse,
} from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import "./LectureDetail.css";

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function getEmbedUrl(url: string): string {
  if (!url) return url;
  const id = getYouTubeVideoId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).YT?.Player) {
      resolve();
      return;
    }
    const prev = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
  });
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-input">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star ${s <= (hover || value) ? "filled" : ""}`}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ cursor: onChange ? "pointer" : "default" }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function LectureDetail() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState<LectureDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [cancellingEnrollment, setCancellingEnrollment] = useState(false);
  const [watchData, setWatchData] = useState<ChapterWatchResponse | null>(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);

  // Progress tracking
  const [completedChapters, setCompletedChapters] = useState<Set<number>>(new Set());
  const [progressData, setProgressData] = useState<LectureProgressResponse | null>(null);

  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentChapterIdRef = useRef<number | null>(null);

  // Like
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Review
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryResponse | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, content: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Q&A
  const [questions, setQuestions] = useState<LectureQuestionResponse[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Active tab in body area
  const [activeTab, setActiveTab] = useState<"curriculum" | "reviews" | "questions">("curriculum");

  // 강사 여부 (강의 로드 후 정확해짐, 초기값 false로 안전)
  const isInstructor = !!(lecture && user && user.id === lecture.instructor?.id);

  useEffect(() => {
    if (!lectureId) return;
    const id = Number(lectureId);

    const promises: Promise<any>[] = [
      lectureApi.getDetail(id),
      reviewApi.getList(id),
      reviewApi.getSummary(id),
      questionApi.getList(id).catch(() => ({ data: [] })),
    ];

    if (user) {
      promises.push(enrollmentApi.getMyEnrollments());
    }

    Promise.all(promises)
      .then(([lRes, reviewRes, summaryRes, qRes, enrollRes]) => {
        const l = lRes.data;
        setLecture(l);
        setIsLiked(l.isLiked ?? false);
        setLikeCount(l.likeCount ?? 0);
        setReviews(reviewRes.data);
        setReviewSummary(summaryRes.data);
        setQuestions((qRes as any).data ?? []);
        if (enrollRes) {
          const alreadyEnrolled = enrollRes.data.some((e: any) => e.lectureId === id);
          setEnrolled(alreadyEnrolled);
          if (alreadyEnrolled) {
            chapterApi.getMyProgress(id)
              .then((pRes) => {
                const pd = pRes.data;
                setProgressData(pd);
                const completed = new Set<number>(
                  pd.chapters.filter((c) => c.completed).map((c) => c.chapterId)
                );
                setCompletedChapters(completed);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => toast("강의를 불러올 수 없습니다.", "error"))
      .finally(() => setLoading(false));
  }, [lectureId, user]);

  const handleEnroll = async () => {
    if (!user) { navigate("/login"); return; }
    if (isInstructor) { toast("자신의 강의는 수강 신청할 수 없습니다.", "error"); return; }
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(Number(lectureId));
      setEnrolled(true);
      toast("수강 신청 완료!", "success");
    } catch (err: any) {
      toast(err.message || "수강 신청 실패", "error");
    } finally {
      setEnrolling(false);
    }
  };

  const handleCancelEnrollment = async () => {
    if (!window.confirm("수강을 취소하시겠습니까? 학습 진도가 초기화됩니다.")) return;
    setCancellingEnrollment(true);
    try {
      await enrollmentApi.cancel(Number(lectureId));
      setEnrolled(false);
      setProgressData(null);
      setCompletedChapters(new Set());
      setWatchData(null);
      setActiveChapter(null);
      toast("수강이 취소되었습니다.", "info");
    } catch (err: any) {
      toast(err.message || "수강 취소 실패", "error");
    } finally {
      setCancellingEnrollment(false);
    }
  };

  const handleLike = async () => {
    if (!user) { navigate("/login"); return; }
    if (liking) return;
    setLiking(true);
    try {
      const res = await likeApi.toggle(Number(lectureId));
      const liked = res.data.isLiked;
      setIsLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
      toast(liked ? "찜 목록에 추가했습니다." : "찜을 취소했습니다.", "info");
    } catch (err: any) {
      toast(err.message || "오류가 발생했습니다.", "error");
    } finally {
      setLiking(false);
    }
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const flushProgress = () => {
    const chapterId = currentChapterIdRef.current;
    const player = ytPlayerRef.current;
    if (!chapterId || !player?.getCurrentTime) return;
    const seconds = Math.floor(player.getCurrentTime());
    if (seconds > 0) {
      chapterApi.saveProgress(chapterId, seconds).catch(() => {});
    }
  };

  useEffect(() => {
    if (!watchData) return;
    const videoId = getYouTubeVideoId(watchData.videoUrl);
    if (!videoId) return;

    currentChapterIdRef.current = watchData.id;
    const startSeconds = watchData.watchedSeconds ?? 0;
    stopProgressTracking();

    loadYouTubeApi().then(() => {
      if (!ytContainerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
        videoId,
        playerVars: { start: startSeconds, rel: 0 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 1) {
              stopProgressTracking();
              progressIntervalRef.current = setInterval(() => {
                flushProgress();
              }, 5000);
            } else {
              stopProgressTracking();
              flushProgress();
            }
          },
        },
      });
    });

    return stopProgressTracking;
  }, [watchData?.id]);

  useEffect(() => {
    return () => {
      stopProgressTracking();
      flushProgress();
    };
  }, []);

  const handleWatchChapter = async (chapterId: number) => {
    if (!user) { navigate("/login"); return; }
    setWatchLoading(true);
    setActiveChapter(chapterId);
    try {
      const res = await chapterApi.watch(chapterId);
      setWatchData(res.data);
    } catch (err: any) {
      const msg = isInstructor
        ? (err.message || "강의 영상을 불러오지 못했습니다.")
        : (err.message || "수강 신청 후 이용 가능합니다.");
      toast(msg, "error");
      setActiveChapter(null);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!watchData) return;
    try {
      await chapterApi.complete(watchData.id);
      toast("챕터 완료!", "success");
      const cid = watchData.id;
      setWatchData((prev) => (prev ? { ...prev, completed: true } : null));
      setCompletedChapters((prev) => new Set(prev).add(cid));
      setProgressData((prev) => {
        if (!prev) return prev;
        const newCompleted = prev.completedCount + 1;
        const newPercent = prev.totalCount > 0 ? Math.round(newCompleted * 100 / prev.totalCount) : 0;
        return {
          ...prev,
          completedCount: newCompleted,
          progressPercent: newPercent,
          chapters: prev.chapters.map((c) =>
            c.chapterId === cid ? { ...c, completed: true } : c
          ),
        };
      });
    } catch (err: any) {
      toast(err.message, "error");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewForm.rating === 0) { toast("별점을 선택해주세요.", "error"); return; }
    if (!reviewForm.content.trim()) { toast("리뷰 내용을 입력해주세요.", "error"); return; }
    setSubmittingReview(true);
    try {
      await reviewApi.create({
        lectureId: Number(lectureId),
        rating: reviewForm.rating,
        content: reviewForm.content,
      });
      toast("리뷰가 등록되었습니다.", "success");
      setReviewForm({ rating: 0, content: "" });
      setShowReviewForm(false);
      const [reviewRes, summaryRes] = await Promise.all([
        reviewApi.getList(Number(lectureId)),
        reviewApi.getSummary(Number(lectureId)),
      ]);
      setReviews(reviewRes.data);
      setReviewSummary(summaryRes.data);
    } catch (err: any) {
      toast(err.message || "리뷰 등록 실패", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitReply = async (reviewId: number) => {
    if (!replyText.trim()) { toast("답글 내용을 입력해주세요.", "error"); return; }
    setSubmittingReply(true);
    try {
      await reviewApi.reply(reviewId, { reply: replyText.trim() });
      toast("답글이 등록되었습니다.", "success");
      setReplyingReviewId(null);
      setReplyText("");
      const reviewRes = await reviewApi.getList(Number(lectureId));
      setReviews(reviewRes.data);
    } catch (err: any) {
      toast(err.message || "답글 등록 실패", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!questionInput.trim()) { toast("질문 내용을 입력해주세요.", "error"); return; }
    setSubmittingQuestion(true);
    try {
      await questionApi.ask(Number(lectureId), { content: questionInput.trim() });
      toast("질문이 등록되었습니다.", "success");
      setQuestionInput("");
      const q = await questionApi.getList(Number(lectureId));
      setQuestions(q.data);
    } catch (err: any) {
      toast(err.message || "질문 등록 실패", "error");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px" }}>
        <div className="spinner" />
      </div>
    );

  if (!lecture)
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state-icon"><IconAward size={48} /></div>
        <p>강의를 찾을 수 없습니다</p>
      </div>
    );

  const rating = (lecture.rating ?? 0).toFixed(1);
  const studentCount = (lecture.studentCount ?? 0).toLocaleString();
  const totalChapters = lecture.chapters?.length ?? 0;
  const completedCount = progressData?.completedCount ?? completedChapters.size;
  const progressPercent = progressData?.progressPercent ?? (totalChapters > 0 ? Math.round(completedCount * 100 / totalChapters) : 0);

  const chapterList = (dark = false) => (
    lecture.chapters?.length > 0 ? (
      <div className={`chapters-list ${dark ? "chapters-list-dark" : ""}`}>
        {lecture.chapters.map((ch, i) => {
          const isActive = activeChapter === ch.id;
          const isCompleted = completedChapters.has(ch.id);
          const isLoading = watchLoading && isActive;
          return (
            <div
              key={ch.id}
              className={`chapter-item ${isActive ? "active" : ""} ${isCompleted && !isActive ? "completed" : ""}`}
              onClick={() => handleWatchChapter(ch.id)}
            >
              <div className={`chapter-num ${isCompleted ? "chapter-num-done" : ""} ${isActive ? "chapter-num-active" : ""}`}>
                {isLoading ? (
                  <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                ) : isCompleted ? (
                  <IconCheck size={12} />
                ) : (
                  i + 1
                )}
              </div>
              <div className="chapter-info">
                <div className="chapter-title">{ch.title}</div>
                {isCompleted && <div className="chapter-status-text">완료</div>}
              </div>
              {!isLoading && (
                <span className="chapter-play">
                  {isActive ? "▶" : "▷"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <p style={{ color: dark ? "#888" : "var(--gray-400)", fontSize: 14, padding: dark ? "16px 20px" : 0 }}>
        아직 등록된 챕터가 없습니다.
      </p>
    )
  );

  return (
    <div className="lecture-detail-page">
      {/* Hero — 비디오 재생 중에는 숨김 */}
      {!watchData && (
        <div className="detail-hero">
          <div className="container detail-hero-inner">
            <div className="detail-hero-info">
              <div className="detail-breadcrumb">
                {lecture.certificate && (
                  <span className="badge badge-orange" style={{ fontSize: 12 }}>
                    {lecture.certificate.name}
                  </span>
                )}
                {lecture.category && (
                  <span className="badge badge-gray" style={{ fontSize: 12 }}>
                    {lecture.category}
                  </span>
                )}
              </div>
              <h1 className="detail-title">{lecture.title}</h1>
              {lecture.description && (
                <p className="detail-desc">{lecture.description}</p>
              )}
              <div className="detail-stats">
                <span className="detail-stat-item">
                  <IconStar size={14} filled className="stat-star" /> {rating}
                </span>
                <span className="stat-sep" />
                <span className="detail-stat-item"><IconUsers size={14} /> 수강생 {studentCount}명</span>
                <span className="stat-sep" />
                <span className="detail-stat-item"><IconHeart size={14} /> {likeCount.toLocaleString()}</span>
                <span className="stat-sep" />
                <span className="detail-stat-item"><IconVideo size={14} /> {lecture.chapterCount}개 챕터</span>
              </div>
              {lecture.instructor && (
                <Link to={`/instructor/${lecture.instructor.id}`} className="detail-instructor detail-instructor-link">
                  <div className="instructor-avatar">
                    {lecture.instructor.profileImage ? (
                      <img src={lecture.instructor.profileImage} alt="" />
                    ) : (
                      <span>{lecture.instructor.nickname[0]}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--gray-400)" }}>강사</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{lecture.instructor.nickname}</div>
                  </div>
                </Link>
              )}
            </div>
            <div className="detail-hero-thumb">
              {lecture.thumbnailUrl ? (
                <img src={lecture.thumbnailUrl} alt={lecture.title} />
              ) : (
                <div className="thumb-placeholder-large"><IconAward size={48} /></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player Zone */}
      {watchData && (
        <div className="player-zone fade-up">
          <div className="player-video-col">
            <div className="player-title-bar">
              <button
                className="player-back-btn"
                onClick={() => { flushProgress(); setWatchData(null); setActiveChapter(null); }}
              >
                <IconChevronLeft size={14} /> 목록으로
              </button>
              <span className="player-title-text">{watchData.title}</span>
              {watchData.completed && (
                <span className="badge badge-orange" style={{ fontSize: 11, gap: 4 }}>
                  <IconCheck size={11} /> 완료
                </span>
              )}
            </div>
            <div className="player-embed">
              {getYouTubeVideoId(watchData.videoUrl) ? (
                <div key={watchData.id} ref={ytContainerRef} style={{ width: "100%", height: "100%" }} />
              ) : (
                <iframe
                  src={getEmbedUrl(watchData.videoUrl)}
                  title={watchData.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            {!watchData.completed && (
              <div className="player-footer">
                <button className="btn btn-primary" onClick={handleComplete}>
                  <IconCheck size={14} /> 시청 완료로 표시
                </button>
              </div>
            )}
            {watchData.completed && (
              <div className="player-footer player-footer-done">
                <IconCheck size={16} />
                <span>이 챕터를 완료했습니다</span>
              </div>
            )}
          </div>

          {/* Chapter Sidebar */}
          <div className="player-chapter-sidebar">
            <div className="player-chapter-header">
              <div className="player-chapter-title">{lecture.title}</div>
              {enrolled && (
                <div className="player-progress-bar-wrap">
                  <div className="player-progress-label">
                    <span>{completedCount}/{totalChapters} 챕터 완료</span>
                    <span className="player-progress-pct">{progressPercent}%</span>
                  </div>
                  <div className="player-progress-track">
                    <div
                      className="player-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            {chapterList(true)}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="container detail-body">
        <div className="detail-main">
          {/* Progress bar (not playing) */}
          {!watchData && enrolled && totalChapters > 0 && (
            <div className="lecture-progress-card">
              <div className="lpc-header">
                <span className="lpc-title">학습 진도</span>
                <span className="lpc-pct">{progressPercent}%</span>
              </div>
              <div className="lpc-track">
                <div className="lpc-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="lpc-sub">
                {completedCount}/{totalChapters} 챕터 완료
              </div>
            </div>
          )}

          {/* Tabs */}
          {!watchData && (
            <div className="detail-tabs">
              <button
                className={`detail-tab ${activeTab === "curriculum" ? "active" : ""}`}
                onClick={() => setActiveTab("curriculum")}
              >
                커리큘럼
              </button>
              <button
                className={`detail-tab ${activeTab === "reviews" ? "active" : ""}`}
                onClick={() => setActiveTab("reviews")}
              >
                수강 후기
                {reviewSummary && reviewSummary.reviewCount > 0 && (
                  <span className="tab-count">{reviewSummary.reviewCount}</span>
                )}
              </button>
              <button
                className={`detail-tab ${activeTab === "questions" ? "active" : ""}`}
                onClick={() => setActiveTab("questions")}
              >
                Q&amp;A
                {questions.length > 0 && (
                  <span className="tab-count">{questions.length}</span>
                )}
              </button>
            </div>
          )}

          {/* Curriculum tab */}
          {(!watchData && activeTab === "curriculum") && (
            <div className="chapters-section">
              <div className="chapters-section-header">
                <h2 className="section-heading">강의 목차</h2>
                <span className="chapters-count">{totalChapters}개 챕터</span>
              </div>
              {chapterList(false)}
            </div>
          )}

          {/* Reviews tab OR always show when watching */}
          {(!watchData && activeTab === "reviews" || watchData) && !watchData && (
            <div className="reviews-section">
              <div className="reviews-header">
                <h2 className="section-heading">수강생 리뷰</h2>
                {reviewSummary && reviewSummary.reviewCount > 0 && (
                  <div className="review-summary">
                    <span className="review-avg">{reviewSummary.averageRating.toFixed(1)}</span>
                    <StarRating value={Math.round(reviewSummary.averageRating)} />
                    <span style={{ fontSize: 13, color: "var(--gray-400)" }}>
                      ({reviewSummary.reviewCount}개 리뷰)
                    </span>
                  </div>
                )}
              </div>
              {user && enrolled && !showReviewForm && (
                <button
                  className="btn btn-outline"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => setShowReviewForm(true)}
                >
                  리뷰 작성
                </button>
              )}
              {showReviewForm && (
                <form className="review-form" onSubmit={handleSubmitReview}>
                  <div className="form-group">
                    <label>별점</label>
                    <StarRating
                      value={reviewForm.rating}
                      onChange={(v) => setReviewForm((p) => ({ ...p, rating: v }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>리뷰 내용</label>
                    <textarea
                      className="form-input review-textarea"
                      placeholder="강의에 대한 솔직한 리뷰를 작성해주세요."
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm((p) => ({ ...p, content: e.target.value }))}
                      rows={4}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                      {submittingReview ? "등록 중..." : "리뷰 등록"}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowReviewForm(false)}>
                      취소
                    </button>
                  </div>
                </form>
              )}
              {reviews.length > 0 ? (
                <div className="review-list">
                  {reviews.map((r) => {
                    return (
                      <div key={r.reviewId} className="review-item">
                        <div className="review-top">
                          <div className="review-author">
                            <div className="review-avatar">
                              {r.profileUrl ? (
                                <img src={r.profileUrl} alt="" />
                              ) : (
                                <span>{r.nickname[0]}</span>
                              )}
                            </div>
                            <div>
                              <div className="review-nickname">{r.nickname}</div>
                              <div className="review-date">
                                {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                              </div>
                            </div>
                          </div>
                          <StarRating value={Math.round(r.rating)} />
                        </div>
                        <p className="review-content">{r.content}</p>

                        {/* 강사 답글 */}
                        {r.reply && (
                          <div className="review-reply">
                            <div className="review-reply-header">
                              <span className="review-reply-badge">강사 답글</span>
                              <span className="review-reply-instructor">{r.instructorNickname}</span>
                              {r.replyAt && (
                                <span className="review-reply-date">{new Date(r.replyAt).toLocaleDateString("ko-KR")}</span>
                              )}
                            </div>
                            <p className="review-reply-content">{r.reply}</p>
                          </div>
                        )}

                        {/* 강사 답글 버튼 */}
                        {isInstructor && !r.reply && replyingReviewId !== r.reviewId && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: "4px 10px", marginTop: 8 }}
                            onClick={() => { setReplyingReviewId(r.reviewId); setReplyText(""); }}
                          >
                            답글 달기
                          </button>
                        )}

                        {isInstructor && replyingReviewId === r.reviewId && (
                          <div className="review-reply-form" style={{ marginTop: 12 }}>
                            <textarea
                              className="form-input review-textarea"
                              placeholder="수강생 리뷰에 답글을 작성해주세요."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              rows={3}
                            />
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ fontSize: 13 }}
                                disabled={submittingReply}
                                onClick={() => handleSubmitReply(r.reviewId)}
                              >
                                {submittingReply ? "등록 중..." : "답글 등록"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                style={{ fontSize: 13 }}
                                onClick={() => setReplyingReviewId(null)}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="review-empty">
                  <span>아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</span>
                </div>
              )}
            </div>
          )}

          {/* Q&A tab */}
          {!watchData && activeTab === "questions" && (
            <div className="reviews-section">
              <div className="reviews-header">
                <h2 className="section-heading">Q&amp;A</h2>
              </div>

              {!user ? (
                <p style={{ fontSize: 13, color: "var(--gray-400)" }}>
                  <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => navigate("/login")}>
                    로그인
                  </button>
                  {" "}후 질문을 등록할 수 있습니다.
                </p>
              ) : lecture && user.id === lecture.instructor?.id ? (
                <div style={{ padding: "12px 16px", background: "var(--surface-bg, #f8f9fa)", borderRadius: 8, fontSize: 13, color: "var(--gray-500)" }}>
                  강사는 수강생의 질문에{" "}
                  <Link to={`/teacher/my-lectures/${lectureId}`} style={{ color: "var(--primary)", fontWeight: 600 }}>
                    내 강의 페이지
                  </Link>
                  에서 확인하고 답변할 수 있습니다.
                </div>
              ) : (
                <form className="review-form" onSubmit={handleSubmitQuestion}>
                  <div className="form-group">
                    <label>강사에게 질문하기</label>
                    <textarea
                      className="form-input review-textarea"
                      placeholder="강의에 대해 궁금한 점을 질문해 보세요."
                      value={questionInput}
                      onChange={e => setQuestionInput(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submittingQuestion} style={{ alignSelf: "flex-start" }}>
                    {submittingQuestion ? "등록 중..." : "질문 등록"}
                  </button>
                </form>
              )}

              {questions.length > 0 ? (
                <div className="review-list" style={{ marginTop: 24 }}>
                  {questions.map(q => (
                    <div key={q.id} className="review-item">
                      <div className="review-top">
                        <div className="review-author">
                          <div className="review-avatar">
                            {q.profileImage
                              ? <img src={q.profileImage} alt="" />
                              : <span>{q.nickname[0]}</span>
                            }
                          </div>
                          <div>
                            <div className="review-nickname">{q.nickname}</div>
                            <div className="review-date">{new Date(q.createdAt).toLocaleDateString("ko-KR")}</div>
                          </div>
                        </div>
                      </div>
                      <p className="review-content">{q.content}</p>

                      {q.answer && (
                        <div className="review-reply">
                          <div className="review-reply-header">
                            <span className="review-reply-badge">강사 답변</span>
                            {q.answererNickname && (
                              <span className="review-reply-instructor">{q.answererNickname}</span>
                            )}
                            {q.answeredAt && (
                              <span className="review-reply-date">{new Date(q.answeredAt).toLocaleDateString("ko-KR")}</span>
                            )}
                          </div>
                          <p className="review-reply-content">{q.answer}</p>
                        </div>
                      )}

                      {!q.answer && (
                        <p style={{ fontSize: 12, color: "var(--gray-400)", marginTop: 8 }}>아직 답변이 없습니다.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="review-empty" style={{ marginTop: 24 }}>
                  <span>아직 등록된 질문이 없습니다. 첫 번째 질문을 남겨보세요!</span>
                </div>
              )}
            </div>
          )}

          {/* Reviews below player when watching */}
          {watchData && (
            <div className="reviews-section" style={{ paddingTop: 0 }}>
              <div className="reviews-header">
                <h2 className="section-heading">수강생 리뷰</h2>
              </div>
              {reviews.length > 0 ? (
                <div className="review-list">
                  {reviews.slice(0, 3).map((r) => (
                    <div key={r.reviewId} className="review-item">
                      <div className="review-top">
                        <div className="review-author">
                          <div className="review-avatar">
                            {r.profileUrl ? <img src={r.profileUrl} alt="" /> : <span>{r.nickname[0]}</span>}
                          </div>
                          <div>
                            <div className="review-nickname">{r.nickname}</div>
                            <div className="review-date">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</div>
                          </div>
                        </div>
                        <StarRating value={Math.round(r.rating)} />
                      </div>
                      <p className="review-content">{r.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="review-empty"><span>아직 리뷰가 없습니다.</span></div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="enroll-card">
            <div className="enroll-card-thumb">
              {lecture.thumbnailUrl ? (
                <img src={lecture.thumbnailUrl} alt="" />
              ) : (
                <div className="thumb-placeholder-large"><IconAward size={40} /></div>
              )}
            </div>
            <div className="enroll-card-body">
              <div className="enroll-stats">
                <div className="enroll-stat">
                  <strong>{lecture.chapterCount}</strong>
                  <span>챕터</span>
                </div>
                <div className="enroll-stat">
                  <strong>{studentCount}</strong>
                  <span>수강생</span>
                </div>
                <div className="enroll-stat">
                  <strong>{rating}</strong>
                  <span>평점</span>
                </div>
              </div>

              {enrolled && totalChapters > 0 && (
                <div className="enroll-progress">
                  <div className="enroll-progress-label">
                    <span>학습 진도</span>
                    <span className="enroll-progress-pct">{progressPercent}%</span>
                  </div>
                  <div className="enroll-progress-track">
                    <div className="enroll-progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="enroll-progress-sub">{completedCount}/{totalChapters} 챕터 완료</div>
                </div>
              )}

              {isInstructor ? (
                <>
                  <div className="instructor-own-badge">
                    <IconVideo size={14} /> 내 강의
                  </div>
                  <p style={{ fontSize: 12, color: "var(--gray-400)", textAlign: "center", margin: "4px 0 12px" }}>
                    강사는 자신의 강의를 수강 신청할 수 없습니다
                  </p>
                  <Link to={`/teacher/my-lectures/${lectureId}`} className="btn btn-primary enroll-btn">
                    강의 관리하기
                  </Link>
                </>
              ) : (
                <>
                  {enrolled ? (
                    <>
                      <div className="btn btn-ghost enroll-btn" style={{ cursor: "default", justifyContent: "center" }}>
                        <IconCheck size={15} /> 수강 중
                      </div>
                      <button
                        className="btn enroll-cancel-btn"
                        onClick={handleCancelEnrollment}
                        disabled={cancellingEnrollment}
                      >
                        {cancellingEnrollment
                          ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          : "수강 취소"
                        }
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary enroll-btn"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling
                        ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                        : "수강 신청하기"
                      }
                    </button>
                  )}
                </>
              )}
              <button
                className={`btn like-btn ${isLiked ? "like-btn-active" : "btn-ghost"}`}
                onClick={handleLike}
                disabled={liking}
              >
                <IconHeart size={15} filled={isLiked} />
                {isLiked ? "찜 취소" : "찜하기"}
                <span className="like-count">{likeCount.toLocaleString()}</span>
              </button>
              {!user && (
                <p style={{ fontSize: 12, color: "var(--gray-400)", textAlign: "center" }}>
                  로그인 후 이용 가능합니다
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
