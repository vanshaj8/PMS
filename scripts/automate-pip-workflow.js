#!/usr/bin/env node

/**
 * PIP Workflow Automation Script
 * 
 * This script automates the complete end-to-end PIP process:
 * 1. Manager creates PIP
 * 2. HRBP approves PIP
 * 3. Employee acknowledges PIP
 * 4. Add check-ins during active period
 * 5. Complete active period
 * 6. Employee submits self-review
 * 7. Manager reviews
 * 8. HRBP makes final decision
 * 
 * Usage:
 *   node scripts/automate-pip-workflow.js
 * 
 * Environment Variables:
 *   API_BASE_URL - Base URL for API (default: http://localhost:8080)
 *   MANAGER_EMAIL - Manager email (default: manager@pip.com)
 *   EMPLOYEE_EMAIL - Employee email (default: employee@pip.com)
 *   HRBP_EMAIL - HRBP email (default: hrbp@pip.com)
 *   PASSWORD - Password for all users (default: password123)
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  MANAGER_EMAIL: process.env.MANAGER_EMAIL || 'manager@pip.com',
  EMPLOYEE_EMAIL: process.env.EMPLOYEE_EMAIL || 'employee@pip.com',
  HRBP_EMAIL: process.env.HRBP_EMAIL || 'hrbp@pip.com',
  PASSWORD: process.env.PASSWORD || 'password123',
  DELAY_BETWEEN_STEPS: 2000, // 2 seconds
  VERBOSE: process.env.VERBOSE === 'true',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// API Client
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.tokens = {};
    this.userIds = {};
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/login`, {
        email,
        password,
      });
      this.tokens[email] = response.data.token;
      // Extract user ID from login response
      if (response.data.user && response.data.user.id) {
        this.userIds[email] = response.data.user.id;
      }
      return response.data;
    } catch (error) {
      throw new Error(`Login failed for ${email}: ${error.response?.data?.error || error.message}`);
    }
  }

  async getUserByEmail(email) {
    try {
      // First try to get from login response if already logged in
      if (this.userIds[email]) {
        return { id: this.userIds[email], email };
      }
      
      // Try to get from /api/users/for-pip-creation endpoint (requires manager token)
      // This endpoint returns employees and HRBPs
      if (this.tokens[email]) {
        try {
          const response = await axios.get(
            `${this.baseURL}/api/users/for-pip-creation`,
            { headers: this.getHeaders(email) }
          );
          // Search in employees and HRBPs
          const allUsers = [...(response.data.employees || []), ...(response.data.hrbps || [])];
          const user = allUsers.find(u => u.email === email);
          if (user) {
            this.userIds[email] = user.id;
            return user;
          }
        } catch (err) {
          // Endpoint might not be accessible, continue to fallback
        }
      }
      
      // Fallback: return email as ID (backend might accept email in some cases)
      // Or we can try to get from /api/users endpoint if admin
      return { id: email, email };
    } catch (error) {
      // If all fails, return email as ID (some endpoints might accept email)
      return { id: email, email };
    }
  }

  getHeaders(email) {
    return {
      'Authorization': `Bearer ${this.tokens[email]}`,
      'Content-Type': 'application/json',
    };
  }

  async createPIP(managerEmail, data) {
    const response = await axios.post(
      `${this.baseURL}/api/pips`,
      data,
      { headers: this.getHeaders(managerEmail) }
    );
    return response.data.pip;
  }

  async approvePIPByHrbp(hrbpEmail, pipId) {
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/hrbp-approve`,
      {},
      { headers: this.getHeaders(hrbpEmail) }
    );
    return response.data.pip;
  }

  async acknowledgePIP(employeeEmail, pipId, comments) {
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/acknowledge`,
      { comments },
      { headers: this.getHeaders(employeeEmail) }
    );
    return response.data.pip;
  }

  async addCheckIn(userEmail, pipId, notes, date) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/pips/${pipId}/checkins`,
        { date, notes, attachments: JSON.stringify([]) },
        { headers: this.getHeaders(userEmail) }
      );
      return response.data.checkIn;
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data || {};
        const errorMsg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
        throw new Error(`Add check-in failed: ${error.response.status} - ${errorMsg}`);
      }
      throw error;
    }
  }

  async completeActivePeriod(userEmail, pipId, forceComplete = false) {
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/complete-active`,
      { forceComplete },
      { headers: this.getHeaders(userEmail) }
    );
    return response.data.pip;
  }

  async submitSelfReview(employeeEmail, pipId, goals) {
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/self-review`,
      { goals },
      { headers: this.getHeaders(employeeEmail) }
    );
    return response.data.pip;
  }

  async submitManagerReview(managerEmail, pipId, goals, comments) {
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/manager-review`,
      { goals, comments },
      { headers: this.getHeaders(managerEmail) }
    );
    return response.data.pip;
  }

  async submitFinalDecision(hrbpEmail, pipId, outcome, remarks) {
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/final-decision`,
      { outcome, remarks },
      { headers: this.getHeaders(hrbpEmail) }
    );
    return response.data.pip;
  }

  async getPIP(userEmail, pipId) {
    const response = await axios.get(
      `${this.baseURL}/api/pips/${pipId}`,
      { headers: this.getHeaders(userEmail) }
    );
    return response.data.pip;
  }
}

// Main automation function
async function automatePIPWorkflow() {
  const api = new APIClient(CONFIG.API_BASE_URL);
  let pipId = null;

  try {
    log('\n' + '='.repeat(60), 'bright');
    log('PIP WORKFLOW AUTOMATION SCRIPT', 'bright');
    log('='.repeat(60), 'bright');
    log(`API Base URL: ${CONFIG.API_BASE_URL}`, 'blue');
    log(`Manager: ${CONFIG.MANAGER_EMAIL}`, 'blue');
    log(`Employee: ${CONFIG.EMPLOYEE_EMAIL}`, 'blue');
    log(`HRBP: ${CONFIG.HRBP_EMAIL}`, 'blue');
    log('='.repeat(60) + '\n', 'bright');

    // Step 1: Login all users
    logStep(1, 'Logging in all users...');
    await api.login(CONFIG.MANAGER_EMAIL, CONFIG.PASSWORD);
    logSuccess(`Manager logged in: ${CONFIG.MANAGER_EMAIL}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    await api.login(CONFIG.EMPLOYEE_EMAIL, CONFIG.PASSWORD);
    logSuccess(`Employee logged in: ${CONFIG.EMPLOYEE_EMAIL}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    await api.login(CONFIG.HRBP_EMAIL, CONFIG.PASSWORD);
    logSuccess(`HRBP logged in: ${CONFIG.HRBP_EMAIL}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 2: Get user IDs for employee and HRBP
    logStep(2, 'Fetching user IDs...');
    let employeeId, hrbpId;
    
    try {
      // Try to get from /api/users/for-pip-creation endpoint (manager can access)
      const usersResponse = await axios.get(
        `${api.baseURL}/api/users/for-pip-creation`,
        { headers: api.getHeaders(CONFIG.MANAGER_EMAIL) }
      );
      
      const employees = usersResponse.data.employees || [];
      const hrbps = usersResponse.data.hrbps || [];
      
      const employeeUser = employees.find(u => u.email === CONFIG.EMPLOYEE_EMAIL);
      const hrbpUser = hrbps.find(u => u.email === CONFIG.HRBP_EMAIL);
      
      if (employeeUser) {
        employeeId = employeeUser.id;
        logSuccess(`Employee ID: ${employeeId} (${CONFIG.EMPLOYEE_EMAIL})`);
      } else {
        logWarning(`Employee not found: ${CONFIG.EMPLOYEE_EMAIL}`);
        // Try to get from login response
        const employeeLogin = await api.login(CONFIG.EMPLOYEE_EMAIL, CONFIG.PASSWORD);
        employeeId = employeeLogin.user?.id || CONFIG.EMPLOYEE_EMAIL;
        logInfo(`Using employee ID from login: ${employeeId}`);
      }
      
      if (hrbpUser) {
        hrbpId = hrbpUser.id;
        logSuccess(`HRBP ID: ${hrbpId} (${CONFIG.HRBP_EMAIL})`);
      } else {
        logWarning(`HRBP not found: ${CONFIG.HRBP_EMAIL}`);
        // HRBP is already logged in, get ID from stored userIds
        hrbpId = api.userIds[CONFIG.HRBP_EMAIL] || CONFIG.HRBP_EMAIL;
        logInfo(`Using HRBP ID from login: ${hrbpId}`);
      }
    } catch (error) {
      logWarning(`Failed to fetch users from endpoint: ${error.message}`);
      // Fallback: use email as ID (backend might accept it in some cases)
      employeeId = CONFIG.EMPLOYEE_EMAIL;
      hrbpId = CONFIG.HRBP_EMAIL;
      logInfo(`Using emails as IDs (fallback mode)`);
    }
    
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 3: Manager creates PIP
    logStep(3, 'Manager creating PIP...');
    const pipData = {
      employeeId: employeeId,
      hrbpId: hrbpId,
      reason: 'Automated test PIP - Performance improvement needed in code quality and communication skills.',
      supportingDocuments: JSON.stringify(['performance-review-q4.pdf', 'incident-report-2025-01.pdf']),
      goals: [
        {
          title: 'Improve Code Quality',
          description: 'Reduce bugs by 40% and implement code review process',
          weightage: 50,
          expectedOutcome: 'Code quality metrics improve, fewer production bugs',
          targetTimeline: 'Within 30 days',
          deadline: null,
        },
        {
          title: 'Enhance Communication',
          description: 'Respond to emails within 2 hours and provide daily status updates',
          weightage: 50,
          expectedOutcome: 'Improved team communication and responsiveness',
          targetTimeline: 'Within 30 days',
          deadline: null,
        },
      ],
      timeline: {
        employeeAcknowledgementDuration: 5, // days from HRBP approval
        pipActiveDuration: 50, // days
        selfReviewBufferDuration: 3, // days
        managerReviewBufferDuration: 5, // days
        hrbpDecisionBufferDuration: 5, // days
      },
    };

    const pip = await api.createPIP(CONFIG.MANAGER_EMAIL, pipData);
    pipId = pip.id;
    logSuccess(`PIP created successfully! ID: ${pipId}`);
    logInfo(`Status: ${pip.status}`);
    logInfo(`Goals: ${pip.goals.length}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 4: HRBP approves PIP
    logStep(4, 'HRBP approving PIP...');
    const approvedPIP = await api.approvePIPByHrbp(CONFIG.HRBP_EMAIL, pipId);
    logSuccess('PIP approved by HRBP');
    logInfo(`Status: ${approvedPIP.status}`);
    logInfo(`HRBP approved at: ${approvedPIP.hrbpApprovedAt || 'N/A'}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 5: Employee acknowledges PIP
    logStep(5, 'Employee acknowledging PIP...');
    const acknowledgedPIP = await api.acknowledgePIP(
      CONFIG.EMPLOYEE_EMAIL,
      pipId,
      'I acknowledge receipt of this PIP and understand the requirements.'
    );
    logSuccess('PIP acknowledged by employee');
    logInfo(`Status: ${acknowledgedPIP.status}`);
    logInfo(`Acknowledged at: ${acknowledgedPIP.employeeAcknowledgedAt || 'N/A'}`);
    logInfo(`Active period started at: ${acknowledgedPIP.activePeriodStartedAt || 'N/A'}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 6: Add check-ins during active period
    logStep(6, 'Adding check-ins during active period...');
    // Format dates as YYYY-MM-DD (date only, not datetime)
    const formatDateOnly = (date) => date.toISOString().split('T')[0];
    const checkInDates = [
      formatDateOnly(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
      formatDateOnly(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days
      formatDateOnly(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)), // 21 days
    ];

    for (let i = 0; i < checkInDates.length; i++) {
      try {
        const checkIn = await api.addCheckIn(
          CONFIG.MANAGER_EMAIL,
          pipId,
          `Check-in #${i + 1}: Employee showing good progress. Code quality improvements visible. Communication has improved.`,
          checkInDates[i]
        );
        logSuccess(`Check-in ${i + 1} added: ${checkInDates[i]}`);
      } catch (error) {
        logError(`Failed to add check-in ${i + 1}: ${error.message}`);
        // Try with employee token instead
        logInfo(`Trying with employee token...`);
        const checkIn = await api.addCheckIn(
          CONFIG.EMPLOYEE_EMAIL,
          pipId,
          `Check-in #${i + 1}: Employee showing good progress. Code quality improvements visible. Communication has improved.`,
          checkInDates[i]
        );
        logSuccess(`Check-in ${i + 1} added (with employee token): ${checkInDates[i]}`);
      }
      await delay(CONFIG.DELAY_BETWEEN_STEPS / 2);
    }

    // Step 7: Complete active period (if enough check-ins)
    logStep(7, 'Completing active period...');
    try {
      const completedPIP = await api.completeActivePeriod(CONFIG.MANAGER_EMAIL, pipId, false);
      logSuccess('Active period completed');
      logInfo(`Status: ${completedPIP.status}`);
      logInfo(`Active period ended at: ${completedPIP.activePeriodEndedAt || 'N/A'}`);
    } catch (error) {
      logWarning(`Active period completion: ${error.message}`);
      logInfo('Trying with force complete...');
      const completedPIP = await api.completeActivePeriod(CONFIG.MANAGER_EMAIL, pipId, true);
      logSuccess('Active period completed (forced)');
      logInfo(`Status: ${completedPIP.status}`);
    }
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 8: Employee submits self-review
    logStep(8, 'Employee submitting self-review...');
    const currentPIP = await api.getPIP(CONFIG.EMPLOYEE_EMAIL, pipId);
    const selfReviewGoals = currentPIP.goals.map(goal => ({
      id: goal.id,
      justification: `I have made significant progress on ${goal.title}. I have implemented code review processes and improved my communication. Evidence attached.`,
      attachments: JSON.stringify([`evidence-${goal.id}.pdf`]),
    }));

    const selfReviewedPIP = await api.submitSelfReview(CONFIG.EMPLOYEE_EMAIL, pipId, selfReviewGoals);
    logSuccess('Self-review submitted by employee');
    logInfo(`Status: ${selfReviewedPIP.status}`);
    logInfo(`Self-review submitted at: ${selfReviewedPIP.selfReviewSubmittedAt || 'N/A'}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 9: Manager reviews
    logStep(9, 'Manager reviewing employee self-review...');
    const managerReviewPIP = await api.getPIP(CONFIG.MANAGER_EMAIL, pipId);
    const managerReviewGoals = managerReviewPIP.goals.map(goal => ({
      id: goal.id,
      status: goal.title.includes('Code Quality') ? 'achieved' : 'partially_achieved',
      managerComments: `Good progress on ${goal.title}. Employee has demonstrated improvement. ${goal.title.includes('Code Quality') ? 'Goal fully achieved.' : 'Some areas still need work but overall positive.'}`,
    }));

    const managerReviewedPIP = await api.submitManagerReview(
      CONFIG.MANAGER_EMAIL,
      pipId,
      managerReviewGoals,
      'Overall, the employee has shown commitment to improvement. The first goal was fully achieved, while the second needs continued focus.'
    );
    logSuccess('Manager review completed');
    logInfo(`Status: ${managerReviewedPIP.status}`);
    logInfo(`Manager review completed at: ${managerReviewedPIP.managerReviewCompletedAt || 'N/A'}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Step 10: HRBP makes final decision
    logStep(10, 'HRBP making final decision...');
    const finalPIP = await api.submitFinalDecision(
      CONFIG.HRBP_EMAIL,
      pipId,
      'successful',
      'After thorough review of the PIP, employee self-review, manager assessment, and all check-in notes, I have determined that the employee has successfully met the PIP requirements. The employee demonstrated significant improvement in code quality (Goal 1 - ACHIEVED) and made good progress in communication (Goal 2 - PARTIALLY_ACHIEVED). The manager\'s assessment was fair and objective. The employee showed commitment throughout the process. I recommend continued monitoring and support. No further action required at this time.'
    );
    logSuccess('Final decision made by HRBP');
    logInfo(`Status: ${finalPIP.status}`);
    logInfo(`Final Outcome: ${finalPIP.finalOutcome}`);
    logInfo(`Locked: ${finalPIP.locked}`);
    await delay(CONFIG.DELAY_BETWEEN_STEPS);

    // Summary
    log('\n' + '='.repeat(60), 'bright');
    log('WORKFLOW COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(60), 'bright');
    log(`\nPIP ID: ${pipId}`, 'cyan');
    log(`Final Status: ${finalPIP.status}`, 'cyan');
    log(`Final Outcome: ${finalPIP.finalOutcome}`, 'cyan');
    log(`Total Steps Completed: 10`, 'cyan');
    log(`Total Check-ins: ${finalPIP.checkIns?.length || 0}`, 'cyan');
    log(`Total Goals: ${finalPIP.goals?.length || 0}`, 'cyan');
    log('\n' + '='.repeat(60) + '\n', 'bright');

    // Display final PIP details
    const finalPIPDetails = await api.getPIP(CONFIG.MANAGER_EMAIL, pipId);
    log('Final PIP Details:', 'bright');
    log(`  - Status: ${finalPIPDetails.status}`);
    log(`  - Final Outcome: ${finalPIPDetails.finalOutcome || 'N/A'}`);
    log(`  - Locked: ${finalPIPDetails.locked}`);
    log(`  - Version: ${finalPIPDetails.version}`);
    log(`  - Steps: ${finalPIPDetails.steps?.length || 0}`);
    log(`  - Check-ins: ${finalPIPDetails.checkIns?.length || 0}`);
    
    if (finalPIPDetails.steps) {
      log('\nStep Status:', 'bright');
      finalPIPDetails.steps.forEach(step => {
        log(`  - ${step.step}: ${step.status} (Due: ${step.dueDate ? new Date(step.dueDate).toLocaleDateString() : 'N/A'})`);
      });
    }

    return { success: true, pipId, finalPIP: finalPIPDetails };

  } catch (error) {
    logError(`\nWorkflow failed: ${error.message}`);
    if (CONFIG.VERBOSE) {
      logError(`Stack trace: ${error.stack}`);
    }
    if (error.response) {
      logError(`Response status: ${error.response.status}`);
      logError(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message, pipId };
  }
}

// Run the automation
if (require.main === module) {
  automatePIPWorkflow()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      logError(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { automatePIPWorkflow, APIClient };

