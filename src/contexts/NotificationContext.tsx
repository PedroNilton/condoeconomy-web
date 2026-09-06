import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface BadgeCounts {
  visitantesAguardando: number;
  chamadosPortaria: number; // Abertos nǜo escalados
  chamadosAdmin: number;    // Escalados para sndico
  reservasAdmin: number;    // Pendentes de aprovaǜo
  encomendasPendentes: number;
}

interface NotificationContextData {
  counts: BadgeCounts;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counts, setCounts] = useState<BadgeCounts>({
    visitantesAguardando: 0,
    chamadosPortaria: 0,
    chamadosAdmin: 0,
    reservasAdmin: 0,
    encomendasPendentes: 0,
  });

  const fetchVisitantes = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const res = await api.get(`/api/v1/visitantes?dataVisita=${hoje}`);
      const c = res.data.filter((v: any) => v.status === 'AGUARDANDO').length;
      setCounts(prev => ({ ...prev, visitantesAguardando: c }));
    } catch (e) { /* ignore */ }
  };

  const fetchChamados = async () => {
    try {
      const res = await api.get('/api/v1/chamados');
      const abertos = res.data.filter((c: any) => c.status === 'ABERTO' && !c.escaladoSindico).length;
      const escalados = res.data.filter((c: any) => c.status === 'ABERTO' && c.escaladoSindico).length;
      setCounts(prev => ({ ...prev, chamadosPortaria: abertos, chamadosAdmin: escalados }));
    } catch (e) { /* ignore */ }
  };

  const fetchReservas = async () => {
    try {
      const res = await api.get('/api/v1/reservas');
      const pendentes = res.data.filter((r: any) => r.status === 'PENDENTE_APROVACAO').length;
      setCounts(prev => ({ ...prev, reservasAdmin: pendentes }));
    } catch (e) { /* ignore */ }
  };

  const fetchEncomendas = async () => {
    // try {
    //   const res = await api.get('/api/v1/encomendas');
    //   const pend = res.data.filter((e: any) => e.status === 'AGUARDANDO_RETIRADA').length;
    //   setCounts(prev => ({ ...prev, encomendasPendentes: pend }));
    // } catch (e) { /* ignore */ }
  };

  const loadAll = () => {
    const token = localStorage.getItem('@CondoEconomy:token');
    if (token) {
      fetchVisitantes();
      fetchChamados();
      fetchReservas();
      fetchEncomendas();
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useWebSocket('/topic/chamados', fetchChamados);
  useWebSocket('/topic/reservas', fetchReservas);
  useWebSocket('/topic/visitantes', fetchVisitantes);
  useWebSocket('/topic/encomendas', fetchEncomendas);

  return (
    <NotificationContext.Provider value={{ counts }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  return useContext(NotificationContext);
}
