// app/IMC-UI.tsx
'use client';

import React, { useRef } from 'react';
import { useIMCModule, Employee, Colaborador } from './IMCModule';

// ===== PALETA DE CORES MINIMALISTA =====
const colors = {
  primary: '#1e1e2f', // quase preto para textos e destaques
  secondary: '#4a4a5a', // cinza escuro
  muted: '#8e8e9a', // cinza médio
  light: '#f5f5f7', // fundo muito claro
  white: '#ffffff',
  border: '#e0e0e5', // bordas sutis
  accent: '#2d7d9a', // azul acinzentado para ações
  accentHover: '#1f5f77',
  success: '#2b7a4b',
  warning: '#b38b3a',
  danger: '#b33a4a',
};

// ===== ESTILOS GLOBAIS =====
const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; background: ${colors.light}; }
    .transition { transition: all 0.15s ease; }
    .hover-bg:hover { background: ${colors.light}; }
  `}</style>
);

// ===== LOADING =====
const LoadingScreen: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: colors.light,
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '28px',
          height: '28px',
          border: `2px solid ${colors.border}`,
          borderTop: `2px solid ${colors.accent}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px',
        }}
      />
      <p style={{ color: colors.muted, fontSize: '14px' }}>
        Carregando dados...
      </p>
    </div>
  </div>
);

// ===== TOAST =====
const ToastMessage: React.FC<{
  type: 'error' | 'success';
  message: string;
}> = ({ type, message }) => (
  <div
    style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2000,
      padding: '12px 20px',
      borderRadius: '8px',
      background: type === 'error' ? '#fde8e8' : '#e8f5ed',
      color: type === 'error' ? colors.danger : colors.success,
      fontSize: '14px',
      fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      animation: 'slideIn 0.25s ease',
    }}
  >
    {message}
  </div>
);

// ===== MODAL DE MAPEAMENTO =====
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '460px',
          width: '90%',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: colors.primary,
            margin: '0 0 4px',
          }}
        >
          Mapear Colunas
        </h2>
        <p
          style={{ fontSize: '14px', color: colors.muted, margin: '0 0 24px' }}
        >
          Associe as colunas da planilha
        </p>
        {fields.map(({ key, label }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: colors.secondary,
              }}
            >
              {label}
            </label>
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
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
                background: colors.white,
                color: colors.primary,
              }}
            >
              {fileData.headers.map((h: any, i: number) => (
                <option key={i} value={i}>
                  Coluna {String.fromCharCode(65 + i)}: {String(h || '')}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: saving ? colors.muted : colors.accent,
              color: colors.white,
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Confirmar'}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.secondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== MODAL MANUAL =====
const ManualModal: React.FC<{
  show: boolean;
  manualRecord: any;
  saving: boolean;
  searchColaborador: string;
  colaboradoresFiltrados: Colaborador[];
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '540px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          animation: 'scaleIn 0.2s ease',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: colors.primary,
            margin: '0 0 4px',
          }}
        >
          Lançar IMC Manual
        </h2>
        <p
          style={{ fontSize: '14px', color: colors.muted, margin: '0 0 24px' }}
        >
          Selecione um colaborador e preencha os dados
        </p>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: colors.secondary,
            }}
          >
            Buscar Colaborador
          </label>
          <input
            type="text"
            placeholder="Nome ou código..."
            value={searchColaborador}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              fontSize: '14px',
              outline: 'none',
              color: colors.primary,
            }}
          />
          {colaboradoresFiltrados.length > 0 && (
            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                marginTop: '6px',
              }}
            >
              {colaboradoresFiltrados.map((col) => (
                <div
                  key={col.id}
                  onClick={() => onColaboradorSelect(col.id)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${colors.border}`,
                    background:
                      manualRecord.colaboradorId === col.id
                        ? colors.light
                        : 'transparent',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '14px',
                      color: colors.primary,
                    }}
                  >
                    {col.nome}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.muted }}>
                    Código: {col.codigo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {manualRecord.colaboradorNome && (
          <div
            style={{
              marginBottom: '20px',
              padding: '10px 14px',
              background: colors.light,
              borderRadius: '8px',
              fontSize: '14px',
              color: colors.secondary,
            }}
          >
            <strong>Selecionado:</strong> {manualRecord.colaboradorNome}
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: colors.secondary,
              }}
            >
              Data
            </label>
            <input
              type="date"
              value={manualRecord.data}
              onChange={(e) =>
                onRecordChange({ ...manualRecord, data: e.target.value })
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: colors.secondary,
              }}
            >
              Frente de Serviço
            </label>
            <input
              type="text"
              placeholder="Ex: SM Continental"
              value={manualRecord.frenteServico}
              onChange={(e) =>
                onRecordChange({
                  ...manualRecord,
                  frenteServico: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {['peso', 'altura', 'circunferencia'].map((key) => (
            <div key={key}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: colors.secondary,
                }}
              >
                {key === 'peso'
                  ? 'Peso (kg)'
                  : key === 'altura'
                  ? 'Altura (cm)'
                  : 'Circ. (cm)'}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder={
                  key === 'peso' ? '75.5' : key === 'altura' ? '175' : '95.5'
                }
                value={manualRecord[key] || ''}
                onChange={(e) =>
                  onRecordChange({ ...manualRecord, [key]: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: saving ? colors.muted : colors.accent,
              color: colors.white,
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.secondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
interface IMCUIProps {
  calculateBMI: (weight: number, height: number) => number;
  getBMIClassification: (bmi: number) => string;
  styles?: any;
}

export default function IMCUI({
  calculateBMI,
  getBMIClassification,
  styles,
}: IMCUIProps) {
  const imc = useIMCModule(calculateBMI, getBMIClassification);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (imc.loading) return <LoadingScreen />;

  const totalRegistros = imc.filteredData?.length || 0;
  const totalColaboradores = imc.uniqueByCollaborator?.length || 0;

  // Paleta de cores para status (sutil)
  const statusColorMap: Record<string, string> = {
    'Peso normal': colors.success,
    Sobrepeso: colors.warning,
    'Obesidade grau I': '#c97a3a',
    'Obesidade grau II': colors.danger,
  };

  // Dados para o gráfico de pizza (conic-gradient)
  let gradientParts: string[] = [];
  let currentAngle = 0;
  Object.entries(imc.statusCounts).forEach(([status, count]) => {
    const pct = totalColaboradores > 0 ? (count / totalColaboradores) * 100 : 0;
    if (pct > 0) {
      gradientParts.push(
        `${statusColorMap[status] || '#aaa'} ${currentAngle}% ${
          currentAngle + pct
        }%`
      );
      currentAngle += pct;
    }
  });
  if (currentAngle < 100) gradientParts.push(`#e8e8ed ${currentAngle}% 100%`);
  const gradientString =
    gradientParts.length > 0
      ? `conic-gradient(${gradientParts.join(', ')})`
      : '#e8e8ed';

  return (
    <div
      style={{
        background: colors.light,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '32px 24px',
        minHeight: '100vh',
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

      {imc.error && <ToastMessage type="error" message={imc.error} />}
      {imc.successMessage && (
        <ToastMessage type="success" message={imc.successMessage} />
      )}

      {/* ===== CABEÇALHO ===== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: colors.primary,
              margin: 0,
            }}
          >
            Controle de IMC
          </h1>
          <p
            style={{ fontSize: '14px', color: colors.muted, margin: '4px 0 0' }}
          >
            Gestão de avaliações e indicadores de saúde
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => imc.setShowManualModal(true)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: colors.accent,
              color: colors.white,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Lançar IMC
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              background: colors.white,
              color: colors.secondary,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {imc.importing ? 'Importando...' : 'Importar Planilha'}
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

      {/* ===== FILTROS ===== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          background: colors.white,
          borderRadius: '12px',
          marginBottom: '32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <select
          value={imc.selectedYear}
          onChange={(e) => {
            imc.setSelectedYear(parseInt(e.target.value));
            imc.setSelectedMonth(null);
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            fontSize: '14px',
            background: 'transparent',
            color: colors.primary,
          }}
        >
          {[
            ...new Set(
              imc.employees.filter((e) => e.ano > 0).map((e) => e.ano)
            ),
          ]
            .sort((a, b) => (b as number) - (a as number))
            .map((ano) => (
              <option key={ano as number} value={ano as number}>
                {ano as number}
              </option>
            ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', color: colors.muted }}>De</span>
          <input
            type="date"
            value={imc.dataInicio}
            onChange={(e) => imc.setDataInicio(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              fontSize: '14px',
              background: 'transparent',
            }}
          />
          <span style={{ fontSize: '13px', color: colors.muted }}>Até</span>
          <input
            type="date"
            value={imc.dataFim}
            onChange={(e) => imc.setDataFim(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              fontSize: '14px',
              background: 'transparent',
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
            padding: '6px 16px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            background:
              imc.periodoAtivo === 'personalizado'
                ? colors.light
                : 'transparent',
            color: colors.secondary,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {imc.periodoAtivo === 'todos' ? 'Filtrar' : 'Limpar'}
        </button>
        <span
          style={{ marginLeft: 'auto', fontSize: '13px', color: colors.muted }}
        >
          {imc.employees.length} registros
        </span>
      </div>

      {/* ===== CARDS PRINCIPAIS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: colors.white,
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Registros
            </span>
          </div>
          <div
            style={{ fontSize: '40px', fontWeight: 600, color: colors.primary }}
          >
            {totalRegistros}
          </div>
          <div style={{ fontSize: '13px', color: colors.muted }}>
            Múltiplas medições
          </div>
        </div>
        <div
          style={{
            background: colors.white,
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.muted,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Colaboradores
            </span>
          </div>
          <div
            style={{ fontSize: '40px', fontWeight: 600, color: colors.primary }}
          >
            {totalColaboradores}
          </div>
          <div style={{ fontSize: '13px', color: colors.muted }}>
            Únicos avaliados
          </div>
        </div>
      </div>

      {/* ===== MÉTRICAS DE INAPTOS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[
          {
            label: 'Total Avaliados',
            value: imc.inaptosData.totalAvaliados,
            color: colors.secondary,
          },
          {
            label: 'IMC ≥ 35 + Circ ≥ 102',
            value: imc.inaptosData.totalInaptosIMC35_Circ,
            color: colors.danger,
          },
          {
            label: 'Circ ≥ 102',
            value: imc.inaptosData.totalInaptosCirc,
            color: colors.warning,
          },
          {
            label: 'Total Inaptos',
            value: imc.inaptosData.todosInaptos.length,
            color: '#b38b3a',
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: colors.white,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.muted,
                marginBottom: '4px',
              }}
            >
              {item.label}
            </div>
            <div
              style={{ fontSize: '28px', fontWeight: 600, color: item.color }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ===== MÉDIAS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[
          {
            label: 'IMC Médio',
            value: imc.mediaPeriodo
              ? imc.mediaPeriodo.mediaImc.toFixed(2)
              : '-',
          },
          {
            label: 'Período',
            value: imc.mediaPeriodo
              ? `${imc.mediaPeriodo.periodoInicio} → ${imc.mediaPeriodo.periodoFim}`
              : '-',
          },
          {
            label: 'Status Predominante',
            value: imc.mediaPeriodo ? imc.mediaPeriodo.statusMaisFreq : '-',
          },
          {
            label: 'Circunferência Média',
            value: imc.mediaPeriodo
              ? `${imc.mediaPeriodo.mediaCirc.toFixed(1)} cm`
              : '-',
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: colors.white,
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.muted,
                marginBottom: '4px',
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: colors.primary,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ===== VARIAÇÃO DE PESO ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {[
          {
            label: 'Diminuiu',
            value: imc.variacaoPeso.diminuiu,
            color: colors.success,
          },
          {
            label: 'Manteve',
            value: imc.variacaoPeso.manteve,
            color: colors.warning,
          },
          {
            label: 'Aumentou',
            value: imc.variacaoPeso.aumentou,
            color: colors.danger,
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: colors.white,
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: colors.muted,
                marginBottom: '4px',
              }}
            >
              {item.label}
            </div>
            <div
              style={{ fontSize: '32px', fontWeight: 600, color: item.color }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* ===== GRÁFICO DE PIZZA ===== */}
      {Object.keys(imc.statusCounts).length > 0 && (
        <div
          style={{
            background: colors.white,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.primary,
              margin: '0 0 4px',
            }}
          >
            Status de IMC
          </h3>
          <p
            style={{
              fontSize: '13px',
              color: colors.muted,
              margin: '0 0 20px',
            }}
          >
            Baseado em {totalColaboradores} colaboradores únicos
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  background: gradientString,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: colors.white,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: colors.primary,
                    }}
                  >
                    {totalColaboradores}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: colors.muted,
                      fontWeight: 500,
                    }}
                  >
                    TOTAL
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {Object.entries(imc.statusCounts).map(([status, count]) => {
                const color = statusColorMap[status] || '#aaa';
                const pct =
                  totalColaboradores > 0
                    ? Math.round((count / totalColaboradores) * 100)
                    : 0;
                return (
                  <div
                    key={status}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: colors.light,
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '4px',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '14px',
                        color: colors.secondary,
                      }}
                    >
                      {status}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: colors.primary,
                        }}
                      >
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 500, color }}>
                        {pct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== GRÁFICO DE BARRAS (MENSAL) ===== */}
      <div
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.primary,
            margin: '0 0 4px',
          }}
        >
          Registros por mês em {imc.selectedYear}
        </h3>
        <p
          style={{ fontSize: '13px', color: colors.muted, margin: '0 0 20px' }}
        >
          Total de medições
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            height: '150px',
            gap: '8px',
          }}
        >
          {imc.meses.map((mes, i) => {
            const valor = imc.totalPorMes[i];
            const altura =
              valor > 0 ? Math.min(130, (valor / imc.maxTotal) * 130) : 6;
            const isSelected = imc.selectedMonth === i;
            return (
              <div
                key={i}
                onClick={() => imc.handleMonthClick(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isSelected ? colors.primary : colors.muted,
                    marginBottom: '4px',
                  }}
                >
                  {valor}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      height: `${altura}px`,
                      background: isSelected ? colors.accent : colors.border,
                      borderRadius: '4px 4px 2px 2px',
                      transition: 'height 0.3s, background 0.2s',
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? colors.primary : colors.muted,
                  }}
                >
                  {mes}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== GRÁFICO DE LINHAS (EVOLUÇÃO) ===== */}
      <div
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.primary,
            margin: '0 0 20px',
          }}
        >
          Evolução Anual de IMC
        </h3>
        <svg viewBox="0 0 700 260" style={{ width: '100%', height: 'auto' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = 30 + (1 - pct) * 190;
            return (
              <g key={i}>
                <line
                  x1="50"
                  y1={y}
                  x2="680"
                  y2={y}
                  stroke={colors.border}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x="40"
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={colors.muted}
                >
                  {Math.round(imc.evolucaoPorStatus.maxCount * pct)}
                </text>
              </g>
            );
          })}
          {Object.entries(imc.evolucaoPorStatus.data).map(
            ([status, values]) => {
              const color = statusColorMap[status] || colors.muted;
              const points = values
                .map(
                  (v, i) =>
                    `${50 + (i / 11) * 630},${
                      imc.evolucaoPorStatus.maxCount > 0
                        ? 220 - (v / imc.evolucaoPorStatus.maxCount) * 190
                        : 220
                    }`
                )
                .join(' ');
              return (
                <g key={status}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {values.map((v, i) => {
                    const x = 50 + (i / 11) * 630;
                    const y =
                      imc.evolucaoPorStatus.maxCount > 0
                        ? 220 - (v / imc.evolucaoPorStatus.maxCount) * 190
                        : 220;
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill={colors.white}
                          stroke={color}
                          strokeWidth="2"
                        />
                        {v > 0 && (
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="600"
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
          {imc.meses.map((mes, i) => (
            <text
              key={i}
              x={50 + (i / 11) * 630}
              y={250}
              textAnchor="middle"
              fontSize="10"
              fill={colors.muted}
            >
              {mes}
            </text>
          ))}
        </svg>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(statusColorMap).map(([status, color]) => (
            <div
              key={status}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '2px',
                  background: color,
                  borderRadius: '1px',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: color,
                }}
              />
              <span style={{ fontSize: '12px', color: colors.secondary }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== TABELA INAPTOS ===== */}
      <div
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.primary,
              margin: 0,
            }}
          >
            Inaptos por Período
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => imc.handleSetPeriodoFiltro('mensal')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: `1px solid ${
                  imc.periodoFiltro === 'mensal' ? colors.accent : colors.border
                }`,
                background:
                  imc.periodoFiltro === 'mensal'
                    ? colors.accent
                    : 'transparent',
                color:
                  imc.periodoFiltro === 'mensal'
                    ? colors.white
                    : colors.secondary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Mensal
            </button>
            <button
              onClick={() => imc.handleSetPeriodoFiltro('trimestral')}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: `1px solid ${
                  imc.periodoFiltro === 'trimestral'
                    ? colors.accent
                    : colors.border
                }`,
                background:
                  imc.periodoFiltro === 'trimestral'
                    ? colors.accent
                    : 'transparent',
                color:
                  imc.periodoFiltro === 'trimestral'
                    ? colors.white
                    : colors.secondary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Trimestral
            </button>
            <button
              onClick={() => imc.setShowInaptosTable(!imc.showInaptosTable)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.secondary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {imc.showInaptosTable ? 'Ocultar' : 'Ver Detalhes'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: colors.secondary,
                  }}
                >
                  Período
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: colors.secondary,
                  }}
                >
                  Avaliados
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: colors.danger,
                  }}
                >
                  IMC≥35+Circ≥102
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: colors.warning,
                  }}
                >
                  Circ≥102
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: colors.secondary,
                  }}
                >
                  % Inaptos
                </th>
              </tr>
            </thead>
            <tbody>
              {imc.periodoFiltro === 'mensal'
                ? imc.meses.map((mes, idx) => {
                    const data = imc.inaptosData.porMes[mes];
                    if (!data || data.total === 0) return null;
                    return (
                      <tr
                        key={idx}
                        style={{ borderBottom: `1px solid ${colors.border}` }}
                        className="hover-bg transition"
                      >
                        <td
                          style={{
                            padding: '10px 12px',
                            fontWeight: 500,
                            color: colors.primary,
                          }}
                        >
                          {mes}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            color: colors.secondary,
                          }}
                        >
                          {data.total}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: colors.danger,
                          }}
                        >
                          {data.inaptosIMC35_Circ}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: colors.warning,
                          }}
                        >
                          {data.inaptosCirc}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: colors.secondary,
                          }}
                        >
                          {data.percentual}%
                        </td>
                      </tr>
                    );
                  })
                : ['Q1', 'Q2', 'Q3', 'Q4'].map((trim) => {
                    const data = imc.inaptosData.porTrimestre[trim];
                    if (!data || data.total === 0) return null;
                    return (
                      <tr
                        key={trim}
                        style={{ borderBottom: `1px solid ${colors.border}` }}
                        className="hover-bg transition"
                      >
                        <td
                          style={{
                            padding: '10px 12px',
                            fontWeight: 500,
                            color: colors.primary,
                          }}
                        >
                          {trim}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            color: colors.secondary,
                          }}
                        >
                          {data.total}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: colors.danger,
                          }}
                        >
                          {data.inaptosIMC35_Circ}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: colors.warning,
                          }}
                        >
                          {data.inaptosCirc}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: colors.secondary,
                          }}
                        >
                          {data.percentual}%
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {imc.inaptosData.todosInaptos.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: colors.muted,
              }}
            >
              Nenhum inapto neste período.
            </div>
          )}
        </div>
        {imc.showInaptosTable && imc.inaptosData.todosInaptos.length > 0 && (
          <div style={{ marginTop: '24px', animation: 'slideDown 0.2s ease' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: colors.primary,
                marginBottom: '12px',
              }}
            >
              Detalhes dos Inaptos
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      Código
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      Data
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      IMC
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      Circ (cm)
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      Circ/Altura
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      Motivo
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: colors.secondary,
                      }}
                    >
                      Empresa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {imc.inaptosData.todosInaptos.map(
                    (item: any, idx: number) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: `1px solid ${colors.border}` }}
                        className="hover-bg transition"
                      >
                        <td
                          style={{
                            padding: '8px 10px',
                            fontWeight: 500,
                            color: colors.primary,
                          }}
                        >
                          {item.codigo}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            color: colors.secondary,
                          }}
                        >
                          {item.data || '-'}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color:
                              item.imc >= 30 ? colors.danger : colors.success,
                          }}
                        >
                          {item.imc.toFixed(1)}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color:
                              item.circunferencia >= 102
                                ? colors.danger
                                : colors.success,
                          }}
                        >
                          {item.circunferencia}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            color: colors.secondary,
                          }}
                        >
                          {item.relacaoCircAltura.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background:
                                item.motivo === 'IMC ≥ 35 + Circ ≥ 102'
                                  ? '#fde8e8'
                                  : '#fdf3e8',
                              color:
                                item.motivo === 'IMC ≥ 35 + Circ ≥ 102'
                                  ? colors.danger
                                  : '#b38b3a',
                            }}
                          >
                            {item.motivo}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            color: colors.secondary,
                          }}
                        >
                          {item.empresa || '-'}
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

      {/* ===== TABELA DETALHADA ===== */}
      <div
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.primary,
              margin: 0,
            }}
          >
            Detalhamento
          </h3>
          <span
            style={{
              fontSize: '13px',
              color: colors.muted,
              background: colors.light,
              padding: '4px 12px',
              borderRadius: '20px',
            }}
          >
            {imc.filteredData.length} registros
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
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
                  'Frente',
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: colors.secondary,
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {imc.filteredData.map((emp: Employee, idx: number) => {
                const bmi = imc.getIMC(emp);
                const status = emp.statusImc || imc.getBMIClassification(bmi);
                const variacao = emp.variacaoPeso || 0;
                const variacaoLabel =
                  variacao > 0.5
                    ? 'Aumentou'
                    : variacao < -0.5
                    ? 'Diminuiu'
                    : 'Manteve';
                const variacaoColor =
                  variacao > 0.5
                    ? colors.danger
                    : variacao < -0.5
                    ? colors.success
                    : colors.warning;
                const statusColor =
                  bmi >= 30
                    ? colors.danger
                    : bmi >= 25
                    ? colors.warning
                    : colors.success;
                return (
                  <tr
                    key={emp.id}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                    className="hover-bg transition"
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 500,
                        color: colors.primary,
                      }}
                    >
                      {emp.codigo}
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: colors.secondary }}
                    >
                      {emp.dataStr || '-'}
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: colors.secondary }}
                    >
                      {emp.height ? `${emp.height} cm` : '-'}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 500,
                        color: colors.primary,
                      }}
                    >
                      {emp.weight.toFixed(1)} kg
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 600,
                        color: statusColor,
                      }}
                    >
                      {bmi > 0 ? bmi.toFixed(1) : '-'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: `${statusColor}15`,
                          color: statusColor,
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: colors.secondary }}
                    >
                      {emp.circunferencia > 0
                        ? `${emp.circunferencia.toFixed(1)} cm`
                        : '-'}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 600,
                        color: variacaoColor,
                      }}
                    >
                      {variacao > 0 ? '+' : ''}
                      {variacao.toFixed(2)} kg
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: `${variacaoColor}15`,
                          color: variacaoColor,
                        }}
                      >
                        {variacaoLabel}
                      </span>
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: colors.secondary }}
                    >
                      {emp.company}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {imc.filteredData.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.muted,
              }}
            >
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
