# Healthcare Costs prototype

Open **index.html** in a modern browser. No installation or internet connection is required. Keep the assets folder beside the HTML file. If using the ZIP, extract it first.

Start on Home, choose **Add a cost**, then **Healthcare visit** or **Medication**. Visit entry supports all listed categories, expenses, assistance, and confirmation. Medication entry supports new medications, refills, the supplied photo example, editable review, removal, and confirmation. Saved records update the home total.

The reference width is **402 px**. Desktop browsers center the mobile screen; narrower displays proportionally scale it. Long forms scroll. Refreshing clears the prototype's in-memory records. Entered values and uploaded photos are not transmitted or saved to a server.

## What was reproduced and verified

- Twenty reference layouts cover the main visit and medication flows, including the screen labelled **0. Labelled with Design System** (402 × 832).
- Original Figma vectors, static text outlines, icons, and the embedded label photograph are retained. Editable controls use bundled Inter 400/500/600/700.
- Reusable form controls use the design colors and measured component geometry, with selected, disabled, error, hover, pressed, and focus behavior.
- Both main flows were exercised in the browser, including required-field errors, segmented selections, expense entry, saving, and updated home totals. A 375 × 812 layout was checked for horizontal overflow.
- Screenshots were compared to full-resolution Figma PNG exports. The accompanying validation report distinguishes direct captures from stitched long-form captures. This is a close reproduction, not a claim of pixel identity.

## Remaining differences and assumptions

1. The implementation combines the exact exported SVG layouts with accessible HTML controls and in-memory behavior. It is a prototype, not a production application or a fully responsive component library.
2. Browser text antialiasing, editable field typography, dropdown/calendar popups, and dynamic record rows differ slightly. Original static artwork and geometry are preserved. Tall-frame screenshots use stitched 402-pixel-wide mobile captures because the screenshot tool truncates tall viewports.
3. Uploading a label previews a local photo. There is **no OCR or camera-flash integration**. All review fields now start empty and require manual entry, as requested. Entered data drives the saved summary instead of forcing the unrelated Aspirin example.
4. Dropdown options beyond those visible in Figma, required-field rules, focus rings, and smaller-screen scaling are conservative assumptions. The home expandable menu follows the supplied component pattern. Individual prototype connections were only partially inspected; unspecified transitions follow the numbered main-flow screens.
5. Costs opens session records. Account opens a minimal explanatory dialog because no corresponding account design was supplied. Intake and 3-month check-in questionnaires are included. Detected-visit flows remain outside the current prototype scope.
6. Screen appearance takes precedence over inconsistent system labels: the white Surface swatch prints a blue hex value; the Border role prints a different hex from its gray swatch; screen labels often use 500 rather than the scale's 600; screen field radii and checkbox borders differ from the component examples. These differences were preserved rather than normalized.
7. Reference dates and home greeting remain as supplied. Session data resets on refresh; there is no sign-in, backend, or real health-record integration.

## Figma export settings

Temporary SVG export settings were added to the selected screen layers while obtaining assets. Automatic approval review blocked restoring those settings through undo because it could affect shared document changes. Visual design content was not intentionally changed. Export settings may therefore remain in the source Figma file.

## Files

- `index.html`: opening page
- `app.js`: reusable controls, navigation, validation, session records
- `styles.css`: tokens, interactive states, mobile behavior
- `screens.js`: original reference geometry and vector artwork
- `frame-manifest.json`: source frame names and exact dimensions
- `assets/`: Inter fonts and their license

Direct reference views are available with URL fragments such as `#system-reference`, `#primary`, `#hospital`, `#new-medication`, and `#review`.

## Feedback update — September 17

- Expanded buttons retain their original leading icons.
- Yes/no questions start unselected. Follow-ups are hidden until Yes is selected, with the remaining layout moving up. The next yes/no question remains independent.
- Fields start empty with guidance using colour/text/placeholder (#535353). Existing drafts remain when navigating back; explicitly choosing a saved refill can populate its details.
- Browser verified: blank initial fields across visit and medication forms; hospital and expense conditional sections; switching Yes to No; visit and medication saving; expanded medication icon at 402 × 874.
- The original screenshot comparison gallery predates this feedback. Its metrics do not describe the updated empty/collapsed states; these intentionally differ from the populated reference frames.


## Expense Logging template update

Verified against Components & Templates > Expense Logging (Figma node 97:795).

- Starts with no expense rows. After answering Yes to expenses, Add expense is available inline.
- Each click adds one blank expense-type and cost row with an individual delete button.
- Deleting a row removes it and its amount; deleting the last row returns to the empty state.
- Rows expand the page and move Assistance and the footer down. No hides the entire expense block and excludes its amounts from the saved total. Switching back to Yes restores the current draft.
- Original supplied add, dropdown, and delete icons are reused, with existing field and button styling.
- Tested in the browser at 402 × 874: empty state, adding multiple rows, blank new fields, deleting middle and final rows, Yes/No visibility, and saved totals ($12.50 + $4.00 = $16.50 after deleting an $8.00 row).
- The template's generic test/procedure placeholder is adapted to Select an expense type in the expense flow. Each added row requires a type and nonnegative cost before saving; these validation rules remain prototype assumptions.

## Calendar interaction update

Calendar icons open an in-page calendar directly, without an intermediate dialog or Use date button. Selecting a date immediately updates the field and draft. Verified opening medication start/end calendars and hospital admission calendar, and selecting dates by keyboard. The calendar width and position are constrained to the mobile screen, including right-hand date fields. Verified on the centered 402px screen and at 320px, including month navigation and selecting a date.


## Date of visit update

Every healthcare visit category now includes an empty Date of visit question directly underneath Type of visit. It uses the shared date field and direct calendar picker. The date is required before continuing, persists during back navigation, is saved with visit details, and appears on the Home record. Checked all seven visit categories plus the design-system reference form, direct calendar selection, conditional follow-ups, and saving.




## Ontario hospital suggestions

Name of hospital suggests matches after two characters, searching hospital names, city names, and common aliases. Suggestions include city and ON, support pointer and arrow-key/Enter selection, and fit within the field width. Escape or leaving the field dismisses suggestions. Users can enter an unlisted name. The bundled list has 51 Ontario entries and is a prototype starter directory, not an exhaustive registry. Sources are documented in hospital-sources.md. Search runs locally. Verified Ontario filtering, alias search, keyboard/pointer selection, clearing a query, manual entry, back navigation, and saved hospital details.


## Google Maps verification update

The original Ontario list was cross-checked on Google Maps and expanded to 51 entries. London Health Sciences Centre is now directly selectable; campus and familiar former names remain searchable. See hospital-maps-verification.md for dated checks and name/campus caveats. This is not a complete or live Ontario registry.

Discharge to now uses the same 51-entry Ontario hospital suggestions as Name of hospital, including aliases, keyboard selection, and manual entry. Verified that the two fields retain independent selections.


Removed Was assistance needed because of knee replacement and its Yes/No options from expense logging. Both assistance-hours fields now follow the remaining assistance question and appear only for Yes. Verified the layout with the section collapsed and expanded.


## Hours input component alignment

Both assistance-hours fields now match Component Library > Input/number (Figma 98:1031, Default 98:1030): 336 × 43, 4px radius/input-field, 16px content inset, white surface, #E3E3E3 default border and #005586 active border, with hour(s) inside the right edge. The visible 0 is placeholder guidance; values start empty. Verified dimensions, default/active styling, decimal entry, and Yes/No hide/show behavior.


Paid employment: Every healthcare visit's first page except Pharmacy includes an initially unselected Yes/No question about time off paid employment. Yes reveals an empty hours input using the design-system number component. No hides and clears it. Entered hours save with the visit separately from assistance-related hours on the expenses page. Verified across all seven visit categories and through saving a test visit.


The default prototype viewport is 402 × 874 pixels. Longer pages scroll vertically inside this fixed frame; navigation resets the frame to the top. On screens narrower than 402 pixels, the frame scales proportionally to fit.


Form navigation is anchored to the bottom of the 402 × 874 frame. Forward actions remain disabled until required visible fields and Yes/No questions are complete; hidden follow-ups do not block progress. Back remains available. Verified conditional employment hours and expense answers.


Hospital name, clinic name, and Discharge to hospital-name fields have been removed. Their layout space is collapsed and they no longer affect validation or saved visit details.


All visible question inputs are required unless explicitly labelled optional. The optional major surgery/procedure field remains optional. Hidden follow-up fields do not block navigation. Answering Yes to other expenses requires at least one completed expense row. Unchecked applicability checkboxes represent No rather than requiring a checked assertion.


Hospital visits include a required Name of hospital field with Ontario hospital suggestions. Clinic name and Discharge to remain removed.


Family Doctor visits now ask whether the user was referred for a test/procedure. Yes reveals required Test/procedure referred for and Date of appointment fields, with the existing calendar widget. Walk-In Clinic retains its existing test questions.


All medical specialist visits use the referral question with required test/procedure and appointment-date follow-ups shown only after Yes.


Walk-In Clinic visits now use the same referral question and conditional required test/procedure and appointment-date fields as Family Doctor visits.


Visit search matches Figma Input/search bar (98-1051): 336 × 43, radius 4, white surface, 1 px #E3E3E3 border, 16 px Material Symbols search icon, 13 px icon/text gap, and placeholder #535353. The search stays fixed beneath the scrolling visit list. Search-result navigation verified.


DIN and its help control have been removed from medication logging; the remaining fields move up and DIN is no longer required or saved.


Medication name offers the 25 supplied medication choices. Focus shows the list; typing filters by brand or generic name. Manual entry remains supported. Filtering and selection verified.



## Questionnaire flows

Added from the locally saved Figma Screens exports: intake 1.0–1.3 (including medication/refill entry), and 3-month check-in 2.0–2.6. Both are accessible from Home notification cards. The live Figma Components & Templates Action Notification Card was reviewed at node 157:1095. Cards appear above Your Healthcare Costs in the existing Home layout, with Start/Continue actions. Legacy questionnaire-home links return to this Home screen. Existing visit, medication, and cost page designs are retained. Questionnaire inputs preserve drafts between steps within the current browser session. Required visible fields are checked on Next/Finish; conditional follow-ups are hidden when not applicable. Completion dismisses the corresponding Home notification for that session.

Verification: browser-tested intake completion, required-answer errors, medication entry returning to intake, all five check-in steps, caregiving and living-status conditional fields, and check-in completion. The local exported SVGs contain the displayed dropdown selections but not expanded option menus; employment and income option lists are prototype defaults pending confirmation against the live Figma component variants.
