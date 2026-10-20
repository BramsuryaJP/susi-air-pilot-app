import { createError, getQuery } from 'h3';
import type { MonthlySchedule } from '../../shared/types/schedules';
import { pilotSessionToken, privateResponse } from '../utils/auth-session';
import { pilotApi } from '../utils/pilot-api';

export default defineEventHandler((event) => {
  privateResponse(event);
  const token = pilotSessionToken(event);
  const query = getQuery(event);
  if (
    Object.keys(query).length !== 2 ||
    typeof query.year !== 'string' ||
    !/^[1-9]\d{3}$/.test(query.year) ||
    typeof query.month !== 'string' ||
    !/^(?:0?[1-9]|1[0-2])$/.test(query.month)
  ) {
    throw createError({
      statusCode: 400,
      message: 'Choose a valid schedule year and month.',
    });
  }
  return pilotApi<MonthlySchedule>(event, '/schedules', {
    method: 'GET',
    token,
    query: { year: query.year, month: query.month },
  });
});
