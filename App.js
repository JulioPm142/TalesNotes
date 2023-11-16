
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
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import database from "@react-native-firebase/database";


const Stack = createStackNavigator();
import Home from './src/Home';
import Edit from './src/EditPage';
import LoginScreen from './src/login';
import Chart from './src/chart'
import Modal from './src/component/modal'

const COLORS = { primary: '#1f145c', white: '#eee' };




const App = () => {

  pegarProfile = async () => {
    const user = auth().currentUser;

    if (user) {
        try {
            const userId = user.uid;
            const userSnapshot = await database()
                .ref(`Usuarios/${userId}/Profile`)
                .once("value");

            const userProfile = userSnapshot.val();
            
            setImageUri(userProfile)
            console.log(userProfile)
        } catch (error) {
            console.error("Erro ao buscar o perfil do usuário:", error);
        }
    }
}

  useState(() => {
    // Chama a função para buscar as tarefas do usuário quando a tela for montada
    pegarProfile();
    console.log('teste',ImageUri)
}, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth().currentUser;

      if (user) {
        try {
          const userId = user.uid;
          const userSnapshot = await database()
            .ref(`Usuarios/${userId}/Profile`)
            .once("value");

          const userProfile = userSnapshot.val();
          setImage(userProfile.Profile);
        } catch (error) {
          console.error("Erro ao buscar o perfil do usuário:", error);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false)
  const [image, setImage] = useState(`https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg`);
  const [ImageUri, setImageUri] = useState('https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg');

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

  const toggleModal = () => {
    setModalOpen(!modalOpen)
  }


  const Close = () => {
    return (
      <View style={styles.ModalContainer}>
        {modalOpen ? (
          <TouchableOpacity onPress={() => { toggleModal() }} style={styles.smallButton}>
            <Icon name='close' size={35} color='#000'></Icon>
          </TouchableOpacity>
        ) : (null)}
      </View>
    );
  };

  const Profile = () => {
    return (
      <View style={styles.profileContainer}>
      <View style={styles.profile}>
        {ImageUri ? (<Image style={{ width: "100%", height: "100%", borderRadius: 250 }} source={{ uri: ImageUri }} resizeMode="contain"  />

        ) : <Image style={{ width: "100%", height: "100%", borderRadius: 250 }} source={{ uri: 'https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg' }} />}
      </View>
      </View>
    );
  };


  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={'light-content'} />
      <NavigationContainer>

        <Stack.Navigator>
          {user ? (
            <>
              <Stack.Screen name="Home" component={Home} options={{
                title: 'Home', headerRight: () => (<TouchableOpacity onPress={() => toggleModal()} style={[styles.actionIcon, { backgroundcolor: "red" }]} >
                  <Profile/>

                </TouchableOpacity>), headerLeft: () => (<View style={[styles.center]}>
                  {modalOpen ? (
                    <>
                      <Modal />
                      <Close />
                    </>
                  ) : (null)}
                </View>)

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


const { width, height } = Dimensions.get('window');

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
  ModalContainer: {
    position: 'absolute',
    width: width,
    height: height * 10,
    paddingTop: height * 0.85,
  },
  smallButton: {
    backgroundColor: '#eee',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    bottom:height*0.73,
    left:width*0.35
  },
  profile: {
    backgroundColor: '#eee',
    borderRadius: 150,
    width: width*0.1,
    height: width*0.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  profileContainer:{
    paddingTop:height*0.02,
    display:'flex',
    justifyContent:'center',
    alignItems:'center'
  }

});



export default App;