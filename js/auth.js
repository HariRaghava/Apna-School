/* ============================================
   APNA SCHOOL - Authentication System
   Role-based access control with secure hashing
   ============================================ */

const Auth = {
    SESSION_KEY: 'apna_school_session',

    // SHA-256 hash function using Web Crypto API
    async hash(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Login user
    async login(username, password, role) {
        await DB.ready();

        // Get all users
        const users = await DB.getAll('users');

        // Find matching user
        const passwordHash = await this.hash(password);
        const user = users.find(u =>
            u.username.toLowerCase() === username.toLowerCase() &&
            u.passwordHash === passwordHash &&
            u.role === role
        );

        if (user) {
            // Create session
            const session = {
                userId: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                linkedId: user.linkedId || null,
                loginTime: new Date().toISOString()
            };

            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            console.log('✅ Login successful:', user.name);
            return { success: true, user: session };
        }

        console.log('❌ Login failed: Invalid credentials');
        return { success: false, error: 'Invalid username, password, or role' };
    },

    // Logout user
    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
        console.log('✅ Logged out successfully');
        window.location.href = 'login.html';
    },

    // Get current user
    currentUser() {
        const session = sessionStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    // Check if logged in
    isLoggedIn() {
        return this.currentUser() !== null;
    },

    // Require authentication (redirect if not logged in)
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Check if user has specific role
    hasRole(role) {
        const user = this.currentUser();
        return user && user.role === role;
    },

    // Require specific role
    requireRole(allowedRoles) {
        if (!this.requireAuth()) return false;

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        const user = this.currentUser();

        if (!roles.includes(user.role)) {
            console.log('❌ Access denied: Insufficient permissions');
            this.redirectToDashboard(user.role);
            return false;
        }

        return true;
    },

    // Get dashboard URL based on role
    getDashboardUrl(role) {
        const dashboards = {
            admin: 'admin-dashboard.html',
            faculty: 'faculty-dashboard.html',
            student: 'student-dashboard.html',
            parent: 'parent-dashboard.html',
            developer: 'developer-dashboard.html'
        };
        return dashboards[role] || 'login.html';
    },

    // Redirect to appropriate dashboard
    redirectToDashboard(role) {
        window.location.href = this.getDashboardUrl(role);
    },

    // Create user account
    async createUser(userData) {
        await DB.ready();

        // Check if username already exists
        const existingUsers = await DB.getAll('users');
        if (existingUsers.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
            return { success: false, error: 'Username already exists' };
        }

        // Hash password
        const passwordHash = await this.hash(userData.password);

        const user = {
            id: DB.generateId('user'),
            username: userData.username,
            passwordHash: passwordHash,
            name: userData.name,
            role: userData.role,
            linkedId: userData.linkedId || null,
            email: userData.email || null,
            createdAt: new Date().toISOString()
        };

        await DB.add('users', user);
        console.log('✅ User created:', user.username);
        return { success: true, user };
    },

    // Update user password
    async updatePassword(userId, newPassword) {
        await DB.ready();

        const user = await DB.get('users', userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        user.passwordHash = await this.hash(newPassword);
        await DB.update('users', user);

        console.log('✅ Password updated for:', user.username);
        return { success: true };
    },

    // Delete user
    async deleteUser(userId) {
        await DB.ready();
        await DB.delete('users', userId);
        console.log('✅ User deleted:', userId);
        return { success: true };
    },

    // Get all users
    async getUsers() {
        await DB.ready();
        const users = await DB.getAll('users');
        // Return without password hash for security
        return users.map(u => ({
            id: u.id,
            username: u.username,
            name: u.name,
            role: u.role,
            linkedId: u.linkedId,
            email: u.email,
            createdAt: u.createdAt
        }));
    },

    // Get users by role
    async getUsersByRole(role) {
        await DB.ready();
        const users = await DB.getAll('users');
        return users.filter(u => u.role === role).map(u => ({
            id: u.id,
            username: u.username,
            name: u.name,
            role: u.role,
            linkedId: u.linkedId,
            email: u.email
        }));
    }
};

// Make available globally
window.Auth = Auth;
