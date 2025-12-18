# PIP Workflow Automation Script

This script automates the complete end-to-end PIP process for testing and validation.

## Features

- ✅ Complete workflow automation from creation to final decision
- ✅ Tests all 9 workflow steps
- ✅ Validates deadline calculations
- ✅ Tests check-in requirements
- ✅ Color-coded console output
- ✅ Error handling and reporting
- ✅ Configurable via environment variables

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Backend running** on `http://localhost:8080` (or configure via `API_BASE_URL`)
3. **Default users exist** in database:
   - `manager@pip.com` / `password123`
   - `employee@pip.com` / `password123`
   - `hrbp@pip.com` / `password123`

## Installation

```bash
cd scripts
npm install
```

## Usage

### Basic Usage

```bash
node automate-pip-workflow.js
```

### With Custom Configuration

```bash
API_BASE_URL=http://localhost:8080 \
MANAGER_EMAIL=manager@pip.com \
EMPLOYEE_EMAIL=employee@pip.com \
HRBP_EMAIL=hrbp@pip.com \
PASSWORD=password123 \
node automate-pip-workflow.js
```

### Verbose Mode

```bash
VERBOSE=true node automate-pip-workflow.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_BASE_URL` | `http://localhost:8080` | Base URL for the API |
| `MANAGER_EMAIL` | `manager@pip.com` | Manager email for login |
| `EMPLOYEE_EMAIL` | `employee@pip.com` | Employee email for login |
| `HRBP_EMAIL` | `hrbp@pip.com` | HRBP email for login |
| `PASSWORD` | `password123` | Password for all users |
| `VERBOSE` | `false` | Enable verbose error output |

## Workflow Steps

The script automates the following steps:

1. **Login All Users** - Logs in manager, employee, and HRBP
2. **Create PIP** - Manager creates a PIP with 2 goals
3. **HRBP Approval** - HRBP approves the PIP (deadlines recalculate)
4. **Employee Acknowledgement** - Employee acknowledges the PIP
5. **Add Check-ins** - Adds 3 check-ins during active period
6. **Complete Active Period** - Completes active period (validates check-ins)
7. **Employee Self-Review** - Employee submits self-review for all goals
8. **Manager Review** - Manager reviews and assesses goals
9. **HRBP Final Decision** - HRBP makes final decision (SUCCESSFUL)

## Output

The script provides color-coded output:

- 🟢 **Green** - Success messages
- 🔴 **Red** - Error messages
- 🟡 **Yellow** - Warning messages
- 🔵 **Blue** - Info messages
- 🔷 **Cyan** - Step headers

## Example Output

```
============================================================
PIP WORKFLOW AUTOMATION SCRIPT
============================================================
API Base URL: http://localhost:8080
Manager: manager@pip.com
Employee: employee@pip.com
HRBP: hrbp@pip.com
============================================================

[STEP 1] Logging in all users...
✅ Manager logged in: manager@pip.com
✅ Employee logged in: employee@pip.com
✅ HRBP logged in: hrbp@pip.com

[STEP 2] Manager creating PIP...
✅ PIP created successfully! ID: abc-123-def-456
ℹ️  Status: pending_hrbp_review
ℹ️  Goals: 2

[STEP 3] HRBP approving PIP...
✅ PIP approved by HRBP
ℹ️  Status: pending_employee_acknowledgement
...

============================================================
WORKFLOW COMPLETED SUCCESSFULLY!
============================================================

PIP ID: abc-123-def-456
Final Status: completed
Final Outcome: successful
Total Steps Completed: 9
Total Check-ins: 3
Total Goals: 2
```

## Error Handling

The script includes comprehensive error handling:

- **Login failures** - Reports which user failed to login
- **API errors** - Shows HTTP status and response data
- **Workflow failures** - Reports at which step the failure occurred
- **Validation errors** - Shows specific validation messages

## Testing Different Scenarios

### Test with Extension

Modify the script to test extension workflow by adding extension request after active period.

### Test Overdue Scenarios

Add delays between steps to test overdue handling and escalations.

### Test Different Outcomes

Modify the final decision to test:
- `unsuccessful` - Employee didn't meet requirements
- `extended` - PIP needs extension
- `closed_without_action` - PIP closed for other reasons

## Troubleshooting

### Connection Errors

```
❌ Login failed for manager@pip.com: connect ECONNREFUSED
```

**Solution**: Ensure backend is running on the configured port.

### Authentication Errors

```
❌ Login failed for manager@pip.com: 401 (Unauthorized)
```

**Solution**: Verify user credentials exist in database with correct password hash.

### Validation Errors

```
❌ Workflow failed: Active duration must be between 30 and 90 days
```

**Solution**: Check that timeline durations are within policy limits.

## Integration with CI/CD

This script can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Test PIP Workflow
  run: |
    cd scripts
    npm install
    node automate-pip-workflow.js
  env:
    API_BASE_URL: http://localhost:8080
```

## Next Steps

- Add support for testing extension workflow
- Add support for testing escalation scenarios
- Add support for testing grace period handling
- Add performance benchmarking
- Add parallel workflow testing

---

**Last Updated**: December 2025

