/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */



export interface UserProfile {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  crm?: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialty: string;
  email: string;
  password: string;
  availability?: DoctorAvailability[];
}

export interface DoctorAvailability {
  dayOfWeek: number; // 0-6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Room {
  id: string;
  name: string; // e.g., "Sala 01"
  description?: string;
  inMaintenance: boolean;
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  roomId: string;
  roomName: string;
  dateTime: string; // ISO string
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface EHRRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  evolution: string;
  allergies?: string;
  medications?: string;
}
