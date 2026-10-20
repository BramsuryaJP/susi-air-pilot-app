import { createError, getQuery } from 'h3';
import type { FlightSummary } from '../../../shared/types/flight-hours';
import { pilotSessionToken, privateResponse } from '../../utils/auth-session';
import { pilotApi } from '../../utils/pilot-api';

export default defineEventHandler((event) => {
  privateResponse(event);
  const token = pilotSessionToken(event);
  const query = getQuery(event);
  if (
    Object.keys(query).length !== 1 ||
    typeof query.range !== 'string' ||
    !['1w', '1m', '3m', '6m', '1y'].includes(query.range)
  ) {
    throw createError({
      statusCode: 400,
      message: 'Choose a valid flight-hour range.',
    });
  }
  return pilotApi<FlightSummary>(event, '/flight-hours/summary', {
    method: 'GET',
    token,
    query: { range: query.range },
  });
});
