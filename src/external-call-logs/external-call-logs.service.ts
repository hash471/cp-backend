import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalCallLog } from './entities/external-call-log.entity';
import { CreateExternalCallLogDto } from './dto/create-external-call-log.dto';
import { FilterExternalCallLogDto } from './dto/filter-external-call-log.dto';

@Injectable()
export class ExternalCallLogsService {
  constructor(
    @InjectRepository(ExternalCallLog)
    private readonly externalCallLogRepository: Repository<ExternalCallLog>,
  ) {}

  async create(dto: CreateExternalCallLogDto): Promise<ExternalCallLog> {
    // Default `success` from the HTTP status when the caller doesn't send it.
    const success =
      dto.success ??
      (typeof dto.httpStatus === 'number'
        ? dto.httpStatus >= 200 && dto.httpStatus < 300
        : null);

    const log = this.externalCallLogRepository.create({
      serviceName: dto.serviceName ?? null,
      method: dto.method,
      url: dto.url,
      requestHeaders: dto.requestHeaders ?? null,
      requestBody: dto.requestBody ?? null,
      responseHeaders: dto.responseHeaders ?? null,
      responseBody: dto.responseBody ?? null,
      httpStatus: dto.httpStatus ?? null,
      statusText: dto.statusText ?? null,
      success,
      durationMs: dto.durationMs ?? null,
      errorMessage: dto.errorMessage ?? null,
      referenceId: dto.referenceId ?? null,
      metadata: dto.metadata ?? null,
    });

    return this.externalCallLogRepository.save(log);
  }

  async findAll(filterDto: FilterExternalCallLogDto): Promise<{
    data: ExternalCallLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      serviceName,
      referenceId,
      success,
      httpStatus,
      page = 1,
      limit = 20,
    } = filterDto;

    const qb = this.externalCallLogRepository.createQueryBuilder('log');

    if (serviceName) {
      qb.andWhere('log.serviceName ILIKE :serviceName', {
        serviceName: `%${serviceName}%`,
      });
    }
    if (referenceId) {
      qb.andWhere('log.referenceId = :referenceId', { referenceId });
    }
    if (success !== undefined) {
      qb.andWhere('log.success = :success', { success });
    }
    if (httpStatus !== undefined) {
      qb.andWhere('log.httpStatus = :httpStatus', { httpStatus });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    qb.orderBy('log.createdAt', 'DESC')
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}
