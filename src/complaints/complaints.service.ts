import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { ComplaintLog } from './entities/complaint-log.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintDto } from './dto/filter-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ComplaintStatus } from './enums/complaint-status.enum';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintLog)
    private readonly complaintLogRepository: Repository<ComplaintLog>,
  ) {}

  async create(
    createComplaintDto: CreateComplaintDto,
    username?: string,
  ): Promise<Complaint> {
    const complaint = this.complaintRepository.create(createComplaintDto);
    const savedComplaint = await this.complaintRepository.save(complaint);

    // Create initial log entry
    await this.createLog(
      savedComplaint.id,
      null,
      savedComplaint.status,
      'Complaint created',
      username,
    );

    return this.findOne(savedComplaint.id);
  }

  async findAll(filterDto: FilterComplaintDto): Promise<{
    data: Complaint[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      complaintNumber,
      language,
      policeStation,
      citizenName,
      mobileNumber,
      aadharNumber,
      fatherOrMotherName,
      permanentAddress,
      presentAddress,
      pincode,
      locationOfIncident,
      complaintSummary,
      status,
      createdAfter,
      createdBefore,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = filterDto;

    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.logs', 'logs');

    // Apply filters
    if (complaintNumber) {
      queryBuilder.andWhere('complaint.complaintNumber LIKE :complaintNumber', {
        complaintNumber: `%${complaintNumber}%`,
      });
    }

    if (language) {
      queryBuilder.andWhere('complaint.language LIKE :language', {
        language: `%${language}%`,
      });
    }

    if (policeStation) {
      queryBuilder.andWhere('complaint.policeStation LIKE :policeStation', {
        policeStation: `%${policeStation}%`,
      });
    }

    if (citizenName) {
      queryBuilder.andWhere('complaint.citizenName LIKE :citizenName', {
        citizenName: `%${citizenName}%`,
      });
    }

    if (mobileNumber) {
      queryBuilder.andWhere('complaint.mobileNumber LIKE :mobileNumber', {
        mobileNumber: `%${mobileNumber}%`,
      });
    }

    if (aadharNumber) {
      queryBuilder.andWhere('complaint.aadharNumber LIKE :aadharNumber', {
        aadharNumber: `%${aadharNumber}%`,
      });
    }

    if (fatherOrMotherName) {
      queryBuilder.andWhere(
        'complaint.fatherOrMotherName LIKE :fatherOrMotherName',
        {
          fatherOrMotherName: `%${fatherOrMotherName}%`,
        },
      );
    }

    if (permanentAddress) {
      queryBuilder.andWhere('complaint.permanentAddress LIKE :permanentAddress', {
        permanentAddress: `%${permanentAddress}%`,
      });
    }

    if (presentAddress) {
      queryBuilder.andWhere('complaint.presentAddress LIKE :presentAddress', {
        presentAddress: `%${presentAddress}%`,
      });
    }

    if (pincode) {
      queryBuilder.andWhere('complaint.pincode = :pincode', { pincode });
    }

    if (locationOfIncident) {
      queryBuilder.andWhere(
        'complaint.locationOfIncident LIKE :locationOfIncident',
        {
          locationOfIncident: `%${locationOfIncident}%`,
        },
      );
    }

    if (complaintSummary) {
      queryBuilder.andWhere('complaint.complaintSummary LIKE :complaintSummary', {
        complaintSummary: `%${complaintSummary}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('complaint.status = :status', { status });
    }

    if (createdAfter) {
      queryBuilder.andWhere('complaint.createdAt >= :createdAfter', {
        createdAfter: new Date(createdAfter),
      });
    }

    if (createdBefore) {
      queryBuilder.andWhere('complaint.createdAt <= :createdBefore', {
        createdBefore: new Date(createdBefore),
      });
    }

    // Global search across multiple fields
    if (search) {
      queryBuilder.andWhere(
        `(complaint.complaintNumber LIKE :search
         OR complaint.citizenName LIKE :search
         OR complaint.mobileNumber LIKE :search
         OR complaint.policeStation LIKE :search
         OR complaint.locationOfIncident LIKE :search
         OR complaint.complaintSummary LIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // Validate sortBy field
    const allowedSortFields = [
      'complaintNumber',
      'language',
      'policeStation',
      'citizenName',
      'mobileNumber',
      'status',
      'createdAt',
      'updatedAt',
    ];

    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(`complaint.${validSortBy}`, validSortOrder);

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    queryBuilder.skip(skip).take(limitNum);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { id },
      relations: ['logs'],
      order: { logs: { createdAt: 'DESC' } },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID "${id}" not found`);
    }

    return complaint;
  }

  async findByComplaintNumber(complaintNumber: string): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintNumber },
      relations: ['logs'],
      order: { logs: { createdAt: 'DESC' } },
    });

    if (!complaint) {
      throw new NotFoundException(
        `Complaint with number "${complaintNumber}" not found`,
      );
    }

    return complaint;
  }

  async update(
    id: string,
    updateComplaintDto: UpdateComplaintDto,
    username?: string,
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);
    const previousStatus = complaint.status;

    // Check if status is being updated
    const statusChanged =
      updateComplaintDto.status && updateComplaintDto.status !== previousStatus;

    // Extract statusRemarks before updating
    const { statusRemarks, ...updateData } = updateComplaintDto;

    // Update complaint
    Object.assign(complaint, updateData);
    await this.complaintRepository.save(complaint);

    // If status changed, create a log entry
    if (statusChanged) {
      const changes = this.getChangedFields(complaint, updateData);
      await this.createLog(
        id,
        previousStatus,
        updateComplaintDto.status!,
        statusRemarks || `Status changed from ${previousStatus} to ${updateComplaintDto.status}`,
        username,
        changes,
      );
    } else if (Object.keys(updateData).length > 0) {
      // Log other updates without status change
      const changes = this.getChangedFields(complaint, updateData);
      if (changes) {
        await this.createLog(
          id,
          complaint.status,
          complaint.status,
          `Complaint details updated`,
          username,
          changes,
        );
      }
    }

    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    username?: string,
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);
    const previousStatus = complaint.status;

    if (previousStatus === updateStatusDto.status) {
      throw new BadRequestException(
        `Complaint is already in ${updateStatusDto.status} status`,
      );
    }

    complaint.status = updateStatusDto.status;
    await this.complaintRepository.save(complaint);

    // Create log entry for status change
    await this.createLog(
      id,
      previousStatus,
      updateStatusDto.status,
      updateStatusDto.remarks ||
        `Status changed from ${previousStatus} to ${updateStatusDto.status}`,
      username,
    );

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const complaint = await this.findOne(id);
    await this.complaintRepository.remove(complaint);
  }

  async getLogs(complaintId: string): Promise<ComplaintLog[]> {
    // Verify complaint exists
    await this.findOne(complaintId);

    return this.complaintLogRepository.find({
      where: { complaintId },
      order: { createdAt: 'DESC' },
    });
  }

  private async createLog(
    complaintId: string,
    previousStatus: ComplaintStatus | null,
    newStatus: ComplaintStatus,
    remarks?: string,
    updatedBy?: string,
    changeDescription?: string,
  ): Promise<ComplaintLog> {
    const log = this.complaintLogRepository.create({
      complaintId,
      previousStatus,
      newStatus,
      remarks,
      updatedBy,
      changeDescription,
    });

    return this.complaintLogRepository.save(log);
  }

  private getChangedFields(
    original: Partial<Complaint>,
    updates: Partial<UpdateComplaintDto>,
  ): string {
    const changedFields: string[] = [];

    for (const key of Object.keys(updates)) {
      if (key !== 'status' && key !== 'statusRemarks') {
        changedFields.push(key);
      }
    }

    return changedFields.length > 0
      ? `Updated fields: ${changedFields.join(', ')}`
      : '';
  }

  async getStatusCounts(): Promise<Record<ComplaintStatus, number>> {
    const counts = await this.complaintRepository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('complaint.status')
      .getRawMany();

    const result = Object.values(ComplaintStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<ComplaintStatus, number>,
    );

    counts.forEach((item) => {
      result[item.status as ComplaintStatus] = parseInt(item.count, 10);
    });

    return result;
  }
}
