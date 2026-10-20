import { MaterialListPage } from '../features/materials/pages/MaterialListPage';
import { MaterialRegistrationPage } from '../features/materials/pages/MaterialRegistrationPage';
import './App.scss';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { EmployeeListPage } from '../features/employees/pages/EmployeeListPage';
import { EmployeeRegistrationPage } from '../features/employees/pages/EmployeeRegistrationPage';
import { LandingPage } from '../features/marketing/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { SupplierListPage } from '../features/suppliers/pages/SupplierListPage';
import { SupplierRegistrationPage } from '../features/suppliers/pages/SupplierRegistrationPage';
import { ToolListPage } from '../features/tools/pages/ToolListPage';
import { ToolRegistrationPage } from '../features/tools/pages/ToolRegistrationPage';
import { ProtectedLayout } from './ProtectedLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeeListPage />}>
          <Route path="new" element={<EmployeeRegistrationPage />} />
          <Route path=":employeeId/edit" element={<EmployeeRegistrationPage />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
