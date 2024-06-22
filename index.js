const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 8000;

const uri = "mongodb+srv://kangchong978:r9pSt76t8CHIYgGM@cluster0.gjk8tae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(cors());
app.use(express.json()); // Parse application/json

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Connection to MongoDB Atlas failed:', error);
        process.exit();
    }
}

connectToMongoDB();

// Define routes
app.get('/', (req, res) => {
    res.send('Hello from the API');
});

// Function to add a new user to the User table in Spotify-top database
async function addNewUser(userData) {
    try {
        const database = client.db('Spotify-top');
        const users = database.collection('User');
        const result = await users.insertOne(userData);
        console.log(`A new user was added with the id ${result.insertedId}`);
    } catch (error) {
        console.error('Failed to add new user:', error);
    }
}

async function updateUserByEmail(email, newData) {
    try {
        const database = client.db('Spotify-top');
        const users = database.collection('User');
        // Update the first document that matches the email with the new data
        const result = await users.updateOne({ email: email }, { $set: newData });
        if (result.modifiedCount === 0) {
            console.log('No changes were made to the user data.');
        } else {
            console.log(`User data updated successfully for email: ${email}`);
        }
    } catch (error) {
        console.error('Failed to update user data:', error);
    }
}

async function isEmailExist(email) {
    try {
        const database = client.db('Spotify-top');
        const users = database.collection('User');
        // Search for a user with the given email
        const user = await users.findOne({ email: email });
        if (user) {
            console.log('Email already exists:', email);
            return true; // Email exists
        } else {
            console.log('Email does not exist:', email);
            return false; // Email does not exist
        }
    } catch (error) {
        console.error('Failed to check if email exists:', error);
        return false; // Assuming false in case of error to prevent potential duplicate
    }
}

async function isTokenExist(accessToken) {
    try {
        const database = client.db('Spotify-top');
        const users = database.collection('User');
        // Search for a user with the given email
        const user = await users.findOne({ accessToken: accessToken });
        if (user) {
            return true; // Email exists
        } else {

            return false; // Email does not exist
        }
    } catch (error) {
        console.error('Failed to check if email exists:', error);
        return false; // Assuming false in case of error to prevent potential duplicate
    }
}

async function getUserDataByToken(accessToken) {
    try {
        const database = client.db('Spotify-top');
        const users = database.collection('User');
        // Search for a user with the given email
        const user = await users.findOne({ accessToken: accessToken });

        if (user) {
            return user; // Email exists
        }
    } catch (error) {
        console.error('Failed to check if email exists:', error);
    }
}


async function getUserData(email) {
    try {
        const database = client.db('Spotify-top');
        const users = database.collection('User');
        // Search for a user with the given email
        const user = await users.findOne({ email: email });
        if (user) {
            return user; // Email exists
        }
    } catch (error) {
        console.error('Failed to check if email exists:', error);
    }
}
async function getUserFavorites(userId) {
    try {
        const database = client.db('Spotify-top');
        const favorites = database.collection('Favorites');
        // Search for a user with the given email
        const userFavorites = favorites.find({ user_id: userId });
        const result = await userFavorites.toArray();
        if (result) {
            return result;
        }
    } catch (error) {
        console.error('Failed to get user favorites: ', error);
    }
}

async function addNewUserFavorite(data) {
    try {
        const database = client.db('Spotify-top');
        const favorites = database.collection('Favorites');
        const result = await favorites.insertOne(data);
        console.log(`A new favorite was added with the id ${result.insertedId}`);
    } catch (error) {
        console.error('Failed to add new favorite:', error);
    }
}

async function removeUserFavorite(data) {
    try {
        const database = client.db('Spotify-top');
        const favorites = database.collection('Favorites');
        const result = await favorites.deleteOne({ user_id: data['user_id'], data_id: data['data_id'] });
        console.log(`Favorite was deleted with the count ${result.deletedCount}`);
    } catch (error) {
        console.error('Failed to delete favorite:', error);
    }
}



app.post('/login', async (req, res) => {

    const userData = req.body;
    const userEmail = userData['email'];
    if (userEmail == undefined) { res.status(500).send(); return; };

    if (await isEmailExist(userEmail)) {
        await updateUserByEmail(userEmail, userData);
    } else {
        await addNewUser(userData);
    }
    var userDataFromDB = await getUserData(userEmail);
    try {
        res.status(201).send(userDataFromDB);
    } catch (error) {
        res.status(500).send();
    }
});

app.post('/login_token', async (req, res) => {

    const userData = req.body;
    const accesss_token = userData['accessToken'];
    if (await isTokenExist(accesss_token)) {
        var userDataFromDB = await getUserDataByToken(accesss_token);

        try {
            res.status(201).send(userDataFromDB);
        } catch (error) {
            res.status(500).send(userDataFromDB);
        }
    }

});

app.post('/get_user_favorites', async (req, res) => {

    const userData = req.body;
    const user_id = userData['user_id'];
    try {
        res.status(201).send(
            await getUserFavorites(user_id)
        );
    } catch (error) {
        res.status(500).send();
    }


});
app.post('/add_user_favorite', async (req, res) => {

    const data = req.body;
    if (data['user_id'] && data['type'] && data['data'] && data['data_id']) {
        try {
            res.status(201).send(
                await addNewUserFavorite(data)
            );
        } catch (error) {
            res.status(500).send();
        }

    }


});

app.post('/remove_user_favorite', async (req, res) => {

    const data = req.body;
    if (data['user_id'] && data['data_id']) {
        try {
            res.status(201).send(
                await removeUserFavorite(data)
            );
        } catch (error) {
            res.status(500).send();
        }
    }

});





// Start the server
app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
});