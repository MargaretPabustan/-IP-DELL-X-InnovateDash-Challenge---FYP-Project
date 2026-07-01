// ── IMPORTS ─────────────────────────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const RateLimit = require('express-rate-limit');
const cron = require('node-cron');

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
app.use(helmet());
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('CORS origin denied'));
    },
    credentials: true,
}));

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
const generalLimiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(generalLimiter);
app.use('/auth', authLimiter);

// ── REQUEST LOGGER ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    const requestData = JSON.stringify(safeBody || {}).substring(0, 200);
    console.log('📥', req.method, req.path, requestData);
    next();
});

if (process.env.NODE_ENV !== 'production') {
    app.post('/debug-bcrypt', async (req, res) => {
        const { password, hash } = req.body;
        const result = await bcrypt.compare(password, hash);
        res.json({ result });
    });
}

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
const sslOptions = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslOptions,
});
pool.connect()
    .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
    .catch(err => console.error('❌ DB connection error:', err));

// ── GEMINI SETUP ──────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
if (!process.env.GEMINI_API_KEY) {
    console.warn('❌ GEMINI_API_KEY is missing from environment configuration');
}

// ── EMAIL TRANSPORTER ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ── PERSONALISED EMAIL BUILDER ────────────────────────────────────────────────
function buildFollowUpEmail(lead, aiData, interests) {
    let body = `Hi ${lead.name},\n\n`;

    if (aiData.intent === 'High' || lead.status === 'QUALIFIED') {
        body += `We noticed your strong interest in ${interests}. ${aiData.notes}\n\n`;
        body += `We'd love to schedule a call with you this week to discuss Dell solutions in detail. Please reply to this email or contact your assigned Dell representative to arrange a time.\n`;
    } else if (aiData.intent === 'Medium' || lead.status === 'CONTACTED') {
        if (lead.customer_intent?.toLowerCase().includes('pricing')) {
            body += `You mentioned pricing for ${interests}. ${aiData.notes}\n\n`;
            body += `We'll send you tailored pricing information shortly. In the meantime, feel free to reply if you'd like to arrange a personalised demo.\n`;
        } else if (lead.customer_intent?.toLowerCase().includes('demo')) {
            body += `You expressed interest in a demo for ${interests}. ${aiData.notes}\n\n`;
            body += `We'd be happy to schedule a demonstration session at your convenience. Please reply to this email to confirm a time.\n`;
        } else {
            body += `${aiData.notes}\n\n`;
            body += `We'll follow up with more details on ${interests} soon. Feel free to reach out if you have any questions in the meantime.\n`;
        }
    } else {
        body += `We're glad you stopped by to explore ${interests}. ${aiData.notes}\n\n`;
        body += `Here are some resources you may find useful — no pressure, just insights into how Dell can support your organisation's technology needs.\n`;
    }

    body += `\n📢 Don't miss our upcoming webinar on June 25th at 3:00 PM (SGT), where we'll showcase solutions related to your interests.\n`;
    body += `\nBest regards,\nDell Boothflow Team`;

    return body;
}

// ── INTEREST → TEAM MAPPING ───────────────────────────────────────────────────
const INTEREST_TEAM_MAP = {
    'AI PCs':      1,
    'Multi-cloud': 2,
    'Storage':     3,
    'Service':     4,
};
const OTHERS_TEAM_ID = 5;

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
    if (typeof email !== 'string' || email.length > 254) return 'Invalid email format';
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    if (atIndex <= 0 || dotIndex <= atIndex + 1 || dotIndex === email.length - 1 || email.includes(' ')) {
        return 'Invalid email format';
    }
    if (typeof phone !== 'string' || phone.length < 8 || phone.length > 25) return 'Phone number is invalid';
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
            'GET /export/leads/excel',
            'POST /send-followup/:id',
        ]
    });
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("🔐 Login attempt");
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
        console.log('✅ Login successful for user_id:', user.user_id, 'role:', user.role);
        res.json({ token, role: user.role });
    } catch (err) {
        console.error('❌ Login error:', err.message);
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
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/leads', async (req, res) => {
    const { name, email, company, title, phone_number, customer_intent, assigned_team_id, primary_interest, selected_interests, additional_notes, scanned_by, scanned_by_name } = req.body;
    const error = validateLead(name, email, company, title, phone_number);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const existing = await pool.query('SELECT lead_id FROM leads WHERE email = $1', [email]);
        if (existing.rows.length > 0) return res.status(409).json({ success: false, code: 'DUPLICATE_EMAIL', message: 'A lead with this email already exists' });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
    let teamId = assigned_team_id;
    if (!teamId) {
        const interestsList = Array.isArray(selected_interests) ? selected_interests : [];
        teamId = resolveTeamId(primary_interest, interestsList);
    }
    try {
        const result = await pool.query(
            `INSERT INTO leads (name, email, company, title, phone_number, customer_intent, assigned_team_id, ai_notes, scanned_by, scanned_by_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING lead_id`,
            [name, email, company, title, phone_number, customer_intent || null, teamId, additional_notes || null, scanned_by || null, scanned_by_name || null]
        );
        res.status(201).json({ success: true, message: 'Lead created successfully', lead_id: result.rows[0].lead_id, assigned_team_id: teamId });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM leads WHERE lead_id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── INTEREST CATEGORIES ───────────────────────────────────────────────────────
app.get('/interest_categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM interest_categories');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/lead_interest_categories/:lead_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ic.category_id, ic.category_name FROM lead_interest_categories lic
             JOIN interest_categories ic ON lic.category_id = ic.category_id WHERE lic.lead_id = $1`,
            [req.params.lead_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/lead_interest_categories', async (req, res) => {
    const lead_id = parseInt(req.body.lead_id);
    const category_id = parseInt(req.body.category_id);
    if (!lead_id || !category_id) return res.status(400).json({ success: false, message: 'lead_id and category_id required' });
    try {
        await pool.query('INSERT INTO lead_interest_categories (lead_id, category_id) VALUES ($1, $2)', [lead_id, category_id]);
        res.status(201).json({ success: true, message: 'Interest added' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/lead_interest_categories/:lead_id/:category_id', async (req, res) => {
    try {
        await pool.query('DELETE FROM lead_interest_categories WHERE lead_id=$1 AND category_id=$2', [req.params.lead_id, req.params.category_id]);
        res.json({ success: true, message: 'Interest removed' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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

// ── MANAGER ME ────────────────────────────────────────────────────────────────
app.get('/manager/me', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, full_name, email, role, team_id FROM users WHERE user_id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── MANAGER ROUTES ────────────────────────────────────────────────────────────
app.get('/manager/dashboard', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const teamId = req.user.team_id;
        const totalLeads = await pool.query('SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1', [teamId]);
        const qualified  = await pool.query("SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1 AND status='QUALIFIED'", [teamId]);
        const contacted  = await pool.query("SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1 AND status='CONTACTED'", [teamId]);
        const newLeads   = await pool.query("SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1 AND status='NEW'", [teamId]);
        const followups  = await pool.query("SELECT COUNT(*) FROM lead_activity_logs WHERE activity_type = 'FOLLOWUP_SENT'");
        const emails     = await pool.query("SELECT COUNT(*) FROM lead_activity_logs WHERE activity_type = 'EMAIL_SENT'");
        res.json({
            success: true,
            data: {
                total_leads:    +totalLeads.rows[0].count,
                qualified:      +qualified.rows[0].count,
                contacted:      +contacted.rows[0].count,
                new_leads:      +newLeads.rows[0].count,
                followups_done: +followups.rows[0].count,
                emails_sent:    +emails.rows[0].count,
            }
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/manager/leads', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const { status } = req.query;
    try {
        const teamId = req.user.team_id;
        let query = `
            SELECT leads.*, COALESCE(lf.followup_status, 'pending') AS followup_status
            FROM leads LEFT JOIN lead_followups lf ON leads.lead_id = lf.lead_id
            WHERE assigned_team_id = $1
        `;
        const params = [teamId];
        if (status && status !== 'ALL') { params.push(status); query += ` AND leads.status = $${params.length}`; }
        query += ' ORDER BY leads.created_at DESC';
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/manager/emails', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const sent    = await pool.query("SELECT * FROM lead_activity_logs WHERE activity_type = 'EMAIL_SENT' ORDER BY created_at DESC");
        const weekly  = await pool.query("SELECT COUNT(*) FROM lead_activity_logs WHERE activity_type = 'EMAIL_SENT' AND created_at >= NOW() - INTERVAL '7 days'");
        const overdue = await pool.query("SELECT COUNT(*) FROM lead_followups WHERE followup_status = 'pending' AND due_date < CURRENT_DATE");
        
        res.json({ 
            success: true, 
            data: { 
                sent: sent.rows, 
                sentThisWeek: parseInt(weekly.rows[0].count, 10), 
                overdue: parseInt(overdue.rows[0].count, 10) 
            } 
        });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

app.get('/manager/export/leads', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const teamId = req.user.team_id;
        const result = await pool.query('SELECT lead_id, name, company, title, email, phone_number, status, created_at FROM leads WHERE assigned_team_id = $1 ORDER BY created_at DESC', [teamId]);
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/export/leads/excel', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leads');
        worksheet.columns = [
            { header: 'Lead ID',    key: 'lead_id',      width: 10 },
            { header: 'Name',       key: 'name',          width: 20 },
            { header: 'Company',    key: 'company',       width: 20 },
            { header: 'Title',      key: 'title',         width: 20 },
            { header: 'Email',      key: 'email',         width: 25 },
            { header: 'Phone',      key: 'phone_number',  width: 15 },
            { header: 'Status',     key: 'status',        width: 15 },
            { header: 'Created At', key: 'created_at',    width: 20 },
        ];
        result.rows.forEach(row => worksheet.addRow(row));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
// 1. GET ACTIVITY LOGS WITH LINKED ACTIVE FOLLOW-UP TRACKING
// 1. GET ACTIVITY LOGS WITH LINKED FOLLOW-UP TRACKING
app.get('/manager/activity', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { role, team_id } = req.user; 
        
        let query = `
            SELECT 
                la.activity_id, 
                la.activity_type, 
                la.activity_description, 
                la.created_at, 
                la.lead_id, -- Crucial for tracking the cancellation target
                l.name AS lead_name, 
                l.company,
                f.followup_id,
                f.followup_status
            FROM lead_activity_logs la 
            LEFT JOIN leads l ON la.lead_id = l.lead_id
            LEFT JOIN lead_followups f ON l.lead_id = f.lead_id
        `;
        
        const queryParams = [];

        if (role === 'manager') {
            query += ` WHERE l.assigned_team_id = $1 `;
            queryParams.push(team_id);
        }

        query += ` ORDER BY la.created_at DESC LIMIT 100 `;

        const result = await pool.query(query, queryParams);
        res.json({ success: true, data: result.rows });
        
    } catch (err) { 
        console.error("Error fetching activity logs:", err);
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// 2. CANCEL FOLLOW-UP VIA TARGET SELECTION
app.post('/manager/followup/cancel', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const { followup_id, lead_id } = req.body;
    
    try {
        await pool.query('BEGIN');

        if (followup_id) {
            await pool.query(`UPDATE lead_followups SET followup_status = 'cancelled', updated_at = NOW() WHERE followup_id = $1`, [followup_id]);
        } else if (lead_id) {
            await pool.query(`UPDATE lead_followups SET followup_status = 'cancelled', updated_at = NOW() WHERE lead_id = $1`, [lead_id]);
        } else {
            await pool.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }

        await pool.query('COMMIT');
        res.json({ success: true, message: 'Followup cancelled successfully.' });
    } catch (err) { 
        await pool.query('ROLLBACK');
        console.error("Error updating database followup entry:", err);
        res.status(500).json({ success: false, message: err.message }); 
    }
});
app.put('/manager/followup/:leadId', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const { followup_status } = req.body;
    try {
        await pool.query(`
            INSERT INTO lead_followups (lead_id, followup_status, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (lead_id) DO UPDATE SET followup_status = EXCLUDED.followup_status, updated_at = NOW()
        `, [req.params.leadId, followup_status]);
        res.json({ success: true, message: 'Follow-up updated' });
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

app.get('/admin/dashboard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
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
                total_leads:    +totalLeads.rows[0].count,
                qualified:      +qualified.rows[0].count,
                contacted:      +contacted.rows[0].count,
                new_leads:      +newLeads.rows[0].count,
                followups_done: +followups.rows[0].count,
                emails_sent:    +emails.rows[0].count,
            }
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/admin/leads', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/admin/leads/:id/assign', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { assigned_team_id } = req.body;
    try {
        await pool.query('UPDATE leads SET assigned_team_id=$1 WHERE lead_id=$2', [assigned_team_id || null, req.params.id]);
        res.json({ success: true, message: 'Lead team updated' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/admin/leads/:id/notes', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { ai_notes, status } = req.body;
    try {
        await pool.query(
            'UPDATE leads SET ai_notes=$1, status=COALESCE($2, status) WHERE lead_id=$3',
            [ai_notes || null, status || null, req.params.id]
        );
        res.json({ success: true, message: 'Lead notes and status updated' });
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
             JOIN interest_categories ic ON lic.category_id = ic.category_id WHERE lic.lead_id = $1`,
            [lead.lead_id]
        );
        const interests = interestsResult.rows.map(r => r.category_name).join(', ') || 'Not specified';
        const othersInterestText = lead.customer_intent?.includes('Others:') ? lead.customer_intent.split('Others:')[1]?.trim() : null;
        const allInterests = [interests !== 'Not specified' ? interests : '', othersInterestText || ''].filter(Boolean).join(', ') || 'Not specified';

        if (!lead.assigned_team_id) {
            const resolvedTeam = resolveTeamId(null, interests.split(', '));
            await pool.query('UPDATE leads SET assigned_team_id=$1 WHERE lead_id=$2', [resolvedTeam, lead.lead_id]);
            lead.assigned_team_id = resolvedTeam;
        }

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

Return ONLY valid JSON in this exact format, no extra text:
{
  "intent": "Low" or "Medium" or "High",
  "confidence": a number between 0 and 1,
  "follow_up_required": true or false,
  "notes": "a short 1-2 sentence personalised follow-up suggestion referencing their specific interests"
}
`;

        let aiData;
        let usedFallback = false;
        try {
            const result   = await model.generateContent(prompt);
            let response = result.response.text().trim();
            const codeFence = '```json';
            if (response.startsWith(codeFence)) {
                response = response.slice(codeFence.length).trim();
            }
            if (response.startsWith('```')) {
                response = response.slice(3).trim();
            }
            if (response.endsWith('```')) {
                response = response.slice(0, -3).trim();
            }
            aiData = JSON.parse(response);
            const validIntents = ['Low', 'Medium', 'High'];
            if (!validIntents.includes(aiData.intent) || typeof aiData.confidence !== 'number' || typeof aiData.follow_up_required !== 'boolean') throw new Error('Invalid AI response format');
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

        lead.status = status;

        // ── Schedule follow-up email via DB (cron will pick up) ───────────────
        try {
            await pool.query(
                `INSERT INTO lead_followups (lead_id, followup_action, followup_status, due_date, scheduled_at, email_subject, notes)
                 VALUES ($1, 'Automated Follow-up Email', 'pending', NOW() + INTERVAL '24 hours', NOW() + INTERVAL '24 hours', $2, $3)
                 ON CONFLICT (lead_id) DO NOTHING`,
                [lead.lead_id, `Your Dell Technologies Follow-up — ${interests}`, buildFollowUpEmail(lead, aiData, interests)]
            );
            console.log(`📅 Follow-up email scheduled for lead ${lead.lead_id} in 24h`);
        } catch (scheduleErr) {
            console.error('⚠️ Could not schedule follow-up email:', scheduleErr.message);
        }

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

// ── MANUAL FOLLOW-UP EMAIL ROUTE ──────────────────────────────────────────────
app.post('/send-followup/:id', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    try {
        const { followupDate } = req.body || {};

        const leadResult = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [req.params.id]);
        if (leadResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

        const lead = leadResult.rows[0];
        const aiData = {
            intent: lead.status === 'QUALIFIED' ? 'High' : lead.status === 'CONTACTED' ? 'Medium' : 'Low',
            notes:  lead.ai_notes || lead.AI_notes || 'Thank you for visiting our booth.',
        };
        const interests = lead.customer_intent || 'Dell Technologies solutions';
        const emailSubject = 'Your Dell Technologies Follow-up';

        const scheduledAt = followupDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const existing = await pool.query(
            `SELECT followup_status FROM lead_followups WHERE lead_id = $1`,
            [lead.lead_id]
        );
        if (existing.rows.length > 0 && existing.rows[0].followup_status === 'done') {
            return res.status(409).json({ success: false, message: 'Follow-up already completed for this lead.' });
        }

        const isUpdating = existing.rows.length > 0 && existing.rows[0].followup_status === 'pending';

        const followup = await pool.query(
            `INSERT INTO lead_followups (lead_id, followup_action, followup_status, due_date, scheduled_at, email_subject, notes)
             VALUES ($1, 'Manual Follow-up Email', 'pending', $2, $3, $4, $5)
             ON CONFLICT (lead_id) DO UPDATE SET
               followup_action = 'Manual Follow-up Email',
               followup_status = 'pending',
               due_date = EXCLUDED.due_date,
               scheduled_at = EXCLUDED.scheduled_at,
               email_subject = EXCLUDED.email_subject,
               notes = EXCLUDED.notes
             RETURNING followup_id`,
            [lead.lead_id, scheduledAt.split('T')[0], scheduledAt, emailSubject, buildFollowUpEmail(lead, aiData, interests)]
        );

        const logDescription = isUpdating 
            ? `Manager updated/rescheduled follow-up email for ${scheduledAt}`
            : `Manager scheduled follow-up email for ${scheduledAt}`;

        await pool.query(
            `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description) VALUES ($1, 'FOLLOWUP_SCHEDULED', $2)`,
            [lead.lead_id, logDescription]
        );

        res.json({ 
            success: true, 
            message: `Follow-up successfully scheduled for ${new Date(scheduledAt).toLocaleString()}`, 
            followup_id: followup.rows[0].followup_id 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── CRON JOB — runs every minute, sends pending emails ───────────────────────
// Queue Runner checking conditions every minute
cron.schedule('* * * * *', async () => {
    try {
        const followups = await pool.query(`
            SELECT * FROM lead_followups WHERE followup_status = 'pending' AND scheduled_at <= NOW()
        `);
        for (const followup of followups.rows) {
            const leadResult = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [followup.lead_id]);
            if (leadResult.rows.length === 0) continue;
            const lead = leadResult.rows[0];
            try {
                // Execute delivery request
                const info = await transporter.sendMail({
                    from:    `"Boothflow" <${process.env.EMAIL_USER}>`,
                    to:      lead.email,
                    subject: followup.email_subject,
                    text:    followup.notes
                });
                
                // Verify recipient address was accepted by server provider rules
                if (info.rejected && info.rejected.length > 0) {
                     await pool.query(`UPDATE lead_followups SET followup_status='cancelled', notes='Delivery bounced or rejected' WHERE followup_id=$1`, [followup.followup_id]);
                     console.log(`❌ Server rejected destination address: ${lead.email}`);
                     continue;
                }

                await pool.query(`UPDATE lead_followups SET followup_status='done', sent_at=NOW() WHERE followup_id=$1`, [followup.followup_id]);
                
                await pool.query(
                    `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description) VALUES ($1, 'EMAIL_SENT', 'Scheduled follow-up email sent via cron')`,
                    [lead.lead_id]
                );
                console.log(`✅ Cron confirmed delivery to ${lead.email}`);
            } catch (emailErr) {
                console.error(`❌ Connection failed for ${lead.email}:`, emailErr.message);
            }
        }
    } catch (err) {
        console.error('❌ Queue execution error:', err.message);
    }
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err.message);
    res.status(500).json({ success: false, message: err.message });
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