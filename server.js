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
        const { count: total_members, error: err1 } = await db.from('members').select('*', { count: 'exact', head: true });
        const { count: total_trainers, error: err2 } = await db.from('trainers').select('*', { count: 'exact', head: true });
        const { data: payments, error: err3 } = await db.from('payments').select('amount');
        
        if (err1 || err2 || err3) throw new Error(err1?.message || err2?.message || err3?.message);
        
        const total_revenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
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
        const { data, error } = await db.from('members').select(`
            id, name, email, phone, join_date,
            memberships (plan_type),
            trainers (name)
        `);
        if (error) throw error;
        
        const rows = data.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            join_date: m.join_date,
            membership: m.memberships?.plan_type || 'None',
            trainer: m.trainers?.name || 'None'
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/members', async (req, res) => {
    const { name, email, phone, join_date, membership_id, trainer_id } = req.body;
    try {
        const { data: memberData, error: memberError } = await db
            .from('members')
            .insert({
                name,
                email,
                phone,
                join_date,
                membership_id: membership_id ? parseInt(membership_id) : null,
                trainer_id: trainer_id ? parseInt(trainer_id) : null
            })
            .select('id')
            .single();
            
        if (memberError) throw memberError;
        const newMemberId = memberData.id;

        // Auto-create initial payment record based on membership plan
        let price = 50.00;
        if (membership_id === '2' || membership_id === 2) price = 135.00;
        else if (membership_id === '3' || membership_id === 3) price = 500.00;

        const { error: paymentError } = await db
            .from('payments')
            .insert({
                member_id: newMemberId,
                amount: price,
                payment_date: join_date,
                payment_method: 'Cash'
            });
        if (paymentError) console.error('Auto-payment failed:', paymentError);

        // Auto-create initial attendance record
        const timeString = new Date().toTimeString().split(' ')[0];
        const { error: attendanceError } = await db
            .from('attendance')
            .insert({
                member_id: newMemberId,
                attendance_date: join_date,
                check_in_time: timeString
            });
        if (attendanceError) console.error('Auto-attendance failed:', attendanceError);

        res.status(201).json({ message: 'Member added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/members/:id', async (req, res) => {
    try {
        await db.from('payments').delete().eq('member_id', req.params.id);
        await db.from('attendance').delete().eq('member_id', req.params.id);
        
        const { error } = await db.from('members').delete().eq('id', req.params.id);
        if (error) throw error;
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
        const { data, error } = await db.from('trainers').select('*').order('id', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/trainers', async (req, res) => {
    const { name, specialization, phone, hire_date } = req.body;
    try {
        const { error } = await db.from('trainers').insert({
            name,
            specialization,
            phone,
            hire_date
        });
        if (error) throw error;
        res.status(201).json({ message: 'Trainer added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/trainers/:id', async (req, res) => {
    try {
        const { error } = await db.from('trainers').delete().eq('id', req.params.id);
        if (error) throw error;
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
        const { data, error } = await db.from('memberships').select('*').order('id', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Attendance API
// =====================================
app.get('/api/attendance', async (req, res) => {
    try {
        const { data, error } = await db.from('attendance').select(`
            id, attendance_date, check_in_time,
            members (name)
        `).order('attendance_date', { ascending: false }).order('check_in_time', { ascending: false });
        if (error) throw error;
        const rows = data.map(a => ({
            id: a.id,
            member_name: a.members?.name || 'Unknown',
            attendance_date: a.attendance_date,
            check_in_time: a.check_in_time
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance', async (req, res) => {
    const { member_id, attendance_date, check_in_time } = req.body;
    try {
        const { error } = await db.from('attendance').insert({
            member_id: parseInt(member_id),
            attendance_date,
            check_in_time
        });
        if (error) throw error;
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
        const { data, error } = await db.from('payments').select(`
            id, amount, payment_date, payment_method,
            members (name)
        `).order('payment_date', { ascending: false });
        if (error) throw error;
        const rows = data.map(p => ({
            id: p.id,
            member_name: p.members?.name || 'Unknown',
            amount: p.amount,
            payment_date: p.payment_date,
            payment_method: p.payment_method
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments', async (req, res) => {
    const { member_id, amount, payment_date, payment_method } = req.body;
    try {
        const { error } = await db.from('payments').insert({
            member_id: parseInt(member_id),
            amount: parseFloat(amount),
            payment_date,
            payment_method
        });
        if (error) throw error;
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
        const { data, error } = await db.from('members').select(`
            id, name, email,
            memberships (plan_type, price),
            trainers (name)
        `).order('id', { ascending: true });
        if (error) throw error;
        const rows = data.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            plan_type: m.memberships?.plan_type || 'None',
            price: m.memberships?.price || null,
            trainer_name: m.trainers?.name || 'Unassigned'
        }));
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/attendance-stats', async (req, res) => {
    try {
        const { data, error } = await db.from('members').select(`
            name,
            attendance (id)
        `);
        if (error) throw error;
        const rows = data.map(m => ({
            name: m.name,
            total_visits: m.attendance?.length || 0
        })).sort((a, b) => b.total_visits - a.total_visits);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports/revenue-by-plan', async (req, res) => {
    try {
        const { data, error } = await db.from('memberships').select(`
            plan_type,
            members (
                id,
                payments (amount)
            )
        `);
        if (error) throw error;
        
        const rows = data.map(mb => {
            const memberCount = mb.members?.length || 0;
            let totalRevenue = 0;
            if (mb.members) {
                mb.members.forEach(m => {
                    if (m.payments) {
                        m.payments.forEach(p => {
                            totalRevenue += parseFloat(p.amount);
                        });
                    }
                });
            }
            return {
                plan_type: mb.plan_type,
                member_count: memberCount,
                total_revenue: totalRevenue
            };
        }).sort((a, b) => b.total_revenue - a.total_revenue);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================================
// Admins Auth API
// =====================================
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { data: existing, error: findError } = await db
            .from('admins')
            .select('username')
            .eq('username', username)
            .maybeSingle();
            
        if (findError) throw findError;
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const { error } = await db.from('admins').insert({ username, password });
        if (error) throw error;
        
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { data: admin, error } = await db
            .from('admins')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .maybeSingle();
            
        if (error) throw error;
        if (!admin) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        
        res.json({ success: true, message: 'Logged in successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
