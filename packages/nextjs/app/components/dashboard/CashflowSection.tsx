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
  ended_on: string; // ISO date

  account_name: string; // from join
};

async function getRecurrentAdjustments(): Promise<RecurrentAdjustment[]> {
  const { rows } = await pool.query(
    `SELECT 
        ara.id, ara.account_id, ara.value_type, ara.value::text, ara.frecuency, ara.started_on::text, ara.entered_on::text, ara.label, ara.notes, ara.status, ara.ended_on::text,
        a.name as account_name
     FROM account_recurrent_adjustments ara
     JOIN accounts a ON ara.account_id = a.id
     WHERE ara.status IS NULL OR ara.status = 'ACTIVE'
     ORDER BY ara.id DESC`
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
