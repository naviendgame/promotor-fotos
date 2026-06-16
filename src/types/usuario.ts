export type TipoUsuario = "promotor" | "admin" | "super_admin";

export type Usuario = {
  id: string;
  nome?: string;
  email?: string;
  tipo?: TipoUsuario | string;
  ativo?: boolean;
  lojasIds?: string[];
  criadoEm?: any;
  atualizadoEm?: any;
};

export type Promotor = Usuario & {
  tipo?: "promotor";
};

export type Administrador = Usuario & {
  tipo?: "admin" | "super_admin";
};
