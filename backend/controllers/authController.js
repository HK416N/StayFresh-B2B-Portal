import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const saltRounds = 10;

// SIGN UP
export const signup = async (req, res, next) => {
  const {
    email,
    password,
    company_name,
    company_address,
    uen,
    contact_number,
  } = req.body;

  //check for missing fieldsN
  if (!email || !password || !company_name || !company_address || !uen || !contact_number) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields.',
      code: 'MISSING_FIELDS',
    });
  }

  // normalize email to lowercase, UEN to uppercase
  // trim removes accidental leading/trailing whitespace from form input
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUen = uen.trim();

  //have to use postgres transaction to prevent fragmented user data
  //acquire client from pool for transaction
  const client = await db.connect();

  try {
    //begin transaction
    await client.query('BEGIN');

    // Check if email OR UEN already exists
    const existingData = await client.query(
      `SELECT email, NULL as uen FROM users WHERE email = $1 
      UNION 
      SELECT NULL as email, uen FROM clients WHERE uen = $2`,
      [normalizedEmail, normalizedUen]
    );

    if (existingData.rows.length > 0) {
      await client.query('ROLLBACK');

      let isEmailTaken = false;
      for (const row of existingData.rows) {
        if (row.email === normalizedEmail) {
          isEmailTaken = true;
          break;
        }
      }

      return res.status(409).json({
        success: false,
        error: isEmailTaken ? 'Email already taken.' : 'UEN already registered.',
        code: isEmailTaken ? 'EMAIL_TAKEN' : 'UEN_TAKEN',
      });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // CREATE user, return user data (row)
    const newUser = await client.query(
      'INSERT INTO users (email, hashed_password, role) VALUES ($1, $2, $3) RETURNING *',
      [normalizedEmail, hashedPassword, 'Client']
    );

    const user = newUser.rows[0];

    //create client (user_id use user.id as FK)
    const clientQuery =
      `INSERT INTO clients (user_id, company_name, company_address, uen, contact_number) 
    VALUES ($1, $2, $3, $4, $5)`;
    const clientValues = [user.id, company_name, company_address, normalizedUen, contact_number];

    await client.query(clientQuery, clientValues);

    // cleared user creation and client creation, save changes
    await client.query('COMMIT');

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      // {expiresIn: '7d'},
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: payload,
      }
    });

  } catch (error) {
    //undo changes if anything fails 
    // - added condition rollback only if client was aquired
    // prevent crashing if the db is down
    if (client) await client.query('ROLLBACK');
    next(error);
  } finally {
    // release connection
    client.release();
  }
};

// LOGIN

export const login = async (req, res, next) => {

  const {
    email,
    password,
  } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  try {

    //check if user exists - single query can use db.query
    const result = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const user = result.rows[0];


    // check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await bcrypt.compare(password, user.hashed_password);

    //check if credentials are valid
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {expiresIn: '7d'},
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: payload,
      }
    });

  } catch (error) {
    next(error);
  }
};