import { useState, useEffect, useRef, type FC } from 'react';
import { Search, Filter, Star, Clock, DollarSign, Video } from 'lucide-react';
import { useAppointments } from '../../contexts/AppointmentContext';
import { Doctor } from '../../types';
import { Button } from '../common/Button';
import { gsap } from 'gsap';

interface DoctorsPageProps {
  onNavigate: (page: string, doctorId?: string) => void;
}

export const DoctorsPage: FC<DoctorsPageProps> = ({ onNavigate }) => {
  const { doctors, refreshDoctors } = useAppointments();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const doctorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshDoctors({
      query: searchTerm.trim() ? searchTerm.trim() : undefined,
      specialty: selectedSpecialty.trim() ? selectedSpecialty.trim() : undefined
    });
  }, [searchTerm, selectedSpecialty, refreshDoctors]);

  useEffect(() => {
    if (doctorsRef.current) {
      gsap.fromTo('.doctor-card',
        { y: 50, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)"
        }
      );
    }
  }, [doctors, sortBy]);

  const specialties = Array.from(new Set(doctors.map(doctor => doctor.specialty))).sort();

  const filteredDoctors = doctors
    .filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'experience') return (b.experience ?? 0) - (a.experience ?? 0);
      if (sortBy === 'fee') return a.consultationFee - b.consultationFee;
      return a.name.localeCompare(b.name);
    });

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <div className="doctor-card bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-teal-200 group overflow-hidden">
      <div className="relative">
        <img
          src={doctor.avatarUrl ?? ''}
          alt={doctor.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
            <span className="text-sm font-semibold">{doctor.rating ?? '—'}</span>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {doctor.specialty}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
          {doctor.name}
        </h3>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-teal-500" />
            <span>{doctor.experience ? `${doctor.experience} years` : '—'}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-teal-500" />
            <span>${doctor.consultationFee}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
          {doctor.bio}
        </p>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => onNavigate('booking', doctor.id)}
            size="sm"
            className="flex-1"
          >
            Book Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Video className="h-4 w-4 mr-1" />
            Video Call
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Doctor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with world-class specialists and book appointments instantly
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search doctors, specialties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* Specialty Filter */}
            <div className="relative">
              <Filter className="h-5 w-5 text-gray-400 absolute left-4 top-3.5" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white/50 backdrop-blur-sm"
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee">Lowest Fee</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty('');
                setSortBy('rating');
              }}
              className="h-12"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600 text-lg">
            <span className="font-semibold text-teal-600">{filteredDoctors.length}</span> doctors available
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-teal-600'
              }`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-teal-600'
              }`}
            >
              <div className="w-4 h-4 flex flex-col gap-1">
                <div className="bg-current h-0.5 rounded"></div>
                <div className="bg-current h-0.5 rounded"></div>
                <div className="bg-current h-0.5 rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Doctors Grid */}
        <div ref={doctorsRef}>
          {filteredDoctors.length > 0 ? (
            <div className={`grid gap-8 ${
              viewMode === 'grid' 
                ? 'md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {filteredDoctors.map(doctor => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No doctors found</h3>
              <p className="text-gray-500 text-lg mb-6">
                Try adjusting your search criteria or browse all doctors.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecialty('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
