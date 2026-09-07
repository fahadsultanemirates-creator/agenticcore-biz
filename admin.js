// AgenticCore Biz — admin panel. Client-side is_admin check here is UX
// only; the real gate is server-side (RLS admin_select_all_* policies
// and each RPC's own is_current_user_admin() check, from migration
// 0002_admin_panel.sql). A non-admin who bypasses this page's JS still
// can't read other users' rows or call the admin RPCs.

const PROJECT_STATUSES = ['in_progress', 'awaiting_review', 'revision_requested', 'delivered', 'approved'];
const BILLING_STATUSES = ['pending', 'paid', 'refunded'];
const SUBSCRIPTION_STATUSES = ['active', 'paused', 'cancelled'];
const PACKAGE_LABELS = {
  'starter-engine': 'AI Starter Engine',
  'omni-scale-growth-engine': 'Omni-Scale Growth Engine'
};
const PACKAGE_DEFAULT_AMOUNTS = {
  'starter-engine': 950,
  'omni-scale-growth-engine': 3450
};

let profilesById = new Map();

function clientLabel(userId) {
  const p = profilesById.get(userId);
  return p ? (p.full_name || userId) : userId;
}

function renderRequests(requests, projects) {
  const body = document.getElementById('requestsTableBody');
  const empty = document.getElementById('requestsEmpty');
  if (!requests.length) {
    empty.style.display = 'block';
    body.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  const requestIdsWithProjects = new Set(projects.map((p) => p.request_id));

  body.innerHTML = requests.map((r) => `
    <tr>
      <td>${clientLabel(r.user_id)}</td>
      <td>${r.service_category}</td>
      <td>${r.task_type}</td>
      <td>${r.agreed_price != null ? '$' + Number(r.agreed_price).toFixed(2) : '—'}</td>
      <td>${r.status}</td>
      <td>
        ${requestIdsWithProjects.has(r.id)
          ? '<span class="dash-status-pill">Project created</span>'
          : `<button class="btn btn-secondary btn-sm" data-create-project="${r.id}">Create Project</button>`}
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-create-project]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.createProject;
      const projectName = prompt('Project name:');
      if (!projectName) return;
      const { error } = await supabaseClient.rpc('admin_create_project_from_request', {
        p_request_id: requestId,
        p_project_name: projectName
      });
      if (error) {
        alert('Failed to create project: ' + error.message);
        return;
      }
      await loadAll();
    });
  });
}

function renderProjects(projects) {
  const body = document.getElementById('projectsTableBody');
  const empty = document.getElementById('projectsEmpty');
  if (!projects.length) {
    empty.style.display = 'block';
    body.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = projects.map((p) => `
    <tr>
      <td>${clientLabel(p.user_id)}</td>
      <td>${p.project_name}</td>
      <td>${p.status}</td>
      <td>${p.revisions_used} / 2</td>
      <td>
        <select data-project-status="${p.id}">
          ${PROJECT_STATUSES.map((s) => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" data-update-project="${p.id}">Update</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-update-project]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const projectId = btn.dataset.updateProject;
      const select = body.querySelector(`[data-project-status="${projectId}"]`);
      const { error } = await supabaseClient.rpc('admin_update_project_status', {
        p_project_id: projectId,
        p_new_status: select.value
      });
      if (error) {
        alert('Failed to update project: ' + error.message);
        return;
      }
      await loadAll();
    });
  });
}

function renderBilling(billing) {
  const body = document.getElementById('billingTableBody');
  const empty = document.getElementById('billingEmpty');
  if (!billing.length) {
    empty.style.display = 'block';
    body.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = billing.map((b) => `
    <tr>
      <td>${clientLabel(b.user_id)}</td>
      <td>$${Number(b.amount).toFixed(2)}</td>
      <td>${b.payment_type}</td>
      <td>
        <select data-billing-status="${b.id}">
          ${BILLING_STATUSES.map((s) => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" data-update-billing="${b.id}">Update</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-update-billing]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const billingId = btn.dataset.updateBilling;
      const select = body.querySelector(`[data-billing-status="${billingId}"]`);
      const { error } = await supabaseClient.rpc('admin_update_billing_status', {
        p_billing_id: billingId,
        p_new_status: select.value
      });
      if (error) {
        alert('Failed to update billing: ' + error.message);
        return;
      }
      await loadAll();
    });
  });
}

function renderProfiles(profiles) {
  const body = document.getElementById('profilesTableBody');
  body.innerHTML = profiles.map((p) => `
    <tr>
      <td>${p.full_name || p.id}</td>
      <td>$${Number(p.total_spend).toFixed(2)}</td>
      <td>${p.is_business_pool ? 'Yes' : 'No'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" data-toggle-bp="${p.id}" data-current="${p.is_business_pool}">
          ${p.is_business_pool ? 'Remove' : 'Flag'}
        </button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-toggle-bp]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.toggleBp;
      const newValue = btn.dataset.current !== 'true';
      const { error } = await supabaseClient.rpc('admin_set_business_pool', {
        p_user_id: userId,
        p_is_business_pool: newValue
      });
      if (error) {
        alert('Failed to update Business Pool status: ' + error.message);
        return;
      }
      await loadAll();
    });
  });
}

function renderSubscriptions(subscriptions) {
  const body = document.getElementById('subscriptionsTableBody');
  const empty = document.getElementById('subscriptionsEmpty');
  if (!subscriptions.length) {
    empty.style.display = 'block';
    body.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  const today = new Date().toISOString().slice(0, 10);

  body.innerHTML = subscriptions.map((s) => {
    const overdue = s.status === 'active' && s.next_due_date < today;
    return `
      <tr>
        <td>${clientLabel(s.user_id)}</td>
        <td>${PACKAGE_LABELS[s.package_key] || s.package_key}</td>
        <td>$${Number(s.monthly_amount).toFixed(2)}</td>
        <td>${s.next_due_date}${overdue ? '<span class="admin-overdue-badge">Overdue</span>' : ''}</td>
        <td>
          <select data-sub-status="${s.id}">
            ${SUBSCRIPTION_STATUSES.map((st) => `<option value="${st}" ${st === s.status ? 'selected' : ''}>${st}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" data-update-sub-status="${s.id}">Update</button>
        </td>
        <td>
          <button class="btn btn-primary btn-sm" data-record-payment="${s.id}">Record Payment</button>
        </td>
      </tr>
    `;
  }).join('');

  body.querySelectorAll('[data-update-sub-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const subId = btn.dataset.updateSubStatus;
      const select = body.querySelector(`[data-sub-status="${subId}"]`);
      const { error } = await supabaseClient.rpc('admin_update_subscription_status', {
        p_subscription_id: subId,
        p_new_status: select.value
      });
      if (error) {
        alert('Failed to update subscription: ' + error.message);
        return;
      }
      await loadAll();
    });
  });

  body.querySelectorAll('[data-record-payment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const subId = btn.dataset.recordPayment;
      if (!confirm('Record this cycle as paid? This creates a billing row and advances the next due date by one month.')) return;
      const { error } = await supabaseClient.rpc('admin_record_subscription_payment', {
        p_subscription_id: subId
      });
      if (error) {
        alert('Failed to record payment: ' + error.message);
        return;
      }
      await loadAll();
    });
  });
}

function populateSubUserSelect(profiles) {
  const select = document.getElementById('subUserSelect');
  const currentValue = select.value;
  select.innerHTML = profiles.map((p) => `<option value="${p.id}">${p.full_name || p.id}</option>`).join('');
  if (currentValue) select.value = currentValue;
}

function initSubscriptionForm() {
  document.getElementById('subPackageSelect').addEventListener('change', (e) => {
    document.getElementById('subAmountInput').value = PACKAGE_DEFAULT_AMOUNTS[e.target.value] || '';
  });

  document.getElementById('subCreateBtn').addEventListener('click', async () => {
    const userId = document.getElementById('subUserSelect').value;
    const packageKey = document.getElementById('subPackageSelect').value;
    const amount = parseFloat(document.getElementById('subAmountInput').value);
    const dueDate = document.getElementById('subDueDateInput').value;

    if (!userId || !amount || !dueDate) {
      alert('Fill in client, amount, and first due date.');
      return;
    }

    const { error } = await supabaseClient.rpc('admin_create_package_subscription', {
      p_user_id: userId,
      p_package_key: packageKey,
      p_monthly_amount: amount,
      p_first_due_date: dueDate
    });

    if (error) {
      alert('Failed to create subscription: ' + error.message);
      return;
    }

    document.getElementById('subDueDateInput').value = '';
    await loadAll();
  });
}

async function loadAll() {
  const [profilesRes, requestsRes, projectsRes, billingRes, subscriptionsRes] = await Promise.all([
    supabaseClient.from('profiles').select('*'),
    supabaseClient.from('requests').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('projects').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('billing').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('package_subscriptions').select('*').order('next_due_date', { ascending: true })
  ]);

  if (profilesRes.error || requestsRes.error || projectsRes.error || billingRes.error || subscriptionsRes.error) {
    console.error('Admin load failed', profilesRes.error, requestsRes.error, projectsRes.error, billingRes.error, subscriptionsRes.error);
    return;
  }

  profilesById = new Map(profilesRes.data.map((p) => [p.id, p]));

  renderRequests(requestsRes.data, projectsRes.data);
  renderProjects(projectsRes.data);
  renderBilling(billingRes.data);
  renderProfiles(profilesRes.data);
  renderSubscriptions(subscriptionsRes.data);
  populateSubUserSelect(profilesRes.data);
}

(async function init() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('userEmail').textContent = session.user.email;
  document.getElementById('logoutBtn').addEventListener('click', logOut);

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (error || !profile || !profile.is_admin) {
    document.getElementById('adminGate').hidden = false;
    return;
  }

  document.getElementById('adminContent').hidden = false;
  initSubscriptionForm();
  await loadAll();
})();
