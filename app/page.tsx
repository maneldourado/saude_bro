// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles } from './styles';
import { Employee, BloodPressureRecord, PreEmbarqueRecord } from './types';
import Sidebar from './Sidebar';
import DashboardModule from './DashboardModule';
import IMCUI from './IMC-UI';
import PreEmbarqueModule from './PreEmbarqueModule';
import PressaoModule from './PressaoModule';
import ColaboradoresModule from './ColaboradoresModule';
import RefeicaoModule from './RefeicaoModule';
import PreMERModule from './PreMERModule';
import ProntuarioModule from './ProntuarioModule';
import { SupabaseProvider, useSupabase } from './SupabaseContext';
import { supabase } from './lib/supabase';
import { useAuth } from './hook/useAuth';
import { useModulosPermitidos } from './hook/useModulosPermitidos';

// ============================================================
// COMPONENTE DE LOADING
// ============================================================
function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #0B5E7E 0%, #0a4d66 30%, #083c50 60%, #062b3a 100%)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          opacity: 0.1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)
            `,
            animation: 'wave 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: `
              radial-gradient(ellipse at 70% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 30% 70%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)
            `,
            animation: 'wave 12s ease-in-out infinite reverse',
          }}
        />
      </div>
      <div
        style={{
          marginBottom: '32px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow:
              '0 0 60px rgba(16, 185, 129, 0.15), inset 0 0 60px rgba(16, 185, 129, 0.05)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              animation: 'pulse-ring 2s ease-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '1px solid rgba(16, 185, 129, 0.08)',
              animation: 'pulse-ring 2.5s ease-out infinite 0.5s',
            }}
          />
          <i
            className="fas fa-heartbeat"
            style={{
              fontSize: '48px',
              color: '#10b981',
              animation: 'pulse-icon 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: 'white',
            margin: 0,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #ffffff 0%, #a7f3d0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Continental Health
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '8px 0 0 0',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 300,
          }}
        >
          Saúde Ocupacional
        </p>
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '40px',
          width: '240px',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)',
            backgroundSize: '200% 100%',
            borderRadius: '2px',
            animation: 'loading-bar 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 500,
            letterSpacing: '1px',
          }}
        >
          CARREGANDO
        </span>
        <span
          style={{
            display: 'inline-flex',
            gap: '4px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#10b981',
                animation: `dot-bounce 1.4s ease-in-out infinite ${i * 0.2}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </span>
      </div>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-5%, -5%) rotate(2deg); }
          66% { transform: translate(5%, 5%) rotate(-2deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
function DashboardContent() {
  const { employees, addEmployee, deleteEmployee, loading } = useSupabase();
  const { user, perfil, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // ── ESTADOS GERAIS ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ── PRÉ-EMBARQUE ──
  const [preEmbarqueRecords, setPreEmbarqueRecords] = useState<PreEmbarqueRecord[]>([]);
  const [showPreEmbarqueForm, setShowPreEmbarqueForm] = useState(false);
  const [multipleEmployees, setMultipleEmployees] = useState(false);
  const [preEmbarqueList, setPreEmbarqueList] = useState<PreEmbarqueRecord[]>([]);
  const [newPreEmbarque, setNewPreEmbarque] = useState({
    codigo: '',
    nome: '',
    cargo: '',
    dataExame: new Date().toISOString().split('T')[0],
    mesReferencia: new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase(),
    peso: '',
    altura: '',
    circunferencia: '',
    frenteServico: '',
  });

  // ── PRESSÃO ARTERIAL ──
  const [bloodPressureRecords, setBloodPressureRecords] = useState<BloodPressureRecord[]>([]);
  const [showPressureForm, setShowPressureForm] = useState(false);
  const [newPressureRecord, setNewPressureRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    workFront: '',
    employeeId: '',
    temperature: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
  });

  // ── NOVO COLABORADOR ──
  const [newEmployee, setNewEmployee] = useState({
    codigo: '',
    name: '',
    cpf: '',
    cargo: '',
    departamento: '',
    regime: 'onshore' as 'offshore' | 'onshore',
    email: '',
    admissao: '',
    birthDate: '',
    height: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
  });

  // ============================================================
  // PERMISSÕES
  // ============================================================
  const userEmail = user?.email || user?.user_metadata?.email || null;
  const { temModulo, loading: permissoesLoading } = useModulosPermitidos(userEmail);

  const todosMenuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'funcionarios', icon: 'fa-users', label: 'Colaboradores' },
    { id: 'premer', icon: 'fa-notes-medical', label: 'Pré-mergulho' },
    { id: 'imc', icon: 'fa-weight-scale', label: 'Controle de IMC' },
    { id: 'preembarque', icon: 'fa-briefcase', label: 'Pré-Embarque' },
    { id: 'refeicao', icon: 'fa-chalkboard', label: 'Controle de refeição' },
    { id: 'prontuario', icon: 'fa-folder-open', label: 'Prontuário' },
  ];

  const menuItems = todosMenuItems.filter((item) => temModulo(item.id));
  const finalMenuItems = menuItems.length > 0 ? menuItems : [{ id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' }];
  const isRestricted = finalMenuItems.length === 1 && finalMenuItems[0].id === 'refeicao';

  useEffect(() => {
    if (!permissoesLoading && finalMenuItems.length > 0) {
      const moduloPermitido = finalMenuItems.some((item) => item.id === activeModule);
      if (!moduloPermitido) {
        setActiveModule(finalMenuItems[0].id);
      }
    }
  }, [permissoesLoading, finalMenuItems, activeModule]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ============================================================
  // FUNÇÕES AUXILIARES
  // ============================================================
  const calculateBMI = (weight: number | string, height: number | string): number => {
    const peso = typeof weight === 'string' ? parseFloat(weight) : weight;
    let altura = typeof height === 'string' ? parseFloat(height) : height;
    if (!peso || !altura || peso <= 0 || altura <= 0) return 0;
    if (isNaN(peso) || isNaN(altura)) return 0;
    if (altura > 3) altura = altura / 100;
    return Math.round((peso / (altura * altura)) * 10) / 10;
  };

  const getPreEmbarqueStatus = (bmi: number): string => {
    if (bmi === 0) return 'Pendente';
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade Grau I';
    if (bmi < 40) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
  };

  const getBMIClassification = (bmi: number): string => {
    if (bmi === 0) return 'Não informado';
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    if (bmi < 35) return 'Obesidade grau I';
    if (bmi < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  };

  // ============================================================
  // FUNÇÕES PRÉ-EMBARQUE
  // ============================================================
  const loadPreEmbarqueRecords = async () => {
    const { data, error } = await supabase.from('pre_embarque').select('*').order('data_exame', { ascending: false });
    if (!error && data) {
      const formatted = data.map((record: any) => ({
        id: record.id.toString(),
        codigo: record.colaborador_codigo,
        nome: record.colaborador_nome,
        cargo: record.cargo,
        dataExame: record.data_exame,
        mesReferencia: record.mes_referencia,
        peso: record.peso,
        altura: record.altura,
        circunferencia: record.circunferencia,
        frenteServico: record.frente_servico,
        status: record.status,
      }));
      setPreEmbarqueRecords(formatted);
    }
  };

  const addPreEmbarqueRecord = async () => {
    if (!newPreEmbarque.nome || !newPreEmbarque.codigo) {
      alert('Preencha o código e nome do colaborador');
      return;
    }
    const employee = employees.find((e) => e.codigo === newPreEmbarque.codigo);
    if (!employee) {
      alert('Colaborador não encontrado');
      return;
    }
    const peso = parseFloat(newPreEmbarque.peso) || 0;
    let altura = parseFloat(newPreEmbarque.altura) || 0;
    if (altura > 3) altura = altura / 100;
    const imc = calculateBMI(peso, altura);
    const status = getPreEmbarqueStatus(imc);

    const { error } = await supabase.from('pre_embarque').insert([
      {
        colaborador_id: parseInt(employee.id),
        colaborador_codigo: newPreEmbarque.codigo,
        colaborador_nome: newPreEmbarque.nome,
        cargo: newPreEmbarque.cargo,
        data_exame: newPreEmbarque.dataExame,
        mes_referencia: newPreEmbarque.mesReferencia,
        peso: peso,
        altura: altura,
        circunferencia: parseFloat(newPreEmbarque.circunferencia) || 0,
        frente_servico: newPreEmbarque.frenteServico,
        status: status,
      },
    ]);
    if (error) {
      console.error('Erro ao salvar pré-embarque:', error);
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Pré-embarque salvo com sucesso!');
      await loadPreEmbarqueRecords();
      setNewPreEmbarque({
        codigo: '',
        nome: '',
        cargo: '',
        dataExame: new Date().toISOString().split('T')[0],
        mesReferencia: new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase(),
        peso: '',
        altura: '',
        circunferencia: '',
        frenteServico: '',
      });
      setShowPreEmbarqueForm(false);
    }
  };

  const confirmAllPreEmbarque = async () => {
    if (preEmbarqueList.length === 0) {
      alert('Adicione pelo menos um colaborador na lista');
      return;
    }
    for (const item of preEmbarqueList) {
      const peso = parseFloat(newPreEmbarque.peso) || 0;
      let altura = parseFloat(newPreEmbarque.altura) || 0;
      if (altura > 3) altura = altura / 100;
      const imc = calculateBMI(peso, altura);
      const status = getPreEmbarqueStatus(imc);
      await supabase.from('pre_embarque').insert([
        {
          colaborador_codigo: item.codigo,
          colaborador_nome: item.nome,
          cargo: item.cargo,
          data_exame: newPreEmbarque.dataExame,
          mes_referencia: newPreEmbarque.mesReferencia,
          peso: peso,
          altura: altura,
          circunferencia: parseFloat(newPreEmbarque.circunferencia) || 0,
          frente_servico: newPreEmbarque.frenteServico,
          status: status,
        },
      ]);
    }
    await loadPreEmbarqueRecords();
    setPreEmbarqueList([]);
    setShowPreEmbarqueForm(false);
    setMultipleEmployees(false);
    alert(`${preEmbarqueList.length} registros salvos com sucesso!`);
  };

  const removeFromTempList = (id: string) => {
    setPreEmbarqueList(preEmbarqueList.filter((item) => item.id !== id));
  };

  const deletePreEmbarqueRecord = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      const { error } = await supabase.from('pre_embarque').delete().eq('id', parseInt(id));
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        await loadPreEmbarqueRecords();
        alert('Registro excluído com sucesso!');
      }
    }
  };

  // ============================================================
  // FUNÇÕES PRESSÃO ARTERIAL
  // ============================================================
  const loadBloodPressureRecords = async () => {
    const { data, error } = await supabase.from('pressao_arterial').select('*').order('data', { ascending: false });
    if (!error && data) {
      const formatted = data.map((record: any) => ({
        id: record.id.toString(),
        date: record.data,
        workFront: record.frente_servico,
        employeeId: record.colaborador_id.toString(),
        employeeName: record.colaborador_nome,
        temperature: record.temperatura,
        systolic: record.sistolica,
        diastolic: record.diastolica,
        heartRate: record.batimentos,
      }));
      setBloodPressureRecords(formatted);
    }
  };

  const addBloodPressureRecord = async () => {
    if (!newPressureRecord.employeeId || !newPressureRecord.systolic || !newPressureRecord.diastolic) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const employee = employees.find((e) => e.id === newPressureRecord.employeeId);
    if (!employee) {
      alert('Colaborador não encontrado');
      return;
    }
    const { error } = await supabase.from('pressao_arterial').insert([
      {
        colaborador_id: parseInt(employee.id),
        colaborador_codigo: employee.codigo,
        colaborador_nome: employee.name,
        data: newPressureRecord.date,
        frente_servico: newPressureRecord.workFront,
        temperatura: parseFloat(newPressureRecord.temperature) || 0,
        sistolica: parseInt(newPressureRecord.systolic),
        diastolica: parseInt(newPressureRecord.diastolic),
        batimentos: parseInt(newPressureRecord.heartRate) || 0,
      },
    ]);
    if (error) {
      console.error('Erro ao salvar pressão:', error);
      alert('Erro ao salvar: ' + error.message);
    } else {
      alert('Medição de pressão salva com sucesso!');
      await loadBloodPressureRecords();
      setNewPressureRecord({
        date: new Date().toISOString().split('T')[0],
        workFront: '',
        employeeId: '',
        temperature: '',
        systolic: '',
        diastolic: '',
        heartRate: '',
      });
      setShowPressureForm(false);
    }
  };

  const deletePressureRecord = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta medição?')) {
      const { error } = await supabase.from('pressao_arterial').delete().eq('id', parseInt(id));
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        await loadBloodPressureRecords();
        alert('Medição excluída com sucesso!');
      }
    }
  };

  // ============================================================
  // FUNÇÕES COLABORADORES
  // ============================================================
  const handleAddEmployee = async () => {
    if (!newEmployee.codigo || !newEmployee.name) {
      alert('Por favor, preencha o código e o nome do colaborador.');
      return;
    }
    if (!newEmployee.admissao) {
      alert('Por favor, preencha a DATA DE ADMISSÃO.');
      return;
    }
    if (!newEmployee.birthDate) {
      alert('Por favor, preencha a DATA DE NASCIMENTO.');
      return;
    }
    await addEmployee(newEmployee);
    setNewEmployee({
      codigo: '',
      name: '',
      cpf: '',
      cargo: '',
      departamento: '',
      regime: 'onshore',
      email: '',
      admissao: '',
      birthDate: '',
      height: '',
      weight: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
    });
    setShowEmployeeForm(false);
    alert('Colaborador cadastrado com sucesso!');
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
      await deleteEmployee(id);
      alert('Colaborador excluído com sucesso!');
    }
  };

  // ============================================================
  // CARREGAR DADOS
  // ============================================================
  useEffect(() => {
    loadPreEmbarqueRecords();
    loadBloodPressureRecords();
  }, [employees]);

  // ============================================================
  // RENDER
  // ============================================================
  if (authLoading || loading || permissoesLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoadingScreen />;
  }

  const nomeUsuario = perfil?.nome || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const cargoUsuario = perfil?.cargo || 'Colaborador';
  const primeiraLetra = nomeUsuario.charAt(0).toUpperCase();

  // ── MODO RESTRITO ──
  if (isRestricted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0eb' }}>
        <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <RefeicaoModule
            styles={styles}
            user={user}
            isRestricted={true}
            colaboradorNome={nomeUsuario}
            colaboradorCargo={cargoUsuario}
            onLogout={async () => {
              await logout();
              router.push('/login');
            }}
          />
        </main>
      </div>
    );
  }

  // ── MODO NORMAL ──
  const sidebarWidth = sidebarCollapsed ? 80 : 260;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f0eb' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        menuItems={finalMenuItems}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        styles={styles}
        user={user}
        perfil={perfil}
        onLogout={async () => {
          await logout();
          router.push('/login');
        }}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          padding: '24px',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          background: '#f5f0eb',
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
              {finalMenuItems.find((m) => m.id === activeModule)?.label || 'Dashboard'}
            </h2>
            <p style={{ fontSize: '13px', color: '#6b5f55', margin: '4px 0 0' }}>
              CONTINENTAL HEALTH DASHBOARD
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <i className="fas fa-bell" style={{ fontSize: '18px', color: '#6b5f55', cursor: 'pointer' }}></i>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
                color: 'white',
              }}
            >
              {primeiraLetra}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
                {nomeUsuario}
              </div>
              <div style={{ fontSize: '11px', color: '#6b757d' }}>
                {cargoUsuario}
              </div>
            </div>
          </div>
        </div>

        {/* ── MÓDULOS ── */}
        <div style={{ width: '100%' }}>
          {activeModule === 'dashboard' && (
            <DashboardModule
              employees={employees}
              bloodPressureRecords={bloodPressureRecords}
              styles={styles}
              onNavigate={setActiveModule}
              userNome={nomeUsuario}
            />
          )}

          {activeModule === 'imc' && (
            <IMCUI
              calculateBMI={calculateBMI}
              getBMIClassification={getBMIClassification}
              styles={styles}
            />
          )}

          {activeModule === 'preembarque' && (
            <PreEmbarqueModule
              preEmbarqueRecords={preEmbarqueRecords}
              setPreEmbarqueRecords={setPreEmbarqueRecords}
              showPreEmbarqueForm={showPreEmbarqueForm}
              setShowPreEmbarqueForm={setShowPreEmbarqueForm}
              multipleEmployees={multipleEmployees}
              setMultipleEmployees={setMultipleEmployees}
              preEmbarqueList={preEmbarqueList}
              setPreEmbarqueList={setPreEmbarqueList}
              newPreEmbarque={newPreEmbarque}
              setNewPreEmbarque={setNewPreEmbarque}
              addPreEmbarqueRecord={addPreEmbarqueRecord}
              confirmAllPreEmbarque={confirmAllPreEmbarque}
              removeFromTempList={removeFromTempList}
              deletePreEmbarqueRecord={deletePreEmbarqueRecord}
              calculateBMI={calculateBMI}
              getPreEmbarqueStatus={getPreEmbarqueStatus}
              styles={styles}
            />
          )}

          {activeModule === 'funcionarios' && (
            <ColaboradoresModule
              employees={employees}
              showEmployeeForm={showEmployeeForm}
              setShowEmployeeForm={setShowEmployeeForm}
              newEmployee={newEmployee}
              setNewEmployee={setNewEmployee}
              addEmployee={handleAddEmployee}
              deleteEmployee={handleDeleteEmployee}
              styles={styles}
            />
          )}

          {activeModule === 'refeicao' && (
            <RefeicaoModule
              styles={styles}
              user={user}
              isRestricted={false}
            />
          )}

          {activeModule === 'premer' && (
            <PreMERModule employees={employees} />
          )}

          {activeModule === 'prontuario' && (
            <ProntuarioModule
              employees={employees}
              styles={styles}
              preEmbarqueRecords={preEmbarqueRecords}
              bloodPressureRecords={bloodPressureRecords}
              toxicologicoRecords={[]}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================
export default function Dashboard() {
  return (
    <SupabaseProvider>
      <DashboardContent />
    </SupabaseProvider>
  );
}
