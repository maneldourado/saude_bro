// app/RefeicaoModule.tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

// ============================================================
// SISTEMA DE DESIGN - TOKENS E PALETA MODERNA
// ============================================================
const THEME = {
  colors: {
    primary: {
      light: '#34d399',
      main: '#10b981',
      dark: '#059669',
      soft: 'rgba(16, 185, 129, 0.1)',
    },
    secondary: {
      light: '#fbbf24',
      main: '#f59e0b',
      dark: '#d97706',
      soft: 'rgba(245, 158, 11, 0.1)',
    },
    danger: {
      light: '#f87171',
      main: '#ef4444',
      dark: '#dc2626',
      soft: 'rgba(239, 68, 68, 0.1)',
    },
    info: {
      light: '#60a5fa',
      main: '#3b82f6',
      dark: '#2563eb',
      soft: 'rgba(59, 130, 246, 0.1)',
    },
    warning: {
      light: '#fb923c',
      main: '#f97316',
      dark: '#ea580c',
      soft: 'rgba(249, 115, 22, 0.1)',
    },
    success: {
      light: '#4ade80',
      main: '#22c55e',
      dark: '#16a34a',
      soft: 'rgba(34, 197, 94, 0.1)',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    white: '#ffffff',
    black: '#000000',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  fonts: {
    sans: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }
};

// ============================================================
// ÍCONES SVG (LUCIDE-STYLE)
// ============================================================
interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const Icon = ({ children, size = 24, color = 'currentColor', strokeWidth = 2, className = '' }: IconProps & { children: React.ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const IconUtensils = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </Icon>
);

const IconCamera = (props: IconProps) => (
  <Icon {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Icon>
);

const IconCheck = (props: IconProps) => (
  <Icon {...props}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);

const IconAlertTriangle = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
  </Icon>
);

const IconTrash = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
);

const IconClock = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);

const IconUser = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);

const IconShip = (props: IconProps) => (
  <Icon {...props}>
    <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 21v-8l2-2h16l2 2v8" />
    <path d="M4 11V6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v5" />
    <path d="M8 4l-1 3h10l-1-3" />
  </Icon>
);

const IconWeight = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </Icon>
);

const IconLogout = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

const IconCalendar = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

const IconPlus = (props: IconProps) => (
  <Icon {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

const IconDroplets = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 16.3c2.2 0 4-1.8 4-4 0-2.2-4-6-4-6s-4 3.8-4 6c0 2.2 1.8 4 4 4Z" />
    <path d="M17 16.3c2.2 0 4-1.8 4-4 0-2.2-4-6-4-6s-4 3.8-4 6c0 2.2 1.8 4 4 4Z" />
  </Icon>
);

const IconX = (props: IconProps) => (
  <Icon {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);

// ============================================================
// COMPONENTES DE UI REFORMULADOS
// ============================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
  variant?: 'default' | 'flat' | 'outline' | 'glass';
}

const Card = ({ children, className = '', style = {}, noPadding = false, variant = 'default' }: CardProps) => {
  const variants = {
    default: {
      background: THEME.colors.white,
      boxShadow: THEME.shadows.md,
      border: `1px solid ${THEME.colors.slate[200]}`,
    },
    flat: {
      background: THEME.colors.slate[50],
      boxShadow: 'none',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      boxShadow: 'none',
      border: `1px solid ${THEME.colors.slate[200]}`,
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      boxShadow: THEME.shadows.lg,
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }
  };

  return (
    <div
      style={{
        borderRadius: THEME.radius.lg,
        padding: noPadding ? 0 : THEME.spacing.lg,
        marginBottom: THEME.spacing.lg,
        transition: 'all 0.3s ease',
        ...variants[variant],
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
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
  fullWidth = false,
  type = 'button',
}: ButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants: Record<string, any> = {
    primary: {
      background: THEME.colors.primary.main,
      color: THEME.colors.white,
      hover: THEME.colors.primary.dark,
    },
    secondary: {
      background: THEME.colors.secondary.main,
      color: THEME.colors.white,
      hover: THEME.colors.secondary.dark,
    },
    success: {
      background: THEME.colors.success.main,
      color: THEME.colors.white,
      hover: THEME.colors.success.dark,
    },
    danger: {
      background: THEME.colors.danger.main,
      color: THEME.colors.white,
      hover: THEME.colors.danger.dark,
    },
    outline: {
      background: 'transparent',
      color: THEME.colors.slate[700],
      border: `1px solid ${THEME.colors.slate[300]}`,
      hover: THEME.colors.slate[100],
    },
    ghost: {
      background: 'transparent',
      color: THEME.colors.slate[600],
      hover: THEME.colors.slate[100],
    },
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px', gap: '6px' },
    md: { padding: '10px 20px', fontSize: '14px', gap: '8px' },
    lg: { padding: '14px 28px', fontSize: '16px', gap: '10px' },
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: currentVariant.border || 'none',
        borderRadius: THEME.radius.md,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        background: isHovered && !disabled ? currentVariant.hover : currentVariant.background,
        color: currentVariant.color,
        transform: isHovered && !disabled ? 'translateY(-1px)' : 'none',
        boxShadow: isHovered && !disabled ? THEME.shadows.md : 'none',
        ...currentSize,
        ...style,
      }}
      className={className}
    >
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
};

interface BadgeProps {
  status: 'aprovado' | 'pendente' | 'rejeitado' | 'duvidoso' | string;
  children: React.ReactNode;
  showDot?: boolean;
}

const Badge = ({ status, children, showDot = true }: BadgeProps) => {
  const statusMap: Record<string, any> = {
    aprovado: { bg: THEME.colors.success.soft, color: THEME.colors.success.dark, dot: THEME.colors.success.main },
    pendente: { bg: THEME.colors.warning.soft, color: THEME.colors.warning.dark, dot: THEME.colors.warning.main },
    rejeitado: { bg: THEME.colors.danger.soft, color: THEME.colors.danger.dark, dot: THEME.colors.danger.main },
    duvidoso: { bg: 'rgba(124, 58, 237, 0.1)', color: '#6d28d9', dot: '#7c3aed' },
  };

  const safeStatus = (status || '').toLowerCase();
  const config = statusMap[safeStatus] || { bg: THEME.colors.slate[100], color: THEME.colors.slate[600], dot: THEME.colors.slate[400] };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: THEME.radius.full,
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        backgroundColor: config.bg,
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
      }}
    >
      {showDot && (
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.dot }} />
      )}
      {children}
    </span>
  );
};

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Alert = ({ type, children, icon }: AlertProps) => {
  const configs = {
    success: { bg: THEME.colors.success.soft, color: THEME.colors.success.dark, border: THEME.colors.success.main, icon: <IconCheck size={20} /> },
    error: { bg: THEME.colors.danger.soft, color: THEME.colors.danger.dark, border: THEME.colors.danger.main, icon: <IconAlertTriangle size={20} /> },
    warning: { bg: THEME.colors.warning.soft, color: THEME.colors.warning.dark, border: THEME.colors.warning.main, icon: <IconAlertTriangle size={20} /> },
    info: { bg: THEME.colors.info.soft, color: THEME.colors.info.dark, border: THEME.colors.info.main, icon: <IconClock size={20} /> },
  };

  const config = configs[type] || configs.info;

  return (
    <div
      style={{
        padding: THEME.spacing.md,
        borderRadius: THEME.radius.md,
        backgroundColor: config.bg,
        color: config.color,
        borderLeft: `4px solid ${config.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: THEME.spacing.md,
        marginBottom: THEME.spacing.lg,
        boxShadow: THEME.shadows.sm,
      }}
    >
      <div style={{ marginTop: '2px' }}>{icon || config.icon}</div>
      <div style={{ fontSize: '14px', lineHeight: '1.5', fontWeight: 500 }}>{children}</div>
    </div>
  );
};

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

const StatCard = ({ value, label, icon, color = THEME.colors.primary.main }: StatCardProps) => (
  <div
    style={{
      background: THEME.colors.white,
      padding: THEME.spacing.lg,
      borderRadius: THEME.radius.lg,
      border: `1px solid ${THEME.colors.slate[200]}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: THEME.spacing.xs,
      boxShadow: THEME.shadows.sm,
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
  >
    {icon && <div style={{ opacity: 0.8 }}>{icon}</div>}
    <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '12px', fontWeight: 600, color: THEME.colors.slate[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </div>
  </div>
);

// ============================================================
// COMPONENTES PRINCIPAIS REFORMULADOS
// ============================================================

const ProfileCard = ({ name, codigo, cargo, email, onLogout }: any) => {
  const safeName = name || 'Usuário';
  return (
    <Card variant="glass" style={{ marginBottom: THEME.spacing.xl }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: THEME.spacing.lg, flexWrap: 'wrap' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: THEME.radius.full,
            background: `linear-gradient(135deg, ${THEME.colors.primary.main} 0%, ${THEME.colors.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 800,
            color: THEME.colors.white,
            boxShadow: THEME.shadows.md,
            flexShrink: 0,
          }}
        >
          {safeName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: THEME.colors.slate[900], margin: 0 }}>{safeName}</h2>
          <div style={{ display: 'flex', gap: THEME.spacing.md, marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: THEME.colors.slate[600] }}>
              <strong style={{ color: THEME.colors.slate[900] }}>ID:</strong> {codigo || '---'}
            </span>
            <span style={{ fontSize: '13px', color: THEME.colors.slate[600] }}>
              <strong style={{ color: THEME.colors.slate[900] }}>Cargo:</strong> {cargo || 'N/A'}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: THEME.colors.slate[500], marginTop: '2px' }}>{email || ''}</div>
        </div>
        {onLogout && (
          <Button variant="outline" size="sm" onClick={onLogout} icon={<IconLogout size={16} color={THEME.colors.danger.main} />} style={{ color: THEME.colors.danger.main, borderColor: THEME.colors.danger.soft }}>
            Sair
          </Button>
        )}
      </div>
    </Card>
  );
};

const UploadArea = ({ onFileSelect, preview, onRemove, label, required, icon, color = THEME.colors.primary.main }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: any) => {
    e.preventDefault();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  return (
    <div style={{ marginBottom: THEME.spacing.lg }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: THEME.spacing.sm }}>
        {label} {required && <span style={{ color: THEME.colors.danger.main }}>*</span>}
      </label>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${preview ? color : isDragActive ? color : THEME.colors.slate[300]}`,
          borderRadius: THEME.radius.lg,
          padding: THEME.spacing.xl,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: isDragActive ? `${color}08` : preview ? `${color}05` : THEME.colors.slate[50],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: THEME.spacing.md,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: THEME.radius.md, boxShadow: THEME.shadows.md, objectFit: 'cover' }} />
            <div style={{ display: 'flex', gap: THEME.spacing.md, alignItems: 'center' }}>
              <Badge status="aprovado">Foto Capturada</Badge>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                style={{ background: 'none', border: 'none', color: THEME.colors.danger.main, cursor: 'pointer', fontSize: '12px', fontWeight: 700, textDecoration: 'underline' }}
              >
                Remover
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: '48px', height: '48px', borderRadius: THEME.radius.full, background: THEME.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: THEME.shadows.sm, color }}>
              {icon || <IconCamera size={24} />}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: THEME.colors.slate[700] }}>Clique ou arraste a foto</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: THEME.colors.slate[500] }}>PNG, JPG até 5MB</p>
            </div>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = ''; }} />
      </div>
    </div>
  );
};

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
}: any) {
  // --- ESTADOS ---
  const [colaboradorInfo, setColaboradorInfo] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [embarques, setEmbarques] = useState<any[]>([]);
  const [imcRecente, setImcRecente] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  const [fotoPrato, setFotoPrato] = useState<any>(null);
  const [selfie, setSelfie] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  const refeicoes = ['Café da Manhã', 'Almoço', 'Jantar', 'Ceia'];

  // --- EFEITOS ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    
    const ua = navigator.userAgent;
    setDeviceInfo({
      id: deviceId,
      model: (navigator as any).platform || 'Desconhecido',
      os: ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'MacOS' : ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : 'Linux/Outro',
      app_version: '2.0.1 (Fixed)',
    });

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('N/I'));

    if (user) buscarColaboradorPorEmail(user.email || '');
  }, [user]);

  // --- LÓGICA (MANTIDA) ---
  const buscarColaboradorPorEmail = async (email: string) => {
    if (!email) { setError('Email não encontrado'); return; }
    try {
      const { data, error } = await supabase.from('colaboradores').select('*').eq('email', email).maybeSingle();
      if (data) {
        const info = {
          codigo: data.codigo || email.split('@')[0].toUpperCase(),
          nome: data.nome || user?.user_metadata?.name || email.split('@')[0],
          cargo: data.cargo || user?.user_metadata?.cargo || 'Colaborador',
          email: data.email || email,
        };
        setColaboradorInfo(info);
        if (data.departamento) setFormData(prev => ({ ...prev, frente_servico: data.departamento }));
        carregarDadosColaborador(info.codigo);
        return;
      }
      const codigo = email.split('@')[0].toUpperCase();
      const nome = user?.user_metadata?.name || email.split('@')[0];
      const cargo = user?.user_metadata?.cargo || 'Colaborador';
      const { data: novoColaborador } = await supabase.from('colaboradores').insert([{ codigo, nome, email, cargo, modulos_permitidos: ['refeicao'] }]).select().maybeSingle();
      const info = novoColaborador ? { codigo: novoColaborador.codigo, nome: novoColaborador.nome, cargo: novoColaborador.cargo, email: novoColaborador.email } : { codigo, nome, cargo, email };
      setColaboradorInfo(info);
      carregarDadosColaborador(info.codigo);
    } catch (err) {
      console.error(err);
      if (user?.email) {
        const codigo = user.email.split('@')[0].toUpperCase();
        setColaboradorInfo({ codigo, nome: user.user_metadata?.name || user.email.split('@')[0], cargo: user.user_metadata?.cargo || 'Colaborador', email: user.email });
        carregarDadosColaborador(codigo);
      }
    }
  };

  const carregarDadosColaborador = async (codigo: string) => {
    setLoading(true);
    try {
      const [refeicoesRes, imcRes, embarquesRes] = await Promise.all([
        supabase.from('registros_refeicoes').select('*').eq('colaborador_codigo', codigo).order('data_refeicao', { ascending: false }).order('horario_inicio', { ascending: false }),
        supabase.from('imc_records').select('*').eq('codigo', codigo).order('data_raw', { ascending: false }).limit(1),
        supabase.from('pre_embarque').select('*').eq('colaborador_codigo', codigo).order('data_exame', { ascending: false })
      ]);

      if (refeicoesRes.data) setRegistros(refeicoesRes.data);
      
      if (imcRes.data?.[0]) {
        const record = imcRes.data[0];
        const alturaM = record.altura > 3 ? record.altura / 100 : record.altura;
        const imc = alturaM > 0 ? record.peso / (alturaM * alturaM) : 0;
        let status = 'Normal';
        if (imc < 18.5) status = 'Abaixo do peso';
        else if (imc < 25) status = 'Peso normal';
        else if (imc < 30) status = 'Sobrepeso';
        else status = 'Obesidade';
        setImcRecente({ peso: record.peso, altura: record.altura, imc, data: record.data_str || new Date(record.data_raw).toLocaleDateString('pt-BR'), status });
      }

      if (embarquesRes.data) {
        setEmbarques(embarquesRes.data.map((e: any) => {
          const alturaM = e.altura > 3 ? e.altura / 100 : e.altura;
          return { ...e, imc: alturaM > 0 ? e.peso / (alturaM * alturaM) : 0 };
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally { setLoading(false); }
  };

  const processarFoto = useCallback((file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const preview = reader.result as string;
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(preview.substring(0, 1000)));
          const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
          resolve({ file, preview, hash });
        } catch (err) { reject(err); }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadFoto = async (file: File, tipo: string) => {
    const fileName = `${tipo}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { error } = await supabase.storage.from('refeicoes').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('refeicoes').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const gerarHashIntegridade = async (dados: any) => {
    const dataStr = JSON.stringify(dados) + Date.now().toString();
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataStr));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async () => {
    if (!colaboradorInfo) { setError('Colaborador não identificado.'); return; }
    if (!formData.alimentos) { setError('Descreva os alimentos consumidos'); return; }
    if (!fotoPrato) { setError('A foto do prato é OBRIGATÓRIA!'); return; }

    setSaving(true); setError(null);
    try {
      const [fotoUrl, selfieUrl] = await Promise.all([
        uploadFoto(fotoPrato.file, 'prato'),
        selfie ? uploadFoto(selfie.file, 'selfie') : Promise.resolve(null)
      ]);

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
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        timestamp_device: new Date().toISOString(),
        timezone_offset: new Date().getTimezoneOffset(),
        hash_criptografico: hash,
        status_validacao: 'pendente',
        nivel_confianca: confianca,
        is_atrasado: isAtrasado,
        data_original: isAtrasado ? formData.data_refeicao : null,
      };

      const { data, error: insertError } = await supabase.from('registros_refeicoes').insert([payload]).select();
      if (insertError) throw insertError;
      if (data?.[0]) setRegistros([data[0], ...registros]);

      setSuccessMessage(isAtrasado ? '✅ Refeição em atraso registrada! Aguardando validação.' : '✅ Refeição registrada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);

      setFormData(prev => ({ ...prev, alimentos: '', hidratacao_ml: 0, horario_inicio: '12:00', horario_termino: '12:30' }));
      setFotoPrato(null); setSelfie(null); setIsAtrasado(false); setShowForm(false);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar: ' + err.message);
    } finally { setSaving(false); }
  };

  const deletarRegistro = async (id: string, status: string) => {
    if (status !== 'pendente') { setError('Apenas registros pendentes podem ser excluídos.'); return; }
    if (!confirm('Deseja realmente excluir este registro?')) return;
    try {
      await supabase.from('registros_refeicoes').delete().eq('id', id);
      setRegistros(registros.filter(r => r.id !== id));
    } catch (err: any) { setError(err.message); }
  };

  const registrosFiltrados = useMemo(() => registros.filter(r => r.data_refeicao === selectedDate), [registros, selectedDate]);

  // --- RENDER ---
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${THEME.colors.slate[200]}`, borderTopColor: THEME.colors.primary.main, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      <p style={{ color: THEME.colors.slate[500], fontWeight: 500 }}>Carregando dados nutricionais...</p>
    </div>
  );

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: isRestricted ? '0' : THEME.spacing.xl, 
      fontFamily: THEME.fonts.sans,
      color: THEME.colors.slate[900],
      ...styles 
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: THEME.spacing.xl, flexWrap: 'wrap', gap: THEME.spacing.lg }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, margin: 0, color: THEME.colors.slate[900], letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconUtensils size={32} color={THEME.colors.primary.main} strokeWidth={2.5} />
            {isRestricted ? 'Minhas Refeições' : 'Gestão Alimentar'}
          </h1>
          <p style={{ margin: '4px 0 0 0', color: THEME.colors.slate[500], fontSize: '14px', fontWeight: 500 }}>
            Monitore sua nutrição e hidratação diária
          </p>
        </div>
        <div style={{ display: 'flex', gap: THEME.spacing.md }}>
          <Button 
            variant={isAtrasado ? 'secondary' : 'primary'} 
            onClick={() => { setIsAtrasado(!isAtrasado); if (!showForm) setShowForm(true); }}
            icon={<IconPlus size={18} />}
          >
            {isAtrasado ? 'Lançar Atrasado' : 'Novo Registro'}
          </Button>
        </div>
      </div>

      {(isRestricted && colaboradorInfo) && <ProfileCard {...colaboradorInfo} onLogout={onLogout} />}

      {/* DASHBOARD GRID */}
      {isRestricted && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: THEME.spacing.lg, marginBottom: THEME.spacing.xl }}>
          <div style={{ gridColumn: 'span 1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.md }}>
            <StatCard value={registros.length} label="Total" icon={<IconUtensils size={20} color={THEME.colors.primary.main} />} />
            <StatCard value={registros.filter(r => r.status_validacao === 'aprovado').length} label="Aprovados" color={THEME.colors.success.main} icon={<IconCheck size={20} color={THEME.colors.success.main} />} />
          </div>
          
          {imcRecente ? (
            <Card variant="outline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: THEME.spacing.lg, background: THEME.colors.white }}>
              <div style={{ width: '48px', height: '48px', borderRadius: THEME.radius.md, background: THEME.colors.primary.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.colors.primary.main }}>
                <IconWeight size={24} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[500], textTransform: 'uppercase' }}>IMC Atual ({imcRecente.data})</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: THEME.colors.slate[900] }}>
                  {imcRecente.imc.toFixed(1)} 
                  <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.colors.success.main, marginLeft: '8px' }}>{imcRecente.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: THEME.colors.slate[500] }}>{imcRecente.peso}kg • {imcRecente.altura}cm</div>
              </div>
            </Card>
          ) : (
            <Card variant="outline" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: THEME.spacing.lg, background: THEME.colors.slate[50] }}>
              <IconWeight size={24} color={THEME.colors.slate[400]} />
              <div style={{ fontSize: '14px', color: THEME.colors.slate[500], fontWeight: 500 }}>Nenhum registro de IMC disponível</div>
            </Card>
          )}
        </div>
      )}

      {/* MENSAGENS */}
      {error && <Alert type="error">{error}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* FORMULÁRIO */}
      {showForm && (
        <Card variant="default" style={{ borderTop: `4px solid ${isAtrasado ? THEME.colors.secondary.main : THEME.colors.primary.main}`, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.xl }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{isAtrasado ? 'Registro de Refeição Atrasada' : 'Registrar Nova Refeição'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.slate[400] }}>
              <IconX size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg, marginBottom: THEME.spacing.lg }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Data</label>
              <input type="date" value={formData.data_refeicao} onChange={e => setFormData({...formData, data_refeicao: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px' }} />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Tipo de Refeição</label>
              <select value={formData.refeicao} onChange={e => setFormData({...formData, refeicao: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px', background: 'white' }}>
                {refeicoes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg, marginBottom: THEME.spacing.lg }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Início</label>
              <input type="time" value={formData.horario_inicio} onChange={e => setFormData({...formData, horario_inicio: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px' }} />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Término</label>
              <input type="time" value={formData.horario_termino} onChange={e => setFormData({...formData, horario_termino: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ marginBottom: THEME.spacing.lg }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Alimentos Consumidos</label>
            <textarea value={formData.alimentos} onChange={e => setFormData({...formData, alimentos: e.target.value})} placeholder="O que você comeu hoje?" style={{ width: '100%', padding: '12px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px', minHeight: '80px', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg, marginBottom: THEME.spacing.xl }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Hidratação (mL)</label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={formData.hidratacao_ml} onChange={e => setFormData({...formData, hidratacao_ml: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px' }} />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[400] }}>mL</span>
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: THEME.colors.slate[700], marginBottom: '6px', textTransform: 'uppercase' }}>Frente de Serviço</label>
              <input type="text" value={formData.frente_servico} onChange={e => setFormData({...formData, frente_servico: e.target.value})} placeholder="Local de trabalho" style={{ width: '100%', padding: '10px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, outline: 'none', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: THEME.spacing.lg, marginBottom: THEME.spacing.xl }}>
            <UploadArea label="Foto do Prato" required preview={fotoPrato?.preview} onFileSelect={(file: File) => processarFoto(file).then(setFotoPrato)} onRemove={() => setFotoPrato(null)} />
            <UploadArea label="Selfie (Opcional)" color="#8b5cf6" icon={<IconUser size={24} />} preview={selfie?.preview} onFileSelect={(file: File) => { const r = new FileReader(); r.onload = () => setSelfie({file, preview: r.result as string}); r.readAsDataURL(file); }} onRemove={() => setSelfie(null)} />
          </div>

          <div style={{ display: 'flex', gap: THEME.spacing.md, justifyContent: 'flex-end', borderTop: `1px solid ${THEME.colors.slate[100]}`, paddingTop: THEME.spacing.lg }}>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant={isAtrasado ? 'secondary' : 'primary'} onClick={handleSubmit} disabled={saving} icon={saving ? null : <IconCheck size={18} />}>
              {saving ? 'Salvando...' : 'Confirmar Registro'}
            </Button>
          </div>
        </Card>
      )}

      {/* HISTÓRICO E TABELAS */}
      <Card noPadding variant="outline" style={{ overflow: 'hidden', background: 'white' }}>
        <div style={{ padding: THEME.spacing.lg, borderBottom: `1px solid ${THEME.colors.slate[100]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: THEME.spacing.md }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCalendar size={18} color={THEME.colors.primary.main} />
            Registros Diários
          </h3>
          <div style={{ position: 'relative' }}>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              style={{ padding: '6px 12px', borderRadius: THEME.radius.md, border: `1px solid ${THEME.colors.slate[200]}`, fontSize: '13px', fontWeight: 600, color: THEME.colors.slate[700], outline: 'none', background: THEME.colors.slate[50] }} 
            />
          </div>
        </div>

        {registrosFiltrados.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🍽️</div>
            <p style={{ color: THEME.colors.slate[500], fontWeight: 500 }}>Nenhum registro encontrado para esta data.</p>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>Adicionar Agora</Button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: THEME.colors.slate[50] }}>
                  {['Refeição', 'Horário', 'Alimentos', 'Status', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: THEME.colors.slate[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((reg, idx) => (
                  <tr key={reg.id} style={{ borderBottom: idx === registrosFiltrados.length - 1 ? 'none' : `1px solid ${THEME.colors.slate[100]}`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: THEME.colors.slate[900] }}>{reg.refeicao}</div>
                      {reg.is_atrasado && <Badge status="pendente" showDot={false}>Atrasado</Badge>}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: THEME.colors.slate[600] }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconClock size={14} /> {reg.horario_inicio} - {reg.horario_termino}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', color: THEME.colors.slate[700], maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reg.alimentos}</div>
                      {reg.hidratacao_ml > 0 && (
                        <div style={{ fontSize: '11px', color: THEME.colors.info.main, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <IconDroplets size={12} /> {reg.hidratacao_ml}mL
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Badge status={reg.status_validacao}>{reg.status_validacao}</Badge>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={reg.foto_prato_url} target="_blank" rel="noreferrer" style={{ width: '32px', height: '32px', borderRadius: THEME.radius.md, background: THEME.colors.slate[100], display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.colors.slate[600] }}>
                          <IconCamera size={16} />
                        </a>
                        {reg.status_validacao === 'pendente' && (
                          <button onClick={() => deletarRegistro(reg.id, reg.status_validacao)} style={{ width: '32px', height: '32px', borderRadius: THEME.radius.md, background: THEME.colors.danger.soft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.colors.danger.main, cursor: 'pointer' }}>
                            <IconTrash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* EMBARQUES HISTÓRICO */}
      {(isRestricted && embarques.length > 0) && (
        <Card variant="outline" style={{ marginTop: THEME.spacing.xl, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: THEME.spacing.lg, borderBottom: `1px solid ${THEME.colors.slate[100]}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconShip size={20} color={THEME.colors.secondary.main} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Histórico de Embarques</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: THEME.colors.slate[50] }}>
                  {['Data', 'Frente', 'Cargo', 'IMC', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: THEME.colors.slate[500], textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {embarques.map((e, idx) => (
                  <tr key={e.id} style={{ borderBottom: idx === embarques.length - 1 ? 'none' : `1px solid ${THEME.colors.slate[100]}` }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600 }}>{new Date(e.data_exame).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: THEME.colors.slate[600] }}>{e.frente_servico}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: THEME.colors.slate[600] }}>{e.cargo}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: e.imc > 30 ? THEME.colors.danger.main : THEME.colors.slate[900] }}>{e.imc ? e.imc.toFixed(1) : '---'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <Badge status={e.status}>{e.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
