import { Pool } from 'pg';

//console.log('Database URL:', process.env.DATABASE_URL);

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Set this in your .env file
  // Only use SSL in production
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Log pool errors for debugging
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
