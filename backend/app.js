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
const RateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { Resend } = require('resend');

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
app.use(helmet());
app.set('trust proxy', 1);
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

// ── SEND EMAIL (Resend — lazy init) ──────────────────────────────────────────
async function sendEmail({ to, subject, text, html }) {
    console.log(`📧 sendEmail called — to: ${to}`);
    console.log(`📧 RESEND_API_KEY set: ${!!process.env.RESEND_API_KEY}`);
    console.log(`📧 RESEND_FROM_EMAIL set: ${!!process.env.RESEND_FROM_EMAIL} (${process.env.RESEND_FROM_EMAIL || 'NOT SET'})`);

    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    if (!process.env.RESEND_FROM_EMAIL) throw new Error('RESEND_FROM_EMAIL is not set');

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const payload = {
            from: `Boothflow <${process.env.RESEND_FROM_EMAIL}>`,
            to,
            subject,
            text,
        };
        if (html) payload.html = html;
        console.log(`📧 Sending with HTML: ${!!html}`);
        const result = await resend.emails.send(payload);
        console.log(`✅ Email sent to ${to} via Resend, id: ${result?.data?.id || 'N/A'}`);
        if (result.error) throw new Error(result.error.message);
        return result;
    } catch (err) {
        console.error(`❌ Resend error:`, err.message);
        throw err;
    }
}

// ── PERSONALISED EMAIL BUILDER ────────────────────────────────────────────────
function buildFollowUpEmailHtml(lead, aiData, interests) {
    let mainContent = '';

    if (aiData.intent === 'High' || lead.status === 'URGENT') {
        mainContent += `<p>We noticed your strong interest in <strong>${interests}</strong>. ${aiData.notes}</p>`;
        mainContent += `<p>Given your enthusiasm, we'd love to schedule a personalised call this week to walk you through how Dell's ${interests} solutions can address your organisation's specific needs.</p>`;
        mainContent += `<ul>
            <li>A tailored product demonstration of ${interests}</li>
            <li>Detailed pricing and deployment options</li>
            <li>A dedicated Dell solutions consultant for your account</li>
        </ul>`;
    } else if (aiData.intent === 'Medium' || lead.status === 'FOLLOW-UP') {
        if (lead.customer_intent?.toLowerCase().includes('pricing')) {
            mainContent += `<p>You mentioned interest in pricing for <strong>${interests}</strong>. ${aiData.notes}</p>`;
            mainContent += `<p>We'll be sending you a tailored pricing proposal shortly. Feel free to reply if you'd like to arrange a personalised demo.</p>`;
        } else if (lead.customer_intent?.toLowerCase().includes('demo')) {
            mainContent += `<p>You expressed interest in a demonstration for <strong>${interests}</strong>. ${aiData.notes}</p>`;
            mainContent += `<p>We'd be happy to schedule a demo session at your convenience. Please reply to confirm a suitable time.</p>`;
        } else {
            mainContent += `<p>${aiData.notes}</p>`;
            mainContent += `<p>We'll follow up with tailored information on <strong>${interests}</strong> soon.</p>`;
        }
    } else {
        mainContent += `<p>We're glad you stopped by to explore <strong>${interests}</strong>. ${aiData.notes}</p>`;
        mainContent += `<p>We'd love to share more about how Dell's solutions can support your organisation's technology journey.</p>`;
    }

    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- HEADER -->
        <tr>
          <td style="background:#0076CE;padding:24px 32px;text-align:center;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg" alt="Dell Technologies" width="80" style="display:block;margin:0 auto 8px auto;" />
            <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;letter-spacing:1px;">DELL TECHNOLOGIES FORUM SINGAPORE</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px;">
            <p style="font-size:16px;color:#333;margin-top:0;">Hi <strong>${lead.name}</strong>,</p>
            <p style="color:#555;line-height:1.6;">Thank you for visiting the Dell Technologies booth at the Dell Technologies Forum Singapore. It was great connecting with you!</p>
            <div style="color:#555;line-height:1.8;">${mainContent}</div>

            <!-- WEBINAR BOX -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="background:#f0f7ff;border-left:4px solid #0076CE;border-radius:4px;padding:20px 24px;">
                  <p style="color:#0076CE;font-weight:bold;font-size:14px;margin:0 0 10px 0;">📅 UPCOMING WEBINAR</p>
                  <p style="color:#333;margin:4px 0;font-size:14px;">🖥️ <strong>Dell Technologies Innovation Series</strong></p>
                  <p style="color:#333;margin:4px 0;font-size:14px;">📆 <strong>31 July 2026 | 3:00 PM SGT</strong></p>
                  <p style="color:#333;margin:4px 0;font-size:14px;">🌐 Online — Reply to register your interest</p>
                  <p style="color:#555;margin:12px 0 0 0;font-size:13px;">We'll be showcasing the latest in <strong>${interests}</strong> and other Dell innovations.</p>
                </td>
              </tr>
            </table>

            <p style="color:#555;line-height:1.6;">Please reply to this email or contact your assigned Dell representative to arrange a follow-up session.</p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="color:#888;font-size:12px;margin:0;">Best regards,</p>
            <p style="color:#333;font-size:13px;font-weight:bold;margin:4px 0;">Dell Technologies Forum Team</p>
            <p style="color:#888;font-size:12px;margin:4px 0;">Dell Technologies Singapore</p>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg" alt="Dell" width="40" style="margin-top:12px;opacity:0.4;" />
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── PLAIN TEXT EMAIL BUILDER ──────────────────────────────────────────────────
function buildFollowUpEmail(lead, aiData, interests) {
    let body = `Hi ${lead.name},\n\n`;
    body += `Thank you for visiting the Dell Technologies booth at the Dell Technologies Forum Singapore. It was great connecting with you!\n\n`;

    if (aiData.intent === 'High' || lead.status === 'URGENT') {
        body += `We noticed your strong interest in ${interests}. ${aiData.notes}\n\n`;
        body += `Given your enthusiasm, we'd love to schedule a personalised call this week to walk you through how Dell's ${interests} solutions can address your organisation's specific needs. Please reply to this email or reach out to your assigned Dell representative to arrange a time.\n\n`;
        body += `In the meantime, here's what we can offer:\n`;
        body += `  • A tailored product demonstration of ${interests}\n`;
        body += `  • Detailed pricing and deployment options\n`;
        body += `  • A dedicated Dell solutions consultant for your account\n`;
    } else if (aiData.intent === 'Medium' || lead.status === 'FOLLOW-UP') {
        if (lead.customer_intent?.toLowerCase().includes('pricing')) {
            body += `You mentioned interest in pricing for ${interests}. ${aiData.notes}\n\n`;
            body += `We'll be sending you a tailored pricing proposal shortly. In the meantime, feel free to reply if you'd like to arrange a personalised demo or speak to one of our solutions consultants.\n\n`;
        } else if (lead.customer_intent?.toLowerCase().includes('demo')) {
            body += `You expressed interest in a demonstration for ${interests}. ${aiData.notes}\n\n`;
            body += `We'd be happy to schedule a demo session at your convenience. Our team will walk you through the full capabilities of Dell's ${interests} portfolio. Please reply to confirm a suitable time.\n\n`;
        } else {
            body += `${aiData.notes}\n\n`;
            body += `We'll follow up with tailored information on ${interests} soon. In the meantime, feel free to reach out if you have any questions.\n\n`;
        }
    } else {
        body += `We're glad you stopped by to explore ${interests}. ${aiData.notes}\n\n`;
        body += `We'd love to share more about how Dell's solutions in ${interests} can support your organisation's technology journey. No pressure — just valuable insights tailored to your needs.\n\n`;
    }

    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    body += `📅 UPCOMING EVENT\n`;
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    body += `Don't miss our upcoming webinar:\n\n`;
    body += `  🖥️  Dell Technologies Innovation Series\n`;
    body += `  📆  31 July 2026 | 3:00 PM SGT\n`;
    body += `  🌐  Online — Register to receive your link\n\n`;
    body += `We'll be showcasing the latest in ${interests} and other Dell innovations. Reply to this email to register your interest.\n\n`;
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    body += `Best regards,\n`;
    body += `Dell Technologies Forum Team\n`;
    body += `Dell Technologies Singapore\n`;
    body += `forum.dell.com/singapore`;

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
        intent = 'High'; confidence = 0.85; follow_up_required = true; status = 'URGENT';
        notes = `High intent lead interested in ${interests}. Recommend immediate follow-up to discuss ${interests} solutions and schedule a product demonstration.`;
    } else if (intentLower.includes('medium') || intentLower.includes('pricing') || intentLower.includes('demo')) {
        intent = 'Medium'; confidence = 0.65; follow_up_required = true; status = 'FOLLOW-UP';
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

    const statusDisplay = { 'URGENT': 'Ready for Follow-up', 'FOLLOW-UP': 'Review for Follow-up', 'NEW': 'No Follow-up Needed' };
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
        if (!user.is_active) return res.status(403).json({ message: 'Your account has been deactivated. Please contact your administrator.' });
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
        // Cancel any pending followups first to stop cron from retrying
        await pool.query(
            `UPDATE lead_followups SET followup_status = 'cancelled' WHERE lead_id = $1 AND followup_status = 'pending'`,
            [req.params.id]
        );
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
        const qualified  = await pool.query("SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1 AND status='URGENT'", [teamId]);
        const contacted  = await pool.query("SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1 AND status='FOLLOW-UP'", [teamId]);
        const newLeads   = await pool.query("SELECT COUNT(*) FROM leads WHERE assigned_team_id = $1 AND status='NEW'", [teamId]);
        const followups  = await pool.query(`
            SELECT COUNT(*) FROM lead_activity_logs la
            JOIN leads l ON la.lead_id = l.lead_id
            WHERE l.assigned_team_id = $1 AND la.activity_type = 'FOLLOWUP_SENT'
        `, [teamId]);
        const emails = await pool.query(`
            SELECT COUNT(*) FROM lead_activity_logs la
            JOIN leads l ON la.lead_id = l.lead_id
            WHERE l.assigned_team_id = $1 AND la.activity_type = 'EMAIL_SENT'
        `, [teamId]);
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

app.get('/manager/leads', authenticateToken, async (req, res) => {
    try {
        // 1. Extract the manager's team_id from the authenticated token payload
        // Adjust req.user.team_id to match your token's exact structure if necessary
        const managerTeamId = req.user?.team_id; 

        if (!managerTeamId) {
            return res.status(400).json({ success: false, message: 'Manager team context not found.' });
        }

        // 2. Add a WHERE clause to filter leads by the manager's assigned team id
        const queryText = `
            SELECT DISTINCT ON (l.lead_id)
                l.*,
                f.followup_status,
                f.followup_action,
                f.due_date
            FROM leads l
            LEFT JOIN lead_followups f ON l.lead_id = f.lead_id
            WHERE l.assigned_team_id = $1
            ORDER BY l.lead_id, f.updated_at DESC
        `;

        const result = await pool.query(queryText, [managerTeamId]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching leads:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
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
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
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
        // 1. Extract the manager's team ID from their decoded JWT token payload
        const teamId = req.user.team_id; 

        if (!teamId) {
            return res.status(400).json({ success: false, message: 'Manager is not assigned to any team.' });
        }

        // 2. Query matching your ERD column schema: 'assigned_team_id'
        const queryText = `
            SELECT 
                lead_id, name, company, title, email, phone_number, status, created_at 
            FROM leads 
            WHERE assigned_team_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(queryText, [teamId]);
        
        // 3. Initialize ExcelJS workbook instances
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Team Leads Export');
        
        // 4. Map columns precisely to your table schemas
        worksheet.columns = [
            { header: 'Lead ID',    key: 'lead_id',       width: 10 },
            { header: 'Name',       key: 'name',          width: 20 },
            { header: 'Company',    key: 'company',       width: 20 },
            { header: 'Title',      key: 'title',         width: 20 },
            { header: 'Email',      key: 'email',         width: 25 },
            { header: 'Phone',      key: 'phone_number',  width: 15 },
            { header: 'Status',     key: 'status',        width: 15 },
            { header: 'Created At', key: 'created_at',    width: 20 },
        ];
        
        // 5. Inject rows into the active worksheet layout context
        result.rows.forEach(row => worksheet.addRow(row));
        
        // 6. Set binary multi-purpose internet mail extension headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=team_leads.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) { 
        console.error('Excel export process runtime error: ', err);
        res.status(500).json({ success: false, message: 'Server compilation breakdown during document write engines.' }); 
    }
});

// --- GET ACTIVITY LOGS ROUTE ---
// =========================================================================
// GET ALL ACTIVITY LOGS (CLEAN JOIN - DEDUPLICATED)
// =========================================================================
// 1. GET ACTIVITY FEED: Fetch operational follow-ups ('pending' or 'done') for the manager's team
app.get('/manager/activity', authenticateToken, async (req, res) => {
    try {
        const managerTeamId = req.user?.team_id; 

        if (!managerTeamId) {
            return res.status(400).json({ success: false, message: 'Manager team context not found.' });
        }

        // Queries the single source of truth for follow-ups, filters by status and team
        const queryText = `
            SELECT 
                f.followup_id,
                f.lead_id,
                COALESCE(f.followup_action, 'Follow-up Pending') AS activity_type,
                f.followup_status,
                f.due_date,
                COALESCE(f.notes, 'No additional notes provided.') AS activity_description,
                f.created_at,
                f.updated_at,
                l.name AS lead_name,
                l.company AS company
            FROM lead_followups f
            INNER JOIN leads l ON f.lead_id = l.lead_id
            WHERE l.assigned_team_id = $1 
              AND f.followup_status IN ('pending', 'done')
            ORDER BY f.updated_at DESC, f.created_at DESC
        `;

        const result = await pool.query(queryText, [managerTeamId]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching manager activities:', err);
        res.status(500).json({ success: false, message: 'Internal server error processing activity logs.' });
    }
});

// 2. POST CANCEL FOLLOW-UP: Safely cancel a team follow-up loop cycle
app.post('/manager/followup/cancel', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const { followup_id, lead_id } = req.body;
    
    if (!followup_id && !lead_id) {
        return res.status(400).json({ success: false, message: 'Missing cancellation identity parameters.' });
    }

    try {
        await pool.query('BEGIN');
        let targetedLeadId = lead_id;

        if (followup_id && !targetedLeadId) {
            const leadLookUp = await pool.query(
                `SELECT lead_id FROM lead_followups WHERE followup_id = $1`,
                [followup_id]
            );
            if (leadLookUp.rowCount > 0) {
                targetedLeadId = leadLookUp.rows[0].lead_id;
            }
        }

        if (!targetedLeadId) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Could not resolve the associated lead for cancellation.' });
        }

        // Update the operational follow-up table to tracking cancellation status
        const updateResult = await pool.query(
            `UPDATE lead_followups 
             SET followup_status = 'cancelled', 
                 followup_action = 'Cancelled Follow-up',
                 updated_at = NOW() 
             WHERE lead_id = $1`,
            [targetedLeadId]
        );

        // Record a row history log point trace entry
        await pool.query(
            `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description, created_at)
             VALUES ($1, 'FOLLOWUP_CANCELLED', 'A manager cancelled an active follow-up cycle.', NOW())`,
            [targetedLeadId]
        );

        await pool.query('COMMIT');
        res.json({ 
            success: true, 
            message: 'Followup cancelled successfully.',
            affectedRows: updateResult.rowCount 
        });

    } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error("Cancellation Transaction Error: ", err);
        res.status(500).json({ success: false, message: 'Server error processing cancellation.' });
    }
});

// 3. PUT FOLLOW-UP STATUS: Update status and gracefully resolve duplicate records
app.put('/manager/followup/:leadId', authenticateToken, async (req, res) => {
    const leadId = req.params.leadId; 
    const { followup_status, followup_action, notes } = req.body; 

    if (!leadId) {
        return res.status(400).json({ success: false, message: 'Missing lead identifier parameter.' });
    }

    try {
        await pool.query('BEGIN');

        const actionLabel = followup_action || `Status Updated to ${followup_status}`;
        
        // Safe Upsert: Updates status tracking without wiping out scheduled email parameters
        await pool.query(
            `INSERT INTO lead_followups (
                lead_id, 
                followup_action, 
                followup_status, 
                notes, 
                created_at, 
                updated_at
             ) VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (lead_id) DO UPDATE SET
                followup_status = EXCLUDED.followup_status,
                followup_action = COALESCE(EXCLUDED.followup_action, lead_followups.followup_action),
                notes = COALESCE(EXCLUDED.notes, lead_followups.notes),
                -- Keep existing email configurations intact if they exist
                email_subject = lead_followups.email_subject,
                scheduled_at = lead_followups.scheduled_at,
                sent_at = lead_followups.sent_at,
                due_date = COALESCE(lead_followups.due_date, CURRENT_DATE),
                updated_at = NOW()`,
            [leadId, actionLabel, followup_status, notes || null]
        );

        // Record historical log event tracking trace
        await pool.query(
            `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description, created_at)
             VALUES ($1, 'STATUS_CHANGED', $2, NOW())`,
            [leadId, `Follow-up status changed to ${followup_status?.toUpperCase()} by Manager.`]
        );

        await pool.query('COMMIT');
        res.json({ success: true, message: `Follow-up status successfully changed to ${followup_status}.` });
    } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error('Error updating follow up status:', err);
        res.status(500).json({ success: false, message: 'Server error updating follow-up status.' });
    }
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
  const { full_name, email, role, team_id, is_active, password } = req.body;
  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET full_name=$1, email=$2, role=$3, team_id=$4, is_active=$5, password_hash=$6 WHERE user_id=$7',
        [full_name, email, role, team_id, is_active, hashedPassword, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET full_name=$1, email=$2, role=$3, team_id=$4, is_active=$5 WHERE user_id=$6',
        [full_name, email, role, team_id, is_active, req.params.id]
      );
    }
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
        const qualified  = await pool.query("SELECT COUNT(*) FROM leads WHERE status='URGENT'");
        const contacted  = await pool.query("SELECT COUNT(*) FROM leads WHERE status='FOLLOW-UP'");
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
            const result = await model.generateContent(prompt);
            let response = result.response.text().trim();
            if (response.startsWith('```json')) response = response.slice(7).trim();
            if (response.startsWith('```')) response = response.slice(3).trim();
            if (response.endsWith('```')) response = response.slice(0, -3).trim();
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
            status = (aiData.confidence >= 0.8 && aiData.follow_up_required) ? 'URGENT' : 'FOLLOW-UP';
        } else if (aiData.intent === 'Medium' && aiData.follow_up_required) {
            status = 'FOLLOW-UP';
        }

        const statusDisplay = { 'URGENT': 'Ready for Follow-up', 'FOLLOW-UP': 'Review for Follow-up', 'NEW': 'No Follow-up Needed' };

        await pool.query(
            'UPDATE leads SET ai_notes=$1, status=$2, confidence_score=$3, follow_up_required=$4 WHERE lead_id=$5',
            [aiData.notes || null, status, aiData.confidence, aiData.follow_up_required, parseInt(lead.lead_id)]
        );

        lead.status = status;

        // ── Auto-schedule follow-up email in 3 hours (only if no manual one exists) ──
        try {
            await pool.query(
                `INSERT INTO lead_followups (lead_id, followup_action, followup_status, due_date, scheduled_at, email_subject, notes)
                 VALUES ($1, 'Automated Follow-up Email', 'pending', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '3 hours', $2, $3)
                 ON CONFLICT (lead_id) DO NOTHING`,
                [lead.lead_id, `Your Dell Technologies Follow-up — ${interests}`, buildFollowUpEmail(lead, aiData, interests)]
            );
            console.log(`📅 Auto follow-up scheduled for lead ${lead.lead_id} in 3 hours`);
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

// ── GENERIC EMAIL SENDING ROUTE ─────────────────────────────────────────────
// ── GENERIC EMAIL SENDING ROUTE ─────────────────────────────────────────────
app.post('/send-email', authenticateToken, async (req, res) => {
    const { to, subject, text, lead_id, followupDate } = req.body;

    if (!lead_id) {
        return res.status(400).json({ success: false, message: 'Missing lead identification parameter.' });
    }

    try {
        await pool.query('BEGIN');

        // 1. Check if an actual scheduled email with this subject already exists for this lead
        const activeEmailCheck = await pool.query(
            `SELECT * FROM lead_followups 
             WHERE lead_id = $1 
               AND followup_status = 'pending' 
               AND email_subject = $2`, 
            [lead_id, subject]
        );

        if (activeEmailCheck.rowCount > 0) {
            await pool.query('ROLLBACK');
            return res.status(409).json({ success: false, message: 'Error - No duplicate followups' });
        }

        // 2. Clear out any unassigned status placeholder loops for this lead 
        // to prevent false-positives caused by status updates.
        await pool.query(
            `DELETE FROM lead_followups 
             WHERE lead_id = $1 
               AND followup_status = 'pending' 
               AND email_subject IS NULL`,
            [lead_id]
        );

        // 3. Perform a clean upsert into the tracking schema layout
        const dateString = followupDate ? followupDate.split('T')[0] : new Date().toISOString().split('T')[0];
        
        await pool.query(
            `INSERT INTO lead_followups (
                lead_id, 
                followup_action, 
                followup_status, 
                due_date, 
                scheduled_at, 
                email_subject, 
                notes, 
                created_at, 
                updated_at
             ) VALUES ($1, $2, 'pending', $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT (lead_id) DO UPDATE SET
                followup_action = EXCLUDED.followup_action,
                followup_status = EXCLUDED.followup_status,
                due_date = EXCLUDED.due_date,
                scheduled_at = EXCLUDED.scheduled_at,
                email_subject = EXCLUDED.email_subject,
                notes = EXCLUDED.notes,
                updated_at = NOW()`,
            [
                lead_id,
                'Email Follow-up Scheduled',
                dateString,
                followupDate,
                subject,
                text
            ]
        );

        // 4. Record history trace log point tracking event
        await pool.query(
            `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description, created_at)
             VALUES ($1, 'EMAIL_SCHEDULED', $2, NOW())`,
            [lead_id, `Follow-up email scheduled to be sent to ${to}`]
        );

        await pool.query('COMMIT');
        res.json({ success: true, message: 'Follow-up email scheduled successfully.' });

    } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error('Error in send-email endpoint:', err);
        res.status(500).json({ success: false, message: 'Server error processing email scheduling.' });
    }
});

// ── MANUAL FOLLOW-UP EMAIL ROUTE ──────────────────────────────────────────────
// Manager manually schedules a follow-up email at any time.
// If a pending auto follow-up exists, it gets replaced with the manual one.
// If auto already sent (done), returns 409.
// ── MANUAL FOLLOW-UP EMAIL ROUTE (WITH IMMEDIATE SENDING) ────────────────────
app.post('/send-followup/:id', authenticateToken, async (req, res) => {
    try {
        const { followupDate } = req.body || {};
        const leadId = parseInt(req.params.id, 10);

        if (isNaN(leadId)) {
            return res.status(400).json({ success: false, message: 'Invalid lead ID format.' });
        }

        // 1. Verify existence of the lead entity matching ERD constraints
        const leadResult = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [leadId]);
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found.' });
        }
        const lead = leadResult.rows[0];

        // 2. State machine protection — block if done or cancelled
        const existing = await pool.query(
            `SELECT followup_status FROM lead_followups WHERE lead_id = $1`,
            [leadId]
        );
        if (existing.rowCount > 0 && existing.rows[0].followup_status === 'done') {
            return res.status(409).json({ success: false, message: 'A follow-up email has already been sent for this lead.' });
        }
        if (existing.rowCount > 0 && existing.rows[0].followup_status === 'cancelled') {
            return res.status(409).json({ success: false, message: 'This follow-up has been cancelled. Please set it back to pending first.' });
        }

        // 3. Extract mapped contextual identities from joining tables (Double checked with ERD)
        const interestsResult = await pool.query(
            `SELECT ic.category_name 
             FROM lead_interest_categories lic
             JOIN interest_categories ic ON lic.category_id = ic.category_id 
             WHERE lic.lead_id = $1`,
            [leadId]
        );
        
        const categoriesString = interestsResult.rows.map(r => r.category_name).join(', ');
        const interests = categoriesString || 'Dell Technologies solutions';

        const aiData = {
            intent: lead.status === 'URGENT' ? 'High' : lead.status === 'FOLLOW-UP' ? 'Medium' : 'Low',
            notes: 'We appreciate your interest in Dell Technologies solutions.',
        };

        const emailSubject = `Your Dell Technologies Follow-up — ${interests}`;
        const scheduledAt = followupDate || new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

        const dateObj = new Date(scheduledAt);
        const localDueDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        // Compile email template utilizing relational entities
        const emailBody = buildFollowUpEmail(lead, aiData, interests);
        const emailHtml = buildFollowUpEmailHtml(lead, aiData, interests);

        // 4. Trigger transactional email pipeline execution
        await sendEmail({ to: lead.email, subject: emailSubject, text: emailBody, html: emailHtml });

        // 5. Commit state persistence inside an atomic transaction scope
        await pool.query('BEGIN');

        // Upsert follow-up mapping record state configuration
        const followup = await pool.query(
            `INSERT INTO lead_followups (
                lead_id, followup_action, followup_status, due_date, 
                scheduled_at, sent_at, email_subject, notes, created_at, updated_at
             )
             VALUES ($1, 'Manual Follow-up Email', 'done', $2, $3, NOW(), $4, $5, NOW(), NOW())
             ON CONFLICT (lead_id) DO UPDATE SET
               followup_action = EXCLUDED.followup_action,
               followup_status = 'done',
               due_date = EXCLUDED.due_date,
               scheduled_at = EXCLUDED.scheduled_at,
               sent_at = NOW(),
               email_subject = EXCLUDED.email_subject,
               notes = EXCLUDED.notes,
               updated_at = NOW()
             RETURNING followup_id`,
            [leadId, localDueDate, scheduledAt, emailSubject, emailBody]
        );

        // EXTRA FAILED-SAFE: Update the activity text explicitly in your tracking description log 
        // to guarantee activity.tsx captures the exact category string parsed!
        await pool.query(
            `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description, created_at) 
             VALUES ($1, 'EMAIL_SENT', $2, NOW())`,
            [leadId, `Manual follow-up email sent to ${lead.email} regarding ${interests}.`]
        );

        // Auto-close lead after email sent
        await pool.query(`UPDATE leads SET status = 'CLOSED' WHERE lead_id = $1`, [leadId]);

        await pool.query('COMMIT');
        
        res.json({ 
            success: true, 
            message: 'Follow-up timeline successfully processed, recorded, and sent.', 
            scheduled_at: scheduledAt, 
            followup_id: followup.rows[0].followup_id 
        });

    } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error("Manual Email Pipeline Critical Fault: ", err);
        res.status(500).json({ success: false, message: `Data system processing failed: ${err.message}` });
    }
});


// ── CRON JOB — runs every 5 minutes, sends pending emails ────────────────────
cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Cron running — checking pending followups...');
    try {
        const followups = await pool.query(`
            SELECT * FROM lead_followups WHERE followup_status = 'pending' AND scheduled_at <= NOW()
        `);
        for (const followup of followups.rows) {
            const leadResult = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [followup.lead_id]);
            if (leadResult.rows.length === 0) {
                // Lead deleted — cancel the orphaned followup
                await pool.query(`UPDATE lead_followups SET followup_status='cancelled' WHERE followup_id=$1`, [followup.followup_id]);
                console.log(`⚠️ Cancelled orphaned followup ${followup.followup_id} — lead no longer exists`);
                continue;
            }
            const lead = leadResult.rows[0];
            try {
                const aiData = {
                    intent: lead.status === 'URGENT' ? 'High' : lead.status === 'FOLLOW-UP' ? 'Medium' : 'Low',
                    notes: 'We appreciate your interest in Dell Technologies solutions.',
                };
                const interestsResult = await pool.query(
                    `SELECT ic.category_name FROM lead_interest_categories lic
                     JOIN interest_categories ic ON lic.category_id = ic.category_id
                     WHERE lic.lead_id = $1`, [lead.lead_id]
                );
                const interests = interestsResult.rows.map(r => r.category_name).join(', ') || 'Dell Technologies solutions';
                const cronHtml = buildFollowUpEmailHtml(lead, aiData, interests);
                await sendEmail({
                    to:      lead.email,
                    subject: followup.email_subject,
                    text:    followup.notes,
                    html:    cronHtml,
                });
                await pool.query(`UPDATE lead_followups SET followup_status='done', sent_at=NOW() WHERE followup_id=$1`, [followup.followup_id]);
                await pool.query(`UPDATE leads SET status = 'CLOSED' WHERE lead_id = $1`, [lead.lead_id]);
                await pool.query(
                    `INSERT INTO lead_activity_logs (lead_id, activity_type, activity_description) VALUES ($1, 'EMAIL_SENT', 'Scheduled follow-up email sent via cron')`,
                    [lead.lead_id]
                );
                console.log(`✅ Cron sent email to ${lead.email}`);
            } catch (emailErr) {
                console.error(`❌ Failed to send to ${lead.email}:`, emailErr.message);
            }
        }
    } catch (err) {
        console.error('❌ Cron job error:', err.message);
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