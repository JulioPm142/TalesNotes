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
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Notifications } from 'react-native-notifications';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PushNotification from 'react-native-push-notification';
import { format, parseISO, differenceInMilliseconds, addSeconds, setSeconds, addWeeks } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const Edit = ({ navigation, route }) => {
  const COLORS = { primary: '#1f145c', white: '#eee' };
  const { id } = route.params;
  const [userInput, setUserInput] = useState('');
  const [task, setTask] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [image, setImage] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showNewButton, setShowNewButton] = useState(false);
  const [showNewButton3, setShowNewButton3] = useState(false);
  const [firstButtonClicked, setFirstButtonClicked] = useState(false);
  const [salvar, setSalvar] = useState(false);
  const [imageModal, setImageModal] = useState(false);

  let atual = new Date(); // Mova a declaração de `atual` para este ponto
  const datapadrao = addWeeks(atual, 1);

  const formattedDatePadrao = format(datapadrao, "dd/MM/yyyy - HH:mm", {
    locale: ptBR, // ou a localização desejada
  });

  useEffect(() => {
    getTaskFromDatabase(id);
  }, [id]);

  const toggleNewButton = () => {
    setShowNewButton(!showNewButton);
    setShowNewButton3(!showNewButton3);
    setFirstButtonClicked(!firstButtonClicked);
  };

  const toggleImageModal = () => {
    setImageModal(!imageModal);
  };

  const handleInputChange = (text) => {
    setUserInput(text);
  };

  const formatDateTime = (dateTimeString, formatString) => {
    const date = parseISO(dateTimeString);
    return format(date, formatString);
  };

  const showNotification = () => {
    // Verifica se selectedDate é uma data válida

    if (selectedDate instanceof Date && !isNaN(selectedDate)) {
      // Formata a data para exibição
      const formattedDate = format(selectedDate, "dd/MM/yyyy - HH:mm", {
        locale: ptBR, // ou a localização desejada
      });

      // Obtém a data atual
      const currentDate = new Date();

      // Ajusta a selectedDate para ter a mesma data, mas com a hora atual + 10 segundos
      const notificationDate = setSeconds(addSeconds(selectedDate, 10), currentDate.getSeconds());

      // Verifica se a selectedDate é menor que a data atual
      if (selectedDate < currentDate) {
        // Se for, mostra uma mensagem de erro
        setSalvar(false);
      } else {
        setSalvar(true);
        // Notifica na selectedDate
        PushNotification.localNotificationSchedule({
          channelId: "test-channel",
          title: "Tarefa pendente",
          message: `A sua tarefa ${task.titulo} irá vencer hoje`,
          date: notificationDate,
          allowWhileIdle: true,
        });

        PushNotification.localNotification({
          channelId: "test-channel",
          title: `Tarefa marcada!`,
          message: `Tarefa marcada para ${formattedDate}`,
        });
      }
    } else {
      Alert.alert("Erro", "selectedDate não é uma data válida: " + selectedDate);
    }
  };

  const saveUserInput = async () => {
    const formattedDate = format(selectedDate, "dd/MM/yyyy - HH:mm", {
      locale: ptBR, // ou a localização desejada
    });

    // Obtém a data atual
    const currentDate = new Date();

    // Ajusta a selectedDate para ter a mesma data, mas com a hora atual + 10 segundos
    showNotification();
    if (selectedDate < currentDate) { Alert.alert('Data invalida', 'Data está marcada no passado ' + selectedDate) }
    else {
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
      if (image != '') {
        uploadImage();
      }
    }
  };

  const pegarImagem = () => {
    let options = {
      storageOptions: {
        path: 'image',
      },
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error:', response.error);
      } else {
        console.log(response.assets.uri);
        let a = response.assets["0"];
        console.log(a.uri);
        setImage(a.uri);
      }
    });
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
              taskData.data ? new Date(taskData.data) : datapadrao
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
    const currentDate = new Date();
    const selectedTime = new Date(date);
    selectedTime.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds() + 20);
    setSelectedDate(selectedTime);
  };

  const uploadImage = async () => {
    const url = image;
    const user = auth().currentUser;
    try {
      let nUserid = user.uid.toString()
      const uploadTask = await storage()
        .ref(`users/${nUserid}/tasks/${id}`)
        .putFile(url);

      if (uploadTask.state === 'success') {
        const downloadURL = await storage()
          .ref(`users/${nUserid}/tasks/${id}`)
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
      console.error('Erro ao fazer upload da imagem:');
    }
  };


  const removeImagem = () => {
    setImage('');
  };

  return (
    <>
      <View style={{ paddingRight: 10 }}>
        <View style={styles.vencimentoContainer}>
          <Text style={styles.VencimentoTexto}>Marcado para: {formattedDatePadrao.toString()} </Text>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.container}>
          {image == '' ? (
            (null)
          ) : <Image source={{ uri: image }} style={styles.image} />}
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
            <TouchableOpacity style={[styles.newButton, { marginTop: 5 }]} onPress={() => { showDatePicker(), toggleNewButton() }} >
              <Icon name='date-range' size={45} color={COLORS.white}></Icon>
            </TouchableOpacity>

            <TouchableOpacity style={styles.newButton3} onPress={() => { saveUserInput(), toggleNewButton() }}>
              <Icon name='save' size={45} color={COLORS.white}></Icon>
            </TouchableOpacity>

            {image === '' ? (
              <TouchableOpacity style={[styles.newButton]} onPress={() => { toggleImageModal(), toggleNewButton() }}>
                <Icon name='add-photo-alternate' size={45} color={COLORS.white}></Icon>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.newButton]} onPress={() => { removeImagem(), toggleNewButton() }}>
                <Icon name='hide-image' size={45} color={COLORS.white}></Icon>
              </TouchableOpacity>
            )}
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

      {imageModal ? (<View style={styles.selectImage}>

        <Text style={{ textAlign: 'center', fontSize: 25, color: '#eee', paddingTop: 20 }}>Abrir com?</Text>
        <View style={styles.fontContainer}>

          <TouchableOpacity onPress={() => { openCamera(), toggleImageModal() }} style={styles.iconContainer}>
            <Icon name='camera-alt' size={99} color='#fff'></Icon>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { pegarImagem(), toggleImageModal() }} style={styles.iconContainer}>
            <Icon name='image' size={99} color='#fff'></Icon>
          </TouchableOpacity>

        </View>

        {imageModal ? (
          <TouchableOpacity onPress={() => { toggleImageModal() }} style={styles.smallButton}>
            <Icon name='close' size={35} color='#000'></Icon>
          </TouchableOpacity>
        ) : (null)}

        {/* <Icon name='add' size={40} color='#000'></Icon> */}


      </View>) : (null)}

    </>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    padding: 10,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width / 100 * 80,
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
    textAlign: 'center',
    height: 50,
    width: width / 100 * 90,
    elevation: 40,
    backgroundColor: '#111',
    flex: 1,
    marginVertical: 20,
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
    alignSelf: 'center',
  },
  closeButton: {
    color: '#fff',
    fontSize: 24,
  },
  selectImage: {
    position: 'absolute',
    width: width - (width / 100) * 5,
    height: height / 100 * 30,
    backgroundColor: '#222',
    borderRadius: 20,
    top: '83%',
    left: '50%',
    marginLeft: -(width - (width / 100) * 5) / 2,
    marginTop: -(height / 100 * 30) / 2,
  },
  fontContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    paddingTop: 20,
    gap: width / 8,
  },
  iconContainer: {
    height: 100,
    width: 100,
    backgroundColor: '#000',
    borderRadius: 15,
  },
  actionIcon: {
    height: 25,
    width: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    marginLeft: 5,
    borderRadius: 5,
  },
  vencimentoContainer: {
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingTop: height * 0.01,


  },
  VencimentoTexto: {
    paddingTop: 8,
    height: height * 0.045,
    width: width * 0.6,
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    backgroundColor: '#222',
    borderRadius: 10,

  },

});

export default Edit;
