// src/screens/gearscreens/GearScanScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGearStore } from '../../store/gearStore';
import  GearCard  from '../../components/GearCard';
import  BarcodeScannerModal  from '../../components/common/Modal/BarcodeScannerModal';
import { Button } from 'react-native-paper';

export const GearScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    gears,
    loading,
    error,
    pagination,
    searchGears,
    clearError,
    clearGears,
  } = useGearStore();

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannedSerialNumber, setScannedSerialNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Clear gears when component unmounts
  useEffect(() => {
    return () => {
      clearGears();
    };
  }, []);

  // Handle scan result
  const handleBarcodeScanned = (serialNumber: string = "SN-") => {
    setScannedSerialNumber(serialNumber);
    setIsScannerVisible(false);
    searchBySerialNumber(serialNumber);
  };

  // Search gears by serial number
  const searchBySerialNumber = async (serialNumber: string) => {
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Please enter a serial number');
      return;
    }

    setIsSearching(true);
    try {
      await searchGears({ serial_number: serialNumber });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle manual serial number input
  const handleManualSearch = () => {
    if (scannedSerialNumber.trim()) {
      searchBySerialNumber(scannedSerialNumber);
    }
  };

  // Refresh search
  const onRefresh = async () => {
    if (scannedSerialNumber) {
      setRefreshing(true);
      await searchBySerialNumber(scannedSerialNumber);
      setRefreshing(false);
    }
  };

  // Navigate to gear details
  const handleGearPress = (gear: any) => {
    // navigation.navigate('GearDetail', { gearId: gear.gear_id });
  };

  // Navigate to add new gear with scanned serial number
  const handleAddNewGear = () => {
    // navigation.navigate('AddGear', { serialNumber: scannedSerialNumber });
  };

  // Clear current search
  const handleClearSearch = () => {
    setScannedSerialNumber('');
    clearGears();
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan Gear</Text>
        <Text style={styles.subtitle}>
          Scan a barcode or manually enter a serial number to search for gear
        </Text>
      </View>

      {/* Scan Button */}
      <View style={styles.scanSection}>
       <Button
        mode="contained"
        onPress={() => setIsScannerVisible(true)}
        style={styles.scanButton}
        labelStyle={styles.scanButtonText}
        icon="camera"
      >
        Scan Barcode
      </Button>
        
        {/* Serial Number Display */}
        {scannedSerialNumber ? (
          <View style={styles.serialNumberContainer}>
            <Text style={styles.serialNumberLabel}>Scanned Serial Number:</Text>
            <Text style={styles.serialNumber}>{scannedSerialNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* Manual Search Section */}
      <View style={styles.manualSearchSection}>
        <Text style={styles.sectionTitle}>Manual Search</Text>
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.manualInput}
            onPress={() => setIsScannerVisible(true)}
          >
            <Text style={scannedSerialNumber ? styles.manualInputText : styles.manualInputPlaceholder}>
              {scannedSerialNumber || 'Tap to scan or enter serial number'}
            </Text>
          </TouchableOpacity>
          <Button
            mode="contained"
            onPress={handleManualSearch}
            disabled={!scannedSerialNumber || isSearching}
            style={styles.searchButton}
            labelStyle={styles.searchButtonText}
            loading={isSearching}
          >
            Search
          </Button>
        </View>
      </View>

      {/* Results Section */}
      <View style={styles.resultsSection}>
        {loading || isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching for gear...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              mode="contained"
              onPress={handleManualSearch}
              style={styles.retryButton}
              labelStyle={styles.retryButtonText}
            >
              Try Again
            </Button>
          </View>
        ) : gears.length > 0 ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Found {pagination?.total || gears.length} gear(s)
              </Text>
              <TouchableOpacity onPress={handleClearSearch}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.gearsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#007AFF']}
                />
              }
            >
              {gears.map((gear, index) => (
                <View key={gear.gear_id} style={styles.gearItem}>
                  <GearCard
                    gear={gear}
                    onPress={() => handleGearPress(gear)}
                    // showDetails={true}
                  />
                  {index < gears.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </ScrollView>

            {/* Add New Gear Option */}
            <View style={styles.addNewSection}>
              <Text style={styles.addNewText}>
                Don't see the gear you're looking for?
              </Text>
              <Button
                mode="outlined"
                onPress={handleAddNewGear}
                style={styles.addNewButton}
                labelStyle={styles.addNewButtonText}
                icon="plus"
              >
                Add New Gear
              </Button>
            </View>
          </>
        ) : scannedSerialNumber ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No gear found with serial number:
            </Text>
            <Text style={styles.noResultsSerial}>{scannedSerialNumber}</Text>
            <Button
              mode="outlined"
              onPress={handleAddNewGear}
              style={styles.addNewButton}
              labelStyle={styles.addNewButtonText}
              icon="plus"
            >
              Add New Gear
            </Button>
          </View>
        ) : (
          <View style={styles.initialStateContainer}>
            <Text style={styles.initialStateText}>
              Scan a barcode or enter a serial number to search for gear
            </Text>
          </View>
        )}
      </View>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 20,
  },
  scanSection: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  serialNumberContainer: {
    alignItems: 'center',
  },
  serialNumberLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serialNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  manualSearchSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    backgroundColor: '#f9f9f9',
  },
  manualInputText: {
    fontSize: 16,
    color: '#333',
  },
  manualInputPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resultsSection: {
    flex: 1,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  gearsList: {
    flex: 1,
  },
  gearItem: {
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  addNewSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  addNewText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  addNewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 24,
  },
  addNewButtonText: {
    color: '#007AFF',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSerial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  initialStateText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },

searchButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},

retryButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},

});

export default GearScanScreen;