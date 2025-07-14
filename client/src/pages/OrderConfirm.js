import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { orders } from '../utils/api';
import { Container, Paper, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const OrderConfirm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // 店頭PA、admin、店長ロールでなければアクセスを禁止
    if (user && !['店頭PA', 'admin', '店長'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchOrders = () => {
    orders.getAll().then(res => {
      // '受注'ステータスの注文のみフィルタリング
      const filteredOrders = res.data.filter(order => order.status === '受注');
      setOrderList(filteredOrders);
    }).catch(err => {
      setSnackbar({ open: true, message: '注文情報の取得に失敗しました', severity: 'error' });
    });
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleConfirm = async (orderId) => {
    try {
      await orders.confirm(orderId);
      setSnackbar({ open: true, message: `注文(ID: ${orderId})を注文済みにしました`, severity: 'success' });
      fetchOrders(); // 一覧を再取得
    } catch (e) {
      setSnackbar({ open: true, message: '更新に失敗しました', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2, mt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
          <Typography variant="h5">受注回答</Typography>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            ダッシュボードに戻る
          </Button>
        </Box>
      </Box>
      <Paper sx={{ p: { xs: 1, sm: 3 } }}>
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 600, sm: 800 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>注文日</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>顧客名</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>車両情報</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>注文内容</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderList.map(order => (
                <TableRow key={order.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{order.orderDate}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{order.customer?.displayName}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>{order.vehicle?.parts20 || order.vehicle?.licensePlate}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>
                    {order.diskPad && `ディスクパッド: ${order.diskPad} `}
                    {order.brakeShoe && `ブレーキシュー: ${order.brakeShoe} `}
                    {/* 他の項目も必要に応じて表示 */}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '1rem' }, px: { xs: 1, sm: 2 } }}>
                    <Button
                      variant="contained"
                      onClick={() => handleConfirm(order.id)}
                      size="small"
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2 }
                      }}
                    >
                      注文済みにする
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OrderConfirm; 