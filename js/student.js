/* ============================================
   APNA SCHOOL - Student Management Logic
   ============================================ */

let allStudents = [];

async function loadStudents() {
    await DB.ready();
    allStudents = await DB.getAll('students');
    displayStudents(allStudents);
}

function displayStudents(students) {
    const tbody = document.getElementById('studentsTable');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No students found. Click "Add Student" to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
    <tr>
      <td><strong>${student.rollNo}</strong></td>
      <td>
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <div style="width: 36px; height: 36px; background: linear-gradient(135deg, var(--color-royal-indigo), var(--color-aqua-glow)); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${Utils.getInitials(student.name)}
          </div>
          <div>
            <div>${student.name}</div>
            <small style="color: #666;">${student.email || 'No email'}</small>
          </div>
        </div>
      </td>
      <td><span class="badge badge-primary">Class ${student.class}</span></td>
      <td>${student.guardianName}</td>
      <td>${student.guardianPhone}</td>
      <td>
        <div style="display: flex; gap: var(--space-2);">
          <button class="btn btn-sm btn-glass" onclick="editStudent('${student.id}')" title="Edit">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterStudents() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;

    let filtered = allStudents;

    if (search) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.rollNo.toLowerCase().includes(search)
        );
    }

    if (classFilter) {
        filtered = filtered.filter(s => s.class === classFilter);
    }

    displayStudents(filtered);
}

function openModal(isEdit = false) {
    document.getElementById('studentModal').classList.add('active');
    document.getElementById('modalTitle').textContent = isEdit ? 'Edit Student' : 'Add New Student';

    if (!isEdit) {
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
    }
}

function closeModal() {
    document.getElementById('studentModal').classList.remove('active');
    document.getElementById('studentForm').reset();
}

async function editStudent(id) {
    const student = await DB.get('students', id);
    if (!student) {
        Utils.showToast('Student not found', 'error');
        return;
    }

    document.getElementById('studentId').value = student.id;
    document.getElementById('name').value = student.name;
    document.getElementById('rollNo').value = student.rollNo;
    document.getElementById('class').value = student.class;
    document.getElementById('dob').value = student.dob;
    document.getElementById('gender').value = student.gender || 'Male';
    document.getElementById('bloodGroup').value = student.bloodGroup || '';
    document.getElementById('guardianName').value = student.guardianName;
    document.getElementById('guardianPhone').value = student.guardianPhone;
    document.getElementById('email').value = student.email || '';
    document.getElementById('address').value = student.address || '';

    openModal(true);
}

async function saveStudent(e) {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const isEdit = Boolean(id);

    const studentData = {
        id: id || DB.generateId('stu'),
        name: document.getElementById('name').value.trim(),
        rollNo: document.getElementById('rollNo').value.trim(),
        class: document.getElementById('class').value,
        section: document.getElementById('class').value.slice(-1),
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        guardianName: document.getElementById('guardianName').value.trim(),
        guardianPhone: document.getElementById('guardianPhone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim()
    };

    // Validation
    if (!studentData.name || !studentData.rollNo || !studentData.class) {
        Utils.showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        if (isEdit) {
            await DB.update('students', studentData);
            Utils.showToast('Student updated successfully', 'success');
        } else {
            await DB.add('students', studentData);

            // Create student user account
            await Auth.createUser({
                username: studentData.rollNo.toLowerCase(),
                password: 'student123',
                name: studentData.name,
                role: 'student',
                linkedId: studentData.id,
                email: studentData.email
            });

            // Create parent account
            await Auth.createUser({
                username: 'p_' + studentData.rollNo.toLowerCase(),
                password: 'parent123',
                name: studentData.guardianName,
                role: 'parent',
                linkedId: studentData.id
            });

            // Create default fee record
            await DB.add('fees', {
                id: `fee_${studentData.id}`,
                studentId: studentData.id,
                academicYear: '2024-25',
                totalAmount: 24500,
                paidAmount: 0,
                balance: 24500,
                status: 'pending',
                dueDate: '2025-03-31',
                breakdown: [
                    { type: 'Tuition Fee', amount: 15000 },
                    { type: 'Lab Fee', amount: 2000 },
                    { type: 'Library Fee', amount: 1000 },
                    { type: 'Sports Fee', amount: 1500 },
                    { type: 'Annual Fee', amount: 5000 }
                ],
                payments: []
            });

            Utils.showToast('Student added successfully with login credentials', 'success');
        }

        closeModal();
        await loadStudents();
    } catch (error) {
        console.error('Error saving student:', error);
        Utils.showToast('Error saving student', 'error');
    }
}

async function deleteStudent(id) {
    const confirm = await Utils.confirm('Are you sure you want to delete this student? This will also delete their user account and all related records.', 'Delete Student');

    if (confirm) {
        try {
            // Delete student
            await DB.delete('students', id);

            // Delete related user accounts
            const users = await DB.getAll('users');
            for (const user of users) {
                if (user.linkedId === id) {
                    await DB.delete('users', user.id);
                }
            }

            // Delete related fees
            await DB.delete('fees', `fee_${id}`);

            Utils.showToast('Student deleted successfully', 'success');
            await loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            Utils.showToast('Error deleting student', 'error');
        }
    }
}

function exportToPDF() {
    // Simple PDF export using print
    const content = document.querySelector('.table-container').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html>
      <head>
        <title>Student List - APNA SCHOOL</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #5A3FFF; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #5A3FFF; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>🎓 APNA SCHOOL - Student List</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        ${content}
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.print();
}

// Make functions available globally
window.loadStudents = loadStudents;
window.openModal = openModal;
window.closeModal = closeModal;
window.editStudent = editStudent;
window.saveStudent = saveStudent;
window.deleteStudent = deleteStudent;
window.filterStudents = filterStudents;
window.exportToPDF = exportToPDF;
