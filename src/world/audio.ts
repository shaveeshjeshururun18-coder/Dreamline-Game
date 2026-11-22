import type { TimePeriod, WeatherType } from '../game/types';
import { getWeatherProfile } from '../game/extremeWeather';
import type { StationAnnouncement, StationCrowdProfile } from '../game/stationAnnouncements';
import type { StationAnnouncement, StationCrowdProfile } from '../game/stationAnnouncements';

/**
 * 100% Procedural Web Audio API soundscape engine for DREAMLINE:
 * - Spatial gentle wind & rustling leaves
 * - Morning/afternoon birdsong (soft FM sine chirps)
 * - Spatial train wheel rail-joint clatter ("ka-thunk ka-thunk") & motor hum
 * - Nostalgic Japanese station arrival/departure melody chime (hassha melody)
 * - Railway level-crossing warning bell ("kan-kan-kan")
 * - Soft rain / heavy storm rain / thunder claps / flood & tsunami ocean surge roar
 * - Footsteps, vending machine dispense clunk, camera shutter click
 * - Original peaceful solo piano & warm pad generative soundtrack
 */
export class DreamlineAudio {
  private ctx: AudioContext | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private masterSfx: GainNode | null = null;
  private masterMusic: GainNode | null = null;
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private waterGain: GainNode | null = null;
  private trainHumGain: GainNode | null = null;
  private trainHumOsc: OscillatorNode | null = null;
  private crowdGain: GainNode | null = null;
  private crowdFormants: BiquadFilterNode[] = [];
  private crowdLfoA: OscillatorNode | null = null;
  private crowdLfoB: OscillatorNode | null = null;
  private unlocked = false;

  private soundVolume = 0.72;
  private musicVolume = 0.55;
  private muted = false;

  private birdTimer = 2.0;
  private musicTimer = 1.5;
  private clatterTimer = 0;
  private crossingBellTimer = 0;
  private chordIndex = 0;
  private paused = false;

  // Peaceful nostalgic Japanese pentatonic / Maj9 chords (Hz)
  private readonly chords: number[][] = [
    [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
    [220.0, 261.63, 329.63, 392.0, 493.88], // Am9
    [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
    [196.0, 246.94, 293.66, 392.0, 440.0], // G6/9
  ];

  public unlock(): void {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      this.masterSfx = ctx.createGain();
      this.masterMusic = ctx.createGain();
      this.masterSfx.connect(ctx.destination);
      this.masterMusic.connect(ctx.destination);
      this.applyVolumes();

      // Create shared noise buffer for wind, rain, water, and footsteps
      const sampleRate = ctx.sampleRate;
      const noiseBuf = ctx.createBuffer(1, sampleRate * 3, sampleRate);
      const data = noiseBuf.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = (b0 + b1 + b2 + white * 0.015) * 0.45;
      }
      this.noiseBuf = noiseBuf;

      // Gentle wind bed
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = noiseBuf;
      windSrc.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 340;
      windFilter.Q.value = 0.7;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.08;
      windSrc.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterSfx);
      windSrc.start();

      // Light rain bed
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = noiseBuf;
      rainSrc.loop = true;
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'highpass';
      rainFilter.frequency.value = 1400;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0.0;
      rainSrc.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterSfx);
      rainSrc.start();

      // Lakeside water lapping bed
      const waterSrc = ctx.createBufferSource();
      waterSrc.buffer = noiseBuf;
      waterSrc.loop = true;
      const waterFilter = ctx.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 420;
      this.waterGain = ctx.createGain();
      this.waterGain.gain.value = 0.0;
      waterSrc.connect(waterFilter);
      waterFilter.connect(this.waterGain);
      this.waterGain.connect(this.masterSfx);
      waterSrc.start();

      // Soft train motor hum
      this.trainHumOsc = ctx.createOscillator();
      this.trainHumOsc.type = 'triangle';
      this.trainHumOsc.frequency.value = 58;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.value = 180;
      this.trainHumGain = ctx.createGain();
      this.trainHumGain.gain.value = 0.0;
      this.trainHumOsc.connect(humFilter);
      humFilter.connect(this.trainHumGain);
      this.trainHumGain.connect(this.masterSfx);
      this.trainHumOsc.start();

      // Regional station platform crowd murmur bed (3 parallel vocal-formant bandpass filters + gentle LFO swell)
      const crowdSrc = ctx.createBufferSource();
      crowdSrc.buffer = noiseBuf;
      crowdSrc.loop = true;
      const crowdModGain = ctx.createGain();
      crowdModGain.gain.value = 0.72;
      this.crowdGain = ctx.createGain();
      this.crowdGain.gain.value = 0.0;

      const defaultFormants = [310, 770, 1520];
      const formantGains = [0.62, 0.45, 0.24];
      this.crowdFormants = [];
      for (let i = 0; i < 3; i++) {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = defaultFormants[i];
        bp.Q.value = i === 0 ? 2.4 : i === 1 ? 3.2 : 3.8;
        const fg = ctx.createGain();
        fg.gain.value = formantGains[i];
        crowdSrc.connect(bp);
        bp.connect(fg);
        fg.connect(crowdModGain);
        this.crowdFormants.push(bp);
      }

      // Two gentle asynchronous LFOs emulate organic overlapping chatter waves on a platform
      const lfoA = ctx.createOscillator();
      lfoA.type = 'sine';
      lfoA.frequency.value = 0.28;
      const lfoAGain = ctx.createGain();
      lfoAGain.gain.value = 0.18;
      lfoA.connect(lfoAGain);
      lfoAGain.connect(crowdModGain.gain);
      lfoA.start();
      this.crowdLfoA = lfoA;

      const lfoB = ctx.createOscillator();
      lfoB.type = 'sine';
      lfoB.frequency.value = 0.43;
      const lfoBGain = ctx.createGain();
      lfoBGain.gain.value = 0.12;
      lfoB.connect(lfoBGain);
      lfoBGain.connect(crowdModGain.gain);
      lfoB.start();
      this.crowdLfoB = lfoB;

      crowdModGain.connect(this.crowdGain);
      this.crowdGain.connect(this.masterSfx);
      crowdSrc.start();

      this.unlocked = true;
    } catch {
      // Audio unavailable in headless / restricted environments
    }
  }

  public setVolumes(soundVolume: number, musicVolume: number, muted: boolean): void {
    this.soundVolume = soundVolume;
    this.musicVolume = musicVolume;
    this.muted = muted;
    this.applyVolumes();
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterSfx || !this.masterMusic) return;
    const now = this.ctx.currentTime;
    const active = this.muted || this.paused ? 0 : 1;
    this.masterSfx.gain.setTargetAtTime(this.soundVolume * active, now, 0.08);
    this.masterMusic.gain.setTargetAtTime(this.musicVolume * active, now, 0.12);
  }

  public update(params: {
    dt: number;
    period: TimePeriod;
    weather: WeatherType;
    distToTrain: number;
    trainSpeedKmh: number;
    isOnTrain: boolean;
    distToLake: number;
    distToCrossing: number;
    trainDistToCrossing: number;
    distToOcean?: number;
    distToWaterfall?: number;
    boatSpeed?: number;
    stationCrowd?: StationCrowdProfile;
  }): void {
    if (!this.unlocked || !this.ctx || this.paused || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. Wind & rain & lake/ocean/waterfall spatial ambience
    const profile = getWeatherProfile(params.weather);
    this.windGain?.gain.setTargetAtTime(profile.windAudioGain, now, 0.35);
    this.rainGain?.gain.setTargetAtTime(profile.rainAudioGain, now, 0.35);

    const lakeProximity = Math.max(0, 1 - params.distToLake / 44);
    const oceanProximity = params.distToOcean !== undefined ? Math.max(0, 1 - params.distToOcean / 56) : 0;
    const waterfallProximity = params.distToWaterfall !== undefined ? Math.max(0, 1 - params.distToWaterfall / 38) : 0;
    const boatWash = params.boatSpeed ? Math.min(0.12, Math.abs(params.boatSpeed) * 0.018) : 0;
    const waterLevel = Math.min(
      0.52,
      lakeProximity * 0.13 +
        oceanProximity * 0.18 +
        waterfallProximity * 0.22 +
        boatWash +
        profile.waterSurgeAudioGain
    );
    this.waterGain?.gain.setTargetAtTime(waterLevel, now, 0.3);

    // 1B. Regional Station Platform Ambient Crowd Murmur
    if (params.stationCrowd && this.crowdGain) {
      const sc = params.stationCrowd;
      this.crowdGain.gain.setTargetAtTime(sc.gain, now, 0.45);
      if (this.crowdFormants.length === 3) {
        this.crowdFormants[0].frequency.setTargetAtTime(sc.formantLowHz, now, 0.6);
        this.crowdFormants[1].frequency.setTargetAtTime(sc.formantMidHz, now, 0.6);
        this.crowdFormants[2].frequency.setTargetAtTime(sc.formantHighHz, now, 0.6);
      }
      this.crowdLfoA?.frequency.setTargetAtTime(sc.modulationHz, now, 0.6);
      this.crowdLfoB?.frequency.setTargetAtTime(sc.modulationHz * 1.47, now, 0.6);
    } else if (this.crowdGain) {
      this.crowdGain.gain.setTargetAtTime(0, now, 0.4);
    }

    // 2. Spatial train engine hum & rhythmic track clatter
    const trainProx = params.isOnTrain ? 0.72 : Math.max(0, 1 - params.distToTrain / 78);
    const speedFactor = Math.min(1, params.trainSpeedKmh / 48);
    const humVol = trainProx * (0.025 + speedFactor * 0.065);
    this.trainHumGain?.gain.setTargetAtTime(humVol, now, 0.18);
    this.trainHumOsc?.frequency.setTargetAtTime(52 + speedFactor * 42, now, 0.2);

    if (trainProx > 0.08 && params.trainSpeedKmh > 6) {
      this.clatterTimer -= params.dt;
      if (this.clatterTimer <= 0) {
        this.playRailClatter(trainProx * speedFactor);
        this.clatterTimer = Math.max(0.42, 1.35 - speedFactor * 0.72);
      }
    }

    // 3. Railway crossing bell ("kan-kan-kan") when train nears level crossing
    const crossingActive = params.trainDistToCrossing < 34;
    const playerCrossingProx = Math.max(0, 1 - params.distToCrossing / 62);
    if (crossingActive && playerCrossingProx > 0.06) {
      this.crossingBellTimer -= params.dt;
      if (this.crossingBellTimer <= 0) {
        this.playCrossingBell(playerCrossingProx * 0.16);
        this.crossingBellTimer = 0.52;
      }
    }

    // 4. Morning / afternoon / golden hour birdsong
    const birdsActive =
      (params.period === 'morning' || params.period === 'afternoon' || params.period === 'golden') &&
      !profile.isRainy &&
      !params.isOnTrain;
    if (birdsActive) {
      this.birdTimer -= params.dt;
      if (this.birdTimer <= 0) {
        this.playBirdChirp();
        this.birdTimer = 2.8 + Math.random() * 4.5;
      }
    }

    // 5. Peaceful generative piano & warm pad soundtrack
    if (this.musicVolume > 0.01) {
      this.musicTimer -= params.dt;
      if (this.musicTimer <= 0) {
        this.playPeacefulNote();
        this.musicTimer = 1.6 + Math.random() * 2.1;
      }
    }
  }

  private playRailClatter(intensity: number): void {
    if (!this.ctx || !this.masterSfx) return;
    const now = this.ctx.currentTime;
    // Double rhythmic rail joint thud: ka-thunk
    [0, 0.11].forEach((offset) => {
      if (!this.ctx || !this.masterSfx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(112, now + offset);
      osc.frequency.exponentialRampToValueAtTime(42, now + offset + 0.08);
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.11 * intensity, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + 0.095);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
  }

  private playCrossingBell(volume: number): void {
    if (!this.ctx || !this.masterSfx) return;
    const now = this.ctx.currentTime;
    [784, 1568].forEach((freq, idx) => {
      if (!this.ctx || !this.masterSfx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume * (idx === 0 ? 1 : 0.35), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.38);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  private playBirdChirp(): void {
    if (!this.ctx || !this.masterSfx) return;
    const now = this.ctx.currentTime;
    const base = 2400 + Math.random() * 1400;
    const chirps = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < chirps; i++) {
      const t = now + i * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * (1.28 + Math.random() * 0.15), t + 0.055);
      osc.frequency.exponentialRampToValueAtTime(base * 0.92, t + 0.11);
      gain.gain.setValueAtTime(0.0005, t);
      gain.gain.linearRampToValueAtTime(0.032, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  private playPeacefulNote(): void {
    if (!this.ctx || !this.masterMusic) return;
    const now = this.ctx.currentTime;
    const chord = this.chords[this.chordIndex % this.chords.length];
    if (Math.random() < 0.28) this.chordIndex++;

    // Warm piano-like bell note
    const freq = chord[Math.floor(Math.random() * chord.length)] * (Math.random() < 0.35 ? 2 : 1);
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 2.8);

    gain.gain.setValueAtTime(0.0005, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 3.4);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = 0.18;

    osc.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusic);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.5);
    osc2.stop(now + 3.5);
  }

  public playStationChime(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    // Nostalgic Japanese station departure/arrival chime (pentatonic chime)
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99];
    notes.forEach((f, idx) => {
      if (!this.ctx || !this.masterSfx) return;
      const t = now + idx * 0.22;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.075, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.9);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  /**
   * Procedurally synthesizes a region-specific station platform PA announcement:
   * 1) Signature regional hassha melody chime
   * 2) Soft vintage platform loudspeaker cadence (bandpass-filtered formant syllables + slapback echo)
   */
  public playStationAnnouncement(announcement: StationAnnouncement): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = announcement.chimeNotes;
    const step = announcement.chimeTempoSec;
    for (let i = 0; i < notes.length; i++) {
      const t = now + i * step;
      const osc = ctx.createOscillator();
      const harm = ctx.createOscillator();
      const gain = ctx.createGain();
      const hGain = ctx.createGain();
      osc.type = announcement.chimeWave;
      harm.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], t);
      harm.frequency.setValueAtTime(notes[i] * 2, t);
      hGain.gain.value = 0.22;

      gain.gain.setValueAtTime(0.0008, t);
      gain.gain.linearRampToValueAtTime(0.072, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0007, t + 0.88);

      osc.connect(gain);
      harm.connect(hGain);
      hGain.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      harm.start(t);
      osc.stop(t + 0.92);
      harm.stop(t + 0.92);
    }

    const paStart = now + notes.length * step + 0.26;
    const paBus = ctx.createBiquadFilter();
    paBus.type = 'bandpass';
    paBus.frequency.value = 1180;
    paBus.Q.value = 1.4;

    const paMaster = ctx.createGain();
    paMaster.gain.value = 0.042;
    paBus.connect(paMaster);
    paMaster.connect(this.masterSfx);

    const echoDelay = ctx.createDelay(0.3);
    echoDelay.delayTime.value = 0.125;
    const echoGain = ctx.createGain();
    echoGain.gain.value = 0.34;
    paMaster.connect(echoDelay);
    echoDelay.connect(echoGain);
    echoGain.connect(this.masterSfx);

    const syllables = Math.min(10, Math.max(5, Math.round(announcement.syllableCount * 0.65)));
    let cursor = paStart;
    for (let s = 0; s < syllables; s++) {
      const isPause = s === Math.floor(syllables / 2);
      if (isPause) cursor += 0.11;
      const dur = 0.095 + ((s * 37) % 5) * 0.014;
      const intonation = 1 + Math.sin((s / syllables) * Math.PI) * 0.14 - (s === syllables - 1 ? 0.16 : 0);
      const pitch = announcement.voicePitchHz * intonation;

      const vOsc = ctx.createOscillator();
      vOsc.type = 'sawtooth';
      vOsc.frequency.setValueAtTime(pitch, cursor);
      vOsc.frequency.linearRampToValueAtTime(pitch * (s % 2 === 0 ? 1.05 : 0.94), cursor + dur);

      const vowelFilter = ctx.createBiquadFilter();
      vowelFilter.type = 'bandpass';
      vowelFilter.frequency.setValueAtTime(620 + ((s * 211) % 720), cursor);
      vowelFilter.Q.value = 3.6;

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.0006, cursor);
      sGain.gain.linearRampToValueAtTime(0.65, cursor + 0.018);
      sGain.gain.exponentialRampToValueAtTime(0.0008, cursor + dur);

      vOsc.connect(vowelFilter);
      vowelFilter.connect(sGain);
      sGain.connect(paBus);
      vOsc.start(cursor);
      vOsc.stop(cursor + dur + 0.02);

      cursor += dur + 0.042;
    }
  }

  /**
   * Procedurally synthesizes a region-specific station platform PA announcement:
   * 1) Signature regional hassha melody chime
   * 2) Soft vintage platform loudspeaker cadence (bandpass-filtered formant syllables + slapback echo)
   */
  public playStationAnnouncement(announcement: StationAnnouncement): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // 1. Region-specific melodic chime
    const notes = announcement.chimeNotes;
    const step = announcement.chimeTempoSec;
    for (let i = 0; i < notes.length; i++) {
      const t = now + i * step;
      const osc = ctx.createOscillator();
      const harm = ctx.createOscillator();
      const gain = ctx.createGain();
      const hGain = ctx.createGain();
      osc.type = announcement.chimeWave;
      harm.type = 'sine';
      osc.frequency.setValueAtTime(notes[i], t);
      harm.frequency.setValueAtTime(notes[i] * 2, t);
      hGain.gain.value = 0.22;

      gain.gain.setValueAtTime(0.0008, t);
      gain.gain.linearRampToValueAtTime(0.072, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0007, t + 0.88);

      osc.connect(gain);
      harm.connect(hGain);
      hGain.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      harm.start(t);
      osc.stop(t + 0.92);
      harm.stop(t + 0.92);
    }

    // 2. Vintage station PA horn speaker vocal cadence (gentle, musical, zero jarring buzz)
    const paStart = now + notes.length * step + 0.26;
    const paBus = ctx.createBiquadFilter();
    paBus.type = 'bandpass';
    paBus.frequency.value = 1180;
    paBus.Q.value = 1.4;

    const paMaster = ctx.createGain();
    paMaster.gain.value = 0.042;
    paBus.connect(paMaster);
    paMaster.connect(this.masterSfx);

    // Subtle open-air platform slapback echo (125ms)
    const echoDelay = ctx.createDelay(0.3);
    echoDelay.delayTime.value = 0.125;
    const echoGain = ctx.createGain();
    echoGain.gain.value = 0.34;
    paMaster.connect(echoDelay);
    echoDelay.connect(echoGain);
    echoGain.connect(this.masterSfx);

    const syllables = Math.min(10, Math.max(5, Math.round(announcement.syllableCount * 0.65)));
    let cursor = paStart;
    for (let s = 0; s < syllables; s++) {
      const isPause = s === Math.floor(syllables / 2);
      if (isPause) cursor += 0.11;
      const dur = 0.095 + ((s * 37) % 5) * 0.014;
      const intonation = 1 + Math.sin((s / syllables) * Math.PI) * 0.14 - (s === syllables - 1 ? 0.16 : 0);
      const pitch = announcement.voicePitchHz * intonation;

      const vOsc = ctx.createOscillator();
      vOsc.type = 'sawtooth';
      vOsc.frequency.setValueAtTime(pitch, cursor);
      vOsc.frequency.linearRampToValueAtTime(pitch * (s % 2 === 0 ? 1.05 : 0.94), cursor + dur);

      const vowelFilter = ctx.createBiquadFilter();
      vowelFilter.type = 'bandpass';
      vowelFilter.frequency.setValueAtTime(620 + ((s * 211) % 720), cursor);
      vowelFilter.Q.value = 3.6;

      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.0006, cursor);
      sGain.gain.linearRampToValueAtTime(0.65, cursor + 0.018);
      sGain.gain.exponentialRampToValueAtTime(0.0008, cursor + dur);

      vOsc.connect(vowelFilter);
      vowelFilter.connect(sGain);
      sGain.connect(paBus);
      vOsc.start(cursor);
      vOsc.stop(cursor + dur + 0.02);

      cursor += dur + 0.042;
    }
  }

  public playDistantTrainHorn(proximity = 0.5): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const vol = 0.045 * Math.max(0.2, proximity);
    [293.66, 369.99].forEach((f) => {
      if (!this.ctx || !this.masterSfx) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      filter.type = 'lowpass';
      filter.frequency.value = 640;
      gain.gain.setValueAtTime(0.0005, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.14);
      gain.gain.setValueAtTime(vol, now + 0.65);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.35);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(now);
      osc.stop(now + 1.4);
    });
  }

  public playFootstep(surface: 'wood' | 'grass' | 'gravel' = 'grass', pitchMultiplier = 1.0): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const baseFreq = (surface === 'wood' ? 145 : surface === 'gravel' ? 210 : 95) * pitchMultiplier;
    const isGiant = pitchMultiplier < 0.7;
    osc.type = isGiant ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(Math.max(32, baseFreq * (0.9 + Math.random() * 0.2)), now);
    osc.frequency.exponentialRampToValueAtTime(isGiant ? 26 : 40, now + (isGiant ? 0.16 : 0.065));
    gain.gain.setValueAtTime(isGiant ? 0.095 : 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + (isGiant ? 0.18 : 0.075));
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + (isGiant ? 0.2 : 0.08));
  }

  public playDoorChime(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    [659.25, 523.25].forEach((freq, idx) => {
      if (!this.ctx || !this.masterSfx) return;
      const t = now + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.055, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.35);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  public playTicketIssued(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    [587.33, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx || !this.masterSfx) return;
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.45);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  public playIcelandTransform(growing: boolean): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = growing ? [329.63, 440, 587.33, 880] : [880, 587.33, 440, 329.63];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterSfx) return;
      const t = now + idx * 0.14;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.065, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.85);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  }

  public playShutter(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    [0, 0.055].forEach((offset, idx) => {
      if (!this.ctx || !this.masterSfx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(idx === 0 ? 1100 : 720, now + offset);
      gain.gain.setValueAtTime(0.05, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + 0.035);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(now + offset);
      osc.stop(now + offset + 0.04);
    });
  }

  public playVendingDispense(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    // Soft button beep + can drop clunk
    const beep = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    beep.type = 'sine';
    beep.frequency.setValueAtTime(880, now);
    bGain.gain.setValueAtTime(0.05, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    beep.connect(bGain);
    bGain.connect(this.masterSfx);
    beep.start(now);
    beep.stop(now + 0.1);

    const clunk = this.ctx.createOscillator();
    const cGain = this.ctx.createGain();
    clunk.type = 'triangle';
    clunk.frequency.setValueAtTime(160, now + 0.26);
    clunk.frequency.exponentialRampToValueAtTime(52, now + 0.42);
    cGain.gain.setValueAtTime(0.08, now + 0.26);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    clunk.connect(cGain);
    cGain.connect(this.masterSfx);
    clunk.start(now + 0.26);
    clunk.stop(now + 0.46);
  }

  public playBicycleBell(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    // Classic Japanese commuter bicycle double metallic ring ("chirin-chirin!")
    [0, 0.14].forEach((offset) => {
      if (!this.ctx || !this.masterSfx) return;
      [2180, 3270].forEach((freq, idx) => {
        if (!this.ctx || !this.masterSfx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.065 : 0.025, now + offset + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0006, now + offset + 0.42);
        osc.connect(gain);
        gain.connect(this.masterSfx);
        osc.start(now + offset);
        osc.stop(now + offset + 0.45);
      });
    });
  }

  public playSkatePush(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.08);
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.09);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCampfireIgnite(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.18);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playBoatSplash(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playThunderClap(intensity = 1.0): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || !this.noiseBuf || this.muted) return;
    const now = this.ctx.currentTime;
    const vol = Math.min(0.55, 0.26 * intensity);

    // 1. Sharp initial electric crack
    const crackSrc = this.ctx.createBufferSource();
    crackSrc.buffer = this.noiseBuf;
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(1150, now);
    crackFilter.frequency.exponentialRampToValueAtTime(220, now + 0.35);
    crackFilter.Q.value = 0.8;
    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.001, now);
    crackGain.gain.linearRampToValueAtTime(vol * 0.85, now + 0.02);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    crackSrc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterSfx);
    crackSrc.start(now);
    crackSrc.stop(now + 0.45);

    // 2. Deep rolling sub-bass thunder rumble across the valley
    const rumbleSrc = this.ctx.createBufferSource();
    rumbleSrc.buffer = this.noiseBuf;
    rumbleSrc.loop = true;
    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(195, now + 0.05);
    rumbleFilter.frequency.exponentialRampToValueAtTime(64, now + 2.4);
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(vol, now + 0.14);
    rumbleGain.gain.linearRampToValueAtTime(vol * 0.65, now + 0.9);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.65);
    rumbleSrc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.masterSfx);
    rumbleSrc.start(now);
    rumbleSrc.stop(now + 2.7);
  }

  public playTsunamiRoar(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || !this.noiseBuf || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.linearRampToValueAtTime(480, now + 1.4);
    filter.frequency.exponentialRampToValueAtTime(120, now + 3.8);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfx);
    src.start(now);
    src.stop(now + 4.1);
  }

  public playJump(pitchMultiplier = 1.0): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const base = 190 * Math.max(0.45, pitchMultiplier);
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 2.15, now + 0.13);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playLand(pitchMultiplier = 1.0): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const startFreq = 135 * Math.max(0.38, pitchMultiplier);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.38, now + 0.11);
    const vol = pitchMultiplier < 0.7 ? 0.14 : 0.065;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.13);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playAk47Burst(isDrivingCar = false): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const baseFreq = isDrivingCar ? 245 : 210;
    for (let i = 0; i < 5; i++) {
      const t = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq - i * 16, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.048);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.052);
      osc.connect(gain);
      gain.connect(this.masterSfx);
      osc.start(t);
      osc.stop(t + 0.058);
    }
  }

  public playWallBreakBoom(stage: number): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(102 + stage * 10, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.45);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.5);

    if (this.noiseBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280 + stage * 45, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.001, now);
      nGain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterSfx);
      src.start(now);
      src.stop(now + 0.45);
    }
  }

  public playDinoRoar(): void {
    if (!this.unlocked || !this.ctx || !this.masterSfx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(92, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.85);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.92);
  }

  public dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.noiseBuf = null;
      this.unlocked = false;
    }
  }
}
