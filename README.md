# Remote Roster Bot 🤖

An advanced Telegram bot for managing remote rosters with a modern menu-based interface.

## Features

✨ **Menu-Based Navigation** - Interactive inline buttons instead of text commands
📋 **Roster Management** - View and manage roster entries
👤 **Profile Management** - Manage user profiles
⚙️ **Settings** - Configure preferences and notifications
🎯 **Easy to Extend** - Modular architecture for adding new features
🛡️ **Error Handling** - Comprehensive error handling

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Telegram bot token:
   ```
   TELEGRAM_TOKEN=your_bot_token_here
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Usage

Once the bot is running, users can interact with it by:
- Sending `/start` to see the main menu
- Clicking menu buttons for different options
- Using the back button to return to previous menus

## Project Structure

```
RemoteRosterBot/
├── index.js              # Main bot file
├── package.json          # Project dependencies
├── .env                  # Environment variables (not tracked)
├── commands/             # Command handlers
│   └── help.js
├── handlers/             # Menu option handlers
│   ├── roster.js
│   ├── profile.js
│   └── settings.js
└── README.md            # This file
```

## Version

v2.0.0 - Menu-based interface update
