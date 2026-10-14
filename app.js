/**
 * SmartBudilnik — Main Application Logic
 * Audio Synthesis, Precise Alarm Engine & Interactive Clock
 */

(function () {
    'use strict';

    // --- State & Storage Keys ---
    const STORAGE_KEY = 'smart_alarms_list_v1';
    const THEME_KEY = 'smart_alarm_theme_v1';
    const VOLUME_KEY = 'smart_alarm_volume_v1';

    let alarms = [];
    let activeRingingAlarm = null;
    let isTestingSound = false;
    let soundTestTimeout = null;
    let currentCustomAudioData = null;
    let currentCustomAudioName = '';
    let lastCheckedMinute = '';

    // --- DOM Elements ---
    const elements = {
        // Digital Clock
        digitHours: document.getElementById('digitHours'),
        digitMinutes: document.getElementById('digitMinutes'),
        digitSeconds: document.getElementById('digitSeconds'),
        digitPeriod: document.getElementById('digitPeriod'),
        currentDateDisplay: document.getElementById('currentDateDisplay'),
        currentDayOfWeek: document.getElementById('currentDayOfWeek'),

        // Analog Clock Hands
        hourHand: document.getElementById('hourHand'),
        minuteHand: document.getElementById('minuteHand'),
        secondHand: document.getElementById('secondHand'),

        // Banner
        nextAlarmCountdown: document.getElementById('nextAlarmCountdown'),

        // Form
        alarmForm: document.getElementById('alarmForm'),
        alarmTimeInput: document.getElementById('alarmTimeInput'),
        alarmLabelInput: document.getElementById('alarmLabelInput'),
        soundSelector: document.getElementById('soundSelector'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumePercentDisplay: document.getElementById('volumePercentDisplay'),
        presetButtons: document.querySelectorAll('.preset-btn'),
        testSoundBtn: document.getElementById('testSoundBtn'),
        testSoundBtnText: document.getElementById('testSoundBtnText'),
        soundVisualizer: document.getElementById('soundVisualizer'),

        // Custom File
        customAudioUploadGroup: document.getElementById('customAudioUploadGroup'),
        customAudioFile: document.getElementById('customAudioFile'),
        customFileNameDisplay: document.getElementById('customFileNameDisplay'),
        customAudioElement: document.getElementById('customAudioElement'),

        // List
        alarmsListContainer: document.getElementById('alarmsListContainer'),
        activeAlarmsCount: document.getElementById('activeAlarmsCount'),
        clearAllAlarmsBtn: document.getElementById('clearAllAlarmsBtn'),

        // Modal
        alarmRingingModal: document.getElementById('alarmRingingModal'),
        ringingTimeDisplay: document.getElementById('ringingTimeDisplay'),
        ringingTitleDisplay: document.getElementById('ringingTitleDisplay'),
        stopAlarmBtn: document.getElementById('stopAlarmBtn'),
        snoozeAlarmBtn: document.getElementById('snoozeAlarmBtn'),

        // Notification & Themes
        notificationToggleBtn: document.getElementById('notificationToggleBtn'),
        notificationStatusText: document.getElementById('notificationStatusText'),
        themeButtons: document.querySelectorAll('.theme-btn')
    };

    // --- Web Audio Context & Synthesizer Engine ---
    let audioCtx = null;
    let masterGainNode = null;
    let currentAudioPatternInterval = null;

    function initAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
                masterGainNode = audioCtx.createGain();
                masterGainNode.connect(audioCtx.destination);
                setMasterVolume(elements.volumeSlider.value / 100);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Unlock audio on first user touch/click anywhere
    function setupAudioAutoUnlock() {
        const unlock = () => {
            initAudioContext();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        window.addEventListener('touchstart', unlock);
    }

    function setMasterVolume(val) {
        if (masterGainNode && audioCtx) {
            masterGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            masterGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, val)), audioCtx.currentTime);
        }
        if (elements.customAudioElement) {
            elements.customAudioElement.volume = Math.max(0, Math.min(1, val));
        }
    }

    /**
     * Synthesize sound note
     */
    function playBeep(freq, type = 'sine', duration = 0.15, gainVal = 0.35) {
        if (!audioCtx) initAudioContext();
        if (!audioCtx) return;

        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(gainVal, audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(masterGainNode);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }

    /**
     * Start repeating sound pattern
     */
    function startAlarmSoundPattern(soundType, customAudioSrc = null) {
        stopAlarmSound();
        initAudioContext();

        if (soundType === 'custom' && (customAudioSrc || currentCustomAudioData)) {
            const src = customAudioSrc || currentCustomAudioData;
            elements.customAudioElement.src = src;
            elements.customAudioElement.loop = true;
            elements.customAudioElement.volume = elements.volumeSlider.value / 100;
            elements.customAudioElement.play().catch(err => {
                console.warn('Custom audio playback failed, falling back to classic:', err);
                startAlarmSoundPattern('classic');
            });
            return;
        }

        if (soundType === 'classic') {
            // High-low retro digital beeper: beep-beep-beep
            let step = 0;
            currentAudioPatternInterval = setInterval(() => {
                if (!audioCtx) return;
                const now = audioCtx.currentTime;
                // Beep pulse 1
                playBeep(980, 'square', 0.1, 0.4);
                setTimeout(() => playBeep(980, 'square', 0.1, 0.4), 160);
                setTimeout(() => playBeep(1150, 'square', 0.18, 0.5), 320);
                step++;
            }, 800);
        } else if (soundType === 'digital') {
            // Melodic arpeggio chime (C5 -> E5 -> G5 -> C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            currentAudioPatternInterval = setInterval(() => {
                notes.forEach((freq, index) => {
                    setTimeout(() => {
                        playBeep(freq, 'triangle', 0.35, 0.45);
                    }, index * 140);
                });
            }, 1200);
        } else if (soundType === 'gentle') {
            // Warm sunrise chord swell
            currentAudioPatternInterval = setInterval(() => {
                playBeep(440, 'sine', 0.9, 0.35); // A4
                setTimeout(() => playBeep(554.37, 'sine', 0.9, 0.35), 100); // C#5
                setTimeout(() => playBeep(659.25, 'sine', 0.9, 0.35), 200); // E5
                setTimeout(() => playBeep(880, 'sine', 1.1, 0.3), 350); // A5
            }, 1800);
        } else if (soundType === 'urgent') {
            // Fast pulsating emergency warning
            let toggled = false;
            currentAudioPatternInterval = setInterval(() => {
                toggled = !toggled;
                playBeep(toggled ? 1200 : 800, 'sawtooth', 0.14, 0.5);
            }, 160);
        } else {
            // Fallback
            currentAudioPatternInterval = setInterval(() => {
                playBeep(880, 'square', 0.15, 0.4);
            }, 500);
        }
    }

    function stopAlarmSound() {
        if (currentAudioPatternInterval) {
            clearInterval(currentAudioPatternInterval);
            currentAudioPatternInterval = null;
        }
        if (elements.customAudioElement) {
            elements.customAudioElement.pause();
            elements.customAudioElement.currentTime = 0;
        }
    }

    // --- Clock Engine (Digital & Analog) ---
    const UZ_WEEKDAYS = [
        'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba',
        'Payshanba', 'Juma', 'Shanba'
    ];

    const UZ_MONTHS = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
        'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    let lastRenderedSecond = -1;

    // Smooth 60fps analog clock animation using requestAnimationFrame
    function renderAnalogLoop() {
        const now = new Date();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();
        const minutes = now.getMinutes();
        const hours24 = now.getHours();

        const secFraction = (seconds + milliseconds / 1000) / 60;
        const minFraction = (minutes + secFraction) / 60;
        const hourFraction = ((hours24 % 12) + minFraction) / 12;

        const secDeg = secFraction * 360;
        const minDeg = minFraction * 360;
        const hourDeg = hourFraction * 360;

        elements.secondHand.style.transform = `rotate(${secDeg}deg)`;
        elements.minuteHand.style.transform = `rotate(${minDeg}deg)`;
        elements.hourHand.style.transform = `rotate(${hourDeg}deg)`;

        // If second changed, update digital clock and check alarms
        if (seconds !== lastRenderedSecond) {
            lastRenderedSecond = seconds;
            updateDigitalClock(now, hours24, minutes, seconds);
        }

        requestAnimationFrame(renderAnalogLoop);
    }

    function updateDigitalClock(now, hours24, minutes, seconds) {
        // Digital display
        const period = hours24 >= 12 ? 'PM' : 'AM';
        elements.digitHours.textContent = String(hours24).padStart(2, '0');
        elements.digitMinutes.textContent = String(minutes).padStart(2, '0');
        elements.digitSeconds.textContent = String(seconds).padStart(2, '0');
        elements.digitPeriod.textContent = period;

        // Date display
        const dayName = UZ_WEEKDAYS[now.getDay()];
        const monthName = UZ_MONTHS[now.getMonth()];
        const dateNum = now.getDate();
        const year = now.getFullYear();

        elements.currentDateDisplay.textContent = `${dateNum}-${monthName}, ${year}`;
        elements.currentDayOfWeek.textContent = dayName;

        // Check alarms
        const currentMinuteStr = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        if (seconds === 0 && lastCheckedMinute !== currentMinuteStr) {
            lastCheckedMinute = currentMinuteStr;
            checkAlarmsToRing(currentMinuteStr);
        }

        // Update remaining countdown badges every 5 seconds
        if (seconds % 5 === 0) {
            updateAlarmCountdowns();
        }
    }

    // --- Alarm Checking & Ringing Lifecycle ---
    function checkAlarmsToRing(currentMinuteStr) {
        if (activeRingingAlarm) return; // Already ringing

        const matchingAlarm = alarms.find(a => a.enabled && a.time === currentMinuteStr);
        if (matchingAlarm) {
            triggerAlarm(matchingAlarm);
        }
    }

    function triggerAlarm(alarm) {
        activeRingingAlarm = alarm;
        initAudioContext();

        // Start ringing sound
        setMasterVolume(alarm.volume !== undefined ? alarm.volume / 100 : elements.volumeSlider.value / 100);
        startAlarmSoundPattern(alarm.sound, alarm.customAudioSrc);

        // Update modal UI
        elements.ringingTimeDisplay.textContent = alarm.time;
        elements.ringingTitleDisplay.textContent = alarm.label || "Vaqt bo'ldi!";
        elements.alarmRingingModal.classList.remove('hidden');
        document.body.classList.add('alarm-active-flash');

        // Document title flash
        startTitleFlashing(alarm.time);

        // Browser notification
        showDesktopNotification(alarm);
    }

    let titleFlashInterval = null;
    function startTitleFlashing(time) {
        if (titleFlashInterval) clearInterval(titleFlashInterval);
        let toggle = false;
        titleFlashInterval = setInterval(() => {
            toggle = !toggle;
            document.title = toggle ? `⏰ [${time}] BUDILNIK JIRINGLAYAPTI!` : `🔔 UYG'ONING! — SmartBudilnik`;
        }, 600);
    }

    function stopTitleFlashing() {
        if (titleFlashInterval) {
            clearInterval(titleFlashInterval);
            titleFlashInterval = null;
        }
        document.title = "Aqlli Budilnik — Zamonaviy Vaqt va Signal Tizimi";
    }

    function stopAlarmRinging() {
        stopAlarmSound();
        stopTitleFlashing();
        document.body.classList.remove('alarm-active-flash');
        elements.alarmRingingModal.classList.add('hidden');
        activeRingingAlarm = null;
    }

    function snoozeAlarm() {
        if (!activeRingingAlarm) return;

        const currentAlarm = activeRingingAlarm;
        stopAlarmRinging();

        // Calculate +5 minutes
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        const snoozeHours = String(now.getHours()).padStart(2, '0');
        const snoozeMinutes = String(now.getMinutes()).padStart(2, '0');
        const snoozeTime = `${snoozeHours}:${snoozeMinutes}`;

        // Add snooze alarm
        const snoozeItem = {
            id: 'snooze_' + Date.now(),
            time: snoozeTime,
            label: `${currentAlarm.label || 'Budilnik'} (Kechiktirilgan +5 min)`,
            sound: currentAlarm.sound,
            volume: currentAlarm.volume,
            enabled: true,
            customAudioSrc: currentAlarm.customAudioSrc,
            customAudioName: currentAlarm.customAudioName
        };

        alarms.unshift(snoozeItem);
        saveAlarms();
        renderAlarms();
        showToastNotification(`Budilnik 5 daqiqaga kechiktirildi (${snoozeTime})`);
    }

    // --- Toast / Feedback Notification ---
    function showToastNotification(message) {
        let toast = document.getElementById('appToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'appToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: linear-gradient(135deg, #1e1b4b, #312e81);
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 9999px;
                font-size: 0.88rem;
                font-weight: 600;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(99,102,241,0.5);
                border: 1px solid rgba(255,255,255,0.15);
                z-index: 10000;
                transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
        }, 3000);
    }

    // --- Desktop Notification API ---
    function setupNotifications() {
        if (!('Notification' in window)) {
            elements.notificationToggleBtn.style.display = 'none';
            return;
        }

        updateNotificationBtnState();

        elements.notificationToggleBtn.addEventListener('click', async () => {
            if (Notification.permission === 'granted') {
                showToastNotification('Bildirishnomalar allaqachon yoqilgan!');
                return;
            }

            const permission = await Notification.requestPermission();
            updateNotificationBtnState();

            if (permission === 'granted') {
                showToastNotification('Bildirishnomalar muvaffaqiyatli yoqildi!');
                try {
                    new Notification("SmartBudilnik", {
                        body: "Bildirishnomalar tizimi muvaffaqiyatli ulandi! Budilnik vaqti kelganda xabar olasiz.",
                        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='12' r='10'/></svg>"
                    });
                } catch (e) {
                    // Ignore
                }
            } else {
                showToastNotification('Bildirishnomaga ruxsat berilmadi.');
            }
        });
    }

    function updateNotificationBtnState() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            elements.notificationToggleBtn.classList.add('granted');
            elements.notificationStatusText.textContent = 'Bildirishnoma: Faol';
        } else {
            elements.notificationToggleBtn.classList.remove('granted');
            elements.notificationStatusText.textContent = 'Bildirishnoma';
        }
    }

    function showDesktopNotification(alarm) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(`⏰ Budilnik Vaqti: ${alarm.time}`, {
                    body: `${alarm.label || 'Vaqt bo\'ldi!'} — O'chirish yoki kechiktirish uchun oynani bosing.`,
                    requireInteraction: true,
                    tag: 'alarm-alert'
                });
            } catch (err) {
                console.warn('Desktop notification error:', err);
            }
        }
    }

    // --- Time Calculations & Formatting ---
    function getTimeDifference(targetTimeStr) {
        const now = new Date();
        const [targetHours, targetMinutes] = targetTimeStr.split(':').map(Number);

        const targetDate = new Date();
        targetDate.setHours(targetHours, targetMinutes, 0, 0);

        // If target time is earlier or same as current time today, it rings tomorrow
        if (targetDate <= now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const diffMs = targetDate - now;
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return { hours, minutes, totalMinutes, targetDate };
    }

    function formatCountdownString(diff) {
        if (diff.totalMinutes === 0) {
            return '1 daqiqadan kam vaqt qoldi';
        }
        if (diff.hours === 0) {
            return `${diff.minutes} daqiqa qoldi`;
        }
        return `${diff.hours} soat ${diff.minutes} daqiqa qoldi`;
    }

    // --- Alarms List Management & Rendering ---
    function loadAlarms() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                alarms = JSON.parse(raw);
            } else {
                // Initial starter alarm for user convenience
                alarms = [
                    {
                        id: 'starter_1',
                        time: '07:30',
                        label: "Ertalabki uyg'onish",
                        sound: 'classic',
                        volume: 80,
                        enabled: true
                    }
                ];
                saveAlarms();
            }
        } catch (e) {
            alarms = [];
        }
    }

    function saveAlarms() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
        } catch (e) {
            console.error('Saving alarms to localStorage failed:', e);
        }
    }

    function renderAlarms() {
        elements.activeAlarmsCount.textContent = alarms.length;

        if (alarms.length === 0) {
            elements.alarmsListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-circle">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 14 14"></polyline>
                        </svg>
                    </div>
                    <div class="empty-title">Hozircha budilniklar yo'q</div>
                    <div class="empty-sub">Yuqoridagi formadan vaqt belgilang va "Budilnikni Saqlash" tugmasini bosing.</div>
                </div>
            `;
            updateNextAlarmBanner();
            return;
        }

        // Sort alarms by closest remaining time
        const sortedAlarms = [...alarms].sort((a, b) => {
            if (a.enabled && !b.enabled) return -1;
            if (!a.enabled && b.enabled) return 1;
            const diffA = getTimeDifference(a.time).totalMinutes;
            const diffB = getTimeDifference(b.time).totalMinutes;
            return diffA - diffB;
        });

        elements.alarmsListContainer.innerHTML = '';

        sortedAlarms.forEach(alarm => {
            const diff = getTimeDifference(alarm.time);
            const countdownText = alarm.enabled ? formatCountdownString(diff) : "O'chirilgan";

            const soundLabels = {
                classic: '🔔 Klassik',
                digital: '🎵 Raqamli',
                gentle: '🌅 Mayin',
                urgent: '🚨 Favqulodda',
                custom: `📁 ${alarm.customAudioName || 'Maxsus'}`
            };
            const soundDisplay = soundLabels[alarm.sound] || '🔔 Signal';

            const itemEl = document.createElement('div');
            itemEl.className = `alarm-item-card ${alarm.enabled ? '' : 'inactive'}`;
            itemEl.id = `alarm-card-${alarm.id}`;

            itemEl.innerHTML = `
                <div class="alarm-item-left">
                    <div class="alarm-item-time">${alarm.time}</div>
                    <div class="alarm-item-details">
                        <span class="alarm-item-title">${escapeHTML(alarm.label || 'Budilnik')}</span>
                        <span class="alarm-item-countdown" id="countdown-${alarm.id}">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${countdownText}
                        </span>
                        <span class="alarm-item-sound">${soundDisplay} • ${alarm.volume || 80}%</span>
                    </div>
                </div>
                <div class="alarm-item-actions">
                    <label class="switch" title="${alarm.enabled ? "O'chirish" : 'Yoqish'}">
                        <input type="checkbox" class="alarm-toggle-input" data-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <button type="button" class="delete-alarm-btn" data-id="${alarm.id}" title="O'chirish">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;

            elements.alarmsListContainer.appendChild(itemEl);
        });

        // Attach event listeners for switches and delete buttons
        elements.alarmsListContainer.querySelectorAll('.alarm-toggle-input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                toggleAlarmState(id, e.target.checked);
            });
        });

        elements.alarmsListContainer.querySelectorAll('.delete-alarm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                deleteAlarm(id);
            });
        });

        updateNextAlarmBanner();
    }

    function toggleAlarmState(id, isEnabled) {
        const item = alarms.find(a => a.id === id);
        if (item) {
            item.enabled = isEnabled;
            saveAlarms();
            renderAlarms();
            showToastNotification(isEnabled ? `${item.time} budilnigi yoqildi` : `${item.time} budilnigi o'chirildi`);
        }
    }

    function deleteAlarm(id) {
        alarms = alarms.filter(a => a.id !== id);
        saveAlarms();
        renderAlarms();
        showToastNotification("Budilnik o'chirildi");
    }

    function updateAlarmCountdowns() {
        alarms.forEach(alarm => {
            const el = document.getElementById(`countdown-${alarm.id}`);
            if (el) {
                if (!alarm.enabled) {
                    el.innerHTML = `
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg> O'chirilgan
                    `;
                } else {
                    const diff = getTimeDifference(alarm.time);
                    el.innerHTML = `
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg> ${formatCountdownString(diff)}
                    `;
                }
            }
        });
        updateNextAlarmBanner();
    }

    function updateNextAlarmBanner() {
        const activeAlarms = alarms.filter(a => a.enabled);
        if (activeAlarms.length === 0) {
            elements.nextAlarmCountdown.textContent = "Hozircha faol budilnik yo'q";
            return;
        }

        // Find minimum difference
        let nearestAlarm = null;
        let minMinutes = Infinity;

        activeAlarms.forEach(alarm => {
            const diff = getTimeDifference(alarm.time);
            if (diff.totalMinutes < minMinutes) {
                minMinutes = diff.totalMinutes;
                nearestAlarm = { alarm, diff };
            }
        });

        if (nearestAlarm) {
            const { alarm, diff } = nearestAlarm;
            const labelStr = alarm.label ? ` ("${alarm.label}")` : '';
            elements.nextAlarmCountdown.textContent = `${alarm.time}${labelStr} — ${formatCountdownString(diff)}`;
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    // --- Audio File Handling ---
    function setupCustomAudioUpload() {
        elements.customAudioFile.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            currentCustomAudioName = file.name;
            elements.customFileNameDisplay.textContent = `Yuklandi: ${file.name}`;

            const reader = new FileReader();
            reader.onload = function (event) {
                currentCustomAudioData = event.target.result;
                showToastNotification(`Maxsus audio yuklandi: ${file.name}`);
            };
            reader.readAsDataURL(file);
        });

        elements.soundSelector.addEventListener('change', function () {
            if (this.value === 'custom') {
                elements.customAudioUploadGroup.classList.remove('hidden');
            } else {
                elements.customAudioUploadGroup.classList.add('hidden');
            }
        });
    }

    // --- Sound Preview / Test Button ---
    function setupSoundTest() {
        elements.testSoundBtn.addEventListener('click', () => {
            initAudioContext();

            if (isTestingSound) {
                stopSoundTest();
            } else {
                startSoundTest();
            }
        });
    }

    function startSoundTest() {
        isTestingSound = true;
        elements.testSoundBtnText.textContent = "To'xtatish";
        elements.soundVisualizer.classList.add('playing');

        const selectedSound = elements.soundSelector.value;
        const vol = elements.volumeSlider.value / 100;
        setMasterVolume(vol);

        startAlarmSoundPattern(selectedSound, currentCustomAudioData);

        // Auto stop after 5 seconds
        if (soundTestTimeout) clearTimeout(soundTestTimeout);
        soundTestTimeout = setTimeout(() => {
            stopSoundTest();
        }, 5000);
    }

    function stopSoundTest() {
        isTestingSound = false;
        elements.testSoundBtnText.textContent = "Ovozni sinab ko'rish";
        elements.soundVisualizer.classList.remove('playing');
        stopAlarmSound();
        if (soundTestTimeout) {
            clearTimeout(soundTestTimeout);
            soundTestTimeout = null;
        }
    }

    // --- Quick Presets & Form Handling ---
    function setupPresets() {
        elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutesAdd = btn.getAttribute('data-minutes');
                const fixedTime = btn.getAttribute('data-fixed');

                if (fixedTime) {
                    elements.alarmTimeInput.value = fixedTime;
                } else if (minutesAdd) {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + parseInt(minutesAdd, 10));
                    const h = String(now.getHours()).padStart(2, '0');
                    const m = String(now.getMinutes()).padStart(2, '0');
                    elements.alarmTimeInput.value = `${h}:${m}`;
                }

                // Add visual bounce animation to input
                elements.alarmTimeInput.style.transform = 'scale(1.04)';
                setTimeout(() => elements.alarmTimeInput.style.transform = 'scale(1)', 150);
            });
        });
    }

    function setupForm() {
        // Set default time to current time + 10 mins if empty
        const defaultDate = new Date();
        defaultDate.setMinutes(defaultDate.getMinutes() + 10);
        elements.alarmTimeInput.value = `${String(defaultDate.getHours()).padStart(2, '0')}:${String(defaultDate.getMinutes()).padStart(2, '0')}`;

        // Volume slider update
        elements.volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            elements.volumePercentDisplay.textContent = `${val}%`;
            setMasterVolume(val / 100);
            localStorage.setItem(VOLUME_KEY, val);
        });

        // Load saved volume
        const savedVol = localStorage.getItem(VOLUME_KEY);
        if (savedVol) {
            elements.volumeSlider.value = savedVol;
            elements.volumePercentDisplay.textContent = `${savedVol}%`;
        }

        // Form Submit
        elements.alarmForm.addEventListener('submit', (e) => {
            e.preventDefault();
            initAudioContext();

            const timeVal = elements.alarmTimeInput.value.trim();
            if (!timeVal) return;

            const labelVal = elements.alarmLabelInput.value.trim();
            const soundVal = elements.soundSelector.value;
            const volumeVal = parseInt(elements.volumeSlider.value, 10);

            // Check if alarm at this exact time already exists
            const existingIndex = alarms.findIndex(a => a.time === timeVal);
            if (existingIndex !== -1) {
                // Update existing
                alarms[existingIndex].enabled = true;
                alarms[existingIndex].label = labelVal || alarms[existingIndex].label;
                alarms[existingIndex].sound = soundVal;
                alarms[existingIndex].volume = volumeVal;
                if (soundVal === 'custom' && currentCustomAudioData) {
                    alarms[existingIndex].customAudioSrc = currentCustomAudioData;
                    alarms[existingIndex].customAudioName = currentCustomAudioName;
                }
                showToastNotification(`${timeVal} dagi budilnik yangilandi!`);
            } else {
                // Create new
                const newAlarm = {
                    id: 'alarm_' + Date.now(),
                    time: timeVal,
                    label: labelVal || "Budilnik",
                    sound: soundVal,
                    volume: volumeVal,
                    enabled: true,
                    customAudioSrc: soundVal === 'custom' ? currentCustomAudioData : null,
                    customAudioName: soundVal === 'custom' ? currentCustomAudioName : null
                };
                alarms.push(newAlarm);
                showToastNotification(`Yangi budilnik saqlandi: ${timeVal}`);
            }

            saveAlarms();
            renderAlarms();

            // Clear label input
            elements.alarmLabelInput.value = '';
        });

        // Clear All Alarms
        elements.clearAllAlarmsBtn.addEventListener('click', () => {
            if (alarms.length === 0) return;
            if (confirm("Rostdan ham barcha budilniklarni o'chirmoqchimisiz?")) {
                alarms = [];
                saveAlarms();
                renderAlarms();
                showToastNotification("Barcha budilniklar tozalandi");
            }
        });
    }

    // --- Modal Ringing Buttons ---
    function setupModalActions() {
        elements.stopAlarmBtn.addEventListener('click', () => {
            stopAlarmRinging();
            showToastNotification("Budilnik o'chirildi.");
        });

        elements.snoozeAlarmBtn.addEventListener('click', () => {
            snoozeAlarm();
        });
    }

    // --- Themes ---
    function setupThemes() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'theme-dark';
        document.body.className = savedTheme;

        elements.themeButtons.forEach(btn => {
            if (btn.getAttribute('data-theme') === savedTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                document.body.className = theme;
                localStorage.setItem(THEME_KEY, theme);

                elements.themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // --- Initialize ---
    function init() {
        setupAudioAutoUnlock();
        setupThemes();
        setupNotifications();
        setupCustomAudioUpload();
        setupSoundTest();
        setupPresets();
        setupForm();
        setupModalActions();

        loadAlarms();
        renderAlarms();

        // Start high-performance 60fps clock loop
        renderAnalogLoop();
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
