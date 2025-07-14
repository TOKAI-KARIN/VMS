import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { vehicles } from '../utils/api'; // 修正
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MAX_QR = 5; // 必要なら7に変更可

const qrParts = [
  { key: 'version', label: 'QRバージョン' },
  { key: 'shataibangouichi', label: '車体番号位置' },
  { key: 'katashikiruibetu', label: '型式・類別' },
  { key: 'kigendenshi', label: '電子車検証期限' },
  { key: 'shonen', label: '初年度登録年月' },
  { key: 'katasiki', label: '型式' },
  { key: 'ffaxle_weight', label: '軸重前前' },
  { key: 'fraxle_weight', label: '軸重前後' },
  { key: 'rfaxle_weight', label: '軸重後前' },
  { key: 'rraxle_weight', label: '軸重後後' },
  { key: 'souon', label: '騒音規制' },
  { key: 'kinsetu', label: '近接騒音規制' },
  { key: 'kudou', label: '駆動方式' },
  { key: 'opacimeter', label: 'オパシメーター測定者' },
  { key: 'nOxMode', label: 'NOxPM測定モード' },
  { key: 'nOxValue', label: 'NOx値' },
  { key: 'pmValue', label: 'PM値' },
  { key: 'hoan', label: '保安基準適応年月日' },
  { key: 'nenryou', label: '燃料の種類' },
  { key: 'version2', label: 'QRバージョン２' },
  { key: 'licensePlate', label: '自動車登録番号' },
  { key: 'PlateSise', label: 'ナンバープレートサイズ' },
  { key: 'carNo', label: '車台番号' },
  { key: 'EnginName', label: '原動機型式' },
  { key: 'chouhyou', label: '帳票種別' }
];

// 日付フォーマット変換
function formatDate(ym) {
  if (!ym || ym.length < 4) return '';
  const year = '20' + ym.slice(0, 2);
  const month = ym.slice(2, 4);
  return `${year}-${month}-01`;
}

function parseQR(qrArray) {
  // 3つ目のQRの末尾に/を追加
  const qrFixed = qrArray.map((q, idx) => (idx === 2 && !q.endsWith('/') ? q + '/' : q));
  // 連結して/で分割
  const allData = qrFixed.join('');
  const values = allData.split('/');
  return qrParts.map((part, idx) => ({
    part: `parts${idx}`,
    key: part.key,
    label: part.label,
    value: values[idx] || ''
  }));
}

// MediaStreamの明示的な解放関数を追加
function stopAllStreams() {
  const video = document.querySelector('#qr-reader video');
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
}

function QRScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState([]);
  const [error, setError] = useState('');
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [customers, setCustomers] = useState([]); // 顧客リスト
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      console.log('カメラリスト:', devices);
      setCameras(devices);
      if (devices.length > 0) setCameraId(devices[0].id);
    });
    // 顧客リスト取得
    vehicles.getCustomers && vehicles.getCustomers().then(res => setCustomers(res)).catch(() => {});
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ロールによる顧客自動選択
  useEffect(() => {
    if (user && user.role === 'customer') {
      setSelectedCustomer(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!cameraId) return;
    const qrCodeRegionId = "qr-reader";
    const qrParent = document.getElementById('qr-reader-parent');
    if (qrParent) {
      qrParent.innerHTML = '<div id="qr-reader" style="width:100%"></div>';
    }
    html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
    html5QrCodeRef.current.start(
      { deviceId: { exact: cameraId } },
      { fps: 10, qrbox: 150, videoConstraints: { deviceId: { exact: cameraId } } },
      (decodedText) => {
        setError('');
        setQrCodes(prev => {
          if (prev.includes(decodedText) || prev.length >= MAX_QR) return prev;
          const next = [...prev, decodedText];
          return next;
        });
      },
      (err) => {
        setError('QRコードの読み取りに失敗しました。' + (err || ''));
      }
    ).catch(e => {});
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop?.();
        } catch {}
        try {
          html5QrCodeRef.current.clear?.();
        } catch {}
        html5QrCodeRef.current = null;
      }
      stopAllStreams();
      const qrParent = document.getElementById('qr-reader-parent');
      if (qrParent) {
        qrParent.innerHTML = '<div id="qr-reader" style="width:100%"></div>';
      }
    };
  }, [cameraId]);

  const handleCameraSwitch = async () => {
    console.log('カメラ切り替えボタン押下');
    if (cameras.length > 1) {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop?.();
        } catch {}
        try {
          await html5QrCodeRef.current.clear?.();
        } catch {}
        html5QrCodeRef.current = null;
      }
      stopAllStreams();
      // 親要素ごと再生成
      const qrParent = document.getElementById('qr-reader-parent');
      if (qrParent) {
        qrParent.innerHTML = '<div id="qr-reader" style="width:100%"></div>';
      }
      // setCameraIdの直後にstartしない（useEffectに任せる）
      const idx = cameras.findIndex(cam => cam.id === cameraId);
      const nextId = cameras[(idx + 1) % cameras.length].id;
      setCameraId(nextId);
      console.log('切り替え後cameraId:', nextId);
    }
  };

  const handleReset = async () => {
    setQrCodes([]);
    setError('');
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState && html5QrCodeRef.current.getState() === 1) {
      await html5QrCodeRef.current.stop().catch(() => {});
    }
    // カメラ再起動はuseEffectでcameraId変更時に自動で行われる
  };

  const parsed = qrCodes.length === MAX_QR ? parseQR(qrCodes) : [];

  // 安全にsplitするためのヘルパー
  const getQRValue = (idx) => {
    const lastQR = qrCodes.length > 0 ? qrCodes[qrCodes.length - 1] : '';
    if (!lastQR) return '';
    const arr = lastQR.split('/');
    return arr[idx] || '';
  };

  // 登録処理
  const handleRegister = async () => {
    // QRから読み取った全項目をparts0〜parts24としてオブジェクト化
    const allParts = {};
    parsed.forEach((item, idx) => {
      allParts[`parts${idx}`] = item.value;
    });
    // 顧客IDを追加
    allParts.customerId = selectedCustomer;
    try {
      await vehicles.registerVehicle(allParts); // parts0〜parts24＋customerIdを送信
      alert('登録が完了しました');
      navigate('/dashboard'); // 登録成功後にダッシュボードへ遷移
    } catch (e) {
      console.error('登録エラー:', e);
      alert('登録に失敗しました: ' + (e.message || '不明なエラーが発生しました'));
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          QRコードスキャン
        </Typography>

        <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, mx: 'auto', mt: 4 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
            メイン画面に戻る
          </Button>
          <Typography variant="h6" align="center" gutterBottom>
            左から順番にQRコードを読み取ってください（{MAX_QR}個）
          </Typography>
          <Box id="qr-reader-parent">
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCameraSwitch}
              disabled={cameras.length < 2}
            >
              カメラ切り替え
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleReset}>
              リセット
            </Button>
          </Box>
          <Typography align="center" color="textSecondary">
            読み取り済み: {qrCodes.length} / {MAX_QR}
          </Typography>
          {error && <Typography color="error" align="center">{error}</Typography>}
        </Box>

        {parsed.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">読み取った情報一覧</Typography>
            <List>
              {parsed.map((item, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={`${item.label}: ${item.value}`} secondary={`${item.part}: ${item.key}`} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <form>
          <Grid container spacing={2}>
            {/* 型式指定番号～ブレーキシューの入力欄を非表示にしました */}
            {/* ここに他の必要な項目だけを残す場合は追加してください */}
            {/* 顧客アカウント選択や登録ボタンなどはそのまま残します */}
            {user && user.role !== 'customer' ? (
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="customer-select-label">顧客アカウント</InputLabel>
                  <Select
                    labelId="customer-select-label"
                    value={selectedCustomer}
                    label="顧客アカウント"
                    onChange={e => setSelectedCustomer(e.target.value)}
                  >
                    {customers.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.displayName || c.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : null}
            <Grid item xs={12}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleRegister}
              >
                登録
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default QRScanner; 