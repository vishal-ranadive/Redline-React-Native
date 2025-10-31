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