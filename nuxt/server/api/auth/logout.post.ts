import { sendNoContent } from 'h3';
import {
  clearPilotSession,
  privateResponse,
  requireSameOrigin,
} from '../../utils/auth-session';

export default defineEventHandler((event) => {
  privateResponse(event);
  requireSameOrigin(event);
  clearPilotSession(event);
  return sendNoContent(event, 204);
});
