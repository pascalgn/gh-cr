import Database from "better-sqlite3";
import { databaseFile, ensureDataDirs } from "../paths";
import { migrate } from "./migrate";
import { schema } from "./schema";

let database: Database.Database | null = null;

/** Opens (once) the sqlite database, applying the schema and the pragmas we rely on. */
export function getDatabase(): Database.Database {
  if (database === null) {
    ensureDataDirs();
    const opened = new Database(databaseFile);
    opened.pragma("journal_mode = WAL");
    opened.pragma("foreign_keys = ON");
    opened.exec(schema);
    migrate(opened);
    database = opened;
  }
  return database;
}
