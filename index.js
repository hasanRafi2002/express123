


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 4000;
const uri = process.env.MONGO_URI; // MongoDB connection URI from environment variables

// Create a new MongoClient with the URI and options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Function to load and insert component data from Component.json
async function loadComponentData() {
  try {
    // Read the JSON file
    const dataPath = path.join(__dirname, './data/Component.json');
    const rawData = fs.readFileSync(dataPath);
    const componentData = JSON.parse(rawData);

    // Get reference to the 'component' collection
    const db = client.db('myDatabase'); // Replace with your database name
    const collection = db.collection('component'); // Collection name for components

    // Insert data into the collection (only if the collection is empty)
    const existingData = await collection.countDocuments();
    if (existingData === 0) {
      const result = await collection.insertMany(componentData);
      console.log('Component data inserted:', result.insertedCount);
    } else {
      console.log('Component data already exists in the database.');
    }
  } catch (error) {
    console.error('Error loading component data:', error);
  }
}

// Connect to MongoDB and start the server
async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log('Connected to MongoDB');

    // Load the initial component data
    await loadComponentData();

    // Get reference to the database and collections
    const db = client.db('myDatabase');
    const userCollection = db.collection('users-2');
    const componentCollection = db.collection('component');

    // Route to get all users from the 'users-2' collection
    app.get('/api/users-2', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.json(users);
      } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ message: 'Error retrieving users' });
      }
    });

    // Route to get all component data from the 'component' collection
    app.get('/api/component', async (req, res) => {
      try {
        const componentData = await componentCollection.find().toArray();
        res.json(componentData);
      } catch (error) {
        console.error('Error retrieving component data:', error);
        res.status(500).json({ message: 'Error retrieving component data' });
      }
    });

    // Route to get a specific component by ID
    app.get('/api/component/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const component = await componentCollection.findOne({ _id: new ObjectId(id) });
        if (!component) {
          return res.status(404).json({ message: 'Component not found' });
        }
        res.json(component);
      } catch (error) {
        console.error('Error retrieving component by ID:', error);
        res.status(500).json({ message: 'Error retrieving component by ID' });
      }
    });

    // Route to handle POST requests to add a new user
    app.post('/api/users-2', async (req, res) => {
      try {
        const newUser = req.body;
        const result = await userCollection.insertOne(newUser);
        console.log('User added:', newUser);
        res.status(201).json({ message: 'User successfully added', id: result.insertedId });
      } catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).json({ message: 'Error adding user' });
      }
    });

    // Route to handle PUT requests to update a user
    app.put('/api/users-2/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedUser = req.body;
        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedUser }
        );
        if (result.modifiedCount > 0) {
          res.status(200).json({ message: 'User updated successfully' });
        } else {
          res.status(404).json({ message: 'User not found or no changes made' });
        }
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
      }
    });

    // Route to handle DELETE requests to delete a user
    app.delete('/api/users-2/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount > 0) {
          res.status(200).json({ message: 'User deleted successfully' });
        } else {
          res.status(404).json({ message: 'User not found' });
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
}

// Call the function to start the connection and server
connectToDatabase();
