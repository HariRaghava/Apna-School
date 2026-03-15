/* ============================================
   APNA SCHOOL - Schema Definitions & Validation
   Enterprise data validation and defaults
   ============================================ */

const Schema = {
    // Academic Year Schema
    academicYear: {
        fields: {
            year: { type: 'string', required: true, pattern: /^\d{4}-\d{2}$/ },
            name: { type: 'string', required: true },
            startDate: { type: 'date', required: true },
            endDate: { type: 'date', required: true },
            isCurrent: { type: 'boolean', default: false }
        },
        defaults: () => ({
            year: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(2)}`,
            name: `Academic Year ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            isCurrent: false
        })
    },

    // Class Schema
    class: {
        fields: {
            name: { type: 'string', required: true },
            grade: { type: 'number', required: true, min: 1, max: 12 },
            academicYearId: { type: 'string', required: true },
            capacity: { type: 'number', default: 40 }
        },
        defaults: () => ({
            capacity: 40
        })
    },

    // Section Schema
    section: {
        fields: {
            name: { type: 'string', required: true },
            classId: { type: 'string', required: true },
            classTeacherId: { type: 'string' }
        },
        defaults: () => ({
            name: 'A'
        })
    },

    // Student Schema
    student: {
        fields: {
            name: { type: 'string', required: true, minLength: 2 },
            rollNo: { type: 'string', required: true },
            classId: { type: 'string', required: true },
            sectionId: { type: 'string', required: true },
            academicYearId: { type: 'string', required: true },
            dob: { type: 'date', required: true },
            gender: { type: 'enum', values: ['Male', 'Female', 'Other'], required: true },
            guardianName: { type: 'string', required: true },
            guardianPhone: { type: 'string', required: true, pattern: /^\+?[\d\s-]{10,}$/ },
            guardianEmail: { type: 'email' },
            address: { type: 'string' },
            admissionDate: { type: 'date' },
            bloodGroup: { type: 'string' },
            photoUrl: { type: 'string' },
            status: { type: 'enum', values: ['Active', 'Inactive', 'Transferred', 'Graduated'], default: 'Active' }
        },
        defaults: () => ({
            status: 'Active',
            admissionDate: new Date().toISOString().split('T')[0]
        })
    },

    // Faculty Schema
    faculty: {
        fields: {
            name: { type: 'string', required: true },
            email: { type: 'email', required: true },
            phone: { type: 'string', required: true },
            department: { type: 'string' },
            designation: { type: 'string', default: 'Teacher' },
            qualification: { type: 'string' },
            joiningDate: { type: 'date' },
            subjects: { type: 'array', default: [] },
            assignedClasses: { type: 'array', default: [] },
            status: { type: 'enum', values: ['Active', 'Inactive', 'On Leave'], default: 'Active' }
        },
        defaults: () => ({
            designation: 'Teacher',
            subjects: [],
            assignedClasses: [],
            status: 'Active',
            joiningDate: new Date().toISOString().split('T')[0]
        })
    },

    // Subject Schema
    subject: {
        fields: {
            name: { type: 'string', required: true },
            code: { type: 'string', required: true },
            icon: { type: 'string', default: '📚' },
            description: { type: 'string' },
            credits: { type: 'number', default: 1 },
            isElective: { type: 'boolean', default: false }
        },
        defaults: () => ({
            icon: '📚',
            credits: 1,
            isElective: false
        })
    },

    // Subject Assignment Schema
    subjectAssignment: {
        fields: {
            subjectId: { type: 'string', required: true },
            facultyId: { type: 'string', required: true },
            classId: { type: 'string', required: true },
            sectionId: { type: 'string' },
            academicYearId: { type: 'string', required: true }
        }
    },

    // Assessment Type Schema
    assessmentType: {
        fields: {
            name: { type: 'string', required: true },
            subjectId: { type: 'string', required: true },
            academicYearId: { type: 'string', required: true },
            maxMarks: { type: 'number', required: true, min: 1 },
            weightage: { type: 'number', default: 100, min: 0, max: 100 },
            examDate: { type: 'date' },
            order: { type: 'number', default: 1 }
        },
        defaults: () => ({
            maxMarks: 100,
            weightage: 100,
            order: 1
        })
    },

    // Marks Schema
    marks: {
        fields: {
            studentId: { type: 'string', required: true },
            subjectId: { type: 'string', required: true },
            assessmentId: { type: 'string', required: true },
            academicYearId: { type: 'string', required: true },
            marksObtained: { type: 'number', required: true, min: 0 },
            maxMarks: { type: 'number', required: true },
            grade: { type: 'string' },
            remarks: { type: 'string' },
            enteredBy: { type: 'string', required: true },
            verifiedBy: { type: 'string' },
            isAbsent: { type: 'boolean', default: false }
        },
        defaults: () => ({
            isAbsent: false
        })
    },

    // Fee Structure Schema
    feeStructure: {
        fields: {
            classId: { type: 'string', required: true },
            academicYearId: { type: 'string', required: true },
            feeType: { type: 'enum', values: ['Tuition', 'Transport', 'Lab', 'Library', 'Sports', 'Exam', 'Other'], required: true },
            amount: { type: 'number', required: true, min: 0 },
            dueDate: { type: 'date' },
            description: { type: 'string' }
        }
    },

    // Fee Receipt Schema
    feeReceipt: {
        fields: {
            receiptNumber: { type: 'string', required: true },
            studentId: { type: 'string', required: true },
            feeId: { type: 'string', required: true },
            amount: { type: 'number', required: true, min: 0 },
            paymentMode: { type: 'enum', values: ['Cash', 'Cheque', 'Online', 'Card', 'UPI'], required: true },
            paymentDate: { type: 'date', required: true },
            transactionId: { type: 'string' },
            status: { type: 'enum', values: ['Valid', 'Cancelled', 'Pending'], default: 'Valid' },
            remarks: { type: 'string' },
            collectedBy: { type: 'string', required: true },
            verificationCode: { type: 'string' }
        },
        defaults: () => ({
            status: 'Valid',
            paymentDate: new Date().toISOString().split('T')[0]
        })
    },

    // Circular Schema
    circular: {
        fields: {
            title: { type: 'string', required: true },
            content: { type: 'string', required: true },
            type: { type: 'enum', values: ['Announcement', 'Notice', 'Event', 'Holiday', 'Exam', 'Fee'], required: true },
            priority: { type: 'enum', values: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
            targetRoles: { type: 'array', default: ['all'] },
            targetClasses: { type: 'array', default: [] },
            publishedAt: { type: 'date' },
            expiresAt: { type: 'date' },
            attachmentUrl: { type: 'string' },
            publishedBy: { type: 'string', required: true }
        },
        defaults: () => ({
            priority: 'Normal',
            targetRoles: ['all'],
            targetClasses: [],
            publishedAt: new Date().toISOString()
        })
    },

    // Validation function
    validate(schemaName, data) {
        const schema = this[schemaName];
        if (!schema) {
            return { valid: false, errors: [`Unknown schema: ${schemaName}`] };
        }

        const errors = [];
        const fields = schema.fields;

        for (const [fieldName, rules] of Object.entries(fields)) {
            const value = data[fieldName];

            // Required check
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${fieldName} is required`);
                continue;
            }

            // Skip validation if value is empty and not required
            if (value === undefined || value === null || value === '') continue;

            // Type validation
            switch (rules.type) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`${fieldName} must be a string`);
                    } else {
                        if (rules.minLength && value.length < rules.minLength) {
                            errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
                        }
                        if (rules.maxLength && value.length > rules.maxLength) {
                            errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
                        }
                        if (rules.pattern && !rules.pattern.test(value)) {
                            errors.push(`${fieldName} has invalid format`);
                        }
                    }
                    break;

                case 'number':
                    if (typeof value !== 'number' || isNaN(value)) {
                        errors.push(`${fieldName} must be a number`);
                    } else {
                        if (rules.min !== undefined && value < rules.min) {
                            errors.push(`${fieldName} must be at least ${rules.min}`);
                        }
                        if (rules.max !== undefined && value > rules.max) {
                            errors.push(`${fieldName} must be at most ${rules.max}`);
                        }
                    }
                    break;

                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push(`${fieldName} must be a valid email`);
                    }
                    break;

                case 'date':
                    if (isNaN(Date.parse(value))) {
                        errors.push(`${fieldName} must be a valid date`);
                    }
                    break;

                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push(`${fieldName} must be true or false`);
                    }
                    break;

                case 'enum':
                    if (!rules.values.includes(value)) {
                        errors.push(`${fieldName} must be one of: ${rules.values.join(', ')}`);
                    }
                    break;

                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push(`${fieldName} must be an array`);
                    }
                    break;
            }
        }

        return { valid: errors.length === 0, errors };
    },

    // Apply defaults to data
    applyDefaults(schemaName, data) {
        const schema = this[schemaName];
        if (!schema || !schema.defaults) return data;

        const defaults = schema.defaults();
        return { ...defaults, ...data };
    },

    // Grade calculation
    calculateGrade(percentage) {
        if (percentage >= 90) return { grade: 'A+', color: '#00D9A5', status: 'Outstanding' };
        if (percentage >= 80) return { grade: 'A', color: '#00D9A5', status: 'Excellent' };
        if (percentage >= 70) return { grade: 'B+', color: '#4DE3FF', status: 'Very Good' };
        if (percentage >= 60) return { grade: 'B', color: '#4DE3FF', status: 'Good' };
        if (percentage >= 50) return { grade: 'C+', color: '#FFB84D', status: 'Above Average' };
        if (percentage >= 40) return { grade: 'C', color: '#FFB84D', status: 'Average' };
        if (percentage >= 33) return { grade: 'D', color: '#FF8C42', status: 'Pass' };
        return { grade: 'F', color: '#FF5A5A', status: 'Fail' };
    },

    // Calculate marks statistics
    calculateMarksStats(marksObtained, maxMarks) {
        const percentage = (marksObtained / maxMarks) * 100;
        const gradeInfo = this.calculateGrade(percentage);
        return {
            marksObtained,
            maxMarks,
            percentage: Math.round(percentage * 100) / 100,
            ...gradeInfo,
            isPassed: percentage >= 33
        };
    }
};

// Make available globally
window.Schema = Schema;
