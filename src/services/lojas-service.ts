import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import type { Loja } from "../types/loja";

export function lojasCollection() {
  return collection(db, "lojas");
}

export function lojaDoc(lojaId: string) {
  return doc(db, "lojas", lojaId);
}

export function buscarLoja(lojaId: string) {
  return getDoc(lojaDoc(lojaId));
}

export function criarLoja(dados: Omit<Loja, "id">) {
  return addDoc(lojasCollection(), dados);
}

export function atualizarLoja(lojaId: string, dados: Partial<Loja>) {
  return updateDoc(lojaDoc(lojaId), dados as Record<string, any>);
}

export function excluirLoja(lojaId: string) {
  return deleteDoc(lojaDoc(lojaId));
}
