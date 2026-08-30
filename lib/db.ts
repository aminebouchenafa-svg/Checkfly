import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'checkfly.db');

declare global {
  // eslint-disable-next-line no-var
  var __checkflyDb: Database.Database | undefined;
}

export const db = global.__checkflyDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== 'production') {
  global.__checkflyDb = db;
}

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 15000');

db.exec(`
  CREATE TABLE IF NOT EXISTS pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    rank TEXT NOT NULL CHECK (rank IN ('CDB', 'OPL')),
    fleet TEXT NOT NULL DEFAULT 'B737NG',
    licenseExpiry TEXT,
    simulatorExpiry TEXT,
    lineCheckExpiry TEXT,
    englishExpiry TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_pilots_identity ON pilots (firstName, lastName, rank, fleet);
`);

export type Rank = 'CDB' | 'OPL';

export interface Pilot {
  id: number;
  firstName: string;
  lastName: string;
  rank: Rank;
  fleet: string;
  licenseExpiry: string | null;
  simulatorExpiry: string | null;
  lineCheckExpiry: string | null;
  englishExpiry: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getAllPilots(): Pilot[] {
  return db
    .prepare('SELECT * FROM pilots ORDER BY lastName COLLATE NOCASE ASC, firstName COLLATE NOCASE ASC')
    .all() as Pilot[];
}

export function getPilotById(id: number): Pilot | undefined {
  return db.prepare('SELECT * FROM pilots WHERE id = ?').get(id) as Pilot | undefined;
}

export interface PilotInput {
  firstName: string;
  lastName: string;
  rank: Rank;
  fleet: string;
  licenseExpiry: string | null;
  simulatorExpiry: string | null;
  lineCheckExpiry: string | null;
  englishExpiry: string | null;
  notes: string | null;
}

export function createPilot(input: PilotInput): number {
  const stmt = db.prepare(`
    INSERT INTO pilots (firstName, lastName, rank, fleet, licenseExpiry, simulatorExpiry, lineCheckExpiry, englishExpiry, notes)
    VALUES (@firstName, @lastName, @rank, @fleet, @licenseExpiry, @simulatorExpiry, @lineCheckExpiry, @englishExpiry, @notes)
  `);
  const result = stmt.run(input);
  return Number(result.lastInsertRowid);
}

export function updatePilot(id: number, input: PilotInput): void {
  const stmt = db.prepare(`
    UPDATE pilots SET
      firstName = @firstName,
      lastName = @lastName,
      rank = @rank,
      fleet = @fleet,
      licenseExpiry = @licenseExpiry,
      simulatorExpiry = @simulatorExpiry,
      lineCheckExpiry = @lineCheckExpiry,
      englishExpiry = @englishExpiry,
      notes = @notes,
      updatedAt = datetime('now')
    WHERE id = @id
  `);
  stmt.run({ ...input, id });
}

export function deletePilot(id: number): void {
  db.prepare('DELETE FROM pilots WHERE id = ?').run(id);
}

function seedDefaults(): void {
  // Fast path: skip entirely once seeded, so concurrent processes (e.g.
  // Next.js build workers) don't all pay for a multi-hundred-row transaction
  // and contend for the write lock at once.
  const { count } = db.prepare('SELECT COUNT(*) as count FROM pilots').get() as { count: number };
  if (count > 0) return;

  // INSERT OR IGNORE + the unique index above make this safe even if two
  // processes both pass the count check above at the same time.
  const insert = db.prepare(`
    INSERT OR IGNORE INTO pilots (firstName, lastName, rank, fleet, licenseExpiry, simulatorExpiry, lineCheckExpiry, englishExpiry, notes)
    VALUES (@firstName, @lastName, @rank, 'B737NG', NULL, NULL, NULL, NULL, NULL)
  `);
  const insertMany = db.transaction((pilots: { firstName: string; lastName: string; rank: Rank }[]) => {
    for (const pilot of pilots) insert.run(pilot);
  });

  // Lazy require avoids a circular import at module-eval time (seed-data.ts
  // only needs the PilotInput *type* from this file, erased at compile time).
  const { SEED_PILOTS } = require('./seed-data') as typeof import('./seed-data');
  insertMany(SEED_PILOTS);
}

seedDefaults();
