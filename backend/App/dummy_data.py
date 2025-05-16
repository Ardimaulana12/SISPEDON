from App import create_app, db
from App.models import Dosen, Mahasiswa

app = create_app()

with app.app_context():
    # Optional: drop dulu jika ingin mulai dari awal
    # db.drop_all()
    db.create_all()

    # Cek apakah data sudah ada
    if not Dosen.query.first():
        # Dummy dosen
        d1 = Dosen(nid='D001', nama='Dr. Budi Santoso')
        d2 = Dosen(nid='D002', nama='Prof. Ani Lestari')

        # Dummy mahasiswa
        m1 = Mahasiswa(nim='M001', nama='Andi Wijaya', kelas='TI-1A', semester=2, nid='D001')
        m2 = Mahasiswa(nim='M002', nama='Siti Rahma', kelas='TI-1B', semester=4, nid='D002')
        m3 = Mahasiswa(nim='M003', nama='Rudi Hartono', kelas='TI-1A', semester=2, nid='D001')

        db.session.add_all([d1, d2, m1, m2, m3])
        db.session.commit()
        print("Dummy data berhasil dimasukkan.")
    else:
        print("Data sudah ada, tidak menambahkan ulang.")
