const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const usersFile = './users.json';
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing fields' });
  const users = JSON.parse(fs.readFileSync(usersFile));
  if (users[username]) return res.status(400).json({ error: 'user exists' });
  users[username] = { password, balance: 1000 };
  fs.writeFileSync(usersFile, JSON.stringify(users));
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  if (!users[username] || users[username].password !== password) return res.status(401).json({ error: 'bad creds' });
  res.json({ ok: true, balance: users[username].balance });
});

app.post('/api/bet', (req, res) => {
  const { username, amount, game, result } = req.body;
  const users = JSON.parse(fs.readFileSync(usersFile));
  if (!users[username]) return res.status(401).json({ error: 'no user' });
  let bal = users[username].balance;
  if (amount > bal) return res.status(400).json({ error: 'insufficient funds' });
  bal -= amount;
  if (result === 'win') bal += amount * 2;
  users[username].balance = bal;
  fs.writeFileSync(usersFile, JSON.stringify(users));
  res.json({ balance: bal });
});

app.listen(3000, () => console.log('running on 3000'));
