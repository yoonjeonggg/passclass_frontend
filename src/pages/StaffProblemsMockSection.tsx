import React, { useEffect, useState } from 'react';
import { certificateApi, problemApi, mockExamApi } from '../api';
import type { CertificateResponse, ProblemListItem, MockExamListItem, MockExamQuestion, ProblemUpdateRequest, ProblemDetail } from '../types';
import { useToast } from '../components/Toast';
import './StaffProblemsMockSection.css';

export default function StaffProblemsMockSection() {
  const { toast } = useToast();
  const [certs, setCerts] = useState<CertificateResponse[]>([]);
  const [certId, setCertId] = useState<number | ''>('');
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [mocks, setMocks] = useState<MockExamListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [newProblem, setNewProblem] = useState({
    content: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctAnswer: 1,
    explanation: '',
  });

  const [mockTitle, setMockTitle] = useState('');
  const [addQMockId, setAddQMockId] = useState<number | ''>('');
  const [addQProblemId, setAddQProblemId] = useState<number | ''>('');
  const [mockQuestions, setMockQuestions] = useState<MockExamQuestion[]>([]);
  const [mockQuestionsLoading, setMockQuestionsLoading] = useState(false);

  const [editProblem, setEditProblem] = useState<ProblemDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    certificateApi.getAll()
      .then(r => setCerts(r.data))
      .catch(() => toast('자격증 목록을 불러오지 못했습니다.', 'error'));
  }, [toast]);

  useEffect(() => {
    if (!certId) {
      setProblems([]);
      setMocks([]);
      return;
    }
    const id = Number(certId);
    setLoading(true);
    Promise.all([problemApi.getList(id), mockExamApi.getList(id)])
      .then(([p, m]) => {
        setProblems(p.data);
        setMocks(m.data);
      })
      .catch(() => {
        setProblems([]);
        setMocks([]);
        toast('문제·모의고사 목록을 불러오지 못했습니다.', 'error');
      })
      .finally(() => setLoading(false));
  }, [certId, toast]);

  useEffect(() => {
    if (addQMockId === '') {
      setMockQuestions([]);
      return;
    }
    setMockQuestionsLoading(true);
    mockExamApi.getDetail(Number(addQMockId))
      .then(r => setMockQuestions(r.data.questions))
      .catch(() => setMockQuestions([]))
      .finally(() => setMockQuestionsLoading(false));
  }, [addQMockId]);

  const reloadLists = () => {
    if (!certId) return;
    const id = Number(certId);
    Promise.all([problemApi.getList(id), mockExamApi.getList(id)])
      .then(([p, m]) => {
        setProblems(p.data);
        setMocks(m.data);
      })
      .catch(() => toast('목록 갱신에 실패했습니다.', 'error'));
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId) {
      toast('자격증을 선택하세요.', 'error');
      return;
    }
    try {
      await problemApi.create({
        certificateId: Number(certId),
        content: newProblem.content,
        option1: newProblem.option1,
        option2: newProblem.option2,
        option3: newProblem.option3,
        option4: newProblem.option4,
        correctAnswer: newProblem.correctAnswer,
        explanation: newProblem.explanation,
      });
      toast('문제가 등록되었습니다.', 'success');
      setNewProblem({
        content: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctAnswer: 1,
        explanation: '',
      });
      reloadLists();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '문제 등록 실패', 'error');
    }
  };

  const openEdit = async (p: ProblemListItem) => {
    setEditLoading(true);
    try {
      const res = await problemApi.getDetail(p.id);
      setEditProblem(res.data);
    } catch {
      toast('문제 정보를 불러오지 못했습니다.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProblem) return;
    try {
      await problemApi.update(editProblem.id, {
        content: editProblem.content,
        option1: editProblem.option1 ?? '',
        option2: editProblem.option2 ?? '',
        option3: editProblem.option3 ?? '',
        option4: editProblem.option4 ?? '',
        correctAnswer: editProblem.correctAnswer ?? 1,
        explanation: editProblem.explanation ?? '',
      });
      toast('문제가 수정되었습니다.', 'success');
      setEditProblem(null);
      reloadLists();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '문제 수정 실패', 'error');
    }
  };

  const handleDeleteProblem = async (id: number) => {
    if (!window.confirm('이 문제를 삭제할까요?')) return;
    try {
      await problemApi.delete(id);
      toast('삭제되었습니다.', 'success');
      reloadLists();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  const handleCreateMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId) {
      toast('자격증을 선택하세요.', 'error');
      return;
    }
    if (!mockTitle.trim()) {
      toast('모의고사 제목을 입력하세요.', 'error');
      return;
    }
    try {
      await mockExamApi.create({ certificateId: Number(certId), title: mockTitle.trim() });
      toast('모의고사가 등록되었습니다.', 'success');
      setMockTitle('');
      reloadLists();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '모의고사 등록 실패', 'error');
    }
  };

  const handleAddQuestionToMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addQMockId === '' || addQProblemId === '') {
      toast('모의고사와 문제를 선택하세요.', 'error');
      return;
    }
    const alreadyAdded = mockQuestions.some(q => q.problemId === Number(addQProblemId));
    if (alreadyAdded) {
      toast('이미 이 모의고사에 등록된 문제입니다.', 'error');
      return;
    }
    try {
      await mockExamApi.addQuestion(Number(addQMockId), { problemId: Number(addQProblemId) });
      toast('모의고사에 문제가 추가되었습니다.', 'success');
      setAddQProblemId('');
      reloadLists();
      // 등록된 문제 목록 갱신
      const detail = await mockExamApi.getDetail(Number(addQMockId));
      setMockQuestions(detail.data.questions);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '추가 실패', 'error');
    }
  };

  const handleDeleteMock = async (id: number) => {
    if (!window.confirm('모의고사를 삭제할까요?')) return;
    try {
      await mockExamApi.remove(id);
      toast('삭제되었습니다.', 'success');
      reloadLists();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <>
      <section className="staff-panel">
        <h2 className="staff-panel-title">문제 · 모의고사 관리</h2>
        <p className="staff-panel-desc">자격증을 선택한 뒤 문제를 등록하거나 모의고사를 구성합니다.</p>

        <div className="staff-field">
          <label htmlFor="staff-cert-select">자격증</label>
          <select
            id="staff-cert-select"
            value={certId === '' ? '' : String(certId)}
            onChange={e => setCertId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">선택</option>
            {certs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {!certId ? (
          <p className="staff-hint">자격증을 선택하면 목록과 등록 폼이 표시됩니다.</p>
        ) : loading ? (
          <div className="loading-center" style={{ padding: '32px' }}><div className="spinner" /></div>
        ) : (
          <>
            <h3 className="staff-subtitle">새 문제 등록</h3>
            <form onSubmit={handleCreateProblem}>
              <div className="staff-field">
                <label>지문</label>
                <textarea
                  value={newProblem.content}
                  onChange={e => setNewProblem(s => ({ ...s, content: e.target.value }))}
                  required
                />
              </div>
              <div className="staff-form-grid">
                {([1, 2, 3, 4] as const).map(n => (
                  <div key={n} className="staff-field">
                    <label>보기 {n}</label>
                    <input
                      value={newProblem[`option${n}` as 'option1']}
                      onChange={e => setNewProblem(s => ({ ...s, [`option${n}`]: e.target.value }))}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="staff-form-grid">
                <div className="staff-field">
                  <label>정답 번호</label>
                  <select
                    value={newProblem.correctAnswer}
                    onChange={e => setNewProblem(s => ({ ...s, correctAnswer: Number(e.target.value) }))}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div className="staff-field" style={{ gridColumn: 'span 2' }}>
                  <label>해설</label>
                  <textarea
                    value={newProblem.explanation}
                    onChange={e => setNewProblem(s => ({ ...s, explanation: e.target.value }))}
                  />
                </div>
              </div>
              <div className="staff-actions">
                <button type="submit" className="btn btn-primary">문제 등록</button>
              </div>
            </form>

            <h3 className="staff-subtitle" style={{ marginTop: 28 }}>등록된 문제 ({problems.length})</h3>
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>지문</th>
                    <th style={{ width: 140 }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.length === 0 ? (
                    <tr><td colSpan={3} className="cell-muted">문제가 없습니다.</td></tr>
                  ) : (
                    problems.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td className="cell-ellipsis">{p.content}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" className="staff-btn-sm staff-btn-muted" onClick={() => openEdit(p)} disabled={editLoading}>
                              {editLoading ? '...' : '수정'}
                            </button>
                            <button type="button" className="staff-btn-sm staff-btn-danger" onClick={() => handleDeleteProblem(p.id)}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="staff-subtitle" style={{ marginTop: 28 }}>모의고사</h3>
            <form onSubmit={handleCreateMock} className="staff-inline-form">
              <input
                placeholder="모의고사 제목"
                value={mockTitle}
                onChange={e => setMockTitle(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <button type="submit" className="btn btn-primary">모의고사 등록</button>
            </form>

            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>제목</th>
                    <th style={{ width: 100 }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {mocks.length === 0 ? (
                    <tr><td colSpan={3} className="cell-muted">모의고사가 없습니다.</td></tr>
                  ) : (
                    mocks.map(m => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.title}</td>
                        <td>
                          <button type="button" className="staff-btn-sm staff-btn-danger" onClick={() => handleDeleteMock(m.id)}>삭제</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="staff-subtitle" style={{ marginTop: 20 }}>모의고사에 문제 추가</h3>
            <form onSubmit={handleAddQuestionToMock} className="staff-inline-form">
              <select
                value={addQMockId === '' ? '' : String(addQMockId)}
                onChange={e => {
                  setAddQMockId(e.target.value ? Number(e.target.value) : '');
                  setAddQProblemId('');
                }}
              >
                <option value="">모의고사 선택</option>
                {mocks.map(m => (
                  <option key={m.id} value={m.id}>{m.title} (#{m.id})</option>
                ))}
              </select>
              <select
                value={addQProblemId === '' ? '' : String(addQProblemId)}
                onChange={e => setAddQProblemId(e.target.value ? Number(e.target.value) : '')}
                disabled={addQMockId === ''}
              >
                <option value="">문제 선택</option>
                {problems.map(p => {
                  const registered = mockQuestions.some(q => q.problemId === p.id);
                  return (
                    <option key={p.id} value={p.id} disabled={registered}>
                      {registered ? '✓ ' : ''}#{p.id} — {p.content.slice(0, 40)}{p.content.length > 40 ? '…' : ''}{registered ? ' (등록됨)' : ''}
                    </option>
                  );
                })}
              </select>
              <button type="submit" className="btn btn-outline" disabled={addQMockId === '' || addQProblemId === ''}>문제 추가</button>
            </form>

            {addQMockId !== '' && (
              <div style={{ marginTop: 16 }}>
                <p className="staff-hint" style={{ marginBottom: 8 }}>
                  현재 모의고사에 등록된 문제 ({mockQuestionsLoading ? '…' : `${mockQuestions.length}개`})
                </p>
                {mockQuestionsLoading ? (
                  <div className="loading-center" style={{ padding: 16 }}><div className="spinner" /></div>
                ) : mockQuestions.length === 0 ? (
                  <p className="staff-hint">등록된 문제가 없습니다.</p>
                ) : (
                  <div className="staff-table-wrap">
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>순번</th>
                          <th style={{ width: 80 }}>문제 ID</th>
                          <th>지문</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockQuestions.map((q, idx) => (
                          <tr key={q.problemId}>
                            <td>{idx + 1}</td>
                            <td>#{q.problemId}</td>
                            <td className="cell-ellipsis">{q.content}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {editProblem && (
        <div className="staff-modal-backdrop" role="presentation" onClick={() => setEditProblem(null)}>
          <div className="staff-modal" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h3>문제 수정 (#{editProblem.id})</h3>
            <form onSubmit={handleUpdateProblem}>
              <div className="staff-field">
                <label>지문</label>
                <textarea
                  value={editProblem.content}
                  onChange={e => setEditProblem(s => s && { ...s, content: e.target.value })}
                  required
                />
              </div>
              <div className="staff-form-grid">
                {([1, 2, 3, 4] as const).map(n => (
                  <div key={n} className="staff-field">
                    <label>보기 {n}</label>
                    <input
                      value={editProblem[`option${n}` as 'option1']}
                      onChange={e => setEditProblem(s => s && { ...s, [`option${n}`]: e.target.value })}
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="staff-form-grid">
                <div className="staff-field">
                  <label>정답 번호</label>
                  <select
                    value={editProblem.correctAnswer ?? 1}
                    onChange={e => setEditProblem(s => s && { ...s, correctAnswer: Number(e.target.value) })}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div className="staff-field" style={{ gridColumn: 'span 2' }}>
                  <label>해설</label>
                  <textarea
                    value={editProblem.explanation ?? ''}
                    onChange={e => setEditProblem(s => s && { ...s, explanation: e.target.value })}
                  />
                </div>
              </div>
              <div className="staff-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditProblem(null)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
