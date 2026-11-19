# TEST_LOG

Manual test record for the CubeTech web development assessment.
Fill in **Status** (Pass / Fail / Not Tested) and **Notes** only after you have actually run each check.

| Check ID | Acceptance Criteria | Status | Notes |
|----------|---------------------|--------|-------|
| 01 | Search, category filter, and both price sorts work together. No-match and invalid product states are handled. | Not Tested | |
| 02 | Cart merges duplicate products, persists after refresh, and calculates the PHP 325.50 example correctly. | Not Tested | |
| 03 | Empty checkout, invalid customer fields, and invalid/excessive quantities are blocked. | Not Tested | |
| 04 | Inactive/out-of-stock items cannot be ordered. Checkout detects price or availability changes before saving. | Not Tested | |
| 05 | A successful order shows confirmation, appears in admin, reduces stock, and clears the cart. Failed saves preserve the cart. | Not Tested | |
| 06 | Admin product/category changes appear on the customer site after refresh. Referenced records cannot be deleted. | Not Tested | |
| 07 | Valid statuses save; invalid transitions fail. Eligible cancellation restores stock once, including after refresh. | Not Tested | |
| 08 | Completed-order totals and unique-email customer counts match the underlying orders. | Not Tested | |
| 09 | Existing order prices/names remain unchanged after product edits. Data persists as described for the chosen approach. | Not Tested | |
| 10 | Customer/admin screens work at approximately 375 px and 1280 px widths. No clipped controls, horizontal page scrolling, or major console errors. | Not Tested | |

**Tested on:** (date, browser, OS)
**Database used:** (SQLite / MySQL)