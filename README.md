# ACAT - ABET Course Assessment Tool

## Overview

ACAT (ABET Course Assessment Tool) is a web-based platform designed to automate and streamline the Faculty Course Assessment Report (FCAR) process used in academic accreditation and quality assurance activities.

The system replaces manual workflows involving emails, Word documents, and spreadsheets with a centralized solution that supports assessment form management, submission tracking, automated reminders, improvement monitoring, and report generation.

ACAT was developed as a capstone project for CSC 599 and aims to improve efficiency, data consistency, and long-term assessment tracking for accreditation processes.

## Features

### Authentication & Role-Based Access Control

* Secure login system
* Role-based permissions using Laravel Sanctum
* Separate portals for:

  * Administrator
  * Instructor
  * Coordinator

### Administrator Features

* Manage staff accounts
* Manage courses
* Manage Student Outcomes (SOs)
* Manage Performance Criteria (PCs)
* Create course offerings
* Assign assessment forms
* Monitor submission progress
* Configure reminders
* Generate and export reports

### Instructor Features

* View assigned forms
* Save partial progress
* Enter assessment data
* Submit completed FCAR forms
* Record grade distributions
* Provide improvement actions when performance thresholds are not met

### Coordinator Features

* Review instructor improvements
* Track improvements across academic cycles
* Compare course assessment results
* Monitor assessment trends

### Notifications & Reminders

* Automated email reminders
* Custom reminder scheduling
* System notifications for assignments and submissions

### Reporting

* Aggregated assessment reports
* Multi-year performance analysis
* PDF report generation
* Statistical visualizations and charts

---

## Technology Stack

### Frontend

* React.js
* Vite
* JavaScript
* React Router
* Axios
* Material UI (MUI)
* Tailwind CSS
* Chart.js

### Backend

* Laravel
* PHP
* Laravel Sanctum
* Laravel Eloquent ORM
* Laravel Middleware
* Laravel Validation
* Laravel Migrations
* Laravel Seeders
* Laravel Mail

### Database

* MySQL

### Additional Packages

* Barryvdh Laravel DomPDF

### Development Tools

* Git & GitHub
* Composer
* Node.js
* npm
* ESLint
* phpMyAdmin

---

## Main Workflow

1. Administrator configures academic year and semester.
2. Administrator creates staff accounts.
3. Administrator creates courses and assigns Student Outcomes.
4. Administrator defines Performance Criteria.
5. Administrator creates course offerings.
6. Administrator assigns FCAR forms.
7. Instructors complete assessment forms.
8. Automated reminders are sent when needed.
9. Instructors submit forms.
10. Coordinators review improvement actions.
11. Administrators generate reports.
12. Reports are exported as PDF documents.

---

## 🎥 Demo

[Watch Demo](https://lauedu74602-my.sharepoint.com/:v:/g/personal/reem_diab02_lau_edu/IQDiVpatWKNzTIqsbDYEW3FRASWOk_S86_RA8GeHVboytTw?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=dKbabr)
