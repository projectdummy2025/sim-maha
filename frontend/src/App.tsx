import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Globe, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Moon, 
  Sun, 
  GraduationCap, 
  Mail, 
  Calendar, 
  MapPin, 
  X, 
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface Mahasiswa {
  id: number;
  nim: string;
  nama: string;
  universitas: string;
  negara: string;
  jurusan: string;
  jenjang: string;
  tahun_masuk: number;
  email: string;
  created_at?: string;
}

interface Stats {
  totalMahasiswa: number;
  totalNegara: number;
  jenjangStats: { jenjang: string; count: number }[];
  negaraStats: { negara: string; count: number }[];
}

const INITIAL_FORM_STATE = {
  nim: '',
  nama: '',
  universitas: '',
  negara: '',
  jurusan: '',
  jenjang: 'S1',
  tahun_masuk: new Date().getFullYear(),
  email: ''
};

const POPULAR_COUNTRIES = [
  'Amerika Serikat', 'Inggris', 'Australia', 'Jepang', 'Jerman', 
  'Singapura', 'Malaysia', 'Belanda', 'Turki', 'Korea Selatan'
];

export default function App() {
  // State
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMahasiswa: 0,
    totalNegara: 0,
    jenjangStats: [],
    negaraStats: []
  });
  
  const [search, setSearch] = useState('');
  const [filterNegara, setFilterNegara] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formInputs, setFormInputs] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Delete Confirmation State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Mahasiswa | null>(null);

  // Apply Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterNegara) params.append('negara', filterNegara);
      if (filterJenjang) params.append('jenjang', filterJenjang);

      const [studentsRes, statsRes] = await Promise.all([
        fetch(`/api/mahasiswa?${params.toString()}`),
        fetch('/api/mahasiswa/stats')
      ]);

      if (!studentsRes.ok || !statsRes.ok) {
        throw new Error('Gagal memuat data dari server.');
      }

      const studentsData = await studentsRes.json();
      const statsData = await statsRes.json();

      setMahasiswa(studentsData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when search or filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 300); // Debounce search

    return () => clearTimeout(delayDebounce);
  }, [search, filterNegara, filterJenjang]);

  // Handle Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formInputs.nim.trim()) errors.nim = 'NIM wajib diisi';
    if (!formInputs.nama.trim()) errors.nama = 'Nama lengkap wajib diisi';
    if (!formInputs.universitas.trim()) errors.universitas = 'Universitas wajib diisi';
    if (!formInputs.negara.trim()) errors.negara = 'Negara wajib diisi';
    if (!formInputs.jurusan.trim()) errors.jurusan = 'Jurusan wajib diisi';
    
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formInputs.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!emailRegex.test(formInputs.email)) {
      errors.email = 'Format email tidak valid';
    }

    if (!formInputs.tahun_masuk) {
      errors.tahun_masuk = 'Tahun masuk wajib diisi';
    } else {
      const year = Number(formInputs.tahun_masuk);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 2000 || year > currentYear + 1) {
        errors.tahun_masuk = `Tahun tidak valid (2000 - ${currentYear + 1})`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormInputs(INITIAL_FORM_STATE);
    setFormErrors({});
    setModalType('add');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (student: Mahasiswa) => {
    setFormInputs({
      nim: student.nim,
      nama: student.nama,
      universitas: student.universitas,
      negara: student.negara,
      jurusan: student.jurusan,
      jenjang: student.jenjang,
      tahun_masuk: student.tahun_masuk,
      email: student.email
    });
    setFormErrors({});
    setSelectedId(student.id);
    setModalType('edit');
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = modalType === 'add' ? '/api/mahasiswa' : `/api/mahasiswa/${selectedId}`;
      const method = modalType === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInputs)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem.');
      }

      setIsModalOpen(false);
      fetchData(); // Refresh list and stats
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Delete Confirmation
  const openDeleteConfirm = (student: Mahasiswa) => {
    setDeleteTarget(student);
    setIsDeleteOpen(true);
  };

  // Execute Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/mahasiswa/${deleteTarget.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus data.');
      }

      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchData(); // Refresh list and stats
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setFilterNegara('');
    setFilterJenjang('');
  };

  // Get jenjang count for progress calculation
  const getJenjangCount = (level: string) => {
    const found = stats.jenjangStats.find(item => item.jenjang === level);
    return found ? found.count : 0;
  };

  // Total count helper
  const totalStudents = stats.totalMahasiswa || 0;

  return (
    <div className="min-h-screen pb-16 font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 1. Header (Navbar) */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-800/80 glass">
        <div className="container px-4 py-4 mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                SIM-MAHA
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sistem Informasi Mahasiswa Luar Negeri
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 transition-all duration-200 border rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm"
              title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* Tambah Button */}
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2.5 space-x-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mahasiswa</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Content */}
      <main className="container px-4 py-8 mx-auto space-y-8 animate-fade-in">
        
        {/* Statistics Widgets Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Total Mahasiswa */}
          <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                  Total Mahasiswa
                </span>
                <h3 className="text-3xl font-black font-display text-indigo-600 dark:text-indigo-400">
                  {stats.totalMahasiswa}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> terdaftar secara global
                </span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Total Negara */}
          <div className="relative overflow-hidden p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-24 h-24 transform translate-x-8 -translate-y-8 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                  Negara Tujuan
                </span>
                <h3 className="text-3xl font-black font-display text-emerald-600 dark:text-emerald-400">
                  {stats.totalNegara}
                </h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  negara di seluruh dunia
                </span>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Globe className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Pendidikan Breakdown */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 flex flex-col justify-between">
            <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-3 block">
              Distribusi Jenjang
            </span>
            <div className="space-y-2.5">
              {['S1', 'S2', 'S3'].map((level) => {
                const count = getJenjangCount(level);
                const percent = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                
                // Color mapping
                const colorMap: Record<string, string> = {
                  S1: 'bg-cyan-500',
                  S2: 'bg-indigo-500',
                  S3: 'bg-rose-500'
                };
                
                return (
                  <div key={level} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">{level} ({count} org)</span>
                      <span className="text-slate-400">{percent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorMap[level]} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Top Negara */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 flex flex-col justify-between">
            <span className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-3 block">
              Negara Terpopuler
            </span>
            <div className="space-y-2">
              {stats.negaraStats.slice(0, 3).map((item, idx) => (
                <div key={item.negara} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{item.negara}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-md font-bold">
                    {item.count} mhs
                  </span>
                </div>
              ))}
              {stats.negaraStats.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Belum ada data negara</p>
              )}
            </div>
          </div>

        </section>

        {/* 3. Main Data Area & Controls */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
          
          {/* Filtering and Search Controls */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama, NIM, universitas..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Negara */}
              <select
                value={filterNegara}
                onChange={(e) => setFilterNegara(e.target.value)}
                className="px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Semua Negara</option>
                {/* Dynamically render country list from stats database or pre-defined popular */}
                {Array.from(new Set([
                  ...stats.negaraStats.map(s => s.negara),
                  ...POPULAR_COUNTRIES
                ])).sort().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>

              {/* Filter Jenjang */}
              <select
                value={filterJenjang}
                onChange={(e) => setFilterJenjang(e.target.value)}
                className="px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Semua Jenjang</option>
                <option value="S1">S1 (Sarjana)</option>
                <option value="S2">S2 (Magister)</option>
                <option value="S3">S3 (Doktor)</option>
              </select>

              {/* Reset Filter Button */}
              {(search || filterNegara || filterJenjang) && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-150"
                  title="Reset semua filter"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table / List View */}
          <div className="overflow-x-auto">
            {loading ? (
              // Loading Skeleton
              <div className="p-8 text-center space-y-4">
                <div className="w-8 h-8 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat data mahasiswa...</p>
              </div>
            ) : error ? (
              // Error Alert
              <div className="p-8 text-center max-w-md mx-auto space-y-3">
                <div className="inline-flex p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full">
                  <X className="w-6 h-6" />
                </div>
                <h4 className="text-md font-bold text-slate-800 dark:text-slate-200">Gagal Sinkronisasi</h4>
                <p className="text-xs text-slate-500">{error}</p>
                <button 
                  onClick={fetchData} 
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            ) : mahasiswa.length === 0 ? (
              // Empty State
              <div className="p-16 text-center max-w-sm mx-auto space-y-4">
                <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-md font-bold text-slate-800 dark:text-slate-200">Mahasiswa Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Coba sesuaikan kata kunci pencarian Anda atau periksa filter yang sedang aktif.
                  </p>
                </div>
                {(search || filterNegara || filterJenjang) && (
                  <button 
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500 border border-indigo-200 hover:border-indigo-400 rounded-xl transition-all"
                  >
                    Bersihkan Filter
                  </button>
                )}
              </div>
            ) : (
              // Student Table
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold tracking-wider text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-4">Mahasiswa</th>
                    <th className="px-6 py-4">Studi & Jurusan</th>
                    <th className="px-6 py-4">Negara & Universitas</th>
                    <th className="px-6 py-4">Tahun Masuk</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {mahasiswa.map((mhs) => (
                    <tr 
                      key={mhs.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors duration-150 group"
                    >
                      {/* Name & NIM */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-md">
                            {mhs.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {mhs.nama}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center font-mono">
                              NIM: {mhs.nim}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Study & Major */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {/* Study Level Badges */}
                            {mhs.jenjang === 'S1' && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 rounded-md border border-cyan-100 dark:border-cyan-900/50">
                                S1
                              </span>
                            )}
                            {mhs.jenjang === 'S2' && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                                S2
                              </span>
                            )}
                            {mhs.jenjang === 'S3' && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100 dark:border-rose-900/50">
                                S3
                              </span>
                            )}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {mhs.jurusan}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {mhs.email}
                          </span>
                        </div>
                      </td>
                      
                      {/* Country & Uni */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="block font-semibold text-slate-700 dark:text-slate-300">
                            {mhs.universitas}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {mhs.negara}
                          </span>
                        </div>
                      </td>

                      {/* Entry Year */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {mhs.tahun_masuk}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(mhs)}
                            className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title="Edit Data"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(mhs)}
                            className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* 4. Modal: Add / Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100">
                {modalType === 'add' ? 'Tambah Data Mahasiswa' : 'Edit Data Mahasiswa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                
                {/* NIM */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    NIM (Nomor Induk)
                  </label>
                  <input
                    type="text"
                    value={formInputs.nim}
                    onChange={(e) => setFormInputs({ ...formInputs, nim: e.target.value })}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.nim ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. 10121001"
                    disabled={modalType === 'edit'}
                  />
                  {formErrors.nim && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.nim}</span>}
                </div>

                {/* Jenjang */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Jenjang Studi
                  </label>
                  <select
                    value={formInputs.jenjang}
                    onChange={(e) => setFormInputs({ ...formInputs, jenjang: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-5 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="S1">S1 (Bachelor)</option>
                    <option value="S2">S2 (Master)</option>
                    <option value="S3">S3 (PhD)</option>
                  </select>
                </div>

                {/* Nama */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formInputs.nama}
                    onChange={(e) => setFormInputs({ ...formInputs, nama: e.target.value })}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.nama ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. Ahmad Hidayat"
                  />
                  {formErrors.nama && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.nama}</span>}
                </div>

                {/* Universitas */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Universitas
                  </label>
                  <input
                    type="text"
                    value={formInputs.universitas}
                    onChange={(e) => setFormInputs({ ...formInputs, universitas: e.target.value })}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.universitas ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. University of Tokyo"
                  />
                  {formErrors.universitas && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.universitas}</span>}
                </div>

                {/* Negara */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Negara Tujuan
                  </label>
                  <input
                    type="text"
                    value={formInputs.negara}
                    onChange={(e) => setFormInputs({ ...formInputs, negara: e.target.value })}
                    list="countries-datalist"
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.negara ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. Jepang"
                  />
                  <datalist id="countries-datalist">
                    {POPULAR_COUNTRIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {formErrors.negara && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.negara}</span>}
                </div>

                {/* Tahun Masuk */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Tahun Masuk
                  </label>
                  <input
                    type="number"
                    value={formInputs.tahun_masuk}
                    onChange={(e) => setFormInputs({ ...formInputs, tahun_masuk: Number(e.target.value) })}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.tahun_masuk ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. 2024"
                  />
                  {formErrors.tahun_masuk && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.tahun_masuk}</span>}
                </div>

                {/* Jurusan */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Jurusan / Program Studi
                  </label>
                  <input
                    type="text"
                    value={formInputs.jurusan}
                    onChange={(e) => setFormInputs({ ...formInputs, jurusan: e.target.value })}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.jurusan ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. Teknik Informatika"
                  />
                  {formErrors.jurusan && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.jurusan}</span>}
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formInputs.email}
                    onChange={(e) => setFormInputs({ ...formInputs, email: e.target.value })}
                    className={`w-full px-3.5 py-2 text-sm bg-slate-5 dark:bg-slate-800 border ${formErrors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                    placeholder="e.g. ahmad@example.com"
                  />
                  {formErrors.email && <span className="text-[11px] text-rose-500 mt-1 block font-semibold">{formErrors.email}</span>}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  Simpan Data
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Delete Confirmation */}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-fade-in">
            <div className="inline-flex p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-850 dark:text-slate-100 font-display">Hapus Data Mahasiswa?</h4>
              <p className="text-sm text-slate-500 dark:text-slate-455">
                Apakah Anda yakin ingin menghapus data mahasiswa <strong className="text-slate-800 dark:text-slate-200">{deleteTarget.nama}</strong> (NIM: {deleteTarget.nim})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-4.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4.5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 rounded-xl transition-all shadow-md shadow-rose-600/20"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
