import cors from "cors"
import dayjs from "dayjs"
import dotenv from "dotenv"
import express from "express"
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
const participanteSchema = joi.object({name: joi.string().required()})
const mensagemSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message")
})

//endpoints
app.post("/participants", async (req, res) => {
    const {name} = req.body

    const validation = participanteSchema.validate(req.body, {abortEarly: false})
    if(validation.error){
        return res.status(422).send(validation.error.details.map(detail => detail.message))
    }
    res.sendStatus(201)

    try{
       const participante = await db.collection("participants").findOne({name: name})
       if(participante){
            return res.sendStatus(409)
       }

       const horario = Date.now()
       await db.collection("participants").insertOne({name, lastStatus: horario})

       const mensagem = {
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs(horario).format("HH:mm:ss")
       }

       await db.collection("messages").insertOne(mensagem)

        res.sendStatus(201)
    } catch(err){
        res.status(500).send(err.message)
    }
})

app.get("/participants", async (req, res) => {
    try{
        const participantes = await db.collection("participants").find().toArray()
        res.send(participantes)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post("/messages", async (req, res) => {
    
})

app.get("/messages", async (req, res) => {
    
})

app.post("/status", async (req, res) => {
    
})



const PORT = 5000
app.listen(PORT, () => console.log(`Eba! Server rodando na porta ${PORT}`))