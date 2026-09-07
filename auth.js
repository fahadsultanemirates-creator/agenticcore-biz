// AgenticCore Biz — Authentication logic

function showAuthError(el, message) {
  el.textContent = message;
  el.style.display = 'block';
}

function hideAuthError(el) {
  el.style.display = 'none';
}

function setLoading(btn, loading, defaultText) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : defaultText;
}

// -------- SIGN UP --------
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('authError');
    const btn = document.getElementById('signupBtn');
    hideAuthError(errorEl);

    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const referralCode = new URLSearchParams(window.location.search).get('ref') || null;

    if (password.length < 8) {
      showAuthError(errorEl, 'Password must be at least 8 characters.');
      return;
    }

    setLoading(btn, true, 'Create account');

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          referred_by: referralCode
        }
      }
    });

    setLoading(btn, false, 'Create account');

    if (error) {
      showAuthError(errorEl, error.message);
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation required
      window.location.href = 'check-email.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  });
}

// -------- LOG IN --------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('authError');
    const btn = document.getElementById('loginBtn');
    hideAuthError(errorEl);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    setLoading(btn, true, 'Log in');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    setLoading(btn, false, 'Log in');

    if (error) {
      showAuthError(errorEl, 'Incorrect email or password.');
      return;
    }

    window.location.href = 'dashboard.html';
  });
}

// -------- FORGOT PASSWORD --------
// Uses Supabase Auth's own built-in recovery email (no custom email
// infrastructure needed) -- resetPasswordForEmail sends a link that
// lands the visitor back on reset-password.html with a recovery
// session, which updateUser() below then acts on.
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    const btn = document.getElementById('forgotPasswordBtn');
    hideAuthError(errorEl);
    successEl.style.display = 'none';

    const email = document.getElementById('email').value.trim();

    setLoading(btn, true, 'Send reset link');

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    setLoading(btn, false, 'Send reset link');

    if (error) {
      showAuthError(errorEl, error.message);
      return;
    }

    forgotPasswordForm.hidden = true;
    successEl.textContent = "If an account exists for that email, we've sent a link to reset your password.";
    successEl.style.display = 'block';
  });
}

// -------- RESET PASSWORD --------
// Supabase's client auto-detects the recovery session from the link's
// URL and fires a PASSWORD_RECOVERY auth event -- that's the signal
// this is a genuine reset link, not just someone visiting the page.
// Falls back to checking for any active session shortly after, and to
// an "invalid or expired" state if neither shows up in time.
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
  const subEl = document.getElementById('resetPasswordSub');
  const errorEl = document.getElementById('authError');
  const successEl = document.getElementById('authSuccess');
  const footerEl = document.getElementById('resetPasswordFooter');
  let recoveryReady = false;

  function showResetForm() {
    if (recoveryReady) return;
    recoveryReady = true;
    subEl.textContent = 'Enter a new password for your account.';
    resetPasswordForm.hidden = false;
  }

  function showInvalidLink() {
    if (recoveryReady) return;
    subEl.style.display = 'none';
    showAuthError(errorEl, 'This password reset link is invalid or has expired.');
    footerEl.hidden = false;
  }

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') showResetForm();
  });

  (async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) showResetForm();
  })();

  setTimeout(() => {
    if (!recoveryReady) showInvalidLink();
  }, 2500);

  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAuthError(errorEl);

    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('resetPasswordBtn');

    if (password.length < 8) {
      showAuthError(errorEl, 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showAuthError(errorEl, 'Passwords do not match.');
      return;
    }

    setLoading(btn, true, 'Update password');

    const { error } = await supabaseClient.auth.updateUser({ password });

    setLoading(btn, false, 'Update password');

    if (error) {
      showAuthError(errorEl, error.message);
      return;
    }

    resetPasswordForm.hidden = true;
    subEl.style.display = 'none';
    successEl.textContent = 'Password updated! Redirecting to your dashboard…';
    successEl.style.display = 'block';
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
  });
}

// -------- LOG OUT (used on dashboard pages) --------
async function logOut() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// -------- ROUTE PROTECTION (used on dashboard pages) --------
async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
