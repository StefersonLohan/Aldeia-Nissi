export interface Assistido {
  id?: string;        // Permanent ID (UUID for offline-first)
  nome: string;
  idade: number;
  categoria: string; // Aluno, Viúva, Albino
  morada: string;
  gps?: {
    lat: number;
    lng: number;
  };
  isAlunoRegular: boolean;
  hasAulasExtras: boolean;
  observacoes?: string;
  foto?: string; // Base64 or Firebase URL
  localStatus?: 'pending' | 'syncing' | 'synced';
  createdAt: number;
}
