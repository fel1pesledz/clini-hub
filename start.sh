#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Iniciando CliniHub..."

# ── Backend (Docker: db + backend) ───────────────────────────────────────────
echo "Subindo backend (Docker: Postgres + Flask)..."
cd "$ROOT/backend"
docker compose up -d --build

# Aguarda o backend estar pronto
echo "Aguardando backend na porta 5000..."
for i in $(seq 1 30); do
  if curl -s http://localhost:5000/api/auth/me > /dev/null 2>&1 || \
     nc -z localhost 5000 2>/dev/null; then
    echo "Backend pronto."
    break
  fi
  sleep 1
done

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "Subindo frontend (Vite)..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "CliniHub rodando."
echo "   Frontend -> http://localhost:3000"
echo "   Backend  -> http://localhost:5000"
echo ""
echo "Pressione Ctrl+C para encerrar tudo."

# Encerra ambos ao sair
trap "echo ''; echo 'Encerrando...'; kill $FRONTEND_PID 2>/dev/null; cd '$ROOT/backend' && docker compose down; exit 0" SIGINT SIGTERM
wait $FRONTEND_PID
