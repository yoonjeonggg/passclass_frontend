import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { lectureApi, enrollmentApi, chapterApi, likeApi, reviewApi } from "../api";
import { IconStar, IconUsers, IconVideo, IconHeart, IconCheck, IconAward, IconChevronLeft } from "../components/Icons";
import type {
  LectureDetailResponse,
  ChapterWatchResponse,
  LectureProgressResponse,
  ReviewResponse,
  ReviewSummaryResponse,
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

  // Active tab in body area
  const [activeTab, setActiveTab] = useState<"curriculum" | "reviews">("curriculum");

  useEffect(() => {
    if (!lectureId) return;
    const id = Number(lectureId);

    const promises: Promise<any>[] = [
      lectureApi.getDetail(id),
      reviewApi.getList(id),
      reviewApi.getSummary(id),
    ];

    if (user) {
      promises.push(enrollmentApi.getMyEnrollments());
    }

    Promise.all(promises)
      .then(([lRes, reviewRes, summaryRes, enrollRes]) => {
        const l = lRes.data;
        setLecture(l);
        setIsLiked(l.isLiked ?? false);
        setLikeCount(l.likeCount ?? 0);
        setReviews(reviewRes.data);
        setReviewSummary(summaryRes.data);
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
      toast(err.message || "수강 신청 후 이용 가능합니다.", "error");
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
                  {reviews.map((r) => (
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="review-empty">
                  <span>아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</span>
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

              <button
                className={`btn ${enrolled ? "btn-ghost" : "btn-primary"} enroll-btn`}
                onClick={handleEnroll}
                disabled={enrolling || enrolled}
              >
                {enrolling ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : enrolled ? (
                  <><IconCheck size={15} /> 수강 중</>
                ) : (
                  "수강 신청하기"
                )}
              </button>
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
