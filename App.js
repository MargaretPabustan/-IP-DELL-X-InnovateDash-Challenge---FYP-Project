const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// database connection
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
    connection.query('SELECT * FROM leads', (err, results) => {
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

    connection.query(
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

    connection.query(
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


app.listen(3000, () => {
    console.log('Server running on port 3000');
});