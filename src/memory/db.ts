import Database from "better-sqlite3";

export const db = new Database("memory.db");

// Vendor memory table
db.prepare(`
  CREATE TABLE IF NOT EXISTS vendor_memory (
    id TEXT PRIMARY KEY,
    vendorName TEXT,
    patterns TEXT,
    confidence REAL,
    usageCount INTEGER,
    createdAt TEXT,
    lastUsedAt TEXT,
    decayRate REAL,
    active INTEGER
  )
`).run();

// Correction memory table
db.prepare(`
  CREATE TABLE IF NOT EXISTS correction_memory (
    id TEXT PRIMARY KEY,
    trigger TEXT,
    action TEXT,
    applicableVendors TEXT,
    confidence REAL,
    usageCount INTEGER,
    createdAt TEXT,
    lastUsedAt TEXT,
    decayRate REAL,
    active INTEGER
  )
`).run();