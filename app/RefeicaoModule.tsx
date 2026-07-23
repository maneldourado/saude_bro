// app/RefeicaoModule.tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// ============================================================
// ÍCONES SVG - COMPONENTES REUTILIZÁVEIS
// ============================================================
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const Icon = ({
  component: Component,
  size = 24,
  color = 'currentColor',
  className = '',
}: any) => <Component size={size} color={color} className={className} />;

const IconUtensils = ({ size = 24, color = 'currentColor' }: IconProps) => (
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

const IconCamera = ({ size = 24, color = 'currentColor' }: IconProps) => (
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

const IconCheck = ({ size = 24, color = 'currentColor' }: IconProps) => (
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

const IconAlertTriangle = ({
  size = 24,
  color = 'currentColor',
}: IconProps) => (
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

const IconTrash = ({ size = 24, color = 'currentColor' }: IconProps) => (
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

const IconClock = ({ size = 24, color = 'currentColor' }: IconProps) => (
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

const IconUser = ({ size = 24, color = 'currentColor' }: IconProps) => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconShip = ({ size = 24, color = 'currentColor' }: IconProps) => (
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
    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 21v-8l2-2h16l2 2v8" />
    <path d="M4 11V6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v5" />
    <path d="M8 4l-1 3h10l-1-3" />
  </svg>
);

const IconWeight = ({ size = 24, color = 'currentColor' }: IconProps) => (
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
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconLogout = ({ size = 24, color = 'currentColor' }: IconProps) => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ============================================================
// SISTEMA DE DESIGN - PALETA DE CORES E TOKENS
// ============================================================
const COLORS = {
  primary: '#10b981',
  primaryDark: '#059669',
  secondary: '#f59e0b',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#059669',
  background: '#ffffff',
  surface: '#f8fafc',
  border: 'rgba(0,0,0,0.08)',
  text: {
    primary: '#1a1a1a',
    secondary: '#6b5f55',
    muted: '#9ca3af',
  },
};

const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
};

const RADIUS = {
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
};

const SHADOWS = {
  sm: '0 2px 8px rgba(0,0,0,0.06)',
  md: '0 4px 15px rgba(0,0,0,0.1)',
  lg: '0 8px 24px rgba(0,0,0,0.12)',
};

// ============================================================
// COMPONENTES REUTILIZÁVEIS
// ============================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Card = ({ children, className = '', style = {} }: CardProps) => (
  <div
    style={{
      background: COLORS.background,
      borderRadius:
        COLORS.border === 'rgba(0,0,0,0.08)' ? RADIUS.lg : RADIUS.lg,
      padding: SPACING.xxl,
      border: `1px solid ${COLORS.border}`,
      boxShadow: SHADOWS.sm,
      marginBottom: SPACING.xxl,
      ...style,
    }}
    className={className}
  >
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'md',
  icon,
  className = '',
  style = {},
}: ButtonProps) => {
  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
      color: 'white',
      boxShadow: `0 4px 15px rgba(16,185,129,0.15)`,
    },
    secondary: {
      background: COLORS.secondary,
      color: 'white',
      boxShadow: `0 4px 15px rgba(245,158,11,0.15)`,
    },
    danger: {
      background: COLORS.danger,
      color: 'white',
    },
    ghost: {
      background: 'transparent',
      color: COLORS.text.secondary,
      border: `1px solid ${COLORS.border}`,
    },
  };

  const sizeStyles = {
    sm: { padding: `${SPACING.sm} ${SPACING.md}`, fontSize: '12px' },
    md: { padding: `${SPACING.md} ${SPACING.xl}`, fontSize: '14px' },
    lg: { padding: `${SPACING.lg} ${SPACING.xxl}`, fontSize: '16px' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none',
        borderRadius: RADIUS.lg,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.md,
        opacity: disabled ? 0.6 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      className={className}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

interface BadgeProps {
  status: 'aprovado' | 'pendente' | 'rejeitado' | 'duvidoso';
  children: React.ReactNode;
}

const Badge = ({ status, children }: BadgeProps) => {
  const statusStyles = {
    aprovado: { background: '#e8f5e9', color: COLORS.success },
    pendente: { background: '#fff3e0', color: COLORS.warning },
    rejeitado: { background: '#fce4ec', color: COLORS.danger },
    duvidoso: { background: '#f3e8ff', color: '#7c3aed' },
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: `${SPACING.sm} ${SPACING.md}`,
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        ...statusStyles[status],
      }}
    >
      {children}
    </span>
  );
};

interface AlertProps {
  type: 'success' | 'error' | 'warning';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Alert = ({ type, children, icon }: AlertProps) => {
  const typeStyles = {
    success: {
      background: '#e8f5e9',
      color: COLORS.success,
      borderColor: '#c3e6cb',
    },
    error: {
      background: '#fce4ec',
      color: COLORS.danger,
      borderColor: '#f5c6cb',
    },
    warning: {
      background: '#fef3c7',
      color: COLORS.warning,
      borderColor: '#fde68a',
    },
  };

  return (
    <div
      style={{
        padding: `${SPACING.md} ${SPACING.lg}`,
        borderRadius: RADIUS.lg,
        border: `1px solid`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
        ...typeStyles[type],
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </div>
  );
};

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard = ({
  value,
  label,
  icon,
  color = COLORS.primary,
}: StatCardProps) => (
  <div
    style={{
      background: COLORS.background,
      padding: SPACING.lg,
      borderRadius: RADIUS.lg,
      border: `1px solid ${COLORS.border}`,
      textAlign: 'center',
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = SHADOWS.md;
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    {icon && <div style={{ marginBottom: SPACING.md }}>{icon}</div>}
    <div
      style={{
        fontSize: '24px',
        fontWeight: 700,
        color,
        marginBottom: SPACING.sm,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: '12px', color: COLORS.text.secondary }}>
      {label}
    </div>
  </div>
);

interface ProfileCardProps {
  name: string;
  codigo: string;
  cargo: string;
  email: string;
  onLogout?: () => void;
}

const ProfileCard = ({
  name,
  codigo,
  cargo,
  email,
  onLogout,
}: ProfileCardProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xl,
      padding: SPACING.lg,
      background: COLORS.surface,
      borderRadius: RADIUS.xl,
      border: `1px solid ${COLORS.border}`,
      marginBottom: SPACING.xxl,
      flexWrap: 'wrap',
    }}
  >
    <div
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
    <div style={{ flex: 1, minWidth: '200px' }}>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 700,
          margin: 0,
          color: COLORS.text.primary,
        }}
      >
        {name}
      </h2>
      <div
        style={{
          display: 'flex',
          gap: SPACING.xl,
          flexWrap: 'wrap',
          fontSize: '14px',
          color: COLORS.text.secondary,
          marginTop: SPACING.md,
        }}
      >
        <span>
          <strong style={{ color: COLORS.text.primary }}>Código:</strong>{' '}
          {codigo}
        </span>
        <span>
          <strong style={{ color: COLORS.text.primary }}>Cargo:</strong>{' '}
          {cargo || 'Não definido'}
        </span>
        <span>
          <strong style={{ color: COLORS.text.primary }}>Email:</strong> {email}
        </span>
      </div>
    </div>
    {onLogout && (
      <Button
        variant="ghost"
        size="md"
        onClick={onLogout}
        icon={<IconLogout size={18} color={COLORS.danger} />}
        style={{ color: COLORS.danger, borderColor: COLORS.danger }}
      >
        Sair
      </Button>
    )}
  </div>
);

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  preview?: string;
  onRemove?: () => void;
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

const UploadArea = ({
  onFileSelect,
  preview,
  onRemove,
  label,
  required = false,
  icon,
  color = COLORS.primary,
}: UploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  return (
    <div style={{ marginTop: SPACING.lg }}>
      <label
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: COLORS.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'block',
          marginBottom: SPACING.md,
        }}
      >
        {icon && <span style={{ marginRight: SPACING.sm }}>{icon}</span>}
        {label}
        {required && (
          <span style={{ color: COLORS.danger }}> *OBRIGATÓRIA</span>
        )}
      </label>
      <div
        style={{
          border: `2px dashed ${
            isDragActive || preview ? color : COLORS.border
          }`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.md,
          background:
            isDragActive || preview
              ? `rgba(16, 185, 129, 0.05)`
              : 'transparent',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '150px',
                borderRadius: RADIUS.md,
                objectFit: 'cover',
              }}
            />
            <span style={{ fontSize: '12px', color: COLORS.success }}>
              ✅ Foto capturada
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: COLORS.danger,
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
            {icon || <IconCamera size={32} color={color} />}
            <span style={{ fontSize: '14px', color: COLORS.text.secondary }}>
              Clique ou arraste a foto
            </span>
            <span style={{ fontSize: '12px', color: COLORS.text.muted }}>
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
            if (file) onFileSelect(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};

// ============================================================
// INTERFACES
// ============================================================
interface RegistroRefeicao {
  id: string;
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
  is_atrasado?: boolean;
  data_original?: string;
}

interface Embarque {
  id: string;
  data_exame: string;
  frente_servico: string;
  cargo: string;
  status: string;
  imc: number;
}

interface ImcRecente {
  peso: number;
  altura: number;
  imc: number;
  data: string;
  status: string;
}

interface RefeicaoModuleProps {
  styles?: any;
  user: User | null;
  isRestricted?: boolean;
  colaboradorNome?: string;
  colaboradorCargo?: string;
  onLogout?: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function RefeicaoModule({
  styles = {},
  user,
  isRestricted = false,
  colaboradorNome = '',
  colaboradorCargo = '',
  onLogout,
}: RefeicaoModuleProps) {
  const [colaboradorInfo, setColaboradorInfo] = useState<{
    codigo: string;
    nome: string;
    cargo: string;
    email: string;
  } | null>(null);
  const [registros, setRegistros] = useState<RegistroRefeicao[]>([]);
  const [embarques, setEmbarques] = useState<Embarque[]>([]);
  const [imcRecente, setImcRecente] = useState<ImcRecente | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAtrasado, setIsAtrasado] = useState(false);

  const [formData, setFormData] = useState({
    data_refeicao: new Date().toISOString().split('T')[0],
    refeicao: 'Almoço',
    alimentos: '',
    hidratacao_ml: 0,
    horario_inicio: '12:00',
    horario_termino: '12:30',
    frente_servico: '',
  });

  const [fotoPrato, setFotoPrato] = useState<{
    file: File;
    preview: string;
    hash: string;
  } | null>(null);
  const [selfie, setSelfie] = useState<{ file: File; preview: string } | null>(
    null
  );
  const [deviceInfo, setDeviceInfo] = useState<{
    id: string;
    model: string;
    os: string;
    app_version: string;
  } | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const refeicoes = ['Café da Manhã', 'Almoço', 'Jantar', 'Ceia'];

  // ── INICIALIZAÇÃO ──
  useEffect(() => {
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
    fetch('https://api.ipify.org?format=json')
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress('N/I'));
    if (user) {
      buscarColaboradorPorEmail(user.email || '');
    }
  }, [user]);

  // ── BUSCAR COLABORADOR ──
  const buscarColaboradorPorEmail = async (email: string) => {
    if (!email) {
      setError('Email do usuário não encontrado');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('codigo, nome, cargo, email, departamento')
        .eq('email', email)
        .maybeSingle();

      if (data) {
        const info = {
          codigo: data.codigo || email.split('@')[0].toUpperCase(),
          nome: data.nome || user?.user_metadata?.name || email.split('@')[0],
          cargo: data.cargo || user?.user_metadata?.cargo || 'Colaborador',
          email: data.email || email,
        };
        setColaboradorInfo(info);
        if (data.departamento) {
          setFormData((prev) => ({
            ...prev,
            frente_servico: data.departamento,
          }));
        }
        carregarDadosColaborador(info.codigo);
        return;
      }

      const codigo = email.split('@')[0].toUpperCase();
      const nome = user?.user_metadata?.name || email.split('@')[0];
      const cargo = user?.user_metadata?.cargo || 'Colaborador';

      const { data: novoColaborador, error: insertError } = await supabase
        .from('colaboradores')
        .insert([
          { codigo, nome, email, cargo, modulos_permitidos: ['refeicao'] },
        ])
        .select()
        .maybeSingle();

      if (novoColaborador) {
        const info = {
          codigo: novoColaborador.codigo,
          nome: novoColaborador.nome,
          cargo: novoColaborador.cargo || 'Colaborador',
          email: novoColaborador.email,
        };
        setColaboradorInfo(info);
        carregarDadosColaborador(info.codigo);
        return;
      }

      setColaboradorInfo({ codigo, nome, cargo, email });
      carregarDadosColaborador(codigo);
    } catch (err) {
      console.error('Erro ao buscar colaborador:', err);
      if (user?.email) {
        const codigo = user.email.split('@')[0].toUpperCase();
        setColaboradorInfo({
          codigo,
          nome: user.user_metadata?.name || user.email.split('@')[0],
          cargo: user.user_metadata?.cargo || 'Colaborador',
          email: user.email,
        });
        carregarDadosColaborador(codigo);
      } else {
        setError('Não foi possível identificar o colaborador');
      }
    }
  };

  // ── CARREGAR DADOS ──
  const carregarDadosColaborador = async (codigo: string) => {
    setLoading(true);
    try {
      // REFEIÇÕES
      const { data: refeicoesData, error: refeicoesError } = await supabase
        .from('registros_refeicoes')
        .select('*')
        .eq('colaborador_codigo', codigo)
        .order('data_refeicao', { ascending: false })
        .order('horario_inicio', { ascending: false });

      if (!refeicoesError && refeicoesData) {
        setRegistros(refeicoesData);
      }

      // IMC
      const { data: imcData, error: imcError } = await supabase
        .from('imc_records')
        .select('peso, altura, data_raw, data_str')
        .eq('codigo', codigo)
        .order('data_raw', { ascending: false })
        .limit(1);

      if (!imcError && imcData && imcData.length > 0) {
        const record = imcData[0];
        const alturaM = record.altura > 3 ? record.altura / 100 : record.altura;
        const imc = alturaM > 0 ? record.peso / (alturaM * alturaM) : 0;
        let status = 'Não informado';
        if (imc > 0) {
          if (imc < 18.5) status = 'Abaixo do peso';
          else if (imc < 25) status = 'Peso normal';
          else if (imc < 30) status = 'Sobrepeso';
          else if (imc < 35) status = 'Obesidade grau I';
          else if (imc < 40) status = 'Obesidade grau II';
          else status = 'Obesidade grau III';
        }
        setImcRecente({
          peso: record.peso,
          altura: record.altura,
          imc,
          data:
            record.data_str ||
            new Date(record.data_raw).toLocaleDateString('pt-BR'),
          status,
        });
      } else {
        setImcRecente(null);
      }

      // EMBARQUES
      const { data: embarquesData, error: embarquesError } = await supabase
        .from('pre_embarque')
        .select('id, data_exame, frente_servico, cargo, status, peso, altura')
        .eq('colaborador_codigo', codigo)
        .order('data_exame', { ascending: false });

      if (!embarquesError && embarquesData) {
        const embarquesFormatados = embarquesData.map((e: any) => {
          const alturaM = e.altura > 3 ? e.altura / 100 : e.altura;
          const imc = alturaM > 0 ? e.peso / (alturaM * alturaM) : 0;
          return {
            id: e.id,
            data_exame: e.data_exame,
            frente_servico: e.frente_servico || '-',
            cargo: e.cargo || '-',
            status: e.status || 'Pendente',
            imc,
          };
        });
        setEmbarques(embarquesFormatados);
      } else {
        setEmbarques([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

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
              .join('');
            resolve({ file, preview, hash });
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsDataURL(file);
      }
    );
  }, []);

  // ── UPLOAD ──
  const uploadFoto = async (file: File, tipo: 'prato' | 'selfie') => {
    const fileName = `${tipo}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const { error } = await supabase.storage
      .from('refeicoes')
      .upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('refeicoes').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── HASH ──
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

  // ── SUBMETER ──
  const handleSubmit = async () => {
    if (!colaboradorInfo) {
      setError('Colaborador não identificado.');
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
      const fotoUrl = await uploadFoto(fotoPrato.file, 'prato');
      let selfieUrl = null;
      if (selfie) {
        selfieUrl = await uploadFoto(selfie.file, 'selfie');
      }

      const hashData = {
        codigo: colaboradorInfo.codigo,
        data: formData.data_refeicao,
        refeicao: formData.refeicao,
        alimentos: formData.alimentos,
        foto_hash: fotoPrato.hash,
      };
      const hash = await gerarHashIntegridade(hashData);

      let confianca = 0.8;
      if (fotoPrato) confianca += 0.15;
      if (selfie) confianca += 0.05;
      if (!isAtrasado) confianca += 0.05;
      confianca = Math.min(confianca, 0.99);

      const payload = {
        colaborador_codigo: colaboradorInfo.codigo,
        colaborador_nome: colaboradorInfo.nome,
        funcao: colaboradorInfo.cargo || 'Colaborador',
        turno: 'Diurno',
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
          ? '✅ Refeição em atraso registrada! Aguardando validação.'
          : '✅ Refeição registrada com sucesso!'
      );
      setTimeout(() => setSuccessMessage(null), 4000);

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
      setShowForm(false);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETAR ──
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

  // ── FILTRO ──
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => r.data_refeicao === selectedDate);
  }, [registros, selectedDate]);

  // ── RENDER ──
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: SPACING.xxl * 2 }}>
        <div style={{ fontSize: '32px', marginBottom: SPACING.lg }}>⏳</div>
        <p style={{ color: COLORS.text.secondary }}>Carregando dados...</p>
      </div>
    );
  }

  if (!colaboradorInfo) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: SPACING.xxl * 2,
          color: COLORS.danger,
        }}
      >
        <IconAlertTriangle size={40} color={COLORS.danger} />
        <p>Colaborador não encontrado. Faça login novamente.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: isRestricted ? '0' : SPACING.xxl,
        maxWidth: isRestricted ? '1200px' : '100%',
        margin: '0 auto',
        fontFamily: '"Inter", -apple-system, sans-serif',
        ...styles,
      }}
    >
      {/* ── PERFIL ── */}
      {isRestricted && (
        <ProfileCard
          name={colaboradorInfo.nome}
          codigo={colaboradorInfo.codigo}
          cargo={colaboradorInfo.cargo}
          email={colaboradorInfo.email}
          onLogout={onLogout}
        />
      )}

      {/* ── CABEÇALHO ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xxl,
          flexWrap: 'wrap',
          gap: SPACING.lg,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: COLORS.text.primary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <IconUtensils size={28} color={COLORS.primary} />
            {isRestricted ? 'Minhas Refeições' : 'Controle de Refeição'}
          </h1>
          {!isRestricted && (
            <p
              style={{
                color: COLORS.text.secondary,
                fontSize: '14px',
                margin: `${SPACING.md} 0 0`,
              }}
            >
              {colaboradorInfo.nome} • Cód: {colaboradorInfo.codigo}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
          <Button
            variant={isAtrasado ? 'secondary' : 'primary'}
            size="md"
            onClick={() => {
              setIsAtrasado(!isAtrasado);
              if (!showForm) setShowForm(true);
            }}
            icon={<IconClock size={18} />}
          >
            {isAtrasado ? 'Lançar Atrasado' : '+ Novo Registro'}
          </Button>
          {!isAtrasado && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setIsAtrasado(true);
                setShowForm(true);
              }}
              icon={<IconClock size={18} />}
            >
              Lançar Atrasado
            </Button>
          )}
        </div>
      </div>

      {/* ── ESTATÍSTICAS ── */}
      {isRestricted && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: SPACING.lg,
            marginBottom: SPACING.xxl,
          }}
        >
          <StatCard
            value={registros.length}
            label="Total de Refeições"
            icon={<IconUtensils size={24} color={COLORS.primary} />}
          />
          <StatCard
            value={
              registros.filter((r) => r.status_validacao === 'aprovado').length
            }
            label="Aprovadas"
            icon={<IconCheck size={24} color={COLORS.success} />}
            color={COLORS.success}
          />
          <StatCard
            value={
              registros.filter((r) => r.status_validacao === 'pendente').length
            }
            label="Pendentes"
            icon={<IconClock size={24} color={COLORS.warning} />}
            color={COLORS.warning}
          />
        </div>
      )}

      {/* ── IMC ── */}
      {isRestricted && imcRecente && imcRecente.imc > 0 && (
        <Card style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
          >
            <IconWeight size={24} color={COLORS.primary} />
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: COLORS.text.primary,
                }}
              >
                Último IMC - {imcRecente.data}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: COLORS.primary,
                }}
              >
                {imcRecente.imc.toFixed(1)}
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: COLORS.text.secondary,
                    marginLeft: SPACING.md,
                  }}
                >
                  ({imcRecente.status}) • {imcRecente.peso}kg /{' '}
                  {imcRecente.altura}cm
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isRestricted && !imcRecente && (
        <Card
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
          >
            <IconWeight size={24} color="#94a3b8" />
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: COLORS.text.primary,
                }}
              >
                IMC
              </div>
              <div style={{ fontSize: '14px', color: COLORS.text.secondary }}>
                Nenhum registro de IMC encontrado
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── EMBARQUES ── */}
      {isRestricted && embarques.length > 0 && (
        <Card>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              margin: `0 0 ${SPACING.lg} 0`,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <IconShip size={20} color={COLORS.primary} />
            Histórico de Embarques
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                  {['Data', 'Frente', 'Cargo', 'IMC', 'Status'].map(
                    (header) => (
                      <th
                        key={header}
                        style={{
                          padding: `${SPACING.md} ${SPACING.md}`,
                          textAlign:
                            header === 'IMC' || header === 'Status'
                              ? 'center'
                              : 'left',
                          fontWeight: 700,
                          color: COLORS.text.secondary,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {embarques.map((e) => (
                  <tr
                    key={e.id}
                    style={{ borderBottom: `1px solid ${COLORS.border}` }}
                  >
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.primary,
                      }}
                    >
                      {new Date(e.data_exame).toLocaleDateString('pt-BR')}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.secondary,
                      }}
                    >
                      {e.frente_servico}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.secondary,
                      }}
                    >
                      {e.cargo}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: e.imc > 25 ? COLORS.danger : COLORS.success,
                      }}
                    >
                      {e.imc ? e.imc.toFixed(1) : '-'}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: 'center',
                      }}
                    >
                      <Badge status={e.status as any}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isRestricted && embarques.length === 0 && (
        <Card
          style={{ background: COLORS.surface, borderColor: COLORS.border }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
          >
            <IconShip size={24} color="#94a3b8" />
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: COLORS.text.primary,
                }}
              >
                Histórico de Embarques
              </div>
              <div style={{ fontSize: '14px', color: COLORS.text.secondary }}>
                Nenhum embarque registrado
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── MENSAGENS ── */}
      {error && (
        <Alert
          type="error"
          icon={<IconAlertTriangle size={18} color={COLORS.danger} />}
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          type="success"
          icon={<IconCheck size={18} color={COLORS.success} />}
        >
          {successMessage}
        </Alert>
      )}

      {/* ── FORMULÁRIO ── */}
      {showForm && (
        <Card>
          {isAtrasado && (
            <Alert
              type="warning"
              icon={<IconClock size={20} color={COLORS.warning} />}
            >
              <strong>Lançamento em atraso:</strong> Você está registrando uma
              refeição de uma data anterior. Isso será marcado para validação.
            </Alert>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: SPACING.lg,
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: SPACING.md,
                }}
              >
                Data da Refeição
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: `${SPACING.md} ${SPACING.md}`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                  background: `rgba(0,0,0,0.02)`,
                  outline: 'none',
                  color: COLORS.text.primary,
                  transition: 'all 0.2s ease',
                }}
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
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: SPACING.md,
                }}
              >
                Refeição
              </label>
              <select
                style={{
                  width: '100%',
                  padding: `${SPACING.md} ${SPACING.md}`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                  background: `rgba(0,0,0,0.02)`,
                  outline: 'none',
                  color: COLORS.text.primary,
                  cursor: 'pointer',
                }}
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
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: SPACING.md,
                }}
              >
                Horário Início
              </label>
              <input
                type="time"
                style={{
                  width: '100%',
                  padding: `${SPACING.md} ${SPACING.md}`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                  background: `rgba(0,0,0,0.02)`,
                  outline: 'none',
                  color: COLORS.text.primary,
                  transition: 'all 0.2s ease',
                }}
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
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: COLORS.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: SPACING.md,
                }}
              >
                Horário Fim
              </label>
              <input
                type="time"
                style={{
                  width: '100%',
                  padding: `${SPACING.md} ${SPACING.md}`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                  background: `rgba(0,0,0,0.02)`,
                  outline: 'none',
                  color: COLORS.text.primary,
                  transition: 'all 0.2s ease',
                }}
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

          <div style={{ marginTop: SPACING.lg }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: COLORS.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: SPACING.md,
              }}
            >
              Alimentos e Bebidas consumidos
            </label>
            <textarea
              style={{
                width: '100%',
                padding: `${SPACING.md} ${SPACING.md}`,
                borderRadius: RADIUS.md,
                border: `1px solid ${COLORS.border}`,
                fontSize: '14px',
                background: `rgba(0,0,0,0.02)`,
                outline: 'none',
                color: COLORS.text.primary,
                transition: 'all 0.2s ease',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              value={formData.alimentos}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  alimentos: e.target.value,
                }))
              }
              placeholder="Ex: Arroz, feijão, carne assada, suco de laranja"
            />
          </div>

          <div style={{ marginTop: SPACING.lg }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: COLORS.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: SPACING.md,
              }}
            >
              Hidratação (mL)
            </label>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
            >
              <input
                type="number"
                style={{
                  width: '100%',
                  padding: `${SPACING.md} ${SPACING.md}`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                  background: `rgba(0,0,0,0.02)`,
                  outline: 'none',
                  color: COLORS.text.primary,
                  transition: 'all 0.2s ease',
                }}
                value={formData.hidratacao_ml}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, hidratacao_ml: val }));
                }}
                placeholder="Ex: 500"
                min="0"
                step="50"
              />
              <span
                style={{
                  fontSize: '14px',
                  color: COLORS.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                mL
              </span>
            </div>
          </div>

          <div style={{ marginTop: SPACING.lg }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: COLORS.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: SPACING.md,
              }}
            >
              Frente de Serviço
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: `${SPACING.md} ${SPACING.md}`,
                borderRadius: RADIUS.md,
                border: `1px solid ${COLORS.border}`,
                fontSize: '14px',
                background: `rgba(0,0,0,0.02)`,
                outline: 'none',
                color: COLORS.text.primary,
                transition: 'all 0.2s ease',
              }}
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

          {/* FOTO DO PRATO */}
          <UploadArea
            label="Foto do Prato"
            required
            icon={<IconCamera size={32} color={COLORS.primary} />}
            preview={fotoPrato?.preview}
            onFileSelect={(file) => processarFoto(file).then(setFotoPrato)}
            onRemove={() => setFotoPrato(null)}
            color={COLORS.primary}
          />

          {/* SELFIE */}
          <UploadArea
            label="Selfie do Colaborador (opcional)"
            icon={<IconCamera size={32} color="#8b5cf6" />}
            preview={selfie?.preview}
            onFileSelect={(file) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                setSelfie({ file, preview: reader.result as string });
              reader.readAsDataURL(file);
            }}
            onRemove={() => setSelfie(null)}
            color="#8b5cf6"
          />

          {/* BOTÕES */}
          <div
            style={{
              marginTop: SPACING.xl,
              paddingTop: SPACING.lg,
              borderTop: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setShowForm(false);
                setIsAtrasado(false);
                setFotoPrato(null);
                setSelfie(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={isAtrasado ? 'secondary' : 'primary'}
              size="md"
              onClick={handleSubmit}
              disabled={saving}
              icon={saving ? '⏳' : '💾'}
            >
              {saving
                ? 'Salvando...'
                : isAtrasado
                ? 'Salvar Atrasado'
                : 'Salvar Registro'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── LISTA DE REGISTROS ── */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg,
            flexWrap: 'wrap',
            gap: SPACING.md,
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: COLORS.text.primary,
              margin: 0,
            }}
          >
            {isRestricted ? 'Meus Registros' : 'Registros do Dia'}
          </h3>
          <input
            type="date"
            style={{
              width: '100%',
              maxWidth: '200px',
              padding: `${SPACING.md} ${SPACING.md}`,
              borderRadius: RADIUS.md,
              border: `1px solid ${COLORS.border}`,
              fontSize: '14px',
              background: `rgba(0,0,0,0.02)`,
              outline: 'none',
              color: COLORS.text.primary,
              transition: 'all 0.2s ease',
            }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {registrosFiltrados.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: SPACING.xxl * 2,
              color: COLORS.text.secondary,
            }}
          >
            <span
              style={{
                fontSize: '48px',
                display: 'block',
                marginBottom: SPACING.md,
              }}
            >
              🍽️
            </span>
            <p>Nenhum registro de refeição para este dia</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowForm(true)}
            >
              + Adicionar Refeição
            </Button>
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
                <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                  {[
                    'Data',
                    'Refeição',
                    'Horário',
                    'Alimentos',
                    'Foto',
                    'Status',
                    'Atrasado',
                    'Ações',
                  ].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: [
                          'Foto',
                          'Status',
                          'Atrasado',
                          'Ações',
                        ].includes(header)
                          ? 'center'
                          : 'left',
                        fontWeight: 700,
                        color: COLORS.text.secondary,
                        fontSize: '11px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((reg) => (
                  <tr
                    key={reg.id}
                    style={{ borderBottom: `1px solid ${COLORS.border}` }}
                  >
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.primary,
                      }}
                    >
                      {new Date(reg.data_refeicao).toLocaleDateString('pt-BR')}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.primary,
                      }}
                    >
                      {reg.refeicao}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.secondary,
                      }}
                    >
                      {reg.horario_inicio} - {reg.horario_termino}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        color: COLORS.text.secondary,
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
                            color: COLORS.primary,
                            display: 'block',
                          }}
                        >
                          💧 {reg.hidratacao_ml} mL
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: 'center',
                      }}
                    >
                      <a
                        href={reg.foto_prato_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: COLORS.primary }}
                      >
                        <IconCamera size={20} color={COLORS.primary} />
                      </a>
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: 'center',
                      }}
                    >
                      <Badge
                        status={
                          reg.status_validacao as
                            | 'aprovado'
                            | 'pendente'
                            | 'rejeitado'
                            | 'duvidoso'
                        }
                      >
                        {reg.status_validacao === 'aprovado'
                          ? '✅ Aprovado'
                          : reg.status_validacao === 'pendente'
                          ? '⏳ Pendente'
                          : reg.status_validacao === 'rejeitado'
                          ? '❌ Rejeitado'
                          : '⚠️ Duvidoso'}
                      </Badge>
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: 'center',
                      }}
                    >
                      {reg.is_atrasado ? (
                        <span
                          style={{
                            fontSize: '11px',
                            color: COLORS.warning,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: SPACING.sm,
                          }}
                        >
                          <IconClock size={14} color={COLORS.warning} /> Sim
                        </span>
                      ) : (
                        <span
                          style={{ fontSize: '11px', color: COLORS.success }}
                        >
                          Não
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: `${SPACING.md} ${SPACING.md}`,
                        textAlign: 'center',
                      }}
                    >
                      {reg.status_validacao === 'pendente' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            deletarRegistro(reg.id, reg.status_validacao)
                          }
                          icon={<IconTrash size={14} />}
                        >
                          Deletar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
