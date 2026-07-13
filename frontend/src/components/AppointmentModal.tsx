/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { X, Calendar, Clock, User, DoorOpen, CheckCircle2, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppointmentStatus } from '../types';

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 20) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose }) => {
  // 1. Extraímos o doctorSchedules do Contexto
  const { patients, doctors, rooms, addAppointment, doctorSchedules } = useClinic();
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    roomId: '',
    date: new Date().toISOString().split('T')[0], // Atualizado para a data de hoje por padrão
    time: '08:00',
    duration: 20,
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientListOpen, setIsPatientListOpen] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  // --- REGRA DE FILTRAGEM DE SALAS ---
  const availableRooms = useMemo(() => {
    if (!formData.doctorId) return rooms.filter(r => !r.inMaintenance);

    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    
    return rooms.filter(room => {
      if (room.inMaintenance) return false;
      return room.description === "Geral" || room.description === selectedDoctor?.specialty;
    });
  }, [rooms, formData.doctorId, doctors]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.cpf.includes(patientSearch)
    );
  }, [patients, patientSearch]);

  // --- REGRAS DE FILTRAGEM DE GRADE DE HORÁRIOS ---
  const getScheduleDayIndex = (dateString: string) => {
    if (!dateString) return 0;
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const jsDay = date.getDay(); // 0 é Domingo, 1 é Segunda...
    return (jsDay + 6) % 7; // Converte para: 0=Seg, 1=Ter... 6=Dom
  };

  const availableTimeSlots = useMemo(() => {
    if (!formData.doctorId || !formData.date) return [];
    
    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    if (!selectedDoctor) return [];

    const schedule = doctorSchedules[selectedDoctor.name];
    
    // Se o médico ainda não configurou a grade, ele não tem horários disponíveis
    if (!schedule || schedule.length === 0) return [];

    const dayIndex = getScheduleDayIndex(formData.date);
    
    // Filtra o array TIME_SLOTS mantendo apenas os que estão pintados de verde na grade
    return TIME_SLOTS.filter(time => schedule.includes(`${dayIndex}-${time}`));
  }, [formData.doctorId, formData.date, doctors, doctorSchedules]);

  // Atualiza o input de horário quando a lista disponível muda (troca de médico ou dia)
  useEffect(() => {
    if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: availableTimeSlots[0] }));
    } else if (availableTimeSlots.length === 0) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [availableTimeSlots]);

  // Fechar dropdown de pacientes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(event.target as Node)) {
        setIsPatientListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const selectedPatient = patients.find(p => p.id === formData.patientId);
    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    const selectedRoom = rooms.find(r => r.id === formData.roomId);

    if (!selectedPatient || !selectedDoctor || !selectedRoom || !formData.time) {
      setError('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    const success = addAppointment({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      dateTime: `${formData.date}T${formData.time}:00`,
      durationMinutes: formData.duration,
      status: AppointmentStatus.SCHEDULED,
    });

    if (success) {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setPatientSearch('');
        onClose();
      }, 1500);
    } else {
      setError('Choque de horário! O médico ou a sala já estão ocupados neste momento.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-secondary" />
                Agendar Nova Consulta
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <p className="text-sm text-danger font-medium leading-normal">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BUSCA DE PACIENTE */}
                <div className="space-y-2 md:col-span-2 relative" ref={patientRef}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <User className="w-3 h-3" /> Paciente
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text"
                      placeholder="Buscar por nome ou CPF..."
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none transition-all"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setIsPatientListOpen(true);
                      }}
                      onFocus={() => setIsPatientListOpen(true)}
                    />
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 transition-transform ${isPatientListOpen ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {isPatientListOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto"
                      >
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col transition-colors border-b border-slate-50 last:border-0"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, patientId: p.id }));
                                setPatientSearch(p.name);
                                setIsPatientListOpen(false);
                              }}
                            >
                              <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                              <span className="text-[10px] text-slate-400">CPF: {p.cpf}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-xs text-slate-400">
                            Nenhum paciente encontrado.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* MÉDICO */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <User className="w-3 h-3" /> Médico
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary/20"
                    value={formData.doctorId}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, doctorId: e.target.value, roomId: '' }));
                    }}
                    required
                  >
                    <option value="">Selecione o médico...</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                  </select>
                </div>

                {/* SALA */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <DoorOpen className="w-3 h-3" /> Sala Disponível
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-50"
                    value={formData.roomId}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                    disabled={!formData.doctorId}
                    required
                  >
                    <option value="">Selecione a sala...</option>
                    {availableRooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* DATA */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Data
                  </label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary/20"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                {/* HORÁRIO ATUALIZADO */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Horário
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    disabled={!formData.doctorId || availableTimeSlots.length === 0}
                    required
                  >
                    <option value="">{availableTimeSlots.length === 0 ? 'Sem horários' : 'Selecione o horário...'}</option>
                    {availableTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
              </div>

              {/* AVISOS E BOTÃO DE SUBMIT */}
              <div className="pt-2">
                {formData.doctorId && availableRooms.length === 0 && (
                  <p className="text-[10px] text-danger font-bold uppercase mb-4 text-center">
                    Nenhuma sala (Geral ou Específica) disponível para este médico.
                  </p>
                )}
                
                {formData.doctorId && formData.date && availableTimeSlots.length === 0 && (
                  <p className="text-[10px] text-danger font-bold uppercase mb-4 text-center">
                    O médico não configurou a grade ou não atende neste dia da semana.
                  </p>
                )}
                
                <button 
                  type="submit"
                  disabled={status === 'success' || (formData.doctorId && availableRooms.length === 0) || availableTimeSlots.length === 0}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    status === 'success' ? 'bg-success text-white' : 'bg-secondary text-white shadow-secondary/20 disabled:bg-slate-300 disabled:shadow-none'
                  }`}
                >
                  {status === 'success' ? <><CheckCircle2 className="w-6 h-6" /> Agendado!</> : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};