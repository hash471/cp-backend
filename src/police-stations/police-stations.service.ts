import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliceStation } from './entities/police-station.entity';
import { CreatePoliceStationDto } from './dto/create-police-station.dto';
import { UpdatePoliceStationDto } from './dto/update-police-station.dto';
import { FilterPoliceStationDto } from './dto/filter-police-station.dto';
import { Officer } from '../officers/entities/officer.entity';
import { Role } from '../officers/enums/role.enum';
import { getAccessibleStationsForOfficer } from '../officers/constants/relations.constant';

@Injectable()
export class PoliceStationsService {
  constructor(
    @InjectRepository(PoliceStation)
    private readonly policeStationRepository: Repository<PoliceStation>,
  ) {}

  async create(
    createPoliceStationDto: CreatePoliceStationDto,
  ): Promise<PoliceStation> {
    const policeStation = this.policeStationRepository.create(
      createPoliceStationDto,
    );
    return this.policeStationRepository.save(policeStation);
  }

  private getAllowedStationNames(officer: Officer): string[] | null {
    if (officer.role === Role.COMMISSIONER || officer.role === Role.JOINT_COMMISSIONER) {
      return null;
    }
    const code = officer.officerCode || officer.username;
    const relationsStations = getAccessibleStationsForOfficer(code);
    if (relationsStations !== null) {
      return relationsStations;
    }
    if (officer.policeStation) {
      return [officer.policeStation];
    }
    return [];
  }

  async findAll(filterDto: FilterPoliceStationDto, officer?: Officer): Promise<{
    data: PoliceStation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      zone,
      subDivision,
      type,
      district,
      city,
      isActive,
      nearLatitude,
      nearLongitude,
      radiusKm,
      sortBy = 'name',
      sortOrder = 'ASC',
      page = 1,
      limit = 10,
    } = filterDto;

    const queryBuilder = this.policeStationRepository
      .createQueryBuilder('station');

    if (officer) {
      const allowed = this.getAllowedStationNames(officer);
      if (allowed !== null) {
        if (allowed.length === 0) {
          queryBuilder.andWhere('1 = 0');
        } else {
          queryBuilder.andWhere('station.name IN (:...allowedNames)', { allowedNames: allowed });
        }
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(station.name ILIKE :search OR station.code ILIKE :search OR station.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (zone) {
      queryBuilder.andWhere('station.zone = :zone', { zone });
    }

    if (subDivision) {
      queryBuilder.andWhere('station.subDivision = :subDivision', { subDivision });
    }

    if (type) {
      queryBuilder.andWhere('station.type = :type', { type });
    }

    if (district) {
      queryBuilder.andWhere('station.district ILIKE :district', {
        district: `%${district}%`,
      });
    }

    if (city) {
      queryBuilder.andWhere('station.city ILIKE :city', {
        city: `%${city}%`,
      });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('station.isActive = :isActive', { isActive });
    }

    // If coordinates provided, calculate distance and optionally filter by radius
    if (nearLatitude !== undefined && nearLongitude !== undefined) {
      queryBuilder.addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(station.latitude)) * cos(radians(station.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(station.latitude))))`,
        'distance',
      );
      queryBuilder.setParameter('lat', nearLatitude);
      queryBuilder.setParameter('lng', nearLongitude);

      if (radiusKm) {
        queryBuilder.andWhere(
          `(6371 * acos(cos(radians(:lat)) * cos(radians(station.latitude)) * cos(radians(station.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(station.latitude)))) <= :radius`,
          { radius: radiusKm },
        );
      }

      queryBuilder.orderBy('distance', 'ASC');
    } else {
      const allowedSortFields = ['name', 'code', 'zone', 'subDivision', 'type', 'createdAt'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
      const validSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`station.${validSortBy}`, validSortOrder);
    }

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

  async findOne(id: string): Promise<PoliceStation> {
    const station = await this.policeStationRepository.findOne({
      where: { id },
    });

    if (!station) {
      throw new NotFoundException(`Police station with ID "${id}" not found`);
    }

    return station;
  }

  async findByCode(code: string): Promise<PoliceStation> {
    const station = await this.policeStationRepository.findOne({
      where: { code },
    });

    if (!station) {
      throw new NotFoundException(
        `Police station with code "${code}" not found`,
      );
    }

    return station;
  }

  async update(
    id: string,
    updatePoliceStationDto: UpdatePoliceStationDto,
  ): Promise<PoliceStation> {
    const station = await this.findOne(id);
    Object.assign(station, updatePoliceStationDto);
    return this.policeStationRepository.save(station);
  }

  async remove(id: string): Promise<void> {
    const station = await this.findOne(id);
    await this.policeStationRepository.remove(station);
  }

  async getActiveStations(officer?: Officer): Promise<PoliceStation[]> {
    const queryBuilder = this.policeStationRepository
      .createQueryBuilder('station')
      .where('station.isActive = :isActive', { isActive: true })
      .orderBy('station.name', 'ASC');

    if (officer) {
      const allowed = this.getAllowedStationNames(officer);
      if (allowed !== null) {
        if (allowed.length === 0) {
          queryBuilder.andWhere('1 = 0');
        } else {
          queryBuilder.andWhere('station.name IN (:...allowedNames)', { allowedNames: allowed });
        }
      }
    }

    return queryBuilder.getMany();
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async findNearestStation(
    latitude: number,
    longitude: number,
  ): Promise<{ station: PoliceStation; distanceKm: number }> {
    const stations = await this.getActiveStations();

    if (stations.length === 0) {
      throw new NotFoundException('No active police stations found');
    }

    let nearestStation = stations[0];
    let minDistance = this.calculateDistance(
      latitude,
      longitude,
      Number(nearestStation.latitude),
      Number(nearestStation.longitude),
    );

    for (const station of stations) {
      if (station.latitude && station.longitude) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          Number(station.latitude),
          Number(station.longitude),
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = station;
        }
      }
    }

    return {
      station: nearestStation,
      distanceKm: Math.round(minDistance * 100) / 100,
    };
  }
}
