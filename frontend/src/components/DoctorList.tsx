/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import {
  UserCircle, Shield, ArrowRight, Plus, X, Check,
  Mail, Award, Contact, ChevronDown, Lock, AlertCircle, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SPECIALTIES = [
  "Clínica Médica", "Cardiologia", "Pediatria", "Dermatologia",
"Ginecologia", "Ortopedia", "Psiquiatria", "Oftalmologia",
"Neurologia", "Endocrinologia"
];

export const DoctorList: React.FC<{ onAccessRestrito: (doctorName: string) => void }> = ({ onAccessRestrito }) => {
  const { doctors, addDoctor, removeDoctor } = useClinic();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [isAdding, setIsAdding] = useState(false);
  const [crmError, setCrmError] = useState(false);

  const [newDoctorData, setNewDoctorData] = useState({
    name: '',
    specialty: 'Clínica Médica',
    crm: '',
    email: '',
    password: ''
  });

  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorModal, setErrorModal] = useState(false);

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setCrmError(false);

    const crmExists = doctors.some(doc =>
    doc.crm.trim().toLowerCase() === newDoctorData.crm.trim().toLowerCase()
    );

    if (crmExists) {
      setCrmError(true);
      return;
    }

    if (!newDoctorData.name.trim() || !newDoctorData.password.trim()) {
      alert("Nome e Senha são obrigatórios.");
      return;
    }

    addDoctor({
      name: newDoctorData.name,
      specialty: newDoctorData.specialty,
      crm: newDoctorData.crm || '00000-UF',
      email: newDoctorData.email || 'contato@clinihub.com',
      password: newDoctorData.password
    });

    setNewDoctorData({ name: '', specialty: 'Clínica Médica', crm: '', email: '', password: '' });
    setIsAdding(false);
  };

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDoctor && passwordInput === selectedDoctor.password) {
      onAccessRestrito(selectedDoctor.name);
      setSelectedDoctor(null);
      setPasswordInput('');
      setErrorModal(false);
    } else {
      setErrorModal(true);
    }
  };

  const inputClassName = "w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:bg-white transition-all shadow-inner appearance-none";

  return (
    <div className="space-y-6">
    <div className="flex items-center justify-between mb-8">
    <h2 className="text-2xl font-bold text-primary">Corpo Clínico</h2>

    <button
    onClick={() => { setIsAdding(!isAdding); setCrmError(false); }}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
      isAdding ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white hover:bg-primary/90'
    }`}
    >
    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
    {isAdding ? 'Cancelar' : 'Novo Médico'}
    </button>
    </div>

    <AnimatePresence>
    {isAdding && (
      <motion.form
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSaveDoctor}
      className="bg-white p-6 rounded-2xl border border-secondary/20 shadow-xl space-y-5"
      >
      <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
      <Award className="w-4 h-4" /> Cadastrar Profissional
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="relative">
      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
      <input
      type="text" placeholder="Nome" className={inputClassName}
      value={newDoctorData.name} onChange={(e) => setNewDoctorData(p => ({...p, name: e.target.value}))} required
      />
      </div>

      <div className="relative">
      <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 z-10" />
      <select
      className={inputClassName}
      value={newDoctorData.specialty}
      onChange={(e) => setNewDoctorData(p => ({...p, specialty: e.target.value}))}
      >
      {SPECIALTIES.map(spec => (
        <option key={spec} value={spec}>{spec}</option>
      ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
      </div>

      <div className="relative">
      <Contact className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${crmError ? 'text-red-500' : 'text-slate-400'}`} />
      <input
      type="text" placeholder="CRM"
      className={`${inputClassName} ${crmError ? 'border-red-500 ring-red-50 focus:border-red-500' : ''}`}
      value={newDoctorData.crm} onChange={(e) => { setNewDoctorData(p => ({...p, crm: e.target.value})); setCrmError(false); }}
      required
      />
      </div>

      <div className="relative">
      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
      <input
      type="email" placeholder="E-mail" className={inputClassName}
      value={newDoctorData.email} onChange={(e) => setNewDoctorData(p => ({...p, email: e.target.value}))}
      />
      </div>

      <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
      <input
      type="password" placeholder="Criar Senha" className={inputClassName}
      value={newDoctorData.password} onChange={(e) => setNewDoctorData(p => ({...p, password: e.target.value}))}
      required
      />
      </div>
      </div>

      {crmError && (
        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
        <AlertCircle className="w-4 h-4" />
        Este CRM já está cadastrado no sistema.
        </div>
      )}

      <div className="flex justify-end pt-2">
      <button type="submit" className="bg-secondary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary/90 transition-all shadow-lg">
      <Check className="w-5 h-5" /> Salvar Médico
      </button>
      </div>
      </motion.form>
    )}
    </AnimatePresence>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {doctors.map((doctor) => (
      <motion.div
      key={doctor.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative"
      >
      {/* Botão de excluir */}
      <button
      onClick={() => {
        if (window.confirm(`Deseja realmente excluir o(a) Dr(a). ${doctor.name}?`)) {
          removeDoctor(doctor.id);
        }
      }}
      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      title="Excluir médico"
      >
      <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start justify-between mb-4">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
      <UserCircle className="w-8 h-8" />
      </div>
      <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {doctor.specialty}
      </div>
      </div>

      <h3 className="font-bold text-lg mb-1">{doctor.name}</h3>
      <p className="text-sm text-slate-500 mb-6 flex items-center gap-1.5">
      <span className="font-semibold text-slate-700">CRM:</span> {doctor.crm}
      </p>

      {/* Botão Acesso Restrito — visível apenas para médicos, não para admin */}
      {!isAdmin && (
        <button
        onClick={() => setSelectedDoctor(doctor)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-secondary transition-colors"
        >
        <Shield className="w-4 h-4" />
        Acesso Restrito
        <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      )}
      </motion.div>
    ))}
    </div>

    {/* Modal de senha — só aparece para não-admin de qualquer forma */}
    <AnimatePresence>
    {selectedDoctor && !isAdmin && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative"
      >
      <button onClick={() => { setSelectedDoctor(null); setErrorModal(false); }} className="absolute top-6 right-6 text-slate-400 text-2xl">&times;</button>
      <div className="text-center mb-8">
      <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
      <Shield className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-primary">Acesso Restrito</h3>
      <p className="text-sm text-slate-500 mt-2">{selectedDoctor.name}</p>
      </div>
      <form onSubmit={handleAccess} className="space-y-4">
      <input
      type="password" placeholder="Digite sua senha" autoFocus
      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 ${errorModal ? 'border-red-500 ring-red-100' : 'border-slate-200 ring-secondary/10'}`}
      value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setErrorModal(false); }}
      />
      {errorModal && <p className="text-xs text-red-500 font-medium">Senha incorreta. Tente novamente.</p>}
      <button type="submit" className="w-full py-4 bg-secondary text-white rounded-xl font-bold shadow-lg">Confirmar</button>
      </form>
      </motion.div>
      </div>
    )}
    </AnimatePresence>
    </div>
  );
};
