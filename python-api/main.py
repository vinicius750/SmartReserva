from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
import mysql.connector

app = FastAPI()

# Modelo para receber os dados do React Native
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

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        user="flaskuser",
        password="root",
        database="smartreserva",
        auth_plugin='mysql_native_password'
    )

@app.post("/api/login")
def login(request: LoginRequest):
    try:
        conexao = get_db_connection()
        cursor = conexao.cursor(dictionary=True)
        
        # Corrigido: 'Id' com o I maiúsculo para bater com a sua tabela do Workbench
        query = "SELECT Id, nome, email, role FROM usuarios WHERE email = %s AND senha = %s"
        cursor.execute(query, (request.usuario, request.senha))
        usuario_encontrado = cursor.fetchone()
        
        cursor.close()
        conexao.close()
        
        if not usuario_encontrado:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos"
            )
            
        # Retorna os dados do usuário autenticado (incluindo a role que vimos na imagem)
        return {"status": "sucesso", "usuario": usuario_encontrado}
        
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Erro no banco: {err}")


@app.post("/api/cadastrar_eq")
def cad_eq(request: CadastroEq_Request):
    try:
        conexao = get_db_connection()
        cursor = conexao.cursor(dictionary=True)
        
        
        query = "INSERT INTO itens (Nome, id_classificacao, descricao, quantidade, id_localizacao, especificacoestec, categoria) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(query, (request.Nome, request.id_classificacao, request.descricao, request.quantidade, request.id_localizacao,request.especificacao,request.categoria))
        
        
        conexao.commit()
        cursor.close()
        conexao.close()
        
        
        
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Erro no banco: {err}")
