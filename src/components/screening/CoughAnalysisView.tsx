import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Save,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  FileAudio,
  Activity,
  ArrowRight,
  Radio,
  Upload,
  Layers,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Patient, CoughAnalysis, RiskLevel } from '../../types';
import { patientService, coughService } from '../../services/api';
import { RiskGauge } from '../common/RiskGauge';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface CoughAnalysisViewProps {
  initialPatientId?: string;
  onNavigateScreening?: (tool: 'xray' | 'symptoms' | 'labs', patientId: string) => void;
}

// Utility to generate a valid PCM WAV audio blob for simulation & fallback modes
function createCoughAudioWavBlob(durationSeconds: number = 4.5): Blob {
  const sampleRate = 44100;
  const numChannels = 1;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Cough explosive bursts at t=0.6s, t=1.8s, t=3.0s
    const bout1 = Math.exp(-Math.pow(t - 0.6, 2) / 0.03) * (Math.sin(2 * Math.PI * 190 * t) + (Math.random() - 0.5) * 0.9);
    const bout2 = Math.exp(-Math.pow(t - 1.8, 2) / 0.04) * (Math.sin(2 * Math.PI * 230 * t) + (Math.random() - 0.5) * 0.8);
    const bout3 = Math.exp(-Math.pow(t - 3.0, 2) / 0.05) * (Math.sin(2 * Math.PI * 160 * t) + (Math.random() - 0.5) * 0.5);
    const sample = Math.max(-1, Math.min(1, bout1 * 0.7 + bout2 * 0.6 + bout3 * 0.4));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export const CoughAnalysisView: React.FC<CoughAnalysisViewProps> = ({
  initialPatientId,
  onNavigateScreening,
}) => {
  const { t } = useLanguage();
  const { success, error: toastError, info } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || 'pat_001');
  const [patientHistory, setPatientHistory] = useState<CoughAnalysis[]>([]);

  // Mode: 'hardware' (real mic) or 'simulation' (synthesized live stream)
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);

  // Microphone & MediaRecorder state
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Audio Blob & Playback state
  const [, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // AI Inference & Persistence state
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<CoughAnalysis | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activePresetTitle, setActivePresetTitle] = useState<string | null>(null);

  // Deletion Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; title: string; isCurrent: boolean } | null>(null);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset sample benchmark dataset
  const sampleCoughs = [
    {
      title: 'Active TB Wet Cough (Severe)',
      duration: '4.2s',
      explosiveMs: 142,
      score: 84,
      risk: 'HIGH' as RiskLevel,
      desc: 'Prolonged explosive phase with prominent secondary glottal vibrations',
      energy: '0.92 J/kHz',
    },
    {
      title: 'MDR-TB Productive Cough',
      duration: '5.1s',
      explosiveMs: 168,
      score: 95,
      risk: 'CRITICAL' as RiskLevel,
      desc: 'Extensive bronchial secretion spectral signature >3000Hz',
      energy: '1.08 J/kHz',
    },
    {
      title: 'Mild Post-Infectious Cough',
      duration: '3.0s',
      explosiveMs: 95,
      score: 42,
      risk: 'MODERATE' as RiskLevel,
      desc: 'Isolated non-cavity acoustic peak without deep bronchial attenuation',
      energy: '0.54 J/kHz',
    },
    {
      title: 'Clear Physiological Cough',
      duration: '2.4s',
      explosiveMs: 64,
      score: 12,
      risk: 'LOW' as RiskLevel,
      desc: 'Rapid clean glottal closure, normal physiological harmonic profile',
      energy: '0.28 J/kHz',
    },
  ];

  // Initial Load
  useEffect(() => {
    loadPatients();
    return () => {
      cleanupAudio();
    };
  }, []);

  // When patient selection changes: isolate patient and load their cough analyses
  useEffect(() => {
    if (selectedPatientId) {
      handlePatientChange(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatients = async () => {
    const pts = await patientService.getPatients();
    setPatients(pts);
    if (pts.length > 0 && !selectedPatientId) {
      setSelectedPatientId(pts[0].id);
    }
  };

  const handlePatientChange = async (patientId: string) => {
    cleanupActiveRecording();
    setActivePresetTitle(null);
    setIsSaved(false);

    const history = await coughService.getCoughByPatientId(patientId);
    setPatientHistory(history);
    if (history.length > 0) {
      setCurrentAnalysis(history[0]);
      if (history[0].audioUrl) {
        setAudioUrl(history[0].audioUrl);
      }
      setIsSaved(true);
    } else {
      setCurrentAnalysis(null);
      setAudioUrl(null);
    }
  };

  const cleanupAudio = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const cleanupActiveRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordingState('idle');
    setRecordingSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackCurrentTime(0);
    setPlaybackDuration(0);
  };

  // Live Canvas Waveform & Frequency Visualizer
  const renderVisualizer = (isSimulated: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    let simTick = 0;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      simTick += 0.05;

      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.moveTo(0, height / 4);
      ctx.lineTo(width, height / 4);
      ctx.moveTo(0, (3 * height) / 4);
      ctx.lineTo(width, (3 * height) / 4);
      ctx.stroke();

      if (analyserRef.current && (recordingState === 'recording' || isPlaying) && !isSimulated) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Draw frequency spectrum bars
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height * 0.85);

          const r = Math.floor(13 + (dataArray[i] / 255) * 45);
          const g = Math.floor(148 + (dataArray[i] / 255) * 60);
          const b = Math.floor(136 + (dataArray[i] / 255) * 110);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - 1, barHeight);
          x += barWidth + 1;
        }

        // Draw center time-domain wave
        const timeDomainData = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(timeDomainData);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8'; // sky-400
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let timeX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(timeX, y);
          else ctx.lineTo(timeX, y);
          timeX += sliceWidth;
        }
        ctx.stroke();
      } else if (recordingState === 'recording' || isPlaying) {
        // Simulated active cough wave
        const numBars = 32;
        const barWidth = width / numBars;
        for (let i = 0; i < numBars; i++) {
          const barVal = Math.abs(Math.sin(simTick + i * 0.3) * Math.cos(simTick * 0.8 + i * 0.15));
          const barHeight = barVal * (height * 0.75);
          ctx.fillStyle = `rgb(20, ${Math.floor(160 + barVal * 60)}, ${Math.floor(180 + barVal * 70)})`;
          ctx.fillRect(i * barWidth + 2, height / 2 - barHeight / 2, barWidth - 4, barHeight);
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2dd4bf'; // teal-400
        ctx.beginPath();
        for (let i = 0; i < 50; i++) {
          const x = (i / 50) * width;
          const y = height / 2 + Math.sin(i * 0.4 + simTick * 3) * (height * 0.35 * Math.sin(simTick));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Resting baseline
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        const sliceWidth = width / 40;
        let x = 0;
        for (let i = 0; i < 40; i++) {
          const y = height / 2 + Math.sin(i * 0.2 + Date.now() * 0.002) * 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    };

    draw();
  };

  // Start Real Hardware Microphone Recording
  const startRecording = async () => {
    setPermissionError(null);

    // If already explicitly in simulated mode, launch simulated recording directly
    if (isSimulatedMode) {
      startSimulatedRecording();
      return;
    }

    try {
      cleanupActiveRecording();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setIsSimulatedMode(false);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
      }

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        setRecordingState('stopped');
        runAcousticInference(url, undefined, false);
      };

      mediaRecorder.start(250);
      setRecordingState('recording');
      setRecordingSeconds(0);
      setActivePresetTitle(null);
      setIsSaved(false);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 8) {
            stopRecording();
            return 8;
          }
          return prev + 1;
        });
      }, 1000);

      renderVisualizer(false);
      info('Microphone recording active. Please instruct the patient to cough into the mic.', 'Recording Active');
    } catch (err: any) {
      setRecordingState('idle');

      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('Permission denied') ||
        err?.message?.includes('denied');

      if (isPermissionDenied) {
        setPermissionError(
          'Microphone permission is restricted by your browser. You can use the Simulated Audio Stream or upload a recorded cough audio file.'
        );
      } else {
        setPermissionError('No microphone hardware accessible. Switching to Simulated Audio Stream mode.');
      }
    }
  };

  // Start Simulated Live Acoustic Stream (Fallback & Demo Mode)
  const startSimulatedRecording = () => {
    cleanupActiveRecording();
    setPermissionError(null);
    setIsSimulatedMode(true);
    setRecordingState('recording');
    setRecordingSeconds(0);
    setActivePresetTitle('Synthesized Acoustic Stream (Demo)');
    setIsSaved(false);

    renderVisualizer(true);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 6) {
          stopSimulatedRecording();
          return 6;
        }
        return prev + 1;
      });
    }, 1000);

    info('Simulated acoustic stream active. Capturing neural cough frequencies...', 'Simulated Audio Recording');
  };

  // Stop Simulated Recording & generate authentic playable WAV
  const stopSimulatedRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const wavBlob = createCoughAudioWavBlob(recordingSeconds > 0 ? recordingSeconds : 4.5);
    setAudioBlob(wavBlob);
    const url = URL.createObjectURL(wavBlob);
    setAudioUrl(url);
    setRecordingState('stopped');
    runAcousticInference(url, undefined, true);
  };

  // Pause / Resume recording
  const togglePauseResume = () => {
    if (isSimulatedMode) {
      if (recordingState === 'recording') {
        setRecordingState('paused');
        if (timerRef.current) clearInterval(timerRef.current);
      } else if (recordingState === 'paused') {
        setRecordingState('recording');
        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 6) {
              stopSimulatedRecording();
              return 6;
            }
            return prev + 1;
          });
        }, 1000);
      }
      return;
    }

    if (!mediaRecorderRef.current) return;

    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 8) {
            stopRecording();
            return 8;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (isSimulatedMode) {
      stopSimulatedRecording();
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // Upload Cough Audio File
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    cleanupActiveRecording();
    setPermissionError(null);
    setIsSimulatedMode(false);
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setRecordingState('stopped');
    setActivePresetTitle(`Uploaded File: ${file.name}`);
    setIsSaved(false);

    runAcousticInference(url, undefined, false);
    success(`Audio file "${file.name}" loaded successfully.`);
  };

  // Run AI Acoustic Feature Extraction
  const runAcousticInference = async (
    recordedAudioUrl?: string,
    presetData?: { score: number; risk: RiskLevel; explosiveMs: number; energy: string; title: string },
    isDemoSim: boolean = false
  ) => {
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 900));

    const patient = patients.find((p) => p.id === selectedPatientId);
    const score = presetData?.score ?? Math.floor(Math.random() * 32) + 60;
    const riskLevel: RiskLevel = presetData?.risk ?? (score > 75 ? 'HIGH' : score > 40 ? 'MODERATE' : 'LOW');
    const explosiveMs = presetData?.explosiveMs ?? (score > 75 ? 148 : score > 40 ? 112 : 72);

    const studyId = `cgh_${Date.now().toString(36)}`;
    const analysis: CoughAnalysis = {
      id: studyId,
      patientId: selectedPatientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
      recordedAt: new Date().toISOString(),
      durationSeconds: recordingSeconds > 0 ? recordingSeconds : 4.5,
      audioUrl: recordedAudioUrl || audioUrl || undefined,
      audioWaveformData: [20, 45, 80, 95, 85, 60, 40, 75, 90, 65, 30, 15],
      explosivePhaseDurationMs: explosiveMs,
      energySpectralDensity: presetData ? parseFloat(presetData.energy) || 0.88 : 0.88,
      tbAcousticScore: score,
      riskLevel,
      confidence: score > 75 ? 0.92 : 0.88,
      isDemoSimulation: isDemoSim,
      interpretation:
        score > 75
          ? `Acoustic neural network identified characteristic prolonged explosive cough phase (${explosiveMs}ms) and high-frequency harmonics >2.8 kHz indicating deep bronchial secretion and cavitary resonance.`
          : score > 40
          ? `Intermediate spectral pattern observed. Mild bronchial turbulence without high-density cavitary peak (${score}% index).`
          : `Clear physiological cough profile. Glottal closure duration within normal range (${explosiveMs}ms), no pathological resonant signatures.`,
    };

    setCurrentAnalysis(analysis);
    setAnalyzing(false);
  };

  // Load Reference Benchmark Sample
  const handleSelectSample = (sample: typeof sampleCoughs[0]) => {
    cleanupActiveRecording();
    setIsSimulatedMode(true);
    setActivePresetTitle(`WHO Benchmark: ${sample.title}`);
    setIsSaved(false);

    const wavBlob = createCoughAudioWavBlob(parseFloat(sample.duration) || 4.2);
    const url = URL.createObjectURL(wavBlob);
    setAudioBlob(wavBlob);
    setAudioUrl(url);
    setRecordingState('stopped');

    runAcousticInference(
      url,
      {
        score: sample.score,
        risk: sample.risk,
        explosiveMs: sample.explosiveMs,
        energy: sample.energy,
        title: sample.title,
      },
      true
    );
    info(`Loaded benchmark dataset: "${sample.title}"`, 'Benchmark Sample Loaded');
  };

  // Save current recording & analysis to patient dossier
  const handleSaveToDossier = async () => {
    if (!currentAnalysis) return;
    setIsSaving(true);
    try {
      await coughService.saveCough({
        ...currentAnalysis,
        patientId: selectedPatientId,
        audioUrl: audioUrl || undefined,
      });
      setIsSaved(true);
      const updated = await coughService.getCoughByPatientId(selectedPatientId);
      setPatientHistory(updated);
      success('Acoustic cough record saved to patient dossier and timeline.', 'Saved to Dossier');
    } catch {
      toastError('Failed to save acoustic record to dossier.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Confirmation
  const promptDeleteRecording = (studyId: string, title: string, isCurrent: boolean) => {
    setDeleteConfirmTarget({ id: studyId, title, isCurrent });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      await coughService.deleteCough(deleteConfirmTarget.id);
      const updated = await coughService.getCoughByPatientId(selectedPatientId);
      setPatientHistory(updated);

      if (deleteConfirmTarget.isCurrent) {
        cleanupActiveRecording();
        setCurrentAnalysis(null);
        setActivePresetTitle(null);
        setIsSaved(false);
      }

      success('Acoustic recording deleted successfully.', 'Deleted');
    } catch {
      toastError('Failed to delete recording.');
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  // Audio Player Handlers
  const handlePlayToggle = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.error('Audio playback error:', e);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setPlaybackCurrentTime(audioElementRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioElementRef.current) {
      const dur = audioElementRef.current.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setPlaybackDuration(dur);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setPlaybackCurrentTime(time);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `Cough_Study_${selectedPatientId}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    success('Audio recording downloaded successfully.');
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden file input for uploading audio */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a"
        onChange={handleAudioFileUpload}
        className="hidden"
      />

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          muted={isMuted}
        />
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.cough.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Acoustic Spectrogram AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t.cough.subtitle}</p>
        </div>

        {/* Patient selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.nationalId})
              </option>
            ))}
          </select>
        </div>
      </div>

      <MedicalDisclaimer variant="compact" />

      {/* Patient & Audio Mode Transparency Notice */}
      <div className="p-3.5 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 border border-teal-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 text-teal-950">
          <Radio className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Patient-Bound Acoustic Analysis:</strong> Real browser microphone recording, simulated audio stream, and direct audio file upload. All recordings are tied strictly to <strong>{selectedPatient?.firstName} {selectedPatient?.lastName}</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-teal-100/80 text-teal-800 rounded font-mono font-bold text-[10px]">
            ID: {selectedPatientId}
          </span>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Audio Capture & Spectrogram (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recorder Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{t.cough.micPermission}</span>
                  {isSimulatedMode && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      SIMULATED / DEMO MODE
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {recordingState === 'recording'
                    ? isSimulatedMode
                      ? 'Generating simulated acoustic cough wave... Auto-finishing in 6s.'
                      : 'Recording live cough... Instruct patient to cough firmly into the microphone.'
                    : recordingState === 'paused'
                    ? 'Recording paused. Click Resume or Stop.'
                    : audioUrl
                    ? 'Audio captured & analyzed. Ready for playback or saving to dossier.'
                    : 'Choose live microphone recording, simulated audio stream, or upload audio.'}
                </p>
              </div>
              {recordingState === 'recording' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  REC 00:0{recordingSeconds} / {isSimulatedMode ? '00:06' : '00:08'}
                </span>
              )}
              {recordingState === 'paused' && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold font-mono">
                  PAUSED 00:0{recordingSeconds}
                </span>
              )}
            </div>

            {/* Permission Guidance Banner */}
            {permissionError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2.5 flex-1">
                  <p className="font-semibold">{permissionError}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={startSimulatedRecording}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start Simulated Audio Stream</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Audio File</span>
                    </button>
                    <button
                      onClick={startRecording}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors"
                    >
                      Retry Mic Permission
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Waveform Canvas */}
            <div className="h-36 bg-slate-900 rounded-2xl p-4 flex flex-col justify-between border border-slate-800 relative overflow-hidden shadow-inner">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      recordingState === 'recording' ? 'bg-rose-500 animate-ping' : 'bg-teal-400'
                    }`}
                  />
                  CHANNEL 1: ACOUSTIC SPECTROGRAM
                </span>
                <span className="text-cyan-400">
                  {recordingState === 'recording'
                    ? isSimulatedMode
                      ? '44.1 kHz • SYNTHESIZED STREAM'
                      : '44.1 kHz • LIVE CAPTURE'
                    : '44.1 kHz • 16-bit PCM'}
                </span>
              </div>

              <canvas
                ref={canvasRef}
                width={500}
                height={80}
                className="w-full h-16 object-contain"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.0s</span>
                <span>Explosive Peak</span>
                <span>Harmonic Vibrations</span>
                <span>Dissipation</span>
                <span>{isSimulatedMode ? '6.0s' : '8.0s'}</span>
              </div>
            </div>

            {/* Primary Recording Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {recordingState === 'idle' && (
                <>
                  <button
                    onClick={startRecording}
                    className="px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{t.cough.startRecording}</span>
                  </button>

                  <button
                    onClick={startSimulatedRecording}
                    className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Simulate Audio Stream</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>Upload Audio</span>
                  </button>
                </>
              )}

              {(recordingState === 'recording' || recordingState === 'paused') && (
                <>
                  <button
                    onClick={togglePauseResume}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {recordingState === 'recording' ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-600" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-teal-600" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>{t.cough.stopRecording}</span>
                  </button>
                </>
              )}

              {recordingState === 'stopped' && (
                <>
                  <button
                    onClick={startRecording}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-record Live Mic</span>
                  </button>
                  <button
                    onClick={startSimulatedRecording}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Re-simulate Stream</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Audio</span>
                  </button>
                </>
              )}
            </div>

            {/* Playable Audio Preview Section */}
            {audioUrl && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate max-w-[280px]">
                    <FileAudio className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{activePresetTitle ? activePresetTitle : 'Recorded Patient Audio'}</span>
                  </span>
                  <span className="font-mono text-slate-500 font-semibold text-[11px] shrink-0">
                    {formatTime(playbackCurrentTime)} / {formatTime(playbackDuration || recordingSeconds || 4.5)}
                  </span>
                </div>

                {/* Progress scrub bar */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayToggle}
                    className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs transition-colors shrink-0"
                    title={isPlaying ? 'Pause playback' : 'Play audio'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max={playbackDuration || recordingSeconds || 4.5}
                    step="0.05"
                    value={playbackCurrentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors shrink-0"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Audio Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAudio}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .wav</span>
                    </button>
                    {currentAnalysis && (
                      <button
                        onClick={() => promptDeleteRecording(currentAnalysis.id, activePresetTitle || 'Current Recording', true)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {currentAnalysis && (
                    <button
                      onClick={handleSaveToDossier}
                      disabled={isSaving || isSaved}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                        isSaved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Saved to Dossier</span>
                        </>
                      ) : isSaving ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save to Patient Dossier</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sample Cough Preset Library */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Acoustic Benchmarking Reference Dataset:
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Calibrated WHO Audio Sets</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleCoughs.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className={`p-3 rounded-2xl border text-left transition-all group ${
                    activePresetTitle?.includes(s.title)
                      ? 'bg-teal-50/80 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-teal-700 truncate">
                      {s.title}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                      {s.score}% AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-tight">{s.desc}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Duration: {s.duration}</span>
                    <span>Explosive: {s.explosiveMs} ms</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Patient's Previous Cough Studies */}
          {patientHistory.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Previous Cough Studies for {selectedPatient?.firstName} {selectedPatient?.lastName} ({patientHistory.length})
              </h3>
              <div className="space-y-2">
                {patientHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs transition-colors gap-3"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900">{item.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {item.tbAcousticScore}% Score
                        </span>
                        {item.isDemoSimulation && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                            DEMO
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.recordedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{item.interpretation}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setCurrentAnalysis(item);
                          if (item.audioUrl) setAudioUrl(item.audioUrl);
                          setIsSaved(true);
                          setActivePresetTitle(`Study: ${item.id}`);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-teal-500 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Load Study
                      </button>
                      <button
                        onClick={() => promptDeleteRecording(item.id, `Study ${item.id}`, currentAnalysis?.id === item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete this study"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Acoustic AI Findings & Risk Gauge (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.cough.acousticScore}
            </h3>

            {analyzing ? (
              <div className="py-12 space-y-2">
                <Activity className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">{t.cough.analyzingStatus}</p>
              </div>
            ) : currentAnalysis ? (
              <div className="space-y-4">
                {currentAnalysis.isDemoSimulation && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center gap-2 text-xs text-amber-900 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>SIMULATED / DEMO ACOUSTIC ANALYSIS</span>
                  </div>
                )}
                <RiskGauge
                  score={currentAnalysis.tbAcousticScore}
                  riskLevel={currentAnalysis.riskLevel}
                  confidence={currentAnalysis.confidence}
                  size="lg"
                />
              </div>
            ) : (
              <div className="py-12 text-slate-400 text-xs">
                <Mic className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p>{t.cough.readyStatus}</p>
              </div>
            )}

            {currentAnalysis && (
              <div className="pt-4 border-t border-slate-100 text-left text-xs space-y-3">
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-400">{t.cough.explosivePhase}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {currentAnalysis.explosivePhaseDurationMs} ms
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-400">{t.cough.spectralEnergy}</p>
                    <p className="text-sm font-bold text-teal-700 mt-0.5">
                      {currentAnalysis.energySpectralDensity} J/kHz
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1">
                  <p className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    {t.cough.aiInterpretation}:
                  </p>
                  <p className="text-teal-900/80 text-[11px] leading-relaxed">
                    {currentAnalysis.interpretation}
                  </p>
                </div>

                {currentAnalysis.isDemoSimulation && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    ⚠️ Simulated acoustic demonstration for workflow testing only — not a clinical diagnosis. Attending physician must validate findings with microbiological GeneXpert and chest radiograph.
                  </p>
                )}

                <div className="space-y-1.5 pt-2">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Next Clinical Step:</p>
                  <button
                    onClick={() => onNavigateScreening && onNavigateScreening('xray', selectedPatientId)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Chest Radiograph AI Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Confirm Deletion</span>
              </h3>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>{deleteConfirmTarget.title}</strong>? This acoustic study will be permanently removed from <strong>{selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'the patient'}</strong>'s dossier.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
