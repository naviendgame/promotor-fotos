import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import type { DadosNovoProduto } from "@/types/produto";

import { db } from "./firebaseConfig";

export function produtosCollection() {
  return collection(db, "produtos");
}

export function produtoDoc(produtoId: string) {
  return doc(db, "produtos", produtoId);
}

export function consultaProdutosOrdenados() {
  return query(produtosCollection(), orderBy("nome", "asc"));
}

export function consultaProdutosAtivos() {
  return consultaProdutosOrdenados();
}

export function criarProduto(dados: DadosNovoProduto) {
  return addDoc(produtosCollection(), dados);
}

export function atualizarProduto(
  produtoId: string,
  dados: Partial<DadosNovoProduto>,
) {
  return updateDoc(produtoDoc(produtoId), dados);
}
