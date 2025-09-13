import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Explicitly select non-sensitive columns and order by creation if available
    const { rows } = await pool.query(
      `SELECT id, name, email, username, website, notes, status
       FROM accounts
       ORDER BY id DESC`
    );
    return NextResponse.json(rows);
  } catch (err: unknown) {
    console.error('Error fetching accounts:', err);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, username, password, website, notes, status } = data;
    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await pool.query(
      `INSERT INTO accounts (name, email, username, password, website, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, username, website, notes, status`,
      [name, email, username, password, website || null, notes || null, status || 'active']
    );
    return NextResponse.json(result.rows[0]);
  } catch (err: unknown) {
    console.error('Error creating account:', err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}