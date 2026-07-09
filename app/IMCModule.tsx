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
  const [selectedYear, setSelectedYear] = useState<number>(0); // 0 = todos os anos
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

  // Estados para período personalizado
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const now = new Date();
    const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1);
    return primeiroDia.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
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

  // ==================== FUNÇÕES DE CONVERSÃO DE DATA ====================

  // Converte número serial do Excel (ex: 44932) para Date
  const excelSerialToDate = (serial: number): Date | null => {
    if (typeof serial !== 'number' || isNaN(serial) || serial <= 0) return null;
    // Excel considera 1º de janeiro de 1900 como número 1
    // Mas tem um bug: considera 1900 como ano bissexto
    // Para datas após 28/02/1900, subtraímos 1 dia
    const epoch = new Date(1899, 11, 30); // 30/12/1899
    const days = serial;
    const date = new Date(epoch.getTime() + days * 86400000);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  // Converte qualquer formato de data para Date
  const converterData = (dataRaw: any): Date | null => {
    if (!dataRaw) return null;

    // Se já for Date válido
    if (dataRaw instanceof Date && !isNaN(dataRaw.getTime())) {
      return dataRaw;
    }

    // Se for número (serial do Excel ou timestamp)
    if (typeof dataRaw === 'number') {
      // Timestamp (milissegundos desde 1970)
      if (dataRaw > 1000000000000) {
        const d = new Date(dataRaw);
        if (!isNaN(d.getTime())) return d;
      }
      // Serial do Excel
      if (dataRaw > 1 && dataRaw < 100000) {
        const d = excelSerialToDate(dataRaw);
        if (d && !isNaN(d.getTime())) return d;
      }
    }

    // Se for string (pode ser "44932" - serial como texto)
    if (typeof dataRaw === 'string') {
      // Tenta converter para número (serial do Excel como string)
      const num = parseFloat(dataRaw);
      if (!isNaN(num) && num > 1 && num < 100000) {
        const d = excelSerialToDate(num);
        if (d && !isNaN(d.getTime())) return d;
      }

      // Tenta ISO (yyyy-mm-dd)
      let d = new Date(dataRaw);
      if (!isNaN(d.getTime())) return d;

      // Tenta dd/mm/yyyy
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

      // Tenta yyyy-mm-dd
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

    // Se for objeto com .v (formato do XLSX)
    if (dataRaw && typeof dataRaw === 'object' && dataRaw.v !== undefined) {
      return converterData(dataRaw.v);
    }

    return null;
  };

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
        const colaboradorMap = new Map();

        allData.forEach((record: any) => {
          const key = record.codigo;
          if (!colaboradorMap.has(key)) {
            colaboradorMap.set(key, []);
          }
          colaboradorMap.get(key).push(record);
        });

        const formattedData = allData.map((record: any) => {
          const records = colaboradorMap.get(record.codigo) || [];
          const sorted = records.sort(
            (a: any, b: any) =>
              new Date(a.data_raw).getTime() - new Date(b.data_raw).getTime()
          );

          const index = sorted.findIndex((r: any) => r.id === record.id);
          const pesoAnterior = index > 0 ? sorted[index - 1].peso : record.peso;
          const variacaoPeso = record.peso - pesoAnterior;

          const alturaM =
            record.altura > 3 ? record.altura / 100 : record.altura;
          const bmi = record.peso / (alturaM * alturaM);
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

        // NÃO define selectedYear automaticamente; deixa como 0 (todos)
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

  // ==================== CÁLCULO DE INAPTOS ====================
  const calcularInaptos = useMemo(() => {
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

    // FILTRO BASE: peso, altura, circunferência > 0
    let registrosBase = employees.filter(
      (e) => e.weight > 0 && e.height > 0 && e.circunferencia > 0
    );

    // SÓ FILTRA POR ANO SE UM ANO ESPECÍFICO FOI SELECIONADO (selectedYear > 0)
    if (selectedYear > 0) {
      registrosBase = registrosBase.filter((e) => e.ano === selectedYear);
    }

    // Aplica filtro de período personalizado se estiver ativo
    if (periodoAtivo === 'personalizado' && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);

      registrosBase = registrosBase.filter((e) => {
        const dataRegistro = converterData(e.dataRaw);
        if (!dataRegistro) return false;
        return dataRegistro >= inicio && dataRegistro <= fim;
      });
    }

    // TOTAL DE AVALIADOS = todos os registros (pode repetir código)
    const totalAvaliados = registrosBase.length;

    // --- PARA INAPTOS: Agrupa por código e pega o PRIMEIRO registro de cada colaborador ---
    const colaboradorMap = new Map();
    registrosBase.forEach((e) => {
      if (!colaboradorMap.has(e.codigo)) {
        colaboradorMap.set(e.codigo, e);
      }
    });

    // Converte o Map para array de registros únicos (primeiro de cada colaborador)
    const registrosUnicos = Array.from(colaboradorMap.values());

    const porMes: Record<string, any> = {};
    const porTrimestre: Record<string, any> = {};

    // Para cada mês, conta os registros únicos (colaboradores únicos)
    meses.forEach((mes, idx) => {
      // Filtra os registros únicos por mês
      const registrosMes = registrosUnicos.filter((e) => e.mes === idx);

      let inaptosIMC_Circ = 0;
      let inaptosCirc = 0;
      let inaptosIMC = 0;
      let detalhes: any[] = [];
      let totalRegistros = registrosMes.length;

      registrosMes.forEach((e) => {
        const alturaM = e.height > 3 ? e.height / 100 : e.height;
        const imc = e.weight / (alturaM * alturaM);
        const circunferencia = e.circunferencia || 0;
        const relacaoCircAltura = alturaM > 0 ? circunferencia / alturaM : 0;

        const isInaptoIMC_Circ = imc >= 30 && circunferencia >= 102;
        const isInaptoCirc = circunferencia >= 102;
        const isInaptoIMC = imc >= 30;

        if (isInaptoIMC_Circ || isInaptoCirc || isInaptoIMC) {
          detalhes.push({
            codigo: e.codigo,
            peso: e.weight,
            altura: e.height,
            circunferencia: circunferencia,
            imc: imc,
            relacaoCircAltura: relacaoCircAltura,
            data: e.dataStr,
            empresa: e.company,
            motivo: isInaptoIMC_Circ
              ? 'IMC ≥ 30 + Circ ≥ 102'
              : isInaptoCirc
              ? 'Circ ≥ 102'
              : 'IMC ≥ 30',
          });
        }

        if (isInaptoIMC_Circ) inaptosIMC_Circ++;
        if (isInaptoCirc) inaptosCirc++;
        if (isInaptoIMC) inaptosIMC++;
      });

      porMes[mes] = {
        total: totalRegistros, // total de colaboradores únicos no mês
        inaptosIMC_Circ: inaptosIMC_Circ,
        inaptosCirc: inaptosCirc,
        inaptosIMC: inaptosIMC,
        detalhes: detalhes,
        percentual:
          totalRegistros > 0
            ? ((inaptosIMC_Circ / totalRegistros) * 100).toFixed(1)
            : 0,
      };
    });

    const trimestres = [
      { nome: 'Q1', meses: ['Jan', 'Fev', 'Mar'] },
      { nome: 'Q2', meses: ['Abr', 'Mai', 'Jun'] },
      { nome: 'Q3', meses: ['Jul', 'Ago', 'Set'] },
      { nome: 'Q4', meses: ['Out', 'Nov', 'Dez'] },
    ];

    trimestres.forEach((trim) => {
      let total = 0,
        inaptosIMC_Circ = 0,
        inaptosCirc = 0,
        inaptosIMC = 0;
      let detalhes: any[] = [];

      trim.meses.forEach((mes) => {
        const data = porMes[mes];
        if (data) {
          total += data.total;
          inaptosIMC_Circ += data.inaptosIMC_Circ;
          inaptosCirc += data.inaptosCirc;
          inaptosIMC += data.inaptosIMC;
          detalhes = [...detalhes, ...data.detalhes];
        }
      });

      porTrimestre[trim.nome] = {
        total: total, // total de colaboradores únicos no trimestre
        inaptosIMC_Circ: inaptosIMC_Circ,
        inaptosCirc: inaptosCirc,
        inaptosIMC: inaptosIMC,
        detalhes: detalhes,
        percentual:
          total > 0 ? ((inaptosIMC_Circ / total) * 100).toFixed(1) : 0,
      };
    });

    // --- TOTAIS GERAIS (APENAS COLABORADORES ÚNICOS PARA INAPTOS) ---
    const totalGeralUnicos = registrosUnicos.length;

    const totalInaptosIMC_Circ = registrosUnicos.filter((e) => {
      const alturaM = e.height > 3 ? e.height / 100 : e.height;
      const imc = e.weight / (alturaM * alturaM);
      return imc >= 30 && e.circunferencia >= 102;
    }).length;

    const totalInaptosCirc = registrosUnicos.filter(
      (e) => e.circunferencia >= 102
    ).length;

    const totalInaptosIMC = registrosUnicos.filter((e) => {
      const alturaM = e.height > 3 ? e.height / 100 : e.height;
      const imc = e.weight / (alturaM * alturaM);
      return imc >= 30;
    }).length;

    return {
      porMes,
      porTrimestre,
      // TOTAL AVALIADOS = todos os registros (com repetição)
      totalAvaliados: totalAvaliados,
      // INAPTOS = apenas colaboradores únicos
      totalGeral: totalGeralUnicos,
      totalInaptosIMC_Circ,
      totalInaptosCirc,
      totalInaptosIMC,
      todosInaptos: registrosUnicos
        .filter((e) => {
          const alturaM = e.height > 3 ? e.height / 100 : e.height;
          const imc = e.weight / (alturaM * alturaM);
          return (
            (imc >= 30 && e.circunferencia >= 102) ||
            e.circunferencia >= 102 ||
            imc >= 30
          );
        })
        .map((e) => {
          const alturaM = e.height > 3 ? e.height / 100 : e.height;
          const imc = e.weight / (alturaM * alturaM);
          const isInaptoIMC_Circ = imc >= 30 && e.circunferencia >= 102;
          const isInaptoCirc = e.circunferencia >= 102;
          const isInaptoIMC = imc >= 30;
          return {
            codigo: e.codigo,
            peso: e.weight,
            altura: e.height,
            circunferencia: e.circunferencia,
            imc: imc,
            relacaoCircAltura: alturaM > 0 ? e.circunferencia / alturaM : 0,
            data: e.dataStr,
            empresa: e.company,
            mes: e.mes,
            motivo: isInaptoIMC_Circ
              ? 'IMC ≥ 30 + Circ ≥ 102'
              : isInaptoCirc
              ? 'Circ ≥ 102'
              : 'IMC ≥ 30',
          };
        }),
    };
  }, [employees, selectedYear, dataInicio, dataFim, periodoAtivo]);

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

    // Tenta converter usando a função robusta
    data = converterData(value);

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

    if (peso === 0 || altura === 0) return null;
    if (!dataInfo) return null;

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
      const emp = extractEmployee(rows[i], i, columnMapping);
      if (emp) {
        novos.push(emp);
      }
    }

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

  // Aplica o filtro de período personalizado nos dados
  const dadosComFiltroPeriodo = useMemo(() => {
    let dados = employees;

    // SÓ FILTRA POR ANO SE UM ANO ESPECÍFICO FOI SELECIONADO (selectedYear > 0)
    if (selectedYear > 0) {
      dados = dados.filter((e) => e.ano === selectedYear);
    }

    // Filtra por mês se selecionado
    if (selectedMonth !== null) {
      dados = dados.filter((e) => e.mes === selectedMonth);
    }

    // Aplica filtro de período personalizado se estiver ativo
    if (periodoAtivo === 'personalizado' && dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      fim.setHours(23, 59, 59, 999);

      dados = dados.filter((e) => {
        // Tenta converter a data de várias formas
        let dataRegistro: Date | null = null;

        // 1. Usa dataRaw (pode ser número, string, etc.)
        if (e.dataRaw !== undefined && e.dataRaw !== null) {
          dataRegistro = converterData(e.dataRaw);
        }

        // 2. Se falhou, tenta usar dataStr (formato dd/mm/yyyy)
        if (!dataRegistro && e.dataStr) {
          const parts = e.dataStr.split('/');
          if (parts.length === 3) {
            const dia = parseInt(parts[0], 10);
            const mes = parseInt(parts[1], 10) - 1;
            const ano = parseInt(parts[2], 10);
            if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
              dataRegistro = new Date(ano, mes, dia);
            }
          }
        }

        // 3. Se ainda falhou, tenta construir a partir do ano e mês
        if (!dataRegistro && e.ano !== undefined && e.mes !== undefined) {
          dataRegistro = new Date(e.ano, e.mes, 1);
        }

        if (!dataRegistro || isNaN(dataRegistro.getTime())) {
          return false;
        }

        return dataRegistro >= inicio && dataRegistro <= fim;
      });
    }

    return dados;
  }, [
    employees,
    selectedYear,
    selectedMonth,
    dataInicio,
    dataFim,
    periodoAtivo,
  ]);

  // ==================== FUNÇÕES AUXILIARES ====================
  const getPeso = (e: any) => {
    if (!e) return 0;
    return e?.weight || 0;
  };

  const getAlturaM = (e: any) => {
    if (!e) return 0;
    const a = e?.height || 0;
    return a > 3 ? a / 100 : a;
  };

  const getIMC = (e: any) => {
    if (!e) return 0;
    const p = getPeso(e);
    const a = getAlturaM(e);
    if (!p || !a) return 0;
    return calculateBMI(p, a);
  };

  const temDados = (e: any) => {
    if (!e) return false;
    const imc = getIMC(e);
    return imc > 0 && !isNaN(imc);
  };

  // ==================== STATUS COUNTS ====================
  const allowedStatuses = [
    'Peso normal',
    'Sobrepeso',
    'Obesidade grau I',
    'Obesidade grau II',
  ];

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (!dadosComFiltroPeriodo || dadosComFiltroPeriodo.length === 0) {
      return counts;
    }

    dadosComFiltroPeriodo.forEach((e) => {
      try {
        if (!e) return;
        if (!temDados(e)) return;

        const imc = getIMC(e);
        if (!imc || isNaN(imc)) return;

        const status = e.statusImc || getBMIClassification(imc);
        if (!status) return;

        if (!allowedStatuses.includes(status)) return;

        counts[status] = (counts[status] || 0) + 1;
      } catch (error) {
        console.error('Erro ao processar registro:', e, error);
      }
    });

    return counts;
  }, [dadosComFiltroPeriodo]);

  // ==================== VARIACAO PESO ====================
  const variacaoPeso = useMemo(() => {
    let diminuiu = 0,
      manteve = 0,
      aumentou = 0;
    dadosComFiltroPeriodo.forEach((e) => {
      if (!temDados(e) || e.variacaoPeso === undefined) return;
      if (e.variacaoPeso < -0.5) diminuiu++;
      else if (e.variacaoPeso > 0.5) aumentou++;
      else manteve++;
    });
    return { diminuiu, manteve, aumentou };
  }, [dadosComFiltroPeriodo]);

  // ==================== TOTAL POR MES ====================
  const totalPorMes = useMemo(() => {
    return meses.map((_, i) => {
      return employees.filter(
        (e) =>
          (selectedYear === 0 || e.ano === selectedYear) &&
          e.mes === i &&
          temDados(e)
      ).length;
    });
  }, [employees, selectedYear]);

  const maxTotal = Math.max(...totalPorMes, 1);

  // ==================== EVOLUÇÃO ANUAL POR STATUS ====================
  const evolucaoPorStatus = useMemo(() => {
    const statusList = [
      'Peso normal',
      'Sobrepeso',
      'Obesidade grau I',
      'Obesidade grau II',
    ];
    const result: Record<string, number[]> = {};
    statusList.forEach((status) => {
      result[status] = meses.map((_, i) => {
        return employees.filter(
          (e) =>
            (selectedYear === 0 || e.ano === selectedYear) &&
            e.mes === i &&
            temDados(e) &&
            (e.statusImc || getBMIClassification(getIMC(e))) === status
        ).length;
      });
    });
    const statusColors: Record<string, string> = {
      'Peso normal': '#5B9BD5',
      Sobrepeso: '#F4B942',
      'Obesidade grau I': '#ED7D31',
      'Obesidade grau II': '#C0504D',
    };
    const maxCount = Math.max(...Object.values(result).flat(), 1);
    return { data: result, colors: statusColors, maxCount };
  }, [employees, selectedYear]);

  // ==================== MÉDIA DO PERÍODO SELECIONADO ====================
  const mediaPeriodo = useMemo(() => {
    if (!dataInicio || !dataFim) return null;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const registrosPeriodo = employees.filter((e) => {
      if (!e.dataRaw) return false;
      const dataRegistro = converterData(e.dataRaw);
      return (
        dataRegistro &&
        dataRegistro >= inicio &&
        dataRegistro <= fim &&
        temDados(e)
      );
    });

    if (registrosPeriodo.length === 0) return null;

    const totalImc = registrosPeriodo.reduce((acc, e) => acc + getIMC(e), 0);
    const mediaImc = totalImc / registrosPeriodo.length;

    const totalCirc = registrosPeriodo.reduce(
      (acc, e) => acc + (e.circunferencia || 0),
      0
    );
    const mediaCirc = totalCirc / registrosPeriodo.length;

    const statusCount: Record<string, number> = {};
    registrosPeriodo.forEach((e) => {
      const status = e.statusImc || getBMIClassification(getIMC(e));
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    const statusMaisFreq =
      Object.entries(statusCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    const formatDate = (date: Date) => {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };

    return {
      mediaImc,
      mediaCirc,
      statusMaisFreq,
      periodoInicio: formatDate(inicio),
      periodoFim: formatDate(fim),
      totalRegistros: registrosPeriodo.length,
    };
  }, [employees, dataInicio, dataFim]);

  // ==================== HANDLE MONTH CLICK ====================
  const handleMonthClick = (monthIndex: number) => {
    if (selectedMonth === monthIndex) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(monthIndex);
    }
  };

  // ==================== DADOS INAPTOS ====================
  const inaptosData = calcularInaptos;

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

  const inaptos = inaptosData;

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
          marginBottom: '24px',
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
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
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
            <option value={0}>Todos os Anos</option>
            {[...new Set(employees.filter((e) => e.ano > 0).map((e) => e.ano))]
              .sort((a, b) => b - a)
              .map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
          </select>

          {/* SELEÇÃO DE PERÍODO COM BOTÃO APLICAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: textSecondary,
              }}
            >
              De:
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '13px',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <label
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: textSecondary,
              }}
            >
              Até:
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '13px',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                setPeriodoAtivo(
                  periodoAtivo === 'todos' ? 'personalizado' : 'todos'
                );
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background:
                  periodoAtivo === 'personalizado' ? '#EF4444' : '#10B981',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {periodoAtivo === 'todos' ? 'Aplicar Filtro' : 'Remover Filtro'}
            </button>
          </div>
          {periodoAtivo === 'personalizado' && (
            <span
              style={{
                background: '#EF444420',
                color: '#EF4444',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <i className="fas fa-filter" style={{ marginRight: '4px' }}></i>
              Filtro: {new Date(dataInicio).toLocaleDateString('pt-BR')} -{' '}
              {new Date(dataFim).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* ===== CARDS DE INAPTOS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* TOTAL AVALIADOS - TODOS OS REGISTROS (COM REPETIÇÃO) */}
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{ fontSize: '12px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-users"
              style={{ marginRight: '6px', color: accentColor }}
            ></i>
            Total Avaliados
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: textPrimary,
              marginTop: '8px',
            }}
          >
            {inaptos.totalAvaliados}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {periodoAtivo === 'personalizado'
              ? 'Período filtrado'
              : selectedYear > 0
              ? `Ano ${selectedYear}`
              : 'Todos os anos'}
          </div>
        </div>

        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{ fontSize: '12px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-times-circle"
              style={{ marginRight: '6px', color: '#EF4444' }}
            ></i>
            IMC ≥ 30 + Circ ≥ 102
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#EF4444',
              marginTop: '8px',
            }}
          >
            {inaptos.totalInaptosIMC_Circ}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {inaptos.totalGeral > 0
              ? (
                  (inaptos.totalInaptosIMC_Circ / inaptos.totalGeral) *
                  100
                ).toFixed(1)
              : 0}
            % do total (únicos)
          </div>
        </div>

        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{ fontSize: '12px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-arrow-left-right"
              style={{ marginRight: '6px', color: '#F59E0B' }}
            ></i>
            Circ ≥ 102 (IMC &lt; 30)
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#F59E0B',
              marginTop: '8px',
            }}
          >
            {inaptos.totalInaptosCirc - inaptos.totalInaptosIMC_Circ}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {inaptos.totalGeral > 0
              ? (
                  ((inaptos.totalInaptosCirc - inaptos.totalInaptosIMC_Circ) /
                    inaptos.totalGeral) *
                  100
                ).toFixed(1)
              : 0}
            % do total (únicos)
          </div>
        </div>

        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{ fontSize: '12px', color: textSecondary, fontWeight: 600 }}
          >
            <i
              className="fas fa-exclamation-triangle"
              style={{ marginRight: '6px', color: '#F97316' }}
            ></i>
            Total Inaptos (Geral)
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#F97316',
              marginTop: '8px',
            }}
          >
            {inaptos.todosInaptos.length}
          </div>
          <div style={{ fontSize: '12px', color: textSecondary }}>
            {inaptos.totalGeral > 0
              ? (
                  (inaptos.todosInaptos.length / inaptos.totalGeral) *
                  100
                ).toFixed(1)
              : 0}
            % do total (únicos)
          </div>
        </div>
      </div>

      {/* ===== SEÇÃO DE INAPTOS POR PERÍODO ===== */}
      <div
        style={{
          background: bgCard,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${cardBorder}`,
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
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
              className="fas fa-user-times"
              style={{ color: '#EF4444', marginRight: '8px' }}
            ></i>
            Inaptos por {periodoFiltro === 'mensal' ? 'Mês' : 'Trimestre'}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPeriodoFiltro('mensal')}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: `1px solid ${
                  periodoFiltro === 'mensal' ? accentColor : cardBorder
                }`,
                background:
                  periodoFiltro === 'mensal' ? accentColor : 'transparent',
                color: periodoFiltro === 'mensal' ? 'white' : textSecondary,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodoFiltro('trimestral')}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: `1px solid ${
                  periodoFiltro === 'trimestral' ? accentColor : cardBorder
                }`,
                background:
                  periodoFiltro === 'trimestral' ? accentColor : 'transparent',
                color: periodoFiltro === 'trimestral' ? 'white' : textSecondary,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Trimestral
            </button>
            <button
              onClick={() => setShowInaptosTable(!showInaptosTable)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: `1px solid ${cardBorder}`,
                background: 'transparent',
                color: textSecondary,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {showInaptosTable ? 'Ocultar Detalhes' : 'Ver Detalhes'}
            </button>
          </div>
        </div>

        {/* Tabela de Inaptos por Período */}
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
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontWeight: 700,
                    color: textPrimary,
                  }}
                >
                  Período
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: textPrimary,
                  }}
                >
                  Total
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#EF4444',
                  }}
                >
                  IMC ≥ 30 + Circ ≥ 102
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#F59E0B',
                  }}
                >
                  Circ ≥ 102 (IMC &lt; 30)
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#F97316',
                  }}
                >
                  IMC ≥ 30
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#6B7280',
                  }}
                >
                  % Inaptos
                </th>
              </tr>
            </thead>
            <tbody>
              {periodoFiltro === 'mensal'
                ? meses.map((mes, idx) => {
                    const data = inaptos.porMes[mes];
                    if (!data || data.total === 0) return null;
                    return (
                      <tr
                        key={idx}
                        style={{ borderBottom: `1px solid ${cardBorder}` }}
                      >
                        <td
                          style={{
                            padding: '10px 12px',
                            fontWeight: 600,
                            color: textPrimary,
                          }}
                        >
                          {mes}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            color: textSecondary,
                          }}
                        >
                          {data.total}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#EF4444',
                          }}
                        >
                          {data.inaptosIMC_Circ}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#F59E0B',
                          }}
                        >
                          {data.inaptosCirc - data.inaptosIMC_Circ}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#F97316',
                          }}
                        >
                          {data.inaptosIMC}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#6B7280',
                          }}
                        >
                          {data.percentual}%
                        </td>
                      </tr>
                    );
                  })
                : ['Q1', 'Q2', 'Q3', 'Q4'].map((trim) => {
                    const data = inaptos.porTrimestre[trim];
                    if (!data || data.total === 0) return null;
                    return (
                      <tr
                        key={trim}
                        style={{ borderBottom: `1px solid ${cardBorder}` }}
                      >
                        <td
                          style={{
                            padding: '10px 12px',
                            fontWeight: 700,
                            color: textPrimary,
                          }}
                        >
                          {trim}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            color: textSecondary,
                          }}
                        >
                          {data.total}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#EF4444',
                          }}
                        >
                          {data.inaptosIMC_Circ}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#F59E0B',
                          }}
                        >
                          {data.inaptosCirc - data.inaptosIMC_Circ}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#F97316',
                          }}
                        >
                          {data.inaptosIMC}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#6B7280',
                          }}
                        >
                          {data.percentual}%
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {inaptos.todosInaptos.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '20px',
                color: textSecondary,
              }}
            >
              <i
                className="fas fa-check-circle"
                style={{ color: '#10B981', marginRight: '8px' }}
              ></i>
              Nenhum colaborador inapto encontrado neste período.
            </div>
          )}
        </div>

        {/* Tabela de Detalhes dos Inaptos */}
        {showInaptosTable && inaptos.todosInaptos.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: textPrimary,
                marginBottom: '12px',
              }}
            >
              <i
                className="fas fa-list"
                style={{ color: accentColor, marginRight: '8px' }}
              ></i>
              Detalhes dos Inaptos
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f8f9fa',
                      borderBottom: `2px solid ${cardBorder}`,
                    }}
                  >
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      Código
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      Data
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      IMC
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      Circ (cm)
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      Circ/Altura
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      Motivo
                    </th>
                    <th
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      Empresa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inaptos.todosInaptos.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: `1px solid ${cardBorder}` }}
                    >
                      <td
                        style={{
                          padding: '8px 10px',
                          fontWeight: 600,
                          color: textPrimary,
                        }}
                      >
                        {item.codigo}
                      </td>
                      <td style={{ padding: '8px 10px', color: textSecondary }}>
                        {item.data || '-'}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: item.imc >= 30 ? '#EF4444' : '#10B981',
                        }}
                      >
                        {item.imc.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color:
                            item.circunferencia >= 102 ? '#EF4444' : '#10B981',
                        }}
                      >
                        {item.circunferencia}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color:
                            item.relacaoCircAltura >= 0.5
                              ? '#EF4444'
                              : '#10B981',
                        }}
                      >
                        {item.relacaoCircAltura.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 600,
                            background:
                              item.motivo === 'IMC ≥ 30 + Circ ≥ 102'
                                ? '#EF444420'
                                : item.motivo === 'Circ ≥ 102'
                                ? '#F59E0B20'
                                : '#F9731620',
                            color:
                              item.motivo === 'IMC ≥ 30 + Circ ≥ 102'
                                ? '#EF4444'
                                : item.motivo === 'Circ ≥ 102'
                                ? '#F59E0B'
                                : '#F97316',
                          }}
                        >
                          {item.motivo}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: textSecondary }}>
                        {item.empresa || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== CARDS SUPERIORES (MÉDIA DO PERÍODO) ===== */}
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
              mediaPeriodo && mediaPeriodo.mediaImc !== null
                ? mediaPeriodo.mediaImc.toFixed(2)
                : '-',
            color: '#10B981',
            bg: 'rgba(16,185,129,0.08)',
          },
          {
            icon: 'fa-calendar-alt',
            label: 'Período',
            value: mediaPeriodo
              ? `${mediaPeriodo.periodoInicio} à ${mediaPeriodo.periodoFim}`
              : '-',
            color: '#3B82F6',
            bg: 'rgba(59,130,246,0.08)',
          },
          {
            icon: 'fa-tag',
            label: 'Status',
            value: mediaPeriodo ? mediaPeriodo.statusMaisFreq : '-',
            color: '#F59E0B',
            bg: 'rgba(245,158,11,0.08)',
          },
          {
            icon: 'fa-arrow-left-right',
            label: 'Circunferência',
            value:
              mediaPeriodo && mediaPeriodo.mediaCirc !== null
                ? `${mediaPeriodo.mediaCirc.toFixed(1)} cm`
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

      {/* ===== DIMINUIÇÃO/MANTEVE/AUMENTOU ===== */}
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

      {/* ===== GRÁFICO DE PIZZA - STATUS DE IMC ===== */}
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
            Status de IMC
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              alignItems: 'center',
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
                  width: '200px',
                  height: '200px',
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
                      const total = dadosComFiltroPeriodo.filter((e) =>
                        temDados(e)
                      ).length;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const colors: Record<string, string> = {
                        'Peso normal': '#10B981',
                        Sobrepeso: '#F59E0B',
                        'Obesidade grau I': '#F97316',
                        'Obesidade grau II': '#EF4444',
                      };
                      const color = colors[status] || '#6B7280';

                      let offset = 0;
                      for (let i = 0; i < idx; i++) {
                        const prevTotal = dadosComFiltroPeriodo.filter((e) =>
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
                          strokeWidth="3"
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
                    {dadosComFiltroPeriodo.filter((e) => temDados(e)).length}
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
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {Object.entries(statusCounts).map(([status, count]) => {
                const total = dadosComFiltroPeriodo.filter((e) =>
                  temDados(e)
                ).length;
                const colors: Record<string, string> = {
                  'Peso normal': '#10B981',
                  Sobrepeso: '#F59E0B',
                  'Obesidade grau I': '#F97316',
                  'Obesidade grau II': '#EF4444',
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
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: color,
                        flexShrink: 0,
                      }}
                    ></div>
                    <span
                      style={{
                        fontSize: '14px',
                        color: textSecondary,
                        flex: 1,
                      }}
                    >
                      {status}
                    </span>
                    <span
                      style={{
                        fontSize: '16px',
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

      {/* ===== GRÁFICO DE BARRAS ===== */}
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
          Total de funcionários atendidos{' '}
          {selectedYear > 0 ? selectedYear : 'todos os anos'}
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

      {/* ===== GRÁFICO DE LINHAS - EVOLUÇÃO ANUAL DE IMC ===== */}
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
            marginBottom: '8px',
          }}
        >
          <i
            className="fas fa-chart-line"
            style={{ color: accentColor, marginRight: '8px' }}
          ></i>
          Evolução Anual de IMC
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: textSecondary,
            marginBottom: '20px',
          }}
        >
          Quantidade de registros por status ao longo dos meses
        </p>

        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 700 250" style={{ width: '100%', height: 'auto' }}>
            {/* Eixo Y */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = 20 + (1 - pct) * 200;
              const label = Math.round(evolucaoPorStatus.maxCount * pct);
              return (
                <g key={i}>
                  <line
                    x1="50"
                    y1={y}
                    x2="680"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray={pct === 0 ? '0' : '4 4'}
                  />
                  <text
                    x="45"
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Eixo X */}
            {meses.map((mes, i) => {
              const x = 50 + (i / 11) * 630;
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={20}
                    x2={x}
                    y2={220}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={240}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                  >
                    {mes}
                  </text>
                </g>
              );
            })}

            {/* Linhas */}
            {Object.entries(evolucaoPorStatus.data).map(([status, values]) => {
              const color = evolucaoPorStatus.colors[status] || '#6B7280';
              const points = values
                .map((v, i) => {
                  const x = 50 + (i / 11) * 630;
                  const y =
                    evolucaoPorStatus.maxCount > 0
                      ? 220 - (v / evolucaoPorStatus.maxCount) * 200
                      : 220;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <g key={status}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {values.map((v, i) => {
                    const x = 50 + (i / 11) * 630;
                    const y =
                      evolucaoPorStatus.maxCount > 0
                        ? 220 - (v / evolucaoPorStatus.maxCount) * 200
                        : 220;
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="white"
                          stroke={color}
                          strokeWidth="2.5"
                        />
                        {v > 0 && (
                          <text
                            x={x}
                            y={y - 10}
                            textAnchor="middle"
                            fontSize="10"
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
            })}
          </svg>
        </div>

        {/* LEGENDA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(evolucaoPorStatus.colors).map(([status, color]) => (
            <div
              key={status}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div
                style={{
                  width: '32px',
                  height: '3px',
                  background: color,
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: color,
                  border: '2px solid white',
                  boxShadow: `0 0 0 1px ${color}`,
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  color: textSecondary,
                  fontWeight: 600,
                }}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== TABELA DE DETALHAMENTO ===== */}
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
              {dadosComFiltroPeriodo.length} registros
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
              {dadosComFiltroPeriodo.map((emp, idx) => {
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
          {dadosComFiltroPeriodo.length === 0 && (
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
        </div>
      </div>
    </div>
  );
}
