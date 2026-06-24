export type Produto = {
  id: string;
  codigo?: string;
  nome: string;
  marca?: string;
  imagemBase64?: string;
  ativo?: boolean;
  criadoEm?: any;
  atualizadoEm?: any;
};

export type DadosNovoProduto = Omit<Produto, "id">;
