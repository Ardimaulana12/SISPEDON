from App import create_app, db  # Pastikan kamu punya fungsi create_app() di App/__init__.py
from App.models import Dosen, Mahasiswa

app = create_app()  # Buat instance Flask app

with app.app_context():
    student = Dosen.query.first()
    for s in student.mahasiswa:
        if s:
            print(s.kelas)
        else:
            print("No Dosen found.")
