# Permission API Mapping

Audit này chỉ rà soát frontend hiện tại để đồng bộ RBAC với backend. Không thay đổi UI, business logic hoặc API contract.

Lưu ý: repository FE không chứa decorator/guard của backend, nên cột `Required Permission` dưới đây là permission frontend đang dùng hoặc permission backend cần đồng bộ theo dependency của màn hình. Các API nền như lấy membership hiện tại của user được ghi rõ để BE có thể mở quyền theo phạm vi "self membership" nếu không muốn gắn vào permission nghiệp vụ.

## Permission Guard Tổng Quan

| Khu vực | FE guard hiện tại | API nền trước khi vào page | Ghi chú RBAC |
|---|---|---|---|
| `/org/:slug` | `OrgWorkspaceGuard` yêu cầu user có membership trong org | `GET /users/{userId}/organizations` | Cần cho phép user đọc danh sách org của chính mình. |
| `/org/:slug/events` | `EVENT` | `GET /users/{userId}/organizations` | Page con dùng permission cha `EVENT`. |
| `/org/:slug/events/:id` | `EVENT` | `GET /users/{userId}/organizations` | Detail cũng dùng `EVENT`, các API phụ cần BE cho phép tương ứng. |
| `/org/:slug/roles` | `ROLE` | `GET /users/{userId}/organizations` | Create/Update button check thêm `CREATE_ROLE`, `UPDATE_ROLE`. |
| `/org/:slug/membership` | `ORGANIZATION_MEMBER_MANAGE` | `GET /users/{userId}/organizations` | Invite/member action dùng permission mới này. |
| `/org/:slug` dashboard | active org membership | `GET /users/{userId}/organizations` | FE chưa check `DASHBOARD` riêng. |

Nếu membership payload không có đủ permission, FE có fallback đọc role permission:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /roles/org/{slug}` | Tìm role theo org khi membership thiếu roleId/permission | Self role lookup hoặc `ROLE` |
| `GET /roles/{id}/permissions` | Lấy permission của role hiện tại | Self role permission lookup hoặc `ROLE` |

## Organization Dashboard

Required Permission:

Active organization membership. FE chưa check permission riêng cho dashboard.

User role cần truy cập:

Organization Owner, Manager, Staff hoặc member hợp lệ trong organization.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard, lấy membership/current organization | Self membership read |
| `GET /organizations/detail/{slug}` | Header/current organization detail | Organization member read hoặc `ORGANIZATION_VIEW` |
| `GET /dashboard/org/{slug}` | Load dashboard summary | Organization member dashboard access hoặc `DASHBOARD_VIEW` nếu BE có permission này |

Permission còn thiếu cần BE hỗ trợ:

- Nếu backend yêu cầu permission riêng cho dashboard, FE hiện chưa có route guard tương ứng cho org dashboard.
- `GET /organizations/detail/{slug}` đang được header/hook dùng rộng trong org workspace, nên BE nên cho phép member của org đọc tối thiểu metadata của org.

## Events List

Required Permission:

`EVENT`

User role cần truy cập:

Organization Owner hoặc role có `EVENT`.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard và lấy permission org workspace | Self membership read |
| `GET /organizations/detail/{slug}` | Header/current organization detail | Organization member read hoặc `ORGANIZATION_VIEW` |
| `GET /events/org/{slug}` | Load event list trong organization workspace | `EVENT` |
| `PATCH /events/cancelled` | Bulk cancel/hide selected events | `DELETE_EVENT` hoặc event cancellation permission tương ứng |

Component/Button permission:

| Action | FE check hiện tại |
|---|---|
| View event detail | Route/page đã yêu cầu `EVENT` |
| Create Event | `CREATE_EVENT` |
| Edit Event | `EVENT` |
| Delete/Cancel selected | Popup selected hiện có, cần BE bảo vệ bằng `DELETE_EVENT` |

Permission còn thiếu cần BE hỗ trợ:

- FE chưa có `EVENT_UPDATE`; Edit đang dựa vào `EVENT`. Nếu BE muốn tách update, cần thêm/sync `EVENT_UPDATE` ở FE sau.
- Bulk cancel nên được BE guard bằng `DELETE_EVENT`, vì FE có nguy cơ hiển thị khi user chỉ có `EVENT`.

## Event Create

Required Permission:

`CREATE_EVENT`

User role cần truy cập:

Organization Owner hoặc role có `CREATE_EVENT`.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard/current org membership | Self membership read |
| `GET /organizations/switch-org` | Load organization dropdown trong form tạo event | `CREATE_EVENT` dependency hoặc `ORGANIZATION_VIEW` |
| `GET /categories?limit=100` | Load category dropdown | `CREATE_EVENT` dependency hoặc `CATEGORY_VIEW` |
| `POST /upload/image` | Upload banner trước khi submit | `CREATE_EVENT` dependency hoặc `UPLOAD_CREATE` |
| `POST /events` | Tạo event | `CREATE_EVENT` |

Permission còn thiếu cần BE hỗ trợ:

- Nếu `GET /categories` đang bị guard riêng bằng category permission, role chỉ có `CREATE_EVENT` sẽ thiếu dependency. BE nên cho phép `CREATE_EVENT` đọc category list cần thiết hoặc cấp thêm `CATEGORY_VIEW`.
- Nếu upload bị guard riêng, role tạo event cần được phép `POST /upload/image`.

## Event Edit

Required Permission:

FE hiện dùng `EVENT` để mở Update Event popup.

User role cần truy cập:

Organization Owner hoặc role có `EVENT`. Nếu BE tách quyền update thì cần role có `EVENT_UPDATE`.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard/current org membership | Self membership read |
| `GET /events/{id}` | Load event detail trước khi edit | `EVENT` hoặc `EVENT_VIEW` |
| `GET /organizations/switch-org` | Load organization dropdown | `EVENT` dependency, `EVENT_UPDATE` dependency hoặc `ORGANIZATION_VIEW` |
| `GET /categories?limit=100` | Load category dropdown | `EVENT` dependency, `EVENT_UPDATE` dependency hoặc `CATEGORY_VIEW` |
| `POST /upload/image` | Upload banner mới nếu có | `EVENT`/`EVENT_UPDATE` dependency hoặc `UPLOAD_CREATE` |
| `PATCH /events/{id}` | Submit update event | FE đang mở bằng `EVENT`; BE nên đồng bộ `EVENT` hoặc tách `EVENT_UPDATE` |

Permission còn thiếu cần BE hỗ trợ:

- FE chưa có `EVENT_UPDATE` trong permission constants/action guard. Nếu backend đã dùng `EVENT_UPDATE`, frontend sẽ cần sync ở task khác.
- Role edit event cần đọc category/org dropdown, không chỉ quyền update event.

## Event Detail

Required Permission:

`EVENT`

User role cần truy cập:

Organization Owner hoặc role có `EVENT`.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard/current org membership | Self membership read |
| `GET /organizations/detail/{slug}` | Header/current organization detail | Organization member read hoặc `ORGANIZATION_VIEW` |
| `GET /events/{id}` | Load event detail/header/KPI/schedule/location | `EVENT` hoặc `EVENT_VIEW` |
| `GET /events/{id}/ticket-types` | Load Ticket Types card | `EVENT` dependency hoặc `TICKET_TYPE_VIEW` |
| `GET /events/{id}/invites` | Load Invites Summary card | `EVENT` dependency hoặc `INVITE_VIEW` |
| `GET /items/{eventId}` | Load Event Items modal | `EVENT` dependency hoặc `ITEM_VIEW` |

Action/API dependencies trong Event Detail:

| Action | API | FE check hiện tại | Required Permission |
|---|---|---|---|
| Edit Event | `PATCH /events/{id}` qua Update popup | Không thấy guard riêng trong detail, route đang có `EVENT` | `EVENT` hoặc `EVENT_UPDATE` |
| Show Items | `GET /items/{eventId}` | Không thấy guard riêng | `EVENT` hoặc `ITEM_VIEW` |
| Create Item | `POST /items/` | Không thấy guard riêng | `EVENT` hoặc `ITEM_CREATE` |
| Update Item | `PATCH /items/{id}` | Không thấy guard riêng | `EVENT` hoặc `ITEM_UPDATE` |
| Delete Item | `DELETE /items/{id}` | Không thấy guard riêng | `EVENT` hoặc `ITEM_DELETE` |
| Add Ticket Tier | `POST /ticket-types` | Không thấy guard riêng | `EVENT` hoặc `TICKET_TYPE_CREATE` |
| Update Ticket Tier | `GET /ticket-types/{id}`, `PATCH /ticket-types/{id}` | Không thấy guard riêng | `EVENT` hoặc `TICKET_TYPE_UPDATE` |
| Manage Guest List | `POST /invites/check-email`, `POST /invites` | Không thấy guard riêng | `EVENT` hoặc `INVITE_MANAGE` |

Permission còn thiếu cần BE hỗ trợ:

- Event Detail gom nhiều module phụ: ticket type, invite, item. FE hiện coi đây là dependency của `EVENT`.
- Nếu backend tách permission cho Ticket/Invite/Item, role có `EVENT` sẽ vào detail được nhưng bị lỗi khi gọi API phụ. BE cần cho phép theo `EVENT` hoặc FE cần thêm guard chi tiết ở task sau.

## Membership

Required Permission:

`ORGANIZATION_MEMBER_MANAGE`

User role cần truy cập:

Organization Owner hoặc role có `ORGANIZATION_MEMBER_MANAGE`.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard/current org membership | Self membership read |
| `GET /organizations/detail/{slug}` | Lấy `orgId` hiện tại cho payload invite | Organization member read hoặc `ORGANIZATION_VIEW` |
| `GET /membership/org/{slug}?page=&limit=` | Load member list + total members | `ORGANIZATION_MEMBER_MANAGE` |
| `GET /roles/org/{slug}?limit=100` | Load role dropdown khi invite member | `ORGANIZATION_MEMBER_MANAGE` dependency hoặc `ROLE` |
| `GET /membership/users/lookup?email={email}` | Resolve email thành userId | `ORGANIZATION_MEMBER_MANAGE` |
| `POST /membership` | Tạo membership `{ userId, roleId, orgId }` | `ORGANIZATION_MEMBER_MANAGE` |

Permission còn thiếu cần BE hỗ trợ:

- Invite flow không cần `USER_VIEW`; lookup user phải dựa trên `ORGANIZATION_MEMBER_MANAGE`.
- Role dropdown trong invite đang gọi `GET /roles/org/{slug}`. Nếu backend guard endpoint này chỉ bằng `ROLE`, user có quyền mời member nhưng không có `ROLE` sẽ không chọn được role. BE nên cho phép `ORGANIZATION_MEMBER_MANAGE` đọc danh sách role tối thiểu cho invite, hoặc FE cần endpoint role lookup riêng ở task khác.

## Roles

Required Permission:

`ROLE`

User role cần truy cập:

Organization Owner hoặc role có `ROLE`. Create cần `CREATE_ROLE`; update cần `UPDATE_ROLE`.

API dependencies:

| API | Purpose | Required Permission |
|---|---|---|
| `GET /users/{userId}/organizations` | Route guard/current org membership | Self membership read |
| `GET /roles/org/{slug}` | Load role list trong organization workspace | `ROLE` |
| `GET /roles/{id}/permissions` | Load permission chips của từng role | `ROLE` |
| `GET /permissions/owner` | Load canonical permission tree khi owner quản lý role | `ROLE` dependency hoặc owner permission catalog read |
| `POST /roles` | Create role | `CREATE_ROLE` |
| `GET /roles/{id}` | Load role detail trong update popup | `UPDATE_ROLE` dependency hoặc `ROLE` |
| `PATCH /roles/{id}` | Update role | `UPDATE_ROLE` |
| `PATCH /roles/delete` | Delete selected roles | FE chỉ cho Super Admin, không mở cho org workspace role thường | Super Admin hoặc role delete permission nếu BE muốn hỗ trợ |

Component/Button permission:

| Action | FE check hiện tại |
|---|---|
| Create Role | `CREATE_ROLE` |
| Update Role | `UPDATE_ROLE` |
| Delete Role | `isSuperAdmin(permissionCodes)` |

Permission còn thiếu cần BE hỗ trợ:

- Owner/Role manager cần đọc permission catalog (`GET /permissions/owner`) để tạo/sửa role.
- Nếu `GET /roles/{id}/permissions` bị guard quá chặt, role list vẫn hiện nhưng permission chips sẽ rỗng/lỗi.

## Event Flow Deep Check

### A. Event Create

| Step | API | Purpose | Required Permission |
|---|---|---|---|
| 1 | `GET /users/{userId}/organizations` | Xác định org workspace và permission | Self membership read |
| 2 | `GET /organizations/switch-org` | Org dropdown | `CREATE_EVENT` dependency hoặc `ORGANIZATION_VIEW` |
| 3 | `GET /categories?limit=100` | Category dropdown | `CREATE_EVENT` dependency hoặc `CATEGORY_VIEW` |
| 4 | `POST /upload/image` | Upload banner | `CREATE_EVENT` dependency hoặc `UPLOAD_CREATE` |
| 5 | `POST /events` | Tạo event | `CREATE_EVENT` |

### B. Event Edit

| Step | API | Purpose | Required Permission |
|---|---|---|---|
| 1 | `GET /events/{id}` | Load detail vào form edit | `EVENT` hoặc `EVENT_VIEW` |
| 2 | `GET /organizations/switch-org` | Org dropdown | `EVENT`/`EVENT_UPDATE` dependency hoặc `ORGANIZATION_VIEW` |
| 3 | `GET /categories?limit=100` | Category dropdown | `EVENT`/`EVENT_UPDATE` dependency hoặc `CATEGORY_VIEW` |
| 4 | `POST /upload/image` | Upload banner mới nếu có | `EVENT`/`EVENT_UPDATE` dependency hoặc `UPLOAD_CREATE` |
| 5 | `PATCH /events/{id}` | Update event | FE dùng `EVENT`; BE cần đồng bộ hoặc thêm `EVENT_UPDATE` cho FE sau |

### C. Event View Detail

| API | Purpose | Required Permission |
|---|---|---|
| `GET /events/{id}` | Detail/header/KPI | `EVENT` hoặc `EVENT_VIEW` |
| `GET /events/{id}/ticket-types` | Ticket Types | `EVENT` dependency hoặc `TICKET_TYPE_VIEW` |
| `GET /events/{id}/invites` | Invitation summary | `EVENT` dependency hoặc `INVITE_VIEW` |
| `GET /items/{eventId}` | Item modal list | `EVENT` dependency hoặc `ITEM_VIEW` |
| `GET /ticket-types/{id}` | Ticket tier edit detail | `EVENT` dependency hoặc `TICKET_TYPE_VIEW` |
| `POST /ticket-types` | Create ticket tier | `EVENT` dependency hoặc `TICKET_TYPE_CREATE` |
| `PATCH /ticket-types/{id}` | Update ticket tier | `EVENT` dependency hoặc `TICKET_TYPE_UPDATE` |
| `POST /invites/check-email` | Validate guest emails | `EVENT` dependency hoặc `INVITE_MANAGE` |
| `POST /invites` | Send guest invites | `EVENT` dependency hoặc `INVITE_MANAGE` |
| `POST /items/` | Create item | `EVENT` dependency hoặc `ITEM_CREATE` |
| `PATCH /items/{id}` | Update item | `EVENT` dependency hoặc `ITEM_UPDATE` |
| `DELETE /items/{id}` | Delete item | `EVENT` dependency hoặc `ITEM_DELETE` |

## Findings Cần Đồng Bộ RBAC

1. `ORGANIZATION_MEMBER_MANAGE` đã là permission chính cho Membership route và Invite Member. Backend cần cho phép permission này gọi `GET /membership/org/{slug}`, `GET /membership/users/lookup`, `POST /membership`, và role dropdown tối thiểu.

2. Event module đang dùng `EVENT` như permission cha cho view/list/detail/edit phụ. Nếu backend tách `EVENT_VIEW`, `EVENT_UPDATE`, `TICKET_TYPE_*`, `INVITE_*`, `ITEM_*`, frontend sẽ cần task sync permission guard riêng. Còn hiện tại để tránh lỗi 403, BE nên map các API phụ theo `EVENT` hoặc cấp dependency permission đầy đủ cho role event manager.

3. `GET /categories` và `POST /upload/image` là dependency bắt buộc của create/edit event. Role có `CREATE_EVENT` hoặc event update cần được gọi 2 API này.

4. `GET /organizations/detail/{slug}` và `GET /users/{userId}/organizations` được dùng như hạ tầng org workspace/header/guard. Nếu backend khóa bằng permission nghiệp vụ quá hẹp, nhiều page sẽ lỗi trước khi page guard hoàn tất.

5. Role management cần `GET /permissions/owner` để load permission tree. Owner hoặc role manager không có endpoint này sẽ không tạo/sửa role đầy đủ được.

6. Một số action trong Event Detail không có button guard riêng ở FE: Show Items, Ticket Tier create/update, Invite Guest. Backend cần là lớp bảo vệ cuối cùng hoặc FE cần task sau để bổ sung guard chi tiết.
