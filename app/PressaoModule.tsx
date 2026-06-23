// app/PressaoModule.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './lib/supabase';

interface PressaoModuleProps {
  bloodPressureRecords?: any[];
  filteredPressureRecords?: any[];
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  showPressureForm?: boolean;
  setShowPressureForm?: (value: boolean) => void;
  newPressureRecord?: any;
  setNewPressureRecord?: (value: any) => void;
  employees?: any[];
  employeeSearchTerm?: string;
  setEmployeeSearchTerm?: (value: string) => void;
  showEmployeeDropdown?: boolean;
  setShowEmployeeDropdown?: (value: boolean) => void;
  addBloodPressureRecord?: () => void;
  deletePressureRecord?: (id: string) => void;
  styles?: any;
  onRecordsUpdate?: (records: any[]) => void;
}

// Cores consistentes
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';
const dangerColor = '#dc2626';
const warningColor = '#d97706';
const infoColor = '#3b82f6';

export default function PressaoModule({
  bloodPressureRecords: externalRecords = [],
  filteredPressureRecords: externalFiltered = [],
  searchTerm: externalSearch = '',
  setSearchTerm: externalSetSearch,
  showPressureForm: externalShowForm = false,
  setShowPressureForm: externalSetShowForm,
  newPressureRecord: externalNew = {},
  setNewPressureRecord: externalSetNew,
  employees = [],
  employeeSearchTerm: externalEmployeeSearch = '',
  setEmployeeSearchTerm: externalSetEmployeeSearch,
  showEmployeeDropdown: externalShowDropdown = false,
  setShowEmployeeDropdown: externalSetShowDropdown,
  addBloodPressureRecord: externalAdd,
  deletePressureRecord: externalDelete,
  styles: externalStyles = {},
  onRecordsUpdate,
}: PressaoModuleProps) {
  const [internalRecords, setInternalRecords] = useState<any[]>([]);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(externalSearch || '');
  const [showForm, setShowForm] = useState(externalShowForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lista'>(
    'dashboard'
  );
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState(
    externalEmployeeSearch || ''
  );
  const [showDropdown, setShowDropdown] = useState(externalShowDropdown);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeCargo: '',
    workFront: '',
    date: new Date().toISOString().split('T')[0],
    temperature: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
  });

  const updateFormField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ==================== CARREGAR REGISTROS ====================
  const carregarRegistros = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('pressao_arterial')
        .select('*')
        .order('date', { ascending: false });

      if (supabaseError) throw supabaseError;

      setInternalRecords(data || []);
      setFiltrados(data || []);
      if (onRecordsUpdate) onRecordsUpdate(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      setError('Erro ao carregar registros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalRecords.length > 0) {
      setInternalRecords(externalRecords);
      setFiltrados(
        externalFiltered.length > 0 ? externalFiltered : externalRecords
      );
      setLoading(false);
    } else {
      carregarRegistros();
    }
  }, [externalRecords, externalFiltered]);

  // ==================== FILTROS ====================
  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      setFiltrados(
        internalRecords.filter(
          (r) =>
            r.employeeName?.toLowerCase().includes(lower) ||
            r.workFront?.toLowerCase().includes(lower)
        )
      );
    } else {
      setFiltrados(internalRecords);
    }
  }, [searchTerm, internalRecords]);

  // ==================== FUNÇÕES AUXILIARES ====================
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const classificarPressao = (systolic: number, diastolic: number) => {
    if (!systolic || !diastolic)
      return {
        text: 'Não informado',
        color: '#6b7280',
        bg: '#f3f4f6',
        icon: 'fa-circle',
      };
    if (systolic < 120 && diastolic < 80)
      return {
        text: 'Ótima',
        color: '#059669',
        bg: '#e8f5e9',
        icon: 'fa-check-circle',
      };
    if (systolic < 130 && diastolic < 85)
      return {
        text: 'Normal',
        color: '#2563eb',
        bg: '#e3f2fd',
        icon: 'fa-circle',
      };
    if (systolic < 140 && diastolic < 90)
      return {
        text: 'Limítrofe',
        color: '#d97706',
        bg: '#fff3e0',
        icon: 'fa-exclamation-triangle',
      };
    if (systolic < 160 && diastolic < 100)
      return {
        text: 'Hipertensão 1',
        color: '#f97316',
        bg: '#ffedd5',
        icon: 'fa-exclamation-circle',
      };
    if (systolic < 180 && diastolic < 110)
      return {
        text: 'Hipertensão 2',
        color: '#dc2626',
        bg: '#fce4ec',
        icon: 'fa-times-circle',
      };
    return {
      text: 'Hipertensão 3',
      color: '#b91c1c',
      bg: '#fecaca',
      icon: 'fa-skull-crossbones',
    };
  };

  // ==================== CRUD ====================
  const addBloodPressureRecord = async () => {
    if (!formData.employeeId) {
      setError('Selecione um colaborador');
      return;
    }
    if (!formData.systolic || !formData.diastolic) {
      setError('Preencha os valores de pressão arterial');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const registro = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        employeeCargo: formData.employeeCargo || '',
        workFront: formData.workFront || '',
        date: formData.date,
        temperature: parseFloat(formData.temperature) || 0,
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        heartRate: parseInt(formData.heartRate) || 0,
      };

      const { data, error: insertError } = await supabase
        .from('pressao_arterial')
        .insert([registro])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        const novos = [data[0], ...internalRecords];
        setInternalRecords(novos);
        setFiltrados(novos);
        if (onRecordsUpdate) onRecordsUpdate(novos);
        if (externalAdd) externalAdd();
      }

      setSuccessMessage('Medição registrada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowForm(false);
      if (externalSetShowForm) externalSetShowForm(false);
      setFormData({
        employeeId: '',
        employeeName: '',
        employeeCargo: '',
        workFront: '',
        date: new Date().toISOString().split('T')[0],
        temperature: '',
        systolic: '',
        diastolic: '',
        heartRate: '',
      });
      setEmployeeSearchTerm('');
      if (externalSetEmployeeSearch) externalSetEmployeeSearch('');
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePressureRecord = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      const { error: deleteError } = await supabase
        .from('pressao_arterial')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      const novos = internalRecords.filter((r) => r.id !== id);
      setInternalRecords(novos);
      setFiltrados(novos);
      if (onRecordsUpdate) onRecordsUpdate(novos);
      if (externalDelete) externalDelete(id);

      setSuccessMessage('Registro excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    }
  };

  // ==================== ESTATÍSTICAS ====================
  const stats = useMemo(() => {
    const total = internalRecords.length;
    const ultimaSemana = internalRecords.filter((r) => {
      const dataRegistro = new Date(r.date);
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      return dataRegistro >= semanaAtras;
    }).length;

    const normal = internalRecords.filter((r) => {
      const c = classificarPressao(r.systolic, r.diastolic);
      return c.text === 'Ótima' || c.text === 'Normal';
    }).length;

    const hipertensos = internalRecords.filter((r) => {
      const c = classificarPressao(r.systolic, r.diastolic);
      return c.text.includes('Hipertensão');
    }).length;

    const mediaSistolica = total
      ? (
          internalRecords.reduce((s, r) => s + (r.systolic || 0), 0) / total
        ).toFixed(0)
      : 0;
    const mediaDiastolica = total
      ? (
          internalRecords.reduce((s, r) => s + (r.diastolic || 0), 0) / total
        ).toFixed(0)
      : 0;
    const maxSistolica = total
      ? Math.max(...internalRecords.map((r) => r.systolic || 0))
      : 0;
    const minSistolica = total
      ? Math.min(...internalRecords.map((r) => r.systolic || 0))
      : 0;

    // 🔥 CORREÇÃO: Dias da semana começando de SEGUNDA (0) a DOMINGO (6)
    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    // 🔥 CORREÇÃO: Calcular os dias baseado nos registros reais
    const dadosSemana = diasSemana.map((_, idx) => {
      // idx 0 = Segunda, idx 6 = Domingo
      // Calcular a data: hoje - (6 - idx) dias
      const hoje = new Date();
      const data = new Date(hoje);
      data.setDate(data.getDate() - (6 - idx));

      // Formatar data para comparação (YYYY-MM-DD)
      const diaStr = data.toISOString().split('T')[0];

      // Buscar registros deste dia
      const registrosDia = internalRecords.filter((r) => {
        return r.date === diaStr;
      });

      // Calcular médias
      let sistolicaMedia = 0;
      let diastolicaMedia = 0;
      let count = registrosDia.length;

      if (count > 0) {
        sistolicaMedia =
          registrosDia.reduce((s, r) => s + (r.systolic || 0), 0) / count;
        diastolicaMedia =
          registrosDia.reduce((s, r) => s + (r.diastolic || 0), 0) / count;
      }

      return {
        dia: diasSemana[idx],
        sistolica: sistolicaMedia,
        diastolica: diastolicaMedia,
        count: count,
        data: diaStr,
      };
    });

    return {
      total,
      ultimaSemana,
      normal,
      hipertensos,
      mediaSistolica,
      mediaDiastolica,
      maxSistolica,
      minSistolica,
      dadosSemana,
    };
  }, [internalRecords]);

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

  const buttonPrimaryStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    boxShadow: `0 4px 15px ${accentGlow}`,
    transition: 'all 0.3s ease',
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const statCardStyle = (bgGradient: string): React.CSSProperties => ({
    background: bgGradient,
    borderRadius: '16px',
    padding: '20px',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  });

  const statNumberStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    marginBottom: '4px',
    letterSpacing: '-0.5px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    opacity: 0.9,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: `2px solid ${cardBorder}`,
    flexWrap: 'wrap',
    paddingBottom: '0',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? 700 : 600,
    color: active ? accentColor : textSecondary,
    borderBottom: active ? `3px solid ${accentColor}` : '3px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const searchBarStyle: React.CSSProperties = {
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

  const tableWrapperStyle: React.CSSProperties = {
    overflowX: 'auto',
    background: bgCard,
    borderRadius: '16px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '900px',
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
    padding: '12px 16px',
    borderBottom: `1px solid ${cardBorder}`,
    fontSize: '13px',
    color: textSecondary,
  };

  const formCardStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  };

  const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const formLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const formInputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
    width: '100%',
  };

  const formButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: `1px solid ${cardBorder}`,
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: textSecondary,
    transition: 'all 0.2s ease',
  };

  const saveBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    boxShadow: `0 4px 15px ${accentGlow}`,
    transition: 'all 0.3s ease',
  };

  const deleteBtnStyle: React.CSSProperties = {
    background: 'rgba(220, 38, 38, 0.08)',
    color: '#dc2626',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  };

  const dashboardCardStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const dashboardTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: textPrimary,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px',
    color: textSecondary,
  };

  const resultsCountStyle: React.CSSProperties = {
    fontSize: '13px',
    color: textSecondary,
    fontWeight: 500,
  };

  const employeeDropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: bgCard,
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    marginTop: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    border: `1px solid ${cardBorder}`,
  };

  const employeeDropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: `1px solid ${cardBorder}`,
    transition: 'background 0.2s ease',
  };

  const employeeSearchContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const employeeSearchBoxStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const employeeSearchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: textSecondary,
    fontSize: '14px',
  };

  const employeeSearchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px 10px 42px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
  };

  const chartContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '180px',
    gap: '12px',
    paddingTop: '20px',
  };

  const chartBarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    gap: '8px',
  };

  const chartBarFillStyle = (
    height: number,
    color: string
  ): React.CSSProperties => ({
    width: '20px',
    height: `${height}px`,
    borderRadius: '6px 6px 2px 2px',
    background: color,
    transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    minHeight: '4px',
  });

  const indicatorGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '16px',
  };

  const indicatorItemStyle: React.CSSProperties = {
    padding: '16px',
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    border: `1px solid ${cardBorder}`,
    textAlign: 'center',
  };

  const StatCard = ({ icon, value, label, gradient }: any) => (
    <div style={statCardStyle(gradient)}>
      <i
        className={`fas ${icon}`}
        style={{ fontSize: '24px', opacity: 0.9 }}
      ></i>
      <div style={statNumberStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ marginTop: '16px', color: textSecondary }}>
          Carregando medições...
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
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
              className="fas fa-heartbeat"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Pressão Arterial
          </h1>
          <p style={subtitleStyle}>
            <i className="fas fa-heart" style={{ marginRight: '6px' }}></i>
            Monitoramento inteligente de saúde cardiovascular
          </p>
        </div>
        <button
          style={buttonPrimaryStyle}
          onClick={() => {
            setShowForm(!showForm);
            if (externalSetShowForm) externalSetShowForm(!showForm);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
          }}
        >
          <i className="fas fa-plus-circle"></i> Nova Medição
        </button>
      </div>

      {/* STATS */}
      <div style={statsGridStyle}>
        <StatCard
          icon="fa-chart-line"
          value={stats.total}
          label="Total de Medições"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <StatCard
          icon="fa-calendar-week"
          value={stats.ultimaSemana}
          label="Últimos 7 dias"
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        />
        <StatCard
          icon="fa-check-circle"
          value={stats.normal}
          label="Pressão Normal"
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
        <StatCard
          icon="fa-exclamation-triangle"
          value={stats.hipertensos}
          label="Com Hipertensão"
          gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
        />
      </div>

      {/* TABS */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'dashboard')}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fas fa-chart-pie"></i> Dashboard
        </button>
        <button
          style={tabStyle(activeTab === 'lista')}
          onClick={() => setActiveTab('lista')}
        >
          <i className="fas fa-table"></i> Lista de Registros
        </button>
      </div>

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={dashboardCardStyle}>
            <h3 style={dashboardTitleStyle}>
              <i
                className="fas fa-chart-line"
                style={{ color: accentColor }}
              ></i>
              Indicadores de Pressão
            </h3>
            <div style={indicatorGridStyle}>
              <div style={indicatorItemStyle}>
                <div
                  style={{
                    fontSize: '12px',
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Média Sistólica
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: dangerColor,
                  }}
                >
                  {stats.mediaSistolica} mmHg
                </div>
              </div>
              <div style={indicatorItemStyle}>
                <div
                  style={{
                    fontSize: '12px',
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Média Diastólica
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: infoColor,
                  }}
                >
                  {stats.mediaDiastolica} mmHg
                </div>
              </div>
              <div style={indicatorItemStyle}>
                <div
                  style={{
                    fontSize: '12px',
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Máxima Sistólica
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#dc2626',
                  }}
                >
                  {stats.maxSistolica} mmHg
                </div>
              </div>
              <div style={indicatorItemStyle}>
                <div
                  style={{
                    fontSize: '12px',
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Mínima Sistólica
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: accentColor,
                  }}
                >
                  {stats.minSistolica} mmHg
                </div>
              </div>
            </div>
          </div>

          <div style={dashboardCardStyle}>
            <h3 style={dashboardTitleStyle}>
              <i
                className="fas fa-chart-bar"
                style={{ color: accentColor }}
              ></i>
              Evolução da Pressão (Últimos 7 dias)
            </h3>
            <div style={chartContainerStyle}>
              {stats.dadosSemana.map((dia, idx) => {
                const maxValor = Math.max(
                  ...stats.dadosSemana.map((d) =>
                    Math.max(d.sistolica, d.diastolica)
                  ),
                  1
                );
                const alturaSistolica =
                  dia.sistolica > 0 ? (dia.sistolica / maxValor) * 140 : 4;
                const alturaDiastolica =
                  dia.diastolica > 0 ? (dia.diastolica / maxValor) * 140 : 4;
                const hasData = dia.count > 0;

                return (
                  <div key={idx} style={chartBarStyle}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'flex-end',
                        height: '150px',
                      }}
                    >
                      <div
                        style={chartBarFillStyle(
                          alturaDiastolica,
                          'linear-gradient(180deg, #3b82f6, #2563eb)'
                        )}
                      >
                        {dia.diastolica > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-18px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '8px',
                              fontWeight: 600,
                              color: '#3b82f6',
                            }}
                          >
                            {Math.round(dia.diastolica)}
                          </span>
                        )}
                      </div>
                      <div
                        style={chartBarFillStyle(
                          alturaSistolica,
                          'linear-gradient(180deg, #ef4444, #dc2626)'
                        )}
                      >
                        {dia.sistolica > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-18px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              fontSize: '8px',
                              fontWeight: 600,
                              color: '#ef4444',
                            }}
                          >
                            {Math.round(dia.sistolica)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: textSecondary,
                        fontWeight: 600,
                      }}
                    >
                      {dia.dia}
                      {hasData && (
                        <span style={{ color: accentColor, marginLeft: '4px' }}>
                          ●
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '8px', color: textSecondary }}>
                      ({dia.count})
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '16px',
                fontSize: '12px',
              }}
            >
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#ef4444',
                    borderRadius: '4px',
                    marginRight: '6px',
                  }}
                ></span>
                Sistólica
              </span>
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    background: '#3b82f6',
                    borderRadius: '4px',
                    marginRight: '6px',
                  }}
                ></span>
                Diastólica
              </span>
            </div>
          </div>

          <div style={dashboardCardStyle}>
            <h3 style={dashboardTitleStyle}>
              <i
                className="fas fa-pie-chart"
                style={{ color: accentColor }}
              ></i>
              Distribuição por Classificação
            </h3>
            {[
              'Ótima',
              'Normal',
              'Limítrofe',
              'Hipertensão 1',
              'Hipertensão 2',
              'Hipertensão 3',
            ].map((cat) => {
              const count = internalRecords.filter(
                (r) => classificarPressao(r.systolic, r.diastolic).text === cat
              ).length;
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
              if (count === 0) return null;
              const colors: Record<string, string> = {
                Ótima: '#059669',
                Normal: '#2563eb',
                Limítrofe: '#d97706',
                'Hipertensão 1': '#f97316',
                'Hipertensão 2': '#dc2626',
                'Hipertensão 3': '#b91c1c',
              };
              return (
                <div key={cat} style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: textSecondary }}>
                      {cat}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: textPrimary,
                      }}
                    >
                      {count} ({percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      background: '#f0ebe6',
                      borderRadius: '8px',
                      height: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: colors[cat],
                        borderRadius: '8px',
                        transition: 'width 0.6s ease',
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {stats.total === 0 && (
              <div style={emptyStateStyle}>
                <i
                  className="fas fa-chart-bar"
                  style={{
                    fontSize: '48px',
                    marginBottom: '12px',
                    opacity: 0.3,
                  }}
                ></i>
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORMULÁRIO */}
      {showForm && (
        <div style={formCardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${cardBorder}`,
            }}
          >
            <i
              className="fas fa-stethoscope"
              style={{ fontSize: '20px', color: accentColor }}
            ></i>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
              }}
            >
              Registrar Nova Medição
            </h3>
          </div>

          <div style={formGridStyle}>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-calendar-alt"></i> Data da Medição
              </label>
              <input
                type="date"
                style={formInputStyle}
                value={formData.date}
                onChange={(e) => updateFormField('date', e.target.value)}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-building"></i> Frente de Serviço
              </label>
              <input
                type="text"
                style={formInputStyle}
                placeholder="Ex: FSPO TAMANDARÉ"
                value={formData.workFront}
                onChange={(e) => updateFormField('workFront', e.target.value)}
              />
            </div>

            <div style={{ ...formGroupStyle, gridColumn: 'span 2' }}>
              <label style={formLabelStyle}>
                <i className="fas fa-user"></i> Colaborador *
              </label>
              <div style={employeeSearchContainerStyle}>
                <div style={employeeSearchBoxStyle}>
                  <i
                    className="fas fa-search"
                    style={employeeSearchIconStyle}
                  ></i>
                  <input
                    type="text"
                    style={employeeSearchInputStyle}
                    placeholder="Digite o nome do colaborador..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      setShowDropdown(true);
                      if (externalSetEmployeeSearch)
                        externalSetEmployeeSearch(e.target.value);
                      if (externalSetShowDropdown)
                        externalSetShowDropdown(true);
                    }}
                    onFocus={() => {
                      setShowDropdown(true);
                      if (externalSetShowDropdown)
                        externalSetShowDropdown(true);
                    }}
                  />
                  {employeeSearchTerm && (
                    <button
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: textSecondary,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setEmployeeSearchTerm('');
                        updateFormField('employeeId', '');
                        updateFormField('employeeName', '');
                        updateFormField('employeeCargo', '');
                        if (externalSetEmployeeSearch)
                          externalSetEmployeeSearch('');
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>

                {showDropdown && employeeSearchTerm && (
                  <div style={employeeDropdownStyle}>
                    {employees.filter((e) =>
                      (e.nome || e.name)
                        ?.toLowerCase()
                        .includes(employeeSearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <div
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: textSecondary,
                        }}
                      >
                        <i className="fas fa-user-slash"></i> Nenhum colaborador
                        encontrado
                      </div>
                    ) : (
                      employees
                        .filter((e) =>
                          (e.nome || e.name)
                            ?.toLowerCase()
                            .includes(employeeSearchTerm.toLowerCase())
                        )
                        .map((emp) => {
                          const nome = emp.nome || emp.name;
                          const cargo = emp.cargo || '';
                          const codigo = emp.codigo || '';
                          return (
                            <div
                              key={emp.id}
                              style={employeeDropdownItemStyle}
                              onClick={() => {
                                updateFormField('employeeId', emp.id);
                                updateFormField('employeeName', nome);
                                updateFormField('employeeCargo', cargo);
                                setEmployeeSearchTerm(nome);
                                setShowDropdown(false);
                                if (externalSetEmployeeSearch)
                                  externalSetEmployeeSearch(nome);
                                if (externalSetShowDropdown)
                                  externalSetShowDropdown(false);
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  'rgba(0,0,0,0.02)')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  'transparent')
                              }
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: textPrimary,
                                  }}
                                >
                                  {nome}
                                </div>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: textSecondary,
                                  }}
                                >
                                  {cargo} - Cód: {codigo}
                                </div>
                              </div>
                              <i
                                className="fas fa-chevron-right"
                                style={{ color: accentColor, fontSize: '14px' }}
                              ></i>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-thermometer-half"></i> Temperatura (°C)
              </label>
              <input
                type="number"
                step="0.1"
                style={formInputStyle}
                placeholder="36.5"
                value={formData.temperature}
                onChange={(e) => updateFormField('temperature', e.target.value)}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-arrow-up"></i> Pressão Sistólica *
              </label>
              <input
                type="number"
                style={formInputStyle}
                placeholder="120"
                value={formData.systolic}
                onChange={(e) => updateFormField('systolic', e.target.value)}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-arrow-down"></i> Pressão Diastólica *
              </label>
              <input
                type="number"
                style={formInputStyle}
                placeholder="80"
                value={formData.diastolic}
                onChange={(e) => updateFormField('diastolic', e.target.value)}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-heart"></i> Frequência Cardíaca (bpm)
              </label>
              <input
                type="number"
                style={formInputStyle}
                placeholder="72"
                value={formData.heartRate}
                onChange={(e) => updateFormField('heartRate', e.target.value)}
              />
            </div>
          </div>

          <div style={formButtonsStyle}>
            <button
              style={cancelBtnStyle}
              onClick={() => {
                setShowForm(false);
                if (externalSetShowForm) externalSetShowForm(false);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
            <button
              style={saveBtnStyle}
              onClick={addBloodPressureRecord}
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
                  <i className="fas fa-save"></i> Salvar Medição
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE REGISTROS */}
      {activeTab === 'lista' && (
        <>
          <div style={searchBarStyle}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
              <i
                className="fas fa-search"
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: textSecondary,
                }}
              ></i>
              <input
                type="text"
                style={{ ...searchInputStyle, paddingLeft: '44px' }}
                placeholder="Buscar por colaborador ou frente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (externalSetSearch) externalSetSearch(e.target.value);
                }}
              />
              {searchTerm && (
                <button
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: textSecondary,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSearchTerm('');
                    if (externalSetSearch) externalSetSearch('');
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
            <div style={resultsCountStyle}>
              {filtrados.length} registro(s) encontrado(s)
            </div>
          </div>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>
                    <i className="fas fa-calendar-alt"></i> Data
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-building"></i> Frente
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-user"></i> Colaborador
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-briefcase"></i> Cargo
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-thermometer-half"></i> Temp.
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-heart"></i> Pressão
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-heartbeat"></i> FC
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-tag"></i> Classificação
                  </th>
                  <th style={thStyle}>
                    <i className="fas fa-cog"></i> Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
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
                        className="fas fa-inbox"
                        style={{
                          fontSize: '24px',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      ></i>
                      {searchTerm
                        ? 'Nenhum registro encontrado para esta busca.'
                        : 'Nenhum registro de pressão arterial. Clique em "Nova Medição" para adicionar.'}
                    </td>
                  </tr>
                ) : (
                  filtrados.map((record) => {
                    const classificacao = classificarPressao(
                      record.systolic,
                      record.diastolic
                    );
                    return (
                      <tr key={record.id}>
                        <td style={tdStyle}>{formatDate(record.date)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#059669',
                            }}
                          >
                            {record.workFront || '-'}
                          </span>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                            color: textPrimary,
                          }}
                        >
                          {record.employeeName}
                        </td>
                        <td style={tdStyle}>{record.employeeCargo || '-'}</td>
                        <td style={tdStyle}>
                          {record.temperature > 0
                            ? `${record.temperature}°C`
                            : '-'}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                            color: textPrimary,
                          }}
                        >
                          {record.systolic}×{record.diastolic}
                        </td>
                        <td style={tdStyle}>
                          {record.heartRate > 0
                            ? `${record.heartRate} bpm`
                            : '-'}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              background: classificacao.bg,
                              color: classificacao.color,
                              fontWeight: 600,
                            }}
                          >
                            <i
                              className={`fas ${classificacao.icon}`}
                              style={{ marginRight: '4px' }}
                            ></i>
                            {classificacao.text}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            style={deleteBtnStyle}
                            onClick={() => deletePressureRecord(record.id)}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                'rgba(220, 38, 38, 0.2)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                'rgba(220, 38, 38, 0.08)')
                            }
                          >
                            <i className="fas fa-trash-alt"></i>
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
    </div>
  );
}
