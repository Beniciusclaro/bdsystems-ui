import './App.scss'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { EmployeeListPage } from './pages/EmployeeListPage'
import { EmployeeRegistrationPage } from './pages/EmployeeRegistrationPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SupplierListPage } from './pages/SupplierListPage'
import { SupplierRegistrationPage } from './pages/SupplierRegistrationPage'
import { ToolListPage } from './pages/ToolListPage'
import { ToolRegistrationPage } from './pages/ToolRegistrationPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeeListPage />}>
        <Route path="new" element={<EmployeeRegistrationPage />} />
        <Route path=":employeeId/edit" element={<EmployeeRegistrationPage />} />
      </Route>
      <Route path="/suppliers" element={<SupplierListPage />}>
        <Route path="new" element={<SupplierRegistrationPage />} />
        <Route path=":supplierId/edit" element={<SupplierRegistrationPage />} />
      </Route>
      <Route path="/tools" element={<ToolListPage />}>
        <Route path="new" element={<ToolRegistrationPage />} />
        <Route path=":toolId/edit" element={<ToolRegistrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
