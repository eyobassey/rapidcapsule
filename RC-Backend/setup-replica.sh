#!/bin/bash
# Setup MongoDB Replica Set for Transactions

echo "=== MongoDB Replica Set Setup ==="

# Step 1: Add replication config
echo "Adding replication config to /etc/mongod.conf..."
sudo bash -c 'echo "" >> /etc/mongod.conf'
sudo bash -c 'echo "replication:" >> /etc/mongod.conf'
sudo bash -c 'echo "  replSetName: rs0" >> /etc/mongod.conf'

echo "Config added. Verifying..."
grep -A2 "replication" /etc/mongod.conf

# Step 2: Restart MongoDB
echo ""
echo "Restarting MongoDB..."
sudo systemctl restart mongod
sleep 3

# Step 3: Check MongoDB status
echo ""
echo "Checking MongoDB status..."
sudo systemctl status mongod --no-pager | head -10

# Step 4: Initialize replica set
echo ""
echo "Initializing replica set..."
mongosh --eval "rs.initiate()" 2>/dev/null || mongosh --eval "rs.initiate()"

# Step 5: Verify replica set
echo ""
echo "Verifying replica set status..."
sleep 2
mongosh --eval "rs.status().ok"

echo ""
echo "=== Setup Complete ==="
echo "You can now run the migration with: node run-migration.js"
