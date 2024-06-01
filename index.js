// const express = require('express');
// const axios = require('axios');
// const fs = require('fs');
// const path = require('path');
// const app = express();
// const PORT = process.env.PORT || 3000;

// // Set the view engine to use EJS
// app.set('view engine', 'ejs');

// // Define the base URL for the MangaDex API
// const baseUrl = 'https://api.mangadex.org';

// // Function to fetch cover images
// async function getCoverImage(mangaId) {
//     try {
//         const coverResponse = await axios.get(`${baseUrl}/cover`, {
//             params: {
//                 'manga[]': mangaId,
//                 limit: 10,
//                 'order[createdAt]': 'asc',
//                 'order[updatedAt]': 'asc',
//                 'order[volume]': 'asc'
//             }
//         });
//         const cover = coverResponse.data.data[0];
//         return cover ? `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}` : null;
//     } catch (error) {
//         console.error(`Error fetching cover image for manga ID ${mangaId}:`, error);
//         return null;
//     }
// }

// // Route to render the index page
// app.get('/', (req, res) => {
//     res.render('index');
// });

// // Route to handle manga search
// app.get('/search', async (req, res) => {
//     const title = req.query.title;
//     try {
//         const response = await axios.get(`${baseUrl}/manga`, { params: { title } });
//         const mangaList = await Promise.all(response.data.data.map(async (manga) => {
//             const coverUrl = await getCoverImage(manga.id);
//             return {
//                 id: manga.id,
//                 attributes: manga.attributes,
//                 coverUrlFull: coverUrl
//             };
//         }));
//         res.render('search-results', { title, mangaList });
//     } catch (error) {
//         console.error('Error fetching manga:', error);
//         res.render('search-results', { title, mangaList: [] });
//     }
// });

// // Route to fetch manga details and download chapters
// app.get('/manga/:mangaId/download', async (req, res) => {
//     try {
//         const { mangaId } = req.params;

//         // Retrieve manga details by ID
//         const mangaResponse = await axios.get(`${baseUrl}/manga/${mangaId}`);
//         const mangaData = mangaResponse.data.data;

//         // Retrieve chapters for the manga
//         const chaptersResponse = await axios.get(`${baseUrl}/manga/${mangaId}/feed`);
//         const chapters = chaptersResponse.data.data;

//         // Create a directory to save downloaded chapters
//         const downloadDir = path.join(__dirname, 'downloads', mangaData.attributes.title.en);
//         if (!fs.existsSync(downloadDir)) {
//             fs.mkdirSync(downloadDir, { recursive: true });
//         }

//         // Download each chapter to the specified directory
//         for (const chapter of chapters) {
//             const chapterResponse = await axios.get(`${baseUrl}/chapter/${chapter.id}`, {
//                 responseType: 'arraybuffer'
//             });

//             // Save the chapter file with a unique name based on the chapter number
//             const chapterFilePath = path.join(downloadDir, `Chapter-${chapter.attributes.chapter}.json`);
//             fs.writeFileSync(chapterFilePath, chapterResponse.data);
//         }

//         res.status(200).send('Chapters downloaded successfully.');
//     } catch (error) {
//         console.error('Error retrieving manga details:', error);
//         res.status(500).send('An error occurred while retrieving manga details.');
//     }
// });

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const { spawn } = require('child_process');
// Set the view engine to use EJS
app.set('view engine', 'ejs');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define the base URL for the MangaDex API
const baseUrl = 'https://api.mangadex.org';

// Function to fetch cover images
async function getCoverImage(mangaId) {
    try {
        const coverResponse = await axios.get(`${baseUrl}/cover`, {
            params: {
                'manga[]': mangaId,
                limit: 10,
                'order[createdAt]': 'asc',
                'order[updatedAt]': 'asc',
                'order[volume]': 'asc'
            }
        });
        const cover = coverResponse.data.data[0];
        return cover ? `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}` : null;
    } catch (error) {
        console.error(`Error fetching cover image for manga ID ${mangaId}:`, error);
        return null;
    }
}


// MongoDB connection
mongoose.connect('mongodb+srv://santhanakrishnan9704:01txVGijeoK2Cfu0@users.zoyvnom.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// User model
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  email: String,
  password: String
}));

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Registration endpoint
app.post('/register', async (req, res) => {
    // Extract data from request body
    const { newUsername, newEmail, newPassword } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Create new user
    const newUser = new User({ username: newUsername, email: newEmail, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
});
app.get('/download', (req, res) => {
    const mangaName = req.query.mangaName;

    // Spawn a child process to execute the Python script with mangaName as argument
    const pythonProcess = spawn('python', ['app.py', mangaName]);

    // Capture output from the Python script
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python script stdout: ${data}`);
        // Send the output to the client
        res.send(data.toString());
    });

    // Handle errors from the Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script stderr: ${data}`);
        // Send an error response to the client
        res.status(500).send('An error occurred while executing the Python script.');
    });

    // Handle the Python script exit event
    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
    });
});
// Login endpoint
app.post('/login', async (req, res) => {
    // Extract data from request body
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({ token });
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route to render the index page
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle manga search
app.get('/search', async (req, res) => {
    const title = req.query.title;
    try {
        const response = await axios.get(`${baseUrl}/manga`, { params: { title } });
        const mangaList = await Promise.all(response.data.data.map(async (manga) => {
            const coverUrl = await getCoverImage(manga.id);
            return {
                id: manga.id,
                attributes: manga.attributes,
                coverUrlFull: coverUrl
            };
        }));
        res.render('search-results', { title, mangaList });
    } catch (error) {
        console.error('Error fetching manga:', error);
        res.render('search-results', { title, mangaList: [] });
    }
});

// Route to fetch manga details and download chapters
app.get('/manga/:mangaId/download', async (req, res) => {
    try {
        const { mangaId } = req.params;

        // Retrieve manga details by ID
        const mangaResponse = await axios.get(`${baseUrl}/manga/${mangaId}`);
        const mangaData = mangaResponse.data.data;

        // Retrieve chapters for the manga
        const chaptersResponse = await axios.get(`${baseUrl}/manga/${mangaId}/feed`);
        const chapters = chaptersResponse.data.data;

        // Create a directory to save downloaded chapters
        const downloadDir = path.join(__dirname, 'downloads', mangaData.attributes.title.en);
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        // Download each chapter to the specified directory
        for (const chapter of chapters) {
            const chapterResponse = await axios.get(`${baseUrl}/chapter/${chapter.id}`, {
                responseType: 'arraybuffer'
            });

            // Save the chapter file with a unique name based on the chapter number
            const chapterFilePath = path.join(downloadDir, `Chapter-${chapter.attributes.chapter}.json`);
            fs.writeFileSync(chapterFilePath, chapterResponse.data);
        }

        res.status(200).send('Chapters downloaded successfully.');
    } catch (error) {
        console.error('Error retrieving manga details:', error);
        res.status(500).send('An error occurred while retrieving manga details.');
    }
});
// Route to fetch and display manga details
app.get('/manga/:mangaId', async (req, res) => {
    const { mangaId } = req.params;
    try {
        const response = await axios.get(`${baseUrl}/manga/${mangaId}`);
        const manga = response.data.data;
        const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
        // const coverUrlFull = coverArt ? `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}` : null;
        const coverUrl = await getCoverImage(manga.id);
        res.render('manga-details', { manga, coverUrl });
    } catch (error) {
        console.error('Error fetching manga details:', error);
        res.status(500).send('An error occurred while retrieving manga details.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
