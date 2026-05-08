import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { lectureApi, certificateApi } from "../api";
import type { LectureListDto, CertificateResponse } from "../types";
import LectureCard from "../components/LectureCard";
import { IconArrowRight, IconMonitor, IconTrendingUp, IconShield, IconCheck, IconAward } from "../components/Icons";
import "./Home.css";

const FEATURES = [
  {
    icon: <IconMonitor size={22} />,
    title: "언제 어디서나 강의 수강",
    desc: "PC, 태블릿, 모바일 어디서든 끊김 없이 강의를 이어서 볼 수 있습니다.",
    color: "#3b82f6",
  },
  {
    icon: <IconTrendingUp size={22} />,
    title: "자동 진도 관리",
    desc: "마지막으로 시청한 위치를 기억해 다음 접속 시 이어서 학습합니다.",
    color: "#10b981",
  },
  {
    icon: <IconAward size={22} />,
    title: "자격증별 맞춤 커리큘럼",
    desc: "자격증 종류에 맞게 구성된 강의로 체계적으로 학습 목표를 달성하세요.",
    color: "#f59e0b",
  },
  {
    icon: <IconShield size={22} />,
    title: "검증된 강사진",
    desc: "현직 전문가와 합격 경험자가 직접 강의를 제작하고 최신 내용으로 유지합니다.",
    color: "#FF5C00",
  },
];

export default function Home() {
  const [lectures, setLectures]         = useState<LectureListDto[]>([]);
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      lectureApi.getList({ page: 0, size: 8, sort: "POPULAR" }),
      certificateApi.getAll(),
    ])
      .then(([lRes, cRes]) => {
        setLectures(lRes.data.content);
        setCertificates(cRes.data.slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-layout">
          <div className="hero-left">
            <div className="hero-eyebrow">자격증 합격 플랫폼</div>
            <h1 className="hero-title">
              합격을 위한<br />
              <span>체계적인 학습</span>,<br />
              PassClass
            </h1>
            <p className="hero-desc">
              자격증별 맞춤 강의부터 진도 관리까지.<br />
              목표 합격을 위한 모든 것이 한 곳에 있습니다.
            </p>
            <div className="hero-actions">
              <Link to="/lectures" className="btn btn-primary hero-cta">
                강의 둘러보기 <IconArrowRight size={16} />
              </Link>
              <Link to="/certificates" className="btn btn-outline hero-cta-ghost">
                자격증 목록
              </Link>
            </div>
            <div className="hero-checks">
              <span><IconCheck size={14} /> 무료 가입</span>
              <span><IconCheck size={14} /> 진도 자동 저장</span>
              <span><IconCheck size={14} /> 모바일 지원</span>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-mockup">
              <div className="hm-titlebar">
                <div className="hm-dots"><span /><span /><span /></div>
                <div className="hm-url">passclass.kr/lectures/42</div>
              </div>
              <div className="hm-content">
                <div className="hm-course-title">정보처리기사 필기 완성</div>
                <div className="hm-progress-row">
                  <span className="hm-progress-label">학습 진행률</span>
                  <span className="hm-progress-pct">68%</span>
                </div>
                <div className="hm-bar"><div className="hm-bar-fill" style={{ width: "68%" }} /></div>
                <div className="hm-chapters">
                  <div className="hm-ch done"><IconCheck size={12} /><span>소프트웨어 설계</span></div>
                  <div className="hm-ch done"><IconCheck size={12} /><span>소프트웨어 개발</span></div>
                  <div className="hm-ch active"><span className="hm-ch-dot" /><span>데이터베이스 구축</span><span className="hm-ch-now">수강 중</span></div>
                  <div className="hm-ch"><span className="hm-ch-dot locked" /><span>프로그래밍 언어</span></div>
                  <div className="hm-ch"><span className="hm-ch-dot locked" /><span>정보시스템 구축</span></div>
                </div>
              </div>
            </div>

            <div className="hero-floating-badge hfb-1">
              <div className="hfb-icon"><IconAward size={16} /></div>
              <div>
                <div className="hfb-title">합격 인증</div>
                <div className="hfb-sub">김민준님 정보처리기사</div>
              </div>
            </div>
            <div className="hero-floating-badge hfb-2">
              <div className="hfb-icon green"><IconTrendingUp size={16} /></div>
              <div>
                <div className="hfb-title">이번 주 +1,240명</div>
                <div className="hfb-sub">수강 신청</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="stats-strip">
        <div className="container stats-inner">
          <div className="stat-block">
            <strong>500+</strong>
            <span>강의</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <strong>10만+</strong>
            <span>누적 수강생</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <strong>98%</strong>
            <span>수강생 합격률</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-block">
            <strong>200+</strong>
            <span>자격증 종류</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">왜 PassClass인가</div>
            <h2 className="section-title-lg">합격을 앞당기는 학습 경험</h2>
            <p className="section-subtitle">단순히 강의를 보는 것에서 그치지 않습니다. 합격까지의 과정을 함께합니다.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section section-tinted">
        <div className="container">
          <div className="section-header-center">
            <div className="section-eyebrow">학습 단계</div>
            <h2 className="section-title-lg">3단계로 합격까지</h2>
          </div>
          <div className="steps-row">
            <div className="step">
              <div className="step-num">01</div>
              <h3 className="step-title">자격증 선택</h3>
              <p className="step-desc">목표 자격증을 검색하고 관련 강의 목록을 확인하세요.</p>
            </div>
            <div className="step-arrow"><IconArrowRight size={20} /></div>
            <div className="step">
              <div className="step-num">02</div>
              <h3 className="step-title">체계적 수강</h3>
              <p className="step-desc">커리큘럼 순서에 따라 강의를 수강하고 진도를 관리하세요.</p>
            </div>
            <div className="step-arrow"><IconArrowRight size={20} /></div>
            <div className="step">
              <div className="step-num">03</div>
              <h3 className="step-title">합격 달성</h3>
              <p className="step-desc">학습 완료 후 시험에 응시하고 자격증 합격을 인증하세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Certificates ── */}
      {certificates.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">자격증</div>
                <h2 className="section-title">인기 자격증</h2>
              </div>
              <Link to="/certificates" className="section-more">
                전체 보기 <IconArrowRight size={14} />
              </Link>
            </div>
            <div className="cert-grid">
              {certificates.map((cert, i) => (
                <Link
                  key={cert.id}
                  to={`/lectures?certificate=${cert.id}`}
                  className="cert-chip"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className="cert-chip-num">{String(i + 1).padStart(2, "0")}</span>
                  <span>{cert.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Popular Lectures ── */}
      <section className="section section-tinted">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-eyebrow">강의</div>
              <h2 className="section-title">인기 강의</h2>
            </div>
            <Link to="/lectures" className="section-more">
              전체 보기 <IconArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : lectures.length > 0 ? (
            <div className="lectures-grid">
              {lectures.map((l, i) => (
                <div key={l.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <LectureCard lecture={l} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>아직 등록된 강의가 없습니다</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-left">
              <h2>지금 바로 시작하세요</h2>
              <p>무료로 가입하고 다양한 자격증 강의를 경험해보세요</p>
            </div>
            <div className="cta-right">
              <Link to="/signup" className="btn btn-cta">
                무료로 시작하기 <IconArrowRight size={16} />
              </Link>
              <Link to="/lectures" className="btn btn-cta-ghost">강의 둘러보기</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
