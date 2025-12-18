// src/screens/repairscreens/RepairDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  Text,
  Card,
  Button,
  Icon,
  useTheme,
  TextInput,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { p } from '../../utils/responsive';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RepairDetails'>;

interface RepairDetailsParams {
  gearId: number;
  leadId?: number;
  leadData?: any;
}

const RepairDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const { gearId, leadId, leadData } = route.params as RepairDetailsParams;

  // Form state for repair details
  const [repairDescription, setRepairDescription] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRepair = async () => {
    if (!repairDescription.trim()) {
      Alert.alert('Error', 'Please provide a repair description');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Implement repair submission API call
      Alert.alert('Success', 'Repair details submitted successfully');

      // Navigate back to lead detail or wherever appropriate
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting repair:', error);
      Alert.alert('Error', 'Failed to submit repair details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outline,
          },
        ]}
      >
        <Button
          mode="text"
          compact
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
          style={{ marginLeft: p(-8) }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>

        <Text style={[styles.headerTitle, { color: colors.onSurface, fontSize: p(20) }]}>
          Repair Details
        </Text>

        <View style={{ width: p(40) }} /> {/* Spacer for centering */}
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: p(80) }}
      >
        {/* Gear Information Card */}
        <Card style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(16) }]}>
              Gear Information
            </Text>
            <Divider style={{ marginVertical: p(8) }} />

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.onSurface }]}>Gear ID:</Text>
              <Text style={[styles.value, { color: colors.onSurface }]}>{gearId}</Text>
            </View>

            {leadData && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.onSurface }]}>Lead:</Text>
                <Text style={[styles.value, { color: colors.onSurface }]}>{leadData.lead_id}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Repair Form */}
        <Card style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: p(3) }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, fontSize: p(16) }]}>
              Repair Information
            </Text>
            <Divider style={{ marginVertical: p(8) }} />

            <TextInput
              label="Repair Description *"
              value={repairDescription}
              onChangeText={setRepairDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Describe the repair needed..."
              style={{ marginBottom: p(16) }}
            />

            <TextInput
              label="Additional Notes"
              value={repairNotes}
              onChangeText={setRepairNotes}
              mode="outlined"
              multiline
              numberOfLines={2}
              placeholder="Any additional notes..."
              style={{ marginBottom: p(16) }}
            />

            <TextInput
              label="Estimated Cost"
              value={repairCost}
              onChangeText={setRepairCost}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0.00"
              left={<TextInput.Affix text="$" />}
            />
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmitRepair}
            loading={isSubmitting}
            disabled={isSubmitting || !repairDescription.trim()}
            style={styles.submitButton}
            contentStyle={{ paddingVertical: p(8) }}
            labelStyle={{ fontSize: p(16), fontWeight: '600' }}
          >
            Submit Repair Request
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(16),
    paddingVertical: p(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: p(18),
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: p(16),
    borderRadius: p(10),
    marginBottom: p(16),
    elevation: 2,
  },
  sectionTitle: {
    fontSize: p(16),
    fontWeight: '700',
    marginBottom: p(8),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: p(8),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: p(14),
    fontWeight: '500',
  },
  value: {
    fontSize: p(14),
    fontWeight: '600',
  },
  submitContainer: {
    marginHorizontal: p(16),
    marginTop: p(20),
  },
  submitButton: {
    borderRadius: p(8),
  },
});

export default RepairDetailsScreen;
