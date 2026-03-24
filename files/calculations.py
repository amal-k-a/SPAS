"""
Reusable calculation utilities for student performance metrics.
Add this file to: backend/utils/calculations.py
"""

def calculate_percentage(marks, max_marks):
    """Calculate percentage from marks and max marks."""
    try:
        if max_marks <= 0:
            return 0.0
        return round((marks / max_marks) * 100, 2)
    except (TypeError, ZeroDivisionError):
        return 0.0


def calculate_grade(percentage):
    """Calculate grade based on percentage."""
    if percentage >= 90:
        return 'O'
    elif percentage >= 80:
        return 'A+'
    elif percentage >= 70:
        return 'A'
    elif percentage >= 60:
        return 'B+'
    elif percentage >= 50:
        return 'B'
    elif percentage >= 40:
        return 'C'
    else:
        return 'F'


def get_grade_point(grade):
    """Get grade point for a given grade."""
    grade_points = {
        'O': 10,
        'A+': 9,
        'A': 8,
        'B+': 7,
        'B': 6,
        'C': 5,
        'F': 0
    }
    return grade_points.get(grade, 0)


def calculate_subject(subject):
    """
    Calculate derived fields for a single subject.
    Input subject dict must have: marks, max_marks, credit, subject_name, subject_code
    Returns subject with added: percentage, grade, grade_point, result
    """
    marks = subject.get('marks', 0) or 0
    max_marks = subject.get('max_marks', 100) or 100
    credit = subject.get('credit', 0) or 0

    percentage = calculate_percentage(marks, max_marks)
    grade = calculate_grade(percentage)
    grade_point = get_grade_point(grade)
    result = 'Fail' if grade == 'F' else 'Pass'

    return {
        **subject,
        'marks': marks,
        'max_marks': max_marks,
        'credit': credit,
        'percentage': percentage,
        'grade': grade,
        'grade_point': grade_point,
        'result': result
    }


def calculate_semester(semester):
    """
    Calculate all derived fields for a semester.
    Input: semester dict with subjects array
    Returns semester with: calculated subjects, sgpa, totalMarks,
                           totalMaxMarks, percentage, backlogs, subjectsCleared
    """
    subjects_raw = semester.get('subjects', [])

    # Calculate each subject
    subjects = [calculate_subject(s) for s in subjects_raw]

    if not subjects:
        return {
            **semester,
            'subjects': [],
            'sgpa': 0.0,
            'totalMarks': 0,
            'totalMaxMarks': 0,
            'percentage': 0.0,
            'backlogs': 0,
            'subjectsCleared': 0
        }

    # Totals
    total_marks = sum(s['marks'] for s in subjects)
    total_max_marks = sum(s['max_marks'] for s in subjects)
    percentage = calculate_percentage(total_marks, total_max_marks)

    # SGPA
    total_credits = sum(s['credit'] for s in subjects)
    if total_credits > 0:
        weighted_points = sum(s['credit'] * s['grade_point'] for s in subjects)
        sgpa = round(weighted_points / total_credits, 2)
    else:
        sgpa = 0.0

    # Backlogs
    backlogs = sum(1 for s in subjects if s['grade'] == 'F')
    subjects_cleared = len(subjects) - backlogs

    return {
        **semester,
        'subjects': subjects,
        'sgpa': sgpa,
        'totalMarks': total_marks,
        'totalMaxMarks': total_max_marks,
        'percentage': round(percentage, 2),
        'backlogs': backlogs,
        'subjectsCleared': subjects_cleared
    }


def calculate_cgpa(semesters):
    """Calculate CGPA as average of all semester SGPAs."""
    if not semesters:
        return 0.0
    valid_sgpas = [s['sgpa'] for s in semesters if s.get('sgpa', 0) > 0]
    if not valid_sgpas:
        return 0.0
    return round(sum(valid_sgpas) / len(valid_sgpas), 2)


def calculate_overall_stats(semesters):
    """
    Calculate overall student stats across all semesters.
    Returns: cgpa, totalBacklogs, overallPercentage
    """
    if not semesters:
        return {'cgpa': 0.0, 'totalBacklogs': 0, 'overallPercentage': 0.0}

    cgpa = calculate_cgpa(semesters)
    total_backlogs = sum(s.get('backlogs', 0) for s in semesters)

    all_marks = sum(s.get('totalMarks', 0) for s in semesters)
    all_max_marks = sum(s.get('totalMaxMarks', 0) for s in semesters)
    overall_percentage = calculate_percentage(all_marks, all_max_marks)

    return {
        'cgpa': cgpa,
        'totalBacklogs': total_backlogs,
        'overallPercentage': round(overall_percentage, 2)
    }
