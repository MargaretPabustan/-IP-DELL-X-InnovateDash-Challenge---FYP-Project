// Import required modules for the FYP project //
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



