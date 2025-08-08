# Pusher Setup Guide for Real-Time Collaboration

This guide explains how to set up Pusher for real-time collaboration in AgendaIQ.

## 1. Create a Pusher Account

1. Go to [pusher.com](https://pusher.com)
2. Sign up for a free account
3. Create a new Channels app

## 2. Get Your Credentials

After creating your app, you'll find these credentials in the "App Keys" section:

- **App ID**: A numeric identifier for your app
- **Key**: Your public key (used in frontend)
- **Secret**: Your secret key (used in backend)
- **Cluster**: The geographic cluster (e.g., mt1, eu, ap1)

## 3. Add Credentials to .env

Add these to your `.env` file:

```bash
PUSHER_APP_ID=your-app-id
PUSHER_SECRET=your-secret-key
NEXT_PUBLIC_PUSHER_KEY=your-public-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster
```

## 4. Features Enabled

With Pusher configured, you'll have:

- **Real-time Updates**: Changes to agenda items appear instantly for all users
- **Presence Tracking**: See who's currently viewing the meeting
- **Typing Indicators**: See when someone is editing an agenda item
- **Live Connection Status**: Know when you're connected or offline

## 5. Usage Limits

Free Pusher account includes:
- 200,000 messages/day
- 100 max concurrent connections
- SSL encryption

This is sufficient for most small to medium organizations. For larger deployments, consider upgrading to a paid plan.

## 6. Testing

To test if Pusher is working:

1. Open a meeting in two different browser windows
2. Edit an agenda item in one window
3. The change should appear instantly in the other window
4. Check for the "Live" indicator in the top-right corner

## Alternative: Self-Hosted Solution

If you prefer not to use Pusher, you can implement a self-hosted WebSocket solution using:
- Socket.io
- Ably (similar to Pusher but with more generous free tier)
- Custom WebSocket server

Contact your administrator for help choosing the best solution for your organization.