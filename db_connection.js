const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.AWS_HOST,
  user: process.env.AWS_HOST_USER,
  password: process.env.AWS_HOST_PASSWORD,
  database: process.env.AWS_DATABASE
});

// Connect to db
db.connect((err) => {
  if (err){
    throw err;
  }
  console.log('AWS RDS connected')
})

// return a promise of the query on the database
const query = (query_to_execute) => {
  return new Promise((resolve, reject) => {
    db.query(query_to_execute, (err, result) => {
      if(err) {
        reject(err);
      }else{
        resolve(result);
      }
    })
  })
}

const transaction_query = (query_to_execute) => {
  return new Promise((resolve, reject) => {
    db.query(query_to_execute, (err, result) => {
      if(err) {
        return db.rollback(reject(err));
      }else{
        resolve(result);
      }
    })
  })
}

module.exports = {db, query, transaction_query};