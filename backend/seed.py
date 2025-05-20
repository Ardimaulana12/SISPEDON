from App import create_app, db
from App.models import User, Student, Class, Lecturer, ClassLecturer, Course, Question, Answer, Evaluation, LecturerScore
from utils.auth import generate_password_hash
from faker import Faker
from datetime import datetime, timedelta
import random

app = create_app()
fake = Faker('id_ID')  # Menggunakan locale Indonesia

with app.app_context():
    db.drop_all()
    db.create_all()

    # 1. Users
    users = []

    # Admin
    admin = User(
        username="admin1",
        email="admin1@example.com",
        password=generate_password_hash("admin123"),
        role="admin"
    )
    users.append(admin)

    # Students - Menambahkan lebih banyak mahasiswa (15 mahasiswa)
    for i in range(15):
        user = User(
            username=f"student{i+1}",
            email=f"student{i+1}@example.com",
            password=generate_password_hash("student123"),
            role="student"
        )
        users.append(user)

    db.session.add_all(users)
    db.session.flush()

    # 2. Classes - Kelas untuk berbagai semester dan tahun ajaran
    classes = []
    academic_years = ["2022/2023", "2023/2024", "2024/2025"]
    
    for year in academic_years:
        for i in range(10):
            class_ = Class(
                name=f"IF-{chr(65 + i)}",
                semester=(i % 8) + 1,
                academic_year=year
            )
            classes.append(class_)
    
    db.session.add_all(classes)
    db.session.flush()

    # 3. Students - Assign ke berbagai kelas
    students = []
    for i in range(15):
        student = Student(
            nim=10000 + i,
            name=fake.name(),
            user_id=users[i + 1].id,  # student index 1-15
            class_id=classes[i % len(classes)].id  # Distribusi mahasiswa ke berbagai kelas
        )
        students.append(student)
    
    db.session.add_all(students)
    db.session.flush()

    # 4. Courses - Data mata kuliah yang lebih lengkap
    course_data = [
        {"code": "IF101", "name": "Algoritma dan Pemrograman", "description": "Dasar-dasar algoritma dan pemrograman komputer"},
        {"code": "IF102", "name": "Matematika Diskrit", "description": "Konsep matematika untuk ilmu komputer"},
        {"code": "IF103", "name": "Basis Data", "description": "Perancangan dan implementasi basis data"},
        {"code": "IF104", "name": "Pemrograman Web", "description": "Pengembangan aplikasi berbasis web"},
        {"code": "IF105", "name": "Jaringan Komputer", "description": "Konsep dan implementasi jaringan komputer"},
        {"code": "IF106", "name": "Kecerdasan Buatan", "description": "Dasar-dasar kecerdasan buatan dan machine learning"},
        {"code": "IF107", "name": "Sistem Operasi", "description": "Konsep dan implementasi sistem operasi"},
        {"code": "IF108", "name": "Rekayasa Perangkat Lunak", "description": "Metode pengembangan perangkat lunak"},
        {"code": "IF109", "name": "Keamanan Informasi", "description": "Konsep dan implementasi keamanan informasi"},
        {"code": "IF110", "name": "Pengolahan Citra Digital", "description": "Teknik pengolahan citra digital"},
        {"code": "IF111", "name": "Mobile Programming", "description": "Pengembangan aplikasi mobile"},
        {"code": "IF112", "name": "Data Mining", "description": "Teknik penggalian data"}
    ]
    
    courses = []
    for course_info in course_data:
        course = Course(
            code=course_info["code"],
            name=course_info["name"],
            description=course_info["description"]
        )
        courses.append(course)
    
    db.session.add_all(courses)
    db.session.flush()

    # 5. Lecturers - Data dosen yang lebih lengkap dengan nama Indonesia
    lecturer_data = [
        "Budi Santoso, M.Kom.",
        "Dewi Lestari, Ph.D.",
        "Agus Wijaya, M.Sc.",
        "Siti Rahayu, M.T.",
        "Hendra Gunawan, Ph.D.",
        "Rina Marlina, M.Kom.",
        "Joko Susilo, M.Eng.",
        "Maya Indah, Ph.D.",
        "Andi Kurniawan, M.T.",
        "Ratna Sari, M.Kom.",
        "Bambang Hermanto, Ph.D.",
        "Indra Kusuma, M.Sc.",
        "Lia Amalia, M.T.",
        "Dian Permata, Ph.D.",
        "Surya Darma, M.Kom."
    ]
    
    lecturers = []
    for i, name in enumerate(lecturer_data):
        # Extract the main name without titles and qualifications for better photo generation
        clean_name = name.replace('Dr.', '').replace('Prof.', '').replace('M.Kom.', '')
        clean_name = clean_name.replace('M.T.', '').replace('M.Sc.', '').replace('M.Eng.', '')
        clean_name = clean_name.replace('Ph.D.', '').replace(',', '').strip()
        
        # Get first and last name for the photo
        name_parts = clean_name.split()
        if len(name_parts) >= 2:
            photo_name = f"{name_parts[0]}+{name_parts[-1]}"
        else:
            photo_name = clean_name.replace(' ', '+')
            
        lecturer = Lecturer(
            nidn=2000 + i,
            name=name,
            photo_url=f"/uploads/lecturers/{photo_name}.jpg"
        )
        lecturers.append(lecturer)
    
    db.session.add_all(lecturers)
    db.session.flush()

    # 6. Assign Class ↔ Lecturer ↔ Course (ClassLecturer)
    class_lecturers = []
    for i in range(len(classes)):
        # Setiap kelas memiliki beberapa dosen pengajar
        for j in range(3):  # Setiap kelas memiliki 3 dosen pengajar
            lecturer_index = (i + j) % len(lecturers)
            course_index = (i + j) % len(courses)
            
            cl = ClassLecturer(
                class_id=classes[i].id,
                lecturer_id=lecturers[lecturer_index].nidn,
                course_id=courses[course_index].id,
                semester=classes[i].semester,
                academic_year=classes[i].academic_year
            )
            class_lecturers.append(cl)
    
    db.session.add_all(class_lecturers)
    db.session.flush()

    # 7. Questions - Pertanyaan evaluasi yang lebih lengkap
    question_texts = [
        "Apakah dosen menjelaskan materi dengan jelas?",
        "Apakah dosen datang tepat waktu?",
        "Apakah dosen menjawab pertanyaan dengan baik?",
        "Apakah materi yang diajarkan relevan dengan topik?",
        "Apakah dosen menggunakan metode pembelajaran yang efektif?"
    ]
    
    questions = []
    for text in question_texts:
        q = Question(text=text)
        questions.append(q)
    
    db.session.add_all(questions)
    db.session.flush()

    # 8. Answers - Pilihan jawaban yang lebih lengkap
    answer_choices = [
        ("ya", 20),
        ("sering", 15),
        ("jarang", 10),
        ("tidak", 0)
    ]
    
    answers = []
    for text, points in answer_choices:
        a = Answer(text=text, points=points)
        answers.append(a)
    
    db.session.add_all(answers)
    db.session.flush()

    # 9. Evaluations - Menambahkan data evaluasi dosen oleh mahasiswa
    evaluations = []
    now = datetime.now()
    
    # Membuat evaluasi untuk berbagai periode waktu
    for student in students:
        # Evaluasi untuk setiap ClassLecturer yang terkait dengan kelas mahasiswa
        relevant_cls = [cl for cl in class_lecturers if cl.class_id == student.class_id]
        
        for cl in relevant_cls:
            # Beberapa evaluasi dari waktu yang berbeda
            for days_ago in [0, 7, 30, 90, 180]:
                eval_date = now - timedelta(days=days_ago)
                
                # Skor acak untuk setiap pertanyaan
                total_score = 0
                for question in questions:
                    # Pilih jawaban acak
                    answer_index = random.randint(0, len(answers) - 1)
                    answer = answers[answer_index]
                    
                    # Tambahkan skor dari jawaban
                    total_score += answer.points
                
                # Hitung skor rata-rata (maksimal 100)
                avg_score = min(100, (total_score / (len(questions) * 20)) * 100)
                
                # Buat evaluasi
                evaluation = Evaluation(
                    student_id=student.nim,
                    lecturer_id=cl.lecturer_id,
                    course_id=cl.course_id,
                    class_id=cl.class_id,
                    score=avg_score,
                    created_at=eval_date
                )
                evaluations.append(evaluation)
    
    db.session.add_all(evaluations)
    db.session.flush()

    # 10. LecturerScore - Hitung dan simpan skor rata-rata dosen
    for lecturer in lecturers:
        # Ambil semua evaluasi untuk dosen ini
        lecturer_evals = [e for e in evaluations if e.lecturer_id == lecturer.nidn]
        
        if lecturer_evals:
            # Hitung skor rata-rata
            total_score = sum(e.score for e in lecturer_evals)
            avg_score = total_score / len(lecturer_evals)
            
            # Simpan skor
            lecturer_score = LecturerScore(
                lecturer_id=lecturer.nidn,
                average_score=avg_score,
                score_count=len(lecturer_evals)
            )
            db.session.add(lecturer_score)

    db.session.commit()
    print("✅ Seed data created successfully.")
