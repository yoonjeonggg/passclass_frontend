import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { lectureApi } from '../api';
import type { LectureListDto } from '../types';
import LectureCard from '../components/LectureCard';
import { useToast } from '../components/Toast';
import { IconSearch, IconChevronLeft, IconChevronRight } from '../components/Icons';
import './Lectures.css';

const SORT_OPTIONS = [
  { value: 'LATEST',  label: '최신순' },
  { value: 'POPULAR', label: '인기순' },
  { value: 'OLDEST',  label: '오래된순' },
];

const CATEGORIES = ['전체', '정보기술', '경영/회계', '어학', '의료/보건', '건축/안전', '기계/전기', '기타'];

export default function Lectures() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [lectures, setLectures]   = useState<LectureListDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sort, setSort]           = useState(searchParams.get('sort') || 'LATEST');
  const [category, setCategory]   = useState(searchParams.get('category') || '');

  const fetchLectures = useCallback(async (p: number, s: string, c: string) => {
    setLoading(true);
    try {
      const res = await lectureApi.getList({ page: p, size: 12, sort: s, category: c || undefined });
      setLectures(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err: unknown) {
      setLectures([]);
      toast(err instanceof Error ? err.message : '강의 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchLectures(page, sort, category); }, [page, sort, category, fetchLectures]);

  const handleSort = (s: string) => { setSort(s); setPage(0); };
  const handleCategory = (c: string) => { setCategory(c === '전체' ? '' : c); setPage(0); };

  const pageGroup = Math.floor(page / 5);
  const pageStart = pageGroup * 5;
  const pageEnd   = Math.min(pageStart + 5, totalPages);

  return (
    <div className="lectures-page">
      <div className="lectures-hero">
        <div className="container">
          <h1 className="lectures-hero-title">강의 목록</h1>
          <p className="lectures-hero-sub">자격증 합격을 위한 최고의 강의를 만나보세요</p>
        </div>
      </div>

      <div className="container lectures-body">
        {/* Sidebar filters */}
        <aside className="lectures-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">카테고리</div>
            <div className="sidebar-cats">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`sidebar-cat ${(c === '전체' ? !category : category === c) ? 'active' : ''}`}
                  onClick={() => handleCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">정렬</div>
            <div className="sidebar-sort">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  className={`sidebar-sort-btn ${sort === o.value ? 'active' : ''}`}
                  onClick={() => handleSort(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="lectures-main">
          <div className="lectures-toolbar">
            <div className="lectures-count">
              {loading ? '검색 중...' : `총 ${totalElements.toLocaleString()}개 강의`}
            </div>
            <div className="lectures-sort-mobile">
              <select
                className="sort-select"
                value={sort}
                onChange={e => handleSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : lectures.length > 0 ? (
            <>
              <div className="lectures-grid">
                {lectures.map((l, i) => (
                  <div key={l.id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <LectureCard lecture={l} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn icon-btn"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <IconChevronLeft size={15} />
                  </button>

                  {pageStart > 0 && (
                    <>
                      <button className="page-btn" onClick={() => setPage(0)}>1</button>
                      {pageStart > 1 && <span className="page-ellipsis">…</span>}
                    </>
                  )}

                  {Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i).map(i => (
                    <button
                      key={i}
                      className={`page-btn ${page === i ? 'active' : ''}`}
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  {pageEnd < totalPages && (
                    <>
                      {pageEnd < totalPages - 1 && <span className="page-ellipsis">…</span>}
                      <button className="page-btn" onClick={() => setPage(totalPages - 1)}>{totalPages}</button>
                    </>
                  )}

                  <button
                    className="page-btn icon-btn"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <IconChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrap"><IconSearch size={28} /></div>
              <p className="empty-title">강의가 없습니다</p>
              <p className="empty-sub">다른 카테고리를 선택해보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
