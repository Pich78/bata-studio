# Batá Studio: Detailed Specifications

## 1. Architecture and Technologies (JavaScript Only)

* The entire application will be built using **HTML, CSS, and JavaScript**.
* Parsing of the `.tubs` format, audio playback logic, and all User Interface (UI) management will occur **client-side** using JavaScript.
* **Tone.js** (based on the Web Audio API) will be used for audio playback to ensure precision and efficient sample management.
* Drum sample `.wav` audio files will be **embedded directly within the HTML file** (e.g., as Base64 data) to ensure the application is completely self-contained after initial loading.

## 2. Input/Output File (`.tubs`)

* The `.tubs` format remains the standard for importing and exporting rhythms.
* **`.tubs` Structure:**
    * **First Line (Toque Name):** `Toque Name: "ToqueName"`
    * **Sections:** Each section has a header with the following **fixed order**:
        1.  `Section: "SectionName"` (e.g., `Section: "Part 1"`)
        2.  `Repetitions: N` (where `N` is an integer indicating the number of repetitions for the section)
        3.  `Time: Metric` (e.g., `4/4`, `6/8`, `12/8`, etc., indicates the time signature of the section)
        4.  `Next Section: "NextSectionName"` (Indicates the name of the section to transition to after normal repetitions. If the section does not exist in the file, this field will be interpreted as an empty string `""`. If the line is absent, an empty string is assumed.)
        5.  `Max Loops: N` (where `N` is an integer indicating the maximum number of times the flow can loop through this section, or a loop including this section. **The default value is 4** if absent or `0`.)
        6.  `Loop Exit Section: "PostLoopSectionName"` (Indicates the name of the section to transition to **when the `Max Loops` limit is reached**. If empty, absent, or the section does not exist, playback will proceed to the next section in the file's order.)
    * **Beat Sequence:** Followed by **three lines**, one for each drum, in **fixed order**:
        1.  `Okonkolo: BeatSequence` (e.g., `Okonkolo: S-OS-OS-OS-OS-OS`)
        2.  `Itotele: BeatSequence` (e.g., `Itotele: S--S--B--S--S--B`)
        3.  `Iya: BeatSequence` (e.g., `Iya: B---S---S---S---S`)
* **Allowed Beat Symbols:** `S` (Slap), `O` (Open), `P` (Pressed), `B` (Mouth/Bite), `T` (Finger/Ghost Note), `-` (Rest).

## 3. Core Application Features

* **Interactive Editor (Primary Feature):**
    * The app will open displaying an **interactive "white" grid** ready to be populated (empty initial section).
    * The user can **insert beats** by clicking or interacting with the grid cells.
    * **Grid Adjustment:**
        * The user can select the **time signature** (e.g., `4/4` or `6/8`) for the section via two input fields for numerator and denominator.
        * They can also specify the **number of subdivisions** (quarter, eighth, sixteenth, or thirty-second notes) per measure via a dropdown menu.
        * The grid will **dynamically adapt** to changes in time signature and subdivisions, and already inserted beats will **maintain their relative positions**.
    * **Section Management:**
        * Each section will have its header displayed in the UI with: **section name, number of repetitions, next section, loop limit (Max Loops), and loop exit section (Loop Exit Section)**. These controls will be **always visible and editable when the application is not playing**.
        * **"Add Section" Button:** This button will be "floating"; it will **appear as a single button** when the mouse hovers for a certain time near the bottom edge of a section or between two sections, allowing a section to be added at that point. Once the section is added, it disappears.
        * **Edit Repetitions:** Numeric input to specify the **number of times a section should be repeated**.
        * **"Next Section" Selection:** Via a **dropdown menu** that will only show names of already defined sections. If a "next section" loaded from a file does not exist, it will be displayed as an empty string, and the user can correct it.
        * **Max Loops:** Numeric input to specify the loop limit. **The default value in the editor will be 4.**
        * **"Loop Exit Section" Selection:** Via a **dropdown menu** that will only show names of already defined sections. If a loop exit section loaded from a file does not exist, it will be displayed as an empty string.
        * **Move Sections:** Using dedicated buttons on each section, the user can **move a section up or down** relative to others.
        * **Delete Sections:** Using dedicated buttons, the user can **delete a section**.
    * **Immediate Playback:** It will be possible to **immediately listen to the created rhythm** directly from the editor, respecting repetitions, section flow, and `Max Loops` limits with their respective exits.
* **Load Rhythm:**
    * It will be possible to **load a `.tubs` file from the user's local disk** using the **File System Access API**.
    * **There will be no specific visual indication** (e.g., spinner) during loading operations.
    * Once loaded, the `.tubs` content will be displayed in the editing grid, respecting all sections, repetitions, flows, and loop limits.
* **Save Rhythm:**
    * It will be possible to **download the created or modified rhythm** in `.tubs` format to the user's local disk, also via the File System Access API.
    * **There will be no specific visual indication** during saving operations.
    * The user **must enter the toque name** before being able to save the file. If the toque name is not present, saving will not be allowed.
    * The sequence saved in the `.tubs` file will be **exactly as displayed on screen** at the time of saving, including the order of sections and all metadata.
    * **Validation on Save:** During saving, the system will **verify that everything is in order**, including the **uniqueness of section names** (treated as case-insensitive) and the validity of `Next Section`/`Loop Exit Section` references to existing sections.
    * **Errors** (e.g., malformed file on load, toque name not entered on save, duplicate section names) will be communicated to the user via **error popup windows**.

## 4. Parsing and Validation (JavaScript Side)

* The JavaScript parser will handle reading, interpreting, and validating `.tubs` data (both for loaded files and internal generation from the editor).
* **Ignore Spaces:** The parser will ignore extra spaces in headers and after colons in drum definitions.
* **Symbol Validation:** It will verify that beat sequences contain only allowed symbols.
* **Section Structure Validation:** It will report errors if a section does not have all three drum lines or if lines are missing.
* **Sequence Length Validation:** It will report an error if the three beat sequences within the same section **do not have exactly the same number of characters**. There will be no implicit normalization or expansion with rests; the length must match.
* **Time Unit Deduction:** The "time unit" for a section will be deduced from the common length of the sequences and the specified metric.
* **"Next Section" and "Loop Exit Section" Validation:** The parser will verify that the specified section name actually exists in the `.tubs` file. If it does not exist, the value will be set as an empty string internally for the editor.
* **Case Insensitivity of Section Names:** All section names (in the `.tubs` file and in the UI) will be treated as **case-insensitive**. Any user input for section names will be automatically converted to **lowercase** for internal consistency.

## 5. Audio Sample Management and Playback (JavaScript Side)

* **Sample Naming:** `.wav` files will follow a standard naming convention (e.g., `iya_slap.wav`). They will be preloaded and embedded in the HTML. The **exact technical specifications for audio samples** (sampling rate, bit depth) will be defined later, when data is available.
* **Sound and Rest Behavior:**
    * Each sample plays for its natural resonance.
    * A new beat for the same drum immediately interrupts the previous one.
    * A rest (`-`) longer than the previous sample's resonance introduces silence.
* **Playback Controls:** **Play, Pause, Stop** buttons.
* **Speed Slider (BPM):** Will control the tempo based on the **quarter note as the reference unit** (`1/4 = 120 BPM`).
* **Volume:** It **will not be possible to adjust the volume** of individual drums in this version.
* **Drum and Face Muting:** Mute behavior is detailed in the user interface (section 6). The audio logic will be:
    * **Mouth:** Plays if the beat is `O` (Open), `P` (Pressed), or `B` (Mouth/Bite).
    * **Butt (Culatta):** Plays if the beat is `S` (Slap) or `B` (Mordito).
    * If the mouth is muted, for `B` beats, only the Slap sound will be played.
    * If the butt is muted, for `B` beats, only the Open sound will be played.
    * Current audio samples (`iya_slap.wav`, `iya_open.wav`, etc.) are sufficient for this logic.
* **Missing Sound Simulation:**
    * **Mordito (`B`):** **Simultaneous** playback of "Open Beat" (`O`) and "Slap" (`S`) samples of the same drum.
    * **Pressed (`P`):** Replaced by the playback of the "Open Beat" (`O`) sample.
    * **Finger (`T`):** If the specific sample is not present, it will be replaced by a **rest (`-`)**.
    * **Slap (`S`):** Slap is always related to the **butt**.
    * **Open (`O`) and Pressed (`P`):** These beats are always related to the **mouth**.
* **Playback Flow Logic:**
    * Playback starts by default from the **first section of the file**, but a starting section can be selected from the UI.
    * **Rhythm Visualization:** As time progresses and sound is active, the **grid column** that is currently playing will be **visually highlighted in white**. There will be no visual metronome or numeric count.
    * **Measure/Section Transitions:** There will be no specific click sound or visual indication to mark the beginning of a new measure or section during playback.
    * After completing a section's `Repetitions`:
        * If `Next Section` is specified and valid, the flow transitions to that section.
        * If `Next Section` is not specified or not valid, the flow transitions to the next section in file order.
    * During playback, the `Max Loops` counter for each section is monitored **within the context of the flow path**. When the flow passes through a section (or returns to it in a loop), its `Max Loops` counter decreases.
    * If the **`Max Loops` limit** (default 4) for a section is reached during playback:
        * If `Loop Exit Section` is specified and valid, the flow transitions to that section.
        * **Otherwise (if `Loop Exit Section` is not specified, not valid, or the flow attempts to proceed to the next section in order after a loop without a specific destination), playback will STOP.**

## 6. User Interface and Visualization (JavaScript Side)

* **General Layout:** A single HTML file, with a **responsive design** to adapt to PCs and smartphones.
* **General Background:** `rgb(100, 100, 100)`.
* **Fixed Top Section (Header):** This part will always be visible and will not scroll.
    * **Menu:** An expandable menu (e.g., hamburger icon or similar) that will contain options to **load the `.tubs` file** and **save the `.tubs` file**.
    * **Drum and Playback Controls:** A dedicated row for these elements:
        * **Batá Drum Images:** Visual display of the 3 drum images.
            * **Full Drum Mute:** Clicking the **center** of the drum image mutes/unmutes the entire drum. If muted, the entire drum image turns **gray**.
            * **Specific Face Mute:** Clicking on one of the **two faces** of the drum image (e.g., left or right half of the image), only that specific face is muted/unmuted. If a face is muted, only the **relevant half of the drum image turns gray**.
        * **Playback Controls:** **Play, Stop, Pause** buttons.
        * **Time Signature Input Fields:** Two input fields for entering the **numerator** and **denominator** of the time signature (e.g., `4` and `4` for 4/4).
        * **Clickable Beat Symbols:** A series of buttons or icons representing the beat symbols (`S`, `O`, `P`, `B`, `T`, `-`).
            * **Mutually Exclusive Selection:** Only one symbol can be selected at a time. Clicking a symbol, if another was already selected, deselects the previous one.
            * **Deselection:** Clicking an already selected symbol deselects it (no symbol is active).
            * **Placement in Grid:** If a symbol is selected and the user clicks on a grid cell below, the selected symbol is placed in that cell.
* **Scrollable Bottom Section (Score Grid):** The rest of the page, containing the score grid, will be scrollable and display all created sections.
    * **Section Controls:** Each grid section will have associated controls for:
        * **Section Name:** Text input for the section name (`Section: "SectionName"`).
        * **Repetitions:** Numeric input for the number of repetitions (`Repetitions: N`).
        * **Next Section:** **Dropdown menu** to select the next section (`Next Section: "NextSectionName"`). The dropdown will only show existing sections.
        * **Max Loops:** Numeric input to define the loop limit.
        * **Loop Exit Section:** **Dropdown menu** to select the section to transition to when the `Max Loops` limit is reached. The dropdown will only show existing sections.
        * **Section Management Buttons:**
            * **"Add Section" Button:** Floating functionality, will appear when hovering the mouse over the bottom border of a section or between two sections.
            * **"Move Up/Down" Buttons:** To reorder sections.
            * **"Delete Section" Button:** To remove a section.
    * **Grid Visualization:** The score will be a grid, where each box represents a "time box unit".
        * **Orientation:** Vertical, with drum images on the left (which might repeat as a visual reference in the scrollable part) and notes scrolling from left to right.
        * **Adaptability:** The grid will adapt to the available space in the browser.
    * **Beat Colors and Symbols (in Grid):** The symbols themselves will have the drum's color.
        * **Okonkolo:** **Red** beats `rgb(200, 0, 0)`.
        * **Itotele:** **Yellow** beats `rgb(255, 200, 0)`.
        * **Iya:** **Blue** beats `rgb(0, 0, 150)`.
        * **Graphical Symbols:**
            * `S`: Equilateral triangle (point up).
            * `O`: Circle.
            * `P`: Circle with a dashed outline.
            * `B`: Circle enclosing a triangle.
            * `T`: Small 'x'.
            * `-`: Empty box.
    * **Highlighting:** While the rhythm is playing, the **background of the grid column** of the current beat will light up in **white**.
    * **Starting Section Selection:** It will be possible to **select which section to start playback from** (default is the first section of the file) via a **dropdown menu** in the upper part of the interface.

## 7. Future Developments (After Initial Version)

* **PWA Functionality:** Transform the app into a Progressive Web App for installability and offline operation (via `manifest.json` and `Service Worker`), once the base application is stable and functional.

## 8. Local Persistence (NEW)

* **Automatic Saving:** The current state of the editor (rhythm, sections, settings) will be **automatically saved in the browser's Local Storage**. This means that if the user closes the browser without explicitly saving the `.tubs` file, the application's state will be restored upon next launch.