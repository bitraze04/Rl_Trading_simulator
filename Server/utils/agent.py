import numpy as np
import pickle
import os

class QLearningAgent:
    def __init__(self, action_size, state_size=3, learning_rate=0.1, discount_factor=0.95,
                 exploration_rate=1.0, exploration_decay=0.995, min_exploration=0.01):
        self.action_size = action_size
        self.state_size = state_size
        self.q_table = {}  # dict of discretized_state: np.array(action_size)
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = exploration_rate
        self.epsilon_decay = exploration_decay
        self.epsilon_min = min_exploration

    def _discretize_state(self, state):
        # Rounds floating values: reduces state space explosion
        return tuple(np.round(state, 2))

    def choose_action(self, state):
        state = self._discretize_state(state)
        # ε-greedy exploration
        if np.random.rand() < self.epsilon:
            return np.random.choice(self.action_size)
        return np.argmax(self.q_table.get(state, np.zeros(self.action_size)))

    def learn(self, state, action, reward, next_state):
        state = self._discretize_state(state)
        next_state = self._discretize_state(next_state)

        if state not in self.q_table:
            self.q_table[state] = np.zeros(self.action_size)
        if next_state not in self.q_table:
            self.q_table[next_state] = np.zeros(self.action_size)

        target = reward + self.gamma * np.max(self.q_table[next_state])
        self.q_table[state][action] += self.lr * (target - self.q_table[state][action])

        # Decay epsilon but never lower than minimum
        if self.epsilon > self.epsilon_min:
            self.epsilon = max(self.epsilon * self.epsilon_decay, self.epsilon_min)

    def save(self, path):
        with open(path, "wb") as f:
            pickle.dump(self.q_table, f)

    def load(self, path):
        if os.path.exists(path):
            with open(path, "rb") as f:
                self.q_table = pickle.load(f)
        else:
            raise FileNotFoundError(f"Q-table not found at {path}")
