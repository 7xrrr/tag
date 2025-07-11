# 📄 Usage Instructions

## ✅ Add the bot and self accounts to your server

- Invite the **bot** to your Discord server.
- Add your **self accounts** (normal Discord accounts) to the same server.
- Make sure:
  - The self accounts have **Manage Roles** permission.
  - The bot has **Administrator** permission.  
  This ensures everything works properly without any problems.

---

## ⚙️ Configure your bot

- Set your **bot token**, **bot ID**, and your **server IDs** in the `config` file.
- Add your **MongoDB connection link** as well.

---

## 💬 Setup commands

- Use `/addtag [server_id]` to add your server ID to the system.
- Use `/state [channel]` to set the channel where the bot will post clan status updates.
- Use `/setrole [role]` to configure the auto role that will be given to users with the tag.  
  The role will also be **automatically removed** when they remove the tag.

---

## ⚠️ Important: Add self accounts tokens

Don’t forget to add your **self accounts tokens** to `tokens.ts` or `tokens.js`.

- This file **must contain the tokens of normal Discord accounts**, not bot tokens.
- **Why?** Because the only way to access the **tag field** from the Discord API is by making requests using **normal account tokens**, not bot tokens.

---

## ⚠️ Disclaimer

> Using self bots violates Discord’s Terms of Service and can lead to account termination. Use at your own risk.
