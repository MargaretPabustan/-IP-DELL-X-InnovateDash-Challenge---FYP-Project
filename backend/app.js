// ── IMPORTS ─────────────────────────────────────────────
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

app.use(express.json());

// ── CORS ────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));

// ── SUPABASE POSTGRES CONNECTION ───────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// test connection
pool.connect()
    .then(() => console.log('✅ Connected to Supabase PostgreSQL'))
    .catch(err => console.error('❌ DB connection error:', err));

// ── VALIDATION ─────────────────────────────────────────
function validateLead(name, email, company, title, phone) {
    if (!name || !email || !company || !title || !phone) {
        return "All fields are required";
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return "Invalid email format";
    }

    if (phone.length < 8) {
        return "Phone number too short";
    }

    return null;
}

// ── LEADS ROUTES ───────────────────────────────────────

// GET all leads
app.get('/leads', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM leads ORDER BY lead_id DESC'
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});

// GET lead by id
app.get('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM leads WHERE lead_id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});

// CREATE lead
app.post('/leads', async (req, res) => {
    const { name, email, company, title, phone_number, customer_intent } = req.body;

    const error = validateLead(name, email, company, title, phone_number);

    if (error) {
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: error
        });
    }

    try {
        // duplicate check
        const existing = await pool.query(
            'SELECT lead_id FROM leads WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_EMAIL',
                message: 'A lead with this email already exists'
            });
        }

        const result = await pool.query(
            `INSERT INTO leads
            (name, email, company, title, phone_number, customer_intent)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING lead_id`,
            [name, email, company, title, phone_number, customer_intent || null]
        );

        res.status(201).json({
            success: true,
            message: "Lead created",
            lead_id: result.rows[0].lead_id
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});

// UPDATE lead
app.put('/leads/:id', async (req, res) => {
    const { name, email, company, title, phone_number, customer_intent } = req.body;

    const error = validateLead(name, email, company, title, phone_number);

    if (error) {
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: error
        });
    }

    try {
        const result = await pool.query(
            `UPDATE leads
             SET name=$1, email=$2, company=$3, title=$4, phone_number=$5, customer_intent=$6
             WHERE lead_id=$7`,
            [name, email, company, title, phone_number, customer_intent || null, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json({
            success: true,
            message: "Lead updated"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});

// DELETE lead
app.delete('/leads/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM leads WHERE lead_id=$1',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        res.json({
            success: true,
            message: "Lead deleted"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});

// ── INTEREST CATEGORIES ───────────────────────────────

// GET all categories
app.get('/interest_categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM interest_categories');

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// GET lead interests
app.get('/lead_interest_categories/:lead_id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ic.category_id, ic.category_name
             FROM lead_interest_categories lic
             JOIN interest_categories ic
             ON lic.category_id = ic.category_id
             WHERE lic.lead_id=$1`,
            [req.params.lead_id]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// ADD interest
app.post('/lead_interest_categories', async (req, res) => {
    const { lead_id, category_id } = req.body;

    if (!lead_id || !category_id) {
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'lead_id and category_id required'
        });
    }

    try {
        await pool.query(
            `INSERT INTO lead_interest_categories (lead_id, category_id)
             VALUES ($1,$2)`,
            [lead_id, category_id]
        );

        res.status(201).json({
            success: true,
            message: "Interest added"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// DELETE interest
app.delete('/lead_interest_categories/:lead_id/:category_id', async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM lead_interest_categories
             WHERE lead_id=$1 AND category_id=$2`,
            [req.params.lead_id, req.params.category_id]
        );

        res.json({
            success: true,
            message: "Interest removed"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// ── TEAMS ──────────────────────────────────────────────

// GET all teams
app.get("/teams", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM teams");

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// GET team by id
app.get("/teams/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM teams WHERE team_id=$1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// CREATE team
app.post("/teams", async (req, res) => {
    const { team_name, territory, description } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO teams (team_name, territory, description)
             VALUES ($1,$2,$3)
             RETURNING team_id`,
            [team_name, territory, description]
        );

        res.status(201).json({
            success: true,
            message: "Team created",
            team_id: result.rows[0].team_id
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// UPDATE team
app.put("/teams/:id", async (req, res) => {
    const { team_name, territory, description } = req.body;

    try {
        await pool.query(
            `UPDATE teams
             SET team_name=$1, territory=$2, description=$3
             WHERE team_id=$4`,
            [team_name, territory, description, req.params.id]
        );

        res.json({
            success: true,
            message: "Team updated"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// DELETE team
app.delete("/teams/:id", async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM teams WHERE team_id=$1",
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Team deleted"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR'
        });
    }
});

// ── START SERVER ───────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Supabase connected:', result.rows[0]);
    } catch (err) {
        console.log('❌ DB connection failed:', err.message);
    }
});