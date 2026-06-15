import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool, { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Inisialisasi Database
try {
  await initDb();
} catch (err) {
  console.error('Failed to initialize database. Exiting...', err);
  process.exit(1);
}

// 1. GET /api/mahasiswa/stats - Mengambil statistik dashboard
app.get('/api/mahasiswa/stats', async (req, res) => {
  try {
    const totalRes = await pool.query('SELECT COUNT(*)::integer as count FROM mahasiswa');
    const negaraRes = await pool.query('SELECT COUNT(DISTINCT negara)::integer as count FROM mahasiswa');
    
    // Distribusi jenjang
    const jenjangRes = await pool.query(
      'SELECT jenjang, COUNT(*)::integer as count FROM mahasiswa GROUP BY jenjang'
    );
    
    // Distribusi negara
    const negaraDistRes = await pool.query(
      'SELECT negara, COUNT(*)::integer as count FROM mahasiswa GROUP BY negara ORDER BY count DESC'
    );

    res.json({
      totalMahasiswa: totalRes.rows[0].count,
      totalNegara: negaraRes.rows[0].count,
      jenjangStats: jenjangRes.rows,
      negaraStats: negaraDistRes.rows,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Gagal mengambil data statistik' });
  }
});

// 2. GET /api/mahasiswa - Mengambil semua data mahasiswa (dengan filter & search)
app.get('/api/mahasiswa', async (req, res) => {
  try {
    const { search, negara, jenjang } = req.query;
    
    let query = 'SELECT * FROM mahasiswa WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (nama ILIKE $${paramIndex} OR nim ILIKE $${paramIndex} OR universitas ILIKE $${paramIndex} OR jurusan ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (negara) {
      query += ` AND negara = $${paramIndex}`;
      values.push(negara);
      paramIndex++;
    }

    if (jenjang) {
      query += ` AND jenjang = $${paramIndex}`;
      values.push(jenjang);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Gagal mengambil data mahasiswa' });
  }
});

// 3. GET /api/mahasiswa/:id - Detail mahasiswa berdasarkan ID
app.get('/api/mahasiswa/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM mahasiswa WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data mahasiswa tidak ditemukan' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching student detail:', err);
    res.status(500).json({ error: 'Gagal mengambil detail mahasiswa' });
  }
});

// 4. POST /api/mahasiswa - Menambah mahasiswa baru
app.post('/api/mahasiswa', async (req, res) => {
  const { nim, nama, universitas, negara, jurusan, jenjang, tahun_masuk, email } = req.body;

  // Validasi input sederhana
  if (!nim || !nama || !universitas || !negara || !jurusan || !jenjang || !tahun_masuk || !email) {
    return res.status(400).json({ error: 'Semua kolom data harus diisi' });
  }

  try {
    // Cek apakah NIM sudah terdaftar
    const checkNim = await pool.query('SELECT id FROM mahasiswa WHERE nim = $1', [nim]);
    if (checkNim.rows.length > 0) {
      return res.status(400).json({ error: 'NIM sudah terdaftar dalam sistem' });
    }

    const insertQuery = `
      INSERT INTO mahasiswa (nim, nama, universitas, negara, jurusan, jenjang, tahun_masuk, email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [nim, nama, universitas, negara, jurusan, jenjang, tahun_masuk, email]);
    
    res.status(201).json({
      message: 'Data mahasiswa berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Gagal menambahkan data mahasiswa' });
  }
});

// 5. PUT /api/mahasiswa/:id - Mengupdate data mahasiswa
app.put('/api/mahasiswa/:id', async (req, res) => {
  const { id } = req.params;
  const { nim, nama, universitas, negara, jurusan, jenjang, tahun_masuk, email } = req.body;

  if (!nim || !nama || !universitas || !negara || !jurusan || !jenjang || !tahun_masuk || !email) {
    return res.status(400).json({ error: 'Semua kolom data harus diisi' });
  }

  try {
    // Cek apakah ID ada
    const checkId = await pool.query('SELECT id FROM mahasiswa WHERE id = $1', [id]);
    if (checkId.rows.length === 0) {
      return res.status(404).json({ error: 'Data mahasiswa tidak ditemukan' });
    }

    // Cek konflik NIM dengan mahasiswa lain
    const checkNim = await pool.query('SELECT id FROM mahasiswa WHERE nim = $1 AND id != $2', [nim, id]);
    if (checkNim.rows.length > 0) {
      return res.status(400).json({ error: 'NIM sudah digunakan oleh mahasiswa lain' });
    }

    const updateQuery = `
      UPDATE mahasiswa 
      SET nim = $1, nama = $2, universitas = $3, negara = $4, jurusan = $5, jenjang = $6, tahun_masuk = $7, email = $8
      WHERE id = $9
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [nim, nama, universitas, negara, jurusan, jenjang, tahun_masuk, email, id]);

    res.json({
      message: 'Data mahasiswa berhasil diperbarui',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ error: 'Gagal memperbarui data mahasiswa' });
  }
});

// 6. DELETE /api/mahasiswa/:id - Menghapus mahasiswa
app.delete('/api/mahasiswa/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM mahasiswa WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data mahasiswa tidak ditemukan' });
    }

    res.json({
      message: 'Data mahasiswa berhasil dihapus',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Gagal menghapus data mahasiswa' });
  }
});

// Server listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
