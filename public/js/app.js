const API_BASE = `${window.location.origin}/api`;

// Utility to handle modal toggling
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        modal.style.display = 'block';
    }
}

// Utility to filter tables
function filterTable(tableId, query) {
    const table = document.getElementById(tableId);
    const tr = table.getElementsByTagName("tr");
    query = query.toLowerCase();

    for (let i = 1; i < tr.length; i++) {
        let match = false;
        const td = tr[i].getElementsByTagName("td");
        for (let j = 0; j < td.length; j++) {
            if (td[j]) {
                if (td[j].innerHTML.toLowerCase().indexOf(query) > -1) {
                    match = true;
                    break;
                }
            }
        }
        tr[i].style.display = match ? "" : "none";
    }
}

// Format Currency
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Format Date
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// ----------------------------------------------------
// Dashboard Logic
// ----------------------------------------------------
async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE}/dashboard`);
        const data = await res.json();
        document.getElementById('totalMembers').innerText = data.total_members;
        document.getElementById('totalTrainers').innerText = data.total_trainers;
        document.getElementById('totalRevenue').innerText = formatCurrency(data.total_revenue);
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// ----------------------------------------------------
// Members Logic
// ----------------------------------------------------
async function loadMembers() {
    try {
        const res = await fetch(`${API_BASE}/members`);
        const members = await res.json();
        const tbody = document.getElementById('membersTableBody');
        tbody.innerHTML = '';
        members.forEach(m => {
            tbody.innerHTML += `
                <tr>
                    <td>${m.id}</td>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td>${m.phone}</td>
                    <td>${formatDate(m.join_date)}</td>
                    <td>${m.membership || 'None'}</td>
                    <td>${m.trainer || 'None'}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading members:', err);
    }

    // Bind form submit
    const form = document.getElementById('addMemberForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('m_name').value,
                email: document.getElementById('m_email').value,
                phone: document.getElementById('m_phone').value,
                join_date: document.getElementById('m_join_date').value,
                membership_id: document.getElementById('m_membership_id').value,
                trainer_id: document.getElementById('m_trainer_id').value || null
            };
            await fetch(`${API_BASE}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toggleModal('addMemberModal');
            form.reset();
            loadMembers();
        };
    }
}

async function deleteMember(id) {
    if (confirm('Are you sure you want to delete this member?')) {
        await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE' });
        loadMembers();
    }
}

// ----------------------------------------------------
// Trainers Logic
// ----------------------------------------------------
async function loadTrainers() {
    try {
        const res = await fetch(`${API_BASE}/trainers`);
        const trainers = await res.json();
        const tbody = document.getElementById('trainersTableBody');
        tbody.innerHTML = '';
        trainers.forEach(t => {
            tbody.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.name}</td>
                    <td>${t.specialization}</td>
                    <td>${t.phone}</td>
                    <td>${formatDate(t.hire_date)}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteTrainer(${t.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading trainers:', err);
    }

    // Bind form submit
    const form = document.getElementById('addTrainerForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('t_name').value,
                specialization: document.getElementById('t_spec').value,
                phone: document.getElementById('t_phone').value,
                hire_date: document.getElementById('t_hire_date').value
            };
            await fetch(`${API_BASE}/trainers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toggleModal('addTrainerModal');
            form.reset();
            loadTrainers();
        };
    }
}

async function deleteTrainer(id) {
    if (confirm('Are you sure you want to delete this trainer?')) {
        await fetch(`${API_BASE}/trainers/${id}`, { method: 'DELETE' });
        loadTrainers();
    }
}

// ----------------------------------------------------
// Attendance Logic
// ----------------------------------------------------
async function loadAttendance() {
    try {
        const res = await fetch(`${API_BASE}/attendance`);
        const records = await res.json();
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '';
        records.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td>${r.id}</td>
                    <td>${r.member_name}</td>
                    <td>${formatDate(r.attendance_date)}</td>
                    <td>${r.check_in_time}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading attendance:', err);
    }

    const form = document.getElementById('addAttendanceForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                member_id: document.getElementById('a_member_id').value,
                attendance_date: document.getElementById('a_date').value,
                check_in_time: document.getElementById('a_time').value
            };
            await fetch(`${API_BASE}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toggleModal('addAttendanceModal');
            form.reset();
            loadAttendance();
        };
    }
}

// ----------------------------------------------------
// Payments Logic
// ----------------------------------------------------
async function loadPayments() {
    try {
        const res = await fetch(`${API_BASE}/payments`);
        const payments = await res.json();
        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = '';
        payments.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.member_name}</td>
                    <td>${formatCurrency(p.amount)}</td>
                    <td>${formatDate(p.payment_date)}</td>
                    <td>${p.payment_method}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading payments:', err);
    }

    const form = document.getElementById('addPaymentForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const payload = {
                member_id: document.getElementById('p_member_id').value,
                amount: document.getElementById('p_amount').value,
                payment_date: document.getElementById('p_date').value,
                payment_method: document.getElementById('p_method').value
            };
            await fetch(`${API_BASE}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            toggleModal('addPaymentModal');
            form.reset();
            loadPayments();
        };
    }
}

// ----------------------------------------------------
// Auth Logic (LocalStorage Mock for DBMS Project)
// ----------------------------------------------------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;

        // Fetch registered users from localStorage
        const users = JSON.parse(localStorage.getItem('gymAdmins')) || {};
        
        // Check if credentials match localStorage OR the default hardcoded admin
        if ((users[user] && users[user] === pass) || ((user === 'admin' || user === 'SOHAN_K_A') && pass === 'admin')) {
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('loginError').innerText = 'Invalid credentials. Please try again.';
        }
    };
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.onsubmit = (e) => {
        e.preventDefault();
        const user = document.getElementById('regUsername').value.trim();
        const pass = document.getElementById('regPassword').value;
        const confirmPass = document.getElementById('regConfirmPassword').value;
        const msgDiv = document.getElementById('registerMsg');

        if (pass !== confirmPass) {
            msgDiv.style.color = 'var(--danger)';
            msgDiv.innerText = 'Passwords do not match!';
            return;
        }

        if (user.length < 3) {
            msgDiv.style.color = 'var(--danger)';
            msgDiv.innerText = 'Username must be at least 3 characters long.';
            return;
        }

        let users = JSON.parse(localStorage.getItem('gymAdmins')) || {};
        
        if (users[user] || user === 'admin') {
            msgDiv.style.color = 'var(--danger)';
            msgDiv.innerText = 'Username already exists. Please choose another.';
            return;
        }

        // Save new user
        users[user] = pass;
        localStorage.setItem('gymAdmins', JSON.stringify(users));

        msgDiv.style.color = 'var(--success)';
        msgDiv.innerText = 'Registration successful! Redirecting to login...';

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    };
}

// ----------------------------------------------------
// Reports Logic
// ----------------------------------------------------
async function loadReports() {
    try {
        // 1. Members and Plans Report
        const resPlans = await fetch(`${API_BASE}/reports/members-plans`);
        const plansData = await resPlans.json();
        const plansBody = document.getElementById('plansReportTableBody');
        if (plansBody) {
            plansBody.innerHTML = '';
            plansData.forEach(row => {
                plansBody.innerHTML += `
                    <tr>
                        <td>${row.id}</td>
                        <td>${row.name}</td>
                        <td>${row.email}</td>
                        <td>${row.plan_type || 'None'}</td>
                        <td>${row.price ? formatCurrency(row.price) : 'N/A'}</td>
                        <td>${row.trainer_name || 'Unassigned'}</td>
                    </tr>
                `;
            });
        }

        // 2. Attendance Stats Report
        const resAttendance = await fetch(`${API_BASE}/reports/attendance-stats`);
        const attendanceData = await resAttendance.json();
        const attendanceBody = document.getElementById('attendanceReportTableBody');
        if (attendanceBody) {
            attendanceBody.innerHTML = '';
            attendanceData.forEach(row => {
                attendanceBody.innerHTML += `
                    <tr>
                        <td>${row.name}</td>
                        <td><strong>${row.total_visits}</strong> check-ins</td>
                    </tr>
                `;
            });
        }

        // 3. Revenue by Plan Report
        const resRevenue = await fetch(`${API_BASE}/reports/revenue-by-plan`);
        const revenueData = await resRevenue.json();
        const revenueBody = document.getElementById('revenueReportTableBody');
        if (revenueBody) {
            revenueBody.innerHTML = '';
            revenueData.forEach(row => {
                revenueBody.innerHTML += `
                    <tr>
                        <td><strong>${row.plan_type}</strong></td>
                        <td>${row.member_count} members</td>
                        <td><strong>${formatCurrency(row.total_revenue)}</strong></td>
                    </tr>
                `;
            });
        }
    } catch (err) {
        console.error('Error loading reports:', err);
    }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        window.location.href = 'index.html';
    };
}
