import numpy as np
import pickle
import os

class QLearningAgent:
    def __init__(
        self,
        action_size,
        state_size=3,
        learning_rate=0.1,
        discount_factor=0.95,
        exploration_rate=1.0,
        exploration_decay=0.995,
        min_exploration=0.01,
        discretization=None,
    ):
        self.action_size = int(action_size)
        self.state_size = int(state_size)
        self.q_table = {}
        self.lr = float(learning_rate)
        self.gamma = float(discount_factor)
        self.epsilon = float(exploration_rate)
        self.epsilon_decay = float(exploration_decay)
        self.epsilon_min = float(min_exploration)

        self.discretization = discretization or {
            "price_bin": 5.0,
            "balance_bin": 50.0,
            "position_bin": 1.0,
        }

    def _discretize_state(self, state):
        price, balance, position = state
        pb = self.discretization["price_bin"]
        bb = self.discretization["balance_bin"]
        return (
            float(np.round(price / pb) * pb),
            float(np.round(balance / bb) * bb),
            int(round(position)),
        )

    def choose_action(self, state):
        ds = self._discretize_state(state)
        if np.random.rand() < self.epsilon:
            return int(np.random.choice(self.action_size))
        q_values = self.q_table.get(ds)
        if q_values is None:
            return int(np.random.choice(self.action_size))
        return int(np.argmax(q_values))

    def learn(self, state, action, reward, next_state, done=False):
        ds = self._discretize_state(state)
        dsn = self._discretize_state(next_state)

        if ds not in self.q_table:
            self.q_table[ds] = np.zeros(self.action_size, dtype=float)
        if dsn not in self.q_table:
            self.q_table[dsn] = np.zeros(self.action_size, dtype=float)

        current_q = self.q_table[ds][action]
        if done:
            target = reward
        else:
            target = reward + self.gamma * np.max(self.q_table[dsn])
        self.q_table[ds][action] = current_q + self.lr * (target - current_q)

    def decay_epsilon(self):
        if self.epsilon > self.epsilon_min:
            self.epsilon = max(self.epsilon * self.epsilon_decay, self.epsilon_min)

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self.q_table, f)

    def load(self, path):
        if os.path.exists(path):
            with open(path, "rb") as f:
                self.q_table = pickle.load(f)
        else:
            raise FileNotFoundError(f"Q-table not found at {path}")
