import App from './App'
import { LoginPage } from './pages/authentication/userLogin/LoginPage'
import { RegisterPage } from './pages/authentication/userLogin/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ApiKeyManagement } from './pages/apiKeys/ApiKeyManagement'
import { OrganizationSettings } from './pages/organization/OrganizationSettings'
import { BillingPage } from './pages/organization/BillingPage'
import { UsagePage } from './pages/organization/UsagePage'
import { DocumentationPage } from './pages/DocumentationPage'
import { PricingPage } from './pages/PricingPage'
import { AboutPage } from './pages/AboutPage'
import { TermsOfServicePage } from './pages/TermsOfServicePage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { EmbedComparisonPage } from './pages/EmbedComparisonPage'
import { ContactPage } from './pages/ContactPage'

import { Route, Routes } from 'react-router-dom'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/home" element={<App />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/api-keys" element={<ApiKeyManagement />} />
      <Route path="/organization" element={<OrganizationSettings />} />
      <Route path="/organization/billing" element={<BillingPage />} />
      <Route path="/organization/usage" element={<UsagePage />} />
      <Route path="/docs" element={<DocumentationPage />} />
      <Route path="/documentation" element={<DocumentationPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/compare" element={<EmbedComparisonPage />} />
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}


