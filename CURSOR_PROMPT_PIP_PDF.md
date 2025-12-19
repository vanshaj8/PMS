# Copy-Paste Prompt for Cursor

## Direct Prompt:

Create a comprehensive PDF generation feature for PIP track records that generates a professional document similar to an annual appraisal letter. 

**Backend Implementation:**
1. Add Apache PDFBox dependency to `pom.xml`
2. Create a new service class `PIPTrackRecordPDFService.java` that generates PDFs
3. Add endpoint `GET /api/pips/{pipId}/track-record-pdf` in `PIPController.java`
4. The PDF should include:
   - **Header**: Company header, PIP ID, Employee/Manager/HRBP names, generation date
   - **Executive Summary**: Status, outcome, success score, key highlights
   - **Workflow Timeline**: All steps (HRBP Review, Employee Acknowledgement, Active Period, Self-Review, Manager Review, HRBP Decision) with dates and statuses
   - **Goals Section**: All goals with weightage, expected outcome, achievement status, manager comments, employee justification
   - **Check-in History**: Table with dates, progress notes, employee/manager feedback
   - **Performance Metrics**: Success criteria breakdown, minimum vs actual score, calculation method
   - **Review Summaries**: Employee self-review, manager review, HRBP final decision
   - **Extension History**: If applicable, show extensions with reasons
   - **Compliance Metadata**: Timeline versions, SLA attribution, compliance mode
   - **Footer**: Page numbers, confidentiality notice

**Frontend Implementation:**
1. Add "Download Track Record PDF" button on `PIPDetailPage.tsx`
2. Show loading state while generating
3. Handle download with proper error handling
4. Button should be visible to all roles (employee, manager, HRBP, admin)

**Styling Requirements:**
- Professional formatting with Arial/Times New Roman fonts
- Proper spacing, margins, and page breaks
- Tables with borders and alternating row colors
- Headers and subheaders with clear hierarchy
- Company color scheme integration
- Watermark "CONFIDENTIAL" or "INTERNAL USE ONLY"
- PDF filename: `PIP_TrackRecord_{EmployeeName}_{PIPId}_{Date}.pdf`

**Error Handling:**
- Handle incomplete PIP data gracefully
- Show user-friendly error messages
- Log errors for debugging

**Testing:**
- Test with completed PIPs
- Test with in-progress PIPs
- Test with missing data scenarios
- Ensure PDF size is reasonable (< 5MB)

