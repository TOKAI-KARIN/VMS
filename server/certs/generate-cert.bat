@echo off
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.key -out certificate.crt -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:192.168.128.155" 