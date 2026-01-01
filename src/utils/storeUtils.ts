import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLeadStore } from '../store/leadStore';
import { useGearStore } from '../store/gearStore';
import { useRosterStore } from '../store/rosterStore';
import { useManufacturerStore } from '../store/manufacturerStore';
import { useInspectionStore } from '../store/inspectionStore';
import { useRepairStore } from '../store/repairStore';

/**
 * Clear all persisted store data from AsyncStorage (excluding auth-storage which is handled separately)
 */
const clearPersistedStores = async () => {
  const storageKeys = [
    'lead-storage',
    'gear-storage',
    'roster-storage',
    'manufacturer-storage',
  ];

  try {
    await Promise.all(storageKeys.map(key => AsyncStorage.removeItem(key)));
    console.log('✅ Cleared all persisted store data');
  } catch (error) {
    console.error('❌ Error clearing persisted stores:', error);
  }
};

/**
 * Reset all in-memory stores to their initial state
 */
const resetInMemoryStores = () => {
  try {
    // Clear inspection store
    useInspectionStore.getState().clearFirefighterGears();
    useInspectionStore.setState({
      firefighterInspectionView: [],
      firefighterInspectionViewLoading: false,
      firefighterInspectionViewError: null,
      loading: false,
      error: null,
    });

    // Clear repair store
    useRepairStore.getState().clearFirefighterRepairGears();

    // Note: themeStore is intentionally not cleared as it's a user preference
    // and should persist across logins

    console.log('✅ Reset all in-memory stores');
  } catch (error) {
    console.error('❌ Error resetting in-memory stores:', error);
  }
};

/**
 * Clear all store data (both persisted and in-memory) except auth store
 * Auth store should be cleared separately by the logout function to avoid circular dependencies
 * This should be called when logging out
 */
export const clearAllStores = async () => {
  console.log('🧹 Clearing all stores (except auth)...');
  
  // Clear persisted stores from AsyncStorage (excluding auth-storage)
  await clearPersistedStores();
  
  // Reset in-memory stores
  resetInMemoryStores();
  
  console.log('✅ All stores cleared (except auth)');
};

