// app/DashboardModule.tsx - VERSÃO MINIMALISTA COM CORES SUAVES
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

  const calculateBMI = (
    weight: number | string,
    height: number | string
  ): number => {
    const peso = typeof weight === 'string' ? parseFloat(weight) : weight;
    let altura = typeof height === 'string' ? parseFloat(height) : height;
    if (!peso || !altura || peso <= 0 || altura <= 0) return 0;
    if (isNaN(peso) || isNaN(altura)) return 0;
    if (altura > 3) altura = altura / 100;
    return Math.round((peso / (altura * altura)) * 10) / 10;
  };

  const carregarExames = async () => {
    const { data } = await supabase
      .from('exames_toxicologicos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setExamesToxicologicos(data);
  };

  const carregarImcRecords = async () => {
    try {
      let allData: any[] = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const { data } = await supabase
          .from('imc_records')
          .select('*')
          .range(page * 1000, page * 1000 + 999);
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          hasMore = data.length === 1000;
        } else hasMore = false;
      }
      setAllImcRecords(allData);
      if (!allData.length) {
        setImcRecords([]);
        return;
      }
      const latest = allData.reduce((a, b) =>
        b.ano > a.ano || (b.ano === a.ano && b.mes > a.mes) ? b : a
      );
      setImcRecords(
        allData.filter((r) => r.mes === latest.mes && r.ano === latest.ano)
      );
    } catch {
      setImcRecords([]);
    }
  };

  const carregarContagens = async () => {
    const tabelas = [
      'atestados',
      'certificados',
      'vacinacao',
      'pre_embarque',
      'refeicao',
      'emergency_kits',
      'pre_mer_avaliacoes',
    ];
    const setters = [
      setAtestadosCount,
      setCertificadosCount,
      setVacinasCount,
      setPreEmbarqueCount,
      setRefeicoesCount,
      setMedicamentosCount,
      setPreMerCount,
    ];
    await Promise.all(
      tabelas.map(async (t, i) => {
        const { count } = await supabase
          .from(t)
          .select('*', { count: 'exact', head: true });
        if (count !== null) setters[i](count);
      })
    );
    const { data } = await supabase
      .from('atestados')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(3);
    if (data) setAtestadosPendentes(data);
  };

  const updateDateTime = () => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
    setCurrentTime(
      now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
    setCurrentDay(now.toLocaleDateString('pt-BR', { weekday: 'long' }));
  };

  useEffect(() => {
    updateDateTime();
    const i = setInterval(updateDateTime, 60000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    Promise.all([
      carregarExames(),
      carregarImcRecords(),
      carregarContagens(),
    ]).finally(() => setLoading(false));
  }, []);

  const comIMC = imcRecords.filter((r) => r.peso > 0 && r.altura > 0);
  const n1 = comIMC.filter((r) => calculateBMI(r.peso, r.altura) < 25).length;
  const n2 = comIMC.filter((r) => {
    const i = calculateBMI(r.peso, r.altura);
    return i >= 25 && i < 30;
  }).length;
  const n3 = comIMC.filter((r) => {
    const i = calculateBMI(r.peso, r.altura);
    return i >= 30 && i < 35;
  }).length;
  const n4 = comIMC.filter((r) => calculateBMI(r.peso, r.altura) >= 35).length;

  const toxAtivos = examesToxicologicos.filter(
    (e) => e.status === 'ativo'
  ).length;
  const toxVencidos = examesToxicologicos.filter(
    (e) => e.status === 'vencido'
  ).length;
  const toxProx = examesToxicologicos.filter(
    (e) => e.status === 'proximo_vencer'
  ).length;
  const toxConf = examesToxicologicos.length
    ? Math.round((toxAtivos / examesToxicologicos.length) * 100)
    : 100;

  const totalEmp = employees.length || 1;
  const pct = (v: number) => Math.round((v / totalEmp) * 100);

  const hora = new Date().getHours();
  const saudacao =
    hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // ===== PALETA COM CORES SUAVES =====
  const c = {
    bg: '#f5f0eb',
    card: '#ffffff',
    border: '#e8e0d5',
    borderLight: '#f0ebe3',
    text: '#2d2a26',
    textSec: '#6b6560',
    textMut: '#9b9590',

    // Cores suaves para os cards
    green: '#4a7c59',
    greenBg: '#e8f0e9',
    greenLight: '#f0f7f1',

    blue: '#5b7b9a',
    blueBg: '#e8eef3',
    blueLight: '#f0f4f8',

    orange: '#c0853d',
    orangeBg: '#faf3e8',
    orangeLight: '#fdf8f2',

    red: '#b84444',
    redBg: '#faeaea',
    redLight: '#fdf5f5',

    yellow: '#b8934d',
    yellowBg: '#faf5e8',
    yellowLight: '#fdfaf2',

    purple: '#7b6b8a',
    purpleBg: '#f0edf3',
    purpleLight: '#f7f5f9',

    teal: '#5a8a7a',
    tealBg: '#e8f2ee',
    tealLight: '#f0f8f5',

    primary: '#5c4f3c',

    shadow: '0 1px 2px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 8px rgba(0,0,0,0.06)',
  };

  const s = {
    container: {
      padding: '28px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: c.bg,
      minHeight: '100vh',
    } as React.CSSProperties,

    hero: {
      background: c.card,
      borderRadius: '12px',
      padding: '28px 32px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: `1px solid ${c.border}`,
      boxShadow: c.shadow,
    } as React.CSSProperties,
    heroTitle: {
      fontSize: '22px',
      fontWeight: 600,
      color: c.text,
      margin: 0,
    } as React.CSSProperties,
    heroSub: {
      fontSize: '13px',
      color: c.textSec,
      margin: '4px 0 0 0',
    } as React.CSSProperties,
    heroDate: {
      fontSize: '14px',
      fontWeight: 500,
      color: c.text,
    } as React.CSSProperties,
    heroTime: {
      fontSize: '24px',
      fontWeight: 700,
      color: c.primary,
    } as React.CSSProperties,
    heroDay: {
      fontSize: '12px',
      color: c.textSec,
      marginBottom: '4px',
      textTransform: 'capitalize' as const,
    } as React.CSSProperties,

    row4: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '14px',
      marginBottom: '24px',
    } as React.CSSProperties,
    row2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '14px',
      marginBottom: '24px',
    } as React.CSSProperties,
    rowMini: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '10px',
      marginBottom: '24px',
    } as React.CSSProperties,

    card: {
      background: c.card,
      borderRadius: '10px',
      padding: '20px',
      border: `1px solid ${c.border}`,
      boxShadow: c.shadow,
    } as React.CSSProperties,
    cardTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: c.text,
      margin: '0 0 16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,

    // Stats cards
    statCard: {
      background: c.card,
      borderRadius: '10px',
      padding: '18px',
      border: `1px solid ${c.border}`,
      boxShadow: c.shadow,
      transition: 'all 0.2s ease',
      cursor: 'default',
    } as React.CSSProperties,
    statHover: {
      transform: 'translateY(-2px)',
      boxShadow: c.shadowMd,
    } as React.CSSProperties,
    statRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    } as React.CSSProperties,
    statIcon: (bg: string, cl: string) =>
      ({
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: cl,
        fontSize: '18px',
      } as React.CSSProperties),
    statNum: {
      fontSize: '32px',
      fontWeight: 700,
      color: c.text,
      lineHeight: 1,
    } as React.CSSProperties,
    statLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: c.textMut,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    } as React.CSSProperties,
    statComp: {
      fontSize: '12px',
      fontWeight: 500,
      color: c.textSec,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    } as React.CSSProperties,

    // Mini cards com cores
    miniCard: (bg: string) =>
      ({
        background: bg,
        borderRadius: '8px',
        padding: '14px',
        border: `1px solid ${c.border}`,
        boxShadow: c.shadow,
        textAlign: 'center' as const,
        transition: 'all 0.2s ease',
        cursor: 'default',
      } as React.CSSProperties),
    miniNum: {
      fontSize: '22px',
      fontWeight: 700,
      color: c.text,
    } as React.CSSProperties,
    miniLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: c.textMut,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginTop: '4px',
    } as React.CSSProperties,
    miniPct: {
      fontSize: '11px',
      fontWeight: 500,
      color: c.textSec,
      marginTop: '2px',
    } as React.CSSProperties,

    // Pyramid
    pyrRow: { marginBottom: '12px' } as React.CSSProperties,
    pyrHead: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4px',
    } as React.CSSProperties,
    pyrName: {
      fontSize: '13px',
      fontWeight: 500,
      color: c.text,
    } as React.CSSProperties,
    pyrVal: {
      fontSize: '13px',
      fontWeight: 600,
      color: c.text,
    } as React.CSSProperties,
    pyrBar: {
      height: '14px',
      background: c.borderLight,
      borderRadius: '7px',
      overflow: 'hidden',
    } as React.CSSProperties,
    pyrFill: (w: number, cl: string) =>
      ({
        width: `${Math.min(w, 100)}%`,
        height: '100%',
        background: cl,
        borderRadius: '7px',
        transition: 'width 0.6s ease',
      } as React.CSSProperties),
    pyrInfo: {
      marginTop: '10px',
      padding: '8px 12px',
      background: c.bg,
      borderRadius: '6px',
      fontSize: '12px',
      color: c.textSec,
    } as React.CSSProperties,

    // Tox
    toxGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginBottom: '12px',
    } as React.CSSProperties,
    toxItem: (bg: string) =>
      ({
        background: bg,
        borderRadius: '8px',
        padding: '12px',
        border: `1px solid ${c.borderLight}`,
      } as React.CSSProperties),
    toxLabel: {
      fontSize: '10px',
      fontWeight: 600,
      color: c.textMut,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    } as React.CSSProperties,
    toxVal: {
      fontSize: '20px',
      fontWeight: 700,
      color: c.text,
      marginTop: '2px',
    } as React.CSSProperties,
    progBar: {
      height: '16px',
      background: c.borderLight,
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '4px',
    } as React.CSSProperties,
    progFill: (w: number) =>
      ({
        width: `${w}%`,
        height: '100%',
        background: c.green,
        borderRadius: '8px',
        transition: 'width 0.6s ease',
      } as React.CSSProperties),
    progLabel: {
      fontSize: '12px',
      fontWeight: 700,
      color: c.text,
    } as React.CSSProperties,
    progTitle: {
      fontSize: '10px',
      fontWeight: 600,
      color: c.textMut,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: '6px',
    } as React.CSSProperties,

    // Timeline
    tlList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    } as React.CSSProperties,
    tlItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 12px',
      background: c.bg,
      borderRadius: '8px',
      border: `1px solid ${c.borderLight}`,
    } as React.CSSProperties,
    tlIcon: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      background: c.redBg,
      color: c.red,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
    } as React.CSSProperties,
    tlName: {
      fontSize: '13px',
      fontWeight: 600,
      color: c.text,
    } as React.CSSProperties,
    tlDesc: {
      fontSize: '11px',
      color: c.textSec,
      marginTop: '2px',
    } as React.CSSProperties,
    tlBadge: {
      padding: '2px 8px',
      borderRadius: '8px',
      fontSize: '10px',
      fontWeight: 700,
      background: c.redBg,
      color: c.red,
    } as React.CSSProperties,

    // Actions
    actGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: '8px',
    } as React.CSSProperties,
    actBtn: (bg: string, cl: string) =>
      ({
        padding: '14px 10px',
        borderRadius: '8px',
        border: `1px solid ${c.border}`,
        background: c.card,
        color: cl,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        fontSize: '11px',
        fontWeight: 600,
        width: '100%',
        boxShadow: c.shadow,
      } as React.CSSProperties),
    actIcon: (cl: string) =>
      ({ fontSize: '20px', color: cl } as React.CSSProperties),

    empty: {
      textAlign: 'center' as const,
      padding: '20px',
      color: c.textMut,
      fontSize: '13px',
    } as React.CSSProperties,
    loading: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 32px',
      gap: '14px',
    } as React.CSSProperties,
    spinner: {
      width: '36px',
      height: '36px',
      border: `2px solid ${c.border}`,
      borderTop: `2px solid ${c.primary}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    } as React.CSSProperties,
  };

  const handleAction = (mod: string) => onNavigate?.(mod);

  if (loading) {
    return (
      <div style={s.loading}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner}></div>
        <p style={{ color: c.textSec, fontSize: '14px' }}>
          Carregando dados...
        </p>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* HERO */}
      <div style={s.hero}>
        <div>
          <h1 style={s.heroTitle}>
            {saudacao}, {userNome}
          </h1>
          <p style={s.heroSub}>Painel de saúde ocupacional</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={s.heroDate}>{currentDate}</div>
          <div style={s.heroDay}>{currentDay}</div>
          <div style={s.heroTime}>{currentTime}</div>
        </div>
      </div>

      {/* 4 CARDS PRINCIPAIS */}
      <div style={s.row4}>
        {[
          {
            icon: 'fa-weight-scale',
            bg: c.greenBg,
            cl: c.green,
            num: imcRecords.length,
            label: 'Registros IMC',
          },
          {
            icon: 'fa-heart-pulse',
            bg: c.redBg,
            cl: c.red,
            num: bloodPressureRecords.length,
            label: 'Pressão Arterial',
          },
          {
            icon: 'fa-flask',
            bg: c.orangeBg,
            cl: c.orange,
            num: examesToxicologicos.length,
            label: 'Exames Tox.',
          },
          {
            icon: 'fa-circle-check',
            bg: c.blueBg,
            cl: c.blue,
            num: `${toxConf}%`,
            label: 'Conformidade',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={s.statCard}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, s.statHover)
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = c.shadow;
            }}
          >
            <div style={s.statRow}>
              <div style={s.statIcon(item.bg, item.cl)}>
                <i className={`fas ${item.icon}`}></i>
              </div>
              <div>
                <div style={s.statNum}>{item.num}</div>
                <div style={s.statLabel}>{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MINI STATS COM CORES */}
      <div style={s.rowMini}>
        {[
          { n: employees.length, l: 'Colaboradores', bg: c.blueLight },
          { n: preMerCount, l: 'Pré-Mergulho', bg: c.purpleLight },
          { n: imcRecords.length, l: 'IMC', bg: c.greenLight },
          { n: bloodPressureRecords.length, l: 'Pressão', bg: c.redLight },
          { n: medicamentosCount, l: 'Medicamentos', bg: c.yellowLight },
          { n: preEmbarqueCount, l: 'Pré-Embarque', bg: c.tealLight },
          { n: refeicoesCount, l: 'Refeições', bg: c.orangeLight },
          { n: certificadosCount, l: 'Certificados', bg: c.blueLight },
          { n: vacinasCount, l: 'Vacinação', bg: c.greenLight },
          { n: atestadosCount, l: 'Atestados', bg: c.redLight },
        ].map((item, idx) => (
          <div
            key={idx}
            style={s.miniCard(item.bg)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = c.shadowMd;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = c.shadow;
            }}
          >
            <div style={s.miniNum}>{item.n}</div>
            <div style={s.miniLabel}>{item.l}</div>
            <div style={s.miniPct}>{pct(item.n)}%</div>
          </div>
        ))}
      </div>

      {/* PIRÂMIDE + TOX */}
      <div style={s.row2}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>
            <i className="fas fa-chart-simple" style={{ color: c.green }}></i>
            Pirâmide de IMC
          </h3>
          {[
            { name: 'Saudável (< 25)', n: n1, color: c.green },
            { name: 'Sobrepeso (25-29,9)', n: n2, color: c.yellow },
            { name: 'Obesidade I (30-34,9)', n: n3, color: c.orange },
            { name: 'Obesidade II (≥ 35)', n: n4, color: c.red },
          ].map((lvl, idx) => (
            <div key={idx} style={s.pyrRow}>
              <div style={s.pyrHead}>
                <span style={s.pyrName}>{lvl.name}</span>
                <span style={s.pyrVal}>
                  {lvl.n} (
                  {comIMC.length
                    ? Math.round((lvl.n / comIMC.length) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div style={s.pyrBar}>
                <div
                  style={s.pyrFill(
                    comIMC.length ? (lvl.n / comIMC.length) * 100 : 0,
                    lvl.color
                  )}
                ></div>
              </div>
            </div>
          ))}
          <div style={s.pyrInfo}>
            <i
              className="fas fa-info-circle"
              style={{ marginRight: '6px', color: c.textMut }}
            ></i>
            {comIMC.length} colaboradores avaliados
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>
            <i className="fas fa-flask" style={{ color: c.orange }}></i>Exames
            Toxicológicos
          </h3>
          <div style={s.toxGrid}>
            {[
              { l: 'Ativos', v: toxAtivos, bg: c.greenLight },
              { l: 'Vencidos', v: toxVencidos, bg: c.redLight },
              { l: 'Próx. Vencer', v: toxProx, bg: c.yellowLight },
              { l: 'Total', v: examesToxicologicos.length, bg: c.blueLight },
            ].map((item, idx) => (
              <div key={idx} style={s.toxItem(item.bg)}>
                <div style={s.toxLabel}>{item.l}</div>
                <div style={s.toxVal}>{item.v}</div>
              </div>
            ))}
          </div>
          <div style={s.progTitle}>Conformidade</div>
          <div style={s.progBar}>
            <div style={s.progFill(toxConf)}></div>
          </div>
          <div style={s.progLabel}>{toxConf}%</div>
        </div>
      </div>

      {/* ATIVIDADES + AÇÕES */}
      <div style={s.row2}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>
            <i className="fas fa-clock" style={{ color: c.blue }}></i>Atividades
            Recentes
          </h3>
          {atestadosPendentes.length > 0 ? (
            <div style={s.tlList}>
              {atestadosPendentes.map((item, idx) => (
                <div key={idx} style={s.tlItem}>
                  <div style={s.tlIcon}>
                    <i className="fas fa-file-medical"></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.tlName}>{item.colaborador_nome}</div>
                    <div style={s.tlDesc}>Atestado pendente</div>
                  </div>
                  <div style={s.tlBadge}>Pendente</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.empty}>
              <i
                className="fas fa-check-circle"
                style={{ color: c.green, marginRight: '6px' }}
              ></i>
              Nenhuma pendência
            </div>
          )}
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>
            <i className="fas fa-bolt" style={{ color: c.primary }}></i>Ações
            Rápidas
          </h3>
          <div style={s.actGrid}>
            {[
              { l: 'IMC', icon: 'fa-weight-scale', mod: 'imc', cl: c.green },
              {
                l: 'Pressão',
                icon: 'fa-heart-pulse',
                mod: 'pressao',
                cl: c.red,
              },
              {
                l: 'Exames',
                icon: 'fa-flask',
                mod: 'toxicologico',
                cl: c.orange,
              },
              {
                l: 'Certificados',
                icon: 'fa-certificate',
                mod: 'certificados',
                cl: c.blue,
              },
              {
                l: 'Atestados',
                icon: 'fa-file-medical',
                mod: 'atestados',
                cl: c.red,
              },
              {
                l: 'Vacinação',
                icon: 'fa-syringe',
                mod: 'vacinacao',
                cl: c.green,
              },
              {
                l: 'Pré-Mergulho',
                icon: 'fa-person-swimming',
                mod: 'premer',
                cl: c.purple,
              },
              {
                l: 'Colaboradores',
                icon: 'fa-users',
                mod: 'funcionarios',
                cl: c.blue,
              },
            ].map((a, idx) => (
              <button
                key={idx}
                style={s.actBtn(a.cl + '15', a.cl)}
                onClick={() => handleAction(a.mod)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = a.cl + '25';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = c.card;
                  e.currentTarget.style.transform = '';
                }}
              >
                <i className={`fas ${a.icon}`} style={s.actIcon(a.cl)}></i>
                <span>{a.l}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
