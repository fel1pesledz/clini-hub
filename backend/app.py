import os
import uuid
import bcrypt
from datetime import timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from dotenv import load_dotenv

from db import get_db, init_db

# ─── Setup ───────────────────────────────────────────────────────────────────

load_dotenv()

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
jwt = JWTManager(app)

# Inicializa o banco ao subir o servidor
with app.app_context():
    init_db()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

def new_id():
    return str(uuid.uuid4())[:9]


# ─── AUTH ─────────────────────────────────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def login():
    """
    Body: { "role": "admin" | "doctor", "password": "...", "doctorId": "..." }
    Retorna JWT com { role, doctorId? } nos claims.
    """
    data = request.get_json()
    role = data.get("role")
    password = data.get("password", "")

    if role == "admin":
        admin_pw = os.getenv("ADMIN_PASSWORD", "admin123")
        if password != admin_pw:
            return jsonify({"error": "Senha incorreta"}), 401

        token = create_access_token(
            identity="admin",
            additional_claims={"role": "admin"},
        )
        return jsonify({"token": token, "role": "admin", "name": "Administrador"})

    elif role == "doctor":
        doctor_id = data.get("doctorId")
        if not doctor_id:
            return jsonify({"error": "doctorId obrigatório"}), 400

        db = get_db()
        doctor = db.execute(
            "SELECT * FROM doctors WHERE id = ?", (doctor_id,)
        ).fetchone()
        db.close()

        if not doctor:
            return jsonify({"error": "Médico não encontrado"}), 404

        if not bcrypt.checkpw(password.encode(), doctor["password_hash"].encode()):
            return jsonify({"error": "Senha incorreta"}), 401

        token = create_access_token(
            identity=doctor_id,
            additional_claims={"role": "doctor", "doctorId": doctor_id},
        )
        return jsonify({
            "token": token,
            "role": "doctor",
            "doctorId": doctor_id,
            "name": doctor["name"],
        })

    return jsonify({"error": "Role inválido"}), 400


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    """Retorna os dados do usuário logado a partir do token."""
    claims = get_jwt()
    identity = get_jwt_identity()

    if claims.get("role") == "admin":
        return jsonify({"role": "admin", "name": "Administrador"})

    db = get_db()
    doctor = db.execute(
        "SELECT id, name, specialty FROM doctors WHERE id = ?", (identity,)
    ).fetchone()
    db.close()

    if not doctor:
        return jsonify({"error": "Médico não encontrado"}), 404

    return jsonify({
        "role": "doctor",
        "doctorId": doctor["id"],
        "name": doctor["name"],
        "specialty": doctor["specialty"],
    })


# ─── PATIENTS ────────────────────────────────────────────────────────────────

@app.route("/api/patients", methods=["GET"])
@jwt_required()
def get_patients():
    db = get_db()
    patients = rows_to_list(db.execute("SELECT * FROM patients ORDER BY name").fetchall())
    db.close()
    return jsonify(patients)


@app.route("/api/patients", methods=["POST"])
@jwt_required()
def create_patient():
    data = request.get_json()
    db = get_db()
    from datetime import datetime
    pid = new_id()
    db.execute(
        "INSERT INTO patients (id, name, cpf, phone, birth_date, created_at) VALUES (?,?,?,?,?,?)",
        (pid, data["name"], data.get("cpf", ""), data.get("phone", ""),
         data.get("birthDate", ""), datetime.utcnow().isoformat()),
    )
    db.commit()
    patient = row_to_dict(db.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone())
    db.close()
    return jsonify(patient), 201


@app.route("/api/patients/<pid>", methods=["DELETE"])
@jwt_required()
def delete_patient(pid):
    db = get_db()
    db.execute("DELETE FROM patients WHERE id=?", (pid,))
    db.commit()
    db.close()
    return jsonify({"deleted": pid})


# ─── DOCTORS ─────────────────────────────────────────────────────────────────
# Rota pública — só retorna id, name e specialty (sem dados sensíveis)
@app.route("/api/doctors/public", methods=["GET"])
def get_doctors_public():
    db = get_db()
    doctors = rows_to_list(
        db.execute("SELECT id, name, specialty FROM doctors ORDER BY name").fetchall()
    )
    db.close()
    return jsonify(doctors)

@app.route("/api/doctors", methods=["GET"])
@jwt_required()
def get_doctors():
    db = get_db()
    # Não retorna password_hash para o frontend
    doctors = rows_to_list(
        db.execute("SELECT id, name, crm, specialty, email FROM doctors ORDER BY name").fetchall()
    )
    db.close()
    return jsonify(doctors)


@app.route("/api/doctors", methods=["POST"])
@jwt_required()
def create_doctor():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Apenas admin pode cadastrar médicos"}), 403

    data = request.get_json()
    password = data.get("password", "")
    if not password:
        return jsonify({"error": "Senha obrigatória"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    did = f"dr-{new_id()}"

    db = get_db()
    # Verifica CRM duplicado
    existing = db.execute("SELECT id FROM doctors WHERE crm=?", (data["crm"],)).fetchone()
    if existing:
        db.close()
        return jsonify({"error": "CRM já cadastrado"}), 409

    db.execute(
        "INSERT INTO doctors (id, name, crm, specialty, email, password_hash) VALUES (?,?,?,?,?,?)",
        (did, data["name"], data["crm"], data.get("specialty", "Clínica Médica"),
         data.get("email", ""), hashed),
    )
    db.commit()
    doctor = row_to_dict(
        db.execute("SELECT id, name, crm, specialty, email FROM doctors WHERE id=?", (did,)).fetchone()
    )
    db.close()
    return jsonify(doctor), 201


@app.route("/api/doctors/<did>", methods=["DELETE"])
@jwt_required()
def delete_doctor(did):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Apenas admin pode excluir médicos"}), 403

    db = get_db()
    db.execute("DELETE FROM doctors WHERE id=?", (did,))
    db.commit()
    db.close()
    return jsonify({"deleted": did})


# ─── ROOMS ───────────────────────────────────────────────────────────────────

@app.route("/api/rooms", methods=["GET"])
@jwt_required()
def get_rooms():
    db = get_db()
    rooms = rows_to_list(db.execute("SELECT * FROM rooms ORDER BY name").fetchall())
    db.close()
    # SQLite retorna 0/1 para booleanos — converter
    for r in rooms:
        r["inMaintenance"] = bool(r.pop("in_maintenance", 0))
    return jsonify(rooms)


@app.route("/api/rooms", methods=["POST"])
@jwt_required()
def create_room():
    data = request.get_json()
    rid = f"sala-{new_id()}"
    db = get_db()
    db.execute(
        "INSERT INTO rooms (id, name, description, in_maintenance) VALUES (?,?,?,?)",
        (rid, data["name"], data.get("description", "Geral"), 0),
    )
    db.commit()
    room = row_to_dict(db.execute("SELECT * FROM rooms WHERE id=?", (rid,)).fetchone())
    db.close()
    room["inMaintenance"] = bool(room.pop("in_maintenance", 0))
    return jsonify(room), 201


@app.route("/api/rooms/<rid>", methods=["PATCH"])
@jwt_required()
def update_room(rid):
    data = request.get_json()
    db = get_db()
    if "inMaintenance" in data:
        db.execute(
            "UPDATE rooms SET in_maintenance=? WHERE id=?",
            (1 if data["inMaintenance"] else 0, rid),
        )
    db.commit()
    room = row_to_dict(db.execute("SELECT * FROM rooms WHERE id=?", (rid,)).fetchone())
    db.close()
    room["inMaintenance"] = bool(room.pop("in_maintenance", 0))
    return jsonify(room)


@app.route("/api/rooms/<rid>", methods=["DELETE"])
@jwt_required()
def delete_room(rid):
    db = get_db()
    db.execute("DELETE FROM rooms WHERE id=?", (rid,))
    db.commit()
    db.close()
    return jsonify({"deleted": rid})


# ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

@app.route("/api/appointments", methods=["GET"])
@jwt_required()
def get_appointments():
    db = get_db()
    apps = rows_to_list(
        db.execute("SELECT * FROM appointments ORDER BY date_time").fetchall()
    )
    db.close()
    # Converter snake_case → camelCase para o frontend
    result = []
    for a in apps:
        result.append({
            "id": a["id"],
            "patientId": a["patient_id"],
            "patientName": a["patient_name"],
            "doctorId": a["doctor_id"],
            "doctorName": a["doctor_name"],
            "roomId": a["room_id"],
            "roomName": a["room_name"],
            "dateTime": a["date_time"],
            "durationMinutes": a["duration_minutes"],
            "status": a["status"],
        })
    return jsonify(result)


@app.route("/api/appointments", methods=["POST"])
@jwt_required()
def create_appointment():
    data = request.get_json()
    db = get_db()

    # Checar conflito de horário
    new_start = data["dateTime"]
    duration = data.get("durationMinutes", 20)

    conflict = db.execute("""
        SELECT id FROM appointments
        WHERE status != 'cancelled'
          AND (doctor_id = ? OR room_id = ?)
          AND date_time < datetime(?, '+' || ? || ' minutes')
          AND datetime(date_time, '+' || duration_minutes || ' minutes') > ?
    """, (
        data["doctorId"], data["roomId"],
        new_start, str(duration),
        new_start,
    )).fetchone()

    if conflict:
        db.close()
        return jsonify({"error": "Choque de horário"}), 409

    aid = new_id()
    db.execute("""
        INSERT INTO appointments
          (id, patient_id, patient_name, doctor_id, doctor_name,
           room_id, room_name, date_time, duration_minutes, status)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        aid,
        data["patientId"], data["patientName"],
        data["doctorId"], data["doctorName"],
        data["roomId"], data["roomName"],
        data["dateTime"], duration,
        data.get("status", "scheduled"),
    ))
    db.commit()
    db.close()
    return jsonify({"id": aid, **data}), 201


@app.route("/api/appointments/<aid>", methods=["DELETE"])
@jwt_required()
def delete_appointment(aid):
    db = get_db()
    db.execute("DELETE FROM appointments WHERE id=?", (aid,))
    db.commit()
    db.close()
    return jsonify({"deleted": aid})


# ─── EHR ─────────────────────────────────────────────────────────────────────

@app.route("/api/ehr", methods=["GET"])
@jwt_required()
def get_ehr():
    claims = get_jwt()
    db = get_db()

    if claims.get("role") == "admin":
        records = rows_to_list(db.execute("SELECT * FROM ehr_records ORDER BY date DESC").fetchall())
    else:
        doctor_id = get_jwt_identity()
        records = rows_to_list(
            db.execute(
                "SELECT * FROM ehr_records WHERE doctor_id=? ORDER BY date DESC",
                (doctor_id,),
            ).fetchall()
        )
    db.close()

    result = []
    for r in records:
        result.append({
            "id": r["id"],
            "patientId": r["patient_id"],
            "doctorId": r["doctor_id"],
            "date": r["date"],
            "evolution": r["evolution"],
        })
    return jsonify(result)


@app.route("/api/ehr", methods=["POST"])
@jwt_required()
def create_ehr():
    data = request.get_json()
    from datetime import datetime
    rid = new_id()
    db = get_db()
    db.execute(
        "INSERT INTO ehr_records (id, patient_id, doctor_id, date, evolution) VALUES (?,?,?,?,?)",
        (rid, data["patientId"], data["doctorId"], datetime.utcnow().isoformat(), data["evolution"]),
    )
    db.commit()
    db.close()
    return jsonify({"id": rid, **data}), 201


# ─── SCHEDULES ───────────────────────────────────────────────────────────────

@app.route("/api/schedules/<doctor_name>", methods=["GET"])
@jwt_required()
def get_schedule(doctor_name):
    db = get_db()
    rows = db.execute(
        "SELECT slot FROM doctor_schedules WHERE doctor_name=?", (doctor_name,)
    ).fetchall()
    db.close()
    return jsonify([r["slot"] for r in rows])


@app.route("/api/schedules/<doctor_name>", methods=["PUT"])
@jwt_required()
def update_schedule(doctor_name):
    slots = request.get_json()  # lista de strings ex: ["0-08:00", "0-08:20"]
    db = get_db()
    db.execute("DELETE FROM doctor_schedules WHERE doctor_name=?", (doctor_name,))
    for slot in slots:
        db.execute(
            "INSERT OR IGNORE INTO doctor_schedules (doctor_name, slot) VALUES (?,?)",
            (doctor_name, slot),
        )
    db.commit()
    db.close()
    return jsonify({"saved": len(slots)})


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(port=5000, debug=True)
