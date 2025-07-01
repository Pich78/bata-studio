// Audio Sample Data Placeholders
const sampleData = {
    okonkolo_slap: '',
    okonkolo_open: '',
    itotele_slap: '',
    itotele_open: '',
    iya_slap: '',
    iya_open: ''
};

// Global Application State
let appState = {
    toqueName: '',
    sections: [],
    selectedSymbol: null,
    isPlaying: false,
    isPaused: false,
    currentSection: 0,
    currentBeat: 0,
    tempo: 120,
    startSection: 0,
    drumMutes: {
        okonkolo: { full: false, left: false, right: false },
        itotele: { full: false, left: false, right: false },
        iya: { full: false, left: false, right: false }
    },
    transport: null,
    players: {}
};

// Initialize Application
function initializeApp() {
    console.log('Initializing Batá Studio...');
    setupEventListeners();
    initializeAudio();
    loadFromLocalStorage();
    createInitialSection();
    renderSections();
    startAutoSave();
}

// Setup Event Listeners
function setupEventListeners() {
    // Menu
    document.getElementById('menuToggle').addEventListener('click', toggleMenu);
    document.getElementById('loadFile').addEventListener('click', loadFile);
    document.getElementById('saveFile').addEventListener('click', saveFile);
    document.getElementById('fileInput').addEventListener('change', handleFileLoad);

    // Playback Controls
    document.getElementById('playBtn').addEventListener('click', play);
    document.getElementById('pauseBtn').addEventListener('click', pause);
    document.getElementById('stopBtn').addEventListener('click', stop);
    document.getElementById('tempoInput').addEventListener('change', updateTempo);
    document.getElementById('startSectionSelect').addEventListener('change', updateStartSection);

    // Drum Muting
    document.querySelectorAll('.drum-image').forEach(drum => {
        drum.addEventListener('click', handleDrumClick);
    });

    // Beat Symbol Selection
    document.querySelectorAll('.symbol-btn').forEach(btn => {
        btn.addEventListener('click', selectSymbol);
    });

    // Toque Name
    document.getElementById('toqueNameInput').addEventListener('input', updateToqueName);

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container')) {
            hideMenu();
        }
    });
}

// Initialize Audio System
function initializeAudio() {
    if (typeof Tone === 'undefined') {
        console.warn('Tone.js not loaded yet');
        return;
    }

    try {
        // Initialize players for each drum sample
        appState.players = {
            okonkolo_slap: new Tone.Player().toDestination(),
            okonkolo_open: new Tone.Player().toDestination(),
            itotele_slap: new Tone.Player().toDestination(),
            itotele_open: new Tone.Player().toDestination(),
            iya_slap: new Tone.Player().toDestination(),
            iya_open: new Tone.Player().toDestination()
        };

        // Load sample data (when Base64 data is available)
        Object.keys(sampleData).forEach(key => {
            const value = sampleData[key];
            if (!value || typeof value !== "string" || value.trim() === "") {
                console.error(`Invalid Base64 input for key: ${key}`, value);
                throw new Error(`Invalid Base64 input for key: ${key}`);
            }
            // Optional: pad to multiple of 4
            let base64 = value.trim();
            while (base64.length % 4 !== 0) {
                base64 += "=";
            }
            try {
                const audioBuffer = base64ToArrayBuffer(base64);
                appState.players[key].load(audioBuffer);
            } catch (e) {
                console.error(`Failed to decode Base64 for key: ${key}`, base64);
                throw e;
            }
        });

        console.log('Audio system initialized');
    } catch (error) {
        console.error('Error initializing audio:', error);
    }
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Create Initial Section
function createInitialSection() {
    if (appState.sections.length === 0) {
        appState.sections.push(createNewSection());
    }
}

// Create New Section Object
function createNewSection(name = '') {
    return {
        name: name || `Section ${appState.sections.length + 1}`,
        repetitions: 1,
        timeSignature: { numerator: 4, denominator: 4 },
        subdivision: 16, // 16th notes per measure
        nextSection: '',
        maxLoops: 4,
        loopExitSection: '',
        beats: {
            okonkolo: new Array(16).fill('-'),
            itotele: new Array(16).fill('-'),
            iya: new Array(16).fill('-')
        }
    };
}

// Render All Sections
function renderSections() {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = '';

    appState.sections.forEach((section, index) => {
        const sectionElement = createSectionElement(section, index);
        container.appendChild(sectionElement);

        // Add section hover area for "Add Section" button
        if (index < appState.sections.length - 1) {
            const hoverArea = createAddSectionHoverArea(index + 1);
            container.appendChild(hoverArea);
        }
    });

    // Add final hover area
    if (appState.sections.length > 0) {
        const finalHoverArea = createAddSectionHoverArea(appState.sections.length);
        container.appendChild(finalHoverArea);
    }

    updateStartSectionDropdown();
}

// Create Section Element
function createSectionElement(section, index) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section-container';
    sectionDiv.innerHTML = `
        <div class="section-header">
            <div class="section-controls">
                <div class="section-control-group">
                    <label>Name:</label>
                    <input type="text" class="section-input" value="${section.name}" 
                            onchange="updateSectionProperty(${index}, 'name', this.value)">
                </div>
                <div class="section-control-group">
                    <label>Reps:</label>
                    <input type="number" class="section-input" value="${section.repetitions}" min="1"
                            onchange="updateSectionProperty(${index}, 'repetitions', parseInt(this.value))">
                </div>
                <div class="section-control-group">
                    <label>Time:</label>
                    <div class="time-sig-inputs">
                        <input type="number" class="time-sig-input" value="${section.timeSignature.numerator}" min="1" max="12"
                                onchange="updateTimeSignature(${index}, 'numerator', parseInt(this.value))">
                        <span>/</span>
                        <input type="number" class="time-sig-input" value="${section.timeSignature.denominator}" min="1" max="16"
                                onchange="updateTimeSignature(${index}, 'denominator', parseInt(this.value))">
                    </div>
                </div>
                <div class="section-control-group">
                    <label>Subdivision:</label>
                    <select class="section-input" onchange="updateSubdivision(${index}, parseInt(this.value))">
                        <option value="4" ${section.subdivision === 4 ? 'selected' : ''}>Quarter</option>
                        <option value="8" ${section.subdivision === 8 ? 'selected' : ''}>Eighth</option>
                        <option value="16" ${section.subdivision === 16 ? 'selected' : ''}>Sixteenth</option>
                        <option value="32" ${section.subdivision === 32 ? 'selected' : ''}>Thirty-second</option>
                    </select>
                </div>
                <div class="section-control-group">
                    <label>Next:</label>
                    <select class="section-input wide" onchange="updateSectionProperty(${index}, 'nextSection', this.value)">
                        <option value="">-- None --</option>
                        ${appState.sections.map((s, i) => 
                            `<option value="${s.name.toLowerCase()}" ${section.nextSection === s.name.toLowerCase() ? 'selected' : ''}>${s.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="section-control-group">
                    <label>Max Loops:</label>
                    <input type="number" class="section-input" value="${section.maxLoops}" min="1"
                            onchange="updateSectionProperty(${index}, 'maxLoops', parseInt(this.value))">
                </div>
                <div class="section-control-group">
                    <label>Loop Exit:</label>
                    <select class="section-input wide" onchange="updateSectionProperty(${index}, 'loopExitSection', this.value)">
                        <option value="">-- None --</option>
                        ${appState.sections.map((s, i) => 
                            `<option value="${s.name.toLowerCase()}" ${section.loopExitSection === s.name.toLowerCase() ? 'selected' : ''}>${s.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="section-actions">
                <button class="action-btn up" onclick="moveSectionUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="action-btn down" onclick="moveSectionDown(${index})" ${index === appState.sections.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="action-btn delete" onclick="deleteSection(${index})">✕</button>
            </div>
        </div>
        <div class="grid-container">
            ${createGrid(section, index)}
        </div>
    `;
    return sectionDiv;
}

// Create Grid HTML
function createGrid(section, sectionIndex) {
    const totalBeats = calculateTotalBeats(section);
    const drums = ['okonkolo', 'itotele', 'iya'];
    
    let gridHTML = '<div class="grid">';
    
    drums.forEach(drum => {
        gridHTML += `
            <div class="grid-row">
                <div class="drum-label ${drum}">${drum.charAt(0).toUpperCase() + drum.slice(1)}</div>
                <div class="beat-cells">
        `;
        
        for (let i = 0; i < totalBeats; i++) {
            const beat = section.beats[drum][i] || '-';
            const isActive = appState.isPlaying && appState.currentSection === sectionIndex && appState.currentBeat === i;
            gridHTML += `
                <div class="beat-cell ${drum} ${isActive ? 'active' : ''}" 
                        onclick="setBeat(${sectionIndex}, '${drum}', ${i})"
                        data-section="${sectionIndex}" data-drum="${drum}" data-beat="${i}">
                    ${beat !== '-' ? `<span class="beat-symbol ${beat.toLowerCase()}">${beat}</span>` : ''}
                </div>
            `;
        }
        
        gridHTML += `
                </div>
            </div>
        `;
    });
    
    gridHTML += '</div>';
    return gridHTML;
}

// Calculate Total Beats for Section
function calculateTotalBeats(section) {
    return section.timeSignature.numerator * section.subdivision / (section.timeSignature.denominator / 4);
}

// Create Add Section Hover Area
function createAddSectionHoverArea(insertIndex) {
    const hoverArea = document.createElement('div');
    hoverArea.style.cssText = `
        height: 30px;
        position: relative;
        margin: 10px 0;
    `;
    
    const addBtn = document.createElement('button');
    addBtn.className = 'add-section-btn';
    addBtn.textContent = '+ Add Section';
    addBtn.onclick = () => addSection(insertIndex);
    
    let hoverTimeout;
    hoverArea.addEventListener('mouseenter', () => {
        hoverTimeout = setTimeout(() => {
            addBtn.classList.add('show');
        }, 500);
    });
    
    hoverArea.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        addBtn.classList.remove('show');
    });
    
    hoverArea.appendChild(addBtn);
    return hoverArea;
}

// Update Section Property
function updateSectionProperty(index, property, value) {
    appState.sections[index][property] = value;
    if (property === 'name') {
        renderSections(); // Re-render to update dropdowns
    }
    saveToLocalStorage();
}

// Update Time Signature
function updateTimeSignature(index, part, value) {
    appState.sections[index].timeSignature[part] = value;
    updateSectionBeats(index);
    renderSections();
    saveToLocalStorage();
}

// Update Subdivision
function updateSubdivision(index, value) {
    appState.sections[index].subdivision = value;
    updateSectionBeats(index);
    renderSections();
    saveToLocalStorage();
}

// Update Section Beats Array Length
function updateSectionBeats(index) {
    const section = appState.sections[index];
    const newTotalBeats = calculateTotalBeats(section);
    
    ['okonkolo', 'itotele', 'iya'].forEach(drum => {
        const currentBeats = section.beats[drum];
        if (currentBeats.length < newTotalBeats) {
            // Extend with rests
            section.beats[drum] = [...currentBeats, ...new Array(newTotalBeats - currentBeats.length).fill('-')];
        } else if (currentBeats.length > newTotalBeats) {
            // Truncate
            section.beats[drum] = currentBeats.slice(0, newTotalBeats);
        }
    });
}

// Add Section
function addSection(insertIndex) {
    const newSection = createNewSection();
    appState.sections.splice(insertIndex, 0, newSection);
    renderSections();
    saveToLocalStorage();
}

// Move Section Up
function moveSectionUp(index) {
    if (index > 0) {
        [appState.sections[index], appState.sections[index - 1]] = [appState.sections[index - 1], appState.sections[index]];
        renderSections();
        saveToLocalStorage();
    }
}

// Move Section Down
function moveSectionDown(index) {
    if (index < appState.sections.length - 1) {
        [appState.sections[index], appState.sections[index + 1]] = [appState.sections[index + 1], appState.sections[index]];
        renderSections();
        saveToLocalStorage();
    }
}

// Delete Section
function deleteSection(index) {
    if (appState.sections.length > 1) {
        appState.sections.splice(index, 1);
        renderSections();
        saveToLocalStorage();
    } else {
        showError('Cannot delete the last section. At least one section is required.');
    }
}

// Update Start Section Dropdown
function updateStartSectionDropdown() {
    const select = document.getElementById('startSectionSelect');
    select.innerHTML = '';
    appState.sections.forEach((section, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = section.name;
        if (index === appState.startSection) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// Menu Functions
function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.toggle('show');
}

function hideMenu() {
    document.getElementById('menuDropdown').classList.remove('show');
}

// File Operations
function loadFile() {
    hideMenu();
    document.getElementById('fileInput').click();
}

function handleFileLoad(event) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.tubs')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                parseAndLoadTubs(e.target.result);
            } catch (error) {
                showError('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    } else {
        showError('Please select a valid .tubs file.');
    }
}

function saveFile() {
    hideMenu();
    try {
        validateForSave();
        const tubsContent = generateTubsContent();
        downloadFile(tubsContent, (appState.toqueName || 'untitled') + '.tubs');
    } catch (error) {
        showError(error.message);
    }
}

// Parse .tubs File Content
function parseAndLoadTubs(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    let currentIndex = 0;
    
    // Parse Toque Name
    if (currentIndex < lines.length && lines[currentIndex].startsWith('Toque Name:')) {
        appState.toqueName = lines[currentIndex].substring(11).trim().replace(/^"|"$/g, '');
        document.getElementById('toqueNameInput').value = appState.toqueName;
        currentIndex++;
    }
    
    // Parse Sections
    appState.sections = [];
    
    while (currentIndex < lines.length) {
        if (lines[currentIndex].startsWith('Section:')) {
            const section = parseSection(lines, currentIndex);
            appState.sections.push(section.sectionData);
            currentIndex = section.nextIndex;
        } else {
            currentIndex++;
        }
    }
    
    if (appState.sections.length === 0) {
        createInitialSection();
    }
    
    renderSections();
    saveToLocalStorage();
}

// Parse Individual Section
function parseSection(lines, startIndex) {
    const section = createNewSection();
    let currentIndex = startIndex;
    
    // Section name
    if (lines[currentIndex].startsWith('Section:')) {
        section.name = lines[currentIndex].substring(8).trim().replace(/^"|"$/g, '');
        currentIndex++;
    }
    
    // Parse section properties
    while (currentIndex < lines.length && !lines[currentIndex].startsWith('Okonkolo:')) {
        const line = lines[currentIndex];
        
        if (line.startsWith('Repetitions:')) {
            section.repetitions = parseInt(line.substring(12).trim()) || 1;
        } else if (line.startsWith('Time:')) {
            const timeStr = line.substring(5).trim();
            const [num, den] = timeStr.split('/').map(s => parseInt(s.trim()));
            if (num && den) {
                section.timeSignature = { numerator: num, denominator: den };
            }
        } else if (line.startsWith('Next Section:')) {
            section.nextSection = line.substring(13).trim().replace(/^"|"$/g, '').toLowerCase();
        } else if (line.startsWith('Max Loops:')) {
            section.maxLoops = parseInt(line.substring(10).trim()) || 4;
        } else if (line.startsWith('Loop Exit Section:')) {
            section.loopExitSection = line.substring(18).trim().replace(/^"|"$/g, '').toLowerCase();
        }
        
        currentIndex++;
    }
    
    // Parse drum beats
    const drums = ['okonkolo', 'itotele', 'iya'];
    drums.forEach(drum => {
        if (currentIndex < lines.length && lines[currentIndex].toLowerCase().startsWith(drum + ':')) {
            const beatStr = lines[currentIndex].substring(drum.length + 1).trim();
            section.beats[drum] = beatStr.split('').map(c => c.toUpperCase());
            currentIndex++;
        }
    });
    
    // Validate beat lengths
    const lengths = drums.map(drum => section.beats[drum].length);
    if (lengths[0] !== lengths[1] || lengths[1] !== lengths[2]) {
        throw new Error(`Section "${section.name}": All drum sequences must have the same length`);
    }
    
    // Calculate subdivision based on beat length and time signature
    const beatLength = lengths[0];
    section.subdivision = beatLength / section.timeSignature.numerator * (section.timeSignature.denominator / 4);
    
    return { sectionData: section, nextIndex: currentIndex };
}

// Generate .tubs Content
function generateTubsContent() {
    let content = `Toque Name: "${appState.toqueName}"\n\n`;
    
    appState.sections.forEach(section => {
        content += `Section: "${section.name}"\n`;
        content += `Repetitions: ${section.repetitions}\n`;
        content += `Time: ${section.timeSignature.numerator}/${section.timeSignature.denominator}\n`;
        content += `Next Section: "${section.nextSection}"\n`;
        content += `Max Loops: ${section.maxLoops}\n`;
        content += `Loop Exit Section: "${section.loopExitSection}"\n`;
        content += `Okonkolo: ${section.beats.okonkolo.join('')}\n`;
        content += `Itotele: ${section.beats.itotele.join('')}\n`;
        content += `Iya: ${section.beats.iya.join('')}\n\n`;
    });
    
    return content;
}

// Validate Before Save
function validateForSave() {
    if (!appState.toqueName.trim()) {
        throw new Error('Toque Name is required before saving.');
    }
    
    // Check for unique section names
    const names = appState.sections.map(s => s.name.toLowerCase());
    const uniqueNames = [...new Set(names)];
    if (names.length !== uniqueNames.length) {
        throw new Error('All section names must be unique.');
    }
    
    // Validate section references
    appState.sections.forEach(section => {
        if (section.nextSection && !names.includes(section.nextSection)) {
            throw new Error(`Section "${section.name}" references non-existent Next Section: "${section.nextSection}"`);
        }
        if (section.loopExitSection && !names.includes(section.loopExitSection)) {
            throw new Error(`Section "${section.name}" references non-existent Loop Exit Section: "${section.loopExitSection}"`);
        }
    });
}

// Download File
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Beat Input Functions
function selectSymbol(event) {
    const symbol = event.target.dataset.symbol;
    
    // Toggle selection
    if (appState.selectedSymbol === symbol) {
        appState.selectedSymbol = null;
        event.target.classList.remove('active');
    } else {
        // Deselect previous
        document.querySelectorAll('.symbol-btn').forEach(btn => btn.classList.remove('active'));
        
        // Select new
        appState.selectedSymbol = symbol;
        event.target.classList.add('active');
    }
}

function setBeat(sectionIndex, drum, beatIndex) {
    if (appState.selectedSymbol) {
        appState.sections[sectionIndex].beats[drum][beatIndex] = appState.selectedSymbol;
        renderSections();
        saveToLocalStorage();
    }
}

// Drum Muting Functions
function handleDrumClick(event) {
    const drum = event.target.dataset.drum;
    const rect = event.target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width * 0.3) {
        // Left side (mouth/boca)
        toggleDrumMute(drum, 'left');
    } else if (clickX > width * 0.7) {
        // Right side (butt/culatta)
        toggleDrumMute(drum, 'right');
    } else {
        // Center (full mute)
        toggleDrumMute(drum, 'full');
    }
    
    updateDrumVisuals();
}

function toggleDrumMute(drum, side) {
    if (side === 'full') {
        appState.drumMutes[drum].full = !appState.drumMutes[drum].full;
        appState.drumMutes[drum].left = false;
        appState.drumMutes[drum].right = false;
    } else {
        appState.drumMutes[drum].full = false;
        appState.drumMutes[drum][side] = !appState.drumMutes[drum][side];
    }
}

function updateDrumVisuals() {
    Object.keys(appState.drumMutes).forEach(drum => {
        const drumElement = document.getElementById(drum + 'Drum');
        const mutes = appState.drumMutes[drum];
        
        drumElement.className = 'drum-image';
        drumElement.dataset.drum = drum;
        
        if (mutes.full) {
            drumElement.classList.add('muted');
        } else {
            if (mutes.left) drumElement.classList.add('half-muted-left');
            if (mutes.right) drumElement.classList.add('half-muted-right');
        }
    });
}

// Playback Functions
function play() {
    if (typeof Tone === 'undefined') {
        showError('Audio system not loaded. Please refresh the page.');
        return;
    }
    
    if (appState.isPaused) {
        resumePlayback();
    } else {
        startPlayback();
    }
}

function startPlayback() {
    if (appState.sections.length === 0) return;
    
    appState.isPlaying = true;
    appState.isPaused = false;
    appState.currentSection = appState.startSection;
    appState.currentBeat = 0;
    
    Tone.Transport.bpm.value = appState.tempo;
    schedulePlayback();
    Tone.Transport.start();
}

function resumePlayback() {
    appState.isPaused = false;
    Tone.Transport.start();
}

function pause() {
    appState.isPaused = true;
    Tone.Transport.pause();
}

function stop() {
    appState.isPlaying = false;
    appState.isPaused = false;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    // Clear visual highlighting
    document.querySelectorAll('.beat-cell').forEach(cell => {
        cell.classList.remove('active');
    });
}

function schedulePlayback() {
    // This is a simplified playback implementation
    // In a full implementation, you would need more complex scheduling
    // for handling section transitions, loops, etc.
    
    const currentSection = appState.sections[appState.currentSection];
    if (!currentSection) return;
    
    const totalBeats = calculateTotalBeats(currentSection);
    const beatDuration = `${currentSection.subdivision}n`;
    
    let beatIndex = 0;
    
    const playBeat = () => {
        if (!appState.isPlaying || appState.isPaused) return;
        
        // Highlight current beat
        document.querySelectorAll('.beat-cell').forEach(cell => {
            cell.classList.remove('active');
        });
        
        document.querySelectorAll(`[data-section="${appState.currentSection}"][data-beat="${beatIndex}"]`).forEach(cell => {
            cell.classList.add('active');
        });
        
        // Play sounds for current beat
        playBeatSounds(currentSection, beatIndex);
        
        beatIndex++;
        if (beatIndex >= totalBeats) {
            // Section complete - handle transitions
            beatIndex = 0;
            // Add section transition logic here
        }
        
        Tone.Transport.scheduleOnce(playBeat, `+${beatDuration}`);
    };
    
    playBeat();
}

function playBeatSounds(section, beatIndex) {
    ['okonkolo', 'itotele', 'iya'].forEach(drum => {
        const beat = section.beats[drum][beatIndex];
        if (beat && beat !== '-') {
            playDrumSound(drum, beat);
        }
    });
}

function playDrumSound(drum, beat) {
    const mutes = appState.drumMutes[drum];
    if (mutes.full) return;
    
    let soundsToPlay = [];
    
    switch (beat.toUpperCase()) {
        case 'S': // Slap (butt/culatta)
            if (!mutes.right) soundsToPlay.push(`${drum}_slap`);
            break;
        case 'O': // Open (mouth/boca)
            if (!mutes.left) soundsToPlay.push(`${drum}_open`);
            break;
        case 'P': // Pressed (simulate with open)
            if (!mutes.left) soundsToPlay.push(`${drum}_open`);
            break;
        case 'B': // Mordito (both)
            if (!mutes.left) soundsToPlay.push(`${drum}_open`);
            if (!mutes.right) soundsToPlay.push(`${drum}_slap`);
            break;
        case 'T': // Ghost note (skip if no sample)
            // Skip for now
            break;
    }
    
    soundsToPlay.forEach(sound => {
        if (appState.players[sound] && appState.players[sound].loaded) {
            appState.players[sound].start();
        }
    });
}

// Update Functions
function updateTempo() {
    appState.tempo = parseInt(document.getElementById('tempoInput').value);
    if (appState.isPlaying) {
        Tone.Transport.bpm.value = appState.tempo;
    }
    saveToLocalStorage();
}

function updateStartSection() {
    appState.startSection = parseInt(document.getElementById('startSectionSelect').value);
    saveToLocalStorage();
}

function updateToqueName() {
    appState.toqueName = document.getElementById('toqueNameInput').value;
    saveToLocalStorage();
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        localStorage.setItem('bataStudio', JSON.stringify(appState));
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('bataStudio');
        if (saved) {
            const data = JSON.parse(saved);
            appState.toqueName = data.toqueName || '';
            appState.sections = data.sections || [];
            appState.tempo = data.tempo || 120;
            appState.startSection = data.startSection || 0;
            appState.drumMutes = data.drumMutes || appState.drumMutes;
            
            document.getElementById('toqueNameInput').value = appState.toqueName;
            document.getElementById('tempoInput').value = appState.tempo;
            updateDrumVisuals();
        }
    } catch (error) {
        console.error('Error loading from local storage:', error);
    }
}

function startAutoSave() {
    setInterval(saveToLocalStorage, 5000); // Auto-save every 5 seconds
}

// Error Handling
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorPopup').classList.add('show');
}

function hideError() {
    document.getElementById('errorPopup').classList.remove('show');
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof Tone !== 'undefined') {
            initializeApp();
        }
    });
} else {
    if (typeof Tone !== 'undefined') {
        initializeApp();
    }
}