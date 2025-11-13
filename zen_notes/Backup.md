fontSize: p(18)



import { useNavigation, useRoute } from '@react-navigation/native';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';



type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearScan'>;




  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();


  () => navigation.navigate('GearScan')


  <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => <GearCard gear={item}
        onPress={() => navigation.navigate('GearDetail')}
        />}
       
        showsVerticalScrollIndicator={false}
      />














                {/* Right column */}
          <View style={isLandscape ? styles.rightColumn : undefined}>
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Dates & Status</Text>
                <Divider style={{ marginVertical: p(8) }} />

                {/* Service Type - Requirement #6 */}
                <View style={{ marginBottom: p(12) }}>
                  <Text style={[styles.label, { color: colors.onSurface, marginBottom: p(6) }]}>Service Type</Text>
                  <Menu
                    visible={serviceTypeMenuVisible}
                    onDismiss={() => setServiceTypeMenuVisible(false)}
                    anchor={
                      <TouchableOpacity onPress={() => setServiceTypeMenuVisible(true)}>
                        <View style={[styles.serviceTypeSelector, { borderColor: colors.outline }]}>
                          <Text style={{ flex: 1, fontSize: p(14), color: serviceType ? colors.onSurface : colors.onSurfaceVariant }}>
                            {getServiceTypeLabel(serviceType)}
                          </Text>
                          <Icon source="chevron-down" size={p(18)} color={colors.onSurfaceVariant} />
                        </View>
                      </TouchableOpacity>
                    }
                  >
                    {SERVICE_TYPES.map(service => (
                      <Menu.Item
                        key={service.value}
                        onPress={() => { 
                          setServiceType(service.value); 
                          setServiceTypeMenuVisible(false); 
                        }}
                        title={service.label}
                      />
                    ))}
                  </Menu>
                </View>

                {/* compact rows for dates (two per row) */}
                {/* <View style={styles.smallRow}>
                  <View style={styles.smallCol}>
                    <Text style={[styles.label, { color: colors.onSurface, marginBottom: p(6) }]}>Warranty Expiry</Text>
                    <CommonDatePicker value={warrantyExpiry} onChange={setWarrantyExpiry} mode="date" placeholder="Select" />
                  </View>

                  <View style={{ width: p(10) }} />

                  <View style={styles.smallCol}>
                    <Text style={[styles.label, { color: colors.onSurface, marginBottom: p(6) }]}>Last Inspection</Text>
                    <CommonDatePicker value={lastInspection} onChange={setLastInspection} mode="date" placeholder="Select" />
                  </View>
                </View> */}

                <View style={[styles.smallRow, { marginTop: p(8) }]}>
                  {/* <View style={styles.smallCol}>
                    <Text style={[styles.label, { color: colors.onSurface, marginBottom: p(6) }]}>Next Inspection</Text>
                    <CommonDatePicker value={nextInspection} onChange={setNextInspection} mode="date" placeholder="Select" />
                  </View> */}

                  {/* <View style={{ width: p(10) }} /> */}

                  <View style={[styles.smallCol, { justifyContent: 'flex-start' }]}>
                    {/* Status dropdown - Requirement #7 (all caps) */}
                    <Text style={[styles.label, { color: colors.onSurface, marginBottom: p(6) }]}>Status</Text>

                    <Menu
                      visible={statusMenuVisible}
                      onDismiss={() => setStatusMenuVisible(false)}
                      anchor={
                        <TouchableOpacity onPress={() => setStatusMenuVisible(true)}>
                          <View style={[styles.statusSelector, { borderColor: colors.outline }]}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]} />
                            <Text style={{ marginLeft: p(8), fontSize: p(14), color: colors.onSurface }}>{status}</Text>
                            <Icon source="chevron-down" size={p(18)} color={colors.onSurfaceVariant} />
                          </View>
                        </TouchableOpacity>
                      }
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <Menu.Item
                          key={opt.value}
                          onPress={() => { setStatus(opt.value); setStatusMenuVisible(false); }}
                          title={opt.label}
                          leadingIcon={() => <View style={[styles.menuDot, { backgroundColor: opt.color }]} />}
                        />
                      ))}
                    </Menu>
                  </View>
                </View>

              </Card.Content>
            </Card>

            {/* Condition & Notes */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Condition & Notes</Text>
                <Divider style={{ marginVertical: p(8) }} />
                <Text style={[styles.label, { color: colors.onSurface }]}>Condition</Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: p(8), marginTop: p(6) }}>
                  {['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'].map(opt => {
                    const isSelected = condition === opt;

                    return (
                      <Chip
                        key={opt}
                        mode="outlined"
                        selected={isSelected}
                        onPress={() => setCondition(opt)}
                        selectedColor={isSelected ? '#fff' : colors.error}
                        style={{
                          marginRight: p(6),
                          borderColor: colors.error,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        }}
                        textStyle={{
                          color: isSelected ? '#fff' : colors.onSurface,
                          fontWeight: isSelected ? '600' : '500',
                        }}
                      >
                        {opt}
                      </Chip>
                    );
                  })}
                </View>

                <View style={{ marginTop: p(12) }}>
                  <Text style={[styles.label, { color: colors.onSurface }]}>Notes</Text>
                  <TextInput
                    mode="outlined"
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any additional notes..."
                    multiline
                    numberOfLines={3}
                    style={[styles.input, { minHeight: p(80) }]}
                    outlineColor={colors.outline}
                    activeOutlineColor={colors.primary}
                  />
                </View>
              </Card.Content>
            </Card>


          </View>