const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
var jwt = require('jsonwebtoken');
const port = 3000;
require('dotenv').config();



// middleware
app.use(cors());
app.use(express.json());





// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
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

    // Genenrate jwt
    app.post('/jwt', (req, res) => {
      const user = { email: req.body.email };
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' })
      res.send({ token, message: 'jwt created successfully' })
    });

    app.get('/rooms', async (req, res) => {
      const query = {};
      const result = await roomsDataColl.find(query).toArray();
      res.send(result);
    });

    // get sigle room by id
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

    // Room booking post
    app.post('/rooms', async (req, res) => {
      const newRoom = req.body;
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
      const token = req?.headers?.authorization?.split(' ')[1]
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
          if (err) {
            console.log(err)
          }
          console.log(decode)
        });
      }
      if (!token) {
        return res.send({ message: "Ka toi vai?" })
      }

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
      const result = await hotelBookedDataColl.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //update booked date
    app.patch('/booked/update/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
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

    //update availiblity after booking room
    app.patch('/rooms/booked/:id', async (req, ress) => {
      const id = req.params.id;
      const updatedData = req.body;
      console.log(id, updatedData)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          isAvailable: updatedData.isAvailable,
        },
      };
      const result = await roomsDataColl.updateOne(filter, updateDoc, options);
      ress.send(result);
    });

    //update availiblity after booking room
    app.patch('/rooms/cancel/:id', async (req, ress) => {
      const id = req.params.id;
      const updatedData = req.body;
      console.log(id, updatedData)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          isAvailable: updatedData.isAvailable,
        },
      };
      const result = await roomsDataColl.updateOne(filter, updateDoc, options);
      ress.send(result);
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

    //Rooms filter by price
    app.get('/filter', async (req, res) => {
      console.log("minPrice:", req.query.minPrice); // Debug log
      console.log("maxPrice:", req.query.maxPrice);

      try {
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

        const result = await roomsDataColl
          .find({ pricePerNight: { $gte: minPrice, $lte: maxPrice } })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Filter Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });








    console.log("You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hotel Booking Server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
