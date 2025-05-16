from flask_jwt_extended import jwt_required, get_jwt,get_jwt_identity
from flask import Blueprint, jsonify
from App.models import Lecturer, ClassLecturer,db,Student,LecturerScore
from sqlalchemy import desc 

lecturer_bp = Blueprint('lecturer', __name__)
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
        
    # Jika role adalah student, maka filter berdasarkan class_id mahasiswa
    if student:
        lecturers = db.session.query(
            Lecturer.nidn,
            Lecturer.name,
            ClassLecturer.class_id,
            LecturerScore.average_score,
            LecturerScore.score_count
        ).join(ClassLecturer, Lecturer.nidn == ClassLecturer.lecturer_id) \
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
            LecturerScore.average_score,
            LecturerScore.score_count
        ).join(ClassLecturer, Lecturer.nidn == ClassLecturer.lecturer_id) \
        .outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id) \
        .order_by(LecturerScore.average_score.desc().nullslast()) \
        .all()

    # Format hasilnya
    result = [
        {
            'nidn': l.nidn,
            'name': l.name,
            'class_id': l.class_id,
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
