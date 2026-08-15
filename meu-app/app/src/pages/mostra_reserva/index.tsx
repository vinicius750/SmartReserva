import React from 'react'; 
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Reserva: {
    dataReserva: string;
    horario: string;
  };
};

export default function App() {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();

  const { dataReserva } = route.params as {
    dataReserva: string;
  };

  // Lista fixa apenas para exibição visual
  const horarios = [
    { id: '1', hora: '1ª Aula: 07:40 - 08:20', disponivel: true },
    { id: '2', hora: '2ª Aula: 08:20 - 09:10', disponivel: false },
    { id: '3', hora: '3ª Aula: 09:30 - 10:20', disponivel: true },
    { id: '4', hora: '4ª Aula: 10:20 - 11:10', disponivel: true },
    { id: '5', hora: '5ª Aula: 11:10 - 12:00', disponivel: false },
    { id: '6', hora: '6ª Aula: 13:20 - 14:10', disponivel: true },
    { id: '7', hora: '7ª Aula: 14:10 - 15:00', disponivel: true },
    { id: '8', hora: '8ª Aula: 15:20 - 16:10', disponivel: true },
    { id: '9', hora: '9ª Aula: 16:10 - 17:00', disponivel: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.cardContainer}>
          
          {/* Cabeçalho */}
          <Text style={styles.titulo}>Minha Reserva</Text>
          <Text style={styles.subtitulo}>Gerencie suas reservas do dia</Text>

          {/* STATUS: Idêntico ao design da imagem */}
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Nenhuma reserva selecionada</Text>
          </View>

          {/* Lista Visual de Horários */}
          <Text style={styles.secaoTitulo}>Horários do Dia</Text>

          <View style={styles.listaHorarios}>
            {horarios.map((item) => (
              <TouchableOpacity
                key={item.id}
                disabled={!item.disponivel}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate("Reserva", {
                    dataReserva: dataReserva,
                    horario: item.hora,
                  });
                }}
                style={[
                  styles.cardHorario,
                  item.disponivel ? styles.livre : styles.ocupado
                ]}
>
                <Text style={styles.horaText}>{item.hora}</Text>
                <Text style={[
                  styles.statusText, 
                  item.disponivel ? styles.statusLivre : styles.statusOcupado
                ]}>
                  {item.disponivel ? 'LIVRE' : 'OCUPADO'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botão de retorno */}
          <TouchableOpacity
            style={styles.btnVoltar}
            onPress={() => navigation.popToTop()}
>
            <Text style={styles.voltarText}>
              Voltar ao Menu
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 10,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  
  /* ESTILO FIEL À IMAGEM ("Pill" de status) */
  statusPill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statusPillText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5b708b',
    textAlign: 'center',
  },

  secaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 14,
  },
  listaHorarios: {
    gap: 10,
  },
  cardHorario: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  livre: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  ocupado: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  horaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusLivre: {
    color: '#16a34a',
  },
  statusOcupado: {
    color: '#dc2626',
  },
  btnVoltar: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  voltarText: {
    color: '#3b82f6',
    fontSize: 15,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});