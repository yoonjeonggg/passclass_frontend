import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Lectures from './pages/Lectures';
import LectureDetail from './pages/LectureDetail';
import Certificates from './pages/Certificates';
import MyLectures from './pages/MyLectures';
import Profile from './pages/Profile';
import InstructorProfile from './pages/InstructorProfile';
import Problems from './pages/Problems';
import MockExams from './pages/MockExams';
import MockExamSession from './pages/MockExamSession';
import WrongNotes from './pages/WrongNotes';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherMyLectures from './pages/TeacherMyLectures';
import { canAccessStaffRoute } from './utils/roles';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: ('ADMIN' | 'TEACHER')[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '120px' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccessStaffRoute(user, roles)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/lectures" element={<Lectures />} />
          <Route path="/lectures/:lectureId" element={<LectureDetail />} />
          <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/problems"     element={<Problems />} />
          <Route path="/mock-exams"   element={<MockExams />} />
          <Route path="/mock-exams/:id" element={<MockExamSession />} />
          <Route path="/my-lectures" element={
            <ProtectedRoute><MyLectures /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/wrong-notes" element={
            <ProtectedRoute><WrongNotes /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <RoleRoute roles={['ADMIN']}><AdminDashboard /></RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/teacher" element={
            <ProtectedRoute>
              <RoleRoute roles={['TEACHER']}><TeacherDashboard /></RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/teacher/my-lectures" element={
            <ProtectedRoute>
              <RoleRoute roles={['TEACHER']}><TeacherMyLectures /></RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/teacher/my-lectures/:lectureId" element={
            <ProtectedRoute>
              <RoleRoute roles={['TEACHER']}><TeacherMyLectures /></RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
