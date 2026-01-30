import Database from "better-sqlite3";
const db = new Database("./sqlite.db");

// BetterAuth 1.4 + Admin Plugin Schema for SQLite
const schema = `
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified BOOLEAN NOT NULL,
    image TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    role TEXT DEFAULT 'user',
    initRole TEXT,
    banned BOOLEAN DEFAULT 0,
    banReason TEXT,
    banExpires DATETIME
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt DATETIME NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id),
    impersonatedBy TEXT
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id),
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt DATETIME,
    refreshTokenExpiresAt DATETIME,
    scope TEXT,
    password TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME,
    updatedAt DATETIME
);
`;

function init() {
    console.log("🛠️  Initializing Complete BetterAuth + Admin Schema...");
    db.exec(schema);
    console.log("✅ Tables synchronized successfully.");
}

init();
db.close();
