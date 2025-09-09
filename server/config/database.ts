// Use the existing database configuration from server/db.ts
export { pool, db } from '../db';

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Use the existing pool from db.ts
    const { pool } = await import('../db');
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Connection pool monitoring
export function getDatabaseStats() {
  // Use the existing pool from db.ts
  const { pool } = require('../db');
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount
  };
}