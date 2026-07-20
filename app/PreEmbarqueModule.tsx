// app/AvaliacaoEmbarqueMergulhoModule.tsx
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './lib/supabase';

// ============================================================
// ÍCONES SVG (versão simplificada)
// ============================================================

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

// ============================================================
// CONSTANTES
// ============================================================

const COLORS = {
  primary: '#10b981',
  primaryDark: '#059669',
  primaryGlow: 'rgba(16, 185, 129, 0.15)',
  danger: '#dc2626',
  dangerBg: '#fce4ec',
  warning: '#d97706',
  warningBg: '#fff3e0',
  success: '#059669',
  successBg: '#e8f5e9',
  textPrimary: '#1a1a1a',
  textSecondary: '#6b5f55',
  border: 'rgba(0, 0, 0, 0.08)',
  bgCard: '#ffffff',
  bgGhost: 'rgba(0, 0, 0, 0.02)',
};

const TEMPERATURA_MIN = 36.1;
const TEMPERATURA_MAX = 36.9;
const FREQUENCIA_MIN = 60;
const FREQUENCIA_MAX = 100;
const PRESSÃO_SISTOLICA_MIN = 90;
const PRESSÃO_SISTOLICA_MAX = 140;
const PRESSÃO_DIASTOLICA_MIN = 60;
const PRESSÃO_DIASTOLICA_MAX = 90;

const QUESTOES = [
  {
    key: 'q1_cardiovascular',
    label:
      'Queixa cardiovascular (Dispnéia, dor precordial, cansaço, tontura, palpitação)',
  },
  {
    key: 'q2_respiratorio',
    label:
      'Queixa respiratória (Estado gripal, congestão nasal, rinite alérgica, dispnéia, tosse, bronquite)',
  },
  {
    key: 'q3_ouvidos',
    label:
      'Problema nas orelhas (Zumbido, dor, prurido, secreção, tonteira, vertigens, dificuldade para equalizar)',
  },
  {
    key: 'q4_digestivo',
    label:
      'Queixa digestiva (Azia, dor epigástrica, cólicas, diarreia, constipação)',
  },
  {
    key: 'q5_urinario',
    label:
      'Queixa urinária (Ardência urinária, secreção uretral, cólica renal)',
  },
  { key: 'q6_sono', label: 'Queixa na qualidade do sono e descanso adequado' },
  {
    key: 'q7_emocional',
    label:
      'Problema de ordem emocional ou familiar que possa desaconselhar o mergulho',
  },
  {
    key: 'q8_articular',
    label:
      'Dores nas articulações ou queixa parecida com doença descompressiva',
  },
  { key: 'q9_outras', label: 'Outra queixa de saúde não abordada acima' },
];

// ============================================================
// FUNÇÕES DE VALIDAÇÃO E CÁLCULO
// ============================================================

function calcularIMC(peso: number, altura: number): number {
  if (!peso || !altura) return 0;
  let alt = altura;
  if (alt > 3) alt = alt / 100;
  return peso / (alt * alt);
}

function validarTemperatura(valor: number | null): boolean {
  if (!valor) return false;
  return valor >= TEMPERATURA_MIN && valor <= TEMPERATURA_MAX;
}

function validarFrequencia(valor: number | null): boolean {
  if (!valor) return false;
  return valor > FREQUENCIA_MIN && valor < FREQUENCIA_MAX;
}

function validarPressao(sist: number | null, diast: number | null): boolean {
  if (!sist || !diast) return false;
  return (
    sist > PRESSÃO_SISTOLICA_MIN &&
    sist < PRESSÃO_SISTOLICA_MAX &&
    diast > PRESSÃO_DIASTOLICA_MIN &&
    diast < PRESSÃO_DIASTOLICA_MAX
  );
}

function calcularAptidaoMergulho(
  questoes: Record<string, boolean>,
  temperatura: number | null,
  frequencia: number | null,
  pressaoSist: number | null,
  pressaoDiast: number | null
): 'apto' | 'inapto' | null {
  const temQuestaoSim = Object.values(questoes).some(Boolean);
  const tempOk = validarTemperatura(temperatura);
  const freqOk = validarFrequencia(frequencia);
  const pressOk = validarPressao(pressaoSist, pressaoDiast);

  const dadosCompletos =
    temperatura !== null &&
    frequencia !== null &&
    pressaoSist !== null &&
    pressaoDiast !== null;

  if (!dadosCompletos) return null;

  if (temQuestaoSim || !tempOk || !freqOk || !pressOk) {
    return 'inapto';
  }
  return 'apto';
}

function calcularAptidaoEmbarque(
  circunferencia: number | null,
  imc: number | null
): 'apto' | 'inapto' | null {
  if (circunferencia === null || imc === null) return null;

  if (circunferencia >= 102 || imc >= 35) {
    return 'inapto';
  }
  return 'apto';
}

function gerarPlanoAcao(
  questoes: Record<string, boolean>,
  temperatura: number | null,
  frequencia: number | null,
  pressaoSist: number | null,
  pressaoDiast: number | null,
  circunferencia: number | null,
  imc: number | null
): any[] {
  const plano: any[] = [];

  if (temperatura !== null && !validarTemperatura(temperatura)) {
    plano.push({
      parametro: 'Temperatura Corporal',
      status: 'critico',
      mensagem: `Temperatura ${temperatura}°C - Fora do range (${TEMPERATURA_MIN}-${TEMPERATURA_MAX}°C)`,
      acao: 'Repetir medição. Se persistir, encaminhar para avaliação médica.',
      prazo: 'Imediato',
      responsavel: 'Técnico de Enfermagem / EMED',
    });
  }

  if (frequencia !== null && !validarFrequencia(frequencia)) {
    plano.push({
      parametro: 'Frequência Cardíaca',
      status: 'critico',
      mensagem: `Frequência ${frequencia} bpm - Fora do range (${
        FREQUENCIA_MIN + 1
      }-${FREQUENCIA_MAX - 1} bpm)`,
      acao: 'Repouso imediato. Verificar pressão. Encaminhar ao médico se persistir.',
      prazo: 'Imediato',
      responsavel: 'Técnico de Enfermagem / EMED',
    });
  }

  if (
    pressaoSist !== null &&
    pressaoDiast !== null &&
    !validarPressao(pressaoSist, pressaoDiast)
  ) {
    plano.push({
      parametro: 'Pressão Arterial',
      status: 'critico',
      mensagem: `Pressão ${pressaoSist}/${pressaoDiast} mmHg - Fora do range (${
        PRESSÃO_SISTOLICA_MIN + 1
      }-${PRESSÃO_SISTOLICA_MAX - 1}x${PRESSÃO_DIASTOLICA_MIN + 1}-${
        PRESSÃO_DIASTOLICA_MAX - 1
      } mmHg)`,
      acao: 'Repouso imediato. Repetir medição após 15 minutos. Encaminhar ao médico do trabalho.',
      prazo: 'Imediato (até 1 hora)',
      responsavel: 'Técnico de Enfermagem / EMED',
    });
  }

  if (circunferencia !== null && circunferencia >= 102) {
    plano.push({
      parametro: 'Circunferência Abdominal',
      status: 'atencao',
      mensagem: `Circunferência ${circunferencia} cm - ≥ 102 cm (risco cardiovascular)`,
      acao: 'Encaminhar para avaliação nutricional e acompanhamento médico. Orientar sobre alimentação e exercícios.',
      prazo: '15 dias',
      responsavel: 'Nutricionista / Médico do Trabalho',
    });
  }

  if (imc !== null && imc >= 35) {
    plano.push({
      parametro: 'IMC elevado',
      status: 'critico',
      mensagem: `IMC ${imc.toFixed(1)} - ≥ 35 (obesidade grau II ou III)`,
      acao: 'Encaminhar para endocrinologista. Avaliação cardiovascular completa. Plano de emagrecimento supervisionado.',
      prazo: '30 dias',
      responsavel: 'Médico do Trabalho / Endocrinologista',
    });
  }

  QUESTOES.forEach((q) => {
    if (questoes[q.key]) {
      plano.push({
        parametro: q.label,
        status: 'critico',
        mensagem: `Queixa identificada: ${q.label}`,
        acao: `Encaminhar para avaliação especializada.`,
        prazo: '24-72 horas',
        responsavel: 'Médico do Trabalho / Especialista',
      });
    }
  });

  return plano;
}

// ============================================================
// HOOK DE ASSINATURA
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
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
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
          ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
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
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        setSignatureData('');
        isInitializedRef.current = false;
      }
    }
  }, [canvasRef]);

  return { signatureData, startDrawing, draw, endDrawing, clear };
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface AvaliacaoEmbarqueMergulhoModuleProps {
  styles?: any;
  onSave?: () => void; // Callback para notificar o prontuário
}

export default function AvaliacaoEmbarqueMergulhoModule({
  styles = {},
  onSave,
}: AvaliacaoEmbarqueMergulhoModuleProps) {
  // ── ESTADOS ──
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPlanoPopup, setShowPlanoPopup] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── FORMULÁRIO ──
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    colaborador_id: '',
    colaborador_nome: '',
    colaborador_codigo: '',
    funcao: '',
    idade: '',
    frente_servico: '',
    data_avaliacao: new Date().toISOString().split('T')[0],
    vencimento_aso: '',
    temperatura: '',
    frequencia_cardiaca: '',
    pressao_sistolica: '',
    pressao_diastolica: '',
    circunferencia_abdominal: '',
    peso: '',
    altura: '',
    q1_cardiovascular: false,
    q2_respiratorio: false,
    q3_ouvidos: false,
    q4_digestivo: false,
    q5_urinario: false,
    q6_sono: false,
    q7_emocional: false,
    q8_articular: false,
    q9_outras: false,
    profissional_saude: null as 'sim' | 'nao' | null,
    nome_avaliador: '',
  });

  const canvasRefAvaliador = useRef<HTMLCanvasElement>(null);
  const canvasRefMergulhador = useRef<HTMLCanvasElement>(null);

  const avaliadorCanvas = useSignatureCanvas(canvasRefAvaliador);
  const mergulhadorCanvas = useSignatureCanvas(canvasRefMergulhador);

  // ── CARREGAR COLABORADORES ──
  useEffect(() => {
    carregarColaboradores();
  }, []);

  const carregarColaboradores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setColaboradores(data || []);
    } catch (err: any) {
      setError('Erro ao carregar colaboradores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── CÁLCULOS DERIVADOS ──
  const imc = useMemo(() => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    if (!peso || !altura) return null;
    return calcularIMC(peso, altura);
  }, [formData.peso, formData.altura]);

  const questoes = useMemo(() => {
    const q: Record<string, boolean> = {};
    QUESTOES.forEach((qItem) => {
      q[qItem.key] = formData[qItem.key as keyof typeof formData] as boolean;
    });
    return q;
  }, [formData]);

  const aptidaoMergulho = useMemo(() => {
    return calcularAptidaoMergulho(
      questoes,
      parseFloat(formData.temperatura) || null,
      parseFloat(formData.frequencia_cardiaca) || null,
      parseFloat(formData.pressao_sistolica) || null,
      parseFloat(formData.pressao_diastolica) || null
    );
  }, [
    questoes,
    formData.temperatura,
    formData.frequencia_cardiaca,
    formData.pressao_sistolica,
    formData.pressao_diastolica,
  ]);

  const aptidaoEmbarque = useMemo(() => {
    const circ = parseFloat(formData.circunferencia_abdominal) || null;
    return calcularAptidaoEmbarque(circ, imc);
  }, [formData.circunferencia_abdominal, imc]);

  const planoAcao = useMemo(() => {
    return gerarPlanoAcao(
      questoes,
      parseFloat(formData.temperatura) || null,
      parseFloat(formData.frequencia_cardiaca) || null,
      parseFloat(formData.pressao_sistolica) || null,
      parseFloat(formData.pressao_diastolica) || null,
      parseFloat(formData.circunferencia_abdominal) || null,
      imc
    );
  }, [
    questoes,
    formData.temperatura,
    formData.frequencia_cardiaca,
    formData.pressao_sistolica,
    formData.pressao_diastolica,
    formData.circunferencia_abdominal,
    imc,
  ]);

  // ── HANDLERS ──
  const handleEmployeeSelect = (employeeId: string) => {
    if (!employeeId) {
      setSelectedEmployee(null);
      setFormData((prev) => ({
        ...prev,
        colaborador_id: '',
        colaborador_nome: '',
        colaborador_codigo: '',
        funcao: '',
        peso: '',
        altura: '',
      }));
      return;
    }

    const emp = colaboradores.find((e) => e.id?.toString() === employeeId);
    if (emp) {
      setSelectedEmployee(emp);

      // Calcular idade
      let idade = '';
      if (emp.data_nascimento) {
        const nasc = new Date(emp.data_nascimento);
        const hoje = new Date();
        let id = hoje.getFullYear() - nasc.getFullYear();
        const mes = hoje.getMonth() - nasc.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
          id--;
        }
        idade = id.toString();
      }

      setFormData((prev) => ({
        ...prev,
        colaborador_id: emp.id?.toString() || '',
        colaborador_nome: emp.nome || '',
        colaborador_codigo: emp.codigo?.toString() || '',
        funcao: emp.cargo || '',
        idade: idade,
        peso: emp.peso?.toString() || '',
        altura: emp.altura?.toString() || '',
      }));
    }
  };

  const handleQuestaoChange = (key: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      colaborador_id: '',
      colaborador_nome: '',
      colaborador_codigo: '',
      funcao: '',
      idade: '',
      frente_servico: '',
      data_avaliacao: new Date().toISOString().split('T')[0],
      vencimento_aso: '',
      temperatura: '',
      frequencia_cardiaca: '',
      pressao_sistolica: '',
      pressao_diastolica: '',
      circunferencia_abdominal: '',
      peso: '',
      altura: '',
      q1_cardiovascular: false,
      q2_respiratorio: false,
      q3_ouvidos: false,
      q4_digestivo: false,
      q5_urinario: false,
      q6_sono: false,
      q7_emocional: false,
      q8_articular: false,
      q9_outras: false,
      profissional_saude: null,
      nome_avaliador: '',
    });
    avaliadorCanvas.clear();
    mergulhadorCanvas.clear();
    setSelectedEmployee(null);
    setShowForm(false);
  };

  // ── FUNÇÃO PARA SALVAR NO IMC ──
  const salvarNoIMC = async () => {
    // Pega os dados do formulário
    const codigo = formData.colaborador_codigo;
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    const circ = parseFloat(formData.circunferencia_abdominal) || 0;
    const dataStr = formData.data_avaliacao;
    const empresa = formData.frente_servico || '-';

    if (!codigo || !peso || !altura) {
      console.warn('Dados insuficientes para salvar no IMC');
      return;
    }

    const data = new Date(dataStr + 'T00:00:00');
    if (isNaN(data.getTime())) {
      console.warn('Data inválida para salvar no IMC');
      return;
    }

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();
    const mesesNomes = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const mesNome = mesesNomes[data.getMonth()];

    const record = {
      codigo,
      data_raw: data.toISOString(),
      data_str: `${dia}/${String(mes).padStart(2, '0')}/${ano}`,
      ano,
      mes: data.getMonth(),
      mes_nome: mesNome,
      peso,
      altura,
      circunferencia: circ,
      empresa,
    };

    try {
      const { error: insertError } = await supabase
        .from('imc_records')
        .insert([record]);
      if (insertError) {
        console.error('Erro ao salvar no IMC:', insertError);
        // Não interrompe o fluxo, apenas loga
      } else {
        console.log('✅ Registro IMC salvo com sucesso:', record);
      }
    } catch (err) {
      console.error('Erro ao salvar no IMC:', err);
    }
  };

  // ── SALVAR ──
  const salvarAvaliacao = async () => {
    if (!formData.colaborador_nome) {
      setError('Selecione um colaborador');
      return;
    }
    if (!formData.nome_avaliador) {
      setError('Preencha o nome do avaliador');
      return;
    }
    if (formData.profissional_saude !== 'sim') {
      setError('Apenas profissionais de saúde podem realizar esta avaliação');
      return;
    }
    if (!avaliadorCanvas.signatureData) {
      setError('O profissional de saúde deve assinar');
      return;
    }
    if (!mergulhadorCanvas.signatureData) {
      setError('O colaborador deve assinar');
      return;
    }

    if (aptidaoMergulho === 'inapto' || aptidaoEmbarque === 'inapto') {
      setShowPlanoPopup(true);
      return;
    }

    await salvarNoBanco();
  };

  const salvarNoBanco = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        colaborador_id: parseInt(formData.colaborador_id) || null,
        colaborador_nome: formData.colaborador_nome,
        colaborador_codigo: formData.colaborador_codigo,
        funcao: formData.funcao,
        idade: parseInt(formData.idade) || null,
        frente_servico: formData.frente_servico,
        data_avaliacao: formData.data_avaliacao,
        vencimento_aso: formData.vencimento_aso || null,
        temperatura: parseFloat(formData.temperatura) || null,
        frequencia_cardiaca: parseInt(formData.frequencia_cardiaca) || null,
        pressao_sistolica: parseInt(formData.pressao_sistolica) || null,
        pressao_diastolica: parseInt(formData.pressao_diastolica) || null,
        circunferencia_abdominal:
          parseFloat(formData.circunferencia_abdominal) || null,
        peso: parseFloat(formData.peso) || null,
        altura: parseFloat(formData.altura) || null,
        imc: imc,
        q1_cardiovascular: formData.q1_cardiovascular,
        q2_respiratorio: formData.q2_respiratorio,
        q3_ouvidos: formData.q3_ouvidos,
        q4_digestivo: formData.q4_digestivo,
        q5_urinario: formData.q5_urinario,
        q6_sono: formData.q6_sono,
        q7_emocional: formData.q7_emocional,
        q8_articular: formData.q8_articular,
        q9_outras: formData.q9_outras,
        profissional_saude: formData.profissional_saude,
        nome_avaliador: formData.nome_avaliador,
        assinatura_avaliador: avaliadorCanvas.signatureData,
        assinatura_mergulhador: mergulhadorCanvas.signatureData,
        aptidao_mergulho: aptidaoMergulho,
        aptidao_embarque: aptidaoEmbarque,
        plano_acao: planoAcao,
      };

      // 1. Salvar avaliação
      const { data, error: insertError } = await supabase
        .from('avaliacoes_embarque_mergulho')
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      // 2. Salvar no IMC (usa o código do colaborador)
      await salvarNoIMC();

      setSuccessMessage(
        'Avaliação salva com sucesso! Registro adicionado ao IMC.'
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      if (onSave) onSave();

      resetForm();
      setShowPlanoPopup(false);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── FILTRAR COLABORADORES ──
  const colaboradoresFiltrados = useMemo(() => {
    if (!searchTerm) return colaboradores;
    const term = searchTerm.toLowerCase();
    return colaboradores.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.codigo.toLowerCase().includes(term) ||
        (c.cargo && c.cargo.toLowerCase().includes(term))
    );
  }, [colaboradores, searchTerm]);

  // ── RENDER ──
  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: '"Inter", -apple-system, sans-serif',
        ...styles,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: COLORS.textPrimary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                background: COLORS.primary,
                color: 'white',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
              }}
            >
              AV
            </span>
            Avaliação Embarque e Mergulho
          </h1>
          <p style={{ color: COLORS.textSecondary, margin: '4px 0 0' }}>
            Avaliação médica para embarque e atividades de mergulho
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: showForm
              ? COLORS.danger
              : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: showForm ? 'none' : `0 4px 15px ${COLORS.primaryGlow}`,
          }}
        >
          {showForm ? 'Fechar' : 'Nova Avaliação'}
        </button>
      </div>

      {/* MENSAGENS */}
      {error && (
        <div
          style={{
            background: COLORS.dangerBg,
            color: COLORS.danger,
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: `1px solid #f5c6cb`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconAlertTriangle size={18} color={COLORS.danger} />
          {error}
        </div>
      )}
      {successMessage && (
        <div
          style={{
            background: COLORS.successBg,
            color: COLORS.success,
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: `1px solid #c3e6cb`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconCheck size={18} color={COLORS.success} />
          {successMessage}
        </div>
      )}

      {/* FORMULÁRIO */}
      {showForm && (
        <div
          style={{
            background: COLORS.bgCard,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* SELECIONAR COLABORADOR */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: COLORS.textSecondary,
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Colaborador
            </label>

            <input
              type="text"
              placeholder="Buscar colaborador por nome, código ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '14px',
                background: COLORS.bgGhost,
                outline: 'none',
                marginBottom: '8px',
              }}
            />

            <select
              value={formData.colaborador_id}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '15px',
                color: COLORS.textPrimary,
                background: COLORS.bgGhost,
                outline: 'none',
              }}
            >
              <option value="">-- Selecione um colaborador --</option>
              {colaboradoresFiltrados.map((emp) => (
                <option key={emp.id} value={emp.id.toString()}>
                  {emp.codigo} - {emp.nome} {emp.cargo ? `(${emp.cargo})` : ''}
                </option>
              ))}
            </select>

            {formData.colaborador_nome && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: COLORS.primaryGlow,
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.primary}40`,
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  {formData.colaborador_nome}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '13px',
                    color: COLORS.textSecondary,
                    marginTop: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    <strong>Código:</strong>{' '}
                    {formData.colaborador_codigo || '—'}
                  </span>
                  <span>
                    <strong>Função:</strong> {formData.funcao || '—'}
                  </span>
                  {formData.idade && (
                    <span>
                      <strong>Idade:</strong> {formData.idade} anos
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {formData.colaborador_nome && (
            <>
              {/* DADOS GERAIS */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Data da Avaliação
                  </label>
                  <input
                    type="date"
                    value={formData.data_avaliacao}
                    onChange={(e) =>
                      handleFieldChange('data_avaliacao', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Vencimento ASO
                  </label>
                  <input
                    type="date"
                    value={formData.vencimento_aso}
                    onChange={(e) =>
                      handleFieldChange('vencimento_aso', e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Frente de Serviço
                  </label>
                  <input
                    type="text"
                    value={formData.frente_servico}
                    onChange={(e) =>
                      handleFieldChange('frente_servico', e.target.value)
                    }
                    placeholder="Ex: Offshore Bacia de Campos"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* SINAIS VITAIS */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                  padding: '16px',
                  background: COLORS.bgGhost,
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperatura}
                    onChange={(e) =>
                      handleFieldChange('temperatura', e.target.value)
                    }
                    placeholder="36.5"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${
                        validarTemperatura(
                          parseFloat(formData.temperatura) || null
                        )
                          ? COLORS.primary
                          : COLORS.border
                      }`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                  <span
                    style={{ fontSize: '10px', color: COLORS.textSecondary }}
                  >
                    {TEMPERATURA_MIN} - {TEMPERATURA_MAX}°C
                  </span>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Frequência (bpm)
                  </label>
                  <input
                    type="number"
                    value={formData.frequencia_cardiaca}
                    onChange={(e) =>
                      handleFieldChange('frequencia_cardiaca', e.target.value)
                    }
                    placeholder="72"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${
                        validarFrequencia(
                          parseInt(formData.frequencia_cardiaca) || null
                        )
                          ? COLORS.primary
                          : COLORS.border
                      }`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                  <span
                    style={{ fontSize: '10px', color: COLORS.textSecondary }}
                  >
                    {FREQUENCIA_MIN + 1} - {FREQUENCIA_MAX - 1} bpm
                  </span>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Pressão (mmHg)
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="number"
                      value={formData.pressao_sistolica}
                      onChange={(e) =>
                        handleFieldChange('pressao_sistolica', e.target.value)
                      }
                      placeholder="120"
                      style={{
                        width: '50%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${
                          validarPressao(
                            parseInt(formData.pressao_sistolica) || null,
                            parseInt(formData.pressao_diastolica) || null
                          )
                            ? COLORS.primary
                            : COLORS.border
                        }`,
                        fontSize: '14px',
                        background: COLORS.bgGhost,
                        outline: 'none',
                      }}
                    />
                    <span
                      style={{ fontSize: '18px', color: COLORS.textSecondary }}
                    >
                      /
                    </span>
                    <input
                      type="number"
                      value={formData.pressao_diastolica}
                      onChange={(e) =>
                        handleFieldChange('pressao_diastolica', e.target.value)
                      }
                      placeholder="80"
                      style={{
                        width: '50%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${
                          validarPressao(
                            parseInt(formData.pressao_sistolica) || null,
                            parseInt(formData.pressao_diastolica) || null
                          )
                            ? COLORS.primary
                            : COLORS.border
                        }`,
                        fontSize: '14px',
                        background: COLORS.bgGhost,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <span
                    style={{ fontSize: '10px', color: COLORS.textSecondary }}
                  >
                    {PRESSÃO_SISTOLICA_MIN + 1}-{PRESSÃO_SISTOLICA_MAX - 1}x
                    {PRESSÃO_DIASTOLICA_MIN + 1}-{PRESSÃO_DIASTOLICA_MAX - 1}
                  </span>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Circ. Abdominal (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.circunferencia_abdominal}
                    onChange={(e) =>
                      handleFieldChange(
                        'circunferencia_abdominal',
                        e.target.value
                      )
                    }
                    placeholder="85"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${
                        (parseFloat(formData.circunferencia_abdominal) || 0) <
                        102
                          ? COLORS.primary
                          : COLORS.danger
                      }`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                  <span
                    style={{ fontSize: '10px', color: COLORS.textSecondary }}
                  >
                    {parseFloat(formData.circunferencia_abdominal) >= 102
                      ? '⚠️ ≥ 102 cm'
                      : 'Normal < 102 cm'}
                  </span>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => handleFieldChange('peso', e.target.value)}
                    placeholder="75"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.altura}
                    onChange={(e) =>
                      handleFieldChange('altura', e.target.value)
                    }
                    placeholder="175"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                </div>
                {imc !== null && (
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: COLORS.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      IMC
                    </label>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background:
                          imc >= 35
                            ? COLORS.dangerBg
                            : imc >= 30
                            ? COLORS.warningBg
                            : COLORS.successBg,
                        color:
                          imc >= 35
                            ? COLORS.danger
                            : imc >= 30
                            ? COLORS.warning
                            : COLORS.success,
                        fontWeight: 700,
                        fontSize: '18px',
                        textAlign: 'center',
                      }}
                    >
                      {imc.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              {/* QUESTIONÁRIO */}
              <div style={{ marginBottom: '24px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    margin: '0 0 16px 0',
                  }}
                >
                  Questionário de Saúde
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {QUESTOES.map((q) => {
                    const isChecked = formData[
                      q.key as keyof typeof formData
                    ] as boolean;
                    return (
                      <div
                        key={q.key}
                        style={{
                          background: isChecked
                            ? COLORS.dangerBg
                            : COLORS.bgGhost,
                          borderRadius: '12px',
                          padding: '16px',
                          borderLeft: `4px solid ${
                            isChecked ? COLORS.danger : COLORS.primary
                          }`,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            marginBottom: '8px',
                            fontSize: '14px',
                          }}
                        >
                          {q.label}
                        </div>
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name={q.key}
                              checked={isChecked === true}
                              onChange={() => handleQuestaoChange(q.key, true)}
                            />{' '}
                            Sim
                          </label>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name={q.key}
                              checked={isChecked === false}
                              onChange={() => handleQuestaoChange(q.key, false)}
                            />{' '}
                            Não
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AVALIADOR */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                  padding: '16px',
                  background: COLORS.bgGhost,
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Avaliador
                  </label>
                  <input
                    type="text"
                    value={formData.nome_avaliador}
                    onChange={(e) =>
                      handleFieldChange('nome_avaliador', e.target.value)
                    }
                    placeholder="Nome do profissional"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      background: COLORS.bgGhost,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Profissional de Saúde?
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="profissional_saude"
                        checked={formData.profissional_saude === 'sim'}
                        onChange={() =>
                          handleFieldChange('profissional_saude', 'sim')
                        }
                      />{' '}
                      Sim
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="profissional_saude"
                        checked={formData.profissional_saude === 'nao'}
                        onChange={() =>
                          handleFieldChange('profissional_saude', 'nao')
                        }
                      />{' '}
                      Não
                    </label>
                  </div>
                </div>
              </div>

              {/* ASSINATURAS */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Assinatura do Avaliador
                  </label>
                  <canvas
                    ref={canvasRefAvaliador}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '12px',
                      background: 'white',
                      cursor: 'crosshair',
                      width: '100%',
                      height: '120px',
                      touchAction: 'none',
                      display: 'block',
                    }}
                    onMouseDown={avaliadorCanvas.startDrawing}
                    onMouseMove={avaliadorCanvas.draw}
                    onMouseUp={avaliadorCanvas.endDrawing}
                    onMouseLeave={avaliadorCanvas.endDrawing}
                    onTouchStart={avaliadorCanvas.startDrawing}
                    onTouchMove={avaliadorCanvas.draw}
                    onTouchEnd={avaliadorCanvas.endDrawing}
                  />
                  <button
                    onClick={avaliadorCanvas.clear}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: COLORS.danger,
                      marginTop: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Limpar
                  </button>
                  {avaliadorCanvas.signatureData && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: COLORS.success,
                        marginLeft: '12px',
                      }}
                    >
                      Assinado
                    </span>
                  )}
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Assinatura do Colaborador
                  </label>
                  <canvas
                    ref={canvasRefMergulhador}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '12px',
                      background: 'white',
                      cursor: 'crosshair',
                      width: '100%',
                      height: '120px',
                      touchAction: 'none',
                      display: 'block',
                    }}
                    onMouseDown={mergulhadorCanvas.startDrawing}
                    onMouseMove={mergulhadorCanvas.draw}
                    onMouseUp={mergulhadorCanvas.endDrawing}
                    onMouseLeave={mergulhadorCanvas.endDrawing}
                    onTouchStart={mergulhadorCanvas.startDrawing}
                    onTouchMove={mergulhadorCanvas.draw}
                    onTouchEnd={mergulhadorCanvas.endDrawing}
                  />
                  <button
                    onClick={mergulhadorCanvas.clear}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: COLORS.danger,
                      marginTop: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    Limpar
                  </button>
                  {mergulhadorCanvas.signatureData && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: COLORS.success,
                        marginLeft: '12px',
                      }}
                    >
                      Assinado
                    </span>
                  )}
                </div>
              </div>

              {/* RESULTADO */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background:
                      aptidaoMergulho === 'apto'
                        ? COLORS.successBg
                        : aptidaoMergulho === 'inapto'
                        ? COLORS.dangerBg
                        : COLORS.bgGhost,
                    border: `1px solid ${
                      aptidaoMergulho === 'apto'
                        ? COLORS.primary
                        : aptidaoMergulho === 'inapto'
                        ? COLORS.danger
                        : COLORS.border
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                    }}
                  >
                    Aptidão para Mergulho
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color:
                        aptidaoMergulho === 'apto'
                          ? COLORS.success
                          : aptidaoMergulho === 'inapto'
                          ? COLORS.danger
                          : COLORS.textSecondary,
                    }}
                  >
                    {aptidaoMergulho === 'apto'
                      ? 'APTO'
                      : aptidaoMergulho === 'inapto'
                      ? 'INAPTO'
                      : 'Pendente'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background:
                      aptidaoEmbarque === 'apto'
                        ? COLORS.successBg
                        : aptidaoEmbarque === 'inapto'
                        ? COLORS.dangerBg
                        : COLORS.bgGhost,
                    border: `1px solid ${
                      aptidaoEmbarque === 'apto'
                        ? COLORS.primary
                        : aptidaoEmbarque === 'inapto'
                        ? COLORS.danger
                        : COLORS.border
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: COLORS.textSecondary,
                      textTransform: 'uppercase',
                    }}
                  >
                    Aptidão para Embarque
                  </div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color:
                        aptidaoEmbarque === 'apto'
                          ? COLORS.success
                          : aptidaoEmbarque === 'inapto'
                          ? COLORS.danger
                          : COLORS.textSecondary,
                    }}
                  >
                    {aptidaoEmbarque === 'apto'
                      ? 'APTO'
                      : aptidaoEmbarque === 'inapto'
                      ? 'INAPTO'
                      : 'Pendente'}
                  </div>
                </div>
              </div>

              {/* PLANO DE AÇÃO */}
              {planoAcao.length > 0 && (
                <div
                  style={{
                    background: COLORS.warningBg,
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.warning}`,
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: COLORS.warning,
                      marginBottom: '8px',
                    }}
                  >
                    Plano de Ação - {planoAcao.length} item(ns) pendente(s)
                  </div>
                  <button
                    onClick={() => setShowPlanoPopup(true)}
                    style={{
                      padding: '8px 20px',
                      background: COLORS.danger,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    Ver Plano de Ação
                  </button>
                </div>
              )}

              {/* BOTÕES */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  paddingTop: '16px',
                  borderTop: `1px solid ${COLORS.border}`,
                }}
              >
                <button
                  onClick={resetForm}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    background: 'transparent',
                    color: COLORS.textSecondary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarAvaliacao}
                  disabled={saving}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    background: saving
                      ? COLORS.border
                      : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                    color: saving ? COLORS.textSecondary : 'white',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: `0 4px 15px ${COLORS.primaryGlow}`,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar no Prontuário'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* POPUP PLANO DE AÇÃO */}
      {showPlanoPopup && planoAcao.length > 0 && (
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
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: `2px solid ${COLORS.dangerBg}`,
                paddingBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: COLORS.danger,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <IconAlertTriangle size={24} color={COLORS.danger} />
                Plano de Ação
              </h2>
              <button
                onClick={() => setShowPlanoPopup(false)}
                style={{
                  background: COLORS.bgGhost,
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: COLORS.textSecondary }}>
                <strong>Colaborador:</strong> {formData.colaborador_nome}
              </p>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {planoAcao.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background:
                      item.status === 'critico'
                        ? COLORS.dangerBg
                        : COLORS.warningBg,
                    borderRadius: '12px',
                    padding: '16px',
                    borderLeft: `4px solid ${
                      item.status === 'critico' ? COLORS.danger : COLORS.warning
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <strong>{item.parametro}</strong>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color:
                          item.status === 'critico'
                            ? COLORS.danger
                            : COLORS.warning,
                      }}
                    >
                      {item.status === 'critico' ? 'CRÍTICO' : 'ATENÇÃO'}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: COLORS.textSecondary,
                      margin: '4px 0',
                    }}
                  >
                    {item.mensagem}
                  </p>
                  <div
                    style={{
                      background: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      marginTop: '8px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Ação: {item.acao}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '12px',
                        color: COLORS.textSecondary,
                      }}
                    >
                      <span>Prazo: {item.prazo}</span>
                      <span>Responsável: {item.responsavel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: COLORS.warningBg,
                borderRadius: '12px',
                border: `1px solid ${COLORS.warning}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  textAlign: 'center',
                  color: '#92400e',
                }}
              >
                O colaborador só será liberado após a resolução de todos os
                itens críticos.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowPlanoPopup(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: COLORS.bgGhost,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: COLORS.textSecondary,
                }}
              >
                Voltar
              </button>
              <button
                onClick={salvarNoBanco}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: saving ? COLORS.border : COLORS.danger,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar com Plano de Ação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
