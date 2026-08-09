mig:
	python manage.py makemigrations
upg:
	python manage.py migrate
admin:
	python manage.py createsuperuser