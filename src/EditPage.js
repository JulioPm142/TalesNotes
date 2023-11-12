import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { launchCamera } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Notifications } from 'react-native-notifications';
import Icon from 'react-native-vector-icons/MaterialIcons'

const Edit = ({ navigation, route }) => {
  const COLORS = { primary: '#1f145c', white: '#eee' };
  const { id } = route.params;
  const [userInput, setUserInput] = useState('');
  const [task, setTask] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [image, setImage] = useState(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/HD_transparent_picture.png/640px-HD_transparent_picture.png'
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showNewButton, setShowNewButton] = useState(false);
  const [showNewButton3, setShowNewButton3] = useState(false);
  const [firstButtonClicked, setFirstButtonClicked] = useState(false);

  const toggleNewButton = () => {
    setShowNewButton(!showNewButton);
    setShowNewButton3(!showNewButton3);
    setFirstButtonClicked(!firstButtonClicked);
  };

  const handleInputChange = (text) => {
    setUserInput(text);
  };

  const saveUserInput = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${id}`);
        userTaskRef
          .update({
            texto: userInput,
            imagem: image,
            data: selectedDate
              ? selectedDate.toISOString().split('T')[0]
              : '00-00-0000',
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
        console.log(
          'Usuário não autenticado. Não é possível salvar detalhes da tarefa.'
        );
      }
    } catch (error) {
      console.error('Error saving user input: ', error);
    }
    uploadImage();
    MarcarNotificacao();
  };

  const getTaskFromDatabase = (taskId) => {
    const user = auth().currentUser;

    if (user) {
      const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${taskId}`);

      userTaskRef
        .once('value')
        .then((snapshot) => {
          const taskData = snapshot.val();
          if (taskData) {
            setTask(taskData);
            setUserInput(taskData.texto);
            setImage(taskData.imagem);
            setSelectedDate(
              taskData.data ? new Date(taskData.data) : null
            );
          }
        })
        .catch((error) => {
          console.error('Erro ao buscar detalhes da tarefa:', error);
        });
    } else {
      console.log(
        'Usuário não autenticado. Não é possível buscar detalhes da tarefa.'
      );
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
        let a = response.assets["0"];
        console.log(a.uri);

        setImage(a.uri);
      }
    });
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = (date) => {
    hideDatePicker();
    setSelectedDate(
      new Date(date.getTime() - 24 * 60 * 60 * 1000)
    ); // Adiciona um dia à data selecionada
  };

  const uploadImage = async () => {
    const url = image;

    try {
      const uploadTask = await storage()
        .ref(`imagens/${id}`)
        .putFile(url);

      if (uploadTask.state === 'success') {
        const downloadURL = await storage()
          .ref(`imagens/${id}`)
          .getDownloadURL();
        console.log('URL da imagem após o upload:', downloadURL);
        setImageUri(downloadURL);

        const user = auth().currentUser;
        if (user) {
          const userTaskRef = database().ref(
            `Usuarios/${user.uid}/Tasks/${id}`
          );
          userTaskRef
            .update({ imagem: downloadURL })
            .then(() => {
              console.log(
                'URL da imagem atualizado com sucesso no Firebase Realtime Database'
              );
            })
            .catch((error) => {
              console.error(
                'Erro ao atualizar o URL da imagem no Firebase Realtime Database:',
                error
              );
            });
        } else {
          console.log(
            'Usuário não autenticado. Não é possível atualizar o URL da imagem no Firebase Realtime Database.'
          );
        }
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
    }
  };

  const MarcarNotificacao = () => {
    if (selectedDate) {
      // Obtém o timestamp em milissegundos da data selecionada
      const selectedTimestamp = selectedDate.getTime();

      // Obtém o timestamp atual em milissegundos
      const currentTimestamp = Date.now();

      // Calcula a diferença em milissegundos entre a data selecionada e a data atual
      const timeDifference = currentTimestamp - selectedTimestamp;

      if (timeDifference <= 2 * 24 * 60 * 60 * 1000) {
        // Agendamento da notificação para até 2 dias atrás
        Notifications.postLocalNotification({
          title: 'Tarefa Agendada Vencida',
          body: task.titulo + ' está com atraso',
          fireDate: selectedTimestamp / 1000, // Converte para segundos
          data: {},
        });

        // Limpa a data após o agendamento
        setSelectedDate(null);
      } else {
        // Informa o usuário que a data selecionada está muito no passado
        console.warn('Não é possível agendar notificações para datas no passado');
      }
    }
  };

  useEffect(() => {
    getTaskFromDatabase(id);
  }, [id]);

  return (<>
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
    </View>


    <View>
      {showNewButton && (
        <View style={[styles.newButtonContainer]}>
          <TouchableOpacity style={[styles.newButton, { marginTop: 5 }]} onPress={showDatePicker} >
            <Icon name='date-range' size={45} color={COLORS.white}></Icon>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newButton3} onPress={saveUserInput}>
            <Icon name='save' size={45} color={COLORS.white}></Icon>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.newButton]} onPress={openCamera}>
            <Icon name='add-photo-alternate' size={45} color={COLORS.white}></Icon>
          </TouchableOpacity>
        </View>
      )}
      {firstButtonClicked ? (
        <TouchableOpacity onPress={toggleNewButton} style={styles.smallButton}>
          <Icon name='close' size={35} color='#000'></Icon>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={toggleNewButton} style={styles.smallButton}>
          <Icon name='add' size={40} color='#000'></Icon>
        </TouchableOpacity>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />
    </View>

  </>
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
    width: 300,
    height: 300,
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
  input: {
    height: 50,
    paddingHorizontal: 20,
    elevation: 40,
    backgroundColor: '#111',
    flex: 1,
    marginVertical: 20,
    marginRight: 20,
    borderRadius: 30,
    color: '#eee',
  },
  newButtonContainer: {
    flexDirection: 'row',
    paddingBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newButton: {
    backgroundColor: '#333',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newButton3: {
    backgroundColor: '#333',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    marginLeft: 30,
    marginRight: 30,
  },
  smallButton: {
    backgroundColor: '#eee',
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center', // Adicione esta linha para centralizar o botão horizontalmente
  },
  closeButton: {
    color: '#fff',
    fontSize: 24,
  },
});

export default Edit;
