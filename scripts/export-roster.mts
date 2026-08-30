// Generates a static JSON snapshot of the pilot roster (with computed check
// statuses) for publishing as a read-only dashboard artifact. Re-run this
// whenever lib/seed-data.ts changes.
import { writeFileSync } from 'fs';
import { SEED_PILOTS } from '../lib/seed-data';
import { withStatus, rankLabel } from '../lib/alerts';
import type { Pilot } from '../lib/db';

const now = new Date();

const pilots: Pilot[] = SEED_PILOTS.map((p, i) => ({
  id: i + 1,
  firstName: p.firstName,
  lastName: p.lastName,
  rank: p.rank,
  fleet: 'B737NG',
  licenseExpiry: p.licenseExpiry ?? null,
  simulatorLastCheck: null,
  simulatorExpiry: null,
  lineCheckLastCheck: null,
  lineCheckExpiry: null,
  englishExpiry: null,
  notes: null,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));

const withChecks = withStatus(pilots, now);

const output = {
  generatedAt: now.toISOString(),
  totalCount: pilots.length,
  cdbCount: pilots.filter((p) => p.rank === 'CDB').length,
  oplCount: pilots.filter((p) => p.rank === 'OPL').length,
  pilots: withChecks.map((p) => ({
    firstName: p.firstName,
    lastName: p.lastName,
    rank: p.rank,
    rankLabel: rankLabel(p.rank),
    checks: p.checks.map((c) => ({ key: c.key, label: c.label, date: c.date, daysRemaining: c.daysRemaining, urgency: c.urgency })),
    worstUrgency: p.worstUrgency
  }))
};

writeFileSync(process.argv[2] ?? 'roster-export.json', JSON.stringify(output));
console.log(`Exported ${pilots.length} pilots (${output.cdbCount} CDB, ${output.oplCount} OPL)`);
