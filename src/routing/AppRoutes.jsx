import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute, { ProtectedStudentRoute } from './ProtectedRoute';
import Layout from '../layout/Layout';
import HomePage from '../pages/home/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ParentDashboard from '../pages/dashboard/ParentDashboard';
import TeacherDashboard from '../pages/dashboard/TeacherDashboard';
import PathSelectionScreen from '../pages/path/PathSelectionScreen';
// Teacher pages
import MyClassesPage from '../pages/teacher/MyClassesPage';
import TeacherResourcesPage from '../pages/teacher/TeacherResourcesPage';
import StudentProgressPage from '../pages/teacher/StudentProgressPage';
import CreateAssignmentPage from '../pages/teacher/CreateAssignmentPage';
import GradeProjectsPage from '../pages/teacher/GradeProjectsPage';
import TeacherChatPage from '../pages/teacher/TeacherChatPage';
import ScheduleLabPage from '../pages/teacher/ScheduleLabPage';
// Student pages
import StudentResourcesPage from '../pages/student/StudentResourcesPage';
import TakeQuizPage from '../pages/student/TakeQuizPage';
import SimulationPage from '../pages/student/SimulationPage';
import SubmitProjectPage from '../pages/student/SubmitProjectPage';
import QnAPage from '../pages/student/QnAPage';
import JoinLabPage from '../pages/student/JoinLabPage';
// Parent pages
import PerformanceReportsPage from '../pages/parent/PerformanceReportsPage';
import DashboardLayout from '../layout/DashboardLayout';

/**
 * Main routing configuration for the e-learning platform
 * Implements comprehensive role-based access control
 */
function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public routes with Layout (header/footer) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route 
          path="login" 
          element={
            // Redirect authenticated users to their appropriate dashboard
            isAuthenticated && user ? (
              <Navigate 
                to={
                  user.role === 'student' ? '/dashboard' :
                  user.role === 'parent' ? '/parent-dashboard' :
                  user.role === 'teacher' ? '/teacher-dashboard' :
                  '/dashboard'
                } 
                replace 
              />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route 
          path="register" 
          element={
            // Redirect authenticated users to their appropriate dashboard
            isAuthenticated && user ? (
              <Navigate 
                to={
                  user.role === 'student' ? '/dashboard' :
                  user.role === 'parent' ? '/parent-dashboard' :
                  user.role === 'teacher' ? '/teacher-dashboard' :
                  '/dashboard'
                } 
                replace 
              />
            ) : (
              <RegisterPage />
            )
          } 
        />
      </Route>

      {/* Dashboard routes WITHOUT Layout wrapper (they use DashboardLayout internally) */}
      
      {/* Path selection route - Only for students */}
      <Route 
        path="select-path" 
        element={
          <ProtectedRoute allowedRoles="student">
            <PathSelectionScreen />
          </ProtectedRoute>
        } 
      />
      
      {/* Role-based protected dashboard routes */}
      <Route 
        path="dashboard" 
        element={
          <ProtectedStudentRoute>
            <DashboardPage />
          </ProtectedStudentRoute>
        } 
      />
      
      <Route 
        path="parent-dashboard" 
        element={
          <ProtectedRoute allowedRoles="parent">
            <ParentDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="teacher-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Student-only routes */}
      <Route 
        path="take-quiz" 
        element={
          <ProtectedRoute allowedRoles="student">
            <TakeQuizPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="join-lab" 
        element={
          <ProtectedRoute allowedRoles="student">
            <DashboardLayout userRole="student">
              {/* <div className="p-6">Join Lab Page - Coming Soon</div>
               */}
                <JoinLabPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="simulation" 
        element={
          <ProtectedRoute allowedRoles="student">
            <DashboardLayout userRole="student">
              <SimulationPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="qna" 
        element={
          <ProtectedRoute allowedRoles="student">
            <DashboardLayout userRole="student">
              <QnAPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      {/* add teacher dashboard chat */}
      <Route 
        path="teacher-chat" 
        element={
          <ProtectedRoute allowedRoles="teacher">
            <DashboardLayout userRole="teacher">
              <TeacherChatPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="submit-project" 
        element={
          <ProtectedRoute allowedRoles="student">
            <SubmitProjectPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="resources" 
        element={
          <ProtectedRoute allowedRoles="student">
            <StudentResourcesPage />
          </ProtectedRoute>
        } 
      />

      {/* Parent-only routes */}
      <Route 
        path="children-progress" 
        element={
          <ProtectedRoute allowedRoles="parent">
            <DashboardLayout userRole="parent">
              <div className="p-6">Children Progress Page - Coming Soon</div>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="performance-reports" 
        element={
          <ProtectedRoute allowedRoles="parent">
            <PerformanceReportsPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="teacher-chat" 
        element={
          <ProtectedRoute allowedRoles="parent">
            <DashboardLayout userRole="parent">
              <div className="p-6">Teacher Communication Page - Coming Soon</div>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="parent-resources" 
        element={
          <ProtectedRoute allowedRoles="parent">
            <DashboardLayout userRole="parent">
              <div className="p-6">Parent Resources Page - Coming Soon</div>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />

      {/* Teacher-only routes */}
      <Route 
        path="my-classes" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <MyClassesPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="student-progress" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <StudentProgressPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="create-assignment" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CreateAssignmentPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="grade-projects" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <GradeProjectsPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="schedule-lab" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <DashboardLayout userRole="teacher">
              {/* <div className="p-6">Schedule Lab Page - Coming Soon</div>
               */}
               <ScheduleLabPage />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="teacher-resources" 
        element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherResourcesPage />
          </ProtectedRoute>
        } 
      />

      {/* Profile route - accessible to all authenticated users */}
      <Route 
        path="profile" 
        element={
          <ProtectedRoute allowedRoles={['student', 'parent', 'teacher', 'admin']}>
            <DashboardLayout userRole={user?.role || 'student'}>
              <div className="p-6">Profile Page - Coming Soon</div>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback route for unmatched paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes; 