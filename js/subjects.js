/* ============================================
   APNA SCHOOL - Subject Management Module
   Dynamic subject CRUD with faculty assignment
   ============================================ */

let subjects = [];
let assignments = [];
let assessments = [];
let faculty = [];
let classes = [];
let sections = [];
let currentYear = null;

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireRole(['admin', 'faculty', 'developer'])) return;
    await loadAllData();
});

async function loadAllData() {
    await DB.ready();

    // Get or create current academic year
    currentYear = await DB.getCurrentAcademicYear();
    if (!currentYear) {
        currentYear = await DB.add('academicYears', {
            year: '2024-25',
            name: 'Academic Year 2024-25',
            startDate: '2024-04-01',
            endDate: '2025-03-31',
            isCurrent: true
        });
    }

    // Load all data
    subjects = await DB.getAll('subjects');
    assignments = await DB.getAll('subjectAssignments');
    assessments = await DB.getAll('assessmentTypes');
    faculty = await DB.getAll('faculty');

    // Load or create default classes
    classes = await DB.getAll('classes');
    if (classes.length === 0) {
        const defaultClasses = ['8', '9', '10'].map(grade => ({
            name: `Class ${grade}`,
            grade: parseInt(grade),
            academicYearId: currentYear.id,
            capacity: 40
        }));
        for (const cls of defaultClasses) {
            const newClass = await DB.add('classes', cls);
            classes.push(newClass);
        }
    }

    // Load or create default sections
    sections = await DB.getAll('sections');
    if (sections.length === 0) {
        for (const cls of classes) {
            for (const sec of ['A', 'B']) {
                const newSection = await DB.add('sections', {
                    name: sec,
                    classId: cls.id
                });
                sections.push(newSection);
            }
        }
    }

    updateStats();
    displaySubjects();
    displayAssignments();
    populateDropdowns();
}

function updateStats() {
    document.getElementById('totalSubjects').textContent = subjects.length;
    document.getElementById('totalAssignments').textContent = assignments.length;

    const facultyTeaching = new Set(assignments.map(a => a.facultyId)).size;
    document.getElementById('activeFaculty').textContent = facultyTeaching;
    document.getElementById('totalAssessments').textContent = assessments.length;
}

function switchTab(tab) {
    // Update buttons
    document.getElementById('tabSubjects').className = tab === 'subjects' ? 'btn btn-primary' : 'btn btn-glass';
    document.getElementById('tabAssignments').className = tab === 'assignments' ? 'btn btn-primary' : 'btn btn-glass';
    document.getElementById('tabAssessments').className = tab === 'assessments' ? 'btn btn-primary' : 'btn btn-glass';

    // Update content
    document.getElementById('contentSubjects').style.display = tab === 'subjects' ? 'block' : 'none';
    document.getElementById('contentAssignments').style.display = tab === 'assignments' ? 'block' : 'none';
    document.getElementById('contentAssessments').style.display = tab === 'assessments' ? 'block' : 'none';
}

// ========== SUBJECTS ==========

function displaySubjects(filteredSubjects = null) {
    const list = filteredSubjects || subjects;
    const grid = document.getElementById('subjectsGrid');

    if (list.length === 0) {
        grid.innerHTML = `
      <div class="card" style="grid-column: span 3; text-align: center; padding: var(--space-8);">
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">📚</div>
        <h3>No Subjects Yet</h3>
        <p style="color: #666; margin-bottom: var(--space-4);">Create your first subject to get started.</p>
        <button class="btn btn-primary" onclick="openSubjectModal()">➕ Add Subject</button>
      </div>
    `;
        return;
    }

    grid.innerHTML = list.map(subject => {
        const subjectAssignments = assignments.filter(a => a.subjectId === subject.id);
        const subjectAssessments = assessments.filter(a => a.subjectId === subject.id);

        return `
      <div class="card">
        <div style="display: flex; gap: var(--space-4); margin-bottom: var(--space-4);">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, var(--color-royal-indigo), var(--color-aqua-glow)); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            ${subject.icon || '📚'}
          </div>
          <div>
            <h3 style="margin: 0; font-size: var(--text-lg);">${subject.name}</h3>
            <p style="color: #666; font-size: var(--text-sm);">${subject.code}</p>
          </div>
        </div>
        <p style="color: #666; font-size: var(--text-sm); margin-bottom: var(--space-4);">
          ${subject.description || 'No description provided.'}
        </p>
        <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-4);">
          <span class="badge badge-primary">${subject.credits || 1} Credits</span>
          ${subject.isElective ? '<span class="badge badge-warning">Elective</span>' : '<span class="badge badge-success">Core</span>'}
        </div>
        <div style="display: flex; gap: var(--space-2); font-size: var(--text-sm); color: #666; margin-bottom: var(--space-4);">
          <span>📚 ${subjectAssignments.length} Classes</span>
          <span>📝 ${subjectAssessments.length} Assessments</span>
        </div>
        <div style="display: flex; gap: var(--space-2);">
          <button class="btn btn-sm btn-glass" onclick="editSubject('${subject.id}')">✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSubject('${subject.id}')">🗑️ Delete</button>
        </div>
      </div>
    `;
    }).join('');
}

function filterSubjects() {
    const search = document.getElementById('searchSubject').value.toLowerCase();
    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.code.toLowerCase().includes(search)
    );
    displaySubjects(filtered);
}

function openSubjectModal(isEdit = false) {
    document.getElementById('subjectModal').classList.add('active');
    document.getElementById('subjectModalTitle').textContent = isEdit ? 'Edit Subject' : 'Add Subject';
    if (!isEdit) {
        document.getElementById('subjectForm').reset();
        document.getElementById('subjectId').value = '';
    }
}

function closeSubjectModal() {
    document.getElementById('subjectModal').classList.remove('active');
}

async function editSubject(id) {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;

    document.getElementById('subjectId').value = subject.id;
    document.getElementById('subjectName').value = subject.name;
    document.getElementById('subjectCode').value = subject.code;
    document.getElementById('subjectIcon').value = subject.icon || '📚';
    document.getElementById('subjectDescription').value = subject.description || '';
    document.getElementById('subjectCredits').value = subject.credits || 1;
    document.getElementById('subjectElective').value = subject.isElective ? 'true' : 'false';

    openSubjectModal(true);
}

async function saveSubject(e) {
    e.preventDefault();

    const id = document.getElementById('subjectId').value;
    const isEdit = Boolean(id);
    const user = Auth.currentUser();

    const data = Schema.applyDefaults('subject', {
        id: id || undefined,
        name: document.getElementById('subjectName').value.trim(),
        code: document.getElementById('subjectCode').value.trim().toUpperCase(),
        icon: document.getElementById('subjectIcon').value,
        description: document.getElementById('subjectDescription').value.trim(),
        credits: parseInt(document.getElementById('subjectCredits').value),
        isElective: document.getElementById('subjectElective').value === 'true'
    });

    // Validate
    const validation = Schema.validate('subject', data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'error');
        return;
    }

    try {
        if (isEdit) {
            await DB.update('subjects', data, user?.userId);
            Utils.showToast('Subject updated successfully', 'success');
        } else {
            await DB.add('subjects', data, user?.userId);
            Utils.showToast('Subject created successfully', 'success');
        }

        closeSubjectModal();
        await loadAllData();
    } catch (error) {
        console.error(error);
        Utils.showToast('Error saving subject', 'error');
    }
}

async function deleteSubject(id) {
    const confirm = await Utils.confirm('This will also delete all assignments and assessments for this subject. Continue?', 'Delete Subject');
    if (confirm) {
        const user = Auth.currentUser();

        // Delete related assignments
        const relatedAssignments = assignments.filter(a => a.subjectId === id);
        for (const a of relatedAssignments) {
            await DB.delete('subjectAssignments', a.id, user?.userId);
        }

        // Delete related assessments
        const relatedAssessments = assessments.filter(a => a.subjectId === id);
        for (const a of relatedAssessments) {
            await DB.delete('assessmentTypes', a.id, user?.userId);
        }

        await DB.delete('subjects', id, user?.userId);
        Utils.showToast('Subject deleted', 'success');
        await loadAllData();
    }
}

// ========== ASSIGNMENTS ==========

function displayAssignments() {
    const tbody = document.getElementById('assignmentsTable');

    if (assignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No subject assignments yet. Click "Assign to Class" to create one.</td></tr>';
        return;
    }

    tbody.innerHTML = assignments.map(assignment => {
        const subject = subjects.find(s => s.id === assignment.subjectId);
        const cls = classes.find(c => c.id === assignment.classId);
        const sec = sections.find(s => s.id === assignment.sectionId);
        const fac = faculty.find(f => f.id === assignment.facultyId);

        return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            <span>${subject?.icon || '📚'}</span>
            <strong>${subject?.name || 'Unknown'}</strong>
          </div>
        </td>
        <td>${cls?.name || 'Unknown'}</td>
        <td>${sec?.name || 'All'}</td>
        <td>${fac?.name || 'Unassigned'}</td>
        <td>${currentYear?.year || '-'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteAssignment('${assignment.id}')">🗑️</button>
        </td>
      </tr>
    `;
    }).join('');
}

function populateDropdowns() {
    // Subjects dropdown
    const subjectOptions = '<option value="">Select Subject</option>' +
        subjects.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');

    document.getElementById('assignSubject').innerHTML = subjectOptions;
    document.getElementById('assessmentSubject').innerHTML = subjectOptions;
    document.getElementById('assessmentSubjectFilter').innerHTML = subjectOptions;

    // Classes dropdown
    const classOptions = '<option value="">Select Class</option>' +
        classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('assignClass').innerHTML = classOptions;

    // Faculty dropdown
    const facultyOptions = '<option value="">Select Faculty</option>' +
        faculty.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    document.getElementById('assignFaculty').innerHTML = facultyOptions;
}

function loadSections() {
    const classId = document.getElementById('assignClass').value;
    const classSections = sections.filter(s => s.classId === classId);

    const sectionOptions = '<option value="">All Sections</option>' +
        classSections.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('assignSection').innerHTML = sectionOptions;
}

function openAssignmentModal() {
    document.getElementById('assignmentModal').classList.add('active');
    document.getElementById('assignmentForm').reset();
}

function closeAssignmentModal() {
    document.getElementById('assignmentModal').classList.remove('active');
}

async function saveAssignment(e) {
    e.preventDefault();

    const user = Auth.currentUser();
    const data = {
        subjectId: document.getElementById('assignSubject').value,
        classId: document.getElementById('assignClass').value,
        sectionId: document.getElementById('assignSection').value || null,
        facultyId: document.getElementById('assignFaculty').value,
        academicYearId: currentYear?.id
    };

    // Check for duplicate
    const exists = assignments.some(a =>
        a.subjectId === data.subjectId &&
        a.classId === data.classId &&
        a.sectionId === data.sectionId
    );

    if (exists) {
        Utils.showToast('This subject is already assigned to this class/section', 'warning');
        return;
    }

    try {
        await DB.add('subjectAssignments', data, user?.userId);
        Utils.showToast('Subject assigned successfully', 'success');
        closeAssignmentModal();
        await loadAllData();
    } catch (error) {
        console.error(error);
        Utils.showToast('Error assigning subject', 'error');
    }
}

async function deleteAssignment(id) {
    const confirm = await Utils.confirm('Remove this subject assignment?', 'Remove Assignment');
    if (confirm) {
        await DB.delete('subjectAssignments', id);
        Utils.showToast('Assignment removed', 'success');
        await loadAllData();
    }
}

// ========== ASSESSMENTS ==========

async function loadAssessments() {
    const subjectId = document.getElementById('assessmentSubjectFilter').value;
    const grid = document.getElementById('assessmentsGrid');

    if (!subjectId) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: span 3;">Select a subject to view assessments.</p>';
        return;
    }

    const subjectAssessments = assessments.filter(a => a.subjectId === subjectId);
    const subject = subjects.find(s => s.id === subjectId);

    if (subjectAssessments.length === 0) {
        grid.innerHTML = `
      <div class="card" style="grid-column: span 3; text-align: center; padding: var(--space-8);">
        <div style="font-size: 4rem; margin-bottom: var(--space-4);">📝</div>
        <h3>No Assessments for ${subject?.name}</h3>
        <p style="color: #666; margin-bottom: var(--space-4);">Add assessment types like Unit Tests, Mid-Term, Final Exam.</p>
        <button class="btn btn-primary" onclick="openAssessmentModal()">➕ Add Assessment</button>
      </div>
    `;
        return;
    }

    grid.innerHTML = subjectAssessments.map((assessment, index) => `
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-4);">
        <div>
          <h3 style="margin: 0;">${assessment.name}</h3>
          <p style="color: #666; font-size: var(--text-sm);">${subject?.name}</p>
        </div>
        <span class="badge badge-primary">#${index + 1}</span>
      </div>
      <div class="grid grid-2 gap-2" style="font-size: var(--text-sm); color: #666;">
        <div>📊 Max Marks: <strong>${assessment.maxMarks}</strong></div>
        <div>⚖️ Weightage: <strong>${assessment.weightage || 100}%</strong></div>
        ${assessment.examDate ? `<div style="grid-column: span 2;">📅 Date: ${Utils.formatDate(assessment.examDate)}</div>` : ''}
      </div>
      <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4);">
        <button class="btn btn-sm btn-danger" onclick="deleteAssessment('${assessment.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function openAssessmentModal() {
    document.getElementById('assessmentModal').classList.add('active');
    document.getElementById('assessmentForm').reset();

    // Pre-select subject if filtered
    const selectedSubject = document.getElementById('assessmentSubjectFilter').value;
    if (selectedSubject) {
        document.getElementById('assessmentSubject').value = selectedSubject;
    }
}

function closeAssessmentModal() {
    document.getElementById('assessmentModal').classList.remove('active');
}

async function saveAssessment(e) {
    e.preventDefault();

    const user = Auth.currentUser();
    const data = Schema.applyDefaults('assessmentType', {
        subjectId: document.getElementById('assessmentSubject').value,
        name: document.getElementById('assessmentName').value.trim(),
        maxMarks: parseInt(document.getElementById('assessmentMaxMarks').value),
        weightage: parseInt(document.getElementById('assessmentWeightage').value) || 100,
        examDate: document.getElementById('assessmentDate').value || null,
        academicYearId: currentYear?.id,
        order: assessments.filter(a => a.subjectId === document.getElementById('assessmentSubject').value).length + 1
    });

    const validation = Schema.validate('assessmentType', data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'error');
        return;
    }

    try {
        await DB.add('assessmentTypes', data, user?.userId);
        Utils.showToast('Assessment created successfully', 'success');
        closeAssessmentModal();
        await loadAllData();
        loadAssessments();
    } catch (error) {
        console.error(error);
        Utils.showToast('Error saving assessment', 'error');
    }
}

async function deleteAssessment(id) {
    const confirm = await Utils.confirm('Delete this assessment? This will also remove all marks entered for it.', 'Delete Assessment');
    if (confirm) {
        await DB.delete('assessmentTypes', id);
        Utils.showToast('Assessment deleted', 'success');
        await loadAllData();
        loadAssessments();
    }
}
