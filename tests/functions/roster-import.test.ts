// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseRosterCsv, toUpsertSql } from '../../scripts/lib/roster';

const header = 'passport_number,full_name,phone_e164,email,nationality,program,intake_term,status';

describe('parseRosterCsv', () => {
  it('parses and normalises good rows', () => {
    const r = parseRosterCsv(`${header}\n test0001 , Eyad Salem ,00966500000001, S202368990@KFUPM.edu.sa ,,,,`);
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { passport_number: 'TEST0001', full_name: 'Eyad Salem', phone_e164: '+966500000001', email: 's202368990@kfupm.edu.sa', nationality: null, program: null, intake_term: null, status: 'active' },
    ]);
  });
  it('reports each bad row with its line number and keeps the good ones', () => {
    const r = parseRosterCsv(
      [header, 'A1,Too Short,+966500000001,a@b.co,,,,', 'TEST0002,No Plus,0500000002,a@b.co,,,,', 'TEST0003,Bad Mail,+966500000003,not-an-email,,,,', 'TEST0004,Good Row,+966500000004,ok@example.org,,,,', 'TEST0004,Dup,+966500000005,dup@example.org,,,,', 'TEST0006,Bad Status,+966500000006,s@example.org,,,,graduated'].join('\n'),
    );
    expect(r.rows.map((x) => x.passport_number)).toEqual(['TEST0004']);
    expect(r.errors).toEqual([
      'line 2: passport_number must be 5-20 letters and digits',
      'line 3: phone_e164 must include the country code (+966…)',
      'line 4: email is not valid',
      'line 6: duplicate passport_number TEST0004',
      'line 7: status must be active or withdrawn',
    ]);
  });
  it('rejects a file with the wrong header', () => {
    expect(parseRosterCsv('name,email\nx,y').errors[0]).toMatch(/header/);
  });
  it('reads the checked-in test roster: four students, the four supplied addresses', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const r = parseRosterCsv(fs.readFileSync('data/roster.sample.csv', 'utf8'));
    expect(r.errors).toEqual([]);
    expect(r.rows.map((x) => x.email)).toEqual(['s202368990@kfupm.edu.sa', 'eyadsalem139@gmail.com', 'sac@kfupm.edu.sa', 'anas.ammari@kfupm.edu.sa']);
    expect(r.rows.map((x) => x.passport_number)).toEqual(['TEST0001', 'TEST0002', 'TEST0003', 'TEST0004']);
  });
});

describe('toUpsertSql', () => {
  it('emits one parameter-free, quoted upsert per row (for wrangler d1 execute --file)', () => {
    const sql = toUpsertSql([{ passport_number: 'TEST0001', full_name: "O'Brien", phone_e164: '+1', email: 'a@b.co', nationality: null, program: null, intake_term: null, status: 'active' }]);
    expect(sql).toContain("INSERT INTO students");
    expect(sql).toContain("'O''Brien'"); // quotes escaped
    expect(sql).toContain('ON CONFLICT(passport_number) DO UPDATE');
    expect(sql).not.toMatch(/;\s*DROP|--/);
  });
});
