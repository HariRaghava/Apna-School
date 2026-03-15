/* ============================================
   APNA SCHOOL - Enterprise IndexedDB Wrapper
   Handles all local data storage operations
   Version 2.0 - Enterprise SaaS Edition
   ============================================ */

const DB = {
  name: 'ApnaSchoolDB',
  version: 2, // Upgraded version for new stores
  db: null,

  // Enhanced store definitions for enterprise
  stores: {
    // Core user management
    users: { keyPath: 'id', indexes: ['username', 'role', 'linkedId'] },

    // Academic structure
    academicYears: { keyPath: 'id', indexes: ['year', 'isCurrent'] },
    classes: { keyPath: 'id', indexes: ['name', 'academicYearId'] },
    sections: { keyPath: 'id', indexes: ['name', 'classId'] },

    // People
    students: { keyPath: 'id', indexes: ['rollNo', 'classId', 'sectionId', 'name', 'academicYearId'] },
    faculty: { keyPath: 'id', indexes: ['email', 'name', 'department'] },

    // Dynamic subjects (faculty-driven)
    subjects: { keyPath: 'id', indexes: ['name', 'code', 'facultyId', 'classId'] },
    subjectAssignments: { keyPath: 'id', indexes: ['subjectId', 'facultyId', 'classId', 'sectionId', 'academicYearId'] },

    // Assessments and marks
    assessmentTypes: { keyPath: 'id', indexes: ['name', 'subjectId', 'maxMarks'] },
    marks: { keyPath: 'id', indexes: ['studentId', 'subjectId', 'assessmentId', 'academicYearId'] },
    marksHistory: { keyPath: 'id', indexes: ['marksId', 'modifiedBy', 'modifiedAt'] },

    // Attendance
    attendance: { keyPath: 'id', indexes: ['studentId', 'date', 'classId', 'sectionId'] },

    // Finance
    feeStructure: { keyPath: 'id', indexes: ['classId', 'academicYearId', 'feeType'] },
    fees: { keyPath: 'id', indexes: ['studentId', 'status', 'dueDate', 'academicYearId'] },
    feeReceipts: { keyPath: 'id', indexes: ['receiptNumber', 'studentId', 'feeId', 'date', 'status'] },

    // Communication
    circulars: { keyPath: 'id', indexes: ['type', 'priority', 'publishedAt', 'expiresAt', 'targetRoles'] },
    notifications: { keyPath: 'id', indexes: ['userId', 'type', 'isRead', 'createdAt'] },

    // Scheduling
    timetable: { keyPath: 'id', indexes: ['classId', 'sectionId', 'day', 'academicYearId'] },

    // System
    settings: { keyPath: 'key' },
    auditLog: { keyPath: 'id', indexes: ['action', 'userId', 'entityType', 'entityId', 'timestamp'] },

    // Templates
    pdfTemplates: { keyPath: 'id', indexes: ['type', 'name'] }
  },

  // Initialize database
  async ready() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Enterprise Database connected (v2.0)');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔄 Upgrading to Enterprise database schema...');

        // Create all object stores
        Object.entries(this.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });

            // Create indexes
            if (config.indexes) {
              config.indexes.forEach(indexName => {
                store.createIndex(indexName, indexName, { unique: false });
              });
            }
            console.log(`  ✓ Created store: ${storeName}`);
          }
        });
      };
    });
  },

  // Add a record with audit logging
  async add(storeName, data, userId = null) {
    await this.ready();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Generate ID if not present
      if (!data.id && storeName !== 'settings') {
        data.id = this.generateId(storeName);
      }

      data.createdAt = data.createdAt || new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      data.createdBy = data.createdBy || userId;

      const request = store.add(data);

      request.onsuccess = async () => {
        console.log(`✅ Added to ${storeName}:`, data.id);

        // Log audit trail for important stores
        if (userId && ['students', 'faculty', 'marks', 'fees', 'feeReceipts'].includes(storeName)) {
          await this.logAudit('CREATE', userId, storeName, data.id, null, data);
        }

        resolve(data);
      };

      request.onerror = () => {
        console.error(`❌ Error adding to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  },

  // Get a record by ID
  async get(storeName, id) {
    await this.ready();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Get all records from a store
  async getAll(storeName) {
    await this.ready();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // Get records by index
  async getByIndex(storeName, indexName, value) {
    await this.ready();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  // Query with multiple conditions
  async query(storeName, conditions = {}) {
    const all = await this.getAll(storeName);
    return all.filter(item => {
      return Object.entries(conditions).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  },

  // Update a record with audit logging
  async update(storeName, data, userId = null) {
    await this.ready();

    // Get old data for audit
    const oldData = userId ? await this.get(storeName, data.id) : null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      data.updatedAt = new Date().toISOString();
      data.updatedBy = data.updatedBy || userId;

      const request = store.put(data);

      request.onsuccess = async () => {
        console.log(`✅ Updated in ${storeName}:`, data.id);

        // Log audit trail
        if (userId && oldData && ['students', 'faculty', 'marks', 'fees'].includes(storeName)) {
          await this.logAudit('UPDATE', userId, storeName, data.id, oldData, data);
        }

        resolve(data);
      };

      request.onerror = () => {
        console.error(`❌ Error updating ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  },

  // Delete a record with audit logging
  async delete(storeName, id, userId = null) {
    await this.ready();

    // Get data for audit before deletion
    const oldData = userId ? await this.get(storeName, id) : null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = async () => {
        console.log(`✅ Deleted from ${storeName}:`, id);

        // Log audit trail
        if (userId && oldData) {
          await this.logAudit('DELETE', userId, storeName, id, oldData, null);
        }

        resolve(true);
      };

      request.onerror = () => {
        console.error(`❌ Error deleting from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  },

  // Cascade delete related records
  async cascadeDelete(storeName, id, relations = [], userId = null) {
    // Delete related records first
    for (const relation of relations) {
      const related = await this.getByIndex(relation.store, relation.foreignKey, id);
      for (const item of related) {
        await this.delete(relation.store, item.id, userId);
      }
    }
    // Then delete the main record
    return this.delete(storeName, id, userId);
  },

  // Log audit trail
  async logAudit(action, userId, entityType, entityId, oldData, newData) {
    try {
      const auditEntry = {
        id: this.generateId('audit'),
        action,
        userId,
        entityType,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        timestamp: new Date().toISOString(),
        ipAddress: 'localhost' // In real app, get from server
      };

      const transaction = this.db.transaction(['auditLog'], 'readwrite');
      const store = transaction.objectStore('auditLog');
      store.add(auditEntry);
    } catch (e) {
      console.warn('Audit logging failed:', e);
    }
  },

  // Get audit history for an entity
  async getAuditHistory(entityType, entityId) {
    const all = await this.getAll('auditLog');
    return all
      .filter(log => log.entityType === entityType && log.entityId === entityId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Clear all records in a store
  async clear(storeName) {
    await this.ready();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`✅ Cleared store: ${storeName}`);
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  },

  // Clear all stores
  async clearAll() {
    await this.ready();

    const storeNames = Object.keys(this.stores);
    for (const storeName of storeNames) {
      await this.clear(storeName);
    }
    console.log('✅ All stores cleared');
  },

  // Count records in a store
  async count(storeName) {
    await this.ready();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Generate unique ID with prefix
  generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  },

  // Generate receipt number (SCH/YYYY/NNNNNN)
  async generateReceiptNumber() {
    const year = new Date().getFullYear();
    const receipts = await this.getAll('feeReceipts');
    const yearReceipts = receipts.filter(r => r.receiptNumber && r.receiptNumber.includes(`/${year}/`));
    const nextNum = (yearReceipts.length + 1).toString().padStart(6, '0');
    return `SCH/${year}/${nextNum}`;
  },

  // Export all data
  async exportAll() {
    await this.ready();

    const data = {};
    for (const storeName of Object.keys(this.stores)) {
      data[storeName] = await this.getAll(storeName);
    }
    data._exportedAt = new Date().toISOString();
    data._version = this.version;
    return data;
  },

  // Import data
  async importAll(data) {
    await this.ready();

    for (const [storeName, records] of Object.entries(data)) {
      if (this.stores[storeName] && Array.isArray(records)) {
        for (const record of records) {
          await this.update(storeName, record);
        }
      }
    }
    console.log('✅ Data imported successfully');
  },

  // Get statistics
  async getStats() {
    await this.ready();

    const stats = {};
    for (const storeName of Object.keys(this.stores)) {
      stats[storeName] = await this.count(storeName);
    }
    return stats;
  },

  // Get current academic year
  async getCurrentAcademicYear() {
    const years = await this.getAll('academicYears');
    return years.find(y => y.isCurrent) || years[0];
  },

  // Validate referential integrity
  async validateReference(storeName, id) {
    const record = await this.get(storeName, id);
    return !!record;
  }
};

// Initialize database on load
document.addEventListener('DOMContentLoaded', () => {
  DB.ready().catch(console.error);
});

// Make available globally
window.DB = DB;
