import {
  addDoc,
  collection,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { DadosNovaOcorrenciaEstoque } from "@/types/ocorrencia-estoque";

import { db } from "./firebaseConfig";

export function ocorrenciasEstoqueCollection() {
  return collection(db, "ocorrencias_estoque");
}

export function consultaOcorrenciasEstoqueOrdenadas() {
  return query(ocorrenciasEstoqueCollection(), orderBy("criadoEm", "desc"));
}

export function consultaOcorrenciasDoPromotor(promotorId: string) {
  return query(
    ocorrenciasEstoqueCollection(),
    where("promotorId", "==", promotorId),
    orderBy("criadoEm", "desc"),
  );
}

export function criarOcorrenciaEstoque(dados: DadosNovaOcorrenciaEstoque) {
  return addDoc(ocorrenciasEstoqueCollection(), dados);
}
