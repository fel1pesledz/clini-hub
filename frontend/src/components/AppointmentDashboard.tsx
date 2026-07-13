/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronDown, Trash2, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppointmentStatus } from '../types';

// ─── Helpers de data ────────────────────────────────────────────────────────

/** Retorna a segunda-feira da semana que contém `date` */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom, 1=Seg...
  const diff = (day === 0 ? -6 : 1 - day); // ajuste para segunda
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Adiciona `days` dias a uma data (retorna nova instância) */
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Formata data como "DD/MM" */
const formatDayMonth = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

/** Verifica se duas datas são o mesmo dia */
const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Verifica se uma data é hoje */
const isToday = (date: Date): boolean => isSameDay(date, new Date());

// ─── Geração de slots de tempo ───────────────────────────────────────────────

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 20) {
      slots.push(
        `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      );
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const WEEK_DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ─── Componente ──────────────────────────────────────────────────────────────

export const AppointmentDashboard: React.FC<{ onNewAppointment: () => void }> = ({
  onNewAppointment,
}) => {
  const { appointments, rooms, doctors, patients, removeAppointment } = useClinic();

  // Semana atual: começa na segunda da semana de hoje
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isPatientListOpen, setIsPatientListOpen] = useState(false);
  const patientRef = useRef<HTMLDivElement>(null);

  // Os 7 dias da semana exibida
  const weekDays = useMemo<Date[]>(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Label do intervalo exibido no header — ex: "02/06 – 08/06/2025"
  const weekLabel = useMemo(() => {
    const start = formatDayMonth(weekDays[0]);
    const end = weekDays[6].toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${start} – ${end}`;
  }, [weekDays]);

  // Navegar semanas
  const prevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToday  = () => setWeekStart(getWeekStart(new Date()));

  // Sugestões de busca de paciente
  const patientSuggestions = useMemo(() => {
    if (!search) return [];
    return patients.filter(
      p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cpf.includes(search)
    );
  }, [patients, search]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (patientRef.current && !patientRef.current.contains(e.target as Node)) {
        setIsPatientListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Consultas filtradas pelos selects e busca
  const filteredAppointments = useMemo(
    () =>
      appointments.filter(app => {
        if (selectedRoom !== 'all' && app.roomId !== selectedRoom) return false;
        if (selectedDoctor !== 'all' && app.doctorId !== selectedDoctor) return false;
        if (search && !app.patientName.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [appointments, selectedRoom, selectedDoctor, search]
  );

  // Exclusão com confirm nativo (será substituído por modal depois)
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a consulta de ${name}?`)) {
      removeAppointment(id);
    }
  };

  // Consultas de um slot específico (dia + horário)
  const getSlotAppointments = (day: Date, time: string) =>
    filteredAppointments.filter(app => {
      const d = new Date(app.dateTime);
      const appTime = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return isSameDay(d, day) && appTime === time;
    });

  return (
    <div className="space-y-6">
      {/* ── Barra de filtros e navegação ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Filtros */}
        <div className="flex gap-3 items-center flex-1 w-full flex-wrap">
          {/* Busca de paciente */}
          <div className="relative flex-1 min-w-[180px] max-w-xs" ref={patientRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar paciente..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setIsPatientListOpen(true);
              }}
              onFocus={() => setIsPatientListOpen(true)}
            />
            <ChevronDown
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 transition-transform ${
                isPatientListOpen ? 'rotate-180' : ''
              }`}
            />
            <AnimatePresence>
              {isPatientListOpen && patientSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                >
                  {patientSuggestions.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex flex-col transition-colors border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setSearch(p.name);
                        setIsPatientListOpen(false);
                      }}
                    >
                      <span className="font-bold text-slate-700 text-xs">{p.name}</span>
                      <span className="text-[9px] text-slate-400 uppercase">
                        CPF: {p.cpf}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filtro de sala */}
          <select
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
          >
            <option value="all">Todas as Salas</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Filtro de médico */}
          <select
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            value={selectedDoctor}
            onChange={e => setSelectedDoctor(e.target.value)}
          >
            <option value="all">Todos os Médicos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navegação de semana + botão nova consulta */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botão Hoje */}
          <button
            onClick={goToday}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Hoje
          </button>

          {/* Setas de navegação */}
          <button
            onClick={prevWeek}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Label da semana */}
          <span className="text-xs font-bold text-slate-600 min-w-[140px] text-center select-none">
            {weekLabel}
          </span>

          <button
            onClick={nextWeek}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="Próxima semana"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Nova consulta */}
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 bg-success text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-success/90 transition-all shadow-lg shadow-success/20 ml-1"
          >
            <Plus className="w-5 h-5" />
            Nova Consulta
          </button>
        </div>
      </div>

      {/* ── Grade semanal ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 bg-slate-50/50">
          <div className="p-4 border-r border-slate-100 text-[10px] font-bold text-slate-400 uppercase text-center flex items-center justify-center">
            Hora
          </div>
          {weekDays.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                className={`p-4 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-100 last:border-r-0 ${
                  today ? 'text-secondary' : 'text-slate-500'
                }`}
              >
                {WEEK_DAY_LABELS[i]}
                <span
                  className={`flex items-center justify-center mx-auto mt-1 w-7 h-7 rounded-full text-[11px] font-bold transition-colors ${
                    today
                      ? 'bg-secondary text-white'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Linhas de horário */}
        <div className="max-h-[600px] overflow-y-auto">
          {TIME_SLOTS.map(time => (
            <div
              key={time}
              className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-50 min-h-[65px]"
            >
              {/* Coluna de hora */}
              <div className="p-2 text-[11px] font-bold text-slate-400 text-right border-r border-slate-100 bg-slate-50/20 flex items-center justify-end pr-4">
                {time}
              </div>

              {/* Células dos dias */}
              {weekDays.map((day, i) => {
                const slotApps = getSlotAppointments(day, time);
                const todayCell = isToday(day);

                return (
                  <div
                    key={i}
                    className={`border-r border-slate-50 p-1 transition-colors relative flex flex-col gap-1 ${
                      todayCell ? 'bg-secondary/[0.03]' : 'hover:bg-blue-50/10'
                    }`}
                  >
                    {slotApps.map(appointment => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`group relative flex-1 min-h-0 w-full border-l-4 p-1.5 rounded shadow-sm overflow-hidden flex flex-col justify-center ${
                          appointment.status === AppointmentStatus.CANCELLED
                            ? 'bg-slate-100 border-slate-300 text-slate-500'
                            : appointment.status === AppointmentStatus.COMPLETED
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-secondary/10 border-secondary text-secondary-dark'
                        }`}
                        title={`${appointment.patientName} com ${appointment.doctorName}`}
                      >
                        {/* Botão excluir (aparece no hover) */}
                        <button
                          onClick={() =>
                            handleDelete(appointment.id, appointment.patientName)
                          }
                          className="absolute top-1 right-1 p-1 bg-white/80 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all z-10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="text-[10px] font-bold truncate leading-tight pr-3">
                          {appointment.patientName}
                        </div>

                        {slotApps.length < 3 && (
                          <div className="text-[8px] opacity-70 truncate italic mt-0.5">
                            {appointment.doctorName}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
