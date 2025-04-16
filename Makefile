up:
	COMPOSE_BAKE=true
	docker-compose up
down:
	docker-compose down

rebuild:
	docker-compose down --remove-orphans
	docker-compose up --build --remove-orphans
