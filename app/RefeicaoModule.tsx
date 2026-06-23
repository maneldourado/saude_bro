// app/components/RefeicaoModule.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';

interface MealFile {
  id: string;
  month: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: number;
  fileType: string;
  colaborador_id?: string;
  colaborador_nome?: string;
  created_at?: string;
}

interface RefeicaoModuleProps {
  styles?: any;
  employees?: any[];
}

// Cores consistentes
const accentColor = '#10b981';
const accentGlow = 'rgba(16, 185, 129, 0.15)';
const bgCard = '#ffffff';
const cardBorder = 'rgba(0, 0, 0, 0.08)';
const textPrimary = '#1a1a1a';
const textSecondary = '#6b5f55';

export default function RefeicaoModule({
  styles = {},
  employees = [],
}: RefeicaoModuleProps) {
  const [mealFiles, setMealFiles] = useState<MealFile[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<string>('');

  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Setar mês atual
  useEffect(() => {
    const mesAtual = months[new Date().getMonth()];
    setSelectedMonth(mesAtual);
  }, []);

  // ==================== CARREGAR ARQUIVOS DO SUPABASE ====================
  const carregarArquivos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('refeicao_arquivos')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      if (data) {
        const formattedFiles: MealFile[] = data.map((item: any) => ({
          id: item.id.toString(),
          month: item.mes,
          fileName: item.nome_arquivo,
          fileUrl: item.url_arquivo,
          uploadDate: new Date(item.created_at).toLocaleDateString('pt-BR'),
          fileSize: item.tamanho || 0,
          fileType: item.tipo_arquivo || 'application/pdf',
          colaborador_id: item.colaborador_id,
          colaborador_nome: item.colaborador_nome,
          created_at: item.created_at,
        }));
        setMealFiles(formattedFiles);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      setError('Erro ao carregar arquivos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarArquivos();
  }, []);

  // ==================== FUNÇÕES AUXILIARES ====================
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('image')) return 'fa-file-image';
    if (type.includes('word')) return 'fa-file-word';
    if (type.includes('excel') || type.includes('sheet'))
      return 'fa-file-excel';
    return 'fa-file';
  };

  const getFileColor = (type: string): string => {
    if (type.includes('pdf')) return '#e74c3c';
    if (type.includes('image')) return '#2ecc71';
    if (type.includes('word')) return '#3498db';
    if (type.includes('excel') || type.includes('sheet')) return '#27ae60';
    return '#7f8c8d';
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // ==================== UPLOAD PARA SUPABASE (MESMO DO CERTIFICADOS) ====================
  const handleFileUpload = async (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload para Storage (mesmo bucket do Certificados)
      const fileName = `refeicao_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('certificados') // Usando o mesmo bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('certificados')
        .getPublicUrl(fileName);

      // Salvar no banco
      const novoRegistro = {
        mes: selectedMonth,
        nome_arquivo: file.name,
        url_arquivo: urlData.publicUrl,
        tipo_arquivo: file.type,
        tamanho: file.size,
        colaborador_id: selectedColaborador || null,
        colaborador_nome:
          employees.find(
            (e: any) =>
              e.id?.toString() === selectedColaborador ||
              e.codigo?.toString() === selectedColaborador
          )?.name || null,
      };

      const { data, error: insertError } = await supabase
        .from('refeicao_arquivos')
        .insert([novoRegistro])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        const newFile: MealFile = {
          id: data[0].id.toString(),
          month: data[0].mes,
          fileName: data[0].nome_arquivo,
          fileUrl: data[0].url_arquivo,
          uploadDate: new Date().toLocaleDateString('pt-BR'),
          fileSize: data[0].tamanho || 0,
          fileType: data[0].tipo_arquivo || file.type,
          colaborador_id: data[0].colaborador_id,
          colaborador_nome: data[0].colaborador_nome,
          created_at: data[0].created_at,
        };
        setMealFiles([newFile, ...mealFiles]);
      }

      setSuccessMessage(`Arquivo "${file.name}" anexado com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3000);

      setShowUploadModal(false);
      setSelectedColaborador('');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setError('Erro ao fazer upload: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==================== DELETAR ARQUIVO ====================
  const deleteMealFile = async (id: string) => {
    if (!confirm('Remover arquivo permanentemente?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('refeicao_arquivos')
        .delete()
        .eq('id', parseInt(id));

      if (deleteError) throw deleteError;

      setMealFiles(mealFiles.filter((f) => f.id !== id));
      setSuccessMessage('Arquivo removido com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Erro ao deletar:', error);
      setError('Erro ao deletar arquivo: ' + error.message);
    }
  };

  // ==================== DRAG & DROP ====================
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
    e.target.value = '';
  };

  // ==================== ESTATÍSTICAS ====================
  const stats = useMemo(() => {
    const totalArquivos = mealFiles.length;
    const mesesComArquivos = new Set(mealFiles.map((f) => f.month)).size;
    const totalBytes = mealFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    const arquivosMesAtual = mealFiles.filter(
      (f) => f.month === selectedMonth
    ).length;
    return { totalArquivos, mesesComArquivos, totalBytes, arquivosMesAtual };
  }, [mealFiles, selectedMonth]);

  const statsPorMes = useMemo(() => {
    return months.map((month) => ({
      month,
      count: mealFiles.filter((f) => f.month === month).length,
    }));
  }, [mealFiles]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '40px', color: accentColor }}
        ></i>
        <p style={{ marginTop: '16px', color: textSecondary }}>
          Carregando arquivos...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ padding: '24px', background: 'transparent', minHeight: '100vh' }}
    >
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
              fontWeight: 800,
              color: textPrimary,
              margin: 0,
              letterSpacing: '-0.5px',
            }}
          >
            <i
              className="fas fa-utensils"
              style={{ marginRight: '12px', color: accentColor }}
            ></i>
            Controle de Refeição
          </h1>
          <p
            style={{
              color: textSecondary,
              fontSize: '14px',
              margin: '4px 0 0 0',
              fontWeight: 500,
            }}
          >
            Gestão de documentos e comprovantes de refeição
          </p>
        </div>
        <button
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: `0 4px 15px ${accentGlow}`,
            transition: 'all 0.3s ease',
          }}
          onClick={() => setShowUploadModal(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 20px ${accentGlow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 15px ${accentGlow}`;
          }}
        >
          <i className="fas fa-upload"></i> Anexar Arquivo
        </button>
      </div>

      {/* STATS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
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
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              minWidth: '56px',
              minHeight: '56px',
              color: accentColor,
            }}
          >
            <i className="fas fa-file-alt"></i>
          </div>
          <div>
            <div
              style={{ fontSize: '28px', fontWeight: 800, color: textPrimary }}
            >
              {stats.totalArquivos}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              Total de Arquivos
            </div>
          </div>
        </div>

        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
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
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              minWidth: '56px',
              minHeight: '56px',
              color: '#3b82f6',
            }}
          >
            <i className="fas fa-folder-open"></i>
          </div>
          <div>
            <div
              style={{ fontSize: '28px', fontWeight: 800, color: textPrimary }}
            >
              {stats.arquivosMesAtual}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              Arquivos em {selectedMonth}
            </div>
          </div>
        </div>

        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
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
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              minWidth: '56px',
              minHeight: '56px',
              color: '#8b5cf6',
            }}
          >
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <div
              style={{ fontSize: '28px', fontWeight: 800, color: textPrimary }}
            >
              {stats.mesesComArquivos}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              Meses com Arquivos
            </div>
          </div>
        </div>

        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            transition: 'all 0.2s ease',
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
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              minWidth: '56px',
              minHeight: '56px',
              color: accentColor,
            }}
          >
            <i className="fas fa-database"></i>
          </div>
          <div>
            <div
              style={{ fontSize: '28px', fontWeight: 800, color: textPrimary }}
            >
              {formatFileSize(stats.totalBytes)}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: textSecondary,
                fontWeight: 600,
              }}
            >
              Espaço Utilizado
            </div>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
        }}
      >
        {/* DISTRIBUIÇÃO POR MÊS */}
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${cardBorder}`,
            }}
          >
            <i
              className="fas fa-chart-bar"
              style={{ color: accentColor, fontSize: '20px' }}
            ></i>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
              }}
            >
              Distribuição por Mês
            </h3>
          </div>
          <div>
            {statsPorMes.map(({ month, count }) => {
              const maxCount = Math.max(...statsPorMes.map((m) => m.count), 1);
              const percentual = (count / maxCount) * 100;
              const isSelected = month === selectedMonth;
              return (
                <div key={month} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i
                        className={`fas ${
                          isSelected ? 'fa-circle' : 'fa-circle-o'
                        }`}
                        style={{
                          color: isSelected ? accentColor : '#d1d5db',
                          fontSize: '10px',
                        }}
                      ></i>
                      {month}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isSelected ? accentColor : textPrimary,
                      }}
                    >
                      {count} arquivo{count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: '#f0ebe6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percentual}%`,
                        height: '100%',
                        background: isSelected ? accentColor : '#8b5cf6',
                        borderRadius: '6px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SELEÇÃO DE MÊS */}
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${cardBorder}`,
            }}
          >
            <i
              className="fas fa-calendar-alt"
              style={{ color: '#3b82f6', fontSize: '20px' }}
            ></i>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
              }}
            >
              Selecionar Mês
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {months.map((month) => {
              const count = mealFiles.filter((f) => f.month === month).length;
              const isSelected = month === selectedMonth;
              return (
                <div
                  key={month}
                  style={{
                    padding: '12px',
                    background: isSelected
                      ? 'rgba(16, 185, 129, 0.05)'
                      : '#f8f5f2',
                    borderRadius: '12px',
                    border: isSelected
                      ? `2px solid ${accentColor}`
                      : `1px solid ${cardBorder}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                  onClick={() => setSelectedMonth(month)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f8f5f2';
                    }
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: textSecondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}
                  >
                    {month.substring(0, 3)}
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: isSelected ? accentColor : textPrimary,
                    }}
                  >
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ARQUIVOS DO MÊS SELECIONADO */}
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${cardBorder}`,
            }}
          >
            <i
              className="fas fa-folder-open"
              style={{ color: '#f59e0b', fontSize: '20px' }}
            ></i>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
              }}
            >
              Arquivos de {selectedMonth}
            </h3>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {mealFiles.filter((f) => f.month === selectedMonth).length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: textSecondary,
                  padding: '20px',
                  fontSize: '14px',
                }}
              >
                <i
                  className="fas fa-inbox"
                  style={{
                    fontSize: '24px',
                    display: 'block',
                    marginBottom: '8px',
                    opacity: 0.5,
                  }}
                ></i>
                Nenhum arquivo anexado para {selectedMonth}
              </div>
            ) : (
              mealFiles
                .filter((f) => f.month === selectedMonth)
                .map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#f8f5f2',
                      borderRadius: '12px',
                      border: `1px solid ${cardBorder}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '14px',
                          color: textPrimary,
                        }}
                      >
                        <i
                          className={`fas ${getFileIcon(file.fileType)}`}
                          style={{
                            color: getFileColor(file.fileType),
                            marginRight: '8px',
                          }}
                        ></i>
                        {file.fileName.length > 30
                          ? file.fileName.substring(0, 27) + '...'
                          : file.fileName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: textSecondary,
                          marginTop: '2px',
                        }}
                      >
                        {formatFileSize(file.fileSize)} • {file.uploadDate}
                        {file.colaborador_nome && (
                          <>
                            {' '}
                            • <i className="fas fa-user"></i>{' '}
                            {file.colaborador_nome}
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={file.fileUrl}
                        download={file.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: accentColor,
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'rgba(16, 185, 129, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'rgba(16, 185, 129, 0.12)';
                        }}
                      >
                        <i className="fas fa-download"></i>
                      </a>
                      <button
                        onClick={() => deleteMealFile(file.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'rgba(239, 68, 68, 0.12)';
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
            )}
            {mealFiles.filter((f) => f.month === selectedMonth).length ===
              0 && (
              <button
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 15px ${accentGlow}`,
                  transition: 'all 0.3s ease',
                  width: '100%',
                  marginTop: '8px',
                }}
                onClick={() => setShowUploadModal(true)}
              >
                <i className="fas fa-plus"></i> Anexar arquivo
              </button>
            )}
          </div>
        </div>

        {/* RESUMO ANUAL */}
        <div
          style={{
            background: bgCard,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${cardBorder}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${cardBorder}`,
            }}
          >
            <i
              className="fas fa-chart-line"
              style={{ color: '#8b5cf6', fontSize: '20px' }}
            ></i>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: textPrimary,
                margin: 0,
              }}
            >
              Resumo Anual
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {months.map((month) => {
              const count = mealFiles.filter((f) => f.month === month).length;
              const isSelected = month === selectedMonth;
              return (
                <div
                  key={month}
                  style={{
                    padding: '12px',
                    background: isSelected
                      ? 'rgba(16, 185, 129, 0.05)'
                      : '#f8f5f2',
                    borderRadius: '12px',
                    border: isSelected
                      ? `2px solid ${accentColor}`
                      : `1px solid ${cardBorder}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                  onClick={() => setSelectedMonth(month)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f8f5f2';
                    }
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      color: textSecondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}
                  >
                    {month.substring(0, 3)}
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: isSelected ? accentColor : textPrimary,
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      height: '4px',
                      background: '#f0ebe6',
                      borderRadius: '100px',
                      marginTop: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, count * 20)}%`,
                        height: '100%',
                        background: isSelected ? accentColor : '#8b5cf6',
                        borderRadius: '100px',
                        transition: 'width 0.8s ease',
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE UPLOAD */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              background: bgCard,
              borderRadius: '20px',
              width: '550px',
              maxWidth: '90%',
              boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
              border: `1px solid ${cardBorder}`,
              overflow: 'hidden',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 28px',
                borderBottom: `1px solid ${cardBorder}`,
                background: 'rgba(0,0,0,0.02)',
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
                  className="fas fa-upload"
                  style={{ marginRight: '8px', color: accentColor }}
                ></i>
                Anexar Arquivo - {selectedMonth}
              </h3>
              <button
                style={{
                  background: 'rgba(0, 0, 0, 0.03)',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: textSecondary,
                  fontSize: '18px',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setShowUploadModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: '28px' }}>
              {/* Selecionar colaborador (opcional) */}
              {employees && employees.length > 0 && (
                <>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <i className="fas fa-user"></i> Colaborador (opcional)
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: `1px solid ${cardBorder}`,
                      fontSize: '14px',
                      color: textPrimary,
                      background: 'rgba(0,0,0,0.02)',
                      marginBottom: '16px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    value={selectedColaborador}
                    onChange={(e) => setSelectedColaborador(e.target.value)}
                  >
                    <option value="">-- Selecione um colaborador --</option>
                    {employees.map((emp: any) => (
                      <option
                        key={emp.id || emp.codigo}
                        value={emp.id?.toString() || emp.codigo?.toString()}
                      >
                        {emp.name || emp.nome} - {emp.cargo || ''}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div
                style={{
                  border: `2px dashed ${dragActive ? accentColor : cardBorder}`,
                  borderRadius: '20px',
                  padding: '40px 32px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  background: dragActive
                    ? `rgba(16, 185, 129, 0.05)`
                    : 'rgba(0, 0, 0, 0.01)',
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <i
                  className="fas fa-cloud-upload-alt"
                  style={{
                    fontSize: '56px',
                    color: accentColor,
                    marginBottom: '20px',
                  }}
                ></i>
                <p style={{ fontWeight: 600, color: textPrimary }}>
                  Arraste e solte seu arquivo aqui
                </p>
                <p
                  style={{
                    color: textSecondary,
                    margin: '12px 0',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  ou
                </p>
                <label
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, #059669 100%)`,
                    color: 'white',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'inline-block',
                    marginTop: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Selecione um arquivo
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  />
                </label>
                <p
                  style={{
                    fontSize: '11px',
                    color: textSecondary,
                    marginTop: '20px',
                    fontWeight: 500,
                  }}
                >
                  <i className="fas fa-info-circle"></i> Formatos: PDF, JPEG,
                  PNG, DOC, DOCX, XLS, XLSX (Max 10MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
