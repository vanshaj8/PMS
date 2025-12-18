#!/bin/bash

# Script to verify data storage via UI
# This checks if data created through the UI is stored in MySQL database

echo "🔍 Checking Data Storage Connection"
echo "===================================="
echo ""

# Check backend status
echo "1. Checking Backend Status..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running - please start it first"
    exit 1
fi

# Check database connection
echo ""
echo "2. Checking Database Connection..."
mysql -u root -p'Vanshaj@8' pip_management -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Cannot connect to database"
    exit 1
fi

# Show current data
echo ""
echo "3. Current Database Contents:"
echo "   Users in database:"
mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) as count FROM users;" 2>/dev/null | tail -1
echo ""
echo "   PIPs in database:"
mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) as count FROM pips;" 2>/dev/null | tail -1
echo ""
echo "   Goals in database:"
mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) as count FROM goals;" 2>/dev/null | tail -1

echo ""
echo "4. To Test Data Storage:"
echo "   - Open http://localhost:5173 in your browser"
echo "   - Login with: admin@pip.com / password123"
echo "   - Create a new PIP or user"
echo "   - Run this script again to see if data was saved"
echo ""
echo "5. Monitoring for new data..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Monitor database for new entries
BEFORE_USERS=$(mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) FROM users;" -s -N 2>/dev/null)
BEFORE_PIPS=$(mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) FROM pips;" -s -N 2>/dev/null)
BEFORE_GOALS=$(mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) FROM goals;" -s -N 2>/dev/null)

while true; do
    sleep 3
    CURRENT_USERS=$(mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) FROM users;" -s -N 2>/dev/null)
    CURRENT_PIPS=$(mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) FROM pips;" -s -N 2>/dev/null)
    CURRENT_GOALS=$(mysql -u root -p'Vanshaj@8' pip_management -e "SELECT COUNT(*) FROM goals;" -s -N 2>/dev/null)
    
    if [ "$CURRENT_USERS" != "$BEFORE_USERS" ]; then
        echo "   🎉 NEW USER DETECTED! Count changed from $BEFORE_USERS to $CURRENT_USERS"
        BEFORE_USERS=$CURRENT_USERS
    fi
    
    if [ "$CURRENT_PIPS" != "$BEFORE_PIPS" ]; then
        echo "   🎉 NEW PIP DETECTED! Count changed from $BEFORE_PIPS to $CURRENT_PIPS"
        BEFORE_PIPS=$CURRENT_PIPS
    fi
    
    if [ "$CURRENT_GOALS" != "$BEFORE_GOALS" ]; then
        echo "   🎉 NEW GOAL DETECTED! Count changed from $BEFORE_GOALS to $CURRENT_GOALS"
        BEFORE_GOALS=$CURRENT_GOALS
    fi
done
