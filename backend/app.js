// Import required modules for the FYP project //
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

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

// Basic Routes//
//teams routes//
// GET all teams
app.get("/teams", (req, res) => {
    db.query("SELECT * FROM teams", (err, results) => {
        if (err) {
            console.error("Error fetching teams:", err);
            return res.status(500).json({
                message: "Error retrieving teams from database"
            });
        }

        res.status(200).json(results);
    });
});

// GET a specific team by their id//
app.get("/teams/:id", (req, res) => {
    db.query(
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


// CREATE team
app.post("/teams", (req, res) => {
    const { team_name, territory, description } = req.body;

    db.query(
        "INSERT INTO teams (team_name, territory, description) VALUES (?, ?, ?)",
        [team_name, territory, description],
        (err, result) => {
            if (err) {
                console.error("Error creating team:", err);
                return res.status(500).json({
                    message: "Error creating team"
                });
            }

            res.status(200).json({
                message: "Team created successfully"
            });
        }
    );
});


