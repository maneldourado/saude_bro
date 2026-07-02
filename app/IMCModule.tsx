// app/IMCModule.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';

interface IMCModuleProps {
  employees: any[];
  calculateBMI: (weight: number, height: number) => number;
  getBMIClassification: (bmi: number) => string;
  styles: any;
}

const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

export default function IMCModule({
  employees: initialEmployees,
  calculateBMI,
  getBMIClassification,
  styles,
}: IMCModuleProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState<any[]>(
    []
  );
  const [importing, setImporting] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [fileData, setFileData] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchColaborador, setSearchColaborador] = useState('');

  const [manualRecord, setManualRecord] = useState({
    colaboradorId: '',
    colaboradorNome: '',
    colaboradorCodigo: '',
    frenteServico: '',
    peso: '',
    altura: '',
    circunferencia: '',
    data: new Date().toISOString().split('T')[0],
  });

  const [columnMapping, setColumnMapping] = useState({
    codigo: 0,
    data: 1,
    peso: 3,
    altura: 4,
    circunferencia: 6,
    empresa: 8,
  });

  // ==================== CARREGAR DADOS ====================
  const loadFromSupabase = async () => {
    setLoading(true);
    setError(null);
    try {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data, error: supabaseError } = await supabase
          .from('imc_records')
          .select('*')
          .range(from, to);

        if (supabaseError) throw supabaseError;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      if (allData.length > 0) {
        // Agrupar por colaborador para calcular peso anterior
        const colaboradorMap = new Map();

        allData.forEach((record: any) => {
          const key = record.codigo;
          if (!colaboradorMap.has(key)) {
            colaboradorMap.set(key, []);
          }
          colaboradorMap.get(key).push(record);
        });

        // Para cada colaborador, ordenar por data e calcular variação
        const formattedData = allData.map((record: any) => {
          const records = colaboradorMap.get(record.codigo) || [];
          const sorted = records.sort(
            (a: any, b: any) =>
              new Date(a.data_raw).getTime() - new Date(b.data_raw).getTime()
          );

          const index = sorted.findIndex((r: any) => r.id === record.id);
          const pesoAnterior = index > 0 ? sorted[index - 1].peso : record.peso;
          const variacaoPeso = record.peso - pesoAnterior;

          const bmi = calculateBMI(record.peso, record.altura);
          const statusImc = getBMIClassification(bmi);

          return {
            id: record.id,
            codigo: record.codigo,
            dataRaw: record.data_raw,
            dataStr: record.data_str,
            ano: record.ano,
            mes: record.mes,
            mesNome: record.mes_nome,
            weight: record.peso,
            height: record.altura,
            circunferencia: record.circunferencia || 0,
            company: record.empresa || record.frente_servico || '-',
            pesoAnterior: pesoAnterior,
            variacaoPeso: variacaoPeso,
            statusImc: statusImc,
            bmi: bmi,
          };
        });

        setEmployees(formattedData);

        const anos = [
          ...new Set(
            formattedData.filter((e: any) => e.ano > 0).map((e: any) => e.ano)
          ),
        ];
        if (anos.length > 0) {
          setSelectedYear(Math.max(...anos));
        }
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Erro ao carregar do Supabase:', error);
      setError('Erro ao carregar dados do Supabase');
    } finally {
      setLoading(false);
    }
  };

  const loadColaboradores = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('colaboradores')
        .select('id, codigo, nome, altura, peso, funcao, frente_servico');

      if (supabaseError) throw supabaseError;

      if (data) {
        setColaboradores(data);
        setColaboradoresFiltrados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
    }
  };

  useEffect(() => {
    loadFromSupabase();
    loadColaboradores();
  }, []);

  // Filtrar colaboradores pela busca
  useEffect(() => {
    if (searchColaborador.trim() === '') {
      setColaboradoresFiltrados(colaboradores);
    } else {
      const filtered = colaboradores.filter(
        (col) =>
          col.nome?.toLowerCase().includes(searchColaborador.toLowerCase()) ||
          col.codigo?.toLowerCase().includes(searchColaborador.toLowerCase())
      );
      setColaboradoresFiltrados(filtered);
    }
  }, [searchColaborador, colaboradores]);

  // ==================== FUNÇÕES DE IMPORTAÇÃO ====================
  const toSafeString = (value: any): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return value.toLocaleDateString('pt-BR');
    if (value && typeof value === 'object' && value.v !== undefined)
      return String(value.v);
    return String(value);
  };

  const toNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(',', '.'));
      return isNaN(num) ? 0 : num;
    }
    if (value && typeof value === 'object' && value.v !== undefined) {
      const num = parseFloat(String(value.v).replace(',', '.'));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const parseData = (
    value: any
  ): { dataStr: string; ano: number; mes: number; mesNome: string } | null => {
    if (!value) return null;
    let data: Date | null = null;
    if (typeof value === 'number') {
      try {
        const dateCode = XLSX.SSF.parse_date_code(value);
        if (dateCode) data = new Date(dateCode.y, dateCode.m - 1, dateCode.d);
      } catch (e) {}
    }
    if (typeof value === 'string' && !data) {
      data = new Date(value);
      if (isNaN(data.getTime())) data = null;
    }
    if (value instanceof Date && !data) data = value;
    if (!data && value && typeof value === 'object' && value.v) {
      data = new Date(value.v);
      if (isNaN(data.getTime())) data = null;
    }
    if (!data || isNaN(data.getTime())) return null;
    const meses = [
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
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = data.getMonth() + 1;
    const mesNome = meses[data.getMonth()];
    const ano = data.getFullYear();
    return {
      dataStr: `${dia}/${String(mes).padStart(2, '0')}/${ano}`,
      ano,
      mes: data.getMonth(),
      mesNome,
    };
  };

  const extractEmployee = (
    row: any,
    idx: number,
    map: typeof columnMapping
  ) => {
    const codigo = toSafeString(row[map.codigo]);
    const dataRaw = row[map.data];
    const dataInfo = parseData(dataRaw);
    const peso = toNumber(row[map.peso]);
    const altura = toNumber(row[map.altura]);
    const circunferencia = toNumber(row[map.circunferencia]);
    const empresa = toSafeString(row[map.empresa]);

    console.log(
      `📊 Linha ${
        idx + 2
      }: Código=${codigo}, Data=${dataRaw}, Peso=${peso}, Altura=${altura}, Circ=${circunferencia}, Empresa=${empresa}`
    );

    if (peso === 0 || altura === 0) {
      console.warn(`⚠️ Linha ${idx + 2} ignorada: Peso ou Altura = 0`);
      return null;
    }
    if (!dataInfo) {
      console.warn(`⚠️ Linha ${idx + 2} ignorada: Data inválida`);
      return null;
    }

    return {
      id: `${Date.now()}_${idx}_${Math.random()}`,
      codigo: codigo || `EMP-${idx}`,
      dataRaw: dataRaw,
      dataStr: dataInfo.dataStr,
      ano: dataInfo.ano,
      mes: dataInfo.mes,
      mesNome: dataInfo.mesNome,
      weight: peso,
      height: altura,
      circunferencia: circunferencia || 0,
      company: empresa || '-',
    };
  };

  const saveToSupabase = async (novosRegistros: any[]) => {
    if (novosRegistros.length === 0) return;
    setSaving(true);
    try {
      const batchSize = 500;
      for (let i = 0; i < novosRegistros.length; i += batchSize) {
        const batch = novosRegistros.slice(i, i + batchSize);
        const recordsToSave = batch.map((record) => ({
          codigo: record.codigo,
          data_raw: record.dataRaw,
          data_str: record.dataStr,
          ano: record.ano,
          mes: record.mes,
          mes_nome: record.mesNome,
          peso: record.weight,
          altura: record.height,
          circunferencia: record.circunferencia || 0,
          empresa: record.company,
        }));

        const { error: insertError } = await supabase
          .from('imc_records')
          .insert(recordsToSave);
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      console.log('📊 Primeira linha (cabeçalho):', json[0]);
      console.log('📊 Segunda linha (primeiros dados):', json[1]);
      console.log('📊 Total de linhas:', json.length);

      if (!json || json.length < 2) throw new Error('Planilha vazia');
      setFileData({ headers: json[0], rows: json.slice(1) });
      setShowMapping(true);
    } catch (err) {
      console.error('❌ Erro:', err);
      setError('Erro ao ler planilha');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const processImport = async () => {
    if (!fileData) return;
    const { rows } = fileData;
    const novos: any[] = [];

    console.log(`📊 Processando ${rows.length} linhas...`);

    for (let i = 0; i < rows.length; i++) {
      const emp = extractEmployee(rows[i], i, columnMapping);
      if (emp) {
        novos.push(emp);
      }
    }

    console.log(`✅ ${novos.length} registros válidos encontrados`);

    if (novos.length === 0) {
      setError(
        'Nenhum registro válido encontrado. Verifique o mapeamento das colunas.'
      );
      return;
    }
    try {
      await saveToSupabase(novos);
      await loadFromSupabase();
      setSuccessMessage(`${novos.length} registros importados com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao importar:', error);
      setError(`Erro ao salvar: ${(error as Error).message}`);
    }
    setShowMapping(false);
    setFileData(null);
  };

  // ==================== FUNÇÕES DE MANUAL ====================
  const handleColaboradorSelect = (colaboradorId: string) => {
    const selected = colaboradores.find((c) => c.id === colaboradorId);
    if (selected) {
      setManualRecord({
        ...manualRecord,
        colaboradorId: selected.id,
        colaboradorNome: selected.nome,
        colaboradorCodigo: selected.codigo,
        altura: selected.altura?.toString() || '',
        peso: selected.peso?.toString() || '',
      });
      setSearchColaborador('');
    }
  };

  const saveManualRecord = async () => {
    if (
      !manualRecord.colaboradorId ||
      !manualRecord.peso ||
      !manualRecord.altura
    ) {
      setError('Preencha todos os campos obrigatórios!');
      return;
    }

    const peso = parseFloat(manualRecord.peso);
    const altura = parseFloat(manualRecord.altura);
    const circunferencia = parseFloat(manualRecord.circunferencia) || 0;

    if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
      setError('Peso e altura devem ser números válidos maiores que zero!');
      return;
    }

    const data = new Date(manualRecord.data);
    if (isNaN(data.getTime())) {
      setError('Data inválida!');
      return;
    }

    const meses = [
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
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = data.getMonth() + 1;
    const mesNome = meses[data.getMonth()];
    const ano = data.getFullYear();
    const dataStr = `${dia}/${String(mes).padStart(2, '0')}/${ano}`;

    const newRecord = {
      codigo: manualRecord.colaboradorCodigo,
      data_raw: data,
      data_str: dataStr,
      ano: ano,
      mes: data.getMonth(),
      mes_nome: mesNome,
      peso: peso,
      altura: altura,
      circunferencia: circunferencia,
      empresa: manualRecord.frenteServico || '-',
    };

    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase
        .from('imc_records')
        .insert([newRecord]);

      if (insertError) throw insertError;

      setSuccessMessage('Registro de IMC adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowManualModal(false);
      setManualRecord({
        colaboradorId: '',
        colaboradorNome: '',
        colaboradorCodigo: '',
        frenteServico: '',
        peso: '',
        altura: '',
        circunferencia: '',
        data: new Date().toISOString().split('T')[0],
      });
      setSearchColaborador('');
      await loadFromSupabase();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setError('Erro ao salvar o registro');
    } finally {
      setSaving(false);
    }
  };

  // ==================== FILTROS E DADOS ====================
  const meses = [
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

  const dadosMesSelecionado = useMemo(() => {
    if (selectedMonth === null) return [];
    return employees.filter(
      (e) => e.ano === selectedYear && e.mes === selectedMonth
    );
  }, [employees, selectedYear, selectedMonth]);

  const dadosMesRecente = useMemo(() => {
    if (employees.length === 0) return [];
    const latestRecord = employees.reduce((latest, current) => {
      if (current.ano > latest.ano) return current;
      if (current.ano === latest.ano && current.mes > latest.mes)
        return current;
      return latest;
    });
    return employees.filter(
      (e) => e.ano === latestRecord.ano && e.mes === latestRecord.mes
    );
  }, [employees]);

  const dadosExibir =
    selectedMonth !== null ? dadosMesSelecionado : dadosMesRecente;

  const getPeso = (e: any) => e?.weight || 0;
  const getAlturaM = (e: any) => {
    const a = e?.height || 0;
    return a > 3 ? a / 100 : a;
  };
  const getIMC = (e: any) => {
    const p = getPeso(e),
      a = getAlturaM(e);
    return p && a ? calculateBMI(p, a) : 0;
  };
  const temDados = (e: any) => getIMC(e) > 0;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dadosExibir.forEach((e) => {
      if (!temDados(e)) return;
      const status = e.statusImc || getBMIClassification(getIMC(e));
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [dadosExibir]);

  const variacaoPeso = useMemo(() => {
    let diminuiu = 0,
      manteve = 0,
      aumentou = 0;
    dadosExibir.forEach((e) => {
      if (!temDados(e) || e.variacaoPeso === undefined) return;
      if (e.variacaoPeso < -0.5) diminuiu++;
      else if (e.variacaoPeso > 0.5) aumentou++;
      else manteve++;
    });
    return { diminuiu, manteve, aumentou };
  }, [dadosExibir]);

  const totalPorMes = useMemo(() => {
    return meses.map((_, i) => {
      return employees.filter(
        (e) => e.ano === selectedYear && e.mes === i && temDados(e)
      ).length;
    });
  }, [employees, selectedYear]);

  const maxTotal = Math.max(...totalPorMes, 1);

  const handleMonthClick = (monthIndex: number) => {
    if (selectedMonth === monthIndex) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(monthIndex);
    }
  };

  // ==================== MODAIS ====================
  const MappingModal = () => {
    if (!showMapping || !fileData) return null;
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <h2
            style={{
              marginBottom: '8px',
              fontSize: '24px',
              color: textPrimary,
            }}
          >
            <i
              className="fas fa-table"
              style={{ color: accentColor, marginRight: '8px' }}
            ></i>
            Mapear Colunas
          </h2>
          <p
            style={{
              marginBottom: '24px',
              fontSize: '14px',
              color: textSecondary,
            }}
          >
            Selecione qual coluna corresponde a cada informação:
          </p>
          {[
            { key: 'codigo', label: 'Código', icon: 'fa-id-badge' },
            { key: 'data', label: 'Data', icon: 'fa-calendar-alt' },
            { key: 'peso', label: 'Peso (kg)', icon: 'fa-weight' },
            { key: 'altura', label: 'Altura (cm)', icon: 'fa-ruler-vertical' },
            {
              key: 'circunferencia',
              label: 'Circunferência (cm)',
              icon: 'fa-arrow-left-right',
            },
            {
              key: 'empresa',
              label: 'Empresa / Frente Serviço',
              icon: 'fa-building',
            },
          ].map(({ key, label, icon }) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  color: textPrimary,
                  fontSize: '13px',
                }}
              >
                <i
                  className={icon}
                  style={{ marginRight: '6px', color: accentColor }}
                ></i>
                {label}
              </label>
              <select
                value={columnMapping[key as keyof typeof columnMapping]}
                onChange={(e) =>
                  setColumnMapping({
                    ...columnMapping,
                    [key]: parseInt(e.target.value),
                  })
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '14px',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {fileData.headers.map((h: any, i: number) => (
                  <option key={i} value={i}>
                    {i}: {String(h || `Coluna ${String.fromCharCode(65 + i)}`)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={processImport}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: saving ? '#95a5a6' : '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Confirmar Importação
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowMapping(false);
                setFileData(null);
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ManualModal = () => {
    if (!showManualModal) return null;
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowManualModal(false);
            setSearchColaborador('');
          }
        }}
      >
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '550px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <h2
            style={{
              marginBottom: '8px',
              fontSize: '24px',
              color: textPrimary,
            }}
          >
            <i
              className="fas fa-plus-circle"
              style={{ color: accentColor, marginRight: '8px' }}
            ></i>
            Lançar IMC Manual
          </h2>
          <p
            style={{
              marginBottom: '24px',
              fontSize: '14px',
              color: textSecondary,
            }}
          >
            Selecione um colaborador e informe os dados:
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 600,
                color: textPrimary,
                fontSize: '13px',
              }}
            >
              <i
                className="fas fa-search"
                style={{ marginRight: '6px', color: accentColor }}
              ></i>
              Buscar Colaborador
            </label>
            <input
              type="text"
              placeholder="Digite nome ou código..."
              value={searchColaborador}
              onChange={(e) => setSearchColaborador(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '14px',
                marginBottom: '8px',
                outline: 'none',
              }}
            />
            <div
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: `1px solid ${cardBorder}`,
                borderRadius: '8px',
              }}
            >
              {colaboradoresFiltrados.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: textSecondary,
                  }}
                >
                  {searchColaborador
                    ? 'Nenhum colaborador encontrado'
                    : 'Digite para buscar'}
                </div>
              ) : (
                colaboradoresFiltrados.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => handleColaboradorSelect(col.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${cardBorder}`,
                      background:
                        manualRecord.colaboradorId === col.id
                          ? `rgba(16, 185, 129, 0.08)`
                          : 'white',
                    }}
                  >
                    <div style={{ fontWeight: 500, color: textPrimary }}>
                      {col.nome}
                    </div>
                    <div style={{ fontSize: '12px', color: textSecondary }}>
                      Código: {col.codigo}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {manualRecord.colaboradorNome && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: `rgba(16, 185, 129, 0.08)`,
                borderRadius: '8px',
                border: `1px solid ${accentColor}`,
              }}
            >
              <span style={{ fontSize: '13px', color: textSecondary }}>
                <i
                  className="fas fa-user-check"
                  style={{ color: accentColor, marginRight: '6px' }}
                ></i>
                Colaborador selecionado:{' '}
                <strong style={{ color: textPrimary }}>
                  {manualRecord.colaboradorNome}
                </strong>
              </span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 600,
                color: textPrimary,
                fontSize: '13px',
              }}
            >
              <i
                className="fas fa-calendar-alt"
                style={{ marginRight: '6px', color: accentColor }}
              ></i>
              Data da Medição
            </label>
            <input
              type="date"
              value={manualRecord.data}
              onChange={(e) =>
                setManualRecord({ ...manualRecord, data: e.target.value })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  color: textPrimary,
                  fontSize: '13px',
                }}
              >
                <i
                  className="fas fa-weight"
                  style={{ marginRight: '6px', color: accentColor }}
                ></i>
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={manualRecord.peso}
                onChange={(e) =>
                  setManualRecord({ ...manualRecord, peso: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  color: textPrimary,
                  fontSize: '13px',
                }}
              >
                <i
                  className="fas fa-ruler-vertical"
                  style={{ marginRight: '6px', color: accentColor }}
                ></i>
                Altura (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 175"
                value={manualRecord.altura}
                onChange={(e) =>
                  setManualRecord({ ...manualRecord, altura: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 600,
                color: textPrimary,
                fontSize: '13px',
              }}
            >
              <i
                className="fas fa-arrow-left-right"
                style={{ marginRight: '6px', color: accentColor }}
              ></i>
              Circunferência (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 95.5"
              value={manualRecord.circunferencia}
              onChange={(e) =>
                setManualRecord({
                  ...manualRecord,
                  circunferencia: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 600,
                color: textPrimary,
                fontSize: '13px',
              }}
            >
              <i
                className="fas fa-building"
                style={{ marginRight: '6px', color: accentColor }}
              ></i>
              Frente de Serviço / Empresa
            </label>
            <input
              type="text"
              placeholder="Ex: SM Continental, MER, etc."
              value={manualRecord.frenteServico}
              onChange={(e) =>
                setManualRecord({
                  ...manualRecord,
                  frenteServico: e.target.value,
                })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={saveManualRecord}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: saving ? '#95a5a6' : accentColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Salvar Registro
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowManualModal(false);
                setSearchColaborador('');
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ color: textSecondary, marginTop: '16px' }}>
          Carregando dados...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.imcContainer}>
      <MappingModal />
      <ManualModal />

      {error && (
        <div
          style={{
            background: '#fce4ec',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
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
            border: '1px solid #c3e6cb',
          }}
        >
          <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
          {successMessage}
        </div>
      )}

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: textPrimary,
              margin: 0,
            }}
          >
            <i
              className="fas fa-weight"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            CONTROLE DE IMC
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowManualModal(true)}
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fas fa-plus-circle"></i> Lançar IMC
          </button>
          <label
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {importing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Importando...
              </>
            ) : (
              <>
                <i className="fas fa-file-import"></i> Importar Planilha
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={importing}
            />
          </label>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value));
              setSelectedMonth(null);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: `1px solid ${cardBorder}`,
              fontSize: '13px',
              background: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            {[...new Set(employees.filter((e) => e.ano > 0).map((e) => e.ano))]
              .sort((a, b) => b - a)
              .map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* CARDS SUPERIORES */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            icon: 'fa-weight-scale',
            label: 'IMC',
            value:
              dadosExibir.length > 0
                ? `${getIMC(dadosExibir[0]).toFixed(2)}`
                : '-',
            color: '#10B981',
            bg: 'rgba(16,185,129,0.08)',
          },
          {
            icon: 'fa-calendar-alt',
            label: 'Data',
            value: dadosExibir.length > 0 ? dadosExibir[0].dataStr : '-',
            color: '#3B82F6',
            bg: 'rgba(59,130,246,0.08)',
          },
          {
            icon: 'fa-tag',
            label: 'Status',
            value:
              dadosExibir.length > 0
                ? dadosExibir[0].statusImc || 'NORMAL'
                : '-',
            color: '#F59E0B',
            bg: 'rgba(245,158,11,0.08)',
          },
          {
            icon: 'fa-arrow-left-right',
            label: 'Circunferência',
            value:
              dadosExibir.length > 0 && dadosExibir[0].circunferencia > 0
                ? `${dadosExibir[0].circunferencia} cm`
                : '-',
            color: '#8B5CF6',
            bg: 'rgba(139,92,246,0.08)',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: bgCard,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${cardBorder}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                background: item.bg,
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                minWidth: '48px',
                minHeight: '48px',
                color: item.color,
              }}
            >
              <i className={`fas ${item.icon}`}></i>
            </div>
            <div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: textPrimary,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: textSecondary,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DIMINUIÇÃO/MANTEVE/AUMENTOU */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: 'Diminuiu o peso',
            value: variacaoPeso.diminuiu,
            color: '#10B981',
            bg: 'rgba(16,185,129,0.08)',
          },
          {
            label: 'Manteve o peso',
            value: variacaoPeso.manteve,
            color: '#F59E0B',
            bg: 'rgba(245,158,11,0.08)',
          },
          {
            label: 'Aumentou o peso',
            value: variacaoPeso.aumentou,
            color: '#EF4444',
            bg: 'rgba(239,68,68,0.08)',
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: bgCard,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${cardBorder}`,
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '28px', fontWeight: 800, color: item.color }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* STATUS ATUAL DE IMC */}
      {Object.keys(statusCounts).length > 0 && (
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            marginBottom: '24px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: textPrimary,
              marginBottom: '16px',
            }}
          >
            <i
              className="fas fa-chart-pie"
              style={{ color: accentColor, marginRight: '8px' }}
            ></i>
            Status atual de IMC
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '180px',
                  height: '180px',
                }}
              >
                <svg
                  viewBox="0 0 36 36"
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: 'rotate(-90deg)',
                  }}
                >
                  {Object.entries(statusCounts).map(
                    ([status, count], idx, arr) => {
                      const total = dadosExibir.filter((e) =>
                        temDados(e)
                      ).length;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const colors: Record<string, string> = {
                        NORMAL: '#10B981',
                        SOBREPESO: '#F59E0B',
                        'OBESIDADE I': '#F97316',
                        'OBESIDADE II': '#EF4444',
                        'OBESIDADE III': '#7F1D1D',
                      };
                      const color = colors[status] || '#6B7280';

                      let offset = 0;
                      for (let i = 0; i < idx; i++) {
                        const prevTotal = dadosExibir.filter((e) =>
                          temDados(e)
                        ).length;
                        const prevCount = Object.values(statusCounts)[
                          i
                        ] as number;
                        offset += (prevCount / prevTotal) * 100;
                      }

                      const dasharray = `${percentage} ${100 - percentage}`;
                      const dashoffset = -offset;

                      return (
                        <circle
                          key={idx}
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray={dasharray}
                          strokeDashoffset={dashoffset}
                          strokeLinecap="round"
                        />
                      );
                    }
                  )}
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: textPrimary,
                    }}
                  >
                    {dadosExibir.filter((e) => temDados(e)).length}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: textSecondary,
                      fontWeight: 600,
                    }}
                  >
                    TOTAL
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {Object.entries(statusCounts).map(([status, count]) => {
                const total = dadosExibir.filter((e) => temDados(e)).length;
                const colors: Record<string, string> = {
                  NORMAL: '#10B981',
                  SOBREPESO: '#F59E0B',
                  'OBESIDADE I': '#F97316',
                  'OBESIDADE II': '#EF4444',
                  'OBESIDADE III': '#7F1D1D',
                };
                const color = colors[status] || '#6B7280';
                const percentage =
                  total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div
                    key={status}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: color,
                      }}
                    ></div>
                    <span
                      style={{
                        fontSize: '13px',
                        color: textSecondary,
                        flex: 1,
                      }}
                    >
                      {status}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GRÁFICO DE BARRAS */}
      <div
        style={{
          background: bgCard,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${cardBorder}`,
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: textPrimary,
            marginBottom: '16px',
          }}
        >
          <i
            className="fas fa-chart-bar"
            style={{ color: accentColor, marginRight: '8px' }}
          ></i>
          Total de funcionários atendidos {selectedYear}
        </h3>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            height: '150px',
            gap: '8px',
          }}
        >
          {meses.map((mes, i) => {
            const valor = totalPorMes[i];
            const altura =
              valor > 0 ? Math.min(130, (valor / maxTotal) * 130) : 8;
            const isSelected = selectedMonth === i;
            return (
              <div
                key={i}
                onClick={() => handleMonthClick(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  cursor: 'pointer',
                }}
              >
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
                      background: `linear-gradient(180deg, ${
                        valor > 0
                          ? isSelected
                            ? '#e74c3c'
                            : accentColor
                          : '#ecf0f1'
                      } 0%, ${
                        valor > 0
                          ? isSelected
                            ? '#c0392b'
                            : '#059669'
                          : '#bdc3c7'
                      } 100%)`,
                      borderRadius: '8px 8px 4px 4px',
                      transition: 'height 0.3s, background 0.2s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 700,
                      paddingTop: '4px',
                      boxShadow: isSelected ? '0 0 0 3px #e74c3c' : 'none',
                    }}
                  >
                    {valor > 0 && <span>{valor}</span>}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? '#e74c3c' : textSecondary,
                  }}
                >
                  {mes}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== TABELA COM FILTROS E COLUNA "DATA" ===== */}
      <div
        style={{
          background: bgCard,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${cardBorder}`,
          overflow: 'hidden',
        }}
      >
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
              color: textPrimary,
              margin: 0,
            }}
          >
            <i
              className="fas fa-table"
              style={{ color: accentColor, marginRight: '8px' }}
            ></i>
            Detalhamento
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              <i className="fas fa-sync-alt" style={{ marginRight: '4px' }}></i>
              {dadosExibir.length} registros
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#f8f9fa',
                  borderBottom: `2px solid ${cardBorder}`,
                }}
              >
                {[
                  { key: 'codigo', label: 'Código' },
                  { key: 'data', label: 'Data' },
                  { key: 'altura', label: 'Altura' },
                  { key: 'peso', label: 'Peso Atual' },
                  { key: 'imc', label: 'IMC' },
                  { key: 'status', label: 'Status' },
                  { key: 'circunferencia', label: 'Circunferência' },
                  { key: 'variacao', label: 'Perda/Ganho' },
                  { key: 'variacaoLabel', label: 'Aumentou/Diminuiu' },
                  { key: 'frente', label: 'Frente' },
                ].map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: textPrimary,
                      minWidth: '100px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span>{col.label}</span>
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase();
                          const rows =
                            document.querySelectorAll(`#table-body tr`);
                          rows.forEach((row) => {
                            const cell = row.querySelector(
                              `td[data-key="${col.key}"]`
                            );
                            if (cell) {
                              const text =
                                cell.textContent?.toLowerCase() || '';
                              (row as HTMLElement).style.display =
                                text.includes(value) ? '' : 'none';
                            }
                          });
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${cardBorder}`,
                          fontSize: '11px',
                          outline: 'none',
                          width: '100%',
                          minWidth: '80px',
                          background: '#fafafa',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = accentColor;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = cardBorder;
                        }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody id="table-body">
            {dadosExibir.map((emp, idx) => {
                const bmi = getIMC(emp);
                const status = emp.statusImc || getBMIClassification(bmi);
                let statusColor = '#6B7280';
                if (status === 'NORMAL') statusColor = '#10B981';
                else if (status === 'SOBREPESO') statusColor = '#F59E0B';
                else if (status === 'OBESIDADE I') statusColor = '#F97316';
                else if (status === 'OBESIDADE II') statusColor = '#EF4444';
                else if (status === 'OBESIDADE III') statusColor = '#7F1D1D';

                const variacao = emp.variacaoPeso || 0;
                const variacaoLabel =
                  variacao > 0.5
                    ? 'Aumentou'
                    : variacao < -0.5
                    ? 'Diminuiu'
                    : 'Manteve';
                const variacaoColor =
                  variacao > 0.5
                    ? '#EF4444'
                    : variacao < -0.5
                    ? '#10B981'
                    : '#F59E0B';

                return (
                  <tr
                    key={emp.id}
                    style={{ borderBottom: `1px solid ${cardBorder}` }}
                  >
                    <td
                      data-key="codigo"
                      style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: textPrimary,
                      }}
                    >
                      {emp.codigo}
                    </td>
                    <td
                      data-key="data"
                      style={{ padding: '10px 12px', color: textSecondary }}
                    >
                      {emp.dataStr || '-'}
                    </td>
                    <td
                      data-key="altura"
                      style={{ padding: '10px 12px', color: textSecondary }}
                    >
                      {emp.height ? `${emp.height} cm` : '-'}
                    </td>
                    <td
                      data-key="peso"
                      style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: textPrimary,
                      }}
                    >
                      {emp.weight.toFixed(1)}
                    </td>
                    <td
                      data-key="imc"
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: bmi >= 25 ? '#EF4444' : '#10B981',
                      }}
                    >
                      {bmi > 0 ? bmi.toFixed(2) : '-'}
                    </td>
                    <td data-key="status" style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: `${statusColor}20`,
                          color: statusColor,
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td
                      data-key="circunferencia"
                      style={{ padding: '10px 12px', color: textSecondary }}
                    >
                      {emp.circunferencia > 0
                        ? `${emp.circunferencia.toFixed(2)}`
                        : '-'}
                    </td>
                    <td
                      data-key="variacao"
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: variacaoColor,
                      }}
                    >
                      {variacao > 0 ? '+' : ''}
                      {variacao.toFixed(2)}
                    </td>
                    <td
                      data-key="variacaoLabel"
                      style={{
                        padding: '10px 12px',
                        fontWeight: 700,
                        color: variacaoColor,
                      }}
                    >
                      {variacaoLabel}
                    </td>
                    <td
                      data-key="frente"
                      style={{ padding: '10px 12px', color: textSecondary }}
                    >
                      {emp.company}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {dadosExibir.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: textSecondary,
              }}
            >
              <i
                className="fas fa-inbox"
                style={{
                  fontSize: '24px',
                  display: 'block',
                  marginBottom: '8px',
                }}
              ></i>
              Nenhum registro encontrado.
            </div>
          )}
          {dadosExibir.length > 100 && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: textSecondary,
                fontSize: '13px',
                background: '#f8f9fa',
                borderTop: `1px solid ${cardBorder}`,
              }}
            >
              <i
                className="fas fa-info-circle"
                style={{ marginRight: '6px' }}
              ></i>
              Exibindo 100 de {dadosExibir.length} registros
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
