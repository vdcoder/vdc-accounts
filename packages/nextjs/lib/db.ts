import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

const DATABASE_URL_DB_POSTGRES = process.env.DATABASE_URL?.replaceAll('/railway', '/postgres');
console.log('Database URL Railway:', process.env.DATABASE_URL);
console.log('Database URL:', DATABASE_URL_DB_POSTGRES);

const pool = new Pool({
  connectionString: DATABASE_URL_DB_POSTGRES, // Adjust for Railway
  // Only use SSL in production
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Log pool errors for debugging
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
