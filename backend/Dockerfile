FROM python:3.10-slim

WORKDIR /app/backend

# Install netcat dan dependensi dasar (agar bisa pakai apt-get dengan baik)
RUN apt-get update && \
    apt-get install -y --no-install-recommends netcat-openbsd gcc libpq-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy dan install requirements
COPY requirements.txt .
RUN pip install pip==23.0.1
RUN pip install --no-cache-dir -r requirements.txt --index-url https://mirrors.aliyun.com/pypi/simple/ --timeout=120

# Copy semua file proyek
COPY . .

# Buat folder uploads (kalau perlu)
RUN mkdir -p uploads/lecturers && chmod -R 777 uploads

# Copy entrypoint.sh & gift permission
COPY entrypoint.sh /app/backend/entrypoint.sh
RUN chmod +x /app/backend/entrypoint.sh

# Jalankan entrypoint saat container start
ENTRYPOINT ["./entrypoint.sh"]
# FROM python:3.10-slim

# # Install dependencies yang dibutuhkan oleh pip dan torch
# # RUN apk add --no-cache gcc musl-dev python3-dev libffi-dev make

# WORKDIR /app/backend

# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# # Create uploads directory with correct permissions
# RUN mkdir -p uploads/lecturers && \
#     chmod -R 777 uploads

# # RUN cd /app/backend

# RUN pip install pip==23.0.1  && \
#     pip install --no-cache-dir -r requirements.txt --index-url https://mirrors.aliyun.com/pypi/simple/ --timeout=120

# # RUN source env/bin/activate

# # RUN pip install -r requirements.txt

# EXPOSE 5000

# # CMD [ "python", "main.py" ] 
# CMD ["gunicorn", "--workers=3", "--bind=0.0.0.0:5000", "main:app"]