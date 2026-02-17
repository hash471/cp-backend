const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '..', 'VSP CITY POLICE OFFICERS LIST (1).xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Station name normalization (Excel → canonical name)
const stationNormalize = {
  '1 Town': 'I Town',
  'I Town': 'I Town',
  'Steelplant': 'Steel Plant',
  'Steel Plant': 'Steel Plant',
  'Kancharpalem': 'Kancharapalem',
  'Kancharapalem': 'Kancharapalem',
};

// Traffic station name normalization (Excel → canonical L&O station name)
const trafficNormalize = {
  'II Town Traffic': 'II Town',
  'MR Peta Traffic': 'MR-Peta',
  '3Town Traffic': 'III Town',
  '4th Town Traffic': 'IV Town',
  'Dwaraka Traffic': 'Dwaraka',
  'MVP Traffic': 'MVP',
  'Arilova Traffic': 'Arilova',
  'PM Palem Traffic': 'PM Palem',
  'Anandapuram Traffic': 'Anandapuram',
  'Bheemili Traffic': 'Bheemili',
  'I Town Traffic': 'I Town',
  'Harbour Traffic': 'Harbour',
  'Malkapuram Traffic': 'Malkapuram',
  'Newport Traffic': 'New Port',
  'Gajuwaka Traffic': 'Gajuwaka',
  'Duvvada Traffic': 'Duvvada',
  'Steelplant Traffic': 'Steel Plant',
  'Kancharapalem Traffic': 'Kancharapalem',
  'Airport Traffic': 'Airport',
  'Gopalapatnam Traffic': 'Gopalapatnam',
  'Pendurthy Traffic': 'Pendurthy',
};

function normalize(s) {
  if (!s) return null;
  s = s.trim();
  return stationNormalize[s] || s;
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

// Zone mapping from subdivision
const zone1Subs = ['EAST', 'DWARAKA', 'NORTH'];
const zone2Subs = ['HARBOUR', 'SOUTH', 'WEST'];

function getZone(subDiv) {
  if (zone1Subs.includes(subDiv)) return 'ZONE_1';
  if (zone2Subs.includes(subDiv)) return 'ZONE_2';
  return null;
}

// Station codes for L&O stations
const codeMap = {
  'II Town': 'VZG-02',
  'MR-Peta': 'VZG-MRP',
  'III Town': 'VZG-03',
  'IV Town': 'VZG-04',
  'Dwaraka': 'VZG-DWK',
  'MVP': 'VZG-MVP',
  'Arilova': 'VZG-ARL',
  'PM Palem': 'VZG-PMD',
  'Bheemili': 'VZG-BHM',
  'Anandapuram': 'VZG-ANP',
  'Padmanabham': 'VZG-PDN',
  'Harbour': 'VZG-HRB',
  'I Town': 'VZG-01',
  'Malkapuram': 'VZG-MLK',
  'New Port': 'VZG-NPT',
  'Gajuwaka': 'VZG-GJW',
  'Duvvada': 'VZG-DVD',
  'Steel Plant': 'VZG-STL',
  'Kancharapalem': 'VZG-KND',
  'Airport': 'VZG-AIR',
  'Gopalapatnam': 'VZG-GPL',
  'Pendurthy': 'VZG-PND',
};

// Traffic station codes (T- prefix)
const trafficCodeMap = {};
for (const [name, code] of Object.entries(codeMap)) {
  trafficCodeMap[name] = code + '-T';
}

// Address, pincode, phone, lat/lng for each station
const stationMeta = {
  'II Town':        { address: 'Two Town, Visakhapatnam',            pincode: '530002', phone: '0891-2564002', lat: 17.6924, lng: 83.2145 },
  'MR-Peta':        { address: 'Maharanipeta, Visakhapatnam',        pincode: '530002', phone: '0891-2564022', lat: 17.6945, lng: 83.2089 },
  'III Town':       { address: 'Three Town, Visakhapatnam',          pincode: '530003', phone: '0891-2564003', lat: 17.6998, lng: 83.2167 },
  'IV Town':        { address: 'Four Town, Visakhapatnam',           pincode: '530004', phone: '0891-2564004', lat: 17.7052, lng: 83.2298 },
  'Dwaraka':        { address: 'Dwaraka Nagar, Visakhapatnam',       pincode: '530016', phone: '0891-2564016', lat: 17.7234, lng: 83.3012 },
  'MVP':            { address: 'MVP Colony, Visakhapatnam',           pincode: '530017', phone: '0891-2564017', lat: 17.7412, lng: 83.2567 },
  'Arilova':        { address: 'Arilova, Visakhapatnam',             pincode: '530040', phone: '0891-2564040', lat: 17.7634, lng: 83.3412 },
  'PM Palem':       { address: 'PM Palem, Visakhapatnam',            pincode: '530041', phone: '0891-2564041', lat: 17.7523, lng: 83.3145 },
  'Bheemili':       { address: 'Bheemili, Visakhapatnam',            pincode: '531163', phone: '0891-2564163', lat: 17.8845, lng: 83.4278 },
  'Anandapuram':    { address: 'Anandapuram, Visakhapatnam',         pincode: '531173', phone: '0891-2564174', lat: 17.8312, lng: 83.3756 },
  'Padmanabham':    { address: 'Padmanabham, Visakhapatnam',         pincode: '531219', phone: '0891-2564175', lat: 17.8456, lng: 83.3945 },
  'Harbour':        { address: 'Visakhapatnam Port Area',            pincode: '530035', phone: '0891-2564035', lat: 17.6789, lng: 83.2867 },
  'I Town':         { address: 'One Town, Visakhapatnam',            pincode: '530001', phone: '0891-2564001', lat: 17.6868, lng: 83.2185 },
  'Malkapuram':     { address: 'Malkapuram, Visakhapatnam',          pincode: '530011', phone: '0891-2564011', lat: 17.6712, lng: 83.2345 },
  'New Port':       { address: 'New Port Area, Visakhapatnam',       pincode: '530035', phone: '0891-2564036', lat: 17.6734, lng: 83.2789 },
  'Gajuwaka':       { address: 'Gajuwaka, Visakhapatnam',            pincode: '530026', phone: '0891-2564026', lat: 17.6534, lng: 83.2012 },
  'Duvvada':        { address: 'Duvvada, Visakhapatnam',             pincode: '530046', phone: '0891-2564046', lat: 17.6234, lng: 83.1567 },
  'Steel Plant':    { address: 'Steel Plant Township, Visakhapatnam', pincode: '530032', phone: '0891-2564032', lat: 17.6312, lng: 83.1567 },
  'Kancharapalem':  { address: 'Kancharapalem, Visakhapatnam',       pincode: '530008', phone: '0891-2564008', lat: 17.7134, lng: 83.2678 },
  'Airport':        { address: 'Airport Road, Visakhapatnam',        pincode: '530009', phone: '0891-2564009', lat: 17.7212, lng: 83.2245 },
  'Gopalapatnam':   { address: 'Gopalapatnam, Visakhapatnam',        pincode: '530027', phone: '0891-2564027', lat: 17.7456, lng: 83.2567 },
  'Pendurthy':      { address: 'Pendurthi, Visakhapatnam',           pincode: '531173', phone: '0891-2564173', lat: 17.8123, lng: 83.2456 },
};

// Valid L&O station names
const validStations = new Set(Object.keys(codeMap));

// Extract L&O stations from Excel
const lawOrderStations = new Map();
// Extract Traffic stations from Excel
const trafficStations = new Map();

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const rawStation = (row[3] || '').toString().trim();
  const rawSubDiv = (row[4] || '').toString().trim();
  const subDiv = subDivMap[rawSubDiv] || subDivMap[rawSubDiv.trim()] || null;

  // Check if it's a traffic station
  if (trafficNormalize[rawStation]) {
    const baseName = trafficNormalize[rawStation];
    if (!trafficStations.has(baseName)) {
      trafficStations.set(baseName, subDiv);
    }
    continue;
  }

  // Check if it's a L&O station
  const station = normalize(rawStation);
  if (station && validStations.has(station) && !lawOrderStations.has(station)) {
    lawOrderStations.set(station, subDiv);
  }
}

// For traffic stations missing subdivisions, inherit from L&O station
for (const [name, subDiv] of trafficStations) {
  if (!subDiv && lawOrderStations.has(name)) {
    trafficStations.set(name, lawOrderStations.get(name));
  }
}

// Build ordered arrays
const orderedSubDivs = [
  { zone: 'ZONE_1', subDiv: 'EAST' },
  { zone: 'ZONE_1', subDiv: 'DWARAKA' },
  { zone: 'ZONE_1', subDiv: 'NORTH' },
  { zone: 'ZONE_2', subDiv: 'HARBOUR' },
  { zone: 'ZONE_2', subDiv: 'SOUTH' },
  { zone: 'ZONE_2', subDiv: 'WEST' },
];

function buildOrdered(stationMap) {
  const result = [];
  for (const { zone, subDiv } of orderedSubDivs) {
    for (const [name, sd] of stationMap) {
      if (sd === subDiv) {
        result.push({ name, zone, subDiv: sd });
      }
    }
  }
  // Catch any that didn't match
  for (const [name, sd] of stationMap) {
    if (!result.find(s => s.name === name)) {
      const zone = getZone(sd) || 'ZONE_1';
      result.push({ name, zone, subDiv: sd });
    }
  }
  return result;
}

const loStations = buildOrdered(lawOrderStations);
const trStations = buildOrdered(trafficStations);

// Generate TypeScript
const subDivComments = {
  'EAST': 'East Sub-Division',
  'DWARAKA': 'Dwaraka Sub-Division',
  'NORTH': 'North Sub-Division',
  'HARBOUR': 'Harbour Sub-Division',
  'SOUTH': 'South Sub-Division',
  'WEST': 'West Sub-Division',
};

let ts = `import { PoliceStation } from '../../police-stations/entities/police-station.entity';
import { Zone } from '../../officers/enums/zone.enum';
import { SubDivision } from '../../officers/enums/sub-division.enum';
import { StationType } from '../../police-stations/enums/station-type.enum';

export const policeStationsSeedData: Partial<PoliceStation>[] = [
`;

function writeStations(stations, stationType, codeMapToUse, namePrefix) {
  let lastGroup = '';
  stations.forEach((s) => {
    const group = `${s.zone} → ${subDivComments[s.subDiv] || s.subDiv}`;
    if (group !== lastGroup) {
      if (lastGroup) ts += '\n';
      ts += `  // ${group}\n`;
      lastGroup = group;
    }

    const meta = stationMeta[s.name] || {};
    const code = codeMapToUse[s.name] || `VZG-${s.name.substring(0, 3).toUpperCase()}`;
    const displayName = namePrefix ? `${s.name} ${namePrefix}` : s.name;
    const address = meta.address
      ? (namePrefix ? `${namePrefix}, ${meta.address}` : meta.address)
      : `${displayName}, Visakhapatnam`;

    ts += '  {\n';
    ts += `    code: ${JSON.stringify(code)},\n`;
    ts += `    name: ${JSON.stringify(displayName)},\n`;
    ts += `    address: ${JSON.stringify(address)},\n`;
    ts += `    district: 'Visakhapatnam',\n`;
    ts += `    city: 'Visakhapatnam',\n`;
    ts += `    state: 'Andhra Pradesh',\n`;
    ts += `    pincode: ${JSON.stringify(meta.pincode || '530001')},\n`;
    ts += `    phone: ${JSON.stringify(meta.phone || '0891-2560000')},\n`;
    ts += `    latitude: ${meta.lat || 17.7},\n`;
    ts += `    longitude: ${meta.lng || 83.3},\n`;
    ts += `    type: StationType.${stationType},\n`;
    ts += `    zone: Zone.${s.zone},\n`;
    ts += `    subDivision: SubDivision.${s.subDiv},\n`;
    ts += '    isActive: true,\n';
    ts += '  },\n';
  });
}

ts += '  // ==========================================\n';
ts += '  // L&O (Law & Order) Police Stations\n';
ts += '  // ==========================================\n';
writeStations(loStations, 'LAW_AND_ORDER', codeMap, '');

ts += '\n  // ==========================================\n';
ts += '  // Traffic Police Stations\n';
ts += '  // ==========================================\n';
writeStations(trStations, 'TRAFFIC', trafficCodeMap, 'Traffic');

ts += '];\n';

const outPath = path.join(__dirname, '..', 'src', 'database', 'seeds', 'police-stations.seed.ts');
fs.writeFileSync(outPath, ts);

const total = loStations.length + trStations.length;
console.log(`Generated ${total} police stations (${loStations.length} L&O + ${trStations.length} Traffic) in ${outPath}`);

// Print summary
console.log('\nL&O Stations by zone/subdivision:');
const loCounts = {};
loStations.forEach(s => { const k = `${s.zone} / ${s.subDiv}`; loCounts[k] = (loCounts[k] || 0) + 1; });
Object.entries(loCounts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

console.log('\nTraffic Stations by zone/subdivision:');
const trCounts = {};
trStations.forEach(s => { const k = `${s.zone} / ${s.subDiv}`; trCounts[k] = (trCounts[k] || 0) + 1; });
Object.entries(trCounts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
