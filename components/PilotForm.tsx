import type { Pilot } from '@/lib/db';

function toInputDate(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
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
          <Field label="Expiration contrôle simulateur (OPC)">
            <input
              type="date"
              name="simulatorExpiry"
              defaultValue={toInputDate(pilot?.simulatorExpiry ?? null)}
              className="input"
            />
          </Field>
          <Field label="Expiration contrôle en ligne">
            <input
              type="date"
              name="lineCheckExpiry"
              defaultValue={toInputDate(pilot?.lineCheckExpiry ?? null)}
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
