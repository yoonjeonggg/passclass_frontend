import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../api";
import type { NotificationResponse } from "../types";
import {
  IconBell, IconUser, IconBook, IconLogOut, IconChevronDown,
  IconMonitor, IconVideo
} from "./Icons";
import "./Navbar.css";

function NotifTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "LECTURE_NEW_CHAPTER": return <IconVideo size={14} />;
    case "LECTURE_LIKED":       return <IconBell size={14} />;
    case "LECTURE_UPDATED":     return <IconMonitor size={14} />;
    default:                    return <IconBell size={14} />;
  }
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [notifLoading, setNotifLoading]   = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    notificationApi.getUnreadCount()
      .then(res => setUnreadCount(res.data.unreadCount))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    if (!notifOpen) {
      setNotifLoading(true);
      notificationApi.getList(0, 10)
        .then(res => setNotifications(res.data.content))
        .catch(() => {})
        .finally(() => setNotifLoading(false));
    }
    setNotifOpen(v => !v);
    setMenuOpen(false);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => notificationApi.markAsRead(n.id).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">Pass<span className="logo-accent">Class</span></span>
        </Link>

        <div className="navbar-links">
          <Link to="/lectures"     className={`nav-link ${isActive("/lectures") ? "active" : ""}`}>강의</Link>
          <Link to="/certificates" className={`nav-link ${isActive("/certificates") ? "active" : ""}`}>자격증</Link>
          {user && (
            <Link to="/my-lectures" className={`nav-link ${isActive("/my-lectures") ? "active" : ""}`}>내 수강</Link>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="navbar-user-area">
              <div className="notif-wrap" ref={notifRef}>
                <button className="notif-bell" onClick={handleBellClick} aria-label="알림">
                  <IconBell size={18} />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <span className="notif-dropdown-title">알림</span>
                      {notifications.some(n => !n.isRead) && (
                        <button className="notif-read-all" onClick={handleMarkAllRead}>모두 읽음</button>
                      )}
                    </div>
                    {notifLoading ? (
                      <div className="notif-loading"><div className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }} /></div>
                    ) : notifications.length > 0 ? (
                      <div className="notif-list">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notif-item ${n.isRead ? "read" : "unread"}`}
                            onClick={() => !n.isRead && handleMarkRead(n.id)}
                          >
                            <span className="notif-icon"><NotifTypeIcon type={n.type} /></span>
                            <div className="notif-body">
                              <p className="notif-content">{n.content}</p>
                              <span className="notif-time">{new Date(n.createdAt).toLocaleDateString("ko-KR")}</span>
                            </div>
                            {!n.isRead && <div className="notif-dot" />}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="notif-empty">새 알림이 없습니다</div>
                    )}
                  </div>
                )}
              </div>

              <div className="user-menu" ref={menuRef}>
                <button
                  className="user-trigger"
                  onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
                >
                  <div className="user-avatar">
                    {user.profileImage
                      ? <img src={user.profileImage} alt="" />
                      : <span>{user.nickname[0]}</span>
                    }
                  </div>
                  <span className="user-name">{user.nickname}</span>
                  <IconChevronDown size={14} className={`chevron ${menuOpen ? "open" : ""}`} />
                </button>

                {menuOpen && (
                  <div className="dropdown">
                    <div className="dropdown-profile">
                      <div className="dp-avatar">
                        {user.profileImage
                          ? <img src={user.profileImage} alt="" />
                          : <span>{user.nickname[0]}</span>
                        }
                      </div>
                      <div>
                        <div className="dp-name">{user.nickname}</div>
                        <div className="dp-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      <IconUser size={15} /> 내 프로필
                    </Link>
                    <Link to="/my-lectures" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      <IconBook size={15} /> 내 수강 목록
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <IconLogOut size={15} /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login"  className="btn btn-ghost"    style={{ padding: "9px 18px", fontSize: "14px" }}>로그인</Link>
              <Link to="/signup" className="btn btn-primary"  style={{ padding: "9px 18px", fontSize: "14px" }}>무료 시작</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
