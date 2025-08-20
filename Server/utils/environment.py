import numpy as np

class TradingEnv:
    def __init__(self, data, initial_balance=1000):
        self.data = np.asarray(data)
        self.initial_balance = initial_balance
        self.reset()

    def reset(self):
        self.balance = self.initial_balance
        self.position = 0
        self.current_step = 0
        return self._get_state()

    def _get_state(self):
        # Simple state: [current_price, balance, position]
        return np.array([self.data[self.current_step], self.balance, self.position])

    def step(self, action):
        done = False
        price = self.data[self.current_step]
        # Actions: 0 = Hold, 1 = Buy, 2 = Sell
        if action == 1 and self.balance >= price:
            self.position += 1
            self.balance -= price
        elif action == 2 and self.position > 0:
            self.position -= 1
            self.balance += price
            
        reward = self.balance + self.position * price - self.initial_balance
        self.current_step += 1
        if self.current_step >= len(self.data):
            done = True
            next_state = np.array([price, self.balance, self.position])
        else:
            next_state = self._get_state()
        return next_state, reward, done, {}
