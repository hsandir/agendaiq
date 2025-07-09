-- Categories Table
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Departments Table
CREATE TABLE departments (
    department_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Job Titles Table
CREATE TABLE job_titles (
    job_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- Job-Department Linking Table
CREATE TABLE job_departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    department_id INTEGER,
    FOREIGN KEY (job_id) REFERENCES job_titles(job_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Employment Statuses Table
CREATE TABLE employment_statuses (
    status_id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL UNIQUE
);

-- Employees Table
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    job_id INTEGER,
    department_id INTEGER,
    hire_date DATE,
    status_id INTEGER,
    FOREIGN KEY (job_id) REFERENCES job_titles(job_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (status_id) REFERENCES employment_statuses(status_id)
);

-- Endorsements Table
CREATE TABLE endorsements (
    endorsement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Employee-Endorsements Linking Table
CREATE TABLE employee_endorsements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    endorsement_id INTEGER,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (endorsement_id) REFERENCES endorsements(endorsement_id)
);