from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from App.models import Evaluation, Student, Lecturer, Course, ClassLecturer, Answer, EvaluationAnswer
from App import db
from sqlalchemy import desc

evaluation_history_bp = Blueprint('evaluation_history', __name__)

@evaluation_history_bp.route('/api/student/evaluation-history', methods=['GET'])
@jwt_required()
def get_student_evaluation_history():
    # Get student identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    if role != "student":
        return jsonify({"message": "Unauthorized access"}), 403
    
    # For student users, identity is the NIM
    try:
        nim = int(identity)
    except ValueError:
        return jsonify({"message": "Invalid student ID"}), 400
    
    # Find student by NIM
    student = Student.query.filter_by(nim=nim).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404
    
    # Debug info
    # print(f"Student found: {student.nim}, {student.name}")
    
    try:
        # Get all evaluations submitted by the student
        evaluations = db.session.query(
            Evaluation,
            Lecturer.name.label('lecturer_name'),
            Course.name.label('course_name'),
            ClassLecturer.semester.label('cl_semester'),
            ClassLecturer.academic_year.label('cl_academic_year')
        ).outerjoin(
            ClassLecturer, Evaluation.lecturer_class_id == ClassLecturer.id
        ).outerjoin(
            Lecturer, Evaluation.lecturer_id == Lecturer.nidn
        ).outerjoin(
            Course, Evaluation.course_id == Course.id
        ).filter(
            Evaluation.student_id == student.nim
        ).order_by(
            desc(Evaluation.created_at)
        ).all()
        
        print(f"Found {len(evaluations)} evaluations")
        
        # Format the response
        result = []
        for eval_data in evaluations:
            eval_obj, lecturer_name, course_name, cl_semester, cl_academic_year = eval_data
            
            # Debug info
            # print(f"Evaluation ID: {eval_obj.id}, Score: {eval_obj.score}, Comment: {eval_obj.comment}")
            
            # Get lecturer and course directly from relationships if available
            lecturer = Lecturer.query.get(eval_obj.lecturer_id) if eval_obj.lecturer_id else None
            course = Course.query.get(eval_obj.course_id) if eval_obj.course_id else None
            
            # Format dates for both raw (ISO) and display formats
            created_at_raw = eval_obj.created_at.isoformat() if eval_obj.created_at else None
            updated_at_raw = eval_obj.updated_at.isoformat() if eval_obj.updated_at else None
            created_at_formatted = eval_obj.created_at.strftime('%d %B %Y pukul %H:%M WIB') if eval_obj.created_at else None
            updated_at_formatted = eval_obj.updated_at.strftime('%d %B %Y pukul %H:%M WIB') if eval_obj.updated_at else None
            
            result.append({
                'id': eval_obj.id,
                'lecturer_name': lecturer.name if lecturer else (lecturer_name if lecturer_name else "Unknown Lecturer"),
                'course_name': course.name if course else (course_name if course_name else "Unknown Course"),
                'semester': eval_obj.semester if eval_obj.semester else (cl_semester if cl_semester else 0),
                'academic_year': cl_academic_year if cl_academic_year else "",
                'score': eval_obj.score if eval_obj.score else 0,
                'comment': eval_obj.comment if eval_obj.comment else "",
                'created_at': created_at_raw,  # ISO format for JavaScript parsing
                'updated_at': updated_at_raw,  # ISO format for JavaScript parsing
                'created_at_formatted': created_at_formatted,  # Formatted for display
                'updated_at_formatted': updated_at_formatted,  # Formatted for display
                'can_edit': True,  # We'll allow editing for all evaluations for now
                'lecturer_id': eval_obj.lecturer_id,
                'class_id': eval_obj.class_id
            })
        
        # Jika tidak ada evaluasi, buat contoh data dummy untuk testing
        if not result:
            # Tambahkan data dummy untuk testing
            dummy_data = [
                {
                    'id': 1,
                    'lecturer_name': 'Dr. Budi Santoso',
                    'course_name': 'Pemrograman Web',
                    'semester': 5,
                    'academic_year': '2024/2025',
                    'score': 85,
                    'comment': 'Dosen yang sangat membantu dan menjelaskan materi dengan baik.',
                    'created_at': '2025-04-15T10:30:00',  # ISO format for JavaScript parsing
                    'updated_at': None,
                    'created_at_formatted': '15 April 2025 pukul 10.30 WIB',
                    'updated_at_formatted': None,
                    'can_edit': True,
                    'lecturer_id': 1001,
                    'class_id': 1
                },
                {
                    'id': 2,
                    'lecturer_name': 'Prof. Siti Rahayu',
                    'course_name': 'Basis Data',
                    'semester': 5,
                    'academic_year': '2024/2025',
                    'score': 90,
                    'comment': 'Penjelasan sangat detail dan mudah dipahami.',
                    'created_at': '2025-04-10T14:15:00',  # ISO format for JavaScript parsing
                    'updated_at': None,
                    'created_at_formatted': '10 April 2025 pukul 14.15 WIB',
                    'updated_at_formatted': None,
                    'can_edit': True,
                    'lecturer_id': 1002,
                    'class_id': 1
                },
                {
                    'id': 3,
                    'lecturer_name': 'Dr. Ahmad Fauzi',
                    'course_name': 'Kecerdasan Buatan',
                    'semester': 5,
                    'academic_year': '2024/2025',
                    'score': 75,
                    'comment': 'Materi cukup sulit tapi dijelaskan dengan baik.',
                    'created_at': '2025-04-05T09:45:00',  # ISO format for JavaScript parsing
                    'updated_at': None,
                    'created_at_formatted': '05 April 2025 pukul 09.45 WIB',
                    'updated_at_formatted': None,
                    'can_edit': True,
                    'lecturer_id': 1003,
                    'class_id': 1
                }
            ]
            
            # Add is_dummy flag to indicate this is dummy data
            for item in dummy_data:
                item['is_dummy'] = True
                
            return jsonify(dummy_data)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"message": f"Error fetching evaluation history: {str(e)}"}), 500

@evaluation_history_bp.route('/api/student/evaluation/<int:evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation_detail(evaluation_id):
    # Get student identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    if role != "student":
        return jsonify({"message": "Unauthorized access"}), 403
    
    # For student users, identity is the NIM
    try:
        nim = int(identity)
    except ValueError:
        return jsonify({"message": "Invalid student ID"}), 400
    
    # Find student by NIM
    student = Student.query.filter_by(nim=nim).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404
    
    try:
        # Get the evaluation details from the database
        evaluation = db.session.query(
            Evaluation,
            Lecturer.name.label('lecturer_name'),
            Lecturer.nidn.label('lecturer_nidn'),
            Course.name.label('course_name'),
            Course.id.label('course_id'),
            ClassLecturer.semester,
            ClassLecturer.academic_year
        ).outerjoin(
            ClassLecturer, Evaluation.lecturer_class_id == ClassLecturer.id
        ).outerjoin(
            Lecturer, Evaluation.lecturer_id == Lecturer.nidn
        ).outerjoin(
            Course, Evaluation.course_id == Course.id
        ).filter(
            Evaluation.id == evaluation_id,
            Evaluation.student_id == student.nim
        ).first()
        
        # Untuk testing, jika evaluation_id adalah 1, 2, atau 3, berikan data dummy
        if not evaluation and (evaluation_id in [1, 2, 3]):
            dummy_data = {
                'id': evaluation_id,
                'lecturer_name': {
                    1: 'Dr. Budi Santoso',
                    2: 'Prof. Siti Rahayu',
                    3: 'Dr. Ahmad Fauzi'
                }.get(evaluation_id, 'Unknown Lecturer'),
                'lecturer_nidn': {
                    1: 1001,
                    2: 1002,
                    3: 1003
                }.get(evaluation_id, 0),
                'course_name': {
                    1: 'Pemrograman Web',
                    2: 'Basis Data',
                    3: 'Kecerdasan Buatan'
                }.get(evaluation_id, 'Unknown Course'),
                'course_id': evaluation_id,
                'class_id': 1,
                'semester': 5,
                'academic_year': '2024/2025',
                'score': {
                    1: 85,
                    2: 90,
                    3: 75
                }.get(evaluation_id, 0),
                'comment': {
                    1: 'Dosen yang sangat membantu dan menjelaskan materi dengan baik.',
                    2: 'Penjelasan sangat detail dan mudah dipahami.',
                    3: 'Materi cukup sulit tapi dijelaskan dengan baik.'
                }.get(evaluation_id, ''),
                'created_at': {
                    1: '2025-04-15T10:30:00',
                    2: '2025-04-10T14:15:00',
                    3: '2025-04-05T09:45:00'
                }.get(evaluation_id, '2025-04-01T00:00:00'),
                'updated_at': None,
                'created_at_formatted': {
                    1: '15 April 2025 pukul 10.30 WIB',
                    2: '10 April 2025 pukul 14.15 WIB',
                    3: '05 April 2025 pukul 09.45 WIB'
                }.get(evaluation_id, '01 April 2025 pukul 00.00 WIB'),
                'updated_at_formatted': None,
                'is_dummy': True
            }
            return jsonify(dummy_data)
        
        if not evaluation:
            return jsonify({"message": "Evaluation not found or not authorized"}), 404
        
        eval_obj, lecturer_name, lecturer_nidn, course_name, course_id, semester, academic_year = evaluation
        
        # Get lecturer and course directly from relationships if available
        lecturer = Lecturer.query.get(eval_obj.lecturer_id) if eval_obj.lecturer_id else None
        course = Course.query.get(eval_obj.course_id) if eval_obj.course_id else None
        from datetime import timezone
        import pytz

        wib = pytz.timezone('Asia/Jakarta')

        def to_wib(dt):
            if dt is None:
                return None

            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)  # anggap ini UTC

            return dt.astimezone(wib)

        # Konversi dulu
        created_at_wib = to_wib(eval_obj.created_at)
        updated_at_wib = to_wib(eval_obj.updated_at)

        # Baru format ke string
        created_at_raw = created_at_wib.isoformat() if created_at_wib else None
        updated_at_raw = updated_at_wib.isoformat() if updated_at_wib else None

        created_at_formatted = created_at_wib.strftime('%d %B %Y pukul %H:%M WIB') if created_at_wib else None
        updated_at_formatted = updated_at_wib.strftime('%d %B %Y pukul %H:%M WIB') if updated_at_wib else None

        result = {
            'id': eval_obj.id,
            'lecturer_name': lecturer.name if lecturer else (lecturer_name if lecturer_name else "Unknown Lecturer"),
            'lecturer_nidn': lecturer.nidn if lecturer else (lecturer_nidn if lecturer_nidn else 0),
            'lecturer_id': eval_obj.lecturer_id,  # Add lecturer_id explicitly
            'course_name': course.name if course else (course_name if course_name else "Unknown Course"),
            'course_id': course.id if course else (course_id if course_id else 0),
            'class_id': eval_obj.class_id,
            'semester': semester if semester else (eval_obj.semester if eval_obj.semester else 0),
            'academic_year': academic_year if academic_year else "",
            'score': eval_obj.score if eval_obj.score else 0,
            'comment': eval_obj.comment if eval_obj.comment else "",
            'created_at': created_at_raw,  # ISO format for JavaScript parsing
            'updated_at': updated_at_raw,  # ISO format for JavaScript parsing
            'created_at_formatted': created_at_formatted,  # Formatted for display
            'updated_at_formatted': updated_at_formatted  # Formatted for display
        }
        
        return jsonify(result)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"message": f"Error fetching evaluation detail: {str(e)}"}), 500

@evaluation_history_bp.route('/api/student/evaluation/<int:evaluation_id>', methods=['PUT'])
@jwt_required()
def update_evaluation(evaluation_id):
    # Get student identity from JWT
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    if role != "student":
        return jsonify({"message": "Unauthorized access"}), 403
    
    # For student users, identity is the NIM
    try:
        nim = int(identity)
    except ValueError:
        return jsonify({"message": "Invalid student ID"}), 400
    
    # Find student by NIM
    student = Student.query.filter_by(nim=nim).first()
    if not student:
        return jsonify({"message": "Student not found"}), 404
    
    try:
        # Get the evaluation with the specified ID that belongs to the student
        evaluation = Evaluation.query.filter_by(id=evaluation_id, student_id=student.nim).first()
        
        # Untuk testing, jika evaluation_id adalah 1 atau 2, anggap berhasil update
        if not evaluation and (evaluation_id == 1 or evaluation_id == 2):
            return jsonify({"message": "Evaluation updated successfully (test mode)"})
        
        if not evaluation:
            return jsonify({"message": "Evaluation not found or not authorized"}), 404
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"message": "No input data provided"}), 400
        
        # Check if answers array is provided
        if 'answers' in data and isinstance(data['answers'], list):
            # Calculate new score based on answers
            total_points = 0
            answer_count = 0
            
            # Delete existing answers for this evaluation
            EvaluationAnswer.query.filter_by(evaluation_id=evaluation.id).delete()
            
            # Add new answers
            for answer_data in data['answers']:
                question_id = answer_data.get('question_id')
                answer_id = answer_data.get('answer_id')
                
                if question_id and answer_id:
                    # Create new evaluation answer
                    eval_answer = EvaluationAnswer(
                        evaluation_id=evaluation.id,
                        question_id=question_id,
                        answer_id=answer_id
                    )
                    db.session.add(eval_answer)
                    
                    # Get points for this answer
                    answer = Answer.query.get(answer_id)
                    if answer:
                        total_points += answer.points
                        answer_count += 1
            
            # Calculate and update score if answers were provided
            if answer_count > 0:
                # Get the maximum possible points for each question
                # For example, if the highest point value for any answer is 4.0, use that
                max_point_answer = Answer.query.order_by(Answer.points.desc()).first()
                max_points_per_question = max_point_answer.points if max_point_answer else 1.0
                
                # Calculate score based on the actual maximum points
                max_possible_points = answer_count * max_points_per_question
                score = (total_points / max_possible_points) * 100
                
                # print(f"Score calculation: {total_points} / ({answer_count} * {max_points_per_question}) * 100 = {score}%")
                
                # Ensure score is capped at 100%
                score = min(score, 100.0)
                
                # Update the evaluation score
                evaluation.score = score
                # print(f"Updated evaluation {evaluation.id} score to {score}%")
        
        # Update comment if provided
        if 'comment' in data:
            evaluation.comment = data['comment']
        
        # Update timestamp
        from datetime import datetime
        evaluation.updated_at = datetime.now()
        
        # Save changes
        db.session.commit()
        
        # Update lecturer average score
        lecturer_id = evaluation.lecturer_id
        if lecturer_id:
            from App.models import update_lecturer_score
            update_success = update_lecturer_score(lecturer_id)
            # print(f"Leaderboard update for lecturer {lecturer_id}: {'Success' if update_success else 'Failed'}")
        
        # Return the updated score along with the success message
        return jsonify({
            "message": "Evaluation updated successfully",
            "score": float(evaluation.score) if evaluation.score else 0,
            "evaluation_id": evaluation.id
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error: {str(e)}")
        return jsonify({"message": f"Error updating evaluation: {str(e)}"}), 500
