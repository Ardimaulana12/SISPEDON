import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Login from './components/Login';
import FormQuestions from './components/formulir/form'
import SelectLecturer from './components/formulir/SelectLecturer';
import Home from './components/Home';
import Navbar from './components/navbar/Navbar';
import { AuthProvider } from './components/AuthProvider';
import AdminPage from './components/admin/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import Leaderboard from './components/leaderboard/Leaderboard';
import EvaluationHistory from './components/student/EvaluationHistory';
import ChangePassword from './pages/ChangePassword';
import Profile from './pages/Profile';
// import { NutrientProvider } from './components/navbar/NutrientContext';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Container = styled.div`
  margin-left: 3rem;
  margin-right: 3rem;
`;

const Main = () => {
  return(
    <Router>
      <AuthProvider>
        {/* Form route without navbar */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/form" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <FormQuestions />
            </ProtectedRoute>
          } />
          <Route path="/*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
              </Routes>
          <Container>
            <Routes>
                  {/* Form route is now handled outside the navbar layout */}
                  <Route path="/lecturer" element={
                <ProtectedRoute allowedRoles={["student", "admin"]}>
                  <SelectLecturer />
                </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPage />
                  </ProtectedRoute>
                  } />
                   <Route path="/leaderboard" element={
                    <ProtectedRoute allowedRoles={["student", "admin"]}>
                      <Leaderboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <EvaluationHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/change-password" element={
                    <ProtectedRoute allowedRoles={["student", "admin"]}>
                      <ChangePassword />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={["student", "admin"]}>
                      <Profile />
                    </ProtectedRoute>
                  } />
            </Routes>
          </Container>
            </>
          } />
        </Routes>
        <ToastContainer />
      </AuthProvider>
    </Router>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Main />
  </StrictMode>
);
