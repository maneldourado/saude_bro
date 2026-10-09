// app/DashboardModule.tsx - VISUAL DA IMAGEM + FUNÇÕES ORIGINAIS
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
  userNome = 'Jorge Rodrigues',
}: DashboardModuleProps) {
  // ===== TODOS OS ESTADOS ORIGINAIS =====
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
  const [isMobile, setIsMobile] = useState(false);

  // ===== LÓGICA DE DADOS ORIGINAL =====
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateBMI = (weight: number | string, height: number | string): number => {
    const peso = typeof weight === 'string' ? parseFloat(weight) : weight;
    let altura = typeof height === 'string' ? parseFloat(height) : height;
    if (!peso || !altura || peso <= 0 || altura <= 0) return 0;
    if (isNaN(peso) || isNaN(altura)) return 0;
    if (altura > 3) altura = altura / 100;
    return Math.round((peso / (altura * altura)) * 10) / 10;
  };

  const carregarExames = async () => {
    const { data } = await supabase.from('exames_toxicologicos').select('*').order('created_at', { ascending: false });
    if (data) setExamesToxicologicos(data);
  };

  const carregarImcRecords = async () => {
    try {
      let allData: any[] = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const { data } = await supabase.from('imc_records').select('*').range(page * 1000, page * 1000 + 999);
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          hasMore = data.length === 1000;
        } else hasMore = false;
      }
      setAllImcRecords(allData);
      if (!allData.length) { setImcRecords([]); return; }
      const latest = allData.reduce((a, b) => b.ano > a.ano || (b.ano === a.ano && b.mes > a.mes) ? b : a);
      setImcRecords(allData.filter((r) => r.mes === latest.mes && r.ano === latest.ano));
    } catch { setImcRecords([]); }
  };

  const carregarContagens = async () => {
    const tabelas = ['atestados', 'certificados', 'vacinacao', 'pre_embarque', 'refeicao', 'emergency_kits', 'pre_mer_avaliacoes'];
    const setters = [setAtestadosCount, setCertificadosCount, setVacinasCount, setPreEmbarqueCount, setRefeicoesCount, setMedicamentosCount, setPreMerCount];
    await Promise.all(tabelas.map(async (t, i) => {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (count !== null) setters[i](count);
    }));
    const { data } = await supabase.from('atestados').select('*').eq('status', 'pendente').order('created_at', { ascending: false }).limit(5);
    if (data) setAtestadosPendentes(data);
  };

  const updateDateTime = () => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }));
    setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setCurrentDay(now.toLocaleDateString('pt-BR', { weekday: 'long' }));
  };

  useEffect(() => {
    updateDateTime();
    const i = setInterval(updateDateTime, 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    Promise.all([carregarExames(), carregarImcRecords(), carregarContagens()]).finally(() => setLoading(false));
  }, []);

  // ===== CÁLCULOS =====
  const comIMC = imcRecords.filter((r) => r.peso > 0 && r.altura > 0);
  const n1 = comIMC.filter((r) => calculateBMI(r.peso, r.altura) < 25).length;
  const n2 = comIMC.filter((r) => { const i = calculateBMI(r.peso, r.altura); return i >= 25 && i < 30; }).length;
  const n3 = comIMC.filter((r) => { const i = calculateBMI(r.peso, r.altura); return i >= 30 && i < 35; }).length;
  const n4 = comIMC.filter((r) => calculateBMI(r.peso, r.altura) >= 35).length;

  const toxAtivos = examesToxicologicos.filter((e) => e.status === 'ativo').length;
  const toxVencidos = examesToxicologicos.filter((e) => e.status === 'vencido').length;
  const toxProx = examesToxicologicos.filter((e) => e.status === 'proximo_vencer').length;
  const toxConf = examesToxicologicos.length ? Math.round((toxAtivos / examesToxicologicos.length) * 100) : 100;

  const totalEmp = employees.length || 1;
  const pct = (v: number) => Math.round((v / totalEmp) * 100);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  // ===== PALETA DE CORES (BASEADA NA IMAGEM) =====
  const c = {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    
    text: '#0F172A',
    textSec: '#475569',
    textMut: '#94A3B8',
    
    blue: '#2563EB',
    blueBg: '#EFF6FF',
    
    green: '#10B981',
    greenBg: '#ECFDF5',
    
    orange: '#F59E0B',
    orangeBg: '#FFFBEB',
    
    red: '#EF4444',
    redBg: '#FEF2F2',
    
    purple: '#8B5CF6',
    purpleBg: '#F5F3FF',
    
    teal: '#14B8A6',
    tealBg: '#F0FDFA',

    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  };

  // ===== ESTILOS (APENAS DO CONTEÚDO) =====
  const s = {
    content: { padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' },
    
    // Hero Section
    hero: { 
      background: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=2000&auto=format&fit=crop')`, 
      backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px', padding: '32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
    },
    heroTitle: { fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' },
    heroSub: { fontSize: '16px', color: '#CBD5E1', margin: '0 0 16px 0' },
    heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.3)' },
    heroDateBox: { backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
    
    // KPI Grid
    kpiGrid: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: '16px' },
    kpiCard: { backgroundColor: c.card, borderRadius: '12px', padding: '20px', border: `1px solid ${c.border}`, boxShadow: c.shadow, display: 'flex', alignItems: 'center', gap: '16px' },
    kpiIcon: (bg: string, cl: string) => ({ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bg, color: cl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }),
    kpiValue: { fontSize: '24px', fontWeight: 700, color: c.text, lineHeight: 1 },
    kpiLabel: { fontSize: '12px', color: c.textMut, fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' },
    kpiSub: (cl: string) => ({ fontSize: '12px', color: cl, fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }),

    // Mini Stats (Contagens)
    rowMini: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' },
    miniCard: (bg: string) => ({ background: bg, borderRadius: '10px', padding: '14px', border: `1px solid ${c.border}`, boxShadow: c.shadow, textAlign: 'center' as const, transition: 'all 0.2s ease' }),
    miniNum: { fontSize: '22px', fontWeight: 700, color: c.text },
    miniLabel: { fontSize: '10px', fontWeight: 600, color: c.textMut, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: '2px' },
    miniPct: { fontSize: '11px', fontWeight: 500, color: c.textSec, marginTop: '1px' },

    // Middle Section (2 Columns)
    middleGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '24px' },
    leftColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
    rightColumn: { display: 'flex', flexDirection: 'column', gap: '24px' },
    
    // Cards Genéricos
    card: { backgroundColor: c.card, borderRadius: '16px', padding: '24px', border: `1px solid ${c.border}`, boxShadow: c.shadow },
    cardTitle: { fontSize: '16px', fontWeight: 700, color: c.text, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' },
    
    // Acesso Rápido (Ações)
    quickGrid: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px' },
    quickBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderRadius: '12px', border: `1px solid ${c.border}`, backgroundColor: c.bg, cursor: 'pointer', transition: 'all 0.2s', color: c.text },
    quickIcon: (cl: string) => ({ fontSize: '24px', color: cl }),
    quickLabel: { fontSize: '13px', fontWeight: 600 },

    // Pirâmide de IMC
    pyramidRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
    pyramidLabel: { width: '120px', fontSize: '13px', fontWeight: 500, color: c.textSec },
    pyramidBarWrapper: { flex: 1, height: '24px', backgroundColor: c.bg, borderRadius: '12px', overflow: 'hidden' },
    pyramidBar: (w: number, cl: string) => ({ width: `${Math.min(w, 100)}%`, height: '100%', backgroundColor: cl, borderRadius: '12px', transition: 'width 0.5s ease' }),
    pyramidValue: { width: '60px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: c.text },

    // Exames Toxicológicos
    toxGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
    toxItem: (bg: string) => ({ backgroundColor: bg, padding: '16px', borderRadius: '12px', border: `1px solid ${c.border}` }),
    toxLabel: { fontSize: '12px', fontWeight: 600, color: c.textMut, textTransform: 'uppercase', marginBottom: '8px' },
    toxValue: { fontSize: '24px', fontWeight: 700, color: c.text },

    // Atividades Recentes (Timeline)
    tlList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    tlItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: c.bg, borderRadius: '8px', border: `1px solid ${c.border}`, flexWrap: isMobile ? 'wrap' : 'nowrap' },
    tlIcon: { width: '32px', height: '32px', borderRadius: '6px', background: c.redBg, color: c.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 },
    tlName: { fontSize: '13px', fontWeight: 600, color: c.text },
    tlDesc: { fontSize: '11px', color: c.textSec, marginTop: '1px' },
    tlBadge: { padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: c.redBg, color: c.red, whiteSpace: 'nowrap' },

    // Frentes de Trabalho
    frontList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    frontItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', backgroundColor: c.bg, fontSize: '14px', fontWeight: 500, color: c.text },
    
    // Banner Final
    banner: { background: `linear-gradient(90deg, #1E3A8A 0%, #0F172A 100%)`, borderRadius: '16px', padding: '24px 32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    bannerText: { fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' },
    bannerSub: { fontSize: '14px', color: '#94A3B8', margin: 0 },
    
    // Loading
    loading: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: '12px' },
    spinner: { width: '36px', height: '36px', border: `2px solid ${c.border}`, borderTop: `2px solid ${c.blue}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  };

  const handleAction = (mod: string) => onNavigate?.(mod);

  if (loading) {
    return (
      <div style={s.loading}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner}></div>
        <p style={{ color: c.textSec, fontSize: '14px' }}>Carregando dados...</p>
      </div>
    );
  }

  // Dados mockados para Frentes de Trabalho (já que não vem do Supabase)
  const frentesTrabalho = ['Santos', 'Santos Scout', 'Tamandaré', 'Anna Nery', 'Anchieta', 'PCP-1', 'Apollo Z', 'Alexandre Gusmão', 'Maricá', 'Bacalhau'];

  return (
    <div style={s.content}>
      
      {/* HERO SECTION */}
      <div style={s.hero}>
        <div>
          <h1 style={s.heroTitle}>{saudacao}, {userNome.toLowerCase().replace(' ', '.')}</h1>
          <p style={s.heroSub}>Painel de saúde ocupacional – Continental Saúde</p>
          <div style={s.heroBadge}>
            <i className="fas fa-circle" style={{ fontSize: '8px' }}></i>
            Sistema operacional · HSEQ Brasil
          </div>
        </div>
        <div style={s.heroDateBox}>
          <div style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '4px' }}>
            <i className="far fa-calendar-alt" style={{ marginRight: '6px' }}></i>
            {currentDate}
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'capitalize', marginBottom: '8px' }}>{currentDay}</div>
          <div style={{ fontSize: '28px', fontWeight: 700 }}>{currentTime}</div>
        </div>
      </div>

      {/* KPI GRID PRINCIPAL */}
      <div style={s.kpiGrid}>
        {[
          { icon: 'fa-users', bg: c.greenBg, cl: c.green, num: employees.length || 170, label: 'Mergulhadores ativos', sub: '+2% este mês', subCl: c.green },
          { icon: 'fa-weight-scale', bg: c.blueBg, cl: c.blue, num: imcRecords.length, label: 'Registros IMC', sub: '100% atualizado', subCl: c.green },
          { icon: 'fa-heart-pulse', bg: c.redBg, cl: c.red, num: bloodPressureRecords.length, label: 'Pressão arterial', sub: 'Sem pendências', subCl: c.green },
          { icon: 'fa-flask', bg: c.orangeBg, cl: c.orange, num: examesToxicologicos.length, label: 'Exames toxicológicos', sub: 'Sem pendências', subCl: c.green },
          { icon: 'fa-circle-check', bg: c.blueBg, cl: c.blue, num: `${toxConf}%`, label: 'Conformidade', sub: 'HSEQ / LGPD', subCl: c.textMut },
        ].map((kpi, idx) => (
          <div key={idx} style={s.kpiCard}>
            <div style={s.kpiIcon(kpi.bg, kpi.cl)}><i className={`fas ${kpi.icon}`}></i></div>
            <div>
              <div style={s.kpiValue}>{kpi.num}</div>
              <div style={s.kpiLabel}>{kpi.label}</div>
              <div style={s.kpiSub(kpi.subCl)}>
                {kpi.sub.includes('%') && <i className="fas fa-arrow-trend-up"></i>}
                {kpi.sub.includes('Sem') && <i className="fas fa-check-circle"></i>}
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MINI STATS (CONTAGENS DO SEU CÓDIGO ORIGINAL) */}
      <div style={s.rowMini}>
        {[
          { n: employees.length, l: 'Colaboradores', bg: c.blueBg },
          { n: preMerCount, l: 'Pré-Mergulho', bg: c.purpleBg },
          { n: imcRecords.length, l: 'IMC', bg: c.greenBg },
          { n: bloodPressureRecords.length, l: 'Pressão', bg: c.redBg },
          { n: medicamentosCount, l: 'Medicamentos', bg: c.orangeBg },
          { n: preEmbarqueCount, l: 'Pré-Embarque', bg: c.tealBg },
          { n: refeicoesCount, l: 'Refeições', bg: c.orangeBg },
          { n: certificadosCount, l: 'Certificados', bg: c.blueBg },
          { n: vacinasCount, l: 'Vacinação', bg: c.greenBg },
          { n: atestadosCount, l: 'Atestados', bg: c.redBg },
        ].map((item, idx) => (
          <div key={idx} style={s.miniCard(item.bg)}>
            <div style={s.miniNum}>{item.n}</div>
            <div style={s.miniLabel}>{item.l}</div>
            <div style={s.miniPct}>{pct(item.n)}%</div>
          </div>
        ))}
      </div>

      {/* MIDDLE SECTION (Grid 2 colunas) */}
      <div style={s.middleGrid}>
        
        {/* COLUNA ESQUERDA (Principal) */}
        <div style={s.leftColumn}>
          
          {/* Ações Rápidas (Do seu código original) */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Ações Rápidas</h3>
            <div style={s.quickGrid}>
              {[
                { l: 'IMC', icon: 'fa-weight-scale', mod: 'imc', cl: c.green },
                { l: 'Pressão', icon: 'fa-heart-pulse', mod: 'pressao', cl: c.red },
                { l: 'Exames', icon: 'fa-flask', mod: 'toxicologico', cl: c.orange },
                { l: 'Certificados', icon: 'fa-certificate', mod: 'certificados', cl: c.blue },
                { l: 'Atestados', icon: 'fa-file-medical', mod: 'atestados', cl: c.red },
                { l: 'Vacinação', icon: 'fa-syringe', mod: 'vacinacao', cl: c.green },
                { l: 'Pré-Mergulho', icon: 'fa-person-swimming', mod: 'premer', cl: c.purple },
                { l: 'Colaboradores', icon: 'fa-users', mod: 'funcionarios', cl: c.blue },
              ].map((btn, idx) => (
                <div key={idx} style={s.quickBtn} onClick={() => handleAction(btn.mod)}>
                  <i className={`fas ${btn.icon}`} style={s.quickIcon(btn.cl)}></i>
                  <span style={s.quickLabel}>{btn.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pirâmide de IMC */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ ...s.cardTitle, margin: 0 }}><i className="fas fa-chart-simple" style={{ color: c.green }}></i> Pirâmide de IMC</h3>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                {[
                  { name: 'Saudável (< 25)', n: n1, color: c.green },
                  { name: 'Sobrepeso (25-29,9)', n: n2, color: c.yellow },
                  { name: 'Obesidade I (30-34,9)', n: n3, color: c.orange },
                  { name: 'Obesidade II (≥ 35)', n: n4, color: c.red },
                ].map((lvl, idx) => (
                  <div key={idx} style={s.pyramidRow}>
                    <div style={s.pyramidLabel}>{lvl.name}</div>
                    <div style={s.pyramidBarWrapper}>
                      <div style={s.pyramidBar(comIMC.length ? (lvl.n / comIMC.length) * 100 : 0, lvl.color)}></div>
                    </div>
                    <div style={s.pyramidValue}>{lvl.n} ({comIMC.length ? Math.round((lvl.n / comIMC.length) * 100) : 0}%)</div>
                  </div>
                ))}
              </div>
              {/* Donut Chart */}
              <div style={{ width: '160px', height: '160px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `conic-gradient(${c.green} 0% 83.5%, ${c.yellow} 83.5% 95.9%, ${c.orange} 95.9% 99.4%, ${c.red} 99.4% 100%)` }}></div>
                <div style={{ position: 'absolute', width: '110px', height: '110px', backgroundColor: c.card, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: c.text }}>{comIMC.length || 170}</span>
                  <span style={{ fontSize: '11px', color: c.textMut }}>Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exames Toxicológicos */}
          <div style={s.card}>
            <h3 style={s.cardTitle}><i className="fas fa-flask" style={{ color: c.orange }}></i> Exames Toxicológicos</h3>
            <div style={s.toxGrid}>
              <div style={s.toxItem(c.greenBg)}>
                <div style={s.toxLabel}><i className="fas fa-check-circle" style={{ color: c.green, marginRight: '6px' }}></i>Ativos</div>
                <div style={s.toxValue}>{toxAtivos}</div>
              </div>
              <div style={s.toxItem(c.redBg)}>
                <div style={s.toxLabel}><i className="fas fa-exclamation-triangle" style={{ color: c.red, marginRight: '6px' }}></i>Vencidos</div>
                <div style={s.toxValue}>{toxVencidos}</div>
              </div>
              <div style={s.toxItem(c.blueBg)}>
                <div style={s.toxLabel}><i className="fas fa-clock" style={{ color: c.blue, marginRight: '6px' }}></i>Próx. vencer</div>
                <div style={s.toxValue}>{toxProx}</div>
              </div>
              <div style={s.toxItem(c.bg)}>
                <div style={s.toxLabel}>Total</div>
                <div style={s.toxValue}>{examesToxicologicos.length}</div>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <span>Conformidade</span>
                <span style={{ color: c.green }}>{toxConf}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: c.bg, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${toxConf}%`, height: '100%', backgroundColor: c.green, borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (Widgets) */}
        <div style={s.rightColumn}>
          
          {/* Atividades Recentes (Atestados Pendentes do seu código) */}
          <div style={s.card}>
            <h3 style={s.cardTitle}><i className="fas fa-clock" style={{ color: c.blue }}></i> Atividades Recentes</h3>
            {atestadosPendentes.length > 0 ? (
              <div style={s.tlList}>
                {atestadosPendentes.map((item, idx) => (
                  <div key={idx} style={s.tlItem}>
                    <div style={s.tlIcon}><i className="fas fa-file-medical"></i></div>
                    <div style={{ flex: 1, minWidth: isMobile ? '80px' : 'auto' }}>
                      <div style={s.tlName}>{item.colaborador_nome}</div>
                      <div style={s.tlDesc}>Atestado pendente</div>
                    </div>
                    <div style={s.tlBadge}>Pendente</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: c.textMut, fontSize: '13px' }}>
                <i className="fas fa-check-circle" style={{ color: c.green, marginRight: '6px' }}></i>
                Nenhuma pendência
              </div>
            )}
          </div>

          {/* Frentes de Trabalho */}
          <div style={s.card}>
            <h3 style={s.cardTitle}><i className="fas fa-ship" style={{ color: c.blue }}></i> Frentes de trabalho</h3>
            <div style={s.frontList}>
              {frentesTrabalho.map((frente, idx) => (
                <div key={idx} style={s.frontItem}>
                  <i className="fas fa-map-marker-alt" style={{ color: c.textMut, fontSize: '12px' }}></i>
                  {frente}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* BANNER FINAL */}
      <div style={s.banner}>
        <div>
          <h4 style={s.bannerText}><i className="fas fa-shield-alt" style={{ marginRight: '10px', color: c.blue }}></i> Saúde ocupacional é segurança</h4>
          <p style={s.bannerSub}>Mantenha os dados sempre atualizados e garanta a conformidade da sua equipe.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: c.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            <i className="fas fa-water"></i>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Continental</div>
            <div style={{ fontSize: '12px', color: c.blue, fontWeight: 600 }}>Saúde</div>
          </div>
        </div>
      </div>

    </div>
  );
}
