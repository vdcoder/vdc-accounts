import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const { rows } = await pool.query('SELECT * FROM accounts');
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const data = await request.json();
  const { name, email, username, password, website, notes, status } = data;
  const result = await pool.query(
    `INSERT INTO accounts (name, email, username, password, website, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, email, username, password, website, notes, status]
  );
  return NextResponse.json(result.rows[0]);
}