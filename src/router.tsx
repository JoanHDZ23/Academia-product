import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RequireAuth } from './layouts/RequireAuth'
import AcademicPage from './pages/AcademicPage'
import DashboardHomePage from './pages/DashboardHomePage'
import LoginPage from './pages/LoginPage'
import MemberInvitationPage from './pages/MemberInvitationPage'
import RegisterInstitutionPage from './pages/RegisterInstitutionPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate replace to="/login" />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/registro-institucion', element: <RegisterInstitutionPage /> },
      { path: '/registro-integrante/:token', element: <MemberInvitationPage /> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardHomePage /> },
      { path: 'academico', element: <AcademicPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to="/login" />,
  },
])
