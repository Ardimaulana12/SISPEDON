from flask import Blueprint, request, jsonify
from App.models import db, Class, Lecturer, ClassLecturer
from flask_jwt_extended import jwt_required
from utils.auth import admin_required

class_bp = Blueprint('class_bp', __name__)

# GET all classes
@class_bp.route('/admin/classes', methods=['GET'])
@admin_required
def get_all_classes(current_user):
    try:
        classes = Class.query.all()
        result = [{
            'id': c.id,
            'name': c.name,
            'semester': c.semester,
            'academic_year': c.academic_year,
            'student_count': len(c.students)
        } for c in classes]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET a specific class with its teaching assignments
@class_bp.route('/admin/classes/<int:class_id>', methods=['GET'])
@admin_required
def get_class(current_user, class_id):
    try:
        class_obj = Class.query.get(class_id)
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
            
        # Get teaching assignments for this class
        teaching_assignments = []
        for cl in class_obj.class_lecturers:
            teaching_assignments.append({
                'id': cl.id,
                'lecturer': {
                    'id': cl.lecturer.nidn,
                    'name': cl.lecturer.name
                },
                'course': {
                    'id': cl.course.id,
                    'name': cl.course.name,
                    'code': cl.course.code
                },
                'semester': cl.semester,
                'academic_year': cl.academic_year
            })
            
        result = {
            'id': class_obj.id,
            'name': class_obj.name,
            'semester': class_obj.semester,
            'academic_year': class_obj.academic_year,
            'student_count': len(class_obj.students),
            'teaching_assignments': teaching_assignments
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CREATE a new class
@class_bp.route('/admin/classes', methods=['POST'])
@admin_required
def create_class(current_user):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'semester', 'academic_year']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Validate semester range
        if not 1 <= int(data['semester']) <= 8:
            return jsonify({'error': 'Semester must be between 1 and 8'}), 400
            
        # Create new class
        new_class = Class(
            name=data['name'],
            semester=data['semester'],
            academic_year=data['academic_year']
        )
        
        db.session.add(new_class)
        db.session.commit()
        
        # If teaching assignments are provided, create them
        if 'teaching_assignments' in data and isinstance(data['teaching_assignments'], list):
            for assignment in data['teaching_assignments']:
                if all(k in assignment for k in ['lecturer_id', 'course_id']):
                    new_assignment = ClassLecturer(
                        class_id=new_class.id,
                        lecturer_id=assignment['lecturer_id'],
                        course_id=assignment['course_id'],
                        semester=data['semester'],  # Use the class semester
                        academic_year=data['academic_year']  # Use the class academic year
                    )
                    db.session.add(new_assignment)
            
            db.session.commit()
        
        return jsonify({
            'message': 'Class created successfully',
            'id': new_class.id,
            'name': new_class.name,
            'semester': new_class.semester,
            'academic_year': new_class.academic_year
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# UPDATE a class
@class_bp.route('/admin/classes/<int:class_id>', methods=['PUT'])
@admin_required
def update_class(current_user, class_id):
    try:
        class_obj = Class.query.get(class_id)
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
            
        data = request.json
        
        # Update fields if provided
        if 'name' in data:
            class_obj.name = data['name']
        if 'semester' in data:
            # Validate semester range
            if not 1 <= int(data['semester']) <= 8:
                return jsonify({'error': 'Semester must be between 1 and 8'}), 400
            class_obj.semester = data['semester']
        if 'academic_year' in data:
            class_obj.academic_year = data['academic_year']
            
        db.session.commit()
        
        # If teaching assignments are provided, update them
        if 'teaching_assignments' in data:
            # First, remove all existing assignments for this class
            ClassLecturer.query.filter_by(class_id=class_id).delete()
            
            # Then add the new ones
            for assignment in data['teaching_assignments']:
                if all(k in assignment for k in ['lecturer_id', 'course_id']):
                    new_assignment = ClassLecturer(
                        class_id=class_id,
                        lecturer_id=assignment['lecturer_id'],
                        course_id=assignment['course_id'],
                        semester=class_obj.semester,
                        academic_year=class_obj.academic_year
                    )
                    db.session.add(new_assignment)
            
            db.session.commit()
        
        return jsonify({
            'message': 'Class updated successfully',
            'id': class_obj.id,
            'name': class_obj.name,
            'semester': class_obj.semester,
            'academic_year': class_obj.academic_year
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# DELETE a class
@class_bp.route('/admin/classes/<int:class_id>', methods=['DELETE'])
@admin_required
def delete_class(current_user, class_id):
    try:
        class_obj = Class.query.get(class_id)
        if not class_obj:
            return jsonify({'error': 'Class not found'}), 404
            
        # Check if class has students
        if class_obj.students:
            return jsonify({'error': 'Cannot delete class with students. Reassign students first.'}), 400
            
        # Delete all teaching assignments for this class
        ClassLecturer.query.filter_by(class_id=class_id).delete()
        
        # Delete the class
        db.session.delete(class_obj)
        db.session.commit()
        
        return jsonify({
            'message': 'Class deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Get classes by semester
@class_bp.route('/classes/semester/<int:semester>', methods=['GET'])
@jwt_required()
def get_classes_by_semester(semester):
    try:
        if not 1 <= semester <= 8:
            return jsonify({'error': 'Semester must be between 1 and 8'}), 400
            
        classes = Class.query.filter_by(semester=semester).all()
        result = [{
            'id': c.id,
            'name': c.name,
            'semester': c.semester,
            'academic_year': c.academic_year
        } for c in classes]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
