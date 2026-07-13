import React from 'react';
import { ArrowLeft, CalendarClock, ClipboardList, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface DoctorDashboardProps {
  doctorName: string;
  onViewChange: (view: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctorName, onViewChange }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onViewChange('doctors')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-primary">Painel Restrito</h2>
          <p className="text-sm text-slate-500">
            Bem-vindo, <span className="font-bold text-secondary">{doctorName}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Card 1: Horários */}
        <motion.button
          whileHover={{ y: -4 }}
          onClick={() => onViewChange('doctor-schedule')}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-secondary/30 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:bg-primary/10 transition-colors"></div>
          
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CalendarClock className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">Gerenciar Horários</h3>
          <p className="text-sm text-slate-500 mb-6 line-clamp-2">
            Configure sua disponibilidade semanal, dias de folga e horários de atendimento para que a recepção possa agendar suas consultas.
          </p>
          
          <div className="flex items-center text-sm font-bold text-primary group-hover:text-secondary transition-colors">
            Acessar Agenda <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </motion.button>

        {/* Card 2: Prontuários */}
        <motion.button
          whileHover={{ y: -4 }}
          onClick={() => onViewChange('ehr-view')}
          className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:secondary/30 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[100px] -z-10 group-hover:bg-secondary/10 transition-colors"></div>
          
          <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">Prontuários dos Pacientes</h3>
          <p className="text-sm text-slate-500 mb-6 line-clamp-2">
            Acesse o histórico clínico, registre novas evoluções, visualize exames e mantenha o acompanhamento dos seus pacientes.
          </p>
          
          <div className="flex items-center text-sm font-bold text-secondary group-hover:text-secondary-dark transition-colors">
            Acessar Prontuários <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </motion.button>
      </div>
    </div>
  );
};