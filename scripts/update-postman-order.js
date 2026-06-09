const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const root = path.resolve(__dirname, '..', 'postman', 'collections', 'Dell Lead Management API');
const updates = {
  'Leads/Create Lead.request.yaml': 100,
  'Leads/Get All Leads.request.yaml': 200,
  'Leads/Get Lead by ID.request.yaml': 300,
  'Leads/Create Lead - Missing Fields.request.yaml': 400,
  'Leads/Create Lead - Invalid Email.request.yaml': 500,
  'Leads/Create Lead - Duplicate Email.request.yaml': 600,
  'Interest Categories/Get All Interest Categories.request.yaml': 700,
  'Interest Categories/Add Interest to Lead.request.yaml': 800,
  'Interest Categories/Get Lead Interest Categories.request.yaml': 900,
  'Interest Categories/Add Interest - Missing Fields.request.yaml': 1000,
  'Interest Categories/Remove Interest from Lead.request.yaml': 1100,
  'AI Analysis/Analyze Lead.request.yaml': 1200,
  'AI Analysis/Analyze Lead - Not Found.request.yaml': 1300,
  'Leads/Update Lead.request.yaml': 1400,
  'Leads/Delete Lead.request.yaml': 1500,
  'Leads/Get Lead - Not Found.request.yaml': 1600,
  'Teams/Get All Teams.request.yaml': 1700,
  'Teams/Create Team.request.yaml': 1800,
  'Teams/Get Team by ID.request.yaml': 1900,
  'Teams/Update Team.request.yaml': 2000,
  'Teams/Delete Team.request.yaml': 2100,
  'Teams/Get Team - Not Found.request.yaml': 2200,
};

Object.entries(updates).forEach(([rel, order]) => {
  const filePath = path.join(root, rel);
  if (!fs.existsSync(filePath)) {
    console.error('Missing file:', filePath);
    process.exitCode = 1;
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const doc = YAML.parseDocument(content);
  doc.set('order', order);
  fs.writeFileSync(filePath, String(doc), 'utf8');
  console.log('Updated', rel, 'to order', order);
});
