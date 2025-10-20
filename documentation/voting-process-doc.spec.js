// voting-process-doc.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Ensure the screenshots directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Create a dedicated directory for voting process documentation
const votingDir = path.join(config.outputDir, 'voting-process');
if (!fs.existsSync(votingDir)) {
  fs.mkdirSync(votingDir, { recursive: true });
}

// Simplified login function for the organizer based on load test implementation
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

// Simplified login function for the user
async function loginAsUser(page, username, password, displayName) {
  try {
    console.log(`Logging in as user ${username}...`);
    await page.goto(config.baseUrl);
    
    // Wait for event login form to appear
    await page.waitForSelector('.event-user-login', { timeout: 10000 }).catch(() => {
      console.log('Event user login form not found with standard selector');
    });
    
    // Try to find the event input field
    const eventInputSelectors = [
      'input[name="eventSlug"]',
      'input[placeholder*="Veranstaltung"]',
      'input[placeholder*="event"]',
      'input.event-input',
      'input#event-slug'
    ];
    
    let eventFieldFound = false;
    for (const selector of eventInputSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Event input field found with selector ${selector}`);
          await page.fill(selector, config.eventSlug);
          eventFieldFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!eventFieldFound) {
      // Try looking for a "Submit" button to open a modal first
      try {
        const submitButtons = [
          'button:has-text("Teilnehmen")',
          'button:has-text("Beitreten")',
          'button:has-text("Join")',
          'button:has-text("Weiter")',
          'button:has-text("Next")',
          'button.btn-primary'
        ];
        
        for (const button of submitButtons) {
          const visible = await page.locator(button).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Initial button found with selector ${button}`);
            await page.click(button);
            await page.waitForTimeout(1000);
            break;
          }
        }
      } catch (e) {
        console.warn('Could not find initial interaction button');
      }
    }
    
    // Try to find username input
    const usernameSelectors = [
      'input[name="username"]',
      'input[placeholder*="Benutzername"]',
      'input[placeholder*="Username"]',
      'input.username-input',
      'input#username'
    ];
    
    let usernameFieldFound = false;
    for (const selector of usernameSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Username input field found with selector ${selector}`);
          await page.fill(selector, username);
          usernameFieldFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!usernameFieldFound) {
      console.warn('Could not find username field!');
    }
    
    // Try to find password input
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="Passwort"]',
      'input.password-input',
      'input#password'
    ];
    
    let passwordFieldFound = false;
    for (const selector of passwordSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Password input field found with selector ${selector}`);
          await page.fill(selector, password);
          passwordFieldFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!passwordFieldFound) {
      console.warn('Could not find password field!');
    }
    
    // Try to find submit button
    const submitButtonSelectors = [
      'button[type="submit"]',
      'button.btn-primary',
      'button:has-text("Login")',
      'button:has-text("Anmelden")',
      'button:has-text("Einloggen")',
      'button:has-text("Teilnehmen")',
      'button:has-text("Beitreten")'
    ];
    
    let submitButtonClicked = false;
    for (const selector of submitButtonSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Submit button found with selector ${selector}`);
          await page.click(selector);
          submitButtonClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!submitButtonClicked) {
      console.warn('Could not find submit button!');
      // Try pressing Enter as last resort
      await page.keyboard.press('Enter');
    }
    
    // Wait for successful login
    const successSelectors = [
      '.dashboard',
      '.event-dashboard',
      '.user-dashboard',
      '.active-poll',
      '.welcome-message',
      '.event-user-dashboard'
    ];
    
    let loginSuccess = false;
    for (const selector of successSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        console.log(`User login successful (${selector} found)`);
        loginSuccess = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!loginSuccess) {
      // Check if URL indicates successful login
      const url = page.url();
      if (url.includes('/event/') || url.includes('/dashboard')) {
        console.log(`URL indicates successful user login: ${url}`);
        loginSuccess = true;
      } else {
        console.warn('No success indicator found after user login attempt!');
      }
    }
    
    return loginSuccess;
  } catch (error) {
    console.error(`Error during user login (${username}):`, error.message);
    return false;
  }
}

// Function to create a new poll based on the load test implementation
async function createPoll(page) {
  try {
    console.log('Creating a new poll...');
    
    // Check if we're on the dashboard, if not navigate to it
    try {
      const url = page.url();
      if (!url.includes('/admin/event/polls/')) {
        console.log('Navigating to polls page...');
        
        // Go to the event list first if needed
        if (!url.includes('/admin/event')) {
          await page.goto(`${config.baseUrl}/admin/event`);
          await page.waitForLoadState('networkidle');
        }
        
        // Find the event and navigate to polls
        const eventLinkSelectors = [
          `.event-row[data-event-id="${config.eventId}"] a:has-text("Abstimmungen")`,
          `.event-row[data-event-id="${config.eventId}"] a:has-text("Polls")`,
          `.event-row a[href*="/polls/${config.eventId}"]`,
          `tr[data-event-id="${config.eventId}"] a:has-text("Abstimmungen")`
        ];
        
        let eventLinkFound = false;
        for (const selector of eventLinkSelectors) {
          try {
            const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
            if (visible) {
              console.log(`Found polls link with selector ${selector}`);
              await page.click(selector);
              eventLinkFound = true;
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        if (!eventLinkFound) {
          console.log('Direct link to polls not found, trying direct navigation');
          await page.goto(`${config.baseUrl}/admin/event/polls/${config.eventId}`);
        }
        
        await page.waitForLoadState('networkidle');
      }
    } catch (e) {
      console.warn('Error navigating to polls page:', e.message);
    }
    
    // Capture polls overview first
    await page.screenshot({ path: path.join(votingDir, '01-polls-overview.png') });
    
    // Write description for polls overview
    const pollsOverviewDesc = `# Abstimmungen Übersicht
    
**Beschreibung:**
Die Abstimmungsübersicht zeigt alle erstellten Abstimmungen für die Veranstaltung. Von hier aus können Sie Abstimmungen erstellen, bearbeiten, starten oder beenden.

**Funktionen:**
- Liste aller Abstimmungen mit Status
- Optionen zum Erstellen neuer Abstimmungen
- Funktionen zum Starten und Beenden von Abstimmungen
- Zugriff auf Abstimmungsergebnisse
`;
    fs.writeFileSync(path.join(votingDir, '01-polls-overview.md'), pollsOverviewDesc);
    
    // Click on 'Create New Poll' button
    const newPollButtonSelectors = [
      'a:has-text("Neue Abstimmung")',
      'a:has-text("New Poll")',
      'button:has-text("Neue Abstimmung")',
      'button:has-text("New Poll")',
      'a.new-poll-button',
      'a.btn-primary'
    ];
    
    let newPollButtonClicked = false;
    for (const selector of newPollButtonSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Found new poll button with selector ${selector}`);
          await page.click(selector);
          newPollButtonClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!newPollButtonClicked) {
      console.warn('Could not find new poll button!');
      return false;
    }
    
    // Wait for the poll form to appear
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Capture new poll form
    await page.screenshot({ path: path.join(votingDir, '02-create-poll-form.png') });
    
    // Write description for create poll form
    const createPollDesc = `# Abstimmung erstellen
    
**Beschreibung:**
Das Formular zum Erstellen einer neuen Abstimmung ermöglicht die Konfiguration aller wichtigen Eigenschaften.

**Funktionen:**
- Titel und Beschreibung der Abstimmung festlegen
- Antwortoptionen definieren
- Abstimmungsart konfigurieren (geheim oder öffentlich)
- Option für Mehrfachauswahl
- Möglichkeit zum direkten Starten der Abstimmung nach dem Erstellen
`;
    fs.writeFileSync(path.join(votingDir, '02-create-poll-form.md'), createPollDesc);
    
    // Fill in the poll form
    try {
      // Fill title
      const titleSelectors = [
        'input[name="title"]',
        'input[placeholder*="Titel"]',
        'input[placeholder*="Title"]',
        '#poll-title'
      ];
      
      for (const selector of titleSelectors) {
        try {
          const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Found title field with selector ${selector}`);
            await page.fill(selector, 'Dokumentationsabstimmung');
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Fill description
      const descriptionSelectors = [
        'textarea[name="description"]',
        'textarea[placeholder*="Beschreibung"]',
        'textarea[placeholder*="Description"]',
        '#poll-description'
      ];
      
      for (const selector of descriptionSelectors) {
        try {
          const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Found description field with selector ${selector}`);
            await page.fill(selector, 'Diese Abstimmung ist für die Dokumentation des Abstimmungsprozesses.');
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Add answer options
      const answerOptionSelectors = [
        'input[name="possibleAnswers[0].title"]',
        'input[name^="possibleAnswers"]',
        'input[placeholder*="Antwort"]',
        'input[placeholder*="Answer"]'
      ];
      
      for (const selector of answerOptionSelectors) {
        try {
          const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Found answer option field with selector ${selector}`);
            
            // Find all answer option fields
            const answerInputs = await page.locator(selector).all();
            
            // If we found at least one
            if (answerInputs.length > 0) {
              await answerInputs[0].fill('Option A');
              
              // If we have a second field
              if (answerInputs.length > 1) {
                await answerInputs[1].fill('Option B');
              }
              
              // If we have a third field
              if (answerInputs.length > 2) {
                await answerInputs[2].fill('Option C');
              }
              
              break;
            }
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Make it a secret poll if option is available
      try {
        const secretPollCheckbox = page.locator('input[name="isSecretPoll"], input[type="checkbox"]:has-text("Geheime Abstimmung")');
        await secretPollCheckbox.check();
      } catch (e) {
        console.log('Could not find or check secret poll option');
      }
      
      // Take screenshot of the filled form
      await page.screenshot({ path: path.join(votingDir, '03-filled-poll-form.png') });
      
      // Write description for filled poll form
      const filledPollDesc = `# Abstimmungsformular ausgefüllt
      
**Beschreibung:**
Beispiel für ein vollständig ausgefülltes Abstimmungsformular mit Titel, Beschreibung und Antwortoptionen.

**Wichtige Felder:**
- Titel: Der Name der Abstimmung, der den Teilnehmenden angezeigt wird
- Beschreibung: Erläutert den Zweck oder gibt zusätzliche Informationen zur Abstimmung
- Antwortoptionen: Die möglichen Auswahloptionen für die Teilnehmenden
- Geheime Abstimmung: Bestimmt, ob die individuellen Abstimmungsergebnisse anonym bleiben
`;
      fs.writeFileSync(path.join(votingDir, '03-filled-poll-form.md'), filledPollDesc);
      
      // Submit the form
      const submitButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Speichern")',
        'button:has-text("Save")',
        'button:has-text("Erstellen")',
        'button:has-text("Create")',
        'button.btn-primary'
      ];
      
      let formSubmitted = false;
      for (const selector of submitButtonSelectors) {
        try {
          const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Found submit button with selector ${selector}`);
            await page.click(selector);
            formSubmitted = true;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!formSubmitted) {
        console.warn('Could not find form submit button!');
        return false;
      }
      
      // Wait for redirect back to polls list
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {
        console.log('No navigation occurred after form submission');
      });
      
      // Take screenshot of the polls list with the new poll
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(votingDir, '04-poll-created.png') });
      
      // Write description for created poll
      const pollCreatedDesc = `# Abstimmung erstellt
      
**Beschreibung:**
Nach dem Erstellen erscheint die neue Abstimmung in der Liste aller Abstimmungen. Von hier aus kann die Abstimmung gestartet werden.

**Nächste Schritte:**
- Starten der Abstimmung über den "Start"-Button
- Bearbeiten der Abstimmung falls nötig
- Löschen der Abstimmung falls nicht mehr benötigt
`;
      fs.writeFileSync(path.join(votingDir, '04-poll-created.md'), pollCreatedDesc);
      
      return true;
    } catch (e) {
      console.error('Error filling and submitting poll form:', e.message);
      return false;
    }
  } catch (error) {
    console.error('Error creating poll:', error.message);
    return false;
  }
}

// Function to start a poll
async function startPoll(page) {
  try {
    console.log('Starting a poll...');
    
    // Find the start poll button for the newly created poll
    const startButtonSelectors = [
      'button:has-text("Start")',
      'button:has-text("Starten")',
      'button.start-poll-button',
      'button.btn-success'
    ];
    
    let startButtonClicked = false;
    for (const selector of startButtonSelectors) {
      try {
        // Get all matching buttons
        const buttons = await page.locator(selector).all();
        
        // Click the first one (assuming it's for our newly created poll)
        if (buttons.length > 0) {
          console.log(`Found start button with selector ${selector}`);
          await buttons[0].click();
          startButtonClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!startButtonClicked) {
      console.warn('Could not find start poll button!');
      return false;
    }
    
    // Wait for confirmation modal if it appears
    try {
      const confirmButtonSelectors = [
        'button:has-text("Ja")',
        'button:has-text("Yes")',
        'button:has-text("Bestätigen")',
        'button:has-text("Confirm")',
        '.modal button.btn-primary'
      ];
      
      // Check if modal appeared
      await page.waitForSelector('.modal', { timeout: 3000 }).catch(() => {
        console.log('No confirmation modal appeared');
      });
      
      // If a modal appeared, click the confirm button
      for (const selector of confirmButtonSelectors) {
        try {
          const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Found confirm button with selector ${selector}`);
            await page.click(selector);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
    } catch (e) {
      console.log('No need to confirm poll start');
    }
    
    // Wait for the poll to be shown as active
    await page.waitForTimeout(2000);
    
    // Take screenshot of the active poll
    await page.screenshot({ path: path.join(votingDir, '05-active-poll.png') });
    
    // Write description for active poll
    const activePollDesc = `# Aktive Abstimmung
    
**Beschreibung:**
Eine aktive Abstimmung wird hervorgehoben angezeigt. Die Teilnehmenden sehen jetzt das Abstimmungsformular und können ihre Stimme abgeben.

**Funktionen:**
- Status der aktiven Abstimmung überwachen
- Teilnahmefortschritt verfolgen
- Abstimmung manuell beenden
- Live-Aktualisierung der Teilnahmedaten
`;
    fs.writeFileSync(path.join(votingDir, '05-active-poll.md'), activePollDesc);
    
    return true;
  } catch (error) {
    console.error('Error starting poll:', error.message);
    return false;
  }
}

// Function to vote in a poll
async function voteInPoll(page) {
  try {
    console.log('Voting in poll...');
    
    // Wait for the poll modal to appear
    const modalSelectors = [
      '.modal',
      '.poll-modal',
      '.modal-content',
      '.modal-dialog'
    ];
    
    let modalFound = false;
    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`Poll modal found with selector ${selector}`);
        modalFound = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!modalFound) {
      // Try reloading the page if modal didn't appear
      console.log('Poll modal not found, trying to reload page...');
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check again for modal
      for (const selector of modalSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`Poll modal found after reload with selector ${selector}`);
          modalFound = true;
          break;
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!modalFound) {
        console.warn('Could not find poll modal even after reload!');
        return false;
      }
    }
    
    // Take screenshot of the poll modal
    await page.screenshot({ path: path.join(votingDir, '06-poll-modal.png') });
    
    // Write description for poll modal
    const pollModalDesc = `# Abstimmungsformular
    
**Beschreibung:**
Das Abstimmungsformular wird den Teilnehmenden angezeigt, sobald eine Abstimmung gestartet wurde. Hier können sie ihre Stimme abgeben.

**Funktionen:**
- Anzeige des Abstimmungstitels und der Beschreibung
- Auswahl der gewünschten Option per Radiobutton
- Bestätigung der Auswahl mit "Abstimmen"-Button
`;
    fs.writeFileSync(path.join(votingDir, '06-poll-modal.md'), pollModalDesc);
    
    // Select a radio button
    const radioSelectors = [
      'input[type="radio"]',
      '.form-check input',
      '.modal-body input[type="radio"]'
    ];
    
    let radioButtonClicked = false;
    for (const selector of radioSelectors) {
      try {
        const radios = await page.locator(selector).all();
        if (radios.length > 0) {
          console.log(`Found radio buttons with selector ${selector}`);
          
          // Select one at random
          const randomIndex = Math.floor(Math.random() * radios.length);
          await radios[randomIndex].click();
          
          radioButtonClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!radioButtonClicked) {
      console.warn('Could not find any radio buttons to click!');
      return false;
    }
    
    // Take screenshot after selecting an option
    await page.screenshot({ path: path.join(votingDir, '07-option-selected.png') });
    
    // Write description for option selection
    const optionSelectedDesc = `# Option ausgewählt
    
**Beschreibung:**
Nach der Auswahl einer Option muss die Abstimmung noch mit dem Abstimmen-Button bestätigt werden.

**Hinweis:**
- Bei Mehrfachauswahl-Abstimmungen können mehrere Optionen ausgewählt werden
- Bei Standard-Abstimmungen kann nur eine Option gewählt werden
`;
    fs.writeFileSync(path.join(votingDir, '07-option-selected.md'), optionSelectedDesc);
    
    // Click submit button
    const submitButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Abstimmen")',
      'button:has-text("Vote")',
      'button:has-text("Jetzt abstimmen")',
      'button.btn-primary',
      '.modal-footer button'
    ];
    
    let voteSubmitted = false;
    for (const selector of submitButtonSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Found submit button with selector ${selector}`);
          await page.click(selector);
          voteSubmitted = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!voteSubmitted) {
      console.warn('Could not find vote submit button!');
      return false;
    }
    
    // Wait for the vote to be processed
    await page.waitForTimeout(2000);
    
    // Try to detect success message or result view
    const successSelectors = [
      '.alert-success',
      '.success-message',
      'div:has-text("Erfolgreich abgestimmt")',
      '.modal:has-text("Ergebnis")',
      '.results-view',
      '.poll-results'
    ];
    
    let voteSuccess = false;
    for (const selector of successSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Vote success indicator found with selector ${selector}`);
          voteSuccess = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    // Take screenshot after voting
    await page.screenshot({ path: path.join(votingDir, '08-vote-submitted.png') });
    
    // Write description for vote submission
    const voteSubmittedDesc = `# Abstimmung abgeschlossen
    
**Beschreibung:**
Nach erfolgreicher Stimmabgabe wird entweder eine Bestätigung angezeigt oder, falls alle Teilnehmenden abgestimmt haben, direkt das Ergebnis.

**Hinweise:**
- Bei geheimen Abstimmungen sehen die Teilnehmenden nur eine Bestätigung, aber keine individuellen Ergebnisse
- Bei offenen Abstimmungen können die Ergebnisse direkt nach Abstimmungsende angezeigt werden
- Der Organisator kann die Abstimmung jederzeit manuell beenden
`;
    fs.writeFileSync(path.join(votingDir, '08-vote-submitted.md'), voteSubmittedDesc);
    
    return voteSuccess;
  } catch (error) {
    console.error('Error during voting:', error.message);
    return false;
  }
}

// Function to end the poll and show results
async function endPollAndShowResults(page) {
  try {
    console.log('Ending poll and showing results...');
    
    // Check if the poll is still active
    const stopButtonSelectors = [
      'button:has-text("Stop")',
      'button:has-text("Beenden")',
      'button:has-text("End")',
      'button.stop-poll-button',
      'button.btn-danger'
    ];
    
    let stopButtonClicked = false;
    for (const selector of stopButtonSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Found stop button with selector ${selector}`);
          await page.click(selector);
          stopButtonClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (stopButtonClicked) {
      // Wait for confirmation modal if it appears
      try {
        const confirmButtonSelectors = [
          'button:has-text("Ja")',
          'button:has-text("Yes")',
          'button:has-text("Bestätigen")',
          'button:has-text("Confirm")',
          '.modal button.btn-primary'
        ];
        
        // Check if modal appeared
        await page.waitForSelector('.modal', { timeout: 3000 }).catch(() => {
          console.log('No confirmation modal appeared');
        });
        
        // If a modal appeared, click the confirm button
        for (const selector of confirmButtonSelectors) {
          try {
            const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
            if (visible) {
              console.log(`Found confirm button with selector ${selector}`);
              await page.click(selector);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
      } catch (e) {
        console.log('No need to confirm poll end');
      }
    } else {
      console.log('No stop button found, poll may already be finished');
    }
    
    // Wait for the poll to be ended and potentially redirect to results
    await page.waitForTimeout(2000);
    
    // Try to navigate to poll results
    try {
      // Try to find the results tab/link
      const resultsLinkSelectors = [
        'a:has-text("Ergebnisse")',
        'a:has-text("Results")',
        'a[href*="poll-results"]',
        'nav a:nth-child(2)',
        'nav.nav-tabs a:last-child'
      ];
      
      let resultsLinkClicked = false;
      for (const selector of resultsLinkSelectors) {
        try {
          const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
          if (visible) {
            console.log(`Found results link with selector ${selector}`);
            await page.click(selector);
            resultsLinkClicked = true;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!resultsLinkClicked) {
        console.log('No results link found, trying direct navigation');
        await page.goto(`${config.baseUrl}/admin/event/poll-results/${config.eventId}`);
      }
    } catch (e) {
      console.warn('Error navigating to poll results:', e.message);
    }
    
    // Wait for the results to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of the poll results
    await page.screenshot({ path: path.join(votingDir, '09-poll-results.png') });
    
    // Write description for poll results
    const pollResultsDesc = `# Abstimmungsergebnisse
    
**Beschreibung:**
Nach Beendigung der Abstimmung werden die Ergebnisse angezeigt. Diese können als CSV exportiert und für spätere Auswertungen gespeichert werden.

**Funktionen:**
- Detaillierte Darstellung der Abstimmungsergebnisse
- Prozentanzeige der Stimmenverteilung
- Exportmöglichkeiten im CSV-Format
- Übersicht aller abgegebenen Stimmen (bei nicht-geheimen Abstimmungen)
`;
    fs.writeFileSync(path.join(votingDir, '09-poll-results.md'), pollResultsDesc);
    
    // Try to find and click on the export button for an extra screenshot
    const exportButtonSelectors = [
      'button:has-text("Export")',
      'button:has-text("CSV")',
      'button:has-text("Exportieren")',
      'button.export-button',
      'button.btn-secondary'
    ];
    
    let exportButtonFound = false;
    for (const selector of exportButtonSelectors) {
      try {
        const visible = await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          console.log(`Found export button with selector ${selector}`);
          
          // Don't actually click it, just take a screenshot highlighting it
          await page.hover(selector);
          exportButtonFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (exportButtonFound) {
      // Take screenshot with export option highlighted
      await page.screenshot({ path: path.join(votingDir, '10-export-option.png') });
      
      // Write description for export option
      const exportOptionDesc = `# Export der Ergebnisse
      
**Beschreibung:**
Die Abstimmungsergebnisse können über verschiedene Export-Optionen heruntergeladen werden.

**Export-Formate:**
- CSV: Tabellenformat für Excel oder andere Kalkulationsprogramme
- Verschiedene Detailstufen je nach Anforderung
  - Übersichtsergebnisse: Zusammenfassung aller Stimmen
  - Detailergebnisse: Individuelle Stimmabgaben (bei nicht-geheimen Abstimmungen)
`;
      fs.writeFileSync(path.join(votingDir, '10-export-option.md'), exportOptionDesc);
    }
    
    return true;
  } catch (error) {
    console.error('Error ending poll and showing results:', error.message);
    return false;
  }
}

// Compile complete documentation
function compileDocumentation() {
  console.log('Compiling voting process documentation...');
  
  const docsDir = path.join(config.outputDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Create the complete documentation file
  let completeDoc = `# Dokumentation des Abstimmungsprozesses
  
Diese Dokumentation beschreibt den vollständigen Prozess einer Abstimmung im VotingTool, von der Erstellung über die Durchführung bis hin zur Auswertung der Ergebnisse.

## Überblick

Der Abstimmungsprozess umfasst folgende Schritte:
1. Erstellung einer Abstimmung durch den Organisator
2. Starten der Abstimmung
3. Anzeige der Abstimmung bei allen Teilnehmenden
4. Stimmabgabe durch die Teilnehmenden
5. Beenden der Abstimmung (automatisch oder manuell)
6. Anzeige und Export der Ergebnisse

Im Folgenden werden diese Schritte detailliert erläutert.

`;
  
  // Append all MD files in the voting-process directory
  try {
    const mdFiles = fs.readdirSync(votingDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => {
        // Sort by the numeric prefix (01, 02, etc.)
        const numA = parseInt(a.match(/^(\d+)/)[1]);
        const numB = parseInt(b.match(/^(\d+)/)[1]);
        return numA - numB;
      });
    
    for (const file of mdFiles) {
      // Get the file content
      const content = fs.readFileSync(path.join(votingDir, file), 'utf8');
      
      // Add the section
      completeDoc += `## ${file.replace(/^\d+-/, '').replace(/\.md$/, '')}\n\n`;
      
      // Add the content (skipping the first line which is the title)
      completeDoc += content.split('\n').slice(1).join('\n');
      
      // Add screenshot reference
      const pngFile = file.replace('.md', '.png');
      if (fs.existsSync(path.join(votingDir, pngFile))) {
        completeDoc += `\n\n![Screenshot: ${pngFile}](../screenshots/voting-process/${pngFile})\n\n`;
      }
      
      completeDoc += '\n';
    }
    
    // Write the complete documentation
    fs.writeFileSync(path.join(docsDir, 'voting-process-documentation.md'), completeDoc);
    
    console.log('Documentation compiled successfully!');
    return true;
  } catch (error) {
    console.error('Error compiling documentation:', error.message);
    return false;
  }
}

// Main test flow for organizer
test('organizer-voting-process', async ({ page }) => {
  // Set longer timeout for this test
  test.setTimeout(120000);
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Login as organizer
  console.log('Logging in as organizer...');
  const loginSuccess = await loginAsOrganizer(page);
  expect(loginSuccess).toBeTruthy();
  
  // Create a new poll
  console.log('Creating a new poll...');
  const pollCreated = await createPoll(page);
  expect(pollCreated).toBeTruthy();
  
  // Start the poll
  console.log('Starting the poll...');
  const pollStarted = await startPoll(page);
  expect(pollStarted).toBeTruthy();
  
  // End the poll and show results (will create the final documentation parts)
  console.log('Ending poll and showing results...');
  const pollEnded = await endPollAndShowResults(page);
  expect(pollEnded).toBeTruthy();
});

// Test flow for a participant
test('participant-voting-process', async ({ page }) => {
  // Set longer timeout for this test
  test.setTimeout(60000);
  
  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Wait a bit to ensure the poll is started by the organizer test
  await page.waitForTimeout(5000);
  
  // Login as user
  console.log('Logging in as participant...');
  const testUserId = 'testuser1';
  const displayName = 'Test User 1';
  const loginSuccess = await loginAsUser(page, testUserId, config.userPassword, displayName);
  
  if (!loginSuccess) {
    console.warn('Participant login failed, skipping voting test');
    return;
  }
  
  // Vote in the poll
  console.log('Voting in poll...');
  const voteSuccess = await voteInPoll(page);
  
  // We don't expect this to always succeed since the poll might not be active yet
  if (!voteSuccess) {
    console.warn('Voting failed, but continuing with documentation');
  }
});

// Final test to compile documentation
test('compile-documentation', async ({ page }) => {
  // Compile the complete documentation
  const compiled = compileDocumentation();
  expect(compiled).toBeTruthy();
});