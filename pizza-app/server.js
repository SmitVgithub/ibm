const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const menu = [
  { id: 1, name: 'Margherita', price: 9.99, image: '🍕', description: 'Classic tomato & mozzarella' },
  { id: 2, name: 'Pepperoni', price: 12.99, image: '🍕', description: 'Loaded with pepperoni' },
  { id: 3, name: 'BBQ Chicken', price: 13.99, image: '🍕', description: 'Smoky BBQ with grilled chicken' },
  { id: 4, name: 'Veggie Supreme', price: 11.99, image: '🍕', description: 'Fresh garden vegetables' },
  { id: 5, name: 'Four Cheese', price: 14.99, image: '🍕', description: 'Mozzarella, cheddar, gouda, parmesan' },
  { id: 6, name: 'Hawaiian', price: 12.49, image: '🍕', description: 'Ham & pineapple' }
];

const orders = [];
let orderIdCounter = 1;

app.get('/api/menu', (req, res) => res.json(menu));

app.post('/api/orders', (req, res) => {
  const { items, address, phone, size } = req.body;
  if (!items || !items.length || !address || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const total = items.reduce((sum, item) => {
    const menuItem = menu.find(m => m.id === item.id);
    return sum + (menuItem ? menuItem.price * item.qty : 0);
  }, 0);
  const order = {
    id: orderIdCounter++,
    items,
    address,
    phone,
    size: size || 'medium',
    total: total.toFixed(2),
    status: 'confirmed',
    estimatedTime: '25-35 mins',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  res.status(201).json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.listen(PORT, () => console.log(`Pizza app running on port ${PORT}`));
