"""
Updated students route with multi-semester support.
REPLACE your existing: backend/routes/students.py
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import pandas as pd
import os

from database import get_db
from utils.auth_middleware import token_required
from utils.calculations import (
    calculate_semester,
    calculate_overall_stats
)

students_bp = Blueprint('students', __name__)


def serialize_student(student):
    """Convert MongoDB document to JSON-serializable dict."""
    student['_id'] = str(student['_id'])
    return student


# ─────────────────────────────────────────────
# GET all students (with optional search/filter)
# ─────────────────────────────────────────────
@students_bp.route('/', methods=['GET'])
@token_required
def get_students(current_user):
    db = get_db()
    query = {}

    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()

    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'studentId': {'$regex': search, '$options': 'i'}}
        ]
    if status:
        query['status'] = status

    students = list(db.students.find(query).sort('name', 1))
    return jsonify([serialize_student(s) for s in students])


# ─────────────────────────────────────────────
# GET single student
# ─────────────────────────────────────────────
@students_bp.route('/<student_id>', methods=['GET'])
@token_required
def get_student(current_user, student_id):
    db = get_db()
    try:
        student = db.students.find_one({'_id': ObjectId(student_id)})
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400

    if not student:
        return jsonify({'error': 'Student not found'}), 404

    return jsonify(serialize_student(student))


# ─────────────────────────────────────────────
# POST create student
# ─────────────────────────────────────────────
@students_bp.route('/', methods=['POST'])
@token_required
def create_student(current_user):
    db = get_db()
    data = request.json

    if not data.get('studentId') or not data.get('name'):
        return jsonify({'error': 'studentId and name are required'}), 400

    if db.students.find_one({'studentId': data['studentId']}):
        return jsonify({'error': 'Student ID already exists'}), 400

    # Process semesters if provided
    semesters = data.get('semesters', [])
    processed_semesters = [calculate_semester(sem) for sem in semesters]
    overall = calculate_overall_stats(processed_semesters)

    # Keep backward-compatible marks field too
    marks = data.get('marks', {})
    avg = _calc_average(marks)

    student = {
        'studentId': data['studentId'],
        'name': data['name'],
        'attendance': data.get('attendance', 85),
        'remarks': data.get('remarks', ''),
        'marks': marks,
        'average': avg,
        'grade': _calc_grade_letter(avg),
        'status': _calc_status(avg, data.get('attendance', 85)),
        # Multi-semester fields
        'semesters': processed_semesters,
        'cgpa': overall['cgpa'],
        'totalBacklogs': overall['totalBacklogs'],
        'overallPercentage': overall['overallPercentage'],
        'createdAt': datetime.utcnow()
    }

    result = db.students.insert_one(student)
    student['_id'] = str(result.inserted_id)
    return jsonify(student), 201


# ─────────────────────────────────────────────
# PUT update student
# ─────────────────────────────────────────────
@students_bp.route('/<student_id>', methods=['PUT'])
@token_required
def update_student(current_user, student_id):
    db = get_db()
    data = request.json

    try:
        obj_id = ObjectId(student_id)
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400

    existing = db.students.find_one({'_id': obj_id})
    if not existing:
        return jsonify({'error': 'Student not found'}), 404

    update = {}

    if 'remarks' in data:
        update['remarks'] = data['remarks']
    if 'attendance' in data:
        update['attendance'] = data['attendance']
    if 'marks' in data:
        update['marks'] = data['marks']
        avg = _calc_average(data['marks'])
        update['average'] = avg
        update['grade'] = _calc_grade_letter(avg)
        update['status'] = _calc_status(avg, data.get('attendance', existing.get('attendance', 85)))

    db.students.update_one({'_id': obj_id}, {'$set': update})
    updated = db.students.find_one({'_id': obj_id})
    return jsonify(serialize_student(updated))


# ─────────────────────────────────────────────
# DELETE student
# ─────────────────────────────────────────────
@students_bp.route('/<student_id>', methods=['DELETE'])
@token_required
def delete_student(current_user, student_id):
    db = get_db()
    try:
        result = db.students.delete_one({'_id': ObjectId(student_id)})
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400

    if result.deleted_count == 0:
        return jsonify({'error': 'Student not found'}), 404

    return jsonify({'message': 'Student deleted'})


# ─────────────────────────────────────────────
# POST add/update a semester for a student
# ─────────────────────────────────────────────
@students_bp.route('/<student_id>/semesters', methods=['POST'])
@token_required
def add_semester(current_user, student_id):
    """
    Add or replace a semester for a student.
    Body: { semesterNumber: 1, subjects: [...] }
    """
    db = get_db()
    data = request.json

    try:
        obj_id = ObjectId(student_id)
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400

    student = db.students.find_one({'_id': obj_id})
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    sem_number = data.get('semesterNumber')
    if not sem_number or sem_number < 1 or sem_number > 6:
        return jsonify({'error': 'semesterNumber must be 1–6'}), 400

    # Calculate the new semester
    new_semester = calculate_semester({
        'semesterNumber': sem_number,
        'subjects': data.get('subjects', [])
    })

    # Replace if exists, else append
    semesters = student.get('semesters', [])
    semesters = [s for s in semesters if s.get('semesterNumber') != sem_number]
    semesters.append(new_semester)
    semesters.sort(key=lambda s: s.get('semesterNumber', 0))

    # Recalculate overall stats
    overall = calculate_overall_stats(semesters)

    db.students.update_one({'_id': obj_id}, {'$set': {
        'semesters': semesters,
        'cgpa': overall['cgpa'],
        'totalBacklogs': overall['totalBacklogs'],
        'overallPercentage': overall['overallPercentage']
    }})

    updated = db.students.find_one({'_id': obj_id})
    return jsonify(serialize_student(updated))


# ─────────────────────────────────────────────
# GET all semesters for a student
# ─────────────────────────────────────────────
@students_bp.route('/<student_id>/semesters', methods=['GET'])
@token_required
def get_semesters(current_user, student_id):
    db = get_db()
    try:
        student = db.students.find_one({'_id': ObjectId(student_id)})
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400

    if not student:
        return jsonify({'error': 'Student not found'}), 404

    return jsonify({
        'semesters': student.get('semesters', []),
        'cgpa': student.get('cgpa', 0),
        'totalBacklogs': student.get('totalBacklogs', 0),
        'overallPercentage': student.get('overallPercentage', 0)
    })


# ─────────────────────────────────────────────
# POST upload CSV/Excel
# ─────────────────────────────────────────────
@students_bp.route('/upload', methods=['POST'])
@token_required
def upload_students(current_user):
    db = get_db()

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    filename = file.filename.lower()

    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'error': 'Only CSV and Excel files supported'}), 400
    except Exception as e:
        return jsonify({'error': f'Could not read file: {str(e)}'}), 400

    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    required = {'student_id', 'name'}
    if not required.issubset(set(df.columns)):
        return jsonify({'error': 'File must have student_id and name columns'}), 400

    inserted = 0
    updated = 0
    errors = []

    skip_cols = {'student_id', 'name', 'attendance', 'remarks'}
    subject_cols = [c for c in df.columns if c not in skip_cols]

    for _, row in df.iterrows():
        try:
            student_id = str(row['student_id']).strip()
            name = str(row['name']).strip()

            if not student_id or not name:
                continue

            attendance = float(row['attendance']) if 'attendance' in df.columns and pd.notna(row.get('attendance')) else 85
            remarks = str(row['remarks']).strip() if 'remarks' in df.columns and pd.notna(row.get('remarks')) else ''

            # Build marks dict (backward compat)
            marks = {}
            for col in subject_cols:
                val = row.get(col)
                if pd.notna(val):
                    try:
                        marks[col] = float(val)
                    except (ValueError, TypeError):
                        pass

            avg = _calc_average(marks)
            status = _calc_status(avg, attendance)

            existing = db.students.find_one({'studentId': student_id})

            if existing:
                db.students.update_one(
                    {'studentId': student_id},
                    {'$set': {
                        'name': name,
                        'attendance': attendance,
                        'remarks': remarks,
                        'marks': marks,
                        'average': avg,
                        'grade': _calc_grade_letter(avg),
                        'status': status
                    }}
                )
                updated += 1
            else:
                db.students.insert_one({
                    'studentId': student_id,
                    'name': name,
                    'attendance': attendance,
                    'remarks': remarks,
                    'marks': marks,
                    'average': avg,
                    'grade': _calc_grade_letter(avg),
                    'status': status,
                    'semesters': [],
                    'cgpa': 0.0,
                    'totalBacklogs': 0,
                    'overallPercentage': 0.0,
                    'createdAt': datetime.utcnow()
                })
                inserted += 1

        except Exception as e:
            errors.append(f'Row error: {str(e)}')

    return jsonify({
        'message': f'Upload complete',
        'inserted': inserted,
        'updated': updated,
        'errors': errors
    })


# ─────────────────────────────────────────────
# Helper functions
# ─────────────────────────────────────────────
def _calc_average(marks):
    if not marks:
        return 0
    values = [v for v in marks.values() if isinstance(v, (int, float))]
    return round(sum(values) / len(values), 1) if values else 0


def _calc_grade_letter(avg):
    if avg >= 90: return 'A+'
    if avg >= 80: return 'A'
    if avg >= 70: return 'B'
    if avg >= 60: return 'C'
    if avg >= 50: return 'D'
    return 'F'


def _calc_status(avg, attendance):
    if avg < 40 or attendance < 75:
        return 'At Risk'
    if avg >= 75 and attendance >= 85:
        return 'Excellent'
    if avg >= 60:
        return 'Good'
    return 'Average'
