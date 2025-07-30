import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import json

# Ensure local 'utils' import works
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.environment import TradingEnv
from utils.agent import QLearningAgent

# --- Argument Parsing (for API integration) ---
DATA_PATH = "data/gmedata.csv"
MODEL_PATH = "models/q_table.pkl"
RESULTS_DIR = "results"
EPISODES = 50

if len(sys.argv) > 1:
    try:
        params = json.loads(sys.argv[1])
        DATA_PATH = params.get("dataPath", DATA_PATH)
        EPISODES = int(params.get("episodes", EPISODES))
    except Exception:
        DATA_PATH = sys.argv[1]  # fallback: first arg is data path

# --- Load Historical Data ---
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Data file not found at {DATA_PATH}")

df = pd.read_csv(DATA_PATH)
df = df[::-1].reset_index(drop=True)
if "Close" not in df.columns:
    raise ValueError("CSV must contain a column named 'Close'")
prices = df["Close"].values

# --- Create Environment and Agent ---
env = TradingEnv(data=prices)
agent = QLearningAgent(action_size=3)

# --- Training Loop ---
for episode in range(EPISODES):
    state = env.reset()
    done = False
    while not done:
        action = agent.choose_action(state)
        next_state, reward, done, _ = env.step(action)
        agent.learn(state, action, reward, next_state)
        state = next_state
    if (episode + 1) % 100 == 0:
        print(f"Episode {episode + 1}/{EPISODES} completed")

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
agent.save(MODEL_PATH)

# --- Test the Trained Model ---
env = TradingEnv(data=prices)
agent.load(MODEL_PATH)
state = env.reset()
done = False
balance_history = []

while not done:
    action = agent.choose_action(state)
    next_state, reward, done, _ = env.step(action)
    state = next_state
    price = prices[min(env.current_step - 1, len(prices) - 1)]
    total_balance = env.balance + env.position * price
    balance_history.append(total_balance)

# --- Plot Portfolio Value ---
os.makedirs(RESULTS_DIR, exist_ok=True)
plt.figure(figsize=(10, 6))
plt.plot(balance_history, label="Portfolio Value", color="green")
plt.title("Agent’s Trading Performance")
plt.xlabel("Time Step")
plt.ylabel("Total Portfolio Balance")
plt.legend()
plt.grid(True)
plt.savefig(os.path.join(RESULTS_DIR, "trading_plot.png"))
plt.close()  # Use plt.close() to avoid issues in batch runs

# --- Save results for backend API consumption ---
result_json = {
    "portfolioHistory": balance_history,
    "finalBalance": balance_history[-1] if balance_history else None,
    "totalReward": (balance_history[-1] - env.initial_balance) if balance_history else None,
    "episodesCompleted": EPISODES
}
with open(os.path.join(RESULTS_DIR, "results.json"), "w") as f_out:
    json.dump(result_json, f_out)
