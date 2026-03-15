/* ============================================
   APNA SCHOOL - Utility Functions
   Helper functions for common operations
   ============================================ */

const Utils = {
    // Generate unique ID with prefix
    generateId(prefix = 'id') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}`;
    },

    // Format date to locale string
    formatDate(date, options = {}) {
        const d = new Date(date);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return d.toLocaleDateString('en-IN', { ...defaultOptions, ...options });
    },

    // Format date for input fields (YYYY-MM-DD)
    formatDateInput(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    // Get today's date in YYYY-MM-DD format
    today() {
        return this.formatDateInput(new Date());
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    // Calculate percentage
    percentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    // Debounce function
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Confirm dialog
    confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            // Create modal
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop active';
            backdrop.innerHTML = `
        <div class="modal" style="max-width: 400px;">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-glass" id="confirm-cancel">Cancel</button>
            <button class="btn btn-danger" id="confirm-ok">Confirm</button>
          </div>
        </div>
      `;

            document.body.appendChild(backdrop);

            backdrop.querySelector('#confirm-ok').onclick = () => {
                backdrop.remove();
                resolve(true);
            };

            backdrop.querySelector('#confirm-cancel').onclick = () => {
                backdrop.remove();
                resolve(false);
            };
        });
    },

    // Validate email
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Validate phone number (Indian format)
    isValidPhone(phone) {
        const regex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return regex.test(phone.replace(/\s/g, ''));
    },

    // Generate random password
    generatePassword(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // Capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Generate roll number
    generateRollNo(classId, count) {
        const year = new Date().getFullYear().toString().slice(-2);
        const num = (count + 1).toString().padStart(3, '0');
        return `${year}${classId}${num}`;
    },

    // Export data to JSON file
    exportToJSON(data, filename = 'export.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    // Animate counter
    animateCounter(element, target, duration = 1000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    },

    // Get grade from marks
    getGrade(percentage) {
        if (percentage >= 90) return { grade: 'A+', color: '#00D9A5' };
        if (percentage >= 80) return { grade: 'A', color: '#4DE3FF' };
        if (percentage >= 70) return { grade: 'B+', color: '#5A3FFF' };
        if (percentage >= 60) return { grade: 'B', color: '#CFA7FF' };
        if (percentage >= 50) return { grade: 'C', color: '#FFB84D' };
        if (percentage >= 40) return { grade: 'D', color: '#FF8C42' };
        return { grade: 'F', color: '#FF5A5A' };
    },

    // Get attendance status color
    getAttendanceColor(percentage) {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'info';
        if (percentage >= 60) return 'warning';
        return 'danger';
    },

    // Get fee status
    getFeeStatus(paid, total) {
        if (paid >= total) return { status: 'Paid', badge: 'success' };
        if (paid > 0) return { status: 'Partial', badge: 'warning' };
        return { status: 'Pending', badge: 'danger' };
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Simple template engine
    template(str, data) {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
    },

    // Get initials from name
    getInitials(name) {
        return name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },

    // Check if mobile device
    isMobile() {
        return window.innerWidth < 768;
    },

    // Escape HTML
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Parse query string
    parseQueryString() {
        const params = {};
        const search = window.location.search.substring(1);
        if (search) {
            search.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }
        return params;
    },

    // Set loading state on button
    setButtonLoading(button, loading = true) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText;
        }
    }
};

// Add CSS for toast slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes toastSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
`;
document.head.appendChild(style);

// Make available globally
window.Utils = Utils;
