import os
import uuid
import bcrypt
from datetime import timedelta, datetime

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

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM doctors WHERE id = %s", (doctor_id,))
        doctor = cur.fetchone()
        cur.close()
        conn.close()

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
    claims = get_jwt()
    identity = get_jwt_identity()

    if claims.get("role") == "admin":
        return jsonify({"role": "admin", "name": "Administrador"})

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, specialty FROM doctors WHERE id = %s", (identity,))
    doctor = cur.fetchone()
    cur.close()
    conn.close()

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
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM patients ORDER BY name")
    patients = rows_to_list(cur.fetchall())
    cur.close()
    conn.close()
    return jsonify(patients)


@app.route("/api/patients", methods=["POST"])
@jwt_required()
def create_patient():
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    pid = new_id()
    cur.execute(
        "INSERT INTO patients (id, name, cpf, phone, birth_date, created_at) VALUES (%s,%s,%s,%s,%s,%s)",
        (pid, data["name"], data.get("cpf", ""), data.get("phone", ""),
         data.get("birthDate", ""), datetime.utcnow().isoformat()),
    )
    conn.commit()
    cur.execute("SELECT * FROM patients WHERE id=%s", (pid,))
    patient = row_to_dict(cur.fetchone())
    cur.close()
    conn.close()
    return jsonify(patient), 201


@app.route("/api/patients/<pid>", methods=["DELETE"])
@jwt_required()
def delete_patient(pid):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM patients WHERE id=%s", (pid,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"deleted": pid})


# ─── DOCTORS ─────────────────────────────────────────────────────────────────

@app.route("/api/doctors/public", methods=["GET"])
def get_doctors_public():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, specialty FROM doctors ORDER BY name")
    doctors = rows_to_list(cur.fetchall())
    cur.close()
    conn.close()
    return jsonify(doctors)


@app.route("/api/doctors", methods=["GET"])
@jwt_required()
def get_doctors():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, crm, specialty, email FROM doctors ORDER BY name")
    doctors = rows_to_list(cur.fetchall())
    cur.close()
    conn.close()
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

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM doctors WHERE crm=%s", (data["crm"],))
    existing = cur.fetchone()
    if existing:
        cur.close()
        conn.close()
        return jsonify({"error": "CRM já cadastrado"}), 409

    cur.execute(
        "INSERT INTO doctors (id, name, crm, specialty, email, password_hash) VALUES (%s,%s,%s,%s,%s,%s)",
        (did, data["name"], data["crm"], data.get("specialty", "Clínica Médica"),
         data.get("email", ""), hashed),
    )
    conn.commit()
    cur.execute("SELECT id, name, crm, specialty, email FROM doctors WHERE id=%s", (did,))
    doctor = row_to_dict(cur.fetchone())
    cur.close()
    conn.close()
    return jsonify(doctor), 201


@app.route("/api/doctors/<did>", methods=["DELETE"])
@jwt_required()
def delete_doctor(did):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Apenas admin pode excluir médicos"}), 403

    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM doctors WHERE id=%s", (did,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"deleted": did})


# ─── ROOMS ───────────────────────────────────────────────────────────────────

@app.route("/api/rooms", methods=["GET"])
@jwt_required()
def get_rooms():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM rooms ORDER BY name")
    rooms = rows_to_list(cur.fetchall())
    cur.close()
    conn.close()
    for r in rooms:
        r["inMaintenance"] = bool(r.pop("in_maintenance", False))
    return jsonify(rooms)


@app.route("/api/rooms", methods=["POST"])
@jwt_required()
def create_room():
    data = request.get_json()
    rid = f"sala-{new_id()}"
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO rooms (id, name, description, in_maintenance) VALUES (%s,%s,%s,%s)",
        (rid, data["name"], data.get("description", "Geral"), False),
    )
    conn.commit()
    cur.execute("SELECT * FROM rooms WHERE id=%s", (rid,))
    room = row_to_dict(cur.fetchone())
    cur.close()
    conn.close()
    room["inMaintenance"] = bool(room.pop("in_maintenance", False))
    return jsonify(room), 201


@app.route("/api/rooms/<rid>", methods=["PATCH"])
@jwt_required()
def update_room(rid):
    data = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    if "inMaintenance" in data:
        cur.execute(
            "UPDATE rooms SET in_maintenance=%s WHERE id=%s",
            (bool(data["inMaintenance"]), rid),
        )
        conn.commit()
    cur.execute("SELECT * FROM rooms WHERE id=%s", (rid,))
    room = row_to_dict(cur.fetchone())
    cur.close()
    conn.close()
    room["inMaintenance"] = bool(room.pop("in_maintenance", False))
    return jsonify(room)


@app.route("/api/rooms/<rid>", methods=["DELETE"])
@jwt_required()
def delete_room(rid):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM rooms WHERE id=%s", (rid,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"deleted": rid})


# ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

@app.route("/api/appointments", methods=["GET"])
@jwt_required()
def get_appointments():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM appointments ORDER BY date_time")
    apps = rows_to_list(cur.fetchall())
    cur.close()
    conn.close()
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
    conn = get_db()
    cur = conn.cursor()

    new_start = data["dateTime"]
    duration = data.get("durationMinutes", 20)

    # Postgres: date_time é TEXT, então convertemos pra timestamp na query
    cur.execute("""
        SELECT id FROM appointments
        WHERE status != 'cancelled'
          AND (doctor_id = %s OR room_id = %s)
          AND date_time::timestamp < (%s::timestamp + (%s || ' minutes')::interval)
          AND (date_time::timestamp + (duration_minutes || ' minutes')::interval) > %s::timestamp
    """, (
        data["doctorId"], data["roomId"],
        new_start, str(duration),
        new_start,
    ))
    conflict = cur.fetchone()

    if conflict:
        cur.close()
        conn.close()
        return jsonify({"error": "Choque de horário"}), 409

    aid = new_id()
    cur.execute("""
        INSERT INTO appointments
          (id, patient_id, patient_name, doctor_id, doctor_name,
           room_id, room_name, date_time, duration_minutes, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        aid,
        data["patientId"], data["patientName"],
        data["doctorId"], data["doctorName"],
        data["roomId"], data["roomName"],
        data["dateTime"], duration,
        data.get("status", "scheduled"),
    ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": aid, **data}), 201


@app.route("/api/appointments/<aid>", methods=["DELETE"])
@jwt_required()
def delete_appointment(aid):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM appointments WHERE id=%s", (aid,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"deleted": aid})


# ─── EHR ─────────────────────────────────────────────────────────────────────

@app.route("/api/ehr", methods=["GET"])
@jwt_required()
def get_ehr():
    claims = get_jwt()
    conn = get_db()
    cur = conn.cursor()

    if claims.get("role") == "admin":
        cur.execute("SELECT * FROM ehr_records ORDER BY date DESC")
    else:
        doctor_id = get_jwt_identity()
        cur.execute(
            "SELECT * FROM ehr_records WHERE doctor_id=%s ORDER BY date DESC",
            (doctor_id,),
        )
    records = rows_to_list(cur.fetchall())
    cur.close()
    conn.close()

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
    rid = new_id()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO ehr_records (id, patient_id, doctor_id, date, evolution) VALUES (%s,%s,%s,%s,%s)",
        (rid, data["patientId"], data["doctorId"], datetime.utcnow().isoformat(), data["evolution"]),
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": rid, **data}), 201


# ─── SCHEDULES ───────────────────────────────────────────────────────────────

@app.route("/api/schedules/<doctor_name>", methods=["GET"])
@jwt_required()
def get_schedule(doctor_name):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT slot FROM doctor_schedules WHERE doctor_name=%s", (doctor_name,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify([r["slot"] for r in rows])


@app.route("/api/schedules/<doctor_name>", methods=["PUT"])
@jwt_required()
def update_schedule(doctor_name):
    slots = request.get_json()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM doctor_schedules WHERE doctor_name=%s", (doctor_name,))
    for slot in slots:
        cur.execute(
            "INSERT INTO doctor_schedules (doctor_name, slot) VALUES (%s,%s) ON CONFLICT DO NOTHING",
            (doctor_name, slot),
        )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"saved": len(slots)})


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
