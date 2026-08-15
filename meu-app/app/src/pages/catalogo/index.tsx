import React, { useEffect, useState } from "react";

import {
  Alert,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiFetch } from "../../services/api";

import Cadas from "../cad_eq";

import { Ionicons } from "@expo/vector-icons";

// =====================================================
// CONFIGURAÇÃO DA API
// =====================================================

const IP_COMPUTADOR = "192.168.100.128";

const URL_BASE = `http://${IP_COMPUTADOR}:8000/api`;

const URL_CATALOGO = `${URL_BASE}/catalogo`;

// =====================================================
// OPÇÕES
// =====================================================

const OPCOES_CATEGORIA = [
  {
    id: 1,
    nome: "EQUIPAMENTO",
  },
  {
    id: 2,
    nome: "ESPAÇO",
  },
];

// =====================================================
// COMPONENTE
// =====================================================

export default function Cata() {
  // ===================================================
  // ADMIN
  // ===================================================

  const [isAdmin, setIsAdmin] = useState(false);

  const [verificandoPermissao, setVerificandoPermissao] =
    useState(true);

  // ===================================================
  // ESTADOS
  // ===================================================

  const [tela_cad_status, set_status] =
    useState(false);

  const [itens, setItens] = useState<any[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [primeiraCarga, setPrimeiraCarga] =
    useState(true);

  const [erro, setErro] = useState<string | null>(null);

  const [searchText, setSearchText] =
    useState("");

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState("Todas");

  const [atualizando, setAtualizando] =
    useState(false);

  const [categorias, setCategorias] =
    useState([
      {
        label: "Todas",
        value: "Todas",
      },
    ]);

  const [
    mostrarCategorias,
    setMostrarCategorias,
  ] = useState(false);

  // ===================================================
  // ESTADOS DA EDIÇÃO
  // ===================================================

  const [editando, setEditando] =
    useState(false);

  const [id, setId] =
    useState("");

  const [nome, setNome] =
    useState("");

  const [quantidade, setQuantidade] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [especificacoes, setEspecificacoes] =
    useState("");

  const [acategoria, setACategoria] =
    useState(
      "Selecione uma categoria"
    );

  const [idCategoria, setIdCategoria] =
    useState<number | null>(null);

  const [
    dropdownCategoriaAberto,
    setDropdownCategoriaAberto,
  ] = useState(false);

  // ===================================================
  // VERIFICAR ADMIN
  // ===================================================

  const verificarAdmin = async () => {
    try {
      setVerificandoPermissao(true);

      const usuario =
        await AsyncStorage.getItem(
          "usuarioLogado"
        );

      console.log(
        "Usuário armazenado:",
        usuario
      );

      if (usuario) {
        const dados =
          JSON.parse(usuario);

        const admin =
          dados?.role === "admin";

        console.log(
          "Usuário é admin:",
          admin
        );

        setIsAdmin(admin);

        return;
      }

      // =================================================
      // CASO O ROLE ESTEJA SALVO SEPARADAMENTE
      // =================================================

      const role =
        await AsyncStorage.getItem(
          "role"
        );

      const admin =
        role === "admin";

      console.log(
        "Role separado:",
        role
      );

      console.log(
        "Usuário é admin:",
        admin
      );

      setIsAdmin(admin);

    } catch (error) {
      console.log(
        "Erro ao verificar administrador:",
        error
      );

      setIsAdmin(false);

    } finally {
      setVerificandoPermissao(false);
    }
  };

  // ===================================================
  // CARREGAR CATÁLOGO
  // ===================================================

  const carregarCatalogo = async () => {
    try {
      setErro(null);

      const resposta =
        await apiFetch(
          URL_CATALOGO,
          {
            method: "GET",
          }
        );

      const dados =
        await resposta.json();

      console.log(
        "Resposta catálogo:",
        dados
      );

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Erro ao carregar catálogo."
        );
      }

      setItens((antigos) => {
        const novosDados =
          JSON.stringify(dados);

        const dadosAntigos =
          JSON.stringify(antigos);

        if (
          novosDados ===
          dadosAntigos
        ) {
          return antigos;
        }

        return dados;
      });

      // =================================================
      // CATEGORIAS
      // =================================================

      const categoriasUnicas = [
        "Todas",

        ...new Set(
          dados
            .map(
              (item: any) =>
                item.categoria
            )
            .filter(Boolean)
        ),
      ];

      setCategorias(
        categoriasUnicas.map(
          (categoria: any) => ({
            label: categoria,
            value: categoria,
          })
        )
      );

    } catch (error: any) {
      console.log(
        "Erro ao carregar catálogo:",
        error
      );

      setErro(
        error.message ||
          "Erro ao carregar catálogo."
      );

    } finally {
      setCarregando(false);

      setAtualizando(false);

      setPrimeiraCarga(false);
    }
  };

  // ===================================================
  // EDITAR EQUIPAMENTO
  // ===================================================

  const executarSalvarEquipamento =
    async () => {

      // =================================================
      // PROTEÇÃO ADMIN
      // =================================================

      if (!nome.trim()){
        Alert.alert(
          "Erro",
          "O campo 'Nome' deve estar preenchido."
        );
        
 return;
      }
      if (!quantidade.trim() || Number(quantidade) < 1) {
        Alert.alert(
          "Erro",
          "O campo 'Quantidade' deve estar preenchido."
        );
        return;
      }
            if (!acategoria.trim() || acategoria === "Selecione uma categoria"){
        Alert.alert("Erro", 
            "O campo 'Categoria' deve estar preenchido");
              return;
            }
      if (!especificacoes.trim()) {
        Alert.alert(
          "Erro",
          "O campo 'Especificações técnicas' deve estar preenchido."
        );
        return;
      }
      if (!isAdmin) {
        Alert.alert(
          "Acesso negado",
          "Somente administradores podem editar equipamentos."
        );
        return;
      }

      try {
        const resposta =
          await apiFetch(
            `${URL_BASE}/editar_item/${id}`,
            {
              method: "PUT",

              body: JSON.stringify({
                id: Number(id),

                nome: nome,

                quantidade:
                  Number(
                    quantidade
                  ),

                categoria:
                  acategoria,

                descricao:
                  descricao ||
                  null,

                especificacoestec:
                  especificacoes ||
                  null,
              }),
            }
          );

        const dados =
          await resposta.json();

        console.log(
          "Resposta editar:",
          dados
        );

        if (!resposta.ok) {
          throw new Error(
            dados.detail ||
              "Erro ao editar equipamento."
          );
        }

        Alert.alert(
          "Sucesso",
          "Equipamento atualizado!"
        );

        setEditando(false);

        setId("");

        setNome("");

        setQuantidade("");

        setCategoria("");

        setACategoria(
          "Selecione uma categoria"
        );

        setDescricao("");

        setEspecificacoes("");

        setIdCategoria(null);

        await carregarCatalogo();

      } catch (error: any) {
        console.log(
          "Erro ao editar:",
          error
        );

        Alert.alert(
          "Erro ao editar",
          error.message ||
            "Erro ao editar equipamento."
        );
      }
    };

  const salvarEquipamento = () => {
    Alert.alert(
      "Confirmar alterações",
      "Deseja salvar as alterações deste equipamento?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: executarSalvarEquipamento },
      ]
    );
  };

  // ===================================================
  // DELETAR EQUIPAMENTO
  // ===================================================

  const deletarItem =
    async (
      item: any
    ) => {

      // =================================================
      // PROTEÇÃO ADMIN
      // =================================================

      if (!isAdmin) {
        Alert.alert(
          "Acesso negado",
          "Somente administradores podem deletar equipamentos."
        );

        return;
      }

      try {
        const resposta =
          await apiFetch(
            `${URL_BASE}/deletar_item/${item.id}`,
            {
              method: "POST",
            }
          );

        const dados =
          await resposta.json();

        console.log(
          "Resposta deletar:",
          dados
        );

        if (!resposta.ok) {
          throw new Error(
            dados.detail ||
              "Erro ao deletar equipamento."
          );
        }

        Alert.alert(
          "Sucesso",
          "Equipamento deletado!"
        );

        await carregarCatalogo();

      } catch (error: any) {
        console.log(
          "Erro ao deletar:",
          error
        );

        Alert.alert(
          "Erro ao deletar",
          error.message ||
            "Erro ao deletar equipamento."
        );
      }
    };

  // ===================================================
  // ABRIR EDIÇÃO
  // ===================================================

  const editarItem =
    (
      item: any
    ) => {

      // =================================================
      // PROTEÇÃO ADMIN
      // =================================================

      if (!isAdmin) {
        Alert.alert(
          "Acesso negado",
          "Somente administradores podem editar equipamentos."
        );

        return;
      }

      setId(
        item.id?.toString() ||
          ""
      );

      setNome(
        item.nome || ""
      );

      setQuantidade(
        item.quantidade?.toString() ||
          ""
      );

      setCategoria(
        item.categoria || ""
      );

      setACategoria(
        item.categoria ||
          "Selecione uma categoria"
      );

      const categoriaEncontrada =
        OPCOES_CATEGORIA.find(
          (opcao) =>
            opcao.nome ===
            item.categoria
        );

      if (
        categoriaEncontrada
      ) {
        setIdCategoria(
          categoriaEncontrada.id
        );
      } else {
        setIdCategoria(null);
      }

      setDescricao(
        item.descricao || ""
      );

      setEspecificacoes(
        item.especificacoestec ||
          ""
      );

      setEditando(true);
    };

  // ===================================================
  // CARREGAMENTO INICIAL
  // ===================================================

  useEffect(() => {
    verificarAdmin();
    carregarCatalogo();

    const interval =
      setInterval(() => {
        carregarCatalogo();
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ===================================================
  // FILTRAR ITENS
  // ===================================================

  const itensFiltrados =
    itens.filter(
      (item) => {

        const nomeItem =
          item.nome
            ?.toLowerCase()
            .includes(
              searchText.toLowerCase()
            );

        const categoriaItem =
          categoriaSelecionada ===
            "Todas" ||
          item.categoria ===
            categoriaSelecionada;

        const ativo =
          item.ativo === 1;

        return (
          nomeItem &&
          categoriaItem &&
          ativo
        );
      }
    );

  // ===================================================
  // TELA DE CADASTRO
  // ===================================================

  if (tela_cad_status) {

    if (!isAdmin) {
      set_status(false);
      return null;
    }

    return (
      <Cadas
        aoFechar={() =>
          set_status(false)
        }
      />
    );
  }

  // ===================================================
  // TELA DE EDIÇÃO
  // ===================================================

  if (editando) {

    if (!isAdmin) {
      setEditando(false);
      return null;
    }

    return (
      <View
        style={
          styles.container
        }
      >

        <View
          style={
            styles.card
          }
        >

          <Text
            style={
              styles.title
            }
          >
            Editar Equipamento
          </Text>

          {/* NOME */}

          <View
            style={
              styles.infoBox
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Nome
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={nome}
              onChangeText={
                setNome
              }
              placeholder="Nome do equipamento"
            />

          </View>



          {/* CATEGORIA */}

          <View
            style={[
              styles.categoriaBox,
              {
                zIndex: 9999,
              },
            ]}
          >

            <Text
              style={
                styles.label
              }
            >
              Categoria
            </Text>

            <TouchableOpacity
              style={
                styles.inputBox
              }
              onPress={() =>
                setDropdownCategoriaAberto(
                  !dropdownCategoriaAberto
                )
              }
            >

              <Text
                style={[
                  styles.inputCategoria,
                  {
                    color:
                      acategoria &&
                      acategoria !==
                        "Selecione uma categoria"
                        ? "#000"
                        : "#888",
                  },
                ]}
              >
                {acategoria ||
                  "Selecione uma categoria"}
              </Text>

              <Ionicons
                name={
                  dropdownCategoriaAberto
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={18}
                color="#888"
              />

            </TouchableOpacity>

            {dropdownCategoriaAberto && (

              <View
                style={
                  styles.dropdownLista
                }
              >

                {OPCOES_CATEGORIA.map(
                  (
                    opcao
                  ) => (

                    <TouchableOpacity
                      key={
                        opcao.id
                      }
                      style={[
                        styles.dropdownItem,

                        idCategoria ===
                          opcao.id &&
                          styles.dropdownItemAtivo,
                      ]}
                      onPress={() => {

                        setIdCategoria(
                          opcao.id
                        );

                        setACategoria(
                          opcao.nome
                        );

                        setCategoria(
                          opcao.nome
                        );

                        setDropdownCategoriaAberto(
                          false
                        );

                      }}
                    >

                      <Text
                        style={[
                          styles.dropdownItemTexto,

                          idCategoria ===
                            opcao.id &&
                            styles.dropdownItemTextoAtivo,
                        ]}
                      >
                        {
                          opcao.nome
                        }
                      </Text>

                    </TouchableOpacity>

                  )
                )}

              </View>

            )}

          </View>

          {/* DESCRIÇÃO */}

          <View
            style={
              styles.infoBox
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Descrição
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                descricao
              }
              onChangeText={
                setDescricao
              }
              placeholder="Descrição"
              multiline
            />

          </View>

          {/* ESPECIFICAÇÕES */}

          <View
            style={
              styles.infoBox
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Especificações
            </Text>

            <TextInput
              style={
                styles.input
              }
              value={
                especificacoes
              }
              onChangeText={
                setEspecificacoes
              }
              placeholder="Especificações técnicas"
              multiline
            />

          </View>

          {/* SALVAR */}

          <TouchableOpacity
            style={
              styles.createButton
            }
            onPress={
              salvarEquipamento
            }
          >

            <Text
              style={
                styles.createButtonText
              }
            >
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

              setEditando(
                false
              );

              setDropdownCategoriaAberto(
                false
              );

            }}
          >

            <Text
              style={
                styles.createButtonText
              }
            >
              Cancelar
            </Text>

          </TouchableOpacity>

        </View>

      </View>
    );
  }

  // ===================================================
  // CARREGANDO
  // ===================================================

  if (
    verificandoPermissao ||
    (carregando &&
      primeiraCarga)
  ) {

    return (
      <View
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
          Carregando catálogo...
        </Text>

      </View>
    );
  }

  // ===================================================
  // TELA PRINCIPAL
  // ===================================================

  return (
    <View
      style={
        styles.container
      }
    >

      <View
        style={
          styles.card
        }
      >

        {/* TÍTULO */}

        <Text
          style={
            styles.title
          }
        >
          Catálogo
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Consulte os equipamentos cadastrados
        </Text>

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
            placeholder="Pesquisar equipamento..."
            value={
              searchText
            }
            onChangeText={
              setSearchText
            }
          />

        </View>

        {/* FILTRO */}

        <View
          style={
            styles.dropdownContainer
          }
        >

          <TouchableOpacity
            style={
              styles.dropdown
            }
            onPress={() =>
              setMostrarCategorias(
                !mostrarCategorias
              )
            }
          >

            <Text
              style={
                styles.dropdownText
              }
            >
              {
                categoriaSelecionada
              }
            </Text>

            <Text
              style={
                styles.arrow
              }
            >
              {mostrarCategorias
                ? "▲"
                : "▼"}
            </Text>

          </TouchableOpacity>

          {mostrarCategorias && (

            <View
              style={
                styles.listaCategorias
              }
            >

              <FlatList
                data={
                  categorias
                }
                keyExtractor={(
                  item
                ) =>
                  item.value
                }
                renderItem={({
                  item,
                }) => (

                  <TouchableOpacity
                    style={
                      styles.opcaoCategoria
                    }
                    onPress={() => {

                      setCategoriaSelecionada(
                        item.value
                      );

                      setMostrarCategorias(
                        false
                      );

                    }}
                  >

                    <Text>
                      {
                        item.label
                      }
                    </Text>

                  </TouchableOpacity>

                )}
              />

            </View>

          )}

        </View>

        {/* ERRO */}

        {erro && (

          <View
            style={
              styles.erroBox
            }
          >

            <Text
              style={
                styles.erroTexto
              }
            >
              {erro}
            </Text>

            <TouchableOpacity
              style={
                styles.tentarButton
              }
              onPress={
                carregarCatalogo
              }
            >

              <Text
                style={
                  styles.buttonText
                }
              >
                Tentar novamente
              </Text>

            </TouchableOpacity>

          </View>

        )}

        {/* LISTA */}

        <FlatList
          data={
            itensFiltrados
          }
          keyExtractor={(
            item
          ) =>
            item.id.toString()
          }
          refreshing={
            atualizando
          }
          onRefresh={() => {

            setAtualizando(
              true
            );

            carregarCatalogo();

          }}
          ListEmptyComponent={
            !carregando ? (
              <View
                style={
                  styles.feedback
                }
              >

                <Text
                  style={
                    styles.feedbackTexto
                  }
                >
                  Nenhum equipamento encontrado.
                </Text>

              </View>
            ) : null
          }
          renderItem={({
            item,
          }) => (

            <View
              style={
                styles.itemCard
              }
            >

              {/* NOME */}

              <Text
                style={
                  styles.itemText
                }
              >
                Nome:{" "}
                {item.nome}
              </Text>

              {/* QUANTIDADE */}

              <Text
                style={
                  styles.itemText
                }
              >
                Quantidade:{" "}
                {
                  item.quantidade
                }
              </Text>

              {/* CATEGORIA */}

              <Text
                style={
                  styles.itemText
                }
              >
                Categoria:{" "}
                {
                  item.categoria
                }
              </Text>

              {/* DESCRIÇÃO */}

              {!!item.descricao && (

                <Text
                  style={
                    styles.itemText
                  }
                >
                  Descrição:{" "}
                  {
                    item.descricao
                  }
                </Text>

              )}

              {/* ESPECIFICAÇÕES */}

              {!!item.especificacoestec && (

                <Text
                  style={
                    styles.itemText
                  }
                >
                  Especificações:{" "}
                  {
                    item.especificacoestec
                  }
                </Text>

              )}

              {/* ===================================
                  BOTÕES ADMIN
              =================================== */}

              {isAdmin && (

                <>

                  {/* EDITAR */}

                  <TouchableOpacity
                    style={
                      styles.editButton
                    }
                    onPress={() =>
                      editarItem(
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

                        "Deletar Equipamento",

                        `Deseja deletar o equipamento ${item.nome}?`,

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
                                deletarItem(
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

                </>

              )}

            </View>

          )}
        />

        {/* ==========================================
            CADASTRAR ITEM — SOMENTE ADMIN
        ========================================== */}

        {isAdmin && (

          <TouchableOpacity
            style={
              styles.createButton
            }
            onPress={() =>
              set_status(true)
            }
          >

            <Text
              style={
                styles.createButtonText
              }
            >
              + Cadastrar Item
            </Text>

          </TouchableOpacity>

        )}

      </View>

    </View>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        "#f8f9fc",
    },

    card: {
      flex: 1,
      paddingHorizontal: 12,
      zIndex: 9999,
    },

    title: {
      fontSize: 26,
      fontWeight:
        "bold",
      textAlign:
        "center",
      color:
        "#1E3A8A",
      marginBottom: 8,
      marginTop: 20,
    },

    subtitle: {
      textAlign:
        "center",
      fontSize: 15,
      color:
        "#64748b",
      marginBottom: 20,
    },

    // ===========================================
    // BUSCA
    // ===========================================

    searchContainer: {
      flexDirection:
        "row",
      marginBottom: 15,
    },

    searchInput: {
      flex: 1,
      backgroundColor:
        "#f1f5f9",
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    // ===========================================
    // DROPDOWN
    // ===========================================

    dropdownContainer: {
      marginBottom: 15,
      zIndex: 999,
    },

    dropdown: {
      height: 55,
      backgroundColor:
        "#f1f5f9",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      paddingHorizontal: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    dropdownText: {
      fontSize: 16,
      color:
        "#1e293b",
    },

    arrow: {
      fontSize: 18,
      color:
        "#64748b",
    },

    listaCategorias: {
      position:
        "absolute",
      top: 60,
      left: 0,
      right: 0,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#f1f5f9",
      borderRadius: 12,
      elevation: 10,
      shadowColor:
        "#000",
      shadowOpacity:
        0.2,
      shadowRadius:
        5,
      maxHeight: 180,
    },

    opcaoCategoria: {
      padding: 15,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#eee",
    },

    // ===========================================
    // ITEM
    // ===========================================

    itemCard: {
      backgroundColor:
        "#eef2ff",
      marginBottom: 12,
      padding: 15,
      borderRadius: 10,
      marginHorizontal: 2,
    },

    itemText: {
      fontSize: 15,
      color:
        "#1e293b",
      marginBottom: 5,
    },

    // ===========================================
    // BOTÕES
    // ===========================================

    editButton: {
      backgroundColor:
        "#2563eb",
      padding: 10,
      borderRadius: 8,
      marginTop: 12,
    },

    deleteButton: {
      backgroundColor:
        "#AF1E1E",
      padding: 10,
      borderRadius: 8,
      marginTop: 10,
    },

    createButton: {
      backgroundColor:
        "#1e40af",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems:
        "center",
      marginBottom: 10,
      marginTop: 10,
    },

    createButtonText: {
      color:
        "#fff",
      fontWeight:
        "bold",
      fontSize: 16,
    },

    buttonText: {
      color:
        "#fff",
      textAlign:
        "center",
      fontWeight:
        "bold",
    },

    // ===========================================
    // LOADING
    // ===========================================

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#f8f9fc",
    },

    loadingText: {
      marginTop: 15,
      color:
        "#64748b",
      fontSize: 15,
    },

    // ===========================================
    // ERRO
    // ===========================================

    erroBox: {
      backgroundColor:
        "#fee2e2",
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
    },

    erroTexto: {
      color:
        "#991b1b",
      textAlign:
        "center",
      marginBottom: 10,
    },

    tentarButton: {
      backgroundColor:
        "#991b1b",
      padding: 10,
      borderRadius: 8,
    },

    // ===========================================
    // FEEDBACK
    // ===========================================

    feedback: {
      marginTop: 30,
      alignItems:
        "center",
    },

    feedbackTexto: {
      textAlign:
        "center",
      color:
        "#666",
      fontSize: 15,
    },

    // ===========================================
    // EDIÇÃO
    // ===========================================

    infoBox: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      backgroundColor:
        "#f8fafc",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 14,
    },

    categoriaBox: {
      flexDirection:
        "column",
      backgroundColor:
        "#f8fafc",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 14,
      zIndex: 9999,
      position:
        "relative",
    },

    label: {
      fontSize: 16,
      fontWeight:
        "600",
      color:
        "#334155",
      width: 100,
      paddingTop: 8,
    },

    input: {
      flex: 1,
      fontSize: 16,
      color:
        "#1e293b",
      paddingVertical: 8,
      textAlignVertical:
        "top",
    },

    inputBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#ddd",
      paddingHorizontal: 12,
      height: 50,
      width: "100%",
    },

    inputCategoria: {
      flex: 1,
      fontSize: 16,
      color:
        "#1e293b",
      paddingHorizontal: 10,
    },

    dropdownLista: {
      position:
        "absolute",
      top: 82,
      left: 14,
      right: 14,
      backgroundColor:
        "#ffffff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#ddd",
      elevation: 20,
      shadowColor:
        "#000",
      shadowOpacity:
        0.15,
      shadowRadius:
        5,
      zIndex: 9999,
    },

    dropdownItem: {
      padding: 12,
      borderRadius: 8,
    },

    dropdownItemAtivo: {
      backgroundColor:
        "#eaf1ff",
    },

    dropdownItemTexto: {
      fontSize: 14,
      color:
        "#333",
    },

    dropdownItemTextoAtivo: {
      color:
        "#2563eb",
      fontWeight:
        "bold",
    },
  });
