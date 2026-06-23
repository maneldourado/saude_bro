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

// Cores consistentes com os outros módulos
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
    data: new Date().toISOString().split('T')[0],
  });
  const [columnMapping, setColumnMapping] = useState({
    codigo: 0,
    data: 1,
    peso: 3,
    altura: 4,
    empresa: 8,
  });

  // Carregar dados do Supabase com PAGINAÇÃO
  const loadFromSupabase = async () => {
    setLoading(true);
    setError(null);
    try {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: supabaseError } = await supabase
          .from('imc_records')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1);

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
        const formattedData = allData.map((record: any) => ({
          id: record.id,
          codigo: record.codigo,
          dataRaw: record.data_raw,
          dataStr: record.data_str,
          ano: record.ano,
          mes: record.mes,
          mesNome: record.mes_nome,
          weight: record.peso,
          height: record.altura,
          company: record.empresa || record.frente_servico || '-',
        }));

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

  // Carregar colaboradores da tabela colaboradores
  const loadColaboradores = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('colaboradores')
        .select('id, codigo, nome, altura, peso');

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

  // Salvar registro manual de IMC
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
      company: empresa || '-',
    };
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
    const anosCount: Record<number, number> = {};
    for (let i = 0; i < rows.length; i++) {
      const emp = extractEmployee(rows[i], i, columnMapping);
      if (emp) {
        novos.push(emp);
        anosCount[emp.ano] = (anosCount[emp.ano] || 0) + 1;
      }
    }
    if (novos.length === 0) {
      setError(
        'Nenhum registro válido encontrado. Verifique o mapeamento das colunas.'
      );
      return;
    }
    try {
      const { error: deleteError } = await supabase
        .from('imc_records')
        .delete()
        .neq('id', 0);
      if (deleteError) throw deleteError;
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

  const employeesByYearAndMonth = useMemo(() => {
    let filtered = employees.filter(
      (e) => e.ano === selectedYear && temDados(e)
    );
    if (selectedMonth !== null) {
      filtered = filtered.filter((e) => e.mes === selectedMonth);
    }
    return filtered;
  }, [employees, selectedYear, selectedMonth]);

  const anosDisponiveis = useMemo(() => {
    const anos = [
      ...new Set(employees.filter((e) => e.ano > 0).map((e) => e.ano)),
    ];
    return anos.sort((a, b) => b - a);
  }, [employees]);

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

  const fichasMesAno = meses.map(
    (_, i) =>
      employees.filter(
        (e) => e.ano === selectedYear && e.mes === i && temDados(e)
      ).length
  );
  const maxFichas = Math.max(...fichasMesAno, 1);

  const mesMaisRecente = useMemo(() => {
    const employeesComData = employees.filter(
      (e) => e.ano > 0 && e.mes >= 0 && temDados(e)
    );
    if (employeesComData.length === 0) return null;
    const maisRecente = employeesComData.reduce((latest, current) => {
      if (current.ano > latest.ano) return current;
      if (current.ano === latest.ano && current.mes > latest.mes)
        return current;
      return latest;
    });
    return { mesNome: meses[maisRecente.mes], ano: maisRecente.ano };
  }, [employees]);

  const aptosMesRecente = useMemo(() => {
    if (!mesMaisRecente) return 0;
    const mesIndex = meses.findIndex((m) => m === mesMaisRecente.mesNome);
    return employees.filter((e) => {
      if (!temDados(e)) return false;
      if (e.ano !== mesMaisRecente.ano) return false;
      if (e.mes !== mesIndex) return false;
      const imc = getIMC(e);
      return imc >= 18.5 && imc < 34.9;
    }).length;
  }, [employees, mesMaisRecente]);

  const total = employees.filter((e) => temDados(e)).length;
  const acima = employees.filter(
    (e) => getIMC(e) >= 25 && getIMC(e) > 0
  ).length;
  const normal = employees.filter(
    (e) => getIMC(e) >= 18.5 && getIMC(e) < 25
  ).length;
  const abaixo = employees.filter(
    (e) => getIMC(e) < 18.5 && getIMC(e) > 0
  ).length;
  const totalFichas = total;

  const handleMonthClick = (monthIndex: number) => {
    if (selectedMonth === monthIndex) {
      setSelectedMonth(null);
    } else {
      setSelectedMonth(monthIndex);
    }
  };

  // ==================== ESTILOS ====================
  const buttonPrimaryStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    boxShadow: `0 4px 15px ${accentGlow}`,
    transition: 'all 0.3s ease',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
    transition: 'all 0.3s ease',
  };

  const cardStyle: React.CSSProperties = {
    background: bgCard,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${cardBorder}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
  };

  const StatCard = ({ icon, value, label, color, bgColor }: any) => (
    <div
      style={{
        background: bgCard,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          background: bgColor,
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          minWidth: '56px',
          minHeight: '56px',
          color: color,
        }}
      >
        <i className={icon}></i>
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 700, color: textPrimary }}>
          {value}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: textSecondary,
            marginTop: '4px',
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );

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
                  transition: 'border-color 0.3s ease',
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
                transition: 'all 0.3s ease',
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
                transition: 'all 0.3s ease',
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

          {/* Busca de colaborador */}
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
              autoComplete="off"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`,
                fontSize: '14px',
                marginBottom: '8px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accentColor;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
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
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (manualRecord.colaboradorId !== col.id) {
                        e.currentTarget.style.background = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (manualRecord.colaboradorId !== col.id) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: 500, color: textPrimary }}>
                      {col.nome}
                    </div>
                    <div style={{ fontSize: '12px', color: textSecondary }}>
                      <i
                        className="fas fa-id-badge"
                        style={{ marginRight: '4px' }}
                      ></i>
                      Código: {col.codigo}
                    </div>
                    {col.altura && (
                      <div style={{ fontSize: '11px', color: textSecondary }}>
                        <i
                          className="fas fa-ruler-vertical"
                          style={{ marginRight: '4px' }}
                        ></i>
                        Altura cadastrada: {col.altura} cm
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Informações do colaborador selecionado */}
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
                {' (Cód: '}
                <strong style={{ color: textPrimary }}>
                  {manualRecord.colaboradorCodigo}
                </strong>
                )
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
                transition: 'border-color 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accentColor;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
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
                  transition: 'border-color 0.3s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cardBorder;
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
                  transition: 'border-color 0.3s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = accentColor;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = cardBorder;
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
                transition: 'border-color 0.3s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = accentColor;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = cardBorder;
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
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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
                setManualRecord({
                  colaboradorId: '',
                  colaboradorNome: '',
                  colaboradorCodigo: '',
                  frenteServico: '',
                  peso: '',
                  altura: '',
                  data: new Date().toISOString().split('T')[0],
                });
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
                transition: 'all 0.3s ease',
              }}
            >
              <i className="fas fa-times"></i> Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Mensagens de feedback */}
      {error && (
        <div
          style={{
            background: '#fce4ec',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '14px',
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
            fontSize: '14px',
            border: '1px solid #c3e6cb',
          }}
        >
          <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
          {successMessage}
        </div>
      )}

      {/* HEADER COM AÇÕES */}
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
            Módulo IMC
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: textSecondary,
              margin: '4px 0 0 0',
            }}
          >
            <i className="fas fa-heartbeat" style={{ marginRight: '6px' }}></i>
            Gestão de saúde ocupacional e controle de peso
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowManualModal(true)}
            style={buttonPrimaryStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
            }}
          >
            <i className="fas fa-plus-circle"></i>
            Lançar IMC Manual
          </button>
          <label
            style={buttonSecondaryStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow =
                '0 6px 20px rgba(102,126,234,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '0 4px 15px rgba(102,126,234,0.3)';
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
        </div>
      </div>

      {/* ESTADO VAZIO */}
      {employees.length === 0 && !showMapping && (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`,
            borderRadius: '24px',
            marginBottom: '20px',
          }}
        >
          <i
            className="fas fa-chart-line"
            style={{
              fontSize: '64px',
              display: 'block',
              marginBottom: '16px',
              color: accentColor,
            }}
          ></i>
          <h2
            style={{
              color: textPrimary,
              marginBottom: '8px',
              fontSize: '20px',
            }}
          >
            Nenhum dado carregado
          </h2>
          <p style={{ color: textSecondary, marginBottom: '16px' }}>
            Clique no botão "Importar Planilha" ou "Lançar IMC Manual" para
            começar
          </p>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      {employees.length > 0 && (
        <>
          {/* CARDS DE ESTATÍSTICAS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}
          >
            <StatCard
              icon="fas fa-users"
              value={total}
              label="TOTAL DE COLABORADORES"
              color="#2c7da0"
              bgColor="#e6f3f9"
            />
            <StatCard
              icon="fas fa-exclamation-triangle"
              value={acima}
              label="ACIMA DO PESO"
              color="#d97706"
              bgColor="#fff3e0"
            />
            <StatCard
              icon="fas fa-check-circle"
              value={normal}
              label="PESO NORMAL"
              color="#059669"
              bgColor="#e8f5e9"
            />
            <StatCard
              icon="fas fa-info-circle"
              value={abaixo}
              label="ABAIXO DO PESO"
              color="#2563eb"
              bgColor="#e3f2fd"
            />
          </div>

          {/* FILTROS E INDICADORES */}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: '#f8f9fa',
                padding: '10px 20px',
                borderRadius: '50px',
                border: `1px solid ${cardBorder}`,
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: textSecondary,
                  fontWeight: 600,
                }}
              >
                <i
                  className="fas fa-calendar-alt"
                  style={{ marginRight: '6px', color: accentColor }}
                ></i>
                Ano:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setSelectedMonth(null);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '30px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'border-color 0.3s ease',
                  outline: 'none',
                }}
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>

            {mesMaisRecente && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
                  borderRadius: '50px',
                  padding: '10px 24px',
                  color: 'white',
                  boxShadow: `0 4px 15px ${accentGlow}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <i
                  className="fas fa-check-circle"
                  style={{ fontSize: '14px' }}
                ></i>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                  Aptos em {mesMaisRecente.mesNome}/{mesMaisRecente.ano}:
                </span>
                <span style={{ fontSize: '24px', fontWeight: 700 }}>
                  {aptosMesRecente}
                </span>
              </div>
            )}

            {selectedMonth !== null && (
              <button
                onClick={() => setSelectedMonth(null)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5a6268';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#6c757d';
                }}
              >
                <i className="fas fa-undo"></i> Limpar Filtro (
                {meses[selectedMonth]})
              </button>
            )}
          </div>

          {/* GRÁFICO DE FICHAS POR MÊS */}
          <div style={cardStyle}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '24px',
                color: textPrimary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                <i
                  className="fas fa-chart-bar"
                  style={{ color: accentColor, marginRight: '8px' }}
                ></i>
                Fichas por Mês - {selectedYear}
              </span>
              <div
                style={{
                  background: '#ecf0f1',
                  borderRadius: '40px',
                  padding: '6px 16px',
                }}
              >
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: textPrimary,
                  }}
                >
                  {totalFichas}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: textSecondary,
                    marginLeft: '8px',
                  }}
                >
                  <i className="fas fa-file-alt"></i> FICHAS
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'flex-end',
                height: '220px',
                gap: '8px',
              }}
            >
              {meses.map((mes, i) => {
                const valor = fichasMesAno[i];
                const altura =
                  valor > 0 ? Math.min(160, (valor / maxFichas) * 140) : 8;
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
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
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
                                : '#3498db'
                              : '#ecf0f1'
                          } 0%, ${
                            valor > 0
                              ? isSelected
                                ? '#c0392b'
                                : '#2980b9'
                              : '#bdc3c7'
                          } 100%)`,
                          borderRadius: '8px 8px 4px 4px',
                          transition: 'height 0.3s, background 0.2s',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 700,
                          paddingTop: '6px',
                          boxShadow: isSelected ? '0 0 0 3px #e74c3c' : 'none',
                        }}
                      >
                        {valor > 0 && <span>{valor}</span>}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: '12px',
                        fontSize: '12px',
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

          {/* TABELA DE DADOS */}
          <div
            style={{
              ...cardStyle,
              overflow: 'hidden',
              marginTop: '24px',
            }}
          >
            <div
              style={{
                padding: '24px',
                borderBottom: `2px solid ${cardBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: textPrimary,
                  margin: 0,
                }}
              >
                <i
                  className="fas fa-table"
                  style={{ color: accentColor, marginRight: '8px' }}
                ></i>
                Variação IMC - {selectedYear}
                {selectedMonth !== null && ` • ${meses[selectedMonth]}`}
              </h3>
              <div
                style={{
                  fontSize: '13px',
                  color: textSecondary,
                  fontWeight: 600,
                }}
              >
                <i
                  className="fas fa-sync-alt"
                  style={{ marginRight: '4px' }}
                ></i>
                {employeesByYearAndMonth.length} registros
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: '#f8f9fa',
                      borderBottom: `2px solid ${cardBorder}`,
                    }}
                  >
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-id-badge"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      Código
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-calendar-alt"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      Data
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-building"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      Empresa / Frente
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-ruler-vertical"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      Altura
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-weight"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      Peso
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-chart-line"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      IMC
                    </th>
                    <th
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: textPrimary,
                      }}
                    >
                      <i
                        className="fas fa-tag"
                        style={{ marginRight: '6px', color: accentColor }}
                      ></i>
                      Classificação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employeesByYearAndMonth.slice(0, 100).map((emp, idx) => {
                    const bmi = getIMC(emp);
                    let badgeStyle = {
                      background: '#ecf0f1',
                      color: '#7f8c8d',
                    };
                    if (bmi >= 30)
                      badgeStyle = { background: '#f8d7da', color: '#721c24' };
                    else if (bmi >= 25)
                      badgeStyle = { background: '#fff3cd', color: '#856404' };
                    else if (bmi >= 18.5)
                      badgeStyle = { background: '#d4edda', color: '#155724' };

                    return (
                      <tr
                        key={emp.id}
                        style={{
                          borderBottom: `1px solid ${cardBorder}`,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: textPrimary,
                          }}
                        >
                          {emp.codigo}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            color: textSecondary,
                          }}
                        >
                          {emp.dataStr || '-'}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            color: textSecondary,
                          }}
                        >
                          {emp.company}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            color: textSecondary,
                          }}
                        >
                          {emp.height} cm
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            color: textSecondary,
                          }}
                        >
                          {emp.weight} kg
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: bmi >= 25 ? '#e74c3c' : accentColor,
                          }}
                        >
                          {bmi > 0 ? bmi.toFixed(1) : '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: badgeStyle.background,
                              color: badgeStyle.color,
                            }}
                          >
                            {bmi > 0
                              ? getBMIClassification(bmi)
                              : 'Não informado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {employeesByYearAndMonth.length === 0 && (
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
                  Nenhum registro encontrado para{' '}
                  {selectedMonth !== null ? meses[selectedMonth] : 'este ano'}.
                </div>
              )}
              {employeesByYearAndMonth.length > 100 && (
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
                  Exibindo 100 de {employeesByYearAndMonth.length} registros
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
