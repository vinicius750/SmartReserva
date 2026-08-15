import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";

import { apiFetch } from "../../services/api";

// =====================================================
// COMPONENTE
// =====================================================

export default function GerenciarUsuarios() {
  // ===================================================
  // ESTADOS
  // ===================================================

  const [id, setId] = useState("");

  const [nome, setNome] = useState("");

  const [email, setEmail] = useState("");

  const [searchText, setSearchText] = useState("");

  const [usuarios, setUsuarios] = useState([]);

  const [senha, setSenha] = useState("");

  const [role, setRole] = useState("");

  const [editando, setEditando] = useState(false);

  const [criando, setCriando] = useState(false);

  const [carregando, setCarregando] = useState(true);

  // ===================================================
  // VALIDAR EMAIL
  // ===================================================

  const validarEmail = (email) => {
    const regex =
      /^[\w\.-]+@[\w\.-]+\.\w+$/;

    return regex.test(email);
  };

  // ===================================================
  // LIMPAR FORMULÁRIO
  // ===================================================

  const limparFormulario = () => {
    setNome("");

    setEmail("");

    setSenha("");

    setRole("");

    setId("");
  };

  // ===================================================
  // VERIFICAR USUÁRIO LOGADO
  // ===================================================

  const pegarUsuarioLogado = async () => {
    const usuarioString =
      await AsyncStorage.getItem(
        "usuarioLogado"
      );

    if (!usuarioString) {
      return null;
    }

    try {
      return JSON.parse(usuarioString);
    } catch (error) {
      console.log(
        "Erro ao ler usuário logado:",
        error
      );

      return null;
    }
  };

  // ===================================================
  // CARREGAR USUÁRIOS
  // ===================================================

  const carregarUsuarios = async () => {
    try {
      const resposta = await apiFetch(
        `${"http://192.168.100.128:8000/api"}/gerenciar_usuario`,
        {
          method: "GET",
        }
      );

      const dados = await resposta.json();

      console.log(
        "Status usuários:",
        resposta.status
      );

      console.log(
        "Usuários:",
        dados
      );

      // ============================================
      // ERRO DE AUTENTICAÇÃO
      // ============================================

      if (resposta.status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }

      // ============================================
      // OUTRO ERRO
      // ============================================

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          "Erro ao carregar usuários."
        );
      }

      // ============================================
      // GARANTIR QUE É UMA LISTA
      // ============================================

      if (Array.isArray(dados)) {
        setUsuarios(dados);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.log(
        "Erro ao carregar usuários:",
        error
      );

      Alert.alert(
        "Erro",
        error.message ||
        "Não foi possível carregar os usuários."
      );
    } finally {
      setCarregando(false);
    }
  };

  // ===================================================
  // USE EFFECT
  // ===================================================

  useEffect(() => {
    carregarUsuarios();

    const interval =
      setInterval(() => {
        carregarUsuarios();
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ===================================================
  // EDITAR USUÁRIO
  // ===================================================

  const executarSalvar = async () => {
    // ================================================
    // VALIDAÇÕES
    // ================================================

    if (!nome.trim()) {
      Alert.alert(
        "Erro",
        "Digite o nome do usuário."
      );

      return;
    }

    if (
      !email ||
      !validarEmail(email)
    ) {
      Alert.alert(
        "Erro",
        "Digite um email válido."
      );

      return;
    }

    // Verificar se o email já existe em outro usuário
    const emailExisteEmOutro = usuarios.some(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        Number(u.Id) !== Number(id)
    );

    if (emailExisteEmOutro) {
      Alert.alert(
        "Erro",
        "Este e-mail já está sendo utilizado por outro usuário."
      );

      return;
    }

    if (
      !senha ||
      senha.trim() === ""
    ) {
      Alert.alert(
        "Erro",
        "A senha não pode estar vazia."
      );

      return;
    }

    if (!role) {
      Alert.alert(
        "Erro",
        "Selecione um cargo."
      );

      return;
    }

    try {
      // ==============================================
      // USUÁRIO LOGADO
      // ==============================================

      const usuarioLogado =
        await pegarUsuarioLogado();

      // ==============================================
      // IMPEDIR EDITAR PRÓPRIA CONTA
      // ==============================================

      if (
        usuarioLogado &&
        Number(id) ===
          Number(usuarioLogado.Id)
      ) {
        Alert.alert(
          "Aviso",
          "Você não pode editar sua própria conta."
        );

        return;
      }

      // ==============================================
      // REQUEST
      // ==============================================

      const resposta = await apiFetch(
        `http://192.168.100.128:8000/api/editar_usuario/${id}`,
        {
          method: "PUT",

          body: JSON.stringify({
            nome: nome,
            email: email,
            senha: senha,
            role: role,
          }),
        }
      );

      const dados =
        await resposta.json();

      console.log(
        "Resposta editar:",
        dados
      );

      // ==============================================
      // ERRO DE AUTENTICAÇÃO
      // ==============================================

      if (resposta.status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }

      // ==============================================
      // ERRO
      // ==============================================

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          "Erro ao atualizar usuário."
        );
      }

      // ==============================================
      // SUCESSO
      // ==============================================

      Alert.alert(
        "Sucesso",
        "Usuário atualizado!"
      );

      setEditando(false);

      limparFormulario();

      await carregarUsuarios();
    } catch (error) {
      console.log(
        "Erro ao editar usuário:",
        error
      );

      Alert.alert(
        "Erro",
        error.message ||
        "Não foi possível atualizar."
      );
    }
  };

  const salvar = () => {
    Alert.alert(
      "Confirmar alterações",
      "Deseja salvar as alterações deste usuário?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: executarSalvar },
      ]
    );
  };

  // ===================================================
  // ABRIR EDIÇÃO
  // ===================================================

  const editarUsuario = (usuario) => {
    setCriando(false);

    setId(
      usuario.Id.toString()
    );

    setNome(
      usuario.nome || ""
    );

    setEmail(
      usuario.email || ""
    );

    setSenha(
      usuario.senha || ""
    );

    setRole(
      usuario.role || ""
    );

    setEditando(true);
  };

  // ===================================================
  // CRIAR USUÁRIO
  // ===================================================

  const criarUsuario = async () => {
    // ================================================
    // VALIDAÇÕES
    // ================================================

    if (!nome.trim()) {
      Alert.alert(
        "Erro",
        "Digite o nome do usuário."
      );

      return;
    }

    if (
      !email ||
      !validarEmail(email)
    ) {
      Alert.alert(
        "Erro",
        "Digite um email válido."
      );

      return;
    }

    // Verificar se o email já está em uso
    const emailExiste = usuarios.some(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExiste) {
      Alert.alert(
        "Erro",
        "Este e-mail já está cadastrado."
      );

      return;
    }

    if (
      !senha ||
      senha.trim() === ""
    ) {
      Alert.alert(
        "Erro",
        "A senha não pode estar vazia."
      );

      return;
    }

    if (!role) {
      Alert.alert(
        "Erro",
        "Selecione um cargo."
      );

      return;
    }

    try {
      // ==============================================
      // REQUEST
      // ==============================================

      const resposta = await apiFetch(
        "http://192.168.100.128:8000/api/criar_usuario",
        {
          method: "POST",

          body: JSON.stringify({
            nome: nome,
            email: email,
            senha: senha,
            role: role,
          }),
        }
      );

      const dados =
        await resposta.json();

      console.log(
        "Resposta criar:",
        dados
      );

      // ==============================================
      // ERRO DE AUTENTICAÇÃO
      // ==============================================

      if (resposta.status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }

      // ==============================================
      // ERRO
      // ==============================================

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          "Erro ao criar usuário."
        );
      }

      // ==============================================
      // SUCESSO
      // ==============================================

      Alert.alert(
        "Sucesso",
        "Usuário criado!"
      );

      setCriando(false);

      limparFormulario();

      await carregarUsuarios();
    } catch (error) {
      console.log(
        "Erro ao criar usuário:",
        error
      );

      Alert.alert(
        "Erro",
        error.message ||
        "Não foi possível criar usuário."
      );
    }
  };

  // ===================================================
  // DELETAR USUÁRIO
  // ===================================================

  const deletarUsuario = async (usuario) => {
    try {
      // ==============================================
      // USUÁRIO LOGADO
      // ==============================================

      const usuarioLogado =
        await pegarUsuarioLogado();

      // ==============================================
      // IMPEDIR EXCLUSÃO DA PRÓPRIA CONTA
      // ==============================================

      if (
        usuarioLogado &&
        Number(usuario.Id) ===
          Number(usuarioLogado.Id)
      ) {
        Alert.alert(
          "Aviso",
          "Você não pode excluir sua própria conta."
        );

        return;
      }

      // ==============================================
      // REQUEST
      // ==============================================

      const resposta = await apiFetch(
        "http://192.168.100.128:8000/api/deletar_usuario",
        {
          method: "POST",

          body: JSON.stringify({
            Id: usuario.Id,
            email: usuario.email,
          }),
        }
      );

      const dados =
        await resposta.json();

      console.log(
        "Resposta deletar:",
        dados
      );

      // ==============================================
      // ERRO DE AUTENTICAÇÃO
      // ==============================================

      if (resposta.status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }

      // ==============================================
      // ERRO
      // ==============================================

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
          "Erro ao deletar usuário."
        );
      }

      // ==============================================
      // SUCESSO
      // ==============================================

      Alert.alert(
        "Sucesso",
        "Usuário deletado!"
      );

      await carregarUsuarios();
    } catch (error) {
      console.log(
        "Erro ao deletar usuário:",
        error
      );

      Alert.alert(
        "Erro",
        error.message ||
        "Não foi possível deletar usuário."
      );
    }
  };

  // ===================================================
  // FILTRAR USUÁRIOS
  // ===================================================

  const usuariosFiltrados =
    usuarios.filter((u) => {
      const nomeUsuario =
        u.nome
          ?.toLowerCase()
          .includes(
            searchText.toLowerCase()
          );

      const emailUsuario =
        u.email
          ?.toLowerCase()
          .includes(
            searchText.toLowerCase()
          );

      const idUsuario =
        u.Id
          ?.toString()
          .includes(searchText);

      return (
        nomeUsuario ||
        emailUsuario ||
        idUsuario
      );
    });

  // ===================================================
  // FORMULÁRIO DE EDIÇÃO
  // ===================================================

  const formularioEdicao = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>
          Editar Usuário
        </Text>

        {/* NOME */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Nome:
          </Text>

          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome"
          />
        </View>

        {/* EMAIL */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Email:
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* SENHA */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Senha:
          </Text>

          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite a senha"
            secureTextEntry
          />
        </View>

        {/* ROLE */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Cargo:
          </Text>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "admin" && {
                backgroundColor:
                  "#2563eb",
              },
            ]}
            onPress={() =>
              setRole("admin")
            }
          >
            <Text style={styles.roleText}>
              Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "professor" && {
                backgroundColor:
                  "#16a34a",
              },
            ]}
            onPress={() =>
              setRole("professor")
            }
          >
            <Text style={styles.roleText}>
              Professor
            </Text>
          </TouchableOpacity>
        </View>

        {/* SALVAR */}

        <TouchableOpacity
          style={styles.createButton}
          onPress={salvar}
        >
          <Text style={styles.createButtonText}>
            Salvar Alterações
          </Text>
        </TouchableOpacity>

        {/* CANCELAR */}

        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor:
                "#dc2626",
            },
          ]}
          onPress={() => {
            setEditando(false);

            limparFormulario();
          }}
        >
          <Text style={styles.createButtonText}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ===================================================
  // FORMULÁRIO DE CRIAÇÃO
  // ===================================================

  const formularioCriacao = () => {
    return (
      <View>
        <Text style={styles.sectionTitle}>
          Criar Novo Usuário
        </Text>

        {/* NOME */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Nome:
          </Text>

          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome"
          />
        </View>

        {/* EMAIL */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Email:
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* SENHA */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Senha:
          </Text>

          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite uma senha"
            secureTextEntry
          />
        </View>

        {/* ROLE */}

        <View style={styles.infoBox}>
          <Text style={styles.label}>
            Cargo:
          </Text>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "admin" && {
                backgroundColor:
                  "#2563eb",
              },
            ]}
            onPress={() =>
              setRole("admin")
            }
          >
            <Text style={styles.roleText}>
              Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "professor" && {
                backgroundColor:
                  "#16a34a",
              },
            ]}
            onPress={() =>
              setRole("professor")
            }
          >
            <Text style={styles.roleText}>
              Professor
            </Text>
          </TouchableOpacity>
        </View>

        {/* CRIAR */}

        <TouchableOpacity
          style={styles.createButton}
          onPress={criarUsuario}
        >
          <Text style={styles.createButtonText}>
            Criar Usuário
          </Text>
        </TouchableOpacity>

        {/* CANCELAR */}

        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor:
                "#AF1E1E",
            },
          ]}
          onPress={() => {
            setCriando(false);

            limparFormulario();
          }}
        >
          <Text style={styles.createButtonText}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (carregando) {
    return (
      <SafeAreaView
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#1e40af"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Carregando usuários...
        </Text>
      </SafeAreaView>
    );
  }

  // ===================================================
  // FRONT
  // ===================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <View style={styles.card}>
        {/* ===========================================
            TÍTULO
        =========================================== */}

        <Text style={styles.title}>
          Gerenciar Usuários
        </Text>

        <Text style={styles.subtitle}>
          Busque e gerencie contas de usuários
        </Text>

        {/* ===========================================
            FORMULÁRIO DE EDIÇÃO
        =========================================== */}

        {editando &&
          formularioEdicao()}

        {/* ===========================================
            FORMULÁRIO DE CRIAÇÃO
        =========================================== */}

        {criando &&
          formularioCriacao()}

        {/* ===========================================
            LISTA
        =========================================== */}

        {!editando &&
          !criando && (
            <>
              {/* BUSCA */}

              <View
                style={
                  styles.searchContainer
                }
              >
                <TextInput
                  style={
                    styles.searchInput
                  }
                  placeholder="Buscar usuário..."
                  value={
                    searchText
                  }
                  onChangeText={
                    setSearchText
                  }
                />
              </View>

              {/* LISTA */}

              <FlatList
                data={
                  usuariosFiltrados
                }
                keyExtractor={(item) =>
                  item.Id.toString()
                }
                ListEmptyComponent={
                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Nenhum usuário encontrado.
                  </Text>
                }
                renderItem={({
                  item,
                }) => (
                  <View
                    style={
                      styles.usuarioCard
                    }
                  >
                    <Text>
                      Nome: {item.nome}
                    </Text>

                    <Text>
                      Email: {item.email}
                    </Text>

                    <Text>
                      Cargo: {item.role}
                    </Text>

                    {/* EDITAR */}

                    <TouchableOpacity
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        editarUsuario(
                          item
                        )
                      }
                    >
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Editar
                      </Text>
                    </TouchableOpacity>

                    {/* DELETAR */}

                    <TouchableOpacity
                      style={
                        styles.deleteButton
                      }
                      onPress={() => {
                        Alert.alert(
                          "Deletar Usuário",
                          `Deseja deletar o usuário ${item.nome}?`,
                          [
                            {
                              text:
                                "Cancelar",
                              style:
                                "cancel",
                            },
                            {
                              text:
                                "Confirmar",
                              style:
                                "destructive",
                              onPress:
                                () =>
                                  deletarUsuario(
                                    item
                                  ),
                            },
                          ]
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Deletar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />

              {/* CRIAR USUÁRIO */}

              <TouchableOpacity
                style={
                  styles.createButtonUsuario
                }
                onPress={() => {
                  setCriando(true);

                  setEditando(false);

                  limparFormulario();
                }}
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  + Criar Novo Usuário
                </Text>
              </TouchableOpacity>
            </>
          )}
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fc",
  },

  card: {
    marginHorizontal: 12,
    backgroundColor: "#f8f9fc",
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1E3A8A",
    marginBottom: 8,
    marginTop: 20,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#64748b",
    marginBottom: 20,
  },

  // ===========================================
  // BUSCA
  // ===========================================

  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  // ===========================================
  // BOTÕES
  // ===========================================

  createButton: {
    backgroundColor: "#1e40af",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
  },

  createButtonUsuario: {
    backgroundColor: "#1e40af",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
    marginTop: 10,
  },

  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  editButton: {
    backgroundColor: "#2563eb",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },

  deleteButton: {
    backgroundColor: "#AF1E1E",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  // ===========================================
  // USUÁRIO
  // ===========================================

  usuarioCard: {
    backgroundColor: "#eef2ff",
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 30,
  },

  // ===========================================
  // FORMULÁRIO
  // ===========================================

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a8a",
    marginBottom: 15,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    width: 65,
    color: "#334155",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e2937",
    paddingVertical: 6,
  },

  // ===========================================
  // ROLE
  // ===========================================

  roleButton: {
    backgroundColor: "#64748b",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 10,
  },

  roleText: {
    color: "#fff",
    fontWeight: "600",
  },

  // ===========================================
  // LOADING
  // ===========================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fc",
  },

  loadingText: {
    marginTop: 15,
    color: "#64748b",
    fontSize: 15,
  },
});
