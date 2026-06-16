import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

export function usuariosCollection() {
  return collection(db, "usuarios");
}

export function usuarioDoc(usuarioId: string) {
  return doc(db, "usuarios", usuarioId);
}

export function buscarUsuario(usuarioId: string) {
  return getDoc(usuarioDoc(usuarioId));
}

export function criarUsuario(usuarioId: string, dados: Record<string, any>) {
  return setDoc(usuarioDoc(usuarioId), dados);
}

export function consultaPromotores() {
  return query(usuariosCollection(), where("tipo", "==", "promotor"));
}

export function consultaAdministradores() {
  return query(
    usuariosCollection(),
    where("tipo", "in", ["admin", "super_admin"]),
  );
}

export function atualizarUsuario(usuarioId: string, dados: Record<string, any>) {
  return updateDoc(usuarioDoc(usuarioId), dados);
}

export function excluirUsuario(usuarioId: string) {
  return deleteDoc(usuarioDoc(usuarioId));
}
