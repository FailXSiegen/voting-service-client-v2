// simple-doc.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Ensure the screenshots directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Simplified login function based on the working load test
async function loginAsOrganizer(page) {
  try {
    console.log('Logging in as organizer...');
    await page.goto(config.baseUrl);
    
    // Try different username selectors
    const usernameSelectors = [
      '#organizer-login-username',
      '#username',
      'input[name="username"]',
      'input[placeholder*="Benutzername"]',
      'input[placeholder*="Username"]',
      'input[name="email"]'
    ];
    
    // Try different password selectors
    const passwordSelectors = [
      '#organizer-login-password',
      '#password',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="Passwort"]'
    ];
    
    // Find and fill username field
    let foundUsername = false;
    for (const selector of usernameSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
          console.log(`Username field found with selector ${selector}`);
          await page.fill(selector, config.credentials.email);
          foundUsername = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!foundUsername) {
      console.warn('Could not find username field!');
    }
    
    // Find and fill password field
    let foundPassword = false;
    for (const selector of passwordSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
          console.log(`Password field found with selector ${selector}`);
          await page.fill(selector, config.credentials.password);
          foundPassword = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!foundPassword) {
      console.warn('Could not find password field!');
    }
    
    // Try different button selectors
    const buttonSelectors = [
      '#organizer-login-submit',
      'button[type="submit"]',
      'button.btn-primary',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Anmelden")',
      'button:has-text("Einloggen")'
    ];
    
    let buttonClicked = false;
    for (const selector of buttonSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
        if (visible) {
          console.log(`Login button found with selector ${selector}`);
          await page.click(selector);
          buttonClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!buttonClicked) {
      console.warn('Could not find login button!');
      // Try pressing Enter as last resort
      await page.keyboard.press('Enter');
    }
    
    // Wait for successful login with different indicators
    const successSelectors = [
      'main h1:has-text("Dashboard")',
      '.dashboard',
      'h1:has-text("Dashboard")',
      '.admin-dashboard',
      '.organizer-dashboard',
      '.event-list'
    ];
    
    let loginSuccess = false;
    for (const selector of successSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        console.log(`Login successful (${selector} found)`);
        loginSuccess = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!loginSuccess) {
      // Check if URL indicates successful login
      const url = page.url();
      if (url.includes('/admin') || url.includes('/dashboard') || url.includes('/event/')) {
        console.log(`URL indicates successful login: ${url}`);
        loginSuccess = true;
      } else {
        console.warn('No success indicator found after login attempt!');
      }
    }
    
    return loginSuccess;
  } catch (error) {
    console.error('Error during login:', error.message);
    return false;
  }
}

test('01-login-page', async ({ page }) => {
  // Set longer timeout for login
  test.setTimeout(60000); 
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Capture login screen
  await page.goto(config.baseUrl);
  await page.waitForLoadState('networkidle');
  console.log('Taking login page screenshot');
  await page.screenshot({ path: path.join(config.outputDir, '01-login.png') });
  
  // Write description
  const loginDesc = `# Login
  
**Beschreibung:**
Die Login-Seite ermöglicht Organisatoren den Zugang zu ihrem Dashboard und ihren Veranstaltungen.

**Funktionen:**
- Anmeldung mit E-Mail-Adresse/Benutzername und Passwort
- Zugang zum Organisator-Dashboard
- Link zum Passwort zurücksetzen
`;
  fs.writeFileSync(path.join(config.outputDir, '01-login.md'), loginDesc);
  
  // Perform login for dashboard test
  console.log('Attempting to login');
  const loginSuccess = await loginAsOrganizer(page);
  expect(loginSuccess).toBeTruthy();
  
  // Capture dashboard screenshot
  console.log('Taking dashboard screenshot');
  await page.screenshot({ path: path.join(config.outputDir, '02-dashboard.png') });
  
  // Write description for dashboard
  const dashboardDesc = `# Dashboard

**Beschreibung:**
Das Dashboard bietet einen Überblick über die wichtigsten Funktionen und Veranstaltungen.

**Funktionen:**
- Schnellzugriff auf die Veranstaltungsverwaltung
- Neuigkeiten und Updates zur Plattform
- Übersicht der wichtigsten Funktionen
`;
  fs.writeFileSync(path.join(config.outputDir, '02-dashboard.md'), dashboardDesc);
});