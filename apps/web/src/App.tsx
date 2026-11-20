import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { AppointmentProvider } from './contexts/AppointmentContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { AuthPage } from './components/auth/AuthPage';
import { DoctorsPage } from './components/doctors/DoctorsPage';
import { DoctorDetailPage } from './components/doctors/DoctorDetailPage';
import { BookingPage } from './components/booking/BookingPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppointmentProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/doctors" element={<DoctorsPage />} />
                  <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
                  <Route path="/booking/:doctorId" element={<BookingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster position="top-right" richColors closeButton />
          </ErrorBoundary>
        </AppointmentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
