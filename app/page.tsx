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
import RefeicaoModule from './RefeicaoModule'; // <-- NOME CORRETO
import PreMERModule from './PreMERModule';
import ProntuarioModule from './ProntuarioModule';
import { SupabaseProvider, useSupabase } from './SupabaseContext';
import { supabase } from './lib/supabase';
import { useAuth } from './hook/useAuth';
import { useModulosPermitidos } from './hook/useModulosPermitidos';

// ============================================================
// COMPONENTE DE LOADING LINDÃO
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
      {/* Fundo com efeito de ondas */}
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

      {/* Logo/Icone */}
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

// Componente interno que usa o Supabase
function DashboardContent() {
  const { employees, addEmployee, deleteEmployee, loading } = useSupabase();
  const { user, perfil, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPressureForm, setShowPressureForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Estado para Pré-Embarque
  const [preEmbarqueRecords, setPreEmbarqueRecords] = useState<
    PreEmbarqueRecord[]
  >([]);
  const [showPreEmbarqueForm, setShowPreEmbarqueForm] = useState(false);
  const [multipleEmployees, setMultipleEmployees] = useState(false);
  const [preEmbarqueList, setPreEmbarqueList] = useState<PreEmbarqueRecord[]>(
    []
  );
  const [newPreEmbarque, setNewPreEmbarque] = useState({
    codigo: '',
    nome: '',
    cargo: '',
    dataExame: new Date().toISOString().split('T')[0],
    mesReferencia: new Date()
      .toLocaleDateString('pt-BR', { month: 'long' })
      .toUpperCase(),
    peso: '',
    altura: '',
    circunferencia: '',
    frenteServico: '',
  });

  // Estado para Pressão Arterial
  const [bloodPressureRecords, setBloodPressureRecords] = useState<
    BloodPressureRecord[]
  >([]);
  const [newPressureRecord, setNewPressureRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    workFront: '',
    employeeId: '',
    temperature: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
  });

  // Estado para novo colaborador (formulário)
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
  // PERMISSÕES VIA AUTH
  // ============================================================
  const userEmail = user?.email || user?.user_metadata?.email || null;
  const { temModulo, loading: permissoesLoading } =
    useModulosPermitidos(userEmail);

  // DEFINIR OS ITENS DO MENU COM BASE NAS PERMISSÕES
  const todosMenuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'funcionarios', icon: 'fa-users', label: 'Colaboradores' },
    { id: 'premer', icon: 'fa-notes-medical', label: 'Pré-mergulho' },
    { id: 'imc', icon: 'fa-weight-scale', label: 'Controle de IMC' },
    { id: 'preembarque', icon: 'fa-briefcase', label: 'Pré-Embarque' },
    { id: 'refeicao', icon: 'fa-chalkboard', label: 'Controle de refeição' },
    { id: 'prontuario', icon: 'fa-folder-open', label: 'Prontuário' },
  ];

  // FILTRAR OS ITENS QUE O USUÁRIO PODE VER
  const menuItems = todosMenuItems.filter((item) => temModulo(item.id));

  // Se não tiver permissão para nenhum módulo, mostrar pelo menos o dashboard
  const finalMenuItems =
    menuItems.length > 0
      ? menuItems
      : [{ id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' }];

  // SE O MÓDULO ATIVO NÃO ESTIVER PERMITIDO, REDIRECIONAR PARA O PRIMEIRO PERMITIDO
  useEffect(() => {
    if (!permissoesLoading && finalMenuItems.length > 0) {
      const moduloPermitido = finalMenuItems.some(
        (item) => item.id === activeModule
      );
      if (!moduloPermitido) {
        setActiveModule(finalMenuItems[0].id);
      }
    }
  }, [permissoesLoading, finalMenuItems, activeModule]);

  // ============================================================
  // VERIFICAR AUTENTICAÇÃO
  // ============================================================
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ==================== FUNÇÕES AUXILIARES ====================

  const calculateBMI = (
    weight: number | string,
    height: number | string
  ): number => {
    const peso = typeof weight === 'string' ? parseFloat(weight) : weight;
    let altura = typeof height === 'string' ? parseFloat(height) : height;

    if (!peso || !altura || peso <= 0 || altura <= 0) return 0;
    if (isNaN(peso) || isNaN(altura)) return 0;

    if (altura > 3) {
      altura = altura / 100;
    }

    const imc = peso / (altura * altura);
    return Math.round(imc * 10) / 10;
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

  // ==================== FUNÇÕES PRÉ-EMBARQUE (Supabase) ====================

  const loadPreEmbarqueRecords = async () => {
    const { data, error } = await supabase
      .from('pre_embarque')
      .select('*')
      .order('data_exame', { ascending: false });

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
        mesReferencia: new Date()
          .toLocaleDateString('pt-BR', { month: 'long' })
          .toUpperCase(),
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
      const { error } = await supabase
        .from('pre_embarque')
        .delete()
        .eq('id', parseInt(id));
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        await loadPreEmbarqueRecords();
        alert('Registro excluído com sucesso!');
      }
    }
  };

  // ==================== FUNÇÕES PRESSÃO ARTERIAL (Supabase) ====================

  const loadBloodPressureRecords = async () => {
    const { data, error } = await supabase
      .from('pressao_arterial')
      .select('*')
      .order('data', { ascending: false });

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
    if (
      !newPressureRecord.employeeId ||
      !newPressureRecord.systolic ||
      !newPressureRecord.diastolic
    ) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const employee = employees.find(
      (e) => e.id === newPressureRecord.employeeId
    );
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
      const { error } = await supabase
        .from('pressao_arterial')
        .delete()
        .eq('id', parseInt(id));
      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        await loadBloodPressureRecords();
        alert('Medição excluída com sucesso!');
      }
    }
  };

  const filteredPressureRecords = bloodPressureRecords.filter((r) =>
    r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==================== FUNÇÕES COLABORADORES (com Supabase) ====================

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

  // ==================== CARREGAR DADOS DO SUPABASE ====================

  useEffect(() => {
    loadPreEmbarqueRecords();
    loadBloodPressureRecords();
  }, [employees]);

  // ==================== RENDER ====================

  // Mostrar loading enquanto verifica autenticação ou permissões
  if (authLoading || loading || permissoesLoading) {
    return <LoadingScreen />;
  }

  // Se não tiver usuário, não renderiza (redireciona)
  if (!user) {
    return null;
  }

  // Nome do usuário para exibir
  const nomeUsuario =
    perfil?.nome ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário';
  const cargoUsuario = perfil?.cargo || 'Colaborador';
  const primeiraLetra = nomeUsuario.charAt(0).toUpperCase();

  return (
    <div style={styles.appContainer}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        menuItems={finalMenuItems}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        styles={styles}
        user={user}
        perfil={perfil}
        onLogout={logout}
      />
      <main
        style={{
          ...styles.mainContent,
          marginLeft: sidebarCollapsed ? '70px' : '260px',
        }}
      >
        <div style={styles.topBar}>
          <div>
            <h2 style={styles.pageTitle}>
              {finalMenuItems.find((m) => m.id === activeModule)?.label ||
                'Dashboard'}
            </h2>
            <p style={styles.pageSubtitle}>CONTINENTAL HEALTH DASHBOARD</p>
          </div>
          <div style={styles.userInfo}>
            <i className="fas fa-bell" style={styles.bellIcon}></i>
            <div style={styles.userAvatar}>
              <span>{primeiraLetra}</span>
            </div>
            <div style={{ marginLeft: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>
                {nomeUsuario}
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d' }}>
                {cargoUsuario}
              </div>
            </div>
          </div>
        </div>

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
          <RefeicaoModule styles={styles} user={user} />
        )}

        {activeModule === 'premer' && <PreMERModule employees={employees} />}

        {activeModule === 'prontuario' && (
          <ProntuarioModule
            employees={employees}
            styles={styles}
            preEmbarqueRecords={preEmbarqueRecords}
            bloodPressureRecords={bloodPressureRecords}
            toxicologicoRecords={[]}
          />
        )}
      </main>
    </div>
  );
}

// Componente principal com o Provider
export default function Dashboard() {
  return (
    <SupabaseProvider>
      <DashboardContent />
    </SupabaseProvider>
  );
}
