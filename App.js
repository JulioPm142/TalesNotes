
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Button,
  TouchableOpacity
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";


const Stack = createStackNavigator();
import Home from './src/Home';
import Edit from './src/EditPage';
import LoginScreen from './src/login';
import Chart from './src/chart'

const COLORS = { primary: '#1f145c', white: '#eee' };

const App = () => {

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(_user => {
      if (initializing) {
        setInitializing(false);
      }
      setUser(_user);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  function signOut() {
    auth().signOut();
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={'light-content'} />
      <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            <>
              <Stack.Screen name="Home" component={Home} options={{
                title: 'Home', headerRight: () => (<TouchableOpacity onPress={() => signOut()} style={[styles.actionIcon, { backgroundcolor: "red" }]} >
                  <Icon name='logout' size={20} color={COLORS.white}></Icon>
                </TouchableOpacity>)
              }} />
              <Stack.Screen name="Edição" component={Edit} />
              <Stack.Screen name="Dados" component={Chart} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );

};

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#222',
    borderTopLeftRadius: 20,  // Adjust the radius as needed
    borderTopRightRadius: 20, // Adjust the radius as needed
  },
  inputContainer: {
    height: 50,
    paddingHorizontal: 20,
    elevation: 40,
    backgroundColor: '#111',
    flex: 1,
    marginVertical: 20,
    marginRight: 20,
    borderRadius: 30,
  },
  iconContainer: {
    height: 50,
    width: 50,
    backgroundColor: COLORS.primary,
    elevation: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  listItem: {
    padding: 20,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    elevation: 12,
    borderRadius: 7,
    marginVertical: 10,
  },
  actionIcon: {
    height: 25,
    width: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    marginLeft: 5,
    borderRadius: 5,
    marginRight: 25,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

});



export default App;