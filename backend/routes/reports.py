from flask import Blueprint, jsonify, send_file, request
from database import get_collection
from utils.auth_middleware import token_required
from bson import ObjectId
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics import renderPDF
import io
import datetime

reports_bp = Blueprint('reports', __name__)

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

@reports_bp.route('/student/<student_id>/pdf', methods=['GET'])
@token_required
def generate_pdf(student_id):
    col = get_collection('students')
    try:
        s = col.find_one(apply_owner_scope({'_id': ObjectId(student_id)}))
    except:
        s = col.find_one(apply_owner_scope({'studentId': student_id}))
    
    if not s:
        return jsonify({'error': 'Student not found'}), 404
    
    # Get class data for comparison
    all_students = list(col.find(apply_owner_scope()))
    class_avgs = [calculate_average(st.get('marks', {})) for st in all_students]
    class_avg = round(sum(class_avgs) / len(class_avgs), 2) if class_avgs else 0

    avg = calculate_average(s.get('marks', {}))
    grade = get_grade(avg)
    status = get_status(avg, s.get('attendance', 0))
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, 
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    styles = getSampleStyleSheet()
    PRIMARY = colors.HexColor('#1e40af')
    ACCENT = colors.HexColor('#3b82f6')
    LIGHT_BG = colors.HexColor('#eff6ff')
    
    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=22, textColor=PRIMARY, spaceAfter=4)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                     fontSize=11, textColor=colors.HexColor('#6b7280'), spaceAfter=12)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'],
                                    fontSize=13, textColor=PRIMARY, spaceBefore=16, spaceAfter=8)
    
    story = []
    
    # Header
    story.append(Paragraph("Student Performance Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    story.append(HRFlowable(width='100%', thickness=2, color=PRIMARY))
    story.append(Spacer(1, 12))
    
    # Student Info Table
    info_data = [
        ['Student ID', s.get('studentId', ''), 'Name', s.get('name', '')],
        ['Overall Average', f"{avg}%", 'Grade', grade],
        ['Attendance', f"{s.get('attendance', 0)}%", 'Status', status],
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_BG),
        ('BACKGROUND', (2, 0), (2, -1), LIGHT_BG),
        ('TEXTCOLOR', (0, 0), (0, -1), PRIMARY),
        ('TEXTCOLOR', (2, 0), (2, -1), PRIMARY),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))
    
    # Subject Marks
    story.append(Paragraph("Subject-wise Performance", section_style))
    marks = s.get('marks', {})
    if marks:
        mark_data = [['Subject', 'Score', 'Grade', 'Remarks']]
        for subj, score in marks.items():
            g = get_grade(score)
            remark = 'Excellent' if score >= 80 else 'Good' if score >= 60 else 'Needs Improvement' if score >= 40 else 'Critical'
            mark_data.append([subj.replace('_', ' ').title(), f"{score}%", g, remark])
        
        marks_table = Table(mark_data, colWidths=[2.2*inch, 1.2*inch, 1.2*inch, 2.4*inch])
        marks_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
            ('ALIGN', (1, 0), (2, -1), 'CENTER'),
        ]))
        story.append(marks_table)
    
    story.append(Spacer(1, 16))
    
    # Comparison
    story.append(Paragraph("Performance vs Class Average", section_style))
    compare_data = [
        ['Metric', 'Student', 'Class Average', 'Difference'],
        ['Overall Average', f"{avg}%", f"{class_avg}%", f"{round(avg - class_avg, 2):+}%"],
        ['Attendance', f"{s.get('attendance', 0)}%", '-', '-'],
    ]
    compare_table = Table(compare_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    compare_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(compare_table)
    
    # Remarks
    remarks = s.get('remarks', '').strip()
    if remarks:
        story.append(Spacer(1, 16))
        story.append(Paragraph("Teacher Remarks", section_style))
        remark_style = ParagraphStyle('Remark', parent=styles['Normal'],
                                       fontSize=10, textColor=colors.HexColor('#374151'),
                                       backColor=LIGHT_BG, borderPad=8,
                                       leftIndent=8, rightIndent=8, spaceAfter=4,
                                       borderWidth=1, borderColor=ACCENT)
        story.append(Paragraph(remarks, remark_style))
    
    # Footer
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#d1d5db')))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
                                   fontSize=8, textColor=colors.HexColor('#9ca3af'),
                                   alignment=1)
    story.append(Paragraph("Student Performance Analytics System | Confidential", footer_style))
    
    doc.build(story)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"report_{s.get('studentId', 'student')}.pdf"
    )
