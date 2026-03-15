/* ============================================
   APNA SCHOOL - Enterprise Seed Data
   Populates demo data for the SaaS platform
   ============================================ */

const Seed = {
    // Populate all enterprise demo data
    async populateAll() {
        console.log('🌱 Starting enterprise data seeding...');

        try {
            await DB.ready();

            // Check if already seeded
            const userCount = await DB.count('users');
            const classCount = await DB.count('classes');

            // If users exist but classes don't (upgrade scenario), seed enterprise data
            if (userCount > 0 && classCount > 0) {
                console.log('⚠️ Database already has data. Skipping seed.');
                return { success: false, message: 'Database already has data' };
            }

            // If users exist but no classes (v1 to v2 upgrade), seed enterprise stores only
            if (userCount > 0 && classCount === 0) {
                console.log('🔄 Upgrading to enterprise schema...');
                await this.seedAcademicYears();
                await this.seedClasses();
                await this.seedSections();
                await this.seedSubjects();
                await this.seedAssessmentTypes();
                await this.seedSubjectAssignments();
                await this.seedCirculars();
                console.log('✅ Enterprise stores populated for existing data.');
                return { success: true, message: 'Enterprise stores populated' };
            }

            // Full seed for fresh install
            await this.seedAcademicYears();
            await this.seedClasses();
            await this.seedSections();
            await this.seedSubjects();
            await this.seedAssessmentTypes();
            await this.seedUsers();
            await this.seedStudents();
            await this.seedFaculty();
            await this.seedSubjectAssignments();
            await this.seedFees();
            await this.seedAttendance();
            await this.seedMarks();
            await this.seedAttendance();
            await this.seedMarks();
            await this.seedCirculars();
            await this.seedTimetable();
            await this.seedSettings();

            console.log('✅ Enterprise data seeded successfully!');
            return { success: true, message: 'Demo data populated successfully' };
        } catch (error) {
            console.error('❌ Seeding error:', error);
            return { success: false, message: error.message };
        }
    },


    // Seed academic years
    async seedAcademicYears() {
        console.log('  📅 Seeding academic years...');

        const years = [
            { id: 'ay_2024', year: '2024-25', name: 'Academic Year 2024-25', startDate: '2024-04-01', endDate: '2025-03-31', isCurrent: true },
            { id: 'ay_2023', year: '2023-24', name: 'Academic Year 2023-24', startDate: '2023-04-01', endDate: '2024-03-31', isCurrent: false }
        ];

        for (const year of years) {
            await DB.add('academicYears', year);
        }
    },

    // Seed classes
    async seedClasses() {
        console.log('  🏫 Seeding classes...');

        const classes = [
            { id: 'cls_8', name: 'Class 8', grade: 8, academicYearId: 'ay_2024', capacity: 40 },
            { id: 'cls_9', name: 'Class 9', grade: 9, academicYearId: 'ay_2024', capacity: 40 },
            { id: 'cls_10', name: 'Class 10', grade: 10, academicYearId: 'ay_2024', capacity: 40 }
        ];

        for (const cls of classes) {
            await DB.add('classes', cls);
        }
    },

    // Seed sections
    async seedSections() {
        console.log('  📋 Seeding sections...');

        const sections = [
            { id: 'sec_8a', name: 'A', classId: 'cls_8' },
            { id: 'sec_8b', name: 'B', classId: 'cls_8' },
            { id: 'sec_9a', name: 'A', classId: 'cls_9' },
            { id: 'sec_9b', name: 'B', classId: 'cls_9' },
            { id: 'sec_10a', name: 'A', classId: 'cls_10' },
            { id: 'sec_10b', name: 'B', classId: 'cls_10' }
        ];

        for (const section of sections) {
            await DB.add('sections', section);
        }
    },

    // Seed subjects (dynamic - no hardcoding in UI)
    async seedSubjects() {
        console.log('  📚 Seeding subjects...');

        const subjects = [
            { id: 'sub_math', name: 'Mathematics', code: 'MATH101', icon: '📐', credits: 4, isElective: false, description: 'Core mathematics including algebra, geometry, and calculus.' },
            { id: 'sub_science', name: 'Science', code: 'SCI101', icon: '🔬', credits: 4, isElective: false, description: 'General science covering physics, chemistry, and biology.' },
            { id: 'sub_english', name: 'English', code: 'ENG101', icon: '📖', credits: 3, isElective: false, description: 'English language and literature.' },
            { id: 'sub_social', name: 'Social Studies', code: 'SST101', icon: '🌍', credits: 3, isElective: false, description: 'History, geography, and civics.' },
            { id: 'sub_hindi', name: 'Hindi', code: 'HIN101', icon: '📝', credits: 2, isElective: false, description: 'Hindi language and literature.' },
            { id: 'sub_computer', name: 'Computer Science', code: 'CS101', icon: '💻', credits: 2, isElective: true, description: 'Programming fundamentals and digital literacy.' },
            { id: 'sub_physics', name: 'Physics', code: 'PHY101', icon: '⚡', credits: 4, isElective: false, description: 'Mechanics, thermodynamics, and electromagnetism.' },
            { id: 'sub_chemistry', name: 'Chemistry', code: 'CHEM101', icon: '🧪', credits: 4, isElective: false, description: 'Organic, inorganic, and physical chemistry.' },
            { id: 'sub_biology', name: 'Biology', code: 'BIO101', icon: '🧬', credits: 4, isElective: false, description: 'Cell biology, genetics, and ecology.' }
        ];

        for (const subject of subjects) {
            await DB.add('subjects', subject);
        }
    },

    // Seed assessment types
    async seedAssessmentTypes() {
        console.log('  📝 Seeding assessment types...');

        const subjects = await DB.getAll('subjects');
        // Standard assessments for all subjects
        const assessments = ['Unit Test 1', 'Mid-Term', 'Unit Test 2', 'Final Exam'];
        const maxMarks = [25, 50, 25, 100];
        const weightages = [10, 30, 10, 50];

        for (const subject of subjects) {
            for (let i = 0; i < assessments.length; i++) {
                await DB.add('assessmentTypes', {
                    id: `asmt_${subject.id}_${i}`,
                    name: assessments[i],
                    subjectId: subject.id,
                    academicYearId: 'ay_2024',
                    maxMarks: maxMarks[i],
                    weightage: weightages[i],
                    order: i + 1
                });
            }
        }
    },

    // Seed default users
    async seedUsers() {
        console.log('  👥 Seeding users...');

        const defaultUsers = [
            { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
            { username: 'principal', password: 'principal123', name: 'Dr. Sharma', role: 'admin' },
            { username: 'dev', password: 'dev123', name: 'Developer', role: 'developer' }
        ];

        for (const user of defaultUsers) {
            await Auth.createUser(user);
        }
    },

    // Seed students with proper class/section references
    async seedStudents() {
        console.log('  👨‍🎓 Seeding students...');

        const firstNames = ['Aarav', 'Ananya', 'Arjun', 'Diya', 'Ishaan', 'Kavya', 'Krishna', 'Meera', 'Pranav', 'Riya', 'Sahil', 'Shreya', 'Tanvi', 'Vikram', 'Zara'];
        const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Joshi', 'Rao', 'Iyer'];

        const classSections = [
            { classId: 'cls_9', sectionId: 'sec_9a', prefix: '9A' },
            { classId: 'cls_10', sectionId: 'sec_10a', prefix: '10A' },
            { classId: 'cls_10', sectionId: 'sec_10b', prefix: '10B' }
        ];

        let studentIndex = 1;
        let nameIndex = 0;

        for (const { classId, sectionId, prefix } of classSections) {
            for (let i = 0; i < 5; i++) {
                const firstName = firstNames[nameIndex % firstNames.length];
                const lastName = lastNames[nameIndex % lastNames.length];
                const name = `${firstName} ${lastName}`;

                const student = {
                    id: `stu_${studentIndex.toString().padStart(3, '0')}`,
                    name: name,
                    rollNo: `2024${prefix}${(i + 1).toString().padStart(3, '0')}`,
                    classId: classId,
                    sectionId: sectionId,
                    academicYearId: 'ay_2024',
                    dob: `200${Math.floor(Math.random() * 3) + 6}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
                    gender: i % 2 === 0 ? 'Male' : 'Female',
                    guardianName: `Mr. ${lastName}`,
                    guardianPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                    guardianEmail: `${lastName.toLowerCase()}@email.com`,
                    address: 'Tumkur, Karnataka',
                    bloodGroup: ['A+', 'B+', 'O+', 'AB+'][Math.floor(Math.random() * 4)],
                    admissionDate: '2024-06-01',
                    status: 'Active'
                };

                await DB.add('students', student);

                // Create student user account
                // Append 's' to username to avoid duplicates if name repeats
                const studentUsername = `${firstName.toLowerCase()}_s`.substring(0, 15);
                await Auth.createUser({
                    username: studentUsername,
                    password: 'student123',
                    name: name,
                    role: 'student',
                    linkedId: student.id
                });

                // Create parent user account
                const parentUsername = `${lastName.toLowerCase()}_p`.substring(0, 15);
                await Auth.createUser({
                    username: parentUsername + studentIndex,
                    password: 'parent123',
                    name: student.guardianName,
                    role: 'parent',
                    linkedId: student.id
                });

                studentIndex++;
                nameIndex++;
            }
        }
    },

    // Seed faculty
    async seedFaculty() {
        console.log('  👨‍🏫 Seeding faculty...');

        const facultyData = [
            { id: 'fac_001', name: 'Rajesh Kumar', email: 'rajesh@school.edu', username: 'rajesh_t', department: 'Science', designation: 'Senior Teacher' },
            { id: 'fac_002', name: 'Priya Sharma', email: 'priya@school.edu', username: 'priya_t', department: 'Languages', designation: 'Teacher' },
            { id: 'fac_003', name: 'Suresh Reddy', email: 'suresh@school.edu', username: 'suresh_t', department: 'Science', designation: 'HOD Science' },
            { id: 'fac_004', name: 'Lakshmi Nair', email: 'lakshmi@school.edu', username: 'lakshmi_t', department: 'Social Science', designation: 'Teacher' },
            { id: 'fac_005', name: 'Anil Gupta', email: 'anil@school.edu', username: 'anil_t', department: 'Computer', designation: 'Computer Teacher' }
        ];

        for (const data of facultyData) {
            const faculty = {
                ...data,
                phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                qualification: 'M.Sc., B.Ed.',
                joiningDate: '2020-06-01',
                status: 'Active'
            };

            await DB.add('faculty', faculty);

            // Create faculty user account
            await Auth.createUser({
                username: data.username,
                password: 'faculty123',
                name: data.name,
                role: 'faculty',
                linkedId: data.id,
                email: data.email
            });
        }
    },

    // Seed subject assignments
    async seedSubjectAssignments() {
        console.log('  🔗 Seeding subject assignments...');

        const assignments = [
            { subjectId: 'sub_math', facultyId: 'fac_001', classId: 'cls_9' },
            { subjectId: 'sub_math', facultyId: 'fac_001', classId: 'cls_10' },
            { subjectId: 'sub_science', facultyId: 'fac_003', classId: 'cls_9' },
            { subjectId: 'sub_science', facultyId: 'fac_003', classId: 'cls_10' },
            { subjectId: 'sub_english', facultyId: 'fac_002', classId: 'cls_9' },
            { subjectId: 'sub_english', facultyId: 'fac_002', classId: 'cls_10' },
            { subjectId: 'sub_hindi', facultyId: 'fac_002', classId: 'cls_9' },
            { subjectId: 'sub_social', facultyId: 'fac_004', classId: 'cls_9' },
            { subjectId: 'sub_social', facultyId: 'fac_004', classId: 'cls_10' },
            { subjectId: 'sub_computer', facultyId: 'fac_005', classId: 'cls_10' }
        ];

        for (const assignment of assignments) {
            await DB.add('subjectAssignments', {
                ...assignment,
                academicYearId: 'ay_2024'
            });
        }
    },

    // Seed fees with proper structure
    async seedFees() {
        console.log('  💰 Seeding fees...');

        const students = await DB.getAll('students');

        for (const student of students) {
            const totalAmount = 24500; // Sum of all fee types
            const paymentStatus = Math.random();
            let paidAmount = 0;

            if (paymentStatus > 0.6) {
                paidAmount = totalAmount;
            } else if (paymentStatus > 0.3) {
                paidAmount = Math.floor(totalAmount * 0.5);
            }

            const fee = {
                id: `fee_${student.id}`,
                studentId: student.id,
                academicYearId: 'ay_2024',
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                balance: totalAmount - paidAmount,
                status: paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
                dueDate: '2024-12-31'
            };

            await DB.add('fees', fee);

            // Create a receipt if there's payment
            if (paidAmount > 0) {
                const receiptNumber = await DB.generateReceiptNumber();
                await DB.add('feeReceipts', {
                    receiptNumber: receiptNumber,
                    studentId: student.id,
                    feeId: fee.id,
                    amount: paidAmount,
                    paymentMode: ['Cash', 'Online', 'UPI'][Math.floor(Math.random() * 3)],
                    paymentDate: '2024-07-15',
                    status: 'Valid',
                    collectedBy: 'admin',
                    verificationCode: `VRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                });
            }
        }
    },

    // Seed attendance
    async seedAttendance() {
        console.log('  📅 Seeding attendance...');

        const students = await DB.getAll('students');
        const today = new Date();

        // Generate attendance for last 30 days
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const date = new Date(today);
            date.setDate(date.getDate() - dayOffset);

            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            const dateStr = date.toISOString().split('T')[0];

            for (const student of students) {
                // 90% attendance rate
                const status = Math.random() > 0.1 ? 'present' : 'absent';

                await DB.add('attendance', {
                    studentId: student.id,
                    date: dateStr,
                    status: status,
                    classId: student.classId,
                    sectionId: student.sectionId,
                    markedBy: 'fac_001',
                    markedAt: date.toISOString()
                });
            }
        }
    },

    // Seed marks with assessments
    async seedMarks() {
        console.log('  📊 Seeding marks...');

        const students = await DB.getAll('students');
        const assessments = await DB.getAll('assessmentTypes');

        for (const student of students) {
            for (const assessment of assessments) {
                // Generate marks based on max marks
                const percentage = Math.floor(Math.random() * 50) + 45; // 45-95%
                const marksObtained = Math.floor((percentage / 100) * assessment.maxMarks);

                await DB.add('marks', {
                    studentId: student.id,
                    subjectId: assessment.subjectId,
                    assessmentId: assessment.id,
                    academicYearId: 'ay_2024',
                    marksObtained: marksObtained,
                    maxMarks: assessment.maxMarks,
                    enteredBy: 'fac_001',
                    isAbsent: false
                });
            }
        }
    },

    // Seed circulars
    async seedCirculars() {
        console.log('  📢 Seeding circulars...');

        const circulars = [
            {
                title: 'Half-Yearly Examination Schedule',
                content: 'Half-yearly examinations will commence from January 5, 2025. Please check the detailed timetable attached. Students are advised to prepare well in advance.',
                type: 'Exam',
                priority: 'High',
                targetRoles: ['all'],
                publishedBy: 'admin'
            },
            {
                title: 'Winter Vacation Notice',
                content: 'The school will observe winter break from December 23, 2024 to January 2, 2025. Classes will resume on January 3, 2025.',
                type: 'Holiday',
                priority: 'Normal',
                targetRoles: ['all'],
                publishedBy: 'admin'
            },
            {
                title: 'Fee Payment Reminder',
                content: 'This is to remind all parents that the last date for fee payment for the current quarter is December 31, 2024. Please clear all pending dues to avoid late fees.',
                type: 'Fee',
                priority: 'High',
                targetRoles: ['parent', 'student'],
                publishedBy: 'admin'
            },
            {
                title: 'Annual Sports Day',
                content: 'Annual Sports Day will be held on January 15, 2025. All students are required to participate. Practice sessions will begin from January 5.',
                type: 'Event',
                priority: 'Normal',
                targetRoles: ['all'],
                publishedBy: 'admin'
            }
        ];

        for (const circular of circulars) {
            await DB.add('circulars', {
                ...circular,
                publishedAt: new Date().toISOString()
            });
        }
    },

    // Seed settings
    async seedSettings() {
        console.log('  ⚙️ Seeding settings...');

        const settings = [
            { key: 'schoolName', value: 'APNA SCHOOL' },
            { key: 'schoolAddress', value: 'Tumkur, Karnataka, India' },
            { key: 'schoolPhone', value: '+91 1234567890' },
            { key: 'schoolEmail', value: 'info@apnaschool.edu.in' },
            { key: 'academicYear', value: '2024-25' },
            { key: 'attendanceThreshold', value: 75 },
            { key: 'passingMarks', value: 33 },
            { key: 'principalName', value: 'Dr. Sharma' },
            { key: 'systemVersion', value: '2.0 Enterprise' }
        ];

        for (const setting of settings) {
            await DB.add('settings', setting);
        }
    },

    // Seed timetable
    async seedTimetable() {
        console.log('  📅 Seeding timetable...');

        const classSections = [
            { classId: 'cls_9', sectionId: 'sec_9a' },
            { classId: 'cls_10', sectionId: 'sec_10a' },
            { classId: 'cls_10', sectionId: 'sec_10b' }
        ];

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Simple period structure
        const periodsTemplate = [
            { period: 1, time: '09:00 - 09:45' },
            { period: 2, time: '09:45 - 10:30' },
            { period: 3, time: '10:45 - 11:30' },
            { period: 4, time: '11:30 - 12:15' }
        ];

        const subjects = ['sub_math', 'sub_science', 'sub_english', 'sub_social', 'sub_computer'];

        for (const { classId, sectionId } of classSections) {
            for (const day of days) {
                // Generate varied subjects for each day
                const dayPeriods = periodsTemplate.map(p => ({
                    ...p,
                    subjectId: subjects[Math.floor(Math.random() * subjects.length)],
                    topic: 'Chapter ' + Math.floor(Math.random() * 5 + 1)
                }));

                await DB.add('timetable', {
                    id: `tt_${classId}_${sectionId}_${day}`,
                    classId: classId,
                    sectionId: sectionId,
                    day: day,
                    academicYearId: 'ay_2024',
                    periods: dayPeriods
                });
            }
        }
    },

    // Clear all data and reseed
    async reset() {
        console.log('🔄 Resetting database...');
        await DB.clearAll();
        return await this.populateAll();
    }
};

// Make available globally
window.Seed = Seed;
