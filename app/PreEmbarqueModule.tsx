// app/PreEmbarqueModule.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PreEmbarqueRecord {
  id: string;
  codigo: string;
  nome: string;
  cargo: string;
  dataExame: string;
  mesReferencia: string;
  peso: number;
  altura: number;
  circunferencia: number;
  frenteServico: string;
  status: string;
  imc?: number;
}

interface PreEmbarqueModuleProps {
  preEmbarqueRecords?: PreEmbarqueRecord[];
  setPreEmbarqueRecords?: (value: any) => void;
  showPreEmbarqueForm?: boolean;
  setShowPreEmbarqueForm?: (value: boolean) => void;
  multipleEmployees?: boolean;
  setMultipleEmployees?: (value: boolean) => void;
  preEmbarqueList?: any[];
  setPreEmbarqueList?: (value: any) => void;
  newPreEmbarque?: any;
  setNewPreEmbarque?: (value: any) => void;
  addPreEmbarqueRecord?: () => void;
  confirmAllPreEmbarque?: () => void;
  removeFromTempList?: (id: string) => void;
  deletePreEmbarqueRecord?: (id: string) => void;
  calculateBMI?: (weight: number, height: number) => number;
  getPreEmbarqueStatus?: (bmi: number) => string;
  styles?: any;
  employees?: any[];
}

// Cores consistentes
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

export default function PreEmbarqueModule({
  preEmbarqueRecords: externalRecords = [],
  setPreEmbarqueRecords: externalSetRecords,
  showPreEmbarqueForm: externalShowForm = false,
  setShowPreEmbarqueForm: externalSetShowForm,
  multipleEmployees: externalMultiple = false,
  setMultipleEmployees: externalSetMultiple,
  preEmbarqueList: externalList = [],
  setPreEmbarqueList: externalSetList,
  deletePreEmbarqueRecord: externalDelete,
  styles: externalStyles = {},
  employees = [],
}: PreEmbarqueModuleProps) {
  const [internalRecords, setInternalRecords] = useState<PreEmbarqueRecord[]>(
    []
  );
  const [filtrados, setFiltrados] = useState<PreEmbarqueRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lista' | 'form'>(
    'dashboard'
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(externalShowForm);
  const [multipleMode, setMultipleMode] = useState(externalMultiple);
  const [tempList, setTempList] = useState<any[]>(externalList);
  const [loaded, setLoaded] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    cargo: '',
    dataExame: new Date().toISOString().split('T')[0],
    frenteServico: '',
    peso: '',
    altura: '',
    circunferencia: '',
  });

  // Funções
  const calcularIMC = (peso: number, altura: number): number => {
    if (!peso || !altura) return 0;
    let alt = altura;
    if (alt > 3) alt = alt / 100;
    return peso / (alt * alt);
  };

  const getStatusPorIMC = (imc: number): string => {
    if (imc === 0) return 'Pendente';
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade grau I';
    if (imc < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Normal':
        return '#059669';
      case 'Sobrepeso':
        return '#d97706';
      case 'Obesidade grau I':
        return '#f97316';
      case 'Obesidade grau II':
        return '#dc2626';
      case 'Obesidade grau III':
        return '#b91c1c';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status: string): string => {
    switch (status) {
      case 'Normal':
        return '#e8f5e9';
      case 'Sobrepeso':
        return '#fff3e0';
      case 'Obesidade grau I':
        return '#ffedd5';
      case 'Obesidade grau II':
        return '#fce4ec';
      case 'Obesidade grau III':
        return '#fecaca';
      default:
        return '#f3f4f6';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'Normal':
        return 'fa-check-circle';
      case 'Sobrepeso':
        return 'fa-exclamation-triangle';
      case 'Obesidade grau I':
        return 'fa-exclamation-circle';
      case 'Obesidade grau II':
        return 'fa-times-circle';
      case 'Obesidade grau III':
        return 'fa-skull-crossbones';
      default:
        return 'fa-circle';
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Carregar registros - UMA VEZ SÓ
  const carregarRegistros = async () => {
    // Se já carregou ou tem dados externos, não carrega de novo
    if (loaded || externalRecords.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('pre_embarque')
        .select('*')
        .order('dataExame', { ascending: false });

      if (supabaseError) {
        console.error('Erro ao carregar:', supabaseError);
        setError('Erro ao carregar registros.');
        setLoading(false);
        setLoaded(true);
        return;
      }

      const comImc = (data || []).map((r: any) => {
        const imc = calcularIMC(r.peso, r.altura);
        return { ...r, imc, status: getStatusPorIMC(imc) };
      });

      setInternalRecords(comImc);
      setFiltrados(comImc);
      if (externalSetRecords) externalSetRecords(comImc);
      setLoaded(true);
    } catch (error) {
      console.error('Erro:', error);
      setError('Erro ao carregar registros.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar APENAS quando o componente montar ou quando externalRecords mudar explicitamente
  useEffect(() => {
    if (externalRecords.length > 0) {
      const comImc = externalRecords.map((r: any) => ({
        ...r,
        imc: calcularIMC(r.peso, r.altura),
        status: getStatusPorIMC(calcularIMC(r.peso, r.altura)),
      }));
      setInternalRecords(comImc);
      setFiltrados(comImc);
      setLoading(false);
      setLoaded(true);
    } else if (!loaded) {
      carregarRegistros();
    }
  }, [externalRecords.length]); // Só executa quando o tamanho muda

  // Filtrar
  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      setFiltrados(
        internalRecords.filter(
          (r) =>
            r.nome.toLowerCase().includes(lower) ||
            r.codigo.includes(lower) ||
            r.frenteServico.toLowerCase().includes(lower)
        )
      );
    } else {
      setFiltrados(internalRecords);
    }
  }, [searchTerm, internalRecords]);

  // Salvar
  const salvarRegistroUnico = async () => {
    if (
      !formData.codigo ||
      !formData.nome ||
      !formData.peso ||
      !formData.altura
    ) {
      setError('Preencha código, nome, peso e altura.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        codigo: formData.codigo,
        nome: formData.nome,
        cargo: formData.cargo,
        dataExame: formData.dataExame,
        frenteServico: formData.frenteServico,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        circunferencia: parseFloat(formData.circunferencia) || 0,
      };

      const { data, error: insertError } = await supabase
        .from('pre_embarque')
        .insert([payload])
        .select();
      if (insertError) throw insertError;

      if (data) {
        const imc = calcularIMC(payload.peso, payload.altura);
        const novo = { ...data[0], imc, status: getStatusPorIMC(imc) };
        const novosRegistros = [novo, ...internalRecords];
        setInternalRecords(novosRegistros);
        setFiltrados(novosRegistros);
        if (externalSetRecords) externalSetRecords(novosRegistros);
      }

      setSuccessMessage('Registro salvo com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);

      setFormData({
        codigo: '',
        nome: '',
        cargo: '',
        dataExame: new Date().toISOString().split('T')[0],
        frenteServico: '',
        peso: '',
        altura: '',
        circunferencia: '',
      });
      setShowForm(false);
      if (externalSetShowForm) externalSetShowForm(false);
    } catch (error: any) {
      setError('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmarMultiplos = async () => {
    if (tempList.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const registrosParaInserir = tempList.map((item) => ({
        codigo: item.codigo,
        nome: item.nome,
        cargo: item.cargo,
        dataExame: formData.dataExame,
        frenteServico: formData.frenteServico,
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        circunferencia: parseFloat(formData.circunferencia) || 0,
      }));

      const { data, error: insertError } = await supabase
        .from('pre_embarque')
        .insert(registrosParaInserir)
        .select();
      if (insertError) throw insertError;

      const novosRegistros = data.map((r: any) => {
        const imc = calcularIMC(r.peso, r.altura);
        return { ...r, imc, status: getStatusPorIMC(imc) };
      });

      const allRecords = [...novosRegistros, ...internalRecords];
      setInternalRecords(allRecords);
      setFiltrados(allRecords);
      if (externalSetRecords) externalSetRecords(allRecords);

      setSuccessMessage('Todos os registros foram salvos!');
      setTimeout(() => setSuccessMessage(null), 3000);

      setTempList([]);
      if (externalSetList) externalSetList([]);
      setShowForm(false);
      if (externalSetShowForm) externalSetShowForm(false);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const excluirRegistro = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    try {
      const { error: deleteError } = await supabase
        .from('pre_embarque')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;

      const novos = internalRecords.filter((r) => r.id !== id);
      setInternalRecords(novos);
      setFiltrados(novos);
      if (externalSetRecords) externalSetRecords(novos);
      if (externalDelete) externalDelete(id);

      setSuccessMessage('Registro excluído!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    }
  };

  const exportarExcel = () => {
    if (filtrados.length === 0) {
      setError('Não há registros para exportar.');
      return;
    }
    const dados = filtrados.map((r) => ({
      Código: r.codigo,
      Nome: r.nome,
      Cargo: r.cargo,
      Data: r.dataExame,
      'Frente Serviço': r.frenteServico,
      Peso: r.peso,
      Altura: r.altura,
      IMC: r.imc?.toFixed(1) || '-',
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PreEmbarque');
    XLSX.writeFile(
      wb,
      `pre_embarque_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    setSuccessMessage('Excel exportado!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const exportarPDF = () => {
    if (filtrados.length === 0) {
      setError('Não há registros para exportar.');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text('Relatório de Pré-Embarque', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);
    doc.text(`Total: ${filtrados.length} registros`, 14, 32);

    autoTable(doc, {
      head: [
        [
          'Código',
          'Nome',
          'Cargo',
          'Data',
          'Frente',
          'Peso',
          'Altura',
          'IMC',
          'Status',
        ],
      ],
      body: filtrados.map((r) => [
        r.codigo,
        r.nome,
        r.cargo,
        r.dataExame,
        r.frenteServico,
        r.peso,
        r.altura,
        r.imc?.toFixed(1) || '-',
        r.status,
      ]),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });
    doc.save(`pre_embarque_${new Date().toISOString().split('T')[0]}.pdf`);
    setSuccessMessage('PDF exportado!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const stats = useMemo(() => {
    const total = internalRecords.length;
    const normal = internalRecords.filter((r) => r.status === 'Normal').length;
    const sobrepeso = internalRecords.filter(
      (r) => r.status === 'Sobrepeso'
    ).length;
    const obesidade = internalRecords.filter((r) =>
      r.status.includes('Obesidade')
    ).length;
    const imcMedio = total
      ? (internalRecords.reduce((s, r) => s + (r.imc || 0), 0) / total).toFixed(
          1
        )
      : 0;
    return { total, normal, sobrepeso, obesidade, imcMedio };
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

  const statCardStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  };

  const statNumberStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: textPrimary,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    borderBottom: `2px solid ${cardBorder}`,
    flexWrap: 'wrap',
    paddingBottom: '0',
  };

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
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

  const exportBtnStyle = (color: string): React.CSSProperties => ({
    padding: '10px 16px',
    borderRadius: '10px',
    border: `1px solid ${color}`,
    background: 'transparent',
    color: color,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  });

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: textSecondary,
  };

  const StatCard = ({ icon, value, label, bgColor, color }: any) => (
    <div
      style={statCardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          background: bgColor,
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          minWidth: '56px',
          minHeight: '56px',
          color: color,
        }}
      >
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <div style={statNumberStyle}>{value}</div>
        <div
          style={{ fontSize: '12px', color: textSecondary, fontWeight: 600 }}
        >
          {label}
        </div>
      </div>
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
          Carregando registros...
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

      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <i
              className="fas fa-ship"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Pré-Embarque
          </h1>
          <p style={subtitleStyle}>
            <i
              className="fas fa-notes-medical"
              style={{ marginRight: '6px' }}
            ></i>
            Registro de exames admissionais e periódicos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            <i className="fas fa-plus-circle"></i>
            Novo Registro
          </button>
        </div>
      </div>

      <div style={statsGridStyle}>
        <StatCard
          icon="fa-file-medical"
          value={stats.total}
          label="TOTAL DE REGISTROS"
          bgColor="#e6f3f9"
          color="#2c7da0"
        />
        <StatCard
          icon="fa-check-circle"
          value={stats.normal}
          label="IMC NORMAL"
          bgColor="#e8f5e9"
          color="#059669"
        />
        <StatCard
          icon="fa-exclamation-triangle"
          value={stats.sobrepeso}
          label="SOBREPESO"
          bgColor="#fff3e0"
          color="#d97706"
        />
        <StatCard
          icon="fa-times-circle"
          value={stats.obesidade}
          label="OBESIDADE"
          bgColor="#fce4ec"
          color="#dc2626"
        />
      </div>

      <div style={tabsStyle}>
        <button
          style={tabButtonStyle(activeTab === 'dashboard')}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="fas fa-chart-pie"></i> Dashboard
        </button>
        <button
          style={tabButtonStyle(activeTab === 'lista')}
          onClick={() => setActiveTab('lista')}
        >
          <i className="fas fa-table"></i> Lista de Registros
        </button>
        <button
          style={tabButtonStyle(activeTab === 'form')}
          onClick={() => setActiveTab('form')}
        >
          <i className="fas fa-plus-circle"></i> Novo Registro
        </button>
      </div>

      {activeTab === 'lista' && (
        <>
          <div style={searchBarStyle}>
            <input
              type="text"
              placeholder="🔍 Buscar por nome, código ou frente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={searchInputStyle}
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
              <button onClick={exportarExcel} style={exportBtnStyle('#059669')}>
                <i className="fas fa-file-excel"></i> Excel
              </button>
              <button onClick={exportarPDF} style={exportBtnStyle('#dc2626')}>
                <i className="fas fa-file-pdf"></i> PDF
              </button>
            </div>
          </div>

          <div style={tableWrapperStyle}>
            {filtrados.length === 0 ? (
              <div style={emptyStateStyle}>
                <i
                  className="fas fa-inbox"
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                ></i>
                <p>Nenhum registro encontrado</p>
                <button
                  style={{ ...buttonPrimaryStyle, marginTop: '16px' }}
                  onClick={() => setActiveTab('form')}
                >
                  <i className="fas fa-plus-circle"></i> Adicionar primeiro
                  registro
                </button>
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>
                      <i className="fas fa-id-badge"></i> Código
                    </th>
                    <th style={thStyle}>
                      <i className="fas fa-user"></i> Nome
                    </th>
                    <th style={thStyle}>
                      <i className="fas fa-briefcase"></i> Cargo
                    </th>
                    <th style={thStyle}>
                      <i className="fas fa-calendar-alt"></i> Data
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
                      <i className="fas fa-tag"></i> Status
                    </th>
                    <th style={thStyle}>
                      <i className="fas fa-cog"></i> Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((record) => {
                    const statusColor = getStatusColor(record.status);
                    const statusBg = getStatusBg(record.status);
                    const statusIcon = getStatusIcon(record.status);
                    return (
                      <tr key={record.id}>
                        <td style={tdStyle}>{record.codigo}</td>
                        <td style={tdStyle}>
                          <strong style={{ color: textPrimary }}>
                            {record.nome}
                          </strong>
                        </td>
                        <td style={tdStyle}>{record.cargo || '-'}</td>
                        <td style={tdStyle}>{formatDate(record.dataExame)}</td>
                        <td style={tdStyle}>{record.peso} kg</td>
                        <td style={tdStyle}>{record.altura} m</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: record.imc > 25 ? '#dc2626' : accentColor,
                            }}
                          >
                            {record.imc?.toFixed(1) || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: statusBg,
                              color: statusColor,
                            }}
                          >
                            <i className={`fas ${statusIcon}`}></i>
                            {record.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => excluirRegistro(record.id)}
                            style={{
                              background: 'rgba(220, 38, 38, 0.08)',
                              color: '#dc2626',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {(showForm || activeTab === 'form') && (
        <div style={formCardStyle}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: textPrimary,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i
              className="fas fa-file-medical"
              style={{ color: accentColor }}
            ></i>
            Novo Exame Pré-Embarque
          </h3>

          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${cardBorder}`,
            }}
          >
            <label style={formLabelStyle}>
              <i
                className="fas fa-users-cog"
                style={{ marginRight: '6px' }}
              ></i>
              Modo de Cadastro
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  setMultipleMode(false);
                  if (externalSetMultiple) externalSetMultiple(false);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: !multipleMode
                    ? `2px solid ${accentColor}`
                    : `1px solid ${cardBorder}`,
                  background: !multipleMode
                    ? `rgba(16, 185, 129, 0.08)`
                    : 'transparent',
                  color: !multipleMode ? accentColor : textSecondary,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <i className="fas fa-user"></i> Único
              </button>
              <button
                onClick={() => {
                  setMultipleMode(true);
                  if (externalSetMultiple) externalSetMultiple(true);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: multipleMode
                    ? `2px solid ${accentColor}`
                    : `1px solid ${cardBorder}`,
                  background: multipleMode
                    ? `rgba(16, 185, 129, 0.08)`
                    : 'transparent',
                  color: multipleMode ? accentColor : textSecondary,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <i className="fas fa-users"></i> Múltiplos
              </button>
            </div>
          </div>

          <div style={formGridStyle}>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-id-badge"></i> Código *
              </label>
              <input
                type="text"
                placeholder="Ex: 12345"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-user"></i> Nome Completo *
              </label>
              <input
                type="text"
                placeholder="Digite o nome completo"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-briefcase"></i> Cargo
              </label>
              <input
                type="text"
                placeholder="Ex: Mergulhador"
                value={formData.cargo}
                onChange={(e) =>
                  setFormData({ ...formData, cargo: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-calendar-alt"></i> Data do Exame *
              </label>
              <input
                type="date"
                value={formData.dataExame}
                onChange={(e) =>
                  setFormData({ ...formData, dataExame: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-weight"></i> Peso (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 75"
                value={formData.peso}
                onChange={(e) =>
                  setFormData({ ...formData, peso: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-ruler-vertical"></i> Altura (m) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 1.75"
                value={formData.altura}
                onChange={(e) =>
                  setFormData({ ...formData, altura: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-arrows-alt-h"></i> Circunferência (cm)
              </label>
              <input
                type="number"
                placeholder="Ex: 85"
                value={formData.circunferencia}
                onChange={(e) =>
                  setFormData({ ...formData, circunferencia: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>
                <i className="fas fa-building"></i> Frente de Serviço
              </label>
              <input
                type="text"
                placeholder="Ex: Offshore"
                value={formData.frenteServico}
                onChange={(e) =>
                  setFormData({ ...formData, frenteServico: e.target.value })
                }
                style={formInputStyle}
              />
            </div>
          </div>

          <div style={formButtonsStyle}>
            <button
              onClick={() => {
                setShowForm(false);
                if (externalSetShowForm) externalSetShowForm(false);
              }}
              style={cancelBtnStyle}
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
            <button
              onClick={multipleMode ? confirmarMultiplos : salvarRegistroUnico}
              disabled={saving}
              style={{
                ...saveBtnStyle,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Salvar
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
              Distribuição por IMC
            </h3>
            {internalRecords.length === 0 ? (
              <div style={emptyStateStyle}>
                <i
                  className="fas fa-chart-pie"
                  style={{
                    fontSize: '32px',
                    opacity: 0.3,
                    marginBottom: '12px',
                  }}
                ></i>
                <p>Nenhum dado disponível</p>
                <button
                  style={{
                    ...buttonPrimaryStyle,
                    marginTop: '12px',
                    fontSize: '12px',
                    padding: '8px 16px',
                  }}
                  onClick={() => setActiveTab('form')}
                >
                  <i className="fas fa-plus-circle"></i> Adicionar registro
                </button>
              </div>
            ) : (
              [
                'Normal',
                'Sobrepeso',
                'Obesidade grau I',
                'Obesidade grau II',
                'Obesidade grau III',
              ].map((cat) => {
                const count = internalRecords.filter(
                  (r) => r.status === cat
                ).length;
                const percent =
                  stats.total > 0 ? (count / stats.total) * 100 : 0;
                if (count === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: textSecondary }}>
                        <i
                          className={`fas ${getStatusIcon(cat)}`}
                          style={{
                            color: getStatusColor(cat),
                            marginRight: '6px',
                          }}
                        ></i>
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
                          background: getStatusColor(cat),
                          borderRadius: '8px',
                          transition: 'width 0.6s ease',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              background: bgCard,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
                className="fas fa-info-circle"
                style={{ color: accentColor }}
              ></i>
              Resumo
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: textSecondary }}>
                  <i
                    className="fas fa-calendar-alt"
                    style={{ color: accentColor, marginRight: '6px' }}
                  ></i>{' '}
                  Total de Registros
                </span>
                <span style={{ fontWeight: 700, color: textPrimary }}>
                  {stats.total}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: textSecondary }}>
                  <i
                    className="fas fa-chart-line"
                    style={{ color: accentColor, marginRight: '6px' }}
                  ></i>{' '}
                  IMC Médio
                </span>
                <span style={{ fontWeight: 700, color: textPrimary }}>
                  {stats.imcMedio || '0'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: textSecondary }}>
                  <i
                    className="fas fa-check-circle"
                    style={{ color: '#059669', marginRight: '6px' }}
                  ></i>{' '}
                  Colaboradores Normais
                </span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {stats.normal}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: textSecondary }}>
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ color: '#d97706', marginRight: '6px' }}
                  ></i>{' '}
                  Com Sobrepeso
                </span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>
                  {stats.sobrepeso}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ color: textSecondary }}>
                  <i
                    className="fas fa-times-circle"
                    style={{ color: '#dc2626', marginRight: '6px' }}
                  ></i>{' '}
                  Com Obesidade
                </span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>
                  {stats.obesidade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
