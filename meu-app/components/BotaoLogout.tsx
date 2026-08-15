import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";

export default function BotaoLogout({
  aoSair,
}: {
  aoSair: () => void;
}) {
  const fazerLogout = () => {
    Alert.alert(
      "Sair",
      "Deseja realmente sair do aplicativo?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("refresh_token");
              await AsyncStorage.removeItem("usuarioLogado");

              aoSair();
            } catch (error) {
              console.log(
                "Erro ao fazer logout:",
                error
              );
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.botao}
      onPress={fazerLogout}
      activeOpacity={0.7}
    >
      <Ionicons
        name="log-out-outline"
        size={27}
        color="#ff0000"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: 46,
    height: 46,


    justifyContent: "center",
    alignItems: "center",

    marginRight: 15,
  },
});