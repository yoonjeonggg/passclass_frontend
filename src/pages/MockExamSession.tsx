import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockExamApi } from '../api';
import type { MockExamDetailResponse, MockExamQuestion, MockExamResultItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { IconCheck, IconX, IconArrowRight, IconClipboard } from '../components/Icons';
import './MockExamSession.css';

type Phase = 'loading' | 'exam' | 'result' | 'error';

export default function MockExamSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [exam, setExam] = useState<MockExamDetailResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [results, setResults] = useState<MockExamResultItem[]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    if (!id) { setPhase('error'); return; }
    mockExamApi.getDetail(Number(id))
      .then(res => {
        setExam(res.data);
        setPhase('exam');
      })
      .catch(() => setPhase('error'));
  }, [id]);

  const selectAnswer = (problemId: number, val: number) => {
    if (phase !== 'exam') return;
    setAnswers(prev => ({ ...prev, [problemId]: val }));
  };

  const handleSubmit = async () => {
    if (!exam || !user) return;
    const unanswered = exam.questions.filter(q => !answers[q.problemId]);
    if (unanswered.length > 0) {
      const ok = window.confirm(`${unanswered.length}개 문항이 미응답 상태입니다. 그대로 제출하시겠습니까?`);
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const answerList = exam.questions.map(q => ({
        problemId: q.problemId,
        selectedAnswer: answers[q.problemId] ?? 0,
      }));
      const res = await mockExamApi.submit(Number(id), { answers: answerList });
      setScore(res.data.score);
      setResults(res.data.results);
      setPhase('result');
      setCurrentQ(0);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '제출에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = exam ? exam.questions.filter(q => answers[q.problemId]).length : 0;
  const totalCount = exam?.questions.length ?? 0;

  const getResult = (problemId: number) => results.find(r => r.problemId === problemId);

  if (phase === 'loading') {
    return (
      <div className="session-page">
        <div className="loading-center" style={{ paddingTop: 120 }}><div className="spinner" /></div>
      </div>
    );
  }

  if (phase === 'error' || !exam) {
    return (
      <div className="session-page">
        <div className="session-error">
          <p>모의고사를 불러올 수 없습니다.</p>
          <Link to="/mock-exams" className="btn btn-primary" style={{ marginTop: 16 }}>목록으로</Link>
        </div>
      </div>
    );
  }

  /* ── Result phase ── */
  if (phase === 'result') {
    const correctCount = results.filter(r => r.correct).length;
    const passed = score >= 60;

    return (
      <div className="session-page">
        <div className="container session-result-wrap">
          <div className="result-hero">
            <div className={`result-score-circle ${passed ? 'pass' : 'fail'}`}>
              <span className="result-score-val">{score}</span>
              <span className="result-score-unit">점</span>
            </div>
            <h2 className="result-title">{passed ? '합격권입니다!' : '조금 더 노력하세요!'}</h2>
            <p className="result-sub">
              {totalCount}문제 중 {correctCount}개 정답 (정답률 {score}%)
            </p>
          </div>

          <div className="result-questions">
            <h3 className="result-questions-title">문항별 결과</h3>
            <div className="result-q-list">
              {exam.questions.map((q, idx) => {
                const r = getResult(q.problemId);
                return (
                  <div key={q.problemId} className={`result-q-item ${r?.correct ? 'correct' : 'wrong'}`}>
                    <div className="result-q-num">
                      {r?.correct
                        ? <IconCheck size={14} />
                        : <IconX size={14} />
                      }
                      Q{idx + 1}
                    </div>
                    <p className="result-q-content">{q.content}</p>
                    <div className={`result-q-badge ${r?.correct ? 'badge-correct' : 'badge-wrong'}`}>
                      {r?.correct ? '정답' : '오답'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="result-actions">
            <button className="btn btn-outline" onClick={() => { setPhase('exam'); setAnswers({}); }}>
              다시 풀기
            </button>
            <Link to="/mock-exams" className="btn btn-primary">
              목록으로 <IconArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Exam phase ── */
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="session-page">
        <div className="session-error">
          <p>이 모의고사에 등록된 문제가 없습니다.</p>
          <Link to="/mock-exams" className="btn btn-primary" style={{ marginTop: 16 }}>목록으로</Link>
        </div>
      </div>
    );
  }

  const currentQuestion: MockExamQuestion = exam.questions[currentQ];

  if (!currentQuestion) {
    return (
      <div className="session-page">
        <div className="session-error">
          <p>문제를 불러올 수 없습니다.</p>
          <Link to="/mock-exams" className="btn btn-primary" style={{ marginTop: 16 }}>목록으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="session-page">
      {/* 상단 헤더 */}
      <div className="session-header">
        <div className="container session-header-inner">
          <div className="session-header-left">
            <IconClipboard size={16} />
            <span className="session-exam-title">{exam.title}</span>
          </div>
          <div className="session-header-right">
            <span className="session-progress-text">
              {answeredCount} / {totalCount} 응답
            </span>
            <div className="session-progress-bar">
              <div
                className="session-progress-fill"
                style={{ width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container session-body">
        {/* 문항 번호 네비게이션 */}
        <aside className="session-nav">
          <p className="session-nav-label">문항 목록</p>
          <div className="session-nav-grid">
            {exam.questions.map((q, idx) => (
              <button
                key={q.problemId}
                className={`session-nav-btn
                  ${idx === currentQ ? 'current' : ''}
                  ${answers[q.problemId] ? 'answered' : ''}
                `}
                onClick={() => setCurrentQ(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="session-nav-legend">
            <span className="legend-item legend-answered">응답</span>
            <span className="legend-item legend-current">현재</span>
            <span className="legend-item legend-empty">미응답</span>
          </div>
        </aside>

        {/* 현재 문제 */}
        <div className="session-question">
          <div className="session-q-header">
            <span className="session-q-num">Q{currentQ + 1}</span>
          </div>

          <p className="session-q-content">{currentQuestion.content}</p>

          <div className="session-options">
            {(['option1', 'option2', 'option3', 'option4'] as const).map((key, i) => {
              const val = i + 1;
              const optionText = currentQuestion[key];
              if (!optionText) return null;
              return (
                <button
                  key={val}
                  className={`session-option ${answers[currentQuestion.problemId] === val ? 'selected' : ''}`}
                  onClick={() => selectAnswer(currentQuestion.problemId, val)}
                >
                  <span className="session-option-num">{val}</span>
                  <span className="session-option-text">{optionText}</span>
                </button>
              );
            })}
          </div>

          <div className="session-q-nav">
            <button
              className="btn btn-ghost session-q-nav-btn"
              onClick={() => setCurrentQ(q => q - 1)}
              disabled={currentQ === 0}
            >
              이전 문항
            </button>
            {currentQ < totalCount - 1 ? (
              <button
                className="btn btn-ghost session-q-nav-btn"
                onClick={() => setCurrentQ(q => q + 1)}
              >
                다음 문항
              </button>
            ) : (
              <button
                className="btn btn-primary session-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || !user}
              >
                {submitting ? '제출 중...' : '최종 제출'}
              </button>
            )}
          </div>
          {!user && (
            <p className="session-login-notice">제출하려면 로그인이 필요합니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
