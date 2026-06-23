'use client';

import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const supabaseUrl = 'https://vkeqmejjqlaikagpwjvb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZXFtZWpqcWxhaWthZ3B3anZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTc2NTYsImV4cCI6MjA5NTk5MzY1Nn0.t05Nd5a1L1MgLg19cVus1Mq1xmpvsfgT6dKj_c7fhgE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SupabaseContextType {
  employees: any[];
  loading: boolean;
  refreshEmployees: () => Promise<void>;
  addEmployee: (employee: any) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  updateEmployee: (id: string, data: any) => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refreshEmployees() {
    setLoading(true);
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .order('codigo', { ascending: true });

    if (!error && data) {
      // Mapeia campos do banco para o frontend
      const formatted = data.map((emp: any) => ({
        id: emp.id,
        codigo: emp.codigo,
        name: emp.nome,
        cargo: emp.cargo,
        departamento: emp.departamento,
        regime: emp.regime,
        email: emp.email,
        admissao: emp.admissao,
        birthDate: emp.data_nascimento,
        height: emp.altura,
        weight: emp.peso,
        bloodPressureSystolic: emp.pressao_sistolica,
        bloodPressureDiastolic: emp.pressao_diastolica,
      }));
      setEmployees(formatted);
    }
    setLoading(false);
  }

  async function addEmployee(employee: any) {
    const { error } = await supabase.from('colaboradores').insert([{
      codigo: employee.codigo,
      nome: employee.name,
      cargo: employee.cargo,
      departamento: employee.departamento,
      regime: employee.regime,
      email: employee.email,
      admissao: employee.admissao,
      data_nascimento: employee.birthDate,
      altura: employee.height ? parseFloat(employee.height) : null,
      peso: employee.weight ? parseFloat(employee.weight) : null,
      pressao_sistolica: employee.bloodPressureSystolic ? parseInt(employee.bloodPressureSystolic) : null,
      pressao_diastolica: employee.bloodPressureDiastolic ? parseInt(employee.bloodPressureDiastolic) : null,
    }]);

    if (!error) {
      await refreshEmployees();
    } else {
      console.error('Erro ao adicionar:', error);
      alert('Erro: ' + error.message);
    }
  }

  async function deleteEmployee(id: string) {
    const { error } = await supabase.from('colaboradores').delete().eq('id', id);
    if (!error) {
      await refreshEmployees();
    } else {
      console.error('Erro ao deletar:', error);
      alert('Erro: ' + error.message);
    }
  }

  async function updateEmployee(id: string, data: any) {
    const { error } = await supabase.from('colaboradores').update(data).eq('id', id);
    if (!error) {
      await refreshEmployees();
    }
  }

  useEffect(() => {
    refreshEmployees();
  }, []);

  return (
    <SupabaseContext.Provider value={{
      employees,
      loading,
      refreshEmployees,
      addEmployee,
      deleteEmployee,
      updateEmployee,
    }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase deve ser usado dentro de SupabaseProvider');
  }
  return context;
}