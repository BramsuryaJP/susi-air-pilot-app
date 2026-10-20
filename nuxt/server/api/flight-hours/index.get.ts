import { createError, getQuery } from 'h3';
import type { DailyFlightHours } from '../../../shared/types/flight-hours';
import { pilotSessionToken, privateResponse } from '../../utils/auth-session';
import { pilotApi } from '../../utils/pilot-api';

export default defineEventHandler((event) => {
  privateResponse(event);
  const token = pilotSessionToken(event);
  const query = getQuery(event);
  const validDate = (value: unknown): value is string => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false;
    const stamp = Date.parse(`${value}T00:00:00Z`);
    return (
      Number.isFinite(stamp) &&
      new Date(stamp).toISOString().slice(0, 10) === value
    );
  };
  if (
    Object.keys(query).length !== 2 ||
    !validDate(query.from) ||
    !validDate(query.to) ||
    query.to < query.from ||
    (Date.parse(query.to) - Date.parse(query.from)) / 86400000 >= 366
  ) {
    throw createError({
      statusCode: 400,
      message: 'Choose an ordered date range of at most 366 days.',
    });
  }
  return pilotApi<DailyFlightHours>(event, '/flight-hours', {
    method: 'GET',
    token,
    query: { from: query.from, to: query.to },
  });
});
