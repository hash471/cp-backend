/**
 * Static Subject -> Sub-Subject catalogue used when filing a complaint.
 * Source: PGRS_SUBJECT_SUBSUBJECT_MASTER.xlsx (Home > Police), including the
 * official PGRS SUBSUBJECTCODE for each sub-subject. Kept as a plain .ts
 * constant (no DB table) for now.
 */
export interface SubSubject {
  /** Official PGRS sub-subject code. */
  code: string;
  name: string;
}

export interface SubjectGroup {
  subject: string;
  subSubjects: SubSubject[];
}

export const COMPLAINT_SUBJECTS: SubjectGroup[] = [
  {
    subject: "Administration Related",
    subSubjects: [
      { code: "5583", name: "Admin Related / Complaint on Police" },
    ],
  },
  {
    subject: "Complaints On Secretariat Employees-Mahila Police and Women & Child Welfare Assistant",
    subSubjects: [
      { code: "201519831", name: "Rude Behavior towards Citizens" },
    ],
  },
  {
    subject: "Crime",
    subSubjects: [
      { code: "201516388", name: "Accidents" },
      { code: "201515430", name: "Bodily offence" },
      { code: "201515429", name: "Cheating by Cyber Crime / by Financial Institutions / by Individuals / by Forgery" },
      { code: "5579", name: "Cheating in the name of Love/Marriage" },
      { code: "201510499", name: "Crime Against Children" },
      { code: "201516385", name: "Crime Against Sc Sts" },
      { code: "201519413", name: "Crime against Women - (Outraging of modesty / Attempt of Rape / Rape / Dowry Death / Dowry Murder / Murder)" },
      { code: "201516386", name: "Criminal Defamation" },
      { code: "201516387", name: "Cyber Crime (Non Financial)" },
      { code: "201515420", name: "Eve Teasing" },
      { code: "201519415", name: "Immoral Trafficking" },
      { code: "5551", name: "Land Disputes / Property Disputes / Criminal Tresspass / Civil Disputes / Money Matters" },
      { code: "201519416", name: "Marriage Offence / Dowry harassment" },
      { code: "201510474", name: "Mischief/ Damage to property" },
      { code: "201519411", name: "Missing / Elopment / Kidnap / Abduction" },
      { code: "5558", name: "Petty Quarell / Nuisance / Affray" },
      { code: "201515431", name: "Property Offence" },
    ],
  },
  {
    subject: "Enforcement",
    subSubjects: [
      { code: "201519410", name: "Drugs / Gutka / Narcotics / Excise / Gambling / Open Drinking" },
      { code: "201516391", name: "Illegal Transportation of Sand and Other Mineral / Cattle" },
      { code: "201519955", name: "Police Services (Traffic)" },
    ],
  },
  {
    subject: "Law & Order related",
    subSubjects: [
      { code: "251516854", name: "Abetment of Suicide (Women)" },
      { code: "251516855", name: "Arms Act Violations" },
      { code: "251516856", name: "Assault with Deadly Weapon" },
      { code: "251516857", name: "ATM Skimming / UPI Frauds" },
      { code: "251516858", name: "Attempt to Murder" },
      { code: "251516859", name: "Cheating and Criminal Breach of Trust" },
      { code: "251516860", name: "Child Kidnapping" },
      { code: "251516861", name: "Child Labour / Trafficking" },
      { code: "251516862", name: "Culpable Homicide Not Amounting to Murder" },
      { code: "251516863", name: "Custodial Deaths" },
      { code: "251516864", name: "Cyber Crime - Financial Fraud" },
      { code: "251516865", name: "Cyber Crime - Obscene Content" },
      { code: "251516866", name: "Dacoity" },
      { code: "251516867", name: "Dowry Deaths" },
      { code: "251516868", name: "Dowry Harassment" },
      { code: "251516869", name: "Excise Cases (Illicit Liquor)" },
      { code: "251516870", name: "Extortion" },
      { code: "251516871", name: "Financial Frauds" },
      { code: "251516872", name: "Gambling Cases" },
      { code: "251516873", name: "Gang Rape" },
      { code: "251516874", name: "Grievous Hurt" },
      { code: "251516875", name: "House Burglary Day" },
      { code: "251516876", name: "House Burglary Night" },
      { code: "251516877", name: "Kidnapping for Ransom" },
      { code: "251516878", name: "Land Grabbing Cases" },
      { code: "251516879", name: "Missing Persons" },
      { code: "251516880", name: "Molestation / Eve-Teasing" },
      { code: "251516881", name: "Murder" },
      { code: "251516882", name: "Murder for Gain" },
      { code: "251516883", name: "NDPS Act Cases" },
      { code: "251516884", name: "Ordinary Theft" },
      { code: "251516885", name: "POCSO Act Cases (involving minor boys)" },
      { code: "251516886", name: "POCSO Act Cases (involving minor girls)" },
      { code: "251516887", name: "Rape" },
      { code: "251516888", name: "Rioting and Group Clashes" },
      { code: "251516889", name: "Robbery" },
      { code: "251516890", name: "Sexual Harassment" },
      { code: "251516891", name: "Simple Hurt" },
      { code: "251516892", name: "Snatching" },
      { code: "251516895", name: "Traffic Related Issues" },
      { code: "251516893", name: "Unidentified Dead Bodies" },
      { code: "251516894", name: "Vehicle Theft" },
    ],
  },
];
