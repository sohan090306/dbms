const SUPABASE_URL = 'https://rsimagfemyjqppevqdwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaW1hZ2ZlbXlqcXBwZXZxZHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTU4NDUsImV4cCI6MjA5NDc3MTg0NX0.FfexQiBnx28DsLHHN6MuHaeeOC1JRooRLK_jjQ1Px74';
let sb = null;

// Dynamic loader for Supabase SDK from CDN
async function getSupabase() {
    if (sb) return sb;
    if (!window.supabase) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sb;
}

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
        const client = await getSupabase();
        
        // Fetch counts and revenue
        const { count: totalMembers, error: err1 } = await client
            .from('members')
            .select('*', { count: 'exact', head: true });
            
        const { count: totalTrainers, error: err2 } = await client
            .from('trainers')
            .select('*', { count: 'exact', head: true });
            
        const { data: payments, error: err3 } = await client
            .from('payments')
            .select('amount');
            
        if (err1 || err2 || err3) throw (err1 || err2 || err3);
        
        const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        document.getElementById('totalMembers').innerText = totalMembers || 0;
        document.getElementById('totalTrainers').innerText = totalTrainers || 0;
        document.getElementById('totalRevenue').innerText = formatCurrency(totalRevenue);
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// ----------------------------------------------------
// Members Logic
// ----------------------------------------------------
async function loadMembers() {
    try {
        const client = await getSupabase();
        const { data: members, error } = await client
            .from('members')
            .select(`
                id, name, email, phone, join_date,
                memberships (plan_type),
                trainers (name)
            `)
            .order('id', { ascending: true });
            
        if (error) throw error;
        
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
                    <td>${m.memberships?.plan_type || 'None'}</td>
                    <td>${m.trainers?.name || 'None'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openUpdateMemberModal(${m.id})">Update</button>
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
            const name = document.getElementById('m_name').value;
            const email = document.getElementById('m_email').value;
            const phone = document.getElementById('m_phone').value;
            const join_date = document.getElementById('m_join_date').value;
            const membership_id = document.getElementById('m_membership_id').value;
            const trainer_id = document.getElementById('m_trainer_id').value || null;

            try {
                const client = await getSupabase();
                const { data: memberData, error: memberError } = await client
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
                if (membership_id === '2') price = 135.00;
                else if (membership_id === '3') price = 500.00;

                const { error: paymentError } = await client
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
                const { error: attendanceError } = await client
                    .from('attendance')
                    .insert({
                        member_id: newMemberId,
                        attendance_date: join_date,
                        check_in_time: timeString
                    });
                if (attendanceError) console.error('Auto-attendance failed:', attendanceError);
                
                toggleModal('addMemberModal');
                form.reset();
                loadMembers();
            } catch (err) {
                alert('Error adding member: ' + err.message);
            }
        };
    }

    const updForm = document.getElementById('updateMemberForm');
    if (updForm) {
        updForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('upd_m_id').value;
            const name = document.getElementById('upd_m_name').value;
            const email = document.getElementById('upd_m_email').value;
            const phone = document.getElementById('upd_m_phone').value;
            const join_date = document.getElementById('upd_m_join_date').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('members').update({
                    name, email, phone, join_date
                }).eq('id', id);
                
                if (error) throw error;
                
                toggleModal('updateMemberModal');
                loadMembers();
            } catch (err) {
                alert('Error updating member: ' + err.message);
            }
        };
    }
}

async function openUpdateMemberModal(id) {
    try {
        const client = await getSupabase();
        const { data, error } = await client.from('members').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('upd_m_id').value = data.id;
        document.getElementById('upd_m_name').value = data.name;
        document.getElementById('upd_m_email').value = data.email;
        document.getElementById('upd_m_phone').value = data.phone || '';
        document.getElementById('upd_m_join_date').value = data.join_date;
        toggleModal('updateMemberModal');
    } catch (err) {
        alert('Error fetching member details: ' + err.message);
    }
}

async function deleteMember(id) {
    if (confirm('Are you sure you want to delete this member?')) {
        try {
            const client = await getSupabase();
            // Delete dependent records first to satisfy foreign key constraints
            await client.from('payments').delete().eq('member_id', id);
            await client.from('attendance').delete().eq('member_id', id);
            
            const { error } = await client.from('members').delete().eq('id', id);
            if (error) throw error;
            loadMembers();
        } catch (err) {
            alert('Error deleting member: ' + err.message);
        }
    }
}

// ----------------------------------------------------
// Trainers Logic
// ----------------------------------------------------
async function loadTrainers() {
    try {
        const client = await getSupabase();
        const { data: trainers, error } = await client
            .from('trainers')
            .select('*')
            .order('id', { ascending: true });
            
        if (error) throw error;
        
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
                        <button class="btn btn-secondary btn-sm" onclick="openUpdateTrainerModal(${t.id})">Update</button>
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
            const name = document.getElementById('t_name').value;
            const specialization = document.getElementById('t_spec').value;
            const phone = document.getElementById('t_phone').value;
            const hire_date = document.getElementById('t_hire_date').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('trainers').insert({
                    name, specialization, phone, hire_date
                });
                if (error) throw error;
                
                toggleModal('addTrainerModal');
                form.reset();
                loadTrainers();
            } catch (err) {
                alert('Error adding trainer: ' + err.message);
            }
        };
    }

    const updForm = document.getElementById('updateTrainerForm');
    if (updForm) {
        updForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('upd_t_id').value;
            const name = document.getElementById('upd_t_name').value;
            const specialization = document.getElementById('upd_t_spec').value;
            const phone = document.getElementById('upd_t_phone').value;
            const hire_date = document.getElementById('upd_t_hire_date').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('trainers').update({
                    name, specialization, phone, hire_date
                }).eq('id', id);
                
                if (error) throw error;
                
                toggleModal('updateTrainerModal');
                loadTrainers();
            } catch (err) {
                alert('Error updating trainer: ' + err.message);
            }
        };
    }
}

async function openUpdateTrainerModal(id) {
    try {
        const client = await getSupabase();
        const { data, error } = await client.from('trainers').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('upd_t_id').value = data.id;
        document.getElementById('upd_t_name').value = data.name;
        document.getElementById('upd_t_spec').value = data.specialization;
        document.getElementById('upd_t_phone').value = data.phone || '';
        document.getElementById('upd_t_hire_date').value = data.hire_date;
        toggleModal('updateTrainerModal');
    } catch (err) {
        alert('Error fetching trainer details: ' + err.message);
    }
}

async function deleteTrainer(id) {
    if (confirm('Are you sure you want to delete this trainer?')) {
        try {
            const client = await getSupabase();
            const { error } = await client.from('trainers').delete().eq('id', id);
            if (error) throw error;
            loadTrainers();
        } catch (err) {
            alert('Error deleting trainer: ' + err.message);
        }
    }
}

// ----------------------------------------------------
// Attendance Logic
// ----------------------------------------------------
async function loadAttendance() {
    try {
        const client = await getSupabase();
        const { data: records, error } = await client
            .from('attendance')
            .select(`
                id, attendance_date, check_in_time,
                members (name)
            `)
            .order('id', { ascending: true });
            
        if (error) throw error;
        
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '';
        records.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td>${r.id}</td>
                    <td>${r.members?.name || 'Unknown'}</td>
                    <td>${formatDate(r.attendance_date)}</td>
                    <td>${r.check_in_time}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openUpdateAttendanceModal(${r.id})">Update</button>
                    </td>
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
            const member_id = document.getElementById('a_member_id').value;
            const attendance_date = document.getElementById('a_date').value;
            const check_in_time = document.getElementById('a_time').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('attendance').insert({
                    member_id: parseInt(member_id),
                    attendance_date,
                    check_in_time
                });
                if (error) throw error;
                
                toggleModal('addAttendanceModal');
                form.reset();
                loadAttendance();
            } catch (err) {
                alert('Error recording attendance: ' + err.message);
            }
        };
    }

    const updForm = document.getElementById('updateAttendanceForm');
    if (updForm) {
        updForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('upd_a_id').value;
            const member_id = document.getElementById('upd_a_member_id').value;
            const attendance_date = document.getElementById('upd_a_date').value;
            const check_in_time = document.getElementById('upd_a_time').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('attendance').update({
                    member_id: parseInt(member_id),
                    attendance_date,
                    check_in_time
                }).eq('id', id);
                
                if (error) throw error;
                
                toggleModal('updateAttendanceModal');
                loadAttendance();
            } catch (err) {
                alert('Error updating attendance: ' + err.message);
            }
        };
    }
}

async function openUpdateAttendanceModal(id) {
    try {
        const client = await getSupabase();
        const { data, error } = await client.from('attendance').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('upd_a_id').value = data.id;
        document.getElementById('upd_a_member_id').value = data.member_id;
        document.getElementById('upd_a_date').value = data.attendance_date;
        document.getElementById('upd_a_time').value = data.check_in_time;
        toggleModal('updateAttendanceModal');
    } catch (err) {
        alert('Error fetching attendance details: ' + err.message);
    }
}

// ----------------------------------------------------
// Payments Logic
// ----------------------------------------------------
async function loadPayments() {
    try {
        const client = await getSupabase();
        const { data: payments, error } = await client
            .from('payments')
            .select(`
                id, amount, payment_date, payment_method,
                members (name)
            `)
            .order('id', { ascending: true });
            
        if (error) throw error;
        
        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = '';
        payments.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.members?.name || 'Unknown'}</td>
                    <td>${formatCurrency(p.amount)}</td>
                    <td>${formatDate(p.payment_date)}</td>
                    <td>${p.payment_method}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="openUpdatePaymentModal(${p.id})">Update</button>
                    </td>
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
            const member_id = document.getElementById('p_member_id').value;
            const amount = document.getElementById('p_amount').value;
            const payment_date = document.getElementById('p_date').value;
            const payment_method = document.getElementById('p_method').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('payments').insert({
                    member_id: parseInt(member_id),
                    amount: parseFloat(amount),
                    payment_date,
                    payment_method
                });
                if (error) throw error;
                
                toggleModal('addPaymentModal');
                form.reset();
                loadPayments();
            } catch (err) {
                alert('Error recording payment: ' + err.message);
            }
        };
    }

    const updForm = document.getElementById('updatePaymentForm');
    if (updForm) {
        updForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('upd_p_id').value;
            const member_id = document.getElementById('upd_p_member_id').value;
            const amount = document.getElementById('upd_p_amount').value;
            const payment_date = document.getElementById('upd_p_date').value;
            const payment_method = document.getElementById('upd_p_method').value;

            try {
                const client = await getSupabase();
                const { error } = await client.from('payments').update({
                    member_id: parseInt(member_id),
                    amount: parseFloat(amount),
                    payment_date,
                    payment_method
                }).eq('id', id);
                
                if (error) throw error;
                
                toggleModal('updatePaymentModal');
                loadPayments();
            } catch (err) {
                alert('Error updating payment: ' + err.message);
            }
        };
    }
}

async function openUpdatePaymentModal(id) {
    try {
        const client = await getSupabase();
        const { data, error } = await client.from('payments').select('*').eq('id', id).single();
        if (error) throw error;
        
        document.getElementById('upd_p_id').value = data.id;
        document.getElementById('upd_p_member_id').value = data.member_id;
        document.getElementById('upd_p_amount').value = data.amount;
        document.getElementById('upd_p_date').value = data.payment_date;
        document.getElementById('upd_p_method').value = data.payment_method;
        toggleModal('updatePaymentModal');
    } catch (err) {
        alert('Error fetching payment details: ' + err.message);
    }
}

// ----------------------------------------------------
// Auth Logic (Database-backed for DBMS Project)
// ----------------------------------------------------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        errorDiv.innerText = '';

        try {
            const client = await getSupabase();
            const { data: admin, error } = await client
                .from('admins')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .maybeSingle();

            if (error) throw error;
            if (!admin) {
                errorDiv.innerText = 'Invalid username or password.';
                return;
            }

            localStorage.setItem('gymAdminLoggedIn', username);
            window.location.href = 'dashboard.html';
        } catch (err) {
            errorDiv.style.color = 'var(--danger)';
            errorDiv.innerText = 'Error connecting to database: ' + err.message;
            console.error(err);
        }
    };
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPass = document.getElementById('regConfirmPassword').value;
        const msgDiv = document.getElementById('registerMsg');

        msgDiv.innerText = '';

        if (password !== confirmPass) {
            msgDiv.style.color = 'var(--danger)';
            msgDiv.innerText = 'Passwords do not match!';
            return;
        }

        if (username.length < 3) {
            msgDiv.style.color = 'var(--danger)';
            msgDiv.innerText = 'Username must be at least 3 characters long.';
            return;
        }

        try {
            const client = await getSupabase();
            const { data: existing, error: checkError } = await client
                .from('admins')
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existing) {
                msgDiv.style.color = 'var(--danger)';
                msgDiv.innerText = 'Username already exists.';
                return;
            }

            const { error: insertError } = await client
                .from('admins')
                .insert({ username, password });

            if (insertError) throw insertError;

            msgDiv.style.color = 'var(--success)';
            msgDiv.innerText = 'Registration successful! Redirecting to login...';

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (err) {
            msgDiv.style.color = 'var(--danger)';
            msgDiv.innerText = 'Error saving registration: ' + err.message;
            console.error(err);
        }
    };
}

// ----------------------------------------------------
// Reports Logic
// ----------------------------------------------------
async function loadReports() {
    try {
        const client = await getSupabase();

        // 1. Members and Plans Report
        const { data: plansData, error: err1 } = await client
            .from('members')
            .select(`
                id, name, email,
                memberships (plan_type, price),
                trainers (name)
            `)
            .order('id', { ascending: true });

        if (err1) throw err1;

        const plansBody = document.getElementById('plansReportTableBody');
        if (plansBody) {
            plansBody.innerHTML = '';
            plansData.forEach(row => {
                plansBody.innerHTML += `
                    <tr>
                        <td>${row.id}</td>
                        <td>${row.name}</td>
                        <td>${row.email}</td>
                        <td>${row.memberships?.plan_type || 'None'}</td>
                        <td>${row.memberships?.price ? formatCurrency(row.memberships.price) : 'N/A'}</td>
                        <td>${row.trainers?.name || 'Unassigned'}</td>
                    </tr>
                `;
            });
        }

        // 2. Attendance Stats Report
        const { data: attendanceRaw, error: err2 } = await client
            .from('members')
            .select(`
                name,
                attendance (id)
            `);

        if (err2) throw err2;

        const attendanceData = attendanceRaw.map(m => ({
            name: m.name,
            total_visits: m.attendance?.length || 0
        })).sort((a, b) => b.total_visits - a.total_visits);

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
        const { data: membershipsRaw, error: err3 } = await client
            .from('memberships')
            .select(`
                plan_type,
                members (
                    id,
                    payments (amount)
                )
            `);

        if (err3) throw err3;

        const revenueData = membershipsRaw.map(mb => {
            const memberCount = mb.members?.length || 0;
            let totalRevenue = 0;
            if (mb.members) {
                mb.members.forEach(m => {
                    if (m.payments) {
                        m.payments.forEach(p => {
                            totalRevenue += parseFloat(p.amount || 0);
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
