// app/VacinacaoModule.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './lib/supabase';

interface RegistroVacina {
  id?: number;
  colaborador_id: string;
  colaborador_nome: string;
  vacina: string;
  dose?: string;
  data_aplicacao: string;
  data_proxima_dose?: string;
  lote?: string;
  created_at?: string;
}

interface VacinaColaborador {
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCargo: string;
  vacinas: {
    covid: { dose1: boolean; dose2: boolean; reforco: boolean };
    febreAmarela: { dose: boolean };
    hepatiteB: { dose1: boolean; dose2: boolean; dose3: boolean };
    tetano: { ultimaDose: string; status: string };
    influenza: { ano: string; status: boolean };
  };
  statusGeral: 'completo' | 'andamento' | 'nao_vacinado';
}

interface VacinacaoModuleProps {
  employees?: any[];
  styles?: any;
}

// Cores consistentes com os outros módulos
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

export default function VacinacaoModule({
  employees = [],
  styles = {},
}: VacinacaoModuleProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'lista' | 'relatorios'
  >('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [colaboradoresVacina, setColaboradoresVacina] = useState<
    VacinaColaborador[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para o modal de registro
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [selectedColaboradorId, setSelectedColaboradorId] = useState('');
  const [selectedColaboradorNome, setSelectedColaboradorNome] = useState('');
  const [selectedVacina, setSelectedVacina] = useState('');
  const [selectedDose, setSelectedDose] = useState('');
  const [dataAplicacao, setDataAplicacao] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loteVacina, setLoteVacina] = useState('');
  const [dataProximaDose, setDataProximaDose] = useState('');

  // ==================== CARREGAR DADOS ====================
  const carregarDadosVacinacao = useCallback(async () => {
    if (employees.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: registros, error: supabaseError } = await supabase
        .from('vacinacao')
        .select('*')
        .order('data_aplicacao', { ascending: false });

      if (supabaseError) throw supabaseError;

      const dados = employees.map((emp: any) => {
        const empId = emp.id?.toString() || emp.codigo?.toString();
        const empNome = emp.name || emp.nome;

        const registrosDoColaborador = (registros || []).filter(
          (reg) =>
            reg.colaborador_id === empId || reg.colaborador_nome === empNome
        );

        const vacinas = {
          covid: { dose1: false, dose2: false, reforco: false },
          febreAmarela: { dose: false },
          hepatiteB: { dose1: false, dose2: false, dose3: false },
          tetano: { ultimaDose: '', status: 'vencido' },
          influenza: { ano: '', status: false },
        };

        registrosDoColaborador.forEach((reg) => {
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

        let statusGeral: 'completo' | 'andamento' | 'nao_vacinado' =
          'nao_vacinado';

        const covidCompleto = vacinas.covid.dose1 && vacinas.covid.dose2;
        const hepatiteCompleto =
          vacinas.hepatiteB.dose1 &&
          vacinas.hepatiteB.dose2 &&
          vacinas.hepatiteB.dose3;
        const febreAmarela = vacinas.febreAmarela.dose;
        const tetano = vacinas.tetano.status === 'valido';

        if (covidCompleto && hepatiteCompleto && febreAmarela && tetano) {
          statusGeral = 'completo';
        } else if (vacinas.covid.dose1 || vacinas.hepatiteB.dose1) {
          statusGeral = 'andamento';
        } else {
          statusGeral = 'nao_vacinado';
        }

        return {
          colaboradorId: empId,
          colaboradorNome: empNome,
          colaboradorCargo: emp.cargo || '-',
          vacinas,
          statusGeral,
        };
      });

      setColaboradoresVacina(dados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados de vacinação');
    } finally {
      setLoading(false);
    }
  }, [employees]);

  useEffect(() => {
    carregarDadosVacinacao();
  }, [carregarDadosVacinacao]);

  // ==================== REGISTRAR VACINA ====================
  const registrarVacina = async () => {
    if (!selectedColaboradorId) {
      setError('Selecione um colaborador');
      return;
    }
    if (!selectedVacina) {
      setError('Selecione o tipo de vacina');
      return;
    }
    if (!dataAplicacao) {
      setError('Informe a data de aplicação');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const novoRegistro = {
        colaborador_id: selectedColaboradorId,
        colaborador_nome: selectedColaboradorNome,
        vacina: selectedVacina,
        dose: selectedDose || null,
        data_aplicacao: dataAplicacao,
        lote: loteVacina || null,
        data_proxima_dose: dataProximaDose || null,
      };

      const { error: insertError } = await supabase
        .from('vacinacao')
        .insert([novoRegistro]);

      if (insertError) throw insertError;

      setSuccessMessage(
        `Vacina registrada com sucesso para ${selectedColaboradorNome}!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowRegistroModal(false);
      setSelectedColaboradorId('');
      setSelectedColaboradorNome('');
      setSelectedVacina('');
      setSelectedDose('');
      setDataAplicacao(new Date().toISOString().split('T')[0]);
      setLoteVacina('');
      setDataProximaDose('');

      await carregarDadosVacinacao();
    } catch (error: any) {
      console.error('Erro ao registrar vacina:', error);
      setError('Erro ao registrar vacina');
    } finally {
      setSaving(false);
    }
  };

  // ==================== EXPORTAÇÕES ====================
  const exportarExcel = () => {
    const dadosExportacao = colaboradoresVacina.map((item) => ({
      Colaborador: item.colaboradorNome,
      Cargo: item.colaboradorCargo,
      'COVID - 1ª Dose': item.vacinas.covid?.dose1 ? '✅' : '❌',
      'COVID - 2ª Dose': item.vacinas.covid?.dose2 ? '✅' : '❌',
      'COVID - Reforço': item.vacinas.covid?.reforco ? '✅' : '❌',
      'Febre Amarela': item.vacinas.febreAmarela?.dose ? '✅' : '❌',
      'Hepatite B':
        item.vacinas.hepatiteB?.dose1 &&
        item.vacinas.hepatiteB?.dose2 &&
        item.vacinas.hepatiteB?.dose3
          ? '✅ Completo'
          : '❌',
      Tétano: item.vacinas.tetano?.status === 'valido' ? '✅' : '❌',
      Influenza: item.vacinas.influenza?.status ? '✅' : '❌',
      'Status Geral':
        item.statusGeral === 'completo'
          ? 'Completo'
          : item.statusGeral === 'andamento'
          ? 'Em Andamento'
          : 'Não Vacinado',
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vacinação');
    XLSX.writeFile(
      wb,
      `vacinacao_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    setSuccessMessage('Excel exportado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.text('Relatório de Vacinação', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    doc.text(`Total de Colaboradores: ${colaboradoresVacina.length}`, 14, 32);

    const tableData = colaboradoresVacina.map((item) => [
      item.colaboradorNome,
      item.colaboradorCargo || '-',
      item.vacinas.covid?.dose1 ? '✅' : '❌',
      item.vacinas.covid?.dose2 ? '✅' : '❌',
      item.vacinas.febreAmarela?.dose ? '✅' : '❌',
      item.vacinas.hepatiteB?.dose1 &&
      item.vacinas.hepatiteB?.dose2 &&
      item.vacinas.hepatiteB?.dose3
        ? '✅'
        : '❌',
      item.statusGeral === 'completo'
        ? 'Completo'
        : item.statusGeral === 'andamento'
        ? 'Em Andamento'
        : 'Não Vacinado',
    ]);

    autoTable(doc, {
      head: [
        [
          'Colaborador',
          'Cargo',
          'COVID (1ª)',
          'COVID (2ª)',
          'Febre Amarela',
          'Hepatite B (3x)',
          'Status',
        ],
      ],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save(`vacinacao_${new Date().toISOString().split('T')[0]}.pdf`);
    setSuccessMessage('PDF exportado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ==================== ESTATÍSTICAS ====================
  const stats = useMemo(() => {
    const total = colaboradoresVacina.length;
    const completo = colaboradoresVacina.filter(
      (c) => c.statusGeral === 'completo'
    ).length;
    const andamento = colaboradoresVacina.filter(
      (c) => c.statusGeral === 'andamento'
    ).length;
    const naoVacinados = colaboradoresVacina.filter(
      (c) => c.statusGeral === 'nao_vacinado'
    ).length;
    return { total, completo, andamento, naoVacinados };
  }, [colaboradoresVacina]);

  const filteredColaboradores = useMemo(() => {
    return colaboradoresVacina.filter(
      (c) =>
        c.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.colaboradorCargo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [colaboradoresVacina, searchTerm]);

  // ==================== FUNÇÕES AUXILIARES ====================
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completo':
        return {
          text: 'Completo',
          color: '#059669',
          bg: '#e8f5e9',
          icon: 'fa-check-circle',
        };
      case 'andamento':
        return {
          text: 'Em Andamento',
          color: '#d97706',
          bg: '#fff3e0',
          icon: 'fa-clock',
        };
      default:
        return {
          text: 'Não Vacinado',
          color: '#dc2626',
          bg: '#fce4ec',
          icon: 'fa-times-circle',
        };
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // ==================== ESTILOS ====================
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

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const statCardStyle = (
    bgColor: string,
    borderColor: string
  ): React.CSSProperties => ({
    background: bgCard,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${borderColor}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
  });

  const statNumberStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: textPrimary,
    marginTop: '4px',
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

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const searchInputStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: '12px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    flex: 1,
    minWidth: '200px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
  };

  const buttonStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: `0 4px 15px ${accentGlow}`,
    transition: 'all 0.3s ease',
  };

  const buttonOutlineStyle: React.CSSProperties = {
    background: 'transparent',
    color: accentColor,
    border: `1px solid ${accentColor}`,
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  };

  const buttonDangerStyle: React.CSSProperties = {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: bgCard,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
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

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '20px',
    padding: '28px',
    maxWidth: '520px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    marginBottom: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    marginBottom: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 600,
    fontSize: '12px',
    color: textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ color: textSecondary, marginTop: '16px' }}>
          Carregando dados de vacinação...
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Mensagens de feedback */}
      {error && (
        <div
          style={{
            background: '#fce4ec',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #f5c6cb',
          }}
        >
          <i
            className="fas fa-exclamation-circle"
            style={{ marginRight: '8px' }}
          ></i>
          {error}
        </div>
      )}
      {successMessage && (
        <div
          style={{
            background: '#e8f5e9',
            color: '#059669',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            border: '1px solid #c3e6cb',
          }}
        >
          <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
          {successMessage}
        </div>
      )}

      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <i
              className="fas fa-syringe"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Vacinação
          </h1>
          <p style={subtitleStyle}>Controle de vacinação dos colaboradores</p>
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
            {stats.total}
          </span>{' '}
          colaboradores
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div style={statsGridStyle}>
        <div style={statCardStyle('#e8f5e9', '#059669')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-check-circle"
              style={{ color: '#059669', marginRight: '4px' }}
            ></i>
            Vacinação Completa
          </div>
          <div style={{ ...statNumberStyle, color: '#059669' }}>
            {stats.completo}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {stats.total
              ? ((stats.completo / stats.total) * 100).toFixed(0)
              : 0}
            %
          </div>
        </div>

        <div style={statCardStyle('#fff3e0', '#d97706')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-clock"
              style={{ color: '#d97706', marginRight: '4px' }}
            ></i>
            Em Andamento
          </div>
          <div style={{ ...statNumberStyle, color: '#d97706' }}>
            {stats.andamento}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {stats.total
              ? ((stats.andamento / stats.total) * 100).toFixed(0)
              : 0}
            %
          </div>
        </div>

        <div style={statCardStyle('#fce4ec', '#dc2626')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-times-circle"
              style={{ color: '#dc2626', marginRight: '4px' }}
            ></i>
            Não Vacinados
          </div>
          <div style={{ ...statNumberStyle, color: '#dc2626' }}>
            {stats.naoVacinados}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {stats.total
              ? ((stats.naoVacinados / stats.total) * 100).toFixed(0)
              : 0}
            %
          </div>
        </div>

        <div style={statCardStyle('#e3f2fd', '#2563eb')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-users"
              style={{ color: '#2563eb', marginRight: '4px' }}
            ></i>
            Total
          </div>
          <div style={{ ...statNumberStyle, color: '#2563eb' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            Colaboradores
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'dashboard')}
          onClick={() => setActiveTab('dashboard')}
          onMouseEnter={(e) => {
            if (activeTab !== 'dashboard')
              e.currentTarget.style.color = textPrimary;
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'dashboard')
              e.currentTarget.style.color = textSecondary;
          }}
        >
          <i className="fas fa-chart-pie"></i> Dashboard
        </button>
        <button
          style={tabStyle(activeTab === 'lista')}
          onClick={() => setActiveTab('lista')}
          onMouseEnter={(e) => {
            if (activeTab !== 'lista')
              e.currentTarget.style.color = textPrimary;
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'lista')
              e.currentTarget.style.color = textSecondary;
          }}
        >
          <i className="fas fa-table"></i> Lista de Colaboradores
        </button>
        <button
          style={tabStyle(activeTab === 'relatorios')}
          onClick={() => setActiveTab('relatorios')}
          onMouseEnter={(e) => {
            if (activeTab !== 'relatorios')
              e.currentTarget.style.color = textPrimary;
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'relatorios')
              e.currentTarget.style.color = textSecondary;
          }}
        >
          <i className="fas fa-file-alt"></i> Relatórios
        </button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '24px',
          }}
        >
          <div
            style={{
              background: bgCard,
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: textPrimary,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i
                className="fas fa-chart-bar"
                style={{ color: accentColor }}
              ></i>
              Progresso da Vacinação
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '13px' }}>
                  <span style={{ color: '#059669' }}>●</span> Completo
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {stats.completo} (
                  {stats.total
                    ? ((stats.completo / stats.total) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div
                style={{
                  background: '#e9ecef',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${
                      stats.total ? (stats.completo / stats.total) * 100 : 0
                    }%`,
                    height: '100%',
                    background: '#059669',
                    borderRadius: '10px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '13px' }}>
                  <span style={{ color: '#d97706' }}>●</span> Em Andamento
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {stats.andamento} (
                  {stats.total
                    ? ((stats.andamento / stats.total) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div
                style={{
                  background: '#e9ecef',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${
                      stats.total ? (stats.andamento / stats.total) * 100 : 0
                    }%`,
                    height: '100%',
                    background: '#d97706',
                    borderRadius: '10px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '13px' }}>
                  <span style={{ color: '#dc2626' }}>●</span> Não Vacinados
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {stats.naoVacinados} (
                  {stats.total
                    ? ((stats.naoVacinados / stats.total) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              </div>
              <div
                style={{
                  background: '#e9ecef',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${
                      stats.total ? (stats.naoVacinados / stats.total) * 100 : 0
                    }%`,
                    height: '100%',
                    background: '#dc2626',
                    borderRadius: '10px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              background: bgCard,
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: textPrimary,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i
                className="fas fa-lightbulb"
                style={{ color: accentColor }}
              ></i>
              Recomendações
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: textSecondary,
                lineHeight: '2',
              }}
            >
              <li>
                <span style={{ color: '#dc2626' }}>🔹</span>{' '}
                {stats.naoVacinados} colaboradores não iniciaram o esquema
                vacinal
              </li>
              <li>
                <span style={{ color: '#d97706' }}>🔹</span> {stats.andamento}{' '}
                colaboradores precisam completar o calendário
              </li>
              <li>
                <span style={{ color: '#059669' }}>🔹</span> {stats.completo}{' '}
                colaboradores com vacinação em dia
              </li>
              <li>
                <span style={{ color: accentColor }}>🔹</span> Campanha de
                Influenza deve ser realizada em Abril
              </li>
              <li>
                <span style={{ color: accentColor }}>🔹</span> Dados salvos
                diretamente no Supabase (persistente)
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* LISTA TAB */}
      {activeTab === 'lista' && (
        <>
          <div style={filterBarStyle}>
            <input
              type="text"
              style={searchInputStyle}
              placeholder="🔍 Buscar colaborador por nome ou cargo..."
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                style={buttonOutlineStyle}
                onClick={exportarExcel}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="fas fa-file-excel"></i> Excel
              </button>
              <button
                style={buttonOutlineStyle}
                onClick={exportarPDF}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="fas fa-file-pdf"></i> PDF
              </button>
              <button
                style={buttonStyle}
                onClick={() => setShowRegistroModal(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
                }}
              >
                <i className="fas fa-plus-circle"></i> Registrar Vacina
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Colaborador</th>
                  <th style={thStyle}>Cargo</th>
                  <th style={thStyle}>
                    <i className="fas fa-virus"></i> COVID
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-mosquito"></i> Febre Amarela
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-liver"></i> Hepatite B
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-biohazard"></i> Tétano
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-lungs"></i> Influenza
                  </th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredColaboradores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: textSecondary,
                      }}
                    >
                      <i
                        className="fas fa-search"
                        style={{
                          fontSize: '24px',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      ></i>
                      Nenhum colaborador encontrado
                    </td>
                  </tr>
                ) : (
                  filteredColaboradores.map((item) => {
                    const statusInfo = getStatusInfo(item.statusGeral);
                    return (
                      <tr key={item.colaboradorId}>
                        <td style={tdStyle}>
                          <strong style={{ color: textPrimary }}>
                            {item.colaboradorNome}
                          </strong>
                        </td>
                        <td style={tdStyle}>{item.colaboradorCargo || '-'}</td>
                        <td style={tdStyle}>
                          {item.vacinas.covid?.dose1 ? '✅' : '❌'} /{' '}
                          {item.vacinas.covid?.dose2 ? '✅' : '❌'}
                        </td>
                        <td style={tdStyle}>
                          {item.vacinas.febreAmarela?.dose ? '✅' : '❌'}
                        </td>
                        <td style={tdStyle}>
                          {item.vacinas.hepatiteB?.dose1 &&
                          item.vacinas.hepatiteB?.dose2 &&
                          item.vacinas.hepatiteB?.dose3
                            ? '✅'
                            : item.vacinas.hepatiteB?.dose1
                            ? '🟡'
                            : '❌'}
                        </td>
                        <td style={tdStyle}>
                          {item.vacinas.tetano?.status === 'valido'
                            ? '✅'
                            : '❌'}
                        </td>
                        <td style={tdStyle}>
                          {item.vacinas.influenza?.status ? '✅' : '❌'}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: statusInfo.bg,
                              color: statusInfo.color,
                            }}
                          >
                            <i
                              className={`fas ${statusInfo.icon}`}
                              style={{ marginRight: '4px' }}
                            ></i>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: 'none',
                              color: accentColor,
                              cursor: 'pointer',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => {
                              setSelectedColaboradorId(item.colaboradorId);
                              setSelectedColaboradorNome(item.colaboradorNome);
                              setShowRegistroModal(true);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'rgba(16, 185, 129, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                'rgba(16, 185, 129, 0.1)';
                            }}
                            title="Registrar Vacina"
                          >
                            <i className="fas fa-syringe"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* RELATÓRIOS TAB */}
      {activeTab === 'relatorios' && (
        <div
          style={{
            background: bgCard,
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
          }}
        >
          <i
            className="fas fa-file-alt"
            style={{
              fontSize: '64px',
              color: accentColor,
              marginBottom: '20px',
            }}
          ></i>
          <h3
            style={{
              marginBottom: '12px',
              color: textPrimary,
              fontWeight: 700,
            }}
          >
            Exportação de Dados
          </h3>
          <p
            style={{
              marginBottom: '32px',
              color: textSecondary,
              maxWidth: '400px',
              margin: '0 auto 32px',
            }}
          >
            Gere relatórios completos em PDF ou Excel com todos os dados de
            vacinação
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={exportarPDF}
              style={buttonDangerStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#dc2626';
              }}
            >
              <i className="fas fa-file-pdf"></i> Exportar PDF
            </button>
            <button
              onClick={exportarExcel}
              style={buttonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
              }}
            >
              <i className="fas fa-file-excel"></i> Exportar Excel
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE VACINA */}
      {showRegistroModal && (
        <div
          style={modalOverlayStyle}
          onClick={() => setShowRegistroModal(false)}
        >
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: textPrimary,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="fas fa-syringe" style={{ color: accentColor }}></i>
              Registrar Vacina
            </h2>

            <label style={labelStyle}>Colaborador *</label>
            <select
              style={selectStyle}
              value={selectedColaboradorId}
              onChange={(e) => {
                const empId = e.target.value;
                const emp = employees.find(
                  (emp) =>
                    emp.id?.toString() === empId ||
                    emp.codigo?.toString() === empId
                );
                setSelectedColaboradorId(empId);
                setSelectedColaboradorNome(emp?.name || emp?.nome || '');
              }}
            >
              <option value="">Selecione um colaborador</option>
              {employees.map((emp: any) => (
                <option
                  key={emp.id || emp.codigo}
                  value={emp.id?.toString() || emp.codigo?.toString()}
                >
                  {emp.name || emp.nome} - {emp.cargo || 'Sem cargo'}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Tipo de Vacina *</label>
            <select
              style={selectStyle}
              value={selectedVacina}
              onChange={(e) => {
                setSelectedVacina(e.target.value);
                setSelectedDose('');
              }}
            >
              <option value="">Selecione o tipo</option>
              <option value="covid">COVID-19</option>
              <option value="febreAmarela">Febre Amarela</option>
              <option value="hepatiteB">Hepatite B</option>
              <option value="tetano">Tétano</option>
              <option value="influenza">Influenza</option>
            </select>

            {(selectedVacina === 'covid' || selectedVacina === 'hepatiteB') && (
              <>
                <label style={labelStyle}>Dose *</label>
                <select
                  style={selectStyle}
                  value={selectedDose}
                  onChange={(e) => setSelectedDose(e.target.value)}
                >
                  <option value="">Selecione a dose</option>
                  {selectedVacina === 'covid' && (
                    <>
                      <option value="dose1">1ª Dose</option>
                      <option value="dose2">2ª Dose</option>
                      <option value="reforco">Reforço</option>
                    </>
                  )}
                  {selectedVacina === 'hepatiteB' && (
                    <>
                      <option value="dose1">1ª Dose</option>
                      <option value="dose2">2ª Dose</option>
                      <option value="dose3">3ª Dose</option>
                    </>
                  )}
                </select>
              </>
            )}

            <label style={labelStyle}>Data da Aplicação *</label>
            <input
              type="date"
              style={inputStyle}
              value={dataAplicacao}
              onChange={(e) => setDataAplicacao(e.target.value)}
            />

            <label style={labelStyle}>Lote (opcional)</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="Ex: 123456"
              value={loteVacina}
              onChange={(e) => setLoteVacina(e.target.value)}
            />

            <label style={labelStyle}>Próxima Dose (opcional)</label>
            <input
              type="date"
              style={inputStyle}
              value={dataProximaDose}
              onChange={(e) => setDataProximaDose(e.target.value)}
            />

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: `1px solid ${cardBorder}`,
              }}
            >
              <button
                style={buttonOutlineStyle}
                onClick={() => setShowRegistroModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancelar
              </button>
              <button
                style={buttonStyle}
                onClick={registrarVacina}
                disabled={saving}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
                }}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Salvando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Registrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
