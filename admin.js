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

// Every table below is built with innerHTML from user-controlled data:
// full_name comes straight from the signup form, service_category and
// task_type from the client's own request row, filename from whatever
// they uploaded. Interpolated raw, any of those let a client store
// markup that then executes in an ADMIN's session -- the one session
// that holds admin RLS rights. Everything non-numeric goes through this.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clientLabel(userId) {
  const p = profilesById.get(userId);
  return escapeHtml(p ? (p.full_name || userId) : userId);
}

// A request moves draft -> awaiting_payment -> confirmed -> project.
// Until now this table could only do the last of those four steps: it
// showed the price read-only and offered "Create Project", with no way
// to set a price or record that the client had paid, so in practice
// both had to be done by hand in the Supabase table editor. Each row
// now offers exactly the one action its current status allows.
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

  body.innerHTML = requests.map((r) => {
    const priced = r.agreed_price != null;
    const upfront = priced ? (Number(r.agreed_price) * 0.3).toFixed(2) : null;

    // draft / awaiting_payment: price it (or re-price it -- the RPC
    // allows that while payment is still outstanding).
    const priceCell = (r.status === 'draft' || r.status === 'awaiting_payment')
      ? `<div class="admin-inline-form">
           <input type="number" step="0.01" min="0.01" placeholder="0.00"
                  value="${priced ? escapeHtml(Number(r.agreed_price).toFixed(2)) : ''}"
                  data-price-input="${escapeHtml(r.id)}">
           <button class="btn btn-secondary btn-sm" data-set-price="${escapeHtml(r.id)}">Set price</button>
         </div>
         ${priced ? `<span class="admin-hint">30% upfront = $${upfront}</span>` : ''}`
      : `$${Number(r.agreed_price).toFixed(2)}`;

    let nextStep;
    if (r.status === 'draft') {
      nextStep = '<span class="admin-hint">Set a price to send it for payment</span>';
    } else if (r.status === 'awaiting_payment') {
      nextStep = `<button class="btn btn-primary btn-sm" data-confirm-payment="${escapeHtml(r.id)}">Confirm USDT payment</button>`;
    } else if (requestIdsWithProjects.has(r.id)) {
      nextStep = '<span class="dash-status-pill">Project created</span>';
    } else {
      nextStep = `<button class="btn btn-primary btn-sm" data-create-project="${escapeHtml(r.id)}">Create Project</button>`;
    }

    return `
      <tr>
        <td>${clientLabel(r.user_id)}</td>
        <td>${escapeHtml(r.service_category)}</td>
        <td>${escapeHtml(r.task_type)}</td>
        <td>${escapeHtml(r.status.replace(/_/g, ' '))}</td>
        <td>${priceCell}</td>
        <td>${nextStep}</td>
      </tr>
    `;
  }).join('');

  body.querySelectorAll('[data-set-price]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.setPrice;
      const input = body.querySelector(`[data-price-input="${requestId}"]`);
      const price = parseFloat(input.value);
      if (!price || price <= 0) {
        alert('Enter an agreed price greater than zero.');
        return;
      }
      if (!confirm(`Set the agreed price to $${price.toFixed(2)}? The client will be asked to send $${(price * 0.3).toFixed(2)} in USDT (30% upfront).`)) return;

      const { error } = await supabaseClient.rpc('admin_set_request_price', {
        p_request_id: requestId,
        p_agreed_price: price
      });
      if (error) {
        alert('Failed to set price: ' + error.message);
        return;
      }
      await loadAll();
    });
  });

  // Deliberately a separate, explicit step from setting the price: with
  // PayRam's automated webhook out of the picture, nothing marks a USDT
  // transfer paid except an admin who has actually checked the chain.
  // Marking it paid is what fires the total_spend / Business Pool /
  // referral-points trigger from 0001, so it shouldn't be a stray click.
  body.querySelectorAll('[data-confirm-payment]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.confirmPayment;
      const request = requests.find((r) => r.id === requestId);
      const expected = (Number(request.agreed_price) * 0.3).toFixed(2);

      const entered = prompt(
        `Confirm the USDT (BEP20) transfer you have verified on-chain.\n\n` +
        `Expected 30% upfront: $${expected}\n` +
        `Enter the USD amount actually received:`,
        expected
      );
      if (entered === null) return;

      const amount = parseFloat(entered);
      if (!amount || amount <= 0) {
        alert('Enter a received amount greater than zero.');
        return;
      }

      const { error } = await supabaseClient.rpc('admin_confirm_request_payment', {
        p_request_id: requestId,
        p_amount: amount
      });
      if (error) {
        alert('Failed to confirm payment: ' + error.message);
        return;
      }
      await loadAll();
    });
  });

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
      <td>${escapeHtml(p.project_name)}</td>
      <td>${escapeHtml(p.status)}</td>
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
      <td>${escapeHtml(b.payment_type)}</td>
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
      <td>${escapeHtml(p.full_name || p.id)}</td>
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
        <td>${escapeHtml(PACKAGE_LABELS[s.package_key] || s.package_key)}</td>
        <td>$${Number(s.monthly_amount).toFixed(2)}</td>
        <td>${escapeHtml(s.next_due_date)}${overdue ? '<span class="admin-overdue-badge">Overdue</span>' : ''}</td>
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
  select.innerHTML = profiles.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.full_name || p.id)}</option>`).join('');
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

// -------- Client Attachments --------
// Storage RLS has no admin-read policy (see migration 0004) -- this
// goes through the admin-list-attachments edge function instead, which
// checks is_admin server-side and does the listing with the service
// role key. Download links are short-lived signed URLs, not a
// standing public policy, so "Refresh" re-fetches rather than caching.

function formatFileSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAttachments(attachments) {
  const body = document.getElementById('attachmentsTableBody');
  const empty = document.getElementById('attachmentsEmpty');
  if (!attachments.length) {
    empty.textContent = 'No attachments uploaded yet.';
    empty.style.display = 'block';
    body.innerHTML = '';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = attachments.map((a) => `
    <tr>
      <td>${escapeHtml(a.filename)}${a.sizeBytes != null ? ` <span class="dash-empty">(${formatFileSize(a.sizeBytes)})</span>` : ''}</td>
      <td>${escapeHtml(a.uploaderName)}</td>
      <td>${a.uploadedAt ? new Date(a.uploadedAt).toLocaleString() : '—'}</td>
      <td>${a.downloadUrl ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(a.downloadUrl)}" target="_blank" rel="noopener">Download</a>` : '—'}</td>
    </tr>
  `).join('');
}

async function loadAttachments() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  const body = document.getElementById('attachmentsTableBody');
  const empty = document.getElementById('attachmentsEmpty');
  body.innerHTML = '';
  empty.textContent = 'Loading…';
  empty.style.display = 'block';

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-list-attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({})
    });
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed (${resp.status})`);
    }
    const { attachments } = await resp.json();
    renderAttachments(attachments);
  } catch (err) {
    console.error('Failed to load attachments', err);
    body.innerHTML = '';
    empty.textContent = 'Failed to load attachments: ' + err.message;
    empty.style.display = 'block';
  }
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
  document.getElementById('attachmentsRefreshBtn').addEventListener('click', loadAttachments);
  await loadAll();
  await loadAttachments();
})();
