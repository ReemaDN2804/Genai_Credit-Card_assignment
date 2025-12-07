# How to Verify Changes Are Saved and Loaded

## 1. Check if File is Saved

### In VS Code:
- Look for a **white dot** on the file tab - means file has unsaved changes
- If no dot, file is saved
- Press `Ctrl+S` to save manually

### Check File Timestamp:
```powershell
# In PowerShell
Get-Item backend\controllers\nluController.js | Select-Object LastWriteTime
```

## 2. Verify Changes in File

### Check Specific Lines:
```powershell
# Check if balance detection is in the file
Get-Content backend\controllers\nluController.js | Select-String "what's my account balance"
```

Should show line 89 with the balance check.

## 3. Force Server Reload

### Option 1: Full Restart (Recommended)
1. **Stop server**: Press `Ctrl+C` in the terminal running the server
2. **Wait 2 seconds**
3. **Start again**: `npm run dev`

### Option 2: Kill All Node Processes
```powershell
# Kill all node processes
Get-Process -Name node | Stop-Process -Force

# Then restart
npm run dev
```

## 4. Check if Server Loaded New Code

### Look for Server Restart Message:
After restarting, you should see:
```
🚀 Backend server running on http://localhost:3001
```

### Add a Test Log (Temporary):
Add this line at the top of `getMockGeminiResponse` function:
```javascript
function getMockGeminiResponse(prompt, options) {
  console.log('[MOCK] Function called - version 2.0'); // ADD THIS LINE
  const lowerPrompt = prompt.toLowerCase();
  // ... rest of code
```

If you see this log in console, the new code is loaded.

## 5. Test with Simple Query

Try these in order:
1. "What's my account balance?" → Should show `check_balance` intent
2. "Show me my credit limit" → Should show `check_balance` intent  
3. "I want to activate my card" → Should show `activate_card` intent

## 6. Check Backend Console Logs

When you send a message, check the terminal output:
```
[NLU] Intent detected: { intent: 'check_balance', ... }
```

If you see `check_balance` for balance queries, the fix is working!

## 7. Common Issues

### Issue: Changes not showing
**Solution**: 
- Make sure you saved the file (Ctrl+S)
- Fully restart the server (stop + start)
- Clear browser cache (Ctrl+Shift+R)

### Issue: Still showing wrong intent
**Solution**:
- Check backend console for the actual intent detected
- The issue might be in response generation, not intent detection
- Try a completely new conversation (refresh page)

### Issue: Server not restarting
**Solution**:
- Kill all node processes: `Get-Process -Name node | Stop-Process -Force`
- Then restart: `npm run dev`

## 8. Quick Verification Script

Create `test_intent.js` in backend folder:
```javascript
import { handleMessage } from './controllers/nluController.js';

async function test() {
  const result1 = await handleMessage({
    message: "What's my account balance?",
    userId: "user1",
    channel: "web"
  });
  console.log('Balance query:', result1.metadata.intent);
  
  const result2 = await handleMessage({
    message: "I want to activate my card",
    userId: "user1", 
    channel: "web"
  });
  console.log('Activate query:', result2.metadata.intent);
}

test();
```

Run: `node test_intent.js`

Expected output:
```
Balance query: check_balance
Activate query: activate_card
```

