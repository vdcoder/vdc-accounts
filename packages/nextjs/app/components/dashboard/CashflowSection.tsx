import pool from '@/lib/db';
import CashflowClient from './CashflowSectionClient';

export type RecurrentAdjustment = {
  id: number;
  account_id: number;
  value_type: string; // e.g. 'amount'
  value: string; // keep as string from PG, convert client-side number parseFloat
  frecuency: string; // (typo in schema, keep as-is)
  started_on: string; // ISO date
  entered_on: string | null;
  label: string | null;
  notes: string | null;
  status: string | null;
};

async function getRecurrentAdjustments(): Promise<RecurrentAdjustment[]> {
  const { rows } = await pool.query(
    `SELECT id, account_id, value_type, value::text, frecuency, started_on::text, entered_on::text, label, notes, status
     FROM account_recurrent_adjustments
     WHERE status IS NULL OR status = 'ACTIVE'
     ORDER BY id DESC`
  );
  return rows;
}

export default async function CashflowSection() {
  let adjustments: RecurrentAdjustment[] = [];
  let error: string | undefined;
  try {
    adjustments = await getRecurrentAdjustments();
  } catch (e) {
    error = 'Failed to load recurrent adjustments' + (e instanceof Error ? `: ${e.message}` : '');
  }
  return <CashflowClient adjustments={adjustments} error={error} />;
}
