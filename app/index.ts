// app/types/index.ts
export interface Employee {
  id: string;
  codigo: string;
  name: string;
  cpf: string;
  cargo: string;
  departamento: string;
  regime: 'offshore' | 'onshore';
  email: string;
  admissao: string;
  birthDate: string;
  height: number;
  weight: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate?: number;
  temperature?: number;
  workFront?: string;
  examDate?: string;
  vaccinationStatus: any[];
  medicalCertificates: any[];
}

export interface BloodPressureRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCargo: string;
  date: string;
  workFront: string;
  temperature: number;
  systolic: number;
  diastolic: number;
  heartRate: number;
}

export interface PreEmbarqueRecord {
  id: string;
  codigo: string;
  nome: string;
  cargo: string;
  dataExame: string;
  mesReferencia: string;
  peso: number;
  altura: number;
  imc: number;
  circunferencia: number;
  status: string;
  frenteServico: string;
}

export interface MealFile {
  id: string;
  month: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: number;
  fileType: string;
}
