// app/CertificadosModule.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';

interface FrenteServico {
  id: number;
  nome: string;
}

interface Certificado {
  id: number;
  nome: string;
  tipo: string;
  data: string;
  url: string;
  frente_id: number;
}

interface Equipamento {
  id: number;
  nome: string;
  certificado_calibracao: string;
  certificado_url: string;
  data_calibragem: string;
  data_proxima_calibracao: string;
  status: string;
}

// Cores consistentes com os outros módulos
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

const tiposCertificado = [
  'Manômetro',
  'Válvula de Segurança',
  'Cilindro de Mergulho',
  'Compressor',
  'Detector de Gás',
  'EPI',
  'Equipamento de Emergência',
  'Outros',
];

export default function CertificadosModule() {
  const [frentes, setFrentes] = useState<FrenteServico[]>([]);
  const [selectedFrente, setSelectedFrente] = useState<number | null>(null);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para nova frente
  const [showNovaFrenteForm, setShowNovaFrenteForm] = useState(false);
  const [novaFrenteNome, setNovaFrenteNome] = useState('');

  // Estado para novo certificado
  const [showCertificadoForm, setShowCertificadoForm] = useState(false);
  const [novoCertificado, setNovoCertificado] = useState({
    nome: '',
    tipo: '',
    data: new Date().toISOString().split('T')[0],
    file: null as File | null,
  });

  // Estado para novo equipamento
  const [showEquipamentoForm, setShowEquipamentoForm] = useState(false);
  const [novoEquipamento, setNovoEquipamento] = useState({
    nome: '',
    certificado_calibracao: '',
    data_calibragem: new Date().toISOString().split('T')[0],
    data_proxima_calibracao: '',
  });

  // ==================== CARREGAR DADOS ====================
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar frentes
      const { data: frentesData, error: frentesError } = await supabase
        .from('frentes_servico')
        .select('*')
        .order('nome');

      if (frentesError) throw frentesError;
      setFrentes(frentesData || []);

      // Carregar certificados
      const { data: certificadosData, error: certificadosError } =
        await supabase
          .from('certificados')
          .select('*')
          .order('data', { ascending: false });

      if (certificadosError) throw certificadosError;
      setCertificados(certificadosData || []);

      // Carregar equipamentos
      const { data: equipamentosData, error: equipamentosError } =
        await supabase
          .from('equipamentos_sobressalentes')
          .select('*')
          .order('nome');

      if (equipamentosError) throw equipamentosError;
      setEquipamentos(equipamentosData || []);

      if (frentesData && frentesData.length > 0 && !selectedFrente) {
        setSelectedFrente(frentesData[0].id);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ==================== FUNÇÕES CRUD ====================
  const adicionarFrente = async () => {
    if (!novaFrenteNome.trim()) {
      setError('Digite o nome da frente');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('frentes_servico')
        .insert([{ nome: novaFrenteNome.trim() }])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        setFrentes([...frentes, data[0]]);
        setSelectedFrente(data[0].id);
        setNovaFrenteNome('');
        setShowNovaFrenteForm(false);
        setSuccessMessage('Frente adicionada com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const excluirFrente = async (id: number) => {
    if (!confirm('Excluir esta frente e todos os certificados?')) return;

    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('frentes_servico')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setFrentes(frentes.filter((f) => f.id !== id));
      setCertificados(certificados.filter((c) => c.frente_id !== id));

      if (selectedFrente === id) {
        const remainingFrentes = frentes.filter((f) => f.id !== id);
        setSelectedFrente(
          remainingFrentes.length > 0 ? remainingFrentes[0].id : null
        );
      }
      setSuccessMessage('Frente excluída com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const adicionarCertificado = async () => {
    if (!selectedFrente) {
      setError('Selecione uma frente primeiro');
      return;
    }
    if (!novoCertificado.nome) {
      setError('Digite o nome do certificado');
      return;
    }
    if (!novoCertificado.file) {
      setError('Selecione o arquivo do certificado');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const fileName = `cert_${Date.now()}_${novoCertificado.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('certificados')
        .upload(fileName, novoCertificado.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('certificados')
        .getPublicUrl(fileName);

      const { data, error: insertError } = await supabase
        .from('certificados')
        .insert([
          {
            frente_id: selectedFrente,
            nome: novoCertificado.nome,
            tipo: novoCertificado.tipo,
            data: novoCertificado.data,
            url: urlData.publicUrl,
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        setCertificados([...certificados, data[0]]);
      }

      setNovoCertificado({
        nome: '',
        tipo: '',
        data: new Date().toISOString().split('T')[0],
        file: null,
      });
      setShowCertificadoForm(false);
      setSuccessMessage('Certificado adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Erro:', error);
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const excluirCertificado = async (id: number) => {
    if (!confirm('Excluir este certificado?')) return;

    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('certificados')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setCertificados(certificados.filter((c) => c.id !== id));
      setSuccessMessage('Certificado excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const adicionarEquipamento = async () => {
    if (
      !novoEquipamento.nome ||
      !novoEquipamento.certificado_calibracao ||
      !novoEquipamento.data_proxima_calibracao
    ) {
      setError('Preencha todos os campos');
      return;
    }

    const hoje = new Date();
    const proximaCalibracao = new Date(novoEquipamento.data_proxima_calibracao);
    let status = 'em dia';
    if (proximaCalibracao < hoje) {
      status = 'vencido';
    } else {
      const diasRestantes = Math.ceil(
        (proximaCalibracao.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
      );
      if (diasRestantes <= 30) status = 'proximo';
    }

    setSaving(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('equipamentos_sobressalentes')
        .insert([
          {
            ...novoEquipamento,
            status,
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        setEquipamentos([...equipamentos, data[0]]);
      }

      setNovoEquipamento({
        nome: '',
        certificado_calibracao: '',
        data_calibragem: new Date().toISOString().split('T')[0],
        data_proxima_calibracao: '',
      });
      setShowEquipamentoForm(false);
      setSuccessMessage('Equipamento adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const excluirEquipamento = async (id: number) => {
    if (!confirm('Excluir este equipamento?')) return;

    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('equipamentos_sobressalentes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEquipamentos(equipamentos.filter((e) => e.id !== id));
      setSuccessMessage('Equipamento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNovoCertificado({ ...novoCertificado, file: e.target.files[0] });
    }
  };

  // ==================== FUNÇÕES AUXILIARES ====================
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'em dia':
        return {
          text: 'Em dia',
          color: '#059669',
          bg: '#e8f5e9',
          icon: 'fa-check-circle',
        };
      case 'vencido':
        return {
          text: 'Vencido',
          color: '#dc2626',
          bg: '#fce4ec',
          icon: 'fa-times-circle',
        };
      case 'proximo':
        return {
          text: 'Próximo ao Venc.',
          color: '#d97706',
          bg: '#fff3e0',
          icon: 'fa-exclamation-circle',
        };
      default:
        return {
          text: status,
          color: '#6b5f55',
          bg: '#e9ecef',
          icon: 'fa-circle',
        };
    }
  };

  // ==================== ESTATÍSTICAS ====================
  const stats = useMemo(() => {
    const totalFrentes = frentes.length;
    const totalCertificados = certificados.length;
    const totalEquipamentos = equipamentos.length;
    const vencidos = equipamentos.filter((e) => e.status === 'vencido').length;
    return { totalFrentes, totalCertificados, totalEquipamentos, vencidos };
  }, [frentes, certificados, equipamentos]);

  const certificadosDaFrente = useMemo(() => {
    return certificados.filter((c) => c.frente_id === selectedFrente);
  }, [certificados, selectedFrente]);

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

  const statCardStyle = (borderColor: string): React.CSSProperties => ({
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

  const mainGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '24px',
    marginBottom: '24px',
  };

  const sidebarStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    height: 'fit-content',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const contentStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    minHeight: '400px',
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: textPrimary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const frenteItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    marginBottom: '4px',
    borderRadius: '10px',
    cursor: 'pointer',
    background: isSelected ? `rgba(16, 185, 129, 0.08)` : 'transparent',
    color: isSelected ? textPrimary : textSecondary,
    fontWeight: isSelected ? 700 : 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeft: isSelected
      ? `3px solid ${accentColor}`
      : '3px solid transparent',
    transition: 'all 0.2s ease',
    fontSize: '14px',
  });

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 14px',
    background: 'rgba(0, 0, 0, 0.02)',
    borderBottom: `2px solid ${cardBorder}`,
    fontWeight: 700,
    fontSize: '11px',
    color: textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: `1px solid ${cardBorder}`,
    fontSize: '13px',
    color: textSecondary,
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: `0 4px 15px ${accentGlow}`,
    transition: 'all 0.3s ease',
  };

  const buttonSuccessStyle: React.CSSProperties = {
    background: '#059669',
    color: 'white',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  };

  const buttonGhostStyle: React.CSSProperties = {
    background: 'transparent',
    color: textSecondary,
    border: `1px solid ${cardBorder}`,
    padding: '9px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  };

  const buttonDangerStyle: React.CSSProperties = {
    background: 'rgba(220, 38, 38, 0.08)',
    color: '#dc2626',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const formPanelStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${cardBorder}`,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '18px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 600,
    fontSize: '12px',
    color: textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: textSecondary,
  };

  const statusPillStyle = (status: string): React.CSSProperties => {
    const info = getStatusInfo(status);
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      background: info.bg,
      color: info.color,
    };
  };

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ color: textSecondary, marginTop: '16px' }}>
          Carregando dados...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <i
          className="fas fa-exclamation-triangle"
          style={{ fontSize: '40px', color: '#dc2626' }}
        ></i>
        <p style={{ color: '#dc2626', marginTop: '16px' }}>{error}</p>
        <button
          onClick={carregarDados}
          style={{ ...buttonPrimaryStyle, marginTop: '16px' }}
        >
          <i className="fas fa-sync"></i> Tentar novamente
        </button>
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
              className="fas fa-certificate"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Certificados de Calibração
          </h1>
          <p style={subtitleStyle}>
            Sistema de gestão de documentos e equipamentos
          </p>
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
            className="fas fa-file-alt"
            style={{ marginRight: '8px', color: accentColor }}
          ></i>
          <span style={{ fontWeight: 700, color: textPrimary }}>
            {certificados.length}
          </span>{' '}
          certificados
        </div>
      </div>

      {/* STATS */}
      <div style={statsGridStyle}>
        <div style={statCardStyle('#059669')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-industry"
              style={{ color: '#059669', marginRight: '6px' }}
            ></i>
            Frentes
          </div>
          <div style={{ ...statNumberStyle, color: '#059669' }}>
            {stats.totalFrentes}
          </div>
        </div>
        <div style={statCardStyle(accentColor)}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-file-alt"
              style={{ color: accentColor, marginRight: '6px' }}
            ></i>
            Certificados
          </div>
          <div style={{ ...statNumberStyle, color: accentColor }}>
            {stats.totalCertificados}
          </div>
        </div>
        <div style={statCardStyle('#2563eb')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-tools"
              style={{ color: '#2563eb', marginRight: '6px' }}
            ></i>
            Equipamentos
          </div>
          <div style={{ ...statNumberStyle, color: '#2563eb' }}>
            {stats.totalEquipamentos}
          </div>
        </div>
        <div style={statCardStyle('#dc2626')}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-exclamation-triangle"
              style={{ color: '#dc2626', marginRight: '6px' }}
            ></i>
            Vencidos
          </div>
          <div style={{ ...statNumberStyle, color: '#dc2626' }}>
            {stats.vencidos}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={mainGridStyle}>
        {/* SIDEBAR - FRENTES */}
        <div style={sidebarStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={sectionHeadingStyle}>
              <i className="fas fa-industry" style={{ color: accentColor }}></i>
              Frentes
            </span>
            <button
              style={buttonSuccessStyle}
              onClick={() => setShowNovaFrenteForm(!showNovaFrenteForm)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#059669';
              }}
            >
              <i className="fas fa-plus-circle"></i> Nova
            </button>
          </div>

          {showNovaFrenteForm && (
            <div style={formPanelStyle}>
              <label style={labelStyle}>Nome da Frente</label>
              <input
                type="text"
                style={inputStyle}
                placeholder="Ex: Santos Scout"
                value={novaFrenteNome}
                onChange={(e) => setNovaFrenteNome(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                  e.currentTarget.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cardBorder;
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  style={buttonSuccessStyle}
                  onClick={adicionarFrente}
                  disabled={saving}
                >
                  {saving ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    'Salvar'
                  )}
                </button>
                <button
                  style={buttonGhostStyle}
                  onClick={() => setShowNovaFrenteForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {frentes.length === 0 ? (
            <div style={emptyStateStyle}>
              <i
                className="fas fa-industry"
                style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.3 }}
              ></i>
              <p style={{ fontSize: '13px' }}>Nenhuma frente</p>
            </div>
          ) : (
            frentes.map((frente) => {
              const isSelected = selectedFrente === frente.id;
              const count = certificados.filter(
                (c) => c.frente_id === frente.id
              ).length;
              return (
                <div
                  key={frente.id}
                  style={frenteItemStyle(isSelected)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => setSelectedFrente(frente.id)}
                  >
                    <i
                      className="fas fa-hard-hat"
                      style={{ marginRight: '8px', color: textSecondary }}
                    ></i>
                    {frente.nome}
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        color: textSecondary,
                        fontWeight: 500,
                      }}
                    >
                      ({count})
                    </span>
                  </div>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: textSecondary,
                      cursor: 'pointer',
                      padding: '4px',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => excluirFrente(frente.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = textSecondary;
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* CONTENT - CERTIFICADOS */}
        <div style={contentStyle}>
          {!selectedFrente ? (
            <div style={emptyStateStyle}>
              <i
                className="fas fa-folder-open"
                style={{ fontSize: '44px', marginBottom: '14px', opacity: 0.3 }}
              ></i>
              <p>Selecione uma frente de serviço</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <h2 style={sectionHeadingStyle}>
                  <i
                    className="fas fa-file-alt"
                    style={{ color: accentColor }}
                  ></i>
                  Certificados —{' '}
                  {frentes.find((f) => f.id === selectedFrente)?.nome}
                </h2>
                <button
                  style={buttonPrimaryStyle}
                  onClick={() => setShowCertificadoForm(!showCertificadoForm)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
                  }}
                >
                  <i
                    className={`fas ${
                      showCertificadoForm ? 'fa-times' : 'fa-plus-circle'
                    }`}
                  ></i>
                  {showCertificadoForm ? 'Cancelar' : 'Adicionar Certificado'}
                </button>
              </div>

              {showCertificadoForm && (
                <div style={formPanelStyle}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      marginBottom: '14px',
                      color: textPrimary,
                    }}
                  >
                    <i
                      className="fas fa-file-upload"
                      style={{ color: accentColor, marginRight: '8px' }}
                    ></i>
                    Novo Certificado
                  </h3>
                  <div style={formGridStyle}>
                    <div>
                      <label style={labelStyle}>Nome do Equipamento *</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Ex: Compressor Atlas"
                        value={novoCertificado.nome}
                        onChange={(e) =>
                          setNovoCertificado({
                            ...novoCertificado,
                            nome: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Tipo *</label>
                      <select
                        style={selectStyle}
                        value={novoCertificado.tipo}
                        onChange={(e) =>
                          setNovoCertificado({
                            ...novoCertificado,
                            tipo: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecione</option>
                        {tiposCertificado.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Data *</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={novoCertificado.data}
                        onChange={(e) =>
                          setNovoCertificado({
                            ...novoCertificado,
                            data: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Arquivo *</label>
                      <input
                        type="file"
                        style={{ ...inputStyle, padding: '8px 14px' }}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.png"
                      />
                      {novoCertificado.file && (
                        <span
                          style={{
                            fontSize: '12px',
                            color: '#059669',
                            fontWeight: 600,
                          }}
                        >
                          <i className="fas fa-check-circle"></i>{' '}
                          {novoCertificado.file.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'flex-end',
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: `1px solid ${cardBorder}`,
                    }}
                  >
                    <button
                      style={buttonGhostStyle}
                      onClick={() => setShowCertificadoForm(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      style={buttonSuccessStyle}
                      onClick={adicionarCertificado}
                      disabled={saving}
                    >
                      {saving ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        'Salvar Certificado'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {certificadosDaFrente.length === 0 ? (
                <div style={emptyStateStyle}>
                  <i
                    className="fas fa-file-alt"
                    style={{
                      fontSize: '44px',
                      marginBottom: '14px',
                      opacity: 0.3,
                    }}
                  ></i>
                  <p>Nenhum certificado anexado</p>
                  <button
                    style={{ ...buttonPrimaryStyle, marginTop: '14px' }}
                    onClick={() => setShowCertificadoForm(true)}
                  >
                    <i className="fas fa-plus-circle"></i> Adicionar primeiro
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Equipamento</th>
                        <th style={thStyle}>Tipo</th>
                        <th style={thStyle}>Data</th>
                        <th style={thStyle}>Arquivo</th>
                        <th style={thStyle}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificadosDaFrente.map((cert) => (
                        <tr key={cert.id}>
                          <td style={tdStyle}>
                            <strong style={{ color: textPrimary }}>
                              {cert.nome}
                            </strong>
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                background: 'rgba(0, 0, 0, 0.04)',
                                color: textSecondary,
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 10px',
                                borderRadius: '20px',
                              }}
                            >
                              {cert.tipo || 'Geral'}
                            </span>
                          </td>
                          <td style={tdStyle}>{formatDate(cert.data)}</td>
                          <td style={tdStyle}>
                            {cert.url && (
                              <a
                                href={cert.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: accentColor,
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.textDecoration =
                                    'underline';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.textDecoration = 'none';
                                }}
                              >
                                <i className="fas fa-download"></i> Download
                              </a>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <button
                              style={buttonDangerStyle}
                              onClick={() => excluirCertificado(cert.id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  'rgba(220, 38, 38, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  'rgba(220, 38, 38, 0.08)';
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EQUIPAMENTOS SOBRESSALENTES */}
      <div style={contentStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h3 style={sectionHeadingStyle}>
            <i className="fas fa-microchip" style={{ color: accentColor }}></i>
            Equipamentos Sobressalentes
          </h3>
          <button
            style={buttonPrimaryStyle}
            onClick={() => setShowEquipamentoForm(!showEquipamentoForm)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
            }}
          >
            <i
              className={`fas ${
                showEquipamentoForm ? 'fa-times' : 'fa-plus-circle'
              }`}
            ></i>
            {showEquipamentoForm ? 'Cancelar' : 'Cadastrar Equipamento'}
          </button>
        </div>

        {showEquipamentoForm && (
          <div style={formPanelStyle}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '14px',
                color: textPrimary,
              }}
            >
              <i
                className="fas fa-tools"
                style={{ color: accentColor, marginRight: '8px' }}
              ></i>
              Novo Equipamento
            </h3>
            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="Ex: Compressor Atlas"
                  value={novoEquipamento.nome}
                  onChange={(e) =>
                    setNovoEquipamento({
                      ...novoEquipamento,
                      nome: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Certificado *</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="Ex: Cert-2024-001"
                  value={novoEquipamento.certificado_calibracao}
                  onChange={(e) =>
                    setNovoEquipamento({
                      ...novoEquipamento,
                      certificado_calibracao: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Data Calibragem *</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={novoEquipamento.data_calibragem}
                  onChange={(e) =>
                    setNovoEquipamento({
                      ...novoEquipamento,
                      data_calibragem: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Próxima Calibração *</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={novoEquipamento.data_proxima_calibracao}
                  onChange={(e) =>
                    setNovoEquipamento({
                      ...novoEquipamento,
                      data_proxima_calibracao: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '14px',
                paddingTop: '14px',
                borderTop: `1px solid ${cardBorder}`,
              }}
            >
              <button
                style={buttonGhostStyle}
                onClick={() => setShowEquipamentoForm(false)}
              >
                Cancelar
              </button>
              <button
                style={buttonSuccessStyle}
                onClick={adicionarEquipamento}
                disabled={saving}
              >
                {saving ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Salvar Equipamento'
                )}
              </button>
            </div>
          </div>
        )}

        {equipamentos.length === 0 ? (
          <div style={emptyStateStyle}>
            <i
              className="fas fa-tools"
              style={{ fontSize: '44px', marginBottom: '14px', opacity: 0.3 }}
            ></i>
            <p>Nenhum equipamento cadastrado</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Equipamento</th>
                  <th style={thStyle}>Certificado</th>
                  <th style={thStyle}>Data Calibragem</th>
                  <th style={thStyle}>Próxima Calibração</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {equipamentos.map((equip) => {
                  const statusInfo = getStatusInfo(equip.status);
                  return (
                    <tr key={equip.id}>
                      <td style={tdStyle}>
                        <strong style={{ color: textPrimary }}>
                          {equip.nome}
                        </strong>
                      </td>
                      <td style={tdStyle}>{equip.certificado_calibracao}</td>
                      <td style={tdStyle}>
                        {formatDate(equip.data_calibragem)}
                      </td>
                      <td style={tdStyle}>
                        {formatDate(equip.data_proxima_calibracao)}
                      </td>
                      <td style={tdStyle}>
                        <span style={statusPillStyle(equip.status)}>
                          <i className={`fas ${statusInfo.icon}`}></i>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          style={buttonDangerStyle}
                          onClick={() => excluirEquipamento(equip.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              'rgba(220, 38, 38, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              'rgba(220, 38, 38, 0.08)';
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
