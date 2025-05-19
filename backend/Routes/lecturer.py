from flask_jwt_extended import jwt_required, get_jwt,get_jwt_identity
from flask import Blueprint, jsonify, request
from App.models import Lecturer, ClassLecturer, db, Student, LecturerScore, Evaluation, Course, EvaluationAnswer
from sqlalchemy import desc, func
from datetime import datetime, timedelta

lecturer_bp = Blueprint('lecturer', __name__)

# Helper function to update lecturer scores (only average score, no weighted score)
def update_lecturer_scores():
    """Update average scores for all lecturers"""
    try:
        # Get count of evaluations per lecturer and their average scores
        lecturer_data = db.session.query(
            Evaluation.lecturer_id,
            func.avg(Evaluation.score).label('avg_score'),
            func.count(Evaluation.id).label('voter_count')
        ).group_by(Evaluation.lecturer_id).all()
        
        # Update scores for lecturers with evaluations
        for lecturer_id, avg_score, voter_count in lecturer_data:
            # Cap average score at 100%
            average_score = min(100, avg_score) if avg_score is not None else 0
            
            # Update or create LecturerScore record
            lecturer_score = LecturerScore.query.get(lecturer_id)
            if lecturer_score:
                lecturer_score.average_score = average_score
                lecturer_score.score_count = voter_count
            else:
                lecturer_score = LecturerScore(
                    lecturer_id=lecturer_id,
                    average_score=average_score,
                    score_count=voter_count
                )
                db.session.add(lecturer_score)
        
        # For lecturers without evaluations, set average_score to 0
        all_lecturers = Lecturer.query.all()
        for lecturer in all_lecturers:
            if lecturer.nidn not in [ld[0] for ld in lecturer_data]:
                lecturer_score = LecturerScore.query.get(lecturer.nidn)
                if lecturer_score:
                    lecturer_score.average_score = 0
                    lecturer_score.score_count = 0
                else:
                    lecturer_score = LecturerScore(
                        lecturer_id=lecturer.nidn,
                        average_score=0,
                        score_count=0
                    )
                    db.session.add(lecturer_score)
        
        db.session.commit()
        return True
    
    except Exception as e:
        db.session.rollback()
        print(f"Error updating lecturer scores: {str(e)}")
        return False

# just get my lecturers
@lecturer_bp.route('/api/my-lecturers')
@jwt_required()
def get_my_lecturers():
    claims = get_jwt()
    role = claims.get("role")
    student = None
    if role ==  "student":
        student = Student.query.filter_by(nim=get_jwt_identity()).first()
        if not student:
            return jsonify([])
    
    # Update average scores before returning the data
    update_lecturer_scores()
        
    # Jika role adalah student, maka filter berdasarkan class_id mahasiswa
    if student:
        lecturers = db.session.query(
            Lecturer.nidn,
            Lecturer.name,
            ClassLecturer.class_id,
            ClassLecturer.semester,
            ClassLecturer.academic_year,
            Course.name.label('course_name'),
            LecturerScore.average_score,
            LecturerScore.score_count
        ).join(ClassLecturer, Lecturer.nidn == ClassLecturer.lecturer_id) \
        .outerjoin(Course, ClassLecturer.course_id == Course.id) \
        .outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id) \
        .filter(ClassLecturer.class_id == student.class_id) \
        .order_by(LecturerScore.average_score.desc().nullslast()) \
        .all()
    else:
        # Jika bukan student, bisa menampilkan daftar dosen lainnya atau sesuai kebutuhan
        lecturers = db.session.query(
            Lecturer.nidn,
            Lecturer.name,
            ClassLecturer.class_id,
            ClassLecturer.semester,
            ClassLecturer.academic_year,
            Course.name.label('course_name'),
            LecturerScore.average_score,
            LecturerScore.score_count
        ).join(ClassLecturer, Lecturer.nidn == ClassLecturer.lecturer_id) \
        .outerjoin(Course, ClassLecturer.course_id == Course.id) \
        .outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id) \
        .order_by(LecturerScore.average_score.desc().nullslast()) \
        .all()

    # Format hasilnya
    result = [
        {
            'nidn': l.nidn,
            'name': l.name,
            'class_id': l.class_id,
            'semester': l.semester,
            'academic_year': l.academic_year,
            'course_name': l.course_name,
            'average_score': round(l.average_score, 2) if l.average_score is not None else None,
            'voters_count': l.score_count if l.score_count is not None else 0
        }
        for l in lecturers
    ]
    return jsonify(result)

# get all of lecturers
@lecturer_bp.route('/lecturers', methods=['GET'])
@jwt_required()
def get_lecturers():
    claims = get_jwt()
    role = claims.get("role")

    if role not in ['student', 'admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Update average scores before returning the data
    update_lecturer_scores()

    lecturers = db.session.query(
        Lecturer.nidn,
        Lecturer.name,
        Lecturer.photo_url,
        LecturerScore.average_score,
        LecturerScore.score_count
    ).outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id) \
     .order_by(LecturerScore.average_score.desc().nullslast()) \
     .all()

    result = [{
        'nidn': l.nidn,
        'name': l.name,
        'photo_url': l.photo_url,
        'average_score': round(l.average_score, 2) if l.average_score is not None else None,
        'voters_count': l.score_count if l.score_count is not None else 0
    } for l in lecturers]

    return jsonify(result)

# get all of lecturers for all even stranger
@lecturer_bp.route('/lecturers/all', methods=['GET'])
def get_all_lecturers():
    # Update average scores before returning the data
    update_lecturer_scores()

    lecturers = db.session.query(
        Lecturer.nidn,
        Lecturer.name,
        Lecturer.photo_url,
        LecturerScore.average_score,
        LecturerScore.score_count
    ).outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id) \
     .order_by(LecturerScore.average_score.desc().nullslast()) \
     .all()

    result = [{
        'nidn': l.nidn,
        'name': l.name,
        'photo_url': l.photo_url,
        'average_score': round(l.average_score, 2) if l.average_score is not None else None,
        'voters_count': l.score_count if l.score_count is not None else 0
    } for l in lecturers]

    return jsonify(result)
