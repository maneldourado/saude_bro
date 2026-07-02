// app/DashboardModule.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface DashboardModuleProps {
  employees: any[];
  bloodPressureRecords: any[];
  styles: any;
  onNavigate?: (module: string) => void;
}

export default function DashboardModule({
  employees,
  bloodPressureRecords,
  styles: oldStyles,
  onNavigate,
}: DashboardModuleProps) {
  const [examesToxicologicos, setExamesToxicologicos] = useState<any[]>([]);
  const [imcRecords, setImcRecords] = useState<any[]>([]);
  const [atestadosPendentes, setAtestadosPendentes] = useState<any[]>([]);
  const [atestadosCount, setAtestadosCount] = useState<number>(0);
  const [certificadosCount, setCertificadosCount] = useState<number>(0);
  const [vacinasCount, setVacinasCount] = useState<number>(0);
  const [preEmbarqueCount, setPreEmbarqueCount] = useState<number>(0);
  const [refeicoesCount, setRefeicoesCount] = useState<number>(0);
  const [medicamentosCount, setMedicamentosCount] = useState<number>(0);
  const [preMerCount, setPreMerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<string>('');

  // ==================== CALCULAR IMC ====================
  const calculateBMI = (
    weight: number | string,
    height: number | string
  ): number => {
    const peso = typeof weight === 'string' ? parseFloat(weight) : weight;
    let altura = typeof height === 'string' ? parseFloat(height) : height;

    if (!peso || !altura || peso <= 0 || altura <= 0) return 0;
    if (isNaN(peso) || isNaN(altura)) return 0;

    if (altura > 3) {
      altura = altura / 100;
    }

    const imc = peso / (altura * altura);
    return Math.round(imc * 10) / 10;
  };

  // ==================== CARREGAR EXAMES ====================
  const carregarExames = async () => {
    const { data, error } = await supabase
      .from('exames_toxicologicos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExamesToxicologicos(data);
    }
  };

  // ==================== CARREGAR IMC ====================
  const carregarImcRecords = async () => {
    try {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
          .from('imc_records')
          .select('*')
          .range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setImcRecords(allData);
    } catch (error) {
      console.error('Erro ao carregar IMC records:', error);
      setImcRecords([]);
    }
  };

  // ==================== CARREGAR ATESTADOS ====================
  const carregarAtestados = async () => {
    const { count, error } = await supabase
      .from('atestados')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setAtestadosCount(count);
    }

    const { data, error: err2 } = await supabase
      .from('atestados')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!err2 && data) {
      setAtestadosPendentes(data);
    }
  };

  // ==================== CARREGAR CERTIFICADOS ====================
  const carregarCertificados = async () => {
    const { count, error } = await supabase
      .from('certificados')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setCertificadosCount(count);
    }
  };

  // ==================== CARREGAR VACINAS ====================
  const carregarVacinas = async () => {
    const { count, error } = await supabase
      .from('vacinacao')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setVacinasCount(count);
    }
  };

  // ==================== CARREGAR PRÉ-EMBARQUE ====================
  const carregarPreEmbarque = async () => {
    const { count, error } = await supabase
      .from('pre_embarque')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setPreEmbarqueCount(count);
    }
  };

  // ==================== CARREGAR REFEIÇÕES ====================
  const carregarRefeicoes = async () => {
    const { count, error } = await supabase
      .from('refeicao')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setRefeicoesCount(count);
    }
  };

  // ==================== CARREGAR MEDICAMENTOS ====================
  const carregarMedicamentos = async () => {
    const { count, error } = await supabase
      .from('equipamentos_sobressale...')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setMedicamentosCount(count);
    }
  };

  // ==================== CARREGAR PRÉ-MERGULHO ====================
  const carregarPreMer = async () => {
    const { count, error } = await supabase
      .from('pre_mer_avaliacoes')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setPreMerCount(count);
    }
  };

  // ==================== UPDATE DATE/TIME ====================
  const updateDateTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dayStr = now.toLocaleDateString('pt-BR', { weekday: 'long' });

    setCurrentDate(dateStr);
    setCurrentTime(timeStr);
    setCurrentDay(dayStr);
  };

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // ==================== CARREGAR TODOS OS DADOS ====================
  useEffect(() => {
    Promise.all([
      carregarExames(),
      carregarImcRecords(),
      carregarAtestados(),
      carregarCertificados(),
      carregarVacinas(),
      carregarPreEmbarque(),
      carregarRefeicoes(),
      carregarMedicamentos(),
      carregarPreMer(),
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  // ==================== PIRÂMIDE DE SAÚDE ====================
  const colaboradoresComIMC = imcRecords.filter((record) => {
    const peso = record.peso;
    const altura = record.altura;
    return peso && altura && peso > 0 && altura > 0;
  });

  const nivel4 = colaboradoresComIMC.filter((record) => {
    const imc = calculateBMI(record.peso, record.altura);
    return imc >= 35;
  }).length;

  const nivel3 = colaboradoresComIMC.filter((record) => {
    const imc = calculateBMI(record.peso, record.altura);
    return imc >= 30 && imc < 35;
  }).length;

  const nivel2 = colaboradoresComIMC.filter((record) => {
    const imc = calculateBMI(record.peso, record.altura);
    return imc >= 25 && imc < 30;
  }).length;

  const nivel1 = colaboradoresComIMC.filter((record) => {
    const imc = calculateBMI(record.peso, record.altura);
    return imc < 25 && imc > 0;
  }).length;

  const totalAvaliados = colaboradoresComIMC.length;
  const totalColaboradoresIMC = imcRecords.length;

  // ==================== ESTATÍSTICAS TOXICOLÓGICAS ====================
  const stats = {
    totalExames: examesToxicologicos.length,
    ativos: examesToxicologicos.filter((e) => e.status === 'ativo').length,
    vencidos: examesToxicologicos.filter((e) => e.status === 'vencido').length,
    proximosVencer: examesToxicologicos.filter(
      (e) => e.status === 'proximo_vencer'
    ).length,
    resultadosNegativos: examesToxicologicos.filter(
      (e) => e.resultado === 'negativo'
    ).length,
    resultadosPositivos: examesToxicologicos.filter(
      (e) => e.resultado === 'positivo'
    ).length,
    resultadosInconclusivos: examesToxicologicos.filter(
      (e) => e.resultado === 'inconclusivo'
    ).length,
    percentualConformidade: examesToxicologicos.length
      ? Math.round(
          (examesToxicologicos.filter((e) => e.status === 'ativo').length /
            examesToxicologicos.length) *
            100
        )
      : 100,
  };

  const ultimosExames = examesToxicologicos.slice(0, 3).map((e) => ({
    funcionarioNome: e.colaborador_nome,
    resultado: e.resultado,
    dataValidade: e.data_validade,
    status: e.status,
  }));

  const nomeUsuario = 'Jorge';
  const horaAtual = new Date().getHours();
  const saudacao =
    horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  // ==================== AÇÕES RÁPIDAS ====================
  const handleQuickAction = (action: string) => {
    if (!onNavigate) {
      alert(`Redirecionando para: ${action}`);
      return;
    }

    const moduleMap: Record<string, string> = {
      'Novo IMC': 'imc',
      'Nova Pressão': 'pressao',
      'Novo Exame': 'toxicologico',
      Relatórios: 'dashboard',
      Certificados: 'certificados',
      Atestados: 'atestados',
    };

    const moduleId = moduleMap[action] || 'dashboard';
    onNavigate(moduleId);
  };

  // ==================== ESTILOS PREMIUM ====================
  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1440px',
      margin: '0 auto',
      fontFamily: '"Inter", -apple-system, sans-serif',
    },

    // ===== HERO =====
    heroContainer: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '24px',
      padding: '32px 40px',
      marginBottom: '32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid #eef2f7',
    },
    heroLeft: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    heroTitle: {
      fontSize: '30px',
      fontWeight: 700,
      color: '#111827',
      margin: 0,
      letterSpacing: '-0.5px',
    },
    heroSubtitle: {
      fontSize: '15px',
      fontWeight: 500,
      color: '#6B7280',
      margin: 0,
    },
    heroRight: {
      textAlign: 'right' as const,
    },
    heroDate: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#111827',
    },
    heroDay: {
      fontSize: '13px',
      fontWeight: 500,
      color: '#6B7280',
    },
    heroTime: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#10B981',
    },

    // ===== STATS GRID =====
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid #eef2f7',
      boxShadow: '0 15px 40px rgba(15,23,42,0.06)',
      transition: 'all 0.25s ease',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    statCardTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statIconWrapper: {
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
    },
    statNumber: {
      fontSize: '42px',
      fontWeight: 800,
      color: '#111827',
      letterSpacing: '-1px',
      lineHeight: 1,
    },
    statLabel: {
      fontSize: '13px',
      fontWeight: 500,
      color: '#6B7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    statComparison: {
      fontSize: '13px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    statWave: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: '4px',
      borderRadius: '0 0 24px 24px',
    },

    // ===== SECONDARY STATS =====
    secondaryStatsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px',
      marginBottom: '32px',
    },
    secondaryStatCard: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid #eef2f7',
      boxShadow: '0 15px 40px rgba(15,23,42,0.04)',
      textAlign: 'center' as const,
      transition: 'all 0.25s ease',
    },
    secondaryStatNumber: {
      fontSize: '22px',
      fontWeight: 800,
      color: '#111827',
    },
    secondaryStatLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: '#6B7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
      marginTop: '4px',
    },

    // ===== MAIN GRID =====
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '24px',
      marginBottom: '32px',
    },

    // ===== CARDS =====
    card: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid #eef2f7',
      boxShadow: '0 15px 40px rgba(15,23,42,0.04)',
      transition: 'all 0.25s ease',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#111827',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardBadge: {
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 10px',
      borderRadius: '20px',
      background: '#f1f5f9',
      color: '#6B7280',
    },

    // ===== PIRÂMIDE =====
    pyramidLevel: {
      marginBottom: '16px',
    },
    pyramidHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
    },
    pyramidName: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    pyramidStats: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#111827',
    },
    pyramidBar: {
      height: '16px',
      background: '#f1f5f9',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    pyramidFill: (width: number, color: string) => ({
      width: `${Math.min(width, 100)}%`,
      height: '100%',
      background: color,
      borderRadius: '8px',
      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    }),

    // ===== TOXICOLÓGICO =====
    toxGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    toxItem: {
      background: '#f8fafc',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid #eef2f7',
    },
    toxLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#6B7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
    },
    toxValue: {
      fontSize: '24px',
      fontWeight: 800,
      color: '#111827',
      marginTop: '4px',
    },

    // ===== TIMELINE =====
    timeline: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    timelineItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: '16px',
      border: '1px solid #eef2f7',
    },
    timelineIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      flexShrink: 0,
    },
    timelineContent: {
      flex: 1,
    },
    timelineName: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#111827',
    },
    timelineDesc: {
      fontSize: '12px',
      color: '#6B7280',
    },
    timelineTime: {
      fontSize: '11px',
      fontWeight: 500,
      color: '#6B7280',
      flexShrink: 0,
    },
    timelineBadge: (bg: string, color: string) => ({
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: 700,
      background: bg,
      color: color,
      textTransform: 'uppercase' as const,
    }),

    // ===== AÇÕES RÁPIDAS =====
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '12px',
    },
    actionButton: (color: string, bg: string) => ({
      padding: '16px',
      borderRadius: '16px',
      border: '1px solid #eef2f7',
      background: bg,
      color: color,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.25s ease',
      boxShadow: '0 15px 40px rgba(15,23,42,0.04)',
      fontSize: '13px',
      fontWeight: 600,
      textAlign: 'center' as const,
      width: '100%',
    }),
    actionIcon: {
      fontSize: '24px',
    },

    // ===== BADGE =====
    badge: (bg: string, color: string) => ({
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 700,
      background: bg,
      color: color,
      textTransform: 'uppercase' as const,
    }),

    // ===== EMPTY STATE =====
    emptyState: {
      textAlign: 'center' as const,
      padding: '24px',
      color: '#6B7280',
      fontSize: '13px',
    },

    // ===== LOADING =====
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '100px',
      gap: '16px',
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid rgba(16,185,129,0.15)',
      borderTop: '4px solid #10B981',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#6B7280', fontWeight: 500 }}>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ===== HERO ===== */}
      <div style={styles.heroContainer}>
        <div style={styles.heroLeft}>
          <h1 style={styles.heroTitle}>
            {saudacao}, {nomeUsuario}! 👋
          </h1>
          <p style={styles.heroSubtitle}>
            Aqui está o resumo da saúde ocupacional de hoje.
          </p>
        </div>
        <div style={styles.heroRight}>
          <div style={styles.heroDate}>{currentDate}</div>
          <div style={styles.heroDay}>{currentDay}</div>
          <div style={styles.heroTime}>{currentTime}</div>
        </div>
      </div>

      {/* ===== CARDS SUPERIORES (4) ===== */}
      <div style={styles.statsGrid}>
        {[
          {
            icon: 'fa-weight-scale',
            color: '#10B981',
            bg: 'rgba(16,185,129,0.08)',
            number: totalColaboradoresIMC,
            label: 'Registros IMC',
            comparison: '+12% vs mês anterior',
            waveColor: '#10B981',
          },
          {
            icon: 'fa-heartbeat',
            color: '#3B82F6',
            bg: 'rgba(59,130,246,0.08)',
            number: bloodPressureRecords.length,
            label: 'Pressão Arterial',
            comparison: '0% vs ontem',
            waveColor: '#3B82F6',
          },
          {
            icon: 'fa-flask',
            color: '#8B5CF6',
            bg: 'rgba(139,92,246,0.08)',
            number: stats.totalExames,
            label: 'Exames Tox.',
            comparison: '0% vs ontem',
            waveColor: '#8B5CF6',
          },
          {
            icon: 'fa-check-circle',
            color: '#10B981',
            bg: 'rgba(16,185,129,0.08)',
            number: `${stats.percentualConformidade}%`,
            label: 'Conformidade',
            comparison: '5% vs mês anterior',
            waveColor: '#10B981',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={styles.statCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow =
                '0 25px 50px rgba(15,23,42,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 15px 40px rgba(15,23,42,0.06)';
            }}
          >
            <div style={styles.statCardTop}>
              <div
                style={{
                  ...styles.statIconWrapper,
                  background: item.bg,
                  color: item.color,
                }}
              >
                <i className={`fas ${item.icon}`}></i>
              </div>
              <div>
                <div style={styles.statNumber}>{item.number}</div>
                <div style={styles.statLabel}>{item.label}</div>
              </div>
            </div>
            <div style={{ ...styles.statComparison, color: '#10B981' }}>
              <span>↑</span> {item.comparison}
            </div>
            <div
              style={{
                ...styles.statWave,
                background: item.waveColor,
                opacity: 0.15,
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* ===== CARDS SECUNDÁRIOS ===== */}
      <div style={styles.secondaryStatsGrid}>
        {[
          {
            number: employees.length,
            label: 'Colaboradores',
            color: '#3B82F6',
          },
          { number: preMerCount, label: 'Pré-mergulho', color: '#8B5CF6' },
          {
            number: totalColaboradoresIMC,
            label: 'Registros IMC',
            color: '#10B981',
          },
          {
            number: bloodPressureRecords.length,
            label: 'Pressão Arterial',
            color: '#EF4444',
          },
          {
            number: medicamentosCount,
            label: 'Medicamentos',
            color: '#F59E0B',
          },
          { number: preEmbarqueCount, label: 'Pré-Embarque', color: '#3B82F6' },
          { number: refeicoesCount, label: 'Refeições', color: '#10B981' },
          {
            number: certificadosCount,
            label: 'Certificados',
            color: '#8B5CF6',
          },
          { number: vacinasCount, label: 'Vacinação', color: '#3B82F6' },
          { number: atestadosCount, label: 'Atestados', color: '#EF4444' },
          {
            number: stats.totalExames,
            label: 'Toxicológico',
            color: '#8B5CF6',
          },
          { number: employees.length, label: 'Prontuários', color: '#F59E0B' },
        ].map((item, idx) => (
          <div
            key={idx}
            style={styles.secondaryStatCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 25px 50px rgba(15,23,42,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 15px 40px rgba(15,23,42,0.04)';
            }}
          >
            <div style={{ ...styles.secondaryStatNumber, color: item.color }}>
              {item.number}
            </div>
            <div style={styles.secondaryStatLabel}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* ===== GRID PRINCIPAL ===== */}
      <div style={styles.mainGrid}>
        {/* PIRÂMIDE DE SAÚDE - 5 colunas */}
        <div style={{ ...styles.card, gridColumn: 'span 5' }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-chart-pie" style={{ color: '#10B981' }}></i>
              Pirâmide de Saúde (IMC)
            </h3>
            <span style={styles.cardBadge}>{totalAvaliados} avaliados</span>
          </div>

          {[
            {
              nome: 'Obesidade Grave',
              cor: '#EF4444',
              icone: '🔴',
              quantidade: nivel4,
              imc: '≥ 35',
            },
            {
              nome: 'Obesidade',
              cor: '#F59E0B',
              icone: '🟠',
              quantidade: nivel3,
              imc: '30-34.9',
            },
            {
              nome: 'Sobrepeso',
              cor: '#3B82F6',
              icone: '🔵',
              quantidade: nivel2,
              imc: '25-29.9',
            },
            {
              nome: 'Saudável',
              cor: '#10B981',
              icone: '🟢',
              quantidade: nivel1,
              imc: '18.5-24.9',
            },
          ].map((nivel, idx) => {
            const percentual =
              totalAvaliados > 0
                ? (nivel.quantidade / totalAvaliados) * 100
                : 0;
            return (
              <div key={idx} style={styles.pyramidLevel}>
                <div style={styles.pyramidHeader}>
                  <div style={styles.pyramidName}>
                    <span>{nivel.icone}</span>
                    {nivel.nome}
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>
                      ({nivel.imc})
                    </span>
                  </div>
                  <div style={{ ...styles.pyramidStats, color: nivel.cor }}>
                    {nivel.quantidade}{' '}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 400,
                        color: '#6B7280',
                      }}
                    >
                      ({percentual.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div style={styles.pyramidBar}>
                  <div style={styles.pyramidFill(percentual, nivel.cor)}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EXAMES TOXICOLÓGICOS - 4 colunas */}
        <div style={{ ...styles.card, gridColumn: 'span 4' }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-microscope" style={{ color: '#8B5CF6' }}></i>
              Exames Toxicológicos
            </h3>
            <span style={styles.cardBadge}>{stats.totalExames} total</span>
          </div>

          <div style={styles.toxGrid}>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Ativos</div>
              <div style={{ ...styles.toxValue, color: '#10B981' }}>
                {stats.ativos}
              </div>
            </div>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Vencidos</div>
              <div style={{ ...styles.toxValue, color: '#EF4444' }}>
                {stats.vencidos}
              </div>
            </div>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Negativos</div>
              <div style={{ ...styles.toxValue, color: '#10B981' }}>
                {stats.resultadosNegativos}
              </div>
            </div>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Positivos</div>
              <div style={{ ...styles.toxValue, color: '#EF4444' }}>
                {stats.resultadosPositivos}
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span
                style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}
              >
                Conformidade Geral
              </span>
              <span
                style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}
              >
                {stats.percentualConformidade}%
              </span>
            </div>
            <div
              style={{
                height: '8px',
                background: '#f1f5f9',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${stats.percentualConformidade}%`,
                  height: '100%',
                  background: '#8B5CF6',
                  borderRadius: '4px',
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>

          {stats.proximosVencer > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(245,158,11,0.08)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#92400e',
              }}
            >
              ⚠️ {stats.proximosVencer} exame(s) próximo(s) ao vencimento
            </div>
          )}
        </div>

        {/* ATIVIDADES RECENTES - 3 colunas */}
        <div style={{ ...styles.card, gridColumn: 'span 3' }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-history" style={{ color: '#3B82F6' }}></i>
              Atividades Recentes
            </h3>
            <span style={styles.cardBadge}>Hoje</span>
          </div>

          <div style={styles.timeline}>
            {ultimosExames.length === 0 && atestadosPendentes.length === 0 ? (
              <p style={styles.emptyState}>Nenhuma atividade recente</p>
            ) : (
              <>
                {ultimosExames.slice(0, 2).map((exame, idx) => (
                  <div key={idx} style={styles.timelineItem}>
                    <div
                      style={{
                        ...styles.timelineIcon,
                        background: 'rgba(139,92,246,0.08)',
                        color: '#8B5CF6',
                      }}
                    >
                      <i className="fas fa-flask"></i>
                    </div>
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineName}>
                        {exame.funcionarioNome || 'Colaborador'}
                      </div>
                      <div style={styles.timelineDesc}>
                        Novo exame toxicológico
                      </div>
                    </div>
                    <div style={styles.timelineTime}>hoje</div>
                    <span
                      style={styles.timelineBadge(
                        exame.resultado === 'negativo'
                          ? 'rgba(16,185,129,0.12)'
                          : 'rgba(239,68,68,0.12)',
                        exame.resultado === 'negativo' ? '#10B981' : '#EF4444'
                      )}
                    >
                      {exame.resultado}
                    </span>
                  </div>
                ))}
                {atestadosPendentes.slice(0, 1).map((atestado) => (
                  <div key={atestado.id} style={styles.timelineItem}>
                    <div
                      style={{
                        ...styles.timelineIcon,
                        background: 'rgba(239,68,68,0.08)',
                        color: '#EF4444',
                      }}
                    >
                      <i className="fas fa-file-medical"></i>
                    </div>
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineName}>
                        {atestado.colaborador_nome}
                      </div>
                      <div style={styles.timelineDesc}>Atestado pendente</div>
                    </div>
                    <div style={styles.timelineTime}>hoje</div>
                    <span
                      style={styles.timelineBadge(
                        'rgba(239,68,68,0.12)',
                        '#EF4444'
                      )}
                    >
                      Pendente
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== AÇÕES RÁPIDAS ===== */}
      <div style={{ ...styles.card, marginBottom: '32px' }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <i className="fas fa-bolt" style={{ color: '#F59E0B' }}></i>
            Ações Rápidas
          </h3>
        </div>
        <div style={styles.actionsGrid}>
          {[
            {
              icon: 'fa-weight-scale',
              label: 'Novo IMC',
              color: '#10B981',
              bg: 'rgba(16,185,129,0.05)',
            },
            {
              icon: 'fa-heartbeat',
              label: 'Nova Pressão',
              color: '#3B82F6',
              bg: 'rgba(59,130,246,0.05)',
            },
            {
              icon: 'fa-flask',
              label: 'Novo Exame',
              color: '#8B5CF6',
              bg: 'rgba(139,92,246,0.05)',
            },
            {
              icon: 'fa-file-alt',
              label: 'Relatórios',
              color: '#F59E0B',
              bg: 'rgba(245,158,11,0.05)',
            },
            {
              icon: 'fa-certificate',
              label: 'Certificados',
              color: '#10B981',
              bg: 'rgba(16,185,129,0.05)',
            },
            {
              icon: 'fa-file-medical',
              label: 'Atestados',
              color: '#EF4444',
              bg: 'rgba(239,68,68,0.05)',
            },
          ].map((action, idx) => (
            <button
              key={idx}
              style={styles.actionButton(action.color, action.bg)}
              onClick={() => handleQuickAction(action.label)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  'translateY(-4px) scale(1.01)';
                e.currentTarget.style.boxShadow =
                  '0 25px 50px rgba(15,23,42,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow =
                  '0 15px 40px rgba(15,23,42,0.04)';
              }}
            >
              <i className={`fas ${action.icon}`} style={styles.actionIcon}></i>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== RESUMO DOS MÓDULOS + VISÃO EPIDEMIOLÓGICA ===== */}
      <div style={styles.mainGrid}>
        {/* RESUMO DOS MÓDULOS - 6 colunas */}
        <div style={{ ...styles.card, gridColumn: 'span 6' }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-th-list" style={{ color: '#6B7280' }}></i>
              Resumo dos Módulos
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {[
              {
                number: employees.length,
                label: 'Colaboradores',
                color: '#3B82F6',
              },
              { number: preMerCount, label: 'Pré-mergulho', color: '#8B5CF6' },
              {
                number: totalColaboradoresIMC,
                label: 'Registros IMC',
                color: '#10B981',
              },
              {
                number: bloodPressureRecords.length,
                label: 'Pressão Arterial',
                color: '#EF4444',
              },
              {
                number: medicamentosCount,
                label: 'Medicamentos',
                color: '#F59E0B',
              },
              {
                number: preEmbarqueCount,
                label: 'Pré-Embarque',
                color: '#3B82F6',
              },
              { number: refeicoesCount, label: 'Refeições', color: '#10B981' },
              {
                number: certificadosCount,
                label: 'Certificados',
                color: '#8B5CF6',
              },
              { number: vacinasCount, label: 'Vacinação', color: '#3B82F6' },
              { number: atestadosCount, label: 'Atestados', color: '#EF4444' },
              {
                number: stats.totalExames,
                label: 'Toxicológico',
                color: '#8B5CF6',
              },
              {
                number: employees.length,
                label: 'Prontuários',
                color: '#F59E0B',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid #eef2f7',
                  textAlign: 'center' as const,
                }}
              >
                <div
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: item.color,
                  }}
                >
                  {item.number}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VISÃO EPIDEMIOLÓGICA - 6 colunas */}
        <div style={{ ...styles.card, gridColumn: 'span 6' }}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <i
                className="fas fa-notes-medical"
                style={{ color: '#F59E0B' }}
              ></i>
              Visão Epidemiológica
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Colaboradores</div>
              <div style={styles.toxValue}>{employees.length}</div>
            </div>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Com IMC Alto</div>
              <div style={{ ...styles.toxValue, color: '#EF4444' }}>
                {nivel2 + nivel3 + nivel4}
              </div>
            </div>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Pressão Crítica</div>
              <div style={{ ...styles.toxValue, color: '#EF4444' }}>
                {
                  bloodPressureRecords.filter(
                    (r) => r.systolic >= 140 || r.diastolic >= 90
                  ).length
                }
              </div>
            </div>
            <div style={styles.toxItem}>
              <div style={styles.toxLabel}>Exames Vencidos</div>
              <div style={{ ...styles.toxValue, color: '#EF4444' }}>
                {stats.vencidos}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(245,158,11,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(245,158,11,0.15)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: '#92400e',
                textAlign: 'center',
              }}
            >
              <i
                className="fas fa-info-circle"
                style={{ marginRight: '8px' }}
              ></i>
              {stats.vencidos > 0 || nivel2 + nivel3 + nivel4 > 0
                ? `⚠️ ${stats.vencidos} exames vencidos e ${
                    nivel2 + nivel3 + nivel4
                  } colaboradores com sobrepeso/obesidade`
                : '✅ Todos os indicadores estão dentro dos parâmetros esperados.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
