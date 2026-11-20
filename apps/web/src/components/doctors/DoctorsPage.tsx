import { useState, useEffect, useRef, useCallback, type FC } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, Clock, DollarSign, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { isApiError } from '@app/shared';
import { useAppointments } from '../../contexts/appointmentStore';
import { apiSearchDoctors } from '../../api/search';
import { doctorInitial } from '../../utils/doctorInitial';
import { Doctor } from '../../types';
import { Button } from '../common/Button';
import { gsap } from 'gsap';

const PAGE_SIZE = 12;

// ── Debounce hook ──────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
const DoctorCardSkeleton: FC = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-6 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
      <div className="h-9 bg-gray-200 rounded-xl mt-4" />
    </div>
  </div>
);

// ── Doctor card ────────────────────────────────────────────────────────────────
const DoctorCard: FC<{ doctor: Doctor; viewMode: 'grid' | 'list' }> = ({ doctor, viewMode }) => {
  const navigate = useNavigate();

  if (viewMode === 'list') {
    return (
      <div className="doctor-card bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-teal-200 flex gap-5 p-5">
        {doctor.avatarUrl ? (
          <img src={doctor.avatarUrl} alt={doctor.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-teal-400">{doctorInitial(doctor.name)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 hover:text-teal-600 transition-colors">{doctor.name}</h3>
              <span className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-2.5 py-0.5 rounded-full text-xs font-medium mt-1">
                {doctor.specialty}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold">{doctor.rating ?? 'Not rated'}</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">{doctor.bio}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-teal-500" />{doctor.experience ? `${doctor.experience} yrs` : 'Not listed'}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-teal-500" />${doctor.consultationFee}</span>
            </div>
            <div className="flex gap-2">
              <Link to={`/doctors/${doctor.id}`}
                className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors">
                Profile
              </Link>
              <Button onClick={() => navigate(`/booking/${doctor.id}`)} size="sm">Book Now</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-card bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-teal-200 group overflow-hidden">
      <div className="relative">
        {doctor.avatarUrl ? (
          <img src={doctor.avatarUrl} alt={doctor.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
            <span className="text-5xl font-bold text-teal-300">{doctorInitial(doctor.name)}</span>
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm font-semibold">{doctor.rating ?? 'Not rated'}</span>
        </div>
        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {doctor.specialty}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{doctor.name}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-teal-500" />{doctor.experience ? `${doctor.experience} yrs` : 'Not listed'}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-teal-500" />${doctor.consultationFee}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{doctor.bio}</p>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/booking/${doctor.id}`)} size="sm" className="flex-1">Book Now</Button>
          <Link to={`/doctors/${doctor.id}`}
            className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
            title="View profile">
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Pagination ─────────────────────────────────────────────────────────────────
const Pagination: FC<{
  page: number; total: number; limit: number;
  onPage: (p: number) => void;
}> = ({ page, total, limit, onPage }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPage(page - 1)} disabled={page === 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-teal-50 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                : 'border border-gray-200 text-gray-700 hover:bg-teal-50 hover:border-teal-300'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-teal-50 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
export const DoctorsPage: FC = () => {
  const { doctors, doctorsMeta, doctorsLoading, refreshDoctors } = useAppointments();
  const [searchParams, setSearchParams] = useSearchParams();
  const specialtyParam = searchParams.get('specialty') ?? '';
  const initialSpecialty = new URLSearchParams(window.location.search).get('specialty') ?? '';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || specialtyParam);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);
  const doctorsRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch when filters or page change
  useEffect(() => {
    void refreshDoctors({
      query: debouncedSearch.trim() || undefined,
      specialty: selectedSpecialty.trim() || undefined,
      page: currentPage,
      limit: PAGE_SIZE,
    });
  }, [debouncedSearch, selectedSpecialty, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the filter in sync when a specialty link changes the URL
  useEffect(() => {
    setSelectedSpecialty(specialtyParam);
  }, [specialtyParam]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedSpecialty]);

  // Load the complete specialty list once, independently of the active filter
  useEffect(() => {
    let active = true;

    void apiSearchDoctors({ page: 1, limit: 50 }).then((res) => {
      if (!active || isApiError(res)) return;
      setAllSpecialties(Array.from(new Set(res.data.items.map((doctor) => doctor.specialty))).sort());
    });

    return () => {
      active = false;
    };
  }, []);

  // Animate cards when new results arrive
  useEffect(() => {
    if (!doctorsLoading && doctors.length > 0 && doctorsRef.current) {
      gsap.fromTo('.doctor-card',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [doctors, doctorsLoading]);

  const sortedDoctors = [...doctors].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortBy === 'experience') return (b.experience ?? 0) - (a.experience ?? 0);
    if (sortBy === 'fee') return a.consultationFee - b.consultationFee;
    return a.name.localeCompare(b.name);
  });

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);

    const next = new URLSearchParams(searchParams);
    if (value) next.set('specialty', value);
    else next.delete('specialty');
    setSearchParams(next, { replace: true });
  };

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSortBy('rating');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(doctorsMeta.total / doctorsMeta.limit);
  const start = (doctorsMeta.page - 1) * doctorsMeta.limit + 1;
  const end = Math.min(doctorsMeta.page * doctorsMeta.limit, doctorsMeta.total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Doctor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare specialists and reserve a slot from their live schedules
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="h-5 w-5 text-gray-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search doctors, specialties..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/50 transition-shadow"
              />
            </div>
            <div className="relative">
              <Filter className="h-5 w-5 text-gray-400 absolute left-4 top-3.5 pointer-events-none" />
              <select
                value={selectedSpecialty}
                onChange={e => handleSpecialtyChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white/50"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/50"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="fee">Lowest Fee</option>
              <option value="name">Name A-Z</option>
            </select>
            <Button variant="outline" onClick={handleClearFilters} className="h-12">Clear All</Button>
          </div>
        </div>

        {/* Results bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600">
            {doctorsLoading ? (
              <span className="text-gray-400">Loading…</span>
            ) : doctorsMeta.total > 0 ? (
              <span>
                Showing <span className="font-semibold text-teal-600">{start}–{end}</span> of{' '}
                <span className="font-semibold text-teal-600">{doctorsMeta.total}</span> doctors
                {totalPages > 1 && <span className="text-gray-400 text-sm ml-2">(page {currentPage} of {totalPages})</span>}
              </span>
            ) : (
              <span><span className="font-semibold text-teal-600">0</span> doctors found</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('grid')} aria-label="Grid view"
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-teal-600'}`}>
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-current rounded-sm" />)}
              </div>
            </button>
            <button onClick={() => setViewMode('list')} aria-label="List view"
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:text-teal-600'}`}>
              <div className="w-4 h-4 flex flex-col gap-1">
                {[...Array(3)].map((_, i) => <div key={i} className="bg-current h-0.5 rounded" />)}
              </div>
            </button>
          </div>
        </div>

        {/* Grid / List */}
        <div ref={doctorsRef}>
          {doctorsLoading ? (
            <div className={`grid gap-8 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <DoctorCardSkeleton key={i} />)}
            </div>
          ) : sortedDoctors.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
              {sortedDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} viewMode={viewMode} />)}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No doctors found</h3>
              <p className="text-gray-500 text-lg mb-6">Try adjusting your search criteria or browse all doctors.</p>
              <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!doctorsLoading && (
          <Pagination
            page={currentPage}
            total={doctorsMeta.total}
            limit={doctorsMeta.limit}
            onPage={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};
