# Vercel Deployment Guide - Security Configuration

> **Feature:** DevTools Protection với Whitelist  
> **Date:** 2026-02-05

---

## 🚀 Quick Start - Production Deployment

### Option 1: Không cần config gì (Recommended)

**Cách nhanh nhất - mặc định đã secure:**

```bash
# 1. Push code lên GitHub
git add -A
git commit -m "feat(security): enable default protection"
git push origin main

# 2. Vercel tự động deploy
# ✅ Security protections TỰ ĐỘNG BẬT (không cần set env vars)
```

**Kết quả:**

- ✅ DevTools blocked (F12 không mở được)
- ✅ Right-click inspect blocked
- ✅ Copy/select trong file preview blocked

**Khi nào dùng:** Nếu không cần dev/admin debug production

---

### Option 2: Có whitelist cho dev/admin (Production debugging)

**Nếu cần cho dev/admin vào DevTools để debug:**

#### Bước 1: Vào Vercel Dashboard

1. Mở Vercel: https://vercel.com
2. Chọn project: **m1-portal-wireframe** (hoặc tên project của bạn)
3. Click tab **Settings**
4. Click **Environment Variables** (sidebar bên trái)

#### Bước 2: Thêm Whitelist

**Add New Environment Variable:**

| Field           | Value                                |
| --------------- | ------------------------------------ |
| **Key**         | `VITE_SECURITY_WHITELIST_EMAILS`     |
| **Value**       | `admin@quoc-nam.com,dev@company.com` |
| **Environment** | ✅ Production                        |

**Screenshot guide:**

```
┌─────────────────────────────────────────────────┐
│ Environment Variables                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Key (required)                                  │
│ VITE_SECURITY_WHITELIST_EMAILS                  │
│                                                 │
│ Value (required)                                │
│ admin@quoc-nam.com,dev@company.com             │
│                                                 │
│ Environments                                    │
│ ☐ Development  ☐ Preview  ✅ Production        │
│                                                 │
│           [Cancel]  [Save]                      │
└─────────────────────────────────────────────────┘
```

#### Bước 3: Redeploy

**Cách 1: Auto redeploy (nếu có git push)**

```bash
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

**Cách 2: Manual redeploy từ Vercel**

1. Vào tab **Deployments**
2. Click ... (3 dots) ở deployment mới nhất
3. Click **Redeploy**
4. Check ✅ **Use existing Build Cache**
5. Click **Redeploy**

**Kết quả:**

- ✅ User bình thường: vẫn bị block F12
- ✅ User trong whitelist: F12 hoạt động bình thường

---

## 📋 Environment Variables Reference

### Bắt buộc cho Production: KHÔNG CẦN

Security protections **tự động enabled** nếu không có env var.

### Optional - Whitelist (Production Debugging)

| Variable                         | Example                             | Description                      |
| -------------------------------- | ----------------------------------- | -------------------------------- |
| `VITE_SECURITY_WHITELIST_EMAILS` | `admin@company.com,dev@company.com` | Emails bypass tất cả protections |

**Notes:**

- Multiple emails: phân cách bằng dấu `,` (không có space)
- Whitelist check khi user login - email phải match chính xác
- Case-sensitive: `Admin@company.com` ≠ `admin@company.com`

### Optional - Explicit Enable/Disable (Advanced)

Nếu muốn **force disable** ở production (không khuyến nghị):

| Variable                                   | Value   | Result                         |
| ------------------------------------------ | ------- | ------------------------------ |
| `VITE_PROD_ENABLE_DEVTOOLS_PROTECTION`     | `false` | ❌ Tắt DevTools protection     |
| `VITE_PROD_ENABLE_CONTEXT_MENU_PROTECTION` | `false` | ❌ Tắt right-click protection  |
| `VITE_PROD_ENABLE_CONTENT_PROTECTION`      | `false` | ❌ Tắt content copy protection |

**⚠️ Warning:** Không nên tắt ở production trừ khi có lý do đặc biệt!

---

## 🧪 Testing Production Deployment

### Test 1: Normal User (Bị block)

1. **Logout** khỏi portal (hoặc dùng incognito)
2. **Login** bằng email KHÔNG có trong whitelist
3. **Test DevTools:**
   - Press `F12` → ❌ Không mở, có toast "Developer Tools không được phép"
   - Press `Ctrl+Shift+I` → ❌ Blocked
   - Right-click → **Inspect** → ❌ Blocked

**Expected:** Tất cả bị block ✅

---

### Test 2: Whitelisted User (Bypass)

1. **Login** bằng email CÓ trong whitelist (ví dụ: `admin@quoc-nam.com`)
2. **Test DevTools:**
   - Press `F12` → ✅ DevTools mở bình thường
   - Right-click → **Inspect** → ✅ Hoạt động
   - Console logs visible → ✅ OK

**Expected:** Tất cả hoạt động bình thường ✅

---

### Test 3: Verify Whitelist Config

**Check trong browser console (nếu whitelisted user):**

```javascript
// F12 → Console → Paste:
console.log(import.meta.env.VITE_SECURITY_WHITELIST_EMAILS);

// Expected output:
// "admin@quoc-nam.com,dev@company.com"
```

**Hoặc check network tab:**

1. F12 → Network tab
2. Reload page
3. Check `main.js` hoặc config files
4. Search for `VITE_SECURITY_WHITELIST_EMAILS`

---

## 🔄 Common Scenarios

### Scenario 1: Thêm email mới vào whitelist

**Steps:**

1. Vercel Dashboard → Settings → Environment Variables
2. Tìm `VITE_SECURITY_WHITELIST_EMAILS`
3. Click **Edit** (pencil icon)
4. Update value: `admin@quoc-nam.com,newdev@company.com,tester@company.com`
5. Click **Save**
6. **Redeploy** (bắt buộc để apply changes)

**Timeline:** ~2-3 phút (build time)

---

### Scenario 2: Tạm thời tắt protection cho tất cả users

**⚠️ Emergency only - không khuyến nghị!**

**Steps:**

1. Vercel → Settings → Environment Variables
2. Add new variable:
   - Key: `VITE_PROD_ENABLE_DEVTOOLS_PROTECTION`
   - Value: `false`
   - Environment: Production
3. Save → Redeploy

**Rollback:**

1. Delete `VITE_PROD_ENABLE_DEVTOOLS_PROTECTION` variable
2. Redeploy

---

### Scenario 3: Bug ở production, cần debug ngay

**Quick whitelist yourself:**

```bash
# Option 1: CLI (nếu có Vercel CLI)
vercel env add VITE_SECURITY_WHITELIST_EMAILS production
# Paste: your-email@company.com
vercel --prod

# Option 2: Dashboard (recommended)
# Follow "Scenario 1" above
```

**Sau khi debug xong:**

- Remove email khỏi whitelist
- Hoặc giữ lại nếu cần long-term access

---

## 🎯 Best Practices

### ✅ DO

- ✅ **Chỉ thêm email tin cậy** vào whitelist (dev team, admin)
- ✅ **Review whitelist định kỳ** (mỗi tháng/quý)
- ✅ **Remove email không còn cần** (nhân viên nghỉ việc, v.v.)
- ✅ **Document whitelist changes** (ghi log ai thêm, khi nào, tại sao)
- ✅ **Test sau mỗi deploy** (verify cả normal user lẫn whitelisted)

### ❌ DON'T

- ❌ **Đừng thêm email user bình thường** vào whitelist
- ❌ **Đừng share whitelist email publicly** (GitHub, Slack public channels)
- ❌ **Đừng tắt protection ở production** trừ khi emergency
- ❌ **Đừng quên redeploy** sau khi thay đổi env vars
- ❌ **Đừng dùng wildcard** (`*.@company.com` không hỗ trợ)

---

## 🔍 Troubleshooting

### Problem 1: Whitelist không hoạt động

**Symptoms:** Login bằng email trong whitelist nhưng vẫn bị block F12

**Solutions:**

1. **Check env var đã save chưa:**

   ```
   Vercel → Settings → Environment Variables
   → Tìm VITE_SECURITY_WHITELIST_EMAILS
   → Verify value có email của bạn
   ```

2. **Check đã redeploy chưa:**

   ```
   Vercel → Deployments
   → Latest deployment có timestamp sau khi update env var?
   → Nếu không → Manual redeploy
   ```

3. **Check email match chính xác:**

   ```javascript
   // F12 (nếu bypass được) → Console:
   // Logged in email:
   console.log(localStorage.getItem("user")); // hoặc sessionStorage

   // Whitelist emails:
   console.log(import.meta.env.VITE_SECURITY_WHITELIST_EMAILS);

   // Phải match chính xác (case-sensitive)
   ```

4. **Check space trong config:**
   ```diff
   ❌ WRONG: "admin@test.com, dev@test.com"  (có space sau dấu phẩy)
   ✅ RIGHT: "admin@test.com,dev@test.com"   (không có space)
   ```

---

### Problem 2: Production vẫn cho phép F12 (không bị block)

**Symptoms:** User bình thường vẫn mở được DevTools

**Solutions:**

1. **Check build mode:**

   ```
   Vercel → Settings → General
   → Build Command: `npm run build` (không phải `npm run dev`)
   ```

2. **Check không có disable flag:**

   ```
   Vercel → Settings → Environment Variables
   → KHÔNG NÊN có: VITE_PROD_ENABLE_DEVTOOLS_PROTECTION=false
   → Nếu có → Delete → Redeploy
   ```

3. **Hard refresh browser:**

   ```
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)

   Hoặc clear cache:
   F12 → Application → Clear storage → Clear site data
   ```

---

### Problem 3: Deploy failed sau khi thêm env var

**Solutions:**

1. **Check logs:**

   ```
   Vercel → Deployments → Click deployment
   → View Build Logs
   → Tìm lỗi liên quan đến env var
   ```

2. **Verify env var format:**

   ```
   Key: VITE_SECURITY_WHITELIST_EMAILS
   Value: email1@test.com,email2@test.com

   ❌ WRONG Key: SECURITY_WHITELIST_EMAILS (thiếu VITE_ prefix)
   ❌ WRONG Value: ["email1", "email2"] (array không hợp lệ)
   ```

---

## 📞 Support

### Internal Team Contacts

- **Security Config:** Dev Team Lead
- **Vercel Access:** DevOps / Admin
- **Emergency Whitelist:** Project Manager

### Documentation References

- Main docs: `docs/modules/security/features/client-protection/`
- Implementation: `docs/modules/security/features/devtools-protection-default-on/`
- Test cases: `src/config/__tests__/security.config.test.ts`

---

## 📝 Checklist - Pre-Production Deploy

Trước khi deploy production lần đầu:

- [ ] ✅ Code đã pass all tests locally
- [ ] ✅ `.env.development` có `VITE_DEV_ENABLE_*_PROTECTION=false`
- [ ] ✅ Quyết định whitelist emails cần thiết
- [ ] ✅ Add whitelist vào Vercel env vars (nếu cần)
- [ ] ✅ Verify Vercel build command = `npm run build`
- [ ] ✅ Test trên staging/preview deployment trước
- [ ] ✅ Chuẩn bị rollback plan nếu có issue

Sau khi deploy:

- [ ] ✅ Test normal user → F12 blocked
- [ ] ✅ Test whitelisted user → F12 works
- [ ] ✅ Monitor logs 15-30 phút đầu
- [ ] ✅ Document deployment trong team chat

---

**Last updated:** 2026-02-05  
**Maintained by:** Dev Team
