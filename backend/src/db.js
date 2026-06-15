import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Skrip migrasi untuk membuat tabel mahasiswa jika belum ada
export const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS mahasiswa (
      id SERIAL PRIMARY KEY,
      nim VARCHAR(50) UNIQUE NOT NULL,
      nama VARCHAR(100) NOT NULL,
      universitas VARCHAR(150) NOT NULL,
      negara VARCHAR(100) NOT NULL,
      jurusan VARCHAR(100) NOT NULL,
      jenjang VARCHAR(20) NOT NULL,
      tahun_masuk INTEGER NOT NULL,
      email VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    await client.query(queryText);
    console.log('Database initialized successfully: Table "mahasiswa" is ready.');
    
    // Check if table is empty, seed some initial data for visual demo if empty
    const res = await client.query('SELECT COUNT(*) FROM mahasiswa');
    if (parseInt(res.rows[0].count, 10) === 0) {
      console.log('Seeding initial data...');
      const seedQuery = `
        INSERT INTO mahasiswa (nim, nama, universitas, negara, jurusan, jenjang, tahun_masuk, email) VALUES
        ('10121001', 'Ahmad Hidayat', 'University of Tokyo', 'Jepang', 'Teknik Informatika', 'S2', 2024, 'ahmad.hidayat@example.com'),
        ('10121002', 'Budi Santoso', 'Massachusetts Institute of Technology', 'Amerika Serikat', 'Teknik Elektro', 'S3', 2023, 'budi.santoso@example.com'),
        ('10121003', 'Citra Lestari', 'Nanyang Technological University', 'Singapura', 'Sistem Informasi', 'S1', 2025, 'citra.lestari@example.com'),
        ('10121004', 'Dian Pratama', 'Technische Universität München', 'Jerman', 'Teknik Mesin', 'S2', 2024, 'dian.pratama@example.com'),
        ('10121005', 'Elisa Putri', 'Australian National University', 'Australia', 'Hubungan Internasional', 'S1', 2023, 'elisa.putri@example.com');
      `;
      await client.query(seedQuery);
      console.log('Seed data added successfully.');
    }
    
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

export default pool;
