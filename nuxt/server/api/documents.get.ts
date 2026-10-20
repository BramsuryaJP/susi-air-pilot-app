import type { PilotDocuments } from '../../shared/types/documents';
import { pilotSessionToken, privateResponse } from '../utils/auth-session';
import { pilotApi } from '../utils/pilot-api';

export default defineEventHandler((event) => {
  privateResponse(event);
  const token = pilotSessionToken(event);
  return pilotApi<PilotDocuments>(event, '/documents', {
    method: 'GET',
    token,
  });
});
