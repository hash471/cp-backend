import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { ComplaintLog } from './entities/complaint-log.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintDto } from './dto/filter-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ComplaintStatus } from './enums/complaint-status.enum';
import { Officer } from '../officers/entities/officer.entity';
import { Role } from '../officers/enums/role.enum';
import {
  getStationsForZone,
  getStationsForSubDivision,
} from '../officers/constants/hierarchy.constant';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintLog)
    private readonly complaintLogRepository: Repository<ComplaintLog>,
    private readonly configService: ConfigService,
  ) {}

  private getAllowedStations(officer: Officer): string[] | null {
    switch (officer.role) {
      case Role.COMMISSIONER:
      case Role.JOINT_COMMISSIONER:
        return null; // null means all stations
      case Role.DCP:
        if (!officer.zone) return [];
        return getStationsForZone(officer.zone);
      case Role.ACP:
        if (!officer.subDivision) return [];
        return getStationsForSubDivision(officer.subDivision);
      case Role.INSPECTOR:
      case Role.SUB_INSPECTOR:
        if (!officer.policeStation) return [];
        return [officer.policeStation];
      default:
        return [];
    }
  }

  private applyRbacFilter(
    queryBuilder: SelectQueryBuilder<Complaint>,
    officer: Officer,
  ): void {
    const stations = this.getAllowedStations(officer);
    if (stations === null) return; // Commissioner / Joint Commissioner
    if (stations.length === 0) {
      queryBuilder.andWhere('1 = 0'); // no access
      return;
    }
    queryBuilder.andWhere('complaint.policeStation IN (:...stations)', {
      stations,
    });
  }

  private assertOfficerCanAccess(
    complaint: Complaint,
    officer: Officer,
  ): void {
    const stations = this.getAllowedStations(officer);
    if (stations === null) return;
    if (!stations.includes(complaint.policeStation)) {
      throw new ForbiddenException(
        'You do not have access to this complaint',
      );
    }
  }

  async create(
    createComplaintDto: CreateComplaintDto
  ): Promise<{ complaint: Complaint; trackingUrl: string }> {
    const complaint = this.complaintRepository.create(createComplaintDto);
    const savedComplaint = await this.complaintRepository.save(complaint);

    // Create initial log entry
    await this.createLog(
      savedComplaint.id,
      null,
      savedComplaint.status,
      'Complaint created',
      'Added by the Reportee',
    );

    const result = await this.findOneInternal(savedComplaint.id);
    const baseUrl = this.configService.get<string>(
      'COMPLAINT_TRACKING_BASE_URL',
      'https://your-domain.com/complaints/track',
    );
    const trackingUrl = `${baseUrl}/${result.complaintNumber}`;

    return { complaint: result, trackingUrl };
  }

  async findAll(
    filterDto: FilterComplaintDto,
    officer: Officer,
  ): Promise<{
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

    // Apply RBAC filter
    // this.applyRbacFilter(queryBuilder, officer);

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

  async findOne(id: string, officer: Officer): Promise<Complaint> {
    const complaint = await this.findOneInternal(id);
    this.assertOfficerCanAccess(complaint, officer);
    return complaint;
  }

  async trackByComplaintNumber(complaintNumber: string) {
    const complaint = await this.complaintRepository.findOne({
      where: { complaintNumber },
      relations: ['logs'],
    });

    if (!complaint) {
      throw new NotFoundException(
        `Complaint with number "${complaintNumber}" not found`,
      );
    }

    return {
      complaintNumber: complaint.complaintNumber,
      status: complaint.status,
      policeStation: complaint.policeStation,
      createdAt: complaint.createdAt,
      logs: (complaint.logs || [])
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((log) => ({
          previousStatus: log.previousStatus,
          newStatus: log.newStatus,
          remarks: log.remarks,
          changeDescription: log.changeDescription,
          createdAt: log.createdAt,
        })),
    };
  }

  async findByComplaintNumber(
    complaintNumber: string,
    officer: Officer,
  ): Promise<Complaint> {
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

    this.assertOfficerCanAccess(complaint, officer);
    return complaint;
  }

  async update(
    id: string,
    updateComplaintDto: UpdateComplaintDto,
    officer: Officer,
  ): Promise<Complaint> {
    const complaint = await this.findOneInternal(id);
    this.assertOfficerCanAccess(complaint, officer);

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
        officer.name,
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
          officer.name,
          changes,
        );
      }
    }

    return this.findOneInternal(id);
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    officer: Officer,
  ): Promise<Complaint> {
    const complaint = await this.findOneInternal(id);
    this.assertOfficerCanAccess(complaint, officer);

    const previousStatus = complaint.status;

    if (previousStatus === updateStatusDto.status) {
      throw new BadRequestException(
        `Complaint is already in ${updateStatusDto.status} status`,
      );
    }

    complaint.status = updateStatusDto.status;

    if (updateStatusDto.status === ComplaintStatus.CLOSED_WITH_FIR) {
      complaint.firNumber = updateStatusDto.firNumber!;
    }

    await this.complaintRepository.save(complaint);

    // Create log entry for status change
    const remarks =
      updateStatusDto.remarks ||
      (updateStatusDto.firNumber
        ? `Status changed to ${updateStatusDto.status} — FIR: ${updateStatusDto.firNumber}`
        : `Status changed from ${previousStatus} to ${updateStatusDto.status}`);

    await this.createLog(id, previousStatus, updateStatusDto.status, remarks, officer.name);

    return this.findOneInternal(id);
  }

  async remove(id: string, officer: Officer): Promise<void> {
    const complaint = await this.findOneInternal(id);
    this.assertOfficerCanAccess(complaint, officer);
    await this.complaintRepository.remove(complaint);
  }

  async getLogs(
    complaintId: string,
    officer: Officer,
  ): Promise<ComplaintLog[]> {
    const complaint = await this.findOneInternal(complaintId);
    this.assertOfficerCanAccess(complaint, officer);

    return this.complaintLogRepository.find({
      where: { complaintId },
      order: { createdAt: 'DESC' },
    });
  }

  async getStatusCounts(
    officer: Officer,
  ): Promise<Record<ComplaintStatus, number>> {
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'status')
      .addSelect('COUNT(*)', 'count');

    // this.applyRbacFilter(queryBuilder, officer);

    const counts = await queryBuilder.groupBy('complaint.status').getRawMany();

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

  async getStatistics(officer: Officer): Promise<{
    totalCases: number;
    pending: number;
    resolved: number;
    citizens: number;
  }> {
    const statusCounts = await this.getStatusCounts(officer);

    const pending =
      (statusCounts[ComplaintStatus.NEW] || 0) +
      (statusCounts[ComplaintStatus.ASSIGNED] || 0) +
      (statusCounts[ComplaintStatus.IN_PROGRESS] || 0);

    const resolved =
      (statusCounts[ComplaintStatus.RESOLVED] || 0) +
      (statusCounts[ComplaintStatus.REJECTED] || 0) +
      (statusCounts[ComplaintStatus.CLOSED_WITH_FIR] || 0) +
      (statusCounts[ComplaintStatus.CLOSED_WITHOUT_FIR] || 0);

    const totalCases = pending + resolved;

    return {
      totalCases,
      pending,
      resolved,
      citizens: 0, // Hardcoded for now
    };
  }

  private async findOneInternal(id: string): Promise<Complaint> {
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
}
