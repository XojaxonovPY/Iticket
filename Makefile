mig:
	python manage.py makemigrations
upg:
	python manage.py migrate
admin:
	python manage.py createsuperuser
init:
	python manage.py makemessages -l uz
	python manage.py makemessages -l ru
	python manage.py makemessages -l en
compile:
	python manage.py compilemessages