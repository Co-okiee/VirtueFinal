const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const multer = require('multer');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Configure multer with a storage engine to retain the original file name and extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'AssignmentUpload/'); // Save to AssignmentUpload folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // Extract the file extension
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`); // Construct the filename
    }
});

const upload = multer({ storage });

const app = express();

app.use(cors({
    origin: "http://localhost:3000", // Allow your frontend origin
    methods: ["GET", "POST"],
}));
app.use(express.json());  // For parsing JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/uploads', express.static('uploads'));  // Serve video files

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow frontend origin
        methods: ["GET", "POST"],
    }
});

// Define the assignment schema
const AssignmentSchema = new mongoose.Schema({
    title: String,
    description: String,
    deadline: Date,
    url: String, // URL of the uploaded assignment file
});

// Create a model for assignments
const Assignment = mongoose.model('Assignment', AssignmentSchema);

app.post('/api/assignments/add', async (req, res) => {
    const { title, description, deadline } = req.body;

    try {
        const newAssignment = await Assignment.create({ title, description, deadline });
        res.status(200).json({
            message: 'Assignment added successfully!',
            assignment: newAssignment,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add assignment' });
    }
});

// Assignment Upload Route
app.post('/api/assignments/upload', upload.single('file'), async (req, res) => {
    const { title, deadline } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Save the assignment info to the database
        const newAssignment = await Assignment.create({
            title,
            deadline,
            url: `/AssignmentUpload/${file.filename}`,  // Store the correct file path
        });

        res.status(200).json({
            message: 'Assignment uploaded successfully!',
            assignment: newAssignment,
        });
    } catch (err) {
        console.error('Error saving assignment:', err);
        res.status(500).send('Failed to upload assignment');
    }
});

// API endpoint to fetch assignments
app.get('/api/assignments', async (req, res) => {
    try {
        const assignments = await Assignment.find(); // Fetch all assignments
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join', () => {
        socket.broadcast.emit('user-joined', socket.id);
    });

    socket.on('offer', (data) => {
        socket.broadcast.emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.to(data.id).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.id).emit('ice-candidate', data.candidate);
    });
});

// Serve the frontend if it exists (optional, for deployment)
app.use(express.static(path.join(__dirname, 'client/build')));

// A simple GET endpoint to confirm the server is running
app.get('/', (req, res) => {
    res.send('Welcome to the Virtual Classroom Server!');
});

// Database and Server Initialization
mongoose.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        server.listen(5000, () => console.log('Server running on http://localhost:5000'));
    })
    .catch((err) => console.error('Connection error', err));

    