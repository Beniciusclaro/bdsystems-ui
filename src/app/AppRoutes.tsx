import { MaterialListPage } from '../features/materials/pages/MaterialListPage';
import { MaterialRegistrationPage } from '../features/materials/pages/MaterialRegistrationPage';
import './App.scss';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { EmployeeListPage } from '../features/employees/pages/EmployeeListPage';
import { EmployeeRegistrationPage } from '../features/employees/pages/EmployeeRegistrationPage';
import { ClientListPage } from '../features/clients/pages/ClientListPage';
import { ClientRegistrationPage } from '../features/clients/pages/ClientRegistrationPage';
import { LandingPage } from '../features/marketing/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { AcceptInvitationPage } from '../features/auth/pages/AcceptInvitationPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { SupplierListPage } from '../features/suppliers/pages/SupplierListPage';
import { SupplierRegistrationPage } from '../features/suppliers/pages/SupplierRegistrationPage';
import { ToolListPage } from '../features/tools/pages/ToolListPage';
import { ToolRegistrationPage } from '../features/tools/pages/ToolRegistrationPage';
import { ProtectedLayout } from './ProtectedLayout';
import { LaborPage } from '../features/planning/pages/LaborPage';
import { ProjectListPage } from '../features/planning/pages/ProjectListPage';
import { ProjectRegistrationPage } from '../features/planning/pages/ProjectRegistrationPage';
import { BudgetDetailsPage } from '../features/planning/pages/BudgetDetailsPage';
import { BudgetRegistrationPage } from '../features/planning/pages/BudgetRegistrationPage';
import { CompositionPage } from '../features/planning/pages/CompositionPage';
import { BudgetPage } from '../features/planning/pages/BudgetPage';

const DashboardPage = lazy(() =>
  import('../features/dashboard/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedLayout />}>
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<p className="route-loading">Carregando dashboard...</p>}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="/employees" element={<EmployeeListPage />}>
          <Route path="new" element={<EmployeeRegistrationPage />} />
          <Route path=":employeeId/edit" element={<EmployeeRegistrationPage />} />
        </Route>
        <Route path="/clients" element={<ClientListPage />}>
          <Route path="new" element={<ClientRegistrationPage />} />
          <Route path=":clientId/edit" element={<ClientRegistrationPage />} />
        </Route>
        <Route path="/suppliers" element={<SupplierListPage />}>
          <Route path="new" element={<SupplierRegistrationPage />} />
          <Route path=":supplierId/edit" element={<SupplierRegistrationPage />} />
        </Route>
        <Route path="/materials" element={<MaterialListPage />}>
          <Route path="new" element={<MaterialRegistrationPage />} />
          <Route path=":materialId/edit" element={<MaterialRegistrationPage />} />
        </Route>
        <Route path="/tools" element={<ToolListPage />}>
          <Route path="new" element={<ToolRegistrationPage />} />
          <Route path=":toolId/edit" element={<ToolRegistrationPage />} />
        </Route>
        <Route path="/projects" element={<ProjectListPage />}>
          <Route path=":projectId/edit" element={<ProjectRegistrationPage />} />
        </Route>
        <Route path="/labor" element={<LaborPage />} />
        <Route path="/planning" element={<Navigate to="/projects" replace />} />
        <Route path="/compositions" element={<CompositionPage />} />
        <Route path="/budgets" element={<BudgetPage />}>
          <Route path="new" element={<BudgetRegistrationPage />} />
          <Route path=":budgetId/edit" element={<BudgetRegistrationPage />} />
          <Route path=":budgetId" element={<BudgetDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
