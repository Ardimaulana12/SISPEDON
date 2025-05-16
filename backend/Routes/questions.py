from flask import Blueprint, jsonify, request
from App.models import Question, Answer, Evaluation, LecturerScore, EvaluationAnswer, ClassLecturer, Course, db
from flask_jwt_extended import jwt_required, get_jwt_identity

questions_bp = Blueprint('api', __name__)

@questions_bp.route('/api/questions', methods=['GET'])
# @jwt_required()
def get_questions():
    questions = Question.query.limit(5).all()
    answers = Answer.query.all()
    answer_map = [{ 'id': a.id, 'text': a.text } for a in answers]

    result = []
    for q in questions:
        result.append({
            'id': q.id,
            'text': q.text,
            'choices': answer_map
        })
    return jsonify(result)


@questions_bp.route('/api/submit-evaluation', methods=['POST'])
@jwt_required()
def submit_evaluation():
    data = request.get_json()
    student_id = get_jwt_identity()  # diasumsikan payload JWT berisi student_id
    lecturer_id = request.args.get('lecturer_id')  # bisa dari query param
    class_id = request.args.get('class_id')

    # Check if student exists in DB
    # student = Student.query.filter_by(nim=student_id).first()
    # if not student:
    #     return jsonify({'message': 'Student not found'}), 404

    # Get class lecturer information to get course, semester, and academic year
    class_lecturer = ClassLecturer.query.filter_by(
        lecturer_id=lecturer_id,
        class_id=class_id
    ).first()
    
    course_id = None
    semester = None
    academic_year = None
    lecturer_class_id = None
    
    if class_lecturer:
        course_id = class_lecturer.course_id
        semester = class_lecturer.semester
        academic_year = class_lecturer.academic_year
        lecturer_class_id = class_lecturer.id
    
    # Create evaluation record with comment and additional information
    evaluation = Evaluation(
        student_id=student_id, 
        lecturer_id=lecturer_id, 
        class_id=class_id,
        course_id=course_id,
        semester=semester,
        lecturer_class_id=lecturer_class_id,
        comment=data.get('comment', '')
    )
    db.session.add(evaluation)
    db.session.flush()

    # db.session.commit()
    
    # 1. Hitung total poin dari evaluasi ini
    total_points = 0
    answer_count = 0
    
    # Check if answers is a list (new format) or dictionary (old format)
    if isinstance(data['answers'], list):
        # New format: list of objects with question_id and answer_id
        for answer_data in data['answers']:
            question_id = answer_data.get('question_id')
            answer_id = answer_data.get('answer_id')
            
            if question_id and answer_id:
                answer = Answer.query.get(answer_id)
                if answer:
                    total_points += answer.points
                    answer_count += 1
                
                ea = EvaluationAnswer(
                    evaluation_id=evaluation.id,
                    question_id=int(question_id),
                    answer_id=answer_id
                )
                db.session.add(ea)
    else:
        # Old format: dictionary with question_id as key and answer_id as value
        for question_id, answer_id in data['answers'].items():
            answer = Answer.query.get(answer_id)
            if answer:
                total_points += answer.points
                answer_count += 1
            
            ea = EvaluationAnswer(
                evaluation_id=evaluation.id,
                question_id=int(question_id),
                answer_id=answer_id
            )
            db.session.add(ea)
    
    # 2. Hitung rata-rata dan konversi ke persentase
    if answer_count > 0:
        # Get the maximum possible points for each question
        # For example, if the highest point value for any answer is 4.0, use that
        max_point_answer = Answer.query.order_by(Answer.points.desc()).first()
        max_points_per_question = max_point_answer.points if max_point_answer else 1.0
        
        # Calculate score based on the actual maximum points
        max_possible_points = answer_count * max_points_per_question
        average_score = (total_points / max_possible_points) * 100
        
        print(f"Score calculation: {total_points} / ({answer_count} * {max_points_per_question}) * 100 = {average_score}%")
        
        # Ensure score is capped at 100%
        average_score = min(average_score, 100.0)
    else:
        average_score = 0
    
    # Save the score to the evaluation record
    evaluation.score = average_score

    # 3. Update LecturerScore
    existing_score = LecturerScore.query.filter_by(lecturer_id=lecturer_id).first()
    if existing_score:
        # Weighted average update
        total_score_sum = existing_score.average_score * existing_score.score_count
        new_total = total_score_sum + average_score
        existing_score.score_count += 1
        existing_score.average_score = new_total / existing_score.score_count
    else:
        new_score = LecturerScore(
            lecturer_id=lecturer_id,
            average_score=average_score,
            score_count=1
        )
        db.session.add(new_score)

    db.session.commit()
    return jsonify({
        'message': 'Evaluation submitted successfully',
        'evaluation_id': evaluation.id,
        'score': average_score
    })
