// Generates a static JSON snapshot of the pilot roster for the editable
// dashboard artifact (raw dates only — the page computes days-remaining and
// urgency itself, live, from the viewer's clock). Re-run whenever
// lib/seed-data.ts changes.
import { writeFileSync } from 'fs';
import { SEED_PILOTS } from '../lib/seed-data';

const output = {
  generatedAt: new Date().toISOString(),
  pilots: SEED_PILOTS.map((p) => ({
    firstName: p.firstName,
    lastName: p.lastName,
    rank: p.rank,
    licenseExpiry: p.licenseExpiry ?? null,
    simulatorLastCheck: null as string | null,
    lineCheckLastCheck: null as string | null,
    englishExpiry: null as string | null
  }))
};

writeFileSync(process.argv[2] ?? 'roster-export.json', JSON.stringify(output));
console.log(`Exported ${output.pilots.length} pilots`);
