import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Menu,
  Divider,
  Icon,
} from 'react-native-paper';
import { p } from '../../utils/responsive';

// Mock JSON Data
const leadsData = [
  {
    id: '123456',
    name: 'Liam Carter',
    phone: '555-123-4567',
    email: 'liam.carter@gmail.com',
    station: 'Fire Station 12',
    status: 'Ongoing',
    orderType: 'Repair',
  },
  {
    id: '223456',
    name: 'Liam Carter',
    phone: '555-123-4567',
    email: 'liam.carter@gmail.com',
    station: 'Fire Station 12',
    status: 'Completed',
    orderType: 'Inspection',
  },
  {
    id: '323456',
    name: 'Liam Carter',
    phone: '555-123-4567',
    email: 'liam.carter@gmail.com',
    station: 'Fire Station 12',
    status: 'Canceled',
    orderType: 'Repair',
  },
];

const LeadScreen = () => {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<string | null>(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  // Filter logic
  const filtered = leadsData.filter((lead) => {
    const matchSearch = lead.id.includes(search);
    const matchStatus = statusFilter ? lead.status === statusFilter : true;
    const matchType = orderTypeFilter ? lead.orderType === orderTypeFilter : true;
    return matchSearch && matchStatus && matchType;
  });

  const clearFilters = () => {
    setStatusFilter(null);
    setOrderTypeFilter(null);
  };

  const renderLead = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">Lead #{item.id}</Text>
        <Text>{item.name}</Text>
        <Text>{item.phone}</Text>
        <Text>{item.email}</Text>
        <Text>{item.station}</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text style={{ marginLeft: p(4) }}>{item.status}</Text>
        </View>

        <View style={styles.typeRow}>
          <Icon
            source={item.orderType === 'Repair' ? 'wrench' : 'magnify'}
            color={colors.primary}
            size={p(16)}
          />
          <Text style={{ marginLeft: p(4), color: colors.primary }}>
            {item.orderType}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        variant="headlineMedium"
        style={[styles.header, { color: colors.primary }]}
      >
        Redline Gear
      </Text>

      {/* Search */}
      <TextInput
        mode="outlined"
        placeholder="Search by Lead ID"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        left={<TextInput.Icon icon="magnify" />}
      />

      {/* Filters */}
      <View style={styles.filterRow}>
        {/* Order Type Buttons */}
        <Button
          mode={orderTypeFilter === 'Repair' ? 'contained' : 'outlined'}
          icon="wrench"
          onPress={() =>
            setOrderTypeFilter(orderTypeFilter === 'Repair' ? null : 'Repair')
          }
          style={styles.filterButton}
        >
          Repair
        </Button>

        <Button
          mode={orderTypeFilter === 'Inspection' ? 'contained' : 'outlined'}
          icon="magnify"
          onPress={() =>
            setOrderTypeFilter(orderTypeFilter === 'Inspection' ? null : 'Inspection')
          }
          style={styles.filterButton}
        >
          Inspection
        </Button>

        {/* Status Dropdown */}
        <Menu
          visible={statusMenuVisible}
          onDismiss={() => setStatusMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setStatusMenuVisible(true)}
              icon="filter-variant"
              style={styles.filterButton}
            >
              {statusFilter || 'Status'}
            </Button>
          }
        >
          {['Ongoing', 'Completed', 'Canceled'].map((status) => (
            <Menu.Item
              key={status}
              onPress={() => {
                setStatusFilter(status);
                setStatusMenuVisible(false);
              }}
              title={status}
              leadingIcon={
                status === 'Ongoing'
                  ? 'progress-clock'
                  : status === 'Completed'
                  ? 'check-circle'
                  : 'close-circle'
              }
            />
          ))}
          <Divider />
          <Menu.Item
            onPress={() => {
              setStatusFilter(null);
              setStatusMenuVisible(false);
            }}
            title="Clear Status"
            leadingIcon="close"
          />
        </Menu>

        <Button
          mode="text"
          onPress={clearFilters}
          textColor={colors.outline}
          style={{ marginLeft: 'auto' }}
          icon="filter-remove-outline"
        >
          Clear
        </Button>
      </View>

      {/* Grid of Leads */}
      <FlatList
        data={filtered}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Icon source="home" size={p(22)} color={colors.primary} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon source="cog" size={p(22)} color={colors.primary} />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon source="logout" size={p(22)} color={colors.primary} />
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Status Color Helper
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ongoing':
      return '#34A853';
    case 'Completed':
      return '#4285F4';
    case 'Canceled':
      return '#EA4335';
    default:
      return '#AAA';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: p(10) },
  header: { textAlign: 'center', marginBottom: p(10), fontWeight: 'bold' },
  search: { marginBottom: p(10) },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: p(10),
  },
  filterButton: {
    marginRight: p(8),
    borderRadius: p(8),
  },
  grid: {
    paddingBottom: p(80),
    gap: p(8),
  },
  card: {
    flex: 1,
    margin: p(4),
    borderRadius: p(10),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: p(4),
  },
  statusDot: {
    width: p(8),
    height: p(8),
    borderRadius: 50,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: p(6),
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingVertical: p(8),
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: p(12), marginTop: p(2) },
});

export default LeadScreen;
