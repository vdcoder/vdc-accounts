import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = '1234';
const COOKIE_NAME = 'vdcoder_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== PASSWORD) {
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  }
  const token = generateToken();
  const res = NextResponse.json({ success: true, token });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
