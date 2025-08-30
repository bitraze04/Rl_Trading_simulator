import numpy as np

class TradingEnv:
    def __init__(self, data, initial_balance=1000, tx_cost=0.0):
        self.data = np.asarray(data, dtype=float)
        self.initial_balance = float(initial_balance)
        self.tx_cost = float(tx_cost)
        self.reset()

    def reset(self):
        self.balance = float(self.initial_balance)
        self.position = 0
        self.current_step = 0
        self.last_value = self.initial_balance
        return self._get_state()

    def _get_state(self):
        price = self.data[self.current_step]
        return np.array([price, self.balance, self.position], dtype=float)

    def step(self, action):
        done = False
        price = self.data[self.current_step]

        if action == 1:
            total_cost = price * (1.0 + self.tx_cost)
            if self.balance >= total_cost:
                self.position += 1
                self.balance -= total_cost
        elif action == 2:
            if self.position > 0:
                proceeds = price * (1.0 - self.tx_cost)
                self.position -= 1
                self.balance += proceeds

        current_value = self.balance + self.position * price
        reward = current_value - self.last_value
        self.last_value = current_value

        self.current_step += 1
        if self.current_step >= len(self.data):
            done = True
            next_state = np.array([price, self.balance, self.position], dtype=float)
        else:
            next_state = self._get_state()

        return next_state, float(reward), done, {}
