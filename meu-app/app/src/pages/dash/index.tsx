import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import Svg, {
  Circle,
  G,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";

const { width: screenWidth } = Dimensions.get("window");

const API_URL = "http://192.168.100.128:8000";

type Periodo = "diario" | "semanal" | "mensal" | "anual";

// =====================================================
// TIPOS
// =====================================================

type GraficoItem = {
  label: string;
  valor: number;
  data?: string;
  mes?: number;
  categoria?: string;
};

type Categoria = {
  categoria: string;
  total: number;
  percentual: number;
};

type Recurso = {
  id: number;
  nome: string;
  categoria: string;
  total: number;
};

type DashboardData = {
  status: string;
  periodo: string;
  data_inicio: string;
  data_fim: string;
  total_reservas: number;
  recurso_mais_utilizado: Recurso | null;
  categorias: Categoria[];
  recursos: Recurso[];
  grafico: GraficoItem[];
};

// =====================================================
// CORES
// =====================================================

const CORES: Record<string, string> = {
  "DATA-SHOW": "#2B47FC",
  EQUIPAMENTO: "#2B47FC",

  "CAIXA DE SOM": "#00C48C",
  ESPACO: "#00C48C",

  MICROFONE: "#FF3B30",

  NOTEBOOK: "#FF9500",

  ELETRONICO: "#AF52DE",

  LABORATORIO: "#5856D6",

  AUDITORIO: "#007AFF",
};

// =====================================================
// NORMALIZAR TEXTO
// =====================================================

const normalizarTexto = (texto: string) => {
  if (!texto) {
    return "";
  }

  return texto
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// =====================================================
// OBTER COR POR CATEGORIA
// =====================================================

export const obterCorPorCategoria = (
  nomeCategoria: string
): string => {
  if (!nomeCategoria) {
    return "#2B47FC";
  }

  const categoria = normalizarTexto(nomeCategoria);

  return CORES[categoria] ?? "#2B47FC";
};

// =====================================================
// ENCONTRAR COR DO ITEM DO GRÁFICO
// =====================================================
//
// O backend está enviando:
//
// {
//   label: "...",
//   valor: 10
// }
//
// Então não podemos depender de item.categoria.
//
// Esta função tenta descobrir a categoria através:
// 1. categoria do próprio item
// 2. label sendo uma categoria
// 3. label sendo nome de um recurso
// 4. recurso mais utilizado
//
// =====================================================

function obterCorDoGrafico(
  item: GraficoItem,
  recursos: Recurso[],
  categorias: Categoria[],
  recursoMaisUtilizado: Recurso | null
): string {
  // ---------------------------------------------------
  // 1. Se o backend futuramente mandar categoria
  // ---------------------------------------------------

  if (item.categoria) {
    return obterCorPorCategoria(item.categoria);
  }

  // ---------------------------------------------------
  // 2. Verifica se o LABEL é uma categoria
  // ---------------------------------------------------

  const labelNormalizado = normalizarTexto(item.label);

  const categoriaEncontrada = categorias.find(
    (categoria) =>
      normalizarTexto(categoria.categoria) ===
      labelNormalizado
  );

  if (categoriaEncontrada) {
    return obterCorPorCategoria(
      categoriaEncontrada.categoria
    );
  }

  // ---------------------------------------------------
  // 3. Verifica se o LABEL é o nome de um recurso
  // ---------------------------------------------------

  const recursoEncontrado = recursos.find(
    (recurso) =>
      normalizarTexto(recurso.nome) ===
      labelNormalizado
  );

  if (recursoEncontrado) {
    return obterCorPorCategoria(
      recursoEncontrado.categoria
    );
  }

  // ---------------------------------------------------
  // 4. Se não encontrou, usa o recurso mais utilizado
  // ---------------------------------------------------
  //
  // Isso resolve o caso em que o gráfico vem somente
  // com datas/períodos:
  //
  // label = "01/08"
  // valor = 8
  //
  // Nesse caso a barra recebe a cor do recurso
  // mais utilizado no período.
  //

  if (recursoMaisUtilizado) {
    return obterCorPorCategoria(
      recursoMaisUtilizado.categoria
    );
  }

  // ---------------------------------------------------
  // 5. Último fallback
  // ---------------------------------------------------

  return "#2B47FC";
}

// =====================================================
// LEGENDA
// =====================================================

function LegendaIdentificadores() {
  const itensLegenda = [
    {
      cor: "#2B47FC",
      significado: "Data-Show",
    },
    {
      cor: "#00C48C",
      significado: "Caixa de Som",
    },
    {
      cor: "#FF3B30",
      significado: "Microfone",
    },
    {
      cor: "#FF9500",
      significado: "Notebook",
    },
    {
      cor: "#AF52DE",
      significado: "Eletrônico",
    },
    {
      cor: "#5856D6",
      significado: "Laboratório",
    },
    {
      cor: "#007AFF",
      significado: "Auditório",
    },
  ];

  return (
    <View
      style={[
        styles.card,
        {
          paddingBottom: 8,
        },
      ]}
    >
      <Text style={styles.cardTitulo}>
        💡 Guia de Identificação por Cores
      </Text>

      <View style={styles.gradeLegenda}>
        {itensLegenda.map((item, index) => (
          <View
            key={index}
            style={styles.itemGuia}
          >
            <View
              style={[
                styles.miniBloquinhoCor,
                {
                  backgroundColor: item.cor,
                },
              ]}
            />

            <Text style={styles.textoGuia}>
              {item.significado}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// =====================================================
// GRÁFICO DE BARRAS
// =====================================================

function GraficoBarras({
  dados,
  recursos,
  categorias,
  recursoMaisUtilizado,
}: {
  dados: GraficoItem[];
  recursos: Recurso[];
  categorias: Categoria[];
  recursoMaisUtilizado: Recurso | null;
}) {
  const altura = 230;

  if (dados.length === 0) {
    return (
      <View
        style={[
          styles.center,
          {
            height: altura,
          },
        ]}
      >
        <Text style={styles.textoVazio}>
          Nenhum dado disponível
        </Text>
      </View>
    );
  }

  const largura = Math.max(
    screenWidth - 64,
    dados.length * 48
  );

  const valorMaximo = Math.max(
    ...dados.map((item) => item.valor),
    1
  );

  const espaco =
    largura / Math.max(dados.length, 1);

  const larguraBarra = Math.max(
    14,
    Math.min(30, espaco * 0.55)
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 8,
      }}
    >
      <View
        style={{
          width: largura,
          height: altura,
        }}
      >
        <Svg
          width={largura}
          height={altura}
        >
          {/* LINHAS */}

          {[0, 1, 2, 3, 4].map(
            (_, index) => {
              const y =
                20 +
                ((altura - 70) / 4) *
                  index;

              return (
                <Path
                  key={`grid-${index}`}
                  d={`M 0 ${y} L ${largura} ${y}`}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            }
          )}

          {/* BARRAS */}

          {dados.map((item, index) => {
            const alturaBarra =
              (item.valor / valorMaximo) *
              140;

            const x =
              index * espaco +
              (espaco - larguraBarra) /
                2;

            const y =
              altura -
              45 -
              alturaBarra;

            // =================================================
            // AQUI ESTÁ A CORREÇÃO PRINCIPAL
            // =================================================

            const corBarra =
              obterCorDoGrafico(
                item,
                recursos,
                categorias,
                recursoMaisUtilizado
              );

            return (
              <G
                key={`bar-${index}`}
              >
                <Rect
                  x={x}
                  y={y}
                  width={larguraBarra}
                  height={Math.max(
                    alturaBarra,
                    2
                  )}
                  rx={4}
                  fill={corBarra}
                />

                {/* VALOR */}

                {item.valor > 0 && (
                  <SvgText
                    x={
                      x +
                      larguraBarra / 2
                    }
                    y={y - 6}
                    fill="#111827"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {item.valor}
                  </SvgText>
                )}

                {/* LABEL */}

                <SvgText
                  x={
                    x +
                    larguraBarra / 2
                  }
                  y={altura - 20}
                  fill="#6B7280"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
    </ScrollView>
  );
}

// =====================================================
// POLAR
// =====================================================

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians =
    ((angleInDegrees - 90) *
      Math.PI) /
    180;

  return {
    x:
      centerX +
      radius *
        Math.cos(angleInRadians),

    y:
      centerY +
      radius *
        Math.sin(angleInRadians),
  };
}

// =====================================================
// SEGMENTO DONUT
// =====================================================

function DonutSegment({
  cx,
  cy,
  r,
  innerR,
  startAngle,
  endAngle,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  innerR: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}) {
  const gap =
    endAngle - startAngle === 360
      ? 0
      : 0.5;

  const sAngle =
    startAngle + gap;

  const eAngle =
    endAngle - gap;

  const start =
    polarToCartesian(
      cx,
      cy,
      r,
      eAngle
    );

  const end =
    polarToCartesian(
      cx,
      cy,
      r,
      sAngle
    );

  const startInner =
    polarToCartesian(
      cx,
      cy,
      innerR,
      eAngle
    );

  const endInner =
    polarToCartesian(
      cx,
      cy,
      innerR,
      sAngle
    );

  const largeArcFlag =
    eAngle - sAngle <= 180
      ? "0"
      : "1";

  const d = [
    `M ${start.x} ${start.y}`,

    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,

    `L ${endInner.x} ${endInner.y}`,

    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,

    "Z",
  ].join(" ");

  return (
    <Path
      d={d}
      fill={fill}
    />
  );
}

// =====================================================
// GRÁFICO DONUT
// =====================================================

function GraficoDonut({
  categorias,
  total,
}: {
  categorias: Categoria[];
  total: number;
}) {
  const tamanho = 200;

  const centro =
    tamanho / 2;

  const raioExterno = 90;

  const raioInterno = 60;

  const espessuraFatia =
    raioExterno -
    raioInterno;

  const raioCentralDoArco =
    raioInterno +
    espessuraFatia / 2;

  let anguloAcumulado = 0;

  if (
    total === 0 ||
    categorias.length === 0
  ) {
    return (
      <View
        style={[
          styles.center,
          {
            height: tamanho,
          },
        ]}
      >
        <Svg
          width={tamanho}
          height={tamanho}
        >
          <Circle
            cx={centro}
            cy={centro}
            r={raioCentralDoArco}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={
              espessuraFatia
            }
          />
        </Svg>

        <View
          style={
            styles.textoCentralDonut
          }
        >
          <Text
            style={
              styles.donutSubtexto
            }
          >
            Sem dados
          </Text>
        </View>
      </View>
    );
  }

  const fatiasValidas =
    categorias.filter(
      (c) => c.total > 0
    );

  return (
    <View
      style={
        styles.donutContainer
      }
    >
      <View
        style={{
          width: tamanho,
          height: tamanho,
        }}
      >
        <Svg
          width={tamanho}
          height={tamanho}
        >
          {fatiasValidas.length ===
          1 ? (
            <Circle
              cx={centro}
              cy={centro}
              r={raioCentralDoArco}
              fill="none"
              stroke={obterCorPorCategoria(
                fatiasValidas[0]
                  .categoria
              )}
              strokeWidth={
                espessuraFatia
              }
            />
          ) : (
            categorias.map(
              (
                categoria,
                index
              ) => {
                const angulo =
                  (categoria.total /
                    total) *
                  360;

                const inicio =
                  anguloAcumulado;

                const fim =
                  inicio + angulo;

                anguloAcumulado =
                  fim;

                if (
                  angulo <= 0
                ) {
                  return null;
                }

                return (
                  <DonutSegment
                    key={`donut-${index}`}
                    cx={centro}
                    cy={centro}
                    r={
                      raioExterno
                    }
                    innerR={
                      raioInterno
                    }
                    startAngle={
                      inicio
                    }
                    endAngle={fim}
                    fill={obterCorPorCategoria(
                      categoria.categoria
                    )}
                  />
                );
              }
            )
          )}
        </Svg>

        <View
          style={
            styles.textoCentralDonut
          }
        >
          <Text
            style={
              styles.donutValorCentral
            }
          >
            {total}
          </Text>

          <Text
            style={
              styles.donutSubtexto
            }
          >
            Total
          </Text>
        </View>
      </View>

      <View
        style={
          styles.legendasContainer
        }
      >
        {categorias.map(
          (
            item,
            index
          ) => (
            <View
              key={`legenda-${index}`}
              style={
                styles.legendaItem
              }
            >
              <View
                style={[
                  styles.legendaCor,
                  {
                    backgroundColor:
                      obterCorPorCategoria(
                        item.categoria
                      ),
                  },
                ]}
              />

              <Text
                style={
                  styles.legendaTexto
                }
                numberOfLines={1}
              >
                {item.categoria} (
                {item.percentual}%)
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export default function DashboardScreen() {
  const [
    periodo,
    setPeriodo,
  ] = useState<Periodo>(
    "mensal"
  );

  const [
    dados,
    setDados,
  ] =
    useState<DashboardData | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  // ===================================================
  // BUSCAR DADOS
  // ===================================================

  const buscarDados =
    useCallback(
      async (
        periodoSelecionado: Periodo,
        viaRefresh = false
      ) => {
        if (viaRefresh) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        try {
          let token =
            await AsyncStorage.getItem(
              "@user_token"
            );

          if (!token) {
            token =
              await AsyncStorage.getItem(
                "access_token"
              );
          }

          if (!token) {
            throw new Error(
              "Token não encontrado."
            );
          }

          const resposta =
            await fetch(
              `${API_URL}/api/dashboard?periodo=${periodoSelecionado}`,
              {
                method: "GET",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (!resposta.ok) {
            const erroTexto =
              await resposta.text();

            console.error(
              "Erro da API:",
              erroTexto
            );

            throw new Error(
              "Erro ao buscar dados do servidor"
            );
          }

          const json: DashboardData =
            await resposta.json();

          if (
            !Array.isArray(
              json.grafico
            )
          ) {
            json.grafico = [];
          }

          if (
            !Array.isArray(
              json.categorias
            )
          ) {
            json.categorias = [];
          }

          if (
            !Array.isArray(
              json.recursos
            )
          ) {
            json.recursos = [];
          }

          setDados(json);
        } catch (erro) {
          console.error(
            "Erro no Dashboard:",
            erro
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      []
    );

  // ===================================================
  // ALTERAR PERÍODO
  // ===================================================

  useEffect(() => {
    buscarDados(periodo);
  }, [
    periodo,
    buscarDados,
  ]);

  // ===================================================
  // LOADING
  // ===================================================

  if (carregando) {
    return (
      <View
        style={[
          styles.center,
          styles.containerTela,
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#2B47FC"
        />

        <Text
          style={{
            marginTop: 10,
            color: "#6B7280",
          }}
        >
          Carregando dashboard...
        </Text>
      </View>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <SafeAreaView
      style={
        styles.containerTela
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F9FAFB"
      />

      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.titulo
          }
        >
          Dashboard
        </Text>
      </View>

      <Text
        style={
          styles.subtitulo
        }
      >
        Veja relatórios do sistema
      </Text>

      {/* ABAS */}

      <View
        style={
          styles.abasContainer
        }
      >
        {(
          [
            "diario",
            "semanal",
            "mensal",
            "anual",
          ] as Periodo[]
        ).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.abaBotao,
              periodo === p &&
                styles.abaBotaoAtiva,
            ]}
            onPress={() =>
              setPeriodo(p)
            }
          >
            <Text
              style={[
                styles.abaTexto,
                periodo === p &&
                  styles.abaTextoAtiva,
              ]}
            >
              {p
                .charAt(0)
                .toUpperCase() +
                p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTEÚDO */}

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32,
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              atualizando
            }
            onRefresh={() =>
              buscarDados(
                periodo,
                true
              )
            }
          />
        }
      >
        {/* LEGENDA */}

        <LegendaIdentificadores />

        {/* TOTAL */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Total de Reservas
          </Text>

          <Text
            style={
              styles.cardValorGrande
            }
          >
            {dados?.total_reservas ??
              0}
          </Text>

          <Text
            style={
              styles.cardSubtexto
            }
          >
            Período:{" "}
            {dados?.periodo ??
              periodo}
          </Text>
        </View>

        {/* GRÁFICO DE BARRAS */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Reservas por período
          </Text>

          <GraficoBarras
            dados={
              dados?.grafico ??
              []
            }
            recursos={
              dados?.recursos ??
              []
            }
            categorias={
              dados?.categorias ??
              []
            }
            recursoMaisUtilizado={
              dados?.recurso_mais_utilizado ??
              null
            }
          />
        </View>

        {/* DONUT */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitulo
            }
          >
            Reservas por categoria
          </Text>

          <GraficoDonut
            categorias={
              dados?.categorias ??
              []
            }
            total={
              dados?.total_reservas ??
              0
            }
          />
        </View>

        {/* RECURSO MAIS UTILIZADO */}

        {dados?.recurso_mais_utilizado && (
          <View
            style={[
              styles.card,
              styles.cardDestaque,
              {
                backgroundColor:
                  obterCorPorCategoria(
                    dados
                      .recurso_mais_utilizado
                      .categoria
                  ),

                borderColor:
                  obterCorPorCategoria(
                    dados
                      .recurso_mais_utilizado
                      .categoria
                  ),
              },
            ]}
          >
            <Text
              style={
                styles.destaqueTitulo
              }
            >
              Recurso mais utilizado
            </Text>

            <Text
              style={
                styles.destaqueNome
              }
            >
              {
                dados
                  .recurso_mais_utilizado
                  .nome
              }
            </Text>

            <Text
              style={
                styles.destaqueSubtexto
              }
            >
              Categoria:{" "}
              {
                dados
                  .recurso_mais_utilizado
                  .categoria
              }
            </Text>

            <Text
              style={
                styles.destaqueSubtexto
              }
            >
              {
                dados
                  .recurso_mais_utilizado
                  .total
              }{" "}
              reservas no período
            </Text>
          </View>
        )}

        {/* RECURSOS */}

        {dados?.recursos &&
          dados.recursos.length >
            0 && (
            <View
              style={
                styles.card
              }
            >
              <Text
                style={
                  styles.cardTitulo
                }
              >
                Recursos
              </Text>

              {dados.recursos.map(
                (
                  recurso,
                  index
                ) => (
                  <View
                    key={
                      recurso.id ??
                      index
                    }
                    style={
                      styles.recursoItem
                    }
                  >
                    <View
                      style={
                        styles.recursoInfo
                      }
                    >
                      <Text
                        style={
                          styles.recursoNome
                        }
                      >
                        {
                          recurso.nome
                        }
                      </Text>

                      <Text
                        style={
                          styles.recursoCategoria
                        }
                      >
                        {
                          recurso.categoria
                        }
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.recursoTotal,
                        {
                          color:
                            obterCorPorCategoria(
                              recurso.categoria
                            ),
                        },
                      ]}
                    >
                      {
                        recurso.total
                      }
                    </Text>
                  </View>
                )
              )}
            </View>
          )}

        {/* PERÍODO */}

        {dados && (
          <View
            style={
              styles.periodoInfo
            }
          >
            <Text
              style={
                styles.periodoTexto
              }
            >
              Dados de{" "}
              {
                dados.data_inicio
              }{" "}
              até{" "}
              {
                dados.data_fim
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles =
  StyleSheet.create({
    containerTela: {
      flex: 1,
      backgroundColor:
        "#F9FAFB",
    },

    center: {
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    textoVazio: {
      color:
        "#9CA3AF",
      fontSize: 14,
    },

    abasContainer: {
      flexDirection:
        "row",
      backgroundColor:
        "#E5E7EB",
      padding: 4,
      borderRadius: 8,
      margin: 16,
    },

    abaBotao: {
      flex: 1,
      paddingVertical: 8,
      alignItems:
        "center",
      borderRadius: 6,
    },

    abaBotaoAtiva: {
      backgroundColor:
        "#FFFFFF",
      elevation: 2,
      shadowColor:
        "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity:
        0.15,
      shadowRadius:
        1.5,
    },

    abaTexto: {
      fontSize: 13,
      fontWeight:
        "500",
      color:
        "#6B7280",
    },

    abaTextoAtiva: {
      color:
        "#111827",
      fontWeight:
        "600",
    },

    card: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    cardDestaque: {
      backgroundColor:
        "#2B47FC",
      borderColor:
        "#2B47FC",
    },

    cardTitulo: {
      fontSize: 14,
      fontWeight:
        "600",
      color:
        "#374151",
      marginBottom: 12,
    },

    cardValorGrande: {
      fontSize: 32,
      fontWeight:
        "700",
      color:
        "#111827",
    },

    cardSubtexto: {
      fontSize: 12,
      color:
        "#6B7280",
      marginTop: 4,
    },

    destaqueTitulo: {
      fontSize: 14,
      fontWeight:
        "600",
      color:
        "#E0E7FF",
    },

    destaqueNome: {
      fontSize: 20,
      fontWeight:
        "700",
      color:
        "#FFFFFF",
      marginTop: 4,
    },

    destaqueSubtexto: {
      fontSize: 13,
      color:
        "#E0E7FF",
      marginTop: 4,
    },

    donutContainer: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 8,
    },

    textoCentralDonut: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    donutValorCentral: {
      fontSize: 24,
      fontWeight:
        "700",
      color:
        "#111827",
    },

    donutSubtexto: {
      fontSize: 12,
      color:
        "#6B7280",
    },

    legendasContainer: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "center",
      marginTop: 16,
      gap: 12,
    },

    legendaItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      maxWidth:
        "45%",
    },

    legendaCor: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },

    legendaTexto: {
      fontSize: 12,
      color:
        "#4B5563",
    },

    recursoItem: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "#E5E7EB",
    },

    recursoInfo: {
      flex: 1,
      paddingRight: 10,
    },

    recursoNome: {
      fontSize: 14,
      fontWeight:
        "600",
      color:
        "#111827",
    },

    recursoCategoria: {
      fontSize: 12,
      color:
        "#6B7280",
      marginTop: 3,
    },

    recursoTotal: {
      fontSize: 18,
      fontWeight:
        "700",
      color:
        "#2B47FC",
    },

    periodoInfo: {
      alignItems:
        "center",
      paddingHorizontal: 16,
      paddingBottom: 10,
    },

    periodoTexto: {
      fontSize: 11,
      color:
        "#9CA3AF",
    },

    gradeLegenda: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      justifyContent:
        "space-between",
      marginTop: 4,
    },

    itemGuia: {
      flexDirection:
        "row",
      alignItems:
        "center",
      width:
        "48%",
      marginBottom: 10,
    },

    miniBloquinhoCor: {
      width: 12,
      height: 12,
      borderRadius: 3,
      marginRight: 8,
    },

    textoGuia: {
      fontSize: 11,
      color:
        "#4B5563",
      fontWeight:
        "500",
      flex: 1,
    },

    header: {
      height: 50,
      justifyContent:
        "center",
      alignItems:
        "center",
      position:
        "relative",
    },

    titulo: {
      fontSize: 22,
      fontWeight:
        "bold",
      color:
        "#1E3A8A",
      textAlign:
        "center",
    },

    subtitulo: {
      color:
        "#888",
      textAlign:
        "center",
    },
  });