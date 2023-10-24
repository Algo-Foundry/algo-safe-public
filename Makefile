safe:
	python3 ./assets/safe.py > ./assets/safe.teal
	python3 ./assets/clear.py > ./assets/clear.teal
master:
	python3 ./assets/master.py > ./assets/master.teal

build-staging:
	docker compose --env-file .env.staging -f docker/algosafe-staging/docker-compose.yml build
start-staging:
	docker compose --env-file .env.staging -f docker/algosafe-staging/docker-compose.yml up -d
stop-staging:
	docker compose --env-file .env.staging -f docker/algosafe-staging/docker-compose.yml down

build-production:
	docker compose --env-file .env.production -f docker/algosafe-production/docker-compose.yml build
start-production:
	docker compose --env-file .env.production -f docker/algosafe-production/docker-compose.yml up -d
stop-production:
	docker compose --env-file .env.production -f docker/algosafe-production/docker-compose.yml down
