// app/AtestadosModule.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from './lib/supabase';

interface Colaborador {
  id: number;
  nome: string;
  codigo: string;
  cargo: string;
}

interface Atestado {
  id: number;
  colaborador_id: number;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  anexo_url: string;
  anexo_nome: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  parecer?: string;
  created_at: string;
}

interface AtestadosModuleProps {
  styles?: any;
}

// Cores consistentes com os outros módulos
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgPrimary = '#f5f0eb';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

export default function AtestadosModule({ styles = {} }: AtestadosModuleProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loadingColabs, setLoadingColabs] = useState(true);
  const [selectedColabId, setSelectedColabId] = useState<number | null>(null);
  const [atestados, setAtestados] = useState<Atestado[]>([]);
  const [loadingAtest, setLoadingAtest] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newAtestado, setNewAtestado] = useState({
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    motivo: '',
    anexo: null as File | null,
  });
  const [selectedAtestado, setSelectedAtestado] = useState<Atestado | null>(
    null
  );
  const [parecerTexto, setParecerTexto] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from('colaboradores')
          .select('id, nome, codigo, cargo')
          .order('nome');
        if (supabaseError) throw supabaseError;
        setColaboradores(data || []);
      } catch (err) {
        console.error(err);
        setColaboradores([
          { id: 1, nome: 'Carlos Silva', codigo: '001', cargo: 'Mergulhador' },
          { id: 2, nome: 'Maria Oliveira', codigo: '002', cargo: 'Enfermeira' },
        ]);
      } finally {
        setLoadingColabs(false);
      }
    };
    fetchColaboradores();
  }, []);

  // Carregar atestados do colaborador selecionado
  const fetchAtestados = useCallback(async (colabId: number) => {
    setLoadingAtest(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('atestados')
        .select('*')
        .eq('colaborador_id', colabId)
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      setAtestados(data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar atestados');
      setAtestados([]);
    } finally {
      setLoadingAtest(false);
    }
  }, []);

  useEffect(() => {
    if (selectedColabId) {
      fetchAtestados(selectedColabId);
    } else {
      setAtestados([]);
    }
  }, [selectedColabId, fetchAtestados]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAtestado({ ...newAtestado, anexo: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!selectedColabId) {
      setError('Selecione um colaborador primeiro');
      return;
    }
    if (!newAtestado.motivo || !newAtestado.anexo) {
      setError('Preencha o motivo e anexe o arquivo');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const file = newAtestado.anexo;
      const fileName = `${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        '_'
      )}`;
      const filePath = `atestados/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('atestados')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('atestados')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('atestados').insert({
        colaborador_id: selectedColabId,
        data_inicio: newAtestado.dataInicio,
        data_fim: newAtestado.dataFim,
        motivo: newAtestado.motivo,
        anexo_nome: file.name,
        anexo_url: urlData.publicUrl,
        status: 'pendente',
      });

      if (insertError) throw insertError;

      setSuccessMessage('Atestado enviado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);

      setNewAtestado({
        dataInicio: new Date().toISOString().split('T')[0],
        dataFim: new Date().toISOString().split('T')[0],
        motivo: '',
        anexo: null,
      });
      setShowForm(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAtestados(selectedColabId);
    } catch (err: any) {
      setError('Erro ao enviar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (
    atestadoId: number,
    status: 'aprovado' | 'rejeitado'
  ) => {
    if (!selectedColabId) return;

    try {
      const { error: updateError } = await supabase
        .from('atestados')
        .update({ status, parecer: parecerTexto || null })
        .eq('id', atestadoId);
      if (updateError) throw updateError;

      setSuccessMessage(
        `Atestado ${status === 'aprovado' ? 'aprovado' : 'rejeitado'}!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      setSelectedAtestado(null);
      setParecerTexto('');
      fetchAtestados(selectedColabId);
    } catch (err: any) {
      setError('Erro: ' + err.message);
    }
  };

  // ==================== FILTROS ====================
  const filteredColabs = useMemo(() => {
    return colaboradores.filter(
      (c) =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo.includes(searchTerm)
    );
  }, [colaboradores, searchTerm]);

  const colaboradorSelecionado = useMemo(() => {
    return colaboradores.find((c) => c.id === selectedColabId);
  }, [colaboradores, selectedColabId]);

  // ==================== ESTATÍSTICAS ====================
  const stats = useMemo(() => {
    const total = atestados.length;
    const pendentes = atestados.filter((a) => a.status === 'pendente').length;
    const aprovados = atestados.filter((a) => a.status === 'aprovado').length;
    const rejeitados = atestados.filter((a) => a.status === 'rejeitado').length;
    return { total, pendentes, aprovados, rejeitados };
  }, [atestados]);

  // ==================== FUNÇÕES AUXILIARES ====================
  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'aprovado':
        return {
          text: 'Aprovado',
          color: '#059669',
          bg: '#e8f5e9',
          icon: 'fa-check-circle',
        };
      case 'rejeitado':
        return {
          text: 'Rejeitado',
          color: '#dc2626',
          bg: '#fce4ec',
          icon: 'fa-times-circle',
        };
      default:
        return {
          text: 'Pendente',
          color: '#d97706',
          bg: '#fff3e0',
          icon: 'fa-clock',
        };
    }
  };

  // ==================== ESTILOS ====================
  const containerStyle: React.CSSProperties = {
    padding: '24px',
    background: 'transparent',
    minHeight: '100vh',
  };

  const mainGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
    maxWidth: '1440px',
    margin: '0 auto',
  };

  const sidebarStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '20px',
    padding: '20px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
    height: 'fit-content',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const searchBoxStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '12px',
    border: `1px solid ${cardBorder}`,
    background: 'rgba(0, 0, 0, 0.02)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    color: textPrimary,
    marginBottom: '16px',
  };

  const colabListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '4px',
  };

  const colabItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '6px',
    transition: 'all 0.2s ease',
    background: isSelected ? `rgba(16, 185, 129, 0.1)` : 'transparent',
    border: isSelected ? `2px solid ${accentColor}` : `1px solid transparent`,
    color: isSelected ? textPrimary : textSecondary,
  });

  const colabNameStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: '14px',
    color: textPrimary,
  };

  const colabDetailStyle: React.CSSProperties = {
    fontSize: '12px',
    color: textSecondary,
    marginTop: '2px',
  };

  const contentStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '20px',
    padding: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
    minHeight: '500px',
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
    fontSize: '20px',
    fontWeight: 700,
    color: textPrimary,
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: textSecondary,
    marginTop: '4px',
  };

  const addButtonStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 12px ${accentGlow}`,
    fontSize: '14px',
  };

  const formCardStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: `1px solid ${cardBorder}`,
  };

  const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
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
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: textSecondary,
    display: 'block',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const fileDropZoneStyle: React.CSSProperties = {
    border: `2px dashed ${cardBorder}`,
    borderRadius: '14px',
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: 'rgba(0, 0, 0, 0.01)',
    marginBottom: '16px',
  };

  const atestadoCardStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '12px',
    border: `1px solid ${cardBorder}`,
    transition: 'all 0.2s ease',
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  };

  const statCardStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    padding: '12px',
    textAlign: 'center',
    border: `1px solid ${cardBorder}`,
  };

  const statNumberStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 800,
    color: textPrimary,
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: textSecondary,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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

  const modalContentStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '20px',
    padding: '28px',
    maxWidth: '500px',
    width: '90%',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  };

  if (loadingColabs) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <i
            className="fas fa-spinner fa-spin"
            style={{ fontSize: '40px', color: accentColor }}
          ></i>
          <p style={{ color: textSecondary, marginTop: '16px' }}>
            Carregando colaboradores...
          </p>
        </div>
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

      <div style={mainGridStyle}>
        {/* Sidebar de colaboradores */}
        <div style={sidebarStyle}>
          <div
            style={{
              marginBottom: '12px',
              fontWeight: 700,
              color: textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fas fa-users" style={{ color: accentColor }}></i>
            Colaboradores
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '12px',
                background: 'rgba(0,0,0,0.04)',
                padding: '2px 10px',
                borderRadius: '20px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              {colaboradores.length}
            </span>
          </div>
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou código..."
            style={searchBoxStyle}
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
          <div style={colabListStyle}>
            {filteredColabs.map((colab) => {
              const isSelected = selectedColabId === colab.id;
              return (
                <div
                  key={colab.id}
                  style={colabItemStyle(isSelected)}
                  onClick={() => setSelectedColabId(colab.id)}
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
                  <div style={colabNameStyle}>{colab.nome}</div>
                  <div style={colabDetailStyle}>
                    <i
                      className="fas fa-id-badge"
                      style={{ fontSize: '11px', marginRight: '4px' }}
                    ></i>
                    {colab.codigo} • {colab.cargo}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div style={contentStyle}>
          {!selectedColabId ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: textSecondary,
              }}
            >
              <i
                className="fas fa-folder-open"
                style={{
                  fontSize: '64px',
                  marginBottom: '20px',
                  color: cardBorder,
                }}
              ></i>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>
                Selecione um colaborador
              </p>
              <p style={{ fontSize: '13px' }}>
                Escolha um colaborador na lista ao lado para gerenciar seus
                atestados
              </p>
            </div>
          ) : (
            <>
              <div style={headerStyle}>
                <div>
                  <h2 style={titleStyle}>
                    <i
                      className="fas fa-file-medical"
                      style={{ color: accentColor, marginRight: '8px' }}
                    ></i>
                    Atestados de {colaboradorSelecionado?.nome}
                  </h2>
                  <p style={subtitleStyle}>
                    <i
                      className="fas fa-id-badge"
                      style={{ marginRight: '4px' }}
                    ></i>
                    {colaboradorSelecionado?.codigo} •{' '}
                    {colaboradorSelecionado?.cargo}
                  </p>
                </div>
                <button
                  style={addButtonStyle}
                  onClick={() => setShowForm(!showForm)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${accentGlow}`;
                  }}
                >
                  <i
                    className={`fas ${
                      showForm ? 'fa-times' : 'fa-plus-circle'
                    }`}
                  ></i>
                  {showForm ? 'Cancelar' : 'Novo Atestado'}
                </button>
              </div>

              {/* Cards de estatísticas */}
              {atestados.length > 0 && (
                <div style={statsGridStyle}>
                  <div style={statCardStyle}>
                    <div style={statNumberStyle}>{stats.total}</div>
                    <div style={statLabelStyle}>Total</div>
                  </div>
                  <div style={{ ...statCardStyle, borderColor: '#d97706' }}>
                    <div style={{ ...statNumberStyle, color: '#d97706' }}>
                      {stats.pendentes}
                    </div>
                    <div style={statLabelStyle}>Pendentes</div>
                  </div>
                  <div style={{ ...statCardStyle, borderColor: '#059669' }}>
                    <div style={{ ...statNumberStyle, color: '#059669' }}>
                      {stats.aprovados}
                    </div>
                    <div style={statLabelStyle}>Aprovados</div>
                  </div>
                  <div style={{ ...statCardStyle, borderColor: '#dc2626' }}>
                    <div style={{ ...statNumberStyle, color: '#dc2626' }}>
                      {stats.rejeitados}
                    </div>
                    <div style={statLabelStyle}>Rejeitados</div>
                  </div>
                </div>
              )}

              {/* Formulário */}
              {showForm && (
                <div style={formCardStyle}>
                  <h3
                    style={{
                      marginBottom: '16px',
                      fontSize: '16px',
                      fontWeight: 700,
                      color: textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i
                      className="fas fa-upload"
                      style={{ color: accentColor }}
                    ></i>
                    Enviar novo atestado
                  </h3>
                  <div style={formGridStyle}>
                    <div>
                      <label style={labelStyle}>Data início</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={newAtestado.dataInicio}
                        onChange={(e) =>
                          setNewAtestado({
                            ...newAtestado,
                            dataInicio: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Data fim</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={newAtestado.dataFim}
                        onChange={(e) =>
                          setNewAtestado({
                            ...newAtestado,
                            dataFim: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Motivo / Diagnóstico</label>
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      placeholder="Descreva o motivo do afastamento..."
                      value={newAtestado.motivo}
                      onChange={(e) =>
                        setNewAtestado({
                          ...newAtestado,
                          motivo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div
                    style={fileDropZoneStyle}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) setNewAtestado({ ...newAtestado, anexo: file });
                    }}
                    onDragEnter={(e) => {
                      e.currentTarget.style.borderColor = accentColor;
                      e.currentTarget.style.background =
                        'rgba(16, 185, 129, 0.05)';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = cardBorder;
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.01)';
                    }}
                  >
                    <i
                      className="fas fa-cloud-upload-alt"
                      style={{
                        fontSize: '32px',
                        color: accentColor,
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    ></i>
                    {newAtestado.anexo ? (
                      <span style={{ fontWeight: 600, color: textPrimary }}>
                        <i
                          className="fas fa-file"
                          style={{ color: accentColor }}
                        ></i>{' '}
                        {newAtestado.anexo.name}
                      </span>
                    ) : (
                      <span style={{ color: textSecondary }}>
                        Arraste ou clique para anexar (PDF, imagem)
                      </span>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept=".pdf,.jpg,.png,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      onClick={() => setShowForm(false)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.04)',
                        border: `1px solid ${cardBorder}`,
                        padding: '10px 20px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: textSecondary,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'rgba(0, 0, 0, 0.04)';
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      style={{
                        ...addButtonStyle,
                        opacity: uploading ? 0.7 : 1,
                      }}
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Enviando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i> Enviar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de atestados */}
              {loadingAtest ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i
                    className="fas fa-spinner fa-spin"
                    style={{ fontSize: '24px', color: accentColor }}
                  ></i>
                  <p style={{ color: textSecondary, marginTop: '12px' }}>
                    Carregando atestados...
                  </p>
                </div>
              ) : atestados.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '16px',
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  <i
                    className="fas fa-inbox"
                    style={{
                      fontSize: '48px',
                      color: cardBorder,
                      marginBottom: '16px',
                    }}
                  ></i>
                  <p style={{ color: textSecondary }}>
                    Nenhum atestado enviado ainda.
                  </p>
                  <button
                    style={{ ...addButtonStyle, marginTop: '12px' }}
                    onClick={() => setShowForm(true)}
                  >
                    <i className="fas fa-plus-circle"></i> Enviar primeiro
                    atestado
                  </button>
                </div>
              ) : (
                atestados.map((atest) => {
                  const statusInfo = getStatusInfo(atest.status);
                  return (
                    <div key={atest.id} style={atestadoCardStyle}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: textPrimary }}>
                            <i
                              className="fas fa-calendar-alt"
                              style={{ color: accentColor, marginRight: '8px' }}
                            ></i>
                            {formatDate(atest.data_inicio)} até{' '}
                            {formatDate(atest.data_fim)}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              marginTop: '4px',
                              color: textSecondary,
                            }}
                          >
                            <i
                              className="fas fa-notes-medical"
                              style={{ marginRight: '6px' }}
                            ></i>
                            {atest.motivo}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: textSecondary,
                              marginTop: '4px',
                            }}
                          >
                            <i
                              className="fas fa-clock"
                              style={{ marginRight: '4px' }}
                            ></i>
                            Enviado em {formatDate(atest.created_at)}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <i
                            className={`fas ${statusInfo.icon}`}
                            style={{ marginRight: '4px' }}
                          ></i>
                          {statusInfo.text}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          marginTop: '12px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <a
                          href={atest.anexo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: accentColor,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '13px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          <i className="fas fa-download"></i> Baixar anexo
                        </a>
                        {atest.status === 'pendente' && (
                          <button
                            onClick={() => {
                              setSelectedAtestado(atest);
                              setParecerTexto(atest.parecer || '');
                            }}
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: `1px solid ${accentColor}`,
                              padding: '6px 14px',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              color: accentColor,
                              fontSize: '12px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                'rgba(16, 185, 129, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                'rgba(16, 185, 129, 0.1)';
                            }}
                          >
                            <i className="fas fa-check-circle"></i> Avaliar
                          </button>
                        )}
                      </div>
                      {atest.parecer && (
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            background: 'rgba(0, 0, 0, 0.03)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            border: `1px solid ${cardBorder}`,
                          }}
                        >
                          <strong style={{ color: textPrimary }}>
                            <i
                              className="fas fa-comment"
                              style={{ color: accentColor, marginRight: '6px' }}
                            ></i>
                            Parecer:
                          </strong>
                          <span
                            style={{ color: textSecondary, marginLeft: '4px' }}
                          >
                            {atest.parecer}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de avaliação */}
      {selectedAtestado && (
        <div
          style={modalOverlayStyle}
          onClick={() => setSelectedAtestado(null)}
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                marginBottom: '16px',
                fontWeight: 700,
                color: textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i
                className="fas fa-stethoscope"
                style={{ color: accentColor }}
              ></i>
              Avaliar Atestado
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: textSecondary }}>
                <strong style={{ color: textPrimary }}>Período:</strong>{' '}
                {formatDate(selectedAtestado.data_inicio)} -{' '}
                {formatDate(selectedAtestado.data_fim)}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: textSecondary,
                  marginTop: '4px',
                }}
              >
                <strong style={{ color: textPrimary }}>Motivo:</strong>{' '}
                {selectedAtestado.motivo}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Parecer</label>
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                value={parecerTexto}
                onChange={(e) => setParecerTexto(e.target.value)}
                placeholder="Digite seu parecer sobre o atestado..."
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setSelectedAtestado(null)}
                style={{
                  background: 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${cardBorder}`,
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: textSecondary,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleStatusChange(selectedAtestado.id, 'rejeitado')
                }
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                }}
              >
                <i className="fas fa-times"></i> Rejeitar
              </button>
              <button
                onClick={() =>
                  handleStatusChange(selectedAtestado.id, 'aprovado')
                }
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: `0 4px 12px ${accentGlow}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${accentGlow}`;
                }}
              >
                <i className="fas fa-check"></i> Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
