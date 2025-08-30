<<<<<<< HEAD
# RL Trading Project

Welcome to the RL Trading Project! This repository contains code, documentation, and resources for building, training, and evaluating reinforcement learning (RL) agents for algorithmic trading.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Installation](#installation)  
4. [Getting Started](#getting-started)  
5. [Project Structure](#project-structure)  
6. [Data Preparation](#data-preparation)  
7. [Environments](#environments)  
8. [RL Algorithms](#rl-algorithms)  
9. [Training Agents](#training-agents)  
10. [Evaluation](#evaluation)  
11. [Visualization](#visualization)  
12. [Hyperparameter Tuning](#hyperparameter-tuning)  
13. [Logging and Monitoring](#logging-and-monitoring)  
14. [Backtesting](#backtesting)  
15. [Deployment](#deployment)  
16. [Contributing](#contributing)  
17. [License](#license)  
18. [References](#references)  
19. [Contact](#contact)  

---

## 1. Project Overview

This project aims to provide a flexible and extensible framework for developing RL-based trading strategies. It supports multiple RL algorithms, custom trading environments, and tools for data processing, evaluation, and visualization.

---

## 2. Features

- Modular codebase for easy experimentation
- Support for multiple RL algorithms (DQN, PPO, A2C, etc.)
- Customizable trading environments
- Data preprocessing utilities
- Backtesting and evaluation tools
- Visualization of trading performance
- Logging and monitoring with TensorBoard
- Hyperparameter tuning support

---

## 3. Installation

### Prerequisites

- Python 3.8+
- pip

### Clone the Repository

```bash
git clone https://github.com/yourusername/rl-trading.git
cd rl-trading
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Getting Started

### Quick Start

1. Prepare your market data (see [Data Preparation](#data-preparation))
2. Configure your environment and agent
3. Train the agent:

```bash
python train.py --config configs/dqn_config.yaml
```

4. Evaluate the agent:

```bash
python evaluate.py --model saved_models/dqn_agent.pth
```

---

## 5. Project Structure

```
rl-trading/
│
├── data/                # Market data and datasets
├── envs/                # Trading environments
├── agents/              # RL agent implementations
├── utils/               # Utility scripts
├── configs/             # Configuration files
├── notebooks/           # Jupyter notebooks for exploration
├── tests/               # Unit tests
├── saved_models/        # Trained models
├── requirements.txt     # Python dependencies
├── train.py             # Training script
├── evaluate.py          # Evaluation script
└── README.md            # Project documentation
```

---

## 6. Data Preparation

### Supported Data Formats

- CSV
- Parquet

### Example Data Structure

| Date       | Open   | High   | Low    | Close  | Volume |
|------------|--------|--------|--------|--------|--------|
| 2022-01-01 | 100.0  | 105.0  | 99.0   | 104.0  | 10000  |

### Data Preprocessing

- Fill missing values
- Normalize features
- Feature engineering (e.g., technical indicators)

---

## 7. Environments

### Custom Trading Environment

Implements OpenAI Gym interface:

- `reset()`
- `step(action)`
- `render()`

### Supported Actions

- Buy
- Sell
- Hold

### Reward Function

Customizable reward functions based on profit, risk, or other metrics.

---

## 8. RL Algorithms

Supported algorithms:

- DQN (Deep Q-Network)
- PPO (Proximal Policy Optimization)
- A2C (Advantage Actor-Critic)
- Custom algorithms

Each agent is implemented in the `agents/` directory.

---

## 9. Training Agents

### Configuration

Edit YAML files in `configs/` to set hyperparameters.

### Training Script

```bash
python train.py --config configs/ppo_config.yaml
```

### Checkpoints

Models are saved in `saved_models/` after training.

---

## 10. Evaluation

Evaluate trained agents on test data:

```bash
python evaluate.py --model saved_models/ppo_agent.pth
```

Metrics:

- Total return
- Sharpe ratio
- Max drawdown

---

## 11. Visualization

Visualize trading performance:

- Equity curve
- Drawdown plot
- Action distribution

Example:

```python
from utils.visualization import plot_equity_curve
plot_equity_curve('results/equity_curve.csv')
```

---

## 12. Hyperparameter Tuning

Automated tuning with Optuna:

```bash
python tune.py --config configs/tune_config.yaml
```

---

## 13. Logging and Monitoring

- TensorBoard integration
- CSV logging

Start TensorBoard:

```bash
tensorboard --logdir runs/
```

---

## 14. Backtesting

Backtest strategies on historical data:

```bash
python backtest.py --model saved_models/a2c_agent.pth
```

---

## 15. Deployment

Export trained models for deployment:

```bash
python export.py --model saved_models/ppo_agent.pth --format onnx
```

---

## 16. Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 17. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 18. References

- [OpenAI Gym](https://gym.openai.com/)
- [Stable Baselines3](https://github.com/DLR-RM/stable-baselines3)
- [Optuna](https://optuna.org/)
- [Pandas](https://pandas.pydata.org/)

---

## 19. Contact

For questions or support, please open an issue or contact [your.email@example.com](mailto:your.email@example.com).

---

## Appendix: Example Config File

```yaml
env:
    name: TradingEnv
    data_path: data/market_data.csv
    initial_balance: 10000
    transaction_cost: 0.001

agent:
    type: DQN
    gamma: 0.99
    learning_rate: 0.0005
    batch_size: 64
    epsilon_start: 1.0
    epsilon_end: 0.01
    epsilon_decay: 0.995

training:
    episodes: 1000
    max_steps: 200
    save_every: 50
```

---

## Frequently Asked Questions

**Q: What markets can I use this for?**  
A: Any market with historical price data (stocks, crypto, forex, etc.).

**Q: Can I add new RL algorithms?**  
A: Yes, implement your agent in `agents/` and update the config.

**Q: How do I use my own data?**  
A: Place your data in `data/` and update the config file.

---

## Example Usage in Jupyter Notebook

```python
from agents.dqn_agent import DQNAgent
from envs.trading_env import TradingEnv

env = TradingEnv('data/market_data.csv')
agent = DQNAgent(env.observation_space, env.action_space)
agent.train(env, episodes=100)
```

---

## Changelog

- v1.0.0: Initial release
- v1.1.0: Added PPO and A2C support
- v1.2.0: Improved visualization tools

---

## Acknowledgements

- OpenAI for Gym
- Contributors to Stable Baselines3
- Community feedback

---
=======
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
>>>>>>> 7931766bed67d5fc64a77f8838d32379c9443116
