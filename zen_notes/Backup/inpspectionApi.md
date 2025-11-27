Vishal Ranadive & Shahzad Iqbal, Please find the Create Inspection & Update Inspection APIs below. They are now fully live & tested,..
 
Create Inspection API
•  POST /api/gear-inspections/ - Create a New Gear Inspection.
 
Update Inspection API
•  PUT /api/gear-inspections/<int:inspection_id>/ - Updates the selected inspection based on its inspection ID.
 
Alsoo implemented the inspection audit mechanism. Each time an inspection is updated, the previous data of that specific inspection record is saved into the gear_inspection_audit table before applying new changes to the main inspection record.
 
Firefighter View API - Get gears by firefighter
•  GET /api/gear-inspection/firefighter-view/ - Retrieves firefighter-wise inspection details by lead ID & inspection ID, (Passs Lead_ID & Inspection_ID as a query-params),..







curl --location 'http://34.228.36.8/api/gear-inspections/firefighter-view/?leadId=101&inspectionId=2013' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNywiZmlyc3ROYW1lIjoiVGVjaG5pY2lhbiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJ0ZWNoQG1haWxkcm9wLmNjIiwiY29udGFjdFBob25lIjoiKzEtNTU1LTk4Ny02NTQyIiwicm9sZV9pZCI6NCwiY29ycG9yYXRlX2lkIjoxLCJmcmFuY2hpc2VfaWQiOjEsImZpcmVzdGF0aW9uX2lkIjoxMCwicGVybWlzc2lvbnMiOltdLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MTkwMTEyfQ.Vp3ps67e4e3j3azZwLp7BJ-ubaZm3x6fLIVGLhPvOlU' \
--data ''