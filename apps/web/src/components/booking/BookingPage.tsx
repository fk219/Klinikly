import { useMemo, useState, useEffect, type FC } from 'react';
import { Calendar, Clock, User, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppointments } from '../../contexts/appointmentStore';
import { useAuth } from '../../contexts/authStore';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Doctor } from '../../types';

interface BookingPageProps {
  onNavigate: (page: string) => void;
  doctorId?: string;
}

export const BookingPage: FC<BookingPageProps> = ({ onNavigate, doctorId }) => {
  const { getDoctorById, getDoctorAvailability, bookAppointment } = useAppointments();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotStartAt, setSelectedSlotStartAt] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [availability, setAvailability] = useState<Array<{ id: string; startAt: string }>>([]);

  useEffect(() => {
    const run = async () => {
      if (!doctorId) return;
      const foundDoctor = await getDoctorById(doctorId);
      setDoctor(foundDoctor);

      const now = new Date();
      const from = now.toISOString().slice(0, 10);
      const toDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const to = toDate.toISOString().slice(0, 10);

      const items = await getDoctorAvailability(doctorId, from, to);
      setAvailability(items);
    };
    void run();
  }, [doctorId, getDoctorAvailability, getDoctorById]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, Array<{ startAt: string; time: string }>>();
    for (const item of availability) {
      const iso = new Date(item.startAt).toISOString();
      const date = iso.slice(0, 10);
      const time = iso.slice(11, 16);
      const list = map.get(date) ?? [];
      list.push({ startAt: item.startAt, time });
      map.set(date, list);
    }
    for (const [k, v] of map.entries()) {
      v.sort((a, b) => a.time.localeCompare(b.time));
      map.set(k, v);
    }
    return map;
  }, [availability]);

  const availableDates = useMemo(() => Array.from(availabilityByDate.keys()).sort(), [availabilityByDate]);

  const availableTimesForDate = useMemo(() => {
    const list = availabilityByDate.get(selectedDate) ?? [];
    return list.map((x) => x.time);
  }, [availabilityByDate, selectedDate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to book an appointment
          </h2>
          <Button onClick={() => onNavigate('auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Doctor not found</h2>
          <Button onClick={() => onNavigate('doctors')}>
            Browse Doctors
          </Button>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlotStartAt || !reason.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsBooking(true);

    const ok = await bookAppointment({
      doctorId: doctor.id,
      slotStartAt: selectedSlotStartAt,
      reason: reason.trim()
    });

    setIsBooking(false);
    if (ok) setShowConfirmation(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('doctors')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Doctors
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctor Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <div className="text-center mb-6">
                <img
                  src={doctor.avatarUrl ?? ''}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                <p className="text-teal-600 font-medium">{doctor.specialty}</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{doctor.experience ? `${doctor.experience} years experience` : 'Experience —'}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span>Consultation Fee: ${doctor.consultationFee}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">About</h4>
                <p className="text-sm text-gray-600">{doctor.bio}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-8">
                {/* Date Selection */}
                <div>
                  <label className="block text-lg font-medium text-gray-900 mb-4">
                    <Calendar className="h-5 w-5 inline mr-2" />
                    Select Date
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableDates.map(date => (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlotStartAt(null);
                        }}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedDate === date
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-lg font-medium text-gray-900 mb-4">
                      <Clock className="h-5 w-5 inline mr-2" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {availableTimesForDate.map(time => (
                        <button
                          key={time}
                          onClick={() => {
                            const slot = (availabilityByDate.get(selectedDate) ?? []).find((x) => x.time === time);
                            if (slot) setSelectedSlotStartAt(slot.startAt);
                          }}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedSlotStartAt &&
                            new Date(selectedSlotStartAt).toISOString().slice(11, 16) === time
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          {formatTime(time)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-lg font-medium text-gray-900 mb-4">
                    <FileText className="h-5 w-5 inline mr-2" />
                    Reason for Visit
                  </label>
                  <textarea
                    id="reason"
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please describe your symptoms or reason for the visit..."
                  />
                </div>

                {/* Summary */}
                {selectedDate && selectedSlotStartAt && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Appointment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Doctor:</span>
                        <span className="font-medium">{doctor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">
                          {formatTime(new Date(selectedSlotStartAt).toISOString().slice(11, 16))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Consultation Fee:</span>
                        <span className="font-medium">${doctor.consultationFee}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                <div className="pt-6">
                  <Button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlotStartAt || !reason.trim()}
                    loading={isBooking}
                    className="w-full"
                    size="lg"
                  >
                    {isBooking ? 'Booking Appointment...' : 'Book Appointment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          onNavigate('dashboard');
        }}
        title=""
      >
        <div className="text-center py-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Appointment Booked Successfully!
          </h3>
          <p className="text-gray-600 mb-6">
            Your appointment with {doctor.name} has been confirmed for{' '}
            {formatDate(selectedDate)} at{' '}
            {selectedSlotStartAt ? formatTime(new Date(selectedSlotStartAt).toISOString().slice(11, 16)) : ''}.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setShowConfirmation(false);
                onNavigate('dashboard');
              }}
              className="w-full"
            >
              View My Appointments
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmation(false);
                onNavigate('doctors');
              }}
              className="w-full"
            >
              Book Another Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
