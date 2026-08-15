import React, { useEffect, useState } from "react";

import {
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import Calend from "./pages/Calend";
import Login from "./pages/Login";
import catalogo from "./pages/catalogo";
import cad_usuario from "./pages/cad_usuario";
import cad_equipamento from "./pages/cad_eq";
import dash from "./pages/dash";
import reserva from "./pages/criar_reserva";

import BotaoLogout from "../../components/BotaoLogout";

import {
  renovarAccessToken,
} from "./services/api";

// =====================================================
// NAVEGADORES
// =====================================================

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// =====================================================
// TIPOS DE NAVEGAÇÃO
// =====================================================

export type RootStackParamList = {
  Home: undefined;

  Reserva: {
    dataReserva: string;
  };
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function Rotas() {

  // ===================================================
  // LOGIN
  // ===================================================

  const [logado, setLogado] = useState(false);

  const [
    verificandoLogin,
    setVerificandoLogin,
  ] = useState(true);

  // ===================================================
  // ADMIN
  // ===================================================

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);

  // ===================================================
  // VERIFICAR LOGIN AO ABRIR
  // ===================================================

  useEffect(() => {

    verificarLogin();

  }, []);

  // ===================================================
  // CARREGAR USUÁRIO
  // ===================================================

  async function carregarUsuario() {

    try {

      // =================================================
      // PEGAR OBJETO USUARIO
      // =================================================

      const usuarioStorage =
        await AsyncStorage.getItem("usuarioLogado");

      // =================================================
      // PEGAR ROLE SEPARADAMENTE
      // =================================================

      const roleStorage =
        await AsyncStorage.getItem("role");

      console.log(
        "===================================="
      );

      console.log(
        "USUARIO STORAGE:",
        usuarioStorage
      );

      console.log(
        "ROLE STORAGE:",
        roleStorage
      );

      console.log(
        "===================================="
      );

      // =================================================
      // TENTAR DESCOBRIR A ROLE
      // =================================================

      let role = null;

      // =================================================
      // PRIMEIRO: OBJETO USUARIO
      // =================================================

      if (usuarioStorage) {

        try {

          const dados =
            JSON.parse(usuarioStorage);

          console.log(
            "DADOS DO USUARIO:",
            dados
          );

          if (dados?.role) {

            role = dados.role;

          }

        } catch (erro) {

          console.log(
            "Erro ao converter usuario:",
            erro
          );

        }

      }

      // =================================================
      // SEGUNDO: ROLE SEPARADA
      // =================================================

      if (!role && roleStorage) {

        role = roleStorage;

      }

      // =================================================
      // NORMALIZAR ROLE
      // =================================================

      if (typeof role === "string") {

        role =
          role
            .trim()
            .toLowerCase();

      }

      // =================================================
      // VERIFICAR ADMIN
      // =================================================

      if (role === "admin") {

        console.log(
          "===================================="
        );

        console.log(
          "USUARIO É ADMIN"
        );

        console.log(
          "ROLE:",
          role
        );

        console.log(
          "===================================="
        );

        setIsAdmin(true);

      } else {

        console.log(
          "===================================="
        );

        console.log(
          "USUARIO NÃO É ADMIN"
        );

        console.log(
          "ROLE:",
          role
        );

        console.log(
          "===================================="
        );

        setIsAdmin(false);

      }

      return role;

    } catch (error) {

      console.error(
        "ERRO AO CARREGAR USUARIO:",
        error
      );

      setIsAdmin(false);

      return null;
    }
  }

  // ===================================================
  // HOME / TABS
  // ===================================================

  function HomeTabs() {

    console.log(
      "RENDERIZANDO HOME"
    );

    console.log(
      "IS ADMIN:",
      isAdmin
    );

    return (

      <View
        style={{
          flex: 1,
        }}
      >

        {/* ============================================
            BOTÃO LOGOUT
        ============================================ */}

        <View
          style={styles.topBar}
        >

          <BotaoLogout
            aoSair={async () => {

              // ========================================
              // LIMPAR USUARIO
              // ========================================

              await AsyncStorage.removeItem(
                "usuario"
              );

              // ========================================
              // LIMPAR ROLE
              // ========================================

              await AsyncStorage.removeItem(
                "role"
              );

              // ========================================
              // LIMPAR ACCESS TOKEN
              // ========================================

              await AsyncStorage.removeItem(
                "access_token"
              );

              // ========================================
              // LIMPAR REFRESH TOKEN
              // ========================================

              await AsyncStorage.removeItem(
                "refresh_token"
              );

              // ========================================
              // RESETAR ADMIN
              // ========================================

              setIsAdmin(false);

              // ========================================
              // RESETAR LOGIN
              // ========================================

              setLogado(false);

            }}
          />

        </View>

        {/* ============================================
            TABS
        ============================================ */}

        <Tab.Navigator

          screenOptions={({ route }) => ({
  headerShown: false,
  tabBarStyle: {
    backgroundColor: "#0F52BA",
    borderTopColor: "transparent",
  },
  tabBarActiveTintColor: "#FFFFFF",
  tabBarInactiveTintColor: "#CBD5E1",
  
  // ADICIONE ESTA FUNÇÃO AQUI:
  tabBarIcon: ({ color, size }) => {
    let caminhoImagem;

    // Defina os caminhos corretos de acordo com a sua pasta de imagens (ex: assets)
   if (route.name === "Calendário") {
  caminhoImagem = require("./assets/calendario.png");
} else if (route.name === "Catálogo") {
  caminhoImagem = require("./assets/catalogo.png");
} else if (route.name === "Cad. Usuário") {
  caminhoImagem = require("./assets/cadastro_usuarios.png");
} else if (route.name === "Dashboard") {
  caminhoImagem = require("./assets/dashboard.png");
}


    // Se encontrar a imagem, renderiza o componente Image
    if (caminhoImagem) {
      return (
        <Image
          source={caminhoImagem}
          style={{
            width: size,
            height: size,
            
          }}
        />
      );
    }

    return null;
  },
})}


        >

          {/* ==========================================
              CALENDÁRIO
              TODOS PODEM VER
          ========================================== */}

          <Tab.Screen
            name="Calendário"
            component={Calend}
          />

          {/* ==========================================
              CATÁLOGO
              TODOS PODEM VER
          ========================================== */}

          <Tab.Screen
            name="Catálogo"
            component={catalogo}
          />

          {/* ==========================================
              ADMIN
          ========================================== */}

          {isAdmin && (

            <>

              {/* ======================================
                  CADASTRO DE USUÁRIO
              ====================================== */}

              <Tab.Screen
                name="Cad. Usuário"
                component={cad_usuario}
              />



              {/* ======================================
                  DASHBOARD
              ====================================== */}

              <Tab.Screen
                name="Dashboard"
                component={dash}
              />

            </>

          )}

        </Tab.Navigator>

      </View>
    );
  }

  // ===================================================
  // VERIFICAR LOGIN
  // ===================================================

  async function verificarLogin() {

    try {

      console.log(
        "===================================="
      );

      console.log(
        "VERIFICANDO LOGIN..."
      );

      console.log(
        "===================================="
      );

      // =================================================
      // PEGAR REFRESH TOKEN
      // =================================================

      const refreshToken =
        await AsyncStorage.getItem(
          "refresh_token"
        );

      // =================================================
      // NÃO TEM REFRESH TOKEN
      // =================================================

      if (!refreshToken) {

        console.log(
          "NENHUM REFRESH TOKEN ENCONTRADO"
        );

        setLogado(false);

        setIsAdmin(false);

        return;

      }

      // =================================================
      // RENOVAR ACCESS TOKEN
      // =================================================

      console.log(
        "RENOVANDO ACCESS TOKEN..."
      );

      const novoToken =
        await renovarAccessToken();

      // =================================================
      // TOKEN INVÁLIDO
      // =================================================

      if (!novoToken) {

        console.log(
          "SESSÃO EXPIRADA"
        );

        // ===============================================
        // LIMPAR TOKENS
        // ===============================================

        await AsyncStorage.removeItem(
          "access_token"
        );

        await AsyncStorage.removeItem(
          "refresh_token"
        );

        setLogado(false);

        setIsAdmin(false);

        return;

      }

      // =================================================
      // LOGIN RESTAURADO
      // =================================================

      console.log(
        "LOGIN RESTAURADO COM SUCESSO"
      );

      // =================================================
      // CARREGAR USUARIO
      // =================================================

      const role =
        await carregarUsuario();

      console.log(
        "ROLE FINAL:",
        role
      );

      // =================================================
      // USUARIO LOGADO
      // =================================================

      setLogado(true);

    } catch (error) {

      console.error(
        "ERRO AO VERIFICAR LOGIN:",
        error
      );

      setLogado(false);

      setIsAdmin(false);

    } finally {

      setVerificandoLogin(false);

    }
  }

  // ===================================================
  // CARREGANDO
  // ===================================================

  if (verificandoLogin) {

    return (

      <View
        style={
          styles.loadingContainer
        }
      >

        <ActivityIndicator
          size="large"
          color="#0F52BA"
        />

      </View>

    );
  }

  // ===================================================
  // USUARIO LOGADO
  // ===================================================

  if (logado) {

    return (

      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >

        {/* ==========================================
            HOME
        ========================================== */}

        <Stack.Screen
          name="Home"
          component={HomeTabs}
        />

        {/* ==========================================
            CRIAR RESERVA
        ========================================== */}

        <Stack.Screen
          name="Reserva"
          component={reserva}
        />

      </Stack.Navigator>

    );

  }

  // ===================================================
  // LOGIN
  // ===================================================

  return (

    <Login

      aologar={async () => {

        console.log(
          "===================================="
        );

        console.log(
          "LOGIN REALIZADO"
        );

        console.log(
          "CARREGANDO DADOS DO USUARIO..."
        );

        console.log(
          "===================================="
        );

        // ==============================================
        // CARREGAR USUARIO
        // ==============================================

        await carregarUsuario();

        // ==============================================
        // ENTRAR NO SISTEMA
        // ==============================================

        setLogado(true);

      }}

    />

  );

}

// =====================================================
// ESTILOS
// =====================================================

const styles =
  StyleSheet.create({

    loadingContainer: {

      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      backgroundColor:
        "#F9FAFB",

    },

    topBar: {



      position:
        "absolute",

      justifyContent:
        "center",

      alignItems:
        "flex-end",

      top: 15,

      right: -10,

      zIndex: 999,

      elevation: 999,

    },

  });