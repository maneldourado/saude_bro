// app/IMC-UI.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useIMCModule, Employee, Colaborador } from './IMCModule';

// ─── ÍCONES SVG ──────────────────────────────────────────────────────────────

const IconScale = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M12 2v4" />
    <path d="M4 20h16" />
    <path d="M6 16l2-8" />
    <path d="M18 16l-2-8" />
    <path d="M8 8h8" />
    <path d="M6 16h12" />
  </svg>
);

const IconUpload = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconClipboard = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconUsers = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconChartBar = ({ size = 20, color = 'currentColor' }) => (
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
    <rect x="3" y="12" width="4" height="8" rx="1" />
    <rect x="9" y="8" width="4" height="12" rx="1" />
    <rect x="15" y="4" width="4" height="16" rx="1" />
  </svg>
);

const IconCircle = ({ size = 20, fill = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const IconAlertTriangle = ({ size = 20, color = 'currentColor' }) => (
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

const IconArrowDown = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M12 5v14" />
    <path d="M19 12l-7 7-7-7" />
  </svg>
);

const IconArrowRight = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

const IconArrowUp = ({ size = 20, color = 'currentColor' }) => (
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
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

const IconCheck = ({ size = 20, color = 'currentColor' }) => (
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

const IconSearch = ({ size = 20, color = 'currentColor' }) => (
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
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconUser = ({ size = 20, color = 'currentColor' }) => (
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

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#f4f5f7',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',
  border: '#e4e6eb',
  borderMid: '#d1d4db',
  primary: '#111827',
  secondary: '#374151',
  muted: '#9ca3af',
  accent: '#2563eb',
  accentBg: '#eff6ff',
  accentHov: '#1d4ed8',
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#d97706',
  warningBg: '#fffbeb',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  orange: '#ea580c',
  orangeBg: '#fff7ed',
  white: '#ffffff',
};

const statusColors: Record<string, { text: string; bg: string; dot: string }> =
  {
    'Peso normal': { text: C.success, bg: C.successBg, dot: C.success },
    Sobrepeso: { text: C.warning, bg: C.warningBg, dot: C.warning },
    'Obesidade grau I': { text: C.orange, bg: C.orangeBg, dot: C.orange },
    'Obesidade grau II': { text: C.danger, bg: C.dangerBg, dot: C.danger },
  };

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    *, *::before, *::after { box-sizing: border-box; }
    .imc-root { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; }
    @keyframes imc-spin { to { transform: rotate(360deg); } }
    @keyframes imc-fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
    @keyframes imc-scaleIn {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1);    }
    }
    @keyframes imc-slideRight {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0);    }
    }
    .imc-row-hover:hover { background: ${C.surfaceAlt}; }
    .imc-btn-ghost:hover { background: ${C.surfaceAlt}; }
    .imc-month-bar:hover .imc-bar-fill { opacity: 0.75; }
    select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px !important; }
  `}</style>
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const Badge: React.FC<{ label: string; color: string; bg: string }> = ({
  label,
  color,
  bg,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1,
      color,
      background: bg,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
    {label}
  </span>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => (
  <input
    {...props}
    style={{
      width: '100%',
      padding: '8px 12px',
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      fontSize: 14,
      color: C.primary,
      background: C.white,
      outline: 'none',
      transition: 'border-color .15s',
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = C.accent;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = C.border;
    }}
  />
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label
    style={{
      display: 'block',
      marginBottom: 5,
      fontSize: 12,
      fontWeight: 600,
      color: C.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}
  >
    {children}
  </label>
);

// ─── LOADING ─────────────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 16,
      background: C.bg,
      animation: 'imc-fadeUp .3s ease',
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `3px solid ${C.border}`,
        borderTopColor: C.accent,
        animation: 'imc-spin .8s linear infinite',
      }}
    />
    <p style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>
      Carregando dados...
    </p>
  </div>
);

// ─── TOAST ───────────────────────────────────────────────────────────────────
const Toast: React.FC<{ type: 'error' | 'success'; message: string }> = ({
  type,
  message,
}) => {
  const isErr = type === 'error';
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 2000,
        padding: '12px 18px',
        borderRadius: 10,
        background: isErr ? C.dangerBg : C.successBg,
        color: isErr ? C.danger : C.success,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: `1px solid ${isErr ? '#fecaca' : '#bbf7d0'}`,
        animation: 'imc-slideRight .25s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 16, display: 'flex' }}>
        {isErr ? (
          <IconAlertTriangle size={18} color={C.danger} />
        ) : (
          <IconCheck size={18} color={C.success} />
        )}
      </span>
      {message}
    </div>
  );
};

// ─── MODAL BASE ──────────────────────────────────────────────────────────────
const ModalShell: React.FC<{
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}> = ({ title, subtitle, onClose, children, maxWidth = 480 }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(15,20,30,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backdropFilter: 'blur(2px)',
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        padding: '28px 28px 24px',
        maxWidth,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        animation: 'imc-scaleIn .2s ease',
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <h2
          style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.primary }}
        >
          {title}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  </div>
);

const ModalActions: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
  confirmLabel?: string;
}> = ({ onConfirm, onCancel, saving, confirmLabel = 'Confirmar' }) => (
  <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
    <button
      onClick={onConfirm}
      disabled={saving}
      style={{
        flex: 1,
        padding: '10px 0',
        borderRadius: 8,
        border: 'none',
        background: saving ? C.muted : C.accent,
        color: C.white,
        fontSize: 14,
        fontWeight: 600,
        cursor: saving ? 'default' : 'pointer',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => {
        if (!saving) e.currentTarget.style.background = C.accentHov;
      }}
      onMouseLeave={(e) => {
        if (!saving) e.currentTarget.style.background = C.accent;
      }}
    >
      {saving ? 'Salvando...' : confirmLabel}
    </button>
    <button
      onClick={onCancel}
      style={{
        flex: 1,
        padding: '10px 0',
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: 'transparent',
        color: C.secondary,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
      className="imc-btn-ghost"
    >
      Cancelar
    </button>
  </div>
);

// ─── MAPPING MODAL ───────────────────────────────────────────────────────────
const MappingModal: React.FC<{
  show: boolean;
  fileData: any;
  columnMapping: any;
  saving: boolean;
  onMappingChange: (m: any) => void;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  show,
  fileData,
  columnMapping,
  saving,
  onMappingChange,
  onConfirm,
  onCancel,
}) => {
  if (!show || !fileData) return null;
  const fields = [
    { key: 'codigo', label: 'Código' },
    { key: 'data', label: 'Data' },
    { key: 'peso', label: 'Peso (kg)' },
    { key: 'altura', label: 'Altura (cm)' },
    { key: 'circunferencia', label: 'Circunferência (cm)' },
    { key: 'empresa', label: 'Empresa' },
  ];
  return (
    <ModalShell
      title="Mapear Colunas"
      subtitle="Associe cada campo à coluna da planilha"
      onClose={onCancel}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fields.map(({ key, label }) => (
          <div key={key}>
            <FieldLabel>{label}</FieldLabel>
            <select
              value={columnMapping[key]}
              onChange={(e) =>
                onMappingChange({
                  ...columnMapping,
                  [key]: parseInt(e.target.value),
                })
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 14,
                color: C.primary,
                background: C.white,
                cursor: 'pointer',
              }}
            >
              {fileData.headers.map((h: any, i: number) => (
                <option key={i} value={i}>
                  Col. {String.fromCharCode(65 + i)}: {String(h || '')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <ModalActions
        onConfirm={onConfirm}
        onCancel={onCancel}
        saving={saving}
        confirmLabel="Confirmar Importação"
      />
    </ModalShell>
  );
};

// ─── MANUAL MODAL ────────────────────────────────────────────────────────────
const ManualModal: React.FC<{
  show: boolean;
  manualRecord: any;
  saving: boolean;
  searchColaborador: string;
  colaboradoresFiltrados: any[];
  onSearchChange: (v: string) => void;
  onColaboradorSelect: (id: string) => void;
  onRecordChange: (r: any) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({
  show,
  manualRecord,
  saving,
  searchColaborador,
  colaboradoresFiltrados,
  onSearchChange,
  onColaboradorSelect,
  onRecordChange,
  onSave,
  onCancel,
}) => {
  if (!show) return null;
  return (
    <ModalShell
      title="Lançar IMC Manual"
      subtitle="Selecione um colaborador e preencha os dados"
      onClose={onCancel}
      maxWidth={540}
    >
      {/* Busca */}
      <div style={{ marginBottom: 20 }}>
        <FieldLabel>Buscar Colaborador</FieldLabel>
        <Input
          type="text"
          placeholder="Nome ou código..."
          value={searchColaborador}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {colaboradoresFiltrados.length > 0 && (
          <div
            style={{
              maxHeight: 160,
              overflowY: 'auto',
              marginTop: 4,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            {colaboradoresFiltrados.map((col: any) => (
              <div
                key={col.id}
                onClick={() => onColaboradorSelect(col.id)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${C.border}`,
                  background:
                    manualRecord.colaboradorId === col.id
                      ? C.accentBg
                      : 'transparent',
                  transition: 'background .1s',
                }}
                className="imc-row-hover"
              >
                <div
                  style={{ fontSize: 14, fontWeight: 500, color: C.primary }}
                >
                  {col.nome}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Cód: {col.codigo}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selecionado */}
      {manualRecord.colaboradorNome && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: C.accentBg,
            borderRadius: 8,
            border: `1px solid #bfdbfe`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'flex' }}>
            <IconUser size={20} color={C.accent} />
          </span>
          <div>
            <div
              style={{
                fontSize: 12,
                color: C.accent,
                fontWeight: 600,
                marginBottom: 1,
              }}
            >
              COLABORADOR SELECIONADO
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>
              {manualRecord.colaboradorNome}
            </div>
          </div>
        </div>
      )}

      {/* Data / Frente */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          <FieldLabel>Data</FieldLabel>
          <Input
            type="date"
            value={manualRecord.data}
            onChange={(e) =>
              onRecordChange({ ...manualRecord, data: e.target.value })
            }
          />
        </div>
        <div>
          <FieldLabel>Frente de Serviço</FieldLabel>
          <Input
            type="text"
            placeholder="Ex: SM Continental"
            value={manualRecord.frenteServico}
            onChange={(e) =>
              onRecordChange({ ...manualRecord, frenteServico: e.target.value })
            }
          />
        </div>
      </div>

      {/* Métricas */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}
      >
        {(['peso', 'altura', 'circunferencia'] as const).map((key) => (
          <div key={key}>
            <FieldLabel>
              {key === 'peso'
                ? 'Peso (kg)'
                : key === 'altura'
                ? 'Altura (cm)'
                : 'Circ. (cm)'}
            </FieldLabel>
            <Input
              type="number"
              step="0.1"
              placeholder={
                key === 'peso' ? '75.5' : key === 'altura' ? '175' : '95.5'
              }
              value={manualRecord[key] || ''}
              onChange={(e) =>
                onRecordChange({ ...manualRecord, [key]: e.target.value })
              }
            />
          </div>
        ))}
      </div>

      <ModalActions
        onConfirm={onSave}
        onCancel={onCancel}
        saving={saving}
        confirmLabel="Salvar Registro"
      />
    </ModalShell>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: C.surface,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: action ? 'center' : 'flex-start',
      padding: '20px 22px 0',
      marginBottom: subtitle ? 4 : 16,
    }}
  >
    <div>
      <h3
        style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.primary }}
      >
        {title}
      </h3>
      {subtitle && (
        <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
          {subtitle}
        </p>
      )}
    </div>
    {action}
  </div>
);

// ─── STAT CARD (agora com icon como ReactNode) ─────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, accentColor = C.accent, icon }) => (
  <Card>
    <div style={{ padding: '18px 20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        {icon && (
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: `${accentColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>{sub}</div>
      )}
    </div>
    <div
      style={{
        height: 3,
        background: `${accentColor}20`,
        borderRadius: '0 0 12px 12px',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '60%',
          background: accentColor,
          borderRadius: 'inherit',
          opacity: 0.6,
        }}
      />
    </div>
  </Card>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
interface IMCUIProps {
  calculateBMI: (weight: number, height: number) => number;
  getBMIClassification: (bmi: number) => string;
  styles?: any;
}

export default function IMCUI(
  { calculateBMI, getBMIClassification, styles }: IMCUIProps = {} as any
) {
  const imc = useIMCModule(calculateBMI, getBMIClassification);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imc.employees?.length > 0) {
      setIsLoading(false);
      return;
    }
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, [imc.employees]);

  useEffect(() => {
    if (!imc.loading || imc.employees?.length > 0) setIsLoading(false);
  }, [imc.loading, imc.employees]);

  if (isLoading) return <LoadingScreen />;

  const totalReg = imc.filteredData?.length || 0;
  const totalColab = imc.uniqueByCollaborator?.length || 0;

  // Donut chart
  const statusList = Object.entries(imc.statusCounts);
  let angle = 0;
  const segments = statusList.map(([status, count]) => {
    const pct = totalColab > 0 ? (count as number) / totalColab : 0;
    const deg = pct * 360;
    const seg = { status, count: count as number, pct, startAngle: angle, deg };
    angle += deg;
    return seg;
  });
  const gradParts: string[] = [];
  let cur = 0;
  segments.forEach((s) => {
    const color = statusColors[s.status]?.dot || '#aaa';
    const end = cur + s.pct * 100;
    if (s.pct > 0)
      gradParts.push(`${color} ${cur.toFixed(1)}% ${end.toFixed(1)}%`);
    cur = end;
  });
  if (cur < 100) gradParts.push(`${C.border} ${cur.toFixed(1)}% 100%`);
  const donutGrad = gradParts.length
    ? `conic-gradient(${gradParts.join(', ')})`
    : C.border;

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all .15s',
    border: active ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
    background: active ? C.accent : 'transparent',
    color: active ? C.white : C.secondary,
  });

  return (
    <div
      className="imc-root"
      style={{
        background: C.bg,
        minHeight: '100vh',
        padding: '28px 24px',
        animation: 'imc-fadeUp .3s ease',
        ...styles?.imcContainer,
      }}
    >
      <GlobalStyles />

      <MappingModal
        show={imc.showMapping}
        fileData={imc.fileData}
        columnMapping={imc.columnMapping}
        saving={imc.saving}
        onMappingChange={imc.setColumnMapping}
        onConfirm={imc.processImport}
        onCancel={() => imc.setShowMapping(false)}
      />
      <ManualModal
        show={imc.showManualModal}
        manualRecord={imc.manualRecord}
        saving={imc.saving}
        searchColaborador={imc.searchColaborador}
        colaboradoresFiltrados={imc.colaboradoresFiltrados}
        onSearchChange={imc.setSearchColaborador}
        onColaboradorSelect={imc.handleColaboradorSelect}
        onRecordChange={imc.setManualRecord}
        onSave={imc.saveManualRecord}
        onCancel={() => {
          imc.setShowManualModal(false);
          imc.setSearchColaborador('');
        }}
      />

      {imc.error && <Toast type="error" message={imc.error} />}
      {imc.successMessage && (
        <Toast type="success" message={imc.successMessage} />
      )}

      {/* ── HEADER ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: C.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconScale size={22} color={C.white} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: C.primary,
              }}
            >
              Controle de IMC
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
            Gestão de avaliações e indicadores de saúde corporativa
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => imc.setShowManualModal(true)}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: C.accent,
              color: C.white,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 2px 8px ${C.accent}40`,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.accentHov;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.accent;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            + Lançar IMC
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: `1px solid ${C.borderMid}`,
              background: C.white,
              color: C.secondary,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            className="imc-btn-ghost"
          >
            {imc.importing ? (
              'Importando...'
            ) : (
              <>
                <IconUpload size={16} color={C.secondary} />
                Importar Planilha
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={imc.handleFileUpload}
            style={{ display: 'none' }}
            disabled={imc.importing}
          />
        </div>
      </div>

      {/* ── FILTROS ── */}
      <Card style={{ marginBottom: 24, padding: '14px 18px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Ano
            </span>
            <select
              value={imc.selectedYear}
              onChange={(e) => {
                imc.setSelectedYear(parseInt(e.target.value));
                imc.setSelectedMonth(null);
              }}
              style={{
                padding: '6px 28px 6px 12px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                color: C.primary,
                background: C.white,
                cursor: 'pointer',
              }}
            >
              {[
                ...new Set(
                  imc.employees
                    .filter((e: any) => e.ano > 0)
                    .map((e: any) => e.ano)
                ),
              ]
                .sort((a: any, b: any) => b - a)
                .map((ano: any) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ width: 1, height: 24, background: C.border }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Período
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: C.muted }}>De</span>
              <input
                type="date"
                value={imc.dataInicio}
                onChange={(e) => imc.setDataInicio(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                }}
              />
              <span style={{ fontSize: 12, color: C.muted }}>Até</span>
              <input
                type="date"
                value={imc.dataFim}
                onChange={(e) => imc.setDataFim(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13,
                }}
              />
            </div>
            <button
              onClick={() =>
                imc.setPeriodoAtivo(
                  imc.periodoAtivo === 'todos' ? 'personalizado' : 'todos'
                )
              }
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: `1px solid ${
                  imc.periodoAtivo === 'personalizado' ? C.accent : C.border
                }`,
                background:
                  imc.periodoAtivo === 'personalizado'
                    ? C.accentBg
                    : 'transparent',
                color:
                  imc.periodoAtivo === 'personalizado' ? C.accent : C.secondary,
                transition: 'all .15s',
              }}
            >
              {imc.periodoAtivo === 'todos' ? 'Aplicar' : 'Limpar'}
            </button>
          </div>

          <span style={{ marginLeft: 'auto', fontSize: 12, color: C.muted }}>
            <strong style={{ color: C.primary }}>{imc.employees.length}</strong>{' '}
            registros totais
          </span>
        </div>
      </Card>

      {/* ── CARDS PRINCIPAIS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <StatCard
          label="Total de Registros"
          value={totalReg}
          sub="Múltiplas medições"
          accentColor={C.accent}
          icon={<IconClipboard size={16} color={C.accent} />}
        />
        <StatCard
          label="Colaboradores Únicos"
          value={totalColab}
          sub="Avaliados no período"
          accentColor="#7c3aed"
          icon={<IconUsers size={16} color="#7c3aed" />}
        />
      </div>

      {/* ── MÉTRICAS INAPTOS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: 'Total Avaliados',
            value: imc.inaptosData.totalAvaliados,
            color: C.secondary,
            icon: <IconChartBar size={16} color={C.secondary} />,
          },
          {
            label: 'IMC ≥ 35 + Circ ≥ 102',
            value: imc.inaptosData.totalInaptosIMC35_Circ,
            color: C.danger,
            icon: <IconCircle size={16} fill={C.danger} />,
          },
          {
            label: 'Circ. ≥ 102 cm',
            value: imc.inaptosData.totalInaptosCirc,
            color: C.warning,
            icon: <IconCircle size={16} fill={C.warning} />,
          },
          {
            label: 'Total Inaptos',
            value: imc.inaptosData.todosInaptos.length,
            color: C.orange,
            icon: <IconAlertTriangle size={16} color={C.orange} />,
          },
        ].map((item, i) => (
          <StatCard
            key={i}
            label={item.label}
            value={item.value}
            accentColor={item.color}
            icon={item.icon}
          />
        ))}
      </div>

      {/* ── MÉDIAS ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'IMC Médio',
            value: imc.mediaPeriodo
              ? imc.mediaPeriodo.mediaImc.toFixed(2)
              : '—',
          },
          {
            label: 'Período',
            value: imc.mediaPeriodo
              ? `${imc.mediaPeriodo.periodoInicio} → ${imc.mediaPeriodo.periodoFim}`
              : '—',
          },
          {
            label: 'Status Predominante',
            value: imc.mediaPeriodo ? imc.mediaPeriodo.statusMaisFreq : '—',
          },
          {
            label: 'Circ. Média',
            value: imc.mediaPeriodo
              ? `${imc.mediaPeriodo.mediaCirc.toFixed(1)} cm`
              : '—',
          },
        ].map((item, i) => (
          <Card key={i}>
            <div style={{ padding: '16px 18px' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                {item.value}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── VARIAÇÃO DE PESO ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: 'Diminuiu',
            value: imc.variacaoPeso.diminuiu,
            color: C.success,
            bg: C.successBg,
            icon: <IconArrowDown size={24} color={C.success} />,
          },
          {
            label: 'Manteve',
            value: imc.variacaoPeso.manteve,
            color: C.warning,
            bg: C.warningBg,
            icon: <IconArrowRight size={24} color={C.warning} />,
          },
          {
            label: 'Aumentou',
            value: imc.variacaoPeso.aumentou,
            color: C.danger,
            bg: C.dangerBg,
            icon: <IconArrowUp size={24} color={C.danger} />,
          },
        ].map((item, i) => (
          <Card key={i}>
            <div style={{ padding: '18px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  margin: '0 auto 10px',
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color }}>
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                Variação de Peso
              </div>
              <div
                style={{ fontSize: 14, fontWeight: 600, color: C.secondary }}
              >
                {item.label}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── DONUT + LEGENDA ── */}
      {statusList.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader
            title="Distribuição por Status de IMC"
            subtitle={`Baseado em ${totalColab} colaboradores únicos`}
          />
          <div
            style={{
              padding: '0 22px 22px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 190,
                  height: 190,
                  borderRadius: '50%',
                  background: donutGrad,
                  position: 'relative',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 108,
                    height: 108,
                    borderRadius: '50%',
                    background: C.white,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: C.primary,
                      lineHeight: 1,
                    }}
                  >
                    {totalColab}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      marginTop: 2,
                    }}
                  >
                    TOTAL
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {segments.map(({ status, count, pct }) => {
                const sc = statusColors[status] || {
                  text: '#aaa',
                  bg: '#f5f5f5',
                  dot: '#aaa',
                };
                const pctInt = Math.round(pct * 100);
                return (
                  <div
                    key={status}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: C.surfaceAlt,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: sc.dot,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: C.secondary,
                          fontWeight: 500,
                        }}
                      >
                        {status}
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: C.primary,
                        }}
                      >
                        {count}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: sc.text,
                        }}
                      >
                        {pctInt}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: `${sc.dot}20`,
                        borderRadius: 4,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pctInt}%`,
                          background: sc.dot,
                          borderRadius: 4,
                          transition: 'width .6s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── GRÁFICO DE BARRAS MENSAL ── */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title={`Registros por Mês — ${imc.selectedYear}`}
          subtitle="Clique em um mês para filtrar"
        />
        <div style={{ padding: '8px 22px 20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'flex-end',
              height: 160,
              gap: 6,
            }}
          >
            {imc.meses.map((mes: string, i: number) => {
              const valor = imc.totalPorMes[i];
              const barH =
                valor > 0 ? Math.max(8, (valor / imc.maxTotal) * 120) : 6;
              const isSelected = imc.selectedMonth === i;
              const hasData = valor > 0;
              return (
                <div
                  key={i}
                  className="imc-month-bar"
                  onClick={() => imc.handleMonthClick(i)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    cursor: 'pointer',
                    transition: 'transform .15s',
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: isSelected
                        ? C.accent
                        : hasData
                        ? C.secondary
                        : C.muted,
                      marginBottom: 4,
                      minHeight: 16,
                    }}
                  >
                    {hasData ? valor : ''}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      className="imc-bar-fill"
                      style={{
                        height: `${barH}px`,
                        background: isSelected
                          ? C.accent
                          : hasData
                          ? `${C.accent}55`
                          : C.border,
                        borderRadius: '5px 5px 3px 3px',
                        transition: 'height .4s ease, background .2s',
                        boxShadow: isSelected
                          ? `0 -2px 8px ${C.accent}40`
                          : 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? C.accent : C.muted,
                    }}
                  >
                    {mes}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── GRÁFICO DE LINHAS ── */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="Evolução Anual por Status de IMC" />
        <div style={{ padding: '0 22px 16px' }}>
          <svg
            viewBox="0 0 700 240"
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = 20 + (1 - pct) * 180;
              return (
                <g key={i}>
                  <line
                    x1="48"
                    y1={y}
                    x2="680"
                    y2={y}
                    stroke={C.border}
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                  <text
                    x="40"
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill={C.muted}
                  >
                    {Math.round(imc.evolucaoPorStatus.maxCount * pct)}
                  </text>
                </g>
              );
            })}
            {/* Lines */}
            {Object.entries(imc.evolucaoPorStatus.data).map(
              ([status, values]) => {
                const sc = statusColors[status];
                const color = sc?.dot || C.muted;
                const pts = (values as number[])
                  .map((v, i) => {
                    const x = 48 + (i / 11) * 632;
                    const y =
                      imc.evolucaoPorStatus.maxCount > 0
                        ? 200 - (v / imc.evolucaoPorStatus.maxCount) * 180
                        : 200;
                    return `${x},${y}`;
                  })
                  .join(' ');
                return (
                  <g key={status}>
                    <polyline
                      points={pts}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {(values as number[]).map((v, i) => {
                      const x = 48 + (i / 11) * 632;
                      const y =
                        imc.evolucaoPorStatus.maxCount > 0
                          ? 200 - (v / imc.evolucaoPorStatus.maxCount) * 180
                          : 200;
                      return (
                        <g key={i}>
                          <circle
                            cx={x}
                            cy={y}
                            r="4.5"
                            fill={C.white}
                            stroke={color}
                            strokeWidth="2"
                          />
                          {v > 0 && (
                            <text
                              x={x}
                              y={y - 9}
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="700"
                              fill={color}
                            >
                              {v}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              }
            )}
            {/* X axis labels */}
            {imc.meses.map((mes: string, i: number) => (
              <text
                key={i}
                x={48 + (i / 11) * 632}
                y={218}
                textAnchor="middle"
                fontSize="10"
                fill={C.muted}
              >
                {mes}
              </text>
            ))}
          </svg>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
              marginTop: 8,
              flexWrap: 'wrap',
            }}
          >
            {Object.entries(statusColors).map(([status, sc]) => (
              <div
                key={status}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <div
                  style={{
                    width: 22,
                    height: 3,
                    background: sc.dot,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: sc.dot,
                  }}
                />
                <span style={{ fontSize: 11, color: C.secondary }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── TABELA INAPTOS ── */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title="Inaptos por Período"
          action={
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={filterBtnStyle(imc.periodoFiltro === 'mensal')}
                onClick={() => imc.handleSetPeriodoFiltro('mensal')}
              >
                Mensal
              </button>
              <button
                style={filterBtnStyle(imc.periodoFiltro === 'trimestral')}
                onClick={() => imc.handleSetPeriodoFiltro('trimestral')}
              >
                Trimestral
              </button>
              <button
                onClick={() => imc.setShowInaptosTable(!imc.showInaptosTable)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.secondary,
                }}
                className="imc-btn-ghost"
              >
                {imc.showInaptosTable ? 'Ocultar' : 'Ver Detalhes'}
              </button>
            </div>
          }
        />
        <div style={{ padding: '0 22px 20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {[
                    'Período',
                    'Avaliados',
                    'IMC≥35+Circ≥102',
                    'Circ≥102',
                    '% Inaptos',
                  ].map((col, i) => (
                    <th
                      key={col}
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        textAlign: i === 0 ? 'left' : 'center',
                        color:
                          i === 2
                            ? C.danger
                            : i === 3
                            ? C.warning
                            : C.secondary,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imc.periodoFiltro === 'mensal'
                  ? imc.meses.map((mes: string, idx: number) => {
                      const data = imc.inaptosData.porMes[mes];
                      if (!data || data.total === 0) return null;
                      const pct = data.percentual;
                      return (
                        <tr
                          key={idx}
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          className="imc-row-hover"
                        >
                          <td
                            style={{
                              padding: '10px 12px',
                              fontWeight: 600,
                              color: C.primary,
                            }}
                          >
                            {mes}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                              color: C.secondary,
                            }}
                          >
                            {data.total}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  data.inaptosIMC35_Circ > 0
                                    ? C.danger
                                    : C.muted,
                              }}
                            >
                              {data.inaptosIMC35_Circ}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  data.inaptosCirc > 0 ? C.warning : C.muted,
                              }}
                            >
                              {data.inaptosCirc}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                padding: '2px 10px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                background:
                                  pct > 20
                                    ? C.dangerBg
                                    : pct > 10
                                    ? C.warningBg
                                    : C.successBg,
                                color:
                                  pct > 20
                                    ? C.danger
                                    : pct > 10
                                    ? C.warning
                                    : C.success,
                              }}
                            >
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  : ['Q1', 'Q2', 'Q3', 'Q4'].map((trim) => {
                      const data = imc.inaptosData.porTrimestre[trim];
                      if (!data || data.total === 0) return null;
                      const pct = data.percentual;
                      return (
                        <tr
                          key={trim}
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          className="imc-row-hover"
                        >
                          <td
                            style={{
                              padding: '10px 12px',
                              fontWeight: 600,
                              color: C.primary,
                            }}
                          >
                            {trim}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                              color: C.secondary,
                            }}
                          >
                            {data.total}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  data.inaptosIMC35_Circ > 0
                                    ? C.danger
                                    : C.muted,
                              }}
                            >
                              {data.inaptosIMC35_Circ}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  data.inaptosCirc > 0 ? C.warning : C.muted,
                              }}
                            >
                              {data.inaptosCirc}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                padding: '2px 10px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                background:
                                  pct > 20
                                    ? C.dangerBg
                                    : pct > 10
                                    ? C.warningBg
                                    : C.successBg,
                                color:
                                  pct > 20
                                    ? C.danger
                                    : pct > 10
                                    ? C.warning
                                    : C.success,
                              }}
                            >
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
            {imc.inaptosData.todosInaptos.length === 0 && (
              <div
                style={{ textAlign: 'center', padding: '32px', color: C.muted }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  <IconCheck size={32} color={C.success} />
                </div>
                <div style={{ fontWeight: 600, color: C.secondary }}>
                  Nenhum inapto neste período
                </div>
              </div>
            )}
          </div>

          {/* Detalhes expandidos */}
          {imc.showInaptosTable && imc.inaptosData.todosInaptos.length > 0 && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: `1px solid ${C.border}`,
                animation: 'imc-fadeUp .2s ease',
              }}
            >
              <h4
                style={{
                  margin: '0 0 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.primary,
                }}
              >
                Detalhes dos Inaptos
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {[
                        'Código',
                        'Data',
                        'IMC',
                        'Circ (cm)',
                        'Circ/Altura',
                        'Motivo',
                        'Empresa',
                      ].map((col, i) => (
                        <th
                          key={col}
                          style={{
                            padding: '8px 12px',
                            fontWeight: 700,
                            textAlign: i > 1 && i < 5 ? 'center' : 'left',
                            color: C.secondary,
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {imc.inaptosData.todosInaptos.map(
                      (item: any, idx: number) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          className="imc-row-hover"
                        >
                          <td
                            style={{
                              padding: '9px 12px',
                              fontWeight: 600,
                              color: C.primary,
                            }}
                          >
                            {item.codigo}
                          </td>
                          <td
                            style={{ padding: '9px 12px', color: C.secondary }}
                          >
                            {item.data || '—'}
                          </td>
                          <td
                            style={{ padding: '9px 12px', textAlign: 'center' }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: item.imc >= 30 ? C.danger : C.success,
                              }}
                            >
                              {item.imc.toFixed(1)}
                            </span>
                          </td>
                          <td
                            style={{ padding: '9px 12px', textAlign: 'center' }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  item.circunferencia >= 102
                                    ? C.danger
                                    : C.success,
                              }}
                            >
                              {item.circunferencia}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '9px 12px',
                              textAlign: 'center',
                              color: C.secondary,
                            }}
                          >
                            {item.relacaoCircAltura?.toFixed(2) || '—'}
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <Badge
                              label={item.motivo}
                              color={
                                item.motivo === 'IMC ≥ 35 + Circ ≥ 102'
                                  ? C.danger
                                  : C.orange
                              }
                              bg={
                                item.motivo === 'IMC ≥ 35 + Circ ≥ 102'
                                  ? C.dangerBg
                                  : C.orangeBg
                              }
                            />
                          </td>
                          <td
                            style={{ padding: '9px 12px', color: C.secondary }}
                          >
                            {item.empresa || '—'}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── TABELA DETALHADA ── */}
      <Card>
        <CardHeader
          title="Detalhamento de Registros"
          action={
            <span
              style={{
                fontSize: 12,
                color: C.muted,
                background: C.surfaceAlt,
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${C.border}`,
                fontWeight: 600,
              }}
            >
              {imc.filteredData.length} registros
            </span>
          }
        />
        <div style={{ padding: '0 22px 22px', overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {[
                  'Código',
                  'Data',
                  'Altura',
                  'Peso',
                  'IMC',
                  'Status',
                  'Circ.',
                  'Variação',
                  'Tendência',
                  'Empresa',
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: C.secondary,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imc.filteredData.map((emp: any, idx: number) => {
                const bmi = imc.getIMC(emp);
                const status = emp.statusImc || imc.getBMIClassification(bmi);
                const sc = statusColors[status] || {
                  text: C.muted,
                  bg: '#f5f5f5',
                  dot: '#aaa',
                };
                const variacao = emp.variacaoPeso || 0;
                const varLabel =
                  variacao > 0.5
                    ? 'Aumentou'
                    : variacao < -0.5
                    ? 'Diminuiu'
                    : 'Manteve';
                const varColor =
                  variacao > 0.5
                    ? C.danger
                    : variacao < -0.5
                    ? C.success
                    : C.warning;
                const varBg =
                  variacao > 0.5
                    ? C.dangerBg
                    : variacao < -0.5
                    ? C.successBg
                    : C.warningBg;
                return (
                  <tr
                    key={emp.id || idx}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                    className="imc-row-hover"
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: C.primary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {emp.codigo}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: C.secondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {emp.dataStr || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: C.secondary }}>
                      {emp.height ? `${emp.height} cm` : '—'}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: C.primary,
                      }}
                    >
                      {emp.weight.toFixed(1)} kg
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: sc.text,
                      }}
                    >
                      {bmi > 0 ? bmi.toFixed(1) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={status} color={sc.text} bg={sc.bg} />
                    </td>
                    <td style={{ padding: '10px 12px', color: C.secondary }}>
                      {emp.circunferencia > 0
                        ? `${emp.circunferencia.toFixed(1)} cm`
                        : '—'}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: varColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {variacao > 0 ? '+' : ''}
                      {variacao.toFixed(2)} kg
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={varLabel} color={varColor} bg={varBg} />
                    </td>
                    <td style={{ padding: '10px 12px', color: C.secondary }}>
                      {emp.company || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {imc.filteredData.length === 0 && (
            <div
              style={{ textAlign: 'center', padding: '48px', color: C.muted }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>
                <IconSearch size={36} color={C.muted} />
              </div>
              <div
                style={{ fontWeight: 600, color: C.secondary, fontSize: 15 }}
              >
                Nenhum registro encontrado
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Tente ajustar os filtros de período
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
