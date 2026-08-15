import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const URL_API = "http://192.168.100.128:8000";

// ============================================================
// RENOVAR ACCESS TOKEN
// ============================================================

export const renovarAccessToken = async () => {
  try {
    const refreshToken =
      await AsyncStorage.getItem("refresh_token");

    if (!refreshToken) {
      throw new Error("Refresh token não encontrado.");
    }

    console.log("Tentando renovar access token...");

    const resposta = await fetch(
      `${URL_API}/api/refresh`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );

    const data = await resposta.json();

    console.log(
      "Resposta do refresh:",
      data
    );

    // ========================================================
    // REFRESH TOKEN INVÁLIDO
    // ========================================================

    if (!resposta.ok) {
      console.log(
        "Refresh token inválido ou expirado."
      );

      await AsyncStorage.removeItem(
        "access_token"
      );

      await AsyncStorage.removeItem(
        "refresh_token"
      );

      await AsyncStorage.removeItem(
        "usuarioLogado"
      );

      throw new Error(
        data.detail ||
        "Sessão expirada."
      );
    }

    // ========================================================
    // API NÃO DEVOLVEU ACCESS TOKEN
    // ========================================================

    if (!data.access_token) {
      throw new Error(
        "A API não retornou um novo access token."
      );
    }

    // ========================================================
    // SALVAR NOVO ACCESS TOKEN
    // ========================================================

    await AsyncStorage.setItem(
      "access_token",
      String(data.access_token)
    );

    console.log(
      "Novo access token salvo."
    );

    // ========================================================
    // CASO O BACKEND DEVOLVA NOVO REFRESH TOKEN
    // ========================================================

    if (data.refresh_token) {
      await AsyncStorage.setItem(
        "refresh_token",
        String(data.refresh_token)
      );

      console.log(
        "Novo refresh token salvo."
      );
    }

    return data.access_token;

  } catch (error) {

    console.log(
      "Erro ao renovar access token:",
      error
    );

    throw error;
  }
};

// ============================================================
// FAZER REQUISIÇÃO AUTENTICADA
// ============================================================

export const apiFetch = async (
  url,
  options = {}
) => {

  // ==========================================================
  // PEGAR ACCESS TOKEN
  // ==========================================================

  let accessToken =
    await AsyncStorage.getItem(
      "access_token"
    );

  if (!accessToken) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  // ==========================================================
  // PRIMEIRA TENTATIVA
  // ==========================================================

  let resposta = await fetch(
    url,
    {
      ...options,

      headers: {
        ...options.headers,

        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );

  // ==========================================================
  // ACCESS TOKEN EXPIROU
  // ==========================================================

  if (resposta.status === 401) {

    console.log(
      "Access token expirado."
    );

    console.log(
      "Tentando renovar..."
    );

    // ========================================================
    // RENOVAR TOKEN
    // ========================================================

    accessToken =
      await renovarAccessToken();

    // ========================================================
    // TENTAR NOVAMENTE
    // ========================================================

    resposta = await fetch(
      url,
      {
        ...options,

        headers: {
          ...options.headers,

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );
  }

  return resposta;
};

// ============================================================
// LOGOUT
// ============================================================

export const logout = async () => {

  await AsyncStorage.removeItem(
    "access_token"
  );

  await AsyncStorage.removeItem(
    "refresh_token"
  );

  await AsyncStorage.removeItem(
    "usuarioLogado"
  );

  console.log(
    "Usuário deslogado."
  );
};