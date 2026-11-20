import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { NotFoundPage } from './components/common/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppointmentProvider>
          <ErrorBoundary>
            <div className="flex min-h-screen flex-col bg-canvas">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/doctors" element={<DoctorsPage />} />
                  <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
                  <Route path="/booking/:doctorId" element={<BookingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster
              position="top-right"
              closeButton
              toastOptions={{ style: { borderRadius: 0, fontFamily: '"Public Sans", system-ui, sans-serif' } }}
            />
          </ErrorBoundary>
        </AppointmentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
