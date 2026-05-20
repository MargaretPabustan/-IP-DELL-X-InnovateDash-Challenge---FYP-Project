// Import required modules for the FYP project //
const { dismissBrowser } = require('expo-web-browser');
const express = require('express');
const mysql = require('mysql2');
const app = express();

// Create a connection to the MySQL database //
const connection = mysql.createConnection({ 
    host: '5-aozg.h.filess.io', 
    user: 'DELL Lead Database_molecular', 
    password: 'e813611a5f704c1464dc43713c3351e00c3949c3', 
    database: 'DELL Lead Database_molecular',
    port: 3307 
}); 
 
connection.connect((err) => { 
    if (err) { 
        console.error('Error connecting to MySQL:', err); 
        return; 
    } 
    console.log('Connected to MySQL database'); 
});

//Basic routing//

// Define a route to retrieve information for all teams//
app.get('/teams', (req, res) => {
    // Handle the GET request for /teams
    connection.query('SELECT * FROM teams', (err, results) => {
        if (err) {
            console.error('Error fetching teams:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.json(results[0]);
    });
});

// Define a route to retrieve information for a specific team by ID//
app.get('/teams/:id', (req, res) => {
    connection.query
    ("SELECT * FROM teams WHERE id = ?", [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching team:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.json(results[0]);
    });
});

//Define a route to insert teams information into DB//
app.post("/teams", (req, res) => {
    const { team_name, territory, description } = req.body;

    connection.query(
        "INSERT INTO teams (team_name, territory, description) VALUES (?, ?, ?)",
        [team_name, territory, description],
        (err, result) => {
            if (err) {
                console.error('Error inserting team:', err);
                res.status(500).json({ error: 'Database Error' });
                return;
            }
            res.status(201).json({
                message: "Team created successfully",
                team_id: result.insertId
            });
        }
    );
});

 