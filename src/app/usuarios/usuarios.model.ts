export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  cargo: 'admin' | 'colaborador';
  senha?: string;
  ativo: boolean;
  createdAt?: string;
}
