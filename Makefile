up:
	COMPOSE_BAKE=true
	docker-compose up --build --remove-orphans

down:
	docker-compose down
