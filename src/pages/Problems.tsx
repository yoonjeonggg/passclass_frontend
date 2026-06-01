import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { certificateApi, problemApi } from '../api';
import type { CertificateResponse, ProblemListItem, ProblemSolveResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { IconFileText, IconCheck, IconX, IconChevronLeft, IconChevronRight } from '../components/Icons';
import './Problems.css';

interface SolveState {
  selectedAnswer: number | null;
  submitted: boolean;
  result: ProblemSolveResponse | null;
  loading: boolean;
}

export default function Problems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [problems, setProblems]         = useState<ProblemListItem[]>([]);
  const [certLoading, setCertLoading]   = useState(true);
  const [probLoading, setProbLoading]   = useState(false);

  const [selectedCertId, setSelectedCertId] = useState<number | null>(
    searchParams.get('certificateId') ? Number(searchParams.get('certificateId')) : null
  );

  // 모달 상태
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [solveStates, setSolveStates] = useState<Record<number, SolveState>>({});

  useEffect(() => {
    certificateApi.getAll()
      .then(res => setCertificates(res.data))
      .catch(() => toast('자격증 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setCertLoading(false));
  }, [toast]);

  const fetchProblems = useCallback((certId: number) => {
    setProbLoading(true);
    setSolveStates({});
    problemApi.getList(certId)
      .then(res => setProblems(res.data))
      .catch(() => {
        setProblems([]);
        toast('문제 목록을 불러오지 못했습니다.', 'error');
      })
      .finally(() => setProbLoading(false));
  }, [toast]);

  useEffect(() => {
    if (selectedCertId) fetchProblems(selectedCertId);
    else setProblems([]);
  }, [selectedCertId, fetchProblems]);

  const handleSelectCert = (id: number) => {
    setSelectedCertId(id);
    setSearchParams({ certificateId: String(id) });
    setModalIndex(null);
  };

  const openModal = (idx: number) => setModalIndex(idx);
  const closeModal = () => setModalIndex(null);

  const handlePrev = () => {
    if (modalIndex !== null && modalIndex > 0) setModalIndex(modalIndex - 1);
  };
  const handleNext = () => {
    if (modalIndex !== null && modalIndex < problems.length - 1) setModalIndex(modalIndex + 1);
  };

  const selectOption = (problemId: number, answer: number) => {
    const state = solveStates[problemId];
    if (state?.submitted) return;
    setSolveStates(prev => ({
      ...prev,
      [problemId]: { ...prev[problemId], selectedAnswer: answer, submitted: false, result: null, loading: false },
    }));
  };

  const submitAnswer = async (problemId: number) => {
    const state = solveStates[problemId];
    if (!state?.selectedAnswer || state.submitted) return;
    setSolveStates(prev => ({ ...prev, [problemId]: { ...prev[problemId], loading: true } }));
    try {
      const res = await problemApi.solve(problemId, { selectedAnswer: state.selectedAnswer });
      setSolveStates(prev => ({
        ...prev,
        [problemId]: { ...prev[problemId], submitted: true, result: res.data, loading: false },
      }));
    } catch (err: unknown) {
      setSolveStates(prev => ({ ...prev, [problemId]: { ...prev[problemId], loading: false } }));
      toast(err instanceof Error ? err.message : '채점 중 오류가 발생했습니다.', 'error');
    }
  };

  const currentProblem = modalIndex !== null ? problems[modalIndex] : null;
  const currentState = currentProblem ? (solveStates[currentProblem.id] ?? { selectedAnswer: null, submitted: false, result: null, loading: false }) : null;

  const selectedCert = certificates.find(c => c.id === selectedCertId);

  const solvedCount = problems.filter(p => solveStates[p.id]?.submitted).length;
  const correctCount = problems.filter(p => solveStates[p.id]?.result?.correct).length;

  return (
    <div className="problems-page">
      <div className="problems-hero">
        <div className="container">
          <h1 className="problems-hero-title">문제 풀기</h1>
          <p className="problems-hero-sub">자격증별 문제를 풀며 실력을 점검하세요</p>
        </div>
      </div>

      <div className="container problems-body">
        {/* 자격증 선택 사이드바 */}
        <aside className="problems-sidebar">
          <div className="sidebar-label">자격증 선택</div>
          {certLoading ? (
            <div className="loading-center" style={{ padding: '24px 0' }}><div className="spinner" /></div>
          ) : (
            <div className="prob-cert-list">
              {certificates.map(cert => (
                <button
                  key={cert.id}
                  className={`prob-cert-btn ${selectedCertId === cert.id ? 'active' : ''}`}
                  onClick={() => handleSelectCert(cert.id)}
                >
                  {cert.name}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* 문제 목록 */}
        <div className="problems-main">
          {!selectedCertId ? (
            <div className="problems-placeholder">
              <div className="problems-placeholder-icon"><IconFileText size={36} /></div>
              <p className="problems-placeholder-title">자격증을 선택하세요</p>
              <p className="problems-placeholder-sub">왼쪽에서 자격증을 선택하면 문제가 표시됩니다</p>
            </div>
          ) : probLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : problems.length === 0 ? (
            <div className="problems-placeholder">
              <div className="problems-placeholder-icon"><IconFileText size={36} /></div>
              <p className="problems-placeholder-title">등록된 문제가 없습니다</p>
              <p className="problems-placeholder-sub">아직 이 자격증의 문제가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="problems-toolbar">
                <div className="problems-meta">
                  <span className="problems-cert-name">{selectedCert?.name}</span>
                  <span className="problems-count">총 {problems.length}문제</span>
                </div>
                {solvedCount > 0 && (
                  <div className="problems-progress-info">
                    <span className="progress-solved">{solvedCount}개 풀이 완료</span>
                    <span className="progress-correct">정답 {correctCount}개</span>
                  </div>
                )}
              </div>

              <div className="problems-grid">
                {problems.map((prob, idx) => {
                  const state = solveStates[prob.id];
                  return (
                    <button
                      key={prob.id}
                      className={`prob-card ${state?.submitted ? (state.result?.correct ? 'correct' : 'wrong') : ''}`}
                      onClick={() => openModal(idx)}
                    >
                      <div className="prob-card-num">Q{idx + 1}</div>
                      <p className="prob-card-content">{prob.content}</p>
                      {state?.submitted && (
                        <div className={`prob-card-badge ${state.result?.correct ? 'badge-correct' : 'badge-wrong'}`}>
                          {state.result?.correct ? <><IconCheck size={12} /> 정답</> : <><IconX size={12} /> 오답</>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 문제 풀기 모달 */}
      {modalIndex !== null && currentProblem && currentState && (
        <div className="prob-modal-overlay" onClick={closeModal}>
          <div className="prob-modal" onClick={e => e.stopPropagation()}>
            <div className="prob-modal-header">
              <div className="prob-modal-num">Q{modalIndex + 1} / {problems.length}</div>
              <button className="prob-modal-close" onClick={closeModal}><IconX size={18} /></button>
            </div>

            <div className="prob-modal-body">
              <p className="prob-modal-content">{currentProblem.content}</p>

              {!currentState.submitted ? (
                <div className="prob-options">
                  {(['option1', 'option2', 'option3', 'option4'] as const).map((key, i) => {
                    const val = i + 1;
                    return (
                      <button
                        key={val}
                        className={`prob-option-btn ${currentState.selectedAnswer === val ? 'selected' : ''}`}
                        onClick={() => selectOption(currentProblem.id, val)}
                      >
                        <span className="prob-option-num">{val}</span>
                        <span className="prob-option-text">{currentProblem[key]}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={`prob-result ${currentState.result?.correct ? 'result-correct' : 'result-wrong'}`}>
                  <div className="prob-result-badge">
                    {currentState.result?.correct
                      ? <><IconCheck size={16} /> 정답입니다!</>
                      : <><IconX size={16} /> 오답입니다</>
                    }
                  </div>
                  {currentState.result?.explanation && (
                    <div className="prob-result-explanation">
                      <span className="prob-result-label">해설</span>
                      <p>{currentState.result.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="prob-modal-footer">
              <div className="prob-modal-nav">
                <button className="prob-nav-btn" onClick={handlePrev} disabled={modalIndex === 0}>
                  <IconChevronLeft size={16} /> 이전
                </button>
                <button className="prob-nav-btn" onClick={handleNext} disabled={modalIndex === problems.length - 1}>
                  다음 <IconChevronRight size={16} />
                </button>
              </div>
              {!currentState.submitted && user && (
                <button
                  className="btn btn-primary prob-submit-btn"
                  onClick={() => submitAnswer(currentProblem.id)}
                  disabled={!currentState.selectedAnswer || currentState.loading}
                >
                  {currentState.loading ? '채점 중...' : '제출하기'}
                </button>
              )}
              {!user && (
                <p className="prob-login-notice">제출하려면 로그인이 필요합니다</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
