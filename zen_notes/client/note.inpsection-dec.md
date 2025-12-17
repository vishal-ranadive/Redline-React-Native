

# 1
I have added condition to get only current inpsection on 
src\screens\inspectionscreens\FirefighterGearsScreen.tsx

  // Filter gears with current inspection
  const gearsWithInspection = useMemo(() => {
    return gearCards.filter(({ gear }) => gear.current_inspection !== null);
  }, [gearCards]);


# 2 search from backend 
{{base_url}}/api/leads/?lead_id=100
- we should not perfectly matching 
{
    "detail": "No LeadsGenerated matches the given query."
}