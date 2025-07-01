Role and Goal:
You are an advanced AI specializing in front-end web development with a deep expertise in pure JavaScript (HTML, CSS, JS) and audio programming, particularly with Web Audio API libraries like Tone.js. Your primary objective is to develop a complete, self-contained web application named "Batá Studio." This application will function as a powerful and intuitive editor/sequencer for Batá drum rhythms, strictly adhering to the comprehensive specifications provided below. The final output must be a single HTML file, optimized for responsiveness across both desktop and mobile devices.

Deliverable:
Generate a single, self-contained index.html file that includes:

A complete and valid HTML5 document structure.

All CSS code embedded within a <style> tag in the <head> section. Inline CSS should only be used if absolutely necessary for dynamic layout adjustments not achievable otherwise.

All JavaScript code embedded within a <script> tag, ideally placed just before the closing </body> tag for optimal loading.

All necessary audio sample data embedded directly within the JavaScript as Base64 encoded strings or similar in-memory representations. Crucially, provide placeholder comments (// INSERT BASE64 DATA FOR [sample_name].wav HERE) for where these Base64 strings should be inserted, as the actual WAV files are not provided in this prompt. The loading logic for these samples must be fully implemented.

Integration of the Tone.js library. Embed its source code directly into the JavaScript section to ensure the index.html file is truly self-contained and requires no external network requests after initial download.

I. Core Application Requirements & Architecture:

Self-Contained: The entire application (HTML, CSS, JS, embedded audio data) must reside within a single index.html file. No external .css, .js, or audio files should be linked or loaded dynamically.

Client-Side Execution: All parsing, rendering, audio processing, and UI interactions must occur purely client-side using JavaScript.

Audio Engine: Utilize Tone.js (Web Audio API) for all audio playback. Ensure precise timing and sample triggering.

Responsiveness: The UI must be fully responsive, adapting seamlessly to various screen sizes and orientations (desktop, tablet, smartphone).

No Server-Side Components: The application is purely front-end; no server-side logic is required.

II. .tubs File Format (Input/Output):

Standard Format: This is the universal format for importing and exporting rhythms.

Strict Structure: The parser must strictly adhere to the defined order of lines for the Toque Name and for each section's properties.

First Line: Toque Name: "YourToqueName" (e.g., Toque Name: "Chachalokefun")

Section Definition Order (Fixed):

Section: "YourSectionName" (e.g., Section: "Intro")

Repetitions: N (Integer N, number of times this section repeats before moving to Next Section)

Time: Metric (e.g., 4/4, 6/8, 12/8. Defines the time signature for this section.)

Next Section: "NextSectionName" (Specifies the name of the section to transition to after Repetitions are complete. If the referenced section doesn't exist in the file, treat this internally as an empty string "". If the line is entirely absent, also treat as "".)

Max Loops: N (Integer N, max times the flow can loop through or return to this section within a larger sequence. Default value is 4 if line is absent or N is 0.)

Loop Exit Section: "PostLoopSectionName" (Specifies the name of the section to transition to when Max Loops limit is reached. If empty, absent, or the referenced section doesn't exist, playback will proceed to the next section in the file's sequential order.)

Drum Beat Sequence Order (Fixed - three lines per section):

Okonkolo: BeatSequence (e.g., Okonkolo: S-OS-OS-OS-OS-OS)

Itotele: BeatSequence (e.g., Itotele: S--S--B--S--S--B)

Iya: BeatSequence (e.g., Iya: B---S---S---S---S)

Allowed Beat Symbols: S (Slap), O (Open), P (Pressed), B (Mouth/Bite), T (Finger/Ghost Note), - (Rest).

Case Insensitivity: All section names (Section:, Next Section:, Loop Exit Section:) and their references will be treated as case-insensitive. The parser and UI logic must automatically convert user input for section names to lowercase for internal consistency and comparison.

Parsing Robustness:

Ignore extra whitespace in headers (e.g.,  Section : "Name") and after colons in drum definitions.

Validate that beat sequences only contain allowed symbols.

Validate section structure: Each section must have exactly three drum lines.

Critical Length Validation: All three drum beat sequences within a single section must have the exact same number of characters. If lengths differ, the parser must flag an error; no implicit padding or truncation is allowed.

The "time unit" for a section is derived from the common length of its beat sequences and the specified time signature (e.g., if a 4/4 section has 16 beats, each beat is a 16th note).

III. Core Application Functionality:

3.1. Interactive Editor (Primary UI Feature)
Initial State: Application opens with an empty, "white" interactive grid (representing a single, empty section) ready for user input.

Beat Input: Users can insert beats by clicking on grid cells. When a beat symbol is selected (from the header controls), clicking a grid cell will place that symbol.

Grid Adjustment:

For each section, provide two input fields for the time signature (numerator/denominator) (e.g., 4/4).

Provide a dropdown menu to select the subdivision unit (quarter, eighth, sixteenth, or thirty-second notes) per measure.

The grid UI for that section must dynamically adapt to these changes (e.g., adding/removing columns).

Crucially, any existing beats within the section must maintain their correct relative positions when time signature or subdivision changes.

Section Management:

Visible Controls: For each section in the scrollable area, its dedicated controls (section name input, repetitions input, "Next Section" dropdown, "Max Loops" numeric input, "Loop Exit Section" dropdown) must be always visible and directly editable when the application is not in playback mode.

"Add Section" Button (Floating UI): Implement a single, dynamic "Add Section" button. This button only appears when the mouse cursor hovers for a specific duration (e.g., 500ms) near the bottom border of an existing section, or precisely between two sections. When clicked, it inserts a new, empty section at that specific location. The button should disappear once the section is added or the mouse moves away.

Section Ordering: Each section must have dedicated "Move Up" and "Move Down" buttons/icons allowing the user to reorder sections within the sequence.

Section Deletion: Each section must have a dedicated "Delete Section" button/icon for removal.

3.2. File Operations (Load/Save)
Loading Rhythms:

Implement a "Load" option (via the header menu) to open a system file dialog using the File System Access API.

Upon successful file selection, parse the .tubs content and display it in the editor.

No visual loading indicator (e.g., spinner) is required during this operation.

Saving Rhythms:

Implement a "Save" option (via the header menu) to open a system file dialog using the File System Access API for downloading the current rhythm as a .tubs file.

No visual saving indicator (e.g., spinner) is required during this operation.

Pre-Save Validation:

Toque Name Required: Saving is only allowed if a "Toque Name" has been entered. If not, trigger an error popup.

Unique Section Names: Ensure all section names are unique (case-insensitive) before saving. If duplicates exist, trigger an error popup.

Valid Section References: Verify that all Next Section and Loop Exit Section references point to existing section names (case-insensitive).

The saved .tubs file must precisely reflect the current state of the editor, including section order and all metadata.

3.3. Local Persistence
Automatic Save to Local Storage: The entire state of the editor (all sections, their properties, beat data, current settings) must be automatically saved to the browser's Local Storage at regular intervals (e.g., every few seconds, or on significant changes).

Automatic Load from Local Storage: Upon application launch, attempt to load the rhythm data from Local Storage. If present, restore the editor to its last saved state. This ensures persistence even if the user closes the browser without explicitly saving the .tubs file.

IV. Audio Processing & Playback Logic:

Sample Management:

All necessary drum samples (iya_slap.wav, iya_open.wav, okonkolo_slap.wav, etc.) should be loaded into Tone.js Player objects (or similar) from their Base64 embedded data.

Sample Playback Behavior: Each sample plays for its natural resonance. A new beat for the same drum should immediately interrupt any previously playing sound from that drum. A rest (-) longer than the previous sample's resonance should introduce silence.

Drum Muting:

Full Drum Mute: Clicking the center of a drum's image in the header mutes/unmutes all sounds from that specific drum (Okonkolo, Itotele, Iya). Visually, the entire drum image should turn gray when muted.

Face-Specific Mute: Clicking on the left half (mouth/boca) or right half (butt/culatta) of a drum's image mutes only sounds associated with that specific face. The corresponding half of the drum image should turn gray when muted.

Mouth (Boca): Controls O (Open), P (Pressed), and the O component of B (Mordito).

Butt (Culatta): Controls S (Slap) and the S component of B (Mordito).

Interaction with B (Mordito): If the mouth is muted, a B beat should only play the S (Slap) component. If the butt is muted, a B beat should only play the O (Open) component. If both are muted, B plays nothing.

Missing Sound Simulation:

B (Mordito): Play both the O (Open) and S (Slap) samples for that drum simultaneously.

P (Pressed): Replace playback with the O (Open) sample for that drum.

T (Finger/Ghost Note): If a specific sample for T is not available, replace playback with a rest (-).

S (Slap): Always relates to the butt (culatta).

O (Open) and P (Pressed): Always relate to the mouth (boca).

Playback Controls: Implement standard Play, Pause, Stop buttons in the header.

Tempo Control: A slider or input field for BPM (Beats Per Minute). The quarter note (1/4) should be the reference unit (e.g., 1/4 = 120 BPM).

No Individual Volume Control: Volume sliders for individual drums are explicitly not required in this version.

Playback Flow Logic:

Starting Point: Playback defaults to the first section loaded/created. A dropdown menu in the header must allow the user to select any existing section as the starting point.

Section Repetitions: After a section completes its Repetitions, the flow transitions:

To Next Section if specified and valid.

Otherwise, to the next section in the file's sequential order.

Max Loops Complex Logic:

The Max Loops counter for each section must be tracked within the overall playback flow.

Every time the playback flow enters or returns to a specific section (meaning it's part of a loop or being re-entered), that section's Max Loops counter should decrement.

If a section's Max Loops counter reaches 0:

The flow attempts to transition to its Loop Exit Section (if specified and valid).

Otherwise (if Loop Exit Section is empty/invalid, or if the flow would normally proceed to the next section in order after hitting the Max Loops limit without a valid Loop Exit Section), playback must STOP.

V. User Interface (UI) & Visuals:

General Appearance:

Background: The overall application background should be rgb(100, 100, 100).

Fixed Header Section: This top section of the UI must remain visible and not scroll.

Menu: An expandable menu (e.g., hamburger icon) containing "Load .tubs" and "Save .tubs" options.

Drum Visuals & Mute Controls:

Display clear images of the three Batá drums (Okonkolo, Itotele, Iya).

Implement the full drum mute (click center, whole drum grays out) and face-specific mute (click left/right half, half drum grays out).

Playback Controls: Visually distinct Play, Stop, and Pause buttons.

Time Signature Input: Two separate input fields (numerator and denominator) for the current section's time signature.

Beat Symbol Selection: A row of visually distinct buttons/icons representing each allowed beat symbol (S, O, P, B, T, -).

Only one symbol can be active/selected at a time.

Clicking an active symbol should deselect it (no symbol is active).

Scrollable Score Grid Section: The main content area where rhythms are created and viewed. This section should be vertically scrollable.

Grid Layout: A grid structure where each cell represents a "time box unit" for a beat.

Orientation: Vertical, with drum names/images potentially repeating on the left side of the scrollable area for consistent reference. Notes scroll horizontally from left to right.

Dynamic Width: The grid's width should adapt to the number of subdivisions and measures in the current section, ensuring full visibility without horizontal scrolling unless necessary.

Beat Visualization:

Colors: Beat symbols must be colored according to the drum:

Okonkolo: Red (rgb(200, 0, 0))

Itotele: Yellow (rgb(255, 200, 0))

Iya: Blue (rgb(0, 0, 150))

Graphical Symbols (within cells):

S: Equilateral triangle (pointing up)

O: Circle

P: Circle with a dashed outline

B: Circle enclosing a triangle

T: Small 'x'

-: Empty cell (no symbol)

Playback Highlighting: While the rhythm is playing, the background of the entire grid column corresponding to the currently sounding beat must light up in white.

No Metronome Visual/Sound: There should be no visual metronome count or audible click sounds to mark measure/section transitions.

VI. Quality & Development Practices (for the AI):

Code Clarity: Even though it's a single file, the JavaScript code should be well-organized into logical functions and modules (within the single script tag) to enhance readability and maintainability.

Commenting: Add extensive, clear comments, especially for complex logic like .tubs parsing, the Max Loops flow, and audio routing.

Error Handling: Implement robust error handling for file operations, validation, and parsing, communicating issues to the user via popup windows.

HTML/CSS Best Practices: Use semantic HTML5 elements. CSS should be well-structured and leverage modern flexbox/grid for responsive layouts where appropriate.
