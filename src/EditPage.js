import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Dimensions, TouchableOpacity, Alert, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { launchCamera } from 'react-native-image-picker';
import  storage  from '@react-native-firebase/storage';

const Edit = ({ navigation, route }) => {
  const { id } = route.params;
  const [userInput, setUserInput] = useState();
  const [task, setTask] = useState(null);
  const [imageUri, setImageUri] = useState(null); // Estado para armazenar a URI da imagem
  const [image, setImage] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/HD_transparent_picture.png/640px-HD_transparent_picture.png');



  const handleInputChange = (text) => {
    setUserInput(text);
  };

  const saveUserInput = async () => {
    try {
      const user = auth().currentUser;
  
      if (user) {
        const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${id}`);
  
        userTaskRef.update({
          texto: userInput,
          imagem: image, // Substitua "a.uri" pelo caminho da imagem ou URI desejada
        })
          .then(() => {
            Alert.alert('Informação Salva', 'Seus Dados Foram Salvos com sucesso', [
              { text: 'OK', onPress: () => console.log('Alert closed') },
            ]);
          })
          .catch((error) => {
            console.error('Erro ao salvar detalhes da tarefa:', error);
          });
      } else {
        console.log('Usuário não autenticado. Não é possível salvar detalhes da tarefa.');
      }
    } catch (error) {
      console.error('Error saving user input: ', error);
    }
    uploadImage()

    
  };
  

  const getTaskFromDatabase = (taskId) => {
    const user = auth().currentUser;
  
    if (user) {
      const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${taskId}`);
  
      userTaskRef.once('value')
        .then((snapshot) => {
          const taskData = snapshot.val();
          if (taskData) {
            setTask(taskData);
            setUserInput(taskData.texto);
            setImage(taskData.imagem); // Define a imagem com a URI da imagem da tarefa
          }
        })
        .catch((error) => {
          console.error('Erro ao buscar detalhes da tarefa:', error);
        });
    } else {
      console.log('Usuário não autenticado. Não é possível buscar detalhes da tarefa.');
    }
  };

  const openCamera = () => {
    let options = {
      mediaType: 'photo',
      includeBase64: true,
    };

    launchCamera(options, (response) => {
      console.log(response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error:', response.error);
      } else {
        const newImageUri = 'data:image/jpeg;base64,' + response.base64;
        let a =response.assets["0"]
        console.log((a.uri))

        setImage(a.uri); 

      }
    });
  };

  useEffect(() => {
    getTaskFromDatabase(id);
  }, [id]);



const uploadImage = async() =>{
  const url=image

  try {
    const uploadTask = await storage().ref(`imagens/${id}`).putFile(url);

    if (uploadTask.state === 'success') {
      const downloadURL = await storage().ref(`imagens/${id}`).getDownloadURL();
      console.log('URL da imagem após o upload:', downloadURL);
      setImageUri(downloadURL);

      // Atualize o campo "tasks > imagem" com o URL de download no Firebase Realtime Database
      const user = auth().currentUser;
      if (user) {
        const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${id}`);
        userTaskRef.update({ imagem: downloadURL })
          .then(() => {
            console.log('URL da imagem atualizado com sucesso no Firebase Realtime Database');
          })
          .catch((error) => {
            console.error('Erro ao atualizar o URL da imagem no Firebase Realtime Database:', error);
          });
      } else {
        console.log('Usuário não autenticado. Não é possível atualizar o URL da imagem no Firebase Realtime Database.');
      }
    }
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
  }
};
  

  return (
    <View style={styles.container}>
      
      
      <View style={styles.container}>
        <Image source={{ uri: image }} style={styles.image} />
        <TextInput
        placeholder="No que está pensando?"
        style={styles.input}
        value={userInput}
        onChangeText={handleInputChange}
        multiline={true}
      />
      </View>



      <TouchableOpacity style={styles.button} onPress={openCamera}>
        <Text style={styles.buttonText}>Adicionar Imagem</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={saveUserInput} style={styles.button}>
        <Text style={styles.buttonText}>Salvar</Text>
      </TouchableOpacity>

      
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    padding: 10,
    backgroundColor: 'black',
  },
  image: {
    width: 300, // Largura da imagem igual à largura da tela
    height: 300, // Altura da imagem definida como 200 (ajuste conforme necessário)
  },
  button: {
    backgroundColor: '#999',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'black',
    textAlign: 'center',
  },
});

export default Edit;