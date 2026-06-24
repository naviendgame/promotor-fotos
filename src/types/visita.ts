export type StatusVisita = "pendente" | "em_analise" | "concluida";

export type Visita = {
  id: string;
  lojaId?: string;
  lojaNome?: string;
  promotorId?: string;
  promotorNome?: string;
  promotorEmail?: string;
  totalFotos?: number;
  status?: StatusVisita;
  criadoEm?: any;
  atualizadoEm?: any;
};

export type DadosNovaVisita = Omit<Visita, "id">;
