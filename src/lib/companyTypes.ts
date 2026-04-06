export interface CompanyDocument {
  name: string;
  fileName: string;
  type: 'registry' | 'certificate' | 'card' | 'charter';
}
export interface Company {
  id: string;
  name: string;
  website?: string;
  documents: CompanyDocument[];
  contractSample?: string; // путь к образцу договора
}
export const DOCUMENT_TYPES = {
  registry: 'Выписка из реестра',
  certificate: 'Свидетельство о регистрации',
  card: 'Карточка предприятия',
  charter: 'Устав',
} as const;
