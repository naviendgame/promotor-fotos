import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import type { DadosNovaFoto } from "../types/foto";
import { db } from "./firebaseConfig";

export function fotosCollection() {
  return collection(db, "fotos");
}

export function fotoDoc(fotoId: string) {
  return doc(db, "fotos", fotoId);
}

export function consultaFotosDoPromotor(promotorId: string) {
  return query(fotosCollection(), where("promotorId", "==", promotorId));
}

export function consultaFotosOrdenadasPorData() {
  return query(fotosCollection(), orderBy("criadoEm", "desc"));
}

export function criarFoto(dados: DadosNovaFoto) {
  return addDoc(fotosCollection(), dados);
}

export function moverFotoParaLixeira(fotoId: string, usuarioId: string) {
  return updateDoc(fotoDoc(fotoId), {
    naLixeira: true,
    excluidaEm: serverTimestamp(),
    excluidaPor: usuarioId,
  });
}

export function restaurarFotoDaLixeira(fotoId: string) {
  return updateDoc(fotoDoc(fotoId), {
    naLixeira: false,
    excluidaEm: null,
    excluidaPor: null,
  });
}

export function excluirFoto(fotoId: string) {
  return deleteDoc(fotoDoc(fotoId));
}
