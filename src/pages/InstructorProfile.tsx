import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { lectureApi } from "../api";
import type { InstructorProfileResponse } from "../types";
import { IconUsers, IconVideo, IconStar, IconAward } from "../components/Icons";
import "./InstructorProfile.css";

export default function InstructorProfile() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const [profile, setProfile] = useState<InstructorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;
    lectureApi
      .getInstructorProfile(Number(instructorId))
      .then((res) => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [instructorId]);

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "120px" }}>
        <div className="spinner" />
      </div>
    );

  if (!profile)
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state-icon"><IconAward size={48} /></div>
        <p>강사를 찾을 수 없습니다</p>
      </div>
    );

  return (
    <div className="instructor-page">
      {/* Hero */}
      <div className="instructor-hero">
        <div className="container instructor-hero-inner">
          <div className="instructor-avatar-lg">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.nickname} />
            ) : (
              <span>{profile.nickname[0]}</span>
            )}
          </div>
          <div className="instructor-hero-info">
            <div className="instructor-role-label">강사</div>
            <h1 className="instructor-name">{profile.nickname}</h1>
            <div className="instructor-stats">
              <div className="instructor-stat">
                <IconVideo size={16} />
                <span><strong>{profile.lectureCount}</strong>개 강의</span>
              </div>
              <div className="instructor-stat-sep" />
              <div className="instructor-stat">
                <IconUsers size={16} />
                <span><strong>{profile.totalStudents.toLocaleString()}</strong>명 수강생</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lectures */}
      <div className="container instructor-body">
        <h2 className="instructor-section-title">
          등록한 강의
          <span className="instructor-lecture-count">{profile.lectureCount}개</span>
        </h2>

        {profile.lectures.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><IconVideo size={40} /></div>
            <p>등록된 강의가 없습니다</p>
          </div>
        ) : (
          <div className="instructor-lectures-grid">
            {profile.lectures.map((lec) => (
              <Link
                key={lec.id}
                to={`/lectures/${lec.id}`}
                className="ilec-card"
              >
                <div className="ilec-thumb">
                  {lec.thumbnailUrl ? (
                    <img src={lec.thumbnailUrl} alt={lec.title} />
                  ) : (
                    <div className="ilec-thumb-placeholder">
                      <span>{lec.title.slice(0, 2)}</span>
                    </div>
                  )}
                  {lec.category && (
                    <span className="ilec-category">{lec.category}</span>
                  )}
                </div>
                <div className="ilec-body">
                  {lec.certificate && (
                    <div className="ilec-cert">{lec.certificate.name}</div>
                  )}
                  <div className="ilec-title">{lec.title}</div>
                  <div className="ilec-meta">
                    <span className="ilec-rating">
                      <IconStar size={12} filled />
                      {(lec.rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
