// app/PreMERModule.tsx
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import jsPDF from 'jspdf';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

interface Employee {
  id?: string | number;
  codigo?: string | number;
  name?: string;
  nome?: string;
  cargo?: string;
  departamento?: string;
}

interface PreMERModuleProps {
  styles?: any;
  employees?: Employee[];
}

interface VitalSigns {
  temperatura: string;
  frequencia: string;
  pressaoSistolica: string;
  pressaoDiastolica: string;
}

type QuestionKey = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9';

interface Questionnaire {
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  q5: boolean;
  q6: boolean;
  q7: boolean;
  q8: boolean;
  q9: boolean;
}

type ProfissionaisSaude = 'sim' | 'nao' | null;
type AptidaoStatus = 'apto' | 'inapto' | null;

interface QuestionDefinition {
  key: QuestionKey;
  text: string;
  labelPDF: string;
  planoAcao: string;
}

interface PlanoAcaoItem {
  parametro: string;
  status: 'ok' | 'atencao' | 'critico';
  mensagem: string;
  acao: string;
  prazo: string;
  responsavel: string;
}

// ============================================================
// CONSTANTES
// ============================================================

const DEFAULT_VITALS: VitalSigns = {
  temperatura: '',
  frequencia: '',
  pressaoSistolica: '',
  pressaoDiastolica: '',
};

const DEFAULT_QUESTOES: Questionnaire = {
  q1: false,
  q2: false,
  q3: false,
  q4: false,
  q5: false,
  q6: false,
  q7: false,
  q8: false,
  q9: false,
};

const TEMPERATURA_MIN = 36.1;
const TEMPERATURA_MAX = 36.9;
const FREQUENCIA_MIN = 60;
const FREQUENCIA_MAX = 100;
const PRESSÃO_SISTOLICA_MIN = 90;
const PRESSÃO_SISTOLICA_MAX = 140;
const PRESSÃO_DIASTOLICA_MIN = 60;
const PRESSÃO_DIASTOLICA_MAX = 90;

const QUESTOES_DEFINITIONS: QuestionDefinition[] = [
  {
    key: 'q1',
    text: 'Refere alguma queixa cardiovascular (Dispnéia, dor precordial, cansaço, tontura, palpitação)? A pressão arterial está alterada?',
    labelPDF: 'Queixa cardiovascular',
    planoAcao:
      'Encaminhar ao cardiologista para avaliação completa. Realizar ECG e teste ergométrico. Suspender atividades de mergulho até liberação médica.',
  },
  {
    key: 'q2',
    text: 'Refere alguma queixa respiratória (Estado gripal, congestão nasal, rinite alérgica, dispnéia, tosse, cansaço, bronquite)?',
    labelPDF: 'Queixa respiratória',
    planoAcao:
      'Avaliação por pneumologista. Realizar espirometria e radiografia de tórax. Tratar sintomas antes de liberar para mergulho.',
  },
  {
    key: 'q3',
    text: 'Refere algum problema nas orelhas (Zumbido, Dor, prurido, secreção, tonteira, vertigens e dificuldade para equalizar ouvido médio)?',
    labelPDF: 'Problemas nas orelhas',
    planoAcao:
      'Encaminhar ao otorrinolaringologista. Realizar audiometria e avaliação da tuba auditiva. Orientar sobre técnicas de equalização.',
  },
  {
    key: 'q4',
    text: 'Apresenta alguma queixa digestiva (Azia, dor epigástrica em queimação, cólicas, diarreia, constipação intestinal)?',
    labelPDF: 'Queixa digestiva',
    planoAcao:
      'Avaliação com gastroenterologista. Orientar sobre alimentação adequada. Evitar refeições pesadas antes do mergulho.',
  },
  {
    key: 'q5',
    text: 'Apresenta alguma queixa urinária (Ardência urinária, secreção uretral, cólica renal)?',
    labelPDF: 'Queixa urinária',
    planoAcao:
      'Encaminhar ao urologista/néfrologista. Realizar exame de urina e urocultura. Avaliar função renal.',
  },
  {
    key: 'q6',
    text: 'Refere alguma queixa na qualidade do sono e descanso adequado?',
    labelPDF: 'Qualidade do sono',
    planoAcao:
      'Orientar sobre higiene do sono. Avaliar necessidade de polissonografia. Encaminhar ao neurologista se necessário.',
  },
  {
    key: 'q7',
    text: 'Apresenta algum problema de ordem emocional ou familiar que possa desaconselhar o mergulho?',
    labelPDF: 'Problema emocional/familiar',
    planoAcao:
      'Encaminhar ao psicólogo/psiquiatra. Avaliar impacto na segurança do mergulho. Suspender atividades até estabilização.',
  },
  {
    key: 'q8',
    text: 'Relata queixa de dores nas articulações ou alguma queixa que seja parecido com doença descompressiva?',
    labelPDF: 'Dores articulares',
    planoAcao:
      'Avaliação com ortopedista/reumatologista. Realizar exames de imagem. Verificar histórico de acidentes de mergulho.',
  },
  {
    key: 'q9',
    text: 'Relata alguma outra queixa de saúde não abordada acima?',
    labelPDF: 'Outras queixas',
    planoAcao:
      'Avaliação clínica geral. Investigar queixa específica. Encaminhar ao especialista conforme necessidade.',
  },
];

const QUESTOES_DB_MAPPING: Record<QuestionKey, string> = {
  q1: 'cardiovascular',
  q2: 'respiratorio',
  q3: 'ouvidos',
  q4: 'digestivo',
  q5: 'urinario',
  q6: 'sono',
  q7: 'emocional',
  q8: 'articular',
  q9: 'outras',
};

// ============================================================
// HOOK PERSONALIZADO PARA ASSINATURA
// ============================================================

function useSignatureCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [signatureData, setSignatureData] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = (rect.width || 400) * dpr;
    canvas.height = (rect.height || 150) * dpr;
    canvas.style.width = `${rect.width || 400}px`;
    canvas.style.height = `${rect.height || 150}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
      isInitializedRef.current = true;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  const getCoordinates = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const dpr = window.devicePixelRatio || 1;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width / dpr),
        y: (clientY - rect.top) * (canvas.height / rect.height / dpr),
      };
    },
    [canvasRef]
  );

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (!isInitializedRef.current) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (rect.width || 400) * dpr;
        canvas.height = (rect.height || 150) * dpr;
        canvas.style.width = `${rect.width || 400}px`;
        canvas.style.height = `${rect.height || 150}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctxRef.current = ctx;
          isInitializedRef.current = true;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      const ctx = ctxRef.current;
      if (!ctx) return;

      setIsDrawing(true);
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [canvasRef, getCoordinates]
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = ctxRef.current;
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, getCoordinates]
  );

  const endDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setSignatureData(dataUrl);
      } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
      }
    }
  }, [canvasRef]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setSignatureData('');
        isInitializedRef.current = false;
      }
    }
  }, [canvasRef]);

  return { signatureData, startDrawing, draw, endDrawing, clear };
}

// ============================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================

function calcularAptidao(
  questoes: Questionnaire,
  temperatura: string,
  frequencia: string,
  pressaoSistolica: string,
  pressaoDiastolica: string
): AptidaoStatus {
  const temp = parseFloat(temperatura);
  const freq = parseFloat(frequencia);
  const sist = parseFloat(pressaoSistolica);
  const diast = parseFloat(pressaoDiastolica);

  const temQuestaoSim = Object.values(questoes).some(Boolean);

  const hasAllData =
    temperatura !== '' &&
    frequencia !== '' &&
    pressaoSistolica !== '' &&
    pressaoDiastolica !== '';

  if (!hasAllData) return null;

  const temperaturaValida =
    !isNaN(temp) && temp >= TEMPERATURA_MIN && temp <= TEMPERATURA_MAX;
  const frequenciaValida =
    !isNaN(freq) && freq > FREQUENCIA_MIN && freq < FREQUENCIA_MAX;
  const pressaoValida =
    !isNaN(sist) &&
    !isNaN(diast) &&
    sist > PRESSÃO_SISTOLICA_MIN &&
    sist < PRESSÃO_SISTOLICA_MAX &&
    diast > PRESSÃO_DIASTOLICA_MIN &&
    diast < PRESSÃO_DIASTOLICA_MAX;

  if (
    temQuestaoSim ||
    !temperaturaValida ||
    !frequenciaValida ||
    !pressaoValida
  ) {
    return 'inapto';
  }
  return 'apto';
}

function isTemperaturaValida(temperatura: string): boolean {
  if (!temperatura) return false;
  const temp = parseFloat(temperatura);
  return !isNaN(temp) && temp >= TEMPERATURA_MIN && temp <= TEMPERATURA_MAX;
}

function isFrequenciaValida(frequencia: string): boolean {
  if (!frequencia) return false;
  const freq = parseFloat(frequencia);
  return !isNaN(freq) && freq > FREQUENCIA_MIN && freq < FREQUENCIA_MAX;
}

function isPressaoValida(sistolica: string, diastolica: string): boolean {
  if (!sistolica || !diastolica) return false;
  const sist = parseFloat(sistolica);
  const diast = parseFloat(diastolica);
  return (
    !isNaN(sist) &&
    !isNaN(diast) &&
    sist > PRESSÃO_SISTOLICA_MIN &&
    sist < PRESSÃO_SISTOLICA_MAX &&
    diast > PRESSÃO_DIASTOLICA_MIN &&
    diast < PRESSÃO_DIASTOLICA_MAX
  );
}

function gerarPlanoAcaoCompleto(
  questoes: Questionnaire,
  temperatura: string,
  frequencia: string,
  pressaoSistolica: string,
  pressaoDiastolica: string
): PlanoAcaoItem[] {
  const plano: PlanoAcaoItem[] = [];
  const temp = parseFloat(temperatura);
  const freq = parseFloat(frequencia);
  const sist = parseFloat(pressaoSistolica);
  const diast = parseFloat(pressaoDiastolica);

  if (temperatura && !isNaN(temp)) {
    if (temp < TEMPERATURA_MIN || temp > TEMPERATURA_MAX) {
      plano.push({
        parametro: 'Temperatura Corporal',
        status: temp < TEMPERATURA_MIN ? 'critico' : 'atencao',
        mensagem: `Temperatura ${temperatura}°C - Fora do range ideal (${TEMPERATURA_MIN}-${TEMPERATURA_MAX}°C)`,
        acao:
          temp < TEMPERATURA_MIN
            ? 'Aquecer o colaborador com cobertores térmicos. Oferecer bebidas quentes. Repetir medição após 30 minutos. Se persistir, encaminhar para avaliação médica.'
            : 'Resfriar o colaborador com compressas frias. Oferecer água. Repetir medição após 30 minutos. Se persistir, encaminhar para avaliação médica.',
        prazo: 'Imediato (até 1 hora)',
        responsavel: 'Técnico de Enfermagem / EMED',
      });
    }
  }

  if (frequencia && !isNaN(freq)) {
    if (freq <= FREQUENCIA_MIN || freq >= FREQUENCIA_MAX) {
      plano.push({
        parametro: 'Frequência Cardíaca',
        status: 'critico',
        mensagem: `Frequência ${frequencia} bpm - Fora do range ideal (${
          FREQUENCIA_MIN + 1
        }-${FREQUENCIA_MAX - 1} bpm)`,
        acao:
          freq <= FREQUENCIA_MIN
            ? 'Repouso imediato. Oferecer líquidos. Avaliar sinais de hipotensão. Encaminhar ao médico se persistir.'
            : 'Repouso imediato. Avaliar sinais de ansiedade ou estresse. Verificar pressão arterial. Encaminhar ao médico se persistir.',
        prazo: 'Imediato (até 1 hora)',
        responsavel: 'Técnico de Enfermagem / EMED',
      });
    }
  }

  if (pressaoSistolica && pressaoDiastolica && !isNaN(sist) && !isNaN(diast)) {
    if (
      sist <= PRESSÃO_SISTOLICA_MIN ||
      sist >= PRESSÃO_SISTOLICA_MAX ||
      diast <= PRESSÃO_DIASTOLICA_MIN ||
      diast >= PRESSÃO_DIASTOLICA_MAX
    ) {
      plano.push({
        parametro: 'Pressão Arterial',
        status: 'critico',
        mensagem: `Pressão ${pressaoSistolica}/${pressaoDiastolica} mmHg - Fora do range ideal (${
          PRESSÃO_SISTOLICA_MIN + 1
        }-${PRESSÃO_SISTOLICA_MAX - 1}x${PRESSÃO_DIASTOLICA_MIN + 1}-${
          PRESSÃO_DIASTOLICA_MAX - 1
        } mmHg)`,
        acao:
          sist >= PRESSÃO_SISTOLICA_MAX
            ? 'Repouso imediato. Evitar esforços. Repetir medição após 15 minutos. Se persistir, encaminhar ao médico do trabalho para avaliação cardiovascular.'
            : 'Repouso imediato. Oferecer líquidos. Repetir medição após 15 minutos. Avaliar necessidade de encaminhamento médico.',
        prazo: 'Imediato (até 1 hora)',
        responsavel: 'Técnico de Enfermagem / EMED',
      });
    }
  }

  QUESTOES_DEFINITIONS.forEach((q) => {
    if (questoes[q.key]) {
      plano.push({
        parametro: q.labelPDF,
        status: 'critico',
        mensagem: `Queixa identificada: ${q.text}`,
        acao: q.planoAcao,
        prazo: '24-72 horas',
        responsavel: 'Médico do Trabalho / Especialista',
      });
    }
  });

  return plano;
}

// ============================================================
// COMPONENTES
// ============================================================

function SignatureBox({
  label,
  icon,
  canvasRef,
  startDrawing,
  draw,
  endDrawing,
  clear,
  hasSignature,
  canvasStyle,
  labelStyle,
}: any) {
  return (
    <div style={{ flex: 1, minWidth: '280px' }}>
      <i
        className={icon}
        style={{ fontSize: '24px', marginBottom: '12px', color: '#10b981' }}
      />
      <div style={labelStyle}>{label}</div>
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      <button
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: '#dc2626',
          marginTop: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
        }}
        onClick={clear}
      >
        <i className="fas fa-eraser" style={{ marginRight: '6px' }} />
        Limpar Assinatura
      </button>
      {hasSignature && (
        <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '6px' }} />
          Assinatura registrada
        </div>
      )}
    </div>
  );
}

function VitalInputCard({
  label,
  value,
  onChange,
  unit,
  paramRange,
  isValid,
  icon,
  showCheck = true,
  placeholder = '0',
  isPressao = false,
  valueDiastolica = '',
  onChangeDiastolica = () => {},
}: any) {
  if (isPressao) {
    return (
      <div
        style={{
          background: '#f8f5f2',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #f0ebe6',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#6b6b6b',
            display: 'block',
            marginBottom: '8px',
          }}
        >
          <i
            className={icon}
            style={{ marginRight: '6px', fontSize: '14px' }}
          />
          {label}
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <input
            type="number"
            step="1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '70px',
              textAlign: 'center',
              fontSize: '28px',
              border: 'none',
              outline: 'none',
              fontWeight: 700,
              color: '#1a1a1a',
              background: 'transparent',
            }}
            placeholder={placeholder}
          />
          <span style={{ fontSize: '18px', color: '#6b6b6b' }}>/</span>
          <input
            type="number"
            step="1"
            value={valueDiastolica}
            onChange={(e) => onChangeDiastolica(e.target.value)}
            style={{
              width: '70px',
              textAlign: 'center',
              fontSize: '28px',
              border: 'none',
              outline: 'none',
              fontWeight: 700,
              color: '#1a1a1a',
              background: 'transparent',
            }}
            placeholder={placeholder}
          />
          <span style={{ fontSize: '18px', color: '#6b6b6b' }}>mmHg</span>
          {showCheck && value && valueDiastolica && (
            <i
              className="fas fa-check-circle"
              style={{
                color:
                  isValid !== undefined && value && valueDiastolica
                    ? isValid
                      ? '#10b981'
                      : '#ef4444'
                    : '#6b6b6b',
                fontSize: '24px',
                marginLeft: '12px',
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>
        <div
          style={{
            fontSize: '12px',
            color:
              isValid !== undefined && value && valueDiastolica
                ? isValid
                  ? '#10b981'
                  : '#dc2626'
                : '#6b6b6b',
            fontWeight: value && valueDiastolica && !isValid ? 600 : 400,
          }}
        >
          {value && valueDiastolica
            ? isValid !== undefined
              ? isValid
                ? '✅ Parâmetro normal'
                : '⚠️ Fora do range ideal'
              : `Parâmetro: ${paramRange}`
            : `Preencha os valores - ${paramRange}`}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#f8f5f2',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        border: '1px solid #f0ebe6',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#6b6b6b',
          display: 'block',
          marginBottom: '8px',
        }}
      >
        <i className={icon} style={{ marginRight: '6px', fontSize: '14px' }} />
        {label}
      </div>
      <div
        style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '8px 0',
        }}
      >
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: unit.includes('/') ? '60px' : '80px',
            textAlign: 'center',
            fontSize: '28px',
            border: 'none',
            outline: 'none',
            fontWeight: 700,
            color: '#1a1a1a',
            background: 'transparent',
          }}
          placeholder={placeholder}
        />
        <span style={{ fontSize: '18px', color: '#6b6b6b' }}>{unit}</span>
        {showCheck && value && (
          <i
            className="fas fa-check-circle"
            style={{
              color:
                isValid !== undefined && value
                  ? isValid
                    ? '#10b981'
                    : '#ef4444'
                  : '#6b6b6b',
              fontSize: '24px',
              marginLeft: '12px',
              verticalAlign: 'middle',
            }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: '12px',
          color:
            isValid !== undefined && value
              ? isValid
                ? '#10b981'
                : '#dc2626'
              : '#6b6b6b',
          fontWeight: value && !isValid ? 600 : 400,
        }}
      >
        {value
          ? isValid !== undefined
            ? isValid
              ? '✅ Parâmetro normal'
              : '⚠️ Fora do range ideal'
            : `Parâmetro: ${paramRange}`
          : `Preencha o valor - ${paramRange}`}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  isChecked,
  onChange,
  hasIssueStyle,
  normalStyle,
  radioGroupStyle,
  radioLabelStyle,
}: any) {
  return (
    <div style={isChecked ? hasIssueStyle : normalStyle}>
      <div style={{ fontWeight: 500, marginBottom: '12px', color: '#2d2d2d' }}>
        {question.text}
        {isChecked && (
          <span style={{ color: '#dc2626', marginLeft: '8px' }}>
            <i className="fas fa-exclamation-triangle" />
          </span>
        )}
      </div>
      <div style={radioGroupStyle}>
        <label style={radioLabelStyle}>
          <input
            type="radio"
            name={question.key}
            checked={isChecked === true}
            onChange={() => onChange(question.key, true)}
          />{' '}
          Sim
        </label>
        <label style={radioLabelStyle}>
          <input
            type="radio"
            name={question.key}
            checked={isChecked === false}
            onChange={() => onChange(question.key, false)}
          />{' '}
          Não
        </label>
      </div>
    </div>
  );
}

function PlanoAcaoPopup({
  plano,
  onClose,
  onSave,
  colaboradorNome,
  loading,
}: {
  plano: PlanoAcaoItem[];
  onClose: () => void;
  onSave: () => void;
  colaboradorNome: string;
  loading: boolean;
}) {
  if (plano.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #fee2e2',
            paddingBottom: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#dc2626',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <i className="fas fa-exclamation-triangle" />
              PLANO DE AÇÃO OBRIGATÓRIO
            </h2>
            <p
              style={{
                margin: '4px 0 0 0',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              Colaborador: <strong>{colaboradorNome}</strong> - Avaliação INAPTO
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              background: '#fef2f2',
              borderRadius: '12px',
              padding: '12px 16px',
              border: '1px solid #fecaca',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>
              <i
                className="fas fa-exclamation-circle"
                style={{ marginRight: '8px' }}
              />
              <strong>ATENÇÃO:</strong> Os seguintes parâmetros foram
              identificados como INAPTOS. Um plano de ação deve ser executado
              antes de uma nova avaliação.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {plano.map((item, index) => (
            <div
              key={index}
              style={{
                background: '#fffbeb',
                borderRadius: '12px',
                padding: '16px',
                borderLeft: `4px solid ${
                  item.status === 'critico' ? '#dc2626' : '#f59e0b'
                }`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <strong style={{ fontSize: '16px', color: '#1a1a1a' }}>
                  {item.parametro}
                </strong>
                <span
                  style={{
                    padding: '2px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background:
                      item.status === 'critico' ? '#fee2e2' : '#fef3c7',
                    color: item.status === 'critico' ? '#991b1b' : '#92400e',
                  }}
                >
                  {item.status === 'critico' ? '🔴 CRÍTICO' : '🟡 ATENÇÃO'}
                </span>
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: '#4b5563',
                  margin: '4px 0 8px 0',
                }}
              >
                <i
                  className="fas fa-clipboard-list"
                  style={{ marginRight: '6px' }}
                />
                <strong>Diagnóstico:</strong> {item.mensagem}
              </p>

              <div
                style={{
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '8px',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    color: '#065f46',
                    margin: '0 0 4px 0',
                  }}
                >
                  <i
                    className="fas fa-check-circle"
                    style={{ marginRight: '6px' }}
                  />
                  <strong>Ação Recomendada:</strong> {item.acao}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    <i
                      className="fas fa-clock"
                      style={{ marginRight: '4px' }}
                    />
                    <strong>Prazo:</strong> {item.prazo}
                  </span>
                  <span>
                    <i
                      className="fas fa-user-md"
                      style={{ marginRight: '4px' }}
                    />
                    <strong>Responsável:</strong> {item.responsavel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            background: '#fef3c7',
            borderRadius: '12px',
            border: '1px solid #fcd34d',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: '#92400e',
              textAlign: 'center',
            }}
          >
            <i className="fas fa-info-circle" style={{ marginRight: '8px' }} />
            <strong>
              O colaborador só será liberado após a resolução de todos os
              parâmetros críticos.
            </strong>
            <br />
            Após a execução do plano, realize uma nova avaliação.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: '#f3f4f6',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
          >
            <i className="fas fa-times" style={{ marginRight: '8px' }} />
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            style={{
              flex: 2,
              padding: '14px',
              background: loading
                ? '#d1d5db'
                : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? (
              <>
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ marginRight: '8px' }}
                />
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save" style={{ marginRight: '8px' }} />
                Salvar Avaliação com Plano de Ação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PreMERModule({
  styles = {},
  employees = [],
}: PreMERModuleProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [colaborador, setColaborador] = useState('');
  const [colaboradorId, setColaboradorId] = useState<string | null>(null);
  const [colaboradorCodigo, setColaboradorCodigo] = useState('');
  const [funcao, setFuncao] = useState('');
  const [frente, setFrente] = useState('');

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(DEFAULT_VITALS);
  const [questoes, setQuestoes] = useState<Questionnaire>(DEFAULT_QUESTOES);
  const [nomeAvaliador, setNomeAvaliador] = useState('');
  const [profissionalSaude, setProfissionalSaude] =
    useState<ProfissionaisSaude>(null);
  const [aptidao, setAptidao] = useState<AptidaoStatus>(null);
  const [planoAcao, setPlanoAcao] = useState<PlanoAcaoItem[]>([]);
  const [showPlanoPopup, setShowPlanoPopup] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const canvasRefAvaliador = useRef<HTMLCanvasElement>(null);
  const canvasRefMergulhador = useRef<HTMLCanvasElement>(null);

  const avaliadorCanvas = useSignatureCanvas(canvasRefAvaliador);
  const mergulhadorCanvas = useSignatureCanvas(canvasRefMergulhador);

  // ============================================================
  // COMPORTAMENTOS DERIVADOS
  // ============================================================

  const aptidaoAtual = useMemo(
    () =>
      calcularAptidao(
        questoes,
        vitalSigns.temperatura,
        vitalSigns.frequencia,
        vitalSigns.pressaoSistolica,
        vitalSigns.pressaoDiastolica
      ),
    [questoes, vitalSigns]
  );

  const isApto = aptidaoAtual === 'apto';
  const temQuestaoSim = useMemo(
    () => Object.values(questoes).some(Boolean),
    [questoes]
  );
  const temperaturaValida = useMemo(
    () => isTemperaturaValida(vitalSigns.temperatura),
    [vitalSigns.temperatura]
  );
  const frequenciaValida = useMemo(
    () => isFrequenciaValida(vitalSigns.frequencia),
    [vitalSigns.frequencia]
  );
  const pressaoValida = useMemo(
    () =>
      isPressaoValida(
        vitalSigns.pressaoSistolica,
        vitalSigns.pressaoDiastolica
      ),
    [vitalSigns.pressaoSistolica, vitalSigns.pressaoDiastolica]
  );

  const planoAcaoAtual = useMemo(
    () =>
      gerarPlanoAcaoCompleto(
        questoes,
        vitalSigns.temperatura,
        vitalSigns.frequencia,
        vitalSigns.pressaoSistolica,
        vitalSigns.pressaoDiastolica
      ),
    [questoes, vitalSigns]
  );

  useEffect(() => {
    if (colaborador) {
      setAptidao(aptidaoAtual);
      setPlanoAcao(planoAcaoAtual);
    }
  }, [colaborador, aptidaoAtual, planoAcaoAtual]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleVitalChange = useCallback(
    (field: keyof VitalSigns, value: string) => {
      setVitalSigns((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleQuestaoChange = useCallback(
    (key: QuestionKey, value: boolean) => {
      setQuestoes((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleEmployeeSelect = useCallback(
    (employeeId: string) => {
      if (!employeeId) {
        setSelectedEmployeeId('');
        setColaborador('');
        setColaboradorId(null);
        setColaboradorCodigo('');
        setFuncao('');
        setFrente('');
        setAptidao(null);
        setPlanoAcao([]);
        setShowPlanoPopup(false);
        resetForm();
        return;
      }

      const employee = employees.find((e) => {
        const eId = e.id?.toString();
        const eCodigo = e.codigo?.toString();
        return eId === employeeId || eCodigo === employeeId;
      });

      if (employee) {
        setSelectedEmployeeId(employeeId);
        setColaborador(employee.name || employee.nome || '');
        setColaboradorId(employee.id?.toString() || null);
        setColaboradorCodigo(employee.codigo?.toString() || '');
        setFuncao(employee.cargo || '');
        setFrente(employee.departamento || '');
        setAptidao(null);
        setPlanoAcao([]);
        setShowPlanoPopup(false);
      } else {
        alert('Colaborador não encontrado!');
      }
    },
    [employees]
  );

  const resetForm = useCallback(() => {
    setVitalSigns({ ...DEFAULT_VITALS });
    setQuestoes({ ...DEFAULT_QUESTOES });
    setNomeAvaliador('');
    setProfissionalSaude(null);
    setAptidao(null);
    setPlanoAcao([]);
    setShowPlanoPopup(false);
    avaliadorCanvas.clear();
    mergulhadorCanvas.clear();
  }, [avaliadorCanvas, mergulhadorCanvas]);

  // ============================================================
  // GERAR PDF E SALVAR NO SUPABASE STORAGE
  // ============================================================

  const gerarPDF = useCallback(async (): Promise<{
    url: string;
    filename: string;
  } | null> => {
    setGerandoPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const PW = pdf.internal.pageSize.getWidth();
      const PH = pdf.internal.pageSize.getHeight();
      const ML = 15;
      const CW = PW - 2 * ML;
      let y = 20;

      // ── Palette ──────────────────────────────────────────────
      const NAVY = [15, 52, 86] as [number, number, number];
      const TEAL = [16, 185, 129] as [number, number, number];
      const RED = [220, 38, 38] as [number, number, number];
      const GREEN = [5, 150, 105] as [number, number, number];
      const GRAY1 = [245, 247, 250] as [number, number, number];
      const GRAY2 = [229, 231, 235] as [number, number, number];
      const DARK = [17, 24, 39] as [number, number, number];
      const MID = [75, 85, 99] as [number, number, number];
      const MUTED = [156, 163, 175] as [number, number, number];
      const WHITE = [255, 255, 255] as [number, number, number];

      const clean = (s: string) =>
        s?.replace(/[^\x00-\x7F]/g, '').trim() || '—';

      const addPageFooter = () => {
        pdf.setFillColor(...NAVY);
        pdf.rect(0, PH - 10, PW, 10, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          clean(
            `Documento gerado em ${new Date().toLocaleString(
              'pt-BR'
            )} - Avaliacao Pre-MER - Valido por 30 dias`
          ),
          PW / 2,
          PH - 4,
          { align: 'center' }
        );
        pdf.setTextColor(...DARK);
      };

      const checkPage = (needed: number = 35) => {
        if (y > PH - needed) {
          pdf.addPage();
          y = 20;
          addPageFooter();
        }
      };

      const sectionTitle = (
        title: string,
        color: [number, number, number] = NAVY,
        bgColor: [number, number, number] = GRAY1
      ) => {
        checkPage(25);
        pdf.setFillColor(...bgColor);
        pdf.roundedRect(ML, y, CW, 9, 2, 2, 'F');
        pdf.setFillColor(...color);
        pdf.rect(ML, y, 3, 9, 'F');
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(title, ML + 7, y + 6);
        pdf.setTextColor(...DARK);
        y += 14;
      };

      const field = (
        label: string,
        value: string,
        x: number,
        fieldY: number
      ) => {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...MUTED);
        pdf.text(clean(label.toUpperCase()), x, fieldY);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DARK);
        pdf.text(clean(value || '—'), x, fieldY + 5);
        pdf.setFont('helvetica', 'normal');
      };

      const pill = (text: string, x: number, pillY: number, ok: boolean) => {
        const [r, g, b] = ok ? GREEN : RED;
        const tw = pdf.getTextWidth(clean(text));
        const pw2 = tw + 8;
        pdf.setFillColor(r, g, b, 0.12);
        pdf.roundedRect(x, pillY - 4, pw2, 6, 1, 1, 'F');
        pdf.setTextColor(r, g, b);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(clean(text), x + 4, pillY);
        pdf.setTextColor(...DARK);
        pdf.setFont('helvetica', 'normal');
      };

      // ════════════════════════════════════════════════════════
      // 1. HEADER
      // ════════════════════════════════════════════════════════
      pdf.setFillColor(...NAVY);
      pdf.rect(0, 0, PW, 42, 'F');

      pdf.setFillColor(...TEAL);
      pdf.rect(0, 39, PW, 3, 'F');

      pdf.setFillColor(255, 255, 255, 0.04);
      pdf.circle(PW - 10, 10, 28, 'F');
      pdf.setFillColor(255, 255, 255, 0.03);
      pdf.circle(PW - 10, 10, 18, 'F');

      pdf.setFillColor(...TEAL);
      pdf.rect(ML, 8, 2.5, 24, 'F');

      pdf.setTextColor(...WHITE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(26);
      pdf.text('PRE-MER', ML + 8, 24);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(180, 210, 230);
      pdf.text('AVALIACAO PRE-MERGULHO', ML + 8, 33);

      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const docNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      pdf.setTextColor(...WHITE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('DATA', PW - ML - 28, 16, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(dataAtual, PW - ML - 28, 22, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('N. DOCUMENTO', PW - ML - 28, 30, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(docNum, PW - ML - 28, 36, { align: 'right' });

      pdf.setTextColor(...DARK);
      y = 48;

      // ════════════════════════════════════════════════════════
      // 2. META INFO STRIP
      // ════════════════════════════════════════════════════════
      pdf.setFillColor(...GRAY1);
      pdf.rect(ML, y, CW, 14, 'F');
      pdf.setDrawColor(...GRAY2);
      pdf.setLineWidth(0.3);
      pdf.rect(ML, y, CW, 14, 'S');

      field(
        'Profissional de Saude / EMED / DMT',
        nomeAvaliador || 'Nao informado',
        ML + 5,
        y + 5
      );

      if (aptidao !== null) {
        const statusLabel = aptidao === 'apto' ? 'APTO' : 'INAPTO';
        pill(statusLabel, PW - ML - 32, y + 8, aptidao === 'apto');
      } else {
        pdf.setFontSize(7);
        pdf.setTextColor(...MUTED);
        pdf.text('STATUS: AGUARDANDO DADOS', PW - ML - 5, y + 8, {
          align: 'right',
        });
      }

      y += 19;

      // ════════════════════════════════════════════════════════
      // 3. DADOS DO COLABORADOR
      // ════════════════════════════════════════════════════════
      sectionTitle('DADOS DO COLABORADOR');

      const col1X = ML + 4;
      const col2X = ML + CW / 2 + 4;
      const rowH = 12;

      pdf.setFillColor(...GRAY1);
      pdf.roundedRect(ML, y - 2, CW, rowH * 2 + 6, 2, 2, 'F');
      pdf.setDrawColor(...GRAY2);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(ML, y - 2, CW, rowH * 2 + 6, 2, 2, 'S');

      field('Nome Completo', colaborador, col1X, y + 3);
      field('Codigo', colaboradorCodigo || 'N/I', col2X, y + 3);
      y += rowH;
      field('Funcao / Cargo', funcao || 'Nao definida', col1X, y + 3);
      field('Frente de Servico', frente || 'Nao definida', col2X, y + 3);
      y += rowH + 4;

      // ════════════════════════════════════════════════════════
      // 4. SINAIS VITAIS
      // ════════════════════════════════════════════════════════
      y += 4;
      sectionTitle('SINAIS VITAIS');

      const boxW = (CW - 8) / 3;
      const boxH = 28;
      const vitals = [
        {
          label: 'Temperatura',
          value: vitalSigns.temperatura ? `${vitalSigns.temperatura} C` : 'N/I',
          range: `${TEMPERATURA_MIN} - ${TEMPERATURA_MAX} C`,
          ok: temperaturaValida,
          hasData: !!vitalSigns.temperatura,
        },
        {
          label: 'Frequencia Cardiaca',
          value: vitalSigns.frequencia ? `${vitalSigns.frequencia} bpm` : 'N/I',
          range: `${FREQUENCIA_MIN + 1} - ${FREQUENCIA_MAX - 1} bpm`,
          ok: frequenciaValida,
          hasData: !!vitalSigns.frequencia,
        },
        {
          label: 'Pressao Arterial',
          value:
            vitalSigns.pressaoSistolica && vitalSigns.pressaoDiastolica
              ? `${vitalSigns.pressaoSistolica}/${vitalSigns.pressaoDiastolica} mmHg`
              : 'N/I',
          range: '91-139 x 61-89 mmHg',
          ok: pressaoValida,
          hasData: !!(
            vitalSigns.pressaoSistolica && vitalSigns.pressaoDiastolica
          ),
        },
      ];

      vitals.forEach((v, i) => {
        const bx = ML + i * (boxW + 4);
        const statusColor: [number, number, number] = v.hasData
          ? v.ok
            ? GREEN
            : RED
          : MUTED;

        pdf.setFillColor(...WHITE);
        pdf.roundedRect(bx, y, boxW, boxH, 2, 2, 'F');
        pdf.setDrawColor(...statusColor);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(bx, y, boxW, boxH, 2, 2, 'S');

        pdf.setFillColor(...statusColor);
        pdf.rect(bx, y, boxW, 2.5, 'F');
        pdf.roundedRect(bx, y, boxW, 2.5, 2, 2, 'F');

        pdf.setTextColor(...MUTED);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.text(clean(v.label.toUpperCase()), bx + boxW / 2, y + 9, {
          align: 'center',
        });

        pdf.setTextColor(...statusColor);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.text(clean(v.value), bx + boxW / 2, y + 17, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        const statusTxt = v.hasData
          ? v.ok
            ? 'NORMAL'
            : 'ATENCAO'
          : 'PENDENTE';
        pdf.text(clean(statusTxt), bx + boxW / 2, y + 23, { align: 'center' });

        pdf.setTextColor(...MUTED);
        pdf.setFontSize(5.5);
        pdf.text(clean(`Ref: ${v.range}`), bx + boxW / 2, y + 27.5, {
          align: 'center',
        });
      });

      pdf.setTextColor(...DARK);
      y += boxH + 8;

      // ════════════════════════════════════════════════════════
      // 5. STATUS BANNER
      // ════════════════════════════════════════════════════════
      checkPage(22);
      const apto = isApto;
      const bannerColor: [number, number, number] = apto ? GREEN : RED;
      const bannerBg: [number, number, number] = apto
        ? [240, 253, 244]
        : [254, 242, 242];

      pdf.setFillColor(...bannerBg);
      pdf.roundedRect(ML, y, CW, 18, 3, 3, 'F');
      pdf.setDrawColor(...bannerColor);
      pdf.setLineWidth(1);
      pdf.roundedRect(ML, y, CW, 18, 3, 3, 'S');

      pdf.setFillColor(...bannerColor);
      pdf.rect(ML, y, 5, 18, 'F');
      pdf.roundedRect(ML, y, 5, 18, 3, 3, 'F');

      pdf.setTextColor(...bannerColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(
        apto ? 'APTO PARA MERGULHO' : 'INAPTO PARA MERGULHO',
        PW / 2,
        y + 11,
        { align: 'center' }
      );

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...MID);
      pdf.text('RESULTADO DA AVALIACAO', PW / 2, y + 16, { align: 'center' });

      pdf.setTextColor(...DARK);
      y += 24;

      // ════════════════════════════════════════════════════════
      // 6. QUESTIONÁRIO DE SAÚDE
      // ════════════════════════════════════════════════════════
      checkPage(50);
      sectionTitle('QUESTIONARIO DE SAUDE');

      pdf.setFillColor(...NAVY);
      pdf.rect(ML, y - 1, CW, 7, 'F');
      pdf.setTextColor(...WHITE);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text('PARAMETRO', ML + 4, y + 4);
      pdf.text('RESPOSTA', PW - ML - 4, y + 4, { align: 'right' });
      pdf.setTextColor(...DARK);
      y += 8;

      QUESTOES_DEFINITIONS.forEach((q, index) => {
        checkPage(12);
        const isChecked = questoes[q.key];
        const rowBg: [number, number, number] = index % 2 === 0 ? WHITE : GRAY1;
        const accentC: [number, number, number] = isChecked ? RED : TEAL;

        pdf.setFillColor(...rowBg);
        pdf.rect(ML, y - 1, CW, 8, 'F');

        pdf.setFillColor(...accentC);
        pdf.circle(ML + 3, y + 3, 1.2, 'F');

        pdf.setTextColor(...DARK);
        pdf.setFont('helvetica', isChecked ? 'bold' : 'normal');
        pdf.setFontSize(8);
        pdf.text(clean(q.labelPDF), ML + 8, y + 4);

        const badge = isChecked ? 'SIM' : 'NAO';
        const [br, bg2, bb] = isChecked ? RED : GREEN;
        const bw = 14;
        pdf.setFillColor(br, bg2, bb, 0.12);
        pdf.roundedRect(PW - ML - bw - 2, y, bw, 6, 1, 1, 'F');
        pdf.setTextColor(br, bg2, bb);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(badge, PW - ML - bw / 2 - 2, y + 4.2, { align: 'center' });

        pdf.setDrawColor(...GRAY2);
        pdf.setLineWidth(0.2);
        pdf.line(ML, y + 7, PW - ML, y + 7);

        pdf.setTextColor(...DARK);
        y += 8;
      });

      y += 4;

      // ════════════════════════════════════════════════════════
      // 7. PLANO DE AÇÃO
      // ════════════════════════════════════════════════════════
      if (planoAcao.length > 0 && !isApto) {
        checkPage(40);
        sectionTitle('PLANO DE ACAO OBRIGATORIO', RED, [255, 245, 245]);

        planoAcao.forEach((item, idx) => {
          checkPage(36);

          const cardH = 32;
          pdf.setFillColor(255, 251, 245);
          pdf.roundedRect(ML, y, CW, cardH, 2, 2, 'F');
          pdf.setDrawColor(...GRAY2);
          pdf.setLineWidth(0.2);
          pdf.roundedRect(ML, y, CW, cardH, 2, 2, 'S');

          const borderC: [number, number, number] =
            item.status === 'critico' ? RED : [245, 158, 11];
          pdf.setFillColor(...borderC);
          pdf.rect(ML, y, 3, cardH, 'F');
          pdf.roundedRect(ML, y, 3, cardH, 2, 2, 'F');

          pdf.setFillColor(...borderC);
          pdf.circle(ML + 10, y + 7, 4, 'F');
          pdf.setTextColor(...WHITE);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(String(idx + 1), ML + 10, y + 9, { align: 'center' });

          pdf.setTextColor(...DARK);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.text(clean(item.parametro), ML + 18, y + 8);

          const statusTxt = item.status === 'critico' ? 'CRITICO' : 'ATENCAO';
          pill(statusTxt, PW - ML - 26, y + 8, false);

          pdf.setTextColor(...MID);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          const diagLines = pdf.splitTextToSize(
            clean(`Diagnostico: ${item.mensagem}`),
            CW - 22
          );
          diagLines.slice(0, 2).forEach((line: string, li: number) => {
            pdf.text(line, ML + 18, y + 14 + li * 4);
          });

          pdf.setTextColor(5, 100, 70);
          pdf.setFontSize(7);
          const aLines = pdf.splitTextToSize(
            clean(`Acao: ${item.acao}`),
            CW - 22
          );
          aLines.slice(0, 2).forEach((line: string, li: number) => {
            pdf.text(line, ML + 18, y + 23 + li * 3.5);
          });

          pdf.setTextColor(...MUTED);
          pdf.setFontSize(6.5);
          pdf.text(clean(`Prazo: ${item.prazo}`), ML + 18, y + 29.5);
          pdf.text(
            clean(`Responsavel: ${item.responsavel}`),
            ML + 80,
            y + 29.5
          );

          pdf.setTextColor(...DARK);
          y += cardH + 5;
        });

        checkPage(15);
        pdf.setFillColor(255, 251, 235);
        pdf.roundedRect(ML, y, CW, 11, 2, 2, 'F');
        pdf.setDrawColor(253, 211, 77);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(ML, y, CW, 11, 2, 2, 'S');
        pdf.setTextColor(146, 64, 14);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text(
          clean(
            'ATENCAO: O colaborador so sera liberado apos a resolucao de todos os parametros criticos.'
          ),
          PW / 2,
          y + 7,
          { align: 'center' }
        );
        pdf.setTextColor(...DARK);
        y += 16;
      }

      // ════════════════════════════════════════════════════════
      // 8. ORIENTAÇÕES
      // ════════════════════════════════════════════════════════
      checkPage(35);
      sectionTitle('ORIENTACOES');

      const orientacoes = [
        'Nota 1: A equipe de mergulho foi orientada em relacao a alimentacao saudavel e respeito de 1:30 de intervalo entre as refeicoes principais.',
        'Nota 2: Recomendacao de ingestao de ao menos 2L de agua por dia, para melhor hidratacao.',
        'Nota 3: Orientar os funcionarios sobre a nao utilizacao de substancias ilicitas e avisar ao supervisor e EMED em caso de uso indevido.',
      ];

      pdf.setFillColor(...GRAY1);
      pdf.roundedRect(ML, y - 2, CW, orientacoes.length * 10 + 4, 2, 2, 'F');

      orientacoes.forEach((text, i) => {
        checkPage(12);
        pdf.setFillColor(...TEAL);
        pdf.circle(ML + 5, y + 3, 3, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.text(String(i + 1), ML + 5, y + 4.8, { align: 'center' });

        pdf.setTextColor(...DARK);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const lines = pdf.splitTextToSize(clean(text), CW - 16);
        lines.forEach((line: string, li: number) => {
          pdf.text(line, ML + 12, y + 4 + li * 4);
        });
        y += Math.max(10, lines.length * 4 + 2);
      });

      y += 6;

      // ════════════════════════════════════════════════════════
      // 9. CONTATOS DE EMERGÊNCIA
      // ════════════════════════════════════════════════════════
      checkPage(22);
      sectionTitle('CONTATOS DE EMERGENCIA');

      const contatos = [
        {
          label: 'Medico do Trabalho / Hiperbarico',
          value: '+55 (21) 99972-2799',
        },
        {
          label: 'Plantao de Saude da Continente',
          value: '+55 (22) 99729-4339',
        },
      ];

      pdf.setFillColor(...GRAY1);
      pdf.roundedRect(ML, y - 2, CW, contatos.length * 10 + 4, 2, 2, 'F');

      contatos.forEach((c) => {
        pdf.setFillColor(...NAVY);
        pdf.rect(ML, y - 1, 3, 8, 'F');
        pdf.setTextColor(...MID);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.text(clean(c.label + ':'), ML + 6, y + 3);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DARK);
        pdf.setFontSize(9);
        pdf.text(clean(c.value), ML + 6, y + 8);
        y += 12;
      });

      y += 4;

      // ════════════════════════════════════════════════════════
      // 10. ASSINATURAS
      // ════════════════════════════════════════════════════════
      checkPage(60);
      sectionTitle('ASSINATURAS');

      const sigW = (CW - 10) / 2;
      const sigH = 38;
      const sigs = [
        {
          label: 'Mergulhador',
          role: colaborador || 'Nao identificado',
          img: mergulhadorCanvas.signatureData,
        },
        {
          label: 'Profissional de Saude / EMED / DMT',
          role: nomeAvaliador || 'Nao informado',
          img: avaliadorCanvas.signatureData,
        },
      ];

      sigs.forEach((sig, i) => {
        const sx = ML + i * (sigW + 10);

        pdf.setFillColor(...WHITE);
        pdf.roundedRect(sx, y, sigW, sigH, 2, 2, 'F');
        pdf.setDrawColor(...GRAY2);
        pdf.setLineWidth(0.4);
        pdf.roundedRect(sx, y, sigW, sigH, 2, 2, 'S');

        pdf.setFillColor(...NAVY);
        pdf.roundedRect(sx, y, sigW, 7, 2, 2, 'F');
        pdf.rect(sx, y + 4, sigW, 3, 'F');
        pdf.setTextColor(...WHITE);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(clean(sig.label.toUpperCase()), sx + sigW / 2, y + 5, {
          align: 'center',
        });

        if (sig.img) {
          try {
            pdf.addImage(sig.img, 'PNG', sx + 4, y + 9, sigW - 8, 22);
          } catch (e) {
            pdf.setTextColor(...MUTED);
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(7);
            pdf.text('(imagem nao disponivel)', sx + sigW / 2, y + 21, {
              align: 'center',
            });
          }
        } else {
          pdf.setDrawColor(...MUTED);
          pdf.setLineDashPattern([2, 1], 0);
          pdf.setLineWidth(0.3);
          pdf.rect(sx + 6, y + 9, sigW - 12, 22, 'S');
          pdf.setLineDashPattern([], 0);
          pdf.setTextColor(...MUTED);
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(7);
          pdf.text('(nao assinado)', sx + sigW / 2, y + 21, {
            align: 'center',
          });
        }

        pdf.setDrawColor(...GRAY2);
        pdf.setLineWidth(0.4);
        pdf.line(sx + 4, y + sigH - 7, sx + sigW - 4, y + sigH - 7);
        pdf.setTextColor(...MID);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(clean(sig.role), sx + sigW / 2, y + sigH - 3, {
          align: 'center',
        });

        pdf.setTextColor(...DARK);
      });

      y += sigH + 6;

      // ════════════════════════════════════════════════════════
      // FOOTER
      // ════════════════════════════════════════════════════════
      addPageFooter();

      // ════════════════════════════════════════════════════════
      // GERAR BLOB E FAZER UPLOAD
      // ════════════════════════════════════════════════════════
      const pdfBlob = pdf.output('blob');
      const filename = `PRE-MER_${colaborador.replace(/\s+/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      const filePath = `colaboradores/${colaboradorId}/${filename}`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pre-mer-pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Erro ao fazer upload do PDF:', uploadError);
        alert('Erro ao salvar o PDF. Tente novamente.');
        return null;
      }

      // Obter a URL pública
      const { data: urlData } = supabase.storage
        .from('pre-mer-pdfs')
        .getPublicUrl(filePath);

      const pdfUrl = urlData?.publicUrl || '';

      console.log('✅ PDF salvo com sucesso:', pdfUrl);

      // Também faz o download local
      pdf.save(filename);

      return { url: pdfUrl, filename };
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
      return null;
    } finally {
      setGerandoPDF(false);
    }
  }, [
    colaborador,
    colaboradorId,
    colaboradorCodigo,
    funcao,
    frente,
    vitalSigns,
    questoes,
    nomeAvaliador,
    profissionalSaude,
    avaliadorCanvas.signatureData,
    mergulhadorCanvas.signatureData,
    isApto,
    temQuestaoSim,
    temperaturaValida,
    frequenciaValida,
    pressaoValida,
    planoAcao,
  ]);

  // ============================================================
  // SALVAR AVALIAÇÃO COM PDF
  // ============================================================

  const salvarAvaliacao = useCallback(async () => {
    const questoesRespondidas = QUESTOES_DEFINITIONS.reduce<
      Record<string, boolean>
    >((acc, q) => {
      acc[QUESTOES_DB_MAPPING[q.key]] = questoes[q.key];
      return acc;
    }, {});

    setLoading(true);
    setSuccessMessage('');

    try {
      // 1. GERAR O PDF E FAZER UPLOAD
      const pdfResult = await gerarPDF();

      if (!pdfResult) {
        alert('Erro ao gerar ou salvar o PDF. Verifique sua conexão.');
        setLoading(false);
        return;
      }

      // 2. SALVAR OS DADOS NO BANCO COM A URL DO PDF
      const dadosAvaliacao = {
        colaborador_id: colaboradorId ? parseInt(colaboradorId, 10) : null,
        colaborador_nome: colaborador,
        colaborador_codigo: colaboradorCodigo,
        funcao: funcao,
        frente_servico: frente,
        temperatura: vitalSigns.temperatura
          ? parseFloat(vitalSigns.temperatura)
          : null,
        frequencia_cardíaca: vitalSigns.frequencia
          ? parseInt(vitalSigns.frequencia, 10)
          : null,
        pressao_sistolica: vitalSigns.pressaoSistolica
          ? parseInt(vitalSigns.pressaoSistolica, 10)
          : null,
        pressao_diastolica: vitalSigns.pressaoDiastolica
          ? parseInt(vitalSigns.pressaoDiastolica, 10)
          : null,
        questoes: questoesRespondidas,
        nome_avaliador: nomeAvaliador,
        profissional_saude: profissionalSaude,
        aptidao: aptidaoAtual,
        assinatura_avaliador: avaliadorCanvas.signatureData,
        assinatura_mergulhador: mergulhadorCanvas.signatureData,
        plano_acao: planoAcao,
        pdf_url: pdfResult.url,
        pdf_filename: pdfResult.filename,
      };

      const { data, error } = await supabase
        .from('pre_mer_avaliacoes')
        .insert([dadosAvaliacao])
        .select();

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        alert(`Erro ao salvar avaliação: ${error.message}`);
      } else {
        console.log('✅ Dados salvos com sucesso:', data);
        setSuccessMessage(
          '✅ Avaliação Pré-MER salva com sucesso! PDF armazenado no prontuário.'
        );
        alert(
          'Avaliação Pré-MER salva com sucesso! O PDF foi armazenado no prontuário do colaborador.'
        );
        resetForm();
        setShowPlanoPopup(false);
      }
    } catch (err) {
      console.error('❌ Erro completo:', err);
      alert(
        'Erro ao salvar avaliação. Verifique o console para mais detalhes.'
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [
    colaborador,
    colaboradorId,
    colaboradorCodigo,
    funcao,
    frente,
    vitalSigns,
    questoes,
    nomeAvaliador,
    profissionalSaude,
    avaliadorCanvas.signatureData,
    mergulhadorCanvas.signatureData,
    aptidaoAtual,
    planoAcao,
    gerarPDF,
    resetForm,
  ]);

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================

  const handleSubmit = useCallback(async () => {
    if (!colaborador) {
      alert('Selecione um colaborador primeiro!');
      return;
    }
    if (!nomeAvaliador) {
      alert('Preencha o nome do avaliador!');
      return;
    }
    if (profissionalSaude !== 'sim') {
      alert('Apenas profissionais de saúde podem realizar esta avaliação!');
      return;
    }
    if (!avaliadorCanvas.signatureData) {
      alert('O profissional de saúde deve assinar a avaliação!');
      return;
    }
    if (!mergulhadorCanvas.signatureData) {
      alert('O mergulhador deve assinar a avaliação!');
      return;
    }

    if (aptidaoAtual === 'inapto' && planoAcao.length > 0) {
      setShowPlanoPopup(true);
      return;
    }

    await salvarAvaliacao();
  }, [
    colaborador,
    nomeAvaliador,
    profissionalSaude,
    avaliadorCanvas.signatureData,
    mergulhadorCanvas.signatureData,
    aptidaoAtual,
    planoAcao,
    salvarAvaliacao,
  ]);

  // ============================================================
  // ESTILOS
  // ============================================================

  const stylesObj = useMemo(
    () => ({
      container: {
        padding: '24px',
        color: '#3d3d3d',
        fontFamily: '"Inter", -apple-system, sans-serif',
      },
      headerCard: {
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '32px',
        border: '1px solid #e8e0d8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      headerTitle: {
        fontSize: '32px',
        fontWeight: 800,
        color: '#2d2d2d',
        margin: 0,
        letterSpacing: '-0.5px',
      },
      headerSubtitle: {
        fontSize: '15px',
        color: '#6b6b6b',
        marginTop: '4px',
      },
      card: {
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '32px',
        border: '1px solid #e8e0d8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      cardTitle: {
        fontSize: '18px',
        fontWeight: 700,
        color: '#2d2d2d',
        margin: 0,
        paddingBottom: '16px',
        borderBottom: '1px solid #f0ebe6',
        marginBottom: '24px',
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      },
      label: {
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        color: '#6b6b6b',
        display: 'block',
        marginBottom: '8px',
      },
      input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e8e0d8',
        fontSize: '15px',
        color: '#2d2d2d',
        background: 'rgba(0, 0, 0, 0.02)',
        outline: 'none',
        transition: 'all 0.3s ease',
      },
      select: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e8e0d8',
        fontSize: '15px',
        color: '#2d2d2d',
        background: 'rgba(0, 0, 0, 0.02)',
        outline: 'none',
        transition: 'all 0.3s ease',
      },
      canvas: {
        border: '1px solid #e8e0d8',
        borderRadius: '12px',
        background: 'white',
        cursor: 'crosshair',
        width: '100%',
        height: '150px',
        marginTop: '8px',
        touchAction: 'none',
        display: 'block',
      },
      button: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 28px',
        borderRadius: '40px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        width: '100%',
        marginTop: '16px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.2s ease',
      },
      buttonDisabled: {
        background: '#d1d5db',
        color: '#6b7280',
        border: 'none',
        padding: '14px 28px',
        borderRadius: '40px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'not-allowed',
        width: '100%',
        marginTop: '16px',
      },
      questionCardNormal: {
        background: '#f8f5f2',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '12px',
        borderLeft: '4px solid #10b981',
      },
      questionCardIssue: {
        background: '#fee2e2',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '12px',
        borderLeft: '4px solid #ef4444',
      },
      radioGroup: {
        display: 'flex',
        gap: '24px',
        marginTop: '12px',
      },
      radioLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '15px',
        color: '#3d3d3d',
      },
      signatureGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      },
      aptidaoButton: (selected: boolean, isAptoValue: boolean) => ({
        flex: 1,
        padding: '12px',
        borderRadius: '40px',
        border: selected
          ? `2px solid ${isAptoValue ? '#10b981' : '#ef4444'}`
          : '1px solid #e8e0d8',
        background: selected
          ? isAptoValue
            ? 'rgba(16, 185, 129, 0.1)'
            : 'rgba(239, 68, 68, 0.1)'
          : 'white',
        color: selected ? (isAptoValue ? '#059669' : '#dc2626') : '#6b6b6b',
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'center' as const,
        transition: 'all 0.2s ease',
      }),
      successMessage: {
        background: '#d1fae5',
        color: '#065f46',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '24px',
        textAlign: 'center' as const,
        border: '1px solid #a7f3d0',
        fontWeight: 500,
      },
      emptyState: {
        textAlign: 'center' as const,
        padding: '80px 20px',
        color: '#6b6b6b',
      },
      emptyIcon: {
        fontSize: '64px',
        color: '#d0c8c0',
        marginBottom: '16px',
      },
      warningBox: {
        background: isApto ? '#d1fae5' : '#fee2e2',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        border: `1px solid ${isApto ? '#a7f3d0' : '#fecaca'}`,
      },
      warningText: {
        margin: '0 0 8px 0',
        fontSize: '14px',
        color: '#92400e',
      },
      infoBox: {
        background: '#fff3cd',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid #ffeaa7',
      },
      infoText: {
        margin: 0,
        fontSize: '14px',
        color: '#856404',
      },
      statusBadge: {
        display: 'inline-block',
        padding: '8px 20px',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 700,
        background:
          aptidao === null
            ? '#f3f4f6'
            : aptidao === 'apto'
            ? '#d1fae5'
            : '#fee2e2',
        color:
          aptidao === null
            ? '#6b7280'
            : aptidao === 'apto'
            ? '#065f46'
            : '#991b1b',
      },
    }),
    [isApto, aptidao]
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={stylesObj.container}>
      {showPlanoPopup && planoAcao.length > 0 && (
        <PlanoAcaoPopup
          plano={planoAcao}
          onClose={() => setShowPlanoPopup(false)}
          onSave={salvarAvaliacao}
          colaboradorNome={colaborador}
          loading={loading}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={stylesObj.headerTitle}>
            <i
              className="fas fa-user-md"
              style={{ marginRight: '12px', color: '#10b981' }}
            />
            PRÉ-MER
          </h1>
          <p style={stylesObj.headerSubtitle}>
            Avaliação médica pré-mergulho - Protocolo de saúde ocupacional
          </p>
        </div>
        <div
          style={{
            background: '#f8f5f2',
            padding: '8px 16px',
            borderRadius: '40px',
            border: '1px solid #e8e0d8',
          }}
        >
          <i
            className="fas fa-id-card"
            style={{ marginRight: '8px', color: '#6b6b6b' }}
          />
          <span style={{ color: '#6b6b6b', fontSize: '13px' }}>
            Ficha #{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
          </span>
        </div>
      </div>

      <div style={stylesObj.headerCard}>
        <label style={stylesObj.label}>
          <i className="fas fa-user-md" style={{ marginRight: '6px' }} />
          Selecione o Colaborador
        </label>
        <select
          style={stylesObj.select}
          value={selectedEmployeeId}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
        >
          <option value="">-- Selecione um colaborador --</option>
          {employees.length > 0 ? (
            employees.map((emp) => {
              const empId = emp.id?.toString() || emp.codigo?.toString();
              return (
                <option key={empId} value={empId}>
                  {emp.name || emp.nome || 'Sem nome'} -{' '}
                  {emp.cargo || 'Sem cargo'}
                </option>
              );
            })
          ) : (
            <option disabled value="">
              Nenhum colaborador cadastrado
            </option>
          )}
        </select>

        {colaborador && (
          <div
            style={{
              background: '#f8f5f2',
              borderRadius: '16px',
              padding: '20px',
              marginTop: '8px',
              border: '1px solid #f0ebe6',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: '4px',
              }}
            >
              {colaborador}
            </div>
            <div style={{ color: '#6b6b6b', fontSize: '14px' }}>
              <strong>Código:</strong> {colaboradorCodigo} •{' '}
              <strong>Função:</strong> {funcao || 'Não definida'} •{' '}
              <strong>Frente:</strong> {frente || 'Não definida'}
            </div>
          </div>
        )}
      </div>

      {!colaborador ? (
        <div style={stylesObj.card}>
          <div style={stylesObj.emptyState}>
            <i className="fas fa-user-md" style={stylesObj.emptyIcon} />
            <h3 style={{ color: '#2d2d2d', marginBottom: '8px' }}>
              Selecione um colaborador para iniciar a avaliação
            </h3>
            <p style={{ color: '#6b6b6b' }}>
              Apenas profissionais de saúde têm acesso a este módulo.
            </p>
          </div>
        </div>
      ) : (
        <>
          {successMessage && (
            <div style={stylesObj.successMessage}>{successMessage}</div>
          )}

          <div style={stylesObj.card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <h3
                style={{
                  ...stylesObj.cardTitle,
                  marginBottom: 0,
                  borderBottom: 'none',
                  paddingBottom: 0,
                }}
              >
                <i
                  className="fas fa-stethoscope"
                  style={{
                    marginRight: '8px',
                    color:
                      aptidao === null
                        ? '#6b6b6b'
                        : aptidao === 'apto'
                        ? '#10b981'
                        : '#ef4444',
                  }}
                />
                Status da Avaliação
              </h3>
              <div style={stylesObj.statusBadge}>
                {aptidao === null ? (
                  <>
                    <i
                      className="fas fa-clock"
                      style={{ marginRight: '6px' }}
                    />{' '}
                    AGUARDANDO DADOS
                  </>
                ) : aptidao === 'apto' ? (
                  <>
                    <i
                      className="fas fa-check-circle"
                      style={{ marginRight: '6px' }}
                    />{' '}
                    APTO
                  </>
                ) : (
                  <>
                    <i
                      className="fas fa-times-circle"
                      style={{ marginRight: '6px' }}
                    />{' '}
                    INAPTO
                  </>
                )}
              </div>
            </div>
            <div
              style={{ marginTop: '12px', fontSize: '14px', color: '#6b6b6b' }}
            >
              {temQuestaoSim && (
                <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ marginRight: '6px' }}
                  />
                  Questão(ões) de saúde marcadas como "Sim"
                </div>
              )}
              {vitalSigns.temperatura && !temperaturaValida && (
                <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ marginRight: '6px' }}
                  />
                  Temperatura fora do range ideal (36.1 - 36.9°C)
                </div>
              )}
              {vitalSigns.frequencia && !frequenciaValida && (
                <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ marginRight: '6px' }}
                  />
                  Frequência cardíaca fora do range ideal (61 - 99 bpm)
                </div>
              )}
              {vitalSigns.pressaoSistolica &&
                vitalSigns.pressaoDiastolica &&
                !pressaoValida && (
                  <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                    <i
                      className="fas fa-exclamation-triangle"
                      style={{ marginRight: '6px' }}
                    />
                    Pressão arterial fora do range ideal (91-139x61-89 mmHg)
                  </div>
                )}
              {aptidao === null && (
                <div style={{ color: '#6b7280', marginBottom: '4px' }}>
                  <i className="fas fa-clock" style={{ marginRight: '6px' }} />
                  Preencha todos os dados para determinar a aptidão
                </div>
              )}
              {aptidao === 'apto' && (
                <div style={{ color: '#059669' }}>
                  <i
                    className="fas fa-check-circle"
                    style={{ marginRight: '6px' }}
                  />
                  Todos os parâmetros dentro do esperado
                </div>
              )}
              {aptidao === 'inapto' && (
                <div style={{ color: '#dc2626' }}>
                  <i
                    className="fas fa-times-circle"
                    style={{ marginRight: '6px' }}
                  />
                  {planoAcao.length} parâmetro(s) fora do esperado - Verifique o
                  plano de ação
                </div>
              )}
            </div>
          </div>

          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-heartbeat"
                style={{ marginRight: '8px', color: '#10b981' }}
              />
              Sinais Vitais
            </h3>
            <div style={stylesObj.grid}>
              <VitalInputCard
                label="Temperatura Corporal"
                value={vitalSigns.temperatura}
                onChange={(v: string) => handleVitalChange('temperatura', v)}
                unit="°C"
                paramRange="36.1 - 36.9°C"
                isValid={temperaturaValida}
                icon="fas fa-thermometer-half"
                placeholder="0.0"
              />
              <VitalInputCard
                label="Frequência Cardíaca"
                value={vitalSigns.frequencia}
                onChange={(v: string) => handleVitalChange('frequencia', v)}
                unit="bpm"
                paramRange="61 - 99 bpm"
                isValid={frequenciaValida}
                icon="fas fa-heart"
                placeholder="0"
              />
              <VitalInputCard
                label="Pressão Arterial"
                value={vitalSigns.pressaoSistolica}
                onChange={(v: string) =>
                  handleVitalChange('pressaoSistolica', v)
                }
                valueDiastolica={vitalSigns.pressaoDiastolica}
                onChangeDiastolica={(v: string) =>
                  handleVitalChange('pressaoDiastolica', v)
                }
                unit="mmHg"
                paramRange="91-139 x 61-89 mmHg"
                isValid={pressaoValida}
                icon="fas fa-stethoscope"
                isPressao={true}
                placeholder="0"
              />
            </div>
          </div>

          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-clipboard-list"
                style={{ marginRight: '8px', color: '#10b981' }}
              />
              Questionário de Saúde
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {QUESTOES_DEFINITIONS.map((q) => (
                <QuestionCard
                  key={q.key}
                  question={q}
                  isChecked={questoes[q.key]}
                  onChange={handleQuestaoChange}
                  hasIssueStyle={stylesObj.questionCardIssue}
                  normalStyle={stylesObj.questionCardNormal}
                  radioGroupStyle={stylesObj.radioGroup}
                  radioLabelStyle={stylesObj.radioLabel}
                />
              ))}
            </div>
          </div>

          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-info-circle"
                style={{ marginRight: '8px', color: '#10b981' }}
              />
              Orientações e Parecer
            </h3>
            <div style={stylesObj.warningBox}>
              <p style={stylesObj.warningText}>
                <i
                  className="fas fa-check"
                  style={{ marginRight: '6px', color: '#059669' }}
                />
                <strong>Nota 1:</strong> A equipe de mergulho foi orientada em
                relação a alimentação saudável e em respeito de 1:30 (uma hora e
                trinta minutos) de intervalo entre as refeições principais.
              </p>
              <p style={stylesObj.warningText}>
                <i
                  className="fas fa-tint"
                  style={{ marginRight: '6px', color: '#0ea5e9' }}
                />
                <strong>Nota 2:</strong> Recomendação de ingestão de ao menos 2L
                de água por dia, para melhor hidratação.
              </p>
              <p style={{ ...stylesObj.warningText, marginBottom: 0 }}>
                <i
                  className="fas fa-ban"
                  style={{ marginRight: '6px', color: '#dc2626' }}
                />
                <strong>Nota 3:</strong> Orientar os funcionários sobre a não
                utilização de substâncias ilícitas e avisar ao supervisor e EMED
                em caso de uso indevido.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={stylesObj.label}>
                <i className="fas fa-user-md" style={{ marginRight: '6px' }} />
                Nome do avaliador (Profissional de saúde/ EMED/DMT)
              </label>
              <input
                type="text"
                style={stylesObj.input}
                value={nomeAvaliador}
                onChange={(e) => setNomeAvaliador(e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={stylesObj.label}>Profissional de Saúde?</label>
              <div style={stylesObj.radioGroup}>
                <label style={stylesObj.radioLabel}>
                  <input
                    type="radio"
                    name="profSaude"
                    checked={profissionalSaude === 'sim'}
                    onChange={() => setProfissionalSaude('sim')}
                  />{' '}
                  Sim
                </label>
                <label style={stylesObj.radioLabel}>
                  <input
                    type="radio"
                    name="profSaude"
                    checked={profissionalSaude === 'nao'}
                    onChange={() => setProfissionalSaude('nao')}
                  />{' '}
                  Não
                </label>
              </div>
            </div>
          </div>

          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-signature"
                style={{ marginRight: '8px', color: '#10b981' }}
              />
              Assinaturas e Aptidão
            </h3>

            <div style={stylesObj.signatureGrid}>
              <SignatureBox
                label="Assinatura do profissional de saúde/ EMED/DMT"
                icon="fas fa-signature"
                canvasRef={canvasRefAvaliador}
                startDrawing={avaliadorCanvas.startDrawing}
                draw={avaliadorCanvas.draw}
                endDrawing={avaliadorCanvas.endDrawing}
                clear={avaliadorCanvas.clear}
                hasSignature={!!avaliadorCanvas.signatureData}
                canvasStyle={stylesObj.canvas}
                labelStyle={stylesObj.label}
              />
              <SignatureBox
                label="Assinatura do Mergulhador"
                icon="fas fa-user-check"
                canvasRef={canvasRefMergulhador}
                startDrawing={mergulhadorCanvas.startDrawing}
                draw={mergulhadorCanvas.draw}
                endDrawing={mergulhadorCanvas.endDrawing}
                clear={mergulhadorCanvas.clear}
                hasSignature={!!mergulhadorCanvas.signatureData}
                canvasStyle={stylesObj.canvas}
                labelStyle={stylesObj.label}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={stylesObj.label}>Aptidão do avaliador</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={stylesObj.aptidaoButton(aptidao === 'apto', true)}>
                  {aptidao === 'apto' ? (
                    <>
                      <i
                        className="fas fa-check-circle"
                        style={{ marginRight: '6px' }}
                      />{' '}
                      APTO
                    </>
                  ) : (
                    'APTO'
                  )}
                </div>
                <div
                  style={stylesObj.aptidaoButton(aptidao === 'inapto', false)}
                >
                  {aptidao === 'inapto' ? (
                    <>
                      <i
                        className="fas fa-times-circle"
                        style={{ marginRight: '6px' }}
                      />{' '}
                      INAPTO
                    </>
                  ) : (
                    'INAPTO'
                  )}
                </div>
              </div>
              {aptidao === 'inapto' && (
                <div
                  style={{
                    color: '#dc2626',
                    fontSize: '14px',
                    marginTop: '8px',
                  }}
                >
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ marginRight: '6px' }}
                  />
                  Avaliação INAPTO - {planoAcao.length} parâmetro(s) fora do
                  esperado
                  <button
                    onClick={() => setShowPlanoPopup(true)}
                    style={{
                      marginLeft: '12px',
                      padding: '4px 16px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <i
                      className="fas fa-clipboard-list"
                      style={{ marginRight: '4px' }}
                    />
                    Ver Plano de Ação
                  </button>
                </div>
              )}
            </div>

            <div style={stylesObj.infoBox}>
              <p style={stylesObj.infoText}>
                <i className="fas fa-phone" style={{ marginRight: '6px' }} />
                <strong>
                  Em caso de resposta afirmativa para as questões acima e/ou,
                </strong>{' '}
                os dados avaliados estejam fora dos parâmetros fisiológicos
                estabelecidos, o EMED/DMT/ profissional de saúde, deverá
                solicitar ao médico do trabalho/hiperbárico responsável uma
                avaliação.
                <br />
                <strong>Médico do trabalho/hiperbárico:</strong> +55 (21)
                99972-2799
              </p>
            </div>

            <button
              type="button"
              style={
                loading || gerandoPDF || aptidao === null
                  ? stylesObj.buttonDisabled
                  : stylesObj.button
              }
              onClick={handleSubmit}
              disabled={loading || gerandoPDF || aptidao === null}
            >
              {loading ? (
                <>
                  <i
                    className="fas fa-spinner fa-spin"
                    style={{ marginRight: '8px' }}
                  />{' '}
                  Salvando...
                </>
              ) : gerandoPDF ? (
                <>
                  <i
                    className="fas fa-file-pdf fa-spin"
                    style={{ marginRight: '8px' }}
                  />{' '}
                  Gerando PDF...
                </>
              ) : aptidao === null ? (
                <>
                  <i
                    className="fas fa-exclamation-triangle"
                    style={{ marginRight: '8px' }}
                  />
                  Preencha todos os dados para salvar
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: '8px' }} />{' '}
                  Salvar Avaliação e Gerar PDF
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
