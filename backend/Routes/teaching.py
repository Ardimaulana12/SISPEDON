from flask import Blueprint, request, jsonify
from App.models import db, ClassLecturer, Lecturer, Class, Course, Evaluation, EvaluationAnswer
from flask_jwt_extended import jwt_required
from utils.auth import admin_required

teaching_bp = Blueprint('teaching_bp', __name__)

# GET all teaching assignments
@teaching_bp.route('/admin/teaching-assignments', methods=['GET'])
@admin_required
def get_all_teaching_assignments(current_user):
    try:
        assignments = db.session.query(
            ClassLecturer.id,
            Lecturer.name.label('lecturer_name'),
            Lecturer.nidn.label('lecturer_id'),
            Class.name.label('class_name'),
            Class.id.label('class_id'),
            Course.name.label('course_name'),
            Course.code.label('course_code'),
            Course.id.label('course_id'),
            ClassLecturer.semester,
            ClassLecturer.academic_year
        ).join(
            Lecturer, ClassLecturer.lecturer_id == Lecturer.nidn
        ).join(
            Class, ClassLecturer.class_id == Class.id
        ).join(
            Course, ClassLecturer.course_id == Course.id
        ).all()

        result = [{
            'id': a.id,
            'lecturer': {
                'id': a.lecturer_id,
                'name': a.lecturer_name
            },
            'class': {
                'id': a.class_id,
                'name': a.class_name
            },
            'course': {
                'id': a.course_id,
                'name': a.course_name,
                'code': a.course_code
            },
            'semester': a.semester,
            'academic_year': a.academic_year
        } for a in assignments]

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET teaching assignments for a specific lecturer
@teaching_bp.route('/admin/teaching-assignments/lecturer/<int:nidn>', methods=['GET'])
@admin_required
def get_lecturer_teaching_assignments(current_user, nidn):
    try:
        assignments = db.session.query(
            ClassLecturer.id,
            Lecturer.name.label('lecturer_name'),
            Class.name.label('class_name'),
            Class.id.label('class_id'),
            Course.name.label('course_name'),
            Course.code.label('course_code'),
            Course.id.label('course_id'),
            ClassLecturer.semester,
            ClassLecturer.academic_year
        ).join(
            Lecturer, ClassLecturer.lecturer_id == Lecturer.nidn
        ).join(
            Class, ClassLecturer.class_id == Class.id
        ).join(
            Course, ClassLecturer.course_id == Course.id
        ).filter(
            ClassLecturer.lecturer_id == nidn
        ).all()

        result = [{
            'id': a.id,
            'lecturer_name': a.lecturer_name,
            'class': {
                'id': a.class_id,
                'name': a.class_name
            },
            'course': {
                'id': a.course_id,
                'name': a.course_name,
                'code': a.course_code
            },
            'semester': a.semester,
            'academic_year': a.academic_year
        } for a in assignments]

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET teaching assignments for a specific class
@teaching_bp.route('/admin/teaching-assignments/class/<int:class_id>', methods=['GET'])
@admin_required
def get_class_teaching_assignments(current_user, class_id):
    try:
        assignments = db.session.query(
            ClassLecturer.id,
            Lecturer.name.label('lecturer_name'),
            Lecturer.nidn.label('lecturer_id'),
            Class.name.label('class_name'),
            Course.name.label('course_name'),
            Course.code.label('course_code'),
            Course.id.label('course_id'),
            ClassLecturer.semester,
            ClassLecturer.academic_year
        ).join(
            Lecturer, ClassLecturer.lecturer_id == Lecturer.nidn
        ).join(
            Class, ClassLecturer.class_id == Class.id
        ).join(
            Course, ClassLecturer.course_id == Course.id
        ).filter(
            ClassLecturer.class_id == class_id
        ).all()

        result = [{
            'id': a.id,
            'lecturer': {
                'id': a.lecturer_id,
                'name': a.lecturer_name
            },
            'class_name': a.class_name,
            'course': {
                'id': a.course_id,
                'name': a.course_name,
                'code': a.course_code
            },
            'semester': a.semester,
            'academic_year': a.academic_year
        } for a in assignments]

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CREATE a new teaching assignment
@teaching_bp.route('/admin/teaching-assignments', methods=['POST'])
@admin_required
def create_teaching_assignment(current_user):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['lecturer_id', 'class_id', 'course_id', 'semester', 'academic_year']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if the assignment already exists
        existing = ClassLecturer.query.filter_by(
            lecturer_id=data['lecturer_id'],
            class_id=data['class_id'],
            course_id=data['course_id'],
            semester=data['semester'],
            academic_year=data['academic_year']
        ).first()
        
        if existing:
            return jsonify({'error': 'This teaching assignment already exists'}), 400
        
        # Create new assignment
        new_assignment = ClassLecturer(
            lecturer_id=data['lecturer_id'],
            class_id=data['class_id'],
            course_id=data['course_id'],
            semester=data['semester'],
            academic_year=data['academic_year']
        )
        
        db.session.add(new_assignment)
        db.session.commit()
        
        return jsonify({
            'message': 'Teaching assignment created successfully',
            'id': new_assignment.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# UPDATE a teaching assignment
@teaching_bp.route('/admin/teaching-assignments/<int:assignment_id>', methods=['PUT'])
@admin_required
def update_teaching_assignment(current_user, assignment_id):
    try:
        assignment = ClassLecturer.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Teaching assignment not found'}), 404
        
        data = request.json
        
        # Update fields if provided
        if 'lecturer_id' in data:
            assignment.lecturer_id = data['lecturer_id']
        if 'class_id' in data:
            assignment.class_id = data['class_id']
        if 'course_id' in data:
            assignment.course_id = data['course_id']
        if 'semester' in data:
            assignment.semester = data['semester']
        if 'academic_year' in data:
            assignment.academic_year = data['academic_year']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Teaching assignment updated successfully',
            'id': assignment.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# DELETE a teaching assignment
@teaching_bp.route('/admin/teaching-assignments/<int:assignment_id>', methods=['DELETE'])
@admin_required
def delete_teaching_assignment(current_user, assignment_id):
    try:
        assignment = ClassLecturer.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Teaching assignment not found'}), 404
        
        # Find all evaluations that reference this teaching assignment
        evaluations = Evaluation.query.filter_by(lecturer_class_id=assignment_id).all()
        
        # For each evaluation, delete related evaluation answers first
        for evaluation in evaluations:
            # Delete evaluation answers
            EvaluationAnswer.query.filter_by(evaluation_id=evaluation.id).delete()
        
        # Now delete all evaluations for this teaching assignment
        Evaluation.query.filter_by(lecturer_class_id=assignment_id).delete()
        
        # Now we can safely delete the teaching assignment
        db.session.delete(assignment)
        db.session.commit()
        
        return jsonify({
            'message': 'Teaching assignment deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# GET all courses
@teaching_bp.route('/admin/courses', methods=['GET'])
@admin_required
def get_all_courses(current_user):
    try:
        courses = Course.query.all()
        result = [{
            'id': c.id,
            'code': c.code,
            'name': c.name,
            'description': c.description
        } for c in courses]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET a specific course by ID
@teaching_bp.route('/admin/courses/<int:course_id>', methods=['GET'])
@admin_required
def get_course(current_user, course_id):
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
            
        result = {
            'id': course.id,
            'code': course.code,
            'name': course.name,
            'description': course.description
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CREATE a new course
@teaching_bp.route('/admin/courses', methods=['POST'])
@admin_required
def create_course(current_user):
    try:
        data = request.json
        
        # Validate required fields
        if 'code' not in data or 'name' not in data:
            return jsonify({'error': 'Course code and name are required'}), 400
        
        # Check if course code already exists
        existing = Course.query.filter_by(code=data['code']).first()
        if existing:
            return jsonify({'error': 'Course code already exists'}), 400
        
        # Create new course
        new_course = Course(
            code=data['code'],
            name=data['name'],
            description=data.get('description')
        )
        
        db.session.add(new_course)
        db.session.commit()
        
        return jsonify({
            'message': 'Course created successfully',
            'id': new_course.id,
            'code': new_course.code,
            'name': new_course.name
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# UPDATE a course
@teaching_bp.route('/admin/courses/<int:course_id>', methods=['PUT'])
@admin_required
def update_course(current_user, course_id):
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        data = request.json
        
        # Update fields if provided
        if 'code' in data:
            # Check if new code already exists for another course
            existing = Course.query.filter(Course.code == data['code'], Course.id != course_id).first()
            if existing:
                return jsonify({'error': 'Course code already exists'}), 400
            course.code = data['code']
            
        if 'name' in data:
            course.name = data['name']
        if 'description' in data:
            course.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Course updated successfully',
            'id': course.id,
            'code': course.code,
            'name': course.name
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# DELETE a course
@teaching_bp.route('/admin/courses/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(current_user, course_id):
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({'error': 'Course not found'}), 404
        
        # Check if course is used in any teaching assignments
        assignments = ClassLecturer.query.filter_by(course_id=course_id).first()
        if assignments:
            return jsonify({'error': 'Cannot delete course that is used in teaching assignments'}), 400
        
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({
            'message': 'Course deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
