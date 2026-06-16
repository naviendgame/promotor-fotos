export type TipoNotificacao =
  | "foto_aprovada"
  | "foto_refazer"
  | "foto_rejeitada";

export type Notificacao = {
  id: string;
  destinatarioId?: string;
  fotoId?: string;
  lojaNome?: string;
  titulo?: string;
  mensagem?: string;
  tipo?: TipoNotificacao | string;
  status?: string;
  comentarioAdmin?: string;
  lida?: boolean;
  criadoEm?: any;
  lidaEm?: any;
};
