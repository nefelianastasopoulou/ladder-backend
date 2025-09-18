# Expo Go Testing Guide

This guide explains how to test your Ladder app with Expo Go for Railway deployment.

## 🚀 Quick Start

### 1. For Expo Go Testing (Recommended)
```bash
npm run start:expo-go
```
This will:
- Configure the app to use Railway backend
- Enable debug mode
- Set up proper network security for mobile testing

### 2. For Local Development Testing
```bash
npm run start:local
```
This will:
- Configure the app to use local backend (localhost:3001)
- Enable debug mode
- Set up for local development

## 📱 Testing with Expo Go

### Prerequisites
1. Install Expo Go app on your mobile device
2. Ensure your mobile device and computer are on the same network
3. Have Railway backend deployed and accessible

### Steps
1. **Start the development server:**
   ```bash
   npm run start:expo-go
   ```

2. **Scan the QR code** with Expo Go app

3. **Test the app** - it will connect to your Railway backend

## 🔧 Configuration Files

### Environment Files
- `.env.expo-go` - Configuration for Expo Go testing
- `.env.local-dev` - Configuration for local development
- `.env.local` - Active configuration (auto-generated)

### Key Configuration
```env
# Expo Go Configuration
EXPO_PUBLIC_API_URL=https://ladder-backend-staging.up.railway.app/api
EXPO_PUBLIC_ENVIRONMENT=staging
EXPO_PUBLIC_DEBUG_MODE=true
```

## 🌐 Network Security

### iOS Configuration
- Allows HTTP for localhost
- Requires HTTPS for Railway domains
- Proper TLS configuration for Railway

### Android Configuration
- Allows cleartext traffic for localhost
- Requires HTTPS for Railway domains
- Network security config for different domains

## 🐛 Troubleshooting

### Common Issues

1. **"Network request failed"**
   - Ensure Railway backend is deployed and accessible
   - Check if `EXPO_PUBLIC_API_URL` is set correctly
   - Verify network connectivity

2. **"Cannot connect to localhost"**
   - Use `npm run start:expo-go` instead of `npm run start:local`
   - Expo Go cannot access localhost from mobile device

3. **"SSL/TLS errors"**
   - Ensure Railway backend uses HTTPS
   - Check network security configuration in app.json

### Debug Mode
When `EXPO_PUBLIC_DEBUG_MODE=true`:
- API requests are logged to console
- Detailed error messages are shown
- Network timeouts are extended

## 📊 Testing Checklist

- [ ] App starts without crashes
- [ ] Can connect to Railway backend
- [ ] Authentication works
- [ ] API calls succeed
- [ ] Error handling works properly
- [ ] Network timeouts are handled
- [ ] Debug logs are visible (if enabled)

## 🔄 Switching Between Configurations

### To test with Railway backend:
```bash
npm run start:expo-go
```

### To test with local backend:
```bash
npm run start:local
```

### To reset configuration:
```bash
rm .env.local
npm run start:expo-go
```

## 📝 Notes

- Expo Go automatically uses the configuration from `.env.local`
- The app will fall back to Railway backend if localhost is not accessible
- Network security is configured to allow both local and Railway testing
- Debug mode provides detailed logging for troubleshooting
