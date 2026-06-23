// app/DashboardModule.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface DashboardModuleProps {
  employees: any[];
  bloodPressureRecords: any[];
  styles: any;
}

export default function DashboardModule({
  employees,
  bloodPressureRecords,
  styles: oldStyles,
}: DashboardModuleProps) {
  const [examesToxicologicos, setExamesToxicologicos] = useState<any[]>([]);
  const [imcRecords, setImcRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // ==================== CARREGAR EXAMES DO SUPABASE ====================
  const carregarExames = async () => {
    const { data, error } = await supabase
      .from('exames_toxicologicos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExamesToxicologicos(data);
    }
  };

  // ==================== CARREGAR TODOS OS REGISTROS IMC COM PAGINAÇÃO ====================
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

  useEffect(() => {
    Promise.all([carregarExames(), carregarImcRecords()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // ==================== PIRÂMIDE DE SAÚDE (usando imc_records) ====================
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

  const ultimosExames = examesToxicologicos.slice(0, 5).map((e) => ({
    funcionarioNome: e.colaborador_nome,
    resultado: e.resultado,
    dataValidade: e.data_validade,
    status: e.status,
  }));

  // ==================== ESTILOS ====================
  const styles = {
    container: {
      padding: '24px',
      color: '#3d3d3d', // Cinza escuro para textos principais
      fontFamily: '"Inter", -apple-system, sans-serif',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '32px',
    },
    statCard: {
      background: '#ffffff',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid #e8e0d8',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'default',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    statIcon: {
      fontSize: '28px',
      color: '#10b981',
      background: 'rgba(16, 185, 129, 0.1)',
      width: '56px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '14px',
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: 800,
      margin: 0,
      color: '#1a1a1a', // Cinza MUITO escuro (quase preto) para números
      letterSpacing: '-0.5px',
    },
    statLabel: {
      fontSize: '13px',
      color: '#6b6b6b', // Cinza escuro para labels
      margin: '4px 0 0 0',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
      gap: '24px',
    },
    card: {
      background: '#ffffff',
      borderRadius: '24px',
      padding: '28px',
      border: '1px solid #e8e0d8',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid #f0ebe6',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 700,
      margin: 0,
      color: '#2d2d2d', // Cinza escuro para títulos
    },
    cardIcon: {
      color: '#10b981',
      fontSize: '20px',
    },
    pyramidLevel: {
      marginBottom: '18px',
    },
    levelHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    levelName: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#3d3d3d', // Cinza escuro
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    levelStats: {
      fontSize: '14px',
      fontWeight: 700,
      color: '#1a1a1a', // Cinza MUITO escuro para números
    },
    progressBar: {
      height: '12px',
      background: '#f0ebe6',
      borderRadius: '6px',
      overflow: 'hidden',
    },
    progressFill: (width: number, color: string) => ({
      width: `${width}%`,
      height: '100%',
      background: color,
      borderRadius: '6px',
      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 0 12px ${color}44`,
    }),
    indicatorGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
    },
    indicatorItem: {
      padding: '16px',
      background: '#f8f5f2',
      borderRadius: '16px',
      border: '1px solid #f0ebe6',
    },
    indicatorLabel: {
      fontSize: '12px',
      color: '#6b6b6b', // Cinza escuro
      marginBottom: '8px',
      display: 'block',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    indicatorValue: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#1a1a1a', // Cinza MUITO escuro para números
    },
    list: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      background: '#f8f5f2',
      borderRadius: '12px',
      border: '1px solid #f0ebe6',
    },
    listItemName: {
      fontWeight: 600,
      fontSize: '14px',
      color: '#2d2d2d', // Cinza escuro
    },
    listItemSub: {
      fontSize: '12px',
      color: '#6b6b6b', // Cinza escuro
      marginTop: '2px',
    },
    badge: (bgColor: string, textColor: string) => ({
      padding: '4px 12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: bgColor,
      color: textColor,
      textTransform: 'uppercase' as const,
    }),
    emptyState: {
      textAlign: 'center' as const,
      color: '#6b6b6b',
      padding: '20px',
      fontSize: '14px',
    },
    warningBox: {
      marginTop: '20px',
      padding: '16px',
      background: 'rgba(245, 158, 11, 0.08)',
      borderRadius: '16px',
      border: '1px dashed rgba(245, 158, 11, 0.25)',
    },
    warningText: {
      margin: 0,
      fontSize: '13px',
      color: '#92400e',
      textAlign: 'center' as const,
    },
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(16, 185, 129, 0.15)',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#6b6b6b', fontWeight: 500 }}>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Primeira linha de cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <i className="fas fa-users"></i>
          </div>
          <div>
            <h3 style={styles.statNumber}>{totalColaboradoresIMC}</h3>
            <p style={styles.statLabel}>Registros IMC</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
            }}
          >
            <i className="fas fa-heartbeat"></i>
          </div>
          <div>
            <h3 style={styles.statNumber}>{bloodPressureRecords.length}</h3>
            <p style={styles.statLabel}>Pressão Arterial</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              color: '#8b5cf6',
              background: 'rgba(139, 92, 246, 0.1)',
            }}
          >
            <i className="fas fa-flask"></i>
          </div>
          <div>
            <h3 style={styles.statNumber}>{stats.totalExames}</h3>
            <p style={styles.statLabel}>Exames Tox.</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statIcon,
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
            }}
          >
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <h3 style={styles.statNumber}>{stats.percentualConformidade}%</h3>
            <p style={styles.statLabel}>Conformidade</p>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div style={styles.dashboardGrid}>
        {/* PIRÂMIDE DE SAÚDE */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <i className="fas fa-chart-pie" style={styles.cardIcon}></i>
            <h3 style={styles.cardTitle}>Pirâmide de Saúde (IMC)</h3>
          </div>

          <div>
            {[
              {
                nome: 'Obesidade Grave',
                cor: '#ef4444',
                icone: '🔴',
                quantidade: nivel4,
                imc: '≥ 35',
              },
              {
                nome: 'Obesidade',
                cor: '#f59e0b',
                icone: '🟠',
                quantidade: nivel3,
                imc: '30-34.9',
              },
              {
                nome: 'Sobrepeso',
                cor: '#3b82f6',
                icone: '🔵',
                quantidade: nivel2,
                imc: '25-29.9',
              },
              {
                nome: 'Saudável',
                cor: '#10b981',
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
                  <div style={styles.levelHeader}>
                    <div style={styles.levelName}>
                      <span>{nivel.icone}</span>
                      {nivel.nome}{' '}
                      <span style={{ fontSize: '11px', color: '#6b6b6b' }}>
                        ({nivel.imc})
                      </span>
                    </div>
                    <div style={{ ...styles.levelStats, color: nivel.cor }}>
                      {nivel.quantidade}{' '}
                      <span
                        style={{
                          color: '#6b6b6b',
                          fontSize: '12px',
                          fontWeight: 400,
                        }}
                      >
                        ({percentual.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={styles.progressFill(percentual, nivel.cor)}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status dos Exames Toxicológicos */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <i
              className="fas fa-microscope"
              style={{ ...styles.cardIcon, color: '#8b5cf6' }}
            ></i>
            <h3 style={styles.cardTitle}>Exames Toxicológicos</h3>
          </div>
          <div style={styles.indicatorGrid}>
            <div style={styles.indicatorItem}>
              <label style={styles.indicatorLabel}>Ativos</label>
              <div style={{ ...styles.indicatorValue, color: '#10b981' }}>
                {stats.ativos}
              </div>
            </div>
            <div style={styles.indicatorItem}>
              <label style={styles.indicatorLabel}>Vencidos</label>
              <div style={{ ...styles.indicatorValue, color: '#ef4444' }}>
                {stats.vencidos}
              </div>
            </div>
            <div style={styles.indicatorItem}>
              <label style={styles.indicatorLabel}>Negativos</label>
              <div style={{ ...styles.indicatorValue, color: '#10b981' }}>
                {stats.resultadosNegativos}
              </div>
            </div>
            <div style={styles.indicatorItem}>
              <label style={styles.indicatorLabel}>Positivos</label>
              <div style={{ ...styles.indicatorValue, color: '#ef4444' }}>
                {stats.resultadosPositivos}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#6b6b6b',
              }}
            >
              <span>Conformidade Geral</span>
              <span style={{ color: '#1a1a1a', fontWeight: 700 }}>
                {stats.percentualConformidade}%
              </span>
            </div>
            <div style={styles.progressBar}>
              <div
                style={styles.progressFill(
                  stats.percentualConformidade,
                  '#8b5cf6'
                )}
              ></div>
            </div>
          </div>
        </div>

        {/* Últimos Exames */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <i
              className="fas fa-history"
              style={{ ...styles.cardIcon, color: '#3b82f6' }}
            ></i>
            <h3 style={styles.cardTitle}>Atividades Recentes</h3>
          </div>
          <div style={styles.list}>
            {ultimosExames.length === 0 ? (
              <p style={styles.emptyState}>Nenhum registro recente.</p>
            ) : (
              ultimosExames.map((exame, idx) => (
                <div key={idx} style={styles.listItem}>
                  <div>
                    <div style={styles.listItemName}>
                      {exame.funcionarioNome}
                    </div>
                    <div style={styles.listItemSub}>
                      Vence em:{' '}
                      {new Date(exame.dataValidade).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={styles.badge(
                        exame.resultado === 'negativo'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                        exame.resultado === 'negativo' ? '#10b981' : '#ef4444'
                      )}
                    >
                      {exame.resultado}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: exame.status === 'ativo' ? '#10b981' : '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      {exame.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Indicadores de Saúde */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <i
              className="fas fa-notes-medical"
              style={{ ...styles.cardIcon, color: '#f59e0b' }}
            ></i>
            <h3 style={styles.cardTitle}>Visão Epidemiológica</h3>
          </div>
          <div style={styles.indicatorGrid}>
            <div style={styles.indicatorItem}>
              <label style={styles.indicatorLabel}>Total de Casos</label>
              <div style={styles.indicatorValue}>0</div>
            </div>
            <div style={styles.indicatorItem}>
              <label style={styles.indicatorLabel}>Absenteísmo</label>
              <div style={styles.indicatorValue}>0%</div>
            </div>
          </div>
          <div style={styles.warningBox}>
            <p style={styles.warningText}>
              <i
                className="fas fa-info-circle"
                style={{ marginRight: '8px' }}
              ></i>
              Nenhuma variação epidemiológica detectada no período.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
