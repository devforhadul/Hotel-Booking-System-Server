const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
const port = 3000;
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.mongoDB_user}:${process.env.mongoDB_pass}@cluster0.wcol5mf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const myDB = client.db('Modern_Hotel_booking');
    const roomsDataColl = myDB.collection('roomsData');

    //===================================================

    app.get('/rooms', async (req, res) => {
      const query = {};
      const result = await roomsDataColl.find(query).toArray();
      res.send(result);
    });

    app.get('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await roomsDataColl.findOne(query);
      res.send(result);
    });


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
