const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { default: axios } = require('axios');
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
      const filter = { _id: new ObjectId(newRoom?.roomId) };
      const updateDoc = {
        $set: {
          isAvailable: newRoom?.isAvailable,
        },
      };
      const updateRoomStatus = await roomsDataColl.updateOne(filter, updateDoc);
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



    // GET /hotels?sort=asc
    app.get("/hotels", async (req, res) => {
      try {
        const { sort } = req.query; // "asc" or "desc"

        let sortOrder = {};
        if (sort === "asc") {
          sortOrder.price = 1; // Low to high
        } else if (sort === "desc") {
          sortOrder.price = -1; // High to low
        }

        const hotels = await db.collection("hotels")
          .find({})
          .sort(sortOrder)
          .toArray();

        res.json(hotels);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.post('/send', async (req, res) => {
      const { phone, message } = req.body;
      try {
        const SMS_API_KEY = process.env.SMS_API_KEY; // .env থেকে নাও
        const url = `https://api.sms.net.bd/sendsms?api_key=${SMS_API_KEY}&msg=${encodeURIComponent(
          message
        )}&to=${phone}`;

        const response = await axios.get(url);

        res.json({
          status: "success",
          data: response.data
        });

        res.send(url)
      } catch (err) {
        res.status(500).json({ error: "SMS sending failed", err });
      }
    })





    console.log("You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hotel Booking Server is running now...')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
