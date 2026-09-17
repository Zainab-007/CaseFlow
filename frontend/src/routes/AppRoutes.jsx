import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import PatientKioskLayout from '../layouts/PatientKioskLayout';
import DoctorLayout from '../layouts/DoctorLayout';

// Patient Pages
import WelcomePage from '../pages/patient/WelcomePage';
import RegisterPage from '../pages/patient/RegisterPage';
import ConsentPage from '../pages/patient/ConsentPage';
import LanguagePage from '../pages/patient/LanguagePage';
import AyushIntakePage from '../pages/patient/AyushIntakePage';
import InterviewPage from '../pages/patient/InterviewPage';
import DocumentsPage from '../pages/patient/DocumentsPage';
import ReviewPage from '../pages/patient/ReviewPage';

// Doctor Pages
import DoctorDashboardPage from '../pages/doctor/DoctorDashboardPage';
import PatientDetailPage from '../pages/doctor/PatientDetailPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Default Landing */}
        <Route index element={<Navigate to="/patient" replace />} />

        {/* Patient Kiosk Flow */}
        <Route path="patient" element={<PatientKioskLayout />}>
          <Route index element={<WelcomePage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="consent" element={<ConsentPage />} />
          <Route path="language" element={<LanguagePage />} />
          <Route path="ayush" element={<AyushIntakePage />} />
          <Route path="interview" element={<InterviewPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="review" element={<ReviewPage />} />
        </Route>

        {/* Doctor Clinical Dashboard Flow */}
        <Route path="doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboardPage />} />
          <Route path="patient/:id" element={<PatientDetailPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Route>
    </Routes>
  );
}
