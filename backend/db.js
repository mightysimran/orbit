const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool to your Supabase database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase cloud databases often require SSL. 
  // If you get an error later, uncomment the line below:
  // ssl: { rejectUnauthorized: false }
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to the Database:', err.message);
  } else {
    console.log('🐘 Successfully connected to PostgreSQL (Supabase)!');
    release(); // Release the client back to the pool
  }
});

module.exports = pool;