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
    const hotelBookedDataColl = myDB.collection('hotelBookedData');

    //===================================================

    app.get('/rooms', async (req, res) => {
      const query = {};
      const result = await roomsDataColl.find(query).toArray();
      res.send(result);
    });

    app.get('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      // Check if the id is valid before creating ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }
      const query = { _id: new ObjectId(id) };
      const result = await roomsDataColl.findOne(query);
      res.send(result);
    });

    // Room booking API
    app.post('/rooms', async (req, res) => {
      const newRoom = req.body;
      console.log(newRoom)
      const result = await hotelBookedDataColl.insertOne(newRoom);
      res.send(result);
    });

    // Get all booked rooms
    app.get('/rooms/booked', async (req, res) => {
      const query = {};
      const result = await hotelBookedDataColl.find(query).toArray();
      res.send(result);
    });

    // get booked room by emamil id
    app.get('/booked', async (req, res) => {
      const email = req.query.email;
      const query = {
        userEmail: email
      }
      const result = await hotelBookedDataColl.find(query).toArray();
      res.send(result);

    })

    // Room sort by top rating
    app.get('/top-rated', async (req, res) => {
      try {
        const result = await roomsDataColl.find({})
          .sort({ rating: -1 }).limit(6).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching top-rated rooms:', error);
        res.send({ error: 'Failed to fetch top-rated rooms' });
      }
    });


    // Delete roommate post
    app.delete('/booked/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const result = await hotelBookedDataColl.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //update booked date
    app.put('/booked/update/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      console.log(updatedData)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          checkInDate: updatedData.checkInDate,
          checkOutDate: updatedData.checkOutDate
        },
      };
      const result = await hotelBookedDataColl.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // add review 
    app.patch('/rooms/:id/review', async (req, res) => {
      const id = req.params.id;
      const reviewData = req.body;
      const result = await roomsDataColl.updateOne(
        { _id: new ObjectId(id) },
        { $push: { reviews: reviewData } }
      );
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
