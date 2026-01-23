import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliceStation } from './entities/police-station.entity';
import { CreatePoliceStationDto } from './dto/create-police-station.dto';
import { UpdatePoliceStationDto } from './dto/update-police-station.dto';
import { FilterPoliceStationDto } from './dto/filter-police-station.dto';

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

  async findAll(filterDto: FilterPoliceStationDto): Promise<PoliceStation[]> {
    const { search, district, city, isActive, nearLatitude, nearLongitude, radiusKm } =
      filterDto;

    const queryBuilder = this.policeStationRepository
      .createQueryBuilder('station')
      .orderBy('station.name', 'ASC');

    if (search) {
      queryBuilder.andWhere(
        '(station.name ILIKE :search OR station.code ILIKE :search OR station.address ILIKE :search)',
        { search: `%${search}%` },
      );
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
      // Haversine formula for distance calculation in PostgreSQL
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
    }

    return queryBuilder.getMany();
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

  async getActiveStations(): Promise<PoliceStation[]> {
    return this.policeStationRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
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
