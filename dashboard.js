// AgenticCore Biz — dashboard shell: header (points/referral/Business
// Pool), tab navigation, and read-only rendering of requests/projects/
// billing. The New Request submission flow itself lands in a later PR --
// this only needs to load and display whatever already exists.

const BUSINESS_POOL_THRESHOLD = 5000;
const UPFRONT_FRACTION = 0.3;
const USDT_BEP20_ADDRESS = '0x62Ad7D55fbc8A8591109D72b67Ec63aa1EE196bC';

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
  document.getElementById('referralLinkInputTab').value = referralLink;

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

function paymentSectionHtml(r) {
  if (r.status !== 'awaiting_payment' || !r.agreed_price) return '';

  const amountDue = (Number(r.agreed_price) * UPFRONT_FRACTION).toFixed(2);

  return `
    <div class="pay-cta" data-request-id="${r.id}">
      <p class="pay-cta-amount">$${amountDue} due now <span>(30% upfront)</span></p>
      <div class="pay-cta-actions">
        <button class="btn btn-primary btn-sm" data-action="pay-payram">Pay with PayRam</button>
        <button class="btn btn-secondary btn-sm" data-action="toggle-usdt">Pay with USDT (BEP20)</button>
      </div>
      <p class="pay-cta-status" hidden></p>
      <div class="usdt-panel" hidden>
        <p>Send exactly <strong>$${amountDue}</strong> worth of USDT on the <strong>BEP20 (BNB Smart Chain)</strong> network to:</p>
        <div class="usdt-address-row">
          <input type="text" readonly value="${USDT_BEP20_ADDRESS}">
          <button class="btn btn-secondary btn-sm" data-action="copy-usdt">Copy</button>
        </div>
        <img class="usdt-qr" src="usdt-bep20-qr.png" alt="USDT BEP20 payment address QR code" width="160" height="160">
        <p class="usdt-note">Only send USDT on BEP20 to this address — other networks or tokens cannot be recovered. Once sent, email <a href="mailto:hello@agenticcore.agency">hello@agenticcore.agency</a> with your transaction hash so we can confirm it and move your request forward.</p>
      </div>
    </div>
  `;
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
      <div class="dash-list-item dash-list-item-stacked">
        <div class="dash-list-item-row">
          <div>
            <strong>${r.task_type}</strong>
            <p>${r.service_category}</p>
          </div>
          <span class="dash-status-pill">${statusLabel(r.status)}</span>
        </div>
        ${paymentSectionHtml(r)}
      </div>
    `).join('');
    attachPaymentHandlers(requestsList);
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

function attachPaymentHandlers(container) {
  container.addEventListener('click', async (e) => {
    const payBtn = e.target.closest('[data-action="pay-payram"]');
    const usdtToggle = e.target.closest('[data-action="toggle-usdt"]');
    const copyBtn = e.target.closest('[data-action="copy-usdt"]');
    if (!payBtn && !usdtToggle && !copyBtn) return;

    const card = e.target.closest('.pay-cta');
    const requestId = card.dataset.requestId;
    const statusEl = card.querySelector('.pay-cta-status');

    if (payBtn) {
      await initiatePayment(requestId, payBtn, statusEl);
    } else if (usdtToggle) {
      const panel = card.querySelector('.usdt-panel');
      panel.hidden = !panel.hidden;
    } else if (copyBtn) {
      const input = card.querySelector('.usdt-address-row input');
      input.select();
      navigator.clipboard.writeText(input.value);
      copyBtn.textContent = 'Copied';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    }
  });
}

function showPayCtaStatus(statusEl, message, isError) {
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusEl.classList.toggle('pay-cta-status-error', Boolean(isError));
}

async function initiatePayment(requestId, payBtn, statusEl) {
  payBtn.disabled = true;
  const originalText = payBtn.textContent;
  payBtn.textContent = 'Starting…';
  statusEl.hidden = true;

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const { data, error } = await supabaseClient.functions.invoke('payram-create-payment', {
      body: { requestId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error || data?.error) {
      showPayCtaStatus(
        statusEl,
        data?.error === 'PayRam is not configured for this environment yet'
          ? 'Card/crypto checkout via PayRam isn’t live yet — please use the USDT (BEP20) option below.'
          : 'Something went wrong starting PayRam checkout — please use the USDT (BEP20) option below or try again shortly.',
        true
      );
      return;
    }

    window.open(data.paymentUrl, '_blank', 'noopener');
  } catch (err) {
    console.error('initiatePayment failed', err);
    showPayCtaStatus(statusEl, 'Something went wrong starting PayRam checkout — please use the USDT (BEP20) option below.', true);
  } finally {
    payBtn.disabled = false;
    payBtn.textContent = originalText;
  }
}

function pointsHistoryLabel(row) {
  if (row.referral_tier === 1) return 'Direct referral — 20% earned';
  if (row.referral_tier === 2) return 'Level 2 referral — 10% earned';
  if (row.referral_tier === 3) return 'Level 3 referral — 5% earned';
  return 'Your own task — 10% back';
}

async function renderPointsHistory(userId) {
  const list = document.getElementById('pointsHistoryList');

  const { data: transactions, error } = await supabaseClient
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load points history', error);
    return;
  }

  if (transactions.length) {
    list.innerHTML = transactions.map((t) => `
      <div class="dash-list-item">
        <div>
          <strong>+${Number(t.amount).toFixed(2)} pts</strong>
          <p>${pointsHistoryLabel(t)}</p>
        </div>
        <span class="dash-status-pill">${new Date(t.created_at).toLocaleDateString()}</span>
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
  renderPointsHistory(session.user.id);

  function copyReferralLink(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    navigator.clipboard.writeText(input.value);
  }

  document.getElementById('copyReferralBtn').addEventListener('click', () => copyReferralLink('referralLinkInput'));
  document.getElementById('copyReferralBtnTab').addEventListener('click', () => copyReferralLink('referralLinkInputTab'));
})();
