// app/ColaboradoresModule.tsx
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './lib/supabase';

interface Colaborador {
  id: number;
  codigo: string;
  nome: string;
  cpf: string;
  admissao: string;
  data_nascimento: string;
  cargo: string;
  departamento: string;
  regime: string;
  email: string;
  altura: number;
  peso: number;
  pressao_sistolica: number;
  pressao_diastolica: number;
}

export default function ColaboradoresModule() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [fileData, setFileData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    codigo: '',
    nome: '',
    cpf: '',
    admissao: '',
    data_nascimento: '',
    cargo: '',
    departamento: '',
    regime: 'onshore',
    email: '',
    altura: '',
    peso: '',
    pressao_sistolica: '',
    pressao_diastolica: '',
  });
  const [columnMapping, setColumnMapping] = useState({
    codigo: 0,
    nome: 1,
    admissao: 2,
    nascimento: 3,
    cargo: 6,
    departamento: 7,
    regime: 8,
    email: 10,
  });

  // ==================== CARREGAR COLABORADORES ====================
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro detalhado:', error);
        throw new Error(`Erro ao carregar: ${error.message}`);
      }
      setEmployees(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar colaboradores:', error);
      setErrorMessage(error.message || 'Erro ao carregar dados do banco');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ADICIONAR COLABORADOR ====================
  const addEmployee = async () => {
    if (!newEmployee.nome || !newEmployee.codigo) {
      alert('Preencha o código e nome do colaborador!');
      return;
    }

    try {
      const employeeToSave = {
        codigo: newEmployee.codigo,
        nome: newEmployee.nome,
        cpf: newEmployee.cpf || null,
        admissao: newEmployee.admissao || null,
        data_nascimento: newEmployee.data_nascimento || null,
        cargo: newEmployee.cargo || null,
        departamento: newEmployee.departamento || null,
        regime: newEmployee.regime,
        email: newEmployee.email || null,
        altura: parseFloat(newEmployee.altura) || null,
        peso: parseFloat(newEmployee.peso) || null,
        pressao_sistolica: newEmployee.pressao_sistolica
          ? parseInt(newEmployee.pressao_sistolica)
          : null,
        pressao_diastolica: newEmployee.pressao_diastolica
          ? parseInt(newEmployee.pressao_diastolica)
          : null,
      };

      const { data, error } = await supabase
        .from('colaboradores')
        .insert([employeeToSave])
        .select();

      if (error) {
        console.error('Erro detalhado ao inserir:', error);
        throw new Error(error.message);
      }

      console.log('Colaborador inserido:', data);
      await loadEmployees();

      setNewEmployee({
        codigo: '',
        nome: '',
        cpf: '',
        admissao: '',
        data_nascimento: '',
        cargo: '',
        departamento: '',
        regime: 'onshore',
        email: '',
        altura: '',
        peso: '',
        pressao_sistolica: '',
        pressao_diastolica: '',
      });
      setShowEmployeeForm(false);
      alert('Colaborador adicionado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar colaborador:', error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  // ==================== EXCLUIR COLABORADOR ====================
  const deleteEmployee = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return;

    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadEmployees();
      alert('Colaborador excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir colaborador:', error);
      alert(`Erro ao excluir: ${error.message}`);
    }
  };

  // ==================== FUNÇÕES DE IMPORTAÇÃO ====================
  const toSafeString = (value: any): string => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return value.toLocaleDateString('pt-BR');
    if (value && typeof value === 'object' && value.v !== undefined)
      return String(value.v);
    return String(value);
  };

  const toDateISO = (value: any): string => {
    if (!value) return '';

    if (typeof value === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
          return `${date.y}-${String(date.m).padStart(2, '0')}-${String(
            date.d
          ).padStart(2, '0')}`;
        }
      } catch (e) {}
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return value;
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }

    return '';
  };

  const extractEmployee = (
    row: any,
    idx: number,
    map: typeof columnMapping
  ) => {
    const codigo = toSafeString(row[map.codigo]);
    const nome = toSafeString(row[map.nome]);
    const admissaoRaw = row[map.admissao];
    const nascimentoRaw = row[map.nascimento];
    const cargo = toSafeString(row[map.cargo]);
    const departamento = toSafeString(row[map.departamento]);
    const regimeRaw = toSafeString(row[map.regime]);
    const email = toSafeString(row[map.email]);

    if (!nome || !codigo) return null;

    let regime = 'onshore';
    if (regimeRaw.toUpperCase() === 'OFFSHORE') regime = 'offshore';

    return {
      codigo,
      nome,
      cpf: null,
      admissao: toDateISO(admissaoRaw) || null,
      data_nascimento: toDateISO(nascimentoRaw) || null,
      cargo,
      departamento,
      regime,
      email: email || null,
      altura: null,
      peso: null,
      pressao_sistolica: null,
      pressao_diastolica: null,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!json || json.length < 2) throw new Error('Planilha vazia');
      setFileData({ headers: json[0], rows: json.slice(1) });
      setShowMapping(true);
    } catch (err) {
      alert('Erro ao ler planilha');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const processImport = async () => {
    if (!fileData) return;
    const { rows } = fileData;
    const novos: any[] = [];
    rows.forEach((row: any, i: number) => {
      const emp = extractEmployee(row, i, columnMapping);
      if (emp) novos.push(emp);
    });

    if (novos.length === 0) {
      alert('Nenhum registro válido encontrado.');
      return;
    }

    try {
      const { error } = await supabase.from('colaboradores').insert(novos);

      if (error) throw error;

      await loadEmployees();
      alert(`${novos.length} colaboradores importados com sucesso!`);
      setShowMapping(false);
      setFileData(null);
    } catch (error: any) {
      console.error('Erro ao importar colaboradores:', error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  // ==================== ESTATÍSTICAS ====================
  const totalOnshore = employees.filter(
    (e: any) => e.regime === 'onshore'
  ).length;
  const totalOffshore = employees.filter(
    (e: any) => e.regime === 'offshore'
  ).length;

  // ==================== MODAL DE MAPEAMENTO ====================
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
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 24,
            padding: 32,
            maxWidth: 600,
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            border: '1px solid #e8e0d8',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 28 }}>📋</span>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#2d2d2d',
                margin: 0,
              }}
            >
              Mapear Colunas
            </h2>
          </div>
          <p style={{ marginBottom: 24, fontSize: 14, color: '#6b6b6b' }}>
            Selecione qual coluna corresponde a cada informação do colaborador:
          </p>

          {[
            { key: 'codigo', label: '🔢 Código', default: 0 },
            { key: 'nome', label: '👤 Nome Completo', default: 1 },
            { key: 'admissao', label: '📅 Data de Admissão', default: 2 },
            { key: 'nascimento', label: '🎂 Data de Nascimento', default: 3 },
            { key: 'cargo', label: '💼 Cargo', default: 6 },
            { key: 'departamento', label: '🏢 Departamento', default: 7 },
            {
              key: 'regime',
              label: '⚓ Regime (OFFSHORE/ONSHORE)',
              default: 8,
            },
            { key: 'email', label: '📧 E-mail', default: 10 },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontWeight: 600,
                  color: '#2d2d2d',
                }}
              >
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
                  borderRadius: 10,
                  border: '1px solid #e0e0e0',
                  fontSize: 14,
                  background: '#f8f5f2',
                  cursor: 'pointer',
                  color: '#2d2d2d',
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

          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button
              onClick={processImport}
              style={{
                flex: 1,
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              ✅ Confirmar Importação
            </button>
            <button
              onClick={() => {
                setShowMapping(false);
                setFileData(null);
              }}
              style={{
                flex: 1,
                padding: '14px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(16, 185, 129, 0.15)',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#6b6b6b', fontWeight: 500 }}>
          Carregando colaboradores...
        </p>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div style={{ padding: '24px', color: '#3d3d3d' }}>
      <MappingModal />

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
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#2d2d2d',
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            👥 COLABORADORES
          </h1>
          <p style={{ fontSize: '15px', color: '#6b6b6b', marginTop: '4px' }}>
            Gestão completa do quadro de funcionários
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label
            style={{
              background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 15px rgba(39,174,96,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <i className="fas fa-file-import"></i>
            {importing ? 'Importando...' : 'Importar Planilha'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={importing}
            />
          </label>
          <button
            onClick={() => setShowEmployeeForm(!showEmployeeForm)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <i className="fas fa-plus-circle"></i>
            {showEmployeeForm ? 'Fechar Formulário' : 'Novo Colaborador'}
          </button>
        </div>
      </div>

      {/* ERRO */}
      {errorMessage && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            color: '#dc2626',
            fontSize: 14,
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* CARDS DE ESTATÍSTICAS - IDÊNTICO AO DASHBOARD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e8e0d8',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
            }}
          >
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#1a1a1a',
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              {employees.length}
            </div>
            <p
              style={{
                fontSize: '13px',
                color: '#6b6b6b',
                margin: '4px 0 0 0',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Total de Colaboradores
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e8e0d8',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
            }}
          >
            <i className="fas fa-water"></i>
          </div>
          <div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#1a1a1a',
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              {totalOffshore}
            </div>
            <p
              style={{
                fontSize: '13px',
                color: '#6b6b6b',
                margin: '4px 0 0 0',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Offshore
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e8e0d8',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
            }}
          >
            <i className="fas fa-building"></i>
          </div>
          <div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#1a1a1a',
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              {totalOnshore}
            </div>
            <p
              style={{
                fontSize: '13px',
                color: '#6b6b6b',
                margin: '4px 0 0 0',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Onshore
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e8e0d8',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              color: '#f59e0b',
              background: 'rgba(245, 158, 11, 0.1)',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '14px',
            }}
          >
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#1a1a1a',
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              {
                new Set(
                  employees
                    .map((e: any) => e.admissao?.split('-')[0])
                    .filter(Boolean)
                ).size
              }
            </div>
            <p
              style={{
                fontSize: '13px',
                color: '#6b6b6b',
                margin: '4px 0 0 0',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Anos de admissão
            </p>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO - ESTILO DASHBOARD */}
      {showEmployeeForm && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            marginBottom: '32px',
            border: '1px solid #e8e0d8',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f0ebe6',
            }}
          >
            <i
              className="fas fa-user-plus"
              style={{ color: '#10b981', fontSize: '20px' }}
            ></i>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#2d2d2d',
                margin: 0,
              }}
            >
              Cadastrar Novo Colaborador
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                CÓDIGO <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: 001"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                value={newEmployee.codigo}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, codigo: e.target.value })
                }
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                NOME COMPLETO <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Digite o nome completo"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.nome}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, nome: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                CPF
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.cpf}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, cpf: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                DATA DE ADMISSÃO
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.admissao}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, admissao: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                DATA DE NASCIMENTO
              </label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.data_nascimento}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    data_nascimento: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                CARGO
              </label>
              <input
                type="text"
                placeholder="Ex: Mergulhador"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.cargo}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, cargo: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                DEPARTAMENTO
              </label>
              <input
                type="text"
                placeholder="Ex: Operações"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.departamento}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    departamento: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                REGIME
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() =>
                    setNewEmployee({ ...newEmployee, regime: 'offshore' })
                  }
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #e8e0d8',
                    background:
                      newEmployee.regime === 'offshore'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : '#f8f5f2',
                    color:
                      newEmployee.regime === 'offshore' ? '#059669' : '#6b6b6b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                >
                  🌊 OFFSHORE
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewEmployee({ ...newEmployee, regime: 'onshore' })
                  }
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #e8e0d8',
                    background:
                      newEmployee.regime === 'onshore'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : '#f8f5f2',
                    color:
                      newEmployee.regime === 'onshore' ? '#059669' : '#6b6b6b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                >
                  🏢 ONSHORE
                </button>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#6b6b6b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                E-MAIL
              </label>
              <input
                type="email"
                placeholder="colaborador@empresa.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e8e0d8',
                  fontSize: '14px',
                  color: '#2d2d2d',
                  background: 'rgba(0, 0, 0, 0.02)',
                  outline: 'none',
                }}
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid #f0ebe6',
            }}
          >
            <button
              onClick={() => setShowEmployeeForm(false)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid #e8e0d8',
                background: '#f8f5f2',
                color: '#6b6b6b',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={addEmployee}
              style={{
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              ✅ Salvar Colaborador
            </button>
          </div>
        </div>
      )}

      {/* TABELA - ESTILO DASHBOARD */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid #e8e0d8',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f0ebe6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-table" style={{ color: '#10b981' }}></i>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#2d2d2d',
                margin: 0,
              }}
            >
              LISTA DE COLABORADORES
            </h3>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: '13px',
              color: '#6b6b6b',
            }}
          >
            <span>
              👥 Total:{' '}
              <strong style={{ color: '#2d2d2d' }}>{employees.length}</strong>
            </span>
            <span>
              🌊 Offshore:{' '}
              <strong style={{ color: '#3b82f6' }}>{totalOffshore}</strong>
            </span>
            <span>
              🏢 Onshore:{' '}
              <strong style={{ color: '#10b981' }}>{totalOnshore}</strong>
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: '#f8f5f2',
                  borderBottom: '2px solid #f0ebe6',
                }}
              >
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Código
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Nome
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Cargo
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Departamento
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Regime
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  E-mail
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Admissão
                </th>
                <th
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#6b6b6b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: '60px 20px',
                      textAlign: 'center',
                      color: '#6b6b6b',
                      background: '#faf8f6',
                    }}
                  >
                    <i
                      className="fas fa-users"
                      style={{
                        fontSize: '48px',
                        display: 'block',
                        marginBottom: '16px',
                        color: '#d0c8c0',
                      }}
                    ></i>
                    Nenhum colaborador cadastrado. Importe uma planilha ou
                    clique em "Novo Colaborador".
                  </td>
                </tr>
              ) : (
                employees.map((emp: any, idx: number) => (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid #f0ebe6',
                      background: idx % 2 === 0 ? '#ffffff' : '#faf8f6',
                    }}
                  >
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#2d2d2d',
                      }}
                    >
                      {emp.codigo}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '13px',
                        color: '#3d3d3d',
                      }}
                    >
                      {emp.nome}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '13px',
                        color: '#6b6b6b',
                      }}
                    >
                      {emp.cargo || '-'}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '13px',
                        color: '#6b6b6b',
                      }}
                    >
                      {emp.departamento || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background:
                            emp.regime === 'offshore'
                              ? 'rgba(59, 130, 246, 0.1)'
                              : 'rgba(16, 185, 129, 0.1)',
                          color:
                            emp.regime === 'offshore' ? '#3b82f6' : '#059669',
                          textTransform: 'uppercase',
                        }}
                      >
                        {emp.regime === 'offshore'
                          ? '🌊 OFFSHORE'
                          : '🏢 ONSHORE'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '12px',
                        color: '#6b6b6b',
                      }}
                    >
                      {emp.email || '-'}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        fontSize: '13px',
                        color: '#6b6b6b',
                      }}
                    >
                      {emp.admissao || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: 'none',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                        }}
                      >
                        <i className="fas fa-trash"></i> Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
