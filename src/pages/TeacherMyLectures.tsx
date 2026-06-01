import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lectureApi, reviewApi, questionApi } from '../api';
import type {
  LectureListDto,
  LectureDetailResponse,
  ReviewResponse,
  LectureQuestionResponse,
} from '../types';
import { useToast } from '../components/Toast';
import { IconStar, IconUsers, IconHeart, IconVideo, IconChevronLeft, IconAward } from '../components/Icons';
import './TeacherMyLectures.css';

type DetailTab = 'stats' | 'reviews' | 'questions';

export default function TeacherMyLectures() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [lectures, setLectures] = useState<LectureListDto[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [lecture, setLecture] = useState<LectureDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('stats');

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [questions, setQuestions] = useState<LectureQuestionResponse[]>([]);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    if (!user) return;
    lectureApi.getInstructorProfile(user.id)
      .then(r => setLectures(r.data.lectures))
      .catch(() => toast('강의 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setListLoading(false));
  }, [user, toast]);

  useEffect(() => {
    if (!lectureId) {
      setLecture(null);
      setReviews([]);
      setQuestions([]);
      return;
    }
    setDetailLoading(true);
    const id = Number(lectureId);
    Promise.all([
      lectureApi.getDetail(id),
      reviewApi.getList(id),
      questionApi.getList(id).catch(() => ({ data: [] })),
    ])
      .then(([lRes, rRes, qRes]) => {
        setLecture(lRes.data);
        setReviews(rRes.data);
        setQuestions((qRes as any).data ?? []);
        setActiveTab('stats');
      })
      .catch(() => toast('강의 정보를 불러오지 못했습니다.', 'error'))
      .finally(() => setDetailLoading(false));
  }, [lectureId, toast]);

  const handleReply = async (reviewId: number) => {
    if (!replyText.trim()) { toast('답글 내용을 입력해주세요.', 'error'); return; }
    setSubmittingReply(true);
    try {
      await reviewApi.reply(reviewId, { reply: replyText.trim() });
      toast('답글이 등록되었습니다.', 'success');
      setReplyingReviewId(null);
      setReplyText('');
      const r = await reviewApi.getList(Number(lectureId));
      setReviews(r.data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '답글 등록 실패', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAnswer = async (questionId: number) => {
    if (!answerText.trim()) { toast('답변 내용을 입력해주세요.', 'error'); return; }
    setSubmittingAnswer(true);
    try {
      await questionApi.answer(Number(lectureId), questionId, { answer: answerText.trim() });
      toast('답변이 등록되었습니다.', 'success');
      setAnsweringId(null);
      setAnswerText('');
      const q = await questionApi.getList(Number(lectureId));
      setQuestions(q.data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '답변 등록 실패', 'error');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // ── 목록 뷰 ──
  if (!lectureId) {
    return (
      <div className="tml-page">
        <div className="staff-hero">
          <div className="container">
            <h1 className="staff-hero-title">내 강의</h1>
            <p className="staff-hero-sub">등록한 강의의 인기도와 수강 현황을 확인합니다.</p>
          </div>
        </div>
        <div className="container tml-body">
          {listLoading ? (
            <div className="loading-center" style={{ padding: 80 }}><div className="spinner" /></div>
          ) : lectures.length === 0 ? (
            <div className="tml-empty">
              <div className="empty-state-icon"><IconAward size={48} /></div>
              <p>아직 등록된 강의가 없습니다.</p>
              <Link to="/teacher" className="btn btn-primary" style={{ marginTop: 16 }}>
                강사 스튜디오에서 강의 생성
              </Link>
            </div>
          ) : (
            <div className="tml-grid">
              {lectures.map(l => (
                <Link key={l.id} to={`/teacher/my-lectures/${l.id}`} className="tml-card">
                  <div className="tml-card-thumb">
                    {l.thumbnailUrl
                      ? <img src={l.thumbnailUrl} alt={l.title} />
                      : <div className="tml-thumb-placeholder"><IconAward size={32} /></div>
                    }
                  </div>
                  <div className="tml-card-body">
                    <div className="tml-card-cert">{l.certificate?.name}</div>
                    <h3 className="tml-card-title">{l.title}</h3>
                    <div className="tml-card-stats">
                      <span className="tml-stat-chip"><IconUsers size={13} /> {(l.enrollmentCount ?? 0).toLocaleString()}명</span>
                      <span className="tml-stat-chip"><IconHeart size={13} /> {(l.likeCount ?? 0).toLocaleString()}</span>
                      <span className="tml-stat-chip"><IconStar size={13} filled /> {(l.rating ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="tml-card-arrow">→</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 상세 뷰 ──
  if (detailLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="tml-empty" style={{ marginTop: 80 }}>
        <p>강의를 찾을 수 없습니다.</p>
        <Link to="/teacher/my-lectures" className="btn btn-ghost" style={{ marginTop: 16 }}>목록으로</Link>
      </div>
    );
  }

  const unansweredCount = questions.filter(q => !q.answer).length;

  return (
    <div className="tml-page">
      <div className="tml-detail-hero">
        <div className="container">
          <Link to="/teacher/my-lectures" className="tml-back-btn">
            <IconChevronLeft size={14} /> 내 강의 목록
          </Link>
          <h1 className="tml-detail-title">{lecture.title}</h1>
          <div className="tml-detail-badges">
            {lecture.certificate && <span className="badge badge-orange">{lecture.certificate.name}</span>}
            {lecture.category && <span className="badge badge-gray">{lecture.category}</span>}
          </div>
        </div>
      </div>

      <div className="container tml-detail-body">
        {/* 통계 요약 바 */}
        <div className="tml-stats-bar">
          <div className="tml-stat-item">
            <strong>{(lecture.studentCount ?? 0).toLocaleString()}</strong>
            <span>수강생</span>
          </div>
          <div className="tml-stat-item">
            <strong>{(lecture.rating ?? 0).toFixed(1)}</strong>
            <span>평점</span>
          </div>
          <div className="tml-stat-item">
            <strong>{(lecture.likeCount ?? 0).toLocaleString()}</strong>
            <span>찜</span>
          </div>
          <div className="tml-stat-item">
            <strong>{lecture.chapterCount}</strong>
            <span>챕터</span>
          </div>
          <div className="tml-stat-item">
            <strong>{reviews.length}</strong>
            <span>리뷰</span>
          </div>
        </div>

        {/* 탭 */}
        <div className="tml-tabs">
          <button className={`tml-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            통계
          </button>
          <button className={`tml-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            리뷰 관리
            {reviews.length > 0 && <span className="tml-tab-badge">{reviews.length}</span>}
          </button>
          <button className={`tml-tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
            질문 답변
            {unansweredCount > 0 && <span className="tml-tab-badge tml-tab-badge-red">{unansweredCount}</span>}
          </button>
        </div>

        {/* ── 통계 탭 ── */}
        {activeTab === 'stats' && (
          <div className="tml-panel">
            {lecture.description && (
              <p className="tml-lecture-desc">{lecture.description}</p>
            )}
            <div className="tml-stats-grid">
              <div className="tml-stats-card">
                <div className="tml-stats-card-label"><IconUsers size={15} /> 총 수강생</div>
                <div className="tml-stats-card-value">{(lecture.studentCount ?? 0).toLocaleString()}명</div>
              </div>
              <div className="tml-stats-card">
                <div className="tml-stats-card-label"><IconStar size={15} filled /> 평균 평점</div>
                <div className="tml-stats-card-value">{(lecture.rating ?? 0).toFixed(1)} / 5.0</div>
              </div>
              <div className="tml-stats-card">
                <div className="tml-stats-card-label"><IconHeart size={15} /> 찜 수</div>
                <div className="tml-stats-card-value">{(lecture.likeCount ?? 0).toLocaleString()}</div>
              </div>
              <div className="tml-stats-card">
                <div className="tml-stats-card-label"><IconVideo size={15} /> 챕터 수</div>
                <div className="tml-stats-card-value">{lecture.chapterCount}개</div>
              </div>
              <div className="tml-stats-card">
                <div className="tml-stats-card-label">리뷰 수</div>
                <div className="tml-stats-card-value">{reviews.length}개</div>
              </div>
              <div className="tml-stats-card" style={{ borderColor: unansweredCount > 0 ? 'var(--primary)' : undefined }}>
                <div className="tml-stats-card-label">미답변 질문</div>
                <div className="tml-stats-card-value" style={{ color: unansweredCount > 0 ? 'var(--primary)' : undefined }}>
                  {unansweredCount}개
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Link to={`/lectures/${lecture.id}`} className="btn btn-outline" target="_blank" rel="noreferrer">
                강의 페이지 보기
              </Link>
              <Link to="/teacher" className="btn btn-ghost">
                강사 스튜디오
              </Link>
            </div>
          </div>
        )}

        {/* ── 리뷰 관리 탭 ── */}
        {activeTab === 'reviews' && (
          <div className="tml-panel">
            {reviews.length === 0 ? (
              <p className="tml-empty-text">아직 등록된 리뷰가 없습니다.</p>
            ) : (
              <div className="tml-review-list">
                {reviews.map(r => (
                  <div key={r.reviewId} className="tml-review-item">
                    <div className="tml-review-top">
                      <div className="tml-review-author">
                        <div className="tml-avatar">
                          {r.profileUrl ? <img src={r.profileUrl} alt="" /> : <span>{r.nickname[0]}</span>}
                        </div>
                        <div>
                          <div className="tml-author-name">{r.nickname}</div>
                          <div className="tml-author-date">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </div>
                      <div className="tml-star-display">
                        {'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))}
                      </div>
                    </div>
                    <p className="tml-review-content">{r.content}</p>

                    {r.reply ? (
                      <div className="tml-reply-box">
                        <span className="tml-reply-badge">내 답글</span>
                        <p>{r.reply}</p>
                        {r.replyAt && (
                          <span className="tml-reply-date">{new Date(r.replyAt).toLocaleDateString('ko-KR')}</span>
                        )}
                      </div>
                    ) : replyingReviewId === r.reviewId ? (
                      <div className="tml-reply-form">
                        <textarea
                          placeholder="수강생 리뷰에 답글을 작성해주세요."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={3}
                        />
                        <div className="tml-form-actions">
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 13 }}
                            disabled={submittingReply}
                            onClick={() => handleReply(r.reviewId)}
                          >
                            {submittingReply ? '등록 중…' : '답글 등록'}
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 13 }}
                            onClick={() => setReplyingReviewId(null)}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="tml-action-btn"
                        onClick={() => { setReplyingReviewId(r.reviewId); setReplyText(''); }}
                      >
                        답글 달기
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 질문 답변 탭 ── */}
        {activeTab === 'questions' && (
          <div className="tml-panel">
            {questions.length === 0 ? (
              <p className="tml-empty-text">아직 등록된 질문이 없습니다.</p>
            ) : (
              <div className="tml-question-list">
                {questions.map(q => (
                  <div key={q.id} className={`tml-question-item ${!q.answer ? 'tml-unanswered' : ''}`}>
                    <div className="tml-review-top">
                      <div className="tml-review-author">
                        <div className="tml-avatar">
                          {q.profileImage
                            ? <img src={q.profileImage} alt="" />
                            : <span>{q.nickname[0]}</span>
                          }
                        </div>
                        <div>
                          <div className="tml-author-name">{q.nickname}</div>
                          <div className="tml-author-date">{new Date(q.createdAt).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </div>
                      {!q.answer && <span className="tml-unanswered-badge">미답변</span>}
                    </div>
                    <p className="tml-question-content">{q.content}</p>

                    {q.answer ? (
                      <div className="tml-reply-box">
                        <span className="tml-reply-badge">내 답변</span>
                        <p>{q.answer}</p>
                        {q.answeredAt && (
                          <span className="tml-reply-date">{new Date(q.answeredAt).toLocaleDateString('ko-KR')}</span>
                        )}
                      </div>
                    ) : answeringId === q.id ? (
                      <div className="tml-reply-form">
                        <textarea
                          placeholder="질문에 대한 답변을 작성해주세요."
                          value={answerText}
                          onChange={e => setAnswerText(e.target.value)}
                          rows={3}
                        />
                        <div className="tml-form-actions">
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 13 }}
                            disabled={submittingAnswer}
                            onClick={() => handleAnswer(q.id)}
                          >
                            {submittingAnswer ? '등록 중…' : '답변 등록'}
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 13 }}
                            onClick={() => setAnsweringId(null)}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="tml-action-btn"
                        onClick={() => { setAnsweringId(q.id); setAnswerText(''); }}
                      >
                        답변하기
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
