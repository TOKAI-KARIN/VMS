const express = require('express');
const router = express.Router();
const { Customer } = require('../models');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// 顧客一覧の取得
router.get('/', (req, res, next) => {
  auth(req, res, next);
}, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(customers);
  } catch (error) {
    console.error('GET /api/customers error:', error);
    res.status(500).json({ message: '顧客情報の取得に失敗しました。' });
  }
});

// 顧客の作成
router.post('/', (req, res, next) => {
  auth(req, res, next);
}, (req, res, next) => {
  authorize('admin')(req, res, next);
}, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const customer = await Customer.create({
      name,
      email,
      phone,
      address
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error('POST /api/customers error:', error);
    res.status(500).json({ message: '顧客の作成に失敗しました。' });
  }
});

// 顧客の更新
router.put('/:id', (req, res, next) => {
  auth(req, res, next);
}, (req, res, next) => {
  authorize('admin')(req, res, next);
}, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: '顧客が見つかりません。' });
    }
    const { name, email, phone, address } = req.body;
    await customer.update({
      name,
      email,
      phone,
      address
    });
    res.json(customer);
  } catch (error) {
    console.error('PUT /api/customers/:id error:', error);
    res.status(500).json({ message: '顧客の更新に失敗しました。' });
  }
});

// 顧客の削除（論理削除）
router.delete('/:id', (req, res, next) => {
  auth(req, res, next);
}, (req, res, next) => {
  authorize('admin')(req, res, next);
}, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: '顧客が見つかりません。' });
    }
    await customer.update({ isActive: false });
    res.json({ message: '顧客が削除されました。' });
  } catch (error) {
    console.error('DELETE /api/customers/:id error:', error);
    res.status(500).json({ message: '顧客の削除に失敗しました。' });
  }
});

module.exports = router; 