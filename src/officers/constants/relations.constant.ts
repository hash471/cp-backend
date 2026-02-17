/**
 * Maps officer username codes to their direct subordinate username codes.
 * Source: relations.json — the authoritative access-control hierarchy.
 */
export const OFFICER_RELATIONS: Record<string, string[]> = {
  COMM: ['DCP_ZONE1', 'DCP_ZONE2', 'DCP_CRIMES', 'DCP_TRAFFIC', 'ADCP_ADMIN', 'ADCP_CAR'],
  JCP: ['DCP_ZONE1', 'DCP_ZONE2', 'DCP_CRIMES', 'DCP_TRAFFIC', 'ADCP_ADMIN', 'ADCP_CAR'],

  DCP_ZONE1: ['ACP_EAST', 'ACP_DWARAKA', 'ACP_NORTH'],
  ACP_EAST: ['INSP_IITOWN', 'INSP_MR-PETA', 'INSP_IIITOWN', 'INSP_IVTOWN'],
  ACP_DWARAKA: ['INSP_DWARAKA', 'INSP_MVP', 'INSP_ARILOVA'],
  ACP_NORTH: ['INSP_PMPALEM', 'INSP_BHEEMILI', 'INSP_ANANDAPURAM', 'INSP_PADMANABHAM'],

  DCP_ZONE2: ['ACP_HARBOUR', 'ACP_WEST', 'ACP_SOUTH'],
  ACP_HARBOUR: ['INSP_HARBOUR', 'INSP_1TOWN', 'INSP_MALKAPURAM', 'INSP_NEWPORT'],
  ACP_SOUTH: ['INSP_GAJUWAKA', 'INSP_DUVVADA', 'INSP_STEELPLANT'],
  ACP_WEST: ['INSP_KANCHARAPALEM', 'INSP_AIRPORT', 'INSP_GOPALAPATNAM', 'INSP_PENDURTHY'],

  DCP_CRIMES: ['ADCP_CRIMES'],
  ADCP_CRIMES: ['ACP_CRIMES1', 'ACP_CRIMES2'],
  ACP_CRIMES1: ['DCI_EAST', 'DCI_DWARAKA', 'DCI_NORTH'],
  DCI_EAST: ['DSI_IITOWN', 'DSI_MR-PETA', 'DSI_IIITOWN', 'DSI_IVTOWN'],
  DCI_DWARAKA: ['DSI_DWARAKA', 'DSI_MVP', 'DSI_ARILOVA'],
  DCI_NORTH: ['DSI_PMPALEM', 'DSI_BHEEMILI', 'DSI_PADMANABHAM', 'DSI_ANANDAPURAM'],
  ACP_CRIMES2: ['DCI_HARBOUR', 'DCI_SOUTH', 'DCI_WEST'],
  DCI_HARBOUR: ['DSI_HARBOUR', 'DSI_ITOWN', 'DSI_MALKAPURAM', 'DSI_NEWPORT'],
  DCI_SOUTH: ['DSI_GAJUWAKA', 'DSI_DUVVADA', 'DSI_STEELPLANT'],
  DCI_WEST: ['DSI_KANCHARPALEM', 'DSI_AIRPORT', 'DSI_GOPALAPATNAM', 'DSI_PENDURTHY'],

  DCP_TRAFFIC: ['ACP_TRAFFIC1', 'ACP_TRAFFIC2'],
  ACP_TRAFFIC1: ['TI_DELTA1', 'TI_DELTA2', 'TI_DELTA9', 'TI_DELTA8'],
  TI_DELTA1: ['TSI_IITOWNTRAFFIC', 'TSI_MRPETATRAFFIC'],
  TI_DELTA2: ['TSI_3TOWNTRAFFIC', 'TSI_4THTOWNTRAFFIC'],
  TI_DELTA9: ['TSI_DWARAKATRAFFIC', 'TSI_MVPTRAFFIC', 'TSI_ARILOVATRAFFIC'],
  TI_DELTA8: ['TSI_PMPALEMTRAFFIC', 'TSI_ANANDAPURAMTRAFFIC', 'TSI_BHEEMILITRAFFIC'],
  ACP_TRAFFIC2: ['TI_DELTA5', 'TI_DELTA6', 'TI_DELTA7', 'TI_DELTA3', 'TI_DELTA4'],
  TI_DELTA5: ['TSI_ITOWNTRAFFIC', 'TSI_HARBOURTRAFFIC', 'TSI_MALKAPURAMTRAFFIC', 'TSI_NEWPORTTRAFFIC'],
  TI_DELTA6: ['TSI_GAJUWAKATRAFFIC'],
  TI_DELTA7: ['TSI_DUVVADATRAFFIC', 'TSI_STEELPLANTTRAFFIC'],
  TI_DELTA3: ['TSI_KANCHARAPALEMTRAFFIC', 'TSI_AIRPORTTRAFFIC'],
  TI_DELTA4: ['TSI_GOPALAPATNAMTRAFFIC', 'TSI_PENDURTHYTRAFFIC'],

  ADCP_ADMIN: [],
  ADCP_CSB: ['ACP_CSB'],
  ADCP_CAR: ['ACP_CAR1', 'ACP_CAR2'],
};

/**
 * Maps leaf-node officer usernames to the police station names stored in the DB.
 * L&O Inspectors and their corresponding station names.
 */
export const LEAF_STATION_MAP: Record<string, string> = {
  // L&O Inspectors
  'INSP_IITOWN':        'II Town',
  'INSP_MR-PETA':       'MR-Peta',
  'INSP_IIITOWN':       'III Town',
  'INSP_IVTOWN':        'IV Town',
  'INSP_DWARAKA':       'Dwaraka Nagar',
  'INSP_MVP':           'MVP',
  'INSP_ARILOVA':       'Arilova',
  'INSP_PMPALEM':       'PM Palem',
  'INSP_BHEEMILI':      'Bheemili',
  'INSP_ANANDAPURAM':   'Anandapuram',
  'INSP_PADMANABHAM':   'Padmanabham',
  'INSP_HARBOUR':       'Harbour',
  'INSP_1TOWN':         'I Town',
  'INSP_MALKAPURAM':    'Malkapuram',
  'INSP_NEWPORT':       'New Port',
  'INSP_GAJUWAKA':      'Gajuwaka',
  'INSP_DUVVADA':       'Duvvada',
  'INSP_STEELPLANT':    'Steel Plant',
  'INSP_KANCHARAPALEM': 'Kancharapalem',
  'INSP_AIRPORT':       'Airport',
  'INSP_GOPALAPATNAM':  'Gopalapatnam',
  'INSP_PENDURTHY':     'Pendurthy',

  // Detective SIs (same station as their L&O counterpart)
  'DSI_IITOWN':        'II Town',
  'DSI_MR-PETA':       'MR-Peta',
  'DSI_IIITOWN':       'III Town',
  'DSI_IVTOWN':        'IV Town',
  'DSI_DWARAKA':       'Dwaraka Nagar',
  'DSI_MVP':           'MVP',
  'DSI_ARILOVA':       'Arilova',
  'DSI_PMPALEM':       'PM Palem',
  'DSI_BHEEMILI':      'Bheemili',
  'DSI_PADMANABHAM':   'Padmanabham',
  'DSI_ANANDAPURAM':   'Anandapuram',
  'DSI_HARBOUR':       'Harbour',
  'DSI_ITOWN':         'I Town',
  'DSI_MALKAPURAM':    'Malkapuram',
  'DSI_NEWPORT':       'New Port',
  'DSI_GAJUWAKA':      'Gajuwaka',
  'DSI_DUVVADA':       'Duvvada',
  'DSI_STEELPLANT':    'Steel Plant',
  'DSI_KANCHARPALEM':  'Kancharapalem',
  'DSI_AIRPORT':       'Airport',
  'DSI_GOPALAPATNAM':  'Gopalapatnam',
  'DSI_PENDURTHY':     'Pendurthy',

  // Traffic SIs
  'TSI_IITOWNTRAFFIC':        'II Town',
  'TSI_MRPETATRAFFIC':        'MR-Peta',
  'TSI_3TOWNTRAFFIC':         'III Town',
  'TSI_4THTOWNTRAFFIC':       'IV Town',
  'TSI_DWARAKATRAFFIC':       'Dwaraka Nagar',
  'TSI_MVPTRAFFIC':           'MVP',
  'TSI_ARILOVATRAFFIC':       'Arilova',
  'TSI_PMPALEMTRAFFIC':       'PM Palem',
  'TSI_ANANDAPURAMTRAFFIC':   'Anandapuram',
  'TSI_BHEEMILITRAFFIC':      'Bheemili',
  'TSI_ITOWNTRAFFIC':         'I Town',
  'TSI_HARBOURTRAFFIC':       'Harbour',
  'TSI_MALKAPURAMTRAFFIC':    'Malkapuram',
  'TSI_NEWPORTTRAFFIC':       'New Port',
  'TSI_GAJUWAKATRAFFIC':      'Gajuwaka',
  'TSI_DUVVADATRAFFIC':       'Duvvada',
  'TSI_STEELPLANTTRAFFIC':    'Steel Plant',
  'TSI_KANCHARAPALEMTRAFFIC': 'Kancharapalem',
  'TSI_AIRPORTTRAFFIC':       'Airport',
  'TSI_GOPALAPATNAMTRAFFIC':  'Gopalapatnam',
  'TSI_PENDURTHYTRAFFIC':     'Pendurthy',
};

/**
 * Recursively traverses the hierarchy from `username` and collects all
 * unique station names reachable from that node.
 * Returns `null` if the username is not found in the relations map (no restriction).
 */
export function getAccessibleStationsForOfficer(username: string): string[] | null {
  if (!(username in OFFICER_RELATIONS)) {
    return null; // unknown username — let role-based fallback handle it
  }

  const visited = new Set<string>();
  const stations = new Set<string>();

  function traverse(node: string): void {
    if (visited.has(node)) return;
    visited.add(node);

    const children = OFFICER_RELATIONS[node];

    if (!children || children.length === 0) {
      // Leaf node — map to station name
      const stationName = LEAF_STATION_MAP[node];
      if (stationName) stations.add(stationName);
      return;
    }

    for (const child of children) {
      traverse(child);
    }
  }

  traverse(username);
  return [...stations];
}
