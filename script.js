document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM 요소 선택 ---
    const app = document.getElementById('app');
    
    // 탭 버튼 및 모드 컨테이너
    const tabClockButton = document.getElementById('tab-clock');
    const tabTimerButton = document.getElementById('tab-timer');
    const clockMode = document.getElementById('clock-mode');
    const timerMode = document.getElementById('timer-mode');

    // 시계 모드 요소
    const clockDisplay = document.getElementById('clock-display');
    const modeAmpmButton = document.getElementById('mode-ampm');
    const mode24hButton = document.getElementById('mode-24h');
    let is24HourMode = false; // 기본값: AM/PM 모드

    // 타이머 모드 요소
    const timerInput = document.getElementById('timer-input');
    const timerDisplay = document.getElementById('timer-display');
    const startStopButton = document.getElementById('start-stop-button');
    const resetButton = document.getElementById('reset-button');
    
    // 타이머 상태 변수
    let clockInterval;
    let countdownInterval;
    let totalSeconds = 0; 
    let initialTotalSeconds = 300; // 기본값 5분 (00:05)
    let isTimerRunning = false;
    let blinkInterval;


    // --- 2. 헬퍼 함수 ---

    /** 시간을 HH:MM:SS 형식으로 변환 */
    function formatTime(secs) {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        
        // HH는 타이머 모드에서는 0이 아니면 표시, 시계 모드에서는 항상 표시
        if (h > 0 || clockMode.classList.contains('active')) {
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    /** Web Audio API를 사용한 알람 소리 재생 */
    function playAlarm() {
        //         const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // 톤 설정
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 고주파수 톤
        
        // 볼륨 설정 및 연결
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 재생 및 1초 후 정지
        oscillator.start(); 
        oscillator.stop(audioContext.currentTime + 1.0); 
    }


    /** 화면 깜빡임 효과 */
    function startBlink() {
        // 깜빡임 클래스를 100ms 간격으로 토글
        let blinkCount = 0;
        blinkInterval = setInterval(() => {
            app.classList.toggle('blink-active');
            blinkCount++;
            
            // 20번 깜빡인 후 정지 (약 2초)
            if (blinkCount >= 20) {
                clearInterval(blinkInterval);
                app.classList.remove('blink-active'); // 마지막에 흰색으로 남지 않도록 제거
            }
        }, 100);
    }


    // --- 3. 시계 모드 로직 ---

    /** 시계 모드 갱신 함수 */
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        let ampm = '';

        if (!is24HourMode) {
            ampm = hours >= 12 ? ' PM' : ' AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0시를 12시로 표시
        }
        
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');

        clockDisplay.textContent = `${h}:${m}:${s}${ampm}`;
    }

    /** AM/PM 또는 24H 모드 전환 */
    function toggleClockMode(is24H) {
        is24HourMode = is24H;
        
        modeAmpmButton.classList.remove('active');
        mode24hButton.classList.remove('active');
        
        if (is24H) {
            mode24hButton.classList.add('active');
        } else {
            modeAmpmButton.classList.add('active');
        }
        updateClock();
    }


    // --- 4. 타이머 모드 로직 ---

    /** 타이머 1초 카운트다운 */
    function countdown() {
        totalSeconds--; 

        if (totalSeconds < 0) {
            clearInterval(countdownInterval);
            isTimerRunning = false;
            startStopButton.textContent = '시작';
            
            timerInput.disabled = false;
            
            timerDisplay.textContent = "00:00";
            
            // ⏰ 시간 종료 시 알람 및 깜빡임
            playAlarm();
            startBlink();
            
            return;
        }

        // 시간 표시 업데이트
        timerDisplay.textContent = formatTime(totalSeconds);
    }

    /** 타이머 시작 / 정지 (Toggle) */
    function startStopTimer() {
        if (isTimerRunning) {
            // 정지
            clearInterval(countdownInterval);
            isTimerRunning = false;
            startStopButton.textContent = '재개';
            timerInput.disabled = false;
            
        } else {
            // 시작 또는 재개
            
            // 새로 시작하는 경우, 입력값 파싱
            if (startStopButton.textContent === '시작') {
                const [inputH, inputM] = timerInput.value.split(':').map(Number);
                
                // HH:MM 형식 입력을 초로 변환 (타이머는 HH:MM만 설정 가능)
                initialTotalSeconds = (inputH * 3600) + (inputM * 60);
                totalSeconds = initialTotalSeconds; 

                if (totalSeconds <= 0) {
                    alert("타이머 시간을 설정해 주세요.");
                    return;
                }
            }
            
            // 타이머 시작
            isTimerRunning = true;
            startStopButton.textContent = '정지';
            timerInput.disabled = true;
            
            countdownInterval = setInterval(countdown, 1000);
            
            // 시작하자마자 1초 깎이는 것을 방지하기 위해 1초 후 시작
            // countdown(); // 주석 처리: 인터벌이 1초 후 실행되므로, 초기 시간은 startStopButton === '시작'에서 설정됨.
        }
    }

    /** 타이머 리셋 */
    function resetTimer() {
        clearInterval(countdownInterval);
        isTimerRunning = false;
        startStopButton.textContent = '시작';
        timerInput.disabled = false;
        
        // 초기 시간으로 복원 (input value를 기반으로 다시 계산)
        const [inputH, inputM] = timerInput.value.split(':').map(Number);
        totalSeconds = (inputH * 3600) + (inputM * 60);
        
        timerDisplay.textContent = formatTime(totalSeconds);

        // 깜빡임 중지
        clearInterval(blinkInterval);
        app.classList.remove('blink-active');
    }

    // --- 5. 탭 전환 로직 ---
    function switchMode(mode) {
        // 모든 모드 숨김
        clockMode.classList.add('hidden');
        timerMode.classList.add('hidden');
        
        tabClockButton.classList.remove('active');
        tabTimerButton.classList.remove('active');

        if (mode === 'clock') {
            clockMode.classList.remove('hidden');
            tabClockButton.classList.add('active');
            
            // 타이머 중지 및 클럭 업데이트 시작
            clearInterval(countdownInterval);
            isTimerRunning = false;
            startStopButton.textContent = '시작';
            clockInterval = setInterval(updateClock, 1000);
            
        } else if (mode === 'timer') {
            timerMode.classList.remove('hidden');
            tabTimerButton.classList.add('active');
            
            // 클럭 업데이트 중지
            clearInterval(clockInterval);
            
            // 초기 타이머 상태 설정
            resetTimer(); 
        }
    }


    // --- 6. 초기화 및 이벤트 리스너 등록 ---
    
    // 탭 이벤트 리스너
    tabClockButton.addEventListener('click', () => switchMode('clock'));
    tabTimerButton.addEventListener('click', () => switchMode('timer'));

    // 시계 모드 토글 이벤트 리스너
    modeAmpmButton.addEventListener('click', () => toggleClockMode(false));
    mode24hButton.addEventListener('click', () => toggleClockMode(true));

    // 타이머 컨트롤 이벤트 리스너
    startStopButton.addEventListener('click', startStopTimer);
    resetButton.addEventListener('click', resetTimer);
    
    // 타이머 입력 값 변경 시 리셋
    timerInput.addEventListener('change', resetTimer);


    // 초기화 함수
    (function init() {
        // 기본 모드: 시계 모드 활성화 및 시계 인터벌 시작
        switchMode('clock'); 
        toggleClockMode(false); // 기본 시계 모드: AM/PM
        
        // 타이머 초기값 설정
        timerInput.value = "00:05"; // 5분
    })();
});