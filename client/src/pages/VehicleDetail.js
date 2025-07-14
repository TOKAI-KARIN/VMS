import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicles } from '../utils/api';
import { Paper, Typography, Box, Button, Grid } from '@mui/material';

const qrParts = [
  { key: 'parts0', label: 'QRバージョン' },
  { key: 'parts1', label: '車体番号位置' },
  { key: 'parts2', label: '型式・類別' },
  { key: 'parts3', label: '電子車検証期限' },
  { key: 'parts4', label: '初年度登録年月' },
  { key: 'parts5', label: '型式' },
  { key: 'parts6', label: '軸重前前' },
  { key: 'parts7', label: '軸重前後' },
  { key: 'parts8', label: '軸重後前' },
  { key: 'parts9', label: '軸重後後' },
  { key: 'parts10', label: '騒音規制' },
  { key: 'parts11', label: '近接騒音規制' },
  { key: 'parts12', label: '駆動方式' },
  { key: 'parts13', label: 'オパシメーター測定者' },
  { key: 'parts14', label: 'NOxPM測定モード' },
  { key: 'parts15', label: 'NOx値' },
  { key: 'parts16', label: 'PM値' },
  { key: 'parts17', label: '保安基準適応年月日' },
  { key: 'parts18', label: '燃料の種類' },
  { key: 'parts19', label: 'QRバージョン２' },
  { key: 'parts20', label: '自動車登録番号' },
  { key: 'parts21', label: 'ナンバープレートサイズ' },
  { key: 'parts22', label: '車台番号' },
  { key: 'parts23', label: '原動機型式' },
  { key: 'parts24', label: '帳票種別' },
];

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    vehicles.getById(id).then(res => setVehicle(res.data)).catch(() => {});
  }, [id]);

  if (!vehicle) {
    return <Typography>読み込み中...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>車両詳細</Typography>
        <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate(-1)}>一覧に戻る</Button>
        <Grid container spacing={2}>
          {qrParts.map(part => (
            <Grid item xs={12} sm={6} key={part.key}>
              <Box sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1, background: '#fafbfc' }}>
                <Typography variant="subtitle2" color="textSecondary">{part.label}</Typography>
                <Typography variant="body1">{vehicle[part.key] || '-'}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="textSecondary">登録日時: {vehicle.createdAt ? vehicle.createdAt.replace('T', ' ').slice(0, 19) : '-'}</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default VehicleDetail; 