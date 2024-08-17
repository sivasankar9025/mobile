const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cors = require('cors');
const { model } = require('./schema'); // Ensure you have the correct path to your schema

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const mongooseConnect = async () => {
  try {
    await mongoose.connect('mongodb+srv://pssm9025528322:9025528322@cluster0.altz4n8.mongodb.net/user?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Db connected');
  } catch (err) {
    console.error('Database connection error:', err);
  }
};

// POST endpoint
app.post('/post', async (req, res) => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  let formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
  formattedTime = `${formattedDate} ${formattedTime}`;
  const { name, registerNo, gender, graduate, hsc, myambition, dept, dob, arr } = req.body;

  const response = new model({ name, registerNo, gender, graduate, hsc, myambition, dept, dob, date: formattedTime, arr, lastUpdated: Date.now() });

  try {
    const a = await response.save();
    res.json({ id: a._id, message: 'Data saved successfully', a });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT endpoint
app.put('/update/:id', async (req, res) => {
  const id = req.params.id;
  const { arr } = req.body;

  try {
    const response = await model.updateOne(
      { _id: id },
      { arr: arr, lastUpdated: Date.now() }
    );
    res.send('updated');
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET endpoint
app.get('/get', async (req, res) => {
  try {
    const response = await model.find({});
    res.json({ response });
  } catch (err) {
    res.status(500).send({ message: 'Error retrieving documents', error: err.message });
  }
});

// POST score endpoint
app.post('/score', async (req, res) => {
  const { title, score } = req.body;
  try {
    const response = new scoremodel({ title, score });
    await response.save();
    res.send('score saved');
  } catch (err) {
    res.status(400).send({ message: 'Error saving score', error: err.message });
  }
});

// POST deleteAll endpoint
app.post('/deleteAll', async (req, res) => {
  try {
    const result = await model.deleteMany({});

    if (result.deletedCount > 0) {
      res.status(200).send({ message: 'All documents deleted successfully', data: result });
    } else {
      res.status(404).send({ message: 'No documents found to delete' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error deleting documents', error: error.message });
  }
});

// Schedule the job to run every minute
cron.schedule('* * * * *', async () => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000); // 1 minute ago

    // Find and delete documents with empty arrays and older than 1 minute
    const result = await model.deleteMany({
      arr: { $size: 0 },
      lastUpdated: { $lt: oneMinuteAgo }
    });

    console.log(`Deleted ${result.deletedCount} documents`);
  } catch (err) {
    console.error('Error running scheduled job:', err);
  }
});

mongooseConnect();

app.listen(5000 || process.env.PORT, () => console.log('Server running on port 5000'));
