// Import required modules for the FYP project //
const express = require('express');
const mysql = require('mysql2');
const app = express();
require('dotenv').config();

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
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
});

// Basic Routes//
// CORE LEADS ROUTES - Thanmaee//
// validation function
function validateLead(name, email, company, title, phone, primary_interest) {
    if (!name || !email || !company || !title || !phone || !primary_interest) {
        return "All fields (name, email, company, title, phone, primary interest) are required";
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


// get all leads
app.get('/leads', (req, res) => {
    pool.query('SELECT * FROM leads', (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch leads'
            });
        }

        res.json({
            success: true,
            data: results
        });
    });
});


// get lead by id
app.get('/leads/:id', (req, res) => {
    pool.query(
        'SELECT * FROM leads WHERE lead_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead not found'
                });
            }

            res.json({
                success: true,
                data: results[0]
            });
        }
    );
});


// create lead
app.post('/leads', (req, res) => {
    const { name, email, company, title, phone, primary_interest } = req.body;

    const error = validateLead(name, email, company, title, phone, primary_interest);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    const sql = `
        INSERT INTO leads 
        (name, email, company, title, phone, primary_interest)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    pool.query(
        sql,
        [name, email, company, title, phone, primary_interest],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create lead'
                });
            }

            res.status(201).json({
                success: true,
                message: 'Lead created successfully',
                lead_id: result.insertId
            });
        }
    );
});


// update lead
app.put('/leads/:id', (req, res) => {
    const { name, email, company, title, phone, primary_interest } = req.body;

    const error = validateLead(name, email, company, title, phone, primary_interest);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    pool.query(
        `UPDATE leads 
         SET name=?, email=?, company=?, title=?, phone=?, primary_interest=? 
         WHERE lead_id=?`,
        [name, email, company, title, phone, primary_interest, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update lead'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead not found'
                });
            }

            res.json({
                success: true,
                message: 'Lead updated successfully'
            });
        }
    );
});


// delete lead
app.delete('/leads/:id', (req, res) => {
    pool.query(
        'DELETE FROM leads WHERE lead_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete lead'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead not found'
                });
            }

            res.json({
                success: true,
                message: 'Lead deleted successfully'
            });
        }
    );
});




//TEAMS ROUTES - Margaret//
// GET all teams
app.get("/teams", (req, res) => {
    pool.query("SELECT * FROM teams", (err, results) => {
        if (err) {
            console.error("Error fetching teams:", err);
            return res.status(500).json({
                message: "Error retrieving teams from database"
            });
        }

        res.status(200).json(results);
    });
});


// GET specific team by ID//
app.get("/teams/:id", (req, res) => {
    pool.query(
        "SELECT * FROM teams WHERE team_id = ?",
        [req.params.id],
        (err, results) => {
            if (err) {
                console.error("Error fetching team:", err);
                return res.status(500).json({
                    message: "Error retrieving team from database"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Team not found"
                });
            }

            res.status(200).json(results[0]);
        }
    );
});

// POST create new team//
app.post("/teams", (req, res) => {
    const { team_name, territory, description } = req.body;

    pool.query(
        "INSERT INTO teams (team_name, territory, description) VALUES (?, ?, ?)",
        [team_name, territory, description],
        (err, result) => {
            if (err) {
                console.error("Error creating team:", err);
                return res.status(500).json({
                    message: "Error creating team"
                });
            }

            res.status(201).json({
                message: "Team created successfully",
                team_id: result.insertId
            });
        }
    );
});

// PUT update team by ID//
app.put("/teams/:id", (req, res) => {
    const { team_name, territory, description } = req.body;

    pool.query(
        "UPDATE teams SET team_name=?, territory=?, description=? WHERE team_id=?",
        [team_name, territory, description, req.params.id],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Error updating team" });
            }

            res.json({ message: "Team updated successfully" });
        }
    );
});

// DELETE team by ID//
app.delete("/teams/:id", (req, res) => {
    pool.query(
        "DELETE FROM teams WHERE team_id=?",
        [req.params.id],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "Error deleting team" });
            }

            res.json({ message: "Team deleted successfully" });
        }
    );
});





// Listen on specified port//
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`DELL Lead App Server running on port ${PORT}`);
});


