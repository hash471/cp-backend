import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Officer } from './entities/officer.entity';
import { CreateOfficerDto } from './dto/create-officer.dto';
import { UpdateOfficerDto } from './dto/update-officer.dto';
import { Role } from './enums/role.enum';
import { generateUsername } from './utils/username-generator';
import { ZONE_SUBDIVISIONS } from './constants/hierarchy.constant';

@Injectable()
export class OfficersService {
  constructor(
    @InjectRepository(Officer)
    private readonly officerRepository: Repository<Officer>,
  ) {}

  async create(createOfficerDto: CreateOfficerDto): Promise<Officer> {
    this.validateRoleFields(createOfficerDto);

    // Auto-generate username
    const username = generateUsername(
      createOfficerDto.role,
      createOfficerDto.zone ?? null,
      createOfficerDto.subDivision ?? null,
      createOfficerDto.policeStation ?? null,
    );

    const existingUsername = await this.officerRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException(
        `An officer with username ${username} already exists`,
      );
    }

    const officer = this.officerRepository.create({
      ...createOfficerDto,
      username,
    });
    return this.officerRepository.save(officer);
  }

  /**
   * RBAC filtering logic for officers:
   * - COMMISSIONER / JCP → see all officers
   * - DCP → see ACPs, Inspectors, SIs in their zone
   * - ACP → see Inspectors, SIs in their subdivision
   * - INSPECTOR → see SIs at their police station
   * - SI → see only themselves
   */
  private applyRbacFilter(
    qb: SelectQueryBuilder<Officer>,
    requestingOfficer: Officer,
  ): void {
    const { role, zone, subDivision, policeStation, id } = requestingOfficer;

    switch (role) {
      case Role.COMMISSIONER:
      case Role.JOINT_COMMISSIONER:
        // See all officers
        break;

      case Role.DCP:
        if (!zone) {
          qb.andWhere('1 = 0');
          break;
        }
        // DCP sees ACPs, Inspectors, SIs in their zone
        const subDivisions = ZONE_SUBDIVISIONS[zone] || [];
        qb.andWhere('officer.role IN (:...subordinateRoles)', {
          subordinateRoles: [Role.ACP, Role.INSPECTOR, Role.SUB_INSPECTOR],
        });
        qb.andWhere(
          '(officer.zone = :zone OR officer.subDivision IN (:...subDivisions))',
          { zone, subDivisions },
        );
        break;

      case Role.ACP:
        if (!subDivision) {
          qb.andWhere('1 = 0');
          break;
        }
        // ACP sees Inspectors & SIs in their subdivision
        qb.andWhere('officer.role IN (:...subordinateRoles)', {
          subordinateRoles: [Role.INSPECTOR, Role.SUB_INSPECTOR],
        });
        qb.andWhere('officer.subDivision = :subDivision', { subDivision });
        break;

      case Role.INSPECTOR:
        if (!policeStation) {
          qb.andWhere('1 = 0');
          break;
        }
        // Inspector sees SIs at their police station
        qb.andWhere('officer.role = :subordinateRole', {
          subordinateRole: Role.SUB_INSPECTOR,
        });
        qb.andWhere('officer.policeStation = :policeStation', { policeStation });
        break;

      case Role.SUB_INSPECTOR:
        // SI sees only themselves
        qb.andWhere('officer.id = :selfId', { selfId: id });
        break;

      default:
        qb.andWhere('1 = 0');
    }
  }

  async findAll(requestingOfficer: Officer): Promise<Officer[]> {
    const qb = this.officerRepository
      .createQueryBuilder('officer')
      .orderBy('officer.name', 'ASC');

    this.applyRbacFilter(qb, requestingOfficer);

    return qb.getMany();
  }

  async findOne(id: string): Promise<Officer> {
    const officer = await this.officerRepository.findOne({ where: { id } });
    if (!officer) {
      throw new NotFoundException(`Officer with ID "${id}" not found`);
    }
    return officer;
  }

  async findByMobileNumber(mobileNumber: string): Promise<Officer | null> {
    return this.officerRepository.findOne({ where: { mobileNumber } });
  }

  async findByUsername(username: string): Promise<Officer | null> {
    return this.officerRepository.findOne({ where: { username } });
  }

  async update(
    id: string,
    updateOfficerDto: UpdateOfficerDto,
  ): Promise<Officer> {
    const officer = await this.findOne(id);

    Object.assign(officer, updateOfficerDto);
    return this.officerRepository.save(officer);
  }

  async remove(id: string): Promise<void> {
    const officer = await this.findOne(id);
    await this.officerRepository.remove(officer);
  }

  private validateRoleFields(dto: CreateOfficerDto): void {
    const { role, zone, subDivision, policeStation } = dto;

    if (role === Role.DCP && !zone) {
      throw new BadRequestException('Zone is required for DCP role');
    }
    if (role === Role.ACP && !subDivision) {
      throw new BadRequestException('Sub-division is required for ACP role');
    }
    if (
      (role === Role.INSPECTOR || role === Role.SUB_INSPECTOR) &&
      !policeStation
    ) {
      throw new BadRequestException(
        'Police station is required for Inspector/Sub-Inspector role',
      );
    }
  }
}
