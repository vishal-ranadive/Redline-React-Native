// src/screens/gearscreens/GearScanScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  PermissionsAndroid, 
  Platform, 
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native';
import { Text, Button, Icon, Card, useTheme, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Camera } from 'react-native-camera-kit';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGearStore } from '../../store/gearStore';
import { useLeadStore } from '../../store/leadStore';
import { useAuthStore } from '../../store/authStore';
import { printTable } from '../../utils/printTable';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearDetail' | 'AddGear' | 'UpadateInspection' | 'RepairDetails'>;

interface ScannedGear {
  gear_id: number;
  gear_name: string;
  serial_number: string;
  gear_type: {
    gear_type: string;
  };
  roster: {
    first_name: string;
    last_name: string;
  };
  gear_image_url: string | null;
}

interface ScanGearResponse {
  inspectionId: string;
  repairId: string | null;
  name: string;
  gearType: {
    id: number;
    name: string;
  };
  roster: {
    rosterId: number;
    rosterName: string;
  };
  serialNumber: string;
  condition: string;
}

const GearScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'GearScan'>>();
  const { colors } = useTheme();
  const { searchGears, gears, loading, scanGear } = useGearStore();
  const { currentLead } = useLeadStore();
  const { user } = useAuthStore();

  // Get source parameter to determine navigation flow
  const source = (route.params as any)?.source || 'INSPECTION'; // Default to INSPECTION for existing flow

  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [scannedGears, setScannedGears] = useState<ScannedGear[]>([]);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputSerialNumber, setInputSerialNumber] = useState('');

  // Request Camera Permission (Android)
  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    };
    requestPermission();

    // Start scanning when component mounts
    startScanning();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const startScanning = () => {
    setIsScanningActive(true);
    setScannedData(null);
    setScannedGears([]);
    setShowNotFoundModal(false);
  };

const stopScanning = () => {
  setIsScanningActive(false);
  // Always show the modal when stopping scanning
  setShowNotFoundModal(true);
};

  const handleInputSubmit = () => {
    if (inputSerialNumber.trim()) {
      setShowInputModal(false);
      handleBarcodeScan(inputSerialNumber.trim());
      setInputSerialNumber('');
    }
  };

  const handleOpenInput = () => {
    setShowInputModal(true);
  };

  // Handle API call when barcode is scanned
  const handleBarcodeScan = async (scannedValue: string) => {
    setScannedData(scannedValue);
    setIsLoading(true);
    setIsScanningActive(false);

    try {
      // Get firestationId and leadId
      const firestationId = currentLead?.firestation?.id || user?.firestationId;
      const leadId = currentLead?.lead_id;

      if (!firestationId) {
        Alert.alert('Error', 'Firestation ID not found. Please select a lead first.');
        setShowNotFoundModal(true);
        setIsLoading(false);
        return;
      }

      if (!leadId) {
        Alert.alert('Error', 'Lead ID not found. Please select a lead first.');
        setShowNotFoundModal(true);
        setIsLoading(false);
        return;
      }

      // Call scan-gear API
      const leadType = currentLead?.type.toLowerCase(); // Default to Inspection if not found
      const scanResponse = await scanGear(firestationId, scannedValue, leadId, leadType);
      printTable("scanGear result", scanResponse);

      // Handle different response structures (array or wrapped in status object)
      let gearDataArray: ScanGearResponse[] = [];
      if (Array.isArray(scanResponse)) {
        gearDataArray = scanResponse;
      } else if (scanResponse?.status && Array.isArray(scanResponse.data)) {
        gearDataArray = scanResponse.data;
      } else if (scanResponse?.data && Array.isArray(scanResponse.data)) {
        gearDataArray = scanResponse.data;
      }

      if (gearDataArray.length > 0) {
        // Get gearId by searching for the gear with this serial number
        const searchResult = await searchGears({ serial_number: scannedValue });
        
        if (searchResult.success) {
          // Get fresh gears from store (they should be updated by now)
          const { gears: updatedGears } = useGearStore.getState();
          
          if (updatedGears && updatedGears.length > 0) {
            // Map scan response to ScannedGear format for display
            const mappedGears: ScannedGear[] = gearDataArray.map((gearData, index) => {
              // Find corresponding gear from search results
              const gear = updatedGears[index] || updatedGears[0];
              
              return {
                gear_id: gear.gear_id,
                gear_name: gearData.name || gear.gear_name || 'Unnamed Gear',
                serial_number: gearData.serialNumber || scannedValue,
                gear_type: {
                  gear_type: gearData.gearType?.name || gear.gear_type?.gear_type || 'Unknown'
                },
                roster: gearData.roster ? {
                  first_name: gearData.roster.rosterName?.split(' ')[0] || '',
                  last_name: gearData.roster.rosterName?.split(' ').slice(1).join(' ') || '',
                } : gear.roster || {
                  first_name: '',
                  last_name: ''
                },
                gear_image_url: gear.gear_image_url || null,
                // Store additional data for navigation
                inspectionId: gearData.inspectionId,
                repairId: gearData.repairId,
                mode: source === 'REPAIR'
                  ? (gearData.repairId && gearData.repairId.toString().trim() !== '' && gearData.repairId.toString().trim() !== 'null' ? 'update' : 'create')
                  : (gearData.inspectionId &&
                    gearData.inspectionId.toString().trim() !== '' &&
                    gearData.inspectionId.toString().trim() !== 'null'
                    ? 'update' : 'create'),
                rosterData: gearData.roster
              } as any;
            });
            
            setScannedGears(mappedGears);
            setIsScanningActive(false);
          } else {
            // Gear not found in system, show not found modal
            printTable("Gear not found in system after search", searchResult);
            setShowNotFoundModal(true);
          }
        } else {
          // Search failed, show not found modal
          printTable("Gear search failed", searchResult);
          setShowNotFoundModal(true);
        }
      } else {
        // No gear data returned from scan API
        printTable("No gear data from scan API", scanResponse);
        setShowNotFoundModal(true);
      }
    } catch (err: any) {
      console.log('API error:', err);
      printTable("API error caught", err);
      
      // If it's a 404 or gear not found, show not found modal
      if (err.response?.status === 404 || err.message?.includes('not found')) {
        setShowNotFoundModal(true);
      } else {
        Alert.alert('Error', err.message || 'Failed to scan gear. Please try again.');
        setShowNotFoundModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAgain = () => {
    setShowNotFoundModal(false);
    startScanning();
  };

  const handleAddNewGear = () => {
    setShowNotFoundModal(false);
    navigation.navigate('AddGear', {
      serialNumber: scannedData || undefined,
    });
  };

  const handleSearchGear = () => {
    setShowNotFoundModal(false);
    navigation.navigate('GearSearch');
  };

  const handleGearPress = (gear: any) => {
    if (source === 'REPAIR') {
      // Navigate to Repair Details screen for repair flow
      const navigationParams: any = {
        gearId: gear.gear_id,
        leadId: currentLead?.lead_id,
        leadData: currentLead,
      };

      // If there's an existing repair, pass the repair_id for updating
      if (gear.repairId) {
        navigationParams.repairId = gear.repairId;
      }

      // Use replace to prevent GearScan from flashing during transition
      navigation.replace('RepairDetails', navigationParams);
    } else {
      // Navigate to UpdateInspection screen for inspection flow (existing behavior)
      // Prepare roster data for navigation
      const roster = gear.rosterData ? {
        roster_id: gear.rosterData.rosterId,
        id: gear.rosterData.rosterId,
        first_name: gear.rosterData.rosterName?.split(' ')[0] || '',
        last_name: gear.rosterData.rosterName?.split(' ').slice(1).join(' ') || '',
        name: gear.rosterData.rosterName || '',
        email: '',
        phone: '',
      } : undefined;

      // Check if inspectionId exists and is not empty
      const hasInspectionId = gear.inspectionId &&
        gear.inspectionId.toString().trim() !== '' &&
        gear.inspectionId.toString().trim() !== 'null';

      // Use replace to prevent GearScan from flashing during transition
      navigation.replace('UpadateInspection', {
        gearId: gear.gear_id,
        inspectionId: hasInspectionId ? parseInt(gear.inspectionId.toString()) : undefined,
        mode: gear.mode || (hasInspectionId ? 'update' : 'create'),
        firefighter: roster,
        colorLocked: false,
      });
    }
  };

  printTable("scannedGears state", scannedGears);

  const renderGearItem = ({ item }: { item: ScannedGear }) => (
    <TouchableOpacity 
      style={styles.gearItem}
      onPress={() => handleGearPress(item)}
    >
      <View style={styles.gearImageContainer}>
        {item.gear_image_url ? (
          <Image 
            source={{ uri: item.gear_image_url }} 
            style={styles.gearImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon source="image" size={p(24)} color="#666" />
          </View>
        )}
      </View>
      
      <View style={styles.gearInfo}>
        <Text style={styles.gearType}>{item?.gear_type?.gear_type}</Text>
        <Text style={styles.gearName}>
          {item?.gear_name || 'Unnamed Gear'}
        </Text>
        <Text style={styles.rosterName}>
          {item?.roster?.first_name} {item?.roster?.last_name}
        </Text>
        <Text style={styles.serialNumber}>{item.serial_number}</Text>
      </View>

      <TouchableOpacity style={styles.shareButton}>
        <Icon source="share" size={p(16)} color="#fff" />
      </TouchableOpacity>

      <Icon source="chevron-right" size={p(20)} color="#666" />
    </TouchableOpacity>
  );

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={{ fontSize: p(16), textAlign: 'center' }}>
          Please allow camera access to scan gear.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Button mode="text" onPress={() => navigation.goBack()}>
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          {isScanningActive ? 'Scanning...' : 'Scan Gear'}
        </Text>
        <Button mode="text" onPress={() => setFlashOn(!flashOn)}>
          <Icon
            source={flashOn ? 'flash' : 'flash-off'}
            size={p(22)}
            color={flashOn ? colors.primary : colors.onSurface}
          />
        </Button>
      </View>

      {/* Camera View - Show when scanning is active and no results */}
      {isScanningActive && scannedGears.length === 0 && !isLoading && (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            scanBarcode={true}
            showFrame={true}
            laserColor={colors.primary}
            frameColor={colors.primary}
            torchMode={flashOn ? 'on' : 'off'}
            onReadCode={(event: any) => {
              const value = event?.nativeEvent?.codeStringValue;
              if (value && isScanningActive) {
                handleBarcodeScan(value);
              }
            }}
          />
          {/* <View style={styles.scanningOverlay}>
            <Text style={[styles.scanningText, { color: colors.onSurface }]}>
              Point camera at gear barcode to scan
            </Text>
            <ActivityIndicator size="small" color={colors.primary} />
          </View> */}
        </View>
      )}

      {/* Loader */}
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: p(12), fontSize: p(16), color: colors.onSurface }}>
            Searching for gear...
          </Text>
        </View>
      )}

      {/* Scanned Gears List */}
      {scannedGears.length > 0 && !isLoading && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: colors.onSurface }]}>
            Found {scannedGears.length} Gear(s)
          </Text>
          <FlatList
            data={scannedGears}
            renderItem={renderGearItem}
            keyExtractor={(item) => item.gear_id.toString()}
            style={styles.resultsList}
          />
          
          <Button
            mode="contained"
            buttonColor={colors.primary}
            style={styles.scanAgainButton}
            onPress={handleScanAgain}
          >
            Scan Again
          </Button>
        </View>
      )}

      {/* Not Found Modal */}
      <Modal
        visible={showNotFoundModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotFoundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Icon source="alert-circle" size={p(32)} color={colors.error} />
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Gear Not Found
                </Text>
              </View>
              
              <Text style={[styles.modalMessage, { color: colors.onSurface }]}>
                No gear was found with the scanned serial number "{scannedData}". What would you like to do?
              </Text>

              <View style={styles.modalButtons}>
                <Button
                  mode="contained"
                  buttonColor={colors.primary}
                  style={styles.modalButton}
                  onPress={handleAddNewGear}
                  icon="plus"
                >
                  Add New Gear
                </Button>
                
                {/* <Button
                  mode="outlined"
                  style={styles.modalButton}
                  onPress={handleSearchGear}
                  icon="magnify"
                >
                  Search Gear
                </Button> */}
                
                <Button
                  mode="contained"
                  buttonColor={colors.secondary}
                  style={styles.modalButton}
                  onPress={handleScanAgain}
                  icon="camera"
                >
                  Scan Again
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* Bottom Buttons - Only show when not scanning or loading */}
      {/* {!isScanningActive && scannedGears.length === 0 && !isLoading && !isSimulationMode && (
        <View style={styles.bottomButtons}>
          {[
            { label: 'Manual Add Gear', icon: 'pencil', action: () => navigation.navigate('AddGear') },
            { label: 'Gallery', icon: 'image', action: () => {} },
            { label: 'Close', icon: 'close', action: () => navigation.goBack() },
          ].map((btn, i) => (
            <Button
              key={i}
              mode="contained"
              icon={btn.icon}
              onPress={btn.action}
              buttonColor={colors.primary}
              labelStyle={{ fontSize: p(14), fontWeight: '600', color:'#fff' }}
              style={{ borderRadius: p(10), marginHorizontal: p(4), elevation: 4 }}
            >
              {btn.label}
            </Button>
          ))}
        </View>
      )} */}

{/* Stop Scanning Button - Show when scanning is active */}
{isScanningActive && (
  <View style={styles.stopButtonContainer}>
    <Button
      mode="contained"
      buttonColor={colors.error}
      onPress={stopScanning}
      style={styles.stopButton}
      icon="stop"
    >
      Stop Scanning
    </Button>
  </View>
)}

{/* Input Button - Show when scanning is active */}
{isScanningActive && (
  <View style={styles.inputButtonContainer}>
    <Button
      mode="outlined"
      icon="keyboard"
      onPress={handleOpenInput}
      style={styles.inputButton}
      textColor={colors.primary}
    >
      Enter Serial Number
    </Button>
  </View>
)}

      {/* Input Modal */}
      <Modal
        visible={showInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowInputModal(false);
          setInputSerialNumber('');
        }}
      >
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Icon source="keyboard" size={p(32)} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Enter Serial Number
                </Text>
              </View>
              
              <TextInput
                label="Serial Number"
                value={inputSerialNumber}
                onChangeText={setInputSerialNumber}
                mode="outlined"
                autoFocus
                style={styles.inputField}
                onSubmitEditing={handleInputSubmit}
                returnKeyType="done"
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="contained"
                  buttonColor={colors.primary}
                  style={styles.modalButton}
                  onPress={handleInputSubmit}
                  icon="check"
                  disabled={!inputSerialNumber.trim()}
                >
                  Submit
                </Button>
                
                <Button
                  mode="outlined"
                  style={styles.modalButton}
                  onPress={() => {
                    setShowInputModal(false);
                    setInputSerialNumber('');
                  }}
                  icon="close"
                >
                  Cancel
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: p(45), },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: p(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(12),
    paddingTop: p(10),
  },
  title: { fontSize: p(18), fontWeight: 'bold' },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: { 
    flex: 1, 
    width: '100%' 
  },
  scanningOverlay: {
    position: 'absolute',
    bottom: p(20),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanningText: {
    fontSize: p(16),
    marginBottom: p(8),
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
    flex: 1,
    padding: p(16),
  },
  resultsTitle: {
    fontSize: p(20),
    fontWeight: 'bold',
    marginBottom: p(16),
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
  },
  gearItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: p(12),
    padding: p(12),
    marginBottom: p(12),
    alignItems: 'center',
  },
  gearImageContainer: {
    marginRight: p(12),
  },
  gearImage: {
    width: p(60),
    height: p(60),
    borderRadius: p(30),
  },
  placeholderImage: {
    width: p(60),
    height: p(60),
    borderRadius: p(30),
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearInfo: {
    flex: 1,
  },
  gearType: {
    fontSize: p(16),
    fontWeight: 'bold',
    color: '#333',
  },
  gearName: {
    fontSize: p(14),
    color: '#666',
    marginTop: p(2),
  },
  rosterName: {
    fontSize: p(14),
    color: '#666',
    marginTop: p(2),
  },
  serialNumber: {
    fontSize: p(12),
    color: '#999',
    marginTop: p(2),
  },
  shareButton: {
    padding: p(8),
    backgroundColor: '#34C759',
    borderRadius: p(20),
    marginRight: p(8),
  },
  scanAgainButton: {
    marginTop: p(16),
    borderRadius: p(25),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: p(20),
  },
  modalCard: {
    width: '100%',
    maxWidth: p(320),
    borderRadius: p(16),
    padding: p(16),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: p(16),
  },
  modalTitle: {
    fontSize: p(20),
    fontWeight: 'bold',
    marginTop: p(8),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: p(16),
    textAlign: 'center',
    marginBottom: p(24),
    lineHeight: p(22),
  },
  modalButtons: {
    gap: p(12),
  },
  modalButton: {
    borderRadius: p(25),
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: p(20),
    marginBottom: p(46),
  },
  stopButtonContainer: {
    position: 'absolute',
    bottom: p(100),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stopButton: {
    borderRadius: p(25),
  },
  inputButtonContainer: {
    position: 'absolute',
    bottom: p(160),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  inputButton: {
    borderRadius: p(25),
  },
  inputField: {
    marginBottom: p(16),
  },
});

export default GearScanScreen;