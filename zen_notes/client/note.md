# Add Fire fighter [Done]
- no email 
- no phone 
- rank optional (New Field)
Q) how are we recongnize the if we get last name same 


# Color modal - [Forntend-Done]
- no tag color (another option)
- custom color (which will be different from existing one)
- Need color of list from steve 

# Scan gear [Done]
- if we don't found gear then go to add gear by passing (serial_number)

# Add gear page [need to check on ipad]
- manufacture date is not appearing [Keep showind Dec on ipad]

# Service Type [Done]
- inspected and cleaned   (Default)

# Gear Findings (Need to discuss)
- Approx. costing for each findings 


# Overall Inpsection  (Need to discuss)
- Remove Inpsection functionality(because what if we accedently add it )
- Excell | Export button on ipad  ? 

# Lead Detail Page 
- open in map feature we need latitude and longituted to open in map

# Start Inspection (Need to discuss)
without assigning to myself i can able to start inspection , it should not allow him right ?


# Expiry date set automatic to expired by looking at manufacturer date 



------------------------------

Android storage permission to download reports
Fix draw on photos

Voice to text on iPhone

Voice to text on Android


Add images 
- from camera 
- from gallery 
- remove images 


-----------------------------

From Backend I need currently



Image upload functionality

- upload captured images
- upload images after drawing on image [like making circle or something elase]



Temprary fix

-


# Issues 

I am not shre what you changed here 
but i think pdf is generated it just not saved the pdf in device that main issue 
currenlty when we click on the PPEReportPreviewScreen 
Download PDF button then it shows me that 
Permission Reuired 
sotrage permission is needed to save PDF 
report. Please grant Storage permissions in app settings 


=========
# 12-12-25
Working on 

- Device modes light | dark | automatic  
- filter on schedule_date based ui added [Need from backend]
- Leads screen filter based on schedule_date
- logged in user on top left side  
- View by load dark mode 



============ problems ============
Q) On leadsScreen

- API Request: GET /leads/  -> is it correct or do we need fetch based on logged user firestation  and frenchise id 

- @mitesh we need to filter schedule_date with backend as well 
- I have added from frontend for now 



==================================
Build 11 

Android : 
- we can download report in android
- updated logo  on leads screen | PPE inspection screen | PDF generation page
- Logo togle based on dark and light mode 

Android + ios 
Dark mode based on system default 


1. Date Filter Based on schedule_date.
-  Leads are filtered by schedule_date on the frontend (backend filtering is commented out as requested)
- Individual date chip can be cleared by clicking the X icon
- Date filter count is included in the filter badge count

2. Top Left Position: Added an absolute positioned button at the top left of the screen
User Avatar: Displays the user's first name initial in a circular avatar


3. Now when a user adds a new firefighter through the modal:
✅ The firefighter is created
✅ The modal closes with a success message
✅ The newly added firefighter is automatically selected in the FirefighterFlowScreen
✅ Their gears are fetched and displayed (if any)
✅ User can immediately start working with the new firefighter without searching



