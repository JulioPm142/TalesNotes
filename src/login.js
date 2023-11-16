import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import PushNotification from "react-native-push-notification";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);

  const createChannels = () => {
    PushNotification.createChannel(
      {
        channelId: "test-channel",
        channelName: "Test Channel"
      }
    )
  }

  useEffect(() => {
    createChannels();
  }, []);

  useEffect(() => {
    pegarProfile();
}, []);


  function signUp() {
    auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('User account created & signed in!');

        // Crie um registro para o usuário no Realtime Database
        const user = userCredential.user;
        const userData = {
          Auth: user.uid, // Use o ID de autenticação como chave
          Email: user.email,
          Task: [],
        };
        database()
          .ref(`Usuarios/${user.uid}`)
          .set(userData);

        setIsLogged(true); // Atualize o estado para indicar que o usuário está autenticado
      })
      .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
          console.log('That email address is already in use!');
        }

        if (error.code === 'auth/invalid-email') {
          console.log('That email address is invalid!');
        }

        console.error(error);
      });
  }
  function signIn() {
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log('user is authenticated');
      })
      .catch(error => {
        console.error(error);
      });
  }

  return (
    <View style={styles.container}>
      {isLogged ? (
        <>
          <Text>Você está logado!</Text>
          <Button title="Logout" onPress={() => console.log('saiu')} />
        </>
      ) : (
        <>
          <Text style={{ color: '#fff', fontSize: 28, textAlign: 'center', paddingBottom: 10 }}>Faça login para continuar</Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <View style={styles.buttonContainer}>
            <View style={styles.button}>
              <Button title="Cadastrar" onPress={signUp} />
            </View>
            <View style={styles.buttonSpacing} />
            <View style={styles.button}>
              <Button title="Logar" onPress={signIn} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: 350,
    height: 60,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    paddingTop: 20,
    width: 250,
    marginTop: 10,
  },
  button: {
    width: '100%',
    borderRadius: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});
