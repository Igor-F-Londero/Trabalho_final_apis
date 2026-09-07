#!/bin/bash
# Roda num terminal separado, em paralelo ao demo.sh, pra ver a fila
# atualizando em tempo real (bem mais rápido que o refresh de 5s do painel web).

watch -n 1 "docker compose exec rabbitmq rabbitmqctl list_queues name messages consumers"
