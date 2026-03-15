/* ============================================
   APNA SCHOOL - Admin Dashboard Logic
   ============================================ */

const Admin = {
    // Load dashboard statistics
    async loadStats() {
        await DB.ready();

        const stats = {
            students: await DB.count('students'),
            faculty: await DB.count('faculty'),
            users: await DB.count('users'),
            attendance: await DB.count('attendance'),
            marks: await DB.count('marks'),
            fees: await DB.count('fees')
        };

        return stats;
    },

    // Get attendance rate for today
    async getTodayAttendanceRate() {
        const attendance = await DB.getAll('attendance');
        const today = Utils.today();
        const todayRecords = attendance.filter(a => a.date === today);

        if (todayRecords.length === 0) return 0;

        const presentCount = todayRecords.filter(a => a.status === 'present').length;
        return Math.round((presentCount / todayRecords.length) * 100);
    },

    // Get fee collection summary
    async getFeesSummary() {
        const fees = await DB.getAll('fees');

        const summary = {
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            paidCount: 0,
            partialCount: 0,
            pendingCount: 0
        };

        fees.forEach(fee => {
            summary.totalAmount += fee.totalAmount || 0;
            summary.paidAmount += fee.paidAmount || 0;

            if (fee.status === 'paid') summary.paidCount++;
            else if (fee.status === 'partial') summary.partialCount++;
            else summary.pendingCount++;
        });

        summary.pendingAmount = summary.totalAmount - summary.paidAmount;
        return summary;
    },

    // Get class-wise student count
    async getClassWiseStats() {
        const students = await DB.getAll('students');
        const classMap = {};

        students.forEach(student => {
            const cls = student.class;
            if (!classMap[cls]) {
                classMap[cls] = { count: 0, students: [] };
            }
            classMap[cls].count++;
            classMap[cls].students.push(student);
        });

        return classMap;
    },

    // Get recent activity
    async getRecentActivity(limit = 10) {
        // In a real app, this would query an activity log
        // For now, return mock data based on actual records
        const activities = [];

        const attendance = await DB.getAll('attendance');
        const recentAttendance = attendance.slice(-3);
        recentAttendance.forEach(a => {
            activities.push({
                type: 'attendance',
                icon: '📅',
                message: `Attendance marked: ${a.status}`,
                date: a.markedAt || a.createdAt
            });
        });

        const students = await DB.getAll('students');
        const recentStudents = students.slice(-2);
        recentStudents.forEach(s => {
            activities.push({
                type: 'student',
                icon: '👨‍🎓',
                message: `Student added: ${s.name}`,
                date: s.createdAt
            });
        });

        // Sort by date and limit
        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    },

    // Export all data
    async exportData() {
        const data = await DB.exportAll();
        const filename = `apna_school_backup_${Utils.today()}.json`;
        Utils.exportToJSON(data, filename);
        Utils.showToast('Data exported successfully!', 'success');
    },

    // Get low attendance students
    async getLowAttendanceStudents(threshold = 75) {
        const students = await DB.getAll('students');
        const attendance = await DB.getAll('attendance');
        const result = [];

        for (const student of students) {
            const studentAttendance = attendance.filter(a => a.studentId === student.id);
            if (studentAttendance.length === 0) continue;

            const presentCount = studentAttendance.filter(a => a.status === 'present').length;
            const rate = Math.round((presentCount / studentAttendance.length) * 100);

            if (rate < threshold) {
                result.push({
                    ...student,
                    attendanceRate: rate,
                    totalDays: studentAttendance.length,
                    presentDays: presentCount
                });
            }
        }

        return result.sort((a, b) => a.attendanceRate - b.attendanceRate);
    },

    // Get pending fees students
    async getPendingFeesStudents() {
        const students = await DB.getAll('students');
        const fees = await DB.getAll('fees');
        const result = [];

        for (const student of students) {
            const studentFee = fees.find(f => f.studentId === student.id);
            if (studentFee && studentFee.balance > 0) {
                result.push({
                    ...student,
                    totalFee: studentFee.totalAmount,
                    paidAmount: studentFee.paidAmount,
                    balance: studentFee.balance,
                    status: studentFee.status
                });
            }
        }

        return result.sort((a, b) => b.balance - a.balance);
    }
};

window.Admin = Admin;
