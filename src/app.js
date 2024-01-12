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
            to:   'Todos',
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
    try{
    const participants = await db.collection('participants').find().toArray()
    res.send(participants)
    console.log(participants)
    } catch(err){
        res.status(500).send(err.message)
    }

})



const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));