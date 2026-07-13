/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ClipboardList, History, Search, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EHRViewProps {
  doctorName: string;
  onBack: () => void;
}

export const EHRView: React.FC<EHRViewProps> = ({ doctorName, onBack }) => {
  const { patients, ehrRecords, addEhrRecord, doctors, appointments } = useClinic();
  const { user } = useAuth();

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [evolution, setEvolution] = useState('');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Descobre o médico logado pelo ID no token
  const currentDoctor = doctors.find(d => d.name === doctorName);

  // Apenas pacientes com consulta com este médico
  const allowedPatients = useMemo(() => {
    if (!currentDoctor) return [];
    const myPatientIds = appointments
      .filter(app => app.doctorId === currentDoctor.id && app.status !== 'cancelled')
      .map(app => app.patientId);
    return patients.filter(p => myPatientIds.includes(p.id));
  }, [patients, appointments, currentDoctor]);

  const filteredPatients = allowedPatients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search)
  );

  const selectedPatient = allowedPatients.find(p => p.id === selectedPatientId);
  const patientHistory = ehrRecords.filter(r => r.patientId === selectedPatientId);

  const handleSave = async () => {
    if (!evolution || !selectedPatientId || !currentDoctor) return;
    setIsSaving(true);
    try {
      await addEhrRecord({
        patientId: selectedPatientId,
        doctorId: currentDoctor.id, // agora salva o ID, não o nome
        evolution,
      });
      setEvolution('');
    } catch (err) {
      console.error('Erro ao salvar evolução:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Lista Lateral */}
      <div className="w-80 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <h2 className="text-xl font-bold text-primary">Prontuários</h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar meus pacientes..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredPatients.map(patient => (
            <button
              key={patient.id}
              onClick={() => setSelectedPatientId(patient.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                selectedPatientId === patient.id
                  ? 'bg-secondary text-white shadow-lg'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <p className="font-bold text-sm">{patient.name}</p>
              <p className={`text-[10px] mt-1 ${selectedPatientId === patient.id ? 'text-white/70' : 'text-slate-400'}`}>
                CPF: {patient.cpf}
              </p>
            </button>
          ))}

          {filteredPatients.length === 0 && (
            <div className="text-center py-10 px-4">
              <Lock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 italic">Nenhum paciente vinculado a você.</p>
            </div>
          )}
        </div>
      </div>

      {/* Área do Prontuário */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedPatient ? (
            <motion.div
              key={selectedPatient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800">{selectedPatient.name}</h3>
                <p className="text-xs text-slate-500">Prontuário liberado para: {doctorName}</p>
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Nova evolução */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                  <span className="font-bold text-secondary flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" /> Nova Evolução
                  </span>
                  <textarea
                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none resize-none text-sm"
                    placeholder="Descreva a evolução do paciente..."
                    value={evolution}
                    onChange={e => setEvolution(e.target.value)}
                  />
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !evolution}
                    className="w-full py-4 bg-secondary text-white rounded-2xl font-bold disabled:opacity-50 hover:bg-secondary/90 transition-colors"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Evolução'}
                  </button>
                </div>

                {/* Histórico */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 overflow-y-auto">
                  <span className="font-bold text-primary flex items-center gap-2 mb-6">
                    <History className="w-5 h-5" /> Histórico
                  </span>
                  {patientHistory.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-8">
                      Nenhuma evolução registrada ainda.
                    </p>
                  )}
                  {patientHistory.map(record => (
                    <div key={record.id} className="mb-4 p-4 bg-slate-50 rounded-2xl border-l-4 border-secondary">
                      <div className="flex justify-between text-[10px] mb-2 font-bold text-slate-400 uppercase">
                        <span>{new Date(record.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-sm text-slate-700">{record.evolution}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
              <Lock className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecione um paciente autorizado na lista lateral.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
