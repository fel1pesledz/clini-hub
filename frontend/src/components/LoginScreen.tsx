/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCircle, Lock, ArrowRight, ArrowLeft, AlertCircle, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Step = 'choose' | 'admin' | 'doctor';

interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
}

export const LoginScreen: React.FC = () => {
  const { loginAsAdmin, loginAsDoctor } = useAuth();

  const [step, setStep] = useState<Step>('choose');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Médicos disponíveis (buscados da API sem auth — rota pública simplificada)
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);

  // Busca a lista de médicos quando entra na etapa de médico
  useEffect(() => {
    if (step !== 'doctor') return;
    fetch('/api/doctors/public')
      .then(r => r.json())
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [step]);

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    d.specialty.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const handleBack = () => {
    setStep('choose');
    setPassword('');
    setError(null);
    setSelectedDoctor(null);
    setDoctorSearch('');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginAsAdmin(password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDoctor(selectedDoctor.id, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-clini-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white text-2xl font-bold">CH</span>
          </div>
          <h1 className="text-3xl font-bold text-primary">CliniHub</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de Gestão Clínica</p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── Etapa 1: Escolha ── */}
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <p className="text-center text-sm text-slate-500 mb-6 font-medium">
                Como deseja entrar?
              </p>

              {/* Card Admin */}
              <button
                onClick={() => setStep('admin')}
                className="w-full bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 hover:border-primary/40 hover:shadow-md transition-all group text-left"
              >
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-base">Administrador</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Acesso total — agenda, pacientes, médicos e salas
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
              </button>

              {/* Card Médico */}
              <button
                onClick={() => setStep('doctor')}
                className="w-full bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 hover:border-secondary/40 hover:shadow-md transition-all group text-left"
              >
                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                  <UserCircle className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-base">Médico</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Acesso restrito — seus horários e prontuários
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-secondary transition-colors" />
              </button>
            </motion.div>
          )}

          {/* ── Etapa 2a: Login Admin ── */}
          {step === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-primary">Acesso Admin</h2>
                <p className="text-xs text-slate-500 mt-1">Digite a senha de administrador</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="Senha de administrador"
                    autoFocus
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 text-sm transition-all ${
                      error
                        ? 'border-red-300 focus:ring-red-100'
                        : 'border-slate-200 focus:ring-secondary/20 focus:border-secondary'
                    }`}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Etapa 2b: Login Médico ── */}
          {step === 'doctor' && (
            <motion.div
              key="doctor"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-primary">Acesso Médico</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedDoctor ? `Entrando como ${selectedDoctor.name}` : 'Selecione seu nome'}
                </p>
              </div>

              <form onSubmit={handleDoctorLogin} className="space-y-4">
                {/* Busca de médico */}
                {!selectedDoctor ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Buscar pelo nome..."
                        autoFocus
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary text-sm transition-all"
                        value={doctorSearch}
                        onChange={e => setDoctorSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {filteredDoctors.length > 0 ? filteredDoctors.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDoctor(d)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-secondary/5 border border-transparent hover:border-secondary/20 transition-all flex items-center gap-3"
                        >
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <UserCircle className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{d.name}</p>
                            <p className="text-[10px] text-slate-400">{d.specialty}</p>
                          </div>
                        </button>
                      )) : (
                        <p className="text-center text-xs text-slate-400 py-6">
                          {doctors.length === 0 ? 'Carregando...' : 'Nenhum médico encontrado'}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Médico selecionado — mostrar campo de senha */}
                    <button
                      type="button"
                      onClick={() => { setSelectedDoctor(null); setPassword(''); setError(null); }}
                      className="w-full flex items-center gap-3 p-3 bg-secondary/5 border border-secondary/20 rounded-xl text-left hover:bg-secondary/10 transition-colors"
                    >
                      <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-secondary text-sm">{selectedDoctor.name}</p>
                        <p className="text-[10px] text-slate-400">{selectedDoctor.specialty}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 underline">trocar</span>
                    </button>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="password"
                        placeholder="Sua senha"
                        autoFocus
                        className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 text-sm transition-all ${
                          error
                            ? 'border-red-300 focus:ring-red-100'
                            : 'border-slate-200 focus:ring-secondary/20 focus:border-secondary'
                        }`}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(null); }}
                        required
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-60"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
