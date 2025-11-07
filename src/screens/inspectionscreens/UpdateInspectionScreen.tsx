import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Chip,
  Switch,
  IconButton,
  useTheme,
  Icon,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/common/Header';

type Gear = {
  id: string;
  name: string;
  type: string;
  status: string;
  isHydrotestPerformed: boolean;
  roster: { id: number; name: string };
  remarks?: string;
  imageUrl?: string;
  serialNumber?: string;
  date?: string;
  hydrotestResult?: string;
  condition?: string;
};

export default function UpdateInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const gear: Gear | undefined = route.params?.gear;

  // Local editable state
  const [status, setStatus] = useState(gear?.status ?? 'Pre-inspection');
  const [type, setType] = useState(gear?.type ?? 'Gloves');
  const [serialNumber, setSerial] = useState(gear?.serialNumber ?? 'SL-1121121');
  
  const [hydroPerformed, setHydroPerformed] = useState(!!gear?.isHydrotestPerformed);
  const [hydroResult, setHydroResult] = useState<string | undefined>(gear?.hydrotestResult);
  const [startDate, setStartDate] = useState<string>(gear?.date ?? '');
  const [endDate, setEndDate] = useState<string>('');
  const [condition, setCondition] = useState<string | undefined>(gear?.condition ?? 'Used');
  const [repairNeeded, setRepairNeeded] = useState(false);
  const [cost, setCost] = useState<string>('');
  const [remarks, setRemarks] = useState<string>(gear?.remarks ?? '');
  const [imageUri, setImageUri] = useState<string | undefined>(gear?.imageUrl);

  const saveChanges = () => {
    // TODO: persist changes to backend / store
    console.log('Save', { status, hydroPerformed, hydroResult, startDate, endDate, condition, repairNeeded, cost, remarks });
    let item = {        
    id: '423456',
    name: 'Emma Scott',
    phone: '555-444-4567',
    email: 'emma.scott@gmail.com',
    station: 'Community Volunteer Fire Department',
    status: 'Scheduled',
    leadType: 'Inspection',
    technicianDetails: [{ name: 'Mike Ross', id: 'T004' }],
    department: 'Community Volunteer Fire Department',
    appointmentDate: '12 Nov 2025',
  
    }
    
    navigation.navigate('LeadDetail', { lead: item });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
      {/* Header */}
      {/* <View style={[styles.header]}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Update Status</Text>
        <Button
                 
                >
                  X
            </Button>
      </View> */}
      <Header 
        title="Update Gear Status"
        // statusBadge="Active"
        // statusColor="#4CAF50"
        
      />


      {/* Top summary */}
      <View style={[styles.topCard, { backgroundColor: colors.surface }]}>
        <View style={styles.topLeft}>
          <Text style={styles.smallLabel}>Gear Information</Text>
          <Text style={styles.infoText}>Type: {type ?? '—'}</Text>
          <Text style={styles.infoText}>Serial: {serialNumber ?? '—'}</Text>
        </View>

        <View style={styles.topRight}>
          <Text style={styles.smallLabel}>Current Status</Text>
          <Chip style={styles.statusChip}>{status}</Chip>

          <Text style={[styles.smallLabel, { marginTop: 8 }]}>Firestation</Text>
          <Text style={styles.infoText}>Station 12 · {gear?.roster?.name ?? '—'}</Text>
        </View>
      </View>

      {/* Main form grid */}
      <View style={styles.row}>
        {/* Details column */}
        <View style={[styles.col, { marginRight: 8 }]}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={styles.cardTitle}>Details</Text>

            <Text style={styles.fieldLabel}>Status (dropdown)</Text>
            <View style={styles.rowWrap}>
              <Chip
                selected={status === 'Pre-inspection'}
                onPress={() => setStatus('Pre-inspection')}
                style={styles.choiceChip}
              >
                Pre-inspection
              </Chip>
              <Chip
                selected={status === 'Post-inspection'}
                onPress={() => setStatus('Post-inspection')}
                style={styles.choiceChip}
              >
                Post-inspection
              </Chip>
              <Chip
                selected={status === 'Repair'}
                onPress={() => setStatus('Repair')}
                style={styles.choiceChip}
              >
                Repair
              </Chip>
            </View>

            <View style={styles.rowSpace}>
              <Text style={styles.fieldLabel}>Hydro Test Performed</Text>
              <Switch value={hydroPerformed} onValueChange={setHydroPerformed} />
            </View>

            <Text style={styles.fieldLabel}>Start Date</Text>
            <TextInput
              mode="outlined"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>End Date</Text>
            <TextInput
              mode="outlined"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
              style={styles.input}
            />
          </View>

          {/* Remarks */}
          <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Remarks</Text>
            <TextInput
              mode="outlined"
              placeholder="Add notes or remarks..."
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={4}
              style={{ minHeight: 90 }}
            />
          </View>
        </View>

        {/* Condition & Repair column */}
        <View style={styles.col}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={styles.cardTitle}>Condition & Repair</Text>

            <View style={styles.rowSpace}>
              <Text style={styles.fieldLabel}>Hydro Test Result</Text>
              <View style={styles.rowWrap}>
                <Chip
                  selected={hydroResult === 'Pass'}
                  onPress={() => setHydroResult('Pass')}
                  style={styles.smallChoice}
                >
                  Pass
                </Chip>
                <Chip
                  selected={hydroResult === 'Fail'}
                  onPress={() => setHydroResult('Fail')}
                  style={styles.smallChoice}
                >
                  Fail
                </Chip>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Cost (USD)</Text>
            <TextInput
              mode="outlined"
              placeholder="$0.00"
              value={cost}
              keyboardType="numeric"
              onChangeText={setCost}
              style={styles.input}
            />

            <View style={[styles.rowSpace, { marginTop: 8 }]}>
              <Text style={styles.fieldLabel}>Redline Repair</Text>
              <View style={styles.rowWrap}>
                <Chip selected={repairNeeded === true} onPress={() => setRepairNeeded(true)} style={styles.smallChoice}>
                  Yes
                </Chip>
                <Chip selected={repairNeeded === false} onPress={() => setRepairNeeded(false)} style={styles.smallChoice}>
                  No
                </Chip>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Condition</Text>
            <TextInput
              mode="outlined"
              placeholder="Used / New / Damaged"
              value={condition}
              onChangeText={setCondition}
              style={styles.input}
            />

            <View style={styles.imageRow}>
              <TouchableOpacity style={[styles.imageBox, { backgroundColor: '#f6f6f6' }]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <Text style={{ color: '#999' }}>Upload image</Text>
                )}
              </TouchableOpacity>
              <Button mode="outlined" onPress={() => {/* open image picker */}}>Add Documents</Button>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button mode="text" onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          Cancel
        </Button>
        <Button mode="contained" onPress={saveChanges}>
          Save Changes
        </Button>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
   title: { fontSize: p(18), fontWeight: 'bold' },
   statusBadge: {
      alignSelf: 'center',
      fontSize: p(20),
      fontWeight: '700',
      paddingHorizontal: p(6),
      // paddingVertical: p(2),
    },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  topCard: {
    marginHorizontal: 14,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  topLeft: {},
  topRight: { alignItems: 'flex-end' },
  smallLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  infoText: { fontSize: 13, fontWeight: '600' },
  statusChip: { backgroundColor: '#FFB300', color: '#fff', marginTop: 6 },

  row: { flexDirection: 'row', paddingHorizontal: 14, marginTop: 12 },
  col: { flex: 1 },

  card: {
    borderRadius: 8,
    padding: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },

  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { marginBottom: 8 },
  rowSpace: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { marginRight: 6, marginBottom: 6 },
  smallChoice: { marginRight: 6 },

  imageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  imageBox: {
    width: 96,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: 96, height: 96, borderRadius: 8 },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
});