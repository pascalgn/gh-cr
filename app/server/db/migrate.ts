import type Database from "better-sqlite3";

interface ColumnAddition {
  table: string;
  column: string;
  definition: string;
}

/**
 * Columns added after the first release. The schema itself only runs for a new
 * database, so existing ones pick these up here instead of being recreated.
 */
const ADDITIONS: ColumnAddition[] = [
  {
    table: "review_threads",
    column: "original_start_line",
    definition: "INTEGER",
  },
];

/** Brings an existing database up to the current schema, preserving its data. */
export function migrate(database: Database.Database): void {
  for (const { table, column, definition } of ADDITIONS) {
    const columns = database.prepare(`PRAGMA table_info(${table})`).all() as {
      name: string;
    }[];
    if (!columns.some((existing) => existing.name === column)) {
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}
