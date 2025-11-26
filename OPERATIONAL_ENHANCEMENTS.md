# FiberTrace Mobile App - Operational Enhancements

## Overview

The mobile app has been enhanced with comprehensive job management and operational unit fine-tuning capabilities. Technicians can now create, manage, and optimize fiber installation jobs directly from the mobile device with real-time GPS tracking and node management.

---

## New Features for Fine-Tuning Operations

### 1. **Node Selection & Multi-Node Routing**

**What It Does:**
- Select multiple fiber nodes directly on the map (OLT, Splitter, FAT, ATB, Closure)
- Selected nodes turn neon cyan to highlight them
- Real-time node count display

**How to Use:**
1. Open Map screen
2. Tap any node to select it (icon turns cyan)
3. Tap more nodes to add to selection
4. Node count shows in bottom panel: "Nodes: 3"

**Use Case:** Plan complex routes connecting multiple network points before creating a job.

---

### 2. **Job Creation with Route Optimization**

**What It Does:**
- Create jobs directly from the map
- Include GPS-tracked routes
- Auto-calculate cable needs based on distance
- Estimate completion time

**How to Use:**
1. **Select nodes** on map (tap nodes to highlight cyan)
2. **Optional: Record GPS path** - Tap "Start GPS" to track your route
3. Tap **"Create Job"** or **"{N} Nodes"** button
4. Fill in job details:
   - Job Type: Installation, Maintenance, Repair, Inspection
   - Address (required)
   - Materials used
   - Additional notes
5. Review the route summary showing:
   - GPS points collected
   - Distance (km)
   - Estimated cable needed (m)
   - Estimated time (minutes)
6. Tap **"Create Job"** to save

**Auto-Calculations:**
- **Cable Estimate:** `distance × 1.15` (adds 15% buffer for actual routing)
- **Time Estimate:** `30 + (distance × 10) + (nodes × 5)` minutes
- **Route Distance:** Calculated from GPS points using Haversine formula

---

### 3. **Job Management & Status Tracking**

**Job List View:**
1. Go to **Jobs** tab
2. See all jobs with:
   - Job type (Installation, Maintenance, etc.)
   - Status badge (Pending/In Progress/Completed)
   - Address
   - Scheduled date
   - Preview of notes
3. **Pull down to refresh** the job list

**Job Details Screen:**
1. Tap any job card to open full details
2. View all job information:
   - Type and status
   - Address and scheduled date
   - Completion date (if done)
   - Cable used (meters)
   - Materials used
   - Complete notes

**Update Job Status:**
In job details screen:
1. Tap **"Start"** → Mark as "In Progress"
2. Tap **"Complete"** → Mark as "Completed"
3. Tap **"Done Editing"** to save notes

**Edit Notes:**
1. Open job details
2. Tap **"Edit Notes"**
3. Update notes field
4. Tap **"Done Editing"** to save

---

### 4. **Operational Unit Performance Metrics**

**Job Details Include:**

| Metric | Description |
|--------|-------------|
| **Status** | Pending, In Progress, or Completed |
| **Distance** | Total route distance in km (GPS calculated) |
| **Cable Needed** | Estimated fiber optic cable in meters |
| **Power Impact** | Complexity based on node count |
| **Nodes** | Number of network points involved |

**Power Impact Levels:**
- **No nodes selected** → "No nodes selected"
- **1-2 nodes** → "Low - Few nodes"
- **3-5 nodes** → "Medium - Multiple nodes"
- **6+ nodes** → "High - Complex route"

---

### 5. **GPS Tracking & Route Recording**

**How GPS Tracking Works:**
1. Tap **"Start GPS"** on map screen
2. GPS records your position every 5 seconds
3. Route displays as cyan line on map
4. Tap **"Stop GPS"** to finish tracking
5. GPS points included when creating job

**Route Summary in Job Form:**
```
GPS Points: 42
Distance: 2.35 km
Est. Cable: 2703 m
Est. Time: 53 min
```

**Uses:**
- Verify actual traveled distance
- Ensure cable estimates are accurate
- Document technician route
- Plan future jobs

---

### 6. **Fiber Route Documentation**

**Automatic Route Saving:**
When you create a job with a GPS route:
- Route is saved to backend as "Fiber Route"
- Stores GPS coordinates
- Calculates distance automatically
- Links to job ID for reference

**What Gets Saved:**
```
Route Name: Installation - 123 Main Street
Route Type: GPS (technician tracked)
Coordinates: [37.7749, -122.4194], [37.7755, -122.4200], ...
Distance: 2.35 km
Job ID: 42
```

---

## Workflow Example: Creating a Complex Installation Job

### Scenario:
You need to install fiber connecting OLT-A → Splitter-1 → FAT-3 → Customer location

### Steps:

**On Map Screen:**
1. Tap OLT-A node → turns cyan, "Nodes: 1"
2. Tap Splitter-1 → turns cyan, "Nodes: 2"
3. Tap FAT-3 → turns cyan, "Nodes: 3"
4. Tap **"Start GPS"** to begin tracking
5. Drive/walk to customer location
6. Stop before customer location
7. Tap **"Stop GPS"** → GPS path recorded
8. Tap **"Create Job"** button

**In Job Form:**
1. Select Job Type: "Installation"
2. Enter Address: "123 Main Street, San Francisco"
3. System shows:
   ```
   GPS Points: 23
   Distance: 3.2 km
   Est. Cable: 3680 m
   Est. Time: 75 min
   Nodes: 3
   ```
4. Enter Materials: "Standard SM fiber, SC connectors"
5. Enter Notes: "Customer wants blue conduit, high priority"
6. Tap **"Create Job"**

**Result:**
- Job created with ID #42
- Route saved with GPS coordinates
- Status: Pending
- Ready for technician to start work

---

## Files & Code Structure

### New Files Added:

**Managers & Utilities:**
- `mobile/src/lib/jobManager.ts` - Job creation and operational unit logic

**Screens:**
- `mobile/src/screens/JobFormModal.tsx` - Job creation form with route preview
- `mobile/src/screens/JobDetailsScreen.tsx` - Full job details and status management

**Updated Screens:**
- `mobile/src/screens/MapScreen.tsx` - Added node selection and job creation trigger
- `mobile/src/screens/JobsScreen.tsx` - Added tap-to-view and job details modal

**API Enhancements:**
- `mobile/src/lib/api.ts` - Added job update/delete endpoints

---

## API Endpoints Used

**Creating Jobs:**
```
POST /api/jobs
{
  type: "Installation",
  address: "123 Main St",
  status: "Pending",
  scheduledDate: "2025-11-25T...",
  cableUsed: "3680",
  materialsUsed: "SM fiber, connectors",
  notes: "...",
  clientId: 1,
  technicianId: 1
}
```

**Updating Jobs:**
```
PATCH /api/jobs/{id}
{
  status: "In Progress",
  notes: "Started work..."
}
```

**Saving Routes:**
```
POST /api/fiber-routes
{
  name: "Installation - 123 Main St",
  routeType: "GPS",
  coordinates: [[37.7749, -122.4194], ...],
  distance: 2.35,
  jobId: 42
}
```

---

## Advanced Features for Fine-Tuning

### Route Optimization Tips:
1. **Multi-Node Routes:** Select nodes in order of visit for realistic routes
2. **GPS Tracking:** Always track actual route for accurate cable estimates
3. **Buffer:** System adds 15% cable buffer - this is for splicing and slack
4. **Time Estimates:** Based on distance + complexity (more nodes = longer)

### Performance Monitoring:
- **Cable Efficiency:** Compare estimated vs. actual cable used
- **Time Tracking:** Monitor job duration vs. estimated time
- **Route Accuracy:** Verify GPS distances match planned routes

### Best Practices:
1. **Before Starting:** Select all nodes and review job form estimates
2. **During Work:** Keep GPS tracking active for accurate documentation
3. **After Completion:** Mark job complete and add final notes
4. **Review:** Check power impact and material usage for future planning

---

## Troubleshooting Operational Issues

### Problem: Cable Estimate Too High
**Solution:** 
- The 15% buffer is for splicing. You can use less if experience shows you don't need it.
- Adjust Materials field if using different cable type.

### Problem: Time Estimate Was Way Off
**Solution:**
- GPS distance might differ from straight-line distance
- Node count affects estimate
- Consider terrain, weather, permit issues in next estimate

### Problem: Can't Select Nodes
**Solution:**
- Make sure nodes are visible on map (zoom in if needed)
- Nodes must be fully loaded from backend
- Check network connection

### Problem: Job Created But Route Not Showing
**Solution:**
- Routes only save if GPS path has 2+ points
- Fiber route saves automatically in background
- Check backend logs to verify POST /api/fiber-routes worked

---

## Dashboard Insights (Future Enhancement)

Proposed metrics for tracking operational efficiency:
- Average cable usage efficiency (actual ÷ estimated)
- Time tracking accuracy
- Node complexity trends
- Route optimization opportunities
- Material cost tracking

---

## Summary of Operational Improvements

✅ **Node-based job planning** - Multi-node route creation  
✅ **Automatic calculations** - Cable and time estimates  
✅ **GPS documentation** - Real-time route tracking  
✅ **Job lifecycle** - Pending → In Progress → Completed  
✅ **Route optimization** - Distance-based cable estimation  
✅ **Material tracking** - Complete material documentation  
✅ **Status management** - Real-time job status updates  
✅ **Route persistence** - Fiber routes saved to backend  

---

## Next Phase Ideas

**Phase 4 (Future):**
- Power analysis during route creation
- Splice record documentation
- Bluetooth meter integration for live readings
- Photo documentation per job
- Team collaboration (job assignment)
- Real-time synchronization with web app
