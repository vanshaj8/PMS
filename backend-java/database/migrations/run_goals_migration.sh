#!/bin/bash

# =====================================================
# Goals Module Migration Runner
# =====================================================
# This script runs the Goals module migration
# in the correct order
# =====================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-pip_management}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
MIGRATION_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Goals Module Migration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: mysql command not found${NC}"
    exit 1
fi

# Prompt for database password if not set
if [ -z "$DB_PASS" ]; then
    read -sp "Enter MySQL password for user $DB_USER: " DB_PASS
    echo ""
fi

# Function to run SQL file
run_sql_file() {
    local file=$1
    local description=$2
    
    echo -e "${YELLOW}Running: $description${NC}"
    echo "File: $file"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File not found: $file${NC}"
        exit 1
    fi
    
    if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$file"; then
        echo -e "${GREEN}✓ Success: $description${NC}"
        echo ""
    else
        echo -e "${RED}✗ Error: Failed to run $description${NC}"
        exit 1
    fi
}

# Step 1: Create goals tables
echo -e "${GREEN}Step 1: Creating Goals module tables...${NC}"
run_sql_file "$MIGRATION_DIR/create_goals_module_tables.sql" "Create Goals module tables"

# Step 2: Migrate existing goals
echo -e "${GREEN}Step 2: Migrating existing goals...${NC}"
read -p "Do you want to migrate existing goals? (y/n): " migrate_goals
if [ "$migrate_goals" = "y" ] || [ "$migrate_goals" = "Y" ]; then
    run_sql_file "$MIGRATION_DIR/migrate_existing_goals.sql" "Migrate existing goals"
else
    echo -e "${YELLOW}Skipping goal migration${NC}"
    echo ""
fi

# Step 3: Verify migration
echo -e "${GREEN}Step 3: Verifying migration...${NC}"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
SELECT 
    'goals' as table_name, COUNT(*) as count FROM goals
UNION ALL
SELECT 'goal_versions', COUNT(*) FROM goal_versions
UNION ALL
SELECT 'goal_context_links', COUNT(*) FROM goal_context_links
UNION ALL
SELECT 'pip_goal_links', COUNT(*) FROM pip_goal_links
UNION ALL
SELECT 'appraisal_goal_snapshots', COUNT(*) FROM appraisal_goal_snapshots;
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Goals Module Migration Completed!${NC}"
echo -e "${GREEN}========================================${NC}"

