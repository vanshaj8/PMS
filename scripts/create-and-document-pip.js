#!/usr/bin/env node

/**
 * Create and Document Complete PIP Workflow
 * 
 * Creates a PIP for a user and documents the entire process from start to end
 * 
 * Usage:
 *   node scripts/create-and-document-pip.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  MANAGER_EMAIL: process.env.MANAGER_EMAIL || 'manager@pip.com',
  EMPLOYEE_EMAIL: process.env.EMPLOYEE_EMAIL || 'employee@pip.com',
  HRBP_EMAIL: process.env.HRBP_EMAIL || 'hrbp@pip.com',
  PASSWORD: process.env.PASSWORD || 'password123',
  DELAY_BETWEEN_STEPS: 2000,
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
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
    const response = await axios.post(`${this.baseURL}/api/auth/login`, {
      email,
      password,
    });
    this.tokens[email] = response.data.token;
    if (response.data.user && response.data.user.id) {
      this.userIds[email] = response.data.user.id;
    }
    return response.data;
  }

  getHeaders(email) {
    return {
      'Authorization': `Bearer ${this.tokens[email]}`,
      'Content-Type': 'application/json',
    };
  }

  async getUsers() {
    const response = await axios.get(
      `${this.baseURL}/api/users`,
      { headers: this.getHeaders(CONFIG.MANAGER_EMAIL) }
    );
    return response.data.users || [];
  }

  async getUsersForPIPCreation() {
    const response = await axios.get(
      `${this.baseURL}/api/users/for-pip-creation`,
      { headers: this.getHeaders(CONFIG.MANAGER_EMAIL) }
    );
    return response.data;
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
    const response = await axios.post(
      `${this.baseURL}/api/pips/${pipId}/checkins`,
      { date, notes, attachments: JSON.stringify([]) },
      { headers: this.getHeaders(userEmail) }
    );
    return response.data.checkIn;
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

// Documentation
const documentation = {
  pipId: null,
  startTime: new Date().toISOString(),
  steps: [],
  finalStatus: null,
  timeline: {},
};

function addStep(stepNumber, name, details, result) {
  documentation.steps.push({
    step: stepNumber,
    name,
    timestamp: new Date().toISOString(),
    details,
    result,
  });
}

async function createAndDocumentPIP() {
  const api = new APIClient(CONFIG.API_BASE_URL);
  let pipId = null;

  try {
    log('\n' + '='.repeat(70), 'bright');
    log('PIP CREATION AND DOCUMENTATION', 'bright');
    log('='.repeat(70), 'bright');
    log(`API Base URL: ${CONFIG.API_BASE_URL}`, 'blue');
    log(`Start Time: ${documentation.startTime}`, 'blue');
    log('='.repeat(70) + '\n', 'bright');

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

    addStep(1, 'User Authentication', {
      manager: CONFIG.MANAGER_EMAIL,
      employee: CONFIG.EMPLOYEE_EMAIL,
      hrbp: CONFIG.HRBP_EMAIL,
    }, 'All users authenticated successfully');

    // Step 2: Get user IDs
    logStep(2, 'Fetching user IDs...');
    const usersData = await api.getUsersForPIPCreation();
    const employees = usersData.employees || [];
    const hrbps = usersData.hrbps || [];
    
    const employeeUser = employees.find(u => u.email === CONFIG.EMPLOYEE_EMAIL);
    const hrbpUser = hrbps.find(u => u.email === CONFIG.HRBP_EMAIL);
    
    const employeeId = employeeUser?.id || api.userIds[CONFIG.EMPLOYEE_EMAIL];
    const hrbpId = hrbpUser?.id || api.userIds[CONFIG.HRBP_EMAIL];
    
    logSuccess(`Employee ID: ${employeeId} (${CONFIG.EMPLOYEE_EMAIL})`);
    logSuccess(`HRBP ID: ${hrbpId} (${CONFIG.HRBP_EMAIL})`);
    
    addStep(2, 'User ID Retrieval', {
      employeeId,
      employeeEmail: CONFIG.EMPLOYEE_EMAIL,
      hrbpId,
      hrbpEmail: CONFIG.HRBP_EMAIL,
    }, 'User IDs retrieved successfully');

    // Step 3: Create PIP
    logStep(3, 'Manager creating PIP...');
    const pipData = {
      employeeId: employeeId,
      hrbpId: hrbpId,
      reason: 'Performance improvement needed in code quality and communication skills. Employee has shown decline in code review participation and response times to team communications.',
      supportingDocuments: JSON.stringify([
        'performance-review-q4-2025.pdf',
        'incident-report-2025-01-15.pdf',
        'code-review-metrics-january.pdf'
      ]),
      goals: [
        {
          title: 'Improve Code Quality',
          description: 'Reduce bugs by 40% and implement comprehensive code review process. Participate in all code reviews assigned and provide constructive feedback within 24 hours.',
          weightage: 50,
          expectedOutcome: 'Code quality metrics improve, fewer production bugs, active participation in code reviews',
          targetTimeline: 'Within 30 days',
          deadline: null,
        },
        {
          title: 'Enhance Communication',
          description: 'Respond to emails within 2 hours during business hours and provide daily status updates to manager. Improve participation in team meetings.',
          weightage: 50,
          expectedOutcome: 'Improved team communication and responsiveness, better visibility into work progress',
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
    documentation.pipId = pipId;
    
    logSuccess(`PIP created successfully! ID: ${pipId}`);
    logInfo(`Status: ${pip.status}`);
    logInfo(`Goals: ${pip.goals.length}`);
    logInfo(`Created At: ${pip.createdAt}`);
    
    addStep(3, 'PIP Creation', {
      pipId,
      employeeId,
      hrbpId,
      reason: pipData.reason,
      goalsCount: pip.goals.length,
      goals: pip.goals.map(g => ({ id: g.id, title: g.title, weightage: g.weightage })),
      timeline: pipData.timeline,
      status: pip.status,
    }, 'PIP created successfully');

    // Step 4: HRBP Approval
    logStep(4, 'HRBP approving PIP...');
    await delay(CONFIG.DELAY_BETWEEN_STEPS);
    const approvedPIP = await api.approvePIPByHrbp(CONFIG.HRBP_EMAIL, pipId);
    logSuccess('PIP approved by HRBP');
    logInfo(`Status: ${approvedPIP.status}`);
    logInfo(`HRBP approved at: ${approvedPIP.hrbpApprovedAt || 'N/A'}`);
    
    // Get updated PIP with steps
    const updatedPIP = await api.getPIP(CONFIG.MANAGER_EMAIL, pipId);
    const ackStep = updatedPIP.steps?.find(s => s.step === 'EMPLOYEE_ACKNOWLEDGEMENT');
    
    addStep(4, 'HRBP Approval', {
      status: approvedPIP.status,
      hrbpApprovedAt: approvedPIP.hrbpApprovedAt,
      employeeAckDeadline: ackStep?.dueDate,
    }, 'PIP approved by HRBP, deadlines recalculated');

    // Step 5: Employee Acknowledgement
    logStep(5, 'Employee acknowledging PIP...');
    await delay(CONFIG.DELAY_BETWEEN_STEPS);
    const acknowledgedPIP = await api.acknowledgePIP(
      CONFIG.EMPLOYEE_EMAIL,
      pipId,
      'I acknowledge receipt of this PIP and understand the requirements. I commit to working on the outlined goals and will provide regular updates on my progress.'
    );
    logSuccess('PIP acknowledged by employee');
    logInfo(`Status: ${acknowledgedPIP.status}`);
    logInfo(`Acknowledged at: ${acknowledgedPIP.employeeAcknowledgedAt || 'N/A'}`);
    logInfo(`Active period started at: ${acknowledgedPIP.activePeriodStartedAt || 'N/A'}`);
    
    const activeStep = acknowledgedPIP.steps?.find(s => s.step === 'ACTIVE_PIP');
    
    addStep(5, 'Employee Acknowledgement', {
      status: acknowledgedPIP.status,
      acknowledgedAt: acknowledgedPIP.employeeAcknowledgedAt,
      activePeriodStartedAt: acknowledgedPIP.activePeriodStartedAt,
      activePeriodEndDeadline: activeStep?.dueDate,
      comments: 'Employee acknowledged and committed to improvement',
    }, 'PIP acknowledged, active period started');

    // Step 6: Add Check-ins
    logStep(6, 'Adding check-ins during active period...');
    const formatDateOnly = (date) => date.toISOString().split('T')[0];
    const checkInDates = [
      formatDateOnly(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      formatDateOnly(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days
      formatDateOnly(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)), // 21 days
    ];

    const checkIns = [];
    for (let i = 0; i < checkInDates.length; i++) {
      const checkIn = await api.addCheckIn(
        CONFIG.MANAGER_EMAIL,
        pipId,
        `Check-in #${i + 1}: Employee showing good progress. Code quality improvements visible with increased participation in code reviews. Communication has improved with faster response times. Overall positive trajectory.`,
        checkInDates[i]
      );
      checkIns.push(checkIn);
      logSuccess(`Check-in ${i + 1} added: ${checkInDates[i]}`);
      await delay(CONFIG.DELAY_BETWEEN_STEPS / 2);
    }
    
    addStep(6, 'Check-ins Added', {
      checkInsCount: checkIns.length,
      checkIns: checkIns.map(ci => ({
        id: ci.id,
        date: ci.date,
        notes: ci.notes.substring(0, 100) + '...',
      })),
    }, 'Three check-ins added during active period');

    // Step 7: Complete Active Period
    logStep(7, 'Completing active period...');
    await delay(CONFIG.DELAY_BETWEEN_STEPS);
    const completedPIP = await api.completeActivePeriod(CONFIG.MANAGER_EMAIL, pipId, false);
    logSuccess('Active period completed');
    logInfo(`Status: ${completedPIP.status}`);
    logInfo(`Active period ended at: ${completedPIP.activePeriodEndedAt || 'N/A'}`);
    
    const selfReviewStep = completedPIP.steps?.find(s => s.step === 'EMPLOYEE_SELF_REVIEW');
    
    addStep(7, 'Active Period Completion', {
      status: completedPIP.status,
      activePeriodEndedAt: completedPIP.activePeriodEndedAt,
      selfReviewDeadline: selfReviewStep?.dueDate,
      checkInsValidated: true,
    }, 'Active period completed, self-review deadline set');

    // Step 8: Employee Self-Review
    logStep(8, 'Employee submitting self-review...');
    await delay(CONFIG.DELAY_BETWEEN_STEPS);
    const currentPIP = await api.getPIP(CONFIG.EMPLOYEE_EMAIL, pipId);
    const selfReviewGoals = currentPIP.goals.map(goal => ({
      id: goal.id,
      justification: `I have made significant progress on ${goal.title}. 

For Code Quality: I have implemented a personal code review checklist and have been actively participating in all assigned code reviews. I've reduced my bug introduction rate by 35% and have been providing detailed feedback in reviews. I've attached evidence of my code review participation and bug metrics.

For Communication: I have set up email notifications and have been responding to emails within the 2-hour window. I've been providing daily status updates via our team communication channel. I've improved my meeting participation and have been more proactive in sharing updates.`,
      attachments: JSON.stringify([
        `code-review-evidence-${goal.id}.pdf`,
        `communication-logs-${goal.id}.pdf`,
        `improvement-metrics-${goal.id}.xlsx`
      ]),
    }));

    const selfReviewedPIP = await api.submitSelfReview(CONFIG.EMPLOYEE_EMAIL, pipId, selfReviewGoals);
    logSuccess('Self-review submitted by employee');
    logInfo(`Status: ${selfReviewedPIP.status}`);
    logInfo(`Self-review submitted at: ${selfReviewedPIP.selfReviewSubmittedAt || 'N/A'}`);
    
    const managerReviewStep = selfReviewedPIP.steps?.find(s => s.step === 'MANAGER_REVIEW');
    
    addStep(8, 'Employee Self-Review', {
      status: selfReviewedPIP.status,
      submittedAt: selfReviewedPIP.selfReviewSubmittedAt,
      managerReviewDeadline: managerReviewStep?.dueDate,
      goalsReviewed: selfReviewGoals.length,
    }, 'Employee submitted self-review for all goals');

    // Step 9: Manager Review
    logStep(9, 'Manager reviewing employee self-review...');
    await delay(CONFIG.DELAY_BETWEEN_STEPS);
    const managerReviewPIP = await api.getPIP(CONFIG.MANAGER_EMAIL, pipId);
    const managerReviewGoals = managerReviewPIP.goals.map(goal => ({
      id: goal.id,
      status: goal.title.includes('Code Quality') ? 'achieved' : 'partially_achieved',
      managerComments: `Good progress on ${goal.title}. 

Code Quality Goal: The employee has demonstrated significant improvement. Bug reduction of 35% is commendable, though the target was 40%. Code review participation has been excellent. I rate this as ACHIEVED.

Communication Goal: The employee has shown improvement in response times and daily updates. However, there are still some instances of delayed responses during peak periods. Meeting participation has improved. I rate this as PARTIALLY_ACHIEVED with continued focus needed.`,
    }));

    const managerReviewedPIP = await api.submitManagerReview(
      CONFIG.MANAGER_EMAIL,
      pipId,
      managerReviewGoals,
      'Overall, the employee has shown commitment to improvement. The first goal (Code Quality) was fully achieved with excellent code review participation and significant bug reduction. The second goal (Communication) shows good progress but needs continued focus. The employee has demonstrated a positive attitude and willingness to improve. I recommend continued monitoring and support.'
    );
    logSuccess('Manager review completed');
    logInfo(`Status: ${managerReviewedPIP.status}`);
    logInfo(`Manager review completed at: ${managerReviewedPIP.managerReviewCompletedAt || 'N/A'}`);
    
    const hrbpDecisionStep = managerReviewedPIP.steps?.find(s => s.step === 'HRBP_DECISION');
    
    addStep(9, 'Manager Review', {
      status: managerReviewedPIP.status,
      completedAt: managerReviewedPIP.managerReviewCompletedAt,
      hrbpDecisionDeadline: hrbpDecisionStep?.dueDate,
      goalAssessments: managerReviewGoals.map(g => ({
        goalId: g.id,
        status: g.status,
      })),
    }, 'Manager completed review, HRBP decision pending');

    // Step 10: HRBP Final Decision
    logStep(10, 'HRBP making final decision...');
    await delay(CONFIG.DELAY_BETWEEN_STEPS);
    const finalPIP = await api.submitFinalDecision(
      CONFIG.HRBP_EMAIL,
      pipId,
      'successful',
      `After thorough review of the PIP, employee self-review, manager assessment, and all check-in notes, I have determined that the employee has successfully met the PIP requirements.

Key Achievements:
- Code Quality Goal: ACHIEVED - Employee reduced bugs by 35% (target was 40%, close enough given the improvement trajectory) and demonstrated excellent code review participation.
- Communication Goal: PARTIALLY_ACHIEVED - Employee showed significant improvement in response times and daily updates, though some areas still need continued focus.

The manager's assessment was fair and objective. The employee showed commitment throughout the process with consistent check-ins and detailed self-review. The overall trajectory is positive.

I recommend:
1. Continued monitoring for the next quarter
2. Additional support in communication areas where improvement is still needed
3. Recognition of the employee's commitment to improvement

Final Outcome: SUCCESSFUL - The employee has demonstrated sufficient improvement to meet PIP requirements.`
    );
    logSuccess('Final decision made by HRBP');
    logInfo(`Status: ${finalPIP.status}`);
    logInfo(`Final Outcome: ${finalPIP.finalOutcome}`);
    logInfo(`Locked: ${finalPIP.locked}`);
    
    documentation.finalStatus = finalPIP.status;
    documentation.timeline = {
      created: pip.createdAt,
      hrbpApproved: finalPIP.hrbpApprovedAt,
      employeeAcknowledged: finalPIP.employeeAcknowledgedAt,
      activePeriodStarted: finalPIP.activePeriodStartedAt,
      activePeriodEnded: finalPIP.activePeriodEndedAt,
      selfReviewSubmitted: finalPIP.selfReviewSubmittedAt,
      managerReviewCompleted: finalPIP.managerReviewCompletedAt,
      completed: new Date().toISOString(),
    };
    
    addStep(10, 'HRBP Final Decision', {
      status: finalPIP.status,
      finalOutcome: finalPIP.finalOutcome,
      finalRemarks: finalPIP.finalRemarks?.substring(0, 200) + '...',
      locked: finalPIP.locked,
    }, 'HRBP made final decision: SUCCESSFUL');

    // Get final PIP details
    const finalPIPDetails = await api.getPIP(CONFIG.MANAGER_EMAIL, pipId);
    
    // Summary
    log('\n' + '='.repeat(70), 'bright');
    log('PIP WORKFLOW COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(70), 'bright');
    log(`\nPIP ID: ${pipId}`, 'cyan');
    log(`Final Status: ${finalPIPDetails.status}`, 'cyan');
    log(`Final Outcome: ${finalPIPDetails.finalOutcome}`, 'cyan');
    log(`Total Steps Completed: 10`, 'cyan');
    log(`Total Check-ins: ${finalPIPDetails.checkIns?.length || 0}`, 'cyan');
    log(`Total Goals: ${finalPIPDetails.goals?.length || 0}`, 'cyan');
    log('\n' + '='.repeat(70) + '\n', 'bright');

    // Save documentation
    documentation.endTime = new Date().toISOString();
    documentation.duration = new Date(documentation.endTime) - new Date(documentation.startTime);
    documentation.finalPIP = {
      id: finalPIPDetails.id,
      status: finalPIPDetails.status,
      finalOutcome: finalPIPDetails.finalOutcome,
      goals: finalPIPDetails.goals.map(g => ({
        id: g.id,
        title: g.title,
        status: g.status,
        weightage: g.weightage,
      })),
      checkInsCount: finalPIPDetails.checkIns?.length || 0,
      steps: finalPIPDetails.steps?.map(s => ({
        step: s.step,
        status: s.status,
        dueDate: s.dueDate,
        completedDate: s.completedDate,
      })) || [],
    };

    const docPath = path.join(__dirname, '..', 'PIP_WORKFLOW_DOCUMENTATION.json');
    fs.writeFileSync(docPath, JSON.stringify(documentation, null, 2));
    logSuccess(`Documentation saved to: ${docPath}`);

    // Generate markdown documentation
    generateMarkdownDocumentation(documentation, pipId);

    return { success: true, pipId, documentation };

  } catch (error) {
    log(`\n❌ Workflow failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'red');
      log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    documentation.error = error.message;
    const docPath = path.join(__dirname, '..', 'PIP_WORKFLOW_DOCUMENTATION.json');
    fs.writeFileSync(docPath, JSON.stringify(documentation, null, 2));
    return { success: false, error: error.message, pipId, documentation };
  }
}

function generateMarkdownDocumentation(doc, pipId) {
  const mdPath = path.join(__dirname, '..', 'PIP_WORKFLOW_DOCUMENTATION.md');
  let md = `# Complete PIP Workflow Documentation

**PIP ID:** ${pipId}  
**Start Time:** ${doc.startTime}  
**End Time:** ${doc.endTime}  
**Duration:** ${Math.round(doc.duration / 1000)} seconds  
**Final Status:** ${doc.finalStatus}  
**Final Outcome:** ${doc.finalPIP?.finalOutcome || 'N/A'}

---

## Overview

This document provides a complete walkthrough of a PIP (Performance Improvement Plan) workflow from creation to final decision. All steps were executed programmatically and documented in real-time.

---

## Timeline

| Event | Timestamp |
|-------|-----------|
| PIP Created | ${doc.timeline.created || 'N/A'} |
| HRBP Approved | ${doc.timeline.hrbpApproved || 'N/A'} |
| Employee Acknowledged | ${doc.timeline.employeeAcknowledged || 'N/A'} |
| Active Period Started | ${doc.timeline.activePeriodStarted || 'N/A'} |
| Active Period Ended | ${doc.timeline.activePeriodEnded || 'N/A'} |
| Self-Review Submitted | ${doc.timeline.selfReviewSubmitted || 'N/A'} |
| Manager Review Completed | ${doc.timeline.managerReviewCompleted || 'N/A'} |
| Workflow Completed | ${doc.timeline.completed || 'N/A'} |

---

## Step-by-Step Process

`;

  doc.steps.forEach((step, index) => {
    md += `### Step ${step.step}: ${step.name}

**Timestamp:** ${step.timestamp}

**Details:**
\`\`\`json
${JSON.stringify(step.details, null, 2)}
\`\`\`

**Result:** ${step.result}

---

`;
  });

  md += `## Final PIP Details

**Status:** ${doc.finalPIP?.status || 'N/A'}  
**Final Outcome:** ${doc.finalPIP?.finalOutcome || 'N/A'}  
**Total Goals:** ${doc.finalPIP?.goals?.length || 0}  
**Total Check-ins:** ${doc.finalPIP?.checkInsCount || 0}

### Goals

`;

  doc.finalPIP?.goals?.forEach(goal => {
    md += `- **${goal.title}** (${goal.weightage}% weightage)
  - Status: ${goal.status || 'N/A'}
  - ID: ${goal.id}

`;
  });

  md += `### Workflow Steps

`;

  doc.finalPIP?.steps?.forEach(step => {
    md += `- **${step.step}**
  - Status: ${step.status}
  - Due Date: ${step.dueDate || 'N/A'}
  - Completed: ${step.completedDate || 'Not completed'}

`;
  });

  md += `---

## Key Learnings

1. **Deadline Calculation:** All deadlines are calculated based on actual timestamps, not pre-computed dates
2. **Check-in Validation:** System requires minimum check-ins before completing active period
3. **Status Transitions:** Each step triggers automatic status updates and deadline recalculations
4. **Workflow Integrity:** All steps are validated and locked appropriately

---

**Documentation Generated:** ${new Date().toISOString()}
`;

  fs.writeFileSync(mdPath, md);
  logSuccess(`Markdown documentation saved to: ${mdPath}`);
}

// Run the workflow
if (require.main === module) {
  createAndDocumentPIP()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { createAndDocumentPIP };

