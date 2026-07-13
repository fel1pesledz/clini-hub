/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ArrowLeft, Save, Edit3, X, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface DoctorScheduleProps {
  doctorName: string;
  onBack: () => void;
}

export const DoctorSchedule: React.FC<DoctorScheduleProps> = ({ doctorName, onBack }) => {
  const { doctorSchedules, updateDoctorSchedule } = useClinic();
  
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(doctorSchedules[doctorName] || [])
  );

  useEffect(() => {
    setSelectedSlots(new Set(doctorSchedules[doctorName] || []));
  }, [doctorSchedules, doctorName]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'select' | 'deselect'>('select');

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseDown = (slotId: string) => {
    if (!isEditing) return;
    setIsDragging(true);
    const isCurrentlySelected = selectedSlots.has(slotId);
    const newAction = isCurrentlySelected ? 'deselect' : 'select';
    setDragAction(newAction);
    updateSlot(slotId, newAction);
  };

  const handleMouseEnter = (slotId: string) => {
    if (!isEditing || !isDragging) return;
    updateSlot(slotId, dragAction);
  };

  const updateSlot = (slotId: string, action: 'select' | 'deselect') => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (action === 'select') next.add(slotId);
      else next.delete(slotId);
      return next;
    });
  };

  // Nova função para limpar a grade inteira
  const handleClear = () => {
    setSelectedSlots(new Set());
  };

  const handleSave = () => {
    setIsSaving(true);
    
    updateDoctorSchedule(doctorName, Array.from(selectedSlots));
    
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  const handleCancel = () => {
    setSelectedSlots(new Set(doctorSchedules[doctorName] || []));
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 select-none">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-primary">Disponibilidade</h2>
            <p className="text-sm text-slate-500">Grade de horários para <span className="font-bold text-secondary">{doctorName}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="text-success text-sm font-bold flex items-center gap-1.5 mr-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
              </motion.div>
            )}
          </AnimatePresence>

          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>

              {/* Novo Botão Limpar */}
              <button 
                onClick={handleClear}
                className="px-5 py-2.5 rounded-xl font-bold text-danger hover:bg-danger/10 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Limpar
              </button>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-success text-white rounded-xl font-bold hover:bg-success/90 transition-all shadow-lg shadow-success/20 flex items-center gap-2"
              >
                {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Grade</>}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> Editar
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl flex items-start gap-3 mb-2">
              <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <p className="text-sm text-secondary-dark font-medium">
                <strong>Modo de Edição Ativo:</strong> Clique e arraste sobre os blocos para selecionar ou remover horários livres. Pinte os blocos de verde para indicar que você está disponível para receber pacientes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 bg-slate-50/50">
          <div className="p-4 border-r border-slate-100 flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hora</span>
          </div>
          {WEEK_DAYS.map((day) => (
            <div key={day} className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 border-r border-slate-100 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="max-h-[600px] overflow-y-auto">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-50">
              <div className="p-2 text-[11px] font-bold text-slate-400 text-right border-r border-slate-100 bg-slate-50/20 flex items-center justify-end pr-4 min-h-[36px]">
                {time}
              </div>

              {WEEK_DAYS.map((_, dayIndex) => {
                const slotId = `${dayIndex}-${time}`;
                const isSelected = selectedSlots.has(slotId);

                return (
                  <div 
                    key={slotId} 
                    className={`border-r border-slate-50 p-0.5 transition-colors relative ${isEditing ? 'cursor-pointer hover:bg-secondary/5' : ''}`}
                    onMouseDown={() => handleMouseDown(slotId)}
                    onMouseEnter={() => handleMouseEnter(slotId)}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId={`slot-${slotId}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`w-full h-full rounded-md border-l-4 flex items-center px-2 shadow-sm ${
                          isEditing 
                            ? 'bg-success/20 border-success text-success-dark' 
                            : 'bg-slate-100 border-slate-300 text-slate-500'
                        }`}
                      >
                        <span className="text-[10px] font-bold tracking-tighter opacity-70">Livre</span>
                      </motion.div>
                    )}
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