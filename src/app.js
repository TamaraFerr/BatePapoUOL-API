import cors from "cors"
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

})

app.get("/participants", async (req, res) => {
    
})

app.post("/messages", async (req, res) => {
    
})

app.get("/messages", async (req, res) => {
    
})

app.post("/status", async (req, res) => {
    
})



const PORT = 5000
app.listen(PORT, () => console.log(`Eba! Server rodando na porta ${PORT}`))