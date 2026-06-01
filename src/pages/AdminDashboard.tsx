import React, { useEffect, useState, useCallback } from 'react';
import { certificateApi, lectureApi, fileApi } from '../api';
import type { CertificateResponse, LectureListDto, LectureUpdateRequest } from '../types';
import { useToast } from '../components/Toast';
import StaffProblemsMockSection from './StaffProblemsMockSection';
import './StaffDashboard.css';

type LectureSortKey = 'enrollmentCount' | 'likeCount' | 'rating' | 'latest';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [list, setList] = useState<CertificateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deletingCertId, setDeletingCertId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<CertificateResponse | null>(null);

  // Lecture management state
  const [lectures, setLectures] = useState<LectureListDto[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [lectureSort, setLectureSort] = useState<LectureSortKey>('latest');
  const [editLecture, setEditLecture] = useState<(LectureListDto & { description?: string }) | null>(null);
  const [lectureSaving, setLectureSaving] = useState(false);
  const [deletingLectureId, setDeletingLectureId] = useState<number | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [certs, setCerts] = useState<CertificateResponse[]>([]);

  const load = () => {
    certificateApi.getAll()
      .then(r => setList(r.data))
      .catch(() => toast('자격증 목록을 불러오지 못했습니다.', 'error'));
  };

  const loadLectures = useCallback((sort: LectureSortKey) => {
    setLecturesLoading(true);
    const sortParam = sort === 'enrollmentCount' ? 'ENROLLMENT'
      : sort === 'likeCount' ? 'POPULAR'
      : sort === 'rating' ? 'POPULAR'
      : 'LATEST';
    lectureApi.getList({ page: 0, size: 100, sort: sortParam })
      .then(r => {
        let sorted = [...r.data.content];
        if (sort === 'enrollmentCount') sorted.sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0));
        else if (sort === 'likeCount') sorted.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
        else if (sort === 'rating') sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        setLectures(sorted);
      })
      .catch(() => toast('강의 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setLecturesLoading(false));
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    certificateApi.getAll()
      .then(r => { setList(r.data); setCerts(r.data); })
      .catch(() => toast('자격증 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadLectures(lectureSort);
  }, [lectureSort, loadLectures]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('자격증 이름을 입력하세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await certificateApi.create({ name: form.name.trim(), description: form.description.trim() });
      toast('자격증이 등록되었습니다.', 'success');
      setForm({ name: '', description: '' });
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '등록 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setSaving(true);
    try {
      await certificateApi.update(editRow.id, {
        name: editRow.name.trim(),
        description: editRow.description?.trim() ?? '',
      });
      toast('수정되었습니다.', 'success');
      setEditRow(null);
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '수정 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('이 자격증을 삭제할까요?')) return;
    setDeletingCertId(id);
    try {
      await certificateApi.delete(id);
      toast('삭제되었습니다.', 'success');
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    } finally {
      setDeletingCertId(null);
    }
  };

  const handleLectureEdit = (lecture: LectureListDto) => {
    setEditLecture({
      ...lecture,
      description: '',
    });
  };

  const handleLectureUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLecture) return;
    setLectureSaving(true);
    try {
      const payload: LectureUpdateRequest = {
        certificateId: editLecture.certificate.id,
        title: editLecture.title.trim(),
        description: editLecture.description?.trim(),
        category: editLecture.category?.trim(),
        thumbnailUrl: editLecture.thumbnailUrl?.trim(),
      };
      await lectureApi.update(editLecture.id, payload);
      toast('강의가 수정되었습니다.', 'success');
      setEditLecture(null);
      loadLectures(lectureSort);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '수정 실패', 'error');
    } finally {
      setLectureSaving(false);
    }
  };

  const handleLectureDelete = async (id: number) => {
    if (!window.confirm('이 강의를 삭제할까요? 관련된 챕터, 수강 정보, 리뷰도 함께 삭제됩니다.')) return;
    setDeletingLectureId(id);
    try {
      await lectureApi.delete(id);
      toast('강의가 삭제되었습니다.', 'success');
      loadLectures(lectureSort);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    } finally {
      setDeletingLectureId(null);
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-hero">
        <div className="container">
          <h1 className="staff-hero-title">관리자</h1>
          <p className="staff-hero-sub">자격증을 관리하고, 문제와 모의고사를 구성합니다.</p>
        </div>
      </div>

      <div className="container staff-body">
        <section className="staff-panel">
          <h2 className="staff-panel-title">자격증 등록 · 수정 · 삭제</h2>
          <p className="staff-panel-desc">사이트에 노출될 자격증 정보를 관리합니다.</p>

          <form onSubmit={handleCreate}>
            <div className="staff-form-grid">
              <div className="staff-field">
                <label>이름</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="예: 정보처리기사"
                  required
                />
              </div>
              <div className="staff-field">
                <label>설명</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="한 줄 설명"
                />
              </div>
            </div>
            <div className="staff-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '처리 중…' : '자격증 등록'}
              </button>
            </div>
          </form>

          <h3 className="staff-subtitle" style={{ marginTop: 28 }}>등록된 자격증</h3>
          {loading ? (
            <div className="loading-center" style={{ padding: 40 }}><div className="spinner" /></div>
          ) : (
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>설명</th>
                    <th style={{ width: 160 }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={4} className="cell-muted">등록된 자격증이 없습니다.</td></tr>
                  ) : (
                    list.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.name}</td>
                        <td className="cell-muted">{c.description || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" className="staff-btn-sm staff-btn-muted" onClick={() => setEditRow(c)} disabled={deletingCertId === c.id}>수정</button>
                            <button type="button" className="staff-btn-sm staff-btn-danger" onClick={() => handleDelete(c.id)} disabled={deletingCertId === c.id}>
                              {deletingCertId === c.id ? '삭제 중…' : '삭제'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 강의 관리 섹션 */}
        <section className="staff-panel">
          <h2 className="staff-panel-title">강의 관리</h2>
          <p className="staff-panel-desc">등록된 강의를 수강자·좋아요·평점 순으로 정렬하고 수정·삭제합니다.</p>

          <div className="staff-field" style={{ maxWidth: 260, marginBottom: 16 }}>
            <label>정렬 기준</label>
            <select value={lectureSort} onChange={e => setLectureSort(e.target.value as LectureSortKey)}>
              <option value="latest">최신 등록 순</option>
              <option value="enrollmentCount">수강자 많은 순</option>
              <option value="likeCount">좋아요 많은 순</option>
              <option value="rating">평점 높은 순</option>
            </select>
          </div>

          {lecturesLoading ? (
            <div className="loading-center" style={{ padding: 40 }}><div className="spinner" /></div>
          ) : (
            <div className="staff-table-wrap">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>강의명</th>
                    <th>강사</th>
                    <th>자격증</th>
                    <th>수강자</th>
                    <th>좋아요</th>
                    <th>평점</th>
                    <th style={{ width: 160 }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {lectures.length === 0 ? (
                    <tr><td colSpan={8} className="cell-muted">등록된 강의가 없습니다.</td></tr>
                  ) : (
                    lectures.map(l => (
                      <tr key={l.id}>
                        <td>{l.id}</td>
                        <td>{l.title}</td>
                        <td className="cell-muted">{l.instructorNickname ?? '—'}</td>
                        <td className="cell-muted">{l.certificate?.name ?? '—'}</td>
                        <td><strong>{(l.enrollmentCount ?? 0).toLocaleString()}</strong></td>
                        <td><strong>{(l.likeCount ?? 0).toLocaleString()}</strong></td>
                        <td><strong>{(l.rating ?? 0).toFixed(1)}</strong></td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" className="staff-btn-sm staff-btn-muted" onClick={() => handleLectureEdit(l)} disabled={deletingLectureId === l.id}>수정</button>
                            <button type="button" className="staff-btn-sm staff-btn-danger" onClick={() => handleLectureDelete(l.id)} disabled={deletingLectureId === l.id}>
                              {deletingLectureId === l.id ? '삭제 중…' : '삭제'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <StaffProblemsMockSection />
      </div>

      {editRow && (
        <div className="staff-modal-backdrop" role="presentation" onClick={() => setEditRow(null)}>
          <div className="staff-modal" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h3>자격증 수정</h3>
            <form onSubmit={handleUpdate}>
              <div className="staff-field">
                <label>이름</label>
                <input
                  value={editRow.name}
                  onChange={e => setEditRow(r => r && { ...r, name: e.target.value })}
                  required
                />
              </div>
              <div className="staff-field">
                <label>설명</label>
                <textarea
                  value={editRow.description || ''}
                  onChange={e => setEditRow(r => r && { ...r, description: e.target.value })}
                />
              </div>
              <div className="staff-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditRow(null)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editLecture && (
        <div className="staff-modal-backdrop" role="presentation" onClick={() => setEditLecture(null)}>
          <div className="staff-modal" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h3>강의 수정</h3>
            <form onSubmit={handleLectureUpdate}>
              <div className="staff-field">
                <label>자격증</label>
                <select
                  value={editLecture.certificate.id}
                  onChange={e => setEditLecture(l => l && {
                    ...l,
                    certificate: { ...l.certificate, id: Number(e.target.value) },
                  })}
                  required
                >
                  {certs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="staff-field">
                <label>강의 제목</label>
                <input
                  value={editLecture.title}
                  onChange={e => setEditLecture(l => l && { ...l, title: e.target.value })}
                  required
                />
              </div>
              <div className="staff-field">
                <label>설명</label>
                <textarea
                  value={editLecture.description || ''}
                  onChange={e => setEditLecture(l => l && { ...l, description: e.target.value })}
                />
              </div>
              <div className="staff-field">
                <label>카테고리</label>
                <input
                  value={editLecture.category || ''}
                  onChange={e => setEditLecture(l => l && { ...l, category: e.target.value })}
                />
              </div>
              <div className="staff-field">
                <label>썸네일 이미지 교체</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={thumbnailUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setThumbnailUploading(true);
                    try {
                      const res = await fileApi.upload(file);
                      setEditLecture(l => l && { ...l, thumbnailUrl: res.data.fileUrl });
                      toast('썸네일이 업로드되었습니다.', 'success');
                    } catch {
                      toast('썸네일 업로드 실패', 'error');
                    } finally {
                      setThumbnailUploading(false);
                    }
                  }}
                />
                {thumbnailUploading && <span className="staff-hint">업로드 중…</span>}
                {editLecture.thumbnailUrl && !thumbnailUploading && (
                  <img src={editLecture.thumbnailUrl} alt="썸네일 미리보기" style={{ marginTop: 8, maxHeight: 80, borderRadius: 6 }} />
                )}
              </div>
              <div className="staff-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditLecture(null)}>취소</button>
                <button type="submit" className="btn btn-primary" disabled={lectureSaving}>
                  {lectureSaving ? '처리 중…' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
