import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { DB } from '../db/db.token';
import { type Database } from '../db/db.type';
@ApiTags('Saúde')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@Inject(DB) private readonly db: Database) {}
  @Get()
  @ApiOperation({ summary: 'Saúde do processo' })
  live() {
    return { status: 'ok' };
  }
  @Get('ready')
  @ApiOperation({ summary: 'Readiness do banco local do MVP' })
  ready() {
    try {
      this.db.run(sql`select 1`);
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Banco indisponível.');
    }
  }
}
