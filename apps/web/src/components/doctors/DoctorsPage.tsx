import { useState, useEffect, useCallback, type FC } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { isApiError } from '@app/shared';
import { useAppointments } from '../../contexts/appointmentStore';
import { apiSearchDoctors } from '../../api/search';
import { doctorInitial } from '../../utils/doctorInitial';
import { Doctor } from '../../types';

const PAGE_SIZE = 12;

const tints = ['bg-sage text-pine', 'bg-stone text-ink', 'bg-[#E9E2D6] text-ink'];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const DoctorCardSkeleton: FC<{ index: number }> = ({ index }) => (
  <div className="border border-line bg-white" aria-hidden="true">
    <div className={`h-40 animate-pulse ${index % 3 === 0 ? 'bg-sage/70' : index % 3 === 1 ? 'bg-stone' : 'bg-[#E9E2D6]/70'}`} />
    <div className="space-y-3 p-5">
      <div className="h-5 w-2/3 animate-pulse bg-stone" />
      <div className="h-3 w-1/2 animate-pulse bg-stone" />
      <div className="h-3 w-full animate-pulse bg-stone" />
      <div className="h-10 w-full animate-pulse bg-stone" />
    </div>
  </div>
);

const DoctorCard: FC<{
  doctor: Doctor;
  index: number;
  hospitalName?: string;
  viewMode: 'grid' | 'list';
}> = ({ doctor, index, hospitalName, viewMode }) => {
  const navigate = useNavigate();
  const tint = tints[index % tints.length];

  if (viewMode === 'list') {
    return (
      <article className="doctor-card group grid gap-5 border-b border-line py-6 transition-colors hover:bg-white sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:px-4">
        <div className={`hidden h-20 w-20 items-center justify-center sm:flex ${tint}`}>
          <span className="font-serif text-3xl">{doctorInitial(doctor.name)}</span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-serif text-2xl leading-tight text-ink transition-colors group-hover:text-pine">
              {doctor.name}
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-coral">
              {doctor.specialty}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {hospitalName ?? 'Hospital listed on profile'}
            {doctor.experience ? ` · ${doctor.experience} yrs` : ''}
          </p>
          <p className="mt-2 line-clamp-1 max-w-2xl text-sm leading-relaxed text-muted">{doctor.bio}</p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="font-mono text-sm tabular-nums text-ink">
            ${doctor.consultationFee}
            <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-muted">/ visit</span>
          </p>
          <div className="flex gap-2">
            <Link to={`/doctors/${doctor.id}`} className="btn btn-outline min-h-10 px-3 py-2">
              Profile
            </Link>
            <button
              type="button"
              onClick={() => navigate(`/booking/${doctor.id}`)}
              className="btn btn-primary min-h-10 px-3 py-2"
            >
              Book
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="doctor-card group flex flex-col border border-line bg-white transition-colors hover:border-pine">
      <div className={`relative flex h-40 items-center justify-center overflow-hidden ${tint}`}>
        <span className="font-serif text-[5.5rem] leading-none opacity-90" aria-hidden="true">
          {doctorInitial(doctor.name)}
        </span>
        <span className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-[0.16em] opacity-60">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="absolute bottom-4 left-4 bg-white px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">
          {doctor.specialty}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-serif text-2xl leading-tight text-ink transition-colors group-hover:text-pine">
          <Link to={`/doctors/${doctor.id}`}>{doctor.name}</Link>
        </h2>
        <p className="mt-1 text-sm text-muted">{hospitalName ?? 'Hospital listed on profile'}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{doctor.bio}</p>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          <span>{doctor.experience ? `${doctor.experience} yrs` : 'Experience not listed'}</span>
          <span className="tabular-nums text-ink">${doctor.consultationFee}</span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <Link to={`/doctors/${doctor.id}`} className="btn btn-outline min-h-11 px-3 py-2">
            Profile
          </Link>
          <button
            type="button"
            onClick={() => navigate(`/booking/${doctor.id}`)}
            className="btn btn-primary min-h-11 px-3 py-2"
          >
            Book
          </button>
        </div>
      </div>
    </article>
  );
};

const Pagination: FC<{
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}> = ({ page, total, limit, onPage }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-line pt-6" aria-label="Doctor pages">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="inline-flex min-h-11 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-pine disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </button>

      <div className="hidden items-center gap-1 sm:flex">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 font-mono text-xs text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`flex h-10 w-10 items-center justify-center font-mono text-xs transition-colors ${
                p === page
                  ? 'bg-pine text-canvas'
                  : 'border border-line text-muted hover:border-pine hover:text-ink'
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:hidden">
        {page} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="inline-flex min-h-11 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:text-pine disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
};

export const DoctorsPage: FC = () => {
  const { doctors, doctorsMeta, doctorsLoading, hospitals, refreshDoctors } = useAppointments();
  const [searchParams, setSearchParams] = useSearchParams();
  const specialtyParam = searchParams.get('specialty') ?? '';
  const hospitalParam = searchParams.get('hospital') ?? '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialtyParam);
  const [selectedHospital, setSelectedHospital] = useState(hospitalParam);
  const [sortBy, setSortBy] = useState('experience');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    void refreshDoctors({
      query: debouncedSearch.trim() || undefined,
      specialty: selectedSpecialty.trim() || undefined,
      hospitalId: selectedHospital.trim() || undefined,
      page: currentPage,
      limit: PAGE_SIZE,
    });
  }, [debouncedSearch, selectedSpecialty, selectedHospital, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedSpecialty(specialtyParam);
    setSelectedHospital(hospitalParam);
  }, [specialtyParam, hospitalParam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedSpecialty, selectedHospital]);

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

  const sortedDoctors = [...doctors].sort((a, b) => {
    if (sortBy === 'experience') return (b.experience ?? 0) - (a.experience ?? 0);
    if (sortBy === 'fee') return a.consultationFee - b.consultationFee;
    return a.name.localeCompare(b.name);
  });

  const syncFilters = (next: { specialty?: string; hospital?: string }) => {
    const params = new URLSearchParams(searchParams);
    const specialty = next.specialty ?? '';
    const hospital = next.hospital ?? '';
    if (specialty) params.set('specialty', specialty);
    else params.delete('specialty');
    if (hospital) params.set('hospital', hospital);
    else params.delete('hospital');
    setSearchParams(params, { replace: true });
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);
    syncFilters({ specialty: value, hospital: selectedHospital });
  };

  const handleHospitalChange = (value: string) => {
    setSelectedHospital(value);
    syncFilters({ specialty: selectedSpecialty, hospital: value });
  };

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedHospital('');
    setSortBy('experience');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(doctorsMeta.total / doctorsMeta.limit);
  const start = doctorsMeta.total === 0 ? 0 : (doctorsMeta.page - 1) * doctorsMeta.limit + 1;
  const end = Math.min(doctorsMeta.page * doctorsMeta.limit, doctorsMeta.total);
  const hasFilters = Boolean(searchTerm || selectedSpecialty || selectedHospital);

  return (
    <div className="min-h-screen bg-canvas">
      <section className="container-editorial pb-10 pt-12 lg:pb-14 lg:pt-16" aria-labelledby="directory-title">
        <div className="flex flex-col justify-between gap-8 border-b border-line pb-10 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Directory / {doctorsMeta.total || PAGE_SIZE} seeded specialists</p>
            <h1
              id="directory-title"
              className="mt-5 max-w-[14ch] font-serif text-[clamp(3rem,6.5vw,6rem)] leading-[0.9] tracking-[-0.04em] text-ink"
            >
              Find your <span className="italic text-coral">specialist.</span>
            </h1>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-muted">
            Compare specialists across partner hospitals, then book from the same schedule the hospital
            manages.
          </p>
        </div>

        <form
          role="search"
          aria-label="Filter doctors"
          onSubmit={(event) => event.preventDefault()}
          className="mt-8 grid gap-4 border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:p-5"
        >
          <div className="lg:col-span-4">
            <label htmlFor="doctor-search" className="eyebrow block">
              Search
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                id="doctor-search"
                type="text"
                name="query"
                placeholder="Doctor or condition"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="min-h-12 w-full border border-line bg-canvas pl-10 pr-3 text-sm text-ink placeholder:text-muted/70 focus:border-pine focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="doctor-specialty" className="eyebrow block">
              Specialty
            </label>
            <select
              id="doctor-specialty"
              value={selectedSpecialty}
              onChange={(event) => handleSpecialtyChange(event.target.value)}
              className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm text-ink focus:border-pine focus:outline-none"
            >
              <option value="">All specialties</option>
              {allSpecialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="doctor-hospital" className="eyebrow block">
              Hospital
            </label>
            <select
              id="doctor-hospital"
              value={selectedHospital}
              onChange={(event) => handleHospitalChange(event.target.value)}
              className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm text-ink focus:border-pine focus:outline-none"
            >
              <option value="">All hospitals</option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="doctor-sort" className="eyebrow block">
              Sort
            </label>
            <select
              id="doctor-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="mt-2 min-h-12 w-full border border-line bg-canvas px-3 text-sm text-ink focus:border-pine focus:outline-none"
            >
              <option value="experience">Most experienced</option>
              <option value="fee">Lowest fee</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>

          {hasFilters && (
            <div className="sm:col-span-2 lg:col-span-12">
              <button
                type="button"
                onClick={handleClearFilters}
                className="link-line font-mono text-[10px] uppercase tracking-[0.14em] text-coral"
              >
                Clear all filters
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="container-editorial pb-20" aria-labelledby="results-title">
        <h2 id="results-title" className="sr-only">
          Doctor results
        </h2>

        <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted" aria-live="polite">
            {doctorsLoading ? (
              'Loading directory'
            ) : doctorsMeta.total > 0 ? (
              <>
                Showing <span className="tabular-nums text-ink">{start}–{end}</span> of{' '}
                <span className="tabular-nums text-ink">{doctorsMeta.total}</span> specialists
                {totalPages > 1 ? ` · page ${currentPage} of ${totalPages}` : ''}
              </>
            ) : (
              '0 specialists found'
            )}
          </p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">View</span>
            <div className="flex border border-line" role="group" aria-label="Result view">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-9 w-9 items-center justify-center transition-colors ${
                  viewMode === 'grid' ? 'bg-pine text-canvas' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
                  {[0, 1, 2, 3].map((item) => (
                    <span key={item} className="h-1.5 w-1.5 bg-current" />
                  ))}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={`flex h-9 w-9 items-center justify-center border-l border-line transition-colors ${
                  viewMode === 'list' ? 'bg-pine text-canvas' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="flex flex-col gap-1" aria-hidden="true">
                  {[0, 1, 2].map((item) => (
                    <span key={item} className="h-px w-3.5 bg-current" />
                  ))}
                </span>
              </button>
            </div>
          </div>
        </div>

        {doctorsLoading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <DoctorCardSkeleton key={index} index={index} />
            ))}
          </div>
        ) : sortedDoctors.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedDoctors.map((doctor, index) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  index={index}
                  hospitalName={hospitals.find((hospital) => hospital.id === doctor.hospitalId)?.name}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="mt-2 border-t border-line">
              {sortedDoctors.map((doctor, index) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  index={index}
                  hospitalName={hospitals.find((hospital) => hospital.id === doctor.hospitalId)?.name}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )
        ) : (
          <div className="mt-6 border border-line bg-white px-6 py-16 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-coral">Empty result</p>
            <h3 className="mt-4 font-serif text-3xl text-ink">No specialists match those filters.</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              Try a broader specialty or clear the hospital filter. The complete directory has{' '}
              {doctorsMeta.total || 'several'} seeded specialists.
            </p>
            <button type="button" onClick={handleClearFilters} className="btn btn-outline mt-6">
              Clear all filters
            </button>
            <Link to="/doctors" className="btn btn-primary mt-6 sm:ml-3">
              Browse all doctors
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {!doctorsLoading && (
          <Pagination page={currentPage} total={doctorsMeta.total} limit={doctorsMeta.limit} onPage={handlePageChange} />
        )}
      </section>
    </div>
  );
};
