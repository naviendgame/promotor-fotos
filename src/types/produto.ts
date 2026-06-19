export type Produto = {
  id: string;
  codigo?: string;
  nome: string;
  complemento?: string;
  marca?: string;
  fornecedor?: string;
  categoria?: string;
  ativo?: boolean;
  criadoEm?: any;
  atualizadoEm?: any;
};

export type DadosNovoProduto = Omit<Produto, "id">;
