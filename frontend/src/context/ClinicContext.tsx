/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, Doctor, Room, Appointment, EHRRecord } from '../types';
import { useAuth } from './AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClinicContextType {
  patients: Patient[];
  doctors: Doctor[];
  rooms: Room[];
  appointments: Appointment[];
  ehrRecords: EHRRecord[];
  doctorSchedules: Record<string, string[]>;
  isLoadingData: boolean;

  // Helpers de Criação
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<void>;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<boolean>;

  // Helpers de Edição
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  updateDoctorSchedule: (doctorName: string, slots: string[]) => Promise<void>;

  // Helpers de Exclusão
  removePatient: (id: string) => Promise<void>;
  removeDoctor: (id: string) => Promise<void>;
  removeRoom: (id: string) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;

  // EHR
  setEhrRecords: React.Dispatch<React.SetStateAction<EHRRecord[]>>;
  addEhrRecord: (record: Omit<EHRRecord, 'id' | 'date'>) => Promise<void>;

  // Compat
  canDoctorAccessPatient: (doctorId: string, patientId: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

// ─── Helper fetch autenticado ─────────────────────────────────────────────────

const apiFetch = async (url: string, token: string | null, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ehrRecords, setEhrRecords] = useState<EHRRecord[]>([]);
  const [doctorSchedules, setDoctorSchedules] = useState<Record<string, string[]>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ── Carrega todos os dados ao montar (quando tem token) ──────────────────────
  const loadAll = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    try {
      const [p, d, r, a, e] = await Promise.all([
        apiFetch('/api/patients', token),
        apiFetch('/api/doctors', token),
        apiFetch('/api/rooms', token),
        apiFetch('/api/appointments', token),
        apiFetch('/api/ehr', token),
      ]);
      setPatients(p);
      setDoctors(d);
      setRooms(r);
      setAppointments(a);
      setEhrRecords(e);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Pacientes ────────────────────────────────────────────────────────────────

  const addPatient = async (data: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient = await apiFetch('/api/patients', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setPatients(prev => [...prev, newPatient]);
  };

  const removePatient = async (id: string) => {
    await apiFetch(`/api/patients/${id}`, token, { method: 'DELETE' });
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  // ── Médicos ──────────────────────────────────────────────────────────────────

  const addDoctor = async (data: Omit<Doctor, 'id'>) => {
    const newDoctor = await apiFetch('/api/doctors', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setDoctors(prev => [...prev, newDoctor]);
  };

  const removeDoctor = async (id: string) => {
    await apiFetch(`/api/doctors/${id}`, token, { method: 'DELETE' });
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  // ── Salas ────────────────────────────────────────────────────────────────────

  const addRoom = async (data: Omit<Room, 'id'>) => {
    const newRoom = await apiFetch('/api/rooms', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = async (id: string, updates: Partial<Room>) => {
    const updated = await apiFetch(`/api/rooms/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setRooms(prev => prev.map(r => r.id === id ? updated : r));
  };

  const removeRoom = async (id: string) => {
    await apiFetch(`/api/rooms/${id}`, token, { method: 'DELETE' });
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  // ── Consultas ────────────────────────────────────────────────────────────────

  const addAppointment = async (data: Omit<Appointment, 'id'>): Promise<boolean> => {
    try {
      const newApp = await apiFetch('/api/appointments', token, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAppointments(prev => [...prev, newApp]);
      return true;
    } catch (err: any) {
      if (err.message === 'Choque de horário') return false;
      throw err;
    }
  };

  const removeAppointment = async (id: string) => {
    await apiFetch(`/api/appointments/${id}`, token, { method: 'DELETE' });
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // ── EHR ──────────────────────────────────────────────────────────────────────

  const addEhrRecord = async (data: Omit<EHRRecord, 'id' | 'date'>) => {
    const newRecord = await apiFetch('/api/ehr', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setEhrRecords(prev => [newRecord, ...prev]);
  };

  // ── Schedules ────────────────────────────────────────────────────────────────

  const updateDoctorSchedule = async (doctorName: string, slots: string[]) => {
    await apiFetch(`/api/schedules/${encodeURIComponent(doctorName)}`, token, {
      method: 'PUT',
      body: JSON.stringify(slots),
    });
    setDoctorSchedules(prev => ({ ...prev, [doctorName]: slots }));
  };

  // Carrega schedule de um médico específico quando necessário
  useEffect(() => {
    if (!token || doctors.length === 0) return;
    const loadSchedules = async () => {
      const entries = await Promise.all(
        doctors.map(async d => {
          try {
            const slots = await apiFetch(
              `/api/schedules/${encodeURIComponent(d.name)}`, token
            );
            return [d.name, slots] as [string, string[]];
          } catch {
            return [d.name, []] as [string, string[]];
          }
        })
      );
      setDoctorSchedules(Object.fromEntries(entries));
    };
    loadSchedules();
  }, [token, doctors]);

  // ── Compat ───────────────────────────────────────────────────────────────────

  const canDoctorAccessPatient = (doctorId: string, patientId: string) =>
    appointments.some(a => a.doctorId === doctorId && a.patientId === patientId);

  return (
    <ClinicContext.Provider value={{
      patients, doctors, rooms, appointments, ehrRecords,
      doctorSchedules, isLoadingData,
      setRooms, setEhrRecords,
      addPatient, addDoctor, addRoom, addAppointment,
      updateRoom, updateDoctorSchedule,
      removePatient, removeDoctor, removeRoom, removeAppointment,
      addEhrRecord,
      canDoctorAccessPatient,
    }}>
      {children}
    </ClinicContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useClinic = () => {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within a ClinicProvider');
  return ctx;
};
