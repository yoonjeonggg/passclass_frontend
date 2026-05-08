import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi } from '../api';
import type { CertificateResponse } from '../types';
import { useToast } from '../components/Toast';
import { IconSearch, IconAward, IconArrowRight } from '../components/Icons';
import './Certificates.css';

export default function Certificates() {
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [keyword, setKeyword]   = useState('');
  const [searching, setSearching] = useState(false);
  const [isSearched, setIsSearched] = useState(false);

  useEffect(() => {
    certificateApi.getAll()
      .then(res => setCertificates(res.data))
      .catch(() => toast('자격증 목록을 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSearching(true);
    setIsSearched(true);
    try {
      const res = await certificateApi.search(keyword.trim());
      setCertificates(res.data);
    } catch {
      toast('검색 실패', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleReset = async () => {
    setKeyword('');
    setIsSearched(false);
    setLoading(true);
    try {
      const res = await certificateApi.getAll();
      setCertificates(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="certs-page">
      <div className="certs-hero">
        <div className="container">
          <h1 className="certs-hero-title">자격증 목록</h1>
          <p className="certs-hero-sub">목표 자격증을 찾고 맞춤 강의를 수강하세요</p>

          <form className="cert-search-form" onSubmit={handleSearch}>
            <div className="cert-search-wrap">
              <IconSearch size={16} className="cert-search-icon" />
              <input
                type="text"
                className="cert-search-input"
                placeholder="자격증명 검색 (예: 정보처리기사)"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
              {keyword && (
                <button type="button" className="cert-search-clear" onClick={handleReset}>
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary cert-search-btn" disabled={searching}>
              {searching ? '검색 중...' : '검색'}
            </button>
          </form>
        </div>
      </div>

      <div className="container certs-body">
        {isSearched && (
          <div className="certs-result-bar">
            <span>"{keyword}" 검색 결과 — {certificates.length}건</span>
            <button className="certs-reset-link" onClick={handleReset}>전체 보기</button>
          </div>
        )}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : certificates.length > 0 ? (
          <div className="cert-cards fade-up">
            {certificates.map((cert, i) => (
              <Link
                key={cert.id}
                to={`/lectures?certificate=${cert.id}`}
                className="cert-card"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="cert-card-icon">
                  <IconAward size={20} />
                </div>
                <div className="cert-card-body">
                  <h3 className="cert-card-name">{cert.name}</h3>
                  {cert.description && (
                    <p className="cert-card-desc">{cert.description}</p>
                  )}
                  <div className="cert-card-footer">
                    <span className="cert-card-date">
                      {new Date(cert.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                    </span>
                    <span className="cert-card-link">
                      강의 보기 <IconArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="cert-empty">
            <div className="cert-empty-icon"><IconSearch size={28} /></div>
            <p className="cert-empty-title">검색 결과가 없습니다</p>
            <p className="cert-empty-sub">다른 키워드로 검색해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
