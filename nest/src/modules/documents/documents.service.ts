import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/app.config.js';
import seed from '../../data/mock-documents.json' with { type: 'json' };
import type { DocumentsResponseDto } from './dto/documents-response.dto.js';

const DAY_MS = 86400000;

@Injectable()
export class DocumentsService {
  private readonly response: DocumentsResponseDto;

  constructor(config: ConfigService<AppConfig, true>) {
    // The brief's business clock takes precedence over the fixture's today field.
    const today = config.get('businessDate', { infer: true });
    const todayUtc = Date.parse(`${today}T00:00:00.000Z`);
    const warningDays = seed.thresholds.warningDays;
    this.response = {
      today,
      warningDays,
      documents: seed.documents.map((document) => {
        const daysRemaining =
          (Date.parse(`${document.expiryDate}T00:00:00.000Z`) - todayUtc) /
          DAY_MS;
        return {
          ...document,
          daysRemaining,
          status:
            daysRemaining <= 0
              ? 'expired'
              : daysRemaining <= warningDays
                ? 'soon'
                : 'safe',
        };
      }),
    };
  }

  list(): DocumentsResponseDto {
    return this.response;
  }
}
