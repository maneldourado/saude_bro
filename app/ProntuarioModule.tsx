// app/ProntuarioModule.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabase';

interface ProntuarioModuleProps {
  employees?: any[];
  styles?: any;
  preEmbarqueRecords?: any[];
  bloodPressureRecords?: any[];
  vacinasRecords?: any[];
}

export default function ProntuarioModule({
  employees = [],
  styles = {},
  preEmbarqueRecords = [],
  bloodPressureRecords = [],
  vacinasRecords = [],
}: ProntuarioModuleProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('geral');
  const [embarques, setEmbarques] = useState<any[]>([]);
  const [toxicologicoRecords, setToxicologicoRecords] = useState<any[]>([]);
  const [preMerAvaliacoes, setPreMerAvaliacoes] = useState<any[]>([]);
  const [imcRecords, setImcRecords] = useState<any[]>([]);
  const [vacinasRecordsSupabase, setVacinasRecordsSupabase] = useState<any[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Mapa de dados IMC mais recentes por colaborador
  const [latestImcMap, setLatestImcMap] = useState<Map<string, any>>(new Map());

  // Usar as cores do styles.ts
  const accentColor = '#10b981';
  const accentGlow = 'rgba(16, 185, 129, 0.15)';
  const bgCard = '#ffffff';
  const cardBorder = 'rgba(0, 0, 0, 0.08)';
  const textPrimary = '#1a1a1a';
  const textSecondary = '#6b5f55';

  // ==================== CARREGAR DADOS ====================
  const carregarExamesToxicologicos = async () => {
    const { data, error } = await supabase
      .from('exames_toxicologicos')
      .select('*')
      .order('data_coleta', { ascending: false });

    if (!error && data) {
      setToxicologicoRecords(data);
    }
  };

  const carregarPreMerAvaliacoes = async () => {
    const { data, error } = await supabase
      .from('pre_mer_avaliacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPreMerAvaliacoes(data);
    }
  };

  const carregarTodosImcRecords = async () => {
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
          .range(from, to)
          .order('data_raw', { ascending: false });

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

      // Criar mapa com o IMC mais recente de cada colaborador
      const map = new Map<string, any>();
      allData.forEach((record) => {
        const key =
          record.codigo?.toString() || record.colaborador_codigo?.toString();
        if (key && !map.has(key)) {
          map.set(key, record);
        }
      });
      setLatestImcMap(map);

      return allData;
    } catch (error) {
      console.error('Erro ao carregar IMC records:', error);
      setImcRecords([]);
      return [];
    }
  };

  const carregarVacinasRecords = async () => {
    const { data, error } = await supabase
      .from('vacinacao')
      .select('*')
      .order('data_aplicacao', { ascending: false });

    if (!error && data) {
      setVacinasRecordsSupabase(data);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        carregarExamesToxicologicos(),
        carregarPreMerAvaliacoes(),
        carregarTodosImcRecords(),
        carregarVacinasRecords(),
      ]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  useEffect(() => {
    const storedEmbarques = localStorage.getItem('prontuario_embarques');
    if (storedEmbarques) {
      setEmbarques(JSON.parse(storedEmbarques));
    } else {
      const embarquesFromPreEmbarque = preEmbarqueRecords.map(
        (record: any) => ({
          id: record.id,
          dataEmbarque: record.dataExame,
          dataDesembarque: record.dataExame,
          frenteServico: record.frenteServico,
          funcao: record.cargo,
          diasTrabalhados: 1,
          colaboradorId: record.codigo,
          colaboradorNome: record.nome,
        })
      );
      setEmbarques(embarquesFromPreEmbarque);
      localStorage.setItem(
        'prontuario_embarques',
        JSON.stringify(embarquesFromPreEmbarque)
      );
    }
  }, [preEmbarqueRecords]);

  // ==================== FUNÇÕES AUXILIARES ====================
  const calcularIdade = (dataNascimento: string): number => {
    if (!dataNascimento) return 0;
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const calcularIMC = (peso: number, altura: number): number => {
    if (!peso || !altura) return 0;
    let alturaEmMetros = altura;
    if (alturaEmMetros > 3) {
      alturaEmMetros = alturaEmMetros / 100;
    }
    return peso / (alturaEmMetros * alturaEmMetros);
  };

  const getClassificacaoIMC = (imc: number): string => {
    if (imc === 0) return 'Não informado';
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade grau I';
    if (imc < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  };

  // ==================== OBTER DADOS DO COLABORADOR COM IMC ====================
  const getEmployeeWithImc = (employee: any) => {
    if (!employee) return null;

    const codigo = employee.codigo?.toString();
    const latestImc = latestImcMap.get(codigo);

    const weight = latestImc?.peso || employee.weight || employee.peso || null;
    const height =
      latestImc?.altura || employee.height || employee.altura || null;
    const imc = weight && height ? calcularIMC(weight, height) : 0;

    return {
      ...employee,
      weight: weight,
      height: height,
      imc: imc,
      latestImcDate: latestImc?.data_raw || null,
      latestImcCompany: latestImc?.empresa || latestImc?.frente_servico || null,
    };
  };

  // ==================== FILTRAGEM ====================
  const filteredEmployees = useMemo(() => {
    return employees
      .map((emp) => getEmployeeWithImc(emp))
      .filter((emp) => emp)
      .filter(
        (emp: any) =>
          emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [employees, searchTerm, latestImcMap]);

  // Colaborador selecionado com IMC
  const selectedWithImc = useMemo(() => {
    if (!selectedEmployee) return null;
    return getEmployeeWithImc(selectedEmployee);
  }, [selectedEmployee, latestImcMap]);

  const getPreEmbarqueDoColaborador = () => {
    if (!selectedEmployee) return [];
    return preEmbarqueRecords.filter(
      (record: any) =>
        record.nome === selectedEmployee.name ||
        record.codigo === selectedEmployee.codigo
    );
  };

  const getPressaoDoColaborador = () => {
    if (!selectedEmployee) return [];
    return bloodPressureRecords.filter(
      (record: any) =>
        record.employeeId === selectedEmployee.id ||
        record.employeeName === selectedEmployee.name
    );
  };

  const getToxicologicoDoColaborador = () => {
    if (!selectedEmployee) return [];
    return toxicologicoRecords.filter(
      (record: any) =>
        record.colaborador_id?.toString() === selectedEmployee.id?.toString() ||
        record.colaborador_nome === selectedEmployee.name
    );
  };

  const getPreMERAvaliacoesDoColaborador = () => {
    if (!selectedEmployee) return [];
    return preMerAvaliacoes.filter(
      (record: any) =>
        record.colaborador_id?.toString() === selectedEmployee.id?.toString() ||
        record.colaborador_nome === selectedEmployee.name
    );
  };

  const getImcRecordsDoColaborador = () => {
    if (!selectedEmployee) return [];
    const codigo = selectedEmployee.codigo?.toString();
    return imcRecords.filter(
      (record) =>
        record.codigo?.toString() === codigo ||
        record.colaborador_codigo?.toString() === codigo
    );
  };

  const getVacinasDoColaborador = () => {
    if (!selectedEmployee) return {};

    const empId = selectedEmployee.id?.toString();
    const empCodigo = selectedEmployee.codigo?.toString();
    const empNome = selectedEmployee.name || selectedEmployee.nome;

    const registrosDoColaborador = vacinasRecordsSupabase.filter(
      (record: any) =>
        record.colaborador_id === empId ||
        record.colaborador_id === empCodigo ||
        record.colaborador_nome === empNome
    );

    const vacinas = {
      covid: { dose1: false, dose2: false, reforco: false },
      febreAmarela: { dose: false },
      hepatiteB: { dose1: false, dose2: false, dose3: false },
      tetano: { ultimaDose: '', status: 'vencido' },
      influenza: { ano: '', status: false },
    };

    registrosDoColaborador.forEach((reg: any) => {
      switch (reg.vacina) {
        case 'covid':
          if (reg.dose === 'dose1') vacinas.covid.dose1 = true;
          if (reg.dose === 'dose2') vacinas.covid.dose2 = true;
          if (reg.dose === 'reforco') vacinas.covid.reforco = true;
          break;
        case 'febreAmarela':
          vacinas.febreAmarela.dose = true;
          break;
        case 'hepatiteB':
          if (reg.dose === 'dose1') vacinas.hepatiteB.dose1 = true;
          if (reg.dose === 'dose2') vacinas.hepatiteB.dose2 = true;
          if (reg.dose === 'dose3') vacinas.hepatiteB.dose3 = true;
          break;
        case 'tetano':
          vacinas.tetano = {
            ultimaDose: reg.data_aplicacao,
            status: 'valido',
          };
          break;
        case 'influenza':
          vacinas.influenza = {
            ano: new Date(reg.data_aplicacao).getFullYear().toString(),
            status: true,
          };
          break;
      }
    });

    return vacinas;
  };

  const getEmbarquesUnificados = () => {
    if (!selectedEmployee) return [];

    const embarquesPreEmbarque = embarques.filter(
      (record: any) =>
        record.colaboradorNome === selectedEmployee.name ||
        record.colaboradorId === selectedEmployee.codigo
    );

    const imcRecordsDoColaborador = getImcRecordsDoColaborador();
    const embarquesIMC = imcRecordsDoColaborador
      .map((record: any) => ({
        id: `imc_${record.id}`,
        dataEmbarque: record.data_raw || record.data_str,
        frenteServico: record.empresa || record.frente_servico || '',
        funcao: selectedEmployee.cargo || 'Não definida',
        diasTrabalhados: 1,
        origem: 'IMC',
        dataStr:
          record.data_str ||
          (record.data_raw
            ? new Date(record.data_raw).toLocaleDateString('pt-BR')
            : '-'),
      }))
      .filter(
        (emb) =>
          emb.frenteServico &&
          emb.frenteServico !== '-' &&
          emb.frenteServico !== ''
      );

    const todosEmbarques = [...embarquesPreEmbarque, ...embarquesIMC];
    todosEmbarques.sort((a, b) => {
      const dateA = a.dataEmbarque ? new Date(a.dataEmbarque).getTime() : 0;
      const dateB = b.dataEmbarque ? new Date(b.dataEmbarque).getTime() : 0;
      return dateB - dateA;
    });

    return todosEmbarques;
  };

  // ==================== ESTILOS ====================
  const badgeStyle = (type: string): React.CSSProperties => {
    let bg = '#e9ecef';
    let color = '#495057';
    if (
      type === 'aprovado' ||
      type === 'ativo' ||
      type === 'negativo' ||
      type === 'Normal' ||
      type === 'apto'
    ) {
      bg = '#e8f5e9';
      color = '#059669';
    } else if (
      type === 'rejeitado' ||
      type === 'vencido' ||
      type === 'positivo' ||
      type === 'Sobrepeso' ||
      type === 'inapto'
    ) {
      bg = '#fce4ec';
      color = '#dc2626';
    } else if (
      type === 'pendente' ||
      type === 'proximo_vencer' ||
      type === 'Abaixo do peso'
    ) {
      bg = '#fff3e0';
      color = '#d97706';
    }
    return {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 500,
      background: bg,
      color: color,
    };
  };

  const getImcBadgeStyle = (imc: number): React.CSSProperties => {
    if (imc === 0) return { background: '#e9ecef', color: '#495057' };
    if (imc < 18.5) return { background: '#fff3e0', color: '#d97706' };
    if (imc < 25) return { background: '#e8f5e9', color: '#059669' };
    if (imc < 30) return { background: '#fff3e0', color: '#d97706' };
    return { background: '#fce4ec', color: '#dc2626' };
  };

  // ==================== ESTILOS DO COMPONENTE ====================
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    background: 'transparent',
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    color: textPrimary,
    margin: 0,
    letterSpacing: '-0.5px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: textSecondary,
    fontSize: '14px',
    margin: '4px 0 0 0',
    fontWeight: 500,
  };

  const searchContainerStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '24px',
    padding: '20px 28px',
    marginBottom: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
  };

  const prontuarioContainerStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '24px',
    padding: '28px',
    marginBottom: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
  };

  const colaboradoresGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  };

  const colaboradorCardStyle = (isSelected: boolean): React.CSSProperties => ({
    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : bgCard,
    borderRadius: '16px',
    padding: '16px',
    cursor: 'pointer',
    border: isSelected ? `2px solid ${accentColor}` : `1px solid ${cardBorder}`,
    transition: 'all 0.2s ease',
    boxShadow: isSelected ? `0 4px 15px ${accentGlow}` : 'none',
  });

  const perfilHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: `2px solid ${cardBorder}`,
    flexWrap: 'wrap',
  };

  const avatarStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 700,
    color: 'white',
    boxShadow: `0 4px 12px ${accentGlow}`,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: `2px solid ${cardBorder}`,
    flexWrap: 'wrap',
    paddingBottom: '0',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 700 : 600,
    color: isActive ? accentColor : textSecondary,
    borderBottom: isActive
      ? `3px solid ${accentColor}`
      : '3px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '14px 16px',
    background: 'rgba(0, 0, 0, 0.02)',
    borderBottom: `2px solid ${cardBorder}`,
    fontWeight: 700,
    fontSize: '12px',
    color: textPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: `1px solid ${cardBorder}`,
    fontSize: '14px',
    color: textSecondary,
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: textSecondary,
  };

  const statCardStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
    border: `1px solid ${cardBorder}`,
    transition: 'all 0.2s ease',
  };

  const infoCardStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '16px',
    padding: '16px',
    border: `1px solid ${cardBorder}`,
  };

  // ==================== TABS CONFIG ====================
  const tabs = [
    { id: 'geral', icon: 'fas fa-clipboard-list', label: 'Resumo Geral' },
    { id: 'preMer', icon: 'fas fa-stethoscope', label: 'Pré-MER' },
    { id: 'preEmbarque', icon: 'fas fa-ship', label: 'Pré-Embarque' },
    { id: 'pressao', icon: 'fas fa-heartbeat', label: 'Pressão Arterial' },
    { id: 'vacinas', icon: 'fas fa-syringe', label: 'Vacinas' },
    { id: 'toxicologico', icon: 'fas fa-flask', label: 'Toxicológico' },
    { id: 'imc', icon: 'fas fa-chart-line', label: 'Histórico IMC' },
    { id: 'embarques', icon: 'fas fa-anchor', label: 'Embarques' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ color: textSecondary, marginTop: '16px' }}>
          Carregando prontuário...
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <i
              className="fas fa-folder-open"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Prontuário Médico
          </h1>
          <p style={subtitleStyle}>Histórico completo dos colaboradores</p>
        </div>
        <div
          style={{
            fontSize: '14px',
            color: textSecondary,
            background: bgCard,
            padding: '8px 16px',
            borderRadius: '12px',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <i
            className="fas fa-users"
            style={{ marginRight: '8px', color: accentColor }}
          ></i>
          <span style={{ fontWeight: 700, color: textPrimary }}>
            {employees.length}
          </span>{' '}
          colaboradores
        </div>
      </div>

      {/* SEARCH */}
      <div style={searchContainerStyle}>
        <input
          type="text"
          style={searchInputStyle}
          placeholder="🔍 Buscar colaborador por nome, código ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = accentColor;
            e.currentTarget.style.background = '#ffffff';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = cardBorder;
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
          }}
        />
      </div>

      {/* PRONTUÁRIO DO COLABORADOR SELECIONADO */}
      {selectedWithImc && (
        <div style={prontuarioContainerStyle}>
          {/* PERFIL HEADER */}
          <div style={perfilHeaderStyle}>
            <div style={{ width: '100%', marginBottom: '8px' }}>
              <button
                onClick={() => setSelectedEmployee(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#dc2626',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                <i className="fas fa-arrow-left"></i>
                Fechar prontuário
              </button>
            </div>

            <div style={avatarStyle}>
              {selectedWithImc.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            <div style={infoStyle}>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: textPrimary,
                }}
              >
                {selectedWithImc.name}
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  fontSize: '13px',
                  color: textSecondary,
                }}
              >
                <span>
                  <i
                    className="fas fa-id-badge"
                    style={{ width: '16px', color: accentColor }}
                  ></i>
                  <strong style={{ color: textPrimary, marginLeft: '4px' }}>
                    Código:
                  </strong>{' '}
                  {selectedWithImc.codigo}
                </span>
                <span>
                  <i
                    className="fas fa-briefcase"
                    style={{ width: '16px', color: accentColor }}
                  ></i>
                  <strong style={{ color: textPrimary, marginLeft: '4px' }}>
                    Cargo:
                  </strong>{' '}
                  {selectedWithImc.cargo || 'Não definido'}
                </span>
                <span>
                  <i
                    className="fas fa-building"
                    style={{ width: '16px', color: accentColor }}
                  ></i>
                  <strong style={{ color: textPrimary, marginLeft: '4px' }}>
                    Departamento:
                  </strong>{' '}
                  {selectedWithImc.departamento || 'Não definido'}
                </span>
                <span>
                  <i
                    className="fas fa-globe"
                    style={{ width: '16px', color: accentColor }}
                  ></i>
                  <strong style={{ color: textPrimary, marginLeft: '4px' }}>
                    Regime:
                  </strong>{' '}
                  {selectedWithImc.regime === 'offshore'
                    ? 'Offshore'
                    : 'Onshore'}
                </span>
                <span>
                  <i
                    className="fas fa-calendar-alt"
                    style={{ width: '16px', color: accentColor }}
                  ></i>
                  <strong style={{ color: textPrimary, marginLeft: '4px' }}>
                    Idade:
                  </strong>{' '}
                  {calcularIdade(selectedWithImc.birthDate)} anos
                </span>
                <span>
                  <i
                    className="fas fa-calendar-check"
                    style={{ width: '16px', color: accentColor }}
                  ></i>
                  <strong style={{ color: textPrimary, marginLeft: '4px' }}>
                    Admissão:
                  </strong>{' '}
                  {selectedWithImc.admissao
                    ? formatDate(selectedWithImc.admissao)
                    : 'Não informada'}
                </span>
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '16px 24px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: '16px',
                minWidth: '100px',
                border: `1px solid ${accentColor}`,
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: accentColor,
                }}
              >
                {selectedWithImc.imc ? selectedWithImc.imc.toFixed(1) : '0.0'}
              </div>
              <div style={{ fontSize: '12px', color: textSecondary }}>
                <i className="fas fa-weight"></i> IMC Atual
              </div>
              {selectedWithImc.latestImcDate && (
                <div
                  style={{
                    fontSize: '10px',
                    color: textSecondary,
                    marginTop: '4px',
                  }}
                >
                  {formatDate(selectedWithImc.latestImcDate)} •{' '}
                  {selectedWithImc.latestImcCompany || '-'}
                </div>
              )}
            </div>
          </div>

          {/* TABS */}
          <div style={tabsStyle}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                style={tabStyle(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id)
                    e.currentTarget.style.color = textPrimary;
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id)
                    e.currentTarget.style.color = textSecondary;
                }}
              >
                <i className={tab.icon}></i> {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: RESUMO GERAL */}
          {activeTab === 'geral' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                <div style={infoCardStyle}>
                  <h4
                    style={{
                      marginBottom: '12px',
                      fontWeight: 700,
                      color: textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i
                      className="fas fa-user"
                      style={{ color: accentColor }}
                    ></i>
                    Dados Pessoais
                  </h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    <div>
                      <strong>Nome:</strong> {selectedWithImc.name}
                    </div>
                    <div>
                      <strong>CPF:</strong>{' '}
                      {selectedWithImc.cpf || 'Não informado'}
                    </div>
                    <div>
                      <strong>Email:</strong>{' '}
                      {selectedWithImc.email || 'Não informado'}
                    </div>
                    <div>
                      <strong>Nascimento:</strong>{' '}
                      {selectedWithImc.birthDate
                        ? formatDate(selectedWithImc.birthDate)
                        : 'Não informada'}
                    </div>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h4
                    style={{
                      marginBottom: '12px',
                      fontWeight: 700,
                      color: textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i
                      className="fas fa-briefcase"
                      style={{ color: accentColor }}
                    ></i>
                    Dados Funcionais
                  </h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    <div>
                      <strong>Cargo:</strong>{' '}
                      {selectedWithImc.cargo || 'Não definido'}
                    </div>
                    <div>
                      <strong>Departamento:</strong>{' '}
                      {selectedWithImc.departamento || 'Não definido'}
                    </div>
                    <div>
                      <strong>Regime:</strong>{' '}
                      {selectedWithImc.regime === 'offshore'
                        ? 'Offshore'
                        : 'Onshore'}
                    </div>
                    <div>
                      <strong>Admissão:</strong>{' '}
                      {selectedWithImc.admissao
                        ? formatDate(selectedWithImc.admissao)
                        : 'Não informada'}
                    </div>
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <h4
                    style={{
                      marginBottom: '12px',
                      fontWeight: 700,
                      color: textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i
                      className="fas fa-ruler"
                      style={{ color: accentColor }}
                    ></i>
                    Dados Antropométricos
                  </h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    <div>
                      <strong>Altura:</strong>{' '}
                      {selectedWithImc.height
                        ? `${(selectedWithImc.height * 100).toFixed(0)} cm`
                        : 'Não informado'}
                    </div>
                    <div>
                      <strong>Peso:</strong>{' '}
                      {selectedWithImc.weight
                        ? `${selectedWithImc.weight} kg`
                        : 'Não informado'}
                    </div>
                    <div>
                      <strong>IMC:</strong>{' '}
                      {selectedWithImc.imc
                        ? selectedWithImc.imc.toFixed(1)
                        : '0.0'}
                    </div>
                    <div>
                      <strong>Classificação:</strong>{' '}
                      {selectedWithImc.imc
                        ? getClassificacaoIMC(selectedWithImc.imc)
                        : 'Não informado'}
                    </div>
                    {selectedWithImc.latestImcDate && (
                      <div
                        style={{
                          fontSize: '11px',
                          color: textSecondary,
                          marginTop: '4px',
                        }}
                      >
                        <i
                          className="fas fa-calendar-alt"
                          style={{ marginRight: '4px' }}
                        ></i>
                        Última medição:{' '}
                        {formatDate(selectedWithImc.latestImcDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards de estatísticas rápidas */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginTop: '20px',
                }}
              >
                <div
                  style={{
                    ...statCardStyle,
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderColor: accentColor,
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: accentColor,
                    }}
                  >
                    {getPreMERAvaliacoesDoColaborador().length}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    <i className="fas fa-stethoscope"></i> Pré-MER
                  </div>
                </div>
                <div
                  style={{
                    ...statCardStyle,
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderColor: accentColor,
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: accentColor,
                    }}
                  >
                    {getPreEmbarqueDoColaborador().length}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    <i className="fas fa-ship"></i> Pré-Embarque
                  </div>
                </div>
                <div
                  style={{
                    ...statCardStyle,
                    background: 'rgba(220, 38, 38, 0.06)',
                    borderColor: '#dc2626',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#dc2626',
                    }}
                  >
                    {getPressaoDoColaborador().length}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    <i className="fas fa-heartbeat"></i> Pressão
                  </div>
                </div>
                <div
                  style={{
                    ...statCardStyle,
                    background: 'rgba(245, 158, 11, 0.06)',
                    borderColor: '#d97706',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#d97706',
                    }}
                  >
                    {getToxicologicoDoColaborador().length}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    <i className="fas fa-flask"></i> Toxicológico
                  </div>
                </div>
                <div
                  style={{
                    ...statCardStyle,
                    background: 'rgba(59, 130, 246, 0.06)',
                    borderColor: '#2563eb',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#2563eb',
                    }}
                  >
                    {getImcRecordsDoColaborador().length}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    <i className="fas fa-chart-line"></i> IMC
                  </div>
                </div>
                <div
                  style={{
                    ...statCardStyle,
                    background: 'rgba(139, 92, 246, 0.06)',
                    borderColor: '#7c3aed',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#7c3aed',
                    }}
                  >
                    {getEmbarquesUnificados().length}
                  </div>
                  <div style={{ fontSize: '12px', color: textSecondary }}>
                    <i className="fas fa-anchor"></i> Embarques
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRÉ-MER */}
          {activeTab === 'preMer' && (
            <div>
              {getPreMERAvaliacoesDoColaborador().length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-stethoscope"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhuma avaliação Pré-MER encontrada</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-alt"></i> Data
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-user-md"></i> Avaliador
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-thermometer-half"></i>{' '}
                          Temperatura
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-heart"></i> Pressão
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-heartbeat"></i> Frequência
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-check-circle"></i> Aptidão
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPreMERAvaliacoesDoColaborador().map(
                        (registro: any) => (
                          <tr key={registro.id}>
                            <td style={tdStyle}>
                              {formatDate(registro.created_at)}
                            </td>
                            <td style={tdStyle}>{registro.nome_avaliador}</td>
                            <td style={tdStyle}>{registro.temperatura}°C</td>
                            <td style={tdStyle}>
                              {registro.pressao_sistolica}/
                              {registro.pressao_diastolica} mmHg
                            </td>
                            <td style={tdStyle}>
                              {registro.frequencia_cardíaca} bpm
                            </td>
                            <td style={tdStyle}>
                              <span style={badgeStyle(registro.aptidao)}>
                                {registro.aptidao === 'apto'
                                  ? '✅ APTO'
                                  : '❌ INAPTO'}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: PRÉ-EMBARQUE */}
          {activeTab === 'preEmbarque' && (
            <div>
              {getPreEmbarqueDoColaborador().length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-ship"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhum registro de pré-embarque encontrado</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-alt"></i> Data do Exame
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-map-marker-alt"></i> Frente de
                          Serviço
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-weight"></i> Peso
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-ruler-vertical"></i> Altura
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-chart-line"></i> IMC
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-info-circle"></i> Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPreEmbarqueDoColaborador().map((registro: any) => {
                        const imc = calcularIMC(registro.peso, registro.altura);
                        return (
                          <tr key={registro.id}>
                            <td style={tdStyle}>
                              {formatDate(registro.dataExame)}
                            </td>
                            <td style={tdStyle}>
                              {registro.frenteServico || '-'}
                            </td>
                            <td style={tdStyle}>{registro.peso} kg</td>
                            <td style={tdStyle}>{registro.altura} m</td>
                            <td style={tdStyle}>{imc.toFixed(1)}</td>
                            <td style={tdStyle}>
                              <span style={badgeStyle(registro.status)}>
                                {registro.status || 'Pendente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: PRESSÃO ARTERIAL */}
          {activeTab === 'pressao' && (
            <div>
              {getPressaoDoColaborador().length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-heartbeat"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhum registro de pressão arterial encontrado</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-alt"></i> Data
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-arrow-up"></i> Sistólica
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-arrow-down"></i> Diastólica
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-thermometer-half"></i>{' '}
                          Temperatura
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-heartbeat"></i> Frequência
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPressaoDoColaborador().map((registro: any) => (
                        <tr key={registro.id}>
                          <td style={tdStyle}>{formatDate(registro.date)}</td>
                          <td style={tdStyle}>{registro.systolic} mmHg</td>
                          <td style={tdStyle}>{registro.diastolic} mmHg</td>
                          <td style={tdStyle}>{registro.temperature}°C</td>
                          <td style={tdStyle}>{registro.heartRate} bpm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: VACINAS */}
          {activeTab === 'vacinas' && (
            <div>
              {Object.keys(getVacinasDoColaborador()).length === 0 ||
              Object.values(getVacinasDoColaborador()).every(
                (v) =>
                  typeof v === 'object' &&
                  Object.values(v).every(
                    (val) => val === false || val === '' || val === 'vencido'
                  )
              ) ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-syringe"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhum registro de vacina encontrado</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {/* COVID-19 */}
                  <div style={infoCardStyle}>
                    <h4
                      style={{
                        fontWeight: 700,
                        marginBottom: '12px',
                        color: textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i
                        className="fas fa-virus"
                        style={{ color: accentColor }}
                      ></i>{' '}
                      COVID-19
                    </h4>
                    <div style={{ fontSize: '13px', lineHeight: '2' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>1ª Dose</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().covid?.dose1
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().covid?.dose1
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>2ª Dose</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().covid?.dose2
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().covid?.dose2
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Reforço</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().covid?.reforco
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().covid?.reforco
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Febre Amarela */}
                  <div style={infoCardStyle}>
                    <h4
                      style={{
                        fontWeight: 700,
                        marginBottom: '12px',
                        color: textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i
                        className="fas fa-mosquito"
                        style={{ color: accentColor }}
                      ></i>{' '}
                      Febre Amarela
                    </h4>
                    <div style={{ fontSize: '13px', lineHeight: '2' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Dose Única</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().febreAmarela?.dose
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().febreAmarela?.dose
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hepatite B */}
                  <div style={infoCardStyle}>
                    <h4
                      style={{
                        fontWeight: 700,
                        marginBottom: '12px',
                        color: textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i
                        className="fas fa-liver"
                        style={{ color: accentColor }}
                      ></i>{' '}
                      Hepatite B
                    </h4>
                    <div style={{ fontSize: '13px', lineHeight: '2' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>1ª Dose</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().hepatiteB?.dose1
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().hepatiteB?.dose1
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>2ª Dose</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().hepatiteB?.dose2
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().hepatiteB?.dose2
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>3ª Dose</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().hepatiteB?.dose3
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().hepatiteB?.dose3
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tétano */}
                  <div style={infoCardStyle}>
                    <h4
                      style={{
                        fontWeight: 700,
                        marginBottom: '12px',
                        color: textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i
                        className="fas fa-biohazard"
                        style={{ color: accentColor }}
                      ></i>{' '}
                      Tétano
                    </h4>
                    <div style={{ fontSize: '13px', lineHeight: '2' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Última Dose</span>
                        <span>
                          {getVacinasDoColaborador().tetano?.ultimaDose
                            ? formatDate(
                                getVacinasDoColaborador().tetano.ultimaDose
                              )
                            : 'Não informada'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Status</span>
                        <span
                          style={{
                            color:
                              getVacinasDoColaborador().tetano?.status ===
                              'valido'
                                ? '#059669'
                                : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().tetano?.status === 'valido'
                            ? '✅ Válido'
                            : '❌ Vencido'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Influenza */}
                  <div style={infoCardStyle}>
                    <h4
                      style={{
                        fontWeight: 700,
                        marginBottom: '12px',
                        color: textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i
                        className="fas fa-lungs"
                        style={{ color: accentColor }}
                      ></i>{' '}
                      Influenza
                    </h4>
                    <div style={{ fontSize: '13px', lineHeight: '2' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Ano</span>
                        <span>
                          {getVacinasDoColaborador().influenza?.ano ||
                            'Não informado'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Status</span>
                        <span
                          style={{
                            color: getVacinasDoColaborador().influenza?.status
                              ? '#059669'
                              : '#dc2626',
                          }}
                        >
                          {getVacinasDoColaborador().influenza?.status
                            ? '✅ Vacinado'
                            : '❌ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: TOXICOLÓGICO */}
          {activeTab === 'toxicologico' && (
            <div>
              {getToxicologicoDoColaborador().length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-flask"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhum exame toxicológico encontrado</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-alt"></i> Data Coleta
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-check"></i> Validade
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-tag"></i> Tipo
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-check-circle"></i> Resultado
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-flask"></i> Substâncias
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getToxicologicoDoColaborador().map((registro: any) => (
                        <tr key={registro.id}>
                          <td style={tdStyle}>
                            {formatDate(registro.data_coleta)}
                          </td>
                          <td style={tdStyle}>
                            {formatDate(registro.data_validade)}
                          </td>
                          <td style={tdStyle}>
                            {registro.tipo_exame || 'Periódico'}
                          </td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(registro.resultado)}>
                              {registro.resultado === 'negativo'
                                ? '✅ Negativo'
                                : registro.resultado === 'positivo'
                                ? '❌ Positivo'
                                : '⚠️ Inconclusivo'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {registro.substancias?.join(', ') || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTÓRICO IMC */}
          {activeTab === 'imc' && (
            <div>
              {getImcRecordsDoColaborador().length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-chart-line"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhum registro de IMC encontrado</p>
                  <p style={{ fontSize: '12px' }}>
                    Os registros de IMC são importados ou lançados manualmente
                    no Módulo IMC
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-alt"></i> Data da
                          Medição
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-weight"></i> Peso (kg)
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-ruler-vertical"></i> Altura (cm)
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-chart-line"></i> IMC
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-tag"></i> Classificação
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-building"></i> Empresa / Frente
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getImcRecordsDoColaborador().map((registro: any) => {
                        const alturaCm = registro.altura;
                        const alturaM =
                          alturaCm > 3 ? alturaCm / 100 : alturaCm;
                        const imc =
                          alturaM > 0 ? registro.peso / (alturaM * alturaM) : 0;
                        return (
                          <tr key={registro.id}>
                            <td style={tdStyle}>
                              {registro.data_str ||
                                (registro.data_raw
                                  ? formatDate(registro.data_raw)
                                  : '-')}
                            </td>
                            <td style={tdStyle}>{registro.peso} kg</td>
                            <td style={tdStyle}>{registro.altura} cm</td>
                            <td style={tdStyle}>
                              <span
                                style={{ fontWeight: 700, color: textPrimary }}
                              >
                                {imc.toFixed(1)}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={getImcBadgeStyle(imc)}>
                                {getClassificacaoIMC(imc)}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              {registro.empresa ||
                                registro.frente_servico ||
                                '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTÓRICO DE EMBARQUES */}
          {activeTab === 'embarques' && (
            <div>
              {getEmbarquesUnificados().length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-anchor"
                    style={{
                      fontSize: '48px',
                      marginBottom: '16px',
                      color: cardBorder,
                    }}
                  ></i>
                  <p>Nenhum embarque registrado</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>
                          <i className="fas fa-calendar-alt"></i> Data do
                          Embarque
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-map-marker-alt"></i> Frente de
                          Serviço
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-briefcase"></i> Função
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-clock"></i> Dias
                        </th>
                        <th style={thStyle}>
                          <i className="fas fa-info-circle"></i> Origem
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getEmbarquesUnificados().map((registro: any) => (
                        <tr key={registro.id}>
                          <td style={tdStyle}>
                            {registro.dataStr ||
                              (registro.dataEmbarque
                                ? formatDate(registro.dataEmbarque)
                                : '-')}
                          </td>
                          <td style={tdStyle}>{registro.frenteServico}</td>
                          <td style={tdStyle}>{registro.funcao}</td>
                          <td style={tdStyle}>
                            {registro.diasTrabalhados} dia(s)
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.08)',
                                color: accentColor,
                              }}
                            >
                              {registro.origem === 'IMC'
                                ? '📊 IMC'
                                : '📋 Pré-Embarque'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LISTA DE COLABORADORES */}
      <div style={colaboradoresGridStyle}>
        {filteredEmployees.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              background: bgCard,
              borderRadius: '16px',
              border: `1px solid ${cardBorder}`,
            }}
          >
            <i
              className="fas fa-users"
              style={{ fontSize: '48px', color: cardBorder }}
            ></i>
            <p style={{ color: textSecondary, marginTop: '16px' }}>
              Nenhum colaborador encontrado
            </p>
          </div>
        ) : (
          filteredEmployees.map((emp: any) => {
            const isSelected = selectedEmployee?.id === emp.id;
            return (
              <div
                key={emp.id}
                style={colaboradorCardStyle(isSelected)}
                onClick={() => setSelectedEmployee(emp)}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    e.currentTarget.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.08)`;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isSelected
                        ? `linear-gradient(135deg, ${accentColor}, #059669)`
                        : 'rgba(16, 185, 129, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: isSelected ? 'white' : accentColor,
                      fontSize: '20px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {emp.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: textPrimary }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: '12px', color: textSecondary }}>
                      {emp.cargo} • Cód: {emp.codigo}
                    </div>
                    {emp.imc > 0 && (
                      <div style={{ fontSize: '11px', color: accentColor }}>
                        IMC: {emp.imc.toFixed(1)} •{' '}
                        {getClassificacaoIMC(emp.imc)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      color: isSelected ? accentColor : cardBorder,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <i
                      className={`fas ${
                        isSelected ? 'fa-chevron-right' : 'fa-chevron-right'
                      }`}
                    ></i>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
