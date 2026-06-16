import {
  collection,
  doc,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

export function notificacoesCollection() {
  return collection(db, "notificacoes");
}

export function notificacaoDoc(notificacaoId: string) {
  return doc(db, "notificacoes", notificacaoId);
}

export function consultaNotificacoesDoUsuario(usuarioId: string) {
  return query(
    notificacoesCollection(),
    where("destinatarioId", "==", usuarioId),
  );
}

export function consultaNotificacoesNaoLidas(usuarioId: string) {
  return query(
    notificacoesCollection(),
    where("destinatarioId", "==", usuarioId),
    where("lida", "==", false),
  );
}

export function marcarNotificacaoComoLida(notificacaoId: string) {
  return updateDoc(notificacaoDoc(notificacaoId), {
    lida: true,
    lidaEm: serverTimestamp(),
  });
}

export async function marcarNotificacoesComoLidas(notificacaoIds: string[]) {
  if (notificacaoIds.length === 0) return;

  const batch = writeBatch(db);
  notificacaoIds.forEach((notificacaoId) => {
    batch.update(notificacaoDoc(notificacaoId), {
      lida: true,
      lidaEm: serverTimestamp(),
    });
  });

  await batch.commit();
}
