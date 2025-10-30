import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { Text, Card, useTheme, Button, Icon, Divider, Chip } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { p } from '../../utils/responsive';

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

type InspectionPayload = {
  inspectionId: number;
  leadId: number;
  gears: Gear[];
};

const MOCK_INSPECTIONS: InspectionPayload = {
  inspectionId: 1221,
  leadId: 12,
  gears: [
    { id: 'g1', name: 'TL Glove A', type: 'Gloves', status: 'Pre-inspection', isHydrotestPerformed: true, roster: { id: 1, name: 'test' }, remarks: 'thumb tear', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s', serialNumber: 'SER-00121', date: '10/29/2025', hydrotestResult: 'Pass', condition: 'Used' },
    { id: 'g2', name: 'TL Glove B', type: 'Gloves', status: 'Post-inspection', isHydrotestPerformed: true, roster: { id: 1, name: 'test' }, remarks: 'ok', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s', serialNumber: 'SER-00122', date: '10/29/2025', hydrotestResult: 'Fail', condition: 'New' },
    { id: 'g3', name: 'TL Glove C', type: 'Gloves', status: 'Pre-inspection', isHydrotestPerformed: false, roster: { id: 1, name: 'test' }, remarks: 'worn', imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFDCux32MFLBioGWbYdOiDfJoCV4sko1-sSQ&s', serialNumber: 'SER-00123', date: '10/29/2025', hydrotestResult: 'Pass', condition: 'Damaged' },
    { id: 'g4', name: 'TL Helmet A', type: 'Helmet', status: 'Pre-inspection', isHydrotestPerformed: true, roster: { id: 1, name: 'test' }, remarks: 'crack', imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250', serialNumber: 'SER-00124', date: '10/29/2025', hydrotestResult: 'Fail', condition: 'Used' },
    { id: 'g5', name: 'TL Helmet B', type: 'Helmet', status: 'Pre-inspection', isHydrotestPerformed: true, roster: { id: 1, name: 'test' }, remarks: 'ok', imageUrl: 'https://www.meslifesafety.com/ProductImages/fxtl-bulrd_orange!01.jpg?fcts=20210826055750&resizeid=7&resizeh=250&resizew=250', serialNumber: 'SER-00125', date: '10/29/2025', hydrotestResult: 'Pass', condition: 'Used' },
  ],
};

export default function ViewNestedInspectionScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const filterType: string | undefined = route.params?.type;

  const filteredGears = useMemo(() => {
    if (!filterType) return MOCK_INSPECTIONS.gears;
    const ft = filterType.trim().toLowerCase();
    return MOCK_INSPECTIONS.gears.filter(g => g.type?.toLowerCase() === ft);
  }, [filterType]);

  const getBadgeColor = (result?: string) => {
    switch (result) {
      case 'Pass': return '#4CAF50';
      case 'Fail': return '#E53935';
      default: return '#F9A825';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F4F5F7' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon source="arrow-left" size={22} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Inspection Overview</Text>
        <Chip compact style={styles.typeChip} textStyle={{ fontWeight: '600', fontSize: 12 }}>
          {filterType ?? 'All'}
        </Chip>
      </View>

      <Text style={styles.subHeader}>Lead ID: {MOCK_INSPECTIONS.leadId}</Text>

      {/* List */}
      <FlatList
        data={filteredGears}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const resultColor = getBadgeColor(item.hydrotestResult);

          return (
            <Pressable
              onPress={() => {navigation.navigate('UpadateInspection')}}
              style={({ pressed }) => [
                styles.card,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <View style={styles.row}>
                {/* Square Image */}
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={[styles.resultBadge, { backgroundColor: resultColor }]}>
                    <Text style={styles.resultText}>{item.hydrotestResult}</Text>
                  </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoContainer}>
                  <Text style={styles.gearTitle}>{item.name}</Text>
                  <Text style={styles.serialText}>Serial: {item.serialNumber}</Text>

                  <View style={styles.tagRow}>
                    <View style={[styles.tag, { backgroundColor: '#E8F5E9' }]}>
                      <Icon source="progress-check" size={14} color="#1B5E20" />
                      <Text style={[styles.tagText, { color: '#1B5E20' }]}>{item.status}</Text>
                    </View>
                    <View
                      style={[
                        styles.tag,
                        { backgroundColor: item.isHydrotestPerformed ? '#E3F2FD' : '#FFF8E1' },
                      ]}
                    >
                      <Icon
                        source="test-tube"
                        size={14}
                        color={item.isHydrotestPerformed ? '#0D47A1' : '#F57F17'}
                      />
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color: item.isHydrotestPerformed ? '#0D47A1' : '#F57F17',
                          },
                        ]}
                      >
                        {item.isHydrotestPerformed ? 'Hydrotest Done' : 'Pending'}
                      </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: '#F3E5F5' }]}>
                      <Icon source="tools" size={14} color="#6A1B9A" />
                      <Text style={[styles.tagText, { color: '#6A1B9A' }]}>{item.condition}</Text>
                    </View>
                  </View>

                  {/* Footer Section */}
                  <View style={styles.footerSection}>
                    <View style={styles.remarkBox}>
                      <Icon source="comment-text-outline" size={13} color="#616161" />
                      <Text style={styles.remarkText}>{item.remarks || 'No remarks'}</Text>
                    </View>

                    <View style={styles.rosterBox}>
                      <Icon source="account-circle-outline" size={14} color="#0D47A1" />
                      <Text style={styles.rosterText}>Roster: {item.roster.name}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 10,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  typeChip: {
    backgroundColor: '#E3F2FD',
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3949AB',
    marginBottom: 10,
  },
  listContainer: { paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  resultBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  resultText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  infoContainer: {
    flex: 1,
  },
  gearTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  serialText: {
    fontSize: 12,
    color: '#757575',
    marginVertical: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /** Footer Section **/
  footerSection: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    paddingTop: 6,
  },
  remarkBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 6,
    gap: 6,
  },
  remarkText: {
    fontSize: 12,
    color: '#424242',
    flexShrink: 1,
  },
  rosterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  rosterText: {
    fontSize: 12,
    color: '#0D47A1',
    fontWeight: '600',
  },
});