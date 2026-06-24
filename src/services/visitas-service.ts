import {
  addDoc,
  collection,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { DadosNovaVisita } from "@/types/visita";

import { db } from "./firebaseConfig";

export function visitasCollection() {
  return collection(db, "visitas");
}

export function consultaVisitasOrdenadasPorData() {
  return query(visitasCollection(), orderBy("criadoEm", "desc"));
}

export function consultaVisitasDoPromotor(promotorId: string) {
  return query(
    visitasCollection(),
    where("promotorId", "==", promotorId),
    orderBy("criadoEm", "desc"),
  );
}

export function criarVisita(dados: DadosNovaVisita) {
  return addDoc(visitasCollection(), dados);
}
