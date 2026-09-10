# API de Livros

API RESTful em Node.js + Express para gerenciamento de livros (CRUD completo),
com persistência em PostgreSQL, mensageria assíncrona via RabbitMQ e um API
Gateway em Nginx fazendo load balancing e rate limiting entre 3 instâncias da API.

## Como executar

Pré-requisito: Docker e Docker Compose instalados.

```bash
docker compose up --build
```

Esse único comando sobe toda a aplicação: build das imagens, banco de dados,
broker de mensagens, as 3 instâncias da API (com migrations do banco já
aplicadas automaticamente), os 2 consumers e o gateway. Nenhum passo manual
adicional é necessário.

Depois de subir, a API está acessível em `http://localhost:8080`.

## Portas utilizadas

| Porta (host) | Serviço | Descrição |
|---|---|---|
| `8080` | Nginx (gateway) | Ponto de entrada único da API — todo tráfego externo passa por aqui |
| `15672` | RabbitMQ (painel web) | Interface de administração — acesse em `http://localhost:15672` (usuário/senha padrão: `guest`/`guest`) |

As 3 instâncias da API (`api1`, `api2`, `api3`), o PostgreSQL e a porta AMQP
do RabbitMQ **não** expõem porta para o host — só são alcançáveis pela rede
interna do Compose. Isso reduz a chance de conflito com outros serviços já
rodando na máquina, já que só as duas portas realmente necessárias pra uso
externo (a própria API e o painel de administração) ficam expostas.

## Variáveis de ambiente

Definidas diretamente no `docker-compose.yml` (não é necessário criar `.env`
para rodar via Docker):

| Variável | Valor (em containers) | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/livros?schema=public` | String de conexão do Prisma com o Postgres |
| `RABBITMQ_URL` | `amqp://rabbitmq:5672` | Endereço do broker RabbitMQ |
| `PORT` | `3000` | Porta interna em que cada instância da API escuta |
| `CONSUMER_DELAY_MS` | `4000` | Atraso proposital (ms) antes do `ack` nos consumers — só para fins de demonstração visual da fila; `0` desativa |

Para rodar a API **fora** do Docker (desenvolvimento local), crie um `.env`
na raiz com `DATABASE_URL` apontando para um Postgres acessível localmente —
o Prisma Client carrega esse arquivo automaticamente.

## Endpoints

Recurso `Livro`: `{ titulo: string, autor: string, anoPublicacao: number, preco: number, disponivel: boolean }`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/livros` | Lista todos os livros |
| `GET` | `/livros/:id` | Busca um livro por id (404 se não existir) |
| `POST` | `/livros` | Cria um livro (400 se dados inválidos) |
| `PUT` | `/livros/:id` | Atualiza um livro (404 se não existir) |
| `DELETE` | `/livros/:id` | Remove um livro (404 se não existir) |

## Decisões de arquitetura

### Funcionalidades extras escolhidas

Das 3 opções propostas, foram implementadas **API Gateway (Load Balancer +
Rate Limit)** e **Mensageria com RabbitMQ** — Telemetria/Loki não foi implementada.

### Persistência: PostgreSQL + Prisma

Prisma foi escolhido como ORM por oferecer migrations versionadas e um client
com tipagem gerada a partir do schema, reduzindo erros de nome/tipo de campo
em tempo de desenvolvimento.

### API Gateway: Nginx com 3 instâncias stateless

As 3 instâncias da API são réplicas idênticas da mesma imagem Docker, sem
nenhum estado em memória — todo estado real vive no PostgreSQL. Isso permite
que o Nginx distribua requisições em round robin entre elas sem qualquer
necessidade de "sticky sessions" ou sincronização entre instâncias.

O rate limiting (`limit_req`) é aplicado no próprio Nginx, antes da requisição
alcançar qualquer instância da API — protegendo todas elas de uma só vez, no
ponto de entrada único da aplicação.

### Mensageria: RabbitMQ com 2 filas de propósitos distintos

- **`notifications`**: eventos de negócio relevantes (hoje, criação de livro).
  Representa o caso de uso de notificar sistemas externos sobre um evento.
- **`audit_log`**: log de auditoria de toda alteração de estado (create,
  update, delete), para rastreabilidade independente da operação de negócio.

Cada fila tem um consumer dedicado, rodando como container próprio,
reutilizando a mesma imagem Docker da API (mesmo `Dockerfile`, apenas o
`command` no `docker-compose.yml` é diferente) — já que o runtime e as
dependências são idênticos, não fazia sentido manter Dockerfiles duplicados.

As mensagens são publicadas **depois** da escrita no banco ser confirmada com
sucesso, evitando notificar sobre um estado que não chegou a existir de fato.

### Resiliência na conexão com o RabbitMQ

Mesmo com o `healthcheck` do RabbitMQ marcando o container como saudável, o
listener AMQP pode ainda não estar pronto para aceitar conexões no exato
instante em que a API ou os consumers tentam se conectar — uma corrida de
largada mais provável em máquinas mais lentas. Duas camadas cobrem isso:

- Nível de aplicação: [connection.js](src/messaging/connection.js) tenta
  reconectar a cada 2 segundos até conseguir, em vez de falhar de imediato.
- Nível de infraestrutura: `restart: on-failure` em todos os serviços do
  `docker-compose.yml`, como rede de segurança caso o processo ainda assim
  encerre de forma inesperada.

### Containers sem Dockerfile próprio

PostgreSQL e RabbitMQ usam as imagens oficiais sem customização — não há
necessidade de um `Dockerfile` próprio quando nenhuma modificação da imagem
base é feita. O Nginx tem `Dockerfile.nginx` dedicado por embutir uma
configuração customizada (`nginx.conf`) na imagem.
