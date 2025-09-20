SHELL := /bin/bash
REG ?= ghcr.io/your-org
TAG ?= $(shell git rev-parse --short HEAD)

.PHONY: up down logs build push seed test fmt

up:
	docker compose -f deploy/docker-compose.yml up -d

down:
	docker compose -f deploy/docker-compose.yml down -v

logs:
	docker compose -f deploy/docker-compose.yml logs -f

build:
	docker build -t $(REG)/relayer-tickets:$(TAG) apps/relayer-tickets
	docker build -t $(REG)/indexer-tickets:$(TAG) apps/indexer-tickets
	docker build -t $(REG)/pinning-adapter:$(TAG) apps/pinning-adapter
	docker build -t $(REG)/scanner-pwa:$(TAG) apps/scanner-pwa

push:
	docker push $(REG)/relayer-tickets:$(TAG)
	docker push $(REG)/indexer-tickets:$(TAG)
	docker push $(REG)/pinning-adapter:$(TAG)
	docker push $(REG)/scanner-pwa:$(TAG)

seed:
	bash ops/curl-examples.sh

test:
	npm -w apps/relayer-tickets test || true
	npm -w apps/indexer-tickets test || true
	npm -w contracts test || true

fmt:
	npx prettier -w "**/*.{ts,tsx,js,json,md,yml,yaml}"
