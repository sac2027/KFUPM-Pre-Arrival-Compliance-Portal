-- Paste into the pacf-roster database Console (after 1-roster-tables.sql). Safe to run twice.
INSERT INTO students (passport_number, full_name, phone_e164, email, nationality, program, intake_term, status) VALUES
 ('TEST0001','Eyad Salem','+966500000001','s202368990@kfupm.edu.sa','Saudi Arabia','Computer Engineering','2026-27 Term 1','active'),
 ('TEST0002','Eyad Salem','+966500000002','eyadsalem139@gmail.com','Saudi Arabia','Computer Engineering','2026-27 Term 1','active'),
 ('TEST0003','Sara Ahmed Alqahtani','+966500000003','sac@kfupm.edu.sa','Saudi Arabia','Chemical Engineering','2026-27 Term 1','active'),
 ('TEST0004','Anas Ammari','+966500000004','anas.ammari@kfupm.edu.sa','Tunisia','Petroleum Engineering','2026-27 Term 1','active')
ON CONFLICT(passport_number) DO UPDATE SET full_name=excluded.full_name, phone_e164=excluded.phone_e164, email=excluded.email,
 nationality=excluded.nationality, program=excluded.program, intake_term=excluded.intake_term, status=excluded.status;
