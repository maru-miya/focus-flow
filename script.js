class FocusFlowTimer {
    constructor() {
        this.currentMode = 'work'; // 'work' or 'break'
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 0;
        this.interval = null;
        this.startTime = null;
        this.pausedTime = 0;

        this.elements = {
            workHours: document.getElementById('workHours'),
            workMinutes: document.getElementById('workMinutes'),
            workSeconds: document.getElementById('workSeconds'),
            breakHours: document.getElementById('breakHours'),
            breakMinutes: document.getElementById('breakMinutes'),
            breakSeconds: document.getElementById('breakSeconds'),
            modeIndicator: document.getElementById('modeIndicator'),
            timerDisplay: document.getElementById('timerDisplay'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            switchModeBtn: document.getElementById('switchModeBtn'),
            dailyStats: document.getElementById('dailyStats'),
            timerSection: document.getElementById('timerSection')
        };

        this.init();
    }

    init() {
        this.loadSettings();
        this.loadDailyStats();
        this.updateDisplay();
        this.bindEvents();
        this.updateTimerFromSettings();
        this.updateSwitchModeButton();
        this.updateTimerClickability();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pause();
        } else if (this.isPaused || this.timeRemaining > 0) {
            this.start();
        }
    }

    updateTimerClickability() {
        if (this.isRunning || this.isPaused || this.timeRemaining > 0) {
            this.elements.timerDisplay.classList.add('clickable');
        } else {
            this.elements.timerDisplay.classList.remove('clickable');
        }
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.switchModeBtn.addEventListener('click', () => this.switchMode());

        // タイマー表示部分をクリックして再開・一時停止
        this.elements.timerDisplay.addEventListener('click', () => this.toggleTimer());

        // 設定変更時の処理
        [this.elements.workHours, this.elements.workMinutes, this.elements.workSeconds,
         this.elements.breakHours, this.elements.breakMinutes, this.elements.breakSeconds].forEach(input => {
            input.addEventListener('change', () => {
                this.handleInputChange(input);
            });

            input.addEventListener('blur', () => {
                this.handleInputBlur(input);
            });
        });

        // スクロールイベントの処理
        this.bindScrollEvents();
    }

    bindScrollEvents() {
        const timeInputs = [
            this.elements.workHours,
            this.elements.workMinutes,
            this.elements.workSeconds,
            this.elements.breakHours,
            this.elements.breakMinutes,
            this.elements.breakSeconds
        ];

        timeInputs.forEach(input => {
            input.addEventListener('wheel', (e) => {
                e.preventDefault();

                const isHours = input.id.includes('Hours');
                const maxValue = isHours ? 23 : 59;
                const currentValue = parseInt(input.value) || 0;

                let newValue;
                if (e.deltaY < 0) {
                    // 上スクロール（値を増加）
                    newValue = Math.min(currentValue + 1, maxValue);
                } else {
                    // 下スクロール（値を減少）
                    newValue = Math.max(currentValue - 1, 0);
                }

                input.value = newValue;

                // 設定を保存し、タイマーが停止中の場合は表示を更新
                this.handleInputChange(input);
            });

            // タッチデバイス用のスクロール処理
            let touchStartY = 0;
            let touchMoveY = 0;

            input.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            input.addEventListener('touchmove', (e) => {
                touchMoveY = e.touches[0].clientY;
            }, { passive: true });

            input.addEventListener('touchend', (e) => {
                const deltaY = touchStartY - touchMoveY;
                const threshold = 20; // スクロール感度の閾値

                if (Math.abs(deltaY) > threshold) {
                    const isHours = input.id.includes('Hours');
                    const maxValue = isHours ? 23 : 59;
                    const currentValue = parseInt(input.value) || 0;

                    let newValue;
                    if (deltaY > 0) {
                        // 上スワイプ（値を増加）
                        newValue = Math.min(currentValue + 1, maxValue);
                    } else {
                        // 下スワイプ（値を減少）
                        newValue = Math.max(currentValue - 1, 0);
                    }

                    input.value = newValue;

                    // 設定を保存し、タイマーが停止中の場合は表示を更新
                    this.handleInputChange(input);
                }
            }, { passive: true });
        });
    }

    handleInputChange(input) {
        this.saveSettings();
        if (!this.isRunning) {
            this.updateTimerFromSettings();
        }
    }

    handleInputBlur(input) {
        // 入力欄がフォーカスを失った時に空白なら0を表示
        if (input.value === '' || input.value === null || input.value === undefined) {
            input.value = '0';
            this.saveSettings();
            if (!this.isRunning) {
                this.updateTimerFromSettings();
            }
        }
    }

    updateTimerFromSettings() {
        if (this.currentMode === 'work') {
            this.timeRemaining = this.getWorkTimeInSeconds();
        } else {
            this.timeRemaining = this.getBreakTimeInSeconds();
        }
        this.updateDisplay();
    }

    getWorkTimeInSeconds() {
        return (parseInt(this.elements.workHours.value) || 0) * 3600 +
               (parseInt(this.elements.workMinutes.value) || 0) * 60 +
               (parseInt(this.elements.workSeconds.value) || 0);
    }

    getBreakTimeInSeconds() {
        return (parseInt(this.elements.breakHours.value) || 0) * 3600 +
               (parseInt(this.elements.breakMinutes.value) || 0) * 60 +
               (parseInt(this.elements.breakSeconds.value) || 0);
    }

    start() {
        if (this.timeRemaining === 0) {
            this.updateTimerFromSettings();
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTime = Date.now() - this.pausedTime;

        this.elements.startBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'inline-block';
        this.elements.switchModeBtn.style.display = 'none';
        this.elements.timerDisplay.classList.add('running');
        this.updateTimerClickability();

        this.interval = setInterval(() => {
            this.tick();
        }, 100);
    }

    pause() {
        this.isRunning = false;
        this.isPaused = true;
        this.pausedTime = Date.now() - this.startTime;

        clearInterval(this.interval);

        this.elements.startBtn.style.display = 'inline-block';
        this.elements.startBtn.textContent = '再開';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.timerDisplay.classList.remove('running');
        this.updateSwitchModeButton();
        this.updateTimerClickability();
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.pausedTime = 0;

        clearInterval(this.interval);

        this.updateTimerFromSettings();

        this.elements.startBtn.style.display = 'inline-block';
        this.elements.startBtn.textContent = '開始';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.timerDisplay.classList.remove('running');

        // リセット時にもモード切り替えボタンを表示
        this.updateSwitchModeButton();
        this.updateTimerClickability();
    }

    tick() {
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.timeRemaining * 1000 - elapsed);

        if (remaining === 0) {
            this.complete();
        } else {
            this.updateDisplayFromTime(Math.ceil(remaining / 1000));
        }
    }

    complete() {
        this.isRunning = false;
        clearInterval(this.interval);

        // 作業モードが完了した場合は統計を更新
        if (this.currentMode === 'work') {
            this.updateDailyStats();
        }

        this.playNotification(this.currentMode);

        // UI更新
        this.elements.startBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.switchModeBtn.style.display = 'inline-block';
        this.elements.timerDisplay.classList.remove('running');

        const nextMode = this.currentMode === 'work' ? '休憩' : '作業';
        this.elements.switchModeBtn.textContent = `${nextMode}に切り替え`;

        this.updateDisplayFromTime(0);
        this.updateTimerClickability();
    }

    switchMode() {
        this.currentMode = this.currentMode === 'work' ? 'break' : 'work';
        this.pausedTime = 0;
        this.updateTimerFromSettings();
        this.updateModeDisplay();

        this.elements.startBtn.style.display = 'inline-block';
        this.elements.startBtn.textContent = '開始';

        // タイマー完了後以外でも切り替えボタンを表示し続ける
        if (!this.isRunning) {
            this.updateSwitchModeButton();
        } else {
            this.elements.switchModeBtn.style.display = 'none';
        }
        this.updateTimerClickability();
    }

    updateModeDisplay() {
        if (this.currentMode === 'work') {
            this.elements.modeIndicator.textContent = '作業中';
            document.body.classList.remove('break-mode');
        } else {
            this.elements.modeIndicator.textContent = '休憩中';
            document.body.classList.add('break-mode');
        }
    }

    updateSwitchModeButton() {
        const nextMode = this.currentMode === 'work' ? '休憩' : '作業';
        this.elements.switchModeBtn.textContent = `${nextMode}モード`;
        this.elements.switchModeBtn.style.display = 'inline-block';
    }

    updateDisplay() {
        this.updateDisplayFromTime(this.timeRemaining);
        this.updateModeDisplay();
    }

    updateDisplayFromTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            this.elements.timerDisplay.textContent =
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            this.elements.timerDisplay.textContent =
                `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    playNotification(currentMode) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const duration = 2.0;

            if (currentMode === 'work') {
                // 作業完了時: 優しく落ち着いた音（休憩開始）
                const frequencies = [392.00, 493.88, 587.33]; // G4, B4, D5 (Gメジャーコード)

                frequencies.forEach((freq, index) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = freq;
                    oscillator.type = 'triangle';

                    const baseVolume = 0.12 - (index * 0.02);
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.3);
                    gainNode.gain.linearRampToValueAtTime(baseVolume, audioContext.currentTime + index * 0.3 + 0.15);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.3 + duration);

                    oscillator.start(audioContext.currentTime + index * 0.3);
                    oscillator.stop(audioContext.currentTime + index * 0.3 + duration);
                });
            } else {
                // 休憩完了時: 明るく活気のある音（作業開始）
                const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Cメジャーコード)

                frequencies.forEach((freq, index) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = freq;
                    oscillator.type = 'triangle';

                    const baseVolume = 0.15 - (index * 0.025);
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.15);
                    gainNode.gain.linearRampToValueAtTime(baseVolume, audioContext.currentTime + index * 0.15 + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.15 + duration);

                    oscillator.start(audioContext.currentTime + index * 0.15);
                    oscillator.stop(audioContext.currentTime + index * 0.15 + duration);
                });
            }
        } catch (e) {
            console.log('Audio notification not available');
        }
    }

    updateDailyStats() {
        const workTimeSeconds = this.getWorkTimeInSeconds();
        const today = new Date().toDateString();

        let stats = JSON.parse(localStorage.getItem('focusFlowStats') || '{}');

        if (stats.date !== today) {
            stats = { date: today, totalSeconds: 0 };
        }

        stats.totalSeconds += workTimeSeconds;
        localStorage.setItem('focusFlowStats', JSON.stringify(stats));

        this.displayDailyStats(stats.totalSeconds);
    }

    loadDailyStats() {
        const today = new Date().toDateString();
        let stats = JSON.parse(localStorage.getItem('focusFlowStats') || '{}');

        if (stats.date !== today) {
            stats = { date: today, totalSeconds: 0 };
            localStorage.setItem('focusFlowStats', JSON.stringify(stats));
        }

        this.displayDailyStats(stats.totalSeconds);
    }

    displayDailyStats(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        this.elements.dailyStats.textContent = `今日：${hours}時間${minutes}分集中`;
    }

    saveSettings() {
        const settings = {
            workHours: this.elements.workHours.value,
            workMinutes: this.elements.workMinutes.value,
            workSeconds: this.elements.workSeconds.value,
            breakHours: this.elements.breakHours.value,
            breakMinutes: this.elements.breakMinutes.value,
            breakSeconds: this.elements.breakSeconds.value
        };
        localStorage.setItem('focusFlowSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('focusFlowSettings') || '{}');

        if (settings.workHours !== undefined) {
            this.elements.workHours.value = settings.workHours;
            this.elements.workMinutes.value = settings.workMinutes;
            this.elements.workSeconds.value = settings.workSeconds;
            this.elements.breakHours.value = settings.breakHours;
            this.elements.breakMinutes.value = settings.breakMinutes;
            this.elements.breakSeconds.value = settings.breakSeconds;
        }
    }
}

// アプリ初期化
document.addEventListener('DOMContentLoaded', () => {
    new FocusFlowTimer();
});