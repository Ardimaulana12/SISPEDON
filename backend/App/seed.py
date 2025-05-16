from App import create_app, db
from App.models import User, Student, Class, Lecturer, ClassLecturer, Question, Answer, Evaluation, EvaluationAnswer, LecturerScore
from datetime import datetime
import random

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    # 1. Users
    user1 = User(username='student1', email='student1@example.com', password='hashedpass1', role='student')
    user2 = User(username='admin1', email='admin1@example.com', password='hashedpass2', role='admin')
    db.session.add_all([user1, user2])

    # 2. Classes
    class1 = Class(name='Kelas A')
    class2 = Class(name='Kelas B')
    db.session.add_all([class1, class2])

    # 3. Students
    student1 = Student(nim=101, name='Ali Student', user=user1, class_=class1)
    student2 = Student(nim=102, name='Budi Student', user=None, class_=class2)
    db.session.add_all([student1, student2])

    # 4. Lecturers
    lecturer1 = Lecturer(nidn=201, name='Dosen A')
    lecturer2 = Lecturer(nidn=202, name='Dosen B')
    db.session.add_all([lecturer1, lecturer2])

    # 5. ClassLecturers
    db.session.add_all([
        ClassLecturer(class_=class1, lecturer=lecturer1),
        ClassLecturer(class_=class2, lecturer=lecturer2)
    ])

    # 6. Questions
    question_texts = [
        "Apakah dosen menjelaskan materi dengan jelas?",
        "Apakah dosen datang tepat waktu?",
        "Apakah dosen menjawab pertanyaan dengan baik?",
        "Apakah materi yang diajarkan relevan dengan topik?",
        "Apakah dosen menggunakan metode pembelajaran yang efektif?"
    ]
    questions = [Question(text=text) for text in question_texts]
    db.session.add_all(questions)

    # 7. Answers
    answer_choices = [
        Answer(text='ya', points=20),
        Answer(text='sering', points=15),
        Answer(text='jarang', points=10),
        Answer(text='tidak', points=0)
    ]
    db.session.add_all(answer_choices)

    db.session.flush()  # Supaya id-nya ter-generate

    # 8. Evaluations + 9. EvaluationAnswers
    evaluations = []
    for student in [student1, student2]:
        for lecturer in [lecturer1, lecturer2]:
            eval_obj = Evaluation(student=student, lecturer=lecturer, class_id=student.class_id, created_at=datetime.now())
            db.session.add(eval_obj)
            db.session.flush()  # Supaya eval_obj.id dapat digunakan

            # Jawaban acak untuk setiap pertanyaan
            for question in questions:
                answer = random.choice(answer_choices)
                db.session.add(EvaluationAnswer(evaluation=eval_obj, question=question, answer=answer))

            evaluations.append(eval_obj)

    # 10. Lecturer Scores (optional cache)
    for lecturer in [lecturer1, lecturer2]:
        # Dummy skor rata-rata
        score = LecturerScore(lecturer_id=lecturer.nidn, average_score=random.uniform(10, 20), score_count=2)
        db.session.add(score)

    db.session.commit()
    print("✅ Semua data dummy berhasil di-seed!")
