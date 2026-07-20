// app/RegistroRefeicoesModule.tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// ============================================================
// ÍCONES SVG (versão simplificada)
// ============================================================

const IconUtensils = ({ size = 24, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </svg>
);

const IconCamera = ({ size = 24, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconCheck = ({ size = 24, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconAlertTriangle = ({ size = 24, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </svg>
);

const IconTrash = ({ size = 24, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconClock = ({ size = 24, color = 'currentColor' }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface RegistroRefeicao {
  id: string;
  colaborador_id?: string;
  colaborador_codigo: string;
  colaborador_nome: string;
  funcao: string;
  turno: 'Diurno' | 'Noturno';
  frente_servico: string;
  data_refeicao: string;
  refeicao: string;
  alimentos: string;
  hidratacao_ml: number;
  horario_inicio: string;
  horario_termino: string;
  foto_prato_url: string;
  foto_prato_hash?: string;
  selfie_url?: string;
  dispositivo_id?: string;
  ip_address?: string;
  hash_criptografico?: string;
  status_validacao: 'pendente' | 'aprovado' | 'rejeitado' | 'duvidoso';
  nivel_confianca: number;
  created_at: string;
  is_atrasado?: boolean; // flag para indicar se foi lançado em atraso
  data_original?: string; // data original da refeição (se atrasado)
}

interface RegistroRefeicoesModuleProps {
  styles?: any;
  user: User | null; // usuário do Auth
}

export default function RegistroRefeicoesModule({
  styles = {},
  user,
}: RegistroRefeicoesModuleProps) {
  // ── ESTADOS ──
  const [registros, setRegistros] = useState<RegistroRefeicao[]>([]);
  const [colaboradorInfo, setColaboradorInfo] = useState<{
    codigo: string;
    nome: string;
    cargo: string;
    email: string;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAtrasado, setIsAtrasado] = useState(false); // Flag para lançamento em atraso

  // ── DADOS DO FORMULÁRIO ──
  const [formData, setFormData] = useState({
    data_refeicao: new Date().toISOString().split('T')[0],
    refeicao: 'Almoço',
    alimentos: '',
    hidratacao_ml: 0,
    horario_inicio: '12:00',
    horario_termino: '12:30',
    frente_servico: '',
  });

  // ── DADOS DE RASTREABILIDADE ──
  const [fotoPrato, setFotoPrato] = useState<{
    file: File;
    preview: string;
    hash: string;
  } | null>(null);
  const [selfie, setSelfie] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<{
    id: string;
    model: string;
    os: string;
    app_version: string;
  } | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const refeicoes = ['Café da Manhã', 'Almoço', 'Jantar', 'Ceia'];

  // ── INICIALIZAÇÃO ──
  useEffect(() => {
    // ID único do dispositivo
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId =
        'dev_' +
        Date.now().toString(36) +
        '_' +
        Math.random().toString(36).substring(2, 9);
      localStorage.setItem('device_id', deviceId);
    }

    setDeviceInfo({
      id: deviceId,
      model: navigator.platform || 'Desconhecido',
      os: navigator.userAgent || 'Desconhecido',
      app_version: '1.0.0',
    });

    // Capturar IP
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress('N/I'));

    // Buscar informações do colaborador logado
    if (user) {
      buscarColaboradorPorEmail(user.email || '');
    }
  }, [user]);

  // ── BUSCAR COLABORADOR POR EMAIL ──
  const buscarColaboradorPorEmail = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('codigo, nome, cargo, email')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Erro ao buscar colaborador:', error);
        // Se não encontrar, tenta buscar pelo email do Auth
        if (user?.email) {
          setColaboradorInfo({
            codigo: user.email?.split('@')[0] || 'SEM_CODIGO',
            nome:
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'Usuário',
            cargo: user.user_metadata?.cargo || 'Colaborador',
            email: user.email,
          });
        }
      } else if (data) {
        setColaboradorInfo(data);
        // Preencher frente de serviço com o departamento se existir
        if (data.departamento) {
          setFormData((prev) => ({
            ...prev,
            frente_servico: data.departamento,
          }));
        }
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  // ── CARREGAR REGISTROS DO COLABORADOR ──
  const carregarRegistros = async () => {
    if (!colaboradorInfo?.codigo) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registros_refeicoes')
        .select('*')
        .eq('colaborador_codigo', colaboradorInfo.codigo)
        .order('data_refeicao', { ascending: false })
        .order('horario_inicio', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar registros:', err);
      setError('Erro ao carregar registros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar quando o colaborador for encontrado
  useEffect(() => {
    if (colaboradorInfo?.codigo) {
      carregarRegistros();
    }
  }, [colaboradorInfo]);

  // ── PROCESSAR FOTO ──
  const processarFoto = useCallback((file: File) => {
    return new Promise<{ file: File; preview: string; hash: string }>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const preview = reader.result as string;
            const hashBuffer = await crypto.subtle.digest(
              'SHA-256',
              new TextEncoder().encode(preview.substring(0, 1000))
            );
            const hash = Array.from(new Uint8Array(hashBuffer))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .substring(0, 32);
            resolve({ file, preview, hash });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    );
  }, []);

  // ── UPLOAD FOTO ──
  const uploadFoto = async (file: File, prefix: string): Promise<string> => {
    const fileName = `${prefix}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('refeicoes')
      .upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('refeicoes').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── HASH DE INTEGRIDADE ──
  const gerarHashIntegridade = async (dados: any) => {
    const dataStr = JSON.stringify(dados) + Date.now().toString();
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(dataStr)
    );
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // ── SUBMETER REGISTRO ──
  const handleSubmit = async () => {
    if (!colaboradorInfo) {
      setError('Colaborador não identificado. Faça login novamente.');
      return;
    }

    if (!formData.alimentos) {
      setError('Descreva os alimentos consumidos');
      return;
    }
    if (!fotoPrato) {
      setError('A foto do prato é OBRIGATÓRIA!');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload da foto do prato
      const fotoUrl = await uploadFoto(fotoPrato.file, 'prato');

      let selfieUrl = null;
      if (selfie) {
        selfieUrl = await uploadFoto(selfie.file, 'selfie');
      }

      // Gerar hash
      const hashData = {
        codigo: colaboradorInfo.codigo,
        data: formData.data_refeicao,
        refeicao: formData.refeicao,
        alimentos: formData.alimentos,
        foto_hash: fotoPrato.hash,
      };
      const hash = await gerarHashIntegridade(hashData);

      // Nível de confiança
      let confianca = 0.8;
      if (fotoPrato) confianca += 0.15;
      if (selfie) confianca += 0.05;
      if (!isAtrasado) confianca += 0.05; // bônus por não estar atrasado
      confianca = Math.min(confianca, 0.99);

      const payload = {
        colaborador_id: user?.id || null,
        colaborador_codigo: colaboradorInfo.codigo,
        colaborador_nome: colaboradorInfo.nome,
        funcao: colaboradorInfo.cargo || 'Colaborador',
        turno: 'Diurno', // pode ser adaptado conforme necessidade
        frente_servico: formData.frente_servico || 'Não informada',
        data_refeicao: formData.data_refeicao,
        refeicao: formData.refeicao,
        alimentos: formData.alimentos,
        hidratacao_ml: formData.hidratacao_ml || 0,
        horario_inicio: formData.horario_inicio,
        horario_termino: formData.horario_termino,
        foto_prato_url: fotoUrl,
        foto_prato_hash: fotoPrato.hash,
        selfie_url: selfieUrl,
        dispositivo_id: deviceInfo?.id,
        dispositivo_modelo: deviceInfo?.model,
        dispositivo_os: deviceInfo?.os,
        app_version: deviceInfo?.app_version,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        timestamp_device: new Date().toISOString(),
        timezone_offset: new Date().getTimezoneOffset(),
        hash_criptografico: hash,
        status_validacao: 'pendente',
        nivel_confianca: confianca,
        is_atrasado: isAtrasado,
        data_original: isAtrasado ? formData.data_refeicao : null,
      };

      const { data, error: insertError } = await supabase
        .from('registros_refeicoes')
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        setRegistros([data[0], ...registros]);
      }

      setSuccessMessage(
        isAtrasado
          ? '✅ Refeição em atraso registrada com sucesso! Aguardando validação.'
          : '✅ Refeição registrada com sucesso!'
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      // Reset parcial
      setFormData((prev) => ({
        ...prev,
        alimentos: '',
        hidratacao_ml: 0,
        horario_inicio: '12:00',
        horario_termino: '12:30',
      }));
      setFotoPrato(null);
      setSelfie(null);
      setIsAtrasado(false);

      // Fechar formulário após salvar
      setShowForm(false);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETAR REGISTRO (apenas se for pendente) ──
  const deletarRegistro = async (id: string, status: string) => {
    if (status !== 'pendente') {
      setError('Apenas registros pendentes podem ser excluídos.');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      const { error } = await supabase
        .from('registros_refeicoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setRegistros(registros.filter((r) => r.id !== id));
      setSuccessMessage('Registro excluído!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Erro ao excluir: ' + err.message);
    }
  };

  // ── FILTRO POR DATA ──
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => r.data_refeicao === selectedDate);
  }, [registros, selectedDate]);

  // ── ESTILOS ──
  const stylesObj = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '"Inter", -apple-system, sans-serif',
      ...styles,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap' as const,
      gap: '16px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 800,
      color: '#1a1a1a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    card: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      marginBottom: '24px',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    label: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#6b5f55',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      display: 'block',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,0.08)',
      fontSize: '14px',
      background: 'rgba(0,0,0,0.02)',
      outline: 'none',
      color: '#1a1a1a',
      transition: 'all 0.2s ease',
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,0.08)',
      fontSize: '14px',
      background: 'rgba(0,0,0,0.02)',
      outline: 'none',
      color: '#1a1a1a',
      cursor: 'pointer',
    },
    button: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(16,185,129,0.15)',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    buttonSecondary: {
      background: '#f59e0b',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(245,158,11,0.15)',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    buttonDisabled: {
      background: '#d1d5db',
      color: '#6b7280',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 700,
      cursor: 'not-allowed',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
    },
    buttonDanger: {
      background: '#dc2626',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    statusBadge: (status: string) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 600,
      background:
        status === 'aprovado'
          ? '#e8f5e9'
          : status === 'pendente'
          ? '#fff3e0'
          : status === 'rejeitado'
          ? '#fce4ec'
          : '#f3e8ff',
      color:
        status === 'aprovado'
          ? '#059669'
          : status === 'pendente'
          ? '#d97706'
          : status === 'rejeitado'
          ? '#dc2626'
          : '#7c3aed',
    }),
    uploadArea: {
      border: '2px dashed rgba(0,0,0,0.08)',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    uploadAreaActive: {
      border: '2px dashed #10b981',
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      background: 'rgba(16,185,129,0.05)',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    previewImage: {
      maxWidth: '200px',
      maxHeight: '150px',
      borderRadius: '8px',
      objectFit: 'cover' as const,
      marginTop: '8px',
    },
  };

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <div style={stylesObj.container}>
      {/* HEADER */}
      <div style={stylesObj.header}>
        <div>
          <h1 style={stylesObj.title}>
            <IconUtensils size={28} color="#10b981" />
            Minhas Refeições
          </h1>
          <p style={{ color: '#6b5f55', fontSize: '14px', margin: '4px 0 0' }}>
            {colaboradorInfo?.nome || 'Carregando...'} • Cód:{' '}
            {colaboradorInfo?.codigo || '---'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={isAtrasado ? stylesObj.buttonSecondary : stylesObj.button}
            onClick={() => {
              setIsAtrasado(!isAtrasado);
              if (!showForm) setShowForm(true);
            }}
          >
            {isAtrasado ? (
              <>
                <IconClock size={18} color="white" />
                Lançar Atrasado
              </>
            ) : (
              '+ Novo Registro'
            )}
          </button>
          {!isAtrasado && (
            <button
              style={stylesObj.buttonSecondary}
              onClick={() => {
                setIsAtrasado(true);
                setShowForm(true);
              }}
            >
              <IconClock size={18} color="white" />
              Lançar Atrasado
            </button>
          )}
        </div>
      </div>

      {/* MENSAGENS */}
      {error && (
        <div
          style={{
            background: '#fce4ec',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid #f5c6cb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconAlertTriangle size={18} color="#dc2626" /> {error}
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
            border: '1px solid #c3e6cb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconCheck size={18} color="#059669" /> {successMessage}
        </div>
      )}

      {/* FORMULÁRIO */}
      {showForm && (
        <div style={stylesObj.card}>
          {/* Banner de atrasado */}
          {isAtrasado && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <IconClock size={20} color="#d97706" />
              <span style={{ fontSize: '14px', color: '#92400e' }}>
                <strong>Lançamento em atraso:</strong> Você está registrando uma
                refeição de uma data anterior. Isso será marcado para validação.
              </span>
            </div>
          )}

          <div style={stylesObj.grid2}>
            <div>
              <label style={stylesObj.label}>Data da Refeição</label>
              <input
                type="date"
                style={stylesObj.input}
                value={formData.data_refeicao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    data_refeicao: e.target.value,
                  }))
                }
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label style={stylesObj.label}>Refeição</label>
              <select
                style={stylesObj.select}
                value={formData.refeicao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, refeicao: e.target.value }))
                }
              >
                {refeicoes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={stylesObj.label}>Horário Início</label>
              <input
                type="time"
                style={stylesObj.input}
                value={formData.horario_inicio}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    horario_inicio: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label style={stylesObj.label}>Horário Fim</label>
              <input
                type="time"
                style={stylesObj.input}
                value={formData.horario_termino}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    horario_termino: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Alimentos */}
          <div style={{ marginTop: '16px' }}>
            <label style={stylesObj.label}>
              Alimentos e Bebidas consumidos
            </label>
            <textarea
              style={{
                ...stylesObj.input,
                minHeight: '80px',
                resize: 'vertical' as const,
                fontFamily: 'inherit',
              }}
              value={formData.alimentos}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, alimentos: e.target.value }))
              }
              placeholder="Ex: Arroz, feijão, carne assada, suco de laranja"
            />
          </div>

          {/* Hidratação */}
          <div style={{ marginTop: '16px' }}>
            <label style={stylesObj.label}>Hidratação (mL)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                style={stylesObj.input}
                value={formData.hidratacao_ml}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, hidratacao_ml: val }));
                }}
                placeholder="Ex: 500"
                min="0"
                step="50"
              />
              <span style={{ fontSize: '14px', color: '#6b5f55' }}>mL</span>
            </div>
          </div>

          {/* Frente de Serviço */}
          <div style={{ marginTop: '16px' }}>
            <label style={stylesObj.label}>Frente de Serviço</label>
            <input
              type="text"
              style={stylesObj.input}
              value={formData.frente_servico}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  frente_servico: e.target.value,
                }))
              }
              placeholder="Ex: SANTOS SCOUT"
            />
          </div>

          {/* FOTO DO PRATO (OBRIGATÓRIA) */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ ...stylesObj.label, color: '#dc2626' }}>
              📸 Foto do Prato *OBRIGATÓRIA*
            </label>
            <div
              style={
                fotoPrato ? stylesObj.uploadAreaActive : stylesObj.uploadArea
              }
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  processarFoto(file).then(setFotoPrato);
                }
              }}
            >
              {fotoPrato ? (
                <>
                  <img
                    src={fotoPrato.preview}
                    alt="Prato"
                    style={stylesObj.previewImage}
                  />
                  <span style={{ fontSize: '12px', color: '#059669' }}>
                    ✅ Foto capturada
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFotoPrato(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    Remover
                  </button>
                </>
              ) : (
                <>
                  <IconCamera size={32} color="#10b981" />
                  <span style={{ fontSize: '14px', color: '#6b5f55' }}>
                    Clique ou arraste a foto do prato
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    JPG, PNG (Max 5MB)
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processarFoto(file).then(setFotoPrato);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Selfie (opcional) */}
          <div style={{ marginTop: '16px' }}>
            <label style={stylesObj.label}>
              Selfie do Colaborador (opcional)
            </label>
            <div
              style={selfie ? stylesObj.uploadAreaActive : stylesObj.uploadArea}
              onClick={() => selfieInputRef.current?.click()}
            >
              {selfie ? (
                <>
                  <img
                    src={selfie.preview}
                    alt="Selfie"
                    style={stylesObj.previewImage}
                  />
                  <span style={{ fontSize: '12px', color: '#059669' }}>
                    ✅ Selfie capturada
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelfie(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    Remover
                  </button>
                </>
              ) : (
                <>
                  <IconCamera size={32} color="#8b5cf6" />
                  <span style={{ fontSize: '14px', color: '#6b5f55' }}>
                    Clique para tirar uma selfie (opcional)
                  </span>
                </>
              )}
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () =>
                      setSelfie({ file, preview: reader.result as string });
                    reader.readAsDataURL(file);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Botões */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'transparent',
                color: '#6b5f55',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
              onClick={() => {
                setShowForm(false);
                setIsAtrasado(false);
                setFotoPrato(null);
                setSelfie(null);
              }}
            >
              Cancelar
            </button>
            <button
              style={
                saving
                  ? stylesObj.buttonDisabled
                  : isAtrasado
                  ? stylesObj.buttonSecondary
                  : stylesObj.button
              }
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving
                ? '⏳ Salvando...'
                : isAtrasado
                ? '💾 Salvar Atrasado'
                : '💾 Salvar Registro'}
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE REGISTROS DO COLABORADOR */}
      <div style={stylesObj.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Meus Registros
          </h3>
          <input
            type="date"
            style={stylesObj.input}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            ⏳ Carregando...
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px', color: '#6b5f55' }}
          >
            <span
              style={{
                fontSize: '48px',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              🍽️
            </span>
            <p>Nenhum registro de refeição para este dia</p>
            <button style={stylesObj.button} onClick={() => setShowForm(true)}>
              + Adicionar Refeição
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Data
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Refeição
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Horário
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Alimentos
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Foto
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Atrasado
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: '#6b5f55',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((reg) => (
                  <tr
                    key={reg.id}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {new Date(reg.data_refeicao).toLocaleDateString(
                          'pt-BR'
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#1a1a1a' }}>
                      {reg.refeicao}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b5f55' }}>
                      {reg.horario_inicio} - {reg.horario_termino}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#6b5f55',
                        maxWidth: '200px',
                        whiteSpace: 'normal',
                      }}
                    >
                      {reg.alimentos.length > 50
                        ? reg.alimentos.substring(0, 50) + '...'
                        : reg.alimentos}
                      {reg.hidratacao_ml > 0 && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#10b981',
                            display: 'block',
                          }}
                        >
                          💧 {reg.hidratacao_ml} mL
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <a
                        href={reg.foto_prato_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#10b981' }}
                      >
                        <IconCamera size={20} color="#10b981" />
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={stylesObj.statusBadge(reg.status_validacao)}>
                        {reg.status_validacao === 'aprovado'
                          ? '✅ Aprovado'
                          : reg.status_validacao === 'pendente'
                          ? '⏳ Pendente'
                          : reg.status_validacao === 'rejeitado'
                          ? '❌ Rejeitado'
                          : '⚠️ Duvidoso'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {(reg as any).is_atrasado ? (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#d97706',
                            fontWeight: 600,
                          }}
                        >
                          <IconClock size={14} color="#d97706" /> Sim
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#059669' }}>
                          Não
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {reg.status_validacao === 'pendente' && (
                        <button
                          style={stylesObj.buttonDanger}
                          onClick={() =>
                            deletarRegistro(reg.id, reg.status_validacao)
                          }
                        >
                          <IconTrash size={14} color="white" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
