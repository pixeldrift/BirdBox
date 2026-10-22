# Controls: one look for each job

| Job | Look | Where |
| --- | --- | --- |
| Main sections (Caging, Feed/Water…) | Rounded **pill tabs** with an icon | Tab bar under the top bar — the only place pills are used for navigation |
| Going down a hierarchy | **Breadcrumb links** separated by › (olive-red text links) | Caging explorer, taxonomy explorer, pickers |
| Switching a view, or one-of-few filters (Browse/Tree/All, List/Grid, status, Commonly kept/All species) | **Segmented control** — joined rectangular buttons, selected one tinted | `.loc-seg`, `.filter-chips` |
| Filters you've turned on | **Square chips with ✕** under the controls | `.loc-chip`; opened from a **Filter** button |
| Sorting | **Dropdown** (compact, labelled "Sort") | `.loc-select` |
| Primary action | Filled olive button | `+ Add new`, Save |
| Status | Small tinted label | badges, flags |

Rule of thumb: if it moves you somewhere, it's a tab or a breadcrumb; if it changes what you're looking at, it's a segmented control, a filter or a sort. Don't mix the looks.
