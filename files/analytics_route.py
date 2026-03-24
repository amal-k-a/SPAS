"""
Updated analytics route with CGPA/SGPA support.
REPLACE your existing: backend/routes/analytics.py
"""

from flask import Blueprint, jsonify
from bson import ObjectId

from database import get_db
from utils.auth_middleware import token_required

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    db = get_db()
    students = list(db.students.find())

    if not students:
        return jsonify({
            'totalStudents': 0,
            'classAverage': 0,
            'avgAttendance': 0,
            'atRisk': 0,
            'avgCgpa': 0,
            'subjectAverages': {},
            'gradeDistribution': {},
            'topStudents': [],
            'atRiskStudents': []
        })

    total = len(students)
    avg_attendance = round(sum(s.get('attendance', 0) for s in students) / total, 1)
    at_risk = sum(1 for s in students if s.get('status') == 'At Risk')

    # Class average (marks-based for backward compat)
    avgs = [s.get('average', 0) for s in students if s.get('average')]
    class_avg = round(sum(avgs) / len(avgs), 1) if avgs else 0

    # Avg CGPA
    cgpas = [s.get('cgpa', 0) for s in students if s.get('cgpa', 0) > 0]
    avg_cgpa = round(sum(cgpas) / len(cgpas), 2) if cgpas else 0

    # Subject averages
    subject_totals = {}
    subject_counts = {}
    for s in students:
        for subj, mark in s.get('marks', {}).items():
            if isinstance(mark, (int, float)):
                subject_totals[subj] = subject_totals.get(subj, 0) + mark
                subject_counts[subj] = subject_counts.get(subj, 0) + 1
    subject_averages = {
        k: round(subject_totals[k] / subject_counts[k], 1)
        for k in subject_totals
    }

    # Grade distribution
    grade_dist = {}
    for s in students:
        g = s.get('grade', 'N/A')
        grade_dist[g] = grade_dist.get(g, 0) + 1

    # Top 5 students
    top_students = sorted(
        [{'_id': str(s['_id']), 'name': s['name'], 'studentId': s['studentId'],
          'average': s.get('average', 0), 'cgpa': s.get('cgpa', 0)}
         for s in students],
        key=lambda x: x['cgpa'] if x['cgpa'] > 0 else x['average'],
        reverse=True
    )[:5]

    # At-risk students
    at_risk_students = [
        {'_id': str(s['_id']), 'name': s['name'], 'studentId': s['studentId'],
         'average': s.get('average', 0), 'attendance': s.get('attendance', 0)}
        for s in students if s.get('status') == 'At Risk'
    ][:5]

    return jsonify({
        'totalStudents': total,
        'classAverage': class_avg,
        'avgAttendance': avg_attendance,
        'atRisk': at_risk,
        'avgCgpa': avg_cgpa,
        'subjectAverages': subject_averages,
        'gradeDistribution': grade_dist,
        'topStudents': top_students,
        'atRiskStudents': at_risk_students
    })


@analytics_bp.route('/student/<student_id>', methods=['GET'])
@token_required
def get_student_analytics(current_user, student_id):
    db = get_db()

    try:
        student = db.students.find_one({'_id': ObjectId(student_id)})
    except Exception:
        return jsonify({'error': 'Invalid ID'}), 400

    if not student:
        return jsonify({'error': 'Student not found'}), 404

    student['_id'] = str(student['_id'])

    all_students = list(db.students.find())
    total = len(all_students)

    # Rank by CGPA if available, else average
    def sort_key(s):
        return s.get('cgpa', 0) if s.get('cgpa', 0) > 0 else s.get('average', 0)

    sorted_students = sorted(all_students, key=sort_key, reverse=True)
    rank = next((i + 1 for i, s in enumerate(sorted_students)
                 if str(s['_id']) == student_id), total)
    percentile = round(((total - rank) / total) * 100) if total > 1 else 100

    # Subject class averages
    subject_class_avgs = {}
    for subj in student.get('marks', {}).keys():
        vals = [s['marks'][subj] for s in all_students
                if subj in s.get('marks', {}) and isinstance(s['marks'][subj], (int, float))]
        subject_class_avgs[subj] = round(sum(vals) / len(vals), 1) if vals else 0

    # SGPA trend for chart
    sgpa_trend = [
        {'semester': s['semesterNumber'], 'sgpa': s['sgpa']}
        for s in student.get('semesters', [])
        if s.get('sgpa', 0) > 0
    ]

    return jsonify({
        'student': student,
        'rank': rank,
        'percentile': percentile,
        'classAverage': round(sum(s.get('average', 0) for s in all_students) / total, 1) if total else 0,
        'subjectClassAverages': subject_class_avgs,
        'sgpaTrend': sgpa_trend
    })
