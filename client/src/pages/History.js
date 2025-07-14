import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { orders } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortField, setSortField] = useState('orderDate');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    if (!user) return;
    orders.getAll().then(res => {
      let data = res.data;
      // ロールごとにフィルタリング
      if (user.role === 'employee') {
        data = data.filter(o => o.locationId === user.locationId);
      } else if (user.role === 'customer') {
        data = data.filter(o => o.customerId === user.id);
      }
      setOrderList(data);
    });
  }, [user]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    // 入力値の前後空白をトリムし、全角スペースを半角に変換
    const value = event.target.value.replace(/　/g, ' ').trim();
    setSearchTerm(value);
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      // TODO: APIで注文を削除
      setOrderList(orderList.filter(order => order.id !== selectedOrder.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('注文削除エラー:', error);
    }
  };

  const filteredOrders = orderList.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    if (!searchLower) return true; // 検索語が空なら全件表示
    // すべての項目で部分一致
    return [
      String(order.id),
      order.customer?.displayName || '',
      order.vehicle?.licensePlate || '',
      order.vehicle?.parts20 || '',
      order.vehicle?.frameNumber || '',
      order.vehicle?.parts22 || ''
    ].some(field => field.toString().toLowerCase().includes(searchLower));
  });

  // ソート機能
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue, bValue;
    switch (sortField) {
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'orderDate':
        aValue = new Date(a.orderDate);
        bValue = new Date(b.orderDate);
        break;
      case 'customerName':
        aValue = a.customer?.displayName || '';
        bValue = b.customer?.displayName || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'ja')
        : bValue.localeCompare(aValue, 'ja');
    } else {
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          注文履歴
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate('/dashboard')}>ダッシュボードに戻る</Button>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="注文ID、顧客名、ナンバー、車台番号で検索"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />, 
            }}
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleSort('id')}
                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  注文ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('orderDate')}
                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  注文日 {sortField === 'orderDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('status')}
                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ステータス {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell 
                  onClick={() => handleSort('customerName')}
                  style={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  顧客名 {sortField === 'customerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableCell>
                <TableCell>ナンバー</TableCell>
                <TableCell>車台番号</TableCell>
                <TableCell>部品</TableCell>
                <TableCell>備考</TableCell>
                <TableCell>最終更新者</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status} 
                        size="small"
                        color={order.status === '注文済み' ? 'success' : order.status === 'キャンセル' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{order.customer?.displayName || '-'}</TableCell>
                    <TableCell style={{ cursor: order.vehicle?.id ? 'pointer' : 'default', color: order.vehicle?.id ? '#1976d2' : undefined }} onClick={() => order.vehicle?.id && navigate(`/vehicle/${order.vehicle.id}`)}>
                      {order.vehicle?.parts20 || order.vehicle?.licensePlate || '-'}
                    </TableCell>
                    <TableCell style={{ cursor: order.vehicle?.id ? 'pointer' : 'default', color: order.vehicle?.id ? '#1976d2' : undefined }} onClick={() => order.vehicle?.id && navigate(`/vehicle/${order.vehicle.id}`)}>
                      {order.vehicle?.parts22 || order.vehicle?.frameNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {['diskPad','brakeShoe','wiper','belt','cleanFilter','airElement','oilElement'].map(key =>
                        order[key] ? <Chip key={key} label={order[key]} size="small" sx={{ mr: 0.5, mb: 0.5 }} /> : null
                      )}
                    </TableCell>
                    <TableCell>{order.remarks}</TableCell>
                    <TableCell>{order.updatedByUser?.displayName || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/order-detail/${order.id}`)}
                        title="詳細表示"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(order)}
                        disabled={user?.role !== 'admin'}
                        title="削除"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count}`
            }
          />
        </TableContainer>

        {/* 削除確認ダイアログ */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>注文の削除</DialogTitle>
          <DialogContent>
            <Typography>
              この注文を削除してもよろしいですか？
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              注文ID: {selectedOrder?.id || '-'}
              <br />
              注文日: {selectedOrder?.orderDate}
              <br />
              顧客名: {selectedOrder?.customer?.displayName || '-'}
              <br />
              ナンバー: {selectedOrder?.vehicle?.licensePlate || '-'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleDeleteConfirm} color="error">
              削除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default History; 