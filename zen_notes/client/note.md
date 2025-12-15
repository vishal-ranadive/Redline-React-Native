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


Q) Add functionality to copy info of another gear entry (serial no mfg , date)
Q) Load and tag color things on firefighter screen
Q) Auto save indicator on screen - show last time stamp 
Q) combine year and month in one menu  
Q) @mitesh Are we storing history 


==================================
Build 11 

Android : 
- we can download report in android
- updated logo  on leads screen | PPE inspection screen | PDF generation page
- Logo togle based on dark and light mode 

Android + ios 


1. Date Filter Based on schedule_date.
-  Leads are filtered by schedule_date on the frontend (backend filtering is commented out as requested)
- Individual date chip can be cleared by clicking the X icon
- Date filter count is included in the filter badge count

2. Current User who logged in Top Left Position : 
- User Avatar: Displays the user's first name initial in a circular avatar
- Added an Aavatar and when we click on it Goes to profile page 


3. Now when a user adds a new firefighter through the modal:
- The firefighter is created
- The modal closes with a success message
- The newly added firefighter is automatically selected in the FirefighterFlowScreen
- Their gears are fetched and displayed (if any)
- User can immediately start working with the new firefighter without searching


4. Added three theme options:
- Light - Always light theme
- Dark - Always dark theme
- Automatic - Follows system theme

5. Size 2 input box 
- Display: Two input boxes side by side with "X" in between
- Storage: Combines as "100-200" when saving to backend
- Loading: Splits "100-200" back into two separate fields when loading existing data

6. For Gear images 
- Using dummy but related for now we will add once ca

=================================
# 15-12-2025
what's not wokring on iphone  

[HIGH]
# Update inspection page 
- camera functionality to capture images and save them 
- captured images and annoted images upload in s3 
- when click on mic functionality the app got crashed 
- gear findings increase size of line to avoid errorness selection 
- Add checkbox in gear findings 
- Roster unassigned on Inspection details page 

# Dark Mode 
- Firefighter Inpsection screen : 
- Gear categories needs to fix colors are very light 
- Gear cards  same icons needs to light as well 
- PPE report : not entirely shows dark 
- View inspection > firefighter > gear card fix 
- View inspection > pagination fix > gear card fix 
# Firefighter screen 
- Allow users to proceed with entering gear without entering firefighter 
- Add options for spare


# Add new gear 
- combine month and year menus into one 
- [iOS] selected date does not reflectly accurately 

[MEDIUM]
- Status color coded  
- Pass - green | Attention - yellow | Repair - blue | Expired- yellow | oos - red 


[Needs Backend developer think with me ]
[High]
# update inspection screen 
- uploaded images don't have access 
# Add new gear 
- Gear type should show these categories  
- current gear type filed will be changed  to gear items and should not affect by this 

# Login screen 
- [iqbal]refresh token endpoint and guide to how to hit 

# Lead Detail Page
- Search on ipad Redline Gear screen is not searching correctly. Screenshot attached. Search for 1000 still all results will be displayed. Searching on frontend but need to work on backend as well 
- pagination dropdown sometimes failes need to change it 

# Leads screen 
- Full Address is not displayed on Gear screen – city, state 
    [Doubts]
    - @mitesh & @akhil 
    - Steves wants to pull service appointment type from oddo to replace job#
    - EXP : Add functionality of copying  info for another gear entry (seri no , mfg,  date)
    - 
# PPE Report - insufficiant data 
- we are not getting any inspection details currently this are just gear details and status 
Can you please Mitesh Modha
https://teams.microsoft.com/l/message/19:9359c7f3b276412993ba3bc4f3cb85a2@thread.v2/1765534868079?context=%7B%22contextType%22%3A%22chat%22%


# ✅ API Response GET /gear-inspections/loadwise/ 
- we don't have the inspection_images here 


# I-Phone 
- Date selection in for Add new gear > manufacture date 
- Date selection on leads screen (Landing screen)

# when are we removing this tag colors 