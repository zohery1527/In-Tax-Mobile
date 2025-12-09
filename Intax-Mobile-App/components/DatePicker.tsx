import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icons } from './Icons';

interface DatePickerProps {
  onDateSelect: (period: string) => void;
  selectedDate?: string;
  onFocus?: () => void; // Cette prop existe maintenant
}

export default function DatePicker({ onDateSelect, selectedDate, onFocus }: DatePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Générer les années (2 ans en arrière jusqu'à l'année courante)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => (currentYear - i).toString());

  // Générer les mois
  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  useEffect(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');
      setSelectedYear(year);
      setSelectedMonth(month);
    } else {
      // Définir la période courante par défaut
      const currentDate = new Date();
      setSelectedYear(currentDate.getFullYear().toString());
      setSelectedMonth((currentDate.getMonth() + 1).toString().padStart(2, '0'));
    }
  }, [selectedDate]);

  const handleOpen = () => {
    // Appeler onFocus quand l'utilisateur ouvre le picker
    onFocus?.();
    setModalVisible(true);
  };

  const handleConfirm = () => {
    if (selectedYear && selectedMonth) {
      const period = `${selectedYear}-${selectedMonth}`;
      onDateSelect(period);
      setModalVisible(false);
    }
  };

  const getDisplayText = () => {
    if (selectedYear && selectedMonth) {
      const monthName = months.find(m => m.value === selectedMonth)?.label;
      return `${monthName} ${selectedYear}`;
    }
    return 'Safidio ny volana sy taona';
  };

  return (
    <View>
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={handleOpen} // Utiliser handleOpen au lieu de setModalVisible directement
      >
        <Icons.Calendar />
        <Text style={styles.dateButtonText}>{getDisplayText()}</Text>
        <Icons.Send />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Safidio ny Volana sy Taona</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Taona:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={setSelectedYear}
                  style={styles.picker}
                >
                  {years.map(year => (
                    <Picker.Item key={year} label={year} value={year} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Volana:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={setSelectedMonth}
                  style={styles.picker}
                >
                  {months.map(month => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Aoka ihany</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
                disabled={!selectedYear || !selectedMonth}
              >
                <Text style={styles.confirmButtonText}>Hahazoana</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  confirmButton: {
    backgroundColor: '#3498db',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});