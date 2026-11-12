/**
 * Web Audio API synthesized sound generator for Slap Legends.
 * 100% self-contained, zero external network audio files, zero latency.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Lazily init AudioContext on first user interaction
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Button click
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Windup swing whoosh
  public playWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Noise buffer for air whoosh
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.25);
    filter.Q.value = 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.25);
  }

  // The meat & chalk slap hit
  public playSlap(rating: 'MISS' | 'WEAK' | 'SOLID' | 'HARD' | 'CRITICAL', isSuper = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (rating === 'MISS') {
      // Just a grazed brush
      this.playWhoosh();
      return;
    }

    // 1. Transient sharp clap (skin on skin)
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    const clapSource = ctx.createBufferSource();
    clapSource.buffer = buffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(800, now);

    const clapGain = ctx.createGain();
    const clapVol = rating === 'CRITICAL' ? 0.65 : rating === 'HARD' ? 0.45 : 0.25;
    clapGain.gain.setValueAtTime(clapVol, now);
    clapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    clapSource.connect(highpass);
    highpass.connect(clapGain);
    clapGain.connect(ctx.destination);
    clapSource.start(now);

    // 2. Heavy Sub Bass Thud for impact
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = rating === 'CRITICAL' ? 'triangle' : 'sine';
    
    const startFreq = rating === 'CRITICAL' ? 180 : rating === 'HARD' ? 150 : 120;
    const endFreq = rating === 'CRITICAL' ? 35 : 45;
    const duration = rating === 'CRITICAL' ? 0.45 : 0.25;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    const thudVol = rating === 'CRITICAL' ? 0.9 : rating === 'HARD' ? 0.6 : 0.35;
    oscGain.gain.setValueAtTime(thudVol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);

    // 3. If CRITICAL, add chalk blast and crowd roar
    if (rating === 'CRITICAL' || isSuper) {
      setTimeout(() => this.playCrowdCheer(true), 120);
    } else if (rating === 'HARD') {
      setTimeout(() => this.playCrowdCheer(false), 150);
    }
  }

  // Crowd gasp / roar
  public playCrowdCheer(isHuge: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = isHuge ? 1.4 : 0.8;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isHuge ? 650 : 500, now);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(isHuge ? 0.35 : 0.18, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + dur);
  }

  // Boxing bell
  public playBell() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [1200, 2400, 3600];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      
      const vol = 0.25 / (idx + 1);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  // KO Gong
  public playKOGong() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(82, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.8);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  // Special ability charge / activation sound
  public playSpecialCharge() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}

export const sounds = new SoundSystem();
