import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppointmentProvider } from './contexts/AppointmentContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { AuthPage } from './components/auth/AuthPage';
import { DoctorsPage } from './components/doctors/DoctorsPage';
import { BookingPage } from './components/booking/BookingPage';
import { DashboardPage } from './components/dashboard/DashboardPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>();

  const handleNavigate = (page: string, doctorId?: string) => {
    setCurrentPage(page);
    if (doctorId) {
      setSelectedDoctorId(doctorId);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'auth':
        return <AuthPage onNavigate={handleNavigate} />;
      case 'doctors':
        return <DoctorsPage onNavigate={handleNavigate} />;
      case 'booking':
        return <BookingPage onNavigate={handleNavigate} doctorId={selectedDoctorId} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <AppointmentProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header currentPage={currentPage} onNavigate={handleNavigate} />
          <main className="flex-1">
            {renderCurrentPage()}
          </main>
          <Footer />
        </div>
      </AppointmentProvider>
    </AuthProvider>
  );
}

export default App;
