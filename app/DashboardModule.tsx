// app/DashboardModule.tsx - VERSÃO REFORMULADA COM DESIGN 2000% MELHORADO
'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface DashboardModuleProps {
  employees: any[];
  bloodPressureRecords: any[];
  styles: any;
  onNavigate?: (module: string) => void;
  userNome?: string;
}

export default function DashboardModule({
  employees,
  bloodPressureRecords,
  styles: oldStyles,
  onNavigate,
  userNome = 'Usuário',
}: DashboardModuleProps) {
  const [examesToxicologicos, setExamesToxicologicos] = useState<any[]>([]);
  const [imcRecords, setImcRecords] = useState<any[]>([]);
  const [allImcRecords, setAllImcRecords] = useState<any[]>([]);
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

      setAllImcRecords(allData);

      if (allData.length === 0) {
        setImcRecords([]);
        return;
      }

      const firstRecord = allData[0];
      if (firstRecord.mes === undefined || firstRecord.ano === undefined) {
        console.error('❌ Colunas "mes" e "ano" não encontradas!');
        setImcRecords(allData);
        return;
      }

      const latestRecord = allData.reduce((latest, current) => {
        if (current.ano > latest.ano) return current;
        if (current.ano === latest.ano && current.mes > latest.mes)
          return current;
        return latest;
      });

      const mes = latestRecord.mes;
      const ano = latestRecord.ano;

      const filteredData = allData.filter((record) => {
        return record.mes === mes && record.ano === ano;
      });

      setImcRecords(filteredData);
    } catch (error) {
      console.error('❌ Erro ao carregar IMC:', error);
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
      .from('emergency_kits')
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

  const horaAtual = new Date().getHours();
  const saudacao =
    horaAtual < 12 ? 'Bom dia' : horaAtual < 18 ? 'Boa tarde' : 'Boa noite';

  // ==================== CÁLCULO DE PERCENTUAIS ====================
  const totalEmployees = employees.length;

  const imcPercentual =
    totalEmployees > 0
      ? Math.round((totalColaboradoresIMC / totalEmployees) * 100)
      : 0;

  const pressaoPercentual =
    totalEmployees > 0
      ? Math.round((bloodPressureRecords.length / totalEmployees) * 100)
      : 0;

  const medicamentosPercentual =
    totalEmployees > 0
      ? Math.round((medicamentosCount / totalEmployees) * 100)
      : 0;

  const atestadosPercentual =
    totalEmployees > 0
      ? Math.round((atestadosCount / totalEmployees) * 100)
      : 0;

  const toxPercentual =
    totalEmployees > 0
      ? Math.round((stats.totalExames / totalEmployees) * 100)
      : 0;

  const certificadosPercentual =
    totalEmployees > 0
      ? Math.round((certificadosCount / totalEmployees) * 100)
      : 0;

  const vacinasPercentual =
    totalEmployees > 0 ? Math.round((vacinasCount / totalEmployees) * 100) : 0;

  const preMerPercentual =
    totalEmployees > 0 ? Math.round((preMerCount / totalEmployees) * 100) : 0;

  // ==================== COMPARATIVO MÊS ANTERIOR ====================
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  let mesAtual = 0;
  let anoAtual = 0;
  let registrosMesAtual = totalColaboradoresIMC;

  if (imcRecords.length > 0) {
    const firstRecord = imcRecords[0];
    mesAtual = firstRecord.mes;
    anoAtual = firstRecord.ano;
  }

  let mesAnterior = mesAtual - 1;
  let anoAnterior = anoAtual;
  if (mesAnterior < 0) {
    mesAnterior = 11;
    anoAnterior = anoAtual - 1;
  }

  const registrosMesAnterior = allImcRecords.filter((record) => {
    return record.mes === mesAnterior && record.ano === anoAnterior;
  }).length;

  const diferencaIMC = registrosMesAtual - registrosMesAnterior;
  const percentualDiferenca =
    registrosMesAnterior > 0
      ? Math.round((diferencaIMC / registrosMesAnterior) * 100)
      : 0;

  const nomeMesAnterior = meses[mesAnterior];
  const nomeMesAtual = meses[mesAtual];

  // ==================== AÇÕES RÁPIDAS ====================
  const handleQuickAction = (action: string) => {
    const moduleMap: Record<string, string> = {
      'Novo IMC': 'imc',
      'Nova Pressão': 'pressao',
      'Novo Exame': 'toxicologico',
      Relatórios: 'dashboard',
      Certificados: 'certificados',
      Atestados: 'atestados',
      'Pré-Embarque': 'preembarque',
      'Pré-mergulho': 'premer',
      Colaboradores: 'funcionarios',
      Vacinação: 'vacinacao',
    };

    const moduleId = moduleMap[action];

    if (moduleId && onNavigate) {
      onNavigate(moduleId);
    } else if (moduleId && !onNavigate) {
      console.log(`Navegando para: ${moduleId} (ação: ${action})`);
      alert(`Redirecionando para: ${action} (${moduleId})`);
    } else {
      console.warn(`Ação sem mapeamento: ${action}`);
      alert(`Redirecionando para: ${action}`);
    }
  };

  // ==================== PALETA DE CORES PREMIUM ====================
  const colors = {
    // Cores Primárias - Verde Profissional
    primary: '#00A86B', // Verde Esmeralda
    primaryLight: '#E8F7F0', // Verde muito claro
    primaryDark: '#007A52', // Verde escuro

    // Cores Secundárias - Azul Moderno
    secondary: '#0066CC', // Azul Profissional
    secondaryLight: '#E6F0FF', // Azul muito claro
    secondaryDark: '#004A99', // Azul escuro

    // Cores de Ênfase
    accent: '#FF6B35', // Laranja Vibrante
    accentLight: '#FFF0E6', // Laranja muito claro
    accentDark: '#CC5528', // Laranja escuro

    // Cores de Status
    success: '#00A86B', // Verde
    warning: '#FFA500', // Laranja
    danger: '#E63946', // Vermelho
    info: '#0066CC', // Azul

    // Cores Neutras
    dark: '#1A1A2E', // Quase preto
    darkGray: '#2D3E50', // Cinza escuro
    gray: '#6B7280', // Cinza médio
    lightGray: '#E5E7EB', // Cinza claro
    white: '#FFFFFF', // Branco
    background: '#F8FAFC', // Fundo muito claro
  };

  // ==================== ESTILOS REFORMULADOS ====================
  const styles = {
    container: {
      padding: '32px',
      maxWidth: '1600px',
      margin: '0 auto',
      fontFamily: '"Segoe UI", "Roboto", -apple-system, sans-serif',
      background: '#f5f0eb',  
      minHeight: '100vh',
    },

    // ===== HERO SECTION =====
    heroContainer: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      borderRadius: '32px',
      padding: '40px 48px',
      marginBottom: '40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: `0 20px 60px rgba(0, 168, 107, 0.15)`,
      color: colors.white,
      position: 'relative' as const,
      overflow: 'hidden',
    },

    heroLeft: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      zIndex: 1,
    },

    heroTitle: {
      fontSize: '36px',
      fontWeight: 700,
      color: colors.white,
      margin: 0,
      letterSpacing: '-0.5px',
    },

    heroSubtitle: {
      fontSize: '16px',
      fontWeight: 400,
      color: 'rgba(255, 255, 255, 0.85)',
      margin: 0,
    },

    heroRight: {
      textAlign: 'right' as const,
      zIndex: 1,
    },

    heroDate: {
      fontSize: '18px',
      fontWeight: 600,
      color: colors.white,
      marginBottom: '4px',
    },

    heroDay: {
      fontSize: '14px',
      fontWeight: 400,
      color: 'rgba(255, 255, 255, 0.85)',
      marginBottom: '8px',
    },

    heroTime: {
      fontSize: '28px',
      fontWeight: 700,
      color: 'rgba(255, 255, 255, 0.95)',
    },

    // ===== STATS GRID =====
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '40px',
    },

    statCard: {
      background: colors.white,
      borderRadius: '28px',
      padding: '28px',
      border: `2px solid ${colors.lightGray}`,
      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.05)`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      position: 'relative' as const,
      overflow: 'hidden',
      cursor: 'pointer',
    },

    statCardHover: {
      transform: 'translateY(-8px)',
      boxShadow: `0 20px 50px rgba(0, 0, 0, 0.1)`,
      borderColor: colors.primary,
    },

    statCardTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    },

    statIconWrapper: {
      width: '64px',
      height: '64px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      flexShrink: 0,
    },

    statNumber: {
      fontSize: '48px',
      fontWeight: 800,
      color: colors.dark,
      letterSpacing: '-1px',
      lineHeight: 1,
    },

    statLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.gray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.8px',
    },

    statComparison: {
      fontSize: '14px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      borderRadius: '12px',
      width: 'fit-content',
    },

    // ===== SECONDARY STATS =====
    secondaryStatsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '16px',
      marginBottom: '40px',
    },

    secondaryStatCard: {
      background: colors.white,
      borderRadius: '24px',
      padding: '20px',
      border: `1px solid ${colors.lightGray}`,
      boxShadow: `0 8px 20px rgba(0, 0, 0, 0.04)`,
      textAlign: 'center' as const,
      transition: 'all 0.3s ease',
    },

    secondaryStatNumber: {
      fontSize: '28px',
      fontWeight: 800,
      color: colors.dark,
    },

    secondaryStatLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: colors.gray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginTop: '6px',
    },

    secondaryStatPercent: {
      fontSize: '12px',
      fontWeight: 700,
      marginTop: '4px',
    },

    // ===== MAIN GRID =====
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '24px',
      marginBottom: '40px',
    },

    // ===== CARDS =====
    card: {
      background: colors.white,
      borderRadius: '28px',
      padding: '28px',
      border: `1px solid ${colors.lightGray}`,
      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.05)`,
      transition: 'all 0.3s ease',
    },

    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: `2px solid ${colors.lightGray}`,
    },

    cardTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: colors.dark,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },

    cardBadge: {
      fontSize: '12px',
      fontWeight: 700,
      padding: '6px 14px',
      borderRadius: '20px',
      background: colors.primaryLight,
      color: colors.primary,
      textTransform: 'uppercase' as const,
    },

    // ===== PYRAMID =====
    pyramidLevel: {
      marginBottom: '20px',
    },

    pyramidHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },

    pyramidName: {
      fontSize: '15px',
      fontWeight: 600,
      color: colors.dark,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },

    pyramidStats: {
      fontSize: '15px',
      fontWeight: 700,
      color: colors.dark,
    },

    pyramidBar: {
      height: '20px',
      background: colors.lightGray,
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative' as const,
      boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.05)`,
    },

    pyramidFill: (width: number, color: string) => ({
      width: `${Math.min(width, 100)}%`,
      height: '100%',
      background: color,
      borderRadius: '12px',
      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`,
    }),

    // ===== TOX GRID =====
    toxGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '20px',
    },

    toxItem: {
      background: colors.background,
      borderRadius: '20px',
      padding: '20px',
      border: `2px solid ${colors.lightGray}`,
      transition: 'all 0.3s ease',
    },

    toxLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: colors.gray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },

    toxValue: {
      fontSize: '28px',
      fontWeight: 800,
      color: colors.dark,
      marginTop: '6px',
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
      gap: '14px',
      padding: '14px 18px',
      background: colors.background,
      borderRadius: '18px',
      border: `1px solid ${colors.lightGray}`,
      transition: 'all 0.3s ease',
    },

    timelineIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      flexShrink: 0,
    },

    timelineContent: {
      flex: 1,
    },

    timelineName: {
      fontSize: '15px',
      fontWeight: 600,
      color: colors.dark,
    },

    timelineDesc: {
      fontSize: '13px',
      color: colors.gray,
      marginTop: '2px',
    },

    timelineTime: {
      fontSize: '12px',
      fontWeight: 500,
      color: colors.gray,
      flexShrink: 0,
    },

    timelineBadge: (bg: string, color: string) => ({
      padding: '4px 12px',
      borderRadius: '14px',
      fontSize: '11px',
      fontWeight: 700,
      background: bg,
      color: color,
      textTransform: 'uppercase' as const,
    }),

    // ===== ACTIONS =====
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '14px',
    },

    actionButton: (color: string, bg: string) => ({
      padding: '18px 16px',
      borderRadius: '20px',
      border: `2px solid ${color}`,
      background: bg,
      color: color,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 8px 20px rgba(0, 0, 0, 0.04)`,
      fontSize: '13px',
      fontWeight: 700,
      textAlign: 'center' as const,
      width: '100%',
    }),

    actionIcon: {
      fontSize: '28px',
    },

    // ===== BADGES =====
    badge: (bg: string, color: string) => ({
      padding: '6px 14px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 700,
      background: bg,
      color: color,
      textTransform: 'uppercase' as const,
    }),

    // ===== EMPTY STATE =====
    emptyState: {
      textAlign: 'center' as const,
      padding: '32px',
      color: colors.gray,
      fontSize: '14px',
    },

    // ===== LOADING =====
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 32px',
      gap: '20px',
    },

    spinner: {
      width: '56px',
      height: '56px',
      border: `4px solid ${colors.lightGray}`,
      borderTop: `4px solid ${colors.primary}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },

    loadingText: {
      color: colors.gray,
      fontWeight: 500,
      fontSize: '15px',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={styles.loadingText}>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* ===== HERO SECTION ===== */}
      <div style={styles.heroContainer}>
        <div style={styles.heroLeft}>
          <h1 style={styles.heroTitle}>
            {saudacao}, {userNome}! 👋
          </h1>
          <p style={styles.heroSubtitle}>
            Resumo executivo da saúde ocupacional
          </p>
        </div>
        <div style={styles.heroRight}>
          <div style={styles.heroDate}>{currentDate}</div>
          <div style={styles.heroDay}>{currentDay}</div>
          <div style={styles.heroTime}>{currentTime}</div>
        </div>
      </div>

      {/* ===== MAIN STATS (4 CARDS) ===== */}
      <div style={styles.statsGrid}>
        {[
          {
            icon: '⚖️',
            color: colors.primary,
            bg: colors.primaryLight,
            number: registrosMesAtual || totalColaboradoresIMC,
            label: 'Registros IMC',
            comparison: `${diferencaIMC > 0 ? '↑' : '↓'} ${Math.abs(
              diferencaIMC
            )} (${
              percentualDiferenca > 0 ? '+' : ''
            }${percentualDiferenca}%) vs ${nomeMesAnterior}`,
            comparisonColor: diferencaIMC > 0 ? colors.success : colors.danger,
          },
          {
            icon: '❤️',
            color: colors.secondary,
            bg: colors.secondaryLight,
            number: bloodPressureRecords.length,
            label: 'Pressão Arterial',
            comparison: `${pressaoPercentual}% dos colaboradores`,
            comparisonColor: colors.secondary,
          },
          {
            icon: '🧪',
            color: colors.accent,
            bg: colors.accentLight,
            number: stats.totalExames,
            label: 'Exames Tox.',
            comparison: `${toxPercentual}% dos colaboradores`,
            comparisonColor: colors.accent,
          },
          {
            icon: '✅',
            color: colors.success,
            bg: colors.primaryLight,
            number: `${stats.percentualConformidade}%`,
            label: 'Conformidade',
            comparison: 'Taxa de exames ativos',
            comparisonColor: colors.success,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={styles.statCard}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, styles.statCardHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.05)`;
              e.currentTarget.style.borderColor = colors.lightGray;
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
                {item.icon}
              </div>
              <div>
                <div style={styles.statNumber}>{item.number}</div>
                <div style={styles.statLabel}>{item.label}</div>
              </div>
            </div>
            <div
              style={{
                ...styles.statComparison,
                background: `${item.comparisonColor}15`,
                color: item.comparisonColor,
              }}
            >
              {item.comparison.includes('↑')
                ? '📈'
                : item.comparison.includes('↓')
                ? '📉'
                : '→'}{' '}
              {item.comparison}
            </div>
          </div>
        ))}
      </div>

      {/* ===== SECONDARY STATS ===== */}
      <div style={styles.secondaryStatsGrid}>
        {[
          {
            number: employees.length,
            label: 'Colaboradores',
            color: colors.secondary,
            percent: '100%',
          },
          {
            number: preMerCount,
            label: 'Pré-mergulho',
            color: colors.accent,
            percent: `${preMerPercentual}%`,
          },
          {
            number: registrosMesAtual || totalColaboradoresIMC,
            label: 'Registros IMC',
            color: colors.primary,
            percent: `${imcPercentual}%`,
          },
          {
            number: bloodPressureRecords.length,
            label: 'Pressão Arterial',
            color: colors.danger,
            percent: `${pressaoPercentual}%`,
          },
          {
            number: medicamentosCount,
            label: 'Medicamentos',
            color: colors.warning,
            percent: `${medicamentosPercentual}%`,
          },
          {
            number: preEmbarqueCount,
            label: 'Pré-Embarque',
            color: colors.secondary,
            percent: '0%',
          },
          {
            number: refeicoesCount,
            label: 'Refeições',
            color: colors.primary,
            percent: '0%',
          },
          {
            number: certificadosCount,
            label: 'Certificados',
            color: colors.secondary,
            percent: `${certificadosPercentual}%`,
          },
          {
            number: vacinasCount,
            label: 'Vacinação',
            color: colors.success,
            percent: `${vacinasPercentual}%`,
          },
          {
            number: atestadosCount,
            label: 'Atestados',
            color: colors.danger,
            percent: `${atestadosPercentual}%`,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={styles.secondaryStatCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.08)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.04)`;
            }}
          >
            <div style={{ ...styles.secondaryStatNumber, color: item.color }}>
              {item.number}
            </div>
            <div style={styles.secondaryStatLabel}>{item.label}</div>
            <div style={{ ...styles.secondaryStatPercent, color: item.color }}>
              {item.percent}
            </div>
          </div>
        ))}
      </div>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div style={styles.mainGrid}>
        {/* ===== PYRAMID CARD (8 cols) ===== */}
        <div style={{ ...styles.card, gridColumn: 'span 8' }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>📊 Pirâmide de Saúde (IMC)</h2>
            <span style={styles.cardBadge}>{totalAvaliados} avaliados</span>
          </div>

          {[
            {
              name: 'Abaixo do peso',
              imc: '< 18,5',
              count: nivel1,
              color: colors.secondary,
              icon: '📉',
            },
            {
              name: 'Saudável',
              imc: '18,5 - 24,9',
              count: nivel2,
              color: colors.success,
              icon: '✅',
            },
            {
              name: 'Sobrepeso',
              imc: '25 - 29,9',
              count: nivel3,
              color: colors.warning,
              icon: '⚠️',
            },
            {
              name: 'Obesidade Grave',
              imc: '≥ 35',
              count: nivel4,
              color: colors.danger,
              icon: '🔴',
            },
          ].map((level, idx) => (
            <div key={idx} style={styles.pyramidLevel}>
              <div style={styles.pyramidHeader}>
                <div style={styles.pyramidName}>
                  <span>{level.icon}</span>
                  <span>
                    {level.name} ({level.imc})
                  </span>
                </div>
                <div style={{ ...styles.pyramidStats, color: level.color }}>
                  {level.count} (
                  {Math.round((level.count / totalAvaliados) * 100)}%)
                </div>
              </div>
              <div style={styles.pyramidBar}>
                <div
                  style={styles.pyramidFill(
                    (level.count / totalAvaliados) * 100,
                    level.color
                  )}
                ></div>
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: colors.primaryLight,
              borderRadius: '16px',
              fontSize: '13px',
              color: colors.primary,
              fontWeight: 600,
            }}
          >
            ℹ️ Total de registros: {totalAvaliados} colaboradores avaliados
          </div>
        </div>

        {/* ===== TOXICOLOGICAL EXAMS CARD (4 cols) ===== */}
        <div style={{ ...styles.card, gridColumn: 'span 4' }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>🧪 Exames Toxicológicos</h2>
          </div>

          <div style={styles.toxGrid}>
            {[
              { label: 'Ativos', value: stats.ativos, color: colors.success },
              {
                label: 'Vencidos',
                value: stats.vencidos,
                color: colors.danger,
              },
              {
                label: 'Próx. Vencer',
                value: stats.proximosVencer,
                color: colors.warning,
              },
              {
                label: 'Total',
                value: stats.totalExames,
                color: colors.secondary,
              },
            ].map((item, idx) => (
              <div key={idx} style={styles.toxItem}>
                <div style={styles.toxLabel}>{item.label}</div>
                <div style={{ ...styles.toxValue, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: colors.gray,
                marginBottom: '8px',
              }}
            >
              CONFORMIDADE GERAL
            </div>
            <div
              style={{
                height: '24px',
                background: colors.lightGray,
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${stats.percentualConformidade}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.success})`,
                  transition: 'width 0.8s ease',
                }}
              ></div>
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: colors.dark,
                marginTop: '8px',
              }}
            >
              {stats.percentualConformidade}%
            </div>
          </div>

          <div style={styles.toxGrid}>
            {[
              {
                label: 'Negativos',
                value: stats.resultadosNegativos,
                color: colors.success,
              },
              {
                label: 'Positivos',
                value: stats.resultadosPositivos,
                color: colors.danger,
              },
              {
                label: 'Inconclusivos',
                value: stats.resultadosInconclusivos,
                color: colors.warning,
              },
            ].map((item, idx) => (
              <div key={idx} style={styles.toxItem}>
                <div style={styles.toxLabel}>{item.label}</div>
                <div style={{ ...styles.toxValue, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RECENT ACTIVITIES & EPIDEMIOLOGICAL VIEW ===== */}
      <div style={styles.mainGrid}>
        {/* ===== RECENT ACTIVITIES (6 cols) ===== */}
        <div style={{ ...styles.card, gridColumn: 'span 6' }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>⏱️ Atividades Recentes</h2>
          </div>

          {atestadosPendentes.length > 0 ? (
            <div style={styles.timeline}>
              {atestadosPendentes.map((item, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div
                    style={{
                      ...styles.timelineIcon,
                      background: '#FFF0E6',
                      color: colors.accent,
                    }}
                  >
                    📄
                  </div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineName}>
                      {item.colaborador_nome}
                    </div>
                    <div style={styles.timelineDesc}>Atestado pendente</div>
                  </div>
                  <div
                    style={{
                      ...styles.timelineBadge('#FFF0E6', colors.accent),
                    }}
                  >
                    Pendente
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>✅ Nenhuma atividade pendente</div>
          )}
        </div>

        {/* ===== EPIDEMIOLOGICAL VIEW (6 cols) ===== */}
        <div style={{ ...styles.card, gridColumn: 'span 6' }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>👁️ Visão Epidemiológica</h2>
          </div>

          <div style={styles.toxGrid}>
            {[
              {
                label: 'Total de Casos',
                value: stats.totalExames,
                color: colors.secondary,
              },
              {
                label: 'Taxa de Absenteísmo',
                value: '0%',
                color: colors.success,
              },
            ].map((item, idx) => (
              <div key={idx} style={styles.toxItem}>
                <div style={styles.toxLabel}>{item.label}</div>
                <div style={{ ...styles.toxValue, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div
        style={{
          marginTop: '40px',
          padding: '32px',
          background: colors.white,
          borderRadius: '28px',
          border: `1px solid ${colors.lightGray}`,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.05)`,
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: colors.dark,
            marginBottom: '24px',
            margin: 0,
            marginBottom: '24px',
          }}
        >
          ⚡ Ações Rápidas
        </h2>

        <div style={styles.actionsGrid}>
          {[
            { label: 'Novo IMC', icon: '⚖️', color: colors.primary },
            { label: 'Nova Pressão', icon: '❤️', color: colors.secondary },
            { label: 'Novo Exame', icon: '🧪', color: colors.accent },
            { label: 'Certificados', icon: '📜', color: colors.secondary },
            { label: 'Atestados', icon: '📋', color: colors.danger },
            { label: 'Vacinação', icon: '💉', color: colors.success },
            { label: 'Pré-Mergulho', icon: '🤿', color: colors.secondary },
            { label: 'Colaboradores', icon: '👥', color: colors.primary },
          ].map((action, idx) => (
            <button
              key={idx}
              style={styles.actionButton(action.color, `${action.color}08`)}
              onClick={() => handleQuickAction(action.label)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${action.color}15`;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${action.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${action.color}08`;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 0, 0, 0.04)`;
              }}
            >
              <div style={styles.actionIcon}>{action.icon}</div>
              <div>{action.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
