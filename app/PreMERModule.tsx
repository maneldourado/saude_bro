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
}

// ============================================================
// CONSTANTES
// ============================================================

const DEFAULT_VITALS: VitalSigns = {
  temperatura: '36.5',
  frequencia: '78',
  pressaoSistolica: '120',
  pressaoDiastolica: '80',
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

const QUESTOES_DEFINITIONS: QuestionDefinition[] = [
  {
    key: 'q1',
    text: 'Refere alguma queixa cardiovascular (Dispnéia, dor precordial, cansaço, tontura, palpitação)? A pressão arterial está alterada?',
    labelPDF: 'Queixa cardiovascular',
  },
  {
    key: 'q2',
    text: 'Refere alguma queixa respiratória (Estado gripal, congestão nasal, rinite alérgica, dispnéia, tosse, cansaço, bronquite)?',
    labelPDF: 'Queixa respiratória',
  },
  {
    key: 'q3',
    text: 'Refere algum problema nas orelhas (Zumbido, Dor, prurido, secreção, tonteira, vertigens e dificuldade para equalizar ouvido médio)?',
    labelPDF: 'Problemas nas orelhas',
  },
  {
    key: 'q4',
    text: 'Apresenta alguma queixa digestiva (Azia, dor epigástrica em queimação, cólicas, diarreia, constipação intestinal)?',
    labelPDF: 'Queixa digestiva',
  },
  {
    key: 'q5',
    text: 'Apresenta alguma queixa urinária (Ardência urinária, secreção uretral, cólica renal)?',
    labelPDF: 'Queixa urinária',
  },
  {
    key: 'q6',
    text: 'Refere alguma queixa na qualidade do sono e descanso adequado?',
    labelPDF: 'Qualidade do sono',
  },
  {
    key: 'q7',
    text: 'Apresenta algum problema de ordem emocional ou familiar que possa desaconselhar o mergulho?',
    labelPDF: 'Problema emocional/familiar',
  },
  {
    key: 'q8',
    text: 'Relata queixa de dores nas articulações ou alguma queixa que seja parecido com doença descompressiva?',
    labelPDF: 'Dores articulares',
  },
  {
    key: 'q9',
    text: 'Relata alguma outra queixa de saúde não abordada acima?',
    labelPDF: 'Outras queixas',
  },
];

// Mapeamento das questões para os nomes das colunas no banco
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
  temperatura: string
): AptidaoStatus {
  const temQuestaoSim = Object.values(questoes).some(Boolean);
  const temp = parseFloat(temperatura);
  const temperaturaValida =
    !isNaN(temp) && temp >= TEMPERATURA_MIN && temp <= TEMPERATURA_MAX;

  if (temQuestaoSim || !temperaturaValida) {
    return 'inapto';
  }
  return 'apto';
}

function isTemperaturaValida(temperatura: string): boolean {
  const temp = parseFloat(temperatura);
  return !isNaN(temp) && temp >= TEMPERATURA_MIN && temp <= TEMPERATURA_MAX;
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
        <i className="fas fa-eraser" /> Limpar Assinatura
      </button>
      {hasSignature && (
        <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
          ✅ Assinatura registrada
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
}: any) {
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
        {icon} {label}
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
        />
        <span style={{ fontSize: '18px', color: '#6b6b6b' }}>{unit}</span>
        {showCheck && (
          <i
            className="fas fa-check-circle"
            style={{
              color:
                isValid !== undefined
                  ? isValid
                    ? '#10b981'
                    : '#ef4444'
                  : '#10b981',
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
            isValid !== undefined
              ? isValid
                ? '#6b6b6b'
                : '#dc2626'
              : '#6b6b6b',
        }}
      >
        {isValid !== undefined
          ? isValid
            ? '✅ Parâmetro normal'
            : '⚠️ Fora do range ideal'
          : `Parâmetro: ${paramRange}`}
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
          <span style={{ color: '#dc2626', marginLeft: '8px' }}>⚠️</span>
        )}
      </div>
      <div style={radioGroupStyle}>
        <label style={radioLabelStyle}>
          <input
            type="radio"
            name={question.key}
            checked={isChecked === true}
            onChange={() => onChange(question.key)}
          />{' '}
          Sim
        </label>
        <label style={radioLabelStyle}>
          <input
            type="radio"
            name={question.key}
            checked={isChecked === false}
            onChange={() => onChange(question.key)}
          />{' '}
          Não
        </label>
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
    () => calcularAptidao(questoes, vitalSigns.temperatura),
    [questoes, vitalSigns.temperatura]
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

  useEffect(() => {
    if (colaborador) {
      setAptidao(aptidaoAtual);
    }
  }, [colaborador, aptidaoAtual]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleVitalChange = useCallback(
    (field: keyof VitalSigns, value: string) => {
      setVitalSigns((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleQuestaoChange = useCallback((key: QuestionKey) => {
    setQuestoes((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
    avaliadorCanvas.clear();
    mergulhadorCanvas.clear();
  }, [avaliadorCanvas, mergulhadorCanvas]);

  // ============================================================
  // GERAÇÃO DE PDF
  // ============================================================

  const gerarPDF = useCallback(async () => {
    setGerandoPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      const addWrappedText = (
        text: string,
        yPos: number,
        maxWidth: number,
        fontSize: number = 10
      ): number => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, margin, yPos);
        return yPos + lines.length * (fontSize * 0.5);
      };

      const checkPage = (neededHeight: number = 40) => {
        if (y > pageHeight - neededHeight) {
          pdf.addPage();
          y = margin;
        }
      };

      // --- CABEÇALHO ---
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AVALIAÇÃO PRÉ-MER', pageWidth / 2, y, { align: 'center' });
      y += 10;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'Protocolo de saúde ocupacional - Pré-mergulho',
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 8;

      const dataAtual = new Date().toLocaleDateString('pt-BR');
      pdf.setFontSize(10);
      pdf.text(`Data: ${dataAtual}`, pageWidth - margin, y, { align: 'right' });
      y += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- DADOS DO COLABORADOR ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO COLABORADOR', margin, y);
      y += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const dadosColaborador = [
        `Nome: ${colaborador}`,
        `Código: ${colaboradorCodigo}`,
        `Função: ${funcao}`,
        `Frente de Serviço: ${frente}`,
      ];
      dadosColaborador.forEach((linha) => {
        y = addWrappedText(linha, y, pageWidth - 2 * margin);
      });
      y += 4;

      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- STATUS DA AVALIAÇÃO ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STATUS DA AVALIAÇÃO', margin, y);
      y += 8;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(isApto ? 0 : 200, isApto ? 150 : 0, isApto ? 0 : 0);
      pdf.text(isApto ? 'APTO' : 'INAPTO', margin, y);
      y += 8;
      pdf.setTextColor(0, 0, 0);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      if (temQuestaoSim) {
        pdf.setTextColor(200, 0, 0);
        pdf.text('* Questão(ões) de saúde marcadas como "Sim"', margin, y);
        y += 6;
      }
      if (!temperaturaValida) {
        pdf.setTextColor(200, 0, 0);
        pdf.text(
          `* Temperatura fora do range ideal (36.1 - 36.9°C) - Atual: ${vitalSigns.temperatura}°C`,
          margin,
          y
        );
        y += 6;
      }
      if (isApto) {
        pdf.setTextColor(0, 150, 0);
        pdf.text('* Todos os parâmetros dentro do esperado', margin, y);
        y += 6;
      }
      pdf.setTextColor(0, 0, 0);
      y += 4;

      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- SINAIS VITAIS ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SINAIS VITAIS', margin, y);
      y += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const sinaisV = [
        `Temperatura Corporal: ${vitalSigns.temperatura}°C ${
          temperaturaValida ? '✅ Normal' : '⚠️ Atenção'
        }`,
        `Frequência Cardíaca: ${vitalSigns.frequencia} bpm`,
        `Pressão Arterial: ${vitalSigns.pressaoSistolica}/${vitalSigns.pressaoDiastolica} mmHg`,
      ];
      sinaisV.forEach((linha) => {
        y = addWrappedText(linha, y, pageWidth - 2 * margin);
      });
      y += 4;

      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- QUESTIONÁRIO DE SAÚDE ---
      checkPage(80);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('QUESTIONÁRIO DE SAÚDE', margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      QUESTOES_DEFINITIONS.forEach((q) => {
        checkPage(20);
        const resposta = questoes[q.key] ? 'Sim ⚠️' : 'Não ✅';
        y = addWrappedText(
          `${q.labelPDF}: ${resposta}`,
          y,
          pageWidth - 2 * margin,
          10
        );
      });
      y += 4;

      checkPage(40);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- ORIENTAÇÕES ---
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ORIENTAÇÕES E PARECER', margin, y);
      y += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const orientacoes = [
        'Nota 1: A equipe de mergulho foi orientada em relação a alimentação saudável e em respeito',
        'de 1:30 (uma hora e trinta minutos) de intervalo entre as refeições principais.',
        'Nota 2: Recomendação de ingestão de ao menos 2L de água por dia, para melhor hidratação.',
        'Nota 3: Orientar os funcionários sobre a não utilização de substâncias ilícitas e avisar',
        'ao supervisor e EMED em caso de uso indevido.',
      ];
      orientacoes.forEach((linha) => {
        checkPage(20);
        y = addWrappedText(linha, y, pageWidth - 2 * margin, 9);
      });
      y += 4;

      checkPage(40);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- AVALIADOR ---
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AVALIADOR', margin, y);
      y += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      y = addWrappedText(
        `Nome: ${nomeAvaliador || 'Não informado'}`,
        y,
        pageWidth - 2 * margin
      );
      y = addWrappedText(
        `Profissional de Saúde: ${profissionalSaude === 'sim' ? 'Sim' : 'Não'}`,
        y,
        pageWidth - 2 * margin
      );
      y += 4;

      // --- ASSINATURAS ---
      checkPage(80);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ASSINATURAS', margin, y);
      y += 8;

      if (avaliadorCanvas.signatureData) {
        try {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Assinatura do Profissional de Saúde:', margin, y);
          y += 6;

          const imgWidth = 80;
          const imgHeight = 35;
          pdf.addImage(
            avaliadorCanvas.signatureData,
            'PNG',
            margin,
            y,
            imgWidth,
            imgHeight
          );
          y += imgHeight + 10;
        } catch (e) {
          console.error('Erro ao adicionar assinatura do avaliador:', e);
          y += 20;
        }
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
          'Assinatura do Profissional de Saúde: (não assinado)',
          margin,
          y
        );
        y += 8;
      }

      checkPage(60);
      if (mergulhadorCanvas.signatureData) {
        try {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Assinatura do Mergulhador:', margin, y);
          y += 6;

          const imgWidth = 80;
          const imgHeight = 35;
          pdf.addImage(
            mergulhadorCanvas.signatureData,
            'PNG',
            margin,
            y,
            imgWidth,
            imgHeight
          );
          y += imgHeight + 10;
        } catch (e) {
          console.error('Erro ao adicionar assinatura do mergulhador:', e);
          y += 20;
        }
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Assinatura do Mergulhador: (não assinado)', margin, y);
        y += 8;
      }

      // --- RODAPÉ ---
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        `Documento gerado em ${new Date().toLocaleString(
          'pt-BR'
        )} - Avaliação Pré-MER`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      const nomeArquivo = `PRE-MER_${colaborador.replace(
        /\s+/g,
        '_'
      )}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(nomeArquivo);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGerandoPDF(false);
    }
  }, [
    colaborador,
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
  ]);

  // ============================================================
  // SALVAR AVALIAÇÃO - CORRIGIDO (COM ACENTO)
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

    // Mapeia as questões para o formato do banco
    const questoesRespondidas = QUESTOES_DEFINITIONS.reduce<
      Record<string, boolean>
    >((acc, q) => {
      acc[QUESTOES_DB_MAPPING[q.key]] = questoes[q.key];
      return acc;
    }, {});

    // Objeto com os nomes CORRETOS das colunas do Supabase
    // ATENÇÃO: A coluna se chama "frequencia_cardíaca" COM ACENTO
    const dadosAvaliacao = {
      colaborador_id: colaboradorId ? parseInt(colaboradorId, 10) : null,
      colaborador_nome: colaborador,
      colaborador_codigo: colaboradorCodigo,
      funcao: funcao,
      frente_servico: frente,
      temperatura: parseFloat(vitalSigns.temperatura),
      frequencia_cardíaca: parseInt(vitalSigns.frequencia, 10), // ← Nome COM ACENTO (entre aspas)
      pressao_sistolica: parseInt(vitalSigns.pressaoSistolica, 10),
      pressao_diastolica: parseInt(vitalSigns.pressaoDiastolica, 10),
      questoes: questoesRespondidas,
      nome_avaliador: nomeAvaliador,
      profissional_saude: profissionalSaude,
      aptidao: aptidaoAtual,
      assinatura_avaliador: avaliadorCanvas.signatureData,
      assinatura_mergulhador: mergulhadorCanvas.signatureData,
    };

    console.log('📝 Dados a serem salvos:', dadosAvaliacao);

    setLoading(true);
    setSuccessMessage('');

    try {
      const { data, error } = await supabase
        .from('pre_mer_avaliacoes')
        .insert([dadosAvaliacao])
        .select();

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', error);
        alert(`Erro ao salvar avaliação: ${error.message}`);
      } else {
        console.log('✅ Dados salvos com sucesso:', data);
        setSuccessMessage('✅ Avaliação Pré-MER salva com sucesso!');
        await gerarPDF();
        alert('Avaliação Pré-MER salva com sucesso e PDF gerado!');
        resetForm();
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
    gerarPDF,
    resetForm,
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
        background: isApto ? '#d1fae5' : '#fee2e2',
        color: isApto ? '#065f46' : '#991b1b',
      },
    }),
    [isApto]
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={stylesObj.container}>
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
        <label style={stylesObj.label}>👨‍⚕️ Selecione o Colaborador</label>
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
              Apenas médicos têm acesso a este módulo.
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
                    color: isApto ? '#10b981' : '#ef4444',
                  }}
                />
                Status da Avaliação
              </h3>
              <div style={stylesObj.statusBadge}>
                {isApto ? '✅ APTO' : '❌ INAPTO'}
              </div>
            </div>
            <div
              style={{ marginTop: '12px', fontSize: '14px', color: '#6b6b6b' }}
            >
              {temQuestaoSim && (
                <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                  ⚠️ Questão(ões) de saúde marcadas como "Sim"
                </div>
              )}
              {!temperaturaValida && (
                <div style={{ color: '#dc2626', marginBottom: '4px' }}>
                  ⚠️ Temperatura fora do range ideal (36.1 - 36.9°C)
                </div>
              )}
              {isApto && (
                <div style={{ color: '#059669' }}>
                  ✅ Todos os parâmetros dentro do esperado
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
                icon="🌡️"
              />
              <VitalInputCard
                label="Frequência Cardíaca"
                value={vitalSigns.frequencia}
                onChange={(v: string) => handleVitalChange('frequencia', v)}
                unit="bpm"
                paramRange="60 - 100 bpm"
                icon="💓"
              />
              <VitalInputCard
                label="Pressão Arterial"
                value={vitalSigns.pressaoSistolica}
                onChange={(v: string) =>
                  handleVitalChange('pressaoSistolica', v)
                }
                unit={` / ${vitalSigns.pressaoDiastolica}`}
                paramRange="< 130x85 mmHg"
                icon="🩸"
                showCheck={false}
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
                <strong>✅ Nota 1:</strong> A equipe de mergulho foi orientada
                em relação a alimentação saudável e em respeito de 1:30 (uma
                hora e trinta minutos) de intervalo entre as refeições
                principais.
              </p>
              <p style={stylesObj.warningText}>
                <strong>💧 Nota 2:</strong> Recomendação de ingestão de ao menos
                2L de água por dia, para melhor hidratação.
              </p>
              <p style={{ ...stylesObj.warningText, marginBottom: 0 }}>
                <strong>🚫 Nota 3:</strong> Orientar os funcionários sobre a não
                utilização de substâncias ilícitas e avisar ao supervisor e EMED
                em caso de uso indevido.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={stylesObj.label}>
                👨‍⚕️ Nome do avaliador (Profissional de saúde/ EMED/DMT)
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
                  {aptidao === 'apto' ? '✅ APTO' : 'APTO'}
                </div>
                <div
                  style={stylesObj.aptidaoButton(aptidao === 'inapto', false)}
                >
                  {aptidao === 'inapto' ? '❌ INAPTO' : 'INAPTO'}
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
                  ⚠️ Avaliação INAPTO -{' '}
                  {temQuestaoSim
                    ? 'Questão de saúde marcada como SIM'
                    : 'Temperatura fora do range'}
                </div>
              )}
            </div>

            <div style={stylesObj.infoBox}>
              <p style={stylesObj.infoText}>
                <strong>
                  📞 Em caso de resposta afirmativa para as questões acima e/ou,
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
                loading || gerandoPDF
                  ? stylesObj.buttonDisabled
                  : stylesObj.button
              }
              onClick={handleSubmit}
              disabled={loading || gerandoPDF}
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
