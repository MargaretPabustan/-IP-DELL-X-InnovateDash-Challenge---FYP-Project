// ── IMPORTS ─────────────────────────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/debug-bcrypt', async (req, res) => {
    const { password, hash } = req.body;
    const result = await bcrypt.compare(password, hash);
    res.json({ result });
});

// ── JWT AUTH MIDDLEWARE ───────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
        next();
    };
}

// ── SUPABASE CONNECTION ───────────────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
pool.connect()
    .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
    .catch(err => console.error('❌ DB connection error:', err));

// ── GEMINI SETUP ──────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
console.log('GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? '✅ ' + process.env.GEMINI_API_KEY.substring(0, 8) + '...' : '❌ MISSING');

// ── INTEREST → TEAM MAPPING ───────────────────────────────────────────────────
// Mirrors the frontend INTEREST_TEAM_MAP exactly
// Team 1: AI PCs, Team 2: Multi-cloud, Team 3: Storage, Team 4: Service, Team 5: Others
const INTEREST_TEAM_MAP = {
    'AI PCs':      1,
    'Multi-cloud': 2,
    'Storage':     3,
    'Service':     4,
};
const OTHERS_TEAM_ID = 5;

// Resolves team from primary interest (QR), then selected interests, then Others
function resolveTeamId(primaryInterest, selectedInterests = []) {
    if (primaryInterest && INTEREST_TEAM_MAP[primaryInterest]) {
        return INTEREST_TEAM_MAP[primaryInterest];
    }
    for (const interest of selectedInterests) {
        if (INTEREST_TEAM_MAP[interest]) return INTEREST_TEAM_MAP[interest];
    }
    return OTHERS_TEAM_ID;
}

// ── RULE-BASED FALLBACK ───────────────────────────────────────────────────────
function generateRuleBasedAnalysis(customerIntent, interests) {
    let intent = 'Low';
    let confidence = 0.5;
    let follow_up_required = false;
    let notes = '';
    let status = 'NEW';

    const intentLower = (customerIntent || '').toLowerCase();

    if (intentLower.includes('high') || intentLower.includes('ready for follow-up')) {
        intent = 'High'; confidence = 0.85; follow_up_required = true; status = 'QUALIFIED';
        notes = `High intent lead interested in ${interests}. Recommend immediate follow-up to discuss ${interests} solutions and schedule a product demonstration.`;
    } else if (intentLower.includes('medium') || intentLower.includes('pricing') || intentLower.includes('demo')) {
        intent = 'Medium'; confidence = 0.65; follow_up_required = true; status = 'CONTACTED';
        if (intentLower.includes('pricing')) {
            notes = `Lead is exploring pricing options for ${interests}. Follow up within 3 days with a tailored quote or pricing overview.`;
        } else if (intentLower.includes('demo')) {
            notes = `Lead expressed interest in a product demo for ${interests}. Schedule a demonstration within the week to showcase relevant Dell solutions.`;
        } else {
            notes = `Medium intent lead interested in ${interests}. Follow up within 3 days to explore their requirements further.`;
        }
    } else {
        intent = 'Low'; confidence = 0.4; follow_up_required = false; status = 'NEW';
        notes = `Lead is currently browsing and interested in ${interests}. Add to the mailing list and follow up with relevant product information in 1-2 weeks.`;
    }

    const statusDisplay = { 'QUALIFIED': 'Ready for Follow-up', 'CONTACTED': 'Review for Follow-up', 'NEW': 'No Follow-up Needed' };
    return { intent, confidence, follow_up_required, notes, status, follow_up_status: statusDisplay[status] };
}

// ── VALIDATION ────────────────────────────────────────────────────────────────
function validateLead(name, email, company, title, phone) {
    if (!name || !email || !company || !title || !phone) return 'All fields (name, email, company, title, phone) are required';
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    if (phone.length < 8) return 'Phone number is too short';
    return null;
}

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: '✅ Boothflow API is running',
        version: '1.0.0',
        endpoints: [
            'GET /leads', 'POST /leads', 'GET /leads/:id', 'PUT /leads/:id', 'DELETE /leads/:id',
            'GET /interest_categories',
            'POST /lead_interest_categories', 'GET /lead_interest_categories/:lead_id', 'DELETE /lead_interest_categories/:lead_id/:category_id',
            'GET /teams', 'POST /teams', 'GET /teams/:id', 'PUT /teams/:id', 'DELETE /teams/:id',
            'POST /analyze-lead/:id',
        ]
    });
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign(
            { id: user.user_id, role: user.role, team_id: user.team_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/auth/me', authenticateToken, (req, res) => {
    res.json(req.user);
});

// ── LEADS ─────────────────────────────────────────────────────────────────────
app.use('/leads', authenticateToken);
app.use('/leads', authorizeRoles('admin', 'manager', 'rep'));

app.get('/leads', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads ORDER BY lead_id');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /leads — now accepts assigned_team_id and primary_interest ────────────
app.post('/leads', async (req, res) => {
    const {
        name, email, company, title, phone_number,
        customer_intent,
        assigned_team_id,
        primary_interest,
        selected_interests,
        additional_notes,
        scanned_by,         // user_id of the rep who scanned this lead
    } = req.body;

    const error = validateLead(name, email, company, title, phone_number);
    if (error) return res.status(400).json({ success: false, message: error });

    // ── Duplicate check ────────────────────────────────────────────────────
    try {
        const existing = await pool.query('SELECT lead_id FROM leads WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, code: 'DUPLICATE_EMAIL', message: 'A lead with this email already exists' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }

    // ── Resolve team: trust frontend if provided, otherwise compute here ───
    let teamId = assigned_team_id;
    if (!teamId) {
        const interestsList = Array.isArray(selected_interests) ? selected_interests : [];
        teamId = resolveTeamId(primary_interest, interestsList);
        console.log(`🏷 Server resolved team: ${teamId} (primary: "${primary_interest}", selected: [${interestsList}])`);
    } else {
        console.log(`🏷 Frontend provided team: ${teamId}`);
    }

    try {
        const result = await pool.query(
            `INSERT INTO leads (name, email, company, title, phone_number, customer_intent, assigned_team_id, ai_notes, scanned_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING lead_id`,
            [name, email, company, title, phone_number, customer_intent || null, teamId, additional_notes || null, scanned_by || null]
        );
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            lead_id: result.rows[0].lead_id,
            assigned_team_id: teamId,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/leads/:id', async (req, res) => {
    const { name, email, company, title, phone_number, customer_intent } = req.body;
    const error = validateLead(name, email, company, title, phone_number);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const result = await pool.query(
            `UPDATE leads SET name=$1, email=$2, company=$3, title=$4, phone_number=$5, customer_intent=$6 WHERE lead_id=$7`,
            [name, email, company, title, phone_number, customer_intent || null, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, message: 'Lead updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM leads WHERE lead_id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── INTEREST CATEGORIES ───────────────────────────────────────────────────────
app.get('/interest_categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM interest_categories');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/lead_interest_categories/:lead_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ic.category_id, ic.category_name
             FROM lead_interest_categories lic
             JOIN interest_categories ic ON lic.category_id = ic.category_id
             WHERE lic.lead_id = $1`,
            [req.params.lead_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/lead_interest_categories', async (req, res) => {
    const lead_id = parseInt(req.body.lead_id);
    const category_id = parseInt(req.body.category_id);
    if (!lead_id || !category_id) return res.status(400).json({ success: false, message: 'lead_id and category_id required' });
    try {
        await pool.query('INSERT INTO lead_interest_categories (lead_id, category_id) VALUES ($1, $2)', [lead_id, category_id]);
        res.status(201).json({ success: true, message: 'Interest added' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/lead_interest_categories/:lead_id/:category_id', async (req, res) => {
    try {
        await pool.query('DELETE FROM lead_interest_categories WHERE lead_id=$1 AND category_id=$2', [req.params.lead_id, req.params.category_id]);
        res.json({ success: true, message: 'Interest removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── TEAMS ─────────────────────────────────────────────────────────────────────
app.get('/teams', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
app.get('/teams/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams WHERE team_id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Team not found' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
app.post('/teams', async (req, res) => {
    const { team_name, territory, description } = req.body;
    try {
        const result = await pool.query('INSERT INTO teams (team_name, territory, description) VALUES ($1, $2, $3) RETURNING team_id', [team_name, territory, description]);
        res.status(201).json({ message: 'Team created', team_id: result.rows[0].team_id });
    } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/teams/:id', async (req, res) => {
    const { team_name, territory, description } = req.body;
    try {
        await pool.query('UPDATE teams SET team_name=$1, territory=$2, description=$3 WHERE team_id=$4', [team_name, territory, description, req.params.id]);
        res.json({ message: 'Team updated' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});
app.delete('/teams/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM teams WHERE team_id=$1', [req.params.id]);
        res.json({ message: 'Team deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── MANAGER ROUTES ────────────────────────────────────────────────────────────
app.get('/manager/dashboard', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const totalLeads = await pool.query('SELECT COUNT(*) FROM leads');
        const qualified  = await pool.query("SELECT COUNT(*) FROM leads WHERE status='QUALIFIED'");
        const contacted  = await pool.query("SELECT COUNT(*) FROM leads WHERE status='CONTACTED'");
        const newLeads   = await pool.query("SELECT COUNT(*) FROM leads WHERE status='NEW'");
        const followups  = await pool.query("SELECT COUNT(*) FROM lead_activity_logs WHERE activity_type = 'FOLLOWUP_SENT'");
        const emails     = await pool.query("SELECT COUNT(*) FROM lead_activity_logs WHERE activity_type = 'EMAIL_SENT'");
        res.json({
            success: true,
            data: {
                total_leads: +totalLeads.rows[0].count,
                qualified:   +qualified.rows[0].count,
                contacted:   +contacted.rows[0].count,
                new_leads:   +newLeads.rows[0].count,
                followups_done: +followups.rows[0].count,
                emails_sent: +emails.rows[0].count,
            }
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/manager/leads', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const { status } = req.query;
    try {
        let query = 'SELECT * FROM leads';
        let params = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/manager/emails', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const sent   = await pool.query("SELECT * FROM lead_activity_logs WHERE activity_type = 'EMAIL_SENT' ORDER BY created_at DESC");
        const weekly = await pool.query("SELECT COUNT(*) FROM lead_activity_logs WHERE activity_type = 'EMAIL_SENT' AND created_at >= NOW() - INTERVAL '7 days'");
        const overdue = await pool.query("SELECT COUNT(*) FROM lead_followups WHERE followup_status = 'pending' AND due_date < CURRENT_DATE");
        res.json({ success: true, data: { sent: sent.rows, sentThisWeek: weekly.rows[0].count, overdue: overdue.rows[0].count } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/manager/export/leads', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query('SELECT lead_id, name, company, title, email, phone_number, status, created_at FROM leads ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/manager/activity', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT la.activity_id, la.activity_type, la.activity_description, la.created_at, l.name AS lead_name, l.company
            FROM lead_activity_logs la LEFT JOIN leads l ON la.lead_id = l.lead_id
            ORDER BY la.created_at DESC LIMIT 100
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────
app.get('/admin/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, full_name, email, role, team_id, is_active, created_at FROM users ORDER BY user_id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/admin/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { full_name, email, password, role, team_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (full_name, email, password_hash, role, team_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
        [full_name, email, hashedPassword, role, team_id]
    );
    res.status(201).json({ success: true, user_id: result.rows[0].user_id });
});

app.put('/admin/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { full_name, email, role, team_id, is_active } = req.body;
    try {
        await pool.query('UPDATE users SET full_name=$1, email=$2, role=$3, team_id=$4, is_active=$5 WHERE user_id=$6', [full_name, email, role, team_id, is_active, req.params.id]);
        res.json({ success: true, message: 'User updated' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/admin/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE user_id=$1', [req.params.id]);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/admin/teams', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams ORDER BY team_id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/admin/teams', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { team_name, territory, description } = req.body;
    try {
        await pool.query('INSERT INTO teams (team_name, territory, description) VALUES ($1, $2, $3)', [team_name, territory, description]);
        res.json({ success: true, message: 'Team created' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/admin/teams/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { team_name, territory, description } = req.body;
    try {
        await pool.query('UPDATE teams SET team_name=$1, territory=$2, description=$3 WHERE team_id=$4', [team_name, territory, description, req.params.id]);
        res.json({ success: true, message: 'Team updated' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/admin/teams/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM teams WHERE team_id=$1', [req.params.id]);
        res.json({ success: true, message: 'Team deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/admin/activitylogs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sa.activity_id, sa.action, sa.entity_type, sa.entity_id, sa.description, sa.created_at, u.full_name AS user_name, u.email
            FROM system_activity_logs sa LEFT JOIN users u ON sa.user_id = u.user_id
            ORDER BY sa.created_at DESC LIMIT 200
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/admin/users/:id/permissions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { permissions } = req.body;
        const result = await pool.query(
            'UPDATE users SET permissions = $1::jsonb WHERE user_id = $2 RETURNING user_id, permissions',
            [JSON.stringify(permissions), req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ success: true, message: 'Permissions updated', data: result.rows[0] });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GEMINI AI ANALYSIS ────────────────────────────────────────────────────────
app.post('/analyze-lead/:id', async (req, res) => {
    try {
        const leadResult = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [req.params.id]);
        if (leadResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

        const lead = leadResult.rows[0];

        const interestsResult = await pool.query(
            `SELECT ic.category_name FROM lead_interest_categories lic
             JOIN interest_categories ic ON lic.category_id = ic.category_id
             WHERE lic.lead_id = $1`,
            [lead.lead_id]
        );
        const interests = interestsResult.rows.map(r => r.category_name).join(', ') || 'Not specified';

        // Build full interest string — includes any "Others" text not in categories
        const allInterests = [
            interests !== 'Not specified' ? interests : '',
            lead.customer_intent?.includes('Others:') ? lead.customer_intent.split('Others:')[1]?.trim() : '',
        ].filter(Boolean).join(', ') || 'Not specified';

        // ── Also resolve/confirm team assignment during AI analysis ──────────
        if (!lead.assigned_team_id) {
            const resolvedTeam = resolveTeamId(null, interests.split(', '));
            await pool.query('UPDATE leads SET assigned_team_id=$1 WHERE lead_id=$2', [resolvedTeam, lead.lead_id]);
            lead.assigned_team_id = resolvedTeam;
            console.log(`🔧 Fixed missing team assignment: lead ${lead.lead_id} → team ${resolvedTeam}`);
        }

        // lead.ai_notes at this point = rep's additional notes (saved on creation)
        // After analysis it will be overwritten with AI-generated notes
        const repNotes = lead.ai_notes || null;

        const prompt = `
You are a sales analyst for Dell Technologies at a booth event.
Analyze this lead and determine their purchase intent and best follow-up action.

Lead Details:
- Name: ${lead.name}
- Company: ${lead.company}
- Title: ${lead.title}
- Customer Intent: ${lead.customer_intent || 'Not specified'}
- Primary Interests: ${interests}
${allInterests !== interests && allInterests !== 'Not specified' ? `- Other Interests Mentioned: ${allInterests}` : ''}
${repNotes ? `- Rep's Additional Notes: ${repNotes}` : ''}

Use ALL of the above — especially the rep's notes and any other interests — to give a personalised follow-up suggestion.

Return ONLY valid JSON in this exact format, no extra text:
{
  "intent": "Low" or "Medium" or "High",
  "confidence": a number between 0 and 1,
  "follow_up_required": true or false,
  "notes": "a short 1-2 sentence personalised follow-up suggestion referencing their specific interests and notes"
}
`;

        let aiData;
        let usedFallback = false;

        try {
            const result   = await model.generateContent(prompt);
            const response = result.response.text().replace(/```json|```/g, '').trim();
            aiData = JSON.parse(response);
            const validIntents = ['Low', 'Medium', 'High'];
            if (!validIntents.includes(aiData.intent) || typeof aiData.confidence !== 'number' || typeof aiData.follow_up_required !== 'boolean') {
                throw new Error('Invalid AI response format');
            }
            console.log('✅ Gemini AI analysis successful');
        } catch (aiError) {
            console.warn('⚠️ Gemini failed, using rule-based fallback:', aiError.message);
            const fallback = generateRuleBasedAnalysis(lead.customer_intent, interests);
            aiData = { intent: fallback.intent, confidence: fallback.confidence, follow_up_required: fallback.follow_up_required, notes: fallback.notes };
            usedFallback = true;
        }

        let status = 'NEW';
        if (aiData.intent === 'High') {
            status = (aiData.confidence >= 0.8 && aiData.follow_up_required) ? 'QUALIFIED' : 'CONTACTED';
        } else if (aiData.intent === 'Medium' && aiData.follow_up_required) {
            status = 'CONTACTED';
        }

        const statusDisplay = { 'QUALIFIED': 'Ready for Follow-up', 'CONTACTED': 'Review for Follow-up', 'NEW': 'No Follow-up Needed' };

        await pool.query(
            'UPDATE leads SET ai_notes=$1, status=$2, confidence_score=$3, follow_up_required=$4 WHERE lead_id=$5',
            [aiData.notes || null, status, aiData.confidence, aiData.follow_up_required, parseInt(lead.lead_id)]
        );

        res.json({
            success: true,
            lead,
            used_fallback: usedFallback,
            ai_analysis: {
                intent:             aiData.intent,
                confidence:         aiData.confidence,
                follow_up_required: aiData.follow_up_required,
                follow_up_status:   statusDisplay[status],
                notes:              aiData.notes,
                assigned_team_id:   lead.assigned_team_id,
            }
        });

    } catch (error) {
        console.error('AI analysis error:', error);
        res.status(500).json({ success: false, message: 'AI analysis failed' });
    }
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Supabase connected:', result.rows[0].now);
    } catch (err) {
        console.log('❌ DB check failed:', err.message);
    }
});