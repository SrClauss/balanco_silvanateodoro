export interface Tag {
  _id?: { $oid?: string } | string;
  nome: string;
}

export interface Fornecedor {
  _id?: { $oid?: string } | string;
  nome_fantasia?: string;
  razao_social?: string;
  cnpj?: string;
  contato_nome?: string;
  endereco?: any;
  telefone?: string;
  email?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Marca {
  _id?: { $oid?: string } | string;
  nome: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemProduto {
  id?: { $oid?: string } | string;
  data_aquisicao: string;
  quantidade: number;
}

export interface Produto {
  _id?: { $oid?: string } | string;
  codigo_interno?: string;
  descricao: string;
  tamanho?: string;
  fornecedor?: Fornecedor | null;
  marca?: string | Marca | null;
  preco_custo?: number;
  preco_venda?: number;
  fotos?: string[];
  item_produto?: ItemProduto[];
  tags?: Tag[];
}
