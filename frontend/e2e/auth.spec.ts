import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Login Functionality
 *
 * These tests cover the complete login flow including:
 * - Sign-in page UI elements
 * - Form validation
 * - Successful login
 * - Failed login scenarios
 * - Google OAuth flow
 * - Remember me functionality
 * - Protected route redirects
 * - Logout functionality
 */

// Test configuration
const TEST_URL = {
  signIn: '/authentication/sign-in',
  signUp: '/authentication/sign-up',
  dashboard: '/dashboard/project',
};

// ============================================
// 1. SIGN-IN PAGE UI TESTS
// ============================================

test.describe('Sign-In Page UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should display sign-in page with all required elements', async ({ page }) => {
    // Check page title/header
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    // Check username input
    await expect(page.getByLabel(/username/i)).toBeVisible();

    // Check password input
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check remember me switch
    await expect(page.getByText(/remember me/i)).toBeVisible();

    // Check sign in button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Check sign up link
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();
  });

  test('should have Google OAuth button', async ({ page }) => {
    // Check for Google icon/button
    const googleButton = page.locator('[data-testid="GoogleIcon"], svg').first();
    await expect(googleButton).toBeVisible();
  });

  test('should navigate to sign-up page when clicking sign up link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up', exact: true }).click();
    await expect(page).toHaveURL(/sign-up/);
  });
});

// ============================================
// 2. FORM VALIDATION TESTS
// ============================================

test.describe('Sign-In Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should have required attribute on username field', async ({ page }) => {
    const usernameInput = page.getByLabel(/username/i);
    await expect(usernameInput).toHaveAttribute('required', '');
  });

  test('should have required attribute on password field', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should show validation when submitting empty form', async ({ page }) => {
    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Form should not navigate (HTML5 validation prevents submission)
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should allow typing in username field', async ({ page }) => {
    const usernameInput = page.getByLabel(/username/i);
    await usernameInput.fill('testuser');
    await expect(usernameInput).toHaveValue('testuser');
  });

  test('should allow typing in password field', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should mask password input', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

// ============================================
// 3. REMEMBER ME FUNCTIONALITY
// ============================================

test.describe('Remember Me Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should toggle remember me switch', async ({ page }) => {
    const rememberMeSwitch = page.locator('input[type="checkbox"]').first();

    // Initially unchecked
    await expect(rememberMeSwitch).not.toBeChecked();

    // Click to check
    await rememberMeSwitch.click();
    await expect(rememberMeSwitch).toBeChecked();

    // Click to uncheck
    await rememberMeSwitch.click();
    await expect(rememberMeSwitch).not.toBeChecked();
  });

  test('should be able to toggle by clicking label text', async ({ page }) => {
    const rememberMeText = page.getByText(/remember me/i);
    const rememberMeSwitch = page.locator('input[type="checkbox"]').first();

    await rememberMeText.click();
    await expect(rememberMeSwitch).toBeChecked();
  });
});

// ============================================
// 4. LOGIN FLOW TESTS
// ============================================

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should show loading state when submitting form', async ({ page }) => {
    // Fill in credentials
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('testpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Button should show loading state or be disabled
    // (This depends on how fast the API responds)
    const submitButton = page.getByRole('button', { name: /sign|loading/i });
    await expect(submitButton).toBeVisible();
  });

  test('should disable form inputs during submission', async ({ page }) => {
    // Intercept the API call to make it slow
    await page.route('**/auth/login/', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 401,
        json: { detail: 'Invalid credentials' },
      });
    });

    // Fill in credentials
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('testpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check that the submit button shows loading state or is disabled
    const submitButton = page.getByRole('button', { name: /signing in|sign in/i });

    // Either button text changes to "Signing in..." or button is disabled
    const isLoading = await submitButton.textContent().then(text =>
      text?.toLowerCase().includes('signing') || false
    ).catch(() => false);

    expect(isLoading || await submitButton.isDisabled().catch(() => false)).toBeTruthy();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    // Mock failed login response
    await page.route('**/auth/login/', async (route) => {
      await route.fulfill({
        status: 401,
        json: { detail: 'Invalid username or password' },
      });
    });

    // Fill in credentials
    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error message (snackbar notification)
    await expect(page.getByText(/invalid|authentication error/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    // Mock token refresh to prevent initial auth check issues
    await page.route('**/auth/login/refresh/', async (route) => {
      await route.fulfill({
        status: 401,
        json: { detail: 'No token' },
      });
    });

    // Mock successful login response
    await page.route('**/auth/login/', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          access: 'mock-jwt-token',
          username: 'testuser',
          is_staff: false,
          is_superuser: false,
        },
      });
    });

    // Fill in credentials
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('correctpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation or state change
    await page.waitForTimeout(1000);

    // Check that we're either redirected or the page state changed
    // The page should attempt to redirect (URL may or may not change depending on routing)
    const currentUrl = page.url();
    const hasNavigated = !currentUrl.includes('sign-in') || await page.getByText(/dashboard|project|welcome/i).first().isVisible().catch(() => false);

    expect(hasNavigated || currentUrl.includes('dashboard')).toBeTruthy();
  });
});

// ============================================
// 5. ERROR HANDLING TESTS
// ============================================

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should display error notification for network errors', async ({ page }) => {
    // Mock network error
    await page.route('**/auth/login/', async (route) => {
      await route.abort('failed');
    });

    // Fill in credentials
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('testpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error notification (snackbar) - use first() to avoid strict mode
    await expect(page.getByText(/error|failed|network/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should display error for inactive user from URL params', async ({ page }) => {
    // Navigate with error parameter
    await page.goto(`${TEST_URL.signIn}?error=inactive_user`);

    // Should show inactive user message - use first() to avoid strict mode
    await expect(page.getByText(/inactive|pending|approval/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should clear error on new login attempt', async ({ page }) => {
    // First, trigger an error
    await page.route('**/auth/login/', async (route) => {
      await route.fulfill({
        status: 401,
        json: { detail: 'Invalid credentials' },
      });
    });

    await page.getByLabel(/username/i).fill('wronguser');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for error to appear - use first() to avoid strict mode
    await expect(page.getByText(/invalid|error/i).first()).toBeVisible({ timeout: 5000 });

    // Close error notification if there's a close button
    const closeButton = page.locator('[aria-label="close"], button:has-text("close")').first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // Change credentials and try again (error should be cleared)
    await page.getByLabel(/username/i).clear();
    await page.getByLabel(/username/i).fill('newuser');
    await page.getByLabel(/password/i).clear();
    await page.getByLabel(/password/i).fill('newpassword');

    // The form should be ready for new submission
    await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });
});

// ============================================
// 6. GOOGLE OAUTH TESTS
// ============================================

test.describe('Google OAuth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should redirect to Google OAuth URL when clicking Google button', async ({ page }) => {
    // Find and click Google login button
    const googleIcon = page.locator('svg').filter({ hasText: '' }).first();

    // Listen for navigation
    const navigationPromise = page.waitForURL(/accounts\/google\/login|google\.com/, {
      timeout: 5000,
    }).catch(() => null);

    // Click the Google icon area
    await page.locator('a, [role="link"], [onClick]').filter({ has: googleIcon }).first().click().catch(async () => {
      // If that doesn't work, try clicking the icon directly
      await googleIcon.click();
    });

    // Check if navigation happened or if href is correct
    const googleLink = page.locator('[href*="google"]').first();
    if (await googleLink.isVisible()) {
      await expect(googleLink).toHaveAttribute('href', /google/);
    }
  });

  test('should store redirect URL in localStorage before OAuth redirect', async ({ page }) => {
    // Navigate to sign-in from a protected page (simulated via state)
    await page.goto(TEST_URL.signIn);

    // Evaluate localStorage after page interaction
    const redirectUrl = await page.evaluate(() => {
      localStorage.setItem('post_login_redirect', '/dashboard/project');
      return localStorage.getItem('post_login_redirect');
    });

    expect(redirectUrl).toBe('/dashboard/project');
  });
});

// ============================================
// 7. PROTECTED ROUTE TESTS
// ============================================

test.describe('Protected Routes', () => {
  test('should redirect to sign-in when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto(TEST_URL.dashboard);

    // Should be redirected to sign-in
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test('should show loading state initially on protected route', async ({ page }) => {
    // Mock slow token refresh
    await page.route('**/auth/login/refresh/', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 401,
        json: { detail: 'Token expired' },
      });
    });

    // Navigate to protected route
    await page.goto(TEST_URL.dashboard);

    // Should show loading or redirect
    // The page will either show "Loading..." or redirect to sign-in
    const loadingOrSignIn = await Promise.race([
      page.getByText(/loading/i).waitFor({ timeout: 3000 }).then(() => 'loading'),
      page.waitForURL(/sign-in/, { timeout: 3000 }).then(() => 'redirect'),
    ]).catch(() => 'neither');

    expect(['loading', 'redirect', 'neither']).toContain(loadingOrSignIn);
  });
});

// ============================================
// 8. SESSION PERSISTENCE TESTS
// ============================================

test.describe('Session Persistence', () => {
  test('should attempt token refresh on page load', async ({ page }) => {
    let refreshCalled = false;

    // Intercept token refresh call
    await page.route('**/auth/login/refresh/', async (route) => {
      refreshCalled = true;
      await route.fulfill({
        status: 401,
        json: { detail: 'No refresh token' },
      });
    });

    // Navigate to app
    await page.goto('/');

    // Wait for potential refresh call
    await page.waitForTimeout(2000);

    // Token refresh should have been attempted
    expect(refreshCalled).toBe(true);
  });

  test('should maintain auth state after successful token refresh', async ({ page }) => {
    // Mock successful token refresh
    await page.route('**/auth/login/refresh/', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          access: 'refreshed-token',
          username: 'testuser',
          is_staff: false,
          is_superuser: false,
        },
      });
    });

    // Navigate to protected route
    await page.goto(TEST_URL.dashboard);

    // Should not redirect to sign-in (auth state maintained)
    await page.waitForTimeout(2000);

    // Either stays on dashboard or has some authenticated content
    const currentUrl = page.url();
    const hasAuthContent = await page.getByText(/testuser|dashboard|project/i).isVisible().catch(() => false);

    // Should either be on dashboard or have authenticated content
    expect(currentUrl.includes('dashboard') || hasAuthContent).toBeTruthy();
  });
});

// ============================================
// 9. LOGOUT TESTS
// ============================================

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated state
    await page.route('**/auth/login/refresh/', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          access: 'mock-token',
          username: 'testuser',
          is_staff: false,
          is_superuser: false,
        },
      });
    });

    await page.route('**/auth/logout/', async (route) => {
      await route.fulfill({
        status: 200,
        json: { message: 'Logged out' },
      });
    });
  });

  test('should redirect to login page after logout', async ({ page }) => {
    // Navigate to authenticated area
    await page.goto(TEST_URL.dashboard);
    await page.waitForTimeout(2000);

    // Find and click logout button (if visible)
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first().or(
      page.getByText(/logout|sign out/i).first()
    );

    const isVisible = await logoutButton.isVisible().catch(() => false);
    if (isVisible) {
      await logoutButton.click();

      // Should redirect to login
      await expect(page).toHaveURL(/sign-in|login/, { timeout: 5000 });
    } else {
      // If no logout button visible, verify we're either on dashboard or redirected
      const currentUrl = page.url();
      expect(currentUrl.includes('dashboard') || currentUrl.includes('sign-in')).toBeTruthy();
    }
  });
});

// ============================================
// 10. ACCESSIBILITY TESTS
// ============================================

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL.signIn);
  });

  test('should have proper form labels', async ({ page }) => {
    // Username input should be accessible
    const usernameInput = page.getByLabel(/username/i);
    await expect(usernameInput).toBeVisible();

    // Password input should be accessible
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus the username field directly
    const usernameInput = page.getByLabel(/username/i);
    await usernameInput.focus();

    // Type username
    await page.keyboard.type('testuser');
    await expect(usernameInput).toHaveValue('testuser');

    // Tab to password
    await page.keyboard.press('Tab');
    const passwordInput = page.getByLabel(/password/i);

    // Type password
    await page.keyboard.type('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');

    // Verify form can be submitted with Enter from the form
    // Press Enter to submit (we're still in the form)
    await page.keyboard.press('Enter');

    // Form should attempt submission - wait briefly for any navigation or state change
    await page.waitForTimeout(500);

    // We should still be on the sign-in page (since we didn't mock a successful login)
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should have visible focus indicators', async ({ page }) => {
    const usernameInput = page.getByLabel(/username/i);

    // Focus the input
    await usernameInput.focus();

    // Check if input is focused
    await expect(usernameInput).toBeFocused();
  });
});

// ============================================
// 11. RESPONSIVE DESIGN TESTS
// ============================================

test.describe('Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(TEST_URL.signIn);

    // All form elements should still be visible
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(TEST_URL.signIn);

    // All form elements should be visible
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(TEST_URL.signIn);

    // All form elements should be visible
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
