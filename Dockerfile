# 1. Usamos una versión oficial y ligera de Python como base
FROM python:3.11-slim

# 2. Le decimos a Docker dónde vamos a trabajar dentro de la caja
WORKDIR /app

# 3. Copiamos tu lista de compras y la instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copia all the proyecto (modelos, backend, etc.) dentro de la caja
COPY . .

# 5. Exponemos el puerto 5000 para que el mundo web pueda conectarse
EXPOSE 5000

# 6. La orden final: Prender el servidor Flask cuando la caja se abra
CMD ["python", "backend/app.py"]