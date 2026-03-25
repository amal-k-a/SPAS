from flask import Blueprint, request, jsonify
from database import get_collection
from utils.auth_middleware import token_required
from bson import ObjectId
import pandas as pd
import io
import datetime

students_bp = Blueprint('students', __name__)

def serialize_student(s):
    s['_id'] = str(s['_id'])
    return s

def calculate_average(marks):
    if not marks:
        return 0
    vals = [v for v in marks.values() if isinstance(v, (int, float))]
    return round(sum(vals) / len(vals), 2) if vals else 0

def get_status(avg, attendance):
    if avg < 40 or attendance < 75:
        return 'At Risk'
    elif avg >= 75 and attendance >= 85:
        return 'Excellent'
    elif avg >= 60:
        return 'Good'
    return 'Average'

@students_bp.route('/', methods=['GET'])
@token_required
def get_students():
    col = get_collection('students')
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')
    
    query = {}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'studentId': {'$regex': search, '$options': 'i'}}
        ]
    
    students = list(col.find(query))
    result = []
    for s in students:
        avg = calculate_average(s.get('marks', {}))
        attendance = s.get('attendance', 0)
        status = get_status(avg, attendance)
        if status_filter and status != status_filter:
            continue
        s['average'] = avg
        s['status'] = status
        result.append(serialize_student(s))
    
    return jsonify(result)

@students_bp.route('/<student_id>', methods=['GET'])
@token_required
def get_student(student_id):
    col = get_collection('students')
    try:
        s = col.find_one({'_id': ObjectId(student_id)})
    except:
        s = col.find_one({'studentId': student_id})
    
    if not s:
        return jsonify({'error': 'Student not found'}), 404
    
    avg = calculate_average(s.get('marks', {}))
    s['average'] = avg
    s['status'] = get_status(avg, s.get('attendance', 0))
    return jsonify(serialize_student(s))

@students_bp.route('/', methods=['POST'])
@token_required
def create_student():
    data = request.get_json()
    col = get_collection('students')
    
    # Check duplicate
    if col.find_one({'studentId': data.get('studentId')}):
        return jsonify({'error': 'Student ID already exists'}), 400
    
    student = {
        'studentId': data['studentId'],
        'name': data['name'],
        'marks': data.get('marks', {}),
        'attendance': data.get('attendance', 0),
        'remarks': data.get('remarks', ''),
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }
    result = col.insert_one(student)
    student['_id'] = str(result.inserted_id)
    return jsonify(student), 201

@students_bp.route('/<student_id>', methods=['PUT'])
@token_required
def update_student(student_id):
    data = request.get_json() or {}
    col = get_collection('students')

    update_data = {'updated_at': datetime.datetime.utcnow()}
    for field in ['name', 'marks', 'attendance', 'remarks']:
        if field in data:
            update_data[field] = data[field]

    try:
        col.update_one({'_id': ObjectId(student_id)}, {'$set': update_data})
    except:
        col.update_one({'studentId': student_id}, {'$set': update_data})
    
    return jsonify({'message': 'Updated successfully'})

@students_bp.route('/<student_id>', methods=['DELETE'])
@token_required
def delete_student(student_id):
    col = get_collection('students')
    try:
        col.delete_one({'_id': ObjectId(student_id)})
    except:
        col.delete_one({'studentId': student_id})
    return jsonify({'message': 'Deleted successfully'})

@students_bp.route('/upload', methods=['POST'])
@token_required
def upload_students():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        content = file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        col = get_collection('students')
        inserted = 0
        updated = 0
        errors = []
        
        subject_cols = [c for c in df.columns if c not in ['student_id', 'studentid', 'name', 'attendance', 'remarks']]
        
        for _, row in df.iterrows():
            try:
                student_id = str(row.get('student_id', row.get('studentid', ''))).strip()
                name = str(row.get('name', '')).strip()
                
                if not student_id or not name:
                    errors.append(f"Row missing ID or name: {dict(row)}")
                    continue
                
                marks = {}
                for col_name in subject_cols:
                    val = row.get(col_name)
                    if pd.notna(val):
                        marks[col_name] = float(val)
                
                attendance = float(row.get('attendance', 0)) if pd.notna(row.get('attendance', None)) else 0
                remarks = str(row.get('remarks', '')).strip() if pd.notna(row.get('remarks', None)) else ''
                
                student_data = {
                    'studentId': student_id,
                    'name': name,
                    'marks': marks,
                    'attendance': attendance,
                    'remarks': remarks,
                    'updated_at': datetime.datetime.utcnow()
                }
                
                existing = col.find_one({'studentId': student_id})
                if existing:
                    col.update_one({'studentId': student_id}, {'$set': student_data})
                    updated += 1
                else:
                    student_data['created_at'] = datetime.datetime.utcnow()
                    col.insert_one(student_data)
                    inserted += 1
            except Exception as e:
                errors.append(str(e))
        
        return jsonify({
            'message': f'Upload complete. {inserted} inserted, {updated} updated.',
            'inserted': inserted,
            'updated': updated,
            'errors': errors[:10]
        })
    except Exception as e:
        return jsonify({'error': f'File processing failed: {str(e)}'}), 400
