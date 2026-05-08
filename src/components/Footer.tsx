import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">Pass<span>Class</span></div>
          <p>자격증 합격을 위한 온라인 학습 플랫폼</p>
          <div className="footer-badges">
            <span className="footer-badge">500+ 강의</span>
            <span className="footer-badge">10만+ 수강생</span>
          </div>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>서비스</h4>
            <Link to="/lectures">강의 목록</Link>
            <Link to="/certificates">자격증</Link>
            <Link to="/my-lectures">내 수강</Link>
          </div>
          <div className="footer-col">
            <h4>계정</h4>
            <Link to="/login">로그인</Link>
            <Link to="/signup">무료 가입</Link>
            <Link to="/profile">내 프로필</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2025 PassClass. All rights reserved.</p>
          <p className="footer-credit">응용프로그래밍개발 팀 프로젝트</p>
        </div>
      </div>
    </footer>
  );
}
