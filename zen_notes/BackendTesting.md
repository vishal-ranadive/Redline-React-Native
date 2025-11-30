28-11-2025 - https://ioair.link/y8qmep

Jacket Shell 
https://png.pngtree.com/png-vector/20241213/ourmid/pngtree-professional-firefighter-jacket-design-png-image_14727585.png



# Not getting fields 
- gear_size
- isharness // not commig from  {{base_url}}/api/gear-types/
- gear_findings // tried sending like this finding_id : [1, 2, 3, ]
- load_number
<!-- - remarks  -->


end : 
{{base_url}}/api/gear-inspections/
{{base_url}}/api/gear-inspections/2022/ GET | PUT


View inspection 
by firefighter 
- {{base_url}}/api/gear-inspections/rosters/101/

by load 
- Get /api/gear-inspection/loads/{lead_id} THIS API IS MISSING 
```
{
    lead_id:x,
    loads:[
        {
            load_number:1,
            total_gears:5,
            total_rosters:2

        },
    ]
}
```
{{base_url}}/api/gear-inspections/loadwise/?leadId=101&loadId=1


complete inspection 
- pdf render 



