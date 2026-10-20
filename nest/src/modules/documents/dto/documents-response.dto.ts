export type DocumentStatus = 'expired' | 'soon' | 'safe';

export interface PilotDocumentDto {
  id: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
  status: DocumentStatus;
}

export interface DocumentsResponseDto {
  today: string;
  warningDays: number;
  documents: PilotDocumentDto[];
}
