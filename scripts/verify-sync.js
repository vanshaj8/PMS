#!/usr/bin/env node

/**
 * Sync Verification Script
 * 
 * Verifies that backend, frontend, and database are synchronized
 * 
 * Usage:
 *   node scripts/verify-sync.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logPass(message) {
  log(`✅ ${message}`, 'green');
}

function logFail(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    results.passed.push(description);
    return true;
  } else {
    results.failed.push(description);
    return false;
  }
}

function checkContent(filePath, pattern, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (pattern.test(content)) {
      results.passed.push(description);
      return true;
    } else {
      results.failed.push(description);
      return false;
    }
  } else {
    results.failed.push(`${description} (file not found)`);
    return false;
  }
}

function verifyPIPStatus() {
  log('\n[1] Verifying PIPStatus Enum Synchronization', 'cyan');
  
  const sharedTypes = path.join(__dirname, '..', 'shared', 'types.ts');
  const frontendTypes = path.join(__dirname, '..', 'frontend', 'src', 'types', 'index.ts');
  const backendStatus = path.join(__dirname, '..', 'backend-java', 'src', 'main', 'java', 'com', 'pip', 'model', 'PIPStatus.java');
  
  const requiredStatuses = [
    'overdue_employee_acknowledgement',
    'active_pending_validation',
    'overdue_manager_review',
    'overdue_hrbp_decision',
    'admin_intervention_required',
    'deemed_acknowledged',
  ];
  
  let allSynced = true;
  
  // Check shared/types.ts
  if (fs.existsSync(sharedTypes)) {
    const content = fs.readFileSync(sharedTypes, 'utf8');
    requiredStatuses.forEach(status => {
      if (content.includes(status)) {
        logPass(`shared/types.ts has: ${status}`);
      } else {
        logFail(`shared/types.ts missing: ${status}`);
        allSynced = false;
      }
    });
  } else {
    logFail('shared/types.ts not found');
    allSynced = false;
  }
  
  // Check frontend/src/types/index.ts
  if (fs.existsSync(frontendTypes)) {
    const content = fs.readFileSync(frontendTypes, 'utf8');
    requiredStatuses.forEach(status => {
      if (content.includes(status)) {
        logPass(`frontend/src/types/index.ts has: ${status}`);
      } else {
        logFail(`frontend/src/types/index.ts missing: ${status}`);
        allSynced = false;
      }
    });
  } else {
    logWarning('frontend/src/types/index.ts not found');
  }
  
  return allSynced;
}

function verifyAPIEndpoints() {
  log('\n[2] Verifying API Endpoints', 'cyan');
  
  const controllerPath = path.join(__dirname, '..', 'backend-java', 'src', 'main', 'java', 'com', 'pip', 'controller', 'PIPController.java');
  const frontendService = path.join(__dirname, '..', 'frontend', 'src', 'services', 'pipService.ts');
  
  const requiredEndpoints = [
    { pattern: /@PostMapping.*\/extend/, name: 'POST /api/pips/{id}/extend' },
    { pattern: /@PostMapping.*\/timeline-override/, name: 'POST /api/pips/{id}/timeline-override' },
    { pattern: /@PostMapping.*\/hrbp-review/, name: 'POST /api/pips/{id}/hrbp-review' },
    { pattern: /@PostMapping.*\/hrbp-approve/, name: 'POST /api/pips/{id}/hrbp-approve' },
    { pattern: /@PostMapping.*\/deem-acknowledged/, name: 'POST /api/pips/{id}/deem-acknowledged' },
    { pattern: /@PostMapping.*\/complete-active/, name: 'POST /api/pips/{id}/complete-active' },
  ];
  
  let allFound = true;
  
  if (fs.existsSync(controllerPath)) {
    const content = fs.readFileSync(controllerPath, 'utf8');
    requiredEndpoints.forEach(endpoint => {
      if (endpoint.pattern.test(content)) {
        logPass(`Backend has: ${endpoint.name}`);
      } else {
        logFail(`Backend missing: ${endpoint.name}`);
        allFound = false;
      }
    });
  } else {
    logFail('PIPController.java not found');
    allFound = false;
  }
  
  // Check frontend service calls
  if (fs.existsSync(frontendService)) {
    const content = fs.readFileSync(frontendService, 'utf8');
    if (content.includes('extend')) {
      logPass('Frontend calls extend endpoint');
    } else {
      logWarning('Frontend may not call extend endpoint');
    }
    if (content.includes('timeline-override')) {
      logPass('Frontend calls timeline-override endpoint');
    } else {
      logWarning('Frontend may not call timeline-override endpoint');
    }
  }
  
  return allFound;
}

function verifyPIPTimeline() {
  log('\n[3] Verifying PIPTimeline Structure', 'cyan');
  
  const sharedTypes = path.join(__dirname, '..', 'shared', 'types.ts');
  
  if (fs.existsSync(sharedTypes)) {
    const content = fs.readFileSync(sharedTypes, 'utf8');
    
    const requiredFields = [
      'employeeAcknowledgementDuration',
      'pipActiveDuration',
      'selfReviewBufferDuration',
      'managerReviewBufferDuration',
      'hrbpDecisionBufferDuration',
    ];
    
    let allFound = true;
    requiredFields.forEach(field => {
      if (content.includes(field)) {
        logPass(`PIPTimeline has: ${field}`);
      } else {
        logFail(`PIPTimeline missing: ${field}`);
        allFound = false;
      }
    });
    
    return allFound;
  } else {
    logFail('shared/types.ts not found');
    return false;
  }
}

function verifyPIPModel() {
  log('\n[4] Verifying PIP Model Fields', 'cyan');
  
  const sharedTypes = path.join(__dirname, '..', 'shared', 'types.ts');
  
  if (fs.existsSync(sharedTypes)) {
    const content = fs.readFileSync(sharedTypes, 'utf8');
    
    const requiredFields = [
      'hrbpApprovedAt',
      'employeeAcknowledgedAt',
      'activePeriodStartedAt',
      'activePeriodEndedAt',
      'selfReviewSubmittedAt',
      'managerReviewCompletedAt',
      'extensionCount',
      'originalActiveDuration',
    ];
    
    let allFound = true;
    requiredFields.forEach(field => {
      if (content.includes(field)) {
        logPass(`PIP interface has: ${field}`);
      } else {
        logFail(`PIP interface missing: ${field}`);
        allFound = false;
      }
    });
    
    return allFound;
  } else {
    logFail('shared/types.ts not found');
    return false;
  }
}

function verifyDatabaseMigration() {
  log('\n[5] Verifying Database Migration Script', 'cyan');
  
  const migrationPath = path.join(__dirname, '..', 'backend-java', 'database', 'migrations', 'add_deadline_fix_columns_simple.sql');
  
  if (fs.existsSync(migrationPath)) {
    logPass('Database migration script exists');
    
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    const requiredColumns = [
      'hrbp_approved_at',
      'employee_acknowledged_at',
      'active_period_started_at',
      'active_period_ended_at',
      'self_review_submitted_at',
      'manager_review_completed_at',
      'extension_count',
      'original_active_duration',
    ];
    
    let allFound = true;
    requiredColumns.forEach(column => {
      if (content.includes(column)) {
        logPass(`Migration includes: ${column}`);
      } else {
        logFail(`Migration missing: ${column}`);
        allFound = false;
      }
    });
    
    // Check for status enum update
    if (content.includes('OVERDUE_EMPLOYEE_ACKNOWLEDGEMENT') && 
        content.includes('ACTIVE_PENDING_VALIDATION') &&
        content.includes('DEEMED_ACKNOWLEDGED')) {
      logPass('Migration includes new status values');
    } else {
      logWarning('Migration may not include all new status values');
    }
    
    return allFound;
  } else {
    logFail('Database migration script not found');
    return false;
  }
}

function main() {
  log('\n' + '='.repeat(70), 'cyan');
  log('BACKEND, FRONTEND, AND DATABASE SYNC VERIFICATION', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');
  
  const checks = [
    { name: 'PIPStatus Enum', fn: verifyPIPStatus },
    { name: 'API Endpoints', fn: verifyAPIEndpoints },
    { name: 'PIPTimeline Structure', fn: verifyPIPTimeline },
    { name: 'PIP Model Fields', fn: verifyPIPModel },
    { name: 'Database Migration', fn: verifyDatabaseMigration },
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    try {
      const result = check.fn();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      logFail(`${check.name} check failed: ${error.message}`);
      allPassed = false;
    }
  });
  
  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('VERIFICATION SUMMARY', 'cyan');
  log('='.repeat(70), 'cyan');
  
  if (allPassed) {
    logPass('\n✅ All synchronization checks passed!');
    logInfo('Backend, frontend, and database appear to be synchronized.');
  } else {
    logFail('\n❌ Some synchronization issues found.');
    logInfo('Please review the failed checks above and fix the issues.');
  }
  
  log('\n' + '='.repeat(70) + '\n', 'cyan');
  
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { verifyPIPStatus, verifyAPIEndpoints, verifyPIPTimeline, verifyPIPModel, verifyDatabaseMigration };

