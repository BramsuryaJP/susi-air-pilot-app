import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { DocumentsService } from './documents.service.js';

const documentsAt = (businessDate: string) =>
  new DocumentsService(new ConfigService({ businessDate })).list();

describe('document expiry', () => {
  it('uses the configured business date instead of the conflicting fixture date', () => {
    const result = documentsAt('2026-05-15');
    expect(result.today).toBe('2026-05-15');
    expect(result.warningDays).toBe(30);
    expect(
      result.documents.map(({ id, daysRemaining, status }) => [
        id,
        daysRemaining,
        status,
      ]),
    ).toEqual([
      ['doc_recurrent', 152, 'safe'],
      ['doc_ppc', 224, 'safe'],
      ['doc_license', 14, 'soon'],
      ['doc_medical', 27, 'soon'],
      ['doc_security', -14, 'expired'],
    ]);
    expect(result.documents[0]).toEqual({
      id: 'doc_recurrent',
      label: 'Next Recurrent Date',
      expiryDate: '2026-10-14',
      daysRemaining: 152,
      status: 'safe',
    });
  });

  it.each([
    ['2026-06-12', -1, 'expired'],
    ['2026-06-11', 0, 'expired'],
    ['2026-06-10', 1, 'soon'],
    ['2026-05-12', 30, 'soon'],
    ['2026-05-11', 31, 'safe'],
  ])(
    'classifies the boundary at %s as %s days and %s',
    (today, daysRemaining, status) => {
      expect(
        documentsAt(today).documents.find(
          (document) => document.id === 'doc_medical',
        ),
      ).toMatchObject({ daysRemaining, status });
    },
  );

  it('counts calendar days across leap years and year boundaries in UTC', () => {
    expect(
      documentsAt('2024-02-28').documents.find(
        (document) => document.id === 'doc_security',
      )?.daysRemaining,
    ).toBe(793);
    expect(
      documentsAt('2025-12-31').documents.find(
        (document) => document.id === 'doc_security',
      )?.daysRemaining,
    ).toBe(121);
  });

  it('does not depend on the actual wall clock', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2040-12-31T23:59:59Z'));
      expect(documentsAt('2026-05-15').documents[2]).toMatchObject({
        daysRemaining: 14,
        status: 'soon',
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
