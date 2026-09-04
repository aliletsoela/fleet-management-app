// routes/auth.js - login, logout, and session check
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const pool = require("../db/db");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({ id: user.id, email: user.email, fullName: user.full_name, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Could not log out" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, email, full_name, role FROM users WHERE id = $1",
      [req.session.userId]
    );
    if (!rows.length) return res.status(401).json({ error: "Not logged in" });
    res.json({ id: rows[0].id, email: rows[0].email, fullName: rows[0].full_name, role: rows[0].role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
