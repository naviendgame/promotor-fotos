import { addDoc, collection, doc, getDoc } from "firebase/firestore";

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
