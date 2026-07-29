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
import { KioskSequence } from './entities/kiosk-sequence.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';
import { S3Service } from '../common/s3.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { FilterComplaintDto } from './dto/filter-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ComplaintStatus } from './enums/complaint-status.enum';
import { Officer } from '../officers/entities/officer.entity';
import { Role } from '../officers/enums/role.enum';
import { getAccessibleStationsForOfficer } from '../officers/constants/relations.constant';

const MISCELLANEOUS_STATION = 'MISCELLANEOUS';

/** Officer codes that can access MISCELLANEOUS complaints (Admin / Special Units) */
const MISCELLANEOUS_OFFICER_CODES = new Set([
  'ADCP_ADMIN',
  'ADCP_CSB',
  'ACP_CSB',
  'ADCP_CAR',
  'ACP_CAR1',
  'ACP_CAR2',
]);

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintLog)
    private readonly complaintLogRepository: Repository<ComplaintLog>,
    @InjectRepository(KioskSequence)
    private readonly kioskSequenceRepository: Repository<KioskSequence>,
    @InjectRepository(PoliceStation)
    private readonly policeStationRepository: Repository<PoliceStation>,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  private getAllowedStations(officer: Officer): string[] | null {
    // ADMIN, CP and JCP see everything
    if (officer.role === Role.ADMIN || officer.role === Role.COMMISSIONER || officer.role === Role.JOINT_COMMISSIONER) {
      return null;
    }

    // Primary: use relations hierarchy via officerCode (e.g. INSP_IITOWN)
    const code = officer.officerCode || officer.username;
    const relationsStations = getAccessibleStationsForOfficer(code);

    let stations: string[] | null;
    if (relationsStations !== null) {
      // Officer found in hierarchy — use the resolved stations (may be empty for admin-type nodes)
      stations = relationsStations;
    } else if (officer.policeStation) {
      // Fallback: officer policeStation field (for SIs / leaf officers not in the map)
      stations = [officer.policeStation];
    } else {
      stations = []; // no access
    }

    // Admin / Special Units officers can also see MISCELLANEOUS complaints.
    // CP/JCP already have full access (stations === null), so only add for others.
    if (stations !== null && MISCELLANEOUS_OFFICER_CODES.has(code)) {
      stations = [...stations, MISCELLANEOUS_STATION];
    }

    return stations;
  }

  private applyRbacFilter(
    queryBuilder: SelectQueryBuilder<Complaint>,
    officer: Officer,
  ): void {
    const stations = this.getAllowedStations(officer);
    if (stations === null) return; // Commissioner / Joint Commissioner — full access
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
    createComplaintDto: CreateComplaintDto,
  ): Promise<{ complaint: Complaint; trackingUrl: string }> {
    const dto = { ...createComplaintDto };

    // Load all active stations once — used for both pincode lookup and name normalization
    const allActiveStations = await this.policeStationRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'servicePincodes'],
    });

    const providedStation = dto.policeStation?.trim();
    if (providedStation) {
      // A police station was supplied in the payload — honour it instead of
      // deriving one from the pincode. Normalize to the canonical station name
      // when it matches a known active station (case-insensitive).
      const matchedByName = allActiveStations.find(
        (s) => s.name.toLowerCase() === providedStation.toLowerCase(),
      );
      dto.policeStation = matchedByName ? matchedByName.name : providedStation;
    } else {
      // No station supplied — derive it from the pincode's serviced station.
      dto.policeStation = undefined;
      if (dto.pincode) {
        const matchedStation = allActiveStations.find(
          (s) => Array.isArray(s.servicePincodes) && s.servicePincodes.includes(dto.pincode!),
        );
        if (matchedStation) {
          dto.policeStation = matchedStation.name;
        }
      }

      if (!dto.policeStation) {
        dto.policeStation = MISCELLANEOUS_STATION;
      }
    }

    const complaint = this.complaintRepository.create(dto);
    complaint.complaintNumber = await this.generateComplaintNumber(dto.kioskNumber);
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
    this.applyRbacFilter(queryBuilder, officer);

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
    const enrichedData = await this.enrichListWithPresignedUrls(data);

    return {
      data: enrichedData,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Public, unauthenticated, paginated list of complaints.
   * Returns the full complaint record except the Aadhaar number.
   */
  async findAllPublic(
    page = 1,
    limit = 10,
  ): Promise<{
    data: Partial<Complaint>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const [data, total] = await this.complaintRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    // Strip Aadhaar number from the public payload
    const sanitized = data.map(({ aadharNumber, ...rest }) => rest);

    return {
      data: sanitized,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string, officer: Officer): Promise<Complaint> {
    const complaint = await this.findOneInternal(id);
    this.assertOfficerCanAccess(complaint, officer);
    return this.enrichWithPresignedUrls(complaint);
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
      subject: complaint.subject,
      subSubject: complaint.subSubject,
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

  async uploadImages(
    id: string,
    files: Express.Multer.File[],
  ): Promise<Complaint> {
    const complaint = await this.findOneInternal(id);

    const uploadPromises = files.map((file) =>
      this.s3Service.uploadFile(file, `complaints/${complaint.complaintNumber}`),
    );
    const newUrls = await Promise.all(uploadPromises);

    complaint.imageUrls = [...(complaint.imageUrls || []), ...newUrls];
    await this.complaintRepository.save(complaint);

    return this.findOneInternal(id);
  }

  async getImagePresignedUrls(
    id: string,
  ): Promise<{ key: string; url: string }[]> {
    const complaint = await this.findOneInternal(id);

    if (!complaint.imageUrls || complaint.imageUrls.length === 0) {
      return [];
    }

    const urlPromises = complaint.imageUrls.map(async (key) => ({
      key,
      url: await this.s3Service.getPresignedUrl(key),
    }));

    return Promise.all(urlPromises);
  }

  async assignStation(
    id: string,
    policeStation: string,
    officer: Officer,
  ): Promise<Complaint> {
    const complaint = await this.findOneInternal(id);

    // Validate that the station exists in the DB
    const station = await this.policeStationRepository.findOne({
      where: { name: policeStation, isActive: true },
    });
    if (!station) {
      throw new BadRequestException(
        `Police station "${policeStation}" not found or inactive`,
      );
    }

    const previousStation = complaint.policeStation;
    complaint.policeStation = station.name;
    await this.complaintRepository.save(complaint);

    await this.createLog(
      id,
      complaint.status,
      complaint.status,
      `Police station reassigned from "${previousStation}" to "${station.name}"`,
      officer.name,
    );

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

  async getKioskSummary(officer: Officer): Promise<
    {
      kioskNumber: string;
      kioskLocation: string;
      totalComplaints: number;
      closedWithFir: number;
      closedWithoutFir: number;
    }[]
  > {
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .select('complaint.kioskNumber', 'kioskNumber')
      .addSelect('complaint.kioskLocation', 'kioskLocation')
      .addSelect('COUNT(*)', 'totalComplaints')
      .addSelect(
        `SUM(CASE WHEN complaint.status = '${ComplaintStatus.CLOSED_WITH_FIR}' THEN 1 ELSE 0 END)`,
        'closedWithFir',
      )
      .addSelect(
        `SUM(CASE WHEN complaint.status = '${ComplaintStatus.CLOSED_WITHOUT_FIR}' THEN 1 ELSE 0 END)`,
        'closedWithoutFir',
      )
      .where('complaint.kioskNumber IS NOT NULL');

    this.applyRbacFilter(queryBuilder, officer);

    const results = await queryBuilder
      .groupBy('complaint.kioskNumber')
      .addGroupBy('complaint.kioskLocation')
      .orderBy('"totalComplaints"', 'DESC')
      .getRawMany();

    return results.map((row) => ({
      kioskNumber: row.kioskNumber,
      kioskLocation: row.kioskLocation || '',
      totalComplaints: parseInt(row.totalComplaints, 10),
      closedWithFir: parseInt(row.closedWithFir, 10),
      closedWithoutFir: parseInt(row.closedWithoutFir, 10),
    }));
  }

  async getStatusCounts(
    officer: Officer,
  ): Promise<Record<ComplaintStatus, number>> {
    const queryBuilder = this.complaintRepository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'status')
      .addSelect('COUNT(*)', 'count');

    this.applyRbacFilter(queryBuilder, officer);

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

  private async enrichWithPresignedUrls(complaint: Complaint): Promise<Complaint & { presignedImageUrls?: { key: string; url: string }[] }> {
    if (!complaint.imageUrls || complaint.imageUrls.length === 0) {
      return complaint;
    }

    const presignedImageUrls = await Promise.all(
      complaint.imageUrls.map(async (key) => ({
        key,
        url: await this.s3Service.getPresignedUrl(key),
      })),
    );

    return Object.assign(complaint, { presignedImageUrls });
  }

  private async enrichListWithPresignedUrls(complaints: Complaint[]): Promise<Complaint[]> {
    return Promise.all(complaints.map((c) => this.enrichWithPresignedUrls(c)));
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

    return this.enrichWithPresignedUrls(complaint);
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

  private async generateComplaintNumber(kioskNumber?: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const datePart = dateStr.replace(/-/g, ''); // YYYYMMDD
    const kiosk = kioskNumber || 'GEN';

    let sequence = await this.kioskSequenceRepository.findOne({
      where: { kioskNumber: kiosk, date: dateStr },
    });

    if (sequence) {
      sequence.currentNumber += 1;
    } else {
      sequence = this.kioskSequenceRepository.create({
        kioskNumber: kiosk,
        date: dateStr,
        currentNumber: 1,
      });
    }

    await this.kioskSequenceRepository.save(sequence);

    const runNumber = String(sequence.currentNumber).padStart(4, '0');
    return `VSP-${kiosk}-${datePart}${runNumber}`;
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
