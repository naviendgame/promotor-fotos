export type TipoOcorrenciaEstoque = "estoque" | "avaria";

export type ItemOcorrenciaEstoque = {
  produtoId: string;
  codigo?: string;
  nome: string;
  complemento?: string;
  estoqueLoja?: number;
  estoqueDisponivel?: number;
  ruptura?: boolean;
  quantidadeRuptura?: number;
  quantidadeAvaria?: number;
  motivoAvaria?: string;
  destinoAvaria?: string;
  observacao?: string;
};

export type OcorrenciaEstoque = {
  id: string;
  tipo: TipoOcorrenciaEstoque;
  fotoId: string;
  lojaId: string;
  lojaNome: string;
  promotorId: string;
  promotorNome: string;
  promotorEmail?: string;
  categoriaFoto: string;
  observacao?: string;
  itens: ItemOcorrenciaEstoque[];
  status?: "pendente" | "analisada";
  criadoEm?: any;
  atualizadoEm?: any;
};

export type DadosNovaOcorrenciaEstoque = Omit<OcorrenciaEstoque, "id">;
