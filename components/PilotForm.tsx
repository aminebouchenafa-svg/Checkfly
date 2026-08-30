'use client';

import { useState } from 'react';
import type { Pilot } from '@/lib/db';

const SIMULATOR_VALIDITY_MONTHS = 6;
const LINE_CHECK_VALIDITY_MONTHS = 12;

function toInputDate(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PilotForm({
  pilot,
  action,
  submitLabel
}: {
  pilot?: Pilot;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  const [simulatorLastCheck, setSimulatorLastCheck] = useState(toInputDate(pilot?.simulatorLastCheck ?? null));
  const [lineCheckLastCheck, setLineCheckLastCheck] = useState(toInputDate(pilot?.lineCheckLastCheck ?? null));

  return (
    <form action={action} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Prénom" required>
          <input
            name="firstName"
            defaultValue={pilot?.firstName}
            required
            className="input"
            placeholder="Ex : Karim"
          />
        </Field>
        <Field label="Nom" required>
          <input name="lastName" defaultValue={pilot?.lastName} required className="input" placeholder="Ex : Haddad" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Grade" required>
          <select name="rank" defaultValue={pilot?.rank ?? 'CDB'} required className="input">
            <option value="CDB">Commandant de bord (CDB)</option>
            <option value="OPL">Officier Pilote de Ligne (OPL)</option>
          </select>
        </Field>
        <Field label="Flotte">
          <input name="fleet" defaultValue={pilot?.fleet ?? 'B737NG'} className="input" />
        </Field>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Échéances</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Expiration de la licence">
            <input
              type="date"
              name="licenseExpiry"
              defaultValue={toInputDate(pilot?.licenseExpiry ?? null)}
              className="input"
            />
          </Field>
          <Field label="Expiration niveau anglais (OACI)">
            <input
              type="date"
              name="englishExpiry"
              defaultValue={toInputDate(pilot?.englishExpiry ?? null)}
              className="input"
            />
          </Field>
          <Field label="Date du dernier contrôle simulateur (OPC)">
            <input
              type="date"
              name="simulatorLastCheck"
              value={simulatorLastCheck}
              onChange={(e) => setSimulatorLastCheck(e.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">
              Validité {SIMULATOR_VALIDITY_MONTHS} mois
              {simulatorLastCheck && (
                <> — expire le <span className="font-medium text-gray-700">{addMonths(simulatorLastCheck, SIMULATOR_VALIDITY_MONTHS)}</span></>
              )}
            </p>
          </Field>
          <Field label="Date du dernier contrôle en ligne">
            <input
              type="date"
              name="lineCheckLastCheck"
              value={lineCheckLastCheck}
              onChange={(e) => setLineCheckLastCheck(e.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">
              Validité {LINE_CHECK_VALIDITY_MONTHS} mois
              {lineCheckLastCheck && (
                <> — expire le <span className="font-medium text-gray-700">{addMonths(lineCheckLastCheck, LINE_CHECK_VALIDITY_MONTHS)}</span></>
              )}
            </p>
          </Field>
        </div>
      </div>

      <Field label="Notes (optionnel)">
        <textarea name="notes" defaultValue={pilot?.notes ?? ''} rows={3} className="input" />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-5 py-2.5 text-white font-medium hover:bg-brand-700 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
