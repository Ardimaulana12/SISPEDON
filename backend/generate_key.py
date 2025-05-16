import secrets
# Menghasilkan SECRET_KEY yang aman dan acak
secret_key = secrets.token_hex(24)  # Anda bisa memilih panjang yang sesuai
print(secret_key)