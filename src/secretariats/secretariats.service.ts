import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Secretariat } from './entities/secretariat.entity';
import { PoliceStation } from '../police-stations/entities/police-station.entity';

@Injectable()
export class SecretariatsService {
  constructor(
    @InjectRepository(Secretariat)
    private readonly secretariatRepository: Repository<Secretariat>,
    @InjectRepository(PoliceStation)
    private readonly policeStationRepository: Repository<PoliceStation>,
  ) {}

  /**
   * Returns all secretariats, optionally filtered by police station name.
   * @param policeStation optional police station name (exact match)
   */
  async findAll(policeStation?: string): Promise<Secretariat[]> {
    const queryBuilder = this.secretariatRepository
      .createQueryBuilder('secretariat')
      .orderBy('secretariat.policeStation', 'ASC')
      .addOrderBy('secretariat.name', 'ASC');

    if (policeStation) {
      queryBuilder.where('secretariat.policeStation = :policeStation', {
        policeStation,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Returns every police station together with its associated secretariats.
   * Stations with no secretariats are included with an empty array.
   */
  async findStationsWithSecretariats(): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      zone: PoliceStation['zone'];
      subDivision: PoliceStation['subDivision'];
      secretariats: Array<{ id: string; name: string }>;
    }>
  > {
    const [stations, secretariats] = await Promise.all([
      this.policeStationRepository.find({ order: { name: 'ASC' } }),
      this.secretariatRepository.find({ order: { name: 'ASC' } }),
    ]);

    const byStation = new Map<string, Array<{ id: string; name: string }>>();
    for (const s of secretariats) {
      const list = byStation.get(s.policeStation) ?? [];
      list.push({ id: s.id, name: s.name });
      byStation.set(s.policeStation, list);
    }

    return stations.map((station) => ({
      id: station.id,
      code: station.code,
      name: station.name,
      zone: station.zone,
      subDivision: station.subDivision,
      secretariats: byStation.get(station.name) ?? [],
    }));
  }
}
