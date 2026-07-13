# CliniHub

Sistema de gestão clínica com agenda, prontuários eletrônicos e gestão de médicos e pacientes.

---

## Tecnologias

**Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite  
**Backend:** Python + Flask + SQLite  
**Auth:** JWT

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) v3.10+

---

## Instalação

### 1. Frontend

```bash
npm install
```

### 2. Backend

```bash
cd server
python -m venv env
source env/bin/activate # Windows: env\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Variáveis de ambiente

Edite o arquivo `server/.env` antes de rodar:

```env
JWT_SECRET_KEY=gere-um-valor-seguro-aqui
ADMIN_PASSWORD=sua-senha-de-admin
```

Para gerar uma chave segura:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Rodando o projeto

```bash
./start.sh
```

Isso sobe o backend na porta **5000** e o frontend na porta **3000**.

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Acessos

| Perfil | Como entrar |
|---|---|
| **Admin** | Tela inicial → Administrador → senha do `.env` |
| **Médico** | Tela inicial → Médico → busca pelo nome → senha cadastrada |

---

## Estrutura do projeto

```
clinihub/
├── src/                  # Frontend React
│   ├── components/       # Componentes de UI
│   ├── context/          # ClinicContext + AuthContext
├── server/               # Backend Flask
│   ├── app.py            # Rotas e lógica da API
│   ├── db.py             # Conexão e inicialização do SQLite
│   ├── requirements.txt  # Dependências Python
│   └── .env              # Variáveis de ambiente (não versionar)
├── start.sh              # Script para subir tudo junto
└── vite.config.ts        # Proxy /api → Flask
```

---

## Observações

- O banco de dados (`clinihub.db`) é criado automaticamente na primeira execução dentro da pasta `server/`
