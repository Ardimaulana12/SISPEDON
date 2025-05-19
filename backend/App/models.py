from . import db

# 1. Tabel Users
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' atau 'student'
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    student = db.relationship('Student', uselist=False, back_populates='user')


# 2. Tabel Classes
class Class(db.Model):
    __tablename__ = 'classes'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    semester = db.Column(db.Integer, nullable=False)  # 1-8
    academic_year = db.Column(db.String(9), nullable=False)  # Format: '2024/2025'

    students = db.relationship('Student', back_populates='class_')
    class_lecturers = db.relationship('ClassLecturer', back_populates='class_')


# 3. Tabel Students
class Student(db.Model):
    __tablename__ = 'students'
    nim = db.Column(db.Integer, primary_key=True,nullable=False)
    # nin = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))

    user = db.relationship('User', back_populates='student')
    class_ = db.relationship('Class', back_populates='students')
    evaluations = db.relationship('Evaluation', back_populates='student')


# 4. Tabel Lecturers
class Lecturer(db.Model):
    __tablename__ = 'lecturers'
    nidn = db.Column(db.Integer, primary_key=True,nullable=False)
    name = db.Column(db.String(100), nullable=False)
    photo_url = db.Column(db.String(255), nullable=True)
    # nidn = db.Column(db.String(50), unique=True, nullable=False)

    class_lecturers = db.relationship('ClassLecturer', back_populates='lecturer')
    evaluations = db.relationship('Evaluation', back_populates='lecturer')


# 5. Tabel Courses (Mata Kuliah)
class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    teaching_assignments = db.relationship('ClassLecturer', back_populates='course')


# 6. Tabel ClassLecturers (Teaching assignments: Class ↔ Lecturer ↔ Course ↔ Semester)
class ClassLecturer(db.Model):
    __tablename__ = 'class_lecturers'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturers.nidn'))
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'))
    semester = db.Column(db.Integer, nullable=False)  # 1, 2, 3, etc.
    academic_year = db.Column(db.String(9), nullable=False)  # Format: '2024/2025'

    class_ = db.relationship('Class', back_populates='class_lecturers')
    lecturer = db.relationship('Lecturer', back_populates='class_lecturers')
    course = db.relationship('Course', back_populates='teaching_assignments')


# 7. Tabel Questions
class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    text = db.Column(db.Text, nullable=False)

    evaluation_answers = db.relationship('EvaluationAnswer', back_populates='question')


# 8. Tabel Answers (Pilihan jawaban: Ya, Sering, Jarang, Tidak)
class Answer(db.Model):
    __tablename__ = 'answers'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    text = db.Column(db.String(50), nullable=False)
    points = db.Column(db.Float, nullable=False)

    evaluation_answers = db.relationship('EvaluationAnswer', back_populates='answer')


# 9. Tabel Evaluations (satu penilaian per dosen per mahasiswa per kelas)
class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.nim'))
    lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturers.nidn'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    semester = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, nullable=True)
    score = db.Column(db.Float, nullable=True)  # Overall score for the evaluation
    comment = db.Column(db.Text, nullable=True)  # Student's comment
    
    lecturer_class_id = db.Column(db.Integer, db.ForeignKey('class_lecturers.id'))
    student = db.relationship('Student', back_populates='evaluations')
    lecturer = db.relationship('Lecturer', back_populates='evaluations')
    course = db.relationship('Course', backref='evaluations')
    evaluation_answers = db.relationship('EvaluationAnswer', back_populates='evaluation')


# 10. Tabel EvaluationAnswers (jawaban untuk setiap pertanyaan dalam 1 penilaian)
class EvaluationAnswer(db.Model):
    __tablename__ = 'evaluation_answers'
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    evaluation_id = db.Column(db.Integer, db.ForeignKey('evaluations.id'))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    answer_id = db.Column(db.Integer, db.ForeignKey('answers.id'))

    evaluation = db.relationship('Evaluation', back_populates='evaluation_answers')
    question = db.relationship('Question', back_populates='evaluation_answers')
    answer = db.relationship('Answer', back_populates='evaluation_answers')


# 11. Tabel Optional: Lecturer Score (caching skor rata-rata)
class LecturerScore(db.Model):
    __tablename__ = 'lecturer_scores'
    lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturers.nidn'), primary_key=True)
    average_score = db.Column(db.Float)
    score_count = db.Column(db.Integer)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())


# Function to update lecturer's average score
def update_lecturer_score(lecturer_id):
    """
    Calculate and update the average score for a lecturer based on all evaluations.
    This function is called after an evaluation is submitted or updated.
    
    Args:
        lecturer_id: The ID of the lecturer to update the score for
    """
    from sqlalchemy import func
    
    try:
        # Get all evaluations for this lecturer
        evaluations = Evaluation.query.filter_by(lecturer_id=lecturer_id).all()
        
        if not evaluations:
            print(f"No evaluations found for lecturer {lecturer_id}")
            # If there are no evaluations, set average to 0 but keep existing voter count
            lecturer_score = LecturerScore.query.get(lecturer_id)
            if lecturer_score:
                lecturer_score.average_score = 0
                db.session.commit()
                print(f"Reset score to 0 for lecturer {lecturer_id}, keeping voter count at {lecturer_score.score_count}")
            return True
        
        # Calculate total points and total possible points directly from evaluation answers
        total_points = 0
        total_possible_points = 0
        count = len(evaluations)
        
        # Get max points per question (usually 5)
        max_point_answer = Answer.query.order_by(Answer.points.desc()).first()
        max_points_per_question = max_point_answer.points if max_point_answer else 5.0
        
        # Process all evaluation answers to calculate the total score
        for eval in evaluations:
            # Get all answers for this evaluation
            eval_answers = EvaluationAnswer.query.filter_by(evaluation_id=eval.id).all()
            
            # Calculate points for this evaluation
            eval_points = 0
            answer_count = 0
            
            for ea in eval_answers:
                answer = Answer.query.get(ea.answer_id)
                if answer:
                    eval_points += answer.points
                    answer_count += 1
            
            # Add to totals
            total_points += eval_points
            total_possible_points += (answer_count * max_points_per_question)
        
        # Calculate overall average
        if total_possible_points > 0:
            average = (total_points / total_possible_points) * 100
            # Cap at 100% to prevent unrealistic scores
            average = min(average, 100.0)
        else:
            average = 0
        
        print(f"Calculated average for lecturer {lecturer_id}: {average:.2f}% from {count} evaluations")
        print(f"Total points: {total_points}, Total possible: {total_possible_points}")
        
        # Calculate Bayesian Average
        # First, get global average (C) from all evaluations
        global_avg_query = db.session.query(func.avg(Evaluation.score)).scalar()
        C = global_avg_query if global_avg_query is not None else 0
        
        # Get average number of voters per lecturer (m)
        lecturer_counts = db.session.query(
            Evaluation.lecturer_id,
            func.count(Evaluation.id).label('voter_count')
        ).group_by(Evaluation.lecturer_id).all()
        
        total_lecturers_with_evals = len(lecturer_counts)
        if total_lecturers_with_evals > 0:
            m = sum(count[1] for count in lecturer_counts) / total_lecturers_with_evals
        else:
            m = 0
        
        # Calculate weighted score using Bayesian Average formula
        # weighted_score = (v / (v + m)) * R + (m / (v + m)) * C
        v = count  # Number of voters for this lecturer
        R = average  # Average score for this lecturer
        
        if v + m > 0:  # Avoid division by zero
            weighted_score = (v / (v + m)) * R + (m / (v + m)) * C
        else:
            weighted_score = 0
        
        # print(f"Calculated Bayesian Average for lecturer {lecturer_id}: {weighted_score:.2f}")
        # print(f"v={v}, m={m}, R={R:.2f}, C={C:.2f}")
        
        # Update or create lecturer score record
        lecturer_score = LecturerScore.query.get(lecturer_id)
        if lecturer_score:
            # Update existing record
            lecturer_score.average_score = average
            lecturer_score.score_count = count
            lecturer_score.weighted_score = weighted_score
            # print(f"Updated score for lecturer {lecturer_id} to {average:.2f}%, weighted score: {weighted_score:.2f}, voter count: {count}")
        else:
            # Create new record
            lecturer_score = LecturerScore(
                lecturer_id=lecturer_id,
                average_score=average,
                score_count=count,
                weighted_score=weighted_score
            )
            db.session.add(lecturer_score)
            print(f"Created new score record for lecturer {lecturer_id} with score {average:.2f}%, weighted score: {weighted_score:.2f}, voter count: {count}")
        
        db.session.commit()
        # print(f"Successfully updated leaderboard for lecturer {lecturer_id}: {average:.2f}% from {count} evaluations, weighted score: {weighted_score:.2f}")
        return True
    except Exception as e:
        db.session.rollback()
        # print(f"Error updating lecturer score: {str(e)}")
        return False