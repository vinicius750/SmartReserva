import React, {
  useState,
  useEffect,
} from "react";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { apiFetch } from "../../services/api";


// =====================================================
// TIPOS
// =====================================================

type Horario = {
  id: number;
  nome: string;
  horario_inicial: string;
  horario_final: string;
};

type Item = {
  id: number;
  Nome: string;
};

type RouteParams = {
  dataReserva?: string;
};


// =====================================================
// HORÁRIOS
// =====================================================

const HORARIOS: Horario[] = [

  {
    id: 1,
    nome: "07:30 - 08:20",
    horario_inicial: "07:30",
    horario_final: "08:20",
  },

  {
    id: 2,
    nome: "08:20 - 09:10",
    horario_inicial: "08:20",
    horario_final: "09:10",
  },

  {
    id: 3,
    nome: "09:30 - 10:20",
    horario_inicial: "09:30",
    horario_final: "10:20",
  },

  {
    id: 4,
    nome: "10:20 - 11:10",
    horario_inicial: "10:20",
    horario_final: "11:10",
  },

  {
    id: 5,
    nome: "11:10 - 12:00",
    horario_inicial: "11:10",
    horario_final: "12:00",
  },
  {
    id: 6,
    nome: "13:20 - 14:10",
    horario_inicial: "13:20",
    horario_final: "14:10",
  },
  {
    id: 7,
    nome: "14:10 - 15:00",
    horario_inicial: "14:10",
    horario_final: "15:00",
  },
  {
    id: 8,
    nome: "15:20 - 16:10",
    horario_inicial: "15:20",
    horario_final: "16:10",
  },
  {
    id: 9,
    nome: "16:10 - 17:00",
    horario_inicial: "16:10",
    horario_final: "17:00",
  },

];


// =====================================================
// COMPONENTE
// =====================================================

export default function CriarReserva() {

  const navigation =
    useNavigation();

  const route =
    useRoute();


  // ===================================================
  // DATA RECEBIDA
  // ===================================================

  const routeParams =
    (route.params || {}) as RouteParams;

  const dataReservaFinal =
    routeParams.dataReserva;


  // ===================================================
  // DEBUG
  // ===================================================

  useEffect(() => {

    console.log(
      "================================="
    );

    console.log(
      "PARAMETROS RECEBIDOS:",
      route.params
    );

    console.log(
      "DATA RECEBIDA:",
      dataReservaFinal
    );

    console.log(
      "================================="
    );

  }, [
    route.params,
    dataReservaFinal,
  ]);


  // ===================================================
  // ITEM
  // ===================================================

  const [
    dropdownItemAberto,
    setDropdownItemAberto,
  ] = useState(false);

  const [
    idItem,
    setIdItem,
  ] = useState<number | null>(null);

  const [
    nomeItem,
    setNomeItem,
  ] = useState(
    "Selecione um item"
  );

  const [
    itens,
    setItens,
  ] = useState<Item[]>([]);


  // ===================================================
  // HORÁRIO
  // ===================================================

  const [
    dropdownHorarioAberto,
    setDropdownHorarioAberto,
  ] = useState(false);

  const [
    idHorario,
    setIdHorario,
  ] = useState<number | null>(null);

  const [
    nomeHorario,
    setNomeHorario,
  ] = useState(
    "Selecione um horário"
  );


  // ===================================================
  // HORÁRIOS DISPONÍVEIS
  // ===================================================

  const [
    horariosDisponiveis,
    setHorariosDisponiveis,
  ] = useState<Horario[]>([]);

  const [
    carregandoHorarios,
    setCarregandoHorarios,
  ] = useState(false);


  // ===================================================
  // LOADING
  // ===================================================

  const [
    carregandoItens,
    setCarregandoItens,
  ] = useState(true);

  const [
    criandoReserva,
    setCriandoReserva,
  ] = useState(false);


  // ===================================================
  // BUSCAR ITENS AO ABRIR
  // ===================================================

  useEffect(() => {

    buscarItens();

  }, []);


  // ===================================================
  // BUSCAR ITENS
  // ===================================================

  async function buscarItens() {

    try {

      setCarregandoItens(true);

      const resposta =
        await apiFetch(
          "http://192.168.100.128:8000/api/buscar_eq",
          {
            method: "GET",
          }
        );

      console.log(
        "Status buscar itens:",
        resposta.status
      );

      const dados =
        await resposta.json();

      console.log(
        "Itens recebidos:",
        dados
      );

      if (
        resposta.status === 401
      ) {

        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }

      if (!resposta.ok) {

        throw new Error(
          dados.detail ||
          "Erro ao buscar itens."
        );
      }

      if (
        Array.isArray(dados)
      ) {

        setItens(dados);

      } else {

        setItens([]);

      }

    } catch (error: any) {

      console.log(
        "Erro ao buscar itens:",
        error
      );

      Alert.alert(
        "Erro",
        error?.message ||
        "Não foi possível carregar os itens."
      );

    } finally {

      setCarregandoItens(false);

    }
  }


  // ===================================================
  // VERIFICAR UM HORÁRIO
  // ===================================================

  async function verificarHorario(
    horario: Horario,
    itemId: number
  ) {

    try {

      const resposta =
        await apiFetch(
          "http://192.168.100.128:8000/api/verificar_reserva",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              id_itens:
                itemId,

              data_reserva:
                dataReservaFinal,

              hora_inicio:
                horario.horario_inicial,

              hora_fim:
                horario.horario_final,

            }),
          }
        );

      const dados =
        await resposta.json();

      console.log(
        "Verificação do horário:",
        horario.nome,
        dados
      );

      if (
        resposta.status === 401
      ) {

        throw new Error(
          "Sessão expirada."
        );

      }

      if (!resposta.ok) {

        throw new Error(
          dados.detail ||
          "Erro ao verificar horário."
        );
      }

      return !dados.existe;

    } catch (error) {

      console.log(
        "Erro ao verificar horário:",
        horario.nome,
        error
      );

      throw error;
    }
  }


  // ===================================================
  // BUSCAR HORÁRIOS DISPONÍVEIS
  // ===================================================

  async function buscarHorariosDisponiveis(
    itemId: number
  ) {

    if (!dataReservaFinal) {

      Alert.alert(
        "Erro",
        "Nenhuma data foi selecionada."
      );

      return;
    }

    try {

      setCarregandoHorarios(
        true
      );

      setIdHorario(null);

      setNomeHorario(
        "Selecione um horário"
      );

      setHorariosDisponiveis([]);

      console.log(
        "================================="
      );

      console.log(
        "BUSCANDO HORÁRIOS DISPONÍVEIS"
      );

      console.log(
        "DATA:",
        dataReservaFinal
      );

      console.log(
        "ITEM:",
        itemId
      );

      console.log(
        "================================="
      );


      const resultados =
        await Promise.all(

          HORARIOS.map(
            async (horario) => {

              const disponivel =
                await verificarHorario(
                  horario,
                  itemId
                );

              return {
                horario,
                disponivel,
              };
            }
          )

        );


      const disponiveis =
        resultados
          .filter(
            resultado =>
              resultado.disponivel
          )
          .map(
            resultado =>
              resultado.horario
          );


      console.log(
        "HORÁRIOS DISPONÍVEIS:",
        disponiveis
      );


      setHorariosDisponiveis(
        disponiveis
      );


      if (
        disponiveis.length === 0
      ) {

        Alert.alert(
          "Sem horários",
          "Não existem horários disponíveis para este item nessa data."
        );

      }

    } catch (error: any) {

      console.log(
        "Erro ao buscar horários disponíveis:",
        error
      );

      if (
        error?.message ===
        "Sessão expirada."
      ) {

        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

      } else {

        Alert.alert(
          "Erro",
          error?.message ||
          "Não foi possível verificar os horários disponíveis."
        );

      }

      setHorariosDisponiveis([]);

    } finally {

      setCarregandoHorarios(
        false
      );

    }
  }


  // ===================================================
  // SELECIONAR ITEM
  // ===================================================

  function selecionarItem(
    item: Item
  ) {

    setIdItem(
      item.id
    );

    setNomeItem(
      item.Nome
    );

    setDropdownItemAberto(
      false
    );

    setIdHorario(null);

    setNomeHorario(
      "Selecione um horário"
    );

    setHorariosDisponiveis([]);

    buscarHorariosDisponiveis(
      item.id
    );
  }


  // ===================================================
  // DADOS DA RESERVA
  // ===================================================

  function obterDadosReserva() {

    if (!dataReservaFinal) {

      Alert.alert(
        "Erro",
        "Nenhuma data foi selecionada."
      );

      return null;
    }


    if (!idItem) {

      Alert.alert(
        "Erro",
        "Selecione um item ou espaço."
      );

      return null;
    }


    if (!idHorario) {

      Alert.alert(
        "Erro",
        "Selecione um horário disponível."
      );

      return null;
    }


    const hora =
      HORARIOS.find(
        item =>
          item.id ===
          Number(idHorario)
      );


    if (!hora) {

      Alert.alert(
        "Erro",
        "Horário inválido."
      );

      return null;
    }


    return {

      id_itens:
        idItem,

      data_reserva:
        dataReservaFinal,

      hora_inicio:
        hora.horario_inicial,

      hora_fim:
        hora.horario_final,

    };
  }


  // ===================================================
  // CRIAR RESERVA
  // ===================================================

  async function criar_reserva() {

    const dadosReserva =
      obterDadosReserva();

    if (!dadosReserva) {
      return;
    }


    try {

      setCriandoReserva(
        true
      );


      console.log(
        "================================="
      );

      console.log(
        "CRIANDO RESERVA"
      );

      console.log(
        "DADOS ENVIADOS:",
        dadosReserva
      );

      console.log(
        "================================="
      );


      // =================================================
      // VERIFICAR NOVAMENTE
      // =================================================

      const verificacao =
        await apiFetch(
          "http://192.168.100.128:8000/api/verificar_reserva",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              dadosReserva
            ),
          }
        );


      const dadosVerificacao =
        await verificacao.json();


      console.log(
        "Resposta da verificação:",
        dadosVerificacao
      );


      if (
        verificacao.status === 401
      ) {

        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }


      if (!verificacao.ok) {

        throw new Error(
          dadosVerificacao.detail ||
          "Erro ao verificar disponibilidade."
        );
      }


      // =================================================
      // JÁ ESTÁ RESERVADO
      // =================================================

      if (
        dadosVerificacao.existe
      ) {

        Alert.alert(
          "Horário indisponível",
          "Esse horário já foi reservado. Escolha outro horário."
        );


        if (idItem) {

          await buscarHorariosDisponiveis(
            idItem
          );

        }

        return;
      }


      // =================================================
      // CRIAR RESERVA
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "ENVIANDO PARA /api/criar_reserva"
      );

      console.log(
        dadosReserva
      );

      console.log(
        "================================="
      );


      const resposta =
        await apiFetch(
          "http://192.168.100.128:8000/api/criar_reserva",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              dadosReserva
            ),
          }
        );


      const dados =
        await resposta.json();


      console.log(
        "================================="
      );

      console.log(
        "RESPOSTA DA API:"
      );

      console.log(
        dados
      );

      console.log(
        "STATUS:",
        resposta.status
      );

      console.log(
        "================================="
      );


      // =================================================
      // TOKEN EXPIRADO
      // =================================================

      if (
        resposta.status === 401
      ) {

        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        return;
      }


      // =================================================
      // CONFLITO
      // =================================================

      if (
        resposta.status === 409
      ) {

        Alert.alert(
          "Horário indisponível",
          dados.detail ||
          "Esse horário acabou de ser reservado por outra pessoa."
        );


        if (idItem) {

          await buscarHorariosDisponiveis(
            idItem
          );

        }

        return;
      }


      // =================================================
      // OUTRO ERRO
      // =================================================

      if (!resposta.ok) {

        throw new Error(
          dados.detail ||
          "Não foi possível criar a reserva."
        );
      }


      // =================================================
      // SUCESSO
      // =================================================

      Alert.alert(
        "Sucesso",
        "Reserva criada com sucesso!",
        [
          {
            text: "OK",

            onPress: () => {

              navigation.goBack();

            },
          },
        ]
      );


    } catch (error: any) {

      console.log(
        "================================="
      );

      console.log(
        "ERRO AO CRIAR RESERVA:"
      );

      console.log(
        error
      );

      console.log(
        "================================="
      );


      Alert.alert(
        "Erro",
        error?.message ||
        "Não foi possível criar a reserva."
      );


    } finally {

      setCriandoReserva(
        false
      );

    }
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <ScrollView
      style={
        styles.container
      }

      contentContainerStyle={
        styles.contentContainer
      }
    >

      {/* =============================================
          TÍTULO
      ============================================= */}

      <Text
        style={
          styles.titulo_principal
        }
      >
        Criar Reserva
      </Text>


      {/* =============================================
          DATA
      ============================================= */}

      <Text
        style={
          styles.titulo
        }
      >
        Data da reserva
      </Text>


      <View
        style={
          styles.cardData
        }
      >

        <Text
          style={
            styles.cardTitulo
          }
        >
          Data selecionada
        </Text>


        <Text
          style={
            styles.cardDataTexto
          }
        >
          {
            dataReservaFinal ||
            "Nenhuma data selecionada"
          }
        </Text>

      </View>


      {/* =============================================
          ITEM
      ============================================= */}

      <Text
        style={
          styles.titulo
        }
      >
        Item / Espaço
      </Text>


      <TouchableOpacity

        style={
          styles.inputBox
        }

        onPress={() => {

          if (!dropdownItemAberto) {

            buscarItens();

          }

          setDropdownItemAberto(
            !dropdownItemAberto
          );

          setDropdownHorarioAberto(
            false
          );

        }}

      >

        <Text

          style={[
            styles.input,

            {
              color:
                idItem
                  ? "#000"
                  : "#888",
            },

          ]}

        >
          {nomeItem}
        </Text>


        <Ionicons

          name={
            dropdownItemAberto
              ? "chevron-up"
              : "chevron-down"
          }

          size={20}

          color="#888"

        />

      </TouchableOpacity>


      {/* =============================================
          DROPDOWN ITEM
      ============================================= */}

      {
        dropdownItemAberto && (

          <View
            style={
              styles.dropdownContainer
            }
          >

            {
              carregandoItens ? (

                <View
                  style={
                    styles.loadingItens
                  }
                >

                  <ActivityIndicator
                    size="small"
                    color="#1e40af"
                  />

                  <Text>
                    Carregando itens...
                  </Text>

                </View>

              ) : itens.length === 0 ? (

                <View
                  style={
                    styles.mensagemContainer
                  }
                >

                  <Text
                    style={
                      styles.mensagemTexto
                    }
                  >
                    Nenhum item encontrado.
                  </Text>

                </View>

              ) : (

                <FlatList

                  data={itens}

                  keyExtractor={
                    item =>
                      item.id.toString()
                  }

                  style={
                    styles.dropdownLista
                  }

                  nestedScrollEnabled

                  renderItem={({
                    item,
                  }) => (

                    <TouchableOpacity

                      style={[
                        styles.dropdownItem,

                        idItem ===
                          item.id &&
                          styles.dropdownItemAtivo,
                      ]}

                      onPress={() => {

                        selecionarItem(
                          item
                        );

                      }}

                    >

                      <Text

                        style={[
                          styles.dropdownItemTexto,

                          idItem ===
                            item.id &&
                            styles.dropdownItemTextoAtivo,
                        ]}

                      >
                        {item.Nome}
                      </Text>

                    </TouchableOpacity>

                  )}

                />

              )
            }

          </View>

        )
      }


      {/* =============================================
          HORÁRIO
      ============================================= */}

      <Text
        style={
          styles.titulo
        }
      >
        Horário disponível
      </Text>


      {/* =============================================
          CARREGANDO
      ============================================= */}

      {
        carregandoHorarios && (

          <View
            style={
              styles.carregandoHorarios
            }
          >

            <ActivityIndicator
              size="small"
              color="#1e40af"
            />

            <Text
              style={
                styles.carregandoTexto
              }
            >
              Verificando horários disponíveis...
            </Text>

          </View>

        )
      }


      {/* =============================================
          SEM ITEM
      ============================================= */}

      {
        !idItem &&
        !carregandoHorarios && (

          <View
            style={
              styles.mensagemContainer
            }
          >

            <Ionicons
              name="calendar-outline"
              size={24}
              color="#888"
            />

            <Text
              style={
                styles.mensagemTexto
              }
            >
              Selecione um item ou espaço para ver os horários disponíveis.
            </Text>

          </View>

        )
      }


      {/* =============================================
          HORÁRIOS
      ============================================= */}

      {
        idItem &&
        !carregandoHorarios &&
        horariosDisponiveis.length > 0 && (

          <>

            <TouchableOpacity

              style={
                styles.inputBox
              }

              onPress={() => {

                setDropdownHorarioAberto(
                  !dropdownHorarioAberto
                );

                setDropdownItemAberto(
                  false
                );

              }}

            >

              <Text

                style={[
                  styles.input,

                  {
                    color:
                      idHorario
                        ? "#000"
                        : "#888",
                  },

                ]}

              >
                {nomeHorario}
              </Text>


              <Ionicons

                name={
                  dropdownHorarioAberto
                    ? "chevron-up"
                    : "chevron-down"
                }

                size={20}

                color="#888"

              />

            </TouchableOpacity>


            {/* =========================================
                DROPDOWN HORÁRIOS
            ========================================= */}

            {
              dropdownHorarioAberto && (

                <View
                  style={
                    styles.dropdownContainer
                  }
                >

                  <FlatList

                    data={
                      horariosDisponiveis
                    }

                    keyExtractor={
                      item =>
                        item.id.toString()
                    }

                    style={
                      styles.dropdownLista
                    }

                    nestedScrollEnabled

                    renderItem={({
                      item,
                    }) => (

                      <TouchableOpacity

                        style={[
                          styles.dropdownItem,

                          idHorario ===
                            item.id &&
                            styles.dropdownItemAtivo,
                        ]}

                        onPress={() => {

                          setIdHorario(
                            item.id
                          );

                          setNomeHorario(
                            item.nome
                          );

                          setDropdownHorarioAberto(
                            false
                          );

                        }}

                      >

                        <View
                          style={
                            styles.horarioLinha
                          }
                        >

                          <Text

                            style={[
                              styles.dropdownItemTexto,

                              idHorario ===
                                item.id &&
                                styles.dropdownItemTextoAtivo,
                            ]}

                          >
                            {item.nome}
                          </Text>


                          <Ionicons

                            name="checkmark-circle"

                            size={20}

                            color="#16a34a"

                          />

                        </View>

                      </TouchableOpacity>

                    )}

                  />

                </View>

              )
            }

          </>

        )
      }


      {/* =============================================
          NENHUM HORÁRIO
      ============================================= */}

      {
        idItem &&
        !carregandoHorarios &&
        horariosDisponiveis.length === 0 && (

          <View
            style={
              styles.semHorarioContainer
            }
          >

            <Ionicons
              name="time-outline"
              size={30}
              color="#dc2626"
            />

            <Text
              style={
                styles.semHorarioTitulo
              }
            >
              Nenhum horário disponível
            </Text>

            <Text
              style={
                styles.semHorarioTexto
              }
            >
              Todos os horários desse item já estão reservados para esta data.
            </Text>

          </View>

        )
      }


      {/* =============================================
          BOTÃO CRIAR
      ============================================= */}

      <TouchableOpacity

        style={[
          styles.botao,

          {
            backgroundColor:
              "#16a34a",

            opacity:
              criandoReserva ||
              !idHorario
                ? 0.5
                : 1,
          },

        ]}

        onPress={
          criar_reserva
        }

        disabled={
          criandoReserva ||
          !idHorario
        }

      >

        {
          criandoReserva ? (

            <ActivityIndicator
              color="#fff"
            />

          ) : (

            <Text
              style={
                styles.Texto_botao
              }
            >
              Criar reserva
            </Text>

          )
        }

      </TouchableOpacity>


      {/* =============================================
          CANCELAR
      ============================================= */}

      <TouchableOpacity

        style={
          styles.botaoCancelar
        }

        onPress={() =>
          navigation.goBack()
        }

        disabled={
          criandoReserva
        }

      >

        <Text
          style={
            styles.Texto_botao
          }
        >
          Cancelar
        </Text>

      </TouchableOpacity>

    </ScrollView>
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
        "#FAFAFA",
    },

    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },

    titulo_principal: {
      fontSize: 26,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 12,
      color: "#1E3A8A",
      marginBottom: 8,
      marginTop: 20,
    },

    titulo: {
      color: "#333",
      fontSize: 20,
      marginTop: 20,
      marginBottom: 10,
      fontWeight: "bold",
    },

    cardData: {
      backgroundColor:
        "#F5F7FB",
      borderRadius: 12,
      padding: 16,
      marginBottom: 5,
      borderWidth: 1,
      borderColor:
        "#DDE4F0",
    },

    cardTitulo: {
      fontSize: 15,
      color: "#666",
      marginBottom: 6,
    },

    cardDataTexto: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#1E3A8A",
    },

    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 50,
    },

    input: {
      flex: 1,
      fontSize: 16,
    },

    dropdownContainer: {
      backgroundColor: "#fff",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#ddd",
      marginTop: 5,
      marginBottom: 10,
      overflow: "hidden",
    },

    dropdownLista: {
      maxHeight: 200,
    },

    dropdownItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eeeeee",
    },

    dropdownItemAtivo: {
      backgroundColor:
        "#eaf1ff",
    },

    dropdownItemTexto: {
      color: "#333",
      fontSize: 16,
    },

    dropdownItemTextoAtivo: {
      color: "#2563eb",
      fontWeight: "bold",
    },

    loadingItens: {
      padding: 20,
      alignItems: "center",
      gap: 10,
    },

    carregandoHorarios: {
      backgroundColor:
        "#F5F7FB",
      borderWidth: 1,
      borderColor:
        "#DDE4F0",
      borderRadius: 10,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },

    carregandoTexto: {
      color: "#555",
      fontSize: 15,
    },

    mensagemContainer: {
      backgroundColor:
        "#F5F7FB",
      borderWidth: 1,
      borderColor:
        "#DDE4F0",
      borderRadius: 10,
      padding: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    mensagemTexto: {
      color: "#666",
      fontSize: 15,
      textAlign: "center",
    },

    horarioLinha: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    semHorarioContainer: {
      backgroundColor:
        "#FEF2F2",
      borderWidth: 1,
      borderColor:
        "#FECACA",
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
    },

    semHorarioTitulo: {
      color: "#B91C1C",
      fontSize: 17,
      fontWeight: "bold",
      marginTop: 8,
      textAlign: "center",
    },

    semHorarioTexto: {
      color: "#7F1D1D",
      fontSize: 14,
      textAlign: "center",
      marginTop: 6,
      lineHeight: 20,
    },

    botao: {
      backgroundColor:
        "#16a34a",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
      minHeight: 50,
    },

    botaoCancelar: {
      backgroundColor:
        "#AF1E1E",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      minHeight: 50,
    },

    Texto_botao: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },

  });