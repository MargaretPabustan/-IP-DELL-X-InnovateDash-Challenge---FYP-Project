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


