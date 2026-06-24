import type { StatusFoto } from "../types/foto";

export function obterStatusFoto(status?: string): StatusFoto {
  if (status === "aprovada") return "aprovada";
  if (status === "refazer") return "refazer";
  if (status === "rejeitada") return "rejeitada";
  return "pendente";
}

export function textoStatusFoto(status?: string) {
  const statusNormalizado = obterStatusFoto(status);

  if (statusNormalizado === "aprovada") return "Aprovada";
  if (statusNormalizado === "refazer") return "Refazer";
  if (statusNormalizado === "rejeitada") return "Rejeitada";
  return "Pendente";
}

export function corStatusFoto(status?: string) {
  const statusNormalizado = obterStatusFoto(status);

  if (statusNormalizado === "aprovada") return "#16A34A";
  if (statusNormalizado === "refazer") return "#F59E0B";
  if (statusNormalizado === "rejeitada") return "#EF4444";
  return "#2563EB";
}

export function visualStatusEscuro(status?: string) {
  const statusNormalizado = obterStatusFoto(status);

  if (statusNormalizado === "aprovada") {
    return { fundo: "#123B2A", texto: "#6EE7A8" };
  }
  if (statusNormalizado === "refazer") {
    return { fundo: "#49310B", texto: "#FBBF24" };
  }
  if (statusNormalizado === "rejeitada") {
    return { fundo: "#481A20", texto: "#FDA4AF" };
  }
  return { fundo: "#142F5E", texto: "#93C5FD" };
}

export function visualStatusWeb(status?: string) {
  const statusNormalizado = obterStatusFoto(status);

  if (statusNormalizado === "aprovada") {
    return { fundo: "#E4F4EA", texto: "#247946" };
  }
  if (statusNormalizado === "refazer") {
    return { fundo: "#FFF1D9", texto: "#A6650B" };
  }
  if (statusNormalizado === "rejeitada") {
    return { fundo: "#FBE7E9", texto: "#B5323E" };
  }
  return { fundo: "#E8EFFD", texto: "#2F6FED" };
}

/**
 * Variante que escolhe automaticamente entre o visual escuro e claro
 * de acordo com o tema atual do app.
 */
export function visualStatusPorTema(
  status: string | undefined,
  scheme: "light" | "dark",
) {
  return scheme === "light" ? visualStatusWeb(status) : visualStatusEscuro(status);
}
