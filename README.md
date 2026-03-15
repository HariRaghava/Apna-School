# 🎓 APNA SCHOOL Management System

**APNA SCHOOL** is a modern, responsive, and comprehensive school management web application designed to streamline educational administration. It features a premium "Crystal Glass" UI/UX and supports multiple user roles including Administrators, Faculty, Students, and Parents.

## 🚀 Features

*   **Multi-Role Authentication:** Secure login for Admin, Faculty, Student, and Parent.
*   **Dashboards:** Tailored dashboards for each role with relevant quick actions and stats.
*   **Student Management:** Complete lifecycle from admission to alumni.
*   **Academics:**
    *   **Attendance:** Tracker for students and faculty.
    *   **Marks & Reports:** Dynamic report card generation.
    *   **Timetable:** Class scheduling system.
*   **Finance:** Fee management and status tracking.
*   **Communication:** Circulars, notices, and direct messaging (Circulars).
*   **Technology:**
    *   **Frontend:** HTML5, CSS3 (Custom Variables, Glassmorphism), JavaScript (ES6+).
    *   **Database:** Client-side **IndexedDB** for persistent local data storage (No backend required for demo).
    *   **Design:** Custom "Crystal Spline" theme with 3D-like aesthetics and responsive layouts.

## 🛠️ Installation & Setup

This is a client-side application. You can run it using any static file server.

### Prerequisites
*   [Node.js](https://nodejs.org/) (optional, usage of `npx` recommended)

### Running the App
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/apna-school-management.git
    cd apna-school-management
    ```

2.  **Start a local server:**
    ```bash
    npx serve .
    ```
    *Or simply open `index.html` in your browser (though some features may require a server environment).*

3.  **Access the App:**
    Open `http://localhost:3000` in your browser.

## 🔐 Demo Credentials

The system comes with a built-in **Data Seeder** to populate the database with demo content.

### First Time Setup (Important!)
1.  Login as **Developer**:
    *   **Username:** `dev`
    *   **Password:** `dev123`
2.  Go to the **Developer Dashboard**.
3.  Click **"format C: (Clear DB)"** -> **"Seed Enterprise Data"**.
4.  Download the **"Export Credentials (PDF)"** for a full list of generated users.

### Quick Login Roles
| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Principal** | `principal` | `principal123` |
| **Developer** | `dev` | `dev123` |
| **Faculty** | `fac_001` | `faculty123` |
| **Parent** | `sharma_p1` | `parent123` |
| **Student** | `aarav_s` | `student123` |

## 📂 Project Structure

```
/
├── css/                # Stylesheets (styles.css, tokens.css)
├── js/                 # Application Logic
│   ├── db.js           # IndexedDB Wrapper
│   ├── auth.js         # Authentication & Session
│   ├── seed.js         # Data Generator
│   └── ...             # Feature modules (attendance, marks, etc.)
├── images/             # Assets
├── *.html              # UI Pages (Dashboards, Login, Public pages)
└── README.md           # Documentation
```

## 🤝 Contribution
Feel free to fork this project and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
