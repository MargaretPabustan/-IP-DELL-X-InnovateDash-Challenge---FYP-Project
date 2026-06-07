// ── IMPORTS ─────────────────────────────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());
app.use(cors());

// ── SUPABASE CONNECTION ───────────────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
    .catch(err => console.error('❌ DB connection error:', err));

// ── GROQ SETUP ────────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── VALIDATION ────────────────────────────────────────────────────────────────
function validateLead(name, email, company, title, phone) {
    if (!name || !email || !company || !title || !phone) {
        return 'All fields (name, email, company, title, phone) are required';
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    if (phone.length < 8) return 'Phone number is too short';
    return null;
}

// ── LEADS ─────────────────────────────────────────────────────────────────────

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
        const result = await pool.query(
            'SELECT * FROM leads WHERE lead_id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/leads', async (req, res) => {
    const { name, email, company, title, phone_number, customer_intent } = req.body;

    const error = validateLead(name, email, company, title, phone_number);
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        const existing = await pool.query(
            'SELECT lead_id FROM leads WHERE email = $1', [email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_EMAIL',
                message: 'A lead with this email already exists'
            });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }

    try {
        const result = await pool.query(
            `INSERT INTO leads (name, email, company, title, phone_number, customer_intent)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING lead_id`,
            [name, email, company, title, phone_number, customer_intent || null]
        );
        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            lead_id: result.rows[0].lead_id
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
            `UPDATE leads
             SET name=$1, email=$2, company=$3, title=$4, phone_number=$5, customer_intent=$6
             WHERE lead_id=$7`,
            [name, email, company, title, phone_number, customer_intent || null, req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
        res.json({ success: true, message: 'Lead updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM leads WHERE lead_id = $1', [req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }
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
    if (!lead_id || !category_id) {
        return res.status(400).json({ success: false, message: 'lead_id and category_id required' });
    }
    try {
        await pool.query(
            'INSERT INTO lead_interest_categories (lead_id, category_id) VALUES ($1, $2)',
            [lead_id, category_id]
        );
        res.status(201).json({ success: true, message: 'Interest added' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/lead_interest_categories/:lead_id/:category_id', async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM lead_interest_categories WHERE lead_id=$1 AND category_id=$2',
            [req.params.lead_id, req.params.category_id]
        );
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
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/teams/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams WHERE team_id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Team not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/teams', async (req, res) => {
    const { team_name, territory, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO teams (team_name, territory, description) VALUES ($1, $2, $3) RETURNING team_id',
            [team_name, territory, description]
        );
        res.status(201).json({ message: 'Team created', team_id: result.rows[0].team_id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/teams/:id', async (req, res) => {
    const { team_name, territory, description } = req.body;
    try {
        await pool.query(
            'UPDATE teams SET team_name=$1, territory=$2, description=$3 WHERE team_id=$4',
            [team_name, territory, description, req.params.id]
        );
        res.json({ message: 'Team updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/teams/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM teams WHERE team_id=$1', [req.params.id]);
        res.json({ message: 'Team deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GROQ AI ANALYSIS ──────────────────────────────────────────────────────────

app.post('/analyze-lead/:id', async (req, res) => {
    try {
        const leadResult = await pool.query(
            'SELECT * FROM leads WHERE lead_id = $1',
            [req.params.id]
        );

        if (leadResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const lead = leadResult.rows[0];

        const interestsResult = await pool.query(
            `SELECT ic.category_name
             FROM lead_interest_categories lic
             JOIN interest_categories ic ON lic.category_id = ic.category_id
             WHERE lic.lead_id = $1`,
            [lead.lead_id]
        );
        const interests = interestsResult.rows.map(r => r.category_name).join(', ') || 'Not specified';

        const prompt = `
You are a sales analyst for Dell Technologies at a booth event.
Analyze this lead and determine their purchase intent.

Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title}
Customer Intent: ${lead.customer_intent || 'Not specified'}
Interests: ${interests}

Return ONLY valid JSON in this exact format, no extra text:
{
  "intent": "Low" or "Medium" or "High",
  "confidence": a number between 0 and 1,
  "follow_up_required": true or false,
  "notes": "a short 1-2 sentence follow-up suggestion for the sales team"
}
`;
        const result = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
        });
        const response = result.choices[0].message.content.replace(/```json|```/g, '').trim();

        let aiData;
        try {
            aiData = JSON.parse(response);
        } catch {
            return res.status(500).json({ success: false, message: 'AI response not valid JSON' });
        }

        const validIntents = ['Low', 'Medium', 'High'];
        if (
            !validIntents.includes(aiData.intent) ||
            typeof aiData.confidence !== 'number' ||
            typeof aiData.follow_up_required !== 'boolean'
        ) {
            return res.status(500).json({ success: false, message: 'Invalid AI response format' });
        }

        // ── Map AI intent to DB status ENUM ──────────────────────────────────
        let status = 'NEW';
        if (aiData.intent === 'High') {
            if (aiData.confidence >= 0.8 && aiData.follow_up_required) {
                status = 'QUALIFIED';
            } else {
                status = 'CONTACTED';
            }
        } else if (aiData.intent === 'Medium' && aiData.follow_up_required) {
            status = 'CONTACTED';
        }

        // ── Friendly display label for frontend ───────────────────────────────
        const statusDisplay = {
            'QUALIFIED': 'Ready for Follow-up',
            'CONTACTED': 'Review for Follow-up',
            'NEW':       'No Follow-up Needed',
        };

        // ── Save to DB ────────────────────────────────────────────────────────
        await pool.query(
            `UPDATE leads
             SET ai_notes=$1, status=$2
             WHERE lead_id=$3`,
            [aiData.notes || null, status, lead.lead_id]
        );

        res.json({
            success: true,
            lead,
            ai_analysis: {
                intent:             aiData.intent,
                confidence:         aiData.confidence,
                follow_up_required: aiData.follow_up_required,
                follow_up_status:   statusDisplay[status],
                notes:              aiData.notes,
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