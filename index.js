
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors= require('cors')
require('dotenv').config()
const app = express()
const port =  process.env.PORT || 5000
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var jwt = require('jsonwebtoken');

// middileware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9ofe0jv.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();



    const MockBookedCollection = client.db("RediunceEducationDB").collection("mock")
    const userCollection = client.db("RediunceEducationDB").collection("users")
    const testTimeCollection = client.db("RediunceEducationDB").collection("testTime")
    const MockTestResultCollection = client.db("RediunceEducationDB").collection("MockResult")
    const CourseCollection = client.db("RediunceEducationDB").collection("Course")
    const blogsCollection = client.db("RediunceEducationDB").collection("Blogs")



// midileware
const verifyToken=(req,res,next)=>{
if(!req.headers.authorization){
return res.status(401).send({message: 'forbidden access' })
}
const token=req.headers.authorization.split(' ')[1]
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
if(err){
return res.status(401).send({message:'forbidden access'})
}
req.decoded=decoded;
next()
})
}

const verifyAdmin=async(req,res,next)=>{
  const email=req.decoded.email;
  const query={email: email}
  const user=await userCollection.findOne(query)
  const isAdmin=user?.role === 'admin'
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next();
  }

    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.send({token})
      })



 //make admin
 app.patch('/users/admin/:id',verifyToken,verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updatedDoc)
  res.send(result)
})

app.get('/users/admin/:email',async(req,res)=>{
  const email=req.params.email;
  const query={email: email}
  const user=await userCollection.findOne(query)
  let admin=false;
  if(user){
    admin=user?.role=== 'admin'
  }
  res.send({admin})
  
  })
  



  // payment intent
  app.post('/create-payment-intent', async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100)
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ['card']
    })
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  })



  app.post('/MockBooking',verifyToken,async (req, res) => {
    const user = req.body;
    const result = await MockBookedCollection.insertOne(user);
    res.send(result)
  
  })
  app.get('/MockBooking',verifyToken,verifyAdmin, async (req, res) => {
    const cursor = MockBookedCollection.find().sort({ _id: -1 });
    const result = await cursor.toArray();
    res.send(result);
  })

  app.delete('/MockBooking/:id',verifyToken,verifyAdmin, async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await MockBookedCollection.deleteOne(query)
    res.send(result)
  })



  app.post('/result',verifyToken,verifyAdmin,async (req, res) => {
    const user = req.body;
    const result = await MockTestResultCollection.insertOne(user);
    res.send(result)
  
  })

  app.get('/result', async (req, res) => {
    const { ExamCode, PhoneNumber } = req.query;
    let query = {};
    if (ExamCode) {
      query.ExamCode = ExamCode;
    }
    if (PhoneNumber) {
      query.PhoneNumber = PhoneNumber;
    }
  
    const cursor = MockTestResultCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  });
  




    // -----------------------------------------------------

    app.post('/Course',verifyToken,verifyAdmin,async (req, res) => {
      const user = req.body;
      const result = await CourseCollection.insertOne(user);
      res.send(result)
    
    })
    app.get('/Course', async (req, res) => {
      const cursor = CourseCollection.find().sort({ _id: -1 });
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/Course/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await CourseCollection.findOne(query)
      res.send(result)
    })
    app.delete('/Course/:id',verifyAdmin,verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await CourseCollection.deleteOne(query)
      res.send(result)
    })

    
    // -----------------------------------------------------

    app.post('/testTime',verifyToken,verifyAdmin,async (req, res) => {
      const user = req.body;
      const result = await testTimeCollection.insertOne(user);
      res.send(result)
    
    })
    app.get('/testTime', async (req, res) => {
      const cursor = testTimeCollection.find().sort({ _id: -1 });
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/testTime/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await testTimeCollection.findOne(query)
      res.send(result)
    })
    app.delete('/testTime/:id',verifyToken,verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await testTimeCollection.deleteOne(query)
      res.send(result)
    })
    // -----------------------------------------------------

    app.post('/blogs',async (req, res) => {
      const user = req.body;
      const result = await blogsCollection.insertOne(user);
      res.send(result)
  
    })
    app.get('/blogs', async (req, res) => {
      let query = {};
     if (req.query?.email) {
         query = { email: req.query.email };
     }
      const cursor = blogsCollection.find(query).sort({ _id: -1 }) ;
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await blogsCollection.findOne(query)
      res.send(result)
    })
    app.delete('/blogs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await blogsCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/blogs/:id/vote', async (req, res) => {
      const id = req.params.id;
      const { type } = req.body; 
    
      const query = { _id: new ObjectId(id) };
      const post = await blogsCollection.findOne(query);
    
      if (!post) {
        return res.status(404).send({ message: 'Post not found' });
      }
      if (type === 'like') {
        post.like = String(parseInt(post.like) + 1);
      } else if (type === 'dislike') {
        post.dislike = String(parseInt(post.dislike) - 1);
      }
    
      const result = await blogsCollection.updateOne(query, { $set: post });
    
      res.send(result);
    });

    app.patch('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { photoUrl} = req.body;
    
      const updatedDoc = {
        $set: {
          photoUrl:photoUrl 
        },
      };
    
      const result = await blogsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });




// users
app.post('/users', async (req, res) => {
  const user = req.body;
  const query = { email: user.email }
  const existingUser = await userCollection.findOne(query)
  if (existingUser) {
    return res.send({ message: 'user already exists', insertedId: null })
  }
  const result = await userCollection.insertOne(user);
  res.send(result)

})






app.get('/users', async (req, res) => {
  let query = {};
  if (req.query?.email) {
    query = { email: req.query.email };
  }
  const result = await userCollection.find(query).toArray();
  res.send(result);
});


app.patch('/users/:id', async (req, res) => {
 
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const { photoUrl} = req.body;

  const updatedDoc = {
    $set: {
      photoUrl:photoUrl 
    },
  };

  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
 
});








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
  console.log(`server running on port ${port}`)
})