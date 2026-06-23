// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles } from './styles';
import { Employee, BloodPressureRecord, PreEmbarqueRecord } from './types';
import Sidebar from './Sidebar';
import DashboardModule from './DashboardModule';
import IMCModule from './IMCModule';
import PreEmbarqueModule from './PreEmbarqueModule';
import PressaoModule from './PressaoModule';
import ColaboradoresModule from './ColaboradoresModule';
import RefeicaoModule from './RefeicaoModule';
import PreMERModule from './PreMERModule';
import CertificadosModule from './CertificadosModule';
import VacinacaoModule from './VacinacaoModule';
import AtestadosModule from './AtestadosModule';
import ToxicologicoModule from './ToxicologicoModule';
import ProntuarioModule from './ProntuarioModule';
import EmergencyKitModule from './EmergencyKitModule'; // Importando o novo módulo
import { SupabaseProvider, useSupabase } from './SupabaseContext';
import { supabase } from './lib/supabase';
import { useAuth } from './hook/useAuth';

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

  // Verificar autenticação
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

  // ==================== MENU ====================

  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { id: 'funcionarios', icon: 'fa-users', label: 'Colaboradores' },
    { id: 'premer', icon: 'fa-notes-medical', label: 'Pré-mergulho' },
    { id: 'imc', icon: 'fa-weight-scale', label: 'Controle de IMC' },
    { id: 'pressao', icon: 'fa-heartbeat', label: 'Pressão Arterial' },
    { id: 'emergencia', icon: 'fa-first-aid', label: 'Controle de Medicamentos' }, // ID alterado para bater com o módulo
    { id: 'preembarque', icon: 'fa-briefcase', label: 'Pré-Embarque' },
    { id: 'ref', icon: 'fa-chalkboard', label: 'Controle de refeição' },
    { id: 'certificados', icon: 'fa-certificate', label: 'Certificados' },
    { id: 'vacinacao', icon: 'fa-syringe', label: 'Vacinação' },
    { id: 'atestados', icon: 'fa-file-medical', label: 'Atestados' },
    { id: 'toxicologico', icon: 'fa-flask', label: 'Toxicológico' },
    { id: 'prontuario', icon: 'fa-folder-open', label: 'Prontuário' },
  ];

  // Nome do usuário para exibir (prioriza perfil.nome, depois user.email)
  const nomeUsuario =
    perfil?.nome ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Usuário';
  const cargoUsuario = perfil?.cargo || 'Colaborador';
  const primeiraLetra = nomeUsuario.charAt(0).toUpperCase();

  // Mostrar loading enquanto verifica autenticação
  if (authLoading || loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div>Carregando...</div>
      </div>
    );
  }

  // Se não tiver usuário, não renderiza (redireciona)
  if (!user) {
    return null;
  }

  // ==================== RENDER ====================

  return (
    <div style={styles.appContainer}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        menuItems={menuItems}
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
              {menuItems.find((m) => m.id === activeModule)?.label ||
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
          />
        )}

        {activeModule === 'imc' && (
          <IMCModule
            employees={employees}
            calculateBMI={calculateBMI}
            getBMIClassification={getBMIClassification}
            styles={styles}
          />
        )}

        {activeModule === 'emergencia' && (
          <EmergencyKitModule styles={styles} />
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

        {activeModule === 'pressao' && (
          <PressaoModule
            bloodPressureRecords={bloodPressureRecords}
            filteredPressureRecords={filteredPressureRecords}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showPressureForm={showPressureForm}
            setShowPressureForm={setShowPressureForm}
            newPressureRecord={newPressureRecord}
            setNewPressureRecord={setNewPressureRecord}
            employees={employees}
            employeeSearchTerm={employeeSearchTerm}
            setEmployeeSearchTerm={setEmployeeSearchTerm}
            showEmployeeDropdown={showEmployeeDropdown}
            setShowEmployeeDropdown={setShowEmployeeDropdown}
            addBloodPressureRecord={addBloodPressureRecord}
            deletePressureRecord={deletePressureRecord}
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

        {activeModule === 'ref' && <RefeicaoModule styles={styles} />}
        {activeModule === 'premer' && <PreMERModule employees={employees} />}
        {activeModule === 'certificados' && (
          <CertificadosModule styles={styles} />
        )}
        {activeModule === 'vacinacao' && (
          <VacinacaoModule employees={employees} styles={styles} />
        )}
        {activeModule === 'toxicologico' && (
          <ToxicologicoModule employees={employees} styles={styles} />
        )}
        {activeModule === 'atestados' && <AtestadosModule styles={styles} />}

        {activeModule === 'prontuario' && (
          <ProntuarioModule
            employees={employees}
            styles={styles}
            preEmbarqueRecords={preEmbarqueRecords}
            bloodPressureRecords={bloodPressureRecords}
            toxicologicoRecords={[]}
          />
        )}

        {/* Removido o placeholder genérico para 'emergencia' pois agora ele tem módulo próprio */}
        {activeModule !== 'dashboard' &&
          activeModule !== 'funcionarios' &&
          activeModule !== 'imc' &&
          activeModule !== 'pressao' &&
          activeModule !== 'preembarque' &&
          activeModule !== 'ref' &&
          activeModule !== 'premer' &&
          activeModule !== 'certificados' &&
          activeModule !== 'vacinacao' &&
          activeModule !== 'atestados' &&
          activeModule !== 'toxicologico' &&
          activeModule !== 'prontuario' &&
          activeModule !== 'emergencia' && (
            <div style={styles.placeholderCard}>
              <i
                className="fas fa-tools"
                style={{ fontSize: '48px', color: '#2c7da0' }}
              ></i>
              <p style={styles.placeholderText}>Módulo em desenvolvimento</p>
              <p style={styles.placeholderSubtext}>
                Em breve mais funcionalidades
              </p>
            </div>
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
