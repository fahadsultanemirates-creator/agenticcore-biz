// AgenticCore Biz — dashboard shell: header (points/referral/Business
// Pool), tab navigation, and read-only rendering of requests/projects/
// billing. The New Request submission flow itself lands in a later PR --
// this only needs to load and display whatever already exists.

const BUSINESS_POOL_THRESHOLD = 5000;

function initTabs() {
  const tabs = document.querySelectorAll('.dash-tab');
  const panels = document.querySelectorAll('.dash-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.dash-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });
}

function renderHeader(profile) {
  document.getElementById('pointsBalance').textContent = `${Number(profile.points_balance).toFixed(0)} pts`;

  const referralLink = `${window.location.origin}/signup.html?ref=${profile.referral_code}`;
  document.getElementById('referralLinkInput').value = referralLink;

  const bpCard = document.getElementById('bpCard');
  if (profile.is_business_pool) {
    bpCard.innerHTML = `
      <span class="bp-tag">Business Pool</span>
      <p class="bp-unlocked">You're in the Business Pool — a dedicated manager, 20% off every service, and faster delivery are active on your account.</p>
    `;
  } else {
    const spend = Number(profile.total_spend);
    const pct = Math.min(100, Math.round((spend / BUSINESS_POOL_THRESHOLD) * 100));
    const remaining = Math.max(0, BUSINESS_POOL_THRESHOLD - spend);
    bpCard.innerHTML = `
      <span class="bp-tag">Business Pool</span>
      <p>$${remaining.toFixed(0)} more in lifetime spend unlocks Business Pool — a dedicated manager, 20% off every service, and faster delivery.</p>
      <div class="bp-progress"><div class="bp-progress-fill" style="width:${pct}%"></div></div>
    `;
  }
}

function statusLabel(status) {
  return status.replace(/_/g, ' ');
}

async function renderProjectsPanel(userId) {
  const requestsList = document.getElementById('requestsList');
  const projectsList = document.getElementById('projectsList');

  const { data: requests, error: requestsError } = await supabaseClient
    .from('requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['draft', 'awaiting_payment'])
    .order('created_at', { ascending: false });

  if (requestsError) {
    console.error('Failed to load requests', requestsError);
  } else if (requests.length) {
    requestsList.innerHTML = requests.map((r) => `
      <div class="dash-list-item">
        <div>
          <strong>${r.task_type}</strong>
          <p>${r.service_category}</p>
        </div>
        <span class="dash-status-pill">${statusLabel(r.status)}</span>
      </div>
    `).join('');
  }

  const { data: projects, error: projectsError } = await supabaseClient
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Failed to load projects', projectsError);
  } else if (projects.length) {
    projectsList.innerHTML = projects.map((p) => `
      <div class="dash-list-item">
        <div>
          <strong>${p.project_name}</strong>
        </div>
        <span class="dash-status-pill">${statusLabel(p.status)}</span>
      </div>
    `).join('');
  }
}

async function renderBillingPanel(userId) {
  const billingList = document.getElementById('billingList');

  const { data: billing, error } = await supabaseClient
    .from('billing')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load billing', error);
    return;
  }

  if (billing.length) {
    billingList.innerHTML = billing.map((b) => `
      <div class="dash-list-item">
        <div>
          <strong>$${Number(b.amount).toFixed(2)}</strong>
          <p>${statusLabel(b.payment_type)}</p>
        </div>
        <span class="dash-status-pill">${statusLabel(b.status)}</span>
      </div>
    `).join('');
  }
}

(async function init() {
  const session = await requireAuth();
  if (!session) return;

  document.getElementById('userEmail').textContent = session.user.email;
  document.getElementById('logoutBtn').addEventListener('click', logOut);

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    console.error('Failed to load profile', error);
    return;
  }

  renderHeader(profile);
  initTabs();
  renderProjectsPanel(session.user.id);
  renderBillingPanel(session.user.id);

  document.getElementById('copyReferralBtn').addEventListener('click', () => {
    const input = document.getElementById('referralLinkInput');
    input.select();
    navigator.clipboard.writeText(input.value);
  });
})();
