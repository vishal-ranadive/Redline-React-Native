

# 1
I have added condition to get only current inpsection on 
src\screens\inspectionscreens\FirefighterGearsScreen.tsx

  // Filter gears with current inspection
  const gearsWithInspection = useMemo(() => {
    return gearCards.filter(({ gear }) => gear.current_inspection !== null);
  }, [gearCards]);



<View key={`${columnIndex}-${group.roster_id}`}>