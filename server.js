const express = require('express');

const app = express();
const port = process.env.DB_PORT || 5000;
const index = require("./routes/index")

app.use('/', index);

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`)
});
