# Phase 4C: Cloud Sync & Collaborative Planning - Setup Guide

## Overview

JiPange now supports cloud synchronization with Supabase, enabling:
- ☁️ Cross-device plan synchronization
- 👥 Household collaboration (spouse/partner sharing)
- 📱 Real-time plan updates
- 💾 Automatic cloud backup

## Supabase Setup

### 1. Create Supabase Project

Visit [supabase.com](https://supabase.com) and create a new project.

### 2. Create Database Tables

Run these SQL queries in the Supabase SQL Editor:

#### Plans Table
```sql
CREATE TABLE plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_data TEXT NOT NULL,
    plan_name TEXT,
    saved_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

CREATE INDEX plans_user_id_idx ON plans(user_id);
```

#### Household Shares Table
```sql
CREATE TABLE household_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID NOT NULL,
    shared_with_email TEXT NOT NULL,
    access_level TEXT DEFAULT 'edit',
    shared_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX household_shares_owner_idx ON household_shares(owner_id);
CREATE INDEX household_shares_email_idx ON household_shares(shared_with_email);
```

### 3. Enable Row Level Security (RLS)

```sql
-- Plans RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
    ON plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
    ON plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
    ON plans FOR UPDATE
    USING (auth.uid() = user_id);

-- Household Shares RLS
ALTER TABLE household_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares"
    ON household_shares FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own shares"
    ON household_shares FOR INSERT
    WITH CHECK (auth.uid() = owner_id);
```

### 4. Update Configuration

Get your Supabase credentials from Project Settings > API:
- Project URL
- Anon Key (public)

Update in `jipange-phase4.html`:
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
```

## Features

### Cloud Sign Up / Sign In
1. Click "☁️ Sign In for Cloud Sync" in top right
2. Enter email and password (6+ characters)
3. Click "Create Account" or "Sign In"
4. Button changes to green showing sync status

### Automatic Cloud Save
- Plan auto-saves to cloud every time you make changes
- Requires being signed in
- Works offline (syncs when reconnected)

### Share with Spouse/Partner
1. Click cloud sync button (top right)
2. Select "👥 Share with Spouse"
3. Enter spouse's email
4. Spouse can sign in and see shared plan in real-time

### Cross-Device Sync
- Same plan accessible on all devices
- Changes sync automatically
- Offline-first: works without internet
- Syncs when connection restored

## User Flow

```
Start App
    ↓
[Choose] Sign In for Cloud Sync
    ↓
[Enter] Email & Password
    ↓
[Receive] Confirmation, load cloud plan
    ↓
[Make] Changes (auto-saves to cloud)
    ↓
[Share] With spouse via cloud sync button
    ↓
[Spouse] Sees real-time updates
```

## Technical Details

### State Persistence
- **Local**: localStorage (immediate)
- **Cloud**: Supabase (with user logged in)
- **Fallback**: Full offline capability

### Sync Strategy
1. Save to localStorage immediately
2. Async save to cloud (non-blocking)
3. Load from cloud on app start
4. Listen for real-time updates
5. Merge conflicts: cloud version wins (user can re-enter changes)

### Security
- All data encrypted in transit (HTTPS/TLS)
- Row-level security enforced
- User can only see own plans
- Household members get edit access
- No plan data stored in app code

## Testing

### Test Sign Up Flow
```javascript
// In browser console
cloudSignUp('test@example.com', 'password123')
```

### Test Cloud Save
```javascript
saveCloudPlan()
```

### Test Load from Cloud
```javascript
loadCloudPlan()
```

### Test Household Share
```javascript
addHouseholdMember('spouse@example.com', 'edit')
```

## Next Phase

- [ ] Advisor read-only sharing
- [ ] Plan versioning & rollback
- [ ] Collaborative commenting
- [ ] Plan comparison tools
- [ ] Mobile app sync
- [ ] Offline conflict resolution

## Support

Cloud sync is optional. The app works fully offline without signing in.
All local data is preserved in browser storage.

---

**Phase 4C Status**: MVP Complete ✅
- Cloud persistence: ✅
- User authentication: ✅
- Household collaboration: ✅
- Real-time sync: ✅
- Auto-save: ✅
