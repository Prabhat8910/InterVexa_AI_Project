export const analyzeSpeechData = (transcription, audioDurationSec, volumeFluctuations) => {
    // 1. Calculate WPM (Words per minute)
    const words = transcription.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const minutes = audioDurationSec / 60;
    const speedWordsPerMin = minutes > 0 ? Math.round(wordCount / minutes) : 0;
    // 2. Detect filler words
    const fillers = ['um', 'uh', 'like', 'ah', 'you know', 'actually', 'basically', 'so', 'well', 'stuff'];
    let fillersCount = 0;
    words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        if (fillers.includes(cleanWord)) {
            fillersCount++;
        }
    });
    // 3. Count pauses (based on punctuation boundaries in parsed text)
    const pauseMatches = transcription.match(/[,.\-!?]/g);
    const pausesCount = pauseMatches ? pauseMatches.length : 0;
    // 4. Calculate Voice Stability
    let stabilityScore = 8.0;
    if (volumeFluctuations.length > 1) {
        const mean = volumeFluctuations.reduce((a, b) => a + b, 0) / volumeFluctuations.length;
        const variance = volumeFluctuations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / volumeFluctuations.length;
        const stdDev = Math.sqrt(variance);
        const relativeVariance = mean > 0 ? stdDev / mean : 0;
        // Higher variance decreases stability score
        stabilityScore = Math.max(1, Math.min(10, 10 - (relativeVariance * 8)));
    }
    // 5. Estimate emotional profile based on speech rate and filler ratios
    let confidence = 7;
    let stress = 3;
    let calmness = 7;
    let excitement = 4;
    let nervousness = 2;
    let professionalism = 8;
    const lowerText = transcription.toLowerCase();
    if (lowerText.includes('sorry') || lowerText.includes('maybe') || lowerText.includes('i think') || lowerText.includes('not sure')) {
        confidence -= 2;
        nervousness += 2;
        stress += 1;
        professionalism -= 1;
    }
    if (fillersCount > 3) {
        confidence -= 1;
        nervousness += 2;
        professionalism -= 1;
    }
    // WPM heuristics
    if (speedWordsPerMin > 160) { // speaking too quickly
        stress += 3;
        calmness -= 3;
        nervousness += 2;
        confidence -= 1;
    }
    else if (speedWordsPerMin < 70 && speedWordsPerMin > 0) { // speaking too slowly
        confidence -= 1;
        professionalism -= 1;
    }
    // Communication score base estimation
    let communication = 8;
    if (fillersCount > 2)
        communication -= 2;
    if (speedWordsPerMin > 160 || (speedWordsPerMin < 70 && speedWordsPerMin > 0))
        communication -= 1;
    const clamp = (val) => Math.max(1, Math.min(10, Math.round(val)));
    return {
        confidence: clamp(confidence),
        stress: clamp(stress),
        calmness: clamp(calmness),
        excitement: clamp(excitement),
        nervousness: clamp(nervousness),
        professionalism: clamp(professionalism),
        communication: clamp(communication),
        speedWordsPerMin,
        pausesCount,
        fillersCount,
        stabilityScore: Math.round(stabilityScore * 10) / 10
    };
};
