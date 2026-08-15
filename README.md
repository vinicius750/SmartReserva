# SmartReserva 🏨

> Trabalho de Conclusão de Curso (TCC)

O **SmartReserva** é um sistema de gestão e reserva de ambientes e equipamentos escolares, composto por um aplicativo móvel e um conjunto de APIs backend. O objetivo do projeto é facilitar o agendamento e o controle de recursos (como laboratórios, salas de aula, projetores e computadores) em instituições de ensino.

---

## 📱 Estrutura do Projeto

O repositório está organizado nas seguintes partes principais:

* **`meu-app/`**: Aplicativo mobile desenvolvido em **React Native** (Expo) para que professores, alunos e colaboradores realizem e gerenciem suas reservas.
* **`python-api/`**: Ecossistema de **APIs em Python** desenvolvidas com **FastAPI**, divididas em serviços/módulos responsáveis por autenticação, gestão de reservas, cadastro de recursos e cadastro de usuários.

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Mobile)
* React Native / Expo
* TypeScript / JavaScript
* Axios (Consumo das APIs)

### Backend (APIs)
* Python 3.x
* FastAPI
* Uvicorn (Servidor ASGI)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
* **Node.js** instalado (para o app React Native)
* **Python 3.8+** instalado (para as APIs)

### 2. Rodando as APIs (Backend - FastAPI)



```bash
cd python-api

# (Opcional, mas recomendado) Crie e ative um ambiente virtual
python -m venv venv
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate



# Execute o serviço/API desejado (exemplo)
uvicorn main:app --reload --port 8000

```

### 3. Rodando o Aplicativo (Frontend - Expo)

```bash
cd meu-app

# Execute o comando
npx expo start





```
