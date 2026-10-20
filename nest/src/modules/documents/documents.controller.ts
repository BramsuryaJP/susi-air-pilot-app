import { Controller, Get, Header } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import type { DocumentsResponseDto } from './dto/documents-response.dto.js';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  list(): DocumentsResponseDto {
    return this.documents.list();
  }
}
