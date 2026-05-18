CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- 1. Trainers Table
CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    hire_date DATE NOT NULL
);

-- 2. Memberships Table
CREATE TABLE IF NOT EXISTS memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_type ENUM('Monthly', 'Quarterly', 'Yearly') NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT
);

-- 3. Members Table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    join_date DATE NOT NULL,
    membership_id INT,
    trainer_id INT,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- 4. Workout Plans Table
CREATE TABLE IF NOT EXISTS workout_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    trainer_id INT,
    plan_details TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 6. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ==========================================
-- Insert Sample Data
-- ==========================================

INSERT INTO trainers (name, specialization, phone, hire_date) VALUES 
('John Doe', 'Bodybuilding', '555-1001', '2023-01-15'),
('Sarah Smith', 'Yoga & Flexibility', '555-1002', '2023-03-22'),
('Mike Johnson', 'Cardio & Endurance', '555-1003', '2023-06-10');

INSERT INTO memberships (plan_type, price, description) VALUES 
('Monthly', 50.00, 'Access to all gym equipment for 1 month.'),
('Quarterly', 135.00, 'Access to all gym equipment for 3 months (10% discount).'),
('Yearly', 500.00, 'Access to all gym equipment for 1 year (Best value).');

INSERT INTO members (name, email, phone, join_date, membership_id, trainer_id) VALUES 
('Alice Brown', 'alice@example.com', '555-2001', '2023-07-01', 3, 2),
('Bob Green', 'bob@example.com', '555-2002', '2023-08-15', 1, 1),
('Charlie White', 'charlie@example.com', '555-2003', '2023-09-01', 2, 3);

INSERT INTO workout_plans (member_id, trainer_id, plan_details, start_date, end_date) VALUES 
(1, 2, 'Beginner Yoga Routine: 3 days/week.', '2023-07-05', '2023-10-05'),
(2, 1, 'Hypertrophy Block: Push/Pull/Legs.', '2023-08-20', '2023-09-20');

INSERT INTO attendance (member_id, attendance_date, check_in_time) VALUES 
(1, '2023-09-05', '08:30:00'),
(2, '2023-09-05', '17:45:00'),
(3, '2023-09-06', '06:15:00'),
(1, '2023-09-07', '08:45:00');

INSERT INTO payments (member_id, amount, payment_date, payment_method) VALUES 
(1, 500.00, '2023-07-01', 'Credit Card'),
(2, 50.00, '2023-08-15', 'Cash'),
(3, 135.00, '2023-09-01', 'Debit Card');

-- ==========================================
-- Some useful aggregate & join queries
-- ==========================================

-- Q1: Get all members with their membership plan and trainer name
-- SELECT m.id, m.name, m.email, mb.plan_type, t.name as trainer_name
-- FROM members m
-- LEFT JOIN memberships mb ON m.membership_id = mb.id
-- LEFT JOIN trainers t ON m.trainer_id = t.id;

-- Q2: Get total revenue from payments
-- SELECT SUM(amount) as total_revenue FROM payments;

-- Q3: Get attendance count per member
-- SELECT m.name, COUNT(a.id) as total_visits
-- FROM members m
-- LEFT JOIN attendance a ON m.id = a.member_id
-- GROUP BY m.id;
