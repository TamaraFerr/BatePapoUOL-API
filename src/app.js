import cors from "cors"
import dayjs from "dayjs"
import dotenv from "dotenv"
import express from "express"
import Joi from "joi"
import { MongoClient } from "mongodb"

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try {
    await mongoClient.connect()
    console.log("Mongodb foi conectado!")
} catch (err) {
    console.log(err.message)
}

const db = mongoClient.db()

//schemas
const participanteSchema = Joi.object({name: Joi.string().required()})
const mensagemSchema = Joi.object({
    from: Joi.string().required(),
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().required().valid("message", "private_message")
})

//endpoints
app.post("/participants", async (req, res) => {
    const {name} = req.body

    
    const validation = participanteSchema.validate({ name: name }, { abortEarly: false })
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message))
    }

    try {
        const participante = await db.collection("participants").findOne({ name: name })
        if (participante) return res.sendStatus(409)

        const horario = Date.now()
        await db.collection("participants").insertOne({ name: name, lastStatus: horario })

        const mensagem = {
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(horario).format("HH:mm:ss")
        }

        await db.collection("messages").insertOne(mensagem)

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/participants", async (req, res) => {
    try {
        const participantes = await db.collection("participants").find().toArray()
        res.send(participantes)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/messages", async (req, res) => {
    const {to, text, type} = req.body
    const {user} = req.headers


    const validation = mensagemSchema.validate({...req.body, from: user}, { abortEarly: false })
    if (validation.error) {
        return res.status(422).send(validation.error.details.map(detail => detail.message))
    }

    try {
        const participante = await db.collection("participants").findOne({name: user})
        if (!participante) return res.sendStatus(422)

        const mensagem = { ...req.body, from: user, time: dayjs().format("HH:mm:ss") }
        await db.collection("messages").insertOne(mensagem)
        res.sendStatus(201)

    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get("/messages", async (req, res) => {
    const {user} = req.headers
    const {limit} = req.query
    const limiteNumerado = Number(limit)

    if(limit !== undefined && (limiteNumerado <= 0 || isNaN(limiteNumerado))){
        return res.sendStatus(422)
    } 

    try {
        const mensagens = await db.collection("messages")
        .find({$or: [{from: user}, {to:"Todos"}, {to: user}, {type: "message"}]})
        .limit(limit === undefined ? 0 : limiteNumerado)
        .sort(({$natural: -1}))
        .toArray()

        res.send(mensagens)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/status", async (req, res) => {
    const {user} = req.headers

    if (!user) return res.sendStatus(404)

    try{
        const status = await db.collection("participants").updateOne({name: user}, {$set: {lastStatus: Date.now()}})
        if(status.matchedCount === 0){
            return res.sendStatus(404)
        }
            
        res.sendStatus(200)
    } catch (err){
        res.status(500).send(err.message)
    }
})


const PORT = 5000
app.listen(PORT, () => console.log(`Eba! Server rodando na porta ${PORT}`))