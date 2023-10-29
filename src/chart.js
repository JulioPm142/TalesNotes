import React, { useState, useEffect } from "react";
import { ScrollView, StatusBar, Text, View } from "react-native";
import PieChart from "react-native-pie-chart";
import auth from "@react-native-firebase/auth";
import database from "@react-native-firebase/database";
import { Dimensions } from 'react-native';

const COLORS = { primary: "#1f145c", white: "#eee" };

const App = () => {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const user = auth().currentUser;

    if (user) {
      const userTasksRef = database().ref(`Usuarios/${user.uid}/Tasks`);

      userTasksRef.on("value", (snapshot) => {
        const taskData = snapshot.val();
        if (taskData) {
          const taskArray = Object.values(taskData);
          setTodos(taskArray);
        }
      });
      console.log(todos)
    } else {
      console.log("Usuário não autenticado. Não é possível buscar tarefas.");
    }
  }, []);


  const { width, height } = Dimensions.get('window');

  const widthAndHeight = Math.min(width) * 0.9;
  let feita = 0;
  let vencida = 0;
  let pendente = 1;

  const legendData = [
    { label: 'Feita', color: '#F44336' },
    { label: 'Pendente', color: '#2196F3' },
    { label: 'Vencida', color: '#FFEB3B' },
  ];

  todos.forEach((item) => {
    if (item.expirado) {
      vencida += 1;
    } else {
      if (item.completo) {
        feita += 1;
      } else {
        pendente += 1;
      }
    }
  });

  const series = [feita, pendente, vencida];
  const sliceColor = ["#F44336", "#2196F3", "#FFEB3B"];

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <Text style={styles.title}>Estatísticas das tarefas</Text>
        <PieChart
          widthAndHeight={widthAndHeight}
          series={series}
          sliceColor={sliceColor}
        />
      </View>
      <View style={styles.legendContainer}>
          {legendData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text>{item.label}</Text>
            </View>
          ))}
        </View>     
    </ScrollView>
  );
};

const styles = {
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    margin: 10,
  },  
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap:-50,
  },
  legendItem: {
    marginTop:30,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    
  },
  legendColor: {
    width: 10,
    height: 10,
    marginRight: 5,
  },
};

export default App;
