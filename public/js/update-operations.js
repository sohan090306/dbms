const SUPABASE_URL = 'https://rsimagfemyjqppevqdwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaW1hZ2ZlbXlqcXBwZXZxZHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTU4NDUsImV4cCI6MjA5NDc3MTg0NX0.FfexQ';
let sb = null;

// Dynamic loader for Supabase SDK
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

// ====================================================
// UPDATE MEMBER OPERATION
// ====================================================

/**
 * Update Member with New Data
 * @param {number} memberId - ID of member to update
 * @param {object} newData - New member data
 * 
 * Example: updateMember(1, { name: 'John Updated', email: 'john.new@gmail.com', phone: '555-0001' })
 */
async function updateMember(memberId, newData) {
    try {
        const client = await getSupabase();
        
        // Validate input
        if (!memberId) {
            throw new Error('Member ID is required');
        }

        const { data, error } = await client
            .from('members')
            .update({
                name: newData.name || undefined,
                email: newData.email || undefined,
                phone: newData.phone || undefined,
                join_date: newData.join_date || undefined,
                membership_id: newData.membership_id ? parseInt(newData.membership_id) : undefined,
                trainer_id: newData.trainer_id ? parseInt(newData.trainer_id) : undefined
            })
            .eq('id', memberId)
            .select()
            .single();

        if (error) throw error;
        
        console.log('Member updated successfully:', data);
        alert('Member updated successfully!');
        loadMembers();
        return data;
    } catch (err) {
        console.error('Error updating member:', err);
        alert('Error updating member: ' + err.message);
    }
}

/**
 * Open Edit Member Modal
 */
async function editMember(memberId) {
    try {
        const client = await getSupabase();
        const { data: member, error } = await client
            .from('members')
            .select('*')
            .eq('id', memberId)
            .single();

        if (error) throw error;

        // Populate form with existing data
        document.getElementById('edit_m_id').value = member.id;
        document.getElementById('edit_m_name').value = member.name;
        document.getElementById('edit_m_email').value = member.email || '';
        document.getElementById('edit_m_phone').value = member.phone || '';
        document.getElementById('edit_m_join_date').value = member.join_date || '';
        document.getElementById('edit_m_membership_id').value = member.membership_id || '';
        document.getElementById('edit_m_trainer_id').value = member.trainer_id || '';

        toggleModal('editMemberModal');
    } catch (err) {
        alert('Error loading member data: ' + err.message);
    }
}

// ====================================================
// UPDATE TRAINER OPERATION
// ====================================================

/**
 * Update Trainer with New Data
 */
async function updateTrainer(trainerId, newData) {
    try {
        const client = await getSupabase();

        if (!trainerId) {
            throw new Error('Trainer ID is required');
        }

        const { data, error } = await client
            .from('trainers')
            .update({
                name: newData.name || undefined,
                specialization: newData.specialization || undefined,
                phone: newData.phone || undefined,
                hire_date: newData.hire_date || undefined
            })
            .eq('id', trainerId)
            .select()
            .single();

        if (error) throw error;

        console.log('Trainer updated successfully:', data);
        alert('Trainer updated successfully!');
        loadTrainers();
        return data;
    } catch (err) {
        console.error('Error updating trainer:', err);
        alert('Error updating trainer: ' + err.message);
    }
}

/**
 * Open Edit Trainer Modal
 */
async function editTrainer(trainerId) {
    try {
        const client = await getSupabase();
        const { data: trainer, error } = await client
            .from('trainers')
            .select('*')
            .eq('id', trainerId)
            .single();

        if (error) throw error;

        document.getElementById('edit_t_id').value = trainer.id;
        document.getElementById('edit_t_name').value = trainer.name;
        document.getElementById('edit_t_specialization').value = trainer.specialization;
        document.getElementById('edit_t_phone').value = trainer.phone || '';
        document.getElementById('edit_t_hire_date').value = trainer.hire_date || '';

        toggleModal('editTrainerModal');
    } catch (err) {
        alert('Error loading trainer data: ' + err.message);
    }
}

// ====================================================
// UPDATE PAYMENT OPERATION
// ====================================================

/**
 * Update Payment with New Data
 */
async function updatePayment(paymentId, newData) {
    try {
        const client = await getSupabase();

        if (!paymentId) {
            throw new Error('Payment ID is required');
        }

        const { data, error } = await client
            .from('payments')
            .update({
                amount: newData.amount ? parseFloat(newData.amount) : undefined,
                payment_date: newData.payment_date || undefined,
                payment_method: newData.payment_method || undefined
            })
            .eq('id', paymentId)
            .select()
            .single();

        if (error) throw error;

        console.log('Payment updated successfully:', data);
        alert('Payment updated successfully!');
        loadPayments();
        return data;
    } catch (err) {
        console.error('Error updating payment:', err);
        alert('Error updating payment: ' + err.message);
    }
}

/**
 * Open Edit Payment Modal
 */
async function editPayment(paymentId) {
    try {
        const client = await getSupabase();
        const { data: payment, error } = await client
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;

        document.getElementById('edit_p_id').value = payment.id;
        document.getElementById('edit_p_member_id').value = payment.member_id;
        document.getElementById('edit_p_amount').value = payment.amount;
        document.getElementById('edit_p_date').value = payment.payment_date;
        document.getElementById('edit_p_method').value = payment.payment_method || '';

        toggleModal('editPaymentModal');
    } catch (err) {
        alert('Error loading payment data: ' + err.message);
    }
}

// ====================================================
// UPDATE MEMBERSHIP PLAN
// ====================================================

/**
 * Update Membership Plan Price
 */
async function updateMembershipPlan(membershipId, newData) {
    try {
        const client = await getSupabase();

        if (!membershipId) {
            throw new Error('Membership ID is required');
        }

        const { data, error } = await client
            .from('memberships')
            .update({
                price: newData.price ? parseFloat(newData.price) : undefined,
                description: newData.description || undefined
            })
            .eq('id', membershipId)
            .select()
            .single();

        if (error) throw error;

        console.log('Membership plan updated successfully:', data);
        alert('Membership plan updated successfully!');
        return data;
    } catch (err) {
        console.error('Error updating membership plan:', err);
        alert('Error updating membership plan: ' + err.message);
    }
}

// ====================================================
// BULK UPDATE OPERATIONS
// ====================================================

/**
 * Update Multiple Members with Same Trainer
 */
async function assignTrainerToMembers(trainerIds, memberIds) {
    try {
        const client = await getSupabase();

        for (const memberId of memberIds) {
            const { error } = await client
                .from('members')
                .update({ trainer_id: trainerIds })
                .eq('id', memberId);

            if (error) throw error;
        }

        console.log('Trainers assigned to multiple members successfully');
        alert('Trainers assigned successfully!');
        loadMembers();
    } catch (err) {
        console.error('Error assigning trainers:', err);
        alert('Error assigning trainers: ' + err.message);
    }
}

/**
 * Upgrade Members to Premium Membership
 */
async function upgradeMembershipPlan(memberIds, newMembershipId) {
    try {
        const client = await getSupabase();

        for (const memberId of memberIds) {
            const { error } = await client
                .from('members')
                .update({ membership_id: newMembershipId })
                .eq('id', memberId);

            if (error) throw error;
        }

        console.log('Members upgraded to new membership plan');
        alert('Members upgraded successfully!');
        loadMembers();
    } catch (err) {
        console.error('Error upgrading members:', err);
        alert('Error upgrading members: ' + err.message);
    }
}

// ====================================================
// ATTENDANCE UPDATE
// ====================================================

/**
 * Update Attendance Record
 */
async function updateAttendance(attendanceId, newData) {
    try {
        const client = await getSupabase();

        if (!attendanceId) {
            throw new Error('Attendance ID is required');
        }

        const { data, error } = await client
            .from('attendance')
            .update({
                attendance_date: newData.attendance_date || undefined,
                check_in_time: newData.check_in_time || undefined
            })
            .eq('id', attendanceId)
            .select()
            .single();

        if (error) throw error;

        console.log('Attendance updated successfully:', data);
        alert('Attendance updated successfully!');
        loadAttendance();
        return data;
    } catch (err) {
        console.error('Error updating attendance:', err);
        alert('Error updating attendance: ' + err.message);
    }
}

// ====================================================
// FORM SUBMIT HANDLERS FOR UPDATES
// ====================================================

/**
 * Handle Edit Member Form Submit
 */
function setupEditMemberForm() {
    const form = document.getElementById('editMemberForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const memberId = document.getElementById('edit_m_id').value;
            const newData = {
                name: document.getElementById('edit_m_name').value,
                email: document.getElementById('edit_m_email').value,
                phone: document.getElementById('edit_m_phone').value,
                join_date: document.getElementById('edit_m_join_date').value,
                membership_id: document.getElementById('edit_m_membership_id').value,
                trainer_id: document.getElementById('edit_m_trainer_id').value
            };

            await updateMember(memberId, newData);
            toggleModal('editMemberModal');
        };
    }
}

/**
 * Handle Edit Trainer Form Submit
 */
function setupEditTrainerForm() {
    const form = document.getElementById('editTrainerForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const trainerId = document.getElementById('edit_t_id').value;
            const newData = {
                name: document.getElementById('edit_t_name').value,
                specialization: document.getElementById('edit_t_specialization').value,
                phone: document.getElementById('edit_t_phone').value,
                hire_date: document.getElementById('edit_t_hire_date').value
            };

            await updateTrainer(trainerId, newData);
            toggleModal('editTrainerModal');
        };
    }
}

/**
 * Handle Edit Payment Form Submit
 */
function setupEditPaymentForm() {
    const form = document.getElementById('editPaymentForm');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const paymentId = document.getElementById('edit_p_id').value;
            const newData = {
                amount: document.getElementById('edit_p_amount').value,
                payment_date: document.getElementById('edit_p_date').value,
                payment_method: document.getElementById('edit_p_method').value
            };

            await updatePayment(paymentId, newData);
            toggleModal('editPaymentModal');
        };
    }
}

// Initialize all form handlers when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupEditMemberForm();
    setupEditTrainerForm();
    setupEditPaymentForm();
});
