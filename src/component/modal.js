import React, { useState, useEffect } from "react";
import PieChart from "react-native-pie-chart";
import auth from "@react-native-firebase/auth";
import database from "@react-native-firebase/database";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

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
import { he } from "date-fns/locale";



const COLORS = { primary: "#1f145c", white: "#eee" };

const App = ({ updateImageUri, signOut }) => {
    const [modalOpen, setModalOpen] = useState(false)
    const [imageModal, setImageModal] = useState(false);
    const [ImageUri, setImageUri] = useState(null);
    const [image, setImage] = useState('');




    const toggleModal = () => {
        setImageModal(!imageModal)
    }

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
                console.log('aqui');
                console.log(response);
                let a = response.assets["0"];
                console.log('uri', a.uri);
                setImage(a.uri);
                console.log('imagem setada');
                console.log(a.uri);
                uploadImage(a.uri);
            }
        });
    };

    function logOut() {
        signOut();
    }

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
                uploadImage(a.uri);
            }


        });
    };


    const uploadImage = async (e) => {
        const url = e;
        const user = auth().currentUser;

        try {
            if (user) {
                let nUserid = user.uid;
                const uploadTask = await storage()
                    .ref(`users/${user.uid}/Profile`) // Nomeie a imagem com um timestamp único
                    .putFile(url);
                console.log('fez upload')

                if (uploadTask.state === 'success') {
                    const downloadURL = await storage()
                        .ref(`users/${user.uid}/Profile`)
                        .getDownloadURL();
                    console.log('URL da imagem após o upload:', downloadURL);
                    setImageUri(downloadURL);

                    console.log('URL da imagem após o upload:', downloadURL);
                    updateImageUri(downloadURL);

                    const userTaskRef = database().ref(`Usuarios/${user.uid}/`);
                    userTaskRef
                        .update({ Profile: downloadURL })
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
                }
            } else {
                console.log(
                    'Usuário não autenticado. Não é possível atualizar o URL da imagem no Firebase Realtime Database.'
                );
            }
        } catch (error) {
            console.log(error);
        }
    };

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

    useEffect(()=>{
        pegarProfile();
    })

    useState(() => {
        // Chama a função para buscar as tarefas do usuário quando a tela for montada
        pegarProfile();
        console.log('teste', ImageUri)
        
    }, []);



    return (
        <View style={styles.ModalContainer}>

            <View style={styles.over}></View>

            <View style={styles.container}>
                <View style={styles.foto}>
                    {ImageUri !== null ? (
                        <Image style={{ width: "100%", height: "100%", borderRadius: 250 }} source={{ uri: ImageUri }} />
                    ) : (
                        <Image style={{ width: "100%", height: "100%", borderRadius: 250 }} source={{ uri: 'https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg' }} />
                    )}
                </View>
                <View style={styles.itensContainer}>

                    <TouchableOpacity onPress={() => { toggleModal() }} style={styles.iconContainer}>
                        <Icon2 name='image-edit' size={99} color='#000'></Icon2>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { (logOut()) }} style={styles.iconContainer}>
                        <Icon2 name='account-arrow-right' size={99} color='#000'></Icon2>
                    </TouchableOpacity>

                </View>

                {imageModal ? (<View style={styles.selectImage}>

                    <Text style={{ textAlign: 'center', fontSize: 25, color: '#eee', paddingTop: 20 }}>Abrir com?</Text>
                    <View style={styles.fontContainer}>

                        <TouchableOpacity onPress={() => { openCamera(), toggleModal() }} style={styles.iconContainer}>
                            <Icon name='camera-alt' size={99} color='#000'></Icon>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { pegarImagem(), toggleModal() }} style={styles.iconContainer}>
                            <Icon name='image' size={99} color='#000'></Icon>
                        </TouchableOpacity>

                    </View>

                    {imageModal ? (
                        <TouchableOpacity onPress={() => { toggleModal() }} style={styles.smallButton}>
                            <Icon name='close' size={35} color='#000'></Icon>
                        </TouchableOpacity>
                    ) : ('')}

                </View>) : ('')}

            </View>
        </View>
    );
};





const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    ModalContainer: {
        position: 'absolute',
        paddingLeft: width * 0.050,
        width: width,
        height: height,
        backgroundColor: '#111d'
    },
    container: {
        top: height * 0.1,
        width: width * 0.90,
        height: height * 0.7,
        backgroundColor: '#aaa',
        borderRadius: 50,
        display: 'flex',
        alignItems: 'center',
        paddingTop: height * 0.05
    },
    foto: {
        width: width * 0.85,
        height: width * 0.85,
        backgroundColor: '#000',
        borderRadius: 250,
        borderWidth: 3,
        borderColor: '#0002'
    },
    itensContainer: {
        width: width * 0.85,
        height: height * 0.2,
        backgroundColor: '#0001',
        borderRadius: 50,
        display: 'flex',
        flexDirection: 'row',
        gap: 30,
        alignItems: 'center',
        justifyContent: 'center'

    }, smallButton: {
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
        top: '115%',
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
        backgroundColor: '#fff',
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
});

export default App;