from datetime import datetime, timedelta, timezone, date
import calendar

import jwt
import mysql.connector

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

from pydantic import BaseModel, field_validator


app = FastAPI()


# ============================================================
# CONFIGURAÇÕES
# ============================================================

SECRET_KEY = (
    "SMART_RESERVA_CHAVE_ULTRA_MEGA_"
    "SUPER_IMPORTANTEMENTE_SECRETAMENTE_OBJETIVA"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60

REFRESH_TOKEN_EXPIRE_DAYS = 30

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/login"
)


# ============================================================
# CONEXÃO MYSQL
# ============================================================

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",
        database="smartreserva"
    )


# ============================================================
# MODELOS
# ============================================================

class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    usuario: str
    senha: str


class CadastroEq_Request(BaseModel):
    Nome: str
    id_classificacao: int
    descricao: str | None
    quantidade: int
    id_localizacao: int
    especificacao: str | None
    categoria: str | None


class EditarEquipamentoRequest(BaseModel):
    id: int
    nome: str
    quantidade: int
    categoria: str
    descricao: str | None
    especificacoestec: str | None


class EditarUsuarioRequest(BaseModel):
    nome: str
    email: str
    senha: str
    role: str

    @field_validator("role")
    @classmethod
    def validar_role(cls, v):
        if v not in ["admin", "professor"]:
            raise ValueError("role inválida")
        return v


class CriarUsuarioRequest(BaseModel):
    nome: str
    email: str
    senha: str
    role: str

    @field_validator("role")
    @classmethod
    def validar_role(cls, v):
        if v not in ["admin", "professor"]:
            raise ValueError("role inválida")
        return v


class CriarReserva(BaseModel):
    id_itens: int
    data_reserva: str
    hora_inicio: str
    hora_fim: str


class VerificarReserva(BaseModel):
    id_itens: int
    data_reserva: str
    hora_inicio: str
    hora_fim: str


class DeletarUsuario(BaseModel):
    Id: int
    email: str


# ============================================================
# FORMATAR HORÁRIO
# ============================================================

def formatar_horario(valor):

    if valor is None:
        return None

    if hasattr(valor, "strftime"):
        return valor.strftime("%H:%M")

    if hasattr(valor, "total_seconds"):

        total_segundos = int(
            valor.total_seconds()
        )

        horas = (
            total_segundos // 3600
        ) % 24

        minutos = (
            total_segundos % 3600
        ) // 60

        return f"{horas:02d}:{minutos:02d}"

    return str(valor)


# ============================================================
# JWT
# ============================================================

def criar_access_token(
    usuario_id: int,
    email: str,
    role: str
):

    expiracao = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(usuario_id),
        "email": email,
        "role": role,
        "type": "access",
        "exp": expiracao
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def criar_refresh_token(usuario_id: int):

    expiracao = (
        datetime.now(timezone.utc)
        + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    payload = {
        "sub": str(usuario_id),
        "type": "refresh",
        "exp": expiracao
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# ============================================================
# USUÁRIO ATUAL
# ============================================================

def get_usuario_atual(
    token: str = Depends(oauth2_scheme)
):

    credenciais_exception = HTTPException(
        status_code=401,
        detail="Token inválido ou expirado",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        usuario_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        tipo = payload.get("type")

        if usuario_id is None:
            raise credenciais_exception

        if tipo != "access":
            raise credenciais_exception

        return {
            "id": int(usuario_id),
            "email": email,
            "role": role
        }

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token expirado"
        )

    except jwt.InvalidTokenError:

        raise credenciais_exception


# ============================================================
# EXIGIR ADMIN
# ============================================================

def exigir_admin(
    usuario_atual: dict = Depends(
        get_usuario_atual
    )
):

    if usuario_atual["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Acesso permitido apenas para administradores"
        )

    return usuario_atual


# ============================================================
# LOGIN
# ============================================================

@app.post("/api/login")
def login(request: LoginRequest):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        query = """
            SELECT
                Id,
                nome,
                email,
                senha,
                role
            FROM usuarios
            WHERE email = %s
            AND ativo = 1
        """

        cursor.execute(
            query,
            (request.usuario,)
        )

        usuario = cursor.fetchone()

        if not usuario:

            raise HTTPException(
                status_code=401,
                detail="E-mail ou senha incorretos"
            )

        if request.senha != usuario["senha"]:

            raise HTTPException(
                status_code=401,
                detail="E-mail ou senha incorretos"
            )

        access_token = criar_access_token(
            usuario["Id"],
            usuario["email"],
            usuario["role"]
        )

        refresh_token = criar_refresh_token(
            usuario["Id"]
        )

        return {
            "status": "sucesso",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "usuario": {
                "id": usuario["Id"],
                "nome": usuario["nome"],
                "email": usuario["email"],
                "role": usuario["role"]
            }
        }

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# CADASTRAR EQUIPAMENTO
# ============================================================

@app.post("/api/cadastrar_eq")
def cad_eq(
    request: CadastroEq_Request,
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor()

        query = """
            INSERT INTO itens
            (
                Nome,
                id_classificacao,
                descricao,
                quantidade,
                id_localizacao,
                especificacoestec,
                categoria
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """

        cursor.execute(
            query,
            (
                request.Nome,
                request.id_classificacao,
                request.descricao,
                request.quantidade,
                request.id_localizacao,
                request.especificacao,
                request.categoria
            )
        )

        conexao.commit()

        return {
            "status": "ok",
            "message": "Equipamento cadastrado com sucesso"
        }

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# BUSCAR RESERVAS
# ============================================================

@app.get("/api/reservas")
def buscar_reservas(
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        query = """
            SELECT
                e.id,
                e.id_itens,
                e.id_usuario,
                e.data_reserva,
                e.hora_inicio,
                e.hora_fim,
                e.status,
                i.Nome AS item,
                u.nome AS usuario
            FROM emprestimo e
            INNER JOIN usuarios u
                ON u.Id = e.id_usuario
            INNER JOIN itens i
                ON i.id = e.id_itens
            WHERE e.status = 'reservado'
            ORDER BY
                e.data_reserva ASC,
                e.hora_inicio ASC
        """

        cursor.execute(query)

        reservas = cursor.fetchall()

        for reserva in reservas:

            if reserva["data_reserva"]:
                reserva["data_reserva"] = (
                    reserva["data_reserva"].isoformat()
                )

            if reserva["hora_inicio"]:
                reserva["hora_inicio"] = formatar_horario(
                    reserva["hora_inicio"]
                )

            if reserva["hora_fim"]:
                reserva["hora_fim"] = formatar_horario(
                    reserva["hora_fim"]
                )

            reserva["minha_reserva"] = (
                reserva["id_usuario"]
                == usuario_atual["id"]
            )

        return reservas

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# RESERVAS DO MÊS
# ============================================================

@app.get("/api/reservas_mes")
def reservas_mes(
    usuario_atual: dict = Depends(exigir_admin)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        query = """
            SELECT
                e.id,
                e.id_itens,
                e.id_usuario,
                e.data_reserva,
                e.hora_inicio,
                e.hora_fim,
                e.status,
                i.Nome AS item,
                u.nome AS usuario
            FROM emprestimo e
            INNER JOIN usuarios u
                ON u.Id = e.id_usuario
            INNER JOIN itens i
                ON i.id = e.id_itens
            WHERE e.status = 'reservado'
            ORDER BY
                e.data_reserva ASC,
                e.hora_inicio ASC
        """

        cursor.execute(query)

        reservas = cursor.fetchall()

        for reserva in reservas:

            if reserva["data_reserva"]:
                reserva["data_reserva"] = (
                    reserva["data_reserva"].isoformat()
                )

            if reserva["hora_inicio"]:
                reserva["hora_inicio"] = formatar_horario(
                    reserva["hora_inicio"]
                )

            if reserva["hora_fim"]:
                reserva["hora_fim"] = formatar_horario(
                    reserva["hora_fim"]
                )

        return reservas

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(
    periodo: str = "mensal",
    ano: int | None = None,
    mes: int | None = None,
    data: str | None = None
):

    conexao = None
    cursor = None

    try:

        periodos_validos = [
            "diario",
            "semanal",
            "mensal",
            "anual"
        ]

        if periodo not in periodos_validos:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Período inválido. "
                    "Use diario, semanal, mensal ou anual."
                )
            )

        hoje = datetime.now().date()

        if ano is None:
            ano = hoje.year

        if mes is None:
            mes = hoje.month

        if mes < 1 or mes > 12:

            raise HTTPException(
                status_code=400,
                detail="Mês inválido."
            )

        if periodo == "diario":

            if data:

                try:
                    data_inicio = datetime.strptime(
                        data,
                        "%Y-%m-%d"
                    ).date()

                except ValueError:

                    raise HTTPException(
                        status_code=400,
                        detail="Data inválida. Use YYYY-MM-DD."
                    )

            else:
                data_inicio = hoje

            data_fim = data_inicio

            proximo_dia = (
                data_inicio
                + timedelta(days=1)
            )

            inicio_datetime = datetime.combine(
                data_inicio,
                datetime.min.time()
            )

            fim_datetime = datetime.combine(
                proximo_dia,
                datetime.min.time()
            )

        elif periodo == "semanal":

            if data:

                try:
                    data_fim = datetime.strptime(
                        data,
                        "%Y-%m-%d"
                    ).date()

                except ValueError:

                    raise HTTPException(
                        status_code=400,
                        detail="Data inválida. Use YYYY-MM-DD."
                    )

            else:
                data_fim = hoje

            data_inicio = (
                data_fim
                - timedelta(days=6)
            )

            inicio_datetime = datetime.combine(
                data_inicio,
                datetime.min.time()
            )

            fim_datetime = datetime.combine(
                data_fim + timedelta(days=1),
                datetime.min.time()
            )

        elif periodo == "mensal":

            data_inicio = date(
                ano,
                mes,
                1
            )

            ultimo_dia = calendar.monthrange(
                ano,
                mes
            )[1]

            data_fim = date(
                ano,
                mes,
                ultimo_dia
            )

            inicio_datetime = datetime.combine(
                data_inicio,
                datetime.min.time()
            )

            fim_datetime = datetime.combine(
                data_fim + timedelta(days=1),
                datetime.min.time()
            )

        else:

            data_inicio = date(
                ano,
                1,
                1
            )

            data_fim = date(
                ano,
                12,
                31
            )

            inicio_datetime = datetime.combine(
                data_inicio,
                datetime.min.time()
            )

            fim_datetime = datetime.combine(
                date(ano + 1, 1, 1),
                datetime.min.time()
            )

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        data_inicio_sql = data_inicio
        data_fim_sql = fim_datetime.date()

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM emprestimo
            WHERE status = 'reservado'
            AND data_reserva >= %s
            AND data_reserva < %s
            """,
            (
                data_inicio_sql,
                data_fim_sql
            )
        )

        total_resultado = cursor.fetchone()

        total_reservas = (
            total_resultado["total"]
            if total_resultado
            else 0
        )

        cursor.execute(
            """
            SELECT
                CASE i.id_classificacao
                    WHEN 1 THEN 'Data-Show'
                    WHEN 2 THEN 'Caixa de Som'
                    WHEN 3 THEN 'Microfone'
                    WHEN 4 THEN 'Notebook'
                    WHEN 5 THEN 'Eletrônico'
                    WHEN 6 THEN 'Laboratório'
                    WHEN 7 THEN 'Auditório'
                    ELSE 'Outros / Geral'
                END AS categoria,
                COUNT(*) AS total
            FROM emprestimo e
            INNER JOIN itens i ON i.id = e.id_itens
            WHERE e.status = 'reservado'
            AND e.data_reserva >= %s
            AND e.data_reserva < %s
            GROUP BY i.id_classificacao
            ORDER BY total DESC
            """,
            (data_inicio_sql, data_fim_sql)
        )

        categorias = cursor.fetchall()

        categorias_formatadas = []

        for categoria in categorias:

            quantidade = categoria["total"]

            percentual = 0

            if total_reservas > 0:

                percentual = round(
                    (
                        quantidade
                        / total_reservas
                    ) * 100,
                    2
                )

            categorias_formatadas.append({
                "categoria": categoria["categoria"],
                "total": quantidade,
                "percentual": percentual
            })

        cursor.execute(
            """
            SELECT
                i.id,
                i.Nome AS nome,
                CASE i.id_classificacao
                    WHEN 1 THEN 'Data-Show'
                    WHEN 2 THEN 'Caixa de Som'
                    WHEN 3 THEN 'Microfone'
                    WHEN 4 THEN 'Notebook'
                    WHEN 5 THEN 'Eletrônico'
                    WHEN 6 THEN 'Laboratório'
                    WHEN 7 THEN 'Auditório'
                    ELSE 'Outros / Geral'
                END AS categoria,
                COUNT(*) AS total
            FROM emprestimo e
            INNER JOIN itens i ON i.id = e.id_itens
            WHERE e.status = 'reservado'
            AND e.data_reserva >= %s
            AND e.data_reserva < %s
            GROUP BY i.id, i.Nome, i.id_classificacao
            ORDER BY total DESC
            """,
            (data_inicio_sql, data_fim_sql)
        )
        recursos = cursor.fetchall()

        recurso_mais_utilizado = None

        if recursos:

            recurso_mais_utilizado = {
                "id": recursos[0]["id"],
                "nome": recursos[0]["nome"],
                "categoria": recursos[0]["categoria"],
                "total": recursos[0]["total"]
            }

        grafico = []

        if periodo == "diario":

            cursor.execute(
                """
                SELECT
                    HOUR(hora_inicio) AS hora,
                    COUNT(*) AS total
                FROM emprestimo
                WHERE status = 'reservado'
                AND data_reserva = %s
                GROUP BY HOUR(hora_inicio)
                ORDER BY HOUR(hora_inicio)
                """,
                (data_inicio,)
            )

            resultados = cursor.fetchall()

            por_hora = {
                item["hora"]: item["total"]
                for item in resultados
            }

            for hora in range(7, 19):

                grafico.append({
                    "label": f"{hora:02d}:00",
                    "valor": por_hora.get(
                        hora,
                        0
                    )
                })

        elif periodo == "semanal":

            cursor.execute(
                """
                SELECT
                    DATE(data_reserva) AS periodo,
                    COUNT(*) AS total
                FROM emprestimo
                WHERE status = 'reservado'
                AND data_reserva >= %s
                AND data_reserva < %s
                GROUP BY DATE(data_reserva)
                ORDER BY DATE(data_reserva)
                """,
                (
                    data_inicio,
                    data_fim_sql
                )
            )

            resultados = cursor.fetchall()

            por_dia = {}

            for item in resultados:

                chave = item["periodo"].isoformat()

                por_dia[chave] = item["total"]

            nomes = [
                "Seg",
                "Ter",
                "Qua",
                "Qui",
                "Sex",
                "Sáb",
                "Dom"
            ]

            for i in range(7):

                dia_atual = (
                    data_inicio
                    + timedelta(days=i)
                )

                chave = dia_atual.isoformat()

                grafico.append({
                    "label": nomes[
                        dia_atual.weekday()
                    ],
                    "data": chave,
                    "valor": por_dia.get(
                        chave,
                        0
                    )
                })

        elif periodo == "mensal":

            cursor.execute(
                """
                SELECT
                    DAY(data_reserva) AS dia,
                    COUNT(*) AS total
                FROM emprestimo
                WHERE status = 'reservado'
                AND data_reserva >= %s
                AND data_reserva < %s
                GROUP BY DAY(data_reserva)
                ORDER BY DAY(data_reserva)
                """,
                (
                    data_inicio,
                    data_fim_sql
                )
            )

            resultados = cursor.fetchall()

            por_dia = {
                item["dia"]: item["total"]
                for item in resultados
            }

            ultimo_dia = calendar.monthrange(
                ano,
                mes
            )[1]

            for dia in range(
                1,
                ultimo_dia + 1
            ):

                grafico.append({
                    "label": str(dia),
                    "valor": por_dia.get(
                        dia,
                        0
                    )
                })

        elif periodo == "anual":

            cursor.execute(
                """
                SELECT
                    MONTH(data_reserva) AS mes,
                    COUNT(*) AS total
                FROM emprestimo
                WHERE status = 'reservado'
                AND data_reserva >= %s
                AND data_reserva < %s
                GROUP BY MONTH(data_reserva)
                ORDER BY MONTH(data_reserva)
                """,
                (
                    data_inicio,
                    data_fim_sql
                )
            )

            resultados = cursor.fetchall()

            por_mes = {
                item["mes"]: item["total"]
                for item in resultados
            }

            nomes_meses = [
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
                "Dez"
            ]

            for numero_mes in range(1, 13):

                grafico.append({
                    "label": nomes_meses[
                        numero_mes - 1
                    ],
                    "mes": numero_mes,
                    "valor": por_mes.get(
                        numero_mes,
                        0
                    )
                })

        return {
            "status": "sucesso",
            "periodo": periodo,
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
            "total_reservas": total_reservas,
            "recurso_mais_utilizado": recurso_mais_utilizado,
            "categorias": categorias_formatadas,
            "recursos": recursos,
            "grafico": grafico
        }

    except HTTPException:
        raise

    except mysql.connector.Error as err:

        print(
            "ERRO MYSQL DASHBOARD:",
            err
        )

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    except Exception as err:

        print(
            "ERRO DASHBOARD:",
            err
        )

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar dashboard: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# BUSCAR EQUIPAMENTOS
# ============================================================

@app.get("/api/buscar_eq")
def buscar_eq(
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT *
            FROM itens
            WHERE ativo = 1
            ORDER BY nome ASC
            """
        )

        return cursor.fetchall()

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# GERENCIAR USUÁRIOS
# ============================================================

@app.get("/api/gerenciar_usuario")
def mostrar_usuarios(
    usuario_atual: dict = Depends(exigir_admin)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT *
            FROM usuarios
            WHERE ativo = 1
            ORDER BY nome ASC
            """
        )

        return cursor.fetchall()

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# EDITAR USUÁRIO
# ============================================================

@app.put("/api/editar_usuario/{id}")
def editar_usuario(
    id: int,
    request: EditarUsuarioRequest,
    usuario_atual: dict = Depends(exigir_admin)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(dictionary=True)

        # Verificar se o e-mail já existe em OUTRO usuário
        cursor.execute(
            "SELECT Id FROM usuarios WHERE email = %s AND Id != %s LIMIT 1",
            (request.email, id)
        )
        usuario_existente = cursor.fetchone()

        if usuario_existente:
            raise HTTPException(
                status_code=400,
                detail="Este e-mail já pertence a outro usuário cadastrado."
            )

        cursor.execute(
            """
            UPDATE usuarios
            SET
                nome = %s,
                email = %s,
                senha = %s,
                role = %s
            WHERE Id = %s
            """,
            (
                request.nome,
                request.email,
                request.senha,
                request.role,
                id
            )
        )

        conexao.commit()

        return {"status": "ok"}

    except HTTPException:
        raise

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# CRIAR USUÁRIO
# ============================================================

@app.post("/api/criar_usuario")
def criar_usuario(
    request: CriarUsuarioRequest,
    usuario_atual: dict = Depends(exigir_admin)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(dictionary=True)

        # Verificar se o e-mail já existe no banco
        cursor.execute(
            "SELECT Id FROM usuarios WHERE email = %s LIMIT 1",
            (request.email,)
        )
        usuario_existente = cursor.fetchone()

        if usuario_existente:
            raise HTTPException(
                status_code=400,
                detail="Este e-mail já está cadastrado."
            )

        cursor.execute(
            """
            INSERT INTO usuarios
            (
                nome,
                email,
                senha,
                role
            )
            VALUES (%s,%s,%s,%s)
            """,
            (
                request.nome,
                request.email,
                request.senha,
                request.role
            )
        )

        conexao.commit()

        return {"status": "ok"}

    except HTTPException:
        raise

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# VERIFICAR RESERVA
# ============================================================

@app.post("/api/verificar_reserva")
def verificar_reserva(
    request: VerificarReserva,
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT id
            FROM emprestimo
            WHERE id_itens = %s
            AND data_reserva = %s
            AND hora_inicio = %s
            AND hora_fim = %s
            AND status = 'reservado'
            LIMIT 1
            """,
            (
                request.id_itens,
                request.data_reserva,
                request.hora_inicio,
                request.hora_fim
            )
        )

        reserva = cursor.fetchone()

        return {
            "existe": reserva is not None
        }

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# CRIAR RESERVA
# ============================================================

@app.post("/api/criar_reserva")
def criar_reserva(
    request: CriarReserva,
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        try:

            data_reserva = datetime.strptime(
                request.data_reserva,
                "%Y-%m-%d"
            ).date()

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Data da reserva inválida. "
                    "Use YYYY-MM-DD."
                )
            )

        try:

            hora_inicio = datetime.strptime(
                request.hora_inicio,
                "%H:%M"
            ).time()

            hora_fim = datetime.strptime(
                request.hora_fim,
                "%H:%M"
            ).time()

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Horário inválido. "
                    "Use HH:MM."
                )
            )

        if hora_inicio >= hora_fim:

            raise HTTPException(
                status_code=400,
                detail=(
                    "O horário inicial deve ser "
                    "menor que o horário final."
                )
            )

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                id,
                Nome,
                ativo
            FROM itens
            WHERE id = %s
            LIMIT 1
            """,
            (request.id_itens,)
        )

        item = cursor.fetchone()

        if not item:

            raise HTTPException(
                status_code=404,
                detail="Item não encontrado."
            )

        if item["ativo"] != 1:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Este item está inativo "
                    "e não pode ser reservado."
                )
            )

        cursor.execute(
            """
            SELECT id
            FROM emprestimo
            WHERE id_itens = %s
            AND data_reserva = %s
            AND hora_inicio = %s
            AND hora_fim = %s
            AND status = 'reservado'
            LIMIT 1
            """,
            (
                request.id_itens,
                data_reserva,
                hora_inicio,
                hora_fim
            )
        )

        reserva_existente = cursor.fetchone()

        if reserva_existente:

            raise HTTPException(
                status_code=409,
                detail=(
                    "Este item já está reservado "
                    "para esse horário."
                )
            )

        id_usuario = usuario_atual["id"]

        data_realizacao_reserva = datetime.now()

        cursor.execute(
            """
            INSERT INTO emprestimo
            (
                id_itens,
                id_usuario,
                data_reserva,
                hora_inicio,
                hora_fim,
                status,
                data_realizacao_reserva
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                request.id_itens,
                id_usuario,
                data_reserva,
                hora_inicio,
                hora_fim,
                "reservado",
                data_realizacao_reserva
            )
        )

        conexao.commit()

        id_reserva = cursor.lastrowid

        return {
            "status": "sucesso",
            "message": "Reserva criada com sucesso.",
            "reserva": {
                "id": id_reserva,
                "id_itens": request.id_itens,
                "id_usuario": id_usuario,
                "data_reserva": request.data_reserva,
                "hora_inicio": request.hora_inicio,
                "hora_fim": request.hora_fim,
                "status": "reservado",
                "data_realizacao_reserva":
                    data_realizacao_reserva.isoformat()
            }
        }

    except HTTPException:

        if conexao:
            conexao.rollback()

        raise

    except mysql.connector.Error as err:

        if conexao:
            conexao.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco ao criar reserva: {err}"
        )

    except Exception as err:

        if conexao:
            conexao.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar reserva: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# CANCELAR RESERVA
# ============================================================

@app.delete("/api/cancelar_reserva/{id_reserva}")
def cancelar_reserva(
    id_reserva: int,
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                e.id,
                e.id_usuario,
                e.status,
                e.data_reserva,
                e.hora_inicio,
                e.hora_fim,
                i.Nome AS item
            FROM emprestimo e
            INNER JOIN itens i
                ON i.id = e.id_itens
            WHERE e.id = %s
            LIMIT 1
            """,
            (id_reserva,)
        )

        reserva = cursor.fetchone()

        if not reserva:

            raise HTTPException(
                status_code=404,
                detail="Reserva não encontrada."
            )

        if reserva["status"] != "reservado":

            raise HTTPException(
                status_code=400,
                detail="Esta reserva não está mais ativa."
            )

        if reserva["id_usuario"] != usuario_atual["id"]:

            raise HTTPException(
                status_code=403,
                detail=(
                    "Você só pode cancelar "
                    "suas próprias reservas."
                )
            )

        cursor.execute(
            """
            UPDATE emprestimo
            SET status = 'cancelado'
            WHERE id = %s
            AND id_usuario = %s
            AND status = 'reservado'
            """,
            (
                id_reserva,
                usuario_atual["id"]
            )
        )

        conexao.commit()

        return {
            "status": "sucesso",
            "message": "Reserva cancelada com sucesso.",
            "id_reserva": id_reserva
        }

    except HTTPException:

        if conexao:
            conexao.rollback()

        raise

    except mysql.connector.Error as err:

        if conexao:
            conexao.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco ao cancelar reserva: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# BUSCAR LOCAIS
# ============================================================

@app.get("/api/buscar_locais")
def buscar_locais(
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT *
            FROM localizacao
            ORDER BY nome ASC
            """
        )

        return cursor.fetchall()

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# DELETAR USUÁRIO
# ============================================================

@app.post("/api/deletar_usuario")
def deletar_usuario(
    request: DeletarUsuario,
    usuario_atual: dict = Depends(exigir_admin)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor()

        cursor.execute(
            """
            UPDATE usuarios
            SET ativo = 0
            WHERE Id = %s
            OR email = %s
            """,
            (
                request.Id,
                request.email
            )
        )

        conexao.commit()

        return {"status": "ok"}

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# CATÁLOGO
# ============================================================

@app.get("/api/catalogo")
def listar_catalogo(
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                id,
                Nome AS nome,
                id_classificacao,
                descricao,
                quantidade,
                especificacoestec,
                categoria,
                ativo
            FROM itens
            ORDER BY nome ASC
            """
        )

        return cursor.fetchall()

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# EDITAR ITEM
# ============================================================

@app.put("/api/editar_item/{id}")
def editar_item(
    id: int,
    request: EditarEquipamentoRequest,
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor()

        cursor.execute(
            """
            UPDATE itens
            SET
                nome = %s,
                quantidade = %s,
                categoria = %s,
                descricao = %s,
                especificacoestec = %s
            WHERE Id = %s
            """,
            (
                request.nome,
                request.quantidade,
                request.categoria,
                request.descricao,
                request.especificacoestec,
                id
            )
        )

        conexao.commit()

        return {"status": "ok"}

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# DELETAR ITEM
# ============================================================

@app.post("/api/deletar_item/{id}")
def deletar_item(
    id: int,
    usuario_atual: dict = Depends(get_usuario_atual)
):

    conexao = None
    cursor = None

    try:

        conexao = get_db_connection()

        cursor = conexao.cursor()

        cursor.execute(
            """
            UPDATE itens
            SET ativo = 0
            WHERE Id = %s
            """,
            (id,)
        )

        conexao.commit()

        return {"status": "ok"}

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# REFRESH TOKEN
# ============================================================

@app.post("/api/refresh")
def refresh_token(
    request: RefreshTokenRequest
):

    credenciais_exception = HTTPException(
        status_code=401,
        detail="Refresh token inválido ou expirado"
    )

    conexao = None
    cursor = None

    try:

        payload = jwt.decode(
            request.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        usuario_id = payload.get("sub")
        tipo = payload.get("type")

        if usuario_id is None:
            raise credenciais_exception

        if tipo != "refresh":
            raise credenciais_exception

        conexao = get_db_connection()

        cursor = conexao.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                Id,
                nome,
                email,
                role
            FROM usuarios
            WHERE Id = %s
            AND ativo = 1
            """,
            (int(usuario_id),)
        )

        usuario = cursor.fetchone()

        if not usuario:
            raise credenciais_exception

        novo_access_token = criar_access_token(
            usuario["Id"],
            usuario["email"],
            usuario["role"]
        )

        return {
            "access_token": novo_access_token,
            "token_type": "bearer"
        }

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Refresh token expirado"
        )

    except jwt.InvalidTokenError:

        raise credenciais_exception

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=f"Erro no banco: {err}"
        )

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()