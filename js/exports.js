/* ============================================
   APNA SCHOOL - Data Export Utilities
   CSV, Excel, and PDF export functionality
   ============================================ */

const Exports = {
    // Export data to CSV
    toCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) {
            Utils.showToast('No data to export', 'warning');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    let cell = row[header] ?? '';
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                        cell = `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv');
        Utils.showToast(`Exported ${data.length} records to CSV`, 'success');
    },

    // Export to formatted Excel-compatible CSV
    toExcel(data, filename = 'export.xlsx', sheetName = 'Sheet1') {
        if (!data || data.length === 0) {
            Utils.showToast('No data to export', 'warning');
            return;
        }

        // Create simple Excel XML format
        const headers = Object.keys(data[0]);

        let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheetName}">
<Table>
<Row>`;

        headers.forEach(h => {
            xml += `<Cell><Data ss:Type="String">${this.escapeXml(h)}</Data></Cell>`;
        });
        xml += `</Row>`;

        data.forEach(row => {
            xml += `<Row>`;
            headers.forEach(h => {
                const val = row[h] ?? '';
                const type = typeof val === 'number' ? 'Number' : 'String';
                xml += `<Cell><Data ss:Type="${type}">${this.escapeXml(String(val))}</Data></Cell>`;
            });
            xml += `</Row>`;
        });

        xml += `</Table></Worksheet></Workbook>`;

        this.downloadFile(xml, filename.replace('.xlsx', '.xls'), 'application/vnd.ms-excel');
        Utils.showToast(`Exported ${data.length} records to Excel`, 'success');
    },

    // Export table to PDF
    async toPDF(tableElement, title = 'Export', filename = 'export.pdf') {
        const printWindow = window.open('', '_blank');

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
          h1 { color: #5A3FFF; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
          th { background: #5A3FFF; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #5A3FFF; padding-bottom: 10px; }
          .date { color: #666; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎓 APNA SCHOOL - ${title}</h1>
          <div class="date">Generated: ${new Date().toLocaleString('en-IN')}</div>
        </div>
        ${tableElement.outerHTML}
      </body>
      </html>
    `;

        printWindow.document.write(html);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);

        Utils.showToast('PDF generated - use Print dialog to save', 'success');
    },

    // Download file helper
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Escape XML special characters
    escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    // Export students list
    async exportStudents(format = 'csv') {
        const students = await DB.getAll('students');
        const classes = await DB.getAll('classes');
        const sections = await DB.getAll('sections');

        const data = students.map(s => ({
            'Roll No': s.rollNo,
            'Name': s.name,
            'Class': classes.find(c => c.id === s.classId)?.name || '-',
            'Section': sections.find(sec => sec.id === s.sectionId)?.name || '-',
            'DOB': s.dob,
            'Gender': s.gender,
            'Guardian': s.guardianName,
            'Phone': s.guardianPhone,
            'Email': s.guardianEmail || '-',
            'Status': s.status || 'Active'
        }));

        if (format === 'csv') {
            this.toCSV(data, `students_${Date.now()}.csv`);
        } else {
            this.toExcel(data, `students_${Date.now()}.xlsx`, 'Students');
        }
    },

    // Export faculty list
    async exportFaculty(format = 'csv') {
        const faculty = await DB.getAll('faculty');

        const data = faculty.map(f => ({
            'Name': f.name,
            'Email': f.email,
            'Phone': f.phone,
            'Department': f.department || '-',
            'Designation': f.designation || 'Teacher',
            'Qualification': f.qualification || '-',
            'Joining Date': f.joiningDate || '-',
            'Status': f.status || 'Active'
        }));

        if (format === 'csv') {
            this.toCSV(data, `faculty_${Date.now()}.csv`);
        } else {
            this.toExcel(data, `faculty_${Date.now()}.xlsx`, 'Faculty');
        }
    },

    // Export attendance report
    async exportAttendance(classId, startDate, endDate, format = 'csv') {
        const attendance = await DB.getAll('attendance');
        const students = await DB.getAll('students');

        let filtered = attendance;
        if (classId) filtered = filtered.filter(a => a.classId === classId);
        if (startDate) filtered = filtered.filter(a => a.date >= startDate);
        if (endDate) filtered = filtered.filter(a => a.date <= endDate);

        const data = filtered.map(a => {
            const student = students.find(s => s.id === a.studentId);
            return {
                'Date': a.date,
                'Roll No': student?.rollNo || '-',
                'Student Name': student?.name || 'Unknown',
                'Status': a.status === 'present' ? 'Present' : 'Absent',
                'Marked At': a.markedAt ? new Date(a.markedAt).toLocaleString() : '-'
            };
        });

        if (format === 'csv') {
            this.toCSV(data, `attendance_${Date.now()}.csv`);
        } else {
            this.toExcel(data, `attendance_${Date.now()}.xlsx`, 'Attendance');
        }
    },

    // Export marks report
    async exportMarks(subjectId, assessmentId, format = 'csv') {
        const marks = await DB.getAll('marks');
        const students = await DB.getAll('students');
        const subjects = await DB.getAll('subjects');
        const assessments = await DB.getAll('assessmentTypes');

        let filtered = marks;
        if (subjectId) filtered = filtered.filter(m => m.subjectId === subjectId);
        if (assessmentId) filtered = filtered.filter(m => m.assessmentId === assessmentId);

        const data = filtered.map(m => {
            const student = students.find(s => s.id === m.studentId);
            const subject = subjects.find(s => s.id === m.subjectId);
            const assessment = assessments.find(a => a.id === m.assessmentId);
            const percentage = ((m.marksObtained / m.maxMarks) * 100).toFixed(1);
            const grade = Schema.calculateGrade(parseFloat(percentage));

            return {
                'Roll No': student?.rollNo || '-',
                'Student': student?.name || 'Unknown',
                'Subject': subject?.name || '-',
                'Assessment': assessment?.name || '-',
                'Marks': m.marksObtained,
                'Max Marks': m.maxMarks,
                'Percentage': percentage + '%',
                'Grade': grade.grade,
                'Status': grade.status
            };
        });

        if (format === 'csv') {
            this.toCSV(data, `marks_${Date.now()}.csv`);
        } else {
            this.toExcel(data, `marks_${Date.now()}.xlsx`, 'Marks');
        }
    },

    // Export fees report
    async exportFees(status = null, format = 'csv') {
        const fees = await DB.getAll('fees');
        const students = await DB.getAll('students');

        let filtered = fees;
        if (status) filtered = filtered.filter(f => f.status === status);

        const data = filtered.map(f => {
            const student = students.find(s => s.id === f.studentId);
            return {
                'Roll No': student?.rollNo || '-',
                'Student': student?.name || 'Unknown',
                'Total Amount': f.totalAmount,
                'Paid Amount': f.paidAmount || 0,
                'Balance': f.balance || f.totalAmount,
                'Status': f.status,
                'Due Date': f.dueDate || '-'
            };
        });

        if (format === 'csv') {
            this.toCSV(data, `fees_${Date.now()}.csv`);
        } else {
            this.toExcel(data, `fees_${Date.now()}.xlsx`, 'Fees');
        }
    }
};

// Make available globally
window.Exports = Exports;
