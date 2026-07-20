// app/hooks/useModulosPermitidos.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// MÓDULOS DISPONÍVEIS
const MODULOS_DISPONIVEIS = [
  'dashboard',
  'funcionarios',
  'premer',
  'imc',
  'preembarque',
  'refeicao',
  'prontuario',
];

// MÓDULOS PADRÃO (se o usuário não tiver permissão definida)
const MODULOS_PADRAO = MODULOS_DISPONIVEIS;

export function useModulosPermitidos(email: string | null) {
  const [modulos, setModulos] = useState<string[]>(MODULOS_PADRAO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!email) {
        setModulos(MODULOS_PADRAO);
        setLoading(false);
        return;
      }

      try {
        // Buscar permissões na tabela colaboradores
        const { data, error } = await supabase
          .from('colaboradores')
          .select('modulos_permitidos')
          .eq('email', email)
          .maybeSingle();

        if (
          !error &&
          data?.modulos_permitidos &&
          Array.isArray(data.modulos_permitidos)
        ) {
          const modulosValidos = data.modulos_permitidos.filter((m) =>
            MODULOS_DISPONIVEIS.includes(m)
          );
          setModulos(
            modulosValidos.length > 0 ? modulosValidos : MODULOS_PADRAO
          );
        } else {
          setModulos(MODULOS_PADRAO);
        }
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setModulos(MODULOS_PADRAO);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [email]);

  const temModulo = (modulo: string): boolean => {
    return modulos.includes(modulo);
  };

  return { modulos, temModulo, loading };
}
