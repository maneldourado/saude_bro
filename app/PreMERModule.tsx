// app/PreMERModule.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface PreMERModuleProps {
  styles?: any;
  employees?: any[];
}

export default function PreMERModule({
  styles = {},
  employees = [],
}: PreMERModuleProps) {
  // Estados do formulário
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [colaborador, setColaborador] = useState('');
  const [colaboradorId, setColaboradorId] = useState<string | null>(null);
  const [colaboradorCodigo, setColaboradorCodigo] = useState('');
  const [funcao, setFuncao] = useState('');
  const [frente, setFrente] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sinais vitais
  const [temperatura, setTemperatura] = useState('36.5');
  const [frequencia, setFrequencia] = useState('78');
  const [pressaoSistolica, setPressaoSistolica] = useState('120');
  const [pressaoDiastolica, setPressaoDiastolica] = useState('80');

  // Questões (1 a 9)
  const [questoes, setQuestoes] = useState({
    q1: false,
    q2: false,
    q3: false,
    q4: false,
    q5: false,
    q6: false,
    q7: false,
    q8: false,
    q9: false,
  });

  // Avaliador e assinaturas
  const [nomeAvaliador, setNomeAvaliador] = useState('');
  const [profissionalSaude, setProfissionalSaude] = useState<
    'sim' | 'nao' | null
  >(null);
  const [aptidao, setAptidao] = useState<'apto' | 'inapto' | null>(null);

  // Assinaturas digitais
  const [assinaturaAvaliador, setAssinaturaAvaliador] = useState<string>('');
  const [assinaturaMergulhador, setAssinaturaMergulhador] =
    useState<string>('');
  const [isDrawingAvaliador, setIsDrawingAvaliador] = useState(false);
  const [isDrawingMergulhador, setIsDrawingMergulhador] = useState(false);

  // Refs para os canvas de assinatura
  const canvasRefAvaliador = useRef<HTMLCanvasElement>(null);
  const canvasRefMergulhador = useRef<HTMLCanvasElement>(null);
  const ctxAvaliadorRef = useRef<CanvasRenderingContext2D | null>(null);
  const ctxMergulhadorRef = useRef<CanvasRenderingContext2D | null>(null);

  // ==================== ASSINATURAS ====================
  useEffect(() => {
    if (canvasRefAvaliador.current && !assinaturaAvaliador) {
      const canvas = canvasRefAvaliador.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxAvaliadorRef.current = ctx;
      }
    }
  }, [assinaturaAvaliador]);

  useEffect(() => {
    if (canvasRefMergulhador.current && !assinaturaMergulhador) {
      const canvas = canvasRefMergulhador.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxMergulhadorRef.current = ctx;
      }
    }
  }, [assinaturaMergulhador]);

  // Funções para desenhar no canvas (Avaliador)
  const startDrawingAvaliador = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawingAvaliador(true);
    const canvas = canvasRefAvaliador.current;
    if (!canvas) return;
    const ctx = ctxAvaliadorRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawAvaliador = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingAvaliador) return;
    const canvas = canvasRefAvaliador.current;
    if (!canvas) return;
    const ctx = ctxAvaliadorRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const endDrawingAvaliador = () => {
    setIsDrawingAvaliador(false);
    if (canvasRefAvaliador.current) {
      const dataUrl = canvasRefAvaliador.current.toDataURL();
      setAssinaturaAvaliador(dataUrl);
    }
  };

  // Funções para desenhar no canvas (Mergulhador)
  const startDrawingMergulhador = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawingMergulhador(true);
    const canvas = canvasRefMergulhador.current;
    if (!canvas) return;
    const ctx = ctxMergulhadorRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawMergulhador = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingMergulhador) return;
    const canvas = canvasRefMergulhador.current;
    if (!canvas) return;
    const ctx = ctxMergulhadorRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const endDrawingMergulhador = () => {
    setIsDrawingMergulhador(false);
    if (canvasRefMergulhador.current) {
      const dataUrl = canvasRefMergulhador.current.toDataURL();
      setAssinaturaMergulhador(dataUrl);
    }
  };

  // Limpar assinaturas
  const clearSignatureAvaliador = () => {
    const canvas = canvasRefAvaliador.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAssinaturaAvaliador('');
      }
    }
  };

  const clearSignatureMergulhador = () => {
    const canvas = canvasRefMergulhador.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAssinaturaMergulhador('');
      }
    }
  };

  // ==================== SELEÇÃO DE COLABORADOR ====================
  const handleEmployeeSelect = (employeeId: string) => {
    if (!employeeId) {
      setColaborador('');
      setColaboradorId(null);
      setColaboradorCodigo('');
      setFuncao('');
      setFrente('');
      return;
    }

    const employee = employees.find((e: any) => {
      const eId = e.id?.toString();
      const eCodigo = e.codigo?.toString();
      return eId === employeeId || eCodigo === employeeId;
    });

    if (employee) {
      setSelectedEmployeeId(employeeId);
      setColaborador(employee.name || employee.nome || '');
      setColaboradorId(employee.id?.toString() || null);
      setColaboradorCodigo(employee.codigo || '');
      setFuncao(employee.cargo || '');
      setFrente(employee.departamento || '');
    } else {
      alert('Colaborador não encontrado!');
    }
  };

  const handleQuestaoChange = (key: keyof typeof questoes) => {
    setQuestoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ==================== SALVAR NO SUPABASE ====================
  const handleSubmit = async () => {
    if (!colaborador) {
      alert('Selecione um colaborador primeiro!');
      return;
    }

    if (!nomeAvaliador) {
      alert('Preencha o nome do avaliador!');
      return;
    }

    if (!aptidao) {
      alert('Selecione a aptidão (APTO ou INAPTO)!');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    // Montar objeto com as questões respondidas
    const questoesRespondidas = {
      cardiovascular: questoes.q1,
      respiratorio: questoes.q2,
      ouvidos: questoes.q3,
      digestivo: questoes.q4,
      urinario: questoes.q5,
      sono: questoes.q6,
      emocional: questoes.q7,
      articular: questoes.q8,
      outras: questoes.q9,
    };

    const dadosAvaliacao = {
      colaborador_id: colaboradorId ? parseInt(colaboradorId) : null,
      colaborador_nome: colaborador,
      colaborador_codigo: colaboradorCodigo,
      funcao: funcao,
      frente_servico: frente,
      temperatura: parseFloat(temperatura),
      frequencia_cardíaca: parseInt(frequencia),
      pressao_sistolica: parseInt(pressaoSistolica),
      pressao_diastolica: parseInt(pressaoDiastolica),
      questoes: questoesRespondidas,
      nome_avaliador: nomeAvaliador,
      profissional_saude: profissionalSaude,
      aptidao: aptidao,
      assinatura_avaliador: assinaturaAvaliador,
      assinatura_mergulhador: assinaturaMergulhador,
    };

    try {
      const { error } = await supabase
        .from('pre_mer_avaliacoes')
        .insert([dadosAvaliacao]);

      if (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar avaliação: ' + error.message);
      } else {
        setSuccessMessage('✅ Avaliação Pré-MER salva com sucesso!');
        alert('Avaliação Pré-MER salva com sucesso!');

        // Reset do formulário
        resetForm();
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao salvar avaliação');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Reset do formulário
  const resetForm = () => {
    setTemperatura('36.5');
    setFrequencia('78');
    setPressaoSistolica('120');
    setPressaoDiastolica('80');
    setQuestoes({
      q1: false,
      q2: false,
      q3: false,
      q4: false,
      q5: false,
      q6: false,
      q7: false,
      q8: false,
      q9: false,
    });
    setNomeAvaliador('');
    setProfissionalSaude(null);
    setAptidao(null);
    setAssinaturaAvaliador('');
    setAssinaturaMergulhador('');
    clearSignatureAvaliador();
    clearSignatureMergulhador();
  };

  // ==================== ESTILOS (IDÊNTICO AO DASHBOARD) ====================
  const stylesObj = {
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
    vitalCard: {
      background: '#f8f5f2',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center' as const,
      border: '1px solid #f0ebe6',
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
    value: {
      fontSize: '32px',
      fontWeight: 700,
      color: '#1a1a1a',
      margin: '8px 0',
    },
    checkIcon: {
      color: '#10b981',
      fontSize: '24px',
      marginLeft: '12px',
      verticalAlign: 'middle' as const,
    },
    questionCard: {
      background: '#f8f5f2',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '12px',
      borderLeft: '4px solid #10b981',
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
      fontFamily: '"Inter", -apple-system, sans-serif',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '12px',
      border: '1px solid #e8e0d8',
      fontSize: '14px',
      color: '#2d2d2d',
      background: 'rgba(0, 0, 0, 0.02)',
      outline: 'none',
      transition: 'all 0.3s ease',
    },
    signatureGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      marginBottom: '24px',
    },
    signatureBox: {
      border: '2px dashed #e8e0d8',
      borderRadius: '16px',
      padding: '16px',
      background: '#faf8f6',
      textAlign: 'center' as const,
    },
    canvas: {
      border: '1px solid #e8e0d8',
      borderRadius: '12px',
      background: 'white',
      cursor: 'crosshair',
      width: '100%',
      height: '150px',
      marginTop: '8px',
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
    aptidaoButton: (selected: boolean) => ({
      flex: 1,
      padding: '12px',
      borderRadius: '40px',
      border: selected ? '2px solid #10b981' : '1px solid #e8e0d8',
      background: selected ? 'rgba(16, 185, 129, 0.1)' : 'white',
      color: selected ? '#059669' : '#6b6b6b',
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
      background: '#fef3c7',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #fde68a',
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
  };

  // ==================== RENDER ====================
  return (
    <div style={stylesObj.container}>
      {/* HEADER - IDÊNTICO AO DASHBOARD */}
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
            ></i>
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
          ></i>
          <span style={{ color: '#6b6b6b', fontSize: '13px' }}>
            Ficha #{new Date().toISOString().slice(0, 10).replace(/-/g, '')}
          </span>
        </div>
      </div>

      {/* SELEÇÃO DE COLABORADOR */}
      <div style={stylesObj.headerCard}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <label style={stylesObj.label}>👨‍⚕️ Selecione o Colaborador</label>
            <select
              style={stylesObj.select}
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
            >
              <option value="">-- Selecione um colaborador --</option>
              {employees && employees.length > 0 ? (
                employees.map((emp: any) => {
                  const empId = emp.id?.toString() || emp.codigo?.toString();
                  const empName = emp.name || emp.nome || 'Sem nome';
                  const empCargo = emp.cargo || 'Sem cargo';
                  return (
                    <option key={empId} value={empId}>
                      {empName} - {empCargo}
                    </option>
                  );
                })
              ) : (
                <option disabled value="">
                  Nenhum colaborador cadastrado
                </option>
              )}
            </select>
          </div>

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
                <span style={{ fontWeight: 600 }}>Código:</span>{' '}
                {colaboradorCodigo} •{' '}
                <span style={{ fontWeight: 600 }}>Função:</span>{' '}
                {funcao || 'Não definida'} •{' '}
                <span style={{ fontWeight: 600 }}>Frente:</span>{' '}
                {frente || 'Não definida'}
              </div>
            </div>
          )}
        </div>
      </div>

      {!colaborador ? (
        <div style={stylesObj.card}>
          <div style={stylesObj.emptyState}>
            <i className="fas fa-user-md" style={stylesObj.emptyIcon}></i>
            <h3 style={{ color: '#2d2d2d', marginBottom: '8px' }}>
              Selecione um colaborador para iniciar a avaliação
            </h3>
            <p style={{ color: '#6b6b6b' }}>
              Apenas médicos têm acesso a este módulo.
            </p>
            {employees && employees.length === 0 && (
              <p style={{ color: '#dc2626', marginTop: '16px' }}>
                ⚠️ Nenhum colaborador encontrado. Cadastre colaboradores no
                módulo "Colaboradores" primeiro.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {successMessage && (
            <div style={stylesObj.successMessage}>{successMessage}</div>
          )}

          {/* SINAIS VITAIS */}
          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-heartbeat"
                style={{ marginRight: '8px', color: '#10b981' }}
              ></i>
              Sinais Vitais
            </h3>
            <div style={stylesObj.grid}>
              <div style={stylesObj.vitalCard}>
                <div style={stylesObj.label}>🌡️ Temperatura Corporal (°C)</div>
                <div style={stylesObj.value}>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatura}
                    onChange={(e) => setTemperatura(e.target.value)}
                    style={{
                      width: '80px',
                      textAlign: 'center',
                      fontSize: '28px',
                      border: 'none',
                      outline: 'none',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      background: 'transparent',
                    }}
                  />
                  <span style={{ fontSize: '18px', color: '#6b6b6b' }}>°C</span>
                  <i
                    className="fas fa-check-circle"
                    style={stylesObj.checkIcon}
                  ></i>
                </div>
                <div style={{ fontSize: '12px', color: '#6b6b6b' }}>
                  Parâmetro: 36.1 - 36.9°C
                </div>
              </div>

              <div style={stylesObj.vitalCard}>
                <div style={stylesObj.label}>💓 Frequência Cardíaca (BPM)</div>
                <div style={stylesObj.value}>
                  <input
                    type="number"
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value)}
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
                  />
                  <span style={{ fontSize: '18px', color: '#6b6b6b' }}>
                    bpm
                  </span>
                  <i
                    className="fas fa-check-circle"
                    style={stylesObj.checkIcon}
                  ></i>
                </div>
                <div style={{ fontSize: '12px', color: '#6b6b6b' }}>
                  Parâmetro: 60 - 100 bpm
                </div>
              </div>

              <div style={stylesObj.vitalCard}>
                <div style={stylesObj.label}>🩸 Pressão Arterial (mmHg)</div>
                <div style={stylesObj.value}>
                  <input
                    type="number"
                    value={pressaoSistolica}
                    onChange={(e) => setPressaoSistolica(e.target.value)}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      fontSize: '28px',
                      border: 'none',
                      outline: 'none',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      background: 'transparent',
                    }}
                  />
                  <span style={{ fontSize: '24px', color: '#6b6b6b' }}>
                    {' '}
                    /{' '}
                  </span>
                  <input
                    type="number"
                    value={pressaoDiastolica}
                    onChange={(e) => setPressaoDiastolica(e.target.value)}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      fontSize: '28px',
                      border: 'none',
                      outline: 'none',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      background: 'transparent',
                    }}
                  />
                  <i
                    className="fas fa-check-circle"
                    style={stylesObj.checkIcon}
                  ></i>
                </div>
                <div style={{ fontSize: '12px', color: '#6b6b6b' }}>
                  Parâmetro: &lt; 130x85 mmHg
                </div>
              </div>
            </div>
          </div>

          {/* QUESTIONÁRIO DE SAÚDE */}
          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-clipboard-list"
                style={{ marginRight: '8px', color: '#10b981' }}
              ></i>
              Questionário de Saúde
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {[
                {
                  key: 'q1',
                  text: 'Refere alguma queixa cardiovascular (Dispnéia, dor precordial, cansaço, tontura, palpitação)? A pressão arterial está alterada?',
                },
                {
                  key: 'q2',
                  text: 'Refere alguma queixa respiratória (Estado gripal, congestão nasal, rinite alérgica, dispnéia, tosse, cansaço, bronquite)?',
                },
                {
                  key: 'q3',
                  text: 'Refere algum problema nas orelhas (Zumbido, Dor, prurido, secreção, tonteira, vertigens e dificuldade para equalizar ouvido médio)?',
                },
                {
                  key: 'q4',
                  text: 'Apresenta alguma queixa digestiva (Azia, dor epigástrica em queimação, cólicas, diarreia, constipação intestinal)?',
                },
                {
                  key: 'q5',
                  text: 'Apresenta alguma queixa urinária (Ardência urinária, secreção uretral, cólica renal)?',
                },
                {
                  key: 'q6',
                  text: 'Refere alguma queixa na qualidade do sono e descanso adequado?',
                },
                {
                  key: 'q7',
                  text: 'Apresenta algum problema de ordem emocional ou familiar que possa desaconselhar o mergulho?',
                },
                {
                  key: 'q8',
                  text: 'Relata queixa de dores nas articulações ou alguma queixa que seja parecido com doença descompressiva?',
                },
                {
                  key: 'q9',
                  text: 'Relata alguma outra queixa de saúde não abordada acima?',
                },
              ].map((q) => (
                <div key={q.key} style={stylesObj.questionCard}>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: '12px',
                      color: '#2d2d2d',
                    }}
                  >
                    {q.text}
                  </div>
                  <div style={stylesObj.radioGroup}>
                    <label style={stylesObj.radioLabel}>
                      <input
                        type="radio"
                        name={q.key}
                        checked={
                          questoes[q.key as keyof typeof questoes] === true
                        }
                        onChange={() =>
                          handleQuestaoChange(q.key as keyof typeof questoes)
                        }
                      />{' '}
                      Sim
                    </label>
                    <label style={stylesObj.radioLabel}>
                      <input
                        type="radio"
                        name={q.key}
                        checked={
                          questoes[q.key as keyof typeof questoes] === false
                        }
                        onChange={() =>
                          handleQuestaoChange(q.key as keyof typeof questoes)
                        }
                      />{' '}
                      Não
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ORIENTAÇÕES E PARECER */}
          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-info-circle"
                style={{ marginRight: '8px', color: '#10b981' }}
              ></i>
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

          {/* ASSINATURAS E APTIDÃO */}
          <div style={stylesObj.card}>
            <h3 style={stylesObj.cardTitle}>
              <i
                className="fas fa-signature"
                style={{ marginRight: '8px', color: '#10b981' }}
              ></i>
              Assinaturas e Aptidão
            </h3>

            <div style={stylesObj.signatureGrid}>
              <div style={stylesObj.signatureBox}>
                <i
                  className="fas fa-signature"
                  style={{
                    fontSize: '24px',
                    marginBottom: '12px',
                    color: '#10b981',
                  }}
                ></i>
                <div style={stylesObj.label}>
                  Assinatura do profissional de saúde/ EMED/DMT
                </div>
                <canvas
                  ref={canvasRefAvaliador}
                  style={stylesObj.canvas}
                  onMouseDown={startDrawingAvaliador}
                  onMouseMove={drawAvaliador}
                  onMouseUp={endDrawingAvaliador}
                  onMouseLeave={endDrawingAvaliador}
                  onTouchStart={startDrawingAvaliador}
                  onTouchMove={drawAvaliador}
                  onTouchEnd={endDrawingAvaliador}
                />
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    marginTop: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onClick={clearSignatureAvaliador}
                >
                  <i className="fas fa-eraser"></i> Limpar Assinatura
                </button>
              </div>

              <div style={stylesObj.signatureBox}>
                <i
                  className="fas fa-user-check"
                  style={{
                    fontSize: '24px',
                    marginBottom: '12px',
                    color: '#10b981',
                  }}
                ></i>
                <div style={stylesObj.label}>Assinatura do Mergulhador</div>
                <canvas
                  ref={canvasRefMergulhador}
                  style={stylesObj.canvas}
                  onMouseDown={startDrawingMergulhador}
                  onMouseMove={drawMergulhador}
                  onMouseUp={endDrawingMergulhador}
                  onMouseLeave={endDrawingMergulhador}
                  onTouchStart={startDrawingMergulhador}
                  onTouchMove={drawMergulhador}
                  onTouchEnd={endDrawingMergulhador}
                />
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    marginTop: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                  onClick={clearSignatureMergulhador}
                >
                  <i className="fas fa-eraser"></i> Limpar Assinatura
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={stylesObj.label}>Aptidão do avaliador</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  style={stylesObj.aptidaoButton(aptidao === 'apto')}
                  onClick={() => setAptidao('apto')}
                >
                  ✅ APTO
                </button>
                <button
                  style={stylesObj.aptidaoButton(aptidao === 'inapto')}
                  onClick={() => setAptidao('inapto')}
                >
                  ❌ INAPTO
                </button>
              </div>
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
              style={stylesObj.button}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ marginRight: '8px' }}
                ></i>
              ) : (
                <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
              )}
              {loading ? 'Salvando...' : 'Salvar Avaliação Pré-MER'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
