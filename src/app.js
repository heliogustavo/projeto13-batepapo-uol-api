import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const app = express()

//setup
app.use(cors())
app.use(express.json())
dotenv.config()
const port = 5000;

//Conexão DB
const mongoclient = new MongoClient(process.env.DATABASE_URL)

try{
  mongoclient.connect()
  console.log("Mongo DB conectado ")
}catch(err){
  console.log(err.message)

}

  const db = mongoclient.db()

app.get('/', (req, res) => {
  res.send('');    
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});    