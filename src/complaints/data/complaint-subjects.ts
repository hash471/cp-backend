/**
 * Static Subject -> Sub-Subject catalogue used when filing a complaint.
 * Kept as a plain .ts constant (no DB table) for now.
 */
export interface SubjectGroup {
  subject: string;
  subSubjects: string[];
}

export const COMPLAINT_SUBJECTS: SubjectGroup[] = [
  {
    subject: 'Administration Related',
    subSubjects: ['Admin Related / Complaint on Police'],
  },
  {
    subject:
      'Complaints on Secretariat Employees- Mahila Police and Women & Child Welfare Assistant',
    subSubjects: ['Rude Behavior towards Citizens'],
  },
  {
    subject: 'Crime',
    subSubjects: [
      'Accidents',
      'Bodily Offence',
      'Cheating by Cyber Crime / by Financial Institutions / by Individuals / by Forgery',
      'Cheating in the name of Love/Marriage',
      'Crime Against Children',
      'Crime Against Sc Sts',
      'Crime against Women - (Otraging of modesty / Attempt to Rape / Rape / Dowry / Death / Dowry Murder / Murder)',
      'Criminal Defamation',
      'Cyber Crime (Non Financial)',
      'Eve Teasing',
      'Immoral Trafficking',
      'Land Disputes/ Property Disputes/ Criminal Tresspass / Civil Disputes / Money Matters',
      'Marriage Offence / Dowry Harassment',
      'Mischief / Damage to Property',
      'Missing / Elopment / Kidnap / Abduction',
      'Petty Quarell / Nuisance / Affray',
      'Property Offence',
    ],
  },
  {
    subject: 'Enforcement',
    subSubjects: [
      'Drugs/ Gutka/ Narcotics/ Excise/ Gambling/ Open Drinking',
      'Illegal Transportation of Sand and Other Mineral/ Cattle',
      'Police Services (Traffic)',
    ],
  },
  {
    subject: 'Law & Order related',
    subSubjects: [
      'ATM Skimming/ UPI Frauds',
      'Abetment of Suicide (Women)',
      'Arms Act Violations',
      'Assault with Deadly Weapon',
      'Attempt to Murder',
      'Cheating and Criminal Breach of Trust',
      'Child Kidnapping',
      'Child Labour/ Trafficking',
      'Culpable Homicide Not Amounting to Murder',
      'Custodial Deaths',
      'Cyber Crime - Financial Fraud',
      'Cyber Crime - Obscene Content',
      'Dacoity',
      'Dowry Deaths',
      'Dowry Harassment',
      'Excise Cases (Illicit Liquor)',
      'Extortion',
      'Financial Frauds',
      'Gambing Cases',
      'Gang Rape',
      'Grievous Hurt',
      'House Burglary Day',
      'House Burglary Night',
      'Kidnapping for Ransom',
      'Land Grabbing Cases',
      'Missing Persons',
      'Molestation/ Eve-Teasing',
      'Murder',
      'Murder for Gain',
      'NDPS Act Cases',
      'Ordinary Theft',
      'POCSO Act Cases (involving minor boys)',
      'POCSO Act Cases (involving minor girls)',
      'Rape',
      'Rioting and Group Clashes',
      'Robbery',
      'Sexual Harassment',
      'Simple Hurt',
      'Snatching',
      'Traffic Related Issues',
      'Unidentified Dead Bodies',
      'Vehicle Theft',
    ],
  },
];
