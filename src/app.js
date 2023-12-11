import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";

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

  //schemas
  const participantschema = Joi.object({name: Joi.string().required()})

  //endpoints
  app.post("", async(req, res)=> {
    const {name} = req.body
    const validation  = participantschema.validate(req.body, {abortEarly:false})
    if(validation.error){
     return  res.status(422).send(validation.error.details.map(detail =>detail.message))
    }
    try{

    }catch{
      res.status(500).send(err.message)
    }
  })

app.get('/', (req, res) => {
  res.send('');    
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});    