import React, {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";


// =====================================================
// TIPOS
// =====================================================

type RootStackParamList = {
  Home: undefined;

  Reserva: {
    dataReserva: string;
  };
};


type Reserva = {
  id: number;

  id_itens: number;

  item: string;

  data: string;

  hora_inicio: string;

  hora_fim: string;

  usuario: string;

  id_usuario: number;

  minha_reserva: boolean;
};


type Reservas = Record<
  string,
  Reserva[]
>;


type LegendItemProps = {
  label: string;

  color?: string;
};


// =====================================================
// LEGENDA
// =====================================================

const LegendItem = ({
  label,
  color,
}: LegendItemProps) => (

  <View
    style={
      styles.legendItem
    }
  >

    <View
      style={[
        styles.legendBox,

        {
          backgroundColor:
            color ||
            "#FFFFFF",
        },
      ]}
    />

    <Text
      style={
        styles.legendText
      }
    >
      {label}
    </Text>

  </View>
);


// =====================================================
// COMPONENTE
// =====================================================

export default function Calend() {

  // ===================================================
  // NAVEGAÇÃO
  // ===================================================

  const navigation =
    useNavigation();


  // ===================================================
  // ADMIN
  // ===================================================

  const [
    isAdmin,
    setIsAdmin
  ] = useState(false);


  // ===================================================
  // DATA
  // ===================================================

  const [
    currentDate,
    setCurrentDate
  ] = useState(
    new Date()
  );


  // ===================================================
  // ABA
  // ===================================================

  const [
    tab,
    setTab
  ] = useState<
    "todas" | "minhas"
  >(
    "todas"
  );


  // ===================================================
  // DIA SELECIONADO
  // ===================================================

  const [
    selectedDay,
    setSelectedDay
  ] = useState<
    number | null
  >(null);


  // ===================================================
  // RESERVAS
  // ===================================================

  const [
    reservas,
    setReservas
  ] = useState<
    Reservas
  >({});


  // ===================================================
  // RELATÓRIO
  // ===================================================

  const [
    relatorioAberto,
    setRelatorioAberto
  ] = useState(false);


  // ===================================================
  // TIMER
  // ===================================================

  const selectedDayTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);


  // ===================================================
  // ANO
  // ===================================================

  const year =
    currentDate.getFullYear();


  // ===================================================
  // MÊS
  // ===================================================

  const month =
    currentDate.getMonth();


  // ===================================================
  // MESES
  // ===================================================

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];


  const fullMonthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];


  // ===================================================
  // FORMATAR DATA
  // ===================================================

  const formatDate = (
    dateKey: string
  ) => {

    const [
      ano,
      mes,
      dia
    ] =
      dateKey.split("-");

    return (
      `${dia}/${mes}/${ano}`
    );
  };


  // ===================================================
  // CHAVE DA DATA
  // ===================================================

  const getDateKey = (
    day:
      | number
      | string
      | null
      | undefined
  ): string => {

    if (!day) {
      return "";
    }

    return (
      `${year}-` +
      `${String(
        month + 1
      ).padStart(2, "0")}-` +
      `${String(day).padStart(
        2,
        "0"
      )}`
    );
  };


  // ===================================================
  // TIMER
  // ===================================================

  const startSelectedDayTimer =
    () => {

      if (
        selectedDayTimer.current
      ) {

        clearTimeout(
          selectedDayTimer.current
        );
      }

      selectedDayTimer.current =
        setTimeout(() => {

          setSelectedDay(null);

        }, 5000);
    };


  // ===================================================
  // CARREGAR USUÁRIO
  // ===================================================

  const carregarUsuario =
    async () => {

      try {

        const usuario =
          await AsyncStorage.getItem(
            "usuario"
          );

        if (usuario) {

          const dados =
            JSON.parse(
              usuario
            );

          setIsAdmin(
            dados?.role ===
            "admin"
          );

          return;
        }


        const role =
          await AsyncStorage.getItem(
            "role"
          );

        setIsAdmin(
          role === "admin"
        );

      } catch (error) {

        console.error(
          "Erro ao carregar usuário:",
          error
        );

        setIsAdmin(false);
      }
    };


  // ===================================================
  // CARREGAR RESERVAS
  //
  // ESSA ROTA NÃO É ADMINISTRATIVA
  // ===================================================

  const carregarReservas =
    async () => {

      try {

        const token =
          await AsyncStorage.getItem(
            "access_token"
          );

        if (!token) {

          console.log(
            "Token não encontrado."
          );

          return;
        }


        const response =
          await fetch(
            "http://192.168.100.128:8000/api/reservas",
            {
              method: "GET",

              headers: {

                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${token}`,
              },
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          console.log(
            "ERRO AO BUSCAR RESERVAS:",
            data
          );

          return;
        }


        const reservasFormatadas:
          Reservas = {};


        if (
          Array.isArray(data)
        ) {

          data.forEach(
            (
              reserva: any
            ) => {

              if (
                !reserva ||
                !reserva.data_reserva
              ) {

                return;
              }


              const dataReserva =
                String(
                  reserva.data_reserva
                ).substring(
                  0,
                  10
                );


              const novaReserva:
                Reserva = {

                id:
                  Number(
                    reserva.id
                  ),

                id_itens:
                  Number(
                    reserva.id_itens
                  ),

                item:
                  reserva.item ||
                  "Item não informado",

                data:
                  dataReserva,

                hora_inicio:
                  reserva.hora_inicio ||
                  "--:--",

                hora_fim:
                  reserva.hora_fim ||
                  "--:--",

                usuario:
                  reserva.usuario ||
                  "Usuário",

                id_usuario:
                  Number(
                    reserva.id_usuario
                  ),

                minha_reserva:
                  Boolean(
                    reserva.minha_reserva
                  ),
              };


              if (
                !reservasFormatadas[
                  dataReserva
                ]
              ) {

                reservasFormatadas[
                  dataReserva
                ] = [];
              }


              reservasFormatadas[
                dataReserva
              ].push(
                novaReserva
              );

            }
          );
        }


        setReservas(
          reservasFormatadas
        );

      } catch (error) {

        console.error(
          "ERRO AO CARREGAR RESERVAS:",
          error
        );
      }
    };


  // ===================================================
  // ATUALIZAR AO ENTRAR
  // ===================================================

  useFocusEffect(
    useCallback(() => {

      carregarUsuario();

      carregarReservas();

    }, [])
  );


  // ===================================================
  // CALENDÁRIO
  // ===================================================

  const generateCalendar =
    () => {

      const firstDay =
        new Date(
          year,
          month,
          1
        ).getDay();


      const totalDays =
        new Date(
          year,
          month + 1,
          0
        ).getDate();


      const calendar:
        (
          | number
          | string
        )[][] = [];


      let week:
        (
          | number
          | string
        )[] =
        new Array(7)
          .fill("");


      let counter = 1;


      for (
        let i = firstDay;
        i < 7;
        i++
      ) {

        week[i] =
          counter++;
      }


      calendar.push(
        week
      );


      while (
        counter <=
        totalDays
      ) {

        const newWeek:
          (
            | number
            | string
          )[] =
          new Array(7)
            .fill("");


        for (
          let i = 0;
          i < 7 &&
          counter <=
            totalDays;
          i++
        ) {

          newWeek[i] =
            counter++;
        }


        calendar.push(
          newWeek
        );
      }


      return calendar;
    };


  const calendar =
    generateCalendar();


  // ===================================================
  // MUDAR MÊS
  // ===================================================

  const changeMonth =
    (
      direction: number
    ) => {

      setSelectedDay(
        null
      );

      setRelatorioAberto(
        false
      );


      setCurrentDate(
        new Date(
          year,
          month +
          direction,
          1
        )
      );
    };


  // ===================================================
  // DATA PASSADA
  // ===================================================

  const isPastDate = (
    day:
      | number
      | string
      | null
      | undefined
  ): boolean => {

    if (!day) {
      return true;
    }


    const today =
      new Date();


    const todayKey =
      `${today.getFullYear()}-` +
      `${String(
        today.getMonth() + 1
      ).padStart(
        2,
        "0"
      )}-` +
      `${String(
        today.getDate()
      ).padStart(
        2,
        "0"
      )}`;


    return (
      getDateKey(day) <
      todayKey
    );
  };


  // ===================================================
  // FINAL DE SEMANA
  // ===================================================

  const isWeekend = (
    columnIndex: number
  ) => {

    return (
      columnIndex === 0 ||
      columnIndex === 6
    );
  };


  // ===================================================
  // DIA DESABILITADO
  // ===================================================

  const isDisabled = (
    day:
      | number
      | string
      | null
      | undefined,

    columnIndex: number
  ) => {

    if (!day) {
      return true;
    }


    return (
      isWeekend(
        columnIndex
      ) ||
      isPastDate(day)
    );
  };


  // ===================================================
  // ESTILO DO DIA
  // ===================================================

  const getDayStyle = (
    day:
      | number
      | string
      | null
      | undefined,

    columnIndex: number
  ) => {

    if (!day) {
      return styles.emptyDay;
    }


    if (
      isWeekend(
        columnIndex
      )
    ) {

      return styles.weekend;
    }


    const key =
      getDateKey(day);


    const lista =
      reservas[key] || [];


    if (
      lista.length === 0
    ) {

      return {};
    }


    const possuiMinhaReserva =
      lista.some(
        (
          reserva
        ) =>
          reserva.minha_reserva
      );


    if (
      tab === "minhas" &&
      !possuiMinhaReserva
    ) {

      return {};
    }


    if (
      possuiMinhaReserva
    ) {

      return styles.myReserve;
    }


    return styles.reserved;
  };


  // ===================================================
  // CANCELAR RESERVA
  //
  // SOMENTE MINHA RESERVA
  // ===================================================

  const cancelarReserva =
    (
      reserva: Reserva
    ) => {

      if (
        !reserva.minha_reserva
      ) {

        Alert.alert(
          "Acesso negado",

          "Você só pode cancelar suas próprias reservas."
        );

        return;
      }


      Alert.alert(

        "Cancelar reserva",

        `Deseja cancelar esta reserva?\n\n` +

        `Data: ${formatDate(
          reserva.data
        )}\n` +

        `Horário: ${reserva.hora_inicio} - ${reserva.hora_fim}\n` +

        `Item: ${reserva.item}`,

        [

          {
            text: "Não",

            style: "cancel",
          },


          {
            text:
              "Sim, cancelar",

            style:
              "destructive",

            onPress:
              async () => {

                try {

                  const token =
                    await AsyncStorage.getItem(
                      "access_token"
                    );


                  if (!token) {

                    Alert.alert(
                      "Erro",

                      "Token não encontrado."
                    );

                    return;
                  }


                  const response =
                    await fetch(

                      `http://192.168.100.128:8000/api/cancelar_reserva/${reserva.id}`,

                      {
                        method:
                          "DELETE",

                        headers: {

                          "Content-Type":
                            "application/json",

                          "Authorization":
                            `Bearer ${token}`,
                        },
                      }
                    );


                  const data =
                    await response.json();


                  if (
                    !response.ok
                  ) {

                    Alert.alert(

                      "Erro",

                      data?.detail ||
                      "Não foi possível cancelar a reserva."
                    );

                    return;
                  }


                  Alert.alert(

                    "Reserva cancelada",

                    "Sua reserva foi cancelada com sucesso."
                  );


                  await carregarReservas();

                } catch (error) {

                  console.error(
                    "ERRO AO CANCELAR:",
                    error
                  );


                  Alert.alert(

                    "Erro",

                    "Não foi possível conectar com a API."
                  );
                }
              },
          },
        ]
      );
    };


  // ===================================================
  // SEGURAR NO DIA
  //
  // SOMENTE MOSTRA AS RESERVAS
  //
  // NÃO CANCELA AUTOMATICAMENTE
  // ===================================================

  const handleDayLongPress =
    (
      day:
        | number
        | string
        | null
        | undefined
    ) => {

      if (!day) {
        return;
      }


      const columnIndex =
        calendar
          .find(
            (
              week
            ) =>
              week.includes(day)
          )
          ?.indexOf(day);


      if (
        columnIndex === 0 ||
        columnIndex === 6
      ) {

        return;
      }


      if (
        isPastDate(day)
      ) {

        return;
      }


      const key =
        getDateKey(day);


      const lista =
        reservas[key] || [];


      setSelectedDay(
        Number(day)
      );


      startSelectedDayTimer();


      // =================================================
      // NENHUMA RESERVA
      // =================================================

      if (
        lista.length === 0
      ) {

        Alert.alert(

          "Nenhuma reserva",

          `Não existe nenhuma reserva no dia ${formatDate(
            key
          )}.`
        );

        return;
      }


      // =================================================
      // MONTAR INFORMAÇÕES
      // =================================================

      const textoReservas =
        lista
          .map(
            (
              reserva,
              index
            ) => {

              const minha =
                reserva.minha_reserva
                  ? " ⭐ MINHA RESERVA"
                  : "";


              return (

                `${index + 1}. ` +

                `${reserva.hora_inicio} - ${reserva.hora_fim}\n` +

                `Item: ${reserva.item}\n` +

                `Reservado por: ${reserva.usuario}` +

                minha
              );
            }
          )
          .join(
            "\n\n"
          );


      // =================================================
      // MINHAS RESERVAS
      // =================================================

      const minhas =
        lista.filter(
          (
            reserva
          ) =>
            reserva.minha_reserva
        );


      // =================================================
      // EXISTE MINHA RESERVA
      // =================================================

      if (
        minhas.length > 0
      ) {

        Alert.alert(

          `Reservas de ${formatDate(
            key
          )}`,

          textoReservas,

          [

            {
              text: "Fechar",

              style: "cancel",
            },


            {

              text:
                minhas.length === 1
                  ? "Cancelar minha reserva"
                  : "Cancelar uma reserva",

              onPress: () => {

                if (
                  minhas.length === 1
                ) {

                  cancelarReserva(
                    minhas[0]
                  );

                  return;
                }


                // =====================================
                // MAIS DE UMA MINHA
                // =====================================

                const opcoes =
                  minhas.map(
                    (
                      reserva
                    ) => ({

                      text:
                        `${reserva.hora_inicio} - ${reserva.hora_fim} | ${reserva.item}`,

                      onPress:
                        () =>
                          cancelarReserva(
                            reserva
                          ),
                    })
                  );


                Alert.alert(

                  "Minhas reservas",

                  "Escolha qual reserva deseja cancelar.",

                  [

                    ...opcoes,

                    {
                      text: "Voltar",

                      style: "cancel",
                    },
                  ]
                );
              },
            },
          ]
        );

        return;
      }


      // =================================================
      // NENHUMA É MINHA
      // =================================================

      Alert.alert(

        `Reservas de ${formatDate(
          key
        )}`,

        textoReservas,

        [
          {
            text: "Fechar",

            style: "cancel",
          },
        ]
      );
    };


  // ===================================================
  // CLIQUE NORMAL
  //
  // ABRE CRIAÇÃO DE RESERVA
  // ===================================================

  const handleDayPress =
    (
      day:
        | number
        | string
        | null
        | undefined
    ) => {

      if (!day) {
        return;
      }


      const columnIndex =
        calendar
          .find(
            (
              week
            ) =>
              week.includes(day)
          )
          ?.indexOf(day);


      if (
        columnIndex === 0 ||
        columnIndex === 6
      ) {

        return;
      }


      if (
        isPastDate(day)
      ) {

        return;
      }


      const key =
        getDateKey(day);


      setSelectedDay(
        Number(day)
      );


      startSelectedDayTimer();


      navigation.navigate(
        "Reserva" as never,

        {
          dataReserva:
            key,

        } as never
      );
    };


  // ===================================================
  // RESERVAS DO MÊS
  //
  // USADO SOMENTE PARA ADMIN
  // ===================================================

  const reservasDoMes =
    Object.entries(
      reservas
    )

      .filter(
        ([key]) => {

          const [
            ano,
            mes
          ] =
            key.split("-");


          return (

            Number(ano) ===
              year &&

            Number(mes) ===
              month + 1
          );
        }
      )

      .sort(
        (
          [dataA],
          [dataB]
        ) =>
          dataA.localeCompare(
            dataB
          )
      );


  const quantidadeReservasMes =
    reservasDoMes.reduce(

      (
        total,
        [, lista]
      ) =>

        total +
        lista.length,

      0
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <SafeAreaView
      style={
        styles.container
      }
    >

      <ScrollView

        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* =================================================
            TÍTULO
        ================================================= */}

        <Text
          style={
            styles.title
          }
        >
          SmartReserva
        </Text>


        {/* =================================================
            MÊS
        ================================================= */}

        <View
          style={
            styles.monthRow
          }
        >

          <TouchableOpacity
            onPress={() =>
              changeMonth(-1)
            }
          >

            <Text
              style={
                styles.arrow
              }
            >
              ‹
            </Text>

          </TouchableOpacity>


          <Text
            style={
              styles.month
            }
          >

            {
              monthNames[
                month
              ]
            }

            {" "}

            {year}

          </Text>


          <TouchableOpacity
            onPress={() =>
              changeMonth(1)
            }
          >

            <Text
              style={
                styles.arrow
              }
            >
              ›
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            ABAS
        ================================================= */}

        <View
          style={
            styles.tabs
          }
        >

          <TouchableOpacity
            onPress={() =>
              setTab("todas")
            }
          >

            <Text
              style={
                tab === "todas"
                  ? styles.tabActive
                  : styles.tab
              }
            >
              Todas
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            onPress={() =>
              setTab("minhas")
            }
          >

            <Text
              style={
                tab === "minhas"
                  ? styles.tabActive
                  : styles.tab
              }
            >
              Minhas
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            DIAS
        ================================================= */}

        <View
          style={
            styles.weekRow
          }
        >

          {[
            "Dom",
            "Seg",
            "Ter",
            "Qua",
            "Qui",
            "Sex",
            "Sáb",
          ].map(
            (
              item
            ) => (

              <Text
                key={item}
                style={
                  styles.weekDay
                }
              >
                {item}
              </Text>

            )
          )}

        </View>


        {/* =================================================
            CALENDÁRIO
        ================================================= */}

        {calendar.map(
          (
            week,
            weekIndex
          ) => (

            <View
              style={
                styles.weekRow
              }

              key={
                weekIndex
              }
            >

              {week.map(
                (
                  day,
                  index
                ) => {

                  const selected =
                    selectedDay ===
                    day;


                  const disabled =
                    isDisabled(
                      day,
                      index
                    );


                  const lista =
                    reservas[
                      getDateKey(
                        day
                      )
                    ] || [];


                  return (

                    <TouchableOpacity

                      key={
                        index
                      }

                      activeOpacity={
                        0.7
                      }

                      disabled={
                        disabled
                      }

                      onPress={() =>
                        handleDayPress(
                          day
                        )
                      }

                      onLongPress={() =>
                        handleDayLongPress(
                          day
                        )
                      }

                      delayLongPress={
                        600
                      }

                      style={[

                        styles.dayBox,

                        getDayStyle(
                          day,
                          index
                        ),

                        selected &&
                        !disabled &&
                        styles.selected,
                      ]}
                    >

                      <Text
                        style={[

                          styles.dayText,

                          disabled &&
                          styles.disabledText,

                          lista.some(
                            (
                              r
                            ) =>
                              r.minha_reserva
                          ) &&
                          styles.myReserveText,

                          lista.length >
                          0 &&

                          !lista.some(
                            (
                              r
                            ) =>
                              r.minha_reserva
                          ) &&

                          styles.reservedText,

                        ]}
                      >

                        {
                          day
                        }

                      </Text>


                      {/* QUANTIDADE */}

                      {lista.length >
                        1 && (

                        <View
                          style={
                            styles.countBadge
                          }
                        >

                          <Text
                            style={
                              styles.countBadgeText
                            }
                          >

                            {
                              lista.length
                            }

                          </Text>

                        </View>

                      )}

                    </TouchableOpacity>
                  );
                }
              )}

            </View>
          )
        )}


        {/* =================================================
            INFORMAÇÃO DO DIA
        ================================================= */}

        <View
          style={
            styles.infoContainer
          }
        >

          {selectedDay && (

            <Text
              style={
                styles.selectedInfo
              }
            >

              Dia selecionado:{" "}

              {String(
                selectedDay
              ).padStart(
                2,
                "0"
              )}

              /

              {String(
                month + 1
              ).padStart(
                2,
                "0"
              )}

              /

              {year}

            </Text>

          )}

        </View>


        {/* =================================================
            RESERVAS DO MÊS
            SOMENTE ADMIN
        ================================================= */}

        {isAdmin && (

          <View
            style={
              styles.adminContainer
            }
          >

            <TouchableOpacity

              activeOpacity={
                0.7
              }

              onPress={() =>
                setRelatorioAberto(
                  !relatorioAberto
                )
              }

              style={
                styles.adminHeader
              }
            >

              <View>

                <Text
                  style={
                    styles.adminTitle
                  }
                >

                  Reservas de{" "}

                  {
                    fullMonthNames[
                      month
                    ]
                  }

                </Text>


                <Text
                  style={
                    styles.adminSubtitle
                  }
                >

                  {
                    quantidadeReservasMes
                  }

                  {" "}

                  reserva(s)

                </Text>

              </View>


              <Text
                style={
                  styles.adminArrow
                }
              >

                {
                  relatorioAberto
                    ? "⌃"
                    : "⌄"
                }

              </Text>

            </TouchableOpacity>


            {/* =================================================
                RELATÓRIO ABERTO
            ================================================= */}

            {relatorioAberto && (

              <View>

                {reservasDoMes.length ===
                0 ? (

                  <View
                    style={
                      styles.emptyReservations
                    }
                  >

                    <Text
                      style={
                        styles.emptyReservationsText
                      }
                    >
                      Nenhuma reserva neste mês.
                    </Text>

                  </View>

                ) : (

                  reservasDoMes.map(
                    (
                      [
                        key,
                        lista
                      ]
                    ) => (

                      <View
                        key={
                          key
                        }

                        style={
                          styles.dateReport
                        }
                      >

                        {/* DATA */}

                        <View
                          style={
                            styles.dateReportHeader
                          }
                        >

                          <Text
                            style={
                              styles.dateReportTitle
                            }
                          >
                            {formatDate(
                              key
                            )}
                          </Text>


                          <Text
                            style={
                              styles.dateReportCount
                            }
                          >

                            {
                              lista.length
                            }

                            {" "}

                            reserva(s)

                          </Text>

                        </View>


                        {/* RESERVAS */}

                        {lista.map(
                          (
                            reserva
                          ) => (

                            <View

                              key={
                                reserva.id
                              }

                              style={
                                styles.reservationCard
                              }
                            >

                              <View
                                style={
                                  styles.reservationCardLeft
                                }
                              >

                                <View
                                  style={
                                    reserva.minha_reserva
                                      ? styles.reservationIndicatorMine
                                      : styles.reservationIndicator
                                  }
                                />


                                <View
                                  style={
                                    styles.reservationCardContent
                                  }
                                >

                                  <Text
                                    style={
                                      styles.reservationCardTime
                                    }
                                  >

                                    {
                                      reserva.hora_inicio
                                    }

                                    {" - "}

                                    {
                                      reserva.hora_fim
                                    }

                                  </Text>


                                  <Text
                                    style={
                                      styles.reservationCardItem
                                    }
                                  >

                                    Item:{" "}

                                    {
                                      reserva.item
                                    }

                                  </Text>


                                  <Text
                                    style={
                                      styles.reservationCardUser
                                    }
                                  >

                                    Reservado por:{" "}

                                    {
                                      reserva.usuario
                                    }

                                  </Text>


                                  {reserva.minha_reserva && (

                                    <Text
                                      style={
                                        styles.myReservationLabel
                                      }
                                    >
                                      Minha reserva
                                    </Text>

                                  )}

                                </View>

                              </View>


                              {/* CANCELAR SOMENTE MINHA */}

                              {reserva.minha_reserva && (

                                <TouchableOpacity

                                  style={
                                    styles.cancelButton
                                  }

                                  onPress={() =>
                                    cancelarReserva(
                                      reserva
                                    )
                                  }
                                >

                                  <Text
                                    style={
                                      styles.cancelButtonText
                                    }
                                  >
                                    Cancelar
                                  </Text>

                                </TouchableOpacity>

                              )}

                            </View>

                          )
                        )}

                      </View>

                    )
                  )

                )}

              </View>

            )}

          </View>

        )}


        {/* =================================================
            LEGENDA
        ================================================= */}

        <View
          style={
            styles.legend
          }
        >

          <LegendItem
            label="Dia disponível"
            color="#FFFFFF"
          />


          <LegendItem
            label="Reservado"
            color="#F5A623"
          />


          <LegendItem
            label="Minhas reservas"
            color="#2F66FF"
          />


          <LegendItem
            label="Final de semana"
            color="#E8EEF8"
          />

        </View>

      </ScrollView>

    </SafeAreaView>
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


    scrollContent: {
      paddingHorizontal: 16,

      paddingBottom: 30,
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


    monthRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      paddingHorizontal:
        32,

      marginBottom: 16,
    },


    arrow: {
      fontSize: 32,

      color:
        "#2F66FF",

      fontWeight:
        "300",
    },


    month: {
      fontSize: 18,

      fontWeight:
        "600",

      color:
        "#333",
    },


    tabs: {
      flexDirection:
        "row",

      justifyContent:
        "center",

      marginBottom: 16,
    },


    tab: {
      paddingVertical: 6,

      paddingHorizontal: 16,

      fontSize: 14,

      color:
        "#666",

      fontWeight:
        "500",
    },


    tabActive: {
      paddingVertical: 6,

      paddingHorizontal: 16,

      fontSize: 14,

      color:
        "#2F66FF",

      fontWeight:
        "bold",

      borderBottomWidth: 2,

      borderBottomColor:
        "#2F66FF",
    },


    weekRow: {
      flexDirection:
        "row",

      justifyContent:
        "space-around",

      marginBottom: 8,
    },


    weekDay: {
      width: 40,

      textAlign:
        "center",

      fontWeight:
        "500",

      color:
        "#999",

      fontSize: 12,
    },


    dayBox: {
      width: 40,

      height: 40,

      justifyContent:
        "center",

      alignItems:
        "center",

      borderRadius: 8,

      borderWidth: 1,

      borderColor:
        "#EAEAEA",

      backgroundColor:
        "#FFF",

      position:
        "relative",
    },


    emptyDay: {
      backgroundColor:
        "transparent",

      borderColor:
        "transparent",
    },


    dayText: {
      fontSize: 14,

      fontWeight:
        "500",

      color:
        "#333",
    },


    disabledText: {
      color:
        "#BCC8D8",
    },


    reservedText: {
      color:
        "#FFFFFF",

      fontWeight:
        "bold",
    },


    myReserveText: {
      color:
        "#FFFFFF",

      fontWeight:
        "bold",
    },


    weekend: {
      backgroundColor:
        "#E8EEF8",

      borderColor:
        "#D0DCEB",
    },


    reserved: {
      backgroundColor:
        "#F5A623",

      borderColor:
        "#D98E14",
    },


    myReserve: {
      backgroundColor:
        "#2F66FF",

      borderColor:
        "#1A4FD4",
    },


    selected: {
      borderWidth: 2,

      borderColor:
        "#000",
    },


    countBadge: {
      position:
        "absolute",

      right: -5,

      top: -5,

      minWidth: 17,

      height: 17,

      borderRadius: 9,

      backgroundColor:
        "#DC2626",

      justifyContent:
        "center",

      alignItems:
        "center",

      paddingHorizontal: 3,
    },


    countBadgeText: {
      color:
        "#FFFFFF",

      fontSize: 9,

      fontWeight:
        "bold",
    },


    infoContainer: {
      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 10,

      marginBottom: 10,
    },


    selectedInfo: {
      fontSize: 14,

      color:
        "#2F66FF",

      fontWeight:
        "500",

      marginVertical: 2,
    },


    // =================================================
    // ADMIN
    // =================================================

    adminContainer: {
      marginTop: 12,

      marginBottom: 10,
    },


    adminHeader: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 10,

      padding: 14,

      borderWidth: 1,

      borderColor:
        "#E5E7EB",

      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",
    },


    adminTitle: {
      fontSize: 18,

      fontWeight:
        "bold",

      color:
        "#1E3A8A",
    },


    adminSubtitle: {
      fontSize: 12,

      color:
        "#777",

      marginTop: 3,
    },


    adminArrow: {
      fontSize: 24,

      color:
        "#2F66FF",
    },


    emptyReservations: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 10,

      padding: 16,

      marginTop: 8,

      borderWidth: 1,

      borderColor:
        "#E5E7EB",
    },


    emptyReservationsText: {
      color:
        "#777",

      textAlign:
        "center",

      fontSize: 13,
    },


    dateReport: {
      marginTop: 10,
    },


    dateReportHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      paddingHorizontal: 4,

      marginBottom: 6,
    },


    dateReportTitle: {
      fontSize: 15,

      fontWeight:
        "bold",

      color:
        "#1E3A8A",
    },


    dateReportCount: {
      fontSize: 12,

      color:
        "#777",
    },


    reservationCard: {
      backgroundColor:
        "#FFFFFF",

      borderRadius: 10,

      padding: 12,

      marginBottom: 8,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      borderWidth: 1,

      borderColor:
        "#E5E7EB",
    },


    reservationCardLeft: {
      flexDirection:
        "row",

      alignItems:
        "center",

      flex: 1,
    },


    reservationIndicator: {
      width: 7,

      height: 58,

      borderRadius: 4,

      backgroundColor:
        "#F5A623",

      marginRight: 10,
    },


    reservationIndicatorMine: {
      width: 7,

      height: 58,

      borderRadius: 4,

      backgroundColor:
        "#2F66FF",

      marginRight: 10,
    },


    reservationCardContent: {
      flex: 1,
    },


    reservationCardTime: {
      fontSize: 14,

      fontWeight:
        "bold",

      color:
        "#333",
    },


    reservationCardItem: {
      fontSize: 12,

      color:
        "#555",

      marginTop: 3,
    },


    reservationCardUser: {
      fontSize: 12,

      color:
        "#777",

      marginTop: 3,
    },


    myReservationLabel: {
      fontSize: 11,

      color:
        "#2F66FF",

      fontWeight:
        "bold",

      marginTop: 4,
    },


    cancelButton: {
      backgroundColor:
        "#FEE2E2",

      paddingVertical: 7,

      paddingHorizontal: 9,

      borderRadius: 7,

      marginLeft: 8,
    },


    cancelButtonText: {
      color:
        "#DC2626",

      fontSize: 11,

      fontWeight:
        "bold",
    },


    // =================================================
    // LEGENDA
    // =================================================

    legend: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "space-between",

      paddingHorizontal: 10,

      marginTop: 10,
    },


    legendItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      width: "45%",

      marginBottom: 8,
    },


    legendBox: {
      width: 16,

      height: 16,

      borderRadius: 4,

      marginRight: 8,

      borderWidth: 1,

      borderColor:
        "#DDD",
    },


    legendText: {
      fontSize: 12,

      color:
        "#555",
    },

  });