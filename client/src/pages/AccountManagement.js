import React, { useEffect, useState } from 'react';
import { users, auth, locations } from '../utils/api';
import { Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Alert, Snackbar, Tabs, Tab, Divider, IconButton, Tooltip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';

function randomPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < length; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

// 拠点追加・編集用バリデーション関数
function validateLocation(data) {
  if (!data.locationName || !data.locationName.trim()) return '拠点名は必須です';
  if (!data.address || !data.address.trim()) return '住所は必須です';
  if (!data.phone || !/^0\d{1,4}-\d{1,4}-\d{3,4}$/.test(data.phone)) return '電話番号は「000-0000-0000」形式で入力してください';
  return '';
}

const AccountManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const [locationList, setLocationList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [openAdd, setOpenAdd] = useState(false);
  const [addData, setAddData] = useState({ locationName: '', address: '', phone: '', lineworksUserId: '' });
  const [resetDialog, setResetDialog] = useState({ open: false, user: null, newPass: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDeleteDialog, setLocationDeleteDialog] = useState({ open: false, id: null });

  // 管理者アカウント情報
  const adminAccount = {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: '管理者'
  };

  useEffect(() => {
    loadCustomers();
    loadLocations();
  }, [user]);

  const loadCustomers = async () => {
    try {
      const res = await users.getUsers();
      let data = res.data;
      if (['PA', '店頭PA', '店長'].includes(user.role)) {
        data = data.filter(u => u.locationId === user.locationId);
      }
      setCustomers(data);
    } catch (error) {
      setError('ユーザー一覧の取得に失敗しました。');
    }
  };

  const loadLocations = async () => {
    try {
      const res = await locations.getAll();
      const map = {};
      res.data.forEach(loc => {
        map[loc.id] = loc.name;
      });
      setLocationMap(map);
      setLocationList(res.data);
    } catch (error) {
      setError('拠点情報の取得に失敗しました。');
    }
  };

  const handleEdit = (id) => {
    setEditId(id);
    setEditData(customers.find(u => u.id === id));
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    try {
      await users.updateUser(editId, editData);
      await loadCustomers();
      setEditId(null);
      setSuccess('顧客情報を更新しました。');
    } catch (error) {
      setError('顧客情報の更新に失敗しました。');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('この顧客を削除してもよろしいですか？')) {
      return;
    }
    try {
      await users.deleteUser(id);
      await loadCustomers();
      setSuccess('顧客を削除しました。');
    } catch (error) {
      setError('顧客の削除に失敗しました。');
    }
  };

  const handleAdd = async () => {
    try {
      await users.createUser(addData);
      await loadCustomers();
      setOpenAdd(false);
      setAddData({ locationName: '', address: '', phone: '', lineworksUserId: '' });
      setSuccess('顧客を追加しました。');
    } catch (error) {
      setError('顧客の追加に失敗しました。');
    }
  };

  const handleResetPassword = async (u) => {
    try {
      const newPass = randomPassword();
      await auth.resetPassword(u.username, newPass);
      
      // 成功したらダイアログを表示
      setResetDialog({ open: true, user: u, newPass });
      setSuccess('パスワードをリセットしました。');
      
      // ユーザー一覧を更新
      await loadCustomers();
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      const errorMessage = error.response?.data?.message || 'パスワードのリセットに失敗しました。';
      setError(errorMessage);
    }
  };

  const handleLocationAdd = async () => {
    console.log('handleLocationAdd', addData);
    const err = validateLocation(addData);
    console.log('validateLocation result', err);
    if (err) {
      setError(err);
      return;
    }
    try {
      const newLocation = {
        id: `LOC${Date.now()}`,
        name: addData.locationName,
        address: addData.address,
        phone: addData.phone,
        lineworksUserId: addData.lineworksUserId || null
      };
      console.log('API呼び出し前', newLocation);
      await locations.create(newLocation);
      console.log('API呼び出し後');
      await loadLocations();
      setOpenAdd(false);
      setAddData({ locationName: '', address: '', phone: '', lineworksUserId: '' });
      setSuccess('拠点を追加しました。');
    } catch (error) {
      console.error('APIエラー', error);
      setError('拠点の追加に失敗しました。');
    }
  };

  const handleLocationEdit = async (id) => {
    const err = validateLocation(editData);
    if (err) {
      setError(err);
      return;
    }
    try {
      await locations.update(id, {
        name: editData.name,
        address: editData.address,
        phone: editData.phone,
        lineworksUserId: editData.lineworksUserId || null
      });
      await loadLocations();
      setEditId(null);
      setSuccess('拠点情報を更新しました。');
    } catch (error) {
      setError('拠点情報の更新に失敗しました。');
    }
  };

  const handleLocationDelete = (id) => {
    setLocationDeleteDialog({ open: true, id });
  };

  const confirmLocationDelete = async () => {
    try {
      await locations.delete(locationDeleteDialog.id);
      await loadLocations();
      setSuccess('拠点を削除しました。');
    } catch (error) {
      setError('拠点の削除に失敗しました。');
    }
    setLocationDeleteDialog({ open: false, id: null });
  };

  const handleTestNotification = async (locationId) => {
    try {
      await locations.testNotification(locationId);
      setSuccess('テスト通知を送信しました。');
    } catch (error) {
      setError('テスト通知の送信に失敗しました。');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate(-1)}>ダッシュボードに戻る</Button>
      <Typography variant="h5" gutterBottom>アカウント管理</Typography>

      {/* タブ切り替え */}
      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="ユーザー管理" />
        <Tab label="拠点管理" />
      </Tabs>

      {/* 顧客管理タブ */}
      {tabValue === 0 && (
        <>
          <Button variant="contained" sx={{ mb: 2 }} onClick={() => setOpenAdd(true)}>新規ユーザー追加</Button>
          <Paper sx={{ p: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>ユーザー名</TableCell>
                  <TableCell>表示名</TableCell>
                  <TableCell>権限</TableCell>
                  <TableCell>拠点</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{editId === u.id ? <TextField value={editData.username} onChange={e => handleEditChange('username', e.target.value)} size="small" /> : u.username}</TableCell>
                    <TableCell>{editId === u.id ? <TextField value={editData.displayName} onChange={e => handleEditChange('displayName', e.target.value)} size="small" /> : u.displayName}</TableCell>
                    <TableCell>{editId === u.id ? (
                      <Select value={editData.role || ''} onChange={e => handleEditChange('role', e.target.value)} size="small">
                        <MenuItem value="admin">管理者</MenuItem>
                        <MenuItem value="店長">店長</MenuItem>
                        <MenuItem value="PA">PA</MenuItem>
                        <MenuItem value="店頭PA">店頭PA</MenuItem>
                        <MenuItem value="customer">顧客</MenuItem>
                      </Select>
                    ) : (
                      u.role === 'admin' ? '管理者' : u.role === '店長' ? '店長' : u.role === 'PA' ? 'PA' : u.role === '店頭PA' ? '店頭PA' : '顧客'
                    )}</TableCell>
                    <TableCell>
                      {editId === u.id ? (
                        <Select
                          value={editData.locationId || ''}
                          onChange={e => handleEditChange('locationId', e.target.value)}
                          size="small"
                          fullWidth
                        >
                          {Object.entries(locationMap).map(([id, name]) => (
                            <MenuItem key={id} value={id}>{name}</MenuItem>
                          ))}
                        </Select>
                      ) : (
                        locationMap[u.locationId] || u.locationId
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === u.id ? (
                        <>
                          <Button size="small" onClick={handleEditSave}>保存</Button>
                          <Button size="small" onClick={() => setEditId(null)}>キャンセル</Button>
                        </>
                      ) : (
                        <>
                          <Button size="small" onClick={() => handleEdit(u.id)}>編集</Button>
                          <Button size="small" color="error" onClick={() => handleDelete(u.id)}>削除</Button>
                          {user.role === 'admin' && (
                            <Button size="small" color="secondary" onClick={() => handleResetPassword(u)}>パスワードリセット</Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* 拠点管理タブ */}
      {tabValue === 1 && (
        <>
          <Button variant="contained" sx={{ mb: 2 }} onClick={() => {
            setAddData({ locationName: '', address: '', phone: '', lineworksUserId: '' });
            setOpenAdd(true);
          }}>新規拠点追加</Button>
          <Paper sx={{ p: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>拠点名</TableCell>
                  <TableCell>住所</TableCell>
                  <TableCell>電話番号</TableCell>
                  <TableCell>LINE WORKS</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locationList.map(loc => (
                  <TableRow key={loc.id}>
                    <TableCell>{loc.id}</TableCell>
                    <TableCell>{editId === loc.id ? <TextField value={editData.name} onChange={e => handleEditChange('name', e.target.value)} size="small" /> : loc.name}</TableCell>
                    <TableCell>{editId === loc.id ? <TextField value={editData.address} onChange={e => handleEditChange('address', e.target.value)} size="small" /> : loc.address}</TableCell>
                    <TableCell>{editId === loc.id ? <TextField value={editData.phone} onChange={e => handleEditChange('phone', e.target.value)} size="small" placeholder="000-0000-0000" /> : loc.phone}</TableCell>
                    <TableCell>
                      {editId === loc.id ? (
                        <TextField 
                          value={editData.lineworksUserId || ''} 
                          onChange={e => handleEditChange('lineworksUserId', e.target.value)} 
                          size="small" 
                          placeholder="LINE WORKSユーザーID"
                          fullWidth
                        />
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            {loc.lineworksUserId || '未設定'}
                          </Typography>
                          {loc.lineworksUserId && (
                            <Tooltip title="テスト通知を送信">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleTestNotification(loc.id)}
                              >
                                <NotificationsIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === loc.id ? (
                        <>
                          <Button size="small" onClick={() => handleLocationEdit(loc.id)}>保存</Button>
                          <Button size="small" onClick={() => setEditId(null)}>キャンセル</Button>
                        </>
                      ) : (
                        <>
                          <Button size="small" onClick={() => {
                            setEditId(loc.id);
                            setEditData(loc);
                          }}>編集</Button>
                          <Button size="small" color="error" onClick={() => handleLocationDelete(loc.id)}>削除</Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {/* 拠点削除確認ダイアログ */}
          <Dialog open={locationDeleteDialog.open} onClose={() => setLocationDeleteDialog({ open: false, id: null })}>
            <DialogTitle>拠点の削除</DialogTitle>
            <DialogContent>
              <Typography>この拠点を削除してもよろしいですか？</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLocationDeleteDialog({ open: false, id: null })}>キャンセル</Button>
              <Button color="error" onClick={confirmLocationDelete}>削除</Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* 新規追加ダイアログ */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{tabValue === 0 ? 'ユーザー新規追加' : '拠点新規追加'}</DialogTitle>
        <DialogContent>
          {tabValue === 0 ? (
            <>
              <TextField label="ユーザー名" fullWidth margin="dense" value={addData.username} onChange={e => setAddData({ ...addData, username: e.target.value })} />
              <TextField label="表示名" fullWidth margin="dense" value={addData.displayName} onChange={e => setAddData({ ...addData, displayName: e.target.value })} />
              <TextField label="パスワード" fullWidth margin="dense" value={addData.password} onChange={e => setAddData({ ...addData, password: e.target.value })} />
              <Select
                label="拠点"
                fullWidth
                margin="dense"
                value={addData.locationId}
                onChange={e => setAddData({ ...addData, locationId: e.target.value })}
              >
                {Object.entries(locationMap).map(([id, name]) => (
                  <MenuItem key={id} value={id}>{name}</MenuItem>
                ))}
              </Select>
            </>
          ) : (
            <>
              <TextField label="拠点名" fullWidth margin="dense" value={addData.locationName} onChange={e => setAddData({ ...addData, locationName: e.target.value })} />
              <TextField label="住所" fullWidth margin="dense" value={addData.address} onChange={e => setAddData({ ...addData, address: e.target.value })} />
              <TextField label="電話番号" fullWidth margin="dense" value={addData.phone} onChange={e => setAddData({ ...addData, phone: e.target.value })} placeholder="000-0000-0000" />
              <TextField 
                label="LINE WORKSユーザーID" 
                fullWidth 
                margin="dense" 
                value={addData.lineworksUserId} 
                onChange={e => setAddData({ ...addData, lineworksUserId: e.target.value })} 
                placeholder="通知先のLINE WORKSユーザーID"
                helperText="注文通知を受け取るLINE WORKSユーザーIDを設定してください"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>キャンセル</Button>
          <Button onClick={tabValue === 0 ? handleAdd : handleLocationAdd} variant="contained">追加</Button>
        </DialogActions>
      </Dialog>

      {/* パスワードリセットダイアログ */}
      <Dialog 
        open={resetDialog.open} 
        onClose={() => setResetDialog({ open: false, user: null, newPass: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>パスワードリセット</DialogTitle>
        <DialogContent>
          {resetDialog.user && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {resetDialog.user.displayName || resetDialog.user.username} の新しいパスワード
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                {resetDialog.newPass}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                このパスワードを該当ユーザーに直接伝えてください。
                ユーザーは後で自分でパスワードを変更することができます。
              </Typography>
              <Alert severity="info">
                このパスワードは一度だけ表示されます。必ずメモを取ってください。
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResetDialog({ open: false, user: null, newPass: '' })}
            variant="contained"
          >
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* エラーメッセージ */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      {/* 成功メッセージ */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountManagement; 