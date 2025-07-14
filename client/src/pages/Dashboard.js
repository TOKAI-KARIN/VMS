import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { Button as MuiButton } from '@mui/material';
import { vehicles } from '../utils/api';
import { stats } from '../utils/api';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { DirectionsCar as DirectionsCarIcon, People as PeopleIcon, Lock as LockIcon } from '@mui/icons-material';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalVehicles: 0,
    totalOrders: 0,
    recentOrders: [],
  });
  const [vehicleList, setVehicleList] = useState([]);

  const qrParts = [
    { key: 'parts20', label: 'ナンバー' },
    { key: 'parts22', label: '車台番号' },
    { key: 'parts5', label: '型式' },
    { key: 'parts23', label: 'エンジン型式' },
    { key: 'parts4', label: '初年度登録年月' },
  ];

  useEffect(() => {
    vehicles.getAll().then(res => {
      setVehicleList(res.data);
    }).catch(() => {});
    // 統計情報をAPIから取得
    stats.getDashboardStats().then(res => {
      setDashboardStats(res.data);
    }).catch(() => {});
    
    // デバッグ用：ユーザー情報をコンソールに出力
    console.log('Current user:', user);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const baseMenuItems = [
    {
      title: '車両一覧',
      icon: <DirectionsCarIcon />,
      path: '/vehicle-list',
      roles: ['admin', 'PA', '店頭PA', '店長', 'customer']
    },
    {
      title: 'QRコードスキャン',
      icon: <QrCodeIcon />,
      path: '/scan',
      roles: ['admin', 'PA', '店頭PA', '店長', 'customer']
    },
    {
      title: '注文履歴',
      icon: <HistoryIcon />,
      path: '/history',
      roles: ['admin', 'PA', '店頭PA', '店長', 'customer']
    },
    {
      title: 'アカウント管理',
      icon: <PeopleIcon />,
      path: '/account-management',
      roles: ['admin']
    },
    {
      title: 'パスワード変更',
      icon: <LockIcon />,
      path: '/change-password',
      roles: ['admin', 'PA', '店頭PA', '店長', 'customer']
    }
  ];

  let menuItems = [...baseMenuItems];
  
  // 注文登録メニューを追加（PA、admin、customer、店長の場合）
  if (user?.role === 'PA' || user?.role === 'admin' || user?.role === 'customer' || user?.role === '店長') {
    menuItems.splice(2, 0, {
      title: '注文登録',
      icon: <ShoppingCartIcon />,
      path: '/order-form',
      roles: ['admin', 'PA', 'customer', '店長']
    });
  }
  
  // 受注回答メニューを追加（店頭PA、admin、店長の場合）
  if (user?.role === '店頭PA' || user?.role === 'admin' || user?.role === '店長') {
    menuItems.splice(2, 0, {
      title: '受注回答',
      icon: <AddIcon />,
      path: '/order-confirm',
      roles: ['admin', '店頭PA', '店長']
    });
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* ヘッダー */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1">
                ダッシュボード
              </Typography>
              <Box>
                <Typography variant="body1" sx={{ mr: 2, display: 'inline' }}>
                  {user?.displayName} ({user?.role})
                </Typography>
                <IconButton onClick={handleLogout} color="inherit">
                  <LogoutIcon />
                </IconButton>
              </Box>
            </Box>
          </Grid>

          {/* メニューカード */}
          {menuItems
            .filter(item => {
              const hasAccess = item.roles.includes(user?.role);
              console.log(`Menu item "${item.title}": user role=${user?.role}, roles=${item.roles}, hasAccess=${hasAccess}`);
              return hasAccess;
            })
            .map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s',
                    },
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>{item.icon}</Box>
                    <Typography variant="h6" component="h2">
                      {item.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}

          {/* 統計情報 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                統計情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    登録車両数
                  </Typography>
                  <Typography variant="h4">{dashboardStats.totalVehicles}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    総注文数
                  </Typography>
                  <Typography variant="h4">{dashboardStats.totalOrders}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* 最近の注文 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                最近の注文
              </Typography>
              {dashboardStats.recentOrders && dashboardStats.recentOrders.map((order) => (
                <Box key={order.id} sx={{ mb: 2, p: 1, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {(order.customer?.displayName || '-') + ' - ' + (order.orderDate || '-') + ' - ' + (order.vehicle?.frameNumber || order.vehicle?.parts22 || '-')} 
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          {/* 車両一覧表示 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/vehicle-list')}>
                登録車両一覧
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {qrParts.map(col => (
                        <th key={col.key} style={{ borderBottom: '1px solid #ccc', padding: 4 }}>{col.label}</th>
                      ))}
                      <th style={{ borderBottom: '1px solid #ccc', padding: 4 }}>登録日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleList.map(v => (
                      <tr key={v.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/vehicle/${v.id}`)}>
                        {qrParts.map(col => (
                          <td key={col.key} style={{ borderBottom: '1px solid #eee', padding: 4 }}>{v[col.key] || ''}</td>
                        ))}
                        <td style={{ borderBottom: '1px solid #eee', padding: 4 }}>{v.createdAt ? v.createdAt.slice(0, 19).replace('T', ' ') : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;

 