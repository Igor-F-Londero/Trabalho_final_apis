#!/bin/bash
# Script de demonstração para a apresentação.
# Roda o CRUD completo, um passo por vez, pausando entre eles.

BASE_URL="http://localhost:8080"

pausa() {
  echo
  read -p "Pressione Enter para continuar..." _
  echo
}

passo() {
  echo "=================================================="
  echo "$1"
  echo "=================================================="
}

passo "1. Listar todos os livros"
curl -i "$BASE_URL/livros"
pausa

passo "2. Criar livro (Freud)"
curl -i -X POST "$BASE_URL/livros" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"A Interpretação dos Sonhos","autor":"Sigmund Freud","anoPublicacao":1899,"preco":42.9}'
echo
RESP=$(curl -s -X POST "$BASE_URL/livros" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Assim Falou Zaratustra","autor":"Friedrich Nietzsche","anoPublicacao":1883,"preco":39.9}')
echo "$RESP"
ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo
echo "(livro criado com id $ID, usado nos próximos passos)"
pausa

passo "3. Criar mais um livro (Schopenhauer)"
curl -i -X POST "$BASE_URL/livros" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"O Mundo como Vontade e Representação","autor":"Arthur Schopenhauer","anoPublicacao":1818,"preco":45.5}'
pausa

passo "4. Listar todos de novo (mostrando os livros criados)"
curl -i "$BASE_URL/livros"
pausa

passo "5. Buscar por id ($ID)"
curl -i "$BASE_URL/livros/$ID"
pausa

passo "6. Atualizar (PUT) o livro $ID"
curl -i -X PUT "$BASE_URL/livros/$ID" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Assim Falou Zaratustra","autor":"Friedrich Nietzsche","anoPublicacao":1883,"preco":49.9,"disponivel":false}'
pausa

passo "7. Testar validação (POST inválido, deve dar 400)"
curl -i -X POST "$BASE_URL/livros" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Livro sem preço","autor":"Alguém"}'
pausa

passo "8. Remover (DELETE) o livro $ID"
curl -i -X DELETE "$BASE_URL/livros/$ID"
pausa

passo "9. Confirmar remoção (deve dar 404)"
curl -i "$BASE_URL/livros/$ID"
pausa

passo "10. Rate limiting: rajada de 40 requisições"
for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/livros"; done | sort | uniq -c
echo "(200 = passou, 429 = bloqueado pelo Nginx por excesso de requisições)"
