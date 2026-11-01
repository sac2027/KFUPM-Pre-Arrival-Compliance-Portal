/** Credentials that exist in the local test roster (data/roster.sample.csv + data/roster.e2e.csv). */
export interface Creds {
  passport: string;
  phone: string;
  email: string;
  name: string;
}

export const STUDENTS = {
  /** The user's own test entry (data/roster.sample.csv). */
  eyad: { passport: 'TEST0001', phone: '+966500000001', email: 's202368990@kfupm.edu.sa', name: 'Eyad Salem' },
  anas: { passport: 'TEST0004', phone: '+966500000004', email: 'anas.ammari@kfupm.edu.sa', name: 'Anas Ammari' },
  /** Test-only rows (data/roster.e2e.csv). */
  mai: { passport: 'E2E00001', phone: '+84 912 345 678', email: 'eyadsalem139@gmail.com', name: 'Mai Nguyễn' }, // roster: "Nguyen Thi Mai"
  mohammed: { passport: 'E2E00002', phone: '+966551234567', email: 'eyadsalem139@gmail.com', name: 'Mohammed Alghamdi' },
  longName: { passport: 'E2E00003', phone: '+966500000099', email: 'eyadsalem139@gmail.com', name: 'Abdulrahman Alghamdi' },
  persian: { passport: 'E2E00004', phone: '+989123456789', email: 'eyadsalem139@gmail.com', name: 'Nameh Ahmadi' },
  withdrawn: { passport: 'E2E00005', phone: '+966500000098', email: 'eyadsalem139@gmail.com', name: 'Withdrawn Student' },
} satisfies Record<string, Creds>;

export const byLocale = (locale: 'en' | 'ar'): Creds => (locale === 'en' ? STUDENTS.mai : STUDENTS.mohammed);
