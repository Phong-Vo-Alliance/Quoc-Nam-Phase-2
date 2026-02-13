# Changelog - Leader Task Filter by Department

All changes related to limiting Leader's task visibility to department scope.

---

## [Unreleased]

### 🎯 Goals

- Giới hạn Leader chỉ xem công việc của bản thân và những người cùng phòng ban trong conversation
- Tạo reusable hook để filter danh sách assignees

### 📋 Documentation Status

| Document                       | Status            | Date       |
| ------------------------------ | ----------------- | ---------- |
| 00_README.md                   | ✅ Created        | 2026-02-12 |
| 01_requirements.md             | ⏳ Pending Review | 2026-02-12 |
| 02_api-analysis.md             | ⏳ Pending Review | 2026-02-12 |
| 03_implementation-plan.md      | ⏳ Pending Review | 2026-02-12 |
| 04_testing.md                  | ⏳ Pending Review | 2026-02-12 |
| snapshots/department-members   | ⏳ Pending        | -          |
| snapshots/conversation-members | ⏳ Pending        | -          |

### 🔄 Next Steps

1. HUMAN review 01_requirements.md và điền Pending Decisions
2. HUMAN paste API response snapshots
3. HUMAN approve 02_api-analysis.md
4. HUMAN approve 03_implementation-plan.md
5. HUMAN approve 04_testing.md
6. AI implement code + tests
7. Manual testing + E2E verification

---

## [Future Versions]

### Potential Enhancements

- [ ] Cache department member list globally (not per conversation)
- [ ] Add department-based task filtering in other views (mobile, lead view)
- [ ] Add UI indicator showing filtered view (badge, tooltip)
- [ ] Add "View all tasks" toggle for super admin
