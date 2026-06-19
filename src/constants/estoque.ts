export const CATEGORIA_RELATORIO_ESTOQUE = "Relatorio de estoque";
export const CATEGORIA_RELATORIO_ESTOQUE_LEGADA = "RelatÃ³rio de estoque";
export const CATEGORIA_AVARIA_DEVOLUCAO = "Avaria / Devolucao";

export const MOTIVOS_AVARIA = [
  "Vencido",
  "Danificado",
  "Embalagem violada",
  "Troca",
  "Outro",
];

export const DESTINOS_AVARIA = [
  "Devolucao",
  "Descarte",
  "Aguardando recolhimento",
];

export function categoriaExigeOcorrenciaEstoque(categoria?: string | null) {
  return (
    categoria === CATEGORIA_RELATORIO_ESTOQUE ||
    categoria === CATEGORIA_RELATORIO_ESTOQUE_LEGADA ||
    categoria === CATEGORIA_AVARIA_DEVOLUCAO
  );
}

export function tipoOcorrenciaPorCategoria(categoria?: string | null) {
  if (categoria === CATEGORIA_AVARIA_DEVOLUCAO) return "avaria";
  if (
    categoria === CATEGORIA_RELATORIO_ESTOQUE ||
    categoria === CATEGORIA_RELATORIO_ESTOQUE_LEGADA
  ) {
    return "estoque";
  }

  return null;
}
