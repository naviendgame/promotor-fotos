import { useEffect, useRef, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook que se comporta como `useState`, mas persiste o valor em `AsyncStorage`
 * e o recupera ao montar — preferências do usuário sobrevivem a navegações
 * e reinicializações do app.
 *
 * Uso:
 *   const [filtro, setFiltro] = useEstadoPersistido("promotores:filtro", "todos");
 */
export function useEstadoPersistido<T>(
  chave: string,
  valorInicial: T,
): [T, (v: T | ((atual: T) => T)) => void] {
  const [valor, setValor] = useState<T>(valorInicial);
  const carregadoRef = useRef(false);

  // Carrega valor salvo na primeira montagem.
  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(chave)
      .then((str) => {
        if (!ativo) return;
        if (str != null) {
          try {
            const recuperado = JSON.parse(str) as T;
            setValor(recuperado);
          } catch {
            // valor corrompido — ignora e mantém o inicial
          }
        }
      })
      .catch(() => undefined)
      .finally(() => {
        carregadoRef.current = true;
      });
    return () => {
      ativo = false;
    };
  }, [chave]);

  function setValorPersistido(novo: T | ((atual: T) => T)) {
    setValor((atual) => {
      const proximo =
        typeof novo === "function"
          ? (novo as (atual: T) => T)(atual)
          : novo;
      // Persiste em background — não bloqueia a UI.
      AsyncStorage.setItem(chave, JSON.stringify(proximo)).catch(
        () => undefined,
      );
      return proximo;
    });
  }

  return [valor, setValorPersistido];
}
