import multiprocessing

# Server qaysi manzil/portda tinglaydi
bind = "0.0.0.0:8000"

# CPU yadrolariga qarab workerlar sonini hisoblash
workers = multiprocessing.cpu_count() * 2 + 1

# Worker turi - Uvicorn ASGI
worker_class = "uvicorn.workers.UvicornWorker"

# Timeout va ulanish sozlamalari
timeout = 120
keepalive = 5

# Log sozlamalari (Docker stdout/stderr ga chiqarishi uchun)
accesslog = "-"
errorlog = "-"
loglevel = "info"