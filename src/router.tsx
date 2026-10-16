import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { EmbedLayout } from './layouts/EmbedLayout'
import { RequireAuth } from './layouts/RequireAuth'
import AcademicPage from './pages/AcademicPage'
import DashboardHomePage from './pages/DashboardHomePage'
import LoginPage from './pages/LoginPage'
import MemberInvitationPage from './pages/MemberInvitationPage'
import RegisterInstitutionPage from './pages/RegisterInstitutionPage'
import RootPanelPage from './pages/RootPanelPage'
import { isEmbedded } from './lib/embed-context'

const embedded = isEmbedded()

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
    path: '/root-panel',
    element: <RootPanelPage />,
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        {embedded ? <EmbedLayout /> : <DashboardLayout />}
      </RequireAuth>
    ),
    children: embedded
      // Embebido: solo "Gestión académica", sin dashboard de inicio ni menú.
      ? [
          { index: true, element: <AcademicPage /> },
          { path: 'academico', element: <AcademicPage /> },
        ]
      : [
          { index: true, element: <DashboardHomePage /> },
          { path: 'academico', element: <AcademicPage /> },
        ],
  },
  {
    path: '*',
    element: <Navigate replace to="/login" />,
  },
])
