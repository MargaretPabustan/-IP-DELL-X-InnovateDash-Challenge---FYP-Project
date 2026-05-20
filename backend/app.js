const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const connection = mysql.createConnection({
    host: '5-aozg.h.filess.io',
    user: 'DELL Lead Database_molecular',
    password: 'e813611a5f704c1464dc43713c3351e00c3949c3',
    database: 'DELL Lead Database_molecular',
    port: 3307
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
});


// validation
function validateLead(name, email, phone) {
    if (!name || !email || !phone) {
        return "All fields (name, email, phone) are required";
    }

    // simple email check
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return "Invalid email format";
    }

    if (phone.length < 8) {
        return "Phone number is too short";
    }

    return null;
}


// =========================
// GET ALL LEADS
// =========================
app.get('/leads', (req, res) => {
    connection.query('SELECT * FROM leads', (err, results) => {
        if (err) {
            console.error(err);
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


// =========================
// GET LEAD BY ID
// =========================
app.get('/leads/:id', (req, res) => {
    connection.query(
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


// =========================
// CREATE LEAD (WITH VALIDATION)
// =========================
app.post('/leads', (req, res) => {
    const { name, email, phone } = req.body;

    const error = validateLead(name, email, phone);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    const sql = `
        INSERT INTO leads (name, email, phone)
        VALUES (?, ?, ?)
    `;

    connection.query(sql, [name, email, phone], (err, result) => {
        if (err) {
            console.error(err);
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
    });
});


// =========================
// UPDATE LEAD
// =========================
app.put('/leads/:id', (req, res) => {
    const { name, email, phone } = req.body;

    const error = validateLead(name, email, phone);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    connection.query(
        `UPDATE leads SET name=?, email=?, phone=? WHERE lead_id=?`,
        [name, email, phone, req.params.id],
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


// =========================
// DELETE LEAD
// =========================
app.delete('/leads/:id', (req, res) => {
    connection.query(
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


// START SERVER
app.listen(3000, () => {
    console.log('Server running on port 3000');
});