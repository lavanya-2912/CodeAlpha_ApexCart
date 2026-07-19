import {
  loginUser,
  registerUser,
  sendForgotPasswordEmail,
  resetUserPassword,
  verifyUserEmail
} from '../services/auth.js';
import { showToast } from '../components/toast.js';
import state from '../state.js';

// --- 1. LOGIN RENDERER ---
export const renderLogin = (container, params, query) => {
  const redirect = query.redirect || '';

  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center py-4">
        <div class="col-md-6 col-lg-5">
          <div class="glass-panel p-4 p-sm-5 border-color">
            
            <div class="text-center mb-4">
              <h2 class="fw-bold text-heading mb-1">Welcome Back</h2>
              <p class="text-muted">Sign in to resume your premium shopping</p>
            </div>

            <form id="login-form">
              <div class="mb-3">
                <label for="login-email" class="form-label small fw-bold">Email Address</label>
                <input type="email" class="form-control bg-light border-color" id="login-email" placeholder="name@example.com" required autocomplete="email">
              </div>

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label for="login-password" class="form-label small fw-bold mb-0">Password</label>
                  <a href="#/forgot-password" class="small text-primary text-decoration-none">Forgot Password?</a>
                </div>
                <input type="password" class="form-control bg-light border-color" id="login-password" placeholder="••••••••" required autocomplete="current-password">
              </div>

              <div class="form-check mb-4">
                <input class="form-check-input" type="checkbox" id="login-remember">
                <label class="form-check-label text-muted" for="login-remember">Remember Me for 30 days</label>
              </div>

              <button type="submit" id="btn-login-submit" class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold">
                Sign In
              </button>
            </form>

            <hr class="my-4 border-color">

            <div class="text-center text-muted fs-7">
              <span>Don't have an account?</span>
              <a href="#/register${redirect ? `?redirect=${redirect}` : ''}" class="text-primary fw-semibold text-decoration-none ms-1">Create Account</a>
            </div>

          </div>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-login-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember').checked;

    try {
      await loginUser(email, password, rememberMe);
      showToast('Signed in successfully!');
      
      // Route user to redirect target or dashboard
      if (redirect === 'checkout') {
        window.location.hash = '#/checkout';
      } else {
        window.location.hash = '#/';
      }
    } catch (err) {
      showToast(err.message, 'danger');
      btn.disabled = false;
      btn.innerText = 'Sign In';
    }
  });
};


// --- 2. REGISTER RENDERER ---
export const renderRegister = (container, params, query) => {
  const redirect = query.redirect || '';

  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center py-4">
        <div class="col-md-6 col-lg-5">
          <div class="glass-panel p-4 p-sm-5 border-color">
            
            <div class="text-center mb-4">
              <h2 class="fw-bold text-heading mb-1">Create Account</h2>
              <p class="text-muted">Register to checkout and track purchases</p>
            </div>

            <form id="register-form">
              <div class="mb-3">
                <label for="reg-name" class="form-label small fw-bold">Full Name</label>
                <input type="text" class="form-control bg-light border-color" id="reg-name" placeholder="John Doe" required autocomplete="name">
              </div>

              <div class="mb-3">
                <label for="reg-email" class="form-label small fw-bold">Email Address</label>
                <input type="email" class="form-control bg-light border-color" id="reg-email" placeholder="name@example.com" required autocomplete="email">
              </div>

              <div class="mb-4">
                <label for="reg-password" class="form-label small fw-bold">Password</label>
                <input type="password" class="form-control bg-light border-color" id="reg-password" placeholder="Min. 6 characters" required autocomplete="new-password" minlength="6">
              </div>

              <button type="submit" id="btn-register-submit" class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold">
                Create Account
              </button>
            </form>

            <hr class="my-4 border-color">

            <div class="text-center text-muted fs-7">
              <span>Already registered?</span>
              <a href="#/login${redirect ? `?redirect=${redirect}` : ''}" class="text-primary fw-semibold text-decoration-none ms-1">Sign In</a>
            </div>

          </div>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-register-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      await registerUser(name, email, password);
      showToast('Registration successful! A verification email is logged.');
      
      if (redirect === 'checkout') {
        window.location.hash = '#/checkout';
      } else {
        window.location.hash = '#/';
      }
    } catch (err) {
      showToast(err.message, 'danger');
      btn.disabled = false;
      btn.innerText = 'Create Account';
    }
  });
};


// --- 3. FORGOT PASSWORD RENDERER ---
export const renderForgotPassword = (container) => {
  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center py-4">
        <div class="col-md-6 col-lg-5">
          <div class="glass-panel p-4 p-sm-5 border-color">
            
            <div class="text-center mb-4">
              <h2 class="fw-bold text-heading mb-1">Forgot Password</h2>
              <p class="text-muted">Enter email to receive password reset links</p>
            </div>

            <form id="forgot-form">
              <div class="mb-4">
                <label for="forgot-email" class="form-label small fw-bold">Email Address</label>
                <input type="email" class="form-control bg-light border-color" id="forgot-email" placeholder="name@example.com" required>
              </div>

              <button type="submit" id="btn-forgot-submit" class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold">
                Send Reset Link
              </button>
            </form>

            <div class="text-center mt-4">
              <a href="#/login" class="text-primary fw-semibold text-decoration-none small"><i class="bi bi-arrow-left me-1"></i>Back to Sign In</a>
            </div>

          </div>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('forgot-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-forgot-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

    const email = document.getElementById('forgot-email').value.trim();

    try {
      await sendForgotPasswordEmail(email);
      showToast('Password reset link generated and logged to console!');
      form.innerHTML = `
        <div class="alert alert-success text-center">
          <i class="bi bi-envelope-check-fill display-5 mb-2 d-block"></i>
          <h6>Reset Email Sent</h6>
          <p class="mb-0 small text-muted">A password reset URL was dispatched to your mail. Check details logged in the console.</p>
        </div>
      `;
    } catch (err) {
      showToast(err.message, 'danger');
      btn.disabled = false;
      btn.innerText = 'Send Reset Link';
    }
  });
};


// --- 4. RESET PASSWORD RENDERER ---
export const renderResetPassword = (container, params, query) => {
  const token = query.token;
  if (!token) {
    window.location.hash = '#/login';
    return;
  }

  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center py-4">
        <div class="col-md-6 col-lg-5">
          <div class="glass-panel p-4 p-sm-5 border-color">
            
            <div class="text-center mb-4">
              <h2 class="fw-bold text-heading mb-1">Set New Password</h2>
              <p class="text-muted">Enter credentials below to update password</p>
            </div>

            <form id="reset-form">
              <div class="mb-3">
                <label for="reset-pwd" class="form-label small fw-bold">New Password</label>
                <input type="password" class="form-control bg-light border-color" id="reset-pwd" required minlength="6">
              </div>

              <div class="mb-4">
                <label for="reset-pwd-conf" class="form-label small fw-bold">Confirm Password</label>
                <input type="password" class="form-control bg-light border-color" id="reset-pwd-conf" required minlength="6">
              </div>

              <button type="submit" id="btn-reset-submit" class="btn btn-primary btn-premium w-100 py-3 rounded-pill fw-bold">
                Reset Password
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('reset-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('reset-pwd').value;
    const pwdConf = document.getElementById('reset-pwd-conf').value;

    if (pwd !== pwdConf) {
      showToast('Passwords do not match', 'warning');
      return;
    }

    const btn = document.getElementById('btn-reset-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

    try {
      await resetUserPassword(token, pwd);
      showToast('Password updated and user logged in!');
      window.location.hash = '#/';
    } catch (err) {
      showToast(err.message, 'danger');
      btn.disabled = false;
      btn.innerText = 'Reset Password';
    }
  });
};


// --- 5. EMAIL VERIFICATION RENDERER ---
export const renderVerifyEmail = async (container, params, query) => {
  const token = query.token;
  
  container.innerHTML = `
    <div class="container py-5 text-center">
      <div class="glass-panel p-5 max-width-600 mx-auto border-color" style="max-width: 500px;">
        <div id="verify-loader" class="spinner-border text-primary display-4 mb-4" role="status"></div>
        <h3 id="verify-title" class="fw-bold mb-2">Verifying Email Address...</h3>
        <p id="verify-desc" class="text-muted mb-4">Connecting to servers to confirm security verification credentials.</p>
        <div id="verify-actions" style="display: none;">
          <a href="#/login" class="btn btn-primary btn-premium rounded-pill px-4">Sign In Now</a>
        </div>
      </div>
    </div>
  `;

  const loader = document.getElementById('verify-loader');
  const title = document.getElementById('verify-title');
  const desc = document.getElementById('verify-desc');
  const actions = document.getElementById('verify-actions');

  try {
    if (!token) throw new Error('Security token missing from query params.');
    await verifyUserEmail(token);
    
    loader.remove();
    title.innerText = 'Email Verified!';
    title.className = 'fw-bold text-success mb-2';
    desc.innerText = 'Your email address was successfully verified. You can now log in and checkout using your account.';
    actions.style.display = 'block';
  } catch (err) {
    loader.remove();
    title.innerText = 'Verification Failed';
    title.className = 'fw-bold text-danger mb-2';
    desc.innerText = err.message || 'The verification link has expired or is invalid.';
    actions.style.display = 'block';
  }
};
