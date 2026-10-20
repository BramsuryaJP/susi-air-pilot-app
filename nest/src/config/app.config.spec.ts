import { describe, expect, it } from 'vitest';
import { loadAppConfig } from './app.config.js';

describe('application configuration', () => {
  it('uses a reproducible business date independently of the system clock', () => {
    expect(loadAppConfig({})).toEqual({
      port: 3000,
      businessDate: '2026-05-15',
    });
  });

  it('accepts an explicit port and a valid leap-day business date', () => {
    expect(
      loadAppConfig({ PORT: '8080', BUSINESS_DATE: '2028-02-29' }),
    ).toEqual({
      port: 8080,
      businessDate: '2028-02-29',
    });
  });

  it.each(['0', '-1', '65536', '3000junk', '3.5', ''])(
    'rejects invalid PORT %j',
    (port) => {
      expect(() => loadAppConfig({ PORT: port })).toThrow('PORT');
    },
  );

  it.each([
    '2026-02-29',
    '2026-04-31',
    '2026-5-15',
    'not-a-date',
    '2026-05-15T00:00:00Z',
  ])('rejects invalid date-only BUSINESS_DATE %j', (businessDate) => {
    expect(() => loadAppConfig({ BUSINESS_DATE: businessDate })).toThrow(
      'BUSINESS_DATE',
    );
  });
});
