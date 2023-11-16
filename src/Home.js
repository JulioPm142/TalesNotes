import React, { useState, useEffect } from "react";
import { SafeAreaView, StyleSheet, View, Text, TextInput, Touchable, TouchableOpacity, FlatList, Alert } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import { format, parseISO, differenceInMilliseconds, addSeconds, setSeconds, addWeeks } from 'date-fns';


const COLORS = { primary: '#1f145c', white: '#eee' };


const Home = ({ navigation }) => {
  const [textInput, setTextInput] = React.useState("")
  const [todos, setTodos] = React.useState([
    // {titulo:'titulo',texto:'texto', completo: false, expirado: false, imagem: "https://www.educlub.com.br/wp-content/uploads/2020/02/palavras-com-a-letra-a.jpg" },
  ])

  const ListItem = ({ todo }) => {
    return (
      <TouchableOpacity style={styles.listItem} onPress={() => { navigation.navigate('Edição', { id: todo?.id }) }}>

        <View style={{ flex: 1 }} >
          <Text style={{ fontWeight: 'bold', fontSize: 15, color: COLORS.primary, textDecorationLine: todo?.completo ? "line-through" : 'none' }}>
            {todo?.titulo}
          </Text>
        </View>
        {!todo?.completo && (
          <TouchableOpacity style={[styles.actionIcon]} onPress={() => markTodoComplete(todo?.id, true)}>
            <Icon name='done' size={20} color={COLORS.white}></Icon>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => deleteTodo(todo.id)} style={[styles.actionIcon, { backgroundcolor: "red" }]} >
          <Icon name='delete' size={20} color={COLORS.white}></Icon>
        </TouchableOpacity>

      </TouchableOpacity>
    )
  }

  const markTodoComplete = (todoId, completo) => {
    // Obtém o usuário atualmente autenticado
    const user = auth().currentUser;

    if (user) {
      // Crie uma referência à tarefa específica usando o ID
      const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${todoId}`);

      // Atualize a propriedade 'completo' no banco de dados
      userTaskRef.update({ completo })
        .then(() => {
          console.log(`Tarefa atualizada com sucesso no banco de dados. ID: ${todoId}, completo: ${completo}`);

          // Atualize a lista de tarefas localmente para refletir as alterações
          const newTodos = todos.map(item => {
            if (item.id === todoId) {
              return { ...item, completo };
            }
            return item;
          });
          setTodos(newTodos);
        })
        .catch((error) => {
          console.error('Erro ao atualizar a tarefa no banco de dados:', error);
        });
    } else {
      console.log('Usuário não autenticado. Não é possível atualizar a tarefa no banco de dados.');
    }
  };


  const clearTodos = () => {
    Alert.alert("Confirmar", "Limpar a fazeres?", [
      { text: 'Não' },
      {
        text: 'Sim',
        onPress: () => {
          clearTodosInDatabase();
          // Também pode adicionar um feedback ao usuário, como uma mensagem de sucesso:
          Alert.alert("Tarefas apagadas", "Todas as tarefas foram removidas com sucesso.");
        },
      },
    ]);
  };


  const clearTodosInDatabase = () => {
    // Obtém o usuário atualmente autenticado
    const user = auth().currentUser;

    if (user) {
      // Crie uma referência ao nó de tarefas do usuário
      const userTasksRef = database().ref(`Usuarios/${user.uid}/Tasks`);

      // Remova todas as tarefas do banco de dados
      userTasksRef.remove()
        .then(() => {
          console.log('Todas as tarefas foram removidas com sucesso do banco de dados.');

          // Atualize a lista de tarefas localmente para refletir a remoção
          setTodos([]);
        })
        .catch((error) => {
          console.error('Erro ao remover todas as tarefas do banco de dados:', error);
        });
    } else {
      console.log('Usuário não autenticado. Não é possível remover as tarefas do banco de dados.');
    }
  };

  const generateUniqueId = () => {
    return new Date().getTime().toString();
  };

  const addTaskToDatabase = (newTask) => {
    // Obtém o usuário atualmente autenticado
    const user = auth().currentUser;

    if (user) {
      // Crie uma referência ao nó de tarefas do usuário
      const userTasksRef = database().ref(`Usuarios/${user.uid}/Tasks`);

      // Use o ID gerado no código para adicionar a nova tarefa
      const newTaskId = generateUniqueId();
      newTask.id = newTaskId;

      // Adicione a tarefa ao banco de dados
      userTasksRef.child(newTaskId).set(newTask)
        .then(() => {
          // Atualize a lista de tarefas localmente
          setTodos([...todos, newTask]);
          console.log('Tarefa adicionada com sucesso ao banco de dados com ID:', newTaskId);
        })
        .catch((error) => {
          console.error('Erro ao adicionar tarefa ao banco de dados:', error);
        });
    } else {
      console.log('Usuário não autenticado. Não é possível adicionar a tarefa ao banco de dados.');
    }
  };

  const addTask = () => {
    if (textInput === '') {
      Alert.alert("Erro", "Adicione um Título");
    } else {
      let atual = new Date(); // Mova a declaração de `atual` para este ponto
      const datapadrao = addWeeks(atual, 1);

      const newTask = {
        completo: false,
        expirado: false,
        imagem: "",
        texto: textInput,
        titulo: textInput,
        data: datapadrao.toISOString()
      };
      addTaskToDatabase(newTask);
      setTextInput("");
      Alert.alert("Adicionado", "Sua tarefa foi criada com sucesso");
    }
  };


  const pegarTasks = () => {
    const user = auth().currentUser;

    if (user) {
      const userTasksRef = database().ref(`Usuarios/${user.uid}/Tasks`);

      userTasksRef.on('value', (snapshot) => {
        const taskData = snapshot.val();
        if (taskData) {
          // Converte os dados das tarefas em um array
          const taskArray = Object.values(taskData);
          setTodos(taskArray);
        }
      });
    } else {
      console.log('Usuário não autenticado. Não é possível buscar tarefas.');
    }
  };

  const deleteTaskFromDatabase = (taskId) => {
    // Obtém o usuário atualmente autenticado
    const user = auth().currentUser;

    if (user) {
      // Crie uma referência à tarefa específica usando o ID
      const userTaskRef = database().ref(`Usuarios/${user.uid}/Tasks/${taskId}`);

      // Remova a tarefa do banco de dados
      userTaskRef.remove()
        .then(() => {
          console.log('Tarefa removida com sucesso do banco de dados com ID:', taskId);

          // Atualize a lista de tarefas localmente para refletir a remoção
          const updatedTodos = todos.filter((task) => task.id !== taskId);
          setTodos(updatedTodos);
        })
        .catch((error) => {
          console.error('Erro ao remover tarefa do banco de dados:', error);
        });
    } else {
      console.log('Usuário não autenticado. Não é possível remover a tarefa do banco de dados.');
    }
  };

  // Para usar a função de exclusão, basta passar o ID da tarefa a ser apagada
  const deleteTodo = (todoId) => {
    deleteTaskFromDatabase(todoId);
  };

  useEffect(() => {
    // Chama a função para buscar as tarefas do usuário quando a tela for montada
    pegarTasks();
  }, []);



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>

      <View style={styles.header} >
        <Text style={{ fontWeight: 'bold', fontSize: 20, color: COLORS.primary }}>
          A fazeres:
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { { navigation.navigate('Dados') }}} style={[styles.actionTopIcon, { backgroundcolor: "red" }]} >
            <Icon name="bar-chart" size={18} color={'white'}  />
          </TouchableOpacity>

          <View style={{ width: 30 }} />
          <TouchableOpacity onPress={() => { clearTodos() }} style={[styles.actionTopIcon, { backgroundcolor: "red" }]} >
            <Icon name="delete" size={20} color={'white'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        data={todos}
        renderItem={({ item }) => <ListItem todo={item} />}
      />
      <View style={styles.footer}>
        <View style={styles.inputContainer}>
          <TextInput placeholder="Adicionar" value={textInput} onChangeText={text => setTextInput(text)} style={{ color: 'white' }}></TextInput>
        </View>

        <TouchableOpacity onPress={addTask}>
          <View style={styles.iconContainer}>
            <Icon name='add' color={COLORS.white} size={30}></Icon>
          </View>
        </TouchableOpacity>

      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionTopIcon: {
    height: 35,
    width: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    marginLeft: 5,
    borderRadius: 5,
  },
  ModalContainer: {
    height: 35,
    width: 35,
    backgroundColor:'#aaa',
  },

});

export default Home