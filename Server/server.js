const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

const DATA_FILE = "uploaded_data.csv";
const QTABLE_FILE = path.join("models", "q_table.pkl");

let trainingState = {
    is_training: false,
    current_episode: 0,
    total_episodes: 0,
    progress: 0,
    results: null
};
let childProc = null;

// ---- File upload
app.post("/upload-csv", upload.single("file"), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: "No file provided" });

    fs.readFile(req.file.path, (err, data) => {
        if (err) return res.status(500).json({ error: "File read error" });
        const csv = data.toString();
        const firstLine = csv.split("\n")[0];
        if (!firstLine.includes("Close")) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "'Close' column missing" });
        }
        fs.renameSync(req.file.path, DATA_FILE);
        res.json({ message: "CSV uploaded successfully", rows: csv.split("\n").length - 1 });
    });
});

// ---- Start training (calls Python)
app.post("/start-training", (req, res) => {
    if (trainingState.is_training)
        return res.status(400).json({ error: "Training already in progress" });

    const params = req.body;
    trainingState.is_training = true;
    trainingState.current_episode = 0;
    trainingState.progress = 0;
    trainingState.total_episodes = params.episodes || 1000;
    trainingState.results = null;

    // Spawn the Python process for training
    childProc = spawn("python", ["main.py", JSON.stringify(params)], {
        stdio: ["ignore", "pipe", "pipe"]
    });

    childProc.stdout.on("data", (data) => {
        // Optional: handle progress log from Python
    });

    childProc.stderr.on("data", (data) => {
        console.error("Python error:", data.toString());
    });

    childProc.on("close", (code) => {
        trainingState.is_training = false;
        try {
            // Try to read results saved by Python
            const results = JSON.parse(fs.readFileSync("results/results.json", "utf-8"));
            trainingState.results = results;
            trainingState.progress = 100;
            trainingState.current_episode = results.episodesCompleted || trainingState.total_episodes;
        } catch (e) {
            trainingState.results = null;
        }
    });

    res.json({ message: "Training started" });
});

// ---- Stop training
app.post("/stop-training", (req, res) => {
    if (childProc) {
        childProc.kill();
        childProc = null;
    }
    trainingState.is_training = false;
    res.json({ message: "Training stopped" });
});

// ---- Status and results
app.get("/training-status", (req, res) => {
    res.json(trainingState);
});

app.get("/training-results", (req, res) => {
    if (!trainingState.results)
        return res.status(404).json({ error: "No results yet" });
    res.json(trainingState.results);
});

// ---- Model download
app.get("/download-qtable", (req, res) => {
    if (!fs.existsSync(QTABLE_FILE))
        return res.status(404).json({ error: "Q-table not found" });
    res.download(QTABLE_FILE);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));