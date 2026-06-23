// app/MedicationControlModule.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';

// Interfaces
interface MedicationItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  location: string;
  lastInspection: string;
  status: 'ok' | 'warning' | 'expired';
  batch?: string;
  notes?: string;
}

interface Movement {
  id: string;
  item_id: string;
  type: 'in' | 'out';
  quantity: number;
  destination?: string;
  batch?: string;
  notes?: string;
  created_at: string;
  item_name?: string;
}

interface MedicationControlModuleProps {
  styles: any;
}

// Constantes
const CATEGORIES = [
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'consumivel', label: 'Consumível' },
  { value: 'outro', label: 'Outro' },
];

const SERVICE_FRONTS = [
  'Santos Scout',
  'Saquarema',
  'PCP-1',
  'PCP-2',
  'PCP-3',
  'Base Administrativa',
  'Laboratório',
  'Farmácia',
  'Ambulatório',
  'Outro',
];

const STATUS_CONFIG = {
  ok: { background: '#d4edda', color: '#155724', label: 'OK' },
  warning: {
    background: '#fff3cd',
    color: '#856404',
    label: 'Próximo ao Vencimento',
  },
  expired: { background: '#f8d7da', color: '#721c24', label: 'Vencido' },
};

// Agrupa itens por nome
interface GroupedItem {
  name: string;
  category: string;
  location: string;
  batches: {
    batch: string;
    items: MedicationItem[];
    totalQuantity: number;
    expiryDate: string;
    status: 'ok' | 'warning' | 'expired';
  }[];
  totalQuantity: number;
  status: 'ok' | 'warning' | 'expired';
}

export default function MedicationControlModule({
  styles,
}: MedicationControlModuleProps) {
  // Estados principais
  const [items, setItems] = useState<MedicationItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'ok' | 'warning' | 'expired'
  >('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOutputModal, setShowOutputModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGeneralHistoryModal, setShowGeneralHistoryModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtros do histórico geral
  const [historyFilterType, setHistoryFilterType] = useState<
    'all' | 'in' | 'out'
  >('all');
  const [historyFilterDestination, setHistoryFilterDestination] =
    useState('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados do formulário - ADD
  const [formSearch, setFormSearch] = useState('');
  const [formSearchResults, setFormSearchResults] = useState<GroupedItem[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('medicamento');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formBatch, setFormBatch] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isExistingMedication, setIsExistingMedication] = useState(false);

  // Estado para saída
  const [outputQuantity, setOutputQuantity] = useState(1);
  const [outputDestination, setOutputDestination] = useState('');
  const [outputBatch, setOutputBatch] = useState('');
  const [outputNotes, setOutputNotes] = useState('');

  // ==================== FUNÇÕES AUXILIARES ====================
  const calculateStatus = useCallback(
    (expiryDate: string): 'ok' | 'warning' | 'expired' => {
      if (!expiryDate) return 'ok';
      const today = new Date();
      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.floor(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry < 0) return 'expired';
      if (daysUntilExpiry <= 30) return 'warning';
      return 'ok';
    },
    []
  );

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.floor(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // ==================== AGRUPAR ITENS POR NOME ====================
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: GroupedItem } = {};

    items.forEach((item) => {
      if (!groups[item.name]) {
        groups[item.name] = {
          name: item.name,
          category: item.category,
          location: item.location,
          batches: [],
          totalQuantity: 0,
          status: 'ok' as 'ok' | 'warning' | 'expired',
        };
      }

      const group = groups[item.name];
      const batchKey = item.batch || 'sem_lote';
      const existingBatch = group.batches.find((b) => b.batch === batchKey);

      if (existingBatch) {
        existingBatch.items.push(item);
        existingBatch.totalQuantity += item.quantity;
      } else {
        group.batches.push({
          batch: batchKey,
          items: [item],
          totalQuantity: item.quantity,
          expiryDate: item.expiryDate,
          status: item.status,
        });
      }

      group.totalQuantity += item.quantity;
    });

    // Calcular status geral do grupo (pior status)
    Object.values(groups).forEach((group) => {
      const hasExpired = group.batches.some((b) => b.status === 'expired');
      const hasWarning = group.batches.some((b) => b.status === 'warning');
      const hasOk = group.batches.some((b) => b.status === 'ok');

      if (hasExpired) {
        group.status = 'expired';
      } else if (hasWarning) {
        group.status = 'warning';
      } else if (hasOk) {
        group.status = 'ok';
      }
    });

    return Object.values(groups);
  }, [items]);

  // ==================== BUSCA PARA AUTOCOMPLETE NO MODAL ====================
  useEffect(() => {
    if (formSearch.length > 0) {
      const results = groupedItems.filter((group) =>
        group.name.toLowerCase().includes(formSearch.toLowerCase())
      );
      setFormSearchResults(results);
      setShowSearchDropdown(results.length > 0);
    } else {
      setFormSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [formSearch, groupedItems]);

  // ==================== SELECIONAR MEDICAMENTO DA BUSCA ====================
  const selectMedicationFromSearch = (group: GroupedItem) => {
    setFormName(group.name);
    setFormCategory(group.category);
    setFormLocation(group.location);
    setFormSearch('');
    setShowSearchDropdown(false);
    setIsExistingMedication(true);
    setSuccessMessage(
      `Medicamento "${group.name}" selecionado! Adicione um novo lote.`
    );
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ==================== LIMPAR SELEÇÃO ====================
  const clearSelection = () => {
    setFormName('');
    setFormCategory('medicamento');
    setFormLocation('');
    setFormBatch('');
    setFormExpiryDate('');
    setFormQuantity(1);
    setFormNotes('');
    setIsExistingMedication(false);
    setFormSearch('');
    setFormSearchResults([]);
    setShowSearchDropdown(false);
  };

  // ==================== CARREGAR DADOS ====================
  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('emergency_kits')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      if (data) {
        const formattedItems = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          expiryDate: item.expiry_date,
          location: item.location,
          lastInspection: item.last_inspection,
          status: calculateStatus(item.expiry_date),
          batch: item.batch,
          notes: item.notes,
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
      setError('Não foi possível carregar os medicamentos.');
    } finally {
      setLoading(false);
    }
  }, [calculateStatus]);

  const loadMovements = useCallback(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('movements')
        .select(
          `
          *,
          emergency_kits (name)
        `
        )
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      if (data) {
        const formattedMovements = data.map((mov: any) => ({
          id: mov.id,
          item_id: mov.item_id,
          type: mov.type,
          quantity: mov.quantity,
          destination: mov.destination,
          batch: mov.batch,
          notes: mov.notes,
          created_at: mov.created_at,
          item_name: mov.emergency_kits?.name || 'Item removido',
        }));
        setMovements(formattedMovements);
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadMovements();
  }, [loadItems, loadMovements]);

  // ==================== RESET FORM ====================
  const resetForm = useCallback(() => {
    setFormSearch('');
    setFormName('');
    setFormCategory('medicamento');
    setFormQuantity(1);
    setFormExpiryDate('');
    setFormLocation('');
    setFormBatch('');
    setFormNotes('');
    setIsExistingMedication(false);
    setFormSearchResults([]);
    setShowSearchDropdown(false);
    setError(null);
  }, []);

  // ==================== ADICIONAR ITEM (NOVO OU LOTE) ====================
  const handleAddItem = async () => {
    if (!formName.trim()) {
      setError('Por favor, informe o nome do medicamento.');
      return;
    }
    if (!formExpiryDate) {
      setError('Por favor, informe a data de validade.');
      return;
    }
    if (!formLocation.trim()) {
      setError('Por favor, informe a localização.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Se for um medicamento existente, verificar se o lote já existe
      if (isExistingMedication) {
        const existingItem = items.find(
          (i) =>
            i.name === formName.trim() && i.batch === (formBatch.trim() || null)
        );

        if (existingItem) {
          // Atualizar quantidade do lote existente
          const newQuantity = existingItem.quantity + formQuantity;
          const { error: updateError } = await supabase
            .from('emergency_kits')
            .update({
              quantity: newQuantity,
              expiry_date: formExpiryDate,
            })
            .eq('id', existingItem.id);

          if (updateError) throw updateError;

          const { error: movError } = await supabase.from('movements').insert([
            {
              item_id: existingItem.id,
              type: 'in',
              quantity: formQuantity,
              batch: formBatch.trim() || null,
              notes: `Adição de lote - ${formBatch.trim() || 'Sem lote'}`,
            },
          ]);

          if (movError) throw movError;

          setSuccessMessage(`Lote adicionado com sucesso a "${formName}"!`);
        } else {
          // Criar novo lote para medicamento existente
          const { data: itemData, error: insertError } = await supabase
            .from('emergency_kits')
            .insert([
              {
                name: formName.trim(),
                category: formCategory,
                quantity: formQuantity,
                expiry_date: formExpiryDate,
                location: formLocation.trim(),
                last_inspection: new Date().toISOString().split('T')[0],
                batch: formBatch.trim() || null,
                notes:
                  formNotes.trim() ||
                  `Lote adicionado - ${formBatch.trim() || 'Sem lote'}`,
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;

          if (itemData) {
            const { error: movError } = await supabase
              .from('movements')
              .insert([
                {
                  item_id: itemData.id,
                  type: 'in',
                  quantity: formQuantity,
                  batch: formBatch.trim() || null,
                  notes: `Novo lote para ${formName} - ${
                    formBatch.trim() || 'Sem lote'
                  }`,
                },
              ]);

            if (movError) throw movError;
          }

          setSuccessMessage(`Novo lote adicionado a "${formName}"!`);
        }
      } else {
        // Criar novo medicamento
        const { data: itemData, error: insertError } = await supabase
          .from('emergency_kits')
          .insert([
            {
              name: formName.trim(),
              category: formCategory,
              quantity: formQuantity,
              expiry_date: formExpiryDate,
              location: formLocation.trim(),
              last_inspection: new Date().toISOString().split('T')[0],
              batch: formBatch.trim() || null,
              notes: formNotes.trim() || null,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        if (itemData) {
          const { error: movError } = await supabase.from('movements').insert([
            {
              item_id: itemData.id,
              type: 'in',
              quantity: formQuantity,
              batch: formBatch.trim() || null,
              notes: 'Entrada inicial',
            },
          ]);

          if (movError) throw movError;
        }

        setSuccessMessage(`Medicamento "${formName}" adicionado com sucesso!`);
      }

      setTimeout(() => setSuccessMessage(null), 3000);

      resetForm();
      setShowAddModal(false);
      await loadItems();
      await loadMovements();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ==================== REGISTRAR SAÍDA ====================
  const handleOutput = async () => {
    if (!selectedItemId) return;

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    if (outputQuantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }
    if (outputQuantity > item.quantity) {
      setError(
        `Quantidade insuficiente em estoque. Disponível: ${item.quantity}`
      );
      return;
    }
    if (!outputDestination) {
      setError('Por favor, selecione a frente de serviço de destino.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const newQuantity = item.quantity - outputQuantity;
      const { error: updateError } = await supabase
        .from('emergency_kits')
        .update({
          quantity: newQuantity,
          batch: outputBatch.trim() || item.batch || null,
        })
        .eq('id', selectedItemId);

      if (updateError) throw updateError;

      const { error: movError } = await supabase.from('movements').insert([
        {
          item_id: selectedItemId,
          type: 'out',
          quantity: outputQuantity,
          destination: outputDestination,
          batch: outputBatch.trim() || item.batch || null,
          notes: outputNotes.trim() || null,
        },
      ]);

      if (movError) throw movError;

      setSuccessMessage(
        `Saída registrada com sucesso para ${outputDestination}!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);

      setOutputQuantity(1);
      setOutputDestination('');
      setOutputBatch('');
      setOutputNotes('');
      setShowOutputModal(false);
      setSelectedItemId(null);
      setSelectedBatch(null);
      await loadItems();
      await loadMovements();
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      setError('Erro ao registrar saída. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ==================== DELETAR ITEM ====================
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este medicamento?'))
      return;

    try {
      setError(null);

      const { error: movError } = await supabase
        .from('movements')
        .delete()
        .eq('item_id', id);

      if (movError) throw movError;

      const { error: deleteError } = await supabase
        .from('emergency_kits')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccessMessage('Medicamento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);

      await loadItems();
      await loadMovements();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      setError('Erro ao deletar o medicamento. Tente novamente.');
    }
  };

  // ==================== ESTATÍSTICAS ====================
  const stats = useMemo(() => {
    const total = items.length;
    const ok = items.filter((k) => k.status === 'ok').length;
    const warning = items.filter((k) => k.status === 'warning').length;
    const expired = items.filter((k) => k.status === 'expired').length;
    return { total, ok, warning, expired };
  }, [items]);

  // ==================== FILTROS ====================
  const filteredGroups = useMemo(() => {
    return groupedItems.filter((group) => {
      const matchesSearch =
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || group.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [groupedItems, searchTerm, filterStatus]);

  // ==================== MOVIMENTAÇÕES FILTRADAS ====================
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      if (historyFilterType !== 'all' && mov.type !== historyFilterType)
        return false;

      if (historyFilterDestination !== 'all') {
        if (mov.type === 'out') {
          if (mov.destination !== historyFilterDestination) return false;
        } else {
          return false;
        }
      }

      if (historyStartDate) {
        const movDate = new Date(mov.created_at).toISOString().split('T')[0];
        if (movDate < historyStartDate) return false;
      }

      if (historyEndDate) {
        const movDate = new Date(mov.created_at).toISOString().split('T')[0];
        if (movDate > historyEndDate) return false;
      }

      if (historySearchTerm) {
        const searchLower = historySearchTerm.toLowerCase();
        const itemName = (mov.item_name || '').toLowerCase();
        const dest = (mov.destination || '').toLowerCase();
        const batch = (mov.batch || '').toLowerCase();
        if (
          !itemName.includes(searchLower) &&
          !dest.includes(searchLower) &&
          !batch.includes(searchLower)
        )
          return false;
      }

      return true;
    });
  }, [
    movements,
    historyFilterType,
    historyFilterDestination,
    historyStartDate,
    historyEndDate,
    historySearchTerm,
  ]);

  // ==================== ESTATÍSTICAS DO HISTÓRICO ====================
  const historyStats = useMemo(() => {
    const total = movements.length;
    const entries = movements.filter((m) => m.type === 'in').length;
    const exits = movements.filter((m) => m.type === 'out').length;

    const itemCount: { [key: string]: number } = {};
    movements.forEach((m) => {
      const key = m.item_id;
      itemCount[key] = (itemCount[key] || 0) + m.quantity;
    });

    const topItems = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const item = items.find((i) => i.id === id);
        return { name: item?.name || 'Item removido', count };
      });

    const destCount: { [key: string]: number } = {};
    movements
      .filter((m) => m.type === 'out' && m.destination)
      .forEach((m) => {
        const dest = m.destination!;
        destCount[dest] = (destCount[dest] || 0) + m.quantity;
      });

    const topDestinations = Object.entries(destCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dest, count]) => ({ dest, count }));

    return { total, entries, exits, topItems, topDestinations };
  }, [movements, items]);

  // ==================== MOVIMENTAÇÕES DO ITEM ====================
  const itemMovements = useMemo(() => {
    if (!selectedItemId) return [];
    return movements.filter((m) => m.item_id === selectedItemId);
  }, [movements, selectedItemId]);

  // ==================== ESTILOS ====================
  const StatCard = ({ icon, value, label, color }: any) => (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'default',
        transition: 'all 0.2s ease',
        border: '1px solid #f0f0f0',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          background: color,
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          minWidth: '48px',
          minHeight: '48px',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#2c3e50' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: 600 }}>
          {label}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  // ==================== RENDERIZAÇÃO ====================
  return (
    <div style={styles.imcContainer}>
      {/* Mensagens de feedback */}
      {error && (
        <div
          style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
      {successMessage && (
        <div
          style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Header */}
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
              color: '#2c3e50',
              margin: 0,
            }}
          >
            Controle de Medicamentos BASMAC
          </h1>
          <p
            style={{ fontSize: '13px', color: '#7f8c8d', margin: '4px 0 0 0' }}
          >
            Gestão de estoque, validade e movimentações por lote
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowGeneralHistoryModal(true)}
            style={{
              background: '#3498db',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2980b9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3498db';
            }}
          >
            📊 Histórico Geral
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            style={{
              background: '#2c3e50',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a252f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2c3e50';
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            Adicionar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon="📦"
          value={stats.total}
          label="Total de Itens"
          color="#e8f0fe"
        />
        <StatCard icon="✅" value={stats.ok} label="OK" color="#e8f5e9" />
        <StatCard
          icon="⚠️"
          value={stats.warning}
          label="Próximos ao Venc."
          color="#fff3e0"
        />
        <StatCard
          icon="❌"
          value={stats.expired}
          label="Vencidos"
          color="#fce4ec"
        />
      </div>

      {/* Filtros e Busca */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar por nome, lote ou localização..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.3s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#2c3e50';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#ddd';
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">Todos os Status</option>
          <option value="ok">OK</option>
          <option value="warning">Próximo ao Vencimento</option>
          <option value="expired">Vencido</option>
        </select>
      </div>

      {/* Lista de Medicamentos Agrupados */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#2c3e50',
            margin: '0 0 16px 0',
          }}
        >
          Lista de Medicamentos
          <span
            style={{
              fontSize: '12px',
              color: '#7f8c8d',
              fontWeight: 400,
              marginLeft: '8px',
            }}
          >
            (agrupados por nome + lote)
          </span>
        </h3>

        {filteredGroups.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}
          >
            Nenhum medicamento encontrado
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredGroups.map((group) => {
              const statusStyle = STATUS_CONFIG[group.status];
              const isExpired = group.status === 'expired';

              return (
                <div
                  key={group.name}
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '16px',
                    border: isExpired
                      ? '1px solid #f5c6cb'
                      : '1px solid transparent',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Cabeçalho do grupo */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#2c3e50',
                          }}
                        >
                          {group.name}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: statusStyle.background,
                            color: statusStyle.color,
                          }}
                        >
                          {statusStyle.label}
                        </span>
                        <span style={{ fontSize: '13px', color: '#7f8c8d' }}>
                          📍 {group.location}
                        </span>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#2c3e50',
                          }}
                        >
                          Total: {group.totalQuantity}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#7f8c8d',
                            background: '#e9ecef',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {group.batches.length} lote(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Lotes */}
                  <div
                    style={{ display: 'grid', gap: '8px', paddingLeft: '16px' }}
                  >
                    {group.batches.map((batch) => {
                      const batchStatus = STATUS_CONFIG[batch.status];
                      const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                      const isBatchExpired = batch.status === 'expired';

                      return (
                        <div
                          key={batch.batch}
                          style={{
                            background: isBatchExpired ? '#fdf2f2' : '#ffffff',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            border: `1px solid ${
                              isBatchExpired ? '#f5c6cb' : '#e8ecf1'
                            }`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#2c7da0',
                                background: '#e6f3f9',
                                padding: '2px 10px',
                                borderRadius: '4px',
                              }}
                            >
                              Lote:{' '}
                              {batch.batch === 'sem_lote'
                                ? 'Sem lote'
                                : batch.batch}
                            </span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#2c3e50',
                              }}
                            >
                              Qtd: {batch.totalQuantity}
                            </span>
                            <span
                              style={{ fontSize: '12px', color: '#7f8c8d' }}
                            >
                              Validade: {formatDate(batch.expiryDate)}
                            </span>
                            {daysLeft <= 30 && daysLeft >= 0 && (
                              <span
                                style={{ fontSize: '12px', color: '#f39c12' }}
                              >
                                ⚠️ Vence em {daysLeft} dias
                              </span>
                            )}
                            {daysLeft < 0 && (
                              <span
                                style={{ fontSize: '12px', color: '#e74c3c' }}
                              >
                                ❌ Vencido há {Math.abs(daysLeft)} dias
                              </span>
                            )}
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: batchStatus.background,
                                color: batchStatus.color,
                              }}
                            >
                              {batchStatus.label}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            {batch.items.map((item) => (
                              <div
                                key={item.id}
                                style={{ display: 'flex', gap: '4px' }}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedItemId(item.id);
                                    setSelectedBatch(item.batch || null);
                                    setOutputQuantity(1);
                                    setOutputDestination('');
                                    setOutputBatch(item.batch || '');
                                    setOutputNotes('');
                                    setShowOutputModal(true);
                                  }}
                                  disabled={item.quantity <= 0}
                                  style={{
                                    padding: '4px 12px',
                                    background:
                                      item.quantity > 0 ? '#e67e22' : '#95a5a6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor:
                                      item.quantity > 0
                                        ? 'pointer'
                                        : 'not-allowed',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  Saída ({item.quantity})
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedItemId(item.id);
                                    setShowHistoryModal(true);
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    background: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  Histórico
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={{
                                    padding: '4px 12px',
                                    background: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== MODAL ADICIONAR (COM AUTOCOMPLETE INTEGRADO) ==================== */}
      {showAddModal && (
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
              setShowAddModal(false);
              setError(null);
              resetForm();
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '520px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                marginBottom: '8px',
                fontSize: '22px',
                color: '#2c3e50',
              }}
            >
              {isExistingMedication
                ? 'Adicionar Novo Lote'
                : 'Adicionar Medicamento'}
            </h2>
            <p
              style={{
                marginBottom: '20px',
                fontSize: '13px',
                color: '#7f8c8d',
              }}
            >
              {isExistingMedication
                ? `Adicione um novo lote para "${formName}"`
                : 'Preencha os dados do novo medicamento:'}
            </p>

            {/* Campo de busca com autocomplete */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                {isExistingMedication
                  ? 'Medicamento Selecionado'
                  : 'Buscar Medicamento Existente'}
              </label>

              {isExistingMedication ? (
                <div
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #27ae60',
                    fontSize: '14px',
                    background: '#e8f5e9',
                    color: '#1a5e3a',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>✅ {formName}</span>
                  <button
                    onClick={clearSelection}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e74c3c',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 600,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Digite para buscar um medicamento existente..."
                    value={formSearch}
                    onChange={(e) => {
                      setFormSearch(e.target.value);
                      if (e.target.value === '') {
                        setFormSearchResults([]);
                        setShowSearchDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (
                        formSearch.length > 0 &&
                        formSearchResults.length > 0
                      ) {
                        setShowSearchDropdown(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease',
                    }}
                  />

                  {/* Dropdown de resultados */}
                  {showSearchDropdown && formSearchResults.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1001,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        marginTop: '4px',
                      }}
                    >
                      {formSearchResults.map((result) => (
                        <div
                          key={result.name}
                          onClick={() => selectMedicationFromSearch(result)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f8ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                              {result.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                              📍 {result.location} • {result.batches.length}{' '}
                              lote(s) • Total: {result.totalQuantity}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#2c7da0',
                              fontWeight: 600,
                            }}
                          >
                            Selecionar →
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Divisor visual quando um medicamento é selecionado */}
            {isExistingMedication && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '8px 12px',
                  background: '#f0f8ff',
                  borderRadius: '8px',
                  border: '1px solid #b8d4e8',
                  fontSize: '13px',
                  color: '#2c7da0',
                }}
              >
                <strong>💡 Adicionando novo lote:</strong> Preencha os dados
                abaixo para adicionar um novo lote a este medicamento.
              </div>
            )}

            {/* Campos do formulário */}
            {!isExistingMedication && (
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#34495e',
                  }}
                >
                  Nome do Medicamento *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dipirona"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#34495e',
                  }}
                >
                  Categoria
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    background: '#f8f9fa',
                    cursor: 'pointer',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#34495e',
                  }}
                >
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formQuantity}
                  onChange={(e) =>
                    setFormQuantity(parseInt(e.target.value) || 1)
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Data de Validade *
              </label>
              <input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Número do Lote
              </label>
              <input
                type="text"
                placeholder="Ex: LOTE-2024-001"
                value={formBatch}
                onChange={(e) => setFormBatch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                }}
              />
              <small style={{ fontSize: '11px', color: '#7f8c8d' }}>
                {isExistingMedication
                  ? 'Use um lote diferente dos existentes para este medicamento'
                  : 'Se deixar em branco, será considerado "Sem lote"'}
              </small>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Localização *
              </label>
              <input
                type="text"
                placeholder="Ex: Ambulatório, Bloco A"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Observações
              </label>
              <textarea
                placeholder="Notas adicionais..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={handleAddItem}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: saving
                    ? '#95a5a6'
                    : isExistingMedication
                    ? '#2c7da0'
                    : '#2c3e50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {saving
                  ? 'Salvando...'
                  : isExistingMedication
                  ? 'Adicionar Lote'
                  : 'Adicionar'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError(null);
                  resetForm();
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
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Saída */}
      {showOutputModal && selectedItemId && (
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
              setShowOutputModal(false);
              setError(null);
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                marginBottom: '8px',
                fontSize: '22px',
                color: '#2c3e50',
              }}
            >
              Registrar Saída
            </h2>
            <p
              style={{
                marginBottom: '20px',
                fontSize: '13px',
                color: '#7f8c8d',
              }}
            >
              Informe os dados da saída do medicamento:
            </p>

            {items.find((i) => i.id === selectedItemId) && (
              <div
                style={{
                  background: '#e6f3f9',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '13px', color: '#2c7da0' }}>
                  <strong>Medicamento:</strong>{' '}
                  {items.find((i) => i.id === selectedItemId)?.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#2c7da0',
                    marginTop: '4px',
                  }}
                >
                  <strong>Lote:</strong>{' '}
                  {items.find((i) => i.id === selectedItemId)?.batch ||
                    'Sem lote'}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#2c7da0',
                    marginTop: '4px',
                  }}
                >
                  <strong>Estoque atual:</strong>{' '}
                  {items.find((i) => i.id === selectedItemId)?.quantity}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#2c7da0',
                    marginTop: '4px',
                  }}
                >
                  <strong>Validade:</strong>{' '}
                  {formatDate(
                    items.find((i) => i.id === selectedItemId)?.expiryDate || ''
                  )}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                max={items.find((i) => i.id === selectedItemId)?.quantity || 1}
                value={outputQuantity}
                onChange={(e) =>
                  setOutputQuantity(parseInt(e.target.value) || 1)
                }
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Número do Lote
              </label>
              <input
                type="text"
                placeholder="Ex: LOTE-2024-001"
                value={outputBatch}
                onChange={(e) => setOutputBatch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Frente de Serviço (Destino) *
              </label>
              <select
                value={outputDestination}
                onChange={(e) => setOutputDestination(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                }}
              >
                <option value="">Selecione...</option>
                {SERVICE_FRONTS.map((front) => (
                  <option key={front} value={front}>
                    {front}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#34495e',
                }}
              >
                Observações
              </label>
              <textarea
                placeholder="Motivo da saída, observações..."
                value={outputNotes}
                onChange={(e) => setOutputNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={handleOutput}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: saving ? '#95a5a6' : '#e67e22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {saving ? 'Salvando...' : 'Confirmar Saída'}
              </button>
              <button
                onClick={() => {
                  setShowOutputModal(false);
                  setError(null);
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
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico Individual */}
      {showHistoryModal && selectedItemId && (
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
              setShowHistoryModal(false);
              setSelectedItemId(null);
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '650px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                marginBottom: '8px',
                fontSize: '22px',
                color: '#2c3e50',
              }}
            >
              Histórico de Movimentações
            </h2>
            {items.find((i) => i.id === selectedItemId) && (
              <p
                style={{
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#7f8c8d',
                }}
              >
                Medicamento:{' '}
                <strong>
                  {items.find((i) => i.id === selectedItemId)?.name}
                </strong>
                {' • '}Lote:{' '}
                <strong>
                  {items.find((i) => i.id === selectedItemId)?.batch ||
                    'Sem lote'}
                </strong>
                {' • '}Estoque:{' '}
                <strong>
                  {items.find((i) => i.id === selectedItemId)?.quantity}
                </strong>
              </p>
            )}

            {itemMovements.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#95a5a6',
                }}
              >
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {itemMovements.map((mov) => (
                  <div
                    key={mov.id}
                    style={{
                      background: mov.type === 'in' ? '#e8f5e9' : '#fff3e0',
                      borderRadius: '8px',
                      padding: '14px',
                      borderLeft: `4px solid ${
                        mov.type === 'in' ? '#4caf50' : '#ff9800'
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#2c3e50' }}>
                          {mov.type === 'in' ? '📥 Entrada' : '📤 Saída'}
                        </span>
                        <span
                          style={{
                            marginLeft: '10px',
                            fontSize: '13px',
                            color: '#555',
                          }}
                        >
                          {mov.quantity} unidade(s)
                        </span>
                        {mov.destination && (
                          <span
                            style={{
                              marginLeft: '10px',
                              fontSize: '12px',
                              color: '#e67e22',
                            }}
                          >
                            → {mov.destination}
                          </span>
                        )}
                        {mov.batch && (
                          <span
                            style={{
                              marginLeft: '10px',
                              fontSize: '11px',
                              background: '#e3f2fd',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: '#0d47a1',
                              fontWeight: 600,
                            }}
                          >
                            Lote: {mov.batch}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#7f8c8d' }}>
                        {formatDateTime(mov.created_at)}
                      </span>
                    </div>
                    {mov.notes && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '12px',
                          color: '#7f8c8d',
                        }}
                      >
                        Obs: {mov.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedItemId(null);
                }}
                style={{
                  padding: '10px 24px',
                  background: '#2c3e50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Histórico Geral */}
      {showGeneralHistoryModal && (
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
              setShowGeneralHistoryModal(false);
              setHistoryFilterType('all');
              setHistoryFilterDestination('all');
              setHistoryStartDate('');
              setHistoryEndDate('');
              setHistorySearchTerm('');
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '900px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#2c3e50' }}>
                  📊 Histórico Geral de Movimentações
                </h2>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '13px',
                    color: '#7f8c8d',
                  }}
                >
                  Total de {historyStats.total} movimentações registradas
                </p>
              </div>
              <button
                onClick={() => {
                  setShowGeneralHistoryModal(false);
                  setHistoryFilterType('all');
                  setHistoryFilterDestination('all');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistorySearchTerm('');
                }}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#c0392b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e74c3c';
                }}
              >
                Fechar
              </button>
            </div>

            {/* Stats do Histórico */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: '#e8f5e9',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#2e7d32',
                  }}
                >
                  {historyStats.entries}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#4caf50',
                    fontWeight: 600,
                  }}
                >
                  📥 Entradas
                </div>
              </div>
              <div
                style={{
                  background: '#fff3e0',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#e65100',
                  }}
                >
                  {historyStats.exits}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#ff9800',
                    fontWeight: 600,
                  }}
                >
                  📤 Saídas
                </div>
              </div>
              <div
                style={{
                  background: '#e3f2fd',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#0d47a1',
                  }}
                >
                  {historyStats.total}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#1976d2',
                    fontWeight: 600,
                  }}
                >
                  📊 Total
                </div>
              </div>
            </div>

            {/* Top Items e Destinos */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {historyStats.topItems.length > 0 && (
                <div
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: '#2c3e50',
                    }}
                  >
                    🔝 Itens mais movimentados
                  </h4>
                  {historyStats.topItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>{item.name}</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#2c3e50',
                        }}
                      >
                        {item.count} unid.
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {historyStats.topDestinations.length > 0 && (
                <div
                  style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: '#2c3e50',
                    }}
                  >
                    🎯 Destinos mais frequentes
                  </h4>
                  {historyStats.topDestinations.map((dest, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>{dest.dest}</span>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#2c3e50',
                        }}
                      >
                        {dest.count} unid.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filtros do Histórico */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Buscar por item, lote ou destino..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Todos os tipos</option>
                <option value="in">📥 Entradas</option>
                <option value="out">📤 Saídas</option>
              </select>
              <select
                value={historyFilterDestination}
                onChange={(e) => setHistoryFilterDestination(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Todos os destinos</option>
                {SERVICE_FRONTS.map((front) => (
                  <option key={front} value={front}>
                    {front}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '13px', color: '#7f8c8d' }}>até</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => {
                  setHistoryFilterType('all');
                  setHistoryFilterDestination('all');
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                  setHistorySearchTerm('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Limpar Filtros
              </button>
            </div>

            {/* Lista de Movimentações */}
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredMovements.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#95a5a6',
                  }}
                >
                  Nenhuma movimentação encontrada com os filtros aplicados.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {filteredMovements.map((mov) => (
                    <div
                      key={mov.id}
                      style={{
                        background: mov.type === 'in' ? '#f0faf0' : '#fff8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        borderLeft: `4px solid ${
                          mov.type === 'in' ? '#4caf50' : '#ff9800'
                        }`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#2c3e50' }}>
                            {mov.type === 'in' ? '📥' : '📤'}{' '}
                            {mov.type === 'in' ? 'Entrada' : 'Saída'}
                          </span>
                          <span style={{ fontSize: '13px', color: '#555' }}>
                            {mov.quantity} unidade(s)
                          </span>
                          {mov.destination && (
                            <span
                              style={{
                                fontSize: '12px',
                                background: '#fff3e0',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: '#e65100',
                              }}
                            >
                              → {mov.destination}
                            </span>
                          )}
                          {mov.batch && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: '#e3f2fd',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: '#0d47a1',
                                fontWeight: 600,
                              }}
                            >
                              Lote: {mov.batch}
                            </span>
                          )}
                          <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            {mov.item_name}
                          </span>
                        </div>
                        {mov.notes && (
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#7f8c8d',
                              marginTop: '4px',
                            }}
                          >
                            📝 {mov.notes}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#7f8c8d',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(mov.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
