import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icons } from './Icons';

interface AdvancedDatePickerProps {
  onDateSelect: (period: string) => void;
  selectedDate?: string;
}

export default function AdvancedDatePicker({ onDateSelect, selectedDate }: AdvancedDatePickerProps) {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) {
      setDate(selectedDate);
      const period = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`;
      onDateSelect(period);
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const getDisplayText = () => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return 'Tsindrio eto ra-hisafidy daty';
  };

  return (
    <View>
      <TouchableOpacity style={styles.dateButton} onPress={showDatepicker}>
        <Icons.Calendar />
        <Text style={styles.dateButtonText}>{getDisplayText()}</Text>
        <Icons.Send />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  dateButtonText: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
});