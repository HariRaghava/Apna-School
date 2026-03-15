/* ============================================
   APNA SCHOOL - Marks Card PDF Generator
   Professional marks card with QR verification
   ============================================ */

const MarksCard = {
    // School branding
    schoolName: 'APNA SCHOOL',
    schoolAddress: 'Tumkur, Karnataka, India',
    schoolPhone: '+91 1234567890',
    schoolEmail: 'info@apnaschool.edu.in',
    academicYear: '2024-25',

    // Generate QR code as data URL
    generateQRCode(data, size = 100) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Simple QR-like pattern (for demo - in production use a proper QR library)
        const cellSize = size / 21;
        ctx.fillStyle = '#000';

        // Create a deterministic pattern based on data
        const hash = this.simpleHash(data);

        // Draw position patterns
        this.drawPositionPattern(ctx, 0, 0, cellSize);
        this.drawPositionPattern(ctx, 14, 0, cellSize);
        this.drawPositionPattern(ctx, 0, 14, cellSize);

        // Draw data pattern
        for (let i = 0; i < 21; i++) {
            for (let j = 0; j < 21; j++) {
                if (this.isPositionPattern(i, j)) continue;
                if ((hash[i % hash.length].charCodeAt(0) + j) % 3 === 0) {
                    ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
                }
            }
        }

        return canvas.toDataURL();
    },

    simpleHash(str) {
        let hash = '';
        for (let i = 0; i < str.length; i++) {
            hash += String.fromCharCode((str.charCodeAt(i) * 7 + i) % 94 + 33);
        }
        return hash;
    },

    drawPositionPattern(ctx, x, y, cellSize) {
        // Outer square
        ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
        // White square
        ctx.fillStyle = '#FFF';
        ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        // Inner square
        ctx.fillStyle = '#000';
        ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    },

    isPositionPattern(row, col) {
        return (row < 7 && col < 7) || (row < 7 && col > 13) || (row > 13 && col < 7);
    },

    // Generate verification code
    generateVerificationCode(studentId, year) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `MC-${year.replace('-', '')}-${random}-${timestamp.slice(-4).toUpperCase()}`;
    },

    // Generate marks card HTML
    async generateMarksCardHTML(studentId, academicYearId = null) {
        await DB.ready();

        const student = await DB.get('students', studentId);
        if (!student) throw new Error('Student not found');

        const year = academicYearId ?
            await DB.get('academicYears', academicYearId) :
            await DB.getCurrentAcademicYear();

        const cls = await DB.get('classes', student.classId);
        const section = student.sectionId ? await DB.get('sections', student.sectionId) : null;

        // Get all marks for this student
        const allMarks = await DB.getAll('marks');
        const studentMarks = allMarks.filter(m => m.studentId === studentId);

        // Get subjects and assessments
        const subjects = await DB.getAll('subjects');
        const assessments = await DB.getAll('assessmentTypes');

        // Group marks by subject
        const subjectMarks = {};
        studentMarks.forEach(mark => {
            if (!subjectMarks[mark.subjectId]) {
                subjectMarks[mark.subjectId] = [];
            }
            subjectMarks[mark.subjectId].push(mark);
        });

        // Calculate totals
        let grandTotal = 0;
        let grandMax = 0;
        const subjectRows = [];

        for (const subjectId of Object.keys(subjectMarks)) {
            const subject = subjects.find(s => s.id === subjectId);
            if (!subject) continue;

            const marks = subjectMarks[subjectId];
            let subjectTotal = 0;
            let subjectMax = 0;

            const assessmentCells = [];

            // Get all assessments for this subject
            const subjectAssessments = assessments.filter(a => a.subjectId === subjectId);

            subjectAssessments.forEach(assessment => {
                const mark = marks.find(m => m.assessmentId === assessment.id);
                if (mark) {
                    subjectTotal += mark.marksObtained;
                    subjectMax += assessment.maxMarks;
                    assessmentCells.push({
                        name: assessment.name.substring(0, 8),
                        obtained: mark.marksObtained,
                        max: assessment.maxMarks
                    });
                }
            });

            if (subjectMax > 0) {
                grandTotal += subjectTotal;
                grandMax += subjectMax;

                const percentage = (subjectTotal / subjectMax) * 100;
                const gradeInfo = Schema.calculateGrade(percentage);

                subjectRows.push({
                    subject: subject.name,
                    icon: subject.icon,
                    assessments: assessmentCells,
                    total: subjectTotal,
                    max: subjectMax,
                    percentage: percentage.toFixed(1),
                    grade: gradeInfo.grade,
                    gradeColor: gradeInfo.color,
                    status: gradeInfo.status
                });
            }
        }

        const overallPercentage = grandMax > 0 ? (grandTotal / grandMax) * 100 : 0;
        const overallGrade = Schema.calculateGrade(overallPercentage);
        const verificationCode = this.generateVerificationCode(studentId, year?.year || '2024-25');
        const qrCode = this.generateQRCode(`${this.schoolName}|${student.name}|${verificationCode}`);

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Marks Card - ${student.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: #f5f5f5; 
            padding: 20px;
          }
          .marks-card {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #5A3FFF;
            position: relative;
            overflow: hidden;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(90, 63, 255, 0.05);
            font-weight: bold;
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }
          .content { position: relative; z-index: 1; }
          .header {
            background: linear-gradient(135deg, #5A3FFF, #4DE3FF);
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; font-size: 14px; }
          .title-bar {
            background: #0A0F2C;
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 18px;
            font-weight: bold;
          }
          .student-info {
            display: grid;
            grid-template-columns: 1fr 120px;
            padding: 20px;
            border-bottom: 1px solid #ddd;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-item { font-size: 14px; }
          .info-item label { color: #666; display: block; font-size: 12px; }
          .info-item strong { color: #333; }
          .qr-section { text-align: center; }
          .qr-section img { width: 100px; height: 100px; }
          .qr-section p { font-size: 10px; color: #666; margin-top: 5px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
          th { background: #f0f0f0; font-weight: 600; }
          .subject-name { text-align: left !important; }
          .grade { font-weight: bold; padding: 3px 8px; border-radius: 4px; }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            padding: 20px;
            background: #f9f9f9;
          }
          .summary-item { text-align: center; }
          .summary-item .value { font-size: 24px; font-weight: bold; color: #5A3FFF; }
          .summary-item .label { font-size: 12px; color: #666; }
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 30px 20px;
            margin-top: 20px;
          }
          .signature-box { text-align: center; }
          .signature-line { border-top: 1px solid #333; padding-top: 5px; margin-top: 50px; font-size: 12px; }
          .footer {
            background: #f0f0f0;
            padding: 10px;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          .verification { 
            font-family: monospace; 
            background: #5A3FFF; 
            color: white; 
            padding: 5px 10px; 
            border-radius: 4px;
            display: inline-block;
            margin-top: 10px;
          }
          @media print {
            body { padding: 0; background: white; }
            .marks-card { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="marks-card">
          <div class="watermark">APNA SCHOOL</div>
          <div class="content">
            <div class="header">
              <h1>🎓 ${this.schoolName}</h1>
              <p>${this.schoolAddress} | ${this.schoolPhone}</p>
            </div>
            
            <div class="title-bar">
              MARKS CARD - Academic Year ${year?.year || '2024-25'}
            </div>

            <div class="student-info">
              <div class="info-grid">
                <div class="info-item">
                  <label>Student Name</label>
                  <strong>${student.name}</strong>
                </div>
                <div class="info-item">
                  <label>Roll Number</label>
                  <strong>${student.rollNo}</strong>
                </div>
                <div class="info-item">
                  <label>Class & Section</label>
                  <strong>${cls?.name || '-'} ${section?.name || ''}</strong>
                </div>
                <div class="info-item">
                  <label>Date of Birth</label>
                  <strong>${student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : '-'}</strong>
                </div>
                <div class="info-item">
                  <label>Guardian Name</label>
                  <strong>${student.guardianName || '-'}</strong>
                </div>
                <div class="info-item">
                  <label>Generated On</label>
                  <strong>${new Date().toLocaleDateString('en-IN')}</strong>
                </div>
              </div>
              <div class="qr-section">
                <img src="${qrCode}" alt="QR Code">
                <p>Scan to verify</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="subject-name">Subject</th>
                  <th>Unit 1</th>
                  <th>Mid-Term</th>
                  <th>Unit 2</th>
                  <th>Final</th>
                  <th>Total</th>
                  <th>%</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                ${subjectRows.map(row => `
                  <tr>
                    <td class="subject-name">${row.icon} ${row.subject}</td>
                    ${['Unit 1', 'Mid-Term', 'Unit 2', 'Final'].map(type => {
            const cell = row.assessments.find(a => a.name.includes(type.substring(0, 4)));
            return `<td>${cell ? `${cell.obtained}/${cell.max}` : '-'}</td>`;
        }).join('')}
                    <td><strong>${row.total}/${row.max}</strong></td>
                    <td>${row.percentage}%</td>
                    <td><span class="grade" style="background: ${row.gradeColor}20; color: ${row.gradeColor};">${row.grade}</span></td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td class="subject-name">Grand Total</td>
                  <td colspan="4"></td>
                  <td>${grandTotal}/${grandMax}</td>
                  <td>${overallPercentage.toFixed(1)}%</td>
                  <td><span class="grade" style="background: ${overallGrade.color}20; color: ${overallGrade.color};">${overallGrade.grade}</span></td>
                </tr>
              </tfoot>
            </table>

            <div class="summary">
              <div class="summary-item">
                <div class="value">${grandTotal}</div>
                <div class="label">Marks Obtained</div>
              </div>
              <div class="summary-item">
                <div class="value">${grandMax}</div>
                <div class="label">Maximum Marks</div>
              </div>
              <div class="summary-item">
                <div class="value" style="color: ${overallGrade.color};">${overallPercentage.toFixed(1)}%</div>
                <div class="label">Percentage</div>
              </div>
              <div class="summary-item">
                <div class="value" style="color: ${overallGrade.color};">${overallGrade.grade}</div>
                <div class="label">Overall Grade (${overallGrade.status})</div>
              </div>
            </div>

            <div class="signatures">
              <div class="signature-box">
                <div class="signature-line">Class Teacher</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Examination Controller</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Principal</div>
              </div>
            </div>

            <div class="footer">
              <p>This is a computer-generated marks card. For verification, please contact the school office.</p>
              <div class="verification">${verificationCode}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    },

    // Generate and open marks card
    async generate(studentId, academicYearId = null) {
        try {
            const html = await this.generateMarksCardHTML(studentId, academicYearId);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            return true;
        } catch (error) {
            console.error('Error generating marks card:', error);
            Utils.showToast('Error generating marks card', 'error');
            return false;
        }
    },

    // Print marks card
    async print(studentId, academicYearId = null) {
        const success = await this.generate(studentId, academicYearId);
        if (success) {
            setTimeout(() => {
                const printWindow = window.open('', '_blank');
                printWindow.print();
            }, 500);
        }
    }
};

// Make available globally
window.MarksCard = MarksCard;
