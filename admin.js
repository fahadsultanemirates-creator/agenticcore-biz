// AgenticCore Biz — admin panel. Client-side is_admin check here is UX
// only; the real gate is server-side (RLS admin_select_all_* policies
// and each RPC's own is_current_user_admin() check, from migration
// 0002_admin_panel.sql). A non-admin who bypasses this page's JS still
// can't read other users' rows or call the admin RPCs.

const PROJECT_STATUSES = ['in_progress', 'awaiting_review', 'revision_requested', 'delivered', 'approved'];
const BILLING_STATUSES = ['pending', 'paid', 'refunded'];

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

async function loadAll() {
  const [profilesRes, requestsRes, projectsRes, billingRes] = await Promise.all([
    supabaseClient.from('profiles').select('*'),
    supabaseClient.from('requests').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('projects').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('billing').select('*').order('created_at', { ascending: false })
  ]);

  if (profilesRes.error || requestsRes.error || projectsRes.error || billingRes.error) {
    console.error('Admin load failed', profilesRes.error, requestsRes.error, projectsRes.error, billingRes.error);
    return;
  }

  profilesById = new Map(profilesRes.data.map((p) => [p.id, p]));

  renderRequests(requestsRes.data, projectsRes.data);
  renderProjects(projectsRes.data);
  renderBilling(billingRes.data);
  renderProfiles(profilesRes.data);
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
  await loadAll();
})();
