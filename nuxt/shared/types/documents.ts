export type DocumentStatus = 'expired' | 'soon' | 'safe';

export interface PilotDocument {
  id: string;
  label: string;
  expiryDate: string;
  daysRemaining: number;
  status: DocumentStatus;
}

export interface PilotDocuments {
  today: string;
  warningDays: number;
  documents: PilotDocument[];
}
