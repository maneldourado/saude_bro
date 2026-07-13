// app/IMCModule.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';

// ===== TIPOS =====
export interface Employee {
  id: string;
  codigo: string;
  dataRaw: any;
  dataStr: string;
  ano: number;
  mes: number;
  mesNome: string;
  weight: number;
  height: number;
  circunferencia: number;
  company: string;
  pesoAnterior?: number;
  variacaoPeso?: number;
  statusImc?: string;
  bmi?: number;
}

export interface Colaborador {
  id: string;
  codigo: string;
  nome: string;
  altura?: number;
  peso?: number;
  funcao?: string;
  frente_servico?: string;
}

export interface InaptosData {
  porMes: Record<string, any>;
  porTrimestre: Record<string, any>;
  totalAvaliados: number;
  totalGeral: number;
  totalInaptosIMC35_Circ: number;
  totalInaptosCirc: number;
  totalInaptosCircTotal: number;
  todosInaptos: any[];
}

export interface StatusCounts {
  [key: string]: number;
}

export interface VariacaoPeso {
  diminuiu: number;
  manteve: number;
  aumentou: number;
}

export interface MediaPeriodo {
  mediaImc: number;
  mediaCirc: number;
  statusMaisFreq: string;
  periodoInicio: string;
  periodoFim: string;
  totalRegistros: number;
}

// ===== CONSTANTES =====
const MESES = [
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
const ALLOWED_STATUSES = [
  'Peso normal',
  'Sobrepeso',
  'Obesidade grau I',
  'Obesidade grau II',
];
const TRIMESTRES = [
  { nome: 'Q1', meses: ['Jan', 'Fev', 'Mar'] },
  { nome: 'Q2', meses: ['Abr', 'Mai', 'Jun'] },
  { nome: 'Q3', meses: ['Jul', 'Ago', 'Set'] },
  { nome: 'Q4', meses: ['Out', 'Nov', 'Dez'] },
];

// ===== UTILITÁRIOS =====
const excelSerialToDate = (serial: number): Date | null => {
  if (typeof serial !== 'number' || isNaN(serial) || serial <= 0) return null;
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  return isNaN(date.getTime()) ? null : date;
};

const converterData = (dataRaw: any): Date | null => {
  if (!dataRaw) return null;
  if (dataRaw instanceof Date && !isNaN(dataRaw.getTime())) return dataRaw;
  if (typeof dataRaw === 'number') {
    if (dataRaw > 1000000000000) {
      const d = new Date(dataRaw);
      if (!isNaN(d.getTime())) return d;
    }
    if (dataRaw > 1 && dataRaw < 100000) {
      const d = excelSerialToDate(dataRaw);
      if (d && !isNaN(d.getTime())) return d;
    }
  }
  if (typeof dataRaw === 'string') {
    const num = parseFloat(dataRaw);
    if (!isNaN(num) && num > 1 && num < 100000) {
      const d = excelSerialToDate(num);
      if (d && !isNaN(d.getTime())) return d;
    }
    let d = new Date(dataRaw);
    if (!isNaN(d.getTime())) return d;
    const parts = dataRaw.split('/');
    if (parts.length === 3) {
      const dia = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10) - 1;
      const ano = parseInt(parts[2], 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
        d = new Date(ano, mes, dia);
        if (!isNaN(d.getTime())) return d;
      }
    }
    const parts2 = dataRaw.split('-');
    if (parts2.length === 3) {
      const ano = parseInt(parts2[0], 10);
      const mes = parseInt(parts2[1], 10) - 1;
      const dia = parseInt(parts2[2], 10);
      if (!isNaN(ano) && !isNaN(mes) && !isNaN(dia)) {
        d = new Date(ano, mes, dia);
        if (!isNaN(d.getTime())) return d;
      }
    }
    return null;
  }
  if (dataRaw && typeof dataRaw === 'object' && dataRaw.v !== undefined)
    return converterData(dataRaw.v);
  return null;
};

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
  const data = converterData(value);
  if (!data || isNaN(data.getTime())) return null;
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = data.getMonth() + 1;
  const mesNome = MESES[data.getMonth()];
  const ano = data.getFullYear();
  return {
    dataStr: `${dia}/${String(mes).padStart(2, '0')}/${ano}`,
    ano,
    mes: data.getMonth(),
    mesNome,
  };
};

const getUniqueByCode = (list: Employee[]): Employee[] => {
  const map = new Map<string, Employee>();
  for (const e of list) {
    if (!map.has(e.codigo)) map.set(e.codigo, e);
  }
  return Array.from(map.values());
};

// ===== HOOK PRINCIPAL =====
export function useIMCModule(
  calculateBMI: (weight: number, height: number) => number,
  getBMIClassification: (bmi: number) => string
) {
  // ===== ESTADOS =====
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
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
  const [periodoFiltro, setPeriodoFiltro] = useState<'mensal' | 'trimestral'>(
    'mensal'
  );
  const [showInaptosTable, setShowInaptosTable] = useState(false);
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [periodoAtivo, setPeriodoAtivo] = useState<'todos' | 'personalizado'>(
    'todos'
  );
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

  const isInitialLoad = useRef(true);

  // ===== AUXILIARES =====
  const getPeso = (e: Employee) => e?.weight || 0;
  const getAlturaM = (e: Employee) => {
    const a = e?.height || 0;
    return a > 3 ? a / 100 : a;
  };
  const getIMC = (e: Employee) => {
    if (!e) return 0;
    const p = getPeso(e);
    const a = getAlturaM(e);
    if (!p || !a) return 0;
    return calculateBMI(p, a);
  };
  const temDados = (e: Employee) => {
    if (!e) return false;
    return e.weight > 0 && e.height > 0 && getIMC(e) > 0;
  };

  // ===== CARREGAR DADOS =====
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
        const colaboradorMap = new Map<string, any[]>();
        for (const record of allData) {
          if (!colaboradorMap.has(record.codigo))
            colaboradorMap.set(record.codigo, []);
          colaboradorMap.get(record.codigo)!.push(record);
        }
        for (const [, records] of colaboradorMap) {
          records.sort(
            (a: any, b: any) =>
              new Date(a.data_raw).getTime() - new Date(b.data_raw).getTime()
          );
        }

        const formatted: Employee[] = allData.map((record: any) => {
          const records = colaboradorMap.get(record.codigo) || [];
          const index = records.findIndex((r: any) => r.id === record.id);
          const pesoAnterior =
            index > 0 ? records[index - 1].peso : record.peso;
          const alturaM =
            record.altura > 3 ? record.altura / 100 : record.altura;
          const bmi = alturaM > 0 ? record.peso / (alturaM * alturaM) : 0;
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
            pesoAnterior,
            variacaoPeso: record.peso - pesoAnterior,
            statusImc: getBMIClassification(bmi),
            bmi,
          };
        });

        setEmployees(formatted);
        const anos = [
          ...new Set(formatted.filter((e) => e.ano > 0).map((e) => e.ano)),
        ];
        if (anos.length > 0 && isInitialLoad.current) {
          setSelectedYear(Math.max(...anos));
          isInitialLoad.current = false;
        }
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setError('Erro ao carregar dados');
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
      if (data) setColaboradores(data);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
    }
  };

  useEffect(() => {
    loadFromSupabase();
    loadColaboradores();
  }, []);

  // ===== COLABORADORES FILTRADOS (BUSCA) =====
  const colaboradoresFiltrados = useMemo(() => {
    if (!searchColaborador.trim()) return colaboradores;
    const term = searchColaborador.toLowerCase();
    return colaboradores.filter(
      (c) =>
        c.nome?.toLowerCase().includes(term) ||
        c.codigo?.toLowerCase().includes(term)
    );
  }, [searchColaborador, colaboradores]);

  // ===== FILTRO PRINCIPAL =====
  const filteredData = useMemo(() => {
    let result = [...employees];

    // Sempre filtra por ano (se selectedYear > 0)
    if (selectedYear > 0) {
      result = result.filter((e) => e.ano === selectedYear);
    }

    // Filtro de mês específico (quando clica em um mês no gráfico)
    if (selectedMonth !== null) {
      result = result.filter((e) => e.mes === selectedMonth);
    }

    // Filtro de período personalizado
    if (periodoAtivo === 'personalizado' && dataInicio && dataFim) {
      const inicio = new Date(dataInicio + 'T00:00:00');
      const fim = new Date(dataFim + 'T23:59:59');
      result = result.filter((e) => {
        let dr: Date | null = null;
        if (e.dataRaw) dr = converterData(e.dataRaw);
        if (!dr && e.ano && e.mes !== undefined) dr = new Date(e.ano, e.mes, 1);
        if (!dr || isNaN(dr.getTime())) return true;
        return dr >= inicio && dr <= fim;
      });
    }

    return result;
  }, [
    employees,
    selectedYear,
    selectedMonth,
    periodoAtivo,
    dataInicio,
    dataFim,
  ]);

  // ===== ÚNICOS POR COLABORADOR =====
  const uniqueByCollaborator = useMemo(() => {
    return getUniqueByCode(filteredData.filter((e) => temDados(e)));
  }, [filteredData, temDados]);

  // ===== STATUS COUNTS =====
  const statusCounts: StatusCounts = useMemo(() => {
    const counts: StatusCounts = {};
    for (const e of uniqueByCollaborator) {
      const status = e.statusImc || getBMIClassification(getIMC(e));
      if (status && ALLOWED_STATUSES.includes(status))
        counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [uniqueByCollaborator, getBMIClassification]);

  // ===== VARIAÇÃO PESO =====
  const variacaoPeso: VariacaoPeso = useMemo(() => {
    let d = 0,
      m = 0,
      a = 0;
    for (const e of uniqueByCollaborator) {
      if (!temDados(e) || e.variacaoPeso === undefined) continue;
      if (e.variacaoPeso < -0.5) d++;
      else if (e.variacaoPeso > 0.5) a++;
      else m++;
    }
    return { diminuiu: d, manteve: m, aumentou: a };
  }, [uniqueByCollaborator]);

  // ===== TOTAL POR MÊS (TODOS OS REGISTROS DO ANO) =====
  const totalPorMes = useMemo(() => {
    if (selectedYear === 0) return MESES.map(() => 0);
    return MESES.map((_, i) => {
      let count = 0;
      for (const e of employees) {
        if (e.ano === selectedYear && e.mes === i && temDados(e)) count++;
      }
      return count;
    });
  }, [employees, selectedYear, temDados]);

  const maxTotal = Math.max(...totalPorMes, 1);

  // ===== EVOLUÇÃO STATUS =====
  const evolucaoPorStatus = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const status of ALLOWED_STATUSES) {
      result[status] = MESES.map((_, i) => {
        let count = 0;
        for (const e of employees) {
          if (
            (selectedYear === 0 || e.ano === selectedYear) &&
            e.mes === i &&
            temDados(e)
          ) {
            if ((e.statusImc || getBMIClassification(getIMC(e))) === status)
              count++;
          }
        }
        return count;
      });
    }
    const maxCount = Math.max(...Object.values(result).flat(), 1);
    return { data: result, maxCount };
  }, [employees, selectedYear, getBMIClassification, temDados]);

  // ===== MÉDIA PERÍODO =====
  const mediaPeriodo: MediaPeriodo | null = useMemo(() => {
    if (periodoAtivo !== 'personalizado' || !dataInicio || !dataFim)
      return null;

    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T23:59:59');
    const regs: Employee[] = [];

    for (const e of employees) {
      if (!temDados(e)) continue;
      let dr: Date | null = null;
      if (e.dataRaw) dr = converterData(e.dataRaw);
      if (!dr && e.ano && e.mes !== undefined) dr = new Date(e.ano, e.mes, 1);
      if (dr && !isNaN(dr.getTime()) && dr >= inicio && dr <= fim) regs.push(e);
    }

    if (regs.length === 0) return null;

    let ti = 0,
      tc = 0;
    const sc: Record<string, number> = {};
    for (const e of regs) {
      ti += getIMC(e);
      tc += e.circunferencia || 0;
      const s = e.statusImc || getBMIClassification(getIMC(e));
      sc[s] = (sc[s] || 0) + 1;
    }

    const ff = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}/${d.getFullYear()}`;
    return {
      mediaImc: ti / regs.length,
      mediaCirc: tc / regs.length,
      statusMaisFreq:
        Object.entries(sc).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
      periodoInicio: ff(inicio),
      periodoFim: ff(fim),
      totalRegistros: regs.length,
    };
  }, [
    employees,
    dataInicio,
    dataFim,
    periodoAtivo,
    getBMIClassification,
    temDados,
    getIMC,
  ]);

  // ===== INAPTOS =====
  const inaptosData: InaptosData = useMemo(() => {
    const validos = filteredData.filter(
      (e) => e.weight > 0 && e.height > 0 && e.circunferencia > 0
    );

    const processarLista = (lista: Employee[]) => {
      const unicos = getUniqueByCode(lista);
      let i35 = 0,
        ic = 0;
      const det: any[] = [];

      for (const e of unicos) {
        const am = e.height > 3 ? e.height / 100 : e.height;
        const imc = am > 0 ? e.weight / (am * am) : 0;
        const circ = e.circunferencia || 0;
        const rca = am > 0 ? circ / am : 0;

        if (imc >= 35 && circ >= 102) {
          i35++;
          det.push({
            codigo: e.codigo,
            peso: e.weight,
            altura: e.height,
            circunferencia: circ,
            imc,
            relacaoCircAltura: rca,
            data: e.dataStr,
            empresa: e.company,
            motivo: 'IMC ≥ 35 + Circ ≥ 102',
          });
        } else if (circ >= 102) {
          ic++;
          det.push({
            codigo: e.codigo,
            peso: e.weight,
            altura: e.height,
            circunferencia: circ,
            imc,
            relacaoCircAltura: rca,
            data: e.dataStr,
            empresa: e.company,
            motivo: 'Circ ≥ 102',
          });
        }
      }

      const totalInaptos = i35 + ic;
      return {
        total: unicos.length,
        inaptosIMC35_Circ: i35,
        inaptosCirc: ic,
        inaptosCircTotal: totalInaptos,
        detalhes: det,
        percentual:
          unicos.length > 0
            ? ((totalInaptos / unicos.length) * 100).toFixed(1)
            : '0.0',
      };
    };

    // Por mês (colaboradores únicos em cada mês do ANO INTEIRO)
    const porMes: Record<string, any> = {};
    for (let idx = 0; idx < MESES.length; idx++) {
      const mes = MESES[idx];
      // Pega todos os registros do mês no ano selecionado (ignora filtro de período)
      const registrosMes = employees.filter(
        (e) =>
          e.ano === selectedYear &&
          e.mes === idx &&
          e.weight > 0 &&
          e.height > 0 &&
          e.circunferencia > 0
      );
      porMes[mes] = processarLista(registrosMes);
    }

    // Por trimestre (colaboradores únicos no trimestre inteiro do ANO INTEIRO)
    const porTrimestre: Record<string, any> = {};
    for (const trim of TRIMESTRES) {
      const registrosTrimestre = employees.filter(
        (e) =>
          e.ano === selectedYear &&
          trim.meses.includes(MESES[e.mes]) &&
          e.weight > 0 &&
          e.height > 0 &&
          e.circunferencia > 0
      );
      porTrimestre[trim.nome] = processarLista(registrosTrimestre);
    }

    // Totais gerais (baseado no filtro atual)
    const dadosGerais = processarLista(validos);

    return {
      porMes,
      porTrimestre,
      totalAvaliados: dadosGerais.total,
      totalGeral: dadosGerais.total,
      totalInaptosIMC35_Circ: dadosGerais.inaptosIMC35_Circ,
      totalInaptosCirc: dadosGerais.inaptosCirc,
      totalInaptosCircTotal: dadosGerais.inaptosCircTotal,
      todosInaptos: dadosGerais.detalhes,
    };
  }, [filteredData, employees, selectedYear]);

  // ===== HANDLERS =====
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
      if (!json || json.length < 2) throw new Error('Planilha vazia');
      setFileData({ headers: json[0], rows: json.slice(1) });
      setShowMapping(true);
    } catch (err) {
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
    for (let i = 0; i < rows.length; i++) {
      const codigo = toSafeString(rows[i][columnMapping.codigo]);
      const dataRaw = rows[i][columnMapping.data];
      const dataInfo = parseData(dataRaw);
      const peso = toNumber(rows[i][columnMapping.peso]);
      const altura = toNumber(rows[i][columnMapping.altura]);
      const circunferencia = toNumber(rows[i][columnMapping.circunferencia]);
      const empresa = toSafeString(rows[i][columnMapping.empresa]);
      if (peso === 0 || altura === 0 || !dataInfo) continue;
      novos.push({
        codigo: codigo || `EMP-${i}`,
        data_raw: dataRaw,
        data_str: dataInfo.dataStr,
        ano: dataInfo.ano,
        mes: dataInfo.mes,
        mes_nome: dataInfo.mesNome,
        peso,
        altura,
        circunferencia: circunferencia || 0,
        empresa: empresa || '-',
      });
    }
    if (novos.length === 0) {
      setError('Nenhum registro válido.');
      return;
    }
    try {
      setSaving(true);
      for (let i = 0; i < novos.length; i += 500) {
        const batch = novos.slice(i, i + 500);
        const { error: insertError } = await supabase
          .from('imc_records')
          .insert(batch);
        if (insertError) throw insertError;
      }
      await loadFromSupabase();
      setSuccessMessage(`${novos.length} registros importados!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Erro: ${(err as Error).message}`);
    } finally {
      setSaving(false);
      setShowMapping(false);
      setFileData(null);
    }
  };

  const handleColaboradorSelect = (id: string) => {
    const sel = colaboradores.find((c) => c.id === id);
    if (sel) {
      setManualRecord((prev) => ({
        ...prev,
        colaboradorId: sel.id,
        colaboradorNome: sel.nome,
        colaboradorCodigo: sel.codigo,
        altura: sel.altura?.toString() || '',
        peso: sel.peso?.toString() || '',
      }));
      setSearchColaborador('');
    }
  };

  const saveManualRecord = async () => {
    if (
      !manualRecord.colaboradorId ||
      !manualRecord.peso ||
      !manualRecord.altura
    ) {
      setError('Preencha todos os campos!');
      return;
    }
    const peso = parseFloat(manualRecord.peso);
    const altura = parseFloat(manualRecord.altura);
    const circ = parseFloat(manualRecord.circunferencia) || 0;
    if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
      setError('Valores inválidos!');
      return;
    }
    const data = new Date(manualRecord.data + 'T00:00:00');
    if (isNaN(data.getTime())) {
      setError('Data inválida!');
      return;
    }
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();
    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase.from('imc_records').insert([
        {
          codigo: manualRecord.colaboradorCodigo,
          data_raw: data.toISOString(),
          data_str: `${dia}/${String(mes).padStart(2, '0')}/${ano}`,
          ano,
          mes: data.getMonth(),
          mes_nome: MESES[data.getMonth()],
          peso,
          altura,
          circunferencia: circ,
          empresa: manualRecord.frenteServico || '-',
        },
      ]);
      if (insertError) throw insertError;
      setSuccessMessage('Registro adicionado!');
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
    } catch (err) {
      setError('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  // Ao clicar em Mensal ou Trimestral, limpa filtros
  const handleSetPeriodoFiltro = (tipo: 'mensal' | 'trimestral') => {
    setPeriodoFiltro(tipo);
    setSelectedMonth(null);
    setPeriodoAtivo('todos');
  };

  // Ao clicar em um mês no gráfico, limpa período personalizado
  const handleMonthClick = (i: number) => {
    setSelectedMonth(selectedMonth === i ? null : i);
    setPeriodoAtivo('todos');
  };

  // ===== RETORNO =====
  return {
    // Estados
    employees,
    colaboradores,
    colaboradoresFiltrados,
    loading,
    error,
    successMessage,
    importing,
    saving,
    selectedYear,
    selectedMonth,
    periodoFiltro,
    periodoAtivo,
    dataInicio,
    dataFim,
    showMapping,
    showManualModal,
    showInaptosTable,
    fileData,
    manualRecord,
    columnMapping,
    searchColaborador,

    // Dados calculados
    meses: MESES,
    statusCounts,
    variacaoPeso,
    totalPorMes,
    maxTotal,
    evolucaoPorStatus,
    filteredData,
    dadosComFiltroPeriodo: filteredData,
    uniqueByCollaborator,
    dadosUnicosPorColaborador: uniqueByCollaborator,
    mediaPeriodo,
    inaptosData,

    // Funções auxiliares
    getIMC,
    getBMIClassification,
    calculateBMI,
    temDados,

    // Setters
    setSelectedYear,
    setSelectedMonth,
    setPeriodoAtivo,
    setDataInicio,
    setDataFim,
    setShowMapping,
    setShowManualModal,
    setShowInaptosTable,
    setManualRecord,
    setColumnMapping,
    setSearchColaborador,
    setError,
    setSuccessMessage,
    setFileData,

    // Handlers
    handleFileUpload,
    processImport,
    handleColaboradorSelect,
    saveManualRecord,
    handleMonthClick,
    handleSetPeriodoFiltro, // ← NOVO
    loadFromSupabase,
  };
}
