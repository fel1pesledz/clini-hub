/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Search, Plus, Phone, User, MoreVertical, CreditCard, CalendarDays, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PatientList: React.FC = () => {
  const { patients, addPatient } = useClinic();
  const [search, setSearch] = useState('');
  
  // Estado para controlar a exibição do formulário inline
  const [isAdding, setIsAdding] = useState(false);
  
  // Estados para capturar os dados do novo paciente
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    cpf: '',
    phone: '',
    birthDate: ''
  });

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name.trim()) return;

    addPatient({
      name: newPatientData.name,
      cpf: newPatientData.cpf || '000.000.000-00',
      phone: newPatientData.phone || '(00) 00000-0000',
      birthDate: newPatientData.birthDate || '2000-01-01'
    });

    // Limpa o formulário e fecha
    setNewPatientData({ name: '', cpf: '', phone: '', birthDate: '' });
    setIsAdding(false);
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.cpf.includes(search)
  );

  // --- CLASSES CSS PADRONIZADAS PARA INPUTS BONITOS ---
  // Esta constante define o visual moderno que você quer aplicar.
  const inputClassName = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:bg-white transition-all shadow-inner";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-primary">Pacientes</h2>
        
        <div className="flex gap-3 w-full md:w-auto">
          {/* Campo de Busca Geral */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Nome ou CPF..."
              className={`${inputClassName} py-2.5`} // Reutilizando a classe base com ajuste de padding vertical
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Botão que agora abre o formulário inline, não o prompt */}
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md ${
              isAdding 
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
              : 'bg-success text-white hover:bg-success/90 shadow-success/10'
            }`}
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isAdding ? 'Cancelar' : 'Novo Paciente'}
          </button>
        </div>
      </div>

      {/* FORMULÁRIO INLINE ESTILIZADO (Substitui o Prompt) */}
      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSavePatient}
            className="bg-white p-6 rounded-2xl border border-secondary/20 shadow-xl shadow-secondary/5 space-y-5"
          >
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Cadastro Rápido de Paciente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo Nome (Pretty) */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Nome Completo"
                  className={inputClassName} // APLICANDO O VISUAL PRETTY AQUI
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>

              {/* Campo CPF (Pretty) */}
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="CPF: 000.000.000-00"
                  className={inputClassName} // APLICANDO O VISUAL PRETTY AQUI
                  value={newPatientData.cpf}
                  onChange={(e) => setNewPatientData(prev => ({...prev, cpf: e.target.value}))}
                />
              </div>

              {/* Campo Telefone (Pretty) */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Tel: (00) 00000-0000"
                  className={inputClassName} // APLICANDO O VISUAL PRETTY AQUI
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>

              {/* Campo Data Nasc (Pretty) */}
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="date" 
                  className={`${inputClassName} text-slate-500`} // APLICANDO O VISUAL PRETTY AQUI
                  value={newPatientData.birthDate}
                  onChange={(e) => setNewPatientData(prev => ({...prev, birthDate: e.target.value}))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-secondary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10"
              >
                <Check className="w-5 h-5" />
                Salvar Cadastro
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Lista de Pacientes continua igual */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <motion.div 
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-secondary/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{patient.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone}</span>
                    <span className="flex items-center gap-1 font-mono uppercase tracking-tighter">CPF: {patient.cpf}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-xs font-bold text-primary hover:bg-slate-50 rounded-lg transition-colors">
                  Editar
                </button>
                <button className="p-2 text-slate-300 hover:text-slate-600 rounded-full">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            Nenhum paciente encontrado.
          </div>
        )}
      </div>
    </div>
  );
};