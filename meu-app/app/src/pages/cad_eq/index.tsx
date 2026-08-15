
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  BackHandler,
} from "react-native";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { apiFetch } from "../../services/api";

// ======================================================
// CONFIGURAÇÃO DA API
// ======================================================

const URL_BASE = "http://192.168.100.128:8000/api";

const URL_API = `${URL_BASE}/cadastrar_eq`;

const URL_LOCAIS = `${URL_BASE}/buscar_locais`;

const URL_CRIAR_LOCAL = `${URL_BASE}/criar_local`;

// ======================================================
// CLASSIFICAÇÕES
// ======================================================

const OPCOES_CLASSIFICACAO = [
  { id: 1, nome: "Data-Show" },
  { id: 2, nome: "Caixa de Som" },
  { id: 3, nome: "Microfone" },
  { id: 4, nome: "Notebook" },
  { id: 5, nome: "Eletrônico" },
  { id: 6, nome: "Laboratório" },
  { id: 7, nome: "Auditório" },
];

// ======================================================
// TIPO
// ======================================================

type TipoItem = "equipamento" | "espaco";

// ======================================================
// INTERFACE PARA LOCALIZAÇÃO
// ======================================================

interface Localizacao {
  id: number;
  nome: string;
}

// ======================================================
// COMPONENTE
// ======================================================

export default function Cadas({
  aoFechar,
}: {
  aoFechar: () => void;
}) {
  // ====================================================
  // ESTADOS
  // ====================================================

  const [tipo, setTipo] =
    useState<TipoItem>("equipamento");

  const [nome, setNome] = useState("");

  const [quantidade, setQuantidade] = useState(1);

  const [categoria, setCategoria] =
    useState("EQUIPAMENTO");

  const [descricao, setDescricao] = useState("");

  const [especificacao, setEspecificacao] =
    useState("");

  const [salvando, setSalvando] =
    useState(false);

  // ====================================================
  // CLASSIFICAÇÃO
  // ====================================================

  const [idClassificacao, setIdClassificacao] =
    useState<number | null>(null);

  const [nomeClassificacao, setNomeClassificacao] =
    useState("Selecione uma opção");

  const [
    dropdownClassificacaoAberto,
    setDropdownClassificacaoAberto,
  ] = useState(false);

  // ====================================================
  // LOCALIZAÇÃO
  // ====================================================

  const [idLocalizacao, setIdLocalizacao] =
    useState<number | null>(null);

  const [nomeLocalizacao, setNomeLocalizacao] =
    useState("Selecione uma localização");

  const [
    dropdownLocalizacaoAberto,
    setDropdownLocalizacaoAberto,
  ] = useState(false);

  const [localizacoes, setLocalizacoes] =
    useState<Localizacao[]>([]);

  const [carregandoLocais, setCarregandoLocais] =
    useState(false);

  const [novaLocalizacao, setNovaLocalizacao] =
    useState("");

  // ====================================================
  // BUSCAR LOCALIZAÇÕES
  // ====================================================

  async function buscarLocais() {
    try {
      setCarregandoLocais(true);

      // ==================================================
      // apiFetch ADICIONA O JWT AUTOMATICAMENTE
      // E PODE RENOVAR O TOKEN SE NECESSÁRIO
      // ==================================================

      const resposta = await apiFetch(
        URL_LOCAIS,
        {
          method: "GET",
        }
      );

      const dados = await resposta.json();

      console.log(
        "Status localizações:",
        resposta.status
      );

      console.log(
        "Localizações:",
        dados
      );

      // ================================================
      // ERRO DE AUTENTICAÇÃO
      // ================================================

      if (resposta.status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        aoFechar();

        return;
      }

      // ================================================
      // OUTRO ERRO
      // ================================================

      if (!resposta.ok) {
        throw new Error(
          dados.detail ||
            "Não foi possível buscar as localizações."
        );
      }

      // ================================================
      // GARANTIR QUE É UMA LISTA
      // ================================================

      if (Array.isArray(dados)) {
        setLocalizacoes(dados);
      } else {
        setLocalizacoes([]);
      }
    } catch (error: any) {
      console.log(
        "Erro ao buscar locais:",
        error
      );

      Alert.alert(
        "Erro",
        error?.message ||
          "Não foi possível buscar as localizações."
      );
    } finally {
      setCarregandoLocais(false);
    }
  }

  async function criarLocalizacao() {
    if (!novaLocalizacao.trim()) {
      Alert.alert("Erro", "Digite o nome da localização.");
      return;
    }

    try {
      const resposta = await apiFetch(URL_CRIAR_LOCAL, {
        method: "POST",
        body: JSON.stringify({ nome: novaLocalizacao.trim() }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.detail || "Não foi possível cadastrar a localização."
        );
      }

      setNovaLocalizacao("");
      await buscarLocais();
      setIdLocalizacao(dados.localizacao.id);
      setNomeLocalizacao(
        `${dados.localizacao.id} - ${dados.localizacao.nome}`
      );
      Alert.alert("Sucesso", "Localização cadastrada!");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível cadastrar a localização."
      );
    }
  }

  // ====================================================
  // SALVAR EQUIPAMENTO
  // ====================================================

  async function salvar() {
    // ================================================
    // VALIDAÇÕES
    // ================================================

    if (!nome.trim()) {
      Alert.alert(
        "Erro",
        "Digite o nome do item."
      );

      return;
    }

    if (idClassificacao === null) {
      Alert.alert(
        "Erro",
        "Selecione uma classificação."
      );

      return;
    }

    if (idLocalizacao === null) {
      Alert.alert(
        "Erro",
        "Selecione uma localização."
      );

      return;
    }

    if (!especificacao.trim()) {
      Alert.alert(
        "Erro",
        "Preencha as especificações técnicas."
      );

      return;
    }

    if (quantidade < 1) {
      Alert.alert(
        "Erro",
        "A quantidade deve ser maior que zero."
      );

      return;
    }

    // ================================================
    // DADOS
    // ================================================

    const dadosParaEnviar = {
      Nome: nome.trim(),

      id_classificacao: idClassificacao,

      descricao: descricao.trim()
        ? descricao.trim()
        : null,

      quantidade: 1,

      id_localizacao: idLocalizacao,

      especificacao: especificacao.trim()
        ? especificacao.trim()
        : null,

      categoria: categoria.trim()
        ? categoria
        : tipo.toUpperCase(),
    };

    console.log(
      "Enviando equipamento:",
      dadosParaEnviar
    );

    try {
      setSalvando(true);

      // ==============================================
      // REQUEST
      // apiFetch ADICIONA O JWT AUTOMATICAMENTE
      // ==============================================

      const resposta = await apiFetch(
        URL_API,
        {
          method: "POST",

          body: JSON.stringify(
            dadosParaEnviar
          ),
        }
      );

      // ==============================================
      // TENTAR LER RESPOSTA
      // ==============================================

      const resultado =
        await resposta.json();

      console.log(
        "Resposta cadastrar equipamento:",
        resultado
      );

      // ==============================================
      // ERRO DE AUTENTICAÇÃO
      // ==============================================

      if (resposta.status === 401) {
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Faça login novamente."
        );

        aoFechar();

        return;
      }

      // ==============================================
      // SUCESSO
      // ==============================================

      if (resposta.ok) {
        Alert.alert(
          "Sucesso",
          "Item cadastrado com sucesso!"
        );

        // ============================================
        // LIMPAR FORMULÁRIO
        // ============================================

        setNome("");

        setQuantidade(1);

        setCategoria(
          tipo === "espaco"
            ? "ESPAÇO"
            : "EQUIPAMENTO"
        );

        setDescricao("");

        setEspecificacao("");

        setIdClassificacao(null);

        setNomeClassificacao(
          "Selecione uma opção"
        );

        setIdLocalizacao(null);

        setNomeLocalizacao(
          "Selecione uma localização"
        );

        // ============================================
        // FECHAR TELA
        // ============================================

        aoFechar();

        return;
      }

      // ==============================================
      // ERRO DA API
      // ==============================================

      Alert.alert(
        "Erro na API",
        resultado.detail ||
          resultado.message ||
          "Erro ao cadastrar o item."
      );
    } catch (error: any) {
      console.log(
        "Erro ao cadastrar equipamento:",
        error
      );

      Alert.alert(
        "Erro",
        error?.message ||
          "Não foi possível alcançar o servidor da API."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ====================================================
  // BACK BUTTON ANDROID
  // ====================================================

  useEffect(() => {
    buscarLocais();

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          aoFechar();

          return true;
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ============================================== */}
      {/* CABEÇALHO */}
      {/* ============================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={aoFechar}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#2563eb"
          />
        </TouchableOpacity>

        <Text style={styles.titulo}>
          Cadastro do Item
        </Text>
      </View>

      <Text style={styles.subtitulo}>
        Cadastre um equipamento ou espaço
      </Text>

      {/* ============================================== */}
      {/* TIPO */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Tipo do cadastro
      </Text>

      <View style={styles.row}>
        {/* EQUIPAMENTO */}

        <TouchableOpacity
          style={[
            styles.card,
            tipo === "equipamento" &&
              styles.cardAtivo,
          ]}
          onPress={() => {
            setTipo("equipamento");
            setCategoria("EQUIPAMENTO");
          }}
        >
          <Ionicons
            name={
              tipo === "equipamento"
                ? "radio-button-on"
                : "radio-button-off"
            }
            size={18}
            color={
              tipo === "equipamento"
                ? "#2563eb"
                : "#999"
            }
          />

          <MaterialCommunityIcons
            name="tools"
            size={22}
            color={
              tipo === "equipamento"
                ? "#2563eb"
                : "#666"
            }
          />

          <Text
            style={[
              styles.cardText,
              tipo === "equipamento" &&
                styles.cardTextAtivo,
            ]}
          >
            Equipamento
          </Text>
        </TouchableOpacity>

        {/* ESPAÇO */}

        <TouchableOpacity
          style={[
            styles.card,
            tipo === "espaco" &&
              styles.cardAtivo,
          ]}
          onPress={() => {
            setTipo("espaco");
            setCategoria("ESPAÇO");
          }}
        >
          <Ionicons
            name={
              tipo === "espaco"
                ? "radio-button-on"
                : "radio-button-off"
            }
            size={18}
            color={
              tipo === "espaco"
                ? "#2563eb"
                : "#999"
            }
          />

          <MaterialCommunityIcons
            name="office-building"
            size={22}
            color={
              tipo === "espaco"
                ? "#2563eb"
                : "#666"
            }
          />

          <Text
            style={[
              styles.cardText,
              tipo === "espaco" &&
                styles.cardTextAtivo,
            ]}
          >
            Espaço
          </Text>
        </TouchableOpacity>
      </View>

      {/* ============================================== */}
      {/* NOME */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Nome do Item / Espaço *
      </Text>

      <View style={styles.inputBox}>
        <Ionicons
          name="document-text-outline"
          size={18}
          color="#888"
        />

        <TextInput
          placeholder="Ex: Projetor Epson ou Sala 402"
          style={styles.input}
          value={nome}
          onChangeText={setNome}
        />
      </View>

      {/* ============================================== */}
      {/* CLASSIFICAÇÃO */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Classificação *
      </Text>

      <TouchableOpacity
        style={styles.inputBox}
        onPress={() => {
          setDropdownClassificacaoAberto(
            !dropdownClassificacaoAberto
          );

          setDropdownLocalizacaoAberto(false);
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name="pricetag-outline"
          size={18}
          color="#888"
        />

        <Text
          style={[
            styles.input,
            {
              color:
                idClassificacao !== null
                  ? "#000"
                  : "#888",

              paddingVertical: 12,
            },
          ]}
        >
          {nomeClassificacao}
        </Text>

        <Ionicons
          name={
            dropdownClassificacaoAberto
              ? "chevron-up"
              : "chevron-down"
          }
          size={18}
          color="#888"
        />
      </TouchableOpacity>

      {/* LISTA CLASSIFICAÇÃO */}

      {dropdownClassificacaoAberto && (
        <View
          style={styles.dropdownContainer}
        >
          {OPCOES_CLASSIFICACAO.map(
            (opcao) => (
              <TouchableOpacity
                key={opcao.id}
                style={[
                  styles.dropdownItem,

                  idClassificacao ===
                    opcao.id &&
                    styles.dropdownItemAtivo,
                ]}
                onPress={() => {
                  setIdClassificacao(
                    opcao.id
                  );

                  setNomeClassificacao(
                    `${opcao.id} - ${opcao.nome}`
                  );

                  setDropdownClassificacaoAberto(
                    false
                  );
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemTexto,

                    idClassificacao ===
                      opcao.id &&
                      styles.dropdownItemTextoAtivo,
                  ]}
                >
                  {opcao.id} - {opcao.nome}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* ============================================== */}
      {/* LOCALIZAÇÃO */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Localização *
      </Text>

      <TouchableOpacity
        style={styles.inputBox}
        onPress={() => {
          setDropdownLocalizacaoAberto(
            !dropdownLocalizacaoAberto
          );

          setDropdownClassificacaoAberto(
            false
          );
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name="location-outline"
          size={18}
          color="#888"
        />

        <Text
          style={[
            styles.input,
            {
              color:
                idLocalizacao !== null
                  ? "#000"
                  : "#888",

              paddingVertical: 12,
            },
          ]}
        >
          {nomeLocalizacao}
        </Text>

        <Ionicons
          name={
            dropdownLocalizacaoAberto
              ? "chevron-up"
              : "chevron-down"
          }
          size={18}
          color="#888"
        />
      </TouchableOpacity>

      {/* LISTA LOCALIZAÇÕES */}

      {dropdownLocalizacaoAberto && (
        <View
          style={styles.dropdownContainer}
        >
          {carregandoLocais ? (
            <Text
              style={{
                padding: 15,
                color: "#666",
              }}
            >
              Carregando localizações...
            </Text>
          ) : localizacoes.length === 0 ? (
            <Text
              style={{
                padding: 15,
                color: "#666",
              }}
            >
              Nenhuma localização encontrada.
            </Text>
          ) : (
            localizacoes.map(
              (local) => (
                <TouchableOpacity
                  key={local.id}
                  style={[
                    styles.dropdownItem,

                    idLocalizacao ===
                      local.id &&
                      styles.dropdownItemAtivo,
                  ]}
                  onPress={() => {
                    setIdLocalizacao(
                      local.id
                    );

                    setNomeLocalizacao(
                      `${local.id} - ${local.nome}`
                    );

                    setDropdownLocalizacaoAberto(
                      false
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemTexto,

                      idLocalizacao ===
                        local.id &&
                        styles.dropdownItemTextoAtivo,
                    ]}
                  >
                    {local.id} - {local.nome}
                  </Text>
                </TouchableOpacity>
              )
            )
          )}

          <View style={styles.inputBox}>
            <TextInput
              placeholder="Nova localização"
              style={styles.input}
              value={novaLocalizacao}
              onChangeText={setNovaLocalizacao}
            />

            <TouchableOpacity onPress={criarLocalizacao}>
              <Ionicons
                name="add-circle-outline"
                size={24}
                color="#2563eb"
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================== */}
      {/* CATEGORIA */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Categoria
      </Text>

      <View style={styles.inputBox}>
        <Ionicons
          name="grid-outline"
          size={18}
          color="#888"
        />

        <Text style={styles.input}>
          {categoria}
        </Text>
      </View>

      {/* ============================================== */}
      {/* QUANTIDADE */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Quantidade: 1
      </Text>

      {/* ============================================== */}
      {/* DESCRIÇÃO */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Descrição (Opcional)
      </Text>

      <View
        style={[
          styles.inputBox,
          styles.textAreaBox,
        ]}
      >
        <TextInput
          placeholder="Breve resumo sobre o estado do item..."
          style={[
            styles.input,
            styles.textArea,
          ]}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* ============================================== */}
      {/* ESPECIFICAÇÕES */}
      {/* ============================================== */}

      <Text style={styles.label}>
        Especificações Técnicas *
      </Text>

      <View
        style={[
          styles.inputBox,
          styles.textAreaBox,
        ]}
      >
        <TextInput
          placeholder="Ex: Voltagem 220v, Conexões HDMI/VGA..."
          style={[
            styles.input,
            styles.textArea,
          ]}
          value={especificacao}
          onChangeText={setEspecificacao}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* ============================================== */}
      {/* SALVAR */}
      {/* ============================================== */}

      <TouchableOpacity
        style={[
          styles.botao,
          salvando && {
            opacity: 0.6,
          },
        ]}
        onPress={salvar}
        disabled={salvando}
      >
        <Ionicons
          name="save-outline"
          size={18}
          color="#fff"
        />

        <Text style={styles.botaoTexto}>
          {salvando
            ? "Salvando..."
            : "Salvar"}
        </Text>
      </TouchableOpacity>

      {/* ============================================== */}
      {/* CANCELAR */}
      {/* ============================================== */}

      <TouchableOpacity
        style={[
          styles.botao,
          {
            backgroundColor: "#dc2626",
            marginTop: 12,
          },
        ]}
        onPress={aoFechar}
        disabled={salvando}
      >
        <Text style={styles.botaoTexto}>
          Cancelar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 20,
  },

  header: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    position: "relative",
  },

  botaoVoltar: {
    position: "absolute",
    left: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E3A8A",
    textAlign: "center",
  },

  subtitulo: {
    color: "#888",
    marginBottom: 20,
    textAlign: "center",
  },

  label: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: "bold",
    color: "#333",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  card: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 5,
  },

  cardAtivo: {
    borderColor: "#2563eb",
    backgroundColor: "#eaf1ff",
  },

  cardText: {
    color: "#666",
    fontSize: 13,
  },

  cardTextAtivo: {
    color: "#2563eb",
    fontWeight: "bold",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    minHeight: 50,
    marginTop: 2,
  },

  input: {
    flex: 1,
    marginHorizontal: 8,
    color: "#000",
  },

  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 5,
    padding: 5,

    elevation: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },

  dropdownItem: {
    padding: 12,
    borderRadius: 8,
  },

  dropdownItemAtivo: {
    backgroundColor: "#eaf1ff",
  },

  dropdownItemTexto: {
    color: "#333",
    fontSize: 14,
  },

  dropdownItemTextoAtivo: {
    color: "#2563eb",
    fontWeight: "bold",
  },

  textAreaBox: {
    height: 100,
    alignItems: "flex-start",
    paddingVertical: 8,
  },

  textArea: {
    textAlignVertical: "top",
    height: "100%",
  },

  qtdBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  qtdBtn: {
    backgroundColor: "#e5e7eb",
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  qtdBtnText: {
    fontSize: 20,
    fontWeight: "bold",
  },

  qtdNumero: {
    fontSize: 18,
    fontWeight: "bold",
  },

  botao: {
    marginTop: 30,
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
