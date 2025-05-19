from flask_jwt_extended import jwt_required, get_jwt
from flask import Blueprint, jsonify, request
from App.models import Lecturer, LecturerScore, Evaluation, db
from sqlalchemy import desc, func, case, literal
from datetime import datetime, timedelta

leaderboard_bp = Blueprint('leaderboard', __name__)

# Route update-bayesian dihapus karena tidak lagi menggunakan weighted_score

@leaderboard_bp.route('/api/leaderboard/export', methods=['GET'])
@jwt_required()
def export_leaderboard():
    claims = get_jwt()
    role = claims.get("role")

    # Hanya admin yang boleh mengakses fitur ini
    if role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Mendapatkan parameter filter dari query string
    period = request.args.get('period', 'all')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query untuk mendapatkan data dosen
    query = db.session.query(
        Lecturer.nidn,
        Lecturer.name,
        Lecturer.photo_url
    )
    
    # Jika period adalah custom, gunakan start_date dan end_date
    if period == 'custom' and start_date and end_date:
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            # Tambahkan 1 hari ke end_date untuk mencakup seluruh hari
            end_date_obj = end_date_obj + timedelta(days=1)
            
            # Subquery untuk menghitung rata-rata skor dalam rentang tanggal
            score_subquery = db.session.query(
                Evaluation.lecturer_id,
                func.avg(Evaluation.score).label('average_score'),
                func.count(Evaluation.id).label('score_count')
            ).filter(
                Evaluation.created_at >= start_date_obj,
                Evaluation.created_at < end_date_obj
            ).group_by(Evaluation.lecturer_id).subquery()
            
            # Join dengan subquery
            query = query.outerjoin(score_subquery, Lecturer.nidn == score_subquery.c.lecturer_id)
            
            # Select fields dari subquery
            query = query.add_columns(
                score_subquery.c.average_score,
                score_subquery.c.score_count
            )
        except ValueError:
            # Jika format tanggal tidak valid, gunakan data keseluruhan
            query = query.outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id)
            query = query.add_columns(
                LecturerScore.average_score,
                LecturerScore.score_count
            )
    else:
        # Filter berdasarkan periode
        now = datetime.now()
        filter_date = None
        
        if period == 'day':
            filter_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            # Senin minggu ini
            days_since_monday = now.weekday()
            filter_date = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'month':
            # Awal bulan ini
            filter_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == 'year':
            # Awal tahun ini
            filter_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        if filter_date:
            # Subquery untuk menghitung rata-rata skor dalam rentang tanggal
            score_subquery = db.session.query(
                Evaluation.lecturer_id,
                func.avg(Evaluation.score).label('average_score'),
                func.count(Evaluation.id).label('score_count')
            ).filter(
                Evaluation.created_at >= filter_date
            ).group_by(Evaluation.lecturer_id).subquery()
            
            # Join dengan subquery
            query = query.outerjoin(score_subquery, Lecturer.nidn == score_subquery.c.lecturer_id)
            
            # Select fields dari subquery
            query = query.add_columns(
                score_subquery.c.average_score,
                score_subquery.c.score_count
            )
        else:
            # Jika period adalah 'all' atau tidak valid, gunakan data keseluruhan
            query = query.outerjoin(LecturerScore, Lecturer.nidn == LecturerScore.lecturer_id)
            query = query.add_columns(
                LecturerScore.average_score,
                LecturerScore.score_count
            )
    
    # Urutkan berdasarkan average_score
    lecturers = query.order_by(desc('average_score')).all()
    
    # Format hasil
    result = [{
        'nidn': l.nidn,
        'name': l.name,
        'photo_url': l.photo_url if hasattr(l, 'photo_url') else None,
        'average_score': round(l.average_score, 2) if hasattr(l, 'average_score') and l.average_score is not None else None,
        'voters_count': l.score_count if hasattr(l, 'score_count') and l.score_count is not None else 0
    } for l in lecturers]
    
    return jsonify(result)
