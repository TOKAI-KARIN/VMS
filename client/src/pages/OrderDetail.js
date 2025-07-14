import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { orders } from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../config';

const OrderDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [imageBase64Data, setImageBase64Data] = useState({});

  useEffect(() => {
    if (!user || !id) return;
    
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const response = await orders.getById(id);
        setOrder(response.data);
        
        // 画像をBase64に変換
        if (response.data.attachedPhotos && response.data.attachedPhotos.length > 0) {
          const base64Data = {};
          for (let i = 0; i < response.data.attachedPhotos.length; i++) {
            const photo = response.data.attachedPhotos[i];
            const imageUrl = `${config.SERVER_BASE_URL}${photo}`;
            
            console.log(`画像${i + 1}のBase64変換開始:`, imageUrl);
            
            try {
              const imgResponse = await fetch(imageUrl, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                  'Accept': 'image/*',
                  'Cache-Control': 'no-cache'
                }
              });
              
              console.log(`画像${i + 1}のfetch結果:`, {
                status: imgResponse.status,
                statusText: imgResponse.statusText,
                ok: imgResponse.ok,
                headers: Object.fromEntries(imgResponse.headers.entries())
              });
              
              if (imgResponse.ok) {
                const blob = await imgResponse.blob();
                console.log(`画像${i + 1}のblob取得:`, {
                  size: blob.size,
                  type: blob.type
                });
                
                const reader = new FileReader();
                reader.onload = () => {
                  base64Data[i] = reader.result;
                  setImageBase64Data(prev => ({ ...prev, [i]: reader.result }));
                  console.log(`画像${i + 1}のBase64変換完了`);
                };
                reader.onerror = (error) => {
                  console.error(`画像${i + 1}のFileReaderエラー:`, error);
                };
                reader.readAsDataURL(blob);
              } else {
                console.error(`画像${i + 1}のfetchエラー:`, imgResponse.status, imgResponse.statusText);
              }
            } catch (error) {
              console.error(`画像${i + 1}のBase64変換エラー:`, error);
            }
          }
        }
      } catch (error) {
        console.error('注文詳細の取得に失敗しました:', error);
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [user, id, navigate]);

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  // 画像の再読み込み機能
  const reloadImage = async (index) => {
    if (order.attachedPhotos && order.attachedPhotos[index]) {
      const photo = order.attachedPhotos[index];
      const imageUrl = `${config.SERVER_BASE_URL}${photo}`;
      
      try {
        addDebugLog(`画像${index + 1}の再読み込み開始:`, imageUrl);
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => {
            setImageBase64Data(prev => ({ ...prev, [index]: reader.result }));
            addDebugLog(`画像${index + 1}の再読み込み成功`);
          };
          reader.readAsDataURL(blob);
        } else {
          addDebugLog(`画像${index + 1}の再読み込みエラー:`, response.status);
        }
      } catch (error) {
        addDebugLog(`画像${index + 1}の再読み込みエラー:`, error);
      }
    }
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
  };

  // デバッグ用のイベントハンドラー
  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDebugLogs(prev => [...prev, logEntry]);
    console.log(`[${timestamp}] ${message}`, data);
  };

  const handleImageTest = () => {
    alert('画像読み込みテストボタンがクリックされました！');
    addDebugLog('=== 画像読み込みテスト開始 ===');
    addDebugLog('添付画像の詳細:', order.attachedPhotos);
    addDebugLog('設定ファイル:', config);
    
    if (order.attachedPhotos && order.attachedPhotos.length > 0) {
      order.attachedPhotos.forEach((photo, index) => {
        const imageUrl = `${config.SERVER_BASE_URL}${photo}`;
        addDebugLog(`画像${index + 1}のURL:`, imageUrl);
        
        // 画像の読み込みをテスト
        const img = new Image();
        img.onload = () => {
          addDebugLog(`✅ 画像${index + 1}読み込み成功:`, imageUrl);
          addDebugLog('画像サイズ:', { width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = (error) => {
          addDebugLog(`❌ 画像${index + 1}読み込みエラー:`, imageUrl);
          addDebugLog('エラー詳細:', error);
        };
        img.src = imageUrl;
      });
    } else {
      addDebugLog('添付画像がありません');
    }
    addDebugLog('=== 画像読み込みテスト終了 ===');
  };

  const handleStateCheck = () => {
    alert('状態確認ボタンがクリックされました！');
    addDebugLog('=== 現在の状態確認 ===');
    addDebugLog('ユーザー情報:', user);
    addDebugLog('ユーザー権限:', user?.role);
    addDebugLog('管理者権限チェック:', user?.role === 'admin' || user?.role === '管理者');
    addDebugLog('window.location:', window.location);
    addDebugLog('config:', config);
    addDebugLog('order:', order);
    addDebugLog('imageLoadingStates:', imageLoadingStates);
  };



  const getPartName = (key) => {
    const partNames = {
      diskPad: 'ディスクパッド',
      brakeShoe: 'ブレーキシュー',
      wiper: 'ワイパー',
      belt: 'ベルト',
      cleanFilter: 'クリーンフィルター',
      airElement: 'エアエレメント',
      oilElement: 'オイルエレメント'
    };
    return partNames[key] || key;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '注文済み':
        return 'success';
      case 'キャンセル':
        return 'error';
      case '受注':
        return 'warning';
      default:
        return 'default';
    }
  };

  // API_HOSTの動的設定
  const getApiHost = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = '3001';
    
    // デバイス検出
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log('デバイス情報:', {
      userAgent: navigator.userAgent,
      isAndroid,
      isIOS,
      hostname,
      protocol
    });
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port}`;
    } else {
      // モバイルデバイスの場合はHTTPを使用
      if (isAndroid || isIOS) {
        return `http://192.168.128.153:${parseInt(port) + 1}`;
      }
      // PCの場合は現在のプロトコルとポートを使用
      return `${protocol}//${hostname}:${port}`;
    }
  };
  
  const API_HOST = getApiHost();
  console.log('API_HOST:', API_HOST);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography>読み込み中...</Typography>
        </Box>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography>注文が見つかりません。</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/history')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            注文詳細
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  基本情報
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    注文ID
                  </Typography>
                  <Typography variant="body1">
                    {order.id}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    注文日
                  </Typography>
                  <Typography variant="body1">
                    {order.orderDate}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ステータス
                  </Typography>
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    作成者
                  </Typography>
                  <Typography variant="body1">
                    {order.createdByUser?.displayName || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    最終更新者
                  </Typography>
                  <Typography variant="body1">
                    {order.updatedByUser?.displayName || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    備考
                  </Typography>
                  <Typography variant="body1">
                    {order.remarks || '-'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 顧客・車両情報 */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  顧客・車両情報
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    顧客名
                  </Typography>
                  <Typography variant="body1">
                    {order.customer?.displayName || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ナンバー
                  </Typography>
                  <Typography variant="body1">
                    {order.vehicle?.parts20 || order.vehicle?.licensePlate || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    車台番号
                  </Typography>
                  <Typography variant="body1">
                    {order.vehicle?.parts22 || order.vehicle?.frameNumber || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    型式
                  </Typography>
                  <Typography variant="body1">
                    {order.vehicle?.parts5 || order.vehicle?.typeNumber || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    エンジン型式
                  </Typography>
                  <Typography variant="body1">
                    {order.vehicle?.parts23 || order.vehicle?.engineType || '-'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    初年度登録年月
                  </Typography>
                  <Typography variant="body1">
                    {order.vehicle?.parts4 || order.vehicle?.firstRegistrationDate || '-'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 注文部品 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  注文部品
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>部品名</TableCell>
                        <TableCell>数量</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['diskPad', 'brakeShoe', 'wiper', 'belt', 'cleanFilter', 'airElement', 'oilElement'].map(key => (
                        order[key] && (
                          <TableRow key={key}>
                            <TableCell>{getPartName(key)}</TableCell>
                            <TableCell>{order[key]}</TableCell>
                          </TableRow>
                        )
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* デバッグ機能（全ユーザー表示） */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  デバッグ機能
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* デバッグ用ボタン（全ユーザー表示） */}
                {user && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="info"
                      sx={{ zIndex: 1000, position: 'relative' }}
                      onClick={() => {
                        alert(`ユーザー情報:\n権限: ${user.role}\n表示名: ${user.displayName}\n管理者権限: ${user.role === 'admin' || user.role === '管理者'}`);
                        addDebugLog('ユーザー情報確認:', user);
                      }}
                    >
                      ユーザー情報確認
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      color="info"
                      sx={{ zIndex: 1000, position: 'relative' }}
                      onClick={() => setShowDebugLogs(!showDebugLogs)}
                    >
                      {showDebugLogs ? 'ログ非表示' : 'ログ表示'}
                    </Button>
                  </Box>
                )}
                
                {/* 管理者専用デバッグボタン */}
                {user && (user.role === 'admin' || user.role === '管理者') && (
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="success"
                      sx={{ 
                        zIndex: 1000,
                        position: 'relative',
                        backgroundColor: '#2e7d32',
                        '&:hover': {
                          backgroundColor: '#1b5e20'
                        }
                      }}
                      onClick={() => {
                        alert('簡単テストボタンがクリックされました！');
                        addDebugLog('簡単テストボタンがクリックされました');
                      }}
                    >
                      簡単テスト
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      sx={{ zIndex: 1000, position: 'relative' }}
                      onClick={() => setDebugLogs([])}
                    >
                      ログクリア
                    </Button>
                    
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      sx={{ zIndex: 1000, position: 'relative' }}
                      onClick={() => {
                        if (order.attachedPhotos && order.attachedPhotos.length > 0) {
                          const imageUrl = `${config.SERVER_BASE_URL}${order.attachedPhotos[0]}`;
                          addDebugLog('直接アクセステスト開始:', imageUrl);
                          
                          // 新しいタブで画像を開く
                          const newWindow = window.open(imageUrl, '_blank');
                          if (newWindow) {
                            addDebugLog('新しいタブで画像を開きました');
                          } else {
                            addDebugLog('ポップアップがブロックされました');
                            // 代替方法：リンクをクリック
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.target = '_blank';
                            link.click();
                            addDebugLog('リンククリックで画像を開きました');
                          }
                        } else {
                          addDebugLog('テスト用の画像がありません');
                        }
                      }}
                    >
                      画像直接アクセス
                    </Button>
                    
                                          <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        sx={{ zIndex: 1000, position: 'relative' }}
                        onClick={async () => {
                          if (order.attachedPhotos && order.attachedPhotos.length > 0) {
                            addDebugLog('全画像の再読み込み開始');
                            for (let i = 0; i < order.attachedPhotos.length; i++) {
                              await reloadImage(i);
                            }
                            addDebugLog('全画像の再読み込み完了');
                          }
                        }}
                      >
                        全画像再読み込み
                      </Button>
                      
                      <Button
                        variant="contained"
                        size="small"
                        color="secondary"
                        sx={{ zIndex: 1000, position: 'relative' }}
                        onClick={async () => {
                        if (order.attachedPhotos && order.attachedPhotos.length > 0) {
                          addDebugLog('Base64変換テスト開始');
                          try {
                            const imageUrl = `${config.SERVER_BASE_URL}${order.attachedPhotos[0]}`;
                            addDebugLog('画像URL:', imageUrl);
                            
                            // fetchで画像を取得してBase64に変換
                            const response = await fetch(imageUrl);
                            if (response.ok) {
                              const blob = await response.blob();
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = reader.result;
                                addDebugLog('Base64変換成功:', base64.substring(0, 100) + '...');
                                
                                // Base64画像を表示
                                const img = new Image();
                                img.onload = () => {
                                  addDebugLog('Base64画像読み込み成功');
                                };
                                img.onerror = (error) => {
                                  addDebugLog('Base64画像読み込みエラー:', error);
                                };
                                img.src = base64;
                              };
                              reader.readAsDataURL(blob);
                            } else {
                              addDebugLog('画像取得エラー:', response.status, response.statusText);
                            }
                          } catch (error) {
                            addDebugLog('Base64変換エラー:', error);
                          }
                        } else {
                          addDebugLog('テスト用の画像がありません');
                        }
                      }}
                    >
                      Base64変換テスト
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      sx={{ 
                        zIndex: 1000,
                        position: 'relative',
                        backgroundColor: '#1976d2',
                        '&:hover': {
                          backgroundColor: '#1565c0'
                        }
                      }}
                      onClick={handleImageTest}
                      onTouchStart={() => {
                        console.log('タッチイベント検出: 画像読み込みテスト');
                      }}
                    >
                      画像読み込みテスト
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      color="secondary"
                      sx={{ zIndex: 1000, position: 'relative' }}
                      onClick={handleStateCheck}
                      onTouchStart={() => {
                        console.log('タッチイベント検出: 状態確認');
                      }}
                    >
                      状態確認
                                          </Button>
                    </Box>
                  )}
                  
                  {/* デバッグログ表示エリア（全ユーザー表示） */}
                  {user && showDebugLogs && (
                    <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#f5f5f5', maxHeight: 300, overflow: 'auto' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        デバッグログ ({debugLogs.length}件)
                      </Typography>
                      {debugLogs.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          ログがありません。ボタンを押してログを生成してください。
                        </Typography>
                      ) : (
                        debugLogs.map((log, index) => (
                          <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: 'white', borderRadius: 1, border: '1px solid #ddd' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {log.timestamp}
                            </Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {log.message}
                            </Typography>
                            {log.data && (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#666', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {log.data}
                              </Typography>
                            )}
                          </Box>
                        ))
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

          {/* 画像 */}
          {order.attachedPhotos && order.attachedPhotos.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    添付画像
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <ImageList 
                    sx={{ 
                      width: '100%', 
                      height: 'auto',
                      maxHeight: 450,
                      position: 'relative',
                      zIndex: 1,
                      // モバイル対応
                      '@media (max-width: 600px)': {
                        cols: 2,
                        rowHeight: 150
                      }
                    }} 
                    cols={window.innerWidth <= 600 ? 2 : 3} 
                    rowHeight={window.innerWidth <= 600 ? 150 : 200}
                  >
                    {order.attachedPhotos.map((photo, index) => {
                      // Base64データがある場合はそれを使用、なければURLを使用
                      const imageUrl = imageBase64Data[index] || `${config.SERVER_BASE_URL}${photo}`;
                      const isBase64 = !!imageBase64Data[index];
                      
                      console.log(`画像URL構築 (index: ${index}):`, {
                        configServerBaseUrl: config.SERVER_BASE_URL,
                        photo,
                        imageUrl: isBase64 ? 'Base64データ' : imageUrl,
                        isBase64,
                        windowLocation: window.location.href,
                        windowOrigin: window.location.origin
                      });
                      
                      return (
                        <ImageListItem key={index} sx={{ cursor: 'pointer', position: 'relative' }}>
                          {/* ローディング表示 */}
                          {!imageLoadingStates[index] && !imageBase64Data[index] && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 4,
                                zIndex: 2
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                読み込み中...
                              </Typography>
                            </Box>
                          )}
                          <img
                            src={imageUrl}
                            alt={`添付画像 ${index + 1}`}
                            loading="lazy"
                            onLoadStart={() => {
                              console.log(`画像読み込み開始 (index: ${index}):`, imageUrl);
                            }}
                            style={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 4,
                              display: (imageLoadingStates[index] || imageBase64Data[index]) ? 'block' : 'none'
                            }}
                            onClick={() => handleImageClick(imageUrl)}
                            crossOrigin="anonymous"
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              borderRadius: '50%',
                              p: 0.5,
                            }}
                          >
                            <ZoomInIcon sx={{ color: 'white', fontSize: 20 }} />
                          </Box>
                        </ImageListItem>
                      );
                    })}
                  </ImageList>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* 戻るボタン */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/history')}
            startIcon={<ArrowBackIcon />}
          >
            注文履歴に戻る
          </Button>
        </Box>

        {/* 画像拡大表示ダイアログ */}
        <Dialog
          open={imageDialogOpen}
          onClose={handleCloseImageDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              onClick={handleCloseImageDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="拡大画像"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  console.error('画像読み込みエラー:', selectedImage);
                  e.target.style.display = 'none';
                  const errorBox = e.target.nextSibling;
                  if (errorBox) {
                    errorBox.style.display = 'flex';
                  }
                }}
                crossOrigin="anonymous"
              />
            )}
            <Box
              sx={{
                display: 'none',
                width: '100%',
                height: '80vh',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                画像を読み込めませんでした
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};

export default OrderDetail; 