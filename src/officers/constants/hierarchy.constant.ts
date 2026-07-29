import { Zone } from '../enums/zone.enum';
import { SubDivision } from '../enums/sub-division.enum';

export const ZONE_SUBDIVISIONS: Record<Zone, SubDivision[]> = {
  [Zone.ZONE_1]: [SubDivision.EAST, SubDivision.DWARAKA, SubDivision.NORTH],
  [Zone.ZONE_2]: [SubDivision.HARBOUR, SubDivision.SOUTH, SubDivision.WEST],
};

export const SUBDIVISION_STATIONS: Record<SubDivision, string[]> = {
  [SubDivision.EAST]: ['II Town', 'Maharanipeta', 'III Town', 'IV Town'],
  [SubDivision.DWARAKA]: ['Dwaraka', 'Muvvalavanipalem', 'Arilova'],
  [SubDivision.NORTH]: ['PM Palem', 'Bhimunipatnam', 'Anandapuram', 'Padmanabham'],
  [SubDivision.HARBOUR]: ['Harbour', 'I Town', 'Malkapuram', 'New Port'],
  [SubDivision.SOUTH]: ['Gajuwaka', 'Duvvada', 'Steel Plant'],
  [SubDivision.WEST]: ['Kancharapalem', 'Airport', 'Gopalapatnam', 'Pendurthy'],
};

export function getStationsForZone(zone: Zone): string[] {
  const subDivisions = ZONE_SUBDIVISIONS[zone];
  return subDivisions.flatMap((sd) => SUBDIVISION_STATIONS[sd]);
}

export function getStationsForSubDivision(
  subDivision: SubDivision,
): string[] {
  return SUBDIVISION_STATIONS[subDivision];
}
