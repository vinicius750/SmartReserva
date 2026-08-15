import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import { useState } from "react";

import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from "react-native";

const { width, height } = Dimensions.get("window");

const URL_API = "http://192.168.100.128:8000";

export default function Login({ aologar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert(
        "Aviso",
        "Por favor, preencha todos os campos."
      );

      return;
    }

    setCarregando(true);

    try {
      const response = await fetch(
        `${URL_API}/api/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            usuario: email.trim(),
            senha: senha,
          }),
        }
      );

      const data = await response.json();

      console.log("====================================");
      console.log("RESPOSTA DA API:");
      console.log(data);
      console.log("====================================");

      if (!response.ok) {
        Alert.alert(
          "Erro de Autenticação",
          data.detail ||
            "E-mail ou senha incorretos."
        );

        return;
      }

      if (!data.access_token) {
        throw new Error(
          "A API não retornou access_token."
        );
      }

      if (!data.refresh_token) {
        throw new Error(
          "A API não retornou refresh_token."
        );
      }

      if (!data.usuario) {
        throw new Error(
          "A API não retornou os dados do usuário."
        );
      }

      console.log("USUÁRIO AUTENTICADO:");
      console.log(data.usuario);

      console.log("ROLE:");
      console.log(data.usuario.role);

      await AsyncStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario)
      );

      await AsyncStorage.setItem(
        "role",
        data.usuario.role
      );

      await AsyncStorage.setItem(
        "access_token",
        data.access_token
      );

      await AsyncStorage.setItem(
        "refresh_token",
        data.refresh_token
      );

      console.log(
        "===================================="
      );

      console.log(
        "DADOS SALVOS NO ASYNC STORAGE"
      );

      console.log(
        "===================================="
      );

      console.log(
        "usuario:",
        await AsyncStorage.getItem(
          "usuario"
        )
      );

      console.log(
        "role:",
        await AsyncStorage.getItem(
          "role"
        )
      );

      console.log(
        "access_token:",
        await AsyncStorage.getItem(
          "access_token"
        )
          ? "SALVO"
          : "NÃO SALVO"
      );

      console.log(
        "refresh_token:",
        await AsyncStorage.getItem(
          "refresh_token"
        )
          ? "SALVO"
          : "NÃO SALVO"
      );

      console.log(
        "===================================="
      );

      aologar(data.usuario);

    } catch (error) {
      console.error(
        "===================================="
      );

      console.error(
        "ERRO NO LOGIN:"
      );

      console.error(error);

      console.error(
        "===================================="
      );

      Alert.alert(
        "Erro",
        "Não foi possível concluir o login."
      );

    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <ImageBackground
      source={require("../../assets/background.png")}
      style={styles.container}
      resizeMode="cover"
    >

      {/* Camada escura opcional sobre a imagem */}
      <View style={styles.overlay}>

        <View style={styles.card_login}>

          {/* =============================================
              TÍTULO
          ============================================= */}

          <Text style={styles.Titulo}>
            Entrar na Conta
          </Text>

          {/* =============================================
              EMAIL
          ============================================= */}

          <Text style={styles.email_Senha}>
            Email
          </Text>

          <TextInput
            placeholder="Digite seu Email"
            placeholderTextColor="#888"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!carregando}
          />

          {/* =============================================
              SENHA
          ============================================= */}

          <Text style={styles.email_Senha}>
            Senha
          </Text>

          <TextInput
            placeholder="Digite sua Senha"
            placeholderTextColor="#888"
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            editable={!carregando}
          />

          {/* =============================================
              BOTÃO ENTRAR
          ============================================= */}

          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.botao,
              carregando && {
                opacity: 0.7,
              },
            ]}
            activeOpacity={0.9}
            disabled={carregando}
          >

            {carregando ? (

              <ActivityIndicator
                color="#fff"
                size="small"
              />

            ) : (

              <Text style={styles.botao_style}>
                Entrar
              </Text>

            )}

          </TouchableOpacity>

        </View>

      </View>

    </ImageBackground>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({

  // ===================================================
  // FUNDO
  // ===================================================

  container: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal:
      width * 0.05,
  },

  // ===================================================
  // CAMADA SOBRE A IMAGEM
  // ===================================================

  overlay: {
    flex: 1,

    width: "100%",

    justifyContent: "center",

    alignItems: "center",

    backgroundColor:
      "rgba(15, 82, 186, 0.25)",
  },

  // ===================================================
  // CARD
  // ===================================================

  card_login: {
    backgroundColor:
      "#fff",

    width:
      width * 0.9,

    maxWidth:
      450,

    minHeight:
      height * 0.6,

    padding:
      width * 0.06,

    borderRadius:
      15,

    justifyContent:
      "center",

    elevation:
      5,

    shadowColor:
      "#000",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity:
      0.25,

    shadowRadius:
      5,
  },

  // ===================================================
  // TÍTULO
  // ===================================================

  Titulo: {
    fontSize:
      width * 0.09,

    color:
      "#000",

    textAlign:
      "center",

    marginBottom:
      height * 0.04,

    fontWeight:
      "600",
  },

  // ===================================================
  // LABELS
  // ===================================================

  email_Senha: {
    fontSize:
      width * 0.045,

    marginBottom:
      8,

    marginTop:
      height * 0.02,

    color:
      "#000",
  },

  // ===================================================
  // INPUT
  // ===================================================

  input: {
    borderWidth:
      1,

    borderColor:
      "#CCC",

    borderRadius:
      8,

    paddingVertical:
      height * 0.015,

    paddingHorizontal:
      width * 0.04,

    fontSize:
      width * 0.042,

    color:
      "#000",

    backgroundColor:
      "#FFF",
  },

  // ===================================================
  // BOTÃO
  // ===================================================

  botao: {
    marginTop:
      height * 0.05,

    height:
      height * 0.065,

    backgroundColor:
      "#0F52BA",

    justifyContent:
      "center",

    alignItems:
      "center",

    borderRadius:
      10,
  },

  // ===================================================
  // TEXTO DO BOTÃO
  // ===================================================

  botao_style: {
    color:
      "#FFF",

    fontSize:
      width * 0.05,

    fontWeight:
      "600",
  },

});