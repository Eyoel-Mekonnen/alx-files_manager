const express = require('express');

const app = express();
const port = process.env.PORT || 5000;
const index = require('./routes/index');

app.use(express.json()); // This needs to be above any route handlers.

app.use('/', index);

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
module.exports = app;
