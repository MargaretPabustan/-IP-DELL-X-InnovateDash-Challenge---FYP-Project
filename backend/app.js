require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(express.json());
app.use(cors());

/* =========================
   GEMINI SETUP
========================= */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash"
});

/* =========================
   DATABASE CONNECTION
========================= */

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }

    console.log('Connected to MySQL database');
});

/* =========================
   VALIDATION FUNCTION
========================= */

function validateLead(name, email, company, title, phone, primary_interest) {

    if (!name || !email || !company || !title || !phone || !primary_interest) {
        return "All fields are required";
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

/* =========================
   GET ALL LEADS
========================= */

app.get('/leads', (req, res) => {

    connection.query(
        'SELECT * FROM leads',
        (err, results) => {

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
        }
    );
});

/* =========================
   GET LEAD BY ID
========================= */

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

/* =========================
   CREATE LEAD
========================= */

app.post('/leads', (req, res) => {

    const {
        name,
        email,
        company,
        title,
        phone,
        primary_interest
    } = req.body;

    const error = validateLead(
        name,
        email,
        company,
        title,
        phone,
        primary_interest
    );

    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    const sql = `
        INSERT INTO leads
        (
            name,
            email,
            company,
            title,
            phone,
            primary_interest
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
        sql,
        [
            name,
            email,
            company,
            title,
            phone,
            primary_interest
        ],
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

/* =========================
   UPDATE LEAD
========================= */

app.put('/leads/:id', (req, res) => {

    const {
        name,
        email,
        company,
        title,
        phone,
        primary_interest
    } = req.body;

    const error = validateLead(
        name,
        email,
        company,
        title,
        phone,
        primary_interest
    );

    if (error) {
        return res.status(400).json({
            success: false,
            message: error
        });
    }

    connection.query(
        `
        UPDATE leads
        SET
            name=?,
            email=?,
            company=?,
            title=?,
            phone=?,
            primary_interest=?
        WHERE lead_id=?
        `,
        [
            name,
            email,
            company,
            title,
            phone,
            primary_interest,
            req.params.id
        ],
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

/* =========================
   DELETE LEAD
========================= */

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

/* =========================
   AI LEAD ANALYSIS
========================= */

app.post('/analyze-lead/:id', async (req, res) => {

    try {

        connection.query(
            'SELECT * FROM leads WHERE lead_id = ?',
            [req.params.id],
            async (err, results) => {

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

                const lead = results[0];

                /* =========================
                   GEMINI PROMPT
                ========================= */

                const prompt = `
Analyze this sales lead.

Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title}
Primary Interest: ${lead.primary_interest}

Return ONLY valid JSON in this exact format:

{
  "intent": "Low | Medium | High",
  "confidence": number,
  "follow_up_required": boolean
}
`;

                /* =========================
                   CALL GEMINI
                ========================= */

                const result = await model.generateContent(prompt);

                const response = result.response.text();

                /* =========================
                   CLEAN RESPONSE
                ========================= */

                const cleanResponse = response
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();

                /* =========================
                   PARSE JSON
                ========================= */

                const aiData = JSON.parse(cleanResponse);

                /* =========================
                   VALIDATE AI RESPONSE
                ========================= */

                if (
                    !aiData.intent ||
                    aiData.confidence === undefined ||
                    aiData.follow_up_required === undefined
                ) {
                    return res.status(500).json({
                        success: false,
                        message: 'Invalid AI response format'
                    });
                }

                /* =========================
                   FOLLOW-UP LOGIC
                ========================= */

                let followUpStatus = "No Follow-up Needed";

                if (
                    aiData.intent === "High" &&
                    aiData.confidence >= 0.8 &&
                    aiData.follow_up_required === true
                ) {
                    followUpStatus = "Ready for Follow-up";
                }

                /* =========================
                   SAVE AI RESULTS
                ========================= */

                connection.query(
                    `
                    UPDATE leads
                    SET
                        intent=?,
                        confidence_score=?,
                        follow_up_required=?,
                        follow_up_status=?
                    WHERE lead_id=?
                    `,
                    [
                        aiData.intent,
                        aiData.confidence,
                        aiData.follow_up_required,
                        followUpStatus,
                        req.params.id
                    ],
                    (updateErr) => {

                        if (updateErr) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to save AI analysis'
                            });
                        }

                        res.json({
                            success: true,
                            lead: lead,
                            ai_analysis: aiData,
                            follow_up_status: followUpStatus
                        });
                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'AI analysis failed'
        });
    }
});

/* =========================
   SERVER
========================= */

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
/* =========================
   AI LEAD ANALYSIS (Improved)
========================= */

app.post('/analyze-lead/:id', async (req, res) => {
  try {
    connection.query('SELECT * FROM leads WHERE lead_id = ?', [req.params.id], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (results.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

      const lead = results[0];

      const prompt = `
Analyze this sales lead.

Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title}
Primary Interest: ${lead.primary_interest}

Return ONLY valid JSON in this exact format:
{
  "intent": "Low | Medium | High",
  "confidence": number,
  "follow_up_required": boolean
}
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().replace(/```json|```/g, '').trim();

      let aiData;
      try {
        aiData = JSON.parse(response);
      } catch {
        return res.status(500).json({ success: false, message: 'AI response not valid JSON' });
      }

      // ✅ Gemini response validator
      const validIntents = ['Low', 'Medium', 'High'];
      if (
        !validIntents.includes(aiData.intent) ||
        typeof aiData.confidence !== 'number' ||
        typeof aiData.follow_up_required !== 'boolean'
      ) {
        return res.status(500).json({ success: false, message: 'Invalid AI response format' });
      }

      // ✅ Improved follow-up detection logic
      let followUpStatus = 'No Follow-up Needed';
      if (aiData.intent === 'High') {
        if (aiData.confidence >= 0.8 && aiData.follow_up_required) {
          followUpStatus = 'Ready for Follow-up';
        } else if (aiData.confidence >= 0.6) {
          followUpStatus = 'Review for Follow-up';
        }
      }

      connection.query(
        `
        UPDATE leads
        SET intent=?, confidence_score=?, follow_up_required=?, follow_up_status=?
        WHERE lead_id=?
        `,
        [aiData.intent, aiData.confidence, aiData.follow_up_required, followUpStatus, req.params.id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: 'Failed to save AI analysis' });

          res.json({
            success: true,
            lead,
            ai_analysis: aiData,
            follow_up_status: followUpStatus,
          });
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'AI analysis failed' });
  }
});
