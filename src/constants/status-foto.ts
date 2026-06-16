import type { StatusFoto } from "../types/foto";

export const STATUS_FOTO = {
  pendente: "pendente",
  aprovada: "aprovada",
  refazer: "refazer",
  rejeitada: "rejeitada",
} as const satisfies Record<string, StatusFoto>;

export const STATUS_FOTO_OPCOES: StatusFoto[] = [
  STATUS_FOTO.pendente,
  STATUS_FOTO.aprovada,
  STATUS_FOTO.refazer,
  STATUS_FOTO.rejeitada,
];

export const STATUS_FOTO_FILTRO_OPCOES = [
  "Todos",
  ...STATUS_FOTO_OPCOES,
] as const;
