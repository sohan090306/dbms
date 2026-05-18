# Gym Membership Management System

A beginner-friendly Database Management System (DBMS) mini project designed for college presentations. It features a complete frontend, RESTful Node.js API, and a normalized MySQL database.

## Features
- **Admin Dashboard**: Overview of members, trainers, and revenue.
- **Member Management**: Add, view, search, and delete gym members.
- **Trainer Management**: Manage trainers and their specializations.
- **Attendance Tracking**: Record and view daily member check-ins.
- **Payment Logging**: Track membership payments.
- **Relational Database**: Implements Primary Keys, Foreign Keys, Joins, and Aggregations.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Variables, Flexbox, Grid), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL

## Setup Instructions

### 1. Database Setup
1. Install [XAMPP](https://www.apachefriends.org/index.html), [WAMP](https://www.wampserver.com/en/), or standard MySQL Server.
2. Start your MySQL service.
3. Import the `database.sql` file into your MySQL server to create the schema, tables, and sample data.
   - *Via phpMyAdmin*: Go to `http://localhost/phpmyadmin`, create a database named `gym_management`, select it, click "Import", and choose the `database.sql` file.
   - *Via Command Line*: `mysql -u root -p < database.sql`

### 2. Backend Setup
1. Ensure [Node.js](https://nodejs.org/) is installed.
2. Open your terminal in the project directory.
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. (Optional) Create a `.env` file in the root directory to configure database credentials. If omitted, the default is:
   \`\`\`env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=gym_management
   PORT=3000
   \`\`\`
5. Start the server:
   \`\`\`bash
   node server.js
   \`\`\`

### 3. Access the Application
1. Open your web browser and navigate to: [http://localhost:3000](http://localhost:3000)
2. Use the following credentials to log in:
   - **Username**: admin
   - **Password**: admin

## 🌐 Cloud Deployment Guide

To deploy this full-stack project to the web, you need to deploy the **MySQL Database** and the **Node.js Web App** to cloud hosts, then link them. Here is a step-by-step guide using free tier providers:

### 1. Database Cloud Setup (MySQL)
You can set up a free MySQL server using providers like **Clever Cloud** or **Aiven**:
1. Sign up for a free account at [Clever Cloud](https://www.clever-cloud.com/).
2. Create a new personal organization, then click **Add an add-on** and select **Clever Cloud MySQL**.
3. Choose the **Free Shared Plan** ($0/month) and complete creation.
4. Go to your new MySQL database console to find your connection credentials:
   - **Host** (e.g., `bxxxx-mysql.services.clever-cloud.com`)
   - **Database Name** (e.g., `bxxxx`)
   - **User** (e.g., `uxxxx`)
   - **Password** (e.g., `pxxxx`)
5. Import `database.sql` to your remote database:
   - *Via phpMyAdmin on Clever Cloud*: Click the **phpMyAdmin** link in the database dashboard, click **Import**, and upload the `database.sql` file.
   - *Via Command Line*: `mysql -h <HOST> -u <USER> -p <DATABASE_NAME> < database.sql`

### 2. Pushing Code to GitHub
1. Log into your [GitHub](https://github.com/) account.
2. Create a new repository named `gym-management-system` (leave "Initialize with README" unchecked).
3. Open your local terminal in the project folder and run:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/gym-management-system.git
   git branch -M main
   git push -u origin main
   ```

### 3. Deploying Web Server (Render)
1. Sign up for a free account at [Render](https://render.com/).
2. Click **New +** in the dashboard -> select **Blueprint**.
3. Connect your GitHub account and select your `gym-management-system` repository.
4. Render will read your `render.yaml` configuration and ask you to populate the environment parameters:
   - `DB_HOST`: Enter your Clever Cloud Host.
   - `DB_USER`: Enter your Clever Cloud Username.
   - `DB_PASSWORD`: Enter your Clever Cloud Password.
   - `DB_NAME`: Enter your Clever Cloud Database Name.
5. Click **Approve** or **Deploy**. Render will automatically build and deploy your Node.js application, providing a secure `https://...onrender.com` link!

---

## Project Structure
- `database.sql`: MySQL schema, tables, and sample data.
- `server.js`: Node.js Express server with RESTful API endpoints.
- `db.js`: Database connection configuration.
- `public/`: Frontend HTML, CSS, and JS files.

## DBMS Concepts Implemented
- **Normalization**: Tables are structured to avoid data redundancy.
- **Foreign Keys**: Enforced referential integrity (e.g., deleting a member cascades to their attendance and payments).
- **CRUD Operations**: Complete Create, Read, Update, Delete capabilities via the API.
- **Aggregate Functions & Joins**: Used for the Dashboard statistics (e.g., `SUM()`, `COUNT()`, `LEFT JOIN`).

