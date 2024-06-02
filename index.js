

require("dotenv").config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT;

app.use(cors());
app.use(express.json())


function createToken(user) {
    const token = jwt.sign(
        {
            email: user.email
        },
        'secret',
        { expiresIn: '7d' });

    return token;

}

function verifyToken(req, res, next) {

    const token = req.headers.authorization.split(" ")[1];
    const verify = jwt.verify(token, "secret")
    console.log(verify);
    if (!verify?.email) {
        return res.send("you are not authorized")
    }

    req.user = verify.email

    next();
}




const uri = process.env.DATABASE_URL;

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

        await client.connect();
        const footware = client.db("footware");
        const shoesCollection = footware.collection("shoes");
        const ur = usersCollection = footware.collection("users");
        console.log("You successfully connected to MongoDB!");

        // add product
        app.post("/shoes", verifyToken, async (req, res) => {
            const shoesData = req.body;
            const result = await shoesCollection.insertOne(shoesData);
            res.send(result);
        });

        // get the shoes data
        app.get("/shoes", async (req, res) => {
            const shoesData = shoesCollection.find({});
            const result = await shoesData.toArray();
            res.send(result);
        });

        //get single data
        app.get("/shoes/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const shoesData = await shoesCollection.findOne(query);
            // console.log(shoesData);
            res.send(shoesData);
        });

        //edit product
        app.patch("/shoes/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await shoesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.send(result);
        });

        // delete product
        app.delete("/shoes/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const result = await shoesCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });



        ////////////////user////////////////////

        // google signin user 
        app.post('/users', async (req, res) => {

            const user = req.body;
            // const filter = { email: user.email }
            // const options = { upsert: true }
            // const updateDoc = { $set: user }
            const token = createToken(user);
            console.log(token);
            const isUserExist = await usersCollection.findOne({ email: user?.email })
            if (isUserExist?._id) {
                return res.send({
                    status: "success",
                    message: "login successfully",
                    token
                })
            }
            const result = await usersCollection.insertOne(user);
            console.log("got new user", req.body);
            console.log("added user", result);
            res.send(token)

        })

        app.get("/users/get/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const result = await usersCollection.findOne({ _id: new ObjectId(id) });
            res.send(result);
        });


        // get single user data
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        });

        //update user info
        app.patch("/users/:email", async (req, res) => {
            const email = req.params.email;
            const userData = req.body;
            const result = await usersCollection.updateOne({ email }, { $set: userData }, { upsert: true });
            res.send(result);
        });





    }
    finally {


    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('server is working')
});

app.listen(port, (req, res) => {
    console.log("listening on port :", port);
})