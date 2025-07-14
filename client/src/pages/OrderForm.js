import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { vehicles, orders } from '../utils/api';
import { Container, Paper, Typography, Box, TextField, Button, FormControl, Snackbar, Alert, Checkbox, FormGroup, FormControlLabel, MenuItem, RadioGroup, Radio, Divider, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PhotoCamera, Delete, CameraAlt } from '@mui/icons-material';

const orderCategories = {
  'ディスクパッド': ['フロント', 'リア'],
  'ブレーキシュー': ['フロント', 'リヤ', 'リーディング', 'トレーディング', 'セット'],
  'ワイパー': ['リフィール', 'ブレード'],
  'ベルト': [''],
  'クリーンフィルター': [''],
  'エアエレメント': [''],
  'オイルエレメント': [''],
  '予備': [''],
  'その他': [''],
};

const OrderForm = () => {
  const { user } = useAuth();
  const [vehicleList, setVehicleList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [vehicleSelectionType, setVehicleSelectionType] = useState('existing'); // 'existing' or 'manual'
  const [manualVehicleData, setManualVehicleData] = useState({
    typeNumber: '',
    frameNumber: '',
    firstRegistrationDate: ''
  });
  const [checked, setChecked] = useState({}); // {category_item: true/false}
  const [quantities, setQuantities] = useState({}); // {category_item: 数量}
  const [remarks, setRemarks] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState([]); // 添付された写真の配列
  const [cameraOpen, setCameraOpen] = useState(false); // カメラ撮影モーダルの表示状態
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    // PA, admin, customer, 店長ロール以外はアクセス禁止
    if (user && !['PA', 'admin', 'customer', '店長'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    
    // 車両一覧を取得
    vehicles.getAll().then(res => {
      let list = res.data;
      if (user.role === 'employee') {
        list = list.filter(v => v.customer && v.customer.locationId === user.locationId);
      } else if (user.role === 'customer') {
        list = list.filter(v => v.customerId === user.id);
      }
      setVehicleList(list);
    });

    // 顧客ロール以外の場合は顧客一覧も取得
    if (user.role !== 'customer') {
      vehicles.getCustomers().then(customers => {
        setCustomerList(customers);
      });
    }
  }, [user]);

  // チェックボックス変更
  const handleCheck = (category, item) => (e) => {
    const key = `${category}__${item}`;
    setChecked(prev => ({ ...prev, [key]: e.target.checked }));
    if (e.target.checked && !quantities[key]) {
      setQuantities(prev => ({ ...prev, [key]: 1 }));
    }
  };

  // 数量変更
  const handleQuantity = (category, item) => (e) => {
    const key = `${category}__${item}`;
    const val = e.target.value;
    setQuantities(prev => ({ ...prev, [key]: val === '' ? '' : Number(val) }));
  };

  // 写真アップロード処理
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      // 画像ファイルのみ許可
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: `${file.name}は画像ファイルではありません`, severity: 'error' });
        return false;
      }
      // ファイルサイズ制限（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: `${file.name}のファイルサイズが大きすぎます（5MB以下）`, severity: 'error' });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setAttachedPhotos(prev => [...prev, ...validFiles]);
    }
  };

  // 写真削除処理
  const handlePhotoDelete = (index) => {
    setAttachedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // カメラ撮影処理
  const handleCameraCapture = (photoBlob) => {
    const file = new File([photoBlob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setAttachedPhotos(prev => [...prev, file]);
    setCameraOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 車両選択の検証
    if (vehicleSelectionType === 'existing' && !selectedVehicle) {
      setSnackbar({ open: true, message: '車両を選択してください', severity: 'error' });
      return;
    }
    
    if (vehicleSelectionType === 'manual') {
      if (!manualVehicleData.typeNumber || !manualVehicleData.frameNumber || !manualVehicleData.firstRegistrationDate) {
        setSnackbar({ open: true, message: '手入力車両の情報を全て入力してください', severity: 'error' });
        return;
      }
      
      // 顧客ロール以外で顧客が選択されていない場合
      if (user.role !== 'customer' && !selectedCustomer) {
        setSnackbar({ open: true, message: '顧客を選択してください', severity: 'error' });
        return;
      }
    }

    // 選択された項目のみ注文データに含める
    const orderItems = [];
    Object.keys(checked).forEach(key => {
      if (checked[key]) {
        const [category, item] = key.split('__');
        let q = quantities[key];
        if (q === '' || !q) q = 1;
        orderItems.push({ category, item, quantity: q });
      }
    });
    if (orderItems.length === 0) {
      setSnackbar({ open: true, message: '注文項目を1つ以上選択してください', severity: 'error' });
      return;
    }

    let vehicleId = selectedVehicle;
    let customerId = null;
    let locationId = null;

    if (vehicleSelectionType === 'existing') {
      // 既存車両の場合
      const selectedVehicleObj = vehicleList.find(v => v.id === selectedVehicle);
      vehicleId = selectedVehicle;
      customerId = selectedVehicleObj?.customerId;
      locationId = selectedVehicleObj?.locationId || selectedVehicleObj?.customer?.locationId || user?.locationId || null;
    } else {
      // 手入力車両の場合、まず車両を登録
      try {
        const vehiclePayload = {
          typeNumber: manualVehicleData.typeNumber,
          frameNumber: manualVehicleData.frameNumber,
          firstRegistrationDate: manualVehicleData.firstRegistrationDate,
          customerId: user?.role === 'customer' ? user.id : selectedCustomer,
          locationId: user?.locationId || null
        };
        
        const vehicleResponse = await vehicles.create(vehiclePayload);
        vehicleId = vehicleResponse.data.id;
        customerId = vehiclePayload.customerId;
        locationId = vehiclePayload.locationId;
      } catch (error) {
        setSnackbar({ open: true, message: '車両登録に失敗しました', severity: 'error' });
        return;
      }
    }

    // orderItemsを各カラムに変換
    const categoryMap = {
      'ディスクパッド': 'diskPad',
      'ブレーキシュー': 'brakeShoe',
      'ワイパー': 'wiper',
      'ベルト': 'belt',
      'クリーンフィルター': 'cleanFilter',
      'エアエレメント': 'airElement',
      'オイルエレメント': 'oilElement',
      '予備': 'belt', // 予備は適宜修正
      'その他': 'remarks',
    };
    const itemFields = {};
    orderItems.forEach(({ category, item, quantity }) => {
      const key = categoryMap[category];
      if (!key) return;
      // remarksは備考欄にまとめる
      if (key === 'remarks') {
        itemFields.remarks = (itemFields.remarks || '') + `${item}×${quantity} `;
      } else {
        const val = item ? `${item}×${quantity}` : `${category}×${quantity}`;
        itemFields[key] = itemFields[key] ? itemFields[key] + ',' + val : val;
      }
    });
    // YYYY-MM-DD形式で日付を作成
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const orderDateStr = `${yyyy}-${mm}-${dd}`;
    const payload = {
      vehicleId: vehicleId,
      customerId: customerId,
      locationId: locationId,
      ...itemFields,
      remarks: (itemFields.remarks || '') + remarks,
      orderDate: orderDateStr,
    };
    console.log('注文登録payload', payload);
    try {
      const res = await orders.create(payload);
      
      // 写真がある場合はアップロード
      if (attachedPhotos.length > 0) {
        const formData = new FormData();
        attachedPhotos.forEach((photo, index) => {
          formData.append('photos', photo);
        });
        formData.append('orderId', res.data.id);
        
        console.log('写真アップロード開始:', {
          orderId: res.data.id,
          photoCount: attachedPhotos.length,
          photos: attachedPhotos.map(p => ({ name: p.name, size: p.size, type: p.type }))
        });
        
        try {
          const uploadResponse = await axios.post(`/api/orders/${res.data.id}/photos`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log('写真アップロード成功:', uploadResponse.data);
        } catch (photoError) {
          console.error('写真アップロードエラー:', photoError);
          console.error('エラー詳細:', {
            status: photoError.response?.status,
            statusText: photoError.response?.statusText,
            data: photoError.response?.data,
            headers: photoError.response?.headers,
            config: photoError.config
          });
          
          const errorMessage = photoError.response?.data?.message || photoError.message || '写真のアップロードに失敗しました';
          setSnackbar({ open: true, message: `注文は登録されましたが、${errorMessage}`, severity: 'warning' });
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
      }
      
      setSnackbar({ open: true, message: '注文が登録されました', severity: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (e) {
      console.error('注文登録エラー:', e);
      console.error('エラー詳細:', {
        status: e.response?.status,
        statusText: e.response?.statusText,
        data: e.response?.data,
        message: e.message
      });
      
      const errorMessage = e.response?.data?.message || e.message || '登録に失敗しました';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>注文登録</Typography>
        <form onSubmit={handleSubmit}>
          {/* 車両選択方法 */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>車両選択方法</Typography>
            <RadioGroup
              value={vehicleSelectionType}
              onChange={(e) => {
                setVehicleSelectionType(e.target.value);
                setSelectedVehicle('');
                setSelectedCustomer('');
                setManualVehicleData({ typeNumber: '', frameNumber: '', firstRegistrationDate: '' });
              }}
            >
              <FormControlLabel value="existing" control={<Radio />} label="既存車両から選択" />
              <FormControlLabel value="manual" control={<Radio />} label="手入力で車両登録" />
            </RadioGroup>
          </FormControl>

          {/* 既存車両選択 */}
          {vehicleSelectionType === 'existing' && (
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <TextField
                select
                label="車両"
                value={selectedVehicle}
                onChange={e => setSelectedVehicle(e.target.value)}
                required
              >
                {vehicleList.map(v => (
                  <MenuItem key={v.id} value={v.id}>{v.customer?.displayName ? `${v.customer.displayName} - ${v.parts20 || v.licensePlate || v.id}` : v.parts20 || v.licensePlate || v.id}</MenuItem>
                ))}
              </TextField>
            </FormControl>
          )}

          {/* 手入力車両登録 */}
          {vehicleSelectionType === 'manual' && (
            <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>車両情報入力</Typography>
              
              {/* 顧客ロール以外の場合は顧客選択 */}
              {user.role !== 'customer' && (
                <FormControl fullWidth sx={{ mb: 2 }} required>
                  <TextField
                    select
                    label="顧客"
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                    required
                  >
                    {customerList.map(customer => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.displayName || customer.username}
                      </MenuItem>
                    ))}
                  </TextField>
                </FormControl>
              )}
              
              <TextField
                label="類方"
                value={manualVehicleData.typeNumber}
                onChange={(e) => setManualVehicleData(prev => ({ ...prev, typeNumber: e.target.value }))}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="車体番号"
                value={manualVehicleData.frameNumber}
                onChange={(e) => setManualVehicleData(prev => ({ ...prev, frameNumber: e.target.value }))}
                fullWidth
                required
                sx={{ mb: 2 }}
              />
              <TextField
                label="初年度登録"
                value={manualVehicleData.firstRegistrationDate}
                onChange={(e) => setManualVehicleData(prev => ({ ...prev, firstRegistrationDate: e.target.value }))}
                fullWidth
                required
              />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {Object.entries(orderCategories).map(([cat, items]) => (
            <Box key={cat} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{cat}</Typography>
              <FormGroup>
                {items.length > 0 ? items.map(item => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel
                      control={<Checkbox checked={!!checked[`${cat}__${item}`]} onChange={handleCheck(cat, item)} />}
                      label={item || cat}
                    />
                    {checked[`${cat}__${item}`] && (
                      <TextField
                        label="数量"
                        type="number"
                        value={quantities[`${cat}__${item}`] === undefined ? 1 : quantities[`${cat}__${item}`]}
                        onChange={handleQuantity(cat, item)}
                        size="small"
                        sx={{ width: 100, ml: 2 }}
                        inputProps={{ min: 1 }}
                        required
                      />
                    )}
                  </Box>
                )) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FormControlLabel
                      control={<Checkbox checked={!!checked[`${cat}__${cat}`]} onChange={handleCheck(cat, cat)} />}
                      label={cat}
                    />
                    {checked[`${cat}__${cat}`] && (
                      <TextField
                        label="数量"
                        type="number"
                        value={quantities[`${cat}__${cat}`] === undefined ? 1 : quantities[`${cat}__${cat}`]}
                        onChange={handleQuantity(cat, cat)}
                        size="small"
                        sx={{ width: 100, ml: 2 }}
                        inputProps={{ min: 1 }}
                        required
                      />
                    )}
                  </Box>
                )}
              </FormGroup>
            </Box>
          ))}
          <TextField
            label="備考"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {/* 写真アップロードセクション */}
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>写真の添付</Typography>
            
            {/* 写真アップロードボタン */}
            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                multiple
                type="file"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="photo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  sx={{ mr: 2 }}
                >
                  写真を選択
                </Button>
              </label>
              <Button
                variant="outlined"
                startIcon={<CameraAlt />}
                onClick={() => setCameraOpen(true)}
                sx={{ mr: 2 }}
              >
                カメラで撮影
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                画像ファイル（JPG、PNG等）を選択するか、カメラで撮影してください（最大5MB、複数選択可）
              </Typography>
            </Box>

            {/* 添付された写真のプレビュー */}
            {attachedPhotos.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>添付された写真（{attachedPhotos.length}枚）:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attachedPhotos.map((photo, index) => (
                    <Box key={index} sx={{ position: 'relative', width: 120, height: 120 }}>
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`添付写真 ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                          border: '1px solid #ddd'
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'error.dark',
                          }
                        }}
                        onClick={() => handlePhotoDelete(index)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mb: 2 }}>登録</Button>
          <Button variant="outlined" color="secondary" fullWidth onClick={() => navigate('/dashboard')}>ダッシュボードに戻る</Button>
        </form>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
      
      {/* カメラ撮影モーダル */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </Container>
  );
};

// カメラ撮影コンポーネント
const CameraCapture = ({ open, onClose, onCapture }) => {
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]); // 利用可能なカメラデバイス一覧
  const [selectedDeviceId, setSelectedDeviceId] = useState(null); // 選択中のカメラ
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // デバイス一覧取得
  useEffect(() => {
    if (!open) return;
    
    console.log('カメラデバイス一覧取得開始');
    
    // iPhone/SafariでのHTTPSチェック
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isHTTPS = window.location.protocol === 'https:';
    
    console.log('セキュリティチェック:', { isIOS, isSafari, isHTTPS, protocol: window.location.protocol });
    
    if (isIOS && !isHTTPS) {
      alert('iPhoneではHTTPS接続が必要です。現在の接続: ' + window.location.protocol);
      console.error('iPhoneでHTTPS以外の接続を検出');
    }
    
    navigator.mediaDevices.enumerateDevices().then((allDevices) => {
      console.log('全デバイス:', allDevices);
      
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      console.log('ビデオデバイス:', videoDevices);
      
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
        console.log('初期カメラ選択:', videoDevices[0].deviceId);
      } else if (videoDevices.length === 0) {
        // デバイスが見つからない場合、デフォルトのカメラを試行
        console.log('デバイスが見つからないため、デフォルトカメラを試行');
        startDefaultCamera();
      }
    }).catch(error => {
      console.error('デバイス一覧取得エラー:', error);
      // エラーの場合もデフォルトカメラを試行
      startDefaultCamera();
    });
  }, [open]);

  // カメラ起動・切り替え
  useEffect(() => {
    if (!open) return;
    
    console.log('カメラ切り替え:', { selectedDeviceId, devicesLength: devices.length });
    
    // 既存のストリームを停止
    stopCamera();
    
    // 少し遅延してから新しいカメラを起動
    const timer = setTimeout(() => {
      if (selectedDeviceId && devices.length > 0) {
        console.log('指定デバイスでカメラ起動:', selectedDeviceId);
        startCamera(selectedDeviceId);
      } else {
        // デバイスIDが設定されていない場合、デフォルトカメラを起動
        console.log('デフォルトカメラ起動');
        startDefaultCamera();
      }
    }, 200);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [open, selectedDeviceId, devices.length]);

  // streamが変わったらvideoにセット
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startDefaultCamera = async () => {
    try {
      console.log('デフォルトカメラ起動開始');
      
      // iPhone/Safari対応の制約設定
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      console.log('デバイス情報:', { isIOS, isSafari, userAgent: navigator.userAgent });
      
      let constraints;
      if (isIOS && isSafari) {
        // iPhone/Safari用の制約
        constraints = {
          video: { 
            facingMode: 'environment', // 背面カメラを優先
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        };
      } else {
        // その他のデバイス用
        constraints = {
          video: { 
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        };
      }
      
      console.log('デフォルトカメラ制約:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('デフォルトカメラストリーム取得成功:', mediaStream);
      console.log('ストリーム状態:', {
        active: mediaStream.active,
        tracks: mediaStream.getTracks().map(t => ({ kind: t.kind, readyState: t.readyState }))
      });
      setStream(mediaStream);
    } catch (error) {
      console.error('デフォルトカメラの起動に失敗しました:', error);
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = 'カメラへのアクセスが許可されていません。';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラを許可してください。';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'カメラが見つかりません。';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'カメラが他のアプリケーションで使用中です。';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'カメラの設定が対応していません。';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'このブラウザはカメラ機能をサポートしていません。';
      }
      
      alert(errorMessage);
    }
  };

  const startCamera = async (deviceId) => {
    try {
      console.log('カメラ起動開始:', { deviceId });
      
      const constraints = {
        video: { 
          deviceId: { exact: deviceId },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          facingMode: deviceId.includes('back') ? 'environment' : 'user'
        }
      };
      
      console.log('カメラ制約:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('カメラストリーム取得成功:', mediaStream);
      console.log('ビデオトラック:', mediaStream.getVideoTracks().map(track => ({
        label: track.label,
        settings: track.getSettings()
      })));
      setStream(mediaStream);
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = 'カメラへのアクセスが許可されていません。';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'カメラへのアクセスが拒否されました。ブラウザの設定でカメラを許可してください。';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'カメラが見つかりません。';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'カメラが他のアプリケーションで使用中です。';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'カメラの設定が対応していません。';
      }
      
      alert(errorMessage);
      
      // エラーが発生した場合、デフォルトのカメラを試行
      if (devices.length > 0 && deviceId !== devices[0].deviceId) {
        console.log('デフォルトカメラに切り替えを試行');
        setSelectedDeviceId(devices[0].deviceId);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log('カメラ停止:', stream.getTracks().map(track => track.label));
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('トラック停止:', track.label);
      });
      setStream(null);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    console.log('撮影処理開始:', {
      canvas: !!canvas,
      video: !!video,
      stream: !!stream,
      videoWidth: video?.videoWidth,
      videoHeight: video?.videoHeight,
      videoReadyState: video?.readyState
    });
    
    if (!canvas || !video) {
      console.error('カメラ撮影エラー: canvasまたはvideoが利用できません');
      alert('カメラが起動していません。先にカメラを起動してください。');
      return;
    }
    
    if (!stream) {
      console.error('カメラ撮影エラー: ストリームが利用できません');
      alert('カメラが起動していません。先にカメラを起動してください。');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('カメラ撮影エラー: ビデオサイズが0です');
      alert('カメラの準備ができていません。しばらく待ってから再試行してください。');
      return;
    }
    
    console.log('カメラ撮影開始:', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      videoReadyState: video.readyState
    });
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      console.log('カメラ撮影完了:', {
        blobSize: blob.size,
        blobType: blob.type
      });
      onCapture(blob);
    }, 'image/jpeg', 0.8);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        overflow: 'auto'
      }}
    >
            {/* 上部セクション */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          写真を撮影してください
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', mb: 1, fontSize: '0.9rem' }}>
          利用可能なカメラ: {devices.length}台 | カメラ状態: {stream ? '起動中' : '停止中'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', mb: 1, fontSize: '0.7rem' }}>
          デバッグ: stream={stream ? 'true' : 'false'}, devices={devices.length}
        </Typography>
        <Typography variant="body2" sx={{ color: 'white', mb: 2, fontSize: '0.7rem' }}>
          プロトコル: {window.location.protocol} | デバイス: {/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'iOS' : 'その他'}
        </Typography>
        
        {/* カメラ切り替えセレクトボックス */}
        {devices.length > 1 && (
          <Box sx={{ mb: 2, width: '100%', maxWidth: '400px' }}>
            <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
              カメラを選択:
            </Typography>
            <select
              value={selectedDeviceId || ''}
              onChange={e => {
                console.log('カメラ選択変更:', e.target.value);
                setSelectedDeviceId(e.target.value);
              }}
              style={{ 
                fontSize: '1rem', 
                padding: '8px 12px', 
                borderRadius: 8,
                width: '100%',
                backgroundColor: 'white',
                border: '2px solid #ccc',
                outline: 'none'
              }}
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `カメラ${index + 1}`}
                </option>
              ))}
            </select>
          </Box>
        )}
        
        <Box sx={{ position: 'relative', mb: 2 }}>
          {!stream && (
            <Box
              sx={{
                width: '100%',
                maxWidth: '400px',
                height: '250px',
                backgroundColor: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                border: '2px solid #666'
              }}
            >
              <Typography variant="body1" sx={{ color: 'white' }}>
                カメラを起動中...
              </Typography>
            </Box>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              maxHeight: '250px',
              borderRadius: 8,
              display: stream ? 'block' : 'none'
            }}
            onLoadedMetadata={() => {
              console.log('ビデオメタデータ読み込み完了');
            }}
            onError={(e) => {
              console.error('ビデオエラー:', e);
            }}
          />
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </Box>
      </Box>
      {/* 下部セクション */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mb: 2 }}>
        {/* 撮影ボタン（メインボタン） */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            console.log('撮影ボタンクリック');
            console.log('撮影時の状態:', { stream: !!stream, video: !!videoRef.current });
            capturePhoto();
          }}
          startIcon={<CameraAlt />}
          size="large"
          sx={{
            backgroundColor: '#ff4444',
            '&:hover': {
              backgroundColor: '#cc0000',
            },
            fontSize: '1.1rem',
            padding: '12px 24px',
            minWidth: '120px',
            height: '50px'
          }}
        >
          撮影
        </Button>
        
        {/* その他のボタン */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              console.log('カメラ起動ボタンクリック');
              console.log('デバイス情報:', {
                userAgent: navigator.userAgent,
                isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
                isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
                protocol: window.location.protocol,
                host: window.location.host
              });
              startDefaultCamera();
            }}
            size="medium"
          >
            カメラを起動
          </Button>
          {devices.length > 1 && (
            <Button
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={() => {
                const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
                const nextIndex = (currentIndex + 1) % devices.length;
                console.log('カメラ切り替えボタン:', devices[nextIndex].deviceId);
                setSelectedDeviceId(devices[nextIndex].deviceId);
              }}
              size="medium"
            >
              カメラ切り替え
            </Button>
          )}
          <Button
            variant="outlined"
            sx={{ color: 'white', borderColor: 'white' }}
            onClick={onClose}
            size="medium"
          >
            キャンセル
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderForm; 