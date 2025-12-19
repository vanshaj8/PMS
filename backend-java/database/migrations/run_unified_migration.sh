#!/bin/bash

# =====================================================
# Unified Architecture Migration Runner
# =====================================================
# This script runs the unified architecture migration
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
echo -e "${GREEN}Unified Architecture Migration${NC}"
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

# Step 1: Create core tables
echo -e "${GREEN}Step 1: Creating unified core tables...${NC}"
run_sql_file "$MIGRATION_DIR/create_unified_core_tables.sql" "Create unified core tables"

# Step 2: Migrate existing data
echo -e "${GREEN}Step 2: Migrating existing data...${NC}"
read -p "Do you want to migrate existing data? (y/n): " migrate_data
if [ "$migrate_data" = "y" ] || [ "$migrate_data" = "Y" ]; then
    run_sql_file "$MIGRATION_DIR/migrate_to_unified_architecture.sql" "Migrate to unified architecture"
else
    echo -e "${YELLOW}Skipping data migration${NC}"
    echo ""
fi

# Step 3: Add foreign keys and indexes
echo -e "${GREEN}Step 3: Adding foreign keys and indexes...${NC}"
run_sql_file "$MIGRATION_DIR/add_unified_foreign_keys.sql" "Add foreign keys and indexes"

# Step 4: Verify migration
echo -e "${GREEN}Step 4: Verifying migration...${NC}"
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
SELECT 
    'workflow_phases' as table_name, COUNT(*) as count FROM workflow_phases
UNION ALL
SELECT 'workflow_steps', COUNT(*) FROM workflow_steps
UNION ALL
SELECT 'shared_goals', COUNT(*) FROM shared_goals
UNION ALL
SELECT 'goal_ratings', COUNT(*) FROM goal_ratings
UNION ALL
SELECT 'unified_reviews', COUNT(*) FROM unified_reviews
UNION ALL
SELECT 'enhanced_audit_logs', COUNT(*) FROM enhanced_audit_logs;
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

