import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text, Button, Icon, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';



import { useNavigation, useRoute } from '@react-navigation/native';
import { p } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GearDetail'>;
// import jacketScanning from '../../assets/jacketScanning.png'; 
const GearScanScreen = () => {
    
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const [scanned, setScanned] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header]}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          contentStyle={{ flexDirection: 'row' }}
        >
          <Icon source="arrow-left" size={p(22)} color={colors.onSurface} />
        </Button>
        <Text style={[styles.title, { color: colors.onSurface }]}>Scan Gear</Text>
        <Button
          mode="text"
          onPress={() => {}}
        >
          <Icon source="flash" size={p(22)} color={colors.primary} />
        </Button>
      </View>

      {/* Fake Camera View */}
      <View style={styles.cameraContainer}>
        {/* <Image
          source={{
            uri:'',
          }}
          style={styles.cameraImage}
        /> */}
         {/* <Image source={jacketScanning} style={styles.cameraImage} /> */}
         <Image source={require('../../assets/jacketScanning.png')} style={styles.cameraImage} />
         
        <View style={[styles.scanFrame, { borderColor: colors.primary }]}>
          <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.instruction, { color: colors.onSurface }]}>
          Position barcode/QR inside the frame
        </Text>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        {[
          { label: 'Manual Entry', icon: 'pencil', action: () => {} },
          { label: 'Gallery', icon: 'image', action: () => {} },
          { label: 'Close', icon: 'close', action: () => navigation.goBack() },
        ].map((btn, i) => (
          <Button
            key={i}
            mode="contained"
            icon={btn.icon}
            onPress={btn.action}
            buttonColor={colors.primary}
            textColor={colors.surface}
            labelStyle={{ fontSize: p(14), fontWeight: '600' }}
            style={{ marginHorizontal: p(4), borderRadius: p(10) }}
          >
            {btn.label}
          </Button>
        ))}
      </View>

      {/* Dummy Success Overlay */}
      {true && (
        <Card style={[styles.overlay, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={{ fontSize: p(18), fontWeight: 'bold' }}>🎉 Scan Successful!</Text>
            <Text style={{ fontSize: p(14), fontWeight: 'bold' }}>Item: Jacket Shell</Text>
            <Text style={{ fontSize: p(14), fontWeight: 'bold' }}>SN: D39508998</Text>
            <Text style={{ fontSize: p(14), fontWeight: 'bold' }}>Status: PASS ✅</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: p(12) }}>
              <Button
                mode="contained"
                buttonColor={colors.primary}
                onPress={() => navigation.navigate('GearDetail')}
                labelStyle={{
                    fontSize: p(14),
                    fontWeight: '600',
                }}
              >
                Open Gear
              </Button>
              <Button 
              mode="outlined" 
              onPress={() => setScanned(false)}
                          labelStyle={{
                            fontSize: p(14),
                            fontWeight: '600',
                          }}
                
                >
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: p(12),
    paddingTop: p(10),
  },
  title: { fontSize: p(18), fontWeight: 'bold' },
  cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraImage: { width: '100%', height: '100%', position: 'absolute', resizeMode: 'cover', opacity: 0.6 },
  scanFrame: {
    width: '70%',
    aspectRatio: 1,
    borderWidth: p(3),
    borderRadius: p(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: { width: '80%', height: p(3) },
  instruction: { marginTop: p(16), fontSize: p(16) },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: p(50),
  },
  overlay: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    right: '10%',
    padding: p(16),
    borderRadius: p(10),
    elevation: 10,
  },
});

export default GearScanScreen;
