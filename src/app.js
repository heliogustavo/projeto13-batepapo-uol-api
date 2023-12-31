import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";

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
  const messageschema = joi.object(
    {
      from: Joi.string().required(),
      to: Joi.string().required(),
      text: Joi.string().required(),
      type: Joi.string().required().valid("massage", "private_message")
  }
)

  //endpoints
  app.post("/participants", async(req, res)=> {
    const {name} = req.body
    const validation  = participantschema.validate(req.body, {abortEarly:false})
    if(validation.error){
     return  res.status(422).send(validation.error.details.map(detail =>detail.message))
    }
    try{
      const participant = await db.collection('participants').findOne({name})
      if(participant) return res.senStatus(409)

      const timestamp = Date.now()
      await db.collection('participant').insertOne({name, lastStatus: timestamp})
      const message = { 
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs(timestamp).format('HH:mm:ss')
    }
      await db.collection('participant').insertOne({message})
      res.sendStatus(201)

    }catch(err){
      res.status(500).send(err.message)
    }
  })

app.get('/participants', async(req, res) => {

  try{
  const participants = await db.collection('participants').find().toArray()
  res.send(participants)
  }catch(err){
    res.status(500).send(err.message)
  }
});

app.post("/message", async(req, res)=> {
  const {to, text, type} = req.body
  const {user} = req.headers

  const validation  = messageschema.validate({...req.body, from:user}, {abortEarly:false})
  if(validation.error){
   return  res.status(422).send(validation.error.details.map(detail =>detail.message))
  }
  try{
    const participant = await db.collection('participants').findOne({name:user})
    if(!participant) return  res.sendStatus(422)

    const message = {from: user, to, text, type, time: dayjs().format('HH:mm:ss')}
    await db.collection('messages').insertOne(message)
    res.sendStatus(201)

    }catch(err){
      res.status(500).send(err.message)
    }
}
)
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});    