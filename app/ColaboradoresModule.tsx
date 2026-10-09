// app/ColaboradoresModule.tsx - VISUAL DA IMAGEM + FUNÇÕES ORIGINAIS
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';

interface Colaborador {
  id: number;
  codigo: string;
  nome: string;
  cpf: string;
  admissao: string;
  data_nascimento: string;
  cargo: string;
  departamento: string;
  regime: string;
  email: string;
  altura: number;
  peso: number;
  pressao_sistolica: number;
  pressao_diastolica: number;
}

export default function ColaboradoresModule() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [fileData, setFileData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterRegime, setFilterRegime] = useState<string>('');

  const [newEmployee, setNewEmployee] = useState({
    codigo: '', nome: '', cpf: '', admissao: '', data_nascimento: '',
    cargo: '', departamento: '', regime: 'onshore', email: '',
    altura: '', peso: '', pressao_sistolica: '', pressao_diastolica: '',
  });
  
  const [columnMapping, setColumnMapping] = useState({
    codigo: 0, nome: 1, admissao: 2, nascimento: 3,
    cargo: 6, departamento: 7, regime: 8, email: 10,
  });

  // ==================== RESPONSIVIDADE ====================
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ==================== CARREGAR COLABORADORES ====================
  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.from('colaboradores').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(`Erro ao carregar: ${error.message}`);
      setEmployees(data || []);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao carregar dados do banco');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADICIONAR COLABORADOR ====================
  const addEmployee = async () => {
    if (!newEmployee.nome || !newEmployee.codigo) {
      alert('Preencha o código e nome do colaborador!');
      return;
    }
    try {
      const employeeToSave = {
        codigo: newEmployee.codigo, nome: newEmployee.nome, cpf: newEmployee.cpf || null,
        admissao: newEmployee.admissao || null, data_nascimento: newEmployee.data_nascimento || null,
        cargo: newEmployee.cargo || null, departamento: newEmployee.departamento || null,
        regime: newEmployee.regime, email: newEmployee.email || null,
        altura: parseFloat(newEmployee.altura) || null, peso: parseFloat(newEmployee.peso) || null,
        pressao_sistolica: newEmployee.pressao_sistolica ? parseInt(newEmployee.pressao_sistolica) : null,
        pressao_diastolica: newEmployee.pressao_diastolica ? parseInt(newEmployee.pressao_diastolica) : null,
      };
      const { error } = await supabase.from('colaboradores').insert([employeeToSave]);
      if (error) throw new Error(error.message);
      
      await loadEmployees();
      setNewEmployee({ codigo: '', nome: '', cpf: '', admissao: '', data_nascimento: '', cargo: '', departamento: '', regime: 'onshore', email: '', altura: '', peso: '', pressao_sistolica: '', pressao_diastolica: '' });
      setShowEmployeeForm(false);
      alert('Colaborador adicionado com sucesso!');
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  // ==================== EXCLUIR COLABORADOR ====================
  const deleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      const { error } = await supabase.from('colaboradores').delete().eq('id', id);
      if (error) throw error;
      await loadEmployees();
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.message}`);
    }
  };

  // ==================== FUNÇÕES DE IMPORTAÇÃO ====================
  const toSafeString = (value: any): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return value.toLocaleDateString('pt-BR');
    if (value && typeof value === 'object' && value.v !== undefined) return String(value.v);
    return String(value);
  };

  const toDateISO = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      } catch (e) {}
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      return value;
    }
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString().split('T')[0];
    return '';
  };

  const extractEmployee = (row: any, map: typeof columnMapping) => {
    const codigo = toSafeString(row[map.codigo]);
    const nome = toSafeString(row[map.nome]);
    const admissaoRaw = row[map.admissao];
    const nascimentoRaw = row[map.nascimento];
    const cargo = toSafeString(row[map.cargo]);
    const departamento = toSafeString(row[map.departamento]);
    const regimeRaw = toSafeString(row[map.regime]);
    const email = toSafeString(row[map.email]);

    if (!nome || !codigo) return null;
    let regime = 'onshore';
    if (regimeRaw.toUpperCase() === 'OFFSHORE') regime = 'offshore';

    return {
      codigo, nome, cpf: null, admissao: toDateISO(admissaoRaw) || null,
      data_nascimento: toDateISO(nascimentoRaw) || null, cargo, departamento, regime,
      email: email || null, altura: null, peso: null, pressao_sistolica: null, pressao_diastolica: null,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!json || json.length < 2) throw new Error('Planilha vazia');
      setFileData({ headers: json[0], rows: json.slice(1) });
      setShowMapping(true);
    } catch (err) {
      alert('Erro ao ler planilha');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const processImport = async () => {
    if (!fileData) return;
    const novos: any[] = [];
    fileData.rows.forEach((row: any) => {
      const emp = extractEmployee(row, columnMapping);
      if (emp) novos.push(emp);
    });
    if (novos.length === 0) { alert('Nenhum registro válido encontrado.'); return; }
    try {
      const { error } = await supabase.from('colaboradores').insert(novos);
      if (error) throw error;
      await loadEmployees();
      alert(`${novos.length} colaboradores importados com sucesso!`);
      setShowMapping(false);
      setFileData(null);
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  // ==================== ESTATÍSTICAS E FILTROS ====================
  const totalOnshore = employees.filter((e: any) => e.regime === 'onshore').length;
  const totalOffshore = employees.filter((e: any) => e.regime === 'offshore').length;
  
  // Filtragem local para a tabela
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.codigo.includes(searchTerm) ||
                          (emp.cargo && emp.cargo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRegime = !filterRegime || emp.regime === filterRegime;
    // Como não temos status real no banco, vamos simular baseado em dados
    const status = emp.status || 'Ativo'; 
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(status);
    
    return matchesSearch && matchesRegime && matchesStatus;
  });

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // ==================== MODAL DE MAPEAMENTO ====================
  const MappingModal = () => {
    if (!showMapping || !fileData) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#ffffff', borderRadius: 20, padding: 32, maxWidth: 600, width: '90%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>📋</span>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>Mapear Colunas</h2>
          </div>
          <p style={{ marginBottom: 24, fontSize: 14, color: '#475569' }}>Selecione qual coluna corresponde a cada informação:</p>
          {[
            { key: 'codigo', label: '🔢 Código' }, { key: 'nome', label: '👤 Nome Completo' },
            { key: 'admissao', label: '📅 Data de Admissão' }, { key: 'nascimento', label: '🎂 Data de Nascimento' },
            { key: 'cargo', label: '💼 Cargo' }, { key: 'departamento', label: '🏢 Departamento' },
            { key: 'regime', label: '⚓ Regime (OFFSHORE/ONSHORE)' }, { key: 'email', label: '📧 E-mail' },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{label}</label>
              <select
                value={columnMapping[key as keyof typeof columnMapping]}
                onChange={(e) => setColumnMapping({ ...columnMapping, [key]: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, background: '#F8FAFC', color: '#0F172A', outline: 'none' }}
              >
                {fileData.headers.map((h: any, i: number) => (
                  <option key={i} value={i}>{i}: {String(h || `Coluna ${String.fromCharCode(65 + i)}`)}</option>
                ))}
              </select>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button onClick={processImport} style={{ flex: 1, padding: '14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>✅ Confirmar Importação</button>
            <button onClick={() => { setShowMapping(false); setFileData(null); }} style={{ flex: 1, padding: '14px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>❌ Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8FAFC' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '40px', height: '40px', border: `3px solid #E2E8F0`, borderTop: `3px solid #2563EB`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <p style={{ color: '#475569', marginTop: '16px', fontWeight: 500 }}>Carregando colaboradores...</p>
      </div>
    );
  }

  // ===== PALETA DE CORES =====
  const c = {
    bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0',
    text: '#0F172A', textSec: '#475569', textMut: '#94A3B8',
    blue: '#2563EB', blueBg: '#EFF6FF',
    green: '#10B981', greenBg: '#ECFDF5',
    orange: '#F59E0B', orangeBg: '#FFFBEB',
    red: '#EF4444', redBg: '#FEF2F2',
    purple: '#8B5CF6', purpleBg: '#F5F3FF',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  };

  const s = {
    container: { padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', background: c.bg, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
    headerTitle: { fontSize: '24px', fontWeight: 700, color: c.text, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
    headerSub: { fontSize: '14px', color: c.textSec, margin: '4px 0 0 0' },
    btnGroup: { display: 'flex', gap: '12px' },
    btnPrimary: { background: c.blue, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    btnSecondary: { background: c.card, color: c.text, border: `1px solid ${c.border}`, padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    
    // KPI Cards
    kpiGrid: { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px' },
    kpiCard: { background: c.card, borderRadius: '12px', padding: '20px', border: `1px solid ${c.border}`, boxShadow: c.shadow, display: 'flex', alignItems: 'center', gap: '16px' },
    kpiIcon: (bg: string, cl: string) => ({ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bg, color: cl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }),
    kpiValue: { fontSize: '24px', fontWeight: 700, color: c.text, lineHeight: 1 },
    kpiLabel: { fontSize: '12px', color: c.textMut, fontWeight: 600, textTransform: 'uppercase', marginTop: '4px' },
    kpiSub: (cl: string) => ({ fontSize: '12px', color: cl, fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }),

    // Layout Principal (Tabela + Filtros)
    mainGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '24px', alignItems: 'start' },
    
    // Tabela
    tableCard: { background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, boxShadow: c.shadow, overflow: 'hidden' },
    tableHeader: { padding: '20px 24px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
    tableTitle: { fontSize: '16px', fontWeight: 700, color: c.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
    searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: c.bg, padding: '8px 16px', borderRadius: '8px', border: `1px solid ${c.border}`, width: isMobile ? '100%' : '300px' },
    searchInput: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: c.text },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: c.textMut, textTransform: 'uppercase', borderBottom: `1px solid ${c.border}`, background: c.bg },
    td: { padding: '14px 16px', fontSize: '13px', color: c.text, borderBottom: `1px solid ${c.border}` },
    avatar: (color: string) => ({ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }),
    badge: (bg: string, cl: string) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: bg, color: cl }),
    actionBtn: { background: 'transparent', border: 'none', color: c.textMut, cursor: 'pointer', fontSize: '14px', padding: '4px' },

    // Filtros
    filterCard: { background: c.card, borderRadius: '16px', border: `1px solid ${c.border}`, boxShadow: c.shadow, padding: '24px' },
    filterTitle: { fontSize: '16px', fontWeight: 700, color: c.text, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' },
    filterGroup: { marginBottom: '24px' },
    filterLabel: { fontSize: '13px', fontWeight: 600, color: c.textSec, marginBottom: '12px', display: 'block' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: c.text, marginBottom: '8px', cursor: 'pointer' },
    select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '13px', color: c.text, background: c.bg, outline: 'none' },
    infoBox: { background: c.blueBg, borderRadius: '12px', padding: '16px', border: `1px solid ${c.blue}30`, marginTop: '24px' },
    infoTitle: { fontSize: '13px', fontWeight: 700, color: c.blue, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' },
    infoText: { fontSize: '12px', color: c.textSec, lineHeight: 1.5, margin: 0 },
  };

  return (
    <div style={s.container}>
      <MappingModal />

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h1 style={s.headerTitle}><i className="fas fa-users" style={{ color: c.blue }}></i> Colaboradores</h1>
          <p style={s.headerSub}>Gestão completa do quadro de funcionários</p>
        </div>
        <div style={s.btnGroup}>
          <label style={s.btnSecondary}>
            <i className="fas fa-file-import"></i> {importing ? 'Importando...' : 'Importar planilha'}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={importing} />
          </label>
          <button onClick={() => setShowEmployeeForm(!showEmployeeForm)} style={s.btnPrimary}>
            <i className="fas fa-plus"></i> {showEmployeeForm ? 'Fechar Formulário' : 'Novo colaborador'}
          </button>
        </div>
      </div>

      {/* ERRO */}
      {errorMessage && (
        <div style={{ background: c.redBg, border: `1px solid ${c.red}`, borderRadius: 12, padding: 16, color: c.red, fontSize: 14 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* KPI GRID */}
      <div style={s.kpiGrid}>
        <div style={s.kpiCard}>
          <div style={s.kpiIcon(c.greenBg, c.green)}><i className="fas fa-users"></i></div>
          <div>
            <div style={s.kpiValue}>{employees.length}</div>
            <div style={s.kpiLabel}>Total de colaboradores</div>
            <div style={s.kpiSub(c.green)}><i className="fas fa-arrow-up"></i> +2% este mês</div>
          </div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiIcon(c.blueBg, c.blue)}><i className="fas fa-water"></i></div>
          <div>
            <div style={s.kpiValue}>{totalOffshore}</div>
            <div style={s.kpiLabel}>Offshore</div>
            <div style={s.kpiSub(c.textMut)}>{((totalOffshore / (employees.length || 1)) * 100).toFixed(1)}% do total</div>
          </div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiIcon(c.greenBg, c.green)}><i className="fas fa-building"></i></div>
          <div>
            <div style={s.kpiValue}>{totalOnshore}</div>
            <div style={s.kpiLabel}>Onshore</div>
            <div style={s.kpiSub(c.textMut)}>{((totalOnshore / (employees.length || 1)) * 100).toFixed(1)}% do total</div>
          </div>
        </div>
        <div style={s.kpiCard}>
          <div style={s.kpiIcon(c.orangeBg, c.orange)}><i className="fas fa-calendar-alt"></i></div>
          <div>
            <div style={s.kpiValue}>{new Set(employees.map((e: any) => e.admissao?.split('-')[0]).filter(Boolean)).size}</div>
            <div style={s.kpiLabel}>Anos de admissão</div>
            <div style={s.kpiSub(c.textMut)}>Média de tempo</div>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO (Mantido, mas estilizado) */}
      {showEmployeeForm && (
        <div style={{ ...s.tableCard, padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>Cadastrar Novo Colaborador</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'CÓDIGO *', key: 'codigo', type: 'text' },
              { label: 'NOME COMPLETO *', key: 'nome', type: 'text', span: 2 },
              { label: 'CPF', key: 'cpf', type: 'text' },
              { label: 'DATA DE ADMISSÃO', key: 'admissao', type: 'date' },
              { label: 'DATA DE NASCIMENTO', key: 'data_nascimento', type: 'date' },
              { label: 'CARGO', key: 'cargo', type: 'text' },
              { label: 'DEPARTAMENTO', key: 'departamento', type: 'text' },
              { label: 'E-MAIL', key: 'email', type: 'email', span: 2 },
            ].map((field) => (
              <div key={field.key} style={{ gridColumn: field.span ? `span ${field.span}` : 'auto' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: c.textMut, marginBottom: '6px' }}>{field.label}</label>
                <input
                  type={field.type}
                  value={(newEmployee as any)[field.key]}
                  onChange={(e) => setNewEmployee({ ...newEmployee, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${c.border}`, fontSize: '14px', outline: 'none' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: c.textMut, marginBottom: '6px' }}>REGIME</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setNewEmployee({ ...newEmployee, regime: 'offshore' })} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${newEmployee.regime === 'offshore' ? c.blue : c.border}`, background: newEmployee.regime === 'offshore' ? c.blueBg : c.card, color: newEmployee.regime === 'offshore' ? c.blue : c.textSec, cursor: 'pointer', fontWeight: 600 }}>OFFSHORE</button>
                <button onClick={() => setNewEmployee({ ...newEmployee, regime: 'onshore' })} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${newEmployee.regime === 'onshore' ? c.blue : c.border}`, background: newEmployee.regime === 'onshore' ? c.blueBg : c.card, color: newEmployee.regime === 'onshore' ? c.blue : c.textSec, cursor: 'pointer', fontWeight: 600 }}>ONSHORE</button>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => setShowEmployeeForm(false)} style={s.btnSecondary}>Cancelar</button>
            <button onClick={addEmployee} style={s.btnPrimary}>Salvar Colaborador</button>
          </div>
        </div>
      )}

      {/* MAIN GRID (Tabela + Filtros) */}
      <div style={s.mainGrid}>
        
        {/* COLUNA ESQUERDA: TABELA */}
        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <h3 style={s.tableTitle}><i className="fas fa-list" style={{ color: c.blue }}></i> Lista de colaboradores</h3>
            <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
              <div style={s.searchBox}>
                <i className="fas fa-search" style={{ color: c.textMut }}></i>
                <input type="text" placeholder="Buscar colaborador..." style={s.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: '40px' }}><input type="checkbox" /></th>
                  <th style={s.th}>Nome</th>
                  <th style={s.th}>Matrícula</th>
                  <th style={s.th}>Cargo</th>
                  <th style={s.th}>Departamento</th>
                  <th style={s.th}>Regime</th>
                  <th style={s.th}>Status</th>
                  <th style={{ ...s.th, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: c.textMut }}>
                      <i className="fas fa-users" style={{ fontSize: '32px', display: 'block', marginBottom: '12px', color: c.border }}></i>
                      Nenhum colaborador encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td style={s.td}><input type="checkbox" /></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={s.avatar(getAvatarColor(emp.nome))}>{getInitials(emp.nome)}</div>
                          <span style={{ fontWeight: 600 }}>{emp.nome}</span>
                        </div>
                      </td>
                      <td style={s.td}>{emp.codigo}</td>
                      <td style={s.td}>{emp.cargo || '-'}</td>
                      <td style={s.td}>{emp.departamento || '-'}</td>
                      <td style={s.td}>
                        <span style={s.badge(emp.regime === 'offshore' ? c.blueBg : c.greenBg, emp.regime === 'offshore' ? c.blue : c.green)}>
                          {emp.regime === 'offshore' ? 'Offshore' : 'Onshore'}
                        </span>
                      </td>
                      <td style={s.td}>
                        {/* Simulando status baseado no regime ou dados */}
                        <span style={s.badge(c.greenBg, c.green)}>Ativo</span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right' }}>
                        <button style={s.actionBtn}><i className="fas fa-eye"></i></button>
                        <button style={s.actionBtn}><i className="fas fa-pen"></i></button>
                        <button style={s.actionBtn} onClick={() => deleteEmployee(emp.id)}><i className="fas fa-trash" style={{ color: c.red }}></i></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginação Simulada */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: c.textMut }}>
            <span>Mostrando {filteredEmployees.length} de {employees.length} colaboradores</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button style={{ padding: '4px 8px', border: `1px solid ${c.border}`, background: c.card, borderRadius: '4px', cursor: 'pointer' }}>&lt;</button>
              <button style={{ padding: '4px 8px', border: 'none', background: c.blue, color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>1</button>
              <button style={{ padding: '4px 8px', border: `1px solid ${c.border}`, background: c.card, borderRadius: '4px', cursor: 'pointer' }}>2</button>
              <button style={{ padding: '4px 8px', border: `1px solid ${c.border}`, background: c.card, borderRadius: '4px', cursor: 'pointer' }}>&gt;</button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: FILTROS */}
        <div style={s.filterCard}>
          <h3 style={s.filterTitle}><i className="fas fa-filter" style={{ color: c.blue }}></i> Filtros</h3>
          
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Status</label>
            {[
              { label: 'Ativo', count: 150, color: c.green },
              { label: 'Em treinamento', count: 8, color: c.orange },
              { label: 'Afastado', count: 7, color: c.red },
              { label: 'Desligado', count: 5, color: c.textMut },
            ].map((item) => (
              <label key={item.label} style={s.checkboxLabel}>
                <input type="checkbox" checked={filterStatus.includes(item.label)} onChange={(e) => {
                  if (e.target.checked) setFilterStatus([...filterStatus, item.label]);
                  else setFilterStatus(filterStatus.filter(s => s !== item.label));
                }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 600 }}>{item.count}</span>
              </label>
            ))}
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Departamento</label>
            <select style={s.select}><option>Todos</option></select>
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Cargo</label>
            <select style={s.select}><option>Todos</option></select>
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Regime</label>
            <select style={s.select} value={filterRegime} onChange={(e) => setFilterRegime(e.target.value)}>
              <option value="">Todos</option>
              <option value="onshore">Onshore</option>
              <option value="offshore">Offshore</option>
            </select>
          </div>

          <button onClick={() => { setFilterStatus([]); setFilterRegime(''); setSearchTerm(''); }} style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: c.blue, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <i className="fas fa-rotate-left"></i> Limpar filtros
          </button>

          {/* INFO BOX */}
          <div style={s.infoBox}>
            <div style={s.infoTitle}><i className="fas fa-info-circle"></i> Informações importantes</div>
            <p style={s.infoText}>Mantenha os dados sempre atualizados para garantir a conformidade e segurança da equipe.</p>
            <a href="#" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: c.blue, fontWeight: 600, textDecoration: 'none' }}>Ver orientações →</a>
          </div>
        </div>

      </div>
    </div>
  );
}
