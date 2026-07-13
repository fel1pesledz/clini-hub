import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "clinihub.db")


def get_db():
    """Retorna uma conexão com row_factory para acessar colunas por nome."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Cria todas as tabelas se não existirem."""
    conn = get_db()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS patients (
            id        TEXT PRIMARY KEY,
            name      TEXT NOT NULL,
            cpf       TEXT NOT NULL UNIQUE,
            phone     TEXT,
            birth_date TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS doctors (
            id        TEXT PRIMARY KEY,
            name      TEXT NOT NULL,
            crm       TEXT NOT NULL UNIQUE,
            specialty TEXT NOT NULL,
            email     TEXT,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS rooms (
            id             TEXT PRIMARY KEY,
            name           TEXT NOT NULL,
            description    TEXT NOT NULL DEFAULT 'Geral',
            in_maintenance INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id               TEXT PRIMARY KEY,
            patient_id       TEXT NOT NULL REFERENCES patients(id),
            patient_name     TEXT NOT NULL,
            doctor_id        TEXT NOT NULL REFERENCES doctors(id),
            doctor_name      TEXT NOT NULL,
            room_id          TEXT NOT NULL REFERENCES rooms(id),
            room_name        TEXT NOT NULL,
            date_time        TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 20,
            status           TEXT NOT NULL DEFAULT 'scheduled'
        );

        CREATE TABLE IF NOT EXISTS ehr_records (
            id         TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES patients(id),
            doctor_id  TEXT NOT NULL REFERENCES doctors(id),
            date       TEXT NOT NULL,
            evolution  TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS doctor_schedules (
            doctor_name TEXT NOT NULL,
            slot        TEXT NOT NULL,
            PRIMARY KEY (doctor_name, slot)
        );
    """)

    conn.commit()
    conn.close()
    print("✅ Banco inicializado em", DB_PATH)
