const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================================
// Dashboard / Reports API
// =====================================
app.get('/api/dashboard', async (req, res) => {
    try {
        const [[{ total_members }]] = await db.query('SELECT COUNT(*) as total_members FROM members');
        const [[{ total_trainers }]] = await db.query('SELECT COUNT(*) as total_trainers FROM trainers');
        const [[{ total_revenue }]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments');
        
        res.json({ total_members, total_trainers, total_revenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Members API
// =====================================
app.get('/api/members', async (req, res) => {
    try {
        const query = `
            SELECT m.id, m.name, m.email, m.phone, m.join_date, 
                   mb.plan_type as membership, t.name as trainer
            FROM members m
            LEFT JOIN memberships mb ON m.membership_id = mb.id
            LEFT JOIN trainers t ON m.trainer_id = t.id
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/members', async (req, res) => {
    const { name, email, phone, join_date, membership_id, trainer_id } = req.body;
    try {
        await db.query(
            'INSERT INTO members (name, email, phone, join_date, membership_id, trainer_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, join_date, membership_id || null, trainer_id || null]
        );
        res.status(201).json({ message: 'Member added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/members/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM members WHERE id = ?', [req.params.id]);
        res.json({ message: 'Member deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Trainers API
// =====================================
app.get('/api/trainers', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trainers');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/trainers', async (req, res) => {
    const { name, specialization, phone, hire_date } = req.body;
    try {
        await db.query(
            'INSERT INTO trainers (name, specialization, phone, hire_date) VALUES (?, ?, ?, ?)',
            [name, specialization, phone, hire_date]
        );
        res.status(201).json({ message: 'Trainer added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/trainers/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM trainers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Trainer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Memberships API
// =====================================
app.get('/api/memberships', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM memberships');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Attendance API
// =====================================
app.get('/api/attendance', async (req, res) => {
    try {
        const query = `
            SELECT a.id, m.name as member_name, a.attendance_date, a.check_in_time 
            FROM attendance a
            JOIN members m ON a.member_id = m.id
            ORDER BY a.attendance_date DESC, a.check_in_time DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance', async (req, res) => {
    const { member_id, attendance_date, check_in_time } = req.body;
    try {
        await db.query(
            'INSERT INTO attendance (member_id, attendance_date, check_in_time) VALUES (?, ?, ?)',
            [member_id, attendance_date, check_in_time]
        );
        res.status(201).json({ message: 'Attendance recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Payments API
// =====================================
app.get('/api/payments', async (req, res) => {
    try {
        const query = `
            SELECT p.id, m.name as member_name, p.amount, p.payment_date, p.payment_method
            FROM payments p
            JOIN members m ON p.member_id = m.id
            ORDER BY p.payment_date DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments', async (req, res) => {
    const { member_id, amount, payment_date, payment_method } = req.body;
    try {
        await db.query(
            'INSERT INTO payments (member_id, amount, payment_date, payment_method) VALUES (?, ?, ?, ?)',
            [member_id, amount, payment_date, payment_method]
        );
        res.status(201).json({ message: 'Payment recorded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Reports API
// =====================================
app.get('/api/reports/members-plans', async (req, res) => {
    try {
        const query = `
            SELECT m.id, m.name, m.email, mb.plan_type, mb.price, t.name as trainer_name
            FROM members m
            LEFT JOIN memberships mb ON m.membership_id = mb.id
            LEFT JOIN trainers t ON m.trainer_id = t.id
            ORDER BY m.id ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/attendance-stats', async (req, res) => {
    try {
        const query = `
            SELECT m.name, COUNT(a.id) as total_visits
            FROM members m
            LEFT JOIN attendance a ON m.id = a.member_id
            GROUP BY m.id
            ORDER BY total_visits DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/revenue-by-plan', async (req, res) => {
    try {
        const query = `
            SELECT mb.plan_type, 
                   COUNT(DISTINCT m.id) as member_count, 
                   COALESCE(SUM(p.amount), 0) as total_revenue
            FROM memberships mb
            LEFT JOIN members m ON m.membership_id = mb.id
            LEFT JOIN payments p ON p.member_id = m.id
            GROUP BY mb.id
            ORDER BY total_revenue DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
