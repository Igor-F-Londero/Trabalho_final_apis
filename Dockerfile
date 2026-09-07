# 1. imagem base — Node já instalado, versão Alpine (Linux minimalista, imagem menor)
FROM node:20-alpine

# 2. diretório de trabalho DENTRO do container — tudo que vier depois roda a partir daqui
WORKDIR /app

# 3. copie SÓ os arquivos de manifesto de dependência primeiro
#    (package.json e package-lock.json)
COPY package*.json ./

# 4. instale as dependências
RUN npm install

# 5. AGORA copie o resto do código da aplicação
COPY . .

# 6. gere o Prisma Client — precisa rodar aqui porque o client tem
#    binário nativo específico do sistema operacional do container
#    (Alpine Linux), diferente do binário gerado na sua máquina
#    valor fictício: só existe pra satisfazer a validação do prisma.config.ts
#    durante o build; a conexão real de verdade vem do docker-compose.yml em runtime
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# 7. documenta (não abre de fato a porta, é só metadado) em qual porta a API escuta
EXPOSE 3000

# 8. comando que roda quando o container sobe:
#    aplica as migrations pendentes (usando a DATABASE_URL real, injetada
#    em runtime pelo docker-compose.yml) e só então inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
