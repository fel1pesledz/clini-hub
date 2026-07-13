/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { DoorOpen, AlertTriangle, CheckCircle2, MoreVertical, Plus, X, Check, AlignLeft, ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ROOM_SPECIALTIES = [
  "Geral", "Cardiologia", "Pediatria", "Dermatologia", "Ginecologia",
  "Ortopedia", "Psiquiatria", "Oftalmologia", "Neurologia", "Endocrinologia"
];

export const RoomList: React.FC = () => {
  const { rooms, setRooms, addRoom, removeRoom } = useClinic();
  const [isAdding, setIsAdding] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', description: 'Geral' });

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomData.name.trim()) return;
    addRoom({
      name: newRoomData.name,
      inMaintenance: false,
      description: newRoomData.description
    });
    setNewRoomData({ name: '', description: 'Geral' });
    setIsAdding(false);
  };

  const toggleMaintenance = (id: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, inMaintenance: !r.inMaintenance } : r));
  };

  const inputClassName = "w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all shadow-inner appearance-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Gestão de Salas</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
            isAdding ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancelar' : 'Nova Sala'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleSaveRoom}
            className="bg-white p-6 rounded-2xl border border-primary/20 shadow-xl space-y-5"
          >
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <DoorOpen className="w-4 h-4" /> Configurar Nova Unidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <DoorOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" placeholder="Ex: Sala 04" className={inputClassName}
                  value={newRoomData.name} onChange={(e) => setNewRoomData(p => ({...p, name: e.target.value}))} required
                />
              </div>
              <div className="relative">
                <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
                <select 
                  className={inputClassName}
                  value={newRoomData.description} 
                  onChange={(e) => setNewRoomData(p => ({...p, description: e.target.value}))}
                >
                  {ROOM_SPECIALTIES.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg">
                <Check className="w-5 h-5" /> Confirmar Sala
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <motion.div 
            key={room.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white p-6 rounded-2xl border transition-all ${room.inMaintenance ? 'border-danger/30 shadow-danger/5' : 'border-slate-100'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${room.inMaintenance ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                <DoorOpen className="w-6 h-6" />
              </div>
              
              {/* Botão de Excluir Integrado aqui */}
              <button 
                onClick={() => {
                  if(confirm(`Deseja realmente excluir a ${room.name}?`)) {
                    removeRoom(room.id);
                  }
                }}
                className="text-slate-300 hover:text-danger transition-colors p-1"
                title="Excluir Sala"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="font-bold text-lg">{room.name}</h3>
            <p className="text-sm text-slate-500 mb-6">{room.description}</p>
            
            <div className={`flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider ${room.inMaintenance ? 'text-danger' : 'text-success'}`}>
              {room.inMaintenance ? (
                <><AlertTriangle className="w-4 h-4" /> Em Manutenção</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Disponível</>
              )}
            </div>
            
            <button 
              onClick={() => toggleMaintenance(room.id)}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors border ${room.inMaintenance ? 'bg-success/5 text-success border-success/20 hover:bg-success/10' : 'bg-danger/5 text-danger border-danger/20 hover:bg-danger/10'}`}
            >
              {room.inMaintenance ? 'Liberar Sala' : 'Colocar em Manutenção'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};