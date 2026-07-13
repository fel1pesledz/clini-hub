/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClinicProvider } from './context/ClinicContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { AppointmentDashboard } from './components/AppointmentDashboard';
import { DoctorList } from './components/DoctorList';
import { PatientList } from './components/PatientList';
import { RoomList } from './components/RoomList';
import { EHRView } from './components/EHRView';
import { AppointmentModal } from './components/AppointmentModal';
import { LoginScreen } from './components/LoginScreen';
import { DoctorDashboard } from './components/DoctorDashboard';
import { DoctorSchedule } from './components/DoctorSchedule';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut } from 'lucide-react';

// ─── Conteúdo principal (só renderiza se autenticado) ─────────────────────────

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const [activeView, setActiveView] = useState('agenda');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Para médico: usa o próprio nome do usuário logado em vez de estado separado
  const doctorName = user?.name ?? 'Médico';

  // Tela de loading enquanto valida o token salvo
  if (isLoading) {
    return (
      <div className="min-h-screen bg-clini-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se não autenticado, mostra a tela de login
  if (!user) {
    return <LoginScreen />;
  }

  // Médico logado vai direto para o painel dele
  const effectiveView = user.role === 'doctor' && activeView === 'agenda'
    ? 'doctor-dashboard'
    : activeView;

  const renderView = () => {
    switch (effectiveView) {
      case 'agenda':
        return <AppointmentDashboard onNewAppointment={() => setIsModalOpen(true)} />;

      case 'doctors':
        // Médico não pode acessar o corpo clínico completo
        if (user.role === 'doctor') return <DoctorDashboard doctorName={doctorName} onViewChange={setActiveView} />;
        return <DoctorList onAccessRestrito={(name) => { setActiveView('doctor-dashboard'); }} />;

      case 'patients':
        return <PatientList />;

      case 'rooms':
        return <RoomList />;

      case 'ehr-view':
        return (
          <EHRView
            doctorName={doctorName}
            onBack={() => setActiveView('doctor-dashboard')}
          />
        );

      case 'doctor-dashboard':
        return (
          <DoctorDashboard
            doctorName={doctorName}
            onViewChange={setActiveView}
          />
        );

      case 'doctor-schedule':
        return (
          <DoctorSchedule
            doctorName={doctorName}
            onBack={() => setActiveView('doctor-dashboard')}
          />
        );

      case 'config':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-primary mb-2">Configurações</h2>
            <p className="text-slate-500">Gerenciamento de usuários, backup do sistema e auditoria.</p>
          </div>
        );

      default:
        return <AppointmentDashboard onNewAppointment={() => setIsModalOpen(true)} />;
    }
  };

  const viewTitle: Record<string, string> = {
    agenda: 'Dashboard Geral',
    doctors: 'Corpo Clínico',
    patients: 'Gestão de Pacientes',
    rooms: 'Infraestrutura',
    'doctor-dashboard': 'Painel do Médico',
    'doctor-schedule': 'Gerenciamento de Grade',
    'ehr-view': 'Prontuário Eletrônico',
    config: 'Configurações',
  };

  return (
    <div className="flex bg-clini-bg min-h-screen">
      <Sidebar activeView={effectiveView} onViewChange={setActiveView} />

      <main className="flex-1 ml-56 p-10 max-w-7xl">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {viewTitle[effectiveView] ?? 'CliniHub'}
            </h1>
            <p className="text-slate-500 mt-1 font-medium italic">
              Bem-vindo ao CliniHub v1.0
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {user.role === 'admin' ? 'Administrador' : 'Médico'}
              </p>
              <p className="text-sm font-bold text-slate-700">{user.name}</p>
            </div>

            {/* Botão de logout */}
            <button
              onClick={logout}
              title="Sair"
              className="p-2.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <ClinicProvider>
        <AppContent />
      </ClinicProvider>
    </AuthProvider>
  );
}
