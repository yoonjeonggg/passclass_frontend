import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentApi } from '../api';
import type { EnrollmentResponse } from '../types';
import { useToast } from '../components/Toast';
import { IconBook, IconArrowRight, IconPlay } from '../components/Icons';
import './MyLectures.css';

export default function MyLectures() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = () => {
    setLoading(true);
    enrollmentApi.getMyEnrollments()
      .then(res => setEnrollments(res.data))
      .catch(() => toast('수강 목록을 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEnrollments(); }, []);

  const handleCancel = async (lectureId: number, title: string) => {
    if (!confirm(`"${title}" 수강을 취소하시겠습니까?`)) return;
    try {
      await enrollmentApi.cancel(lectureId);
      toast('수강이 취소되었습니다.', 'info');
      fetchEnrollments();
    } catch (err: any) {
      toast(err.message || '수강 취소 실패', 'error');
    }
  };

  return (
    <div className="my-lectures-page">
      <div className="my-lectures-hero">
        <div className="container">
          <h1 className="my-hero-title">내 수강 목록</h1>
          <p className="my-hero-sub">수강 중인 강의를 확인하고 계속 학습하세요</p>
        </div>
      </div>

      <div className="container my-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : enrollments.length > 0 ? (
          <>
            <div className="my-count">{enrollments.length}개 강의 수강 중</div>
            <div className="enrollment-list">
              {enrollments.map((e, i) => (
                <div
                  key={e.enrollmentId}
                  className="enrollment-card fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="ec-thumb">
                    <span>{e.lectureTitle.slice(0, 2)}</span>
                  </div>
                  <div className="ec-info">
                    <h3 className="ec-title">{e.lectureTitle}</h3>
                    <div className="ec-date">
                      수강 시작 · {new Date(e.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="ec-status">
                      <span className="ec-status-dot" />
                      수강 중
                    </div>
                  </div>
                  <div className="ec-actions">
                    <Link to={`/lectures/${e.lectureId}`} className="btn btn-primary ec-btn">
                      <IconPlay size={13} /> 학습하기
                    </Link>
                    <button
                      className="ec-cancel"
                      onClick={() => handleCancel(e.lectureId, e.lectureTitle)}
                    >
                      수강 취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="my-empty">
            <div className="my-empty-icon"><IconBook size={32} /></div>
            <h2>수강 중인 강의가 없습니다</h2>
            <p>원하는 강의를 찾아 수강 신청해보세요</p>
            <Link to="/lectures" className="btn btn-primary" style={{ marginTop: 8 }}>
              강의 둘러보기 <IconArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
