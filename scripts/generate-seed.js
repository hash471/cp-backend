const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'VSP CITY POLICE OFFICERS LIST (1).xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Station name normalization map (Excel → Seed)
const stationMap = {
  '1 Town': 'I Town',
  'I Town': 'I Town',
  'Steelplant': 'Steel Plant',
  'Steel Plant': 'Steel Plant',
  'Kancharpalem': 'Kancharapalem',
};

function normalizeStation(s) {
  if (!s) return null;
  s = s.trim();
  return stationMap[s] || s;
}

// Subdivision mapping
const subDivMap = {
  'East': 'EAST',
  'Dwaraka': 'DWARAKA',
  ' Dwaraka': 'DWARAKA',
  'DWK': 'DWARAKA',
  'North': 'NORTH',
  'Harbour': 'HARBOUR',
  'South': 'SOUTH',
  'West': 'WEST',
};

// Known police stations in the seed
const knownStations = new Set([
  'II Town', 'MR-Peta', 'III Town', 'IV Town',
  'Dwaraka', 'MVP', 'Arilova',
  'PM Palem', 'Bheemili', 'Anandapuram', 'Padmanabham',
  'Harbour', 'I Town', 'Malkapuram', 'New Port',
  'Gajuwaka', 'Duvvada', 'Steel Plant',
  'Kancharapalem', 'Airport', 'Gopalapatnam', 'Pendurthy',
]);

function getRole(rank) {
  rank = rank.trim();
  if (rank === 'Commissioner of Police') return 'COMMISSIONER';
  if (rank === 'Joint Commissioner of Police') return 'JOINT_COMMISSIONER';
  if (rank.startsWith('D.C.P') || rank.startsWith('Addl.D.C.P')) return 'DCP';
  if (rank.startsWith('ACP')) return 'ACP';
  if (rank.includes('Inspector') && !rank.includes('Sub-Inspector')) return 'INSPECTOR';
  if (rank.includes('Sub-Inspector')) return 'SUB_INSPECTOR';
  return 'INSPECTOR';
}

function getZone(row, rank) {
  rank = (rank || '').trim();
  const station = (row[3] || '').trim();
  const subDiv = (row[4] || '').trim();

  if (rank === 'Commissioner of Police' || rank === 'Joint Commissioner of Police') return null;

  if (rank.includes('L&O - I')) return 'ZONE_1';
  if (rank.includes('L&O - II')) return 'ZONE_2';
  if (station.includes('Zone - 1')) return 'ZONE_1';
  if (station.includes('Zone - 2')) return 'ZONE_2';

  // Crimes/Traffic/Admin DCP/Addl.DCP covers both zones
  if ((rank.includes('D.C.P') || rank.includes('Addl.D.C.P')) &&
      (rank.includes('Crimes') || rank.includes('Traffic') || rank.includes('Admin') || rank.includes('CSB') || rank.includes('CAR'))) {
    return null;
  }

  // Zone 1 subdivisions
  const zone1Subs = ['East', 'Dwaraka', 'North'];
  const zone2Subs = ['Harbour', 'South', 'West'];

  const cleanSubDiv = subDiv.trim();
  if (zone1Subs.includes(cleanSubDiv)) return 'ZONE_1';
  if (zone2Subs.includes(cleanSubDiv)) return 'ZONE_2';

  // Multi-subdivision strings
  const hasZ1 = zone1Subs.some(s => subDiv.includes(s));
  const hasZ2 = zone2Subs.some(s => subDiv.includes(s));
  if (hasZ1 && hasZ2) return null;
  if (hasZ1) return 'ZONE_1';
  if (hasZ2) return 'ZONE_2';

  return null;
}

function getSubDivision(row, rank) {
  rank = (rank || '').trim();
  const subDiv = (row[4] || '').trim();
  const role = getRole(rank);

  if (role === 'COMMISSIONER' || role === 'JOINT_COMMISSIONER' || role === 'DCP') return null;

  // Multi-subdivision ACPs (Crimes, Traffic, CSB, CAR)
  if (rank.includes('Crimes') || rank.includes('Taffic') || rank.includes('Traffic') ||
      rank.includes('CSB') || rank.includes('CAR')) {
    // Single subdivision in column
    if (subDivMap[subDiv]) return subDivMap[subDiv];
    return null;
  }

  // L&O ACP - extract subdivision from rank name
  if (subDiv === 'L&O') {
    if (rank.includes('East')) return 'EAST';
    if (rank.includes('Dwaraka') || rank.includes('DWK')) return 'DWARAKA';
    if (rank.includes('North')) return 'NORTH';
    if (rank.includes('Harbour') || rank.includes('HBR')) return 'HARBOUR';
    if (rank.includes('South')) return 'SOUTH';
    if (rank.includes('West')) return 'WEST';
    return null;
  }

  if (subDivMap[subDiv]) return subDivMap[subDiv];
  return null;
}

function getPoliceStation(row, rank) {
  rank = (rank || '').trim();
  const role = getRole(rank);

  if (role === 'COMMISSIONER' || role === 'JOINT_COMMISSIONER' || role === 'DCP' || role === 'ACP') return null;

  const station = normalizeStation(row[3]);
  if (station && knownStations.has(station)) return station;

  // Return the station even if not in known list (for crimes/traffic)
  return station;
}

const officers = [];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const name = (row[1] || '').trim();
  const rank = (row[2] || '').trim();
  const username = row[6];
  const mobile = String(row[5]);

  const role = getRole(rank);
  const zone = getZone(row, rank);
  const subDivision = getSubDivision(row, rank);
  const policeStation = getPoliceStation(row, rank);

  officers.push({
    name,
    username,
    mobileNumber: mobile,
    password: mobile,
    role,
    zone,
    subDivision,
    policeStation,
    designation: rank,
    isActive: true,
  });
}

// Generate TypeScript file
let ts = `import { Officer } from '../../officers/entities/officer.entity';
import { Role } from '../../officers/enums/role.enum';
import { Zone } from '../../officers/enums/zone.enum';
import { SubDivision } from '../../officers/enums/sub-division.enum';

export const officersSeedData: Partial<Officer>[] = [
`;

officers.forEach((o, idx) => {
  // Section comments
  if (idx === 0) ts += '  // === L&O Wing ===\n';
  if (idx === 32) ts += '\n  // === Crimes Wing ===\n';
  if (idx === 64) ts += '\n  // === Traffic Wing ===\n';
  if (idx === 97) ts += '\n  // === Admin / Special Units ===\n';

  ts += '  {\n';
  ts += `    name: ${JSON.stringify(o.name)},\n`;
  ts += `    username: ${JSON.stringify(o.username)},\n`;
  ts += `    mobileNumber: ${JSON.stringify(o.mobileNumber)},\n`;
  ts += `    password: ${JSON.stringify(o.password)},\n`;
  ts += `    role: Role.${o.role},\n`;
  if (o.zone) ts += `    zone: Zone.${o.zone},\n`;
  if (o.subDivision) ts += `    subDivision: SubDivision.${o.subDivision},\n`;
  if (o.policeStation) ts += `    policeStation: ${JSON.stringify(o.policeStation)},\n`;
  ts += `    designation: ${JSON.stringify(o.designation)},\n`;
  ts += '    isActive: true,\n';
  ts += '  },\n';
});

ts += '];\n';

const outPath = path.join(__dirname, '..', 'src', 'database', 'seeds', 'officers.seed.ts');
fs.writeFileSync(outPath, ts);
console.log(`Generated ${officers.length} officers in ${outPath}`);

// Print summary
const roleCounts = {};
officers.forEach(o => { roleCounts[o.role] = (roleCounts[o.role] || 0) + 1; });
console.log('\nRole breakdown:');
Object.entries(roleCounts).forEach(([role, count]) => console.log(`  ${role}: ${count}`));
