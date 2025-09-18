# Testing Guide - Expo Go with Railway Backend

This guide helps you test your Ladder app using Expo Go connected to your Railway backend.

## 🚀 Quick Start

### 1. Start Expo Development Server
```bash
npm run start:dev
```

This will:
- Use Railway backend (no local backend needed)
- Load development environment variables
- Start Expo development server

### 2. Open in Expo Go
1. Install **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. Your app will load and connect to Railway backend

## 📱 What to Test

### Authentication Flow
- [ ] Sign up with a new account
- [ ] Sign in with existing account
- [ ] Sign out functionality
- [ ] Password reset (if implemented)

### Core Features
- [ ] Browse opportunities
- [ ] Create new opportunities
- [ ] Add/remove favorites
- [ ] Apply for opportunities
- [ ] View user profiles
- [ ] Community features
- [ ] Chat functionality

### Navigation
- [ ] Tab navigation works
- [ ] Screen transitions are smooth
- [ ] Back button works correctly
- [ ] Deep linking (if implemented)

### Performance
- [ ] App loads quickly
- [ ] Images load properly
- [ ] No crashes or freezes
- [ ] Smooth scrolling
- [ ] Responsive UI

## 🔧 Troubleshooting

### Connection Issues
**Problem**: App can't connect to backend
**Solutions**:
1. Check if Railway backend is running
2. Verify API URL in `.env.development`
3. Check network connection
4. Try refreshing the app

### Authentication Issues
**Problem**: Login/signup not working
**Solutions**:
1. Check Railway logs for errors
2. Verify JWT_SECRET is set on Railway
3. Check database connection
4. Test with a simple account

### Performance Issues
**Problem**: App is slow or crashes
**Solutions**:
1. Check Railway backend performance
2. Monitor memory usage
3. Check for infinite loops
4. Verify image optimization

## 📊 Monitoring

### Railway Dashboard
- Check backend logs for errors
- Monitor response times
- Verify database connections
- Check resource usage

### Expo Go
- Use React Native Debugger
- Check console logs
- Monitor network requests
- Test on different devices

## 🎯 Success Criteria

Your app is ready for production when:
- [ ] All core features work in Expo Go
- [ ] No crashes or major bugs
- [ ] Good performance on real devices
- [ ] Authentication works reliably
- [ ] Database operations are stable
- [ ] UI is responsive and intuitive

## 🚀 Next Steps

After successful testing:
1. **Create production build**: `npm run build`
2. **Deploy to app stores**: Use EAS Build
3. **Monitor production**: Set up analytics and crash reporting
4. **Scale backend**: Monitor Railway usage and scale as needed

## 📞 Support

If you encounter issues:
1. Check Railway logs
2. Check Expo Go console
3. Test individual API endpoints
4. Verify environment variables
5. Check network connectivity
