import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';

const Login = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (activeTab === 0) {
      // ログイン処理
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('ログインに失敗しました。ユーザー名とパスワードを確認してください。');
      }
    } else {
      // ユーザー登録処理
      try {
        await axios.post(`${config.API_BASE_URL}/auth/register`, {
          username,
          password,
          displayName,
        });
        setSuccess('ユーザー登録が完了しました。ログインしてください。');
        setActiveTab(0);
        setUsername('');
        setPassword('');
        setDisplayName('');
      } catch (error) {
        setError(error.response?.data?.message || 'ユーザー登録に失敗しました。');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h5" component="h1" gutterBottom align="center">
            車両情報管理システム
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            centered
            sx={{ mb: 3 }}
          >
            <Tab label="ログイン" />
            <Tab label="新規登録" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="ユーザーID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
            />
            {activeTab === 1 && (
              <TextField
                fullWidth
                label="表示名"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                margin="normal"
                required
              />
            )}
            <TextField
              fullWidth
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              {activeTab === 0 ? 'ログイン' : '登録'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 