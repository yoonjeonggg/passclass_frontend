import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { certificateApi, lectureApi, chapterApi, fileApi } from '../api';
import type { CertificateResponse, LectureListDto, LectureChapterResponse } from '../types';
import { useToast } from '../components/Toast';
import StaffProblemsMockSection from './StaffProblemsMockSection';
import './StaffDashboard.css';
import './StaffProblemsMockSection.css';

type StatSortKey = 'enrollmentCount' | 'likeCount' | 'rating';


export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certs, setCerts] = useState<CertificateResponse[]>([]);
  const [myLectures, setMyLectures] = useState<LectureListDto[]>([]);
  const [lectureForm, setLectureForm] = useState({
    certificateId: '' as number | '',
    title: '',
    description: '',
    category: '',
    thumbnailUrl: '',
  });
  const [lectureSaving, setLectureSaving] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [selectedLectureId, setSelectedLectureId] = useState<number | ''>('');
  const [chapters, setChapters] = useState<LectureChapterResponse[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    videoUrl: '',
    chapterOrder: 1,
  });
  const [videoUploading, setVideoUploading] = useState(false);
  const [editVideoUploading, setEditVideoUploading] = useState(false);
  const [editChapter, setEditChapter] = useState<LectureChapterResponse | null>(null);
  const [statSort, setStatSort] = useState<StatSortKey>('enrollmentCount');

  const refreshMyLectures = useCallback(() => {
    if (!user) return;
    lectureApi.getInstructorProfile(user.id)
      .then(res => setMyLectures(res.data.lectures))
      .catch(() => setMyLectures([]));
  }, [user]);

  useEffect(() => {
    certificateApi.getAll()
      .then(r => setCerts(r.data))
      .catch(() => toast('자격증 목록을 불러오지 못했습니다.', 'error'));
  }, [toast]);

  useEffect(() => {
    refreshMyLectures();
  }, [refreshMyLectures]);

  useEffect(() => {
    if (selectedLectureId === '') {
      setChapters([]);
      return;
    }
    setChaptersLoading(true);
    chapterApi.getChapters(Number(selectedLectureId))
      .then(r => {
        setChapters(r.data);
        const next = r.data.length ? Math.max(...r.data.map(c => c.chapterOrder)) + 1 : 1;
        setChapterForm(f => ({ ...f, chapterOrder: next }));
      })
      .catch(() => {
        setChapters([]);
        toast('챕터 목록을 불러오지 못했습니다.', 'error');
      })
      .finally(() => setChaptersLoading(false));
  }, [selectedLectureId, toast]);

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lectureForm.certificateId === '' || !lectureForm.title.trim()) {
      toast('자격증과 강의 제목은 필수입니다.', 'error');
      return;
    }
    setLectureSaving(true);
    try {
      await lectureApi.create({
        certificateId: Number(lectureForm.certificateId),
        title: lectureForm.title.trim(),
        description: lectureForm.description.trim() || undefined,
        category: lectureForm.category.trim() || undefined,
        thumbnailUrl: lectureForm.thumbnailUrl.trim() || undefined,
      });
      toast('강의가 생성되었습니다.', 'success');
      setLectureForm({
        certificateId: lectureForm.certificateId,
        title: '',
        description: '',
        category: '',
        thumbnailUrl: '',
      });
      refreshMyLectures();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '강의 생성 실패', 'error');
    } finally {
      setLectureSaving(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLectureId === '') {
      toast('강의를 선택하세요.', 'error');
      return;
    }
    try {
      await chapterApi.create({
        lectureId: Number(selectedLectureId),
        title: chapterForm.title.trim(),
        videoUrl: chapterForm.videoUrl.trim(),
        chapterOrder: chapterForm.chapterOrder,
      });
      toast('챕터가 등록되었습니다.', 'success');
      const r = await chapterApi.getChapters(Number(selectedLectureId));
      setChapters(r.data);
      const next = r.data.length ? Math.max(...r.data.map(c => c.chapterOrder)) + 1 : 1;
      setChapterForm({ title: '', videoUrl: '', chapterOrder: next });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '챕터 등록 실패', 'error');
    }
  };

  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editChapter || selectedLectureId === '') return;
    try {
      await chapterApi.update(editChapter.id, {
        lectureId: Number(selectedLectureId),
        title: editChapter.title.trim(),
        videoUrl: editChapter.videoUrl.trim(),
        chapterOrder: editChapter.chapterOrder,
      });
      toast('챕터가 수정되었습니다.', 'success');
      setEditChapter(null);
      const r = await chapterApi.getChapters(Number(selectedLectureId));
      setChapters(r.data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '챕터 수정 실패', 'error');
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (!window.confirm('이 챕터를 삭제할까요?')) return;
    try {
      await chapterApi.delete(id);
      toast('삭제되었습니다.', 'success');
      if (selectedLectureId !== '') {
        const r = await chapterApi.getChapters(Number(selectedLectureId));
        setChapters(r.data);
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    }
  };

  return (
    <div className="staff-page">
      <div className="staff-hero">
        <div className="container">
          <h1 className="staff-hero-title">강사 스튜디오</h1>
          <p className="staff-hero-sub">강의와 챕터를 관리하고, 문제와 모의고사를 구성합니다.</p>
        </div>
      </div>

      <div className="container staff-body">
        <section className="staff-panel">
          <h2 className="staff-panel-title">강의 생성</h2>
          <p className="staff-panel-desc">자격증과 제목은 필수입니다.</p>
          <form onSubmit={handleCreateLecture}>
            <div className="staff-field">
              <label>자격증</label>
              <select
                value={lectureForm.certificateId === '' ? '' : String(lectureForm.certificateId)}
                onChange={e => setLectureForm(f => ({
                  ...f,
                  certificateId: e.target.value ? Number(e.target.value) : '',
                }))}
                required
              >
                <option value="">선택</option>
                {certs.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="staff-field">
              <label>강의 제목</label>
              <input
                value={lectureForm.title}
                onChange={e => setLectureForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="staff-field">
              <label>설명</label>
              <textarea
                value={lectureForm.description}
                onChange={e => setLectureForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="staff-form-grid">
              <div className="staff-field">
                <label>카테고리 (예: 필기)</label>
                <input
                  value={lectureForm.category}
                  onChange={e => setLectureForm(f => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="staff-field">
                <label>썸네일 이미지</label>
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
                      setLectureForm(f => ({ ...f, thumbnailUrl: res.data.fileUrl }));
                      toast('썸네일이 업로드되었습니다.', 'success');
                    } catch {
                      toast('썸네일 업로드 실패', 'error');
                    } finally {
                      setThumbnailUploading(false);
                    }
                  }}
                />
                {thumbnailUploading && <span className="staff-hint">업로드 중…</span>}
                {lectureForm.thumbnailUrl && !thumbnailUploading && (
                  <img src={lectureForm.thumbnailUrl} alt="썸네일 미리보기" style={{ marginTop: 8, maxHeight: 80, borderRadius: 6 }} />
                )}
              </div>
            </div>
            <div className="staff-actions">
              <button type="submit" className="btn btn-primary" disabled={lectureSaving}>
                {lectureSaving ? '처리 중…' : '강의 생성'}
              </button>
            </div>
          </form>
        </section>

        <section className="staff-panel">
          <h2 className="staff-panel-title">강의 챕터 관리</h2>
          <p className="staff-panel-desc">내 강의를 선택한 뒤 챕터를 등록·수정·삭제합니다.</p>

          <div className="staff-field">
            <label>내 강의</label>
            <select
              value={selectedLectureId === '' ? '' : String(selectedLectureId)}
              onChange={e => setSelectedLectureId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">선택</option>
              {myLectures.map(l => (
                <option key={l.id} value={l.id}>{l.title} (#{l.id})</option>
              ))}
            </select>
          </div>
          {myLectures.length === 0 && (
            <p className="staff-hint">아직 등록된 강의가 없습니다. 위에서 강의를 먼저 생성하세요.</p>
          )}

          {selectedLectureId !== '' && (
            <>
              <h3 className="staff-subtitle" style={{ marginTop: 20 }}>새 챕터 등록</h3>
              <form onSubmit={handleCreateChapter}>
                <div className="staff-field">
                  <label>챕터 제목</label>
                  <input
                    value={chapterForm.title}
                    onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="staff-field">
                  <label>강의 영상</label>
                  <input
                    type="file"
                    accept="video/*"
                    disabled={videoUploading}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setVideoUploading(true);
                      try {
                        const res = await fileApi.upload(file);
                        setChapterForm(f => ({ ...f, videoUrl: res.data.fileUrl }));
                        toast('영상이 업로드되었습니다.', 'success');
                      } catch {
                        toast('영상 업로드 실패', 'error');
                      } finally {
                        setVideoUploading(false);
                      }
                    }}
                  />
                  {videoUploading && <span className="staff-hint">업로드 중…</span>}
                  {chapterForm.videoUrl && !videoUploading && (
                    <span className="staff-hint" style={{ color: 'green' }}>영상 업로드 완료</span>
                  )}
                </div>
                <div className="staff-field" style={{ maxWidth: 200 }}>
                  <label>순서</label>
                  <input
                    type="number"
                    min={1}
                    value={chapterForm.chapterOrder}
                    onChange={e => setChapterForm(f => ({ ...f, chapterOrder: Number(e.target.value) || 1 }))}
                    required
                  />
                </div>
                <div className="staff-actions">
                  <button type="submit" className="btn btn-primary" disabled={videoUploading || !chapterForm.videoUrl}>챕터 등록</button>
                  <Link to={`/lectures/${selectedLectureId}`} className="btn btn-outline">강의 페이지 보기</Link>
                </div>
              </form>

              <h3 className="staff-subtitle" style={{ marginTop: 24 }}>챕터 목록</h3>
              {chaptersLoading ? (
                <div className="loading-center" style={{ padding: 24 }}><div className="spinner" /></div>
              ) : (
                <div className="staff-table-wrap">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>순서</th>
                        <th>제목</th>
                        <th>영상</th>
                        <th style={{ width: 160 }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.length === 0 ? (
                        <tr><td colSpan={4} className="cell-muted">챕터가 없습니다.</td></tr>
                      ) : (
                        [...chapters].sort((a, b) => a.chapterOrder - b.chapterOrder).map(ch => (
                          <tr key={ch.id}>
                            <td>{ch.chapterOrder}</td>
                            <td>{ch.title}</td>
                            <td className="cell-ellipsis"><a href={ch.videoUrl} target="_blank" rel="noreferrer">{ch.videoUrl}</a></td>
                            <td>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button type="button" className="staff-btn-sm staff-btn-muted" onClick={() => setEditChapter(ch)}>수정</button>
                                <button type="button" className="staff-btn-sm staff-btn-danger" onClick={() => handleDeleteChapter(ch.id)}>삭제</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        {/* 강의 통계 섹션 */}
        <section className="staff-panel">
          <h2 className="staff-panel-title">내 강의 통계</h2>
          <p className="staff-panel-desc">등록한 강의의 수강자 수, 좋아요, 평점을 확인합니다.</p>

          {myLectures.length === 0 ? (
            <p className="staff-hint">아직 등록된 강의가 없습니다.</p>
          ) : (
            <>
              <div className="staff-field" style={{ maxWidth: 260, marginBottom: 16 }}>
                <label>정렬 기준</label>
                <select value={statSort} onChange={e => setStatSort(e.target.value as StatSortKey)}>
                  <option value="enrollmentCount">수강자 많은 순</option>
                  <option value="likeCount">좋아요 많은 순</option>
                  <option value="rating">평점 높은 순</option>
                </select>
              </div>
              <div className="staff-table-wrap">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>강의명</th>
                      <th>자격증</th>
                      <th>수강자</th>
                      <th>좋아요</th>
                      <th>평점</th>
                      <th>보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myLectures]
                      .sort((a, b) => {
                        if (statSort === 'enrollmentCount') return (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0);
                        if (statSort === 'likeCount') return (b.likeCount ?? 0) - (a.likeCount ?? 0);
                        return (b.rating ?? 0) - (a.rating ?? 0);
                      })
                      .map(l => (
                        <tr key={l.id}>
                          <td>{l.title}</td>
                          <td className="cell-muted">{l.certificate?.name ?? '—'}</td>
                          <td><strong>{(l.enrollmentCount ?? 0).toLocaleString()}</strong>명</td>
                          <td><strong>{(l.likeCount ?? 0).toLocaleString()}</strong></td>
                          <td><strong>{(l.rating ?? 0).toFixed(1)}</strong></td>
                          <td>
                            <Link to={`/lectures/${l.id}`} className="staff-btn-sm staff-btn-muted">
                              페이지
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <StaffProblemsMockSection />
      </div>

      {editChapter && (
        <div className="staff-modal-backdrop" role="presentation" onClick={() => setEditChapter(null)}>
          <div className="staff-modal" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h3>챕터 수정</h3>
            <form onSubmit={handleUpdateChapter}>
              <div className="staff-field">
                <label>제목</label>
                <input
                  value={editChapter.title}
                  onChange={e => setEditChapter(c => c && { ...c, title: e.target.value })}
                  required
                />
              </div>
              <div className="staff-field">
                <label>강의 영상 교체</label>
                <input
                  type="file"
                  accept="video/*"
                  disabled={editVideoUploading}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setEditVideoUploading(true);
                    try {
                      const res = await fileApi.upload(file);
                      setEditChapter(c => c && { ...c, videoUrl: res.data.fileUrl });
                      toast('영상이 업로드되었습니다.', 'success');
                    } catch {
                      toast('영상 업로드 실패', 'error');
                    } finally {
                      setEditVideoUploading(false);
                    }
                  }}
                />
                {editVideoUploading && <span className="staff-hint">업로드 중…</span>}
                {editChapter.videoUrl && !editVideoUploading && (
                  <span className="staff-hint" style={{ marginTop: 4, display: 'block' }}>
                    현재: <a href={editChapter.videoUrl} target="_blank" rel="noreferrer">영상 보기</a>
                  </span>
                )}
              </div>
              <div className="staff-field" style={{ maxWidth: 200 }}>
                <label>순서</label>
                <input
                  type="number"
                  min={1}
                  value={editChapter.chapterOrder}
                  onChange={e => setEditChapter(c => c && { ...c, chapterOrder: Number(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="staff-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditChapter(null)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
