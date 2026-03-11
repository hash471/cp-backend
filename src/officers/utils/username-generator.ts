import { Role } from '../enums/role.enum';
import { Zone } from '../enums/zone.enum';
import { SubDivision } from '../enums/sub-division.enum';

const RANK_PREFIX: Record<Role, string> = {
  [Role.ADMIN]: 'ADMIN',
  [Role.COMMISSIONER]: 'COMM',
  [Role.JOINT_COMMISSIONER]: 'JCP',
  [Role.DCP]: 'DCP',
  [Role.ACP]: 'ACP',
  [Role.INSPECTOR]: 'INSP',
  [Role.SUB_INSPECTOR]: 'SI',
};

function normalizeStationName(station: string): string {
  return station.replace(/\s+/g, '').toUpperCase();
}

export function generateUsername(
  role: Role,
  zone: Zone | null | undefined,
  subDivision: SubDivision | null | undefined,
  policeStation: string | null | undefined,
): string {
  const prefix = RANK_PREFIX[role];

  switch (role) {
    case Role.ADMIN:
    case Role.COMMISSIONER:
    case Role.JOINT_COMMISSIONER:
      return prefix;
    case Role.DCP:
      return zone ? `${prefix}_${zone.replace('_', '')}` : prefix;
    case Role.ACP:
      return subDivision ? `${prefix}_${subDivision}` : prefix;
    case Role.INSPECTOR:
    case Role.SUB_INSPECTOR:
      return policeStation
        ? `${prefix}_${normalizeStationName(policeStation)}`
        : prefix;
    default:
      return prefix;
  }
}
