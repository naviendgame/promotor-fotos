import { MaterialIcons } from "@expo/vector-icons";

export type IconeMaterial = keyof typeof MaterialIcons.glyphMap;

export type CategoriaFoto = {
  valor: string;
  nome: string;
  icone: IconeMaterial;
};

export const SEM_CATEGORIA = "Sem categoria";

export const CATEGORIAS_FOTO: CategoriaFoto[] = [
  { valor: "Gondola", nome: "Gôndola", icone: "view-stream" },
  {
    valor: "Relatório de estoque",
    nome: "Relatório de estoque",
    icone: "inventory-2",
  },
  { valor: "Ponta", nome: "Ponta", icone: "space-dashboard" },
  { valor: "Ilha", nome: "Ilha", icone: "grid-view" },
  { valor: "Ruptura", nome: "Ruptura", icone: "production-quantity-limits" },
  { valor: "Preco", nome: "Preço", icone: "sell" },
  { valor: "Validade", nome: "Validade", icone: "event" },
  { valor: "Concorrente", nome: "Concorrente", icone: "compare-arrows" },
  { valor: "Antes/depois", nome: "Antes/depois", icone: "compare" },
];

export const CATEGORIAS_FOTO_VALORES = CATEGORIAS_FOTO.map(
  (categoria) => categoria.valor,
);

export const CATEGORIAS_FOTO_COM_TODAS = [
  "Todas",
  ...CATEGORIAS_FOTO_VALORES,
  SEM_CATEGORIA,
];

export function nomeCategoriaFoto(categoria?: string | null) {
  if (!categoria) return SEM_CATEGORIA;
  return (
    CATEGORIAS_FOTO.find((item) => item.valor === categoria)?.nome ||
    categoria
  );
}
