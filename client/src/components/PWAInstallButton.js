import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { Download } from '@mui/icons-material';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  useEffect(() => {
    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e) => {
      // デフォルトのプロンプトを防ぐ
      e.preventDefault();
      // 後で使用するためにイベントを保存
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // appinstalledイベントをリッスン
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setSnackbarMessage('アプリが正常にインストールされました！');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setSnackbarMessage('インストールプロンプトが利用できません');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      return;
    }

    try {
      // インストールプロンプトを表示
      deferredPrompt.prompt();
      
      // ユーザーの選択を待つ
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setSnackbarMessage('インストールが開始されました');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('インストールがキャンセルされました');
        setSnackbarSeverity('info');
      }
      
      setShowSnackbar(true);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      setSnackbarMessage('インストール中にエラーが発生しました');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    }
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Download />}
        onClick={handleInstallClick}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        アプリをインストール
      </Button>
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallButton; 