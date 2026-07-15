.PHONY: help install prepare-data dev frontend build start test test-watch test-e2e lint typecheck format format-check audit ci clean docker-build docker-run load-test

help:
	@echo "Causal Inference Dashboard — available targets:"
	@echo "  make install       Install npm dependencies"
	@echo "  make prepare-data  Regenerate data/results.json from analysis-source/"
	@echo "  make dev           Run the Next.js dev server (http://localhost:3000)"
	@echo "  make frontend      Alias for 'make dev' (build + start the frontend)"
	@echo "  make build         Production build"
	@echo "  make start         Start the production build (run 'make build' first)"
	@echo "  make test          Run unit/component/a11y tests with coverage"
	@echo "  make test-watch    Run unit tests in watch mode"
	@echo "  make test-e2e      Run Playwright end-to-end tests"
	@echo "  make lint          Run ESLint"
	@echo "  make typecheck     Run the TypeScript compiler in check-only mode"
	@echo "  make format        Format code with Prettier"
	@echo "  make format-check  Check formatting without writing changes"
	@echo "  make audit         Run npm audit (fails on high/critical vulnerabilities)"
	@echo "  make ci            Run the full CI gate: lint + typecheck + test + audit + build"
	@echo "  make clean         Remove build artifacts and caches"
	@echo "  make docker-build  Build the production Docker image"
	@echo "  make docker-run    Run the production Docker image locally"
	@echo "  make load-test     Run the k6 load test against a running instance"

install:
	npm ci --no-audit --no-fund

prepare-data:
	npm run prepare-data

dev: install
	npm run dev

frontend: dev

build: install
	npm run build

start:
	npm run start

test: install
	npm test

test-watch: install
	npm run test:watch

test-e2e: install
	npx playwright install --with-deps
	npm run test:e2e

lint: install
	npm run lint

typecheck: install
	npm run typecheck

format:
	npm run format

format-check:
	npm run format:check

audit:
	npm audit --audit-level=high

# Full gate a CI pipeline (or a pre-push hook) should run.
ci: install lint typecheck test audit build
	@echo "✅ CI gate passed: lint, typecheck, tests, audit, and build all succeeded."

clean:
	rm -rf .next out node_modules coverage playwright-report test-results

docker-build:
	docker build -t causal-inference-dashboard:latest .

docker-run: docker-build
	docker run --rm -p 3000:3000 causal-inference-dashboard:latest

load-test:
	k6 run load-test/dashboard.js
