'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPilot, deletePilot, updatePilot, type PilotInput, type Rank } from './db';

function readInput(formData: FormData): PilotInput {
  const rank = formData.get('rank') as Rank;
  if (rank !== 'CDB' && rank !== 'OPL') {
    throw new Error('Grade invalide');
  }
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  if (!firstName || !lastName) {
    throw new Error('Le prénom et le nom sont obligatoires');
  }

  const emptyToNull = (value: FormDataEntryValue | null) => {
    const str = value ? String(value).trim() : '';
    return str.length > 0 ? str : null;
  };

  return {
    firstName,
    lastName,
    rank,
    fleet: String(formData.get('fleet') ?? 'B737NG').trim() || 'B737NG',
    licenseExpiry: emptyToNull(formData.get('licenseExpiry')),
    simulatorExpiry: emptyToNull(formData.get('simulatorExpiry')),
    lineCheckExpiry: emptyToNull(formData.get('lineCheckExpiry')),
    englishExpiry: emptyToNull(formData.get('englishExpiry')),
    notes: emptyToNull(formData.get('notes'))
  };
}

export async function createPilotAction(formData: FormData) {
  const input = readInput(formData);
  createPilot(input);
  revalidatePath('/');
  revalidatePath('/pilots');
  redirect('/pilots');
}

export async function updatePilotAction(id: number, formData: FormData) {
  const input = readInput(formData);
  updatePilot(id, input);
  revalidatePath('/');
  revalidatePath('/pilots');
  revalidatePath(`/pilots/${id}`);
  redirect('/pilots');
}

export async function deletePilotAction(id: number) {
  deletePilot(id);
  revalidatePath('/');
  revalidatePath('/pilots');
  redirect('/pilots');
}
