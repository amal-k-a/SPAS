from flask import Blueprint, jsonify, request
from database import get_collection
from utils.auth_middleware import token_required
from collections import defaultdict

analytics_bp = Blueprint('analytics', __name__)

def current_owner_id():
    return request.user.get('user_id')

def apply_owner_scope(query=None):
    scoped_query = dict(query or {})
    scoped_query['ownerId'] = current_owner_id()
    return scoped_query

def calculate_average(marks):
    if not marks:
        return 0
    vals = [v for v in marks.values() if isinstance(v, (int, float))]
    return round(sum(vals) / len(vals), 2) if vals else 0

def get_grade(avg):
    if avg >= 90: return 'A+'
    elif avg >= 80: return 'A'
    elif avg >= 70: return 'B'
    elif avg >= 60: return 'C'
    elif avg >= 50: return 'D'
    return 'F'

def get_status(avg, attendance):
    if avg < 40 or attendance < 75:
        return 'At Risk'
    elif avg >= 75 and attendance >= 85:
        return 'Excellent'
    elif avg >= 60:
        return 'Good'
    return 'Average'

@analytics_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard():
    col = get_collection('students')
    students = list(col.find(apply_owner_scope()))
    
    if not students:
        return jsonify({
            'totalStudents': 0,
            'atRisk': 0,
            'classAverage': 0,
            'avgAttendance': 0,
            'gradeDistribution': {},
            'subjectAverages': {},
            'topStudents': [],
            'atRiskStudents': []
        })
    
    averages = []
    grade_dist = defaultdict(int)
    subject_totals = defaultdict(list)
    at_risk = []
    top_students = []
    status_dist = defaultdict(int)

    for s in students:
        avg = calculate_average(s.get('marks', {}))
        attendance = s.get('attendance', 0)
        status = get_status(avg, attendance)
        grade = get_grade(avg)
        
        averages.append(avg)
        grade_dist[grade] += 1
        status_dist[status] += 1
        
        for subj, score in s.get('marks', {}).items():
            if isinstance(score, (int, float)):
                subject_totals[subj].append(score)
        
        entry = {
            '_id': str(s['_id']),
            'name': s['name'],
            'studentId': s['studentId'],
            'average': avg,
            'attendance': attendance,
            'status': status,
            'grade': grade
        }
        
        if status == 'At Risk':
            at_risk.append(entry)
        top_students.append(entry)
    
    top_students.sort(key=lambda x: x['average'], reverse=True)
    class_avg = round(sum(averages) / len(averages), 2) if averages else 0
    avg_attendance = round(sum(s.get('attendance', 0) for s in students) / len(students), 2)
    
    subject_avgs = {
        subj: round(sum(scores) / len(scores), 2)
        for subj, scores in subject_totals.items()
    }
    
    return jsonify({
        'totalStudents': len(students),
        'atRisk': len(at_risk),
        'classAverage': class_avg,
        'avgAttendance': avg_attendance,
        'gradeDistribution': dict(grade_dist),
        'subjectAverages': subject_avgs,
        'statusDistribution': dict(status_dist),
        'topStudents': top_students[:5],
        'atRiskStudents': at_risk[:10]
    })

@analytics_bp.route('/student/<student_id>', methods=['GET'])
@token_required
def student_analytics(student_id):
    col = get_collection('students')
    students = list(col.find(apply_owner_scope()))
    
    from bson import ObjectId
    try:
        s = col.find_one(apply_owner_scope({'_id': ObjectId(student_id)}))
    except:
        s = col.find_one(apply_owner_scope({'studentId': student_id}))
    
    if not s:
        return jsonify({'error': 'Student not found'}), 404
    
    avg = calculate_average(s.get('marks', {}))
    
    # Class averages per subject
    subject_class_avgs = defaultdict(list)
    class_averages = []
    for student in students:
        class_averages.append(calculate_average(student.get('marks', {})))
        for subj, score in student.get('marks', {}).items():
            if isinstance(score, (int, float)):
                subject_class_avgs[subj].append(score)
    
    class_avg = round(sum(class_averages) / len(class_averages), 2) if class_averages else 0
    subject_class_avg = {
        subj: round(sum(scores) / len(scores), 2)
        for subj, scores in subject_class_avgs.items()
    }
    
    # Rank
    sorted_avgs = sorted(class_averages, reverse=True)
    rank = sorted_avgs.index(avg) + 1 if avg in sorted_avgs else len(sorted_avgs)
    
    return jsonify({
        'student': {
            '_id': str(s['_id']),
            'studentId': s['studentId'],
            'name': s['name'],
            'marks': s.get('marks', {}),
            'attendance': s.get('attendance', 0),
            'remarks': s.get('remarks', ''),
            'average': avg,
            'grade': get_grade(avg),
            'status': get_status(avg, s.get('attendance', 0))
        },
        'classAverage': class_avg,
        'subjectClassAverages': subject_class_avg,
        'rank': rank,
        'totalStudents': len(students),
        'percentile': round((1 - rank / len(students)) * 100, 1) if students else 0
    })
