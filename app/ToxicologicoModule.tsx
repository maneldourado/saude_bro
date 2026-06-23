// app/ToxicologicoModule.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';

interface ExameToxicologico {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  cargo: string;
  dataColeta: string;
  dataEmissao: string;
  dataValidade: string;
  tipoExame: 'admissional' | 'periodico' | 'retorno' | 'mudanca';
  substancias: string[];
  resultado: 'negativo' | 'positivo' | 'inconclusivo';
  anexoNome: string;
  anexoUrl: string;
  observacoes?: string;
  status: 'ativo' | 'vencido' | 'proximo_vencer';
}

interface ToxicologicoModuleProps {
  employees?: any[];
  styles?: any;
}

// Cores consistentes com o módulo de medicamentos
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgPrimary = '#f5f0eb';
const bgSecondary = '#faf7f2';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

const substanciasLista = [
  'Anfetaminas',
  'Cocaína',
  'Maconha',
  'Opiáceos',
  'Benzodiazepínicos',
  'Barbitúricos',
  'Metadona',
  'Ecstasy',
  'LSD',
  'Álcool',
];

export default function ToxicologicoModule({
  employees = [],
  styles = {},
}: ToxicologicoModuleProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lista' | 'novo'>(
    'dashboard'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [exames, setExames] = useState<ExameToxicologico[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [novoExame, setNovoExame] = useState({
    funcionarioId: '',
    funcionarioNome: '',
    cargo: '',
    dataColeta: new Date().toISOString().split('T')[0],
    dataEmissao: new Date().toISOString().split('T')[0],
    tipoExame: 'periodico' as
      | 'admissional'
      | 'periodico'
      | 'retorno'
      | 'mudanca',
    substancias: [] as string[],
    resultado: 'negativo' as 'negativo' | 'positivo' | 'inconclusivo',
    observacoes: '',
    anexo: null as File | null,
  });

  // ==================== CARREGAR EXAMES ====================
  const carregarExames = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('exames_toxicologicos')
        .select('*')
        .order('data_validade', { ascending: true });

      if (supabaseError) throw supabaseError;

      if (data) {
        const formattedExames: ExameToxicologico[] = data.map((item: any) => ({
          id: item.id.toString(),
          funcionarioId: item.colaborador_id?.toString() || '',
          funcionarioNome: item.colaborador_nome || '',
          cargo: item.cargo || '',
          dataColeta: item.data_coleta || '',
          dataEmissao: item.data_emissao || '',
          dataValidade: item.data_validade || '',
          tipoExame: item.tipo_exame || 'periodico',
          substancias: item.substancias || [],
          resultado: item.resultado || 'negativo',
          anexoNome: item.anexo_nome || '',
          anexoUrl: item.anexo_url || '',
          observacoes: item.observacoes || '',
          status: item.status || 'ativo',
        }));
        setExames(formattedExames);
      }
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
      setError('Não foi possível carregar os exames. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPLOAD ARQUIVO ====================
  const uploadArquivo = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `toxicologico/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return URL.createObjectURL(file);
    }

    const { data } = supabase.storage.from('documentos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ==================== SALVAR EXAME ====================
  const cadastrarExame = async () => {
    if (!novoExame.funcionarioId) {
      setError('Selecione um colaborador');
      return;
    }

    if (!novoExame.anexo) {
      setError('Anexe o laudo do exame');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let anexoUrl = '';
      try {
        anexoUrl = await uploadArquivo(novoExame.anexo);
      } catch (err) {
        anexoUrl = URL.createObjectURL(novoExame.anexo);
      }

      const dataValidade = new Date(novoExame.dataEmissao);
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);
      const dataValidadeStr = dataValidade.toISOString().split('T')[0];

      const hoje = new Date();
      const validade = new Date(dataValidadeStr);
      const diasParaVencer = Math.ceil(
        (validade.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
      );

      let status: 'ativo' | 'vencido' | 'proximo_vencer' = 'ativo';
      if (validade < hoje) {
        status = 'vencido';
      } else if (diasParaVencer <= 60) {
        status = 'proximo_vencer';
      }

      const { error: insertError } = await supabase
        .from('exames_toxicologicos')
        .insert([
          {
            colaborador_id: parseInt(novoExame.funcionarioId),
            colaborador_nome: novoExame.funcionarioNome,
            cargo: novoExame.cargo,
            data_coleta: novoExame.dataColeta,
            data_emissao: novoExame.dataEmissao,
            data_validade: dataValidadeStr,
            tipo_exame: novoExame.tipoExame,
            substancias: novoExame.substancias,
            resultado: novoExame.resultado,
            anexo_nome: novoExame.anexo.name,
            anexo_url: anexoUrl,
            observacoes: novoExame.observacoes,
            status: status,
          },
        ]);

      if (insertError) throw insertError;

      setSuccessMessage('Exame cadastrado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);

      await carregarExames();
      setNovoExame({
        funcionarioId: '',
        funcionarioNome: '',
        cargo: '',
        dataColeta: new Date().toISOString().split('T')[0],
        dataEmissao: new Date().toISOString().split('T')[0],
        tipoExame: 'periodico',
        substancias: [],
        resultado: 'negativo',
        observacoes: '',
        anexo: null,
      });
      setActiveTab('lista');
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro ao cadastrar exame. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // ==================== DELETAR EXAME ====================
  const excluirExame = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este exame?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('exames_toxicologicos')
        .delete()
        .eq('id', parseInt(id));

      if (deleteError) throw deleteError;

      setSuccessMessage('Exame excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await carregarExames();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setError('Erro ao excluir o exame. Tente novamente.');
    }
  };

  // ==================== SELECIONAR COLABORADOR ====================
  const handleFuncionarioSelect = (funcionarioId: string) => {
    const funcionario = employees.find((e: any) => {
      const eId = e.id?.toString();
      const eCodigo = e.codigo?.toString();
      return eId === funcionarioId || eCodigo === funcionarioId;
    });

    if (funcionario) {
      setNovoExame({
        ...novoExame,
        funcionarioId: funcionario.id?.toString() || funcionarioId,
        funcionarioNome: funcionario.name || funcionario.nome || '',
        cargo: funcionario.cargo || '',
      });
    }
  };

  const handleSubstanciaToggle = (substancia: string) => {
    setNovoExame((prev) => ({
      ...prev,
      substancias: prev.substancias.includes(substancia)
        ? prev.substancias.filter((s) => s !== substancia)
        : [...prev.substancias, substancia],
    }));
  };

  // ==================== FUNÇÕES AUXILIARES ====================
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ativo':
        return { text: 'Ativo', color: '#059669', bg: '#e8f5e9' };
      case 'proximo_vencer':
        return { text: 'Próximo ao Venc.', color: '#d97706', bg: '#fff3e0' };
      case 'vencido':
        return { text: 'Vencido', color: '#dc2626', bg: '#fce4ec' };
      default:
        return { text: 'Desconhecido', color: '#6b5f55', bg: '#e9ecef' };
    }
  };

  const getTipoExameText = (tipo: string) => {
    switch (tipo) {
      case 'admissional':
        return 'Admissional';
      case 'periodico':
        return 'Periódico';
      case 'retorno':
        return 'Retorno ao Trabalho';
      case 'mudanca':
        return 'Mudança de Função';
      default:
        return tipo;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // ==================== FILTROS ====================
  const examesFiltrados = useMemo(() => {
    return exames.filter(
      (exame) =>
        exame.funcionarioNome
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        exame.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exames, searchTerm]);

  const examesVencidos = useMemo(
    () => exames.filter((e) => e.status === 'vencido').length,
    [exames]
  );
  const examesProximos = useMemo(
    () => exames.filter((e) => e.status === 'proximo_vencer').length,
    [exames]
  );
  const examesAtivos = useMemo(
    () => exames.filter((e) => e.status === 'ativo').length,
    [exames]
  );

  useEffect(() => {
    carregarExames();
  }, []);

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

  const statCardStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
  };

  const statNumberStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: textPrimary,
    marginTop: '8px',
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
    padding: '12px 24px',
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

  const formStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '20px',
    padding: '28px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: textSecondary,
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${cardBorder}`,
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    background: 'rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
  };

  const substanciaTagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '20px',
    background: 'rgba(0, 0, 0, 0.04)',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '8px',
    marginBottom: '8px',
    border: `1px solid ${cardBorder}`,
    transition: 'all 0.2s ease',
    color: textSecondary,
    fontWeight: 500,
  };

  const substanciaTagSelectedStyle: React.CSSProperties = {
    ...substanciaTagStyle,
    background: `rgba(16, 185, 129, 0.1)`,
    color: accentColor,
    borderColor: accentColor,
  };

  const grid2ColsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ color: textSecondary, marginTop: '16px' }}>
          Carregando exames...
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
          {successMessage}
        </div>
      )}

      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            <i
              className="fas fa-flask"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Exames Toxicológicos
          </h1>
          <p style={subtitleStyle}>
            Gestão de exames toxicológicos dos colaboradores
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
            className="fas fa-file-medical"
            style={{ marginRight: '8px', color: accentColor }}
          ></i>
          <span style={{ fontWeight: 700, color: textPrimary }}>
            {exames.length}
          </span>{' '}
          exames
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            Total de Exames
          </div>
          <div style={{ ...statNumberStyle, color: textPrimary }}>
            {exames.length}
          </div>
        </div>
        <div
          style={{
            ...statCardStyle,
            borderColor: '#059669',
            background: 'rgba(5, 150, 105, 0.05)',
          }}
        >
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            Ativos
          </div>
          <div style={{ ...statNumberStyle, color: '#059669' }}>
            {examesAtivos}
          </div>
        </div>
        <div
          style={{
            ...statCardStyle,
            borderColor: '#d97706',
            background: 'rgba(217, 119, 6, 0.05)',
          }}
        >
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            Próximos ao Venc.
          </div>
          <div style={{ ...statNumberStyle, color: '#d97706' }}>
            {examesProximos}
          </div>
        </div>
        <div
          style={{
            ...statCardStyle,
            borderColor: '#dc2626',
            background: 'rgba(220, 38, 38, 0.05)',
          }}
        >
          <div
            style={{ fontSize: '13px', color: textSecondary, fontWeight: 600 }}
          >
            Vencidos
          </div>
          <div style={{ ...statNumberStyle, color: '#dc2626' }}>
            {examesVencidos}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'dashboard')}
          onClick={() => setActiveTab('dashboard')}
          onMouseEnter={(e) => {
            if (activeTab !== 'dashboard') {
              e.currentTarget.style.color = textPrimary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'dashboard') {
              e.currentTarget.style.color = textSecondary;
            }
          }}
        >
          <i className="fas fa-chart-pie"></i> Dashboard
        </button>
        <button
          style={tabStyle(activeTab === 'lista')}
          onClick={() => setActiveTab('lista')}
          onMouseEnter={(e) => {
            if (activeTab !== 'lista') {
              e.currentTarget.style.color = textPrimary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'lista') {
              e.currentTarget.style.color = textSecondary;
            }
          }}
        >
          <i className="fas fa-table"></i> Lista de Exames
        </button>
        <button
          style={tabStyle(activeTab === 'novo')}
          onClick={() => setActiveTab('novo')}
          onMouseEnter={(e) => {
            if (activeTab !== 'novo') {
              e.currentTarget.style.color = textPrimary;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'novo') {
              e.currentTarget.style.color = textSecondary;
            }
          }}
        >
          <i className="fas fa-plus-circle"></i> Novo Exame
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
              Status dos Exames
            </h3>
            {exames.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>
                      <span style={{ color: '#059669' }}>●</span> Ativos
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {examesAtivos} (
                      {Math.round((examesAtivos / exames.length) * 100)}%)
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
                        width: `${(examesAtivos / exames.length) * 100}%`,
                        height: '100%',
                        background: '#059669',
                        borderRadius: '10px',
                        transition: 'width 0.6s ease',
                      }}
                    ></div>
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
                      <span style={{ color: '#d97706' }}>●</span> Próximo ao
                      Venc.
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {examesProximos} (
                      {Math.round((examesProximos / exames.length) * 100)}%)
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
                        width: `${(examesProximos / exames.length) * 100}%`,
                        height: '100%',
                        background: '#d97706',
                        borderRadius: '10px',
                        transition: 'width 0.6s ease',
                      }}
                    ></div>
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
                      <span style={{ color: '#dc2626' }}>●</span> Vencidos
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {examesVencidos} (
                      {Math.round((examesVencidos / exames.length) * 100)}%)
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
                        width: `${(examesVencidos / exames.length) * 100}%`,
                        height: '100%',
                        background: '#dc2626',
                        borderRadius: '10px',
                        transition: 'width 0.6s ease',
                      }}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: textSecondary,
                }}
              >
                <i
                  className="fas fa-flask"
                  style={{ fontSize: '48px', color: cardBorder }}
                ></i>
                <p style={{ marginTop: '16px' }}>Nenhum exame cadastrado</p>
              </div>
            )}
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
                className="fas fa-check-circle"
                style={{ color: accentColor }}
              ></i>
              Resultados dos Exames
            </h3>
            {exames.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div
                  style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: '#059669',
                  }}
                >
                  {Math.round(
                    (exames.filter((e) => e.resultado === 'negativo').length /
                      exames.length) *
                      100
                  )}
                  %
                </div>
                <div
                  style={{
                    color: textSecondary,
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Resultados Negativos
                </div>
                <div
                  style={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                  }}
                >
                  <div>
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      {exames.filter((e) => e.resultado === 'negativo').length}
                    </span>
                    <span
                      style={{
                        color: textSecondary,
                        fontSize: '12px',
                        marginLeft: '4px',
                      }}
                    >
                      Negativos
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      {exames.filter((e) => e.resultado === 'positivo').length}
                    </span>
                    <span
                      style={{
                        color: textSecondary,
                        fontSize: '12px',
                        marginLeft: '4px',
                      }}
                    >
                      Positivos
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>
                      {
                        exames.filter((e) => e.resultado === 'inconclusivo')
                          .length
                      }
                    </span>
                    <span
                      style={{
                        color: textSecondary,
                        fontSize: '12px',
                        marginLeft: '4px',
                      }}
                    >
                      Inconclusivos
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: textSecondary,
                }}
              >
                <i
                  className="fas fa-flask"
                  style={{ fontSize: '48px', color: cardBorder }}
                ></i>
                <p style={{ marginTop: '16px' }}>Nenhum exame cadastrado</p>
              </div>
            )}
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
              placeholder="🔍 Buscar por nome ou cargo..."
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
            <button
              style={buttonStyle}
              onClick={() => setActiveTab('novo')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
              }}
            >
              <i className="fas fa-plus-circle"></i> Novo Exame
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Colaborador</th>
                  <th style={thStyle}>Cargo</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Data Coleta</th>
                  <th style={thStyle}>Validade</th>
                  <th style={thStyle}>Resultado</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {examesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: textSecondary,
                      }}
                    >
                      <i
                        className="fas fa-flask"
                        style={{
                          fontSize: '24px',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      ></i>
                      Nenhum exame encontrado
                    </td>
                  </tr>
                ) : (
                  examesFiltrados.map((exame) => {
                    const statusInfo = getStatusInfo(exame.status);
                    return (
                      <tr key={exame.id}>
                        <td style={tdStyle}>
                          <strong style={{ color: textPrimary }}>
                            {exame.funcionarioNome}
                          </strong>
                        </td>
                        <td style={tdStyle}>{exame.cargo}</td>
                        <td style={tdStyle}>
                          {getTipoExameText(exame.tipoExame)}
                        </td>
                        <td style={tdStyle}>{formatDate(exame.dataColeta)}</td>
                        <td style={tdStyle}>
                          {formatDate(exame.dataValidade)}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background:
                                exame.resultado === 'negativo'
                                  ? '#e8f5e9'
                                  : exame.resultado === 'positivo'
                                  ? '#fce4ec'
                                  : '#fff3e0',
                              color:
                                exame.resultado === 'negativo'
                                  ? '#059669'
                                  : exame.resultado === 'positivo'
                                  ? '#dc2626'
                                  : '#d97706',
                            }}
                          >
                            {exame.resultado === 'negativo'
                              ? 'Negativo'
                              : exame.resultado === 'positivo'
                              ? 'Positivo'
                              : 'Inconclusivo'}
                          </span>
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
                            {statusInfo.text}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            style={{
                              background: 'rgba(220, 38, 38, 0.08)',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => excluirExame(exame.id)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'rgba(220, 38, 38, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                'rgba(220, 38, 38, 0.08)';
                            }}
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

      {/* NOVO EXAME TAB */}
      {activeTab === 'novo' && (
        <div style={formStyle}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: textPrimary,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i
              className="fas fa-plus-circle"
              style={{ color: accentColor }}
            ></i>
            Cadastrar Novo Exame Toxicológico
          </h3>

          <div style={grid2ColsStyle}>
            <div>
              <label style={labelStyle}>👤 Colaborador *</label>
              <select
                style={selectStyle}
                value={novoExame.funcionarioId}
                onChange={(e) => handleFuncionarioSelect(e.target.value)}
              >
                <option value="">-- Selecione um colaborador --</option>
                {employees.map((emp: any) => {
                  const empId = emp.id?.toString() || emp.codigo?.toString();
                  const empName = emp.name || emp.nome || 'Sem nome';
                  const empCargo = emp.cargo || 'Sem cargo';
                  return (
                    <option key={empId} value={empId}>
                      {empName} - {empCargo}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={labelStyle}>📋 Tipo de Exame *</label>
              <select
                style={selectStyle}
                value={novoExame.tipoExame}
                onChange={(e) =>
                  setNovoExame({
                    ...novoExame,
                    tipoExame: e.target.value as any,
                  })
                }
              >
                <option value="admissional">Admissional</option>
                <option value="periodico">Periódico</option>
                <option value="retorno">Retorno ao Trabalho</option>
                <option value="mudanca">Mudança de Função</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>📅 Data da Coleta *</label>
              <input
                type="date"
                style={inputStyle}
                value={novoExame.dataColeta}
                onChange={(e) =>
                  setNovoExame({ ...novoExame, dataColeta: e.target.value })
                }
              />
            </div>

            <div>
              <label style={labelStyle}>📅 Data da Emissão *</label>
              <input
                type="date"
                style={inputStyle}
                value={novoExame.dataEmissao}
                onChange={(e) =>
                  setNovoExame({ ...novoExame, dataEmissao: e.target.value })
                }
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>🔬 Substâncias Pesquisadas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {substanciasLista.map((substancia) => (
                <span
                  key={substancia}
                  style={
                    novoExame.substancias.includes(substancia)
                      ? substanciaTagSelectedStyle
                      : substanciaTagStyle
                  }
                  onClick={() => handleSubstanciaToggle(substancia)}
                  onMouseEnter={(e) => {
                    if (!novoExame.substancias.includes(substancia)) {
                      e.currentTarget.style.background =
                        'rgba(16, 185, 129, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!novoExame.substancias.includes(substancia)) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                    }
                  }}
                >
                  {substancia}
                  {novoExame.substancias.includes(substancia) && (
                    <span style={{ color: accentColor }}> ✓</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div style={{ ...grid2ColsStyle, marginTop: '16px' }}>
            <div>
              <label style={labelStyle}>📊 Resultado *</label>
              <select
                style={selectStyle}
                value={novoExame.resultado}
                onChange={(e) =>
                  setNovoExame({
                    ...novoExame,
                    resultado: e.target.value as any,
                  })
                }
              >
                <option value="negativo">Negativo</option>
                <option value="positivo">Positivo</option>
                <option value="inconclusivo">Inconclusivo</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>📎 Anexar Laudo (PDF) *</label>
              <input
                type="file"
                style={inputStyle}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNovoExame({ ...novoExame, anexo: e.target.files[0] });
                  }
                }}
                accept=".pdf,.jpg,.png"
              />
              {novoExame.anexo && (
                <small
                  style={{
                    color: '#059669',
                    display: 'block',
                    marginTop: '4px',
                    fontWeight: 600,
                  }}
                >
                  <i className="fas fa-check-circle"></i> Arquivo selecionado:{' '}
                  {novoExame.anexo.name}
                </small>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>📝 Observações</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Observações adicionais sobre o exame..."
              value={novoExame.observacoes}
              onChange={(e) =>
                setNovoExame({ ...novoExame, observacoes: e.target.value })
              }
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `1px solid ${cardBorder}`,
            }}
          >
            <button
              style={{
                ...buttonStyle,
                background: 'rgba(0, 0, 0, 0.03)',
                color: textSecondary,
                boxShadow: 'none',
                border: `1px solid ${cardBorder}`,
              }}
              onClick={() => setActiveTab('lista')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
              }}
            >
              Cancelar
            </button>
            <button
              style={buttonStyle}
              onClick={cadastrarExame}
              disabled={uploading}
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
              }}
            >
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Cadastrar Exame
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
