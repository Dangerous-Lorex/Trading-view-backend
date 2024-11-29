const express = require("express");
const cors = require("cors");
const path = require("path");
var bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const dbConfig = require("./app/config/db.config");

dotenv.config();

const app = express();

var corsOptions = {
    origin: process.env.CORS_DEV,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const User = db.user;

db.mongoose
    .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Successfully connect to MongoDB.");
        initial();
    })
    .catch((err) => {
        console.error("Connection error", err);
        process.exit();
    });

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Trading Bot application." });
});

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

async function initial() {
    // Check if the collection exists
    db.mongoose.connection.db.listCollections({ name: 'users' })
        .next((err, collectionInfo) => {
            if (!collectionInfo) {
                // Create the collection if it does not exist
                db.mongoose.connection.createCollection('users', function (err, res) {
                    if (err) throw err;
                    console.log('Users collection created!');
                });
            }
        });

    // Updated to use async/await
    try {
        const count = await User.countDocuments().exec(); // Use exec() to return a promise
        if (count === 0) {
            const user = new User({
                username: "super",
                email: "super@admin.com",
                password: bcrypt.hashSync("12345678", 8),
                role: "superAdmin"
            });
            await user.save(); // Use await for save() to handle the promise
            console.log("added 'super' to user collection");
        }
    } catch (err) {
        console.log("Error counting documents or saving user:", err); // Log any errors
    }
}