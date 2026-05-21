// Import required modules for the FYP project //
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

const pool = mysql.createPool({
    host: '5-aozg.h.filess.io',
    user: 'DELL Lead Database_molecular',
    password: 'e813611a5f704c1464dc43713c3351e00c3949c3',
    database: 'DELL Lead Database_molecular',
    port: 3307
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
});

// Basic Routes//
//teams routes//
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

// Listen on specified port//
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`DELL Lead App Server running on port ${PORT}`);
});


