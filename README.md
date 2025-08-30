RL Trading Simulator
A web app to upload historical stock data, configure Q-learning parameters, train a trading agent, and visualize results in an inline line chart. The stack includes a static frontend (HTML/CSS/JS with Chart.js), a Node.js/Express backend that orchestrates training, and a Python RL pipeline that prints streaming progress and writes results for the UI to render.

Quick start
Prerequisites

Node.js 18+ and npm

Python 3.9+ with pip

Install backend

From the server folder: npm install

Install Python deps

From the same folder or a python/ subfolder (where main.py lives): pip install -r requirements.txt

Run backend

node server.js (or use a process manager)

Open frontend

Serve the Frontend directory, or open index.html via a dev server (e.g., VS Code Live Server) at http://127.0.0.1:5501/Frontend/index.html

Use the app

Upload a CSV with a Close column

Configure parameters

Start training and watch the progress bar update

View results as a line chart and download the Q-table

Project structure
Frontend

index.html: Tabs (Upload, Configure, Training, Results), error modal, Chart.js script include

style.css: Layout and components styling

script.js: UI handlers, polling, progress updates, results rendering with Chart.js, localStorage tab/upload state

Favicons: favicon.ico, icon.svg, apple-touch-icon.png

Backend

server.js: Express server, CORS, file upload with Multer, spawn Python, stream progress, serve status/results/download endpoints

uploads/: temp upload dir (created on boot)

models/: saved Q-table (created on demand)

results/: results.json and trading_plot.png (created on demand)

Python (RL core)

main.py: Parses parameters, loads CSV, trains Q-learning agent, prints JSON progress each episode, saves Q-table and results, prints wrote_results event

utils/environment.py: Simple trading environment

utils/agent.py: Q-learning agent with discretization and save/load

Data and CSV format
Minimum requirement: a Close column

Optional columns: Date, Open, High, Low, Volume

Order: chronological (oldest to newest)

The backend validates the presence of Close and rejects otherwise

Frontend behavior
Upload

Drag-and-drop or browse a CSV (max 10 MB)

Shows success or error message and persists “uploadOk” in localStorage

Configure

Parameters: initialBalance, episodes, learningRate, gamma, epsilon, epsilonDecay

Training

Calls /start-training (POST)

Polls /training-status every ~1.5s

Shows a progress bar when is_training is true, driven by progress and current_episode

Results

When training finishes: retrieves results (portfolioHistory array), renders a line chart, shows summary cards, and provides a Q-table download link

Backend behavior
CORS

Allows http://localhost:* and http://127.0.0.1:* for local development

File upload

Multer saves uploaded CSV to uploads/

Server moves it deterministically to uploaded_data.csv at the server root

Validates header includes Close

Training orchestration

Spawns Python with -u (unbuffered stdout), ensuring progress lines arrive in real time

Tracks an in-memory trainingState with is_training, current_episode, total_episodes, progress, results, lastError

Updates trainingState on each progress line; marks finished on wrote_results and on process close

Results serving

/training-status: returns live trainingState; if a results file exists, loads it into results

/training-results: returns 202 while pending and 200 with results JSON when ready

/download-qtable: streams the saved Q-table file

Python training details
Parameter intake

main.py reads a JSON object from argv to set episodes, learningRate, gamma, epsilon, epsilonDecay, initialBalance, and dataPath

Resolves relative paths against BASE_DIR so writes land where the server expects

Training loop

Q-learning over a minimal trading environment with Buy/Hold/Sell actions

Prints {"event":"progress","episode":i,"total":EPISODES} every episode (flush=True)

Output

Saves models/q_table.pkl

Computes a greedy test run to create portfolioHistory

Writes results/results.json with portfolioHistory, finalBalance, totalReward, episodesCompleted

Prints {"event":"wrote_results","path": ".../results.json"} at the end (flush=True)

Configuration and environment
API base URL

The frontend uses http://127.0.0.1:5000 for API calls to avoid localhost/127 inconsistencies

Ports

Backend: 5000

Frontend: typically served on 5501 by a local dev server (or any static server)

OS paths

All server and Python file operations use absolute paths derived from __dirname / BASE_DIR to avoid working-directory issues

Common issues and fixes
Progress stuck at 0%

Ensure Python spawned with -u and that print_progress uses flush=True

Verify child.stdout parsing runs (server logs should show increasing episodes)

“Cannot reach API” at page load

Backend not running or CORS mismatch; keep both sides on http and the same host family (127.0.0.1)

Upload fails

CSV missing Close or larger than 10 MB; check Network tab response

Results pending forever

Python didn’t write results.json at server_dir/results; verify path and logs

Favicon not showing

Place favicon.ico, icon.svg, apple-touch-icon.png next to index.html; hard-refresh to bypass caching

Scripts and commands
Backend

npm install

node server.js

Python deps

pip install -r requirements.txt

Stopping the server

In the same terminal, press Ctrl+C; if it hangs, kill the terminal or terminate the Node process

API reference (development)
POST /upload-csv

multipart/form-data with file field "file"

200 JSON { message, path } or 400/500 with error

POST /start-training

JSON body parameters override defaults

200 JSON { message: "Training started" }

GET /training-status

200 JSON { is_training, progress, current_episode, total_episodes, results?, lastError? }

GET /training-results

202 JSON while pending, 200 with results JSON when ready

GET /download-qtable

200 file stream or 404 if missing

Security and privacy (development note)
This sample runs locally, without authentication or rate limiting

Do not expose these endpoints to the public Internet without adding proper security, validation, and quotas

Testing checklist
Upload a minimal CSV with Close values; verify server logs and 200 response

Start training; verify is_training toggles true and progress climbs

Confirm results.json is written and /training-results returns 200

See chart render and summary cards; download Q-table

Extending the project
Add richer environment and reward shaping

Replace Q-learning with function approximation or deep RL

Add persistence for trainingState across restarts

Introduce a scheduler or job queue for multiple concurrent trainings

Enhance the UI with session-based runs and result comparisons

License
Replace with your preferred license (e.g., MIT, Apache-2.0)

Acknowledgments
Thanks to the open-source communities behind Express, Multer, Chart.js, and Python’s scientific stack.
