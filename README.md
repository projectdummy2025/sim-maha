# SIM-MAHA (Sistem Informasi Mahasiswa Luar Negeri)

SIM-MAHA adalah aplikasi web sederhana yang dirancang untuk mendata dan memonitor mahasiswa Indonesia yang sedang menempuh pendidikan di luar negeri. Aplikasi ini mendukung fitur CRUD lengkap dengan antarmuka dasbor (*dashboard*) modern dan responsif.

---

## Tech Stack & Arsitektur

Aplikasi ini dibangun menggunakan arsitektur 3-tier:

1. **Frontend (Port 3000)**:
   - React (TypeScript) via **Vite JS**
   - **Tailwind CSS v4** untuk styling (dilengkapi mode gelap/terang kustom & efek glassmorphism)
   - **Lucide React** untuk ikon antarmuka

2. **Backend (Port 5000)**:
   - **Express.js** (Node.js) menggunakan ES Modules (`import`/`export`)
   - **node-postgres (pg)** sebagai client database PostgreSQL
   - **dotenv** & **morgan** untuk konfigurasi env dan logging HTTP

3. **Database (Port 5432)**:
   - **PostgreSQL 16** yang berjalan di dalam kontainer berbasis **Alpine Linux** (`postgres:16-alpine`) untuk keandalan dan penggunaan resource yang minimal.

```
┌──────────────────────────┐      proxy (/api)      ┌──────────────────────────┐
│      Vite Frontend       ├───────────────────────>│      Express Backend     │
│   (http://localhost:3000)│                        │   (http://localhost:5000)│
└──────────────────────────┘                        └─────────────┬────────────┘
                                                                  │ connection
                                                                  ▼
                                                    ┌──────────────────────────┐
                                                    │    PostgreSQL Alpine     │
                                                    │        (Port 5432)       │
                                                    └──────────────────────────┘
```

---

## Skema Database (`mahasiswa`)

Tabel `mahasiswa` dibuat secara otomatis ketika backend dijalankan untuk pertama kali (*auto-migration*). Jika database kosong, sistem juga akan otomatis memasukkan data dummy awal (*seeding*).

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `SERIAL` | Primary Key (Auto Increment) |
| `nim` | `VARCHAR(50)` | Nomor Induk Mahasiswa (Unique, Not Null) |
| `nama` | `VARCHAR(100)` | Nama lengkap mahasiswa (Not Null) |
| `universitas`| `VARCHAR(150)` | Nama universitas tujuan (Not Null) |
| `negara` | `VARCHAR(100)` | Negara tujuan studi (Not Null) |
| `jurusan` | `VARCHAR(100)` | Program studi / Jurusan (Not Null) |
| `jenjang` | `VARCHAR(20)` | Jenjang pendidikan: S1, S2, S3 (Not Null) |
| `tahun_masuk`| `INTEGER` | Tahun mulai studi (Not Null) |
| `email` | `VARCHAR(100)` | Alamat email mahasiswa (Not Null) |
| `created_at` | `TIMESTAMP` | Waktu pencatatan data (Default: Current Timestamp) |

---

## API Endpoints (REST API)

| Method | Endpoint | Deskripsi | Parameter Query |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/mahasiswa` | Mendapatkan daftar seluruh mahasiswa | `search`, `negara`, `jenjang` |
| **GET** | `/api/mahasiswa/:id`| Mendapatkan detail satu mahasiswa berdasarkan ID | - |
| **GET** | `/api/mahasiswa/stats`| Mendapatkan statistik dasbor (total mahasiswa, negara, & rasio jenjang) | - |
| **POST** | `/api/mahasiswa` | Menambahkan data mahasiswa baru | - (Body JSON) |
| **PUT** | `/api/mahasiswa/:id`| Memperbarui data mahasiswa berdasarkan ID | - (Body JSON) |
| **DELETE**| `/api/mahasiswa/:id`| Menghapus data mahasiswa berdasarkan ID | - |

### Format JSON Input (POST / PUT)
```json
{
  "nim": "12345678",
  "nama": "Farhan Zulkarnaen",
  "universitas": "University of Cambridge",
  "negara": "Inggris",
  "jurusan": "Ilmu Komputer",
  "jenjang": "S2",
  "tahun_masuk": 2025,
  "email": "farhan.z@example.com"
}
```

---

## Petunjuk Setup & Instalasi

### Prasyarat
Pastikan Anda sudah menginstal alat berikut di sistem Anda:
- Node.js (v18 ke atas)
- Podman (atau Docker) beserta `podman-compose` (atau `docker-compose`)

### Langkah 1: Jalankan Database (PostgreSQL)
Jalankan kontainer postgres di root proyek:
```bash
podman-compose up -d
```
*Catatan: Parameter koneksi seperti user, password, dan nama database diatur pada berkas `docker-compose.yml`.*

### Langkah 2: Setup & Jalankan Backend
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Konfigurasikan file `.env` (sudah disediakan secara otomatis):
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:secretpassword@localhost:5432/db_mahasiswa
   ```
4. Jalankan backend dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   *Server backend akan mendeteksi database, membuat tabel mahasiswa jika belum ada, memasukkan data seeding, dan berjalan di port 5000.*

### Langkah 3: Setup & Jalankan Frontend
1. Masuk ke direktori frontend:
   ```bash
   cd ../frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan aplikasi frontend:
   ```bash
   npm run dev
   ```
   *Vite server akan aktif di http://localhost:3000/.*

---

## Fitur Utama Antarmuka

1. **Dashboard Widgets**:
   - Total Mahasiswa & Negara Tujuan yang ter-update secara dinamis.
   - Grafik distribusi rasio jenjang (S1/S2/S3) berbasis progress-bar modern.
   - Tampilan peringkat negara tujuan terpopuler.
2. **Pencarian & Filter Terpadu**:
   - Kotak pencarian interaktif untuk melacak nama, NIM, universitas, atau jurusan dengan metode *debounce* (mencegah beban API berlebih).
   - Dropdown untuk memfilter data berdasarkan Negara Tujuan dan Jenjang Pendidikan.
3. **Formulir Interaktif & Validasi**:
   - Form pembuatan & pengeditan data mahasiswa yang memvalidasi format email, kelengkapan kolom, dan batasan tahun masuk.
   - Deteksi NIM duplikat untuk menjaga integritas data.
   - Modal dialog konfirmasi sebelum menghapus data untuk mencegah penghapusan yang tidak disengaja.
4. **UI Gelap/Terang**:
   - Tombol toggle untuk beralih mode warna secara instan dengan efek transisi warna yang halus.
