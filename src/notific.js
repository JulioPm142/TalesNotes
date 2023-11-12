import React, { useState } from 'react';
import { View, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Notifications } from 'react-native-notifications';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, newDate) => {
    if (newDate) {
      setShowDatePicker(false);
      setSelectedDate(newDate);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const scheduleNotification = () => {
    if (selectedDate) {
      const fireDate = selectedDate.getTime() / 1000;
      Notifications.postLocalNotification({
        title: 'Notificação Agendada',
        body: 'Sua notificação chegou!',
        fireDate,
        repeatInterval: 'day',
        data: {},
      });

      // Opcional: Limpar a data após o agendamento
      setSelectedDate(null);
    }
  };

  return (
    <View>
      <Button title="Selecionar Data e Hora" onPress={openDatePicker} />
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}  // Usar data atual se nenhuma data estiver selecionada
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )}
      <Button title="Agendar Notificação" onPress={scheduleNotification} />
    </View>
  );
}
