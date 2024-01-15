import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import Joi from "joi"


const app = express();
app.use(express.json());
app.use(cors());
dotenv.config()

// Conexão banco de dados - DB
const mongoClient = new MongoClient(process.env.DATABASE_URL)

try {
    mongoClient.connect()
    console.log("MongoDB conectado!")
} catch (err) {
    console.log(err.message)
}

const db = mongoClient.db()

//schemas

const participantsSchemas = Joi.object({ name: Joi.string().required() })
const messageSchemas = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().required().valid("message", "private_message")
})

//endPoints
app.post("/participants", async (req, res) => {
    const { name } = req.body

    const validation = participantsSchemas.validate(req.body, { abortEarly: false })
    if (validation.error) {
        return res.status(422).send(validation.error.datails.map(detail => detail.message))
    }
    try {
        const participants = await db.collection('participants').findOne({ name })
        if (participants) return res.sendStatus(409)

        const timesTamp = Date.now()
        await db.collection('participants').insertOne({ name, lastStatus: timesTamp })

        const message = {
            from: 'name',
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(timesTamp).format('HH:mm:ss')
        }
        await db.collection('messages').insertOne(message)
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/participants", async (req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray()
        res.send(participants)
        console.log(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }

})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body
    const { user } = req.headers
    const validation = messageSchemas.validate({ ...req.body, from: user }, { abortEarly: false })
    //console.log(validation)
    if (validation.error) {
        return res.status(422).send(validation.error.datails.map(detail => detail.message))
    }

    try {
        const participant = await db.collection('participants').findOne({ name: user })
        if(!participant) return res.sendStatus(422)

        const message = { from: user, to, text, type, time: dayjs().format('HH:mm:ss')}
        await db.collection('messages').insertOne(message)
        res.sendStatus(201)

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/messages", async (req, res) => {
    const {user} = req.headers
    const {limit} = req.query
    const numLimit = Number(limit)

    if(limit !== undefined && (numLimit<=0 || isNaN(numLimit))) return res.sendStatus(422)

    try{
        const messages = await db.collection('messages')
        //isso funciona como um IF, onde cada case dentro do "$or" validará a renderização da mensagem expecifica
        .find({ $or: [ {from: user}, {to: user}, {type: "message"}, {to: "Todos"}]})
        .sort({time: -1})
        .limit(limit === undefined ? 0 : numLimit) 
        .toArray()

        res.send(messages)
    }catch(err){
        res.status(500).send(err.message)
    }
})


const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));