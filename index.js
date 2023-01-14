import express from "express"
import cors from "cors"
import axios from "axios"
import { createClient } from 'redis'

const app = express()
const redisClient = createClient({})
await redisClient.connect()

app.use(cors())

const EXPIRE_TIME = 3600

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId
  const data = await checkCache(`photos/${albumId}`, async () => {
    const { data } = await axios.get("http://jsonplaceholder.typicode.com/photos", { params: { albumId } });
    return data
  })
  res.json(data)
})

async function checkCache(key, cb) {
  try {
    const haveDataInCache = await redisClient.get(key)
    if (haveDataInCache != null) {
      return JSON.parse(haveDataInCache)
    } else {
      const data = await cb()
      redisClient.setEx(key, EXPIRE_TIME, JSON.stringify(data))
      return data
    }
  } catch (e) {
    return 'error in database'
  }
}


app.listen("3000", () => {
  console.log('server is up & running')
})
