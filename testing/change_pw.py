import bcrypt

# Password baru
password_baru = "admin"

# Generate hash
hashed_baru = bcrypt.hashpw(password_baru.encode(), bcrypt.gensalt())

# Cetak hasil hash
print(hashed_baru.decode())  # Ini yang akan kamu masukkan ke DB

# UPDATE public.users
# 	SET password='$2b$12$9sSzlY8tLtyvYnZGwDWmcep2vYYb02sMlHd78oR7qauLY3LcAz4sS'
# 	WHERE id =1;