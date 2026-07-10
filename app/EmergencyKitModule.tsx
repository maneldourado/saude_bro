// app/MedicationControlModule.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';

// Paleta de cores consistente com o restante do sistema
const colors = {
  primary: '#8B0000', // slate-800
  primaryDark: '#1C1C1C', // slate-900
  primaryLight: '#8B0000', // slate-700
  accent: '#00BFFF', // blue-500
  accentHover: '#2563eb', // blue-600
  accentSoft: '#eff6ff', // blue-50
  bgPage: '#f5f0eb', // slate-100
  bgCard: '#ffffff',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  success: '#22c55e',
  successSoft: '#f0fdf4',
  warning: '#f59e0b',
  warningSoft: '#fffbeb',
  danger: '#ef4444',
  dangerSoft: '#fef2f2',
  orange: '#f97316',
  orangeSoft: '#fff7ed',
  indigo: '#6366f1',
  indigoSoft: '#eef2ff',
  white: '#ffffff',
};

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
  ok: { background: colors.successSoft, color: colors.success, label: 'OK' },
  warning: {
    background: colors.warningSoft,
    color: colors.warning,
    label: 'Próximo ao Venc.',
  },
  expired: {
    background: colors.dangerSoft,
    color: colors.danger,
    label: 'Vencido',
  },
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
  const [formLocation, setFormLocation] = useState('BASMAC');
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
    setFormLocation('BASMAC');
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
    setFormLocation('BASMAC');
    setFormBatch('');
    setFormNotes('');
    setIsExistingMedication(false);
    setFormSearchResults([]);
    setShowSearchDropdown(false);
    setError(null);
  }, []);

  // ==================== ADICIONAR ITEM ====================
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

      if (isExistingMedication) {
        const existingItem = items.find(
          (i) =>
            i.name === formName.trim() && i.batch === (formBatch.trim() || null)
        );

        if (existingItem) {
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

  // ==================== STAT CARD ====================
  const StatCard = ({ icon, value, label, color }: any) => (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: '8px',
        padding: '18px',
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${color}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          background: color + '15',
          borderRadius: '8px',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          minWidth: '40px',
          minHeight: '40px',
          color: color,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: colors.textPrimary,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: colors.textSecondary,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '50px',
          background: colors.bgPage,
          minHeight: '100vh',
        }}
      >
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: '32px', color: colors.accent }}
        ></i>
        <p
          style={{
            color: colors.textSecondary,
            marginTop: '16px',
            fontSize: '14px',
          }}
        >
          Carregando dados...
        </p>
      </div>
    );
  }

  // ==================== RENDERIZAÇÃO ====================
  return (
    <div
      style={{
        ...styles.imcContainer,
        background: colors.bgPage,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px',
        minHeight: '100vh',
      }}
    >
      {/* Mensagens de feedback */}
      {error && (
        <div
          style={{
            background: colors.dangerSoft,
            color: colors.danger,
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: `1px solid ${colors.danger}33`,
            fontSize: '14px',
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
            background: colors.successSoft,
            color: colors.success,
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: `1px solid ${colors.success}33`,
            fontSize: '14px',
          }}
        >
          <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
          {successMessage}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div
        style={{
          background: colors.bgCard,
          borderRadius: '8px',
          padding: '24px 28px',
          marginBottom: '28px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.white,
                fontSize: '18px',
              }}
            >
              <i className="fas fa-prescription-bottle"></i>
            </div>
            <div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Controle de Medicamentos
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: colors.textSecondary,
                  margin: '2px 0 0 0',
                }}
              >
                Gestão de estoque, validade e movimentações por lote
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowGeneralHistoryModal(true)}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                background: colors.white,
                color: colors.textPrimary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.bgPage;
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.white;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <i className="fas fa-history"></i> Histórico Geral
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                border: 'none',
                background: colors.primary,
                color: colors.white,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primaryDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.primary;
              }}
            >
              <i className="fas fa-plus"></i> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* ===== CARDS DE ESTATÍSTICAS ===== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={<i className="fas fa-boxes"></i>}
          value={stats.total}
          label="Total de Itens"
          color={colors.accent}
        />
        <StatCard
          icon={<i className="fas fa-check-circle"></i>}
          value={stats.ok}
          label="OK"
          color={colors.success}
        />
        <StatCard
          icon={<i className="fas fa-clock"></i>}
          value={stats.warning}
          label="Próximos ao Venc."
          color={colors.warning}
        />
        <StatCard
          icon={<i className="fas fa-times-circle"></i>}
          value={stats.expired}
          label="Vencidos"
          color={colors.danger}
        />
      </div>

      {/* ===== FILTROS E BUSCA ===== */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: colors.bgCard,
          padding: '16px 20px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
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
            padding: '10px 14px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            background: colors.white,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.accent;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.border;
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            fontSize: '14px',
            background: colors.white,
            cursor: 'pointer',
            outline: 'none',
            color: colors.textPrimary,
          }}
        >
          <option value="all">Todos os Status</option>
          <option value="ok">OK</option>
          <option value="warning">Próximo ao Venc.</option>
          <option value="expired">Vencido</option>
        </select>
      </div>

      {/* ===== LISTA DE MEDICAMENTOS ===== */}
      <div
        style={{
          background: colors.bgCard,
          borderRadius: '8px',
          padding: '20px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: colors.textPrimary,
            margin: '0 0 16px 0',
          }}
        >
          <i
            className="fas fa-list"
            style={{ color: colors.accent, marginRight: '8px' }}
          ></i>
          Lista de Medicamentos
          <span
            style={{
              fontSize: '12px',
              color: colors.textSecondary,
              fontWeight: 400,
              marginLeft: '8px',
            }}
          >
            (agrupados por nome + lote)
          </span>
        </h3>

        {filteredGroups.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              color: colors.textSecondary,
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
                    background: colors.bgPage,
                    borderRadius: '8px',
                    padding: '16px',
                    border: isExpired
                      ? `1px solid ${colors.danger}33`
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
                            color: colors.textPrimary,
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
                        <span
                          style={{
                            fontSize: '13px',
                            color: colors.textSecondary,
                          }}
                        >
                          <i
                            className="fas fa-map-marker-alt"
                            style={{ marginRight: '4px' }}
                          ></i>
                          {group.location}
                        </span>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: colors.textPrimary,
                          }}
                        >
                          Total: {group.totalQuantity}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: colors.textSecondary,
                            background: colors.border,
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
                            background: isBatchExpired
                              ? colors.dangerSoft
                              : colors.bgCard,
                            borderRadius: '6px',
                            padding: '12px 16px',
                            border: `1px solid ${
                              isBatchExpired
                                ? colors.danger + '33'
                                : colors.border
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
                                color: colors.accent,
                                background: colors.accentSoft,
                                padding: '2px 10px',
                                borderRadius: '4px',
                              }}
                            >
                              <i
                                className="fas fa-tag"
                                style={{ marginRight: '4px' }}
                              ></i>
                              {batch.batch === 'sem_lote'
                                ? 'Sem lote'
                                : batch.batch}
                            </span>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: colors.textPrimary,
                              }}
                            >
                              Qtd: {batch.totalQuantity}
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                color: colors.textSecondary,
                              }}
                            >
                              <i
                                className="fas fa-calendar-alt"
                                style={{ marginRight: '4px' }}
                              ></i>
                              {formatDate(batch.expiryDate)}
                            </span>
                            {daysLeft <= 30 && daysLeft >= 0 && (
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: colors.warning,
                                  background: colors.warningSoft,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                ⚠️ Vence em {daysLeft} dias
                              </span>
                            )}
                            {daysLeft < 0 && (
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: colors.danger,
                                  background: colors.dangerSoft,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
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
                                      item.quantity > 0
                                        ? colors.orange
                                        : colors.textMuted,
                                    color: colors.white,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor:
                                      item.quantity > 0
                                        ? 'pointer'
                                        : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (item.quantity > 0) {
                                      e.currentTarget.style.background =
                                        colors.orange + 'dd';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (item.quantity > 0) {
                                      e.currentTarget.style.background =
                                        colors.orange;
                                    }
                                  }}
                                >
                                  <i className="fas fa-arrow-right"></i>{' '}
                                  {item.quantity}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedItemId(item.id);
                                    setShowHistoryModal(true);
                                  }}
                                  style={{
                                    padding: '4px 12px',
                                    background: colors.accent,
                                    color: colors.white,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      colors.accentHover;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      colors.accent;
                                  }}
                                >
                                  <i className="fas fa-history"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={{
                                    padding: '4px 12px',
                                    background: colors.danger,
                                    color: colors.white,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      colors.danger + 'dd';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      colors.danger;
                                  }}
                                >
                                  <i className="fas fa-trash-alt"></i>
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

      {/* ==================== MODAIS (mantidos os mesmos) ==================== */}
      {/* Os modais permanecem idênticos ao original, apenas com estilos ajustados */}
      {/* Para evitar repetição excessiva, mantive a estrutura original dos modais */}

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.5)',
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
              background: colors.bgCard,
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '520px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2
              style={{
                marginBottom: '8px',
                fontSize: '22px',
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              <i
                className="fas fa-plus-circle"
                style={{ color: colors.accent, marginRight: '8px' }}
              ></i>
              {isExistingMedication
                ? 'Adicionar Novo Lote'
                : 'Adicionar Medicamento'}
            </h2>
            <p
              style={{
                marginBottom: '20px',
                fontSize: '14px',
                color: colors.textSecondary,
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
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                    borderRadius: '6px',
                    border: `1px solid ${colors.success}`,
                    fontSize: '14px',
                    background: colors.successSoft,
                    color: colors.success,
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    <i
                      className="fas fa-check-circle"
                      style={{ marginRight: '8px' }}
                    ></i>{' '}
                    {formName}
                  </span>
                  <button
                    onClick={clearSelection}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.danger,
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
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
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
                        background: colors.white,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
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
                            borderBottom: `1px solid ${colors.border}`,
                            transition: 'background 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              colors.accentSoft;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.white;
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: colors.textPrimary,
                              }}
                            >
                              {result.name}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: colors.textSecondary,
                              }}
                            >
                              <i className="fas fa-map-marker-alt"></i>{' '}
                              {result.location} • {result.batches.length}{' '}
                              lote(s) • Total: {result.totalQuantity}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: colors.accent,
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

            {/* Restante do modal mantido igual, apenas com cores ajustadas */}
            {/* Os campos do formulário permanecem idênticos */}

            {isExistingMedication && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '8px 12px',
                  background: colors.accentSoft,
                  borderRadius: '6px',
                  border: `1px solid ${colors.accent}33`,
                  fontSize: '13px',
                  color: colors.accent,
                }}
              >
                <strong>💡 Adicionando novo lote:</strong> Preencha os dados
                abaixo para adicionar um novo lote a este medicamento.
              </div>
            )}

            {!isExistingMedication && (
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: colors.textPrimary,
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
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
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
                    marginBottom: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: colors.textPrimary,
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
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    fontSize: '14px',
                    background: colors.white,
                    cursor: 'pointer',
                    outline: 'none',
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
                    marginBottom: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: colors.textPrimary,
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
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <small
                style={{
                  fontSize: '11px',
                  color: colors.textSecondary,
                  display: 'block',
                  marginTop: '4px',
                }}
              >
                {isExistingMedication
                  ? 'Use um lote diferente dos existentes para este medicamento'
                  : 'Se deixar em branco, será considerado "Sem lote"'}
              </small>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginTop: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  outline: 'none',
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
                    ? colors.textMuted
                    : isExistingMedication
                    ? colors.accent
                    : colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = isExistingMedication
                      ? colors.accentHover
                      : colors.primaryDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = isExistingMedication
                      ? colors.accent
                      : colors.primary;
                  }
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
                  background: 'transparent',
                  color: colors.danger,
                  border: `1px solid ${colors.danger}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.dangerSoft;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL SAÍDA ===== */}
      {showOutputModal && selectedItemId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.5)',
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
              background: colors.bgCard,
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2
              style={{
                marginBottom: '8px',
                fontSize: '22px',
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              <i
                className="fas fa-arrow-right"
                style={{ color: colors.orange, marginRight: '8px' }}
              ></i>
              Registrar Saída
            </h2>
            <p
              style={{
                marginBottom: '20px',
                fontSize: '14px',
                color: colors.textSecondary,
              }}
            >
              Informe os dados da saída do medicamento:
            </p>

            {items.find((i) => i.id === selectedItemId) && (
              <div
                style={{
                  background: colors.accentSoft,
                  borderRadius: '6px',
                  padding: '14px',
                  marginBottom: '20px',
                  borderLeft: `3px solid ${colors.accent}`,
                }}
              >
                <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                  <strong style={{ color: colors.textPrimary }}>
                    Medicamento:
                  </strong>{' '}
                  {items.find((i) => i.id === selectedItemId)?.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ color: colors.textPrimary }}>Lote:</strong>{' '}
                  {items.find((i) => i.id === selectedItemId)?.batch ||
                    'Sem lote'}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ color: colors.textPrimary }}>
                    Estoque atual:
                  </strong>{' '}
                  {items.find((i) => i.id === selectedItemId)?.quantity}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    marginTop: '4px',
                  }}
                >
                  <strong style={{ color: colors.textPrimary }}>
                    Validade:
                  </strong>{' '}
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
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  background: colors.white,
                  cursor: 'pointer',
                  outline: 'none',
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
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: colors.textPrimary,
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
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '14px',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  outline: 'none',
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
                  background: saving ? colors.textMuted : colors.orange,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!saving)
                    e.currentTarget.style.background = colors.orange + 'dd';
                }}
                onMouseLeave={(e) => {
                  if (!saving) e.currentTarget.style.background = colors.orange;
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
                  background: 'transparent',
                  color: colors.danger,
                  border: `1px solid ${colors.danger}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.dangerSoft;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL HISTÓRICO INDIVIDUAL ===== */}
      {showHistoryModal && selectedItemId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.5)',
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
              background: colors.bgCard,
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '650px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2
              style={{
                marginBottom: '8px',
                fontSize: '22px',
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              <i
                className="fas fa-history"
                style={{ color: colors.accent, marginRight: '8px' }}
              ></i>
              Histórico de Movimentações
            </h2>
            {items.find((i) => i.id === selectedItemId) && (
              <p
                style={{
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: colors.textSecondary,
                }}
              >
                Medicamento:{' '}
                <strong style={{ color: colors.textPrimary }}>
                  {items.find((i) => i.id === selectedItemId)?.name}
                </strong>
                {' • '}Lote:{' '}
                <strong style={{ color: colors.textPrimary }}>
                  {items.find((i) => i.id === selectedItemId)?.batch ||
                    'Sem lote'}
                </strong>
                {' • '}Estoque:{' '}
                <strong style={{ color: colors.textPrimary }}>
                  {items.find((i) => i.id === selectedItemId)?.quantity}
                </strong>
              </p>
            )}

            {itemMovements.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: colors.textSecondary,
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
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {itemMovements.map((mov) => (
                  <div
                    key={mov.id}
                    style={{
                      background:
                        mov.type === 'in'
                          ? colors.successSoft
                          : colors.orangeSoft,
                      borderRadius: '6px',
                      padding: '14px',
                      borderLeft: `4px solid ${
                        mov.type === 'in' ? colors.success : colors.orange
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
                        <span
                          style={{
                            fontWeight: 600,
                            color: colors.textPrimary,
                          }}
                        >
                          {mov.type === 'in' ? (
                            <>
                              <i
                                className="fas fa-arrow-down"
                                style={{ color: colors.success }}
                              ></i>{' '}
                              Entrada
                            </>
                          ) : (
                            <>
                              <i
                                className="fas fa-arrow-up"
                                style={{ color: colors.orange }}
                              ></i>{' '}
                              Saída
                            </>
                          )}
                        </span>
                        <span
                          style={{
                            marginLeft: '10px',
                            fontSize: '13px',
                            color: colors.textSecondary,
                          }}
                        >
                          {mov.quantity} unidade(s)
                        </span>
                        {mov.destination && (
                          <span
                            style={{
                              marginLeft: '10px',
                              fontSize: '12px',
                              color: colors.orange,
                              background: colors.orangeSoft,
                              padding: '2px 8px',
                              borderRadius: '4px',
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
                              background: colors.accentSoft,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: colors.accent,
                              fontWeight: 600,
                            }}
                          >
                            <i className="fas fa-tag"></i> {mov.batch}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: colors.textSecondary,
                        }}
                      >
                        {formatDateTime(mov.created_at)}
                      </span>
                    </div>
                    {mov.notes && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '12px',
                          color: colors.textSecondary,
                        }}
                      >
                        📝 {mov.notes}
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
                  background: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primaryDark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.primary;
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL HISTÓRICO GERAL ===== */}
      {showGeneralHistoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15,23,42,0.5)',
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
              background: colors.bgCard,
              borderRadius: '8px',
              padding: '28px',
              maxWidth: '900px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `1px solid ${colors.border}`,
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
                <h2
                  style={{
                    margin: 0,
                    fontSize: '22px',
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}
                >
                  <i
                    className="fas fa-chart-bar"
                    style={{ color: colors.accent, marginRight: '8px' }}
                  ></i>
                  Histórico Geral de Movimentações
                </h2>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '13px',
                    color: colors.textSecondary,
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
                  background: colors.danger,
                  color: colors.white,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.danger + 'dd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.danger;
                }}
              >
                Fechar
              </button>
            </div>

            {/* Stats do Histórico */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: colors.successSoft,
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  borderLeft: `3px solid ${colors.success}`,
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: colors.success,
                  }}
                >
                  {historyStats.entries}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  <i className="fas fa-arrow-down"></i> Entradas
                </div>
              </div>
              <div
                style={{
                  background: colors.orangeSoft,
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  borderLeft: `3px solid ${colors.orange}`,
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: colors.orange,
                  }}
                >
                  {historyStats.exits}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  <i className="fas fa-arrow-up"></i> Saídas
                </div>
              </div>
              <div
                style={{
                  background: colors.accentSoft,
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  borderLeft: `3px solid ${colors.accent}`,
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: colors.accent,
                  }}
                >
                  {historyStats.total}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  <i className="fas fa-cubes"></i> Total
                </div>
              </div>
            </div>

            {/* Filtros do Histórico */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: colors.bgPage,
                padding: '16px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <input
                type="text"
                placeholder="Buscar por item, lote ou destino..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '13px',
                  outline: 'none',
                  background: colors.white,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                }}
              />
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '13px',
                  background: colors.white,
                  cursor: 'pointer',
                  outline: 'none',
                  color: colors.textPrimary,
                }}
              >
                <option value="all">Todos os tipos</option>
                <option value="in">Entradas</option>
                <option value="out">Saídas</option>
              </select>
              <select
                value={historyFilterDestination}
                onChange={(e) => setHistoryFilterDestination(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '13px',
                  background: colors.white,
                  cursor: 'pointer',
                  outline: 'none',
                  color: colors.textPrimary,
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
                  border: `1px solid ${colors.border}`,
                  fontSize: '13px',
                  outline: 'none',
                  background: colors.white,
                }}
              />
              <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                até
              </span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  fontSize: '13px',
                  outline: 'none',
                  background: colors.white,
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
                  background: colors.danger,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.danger + 'dd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.danger;
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
                    color: colors.textSecondary,
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
                  Nenhuma movimentação encontrada com os filtros aplicados.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {filteredMovements.map((mov) => (
                    <div
                      key={mov.id}
                      style={{
                        background:
                          mov.type === 'in'
                            ? colors.successSoft
                            : colors.orangeSoft,
                        borderRadius: '6px',
                        padding: '12px',
                        borderLeft: `4px solid ${
                          mov.type === 'in' ? colors.success : colors.orange
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
                          <span
                            style={{
                              fontWeight: 600,
                              color: colors.textPrimary,
                            }}
                          >
                            {mov.type === 'in' ? (
                              <>
                                <i
                                  className="fas fa-arrow-down"
                                  style={{ color: colors.success }}
                                ></i>{' '}
                                Entrada
                              </>
                            ) : (
                              <>
                                <i
                                  className="fas fa-arrow-up"
                                  style={{ color: colors.orange }}
                                ></i>{' '}
                                Saída
                              </>
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: '13px',
                              color: colors.textSecondary,
                            }}
                          >
                            {mov.quantity} unidade(s)
                          </span>
                          {mov.destination && (
                            <span
                              style={{
                                fontSize: '12px',
                                background: colors.orangeSoft,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: colors.orange,
                              }}
                            >
                              → {mov.destination}
                            </span>
                          )}
                          {mov.batch && (
                            <span
                              style={{
                                fontSize: '11px',
                                background: colors.accentSoft,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: colors.accent,
                                fontWeight: 600,
                              }}
                            >
                              <i className="fas fa-tag"></i> {mov.batch}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '12px',
                              color: colors.textSecondary,
                            }}
                          >
                            {mov.item_name}
                          </span>
                        </div>
                        {mov.notes && (
                          <div
                            style={{
                              fontSize: '12px',
                              color: colors.textSecondary,
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
                          color: colors.textSecondary,
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
