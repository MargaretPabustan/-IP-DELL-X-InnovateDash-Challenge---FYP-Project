// Import required modules for the FYP project //
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const cors = require('cors');
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
    connection.release();
});

// ── Validation ────────────────────────────────────────────────────────────────
// ✅ Removed primary_interest — not a column in leads table
function validateLead(name, email, company, title, phone) {
    if (!name || !email || !company || !title || !phone) {
        return "All fields (name, email, company, title, phone) are required";
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return "Invalid email format";
    }

    if (phone.length < 8) {
        return "Phone number is too short";
    }

    return null;
}

// ── LEADS ROUTES ──────────────────────────────────────────────────────────────

// GET all leads
app.get('/leads', (req, res) => {
    pool.query('SELECT * FROM leads', (err, results) => {
        if (err) {
            console.log("GET /leads ERROR:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch leads" });
        }
        res.json({ success: true, data: results });
    });
});

// GET lead by id
app.get('/leads/:id', (req, res) => {
    pool.query(
        'SELECT * FROM leads WHERE lead_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                console.log("GET /leads/:id ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to fetch lead" });
            }
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "Lead not found" });
            }
            res.json({ success: true, data: results[0] });
        }
    );
});

// POST create lead
app.post('/leads', (req, res) => {
    const { name, email, company, title, phone_number, customer_intent } = req.body;

    // ✅ Validate without primary_interest
    const error = validateLead(name, email, company, title, phone_number);
    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    const sql = `
        INSERT INTO leads (name, email, company, title, phone_number, customer_intent)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    pool.query(sql, [name, email, company, title, phone_number, customer_intent || null],
        (err, result) => {
            if (err) {
                console.log("POST /leads ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to create lead" });
            }
            res.status(201).json({
                success: true,
                message: "Lead created successfully",
                lead_id: result.insertId
            });
        }
    );
});

// PUT update lead
app.put('/leads/:id', (req, res) => {
    const { name, email, company, title, phone_number, customer_intent } = req.body;

    // ✅ Validate without primary_interest
    const error = validateLead(name, email, company, title, phone_number);
    if (error) {
        return res.status(400).json({ success: false, message: error });
    }

    pool.query(
        `UPDATE leads 
         SET name=?, email=?, company=?, title=?, phone_number=?, customer_intent=? 
         WHERE lead_id=?`,
        [name, email, company, title, phone_number, customer_intent || null, req.params.id],
        (err, result) => {
            if (err) {
                console.log("PUT /leads ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to update lead" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Lead not found" });
            }
            res.json({ success: true, message: "Lead updated successfully" });
        }
    );
});

// DELETE lead
app.delete('/leads/:id', (req, res) => {
    pool.query(
        'DELETE FROM leads WHERE lead_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                console.log("DELETE /leads ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to delete lead" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Lead not found" });
            }
            res.json({ success: true, message: "Lead deleted successfully" });
        }
    );
});

// ── LEAD INTEREST CATEGORIES ROUTES ──────────────────────────────────────────

// GET interests for a lead
app.get('/lead_interest_categories/:lead_id', (req, res) => {
    pool.query(
        `SELECT ic.category_id, ic.category_name 
         FROM lead_interest_categories lic
         JOIN interest_categories ic ON lic.category_id = ic.category_id
         WHERE lic.lead_id = ?`,
        [req.params.lead_id],
        (err, results) => {
            if (err) {
                console.log("GET /lead_interest_categories ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to fetch interests" });
            }
            res.json({ success: true, data: results });
        }
    );
});

// POST add interest to a lead
app.post('/lead_interest_categories', (req, res) => {
    const { lead_id, category_id } = req.body;

    if (!lead_id || !category_id) {
        return res.status(400).json({ success: false, message: "lead_id and category_id are required" });
    }

    pool.query(
        'INSERT INTO lead_interest_categories (lead_id, category_id) VALUES (?, ?)',
        [lead_id, category_id],
        (err, result) => {
            if (err) {
                console.log("POST /lead_interest_categories ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to add interest" });
            }
            res.status(201).json({ success: true, message: "Interest added successfully" });
        }
    );
});

// DELETE interest from a lead
app.delete('/lead_interest_categories/:lead_id/:category_id', (req, res) => {
    pool.query(
        'DELETE FROM lead_interest_categories WHERE lead_id = ? AND category_id = ?',
        [req.params.lead_id, req.params.category_id],
        (err, result) => {
            if (err) {
                console.log("DELETE /lead_interest_categories ERROR:", err);
                return res.status(500).json({ success: false, message: "Failed to remove interest" });
            }
            res.json({ success: true, message: "Interest removed successfully" });
        }
    );
});

// ── INTEREST CATEGORIES ROUTES ────────────────────────────────────────────────

// GET all interest categories
app.get('/interest_categories', (req, res) => {
    pool.query('SELECT * FROM interest_categories', (err, results) => {
        if (err) {
            console.log("GET /interest_categories ERROR:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch categories" });
        }
        res.json({ success: true, data: results });
    });
});

// ── TEAMS ROUTES ──────────────────────────────────────────────────────────────

// GET all teams
app.get("/teams", (req, res) => {
    pool.query("SELECT * FROM teams", (err, results) => {
        if (err) {
            console.error("Error fetching teams:", err);
            return res.status(500).json({ message: "Error retrieving teams from database" });
        }
        res.status(200).json(results);
    });
});

// GET specific team by ID
app.get("/teams/:id", (req, res) => {
    pool.query(
        "SELECT * FROM teams WHERE team_id = ?",
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error("Error fetching team:", err);
                return res.status(500).json({ message: "Error retrieving team from database" });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: "Team not found" });
            }
            res.status(200).json(results[0]);
        }
    );
});

// POST create new team
app.post("/teams", (req, res) => {
    const { team_name, territory, description } = req.body;
    pool.query(
        "INSERT INTO teams (team_name, territory, description) VALUES (?, ?, ?)",
        [team_name, territory, description],
        (err, result) => {
            if (err) {
                console.error("Error creating team:", err);
                return res.status(500).json({ message: "Error creating team" });
            }
            res.status(201).json({ message: "Team created successfully", team_id: result.insertId });
        }
    );
});

// PUT update team by ID
app.put("/teams/:id", (req, res) => {
    const { team_name, territory, description } = req.body;
    pool.query(
        "UPDATE teams SET team_name=?, territory=?, description=? WHERE team_id=?",
        [team_name, territory, description, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: "Error updating team" });
            res.json({ message: "Team updated successfully" });
        }
    );
});

// DELETE team by ID
app.delete("/teams/:id", (req, res) => {
    pool.query(
        "DELETE FROM teams WHERE team_id=?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: "Error deleting team" });
            res.json({ message: "Team deleted successfully" });
        }
    );
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`DELL Lead App Server running on port ${PORT}`);
});