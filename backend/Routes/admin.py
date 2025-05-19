from flask import Blueprint, request, jsonify, send_file
from App.models import db, User, Student, Class, Lecturer, LecturerScore, Evaluation, EvaluationAnswer
from utils.auth import admin_required, generate_password_hash
import os
from werkzeug.utils import secure_filename
import uuid
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd
from datetime import datetime, timedelta
import tempfile
from sqlalchemy import desc, func, asc

student_bp = Blueprint('student_bp', __name__)
admin_bp = Blueprint('admin_bp', __name__)
class_bp = Blueprint('class_bp', __name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads/lecturers'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Get all classes for dropdown
@student_bp.route('/admin/classes-dropdown', methods=['GET'])
@admin_required
def get_classes_dropdown(current_user):
    try:
        classes = Class.query.order_by(asc(Class.semester), asc(Class.name)).all()
        result = [{
            'id': c.id,
            'name': c.name,
            'semester': c.semester,
            'academic_year': c.academic_year,
            'display_name': f"{c.name} (Semester {c.semester})"
        } for c in classes]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# CREATE student
@student_bp.route('/admin/students', methods=['POST'])
@admin_required
def create_student(current_user):
    data = request.json
    try:
        hashed_password = generate_password_hash(data['password'])
        new_user = User(
            username=data['email'],
            email=data['email'],
            password=hashed_password,
            role='student'
        )
        db.session.add(new_user)
        db.session.flush()

        new_student = Student(
            nim=data['nim'],
            name=data['name'],
            user_id=new_user.id,
            class_id=int(data['class_id'])
        )
        db.session.add(new_student)
        db.session.commit()
        
        # Get the class information
        class_info = Class.query.get(int(data['class_id']))
        class_name = class_info.name if class_info else None
        semester = class_info.semester if class_info else None

        return jsonify({
            'message': 'Student created successfully',
            'student': {
                'nim': new_student.nim,
                'name': new_student.name,
                'email': new_user.email,
                'class_id': new_student.class_id,
                'class_name': class_name,
                'semester': semester
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# READ all students
@student_bp.route('/admin/students', methods=['GET'])
@admin_required
def get_students(current_user):
    students = Student.query.all()
    result = []
    for s in students:
        result.append({
            'nim': s.nim,
            'name': s.name,
            'class': s.class_.name if s.class_ else None,
            'class_id': s.class_id,
            'semester': s.class_.semester if s.class_ else None,
            'email': s.user.email if s.user else None
        })
    return jsonify(result)

# READ single student
@student_bp.route('/admin/students/<int:nim>', methods=['GET'])
@admin_required
def get_student(current_user, nim):
    student = Student.query.get(nim)
    if not student:
        return jsonify({'message': 'Student not found'}), 404
    
    # Get all available classes for dropdown
    classes = Class.query.order_by(asc(Class.semester), asc(Class.name)).all()
    class_options = [{
        'id': c.id,
        'name': c.name,
        'semester': c.semester,
        'academic_year': c.academic_year
    } for c in classes]
    
    return jsonify({
        'nim': student.nim,
        'name': student.name,
        'email': student.user.email if student.user else None,
        'class_id': student.class_id,
        'class_name': student.class_.name if student.class_ else None,
        'semester': student.class_.semester if student.class_ else None,
        'class_options': class_options
    })

# UPDATE student
@student_bp.route('/admin/students/<int:nim>', methods=['PUT'])
@admin_required
def update_student(current_user, nim):
    student = Student.query.get(nim)
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    data = request.json
    try:
        student.name = data.get('name', student.name)
        student.class_id = data.get('class_id', student.class_id)
        if 'email' in data:
            student.user.email = data['email']
            student.user.username = data['email']  # Update username too if email changes
        if 'password' in data:
            student.user.password = generate_password_hash(data['password'])

        db.session.commit()
        
        # Get the class information
        class_info = Class.query.get(student.class_id)
        class_name = class_info.name if class_info else None
        semester = class_info.semester if class_info else None
        
        return jsonify({
            'message': 'Student updated successfully',
            'student': {
                'nim': student.nim,
                'name': student.name,
                'email': student.user.email if student.user else None,
                'class_id': student.class_id,
                'class_name': class_name,
                'semester': semester
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE student
@student_bp.route('/admin/students/<int:nim>', methods=['DELETE'])
@admin_required
def delete_student(current_user, nim):
    student = Student.query.get(nim)
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    try:
        user = student.user
        student_data = {
            'nim': student.nim,
            'name': student.name,
            'email': user.email if user else None
        }
        
        db.session.delete(student)
        if user:
            db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Student deleted successfully',
            'deleted_student': student_data
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# CREATE lecturer
@student_bp.route('/admin/lecturers', methods=['POST'])
@admin_required
def create_lecturer(current_user):
    try:
        data = request.form
        photo = request.files.get('photo')
        
        # Create lecturer
        new_lecturer = Lecturer(
            nidn=data['nidn'],
            name=data['name']
        )

        # Handle photo upload
        if photo and allowed_file(photo.filename):
            filename = secure_filename(f"{uuid.uuid4()}_{photo.filename}")
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            photo_path = os.path.join(UPLOAD_FOLDER, filename)
            photo.save(photo_path)
            new_lecturer.photo_url = f"/uploads/lecturers/{filename}"

        db.session.add(new_lecturer)
        db.session.commit()

        return jsonify({
            'message': 'Lecturer created successfully',
            'lecturer': {
                'nidn': new_lecturer.nidn,
                'name': new_lecturer.name,
                'photo_url': new_lecturer.photo_url
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# READ all lecturers
# @student_bp.route('/lecturers', methods=['GET'])
# @jwt_required()
# def get_lecturers():
#     current_user_id = get_jwt_identity()  # Mendapatkan id user dari JWT
#     current_user = User.query.get(current_user_id)
    
#     if not current_user:
#         return jsonify({'message': 'User not found'}), 404
#     lecturers = Lecturer.query.all()
#     result = []
#     for l in lecturers:
#         result.append({
#             'nidn': l.nidn,
#             'name': l.name,
#             'photo_url': l.photo_url
#         })
#     return jsonify(result)

# READ single lecturer
@student_bp.route('/admin/lecturers/<int:nidn>', methods=['GET'])
@admin_required
def get_lecturer(current_user, nidn):
    lecturer = Lecturer.query.get(nidn)
    if not lecturer:
        return jsonify({'message': 'Lecturer not found'}), 404
    
    return jsonify({
        'nidn': lecturer.nidn,
        'name': lecturer.name,
        'photo_url': lecturer.photo_url
    })

# UPDATE lecturer
@student_bp.route('/admin/lecturers/<int:nidn>', methods=['PUT'])
@admin_required
def update_lecturer(current_user, nidn):
    lecturer = Lecturer.query.get(nidn)
    if not lecturer:
        return jsonify({'message': 'Lecturer not found'}), 404

    try:
        data = request.form
        photo = request.files.get('photo')
        
        lecturer.name = data.get('name', lecturer.name)

        # Handle photo upload
        if photo and allowed_file(photo.filename):
            # Delete old photo if exists
            if lecturer.photo_url:
                old_photo_path = os.path.join('uploads', lecturer.photo_url.lstrip('/'))
                if os.path.exists(old_photo_path):
                    os.remove(old_photo_path)

            filename = secure_filename(f"{uuid.uuid4()}_{photo.filename}")
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            photo_path = os.path.join(UPLOAD_FOLDER, filename)
            photo.save(photo_path)
            lecturer.photo_url = f"/uploads/lecturers/{filename}"

        db.session.commit()
        
        return jsonify({
            'message': 'Lecturer updated successfully',
            'lecturer': {
                'nidn': lecturer.nidn,
                'name': lecturer.name,
                'photo_url': lecturer.photo_url
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# DELETE lecturer
@student_bp.route('/admin/lecturers/<int:nidn>', methods=['DELETE'])
@admin_required
def delete_lecturer(current_user, nidn):
    print(f"===== MULAI PROSES PENGHAPUSAN DOSEN NIDN: {nidn} =====")
    
    # Cek apakah dosen ada
    lecturer = Lecturer.query.get(nidn)
    if not lecturer:
        print(f"Dosen dengan NIDN {nidn} tidak ditemukan")
        return jsonify({'message': 'Dosen tidak ditemukan'}), 404

    try:
        # Simpan data dosen untuk respons
        lecturer_data = {
            'nidn': lecturer.nidn,
            'name': lecturer.name,
            'photo_url': lecturer.photo_url
        }
        
        # Gunakan pendekatan yang sama persis dengan script SQL yang berhasil
        # Jalankan SQL dalam satu transaksi
        
        # Langkah 1: Hapus jawaban evaluasi terkait dosen
        print("Langkah 1: Hapus jawaban evaluasi terkait dosen")
        db.session.execute("""
            DELETE FROM evaluation_answers 
            WHERE evaluation_id IN (
                SELECT id FROM evaluations WHERE lecturer_id = :nidn
            )
        """, {"nidn": nidn})
        db.session.flush()
        
        # Langkah 2: Hapus evaluasi terkait dosen
        print("Langkah 2: Hapus evaluasi terkait dosen")
        db.session.execute("""
            DELETE FROM evaluations 
            WHERE lecturer_id = :nidn
        """, {"nidn": nidn})
        db.session.flush()
        
        # Langkah 3: Hapus skor dosen
        print("Langkah 3: Hapus skor dosen")
        db.session.execute("""
            DELETE FROM lecturer_scores 
            WHERE lecturer_id = :nidn
        """, {"nidn": nidn})
        db.session.flush()
        
        # Langkah 4: Hapus penugasan mengajar
        print("Langkah 4: Hapus penugasan mengajar")
        db.session.execute("""
            DELETE FROM class_lecturers 
            WHERE lecturer_id = :nidn
        """, {"nidn": nidn})
        db.session.flush()
        
        # Langkah 5: Hapus foto dosen jika ada
        if lecturer.photo_url:
            try:
                photo_path = os.path.join('uploads', lecturer.photo_url.lstrip('/'))
                if os.path.exists(photo_path):
                    os.remove(photo_path)
                    print(f"Berhasil menghapus foto dosen: {photo_path}")
            except Exception as e_photo:
                print(f"Error saat menghapus foto dosen: {str(e_photo)}")
                # Lanjutkan meskipun gagal menghapus foto
        
        # Langkah 6: Akhirnya hapus dosen
        print("Langkah 6: Hapus dosen")
        db.session.execute("""
            DELETE FROM lecturers 
            WHERE nidn = :nidn
        """, {"nidn": nidn})
        
        # Commit semua perubahan
        db.session.commit()
        print(f"===== BERHASIL MENGHAPUS DOSEN NIDN: {nidn} =====")
        
        return jsonify({
            'message': 'Dosen berhasil dihapus',
            'deleted_lecturer': lecturer_data
        })
    except Exception as e:
        db.session.rollback()
        # Tampilkan pesan error yang lebih detail untuk debugging
        error_message = str(e)
        error_type = type(e).__name__
        import traceback
        traceback_str = traceback.format_exc()
        print(f"===== ERROR SAAT MENGHAPUS DOSEN NIDN: {nidn} =====")
        print(f"Tipe error: {error_type}")
        print(f"Pesan error: {error_message}")
        print(f"Traceback: {traceback_str}")
        
        # Coba pendekatan alternatif dengan menggunakan connection langsung
        try:
            print("Mencoba pendekatan alternatif dengan connection langsung...")
            # Dapatkan connection langsung ke database
            connection = db.engine.raw_connection()
            cursor = connection.cursor()
            
            # Matikan foreign key constraints sementara
            cursor.execute("SET CONSTRAINTS ALL DEFERRED")
            
            # Jalankan query penghapusan dalam urutan yang sama
            cursor.execute("""
                DELETE FROM evaluation_answers 
                WHERE evaluation_id IN (
                    SELECT id FROM evaluations WHERE lecturer_id = %s
                )
            """, (nidn,))
            
            cursor.execute("DELETE FROM evaluations WHERE lecturer_id = %s", (nidn,))
            cursor.execute("DELETE FROM lecturer_scores WHERE lecturer_id = %s", (nidn,))
            cursor.execute("DELETE FROM class_lecturers WHERE lecturer_id = %s", (nidn,))
            cursor.execute("DELETE FROM lecturers WHERE nidn = %s", (nidn,))
            
            # Commit perubahan
            connection.commit()
            cursor.close()
            connection.close()
            
            print("Berhasil menghapus dosen dengan pendekatan alternatif")
            
            return jsonify({
                'message': 'Dosen berhasil dihapus',
                'deleted_lecturer': lecturer_data
            })
        except Exception as e_alt:
            print(f"Pendekatan alternatif juga gagal: {str(e_alt)}")
            return jsonify({
                'error': f"Gagal menghapus dosen: {error_message}"
            }), 400


# Export leaderboard as XLSX
@admin_bp.route('/admin/export-leaderboard', methods=['GET'])
@admin_required
def export_leaderboard(current_user):
    # Get filter parameter (daily, weekly, monthly, yearly)
    time_filter = request.args.get('filter', 'all')
    
    # Calculate date range based on filter
    now = datetime.now()
    start_date = None
    
    if time_filter == 'daily':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        filter_name = "Daily"
    elif time_filter == 'weekly':
        # Start of the week (Monday)
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        filter_name = "Weekly"
    elif time_filter == 'monthly':
        # Start of the month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        filter_name = "Monthly"
    elif time_filter == 'yearly':
        # Start of the year
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        filter_name = "Yearly"
    else:
        filter_name = "All Time"
    
    # Build the query
    query = db.session.query(
        Lecturer.nidn,
        Lecturer.name,
        func.count(Evaluation.id).label('evaluation_count'),
        func.avg(Evaluation.score).label('average_score')
    ).outerjoin(
        Evaluation, Lecturer.nidn == Evaluation.lecturer_id
    ).group_by(
        Lecturer.nidn, Lecturer.name
    )
    
    # Apply date filter if specified
    if start_date:
        query = query.filter(Evaluation.created_at >= start_date)
    
    # Order by average score
    lecturers_data = query.order_by(desc('average_score')).all()
    
    # Convert to DataFrame
    data = []
    for i, lecturer in enumerate(lecturers_data, 1):
        data.append({
            'Rank': i,
            'NIDN': lecturer.nidn,
            'Name': lecturer.name,
            'Evaluation Count': lecturer.evaluation_count,
            'Average Score': round(lecturer.average_score, 2) if lecturer.average_score else 0
        })
    
    df = pd.DataFrame(data)
    
    # Create a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    temp_file.close()
    
    # Write to Excel
    writer = pd.ExcelWriter(temp_file.name, engine='openpyxl')
    df.to_excel(writer, sheet_name=f'Leaderboard {filter_name}', index=False)
    
    # Adjust column widths
    worksheet = writer.sheets[f'Leaderboard {filter_name}']
    for i, col in enumerate(df.columns):
        max_length = max(df[col].astype(str).map(len).max(), len(col)) + 2
        worksheet.column_dimensions[chr(65 + i)].width = max_length
    
    writer.close()
    
    # Generate filename for download
    timestamp = now.strftime('%Y%m%d_%H%M%S')
    filename = f"leaderboard_{time_filter}_{timestamp}.xlsx"
    
    # Send the file
    return send_file(
        temp_file.name,
        as_attachment=True,
        download_name=filename,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
