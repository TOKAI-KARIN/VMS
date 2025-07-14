import React, { useEffect, useState } from 'react';
import { vehicles } from '../utils/api';
import { Paper, Typography, Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Select, MenuItem, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const qrParts = [
  { key: 'parts2', label: '型式・類別' },
  { key: 'parts22', label: '車台番号' },
  { key: 'parts5', label: '型式' },
  { key: 'parts23', label: '原動機型式' },
  { key: 'parts3', label: '電子車検証期限' },
  { key: 'parts4', label: '初年度登録年月' },
  { key: 'parts12', label: '駆動方式' },
  //{ key: 'parts17', label: '保安基準適応年月日' },
  { key: 'parts18', label: '燃料の種類' },
  { key: 'parts20', label: '自動車登録番号' },
  //{ key: 'parts21', label: 'ナンバープレートサイズ' },
  //{ key: 'parts22', label: '車台番号' },
  
];

const VehicleList = () => {
  const [vehicleList, setVehicleList] = useState([]);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadVehicles();
    // 管理者・従業員のみ顧客リスト取得
    if (user && user.role !== 'customer') {
      vehicles.getCustomers().then(setCustomers).catch(() => {});
    }
  }, [user]);

  const loadVehicles = () => {
    vehicles.getAll().then(res => setVehicleList(res.data)).catch(() => {});
  };

  // 検索フィルタリング（顧客名と車両情報で検索）
  const filtered = vehicleList.filter(vehicle =>
    [
      vehicle.customer?.displayName || '',
      ...qrParts.map(part => vehicle[part.key] || '')
    ]
      .some(val => val.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const handleEdit = (id) => {
    setEditId(id);
    setEditData(vehicleList.find(v => v.id === id));
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    try {
      await vehicles.update(editId, editData);
      setSnackbar({ open: true, message: '更新しました', severity: 'success' });
      setEditId(null);
      loadVehicles();
    } catch {
      setSnackbar({ open: true, message: '更新に失敗しました', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await vehicles.delete(deleteId);
      setSnackbar({ open: true, message: '削除しました', severity: 'success' });
      setDeleteId(null);
      loadVehicles();
    } catch {
      setSnackbar({ open: true, message: '削除に失敗しました', severity: 'error' });
    }
  };

  const showCustomerColumn = user && user.role !== 'customer';

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
          >
            ダッシュボードに戻る
          </Button>
          <Typography variant="h5" component="h1">
            {user?.role === 'employee' ? '所属拠点の車両一覧' : '車両一覧'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="検索"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          {user && user.role !== 'customer' && (
            <Button
              variant="contained"
              onClick={() => navigate('/order-register')}
            >
              注文登録
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
          <thead>
            <tr>
              {showCustomerColumn && (
                <th style={{ borderBottom: '1px solid #ccc', padding: 4, background: '#f5f5f5', position: 'sticky', top: 0 }}>顧客名</th>
              )}
              {qrParts.map(col => (
                <th key={col.key} style={{ borderBottom: '1px solid #ccc', padding: 4, background: '#f5f5f5', position: 'sticky', top: 0 }}>{col.label}</th>
              ))}
              <th style={{ borderBottom: '1px solid #ccc', padding: 4, background: '#f5f5f5', position: 'sticky', top: 0 }}>登録日時</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 4, background: '#f5f5f5', position: 'sticky', top: 0 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(vehicle => (
              <tr key={vehicle.id}>
                {showCustomerColumn && (
                  <td style={{ borderBottom: '1px solid #eee', padding: 4 }}>
                    {editId === vehicle.id ? (
                      <Select
                        value={editData.customerId || ''}
                        onChange={e => handleEditChange('customerId', e.target.value)}
                        size="small"
                        variant="standard"
                        sx={{ minWidth: 120 }}
                      >
                        {customers.map(c => (
                          <MenuItem key={c.id} value={c.id}>{c.displayName || c.username}</MenuItem>
                        ))}
                      </Select>
                    ) : (
                      vehicle.customer?.displayName || '-'
                    )}
                  </td>
                )}
                {qrParts.map(col => (
                  <td key={col.key} style={{ borderBottom: '1px solid #eee', padding: 4 }}>
                    {editId === vehicle.id ? (
                      <TextField
                        value={editData[col.key] || ''}
                        onChange={e => handleEditChange(col.key, e.target.value)}
                        size="small"
                        variant="standard"
                        sx={{ minWidth: 80 }}
                      />
                    ) : (
                      vehicle[col.key] || ''
                    )}
                  </td>
                ))}
                <td style={{ borderBottom: '1px solid #eee', padding: 4 }}>{vehicle.createdAt ? vehicle.createdAt.replace('T', ' ').slice(0, 19) : '-'}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 4, minWidth: 120 }}>
                  {editId === vehicle.id ? (
                    <>
                      <Button size="small" onClick={handleEditSave}>保存</Button>
                      <Button size="small" onClick={() => setEditId(null)}>キャンセル</Button>
                    </>
                  ) : (
                    <>
                      <Button size="small" onClick={() => handleEdit(vehicle.id)}>編集</Button>
                      <Button size="small" color="error" onClick={() => setDeleteId(vehicle.id)}>削除</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>車両の削除</DialogTitle>
        <DialogContent>
          <Typography>この車両を削除してもよろしいですか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>キャンセル</Button>
          <Button color="error" onClick={handleDelete}>削除</Button>
        </DialogActions>
      </Dialog>
      {/* スナックバー */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VehicleList; 